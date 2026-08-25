import {
  afterNextRender,
  booleanAttribute,
  Component,
  computed,
  effect,
  ElementRef,
  forwardRef,
  inject,
  input,
  output,
  SecurityContext,
  signal,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { DomSanitizer } from '@angular/platform-browser';
import { BaseFormField } from '@4sh/ui-kit/forms';
import { UiField } from '@4sh/ui-kit/forms/ui-field';
import { UiButton } from '@4sh/ui-kit/actions/ui-button';
import {
  applyBlockFormat,
  applyCommand,
  applyFontFamily,
  applyFontSize,
  applyLink,
  convertFontMarkers,
  convertSizeMarkers,
  DEFAULT_EDITOR_TOOLS,
  EDITOR_BLOCKS,
  EDITOR_FONTS,
  EDITOR_SELECT_TOOLS,
  EDITOR_SIZES,
  EDITOR_TOOL_META,
  EditorBlock,
  EditorButtonTool,
  EditorFont,
  EditorSelectTool,
  EditorSize,
  EditorState,
  EditorTool,
  emptyEditorState,
  htmlToText,
  insertHtml,
  insertText,
  isEmptyHtml,
  normalizeHtml,
  readBlockFormat,
  readEditorState,
  readFontFamily,
  readFontSize,
  removeLink,
  resolveFontLabel,
  scrubInPlace,
  toggleCodeBlock,
} from './ui-editor-commands';

/** Where the toolbar sits relative to the editing area. */
export type EditorToolbarPosition = 'top' | 'bottom';

/** Keyboard shortcut → tool (the browser applies these natively; we mirror the state). */
const SHORTCUTS: Record<string, EditorTool> = { b: 'bold', i: 'italic', u: 'underline' };

/**
 * ui-editor — headless rich-text field, built on the `ui-field` shell (label +
 * box + helper) in **multiline** mode + a `contenteditable` area and its toolbar.
 *
 * Zero third-party engine: the formatting commands live in `ui-editor-commands`,
 * the single place that touches the legacy editing API. The value is an HTML
 * string, sanitised on the way in (`DomSanitizer`) and normalised to a small tag
 * whitelist on paste.
 *
 * Standalone, `[(ngModel)]` or reactive forms (ControlValueAccessor via BaseFormField).
 */
@Component({
  selector: 'ui-editor',
  imports: [UiField, UiButton, NgTemplateOutlet],
  templateUrl: './ui-editor.html',
  styleUrl: './ui-editor.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiEditor), multi: true }],
})
export class UiEditor extends BaseFormField<string> {
  /**
   * Tools shown in the toolbar, in order (`separator` draws a divider).
   *
   * An empty or absent list falls back to the default set: a template binding an
   * optional variable (`[tools]="tools"`) hands us `undefined`, which would
   * otherwise leave the editor without any formatting at all.
   */
  tools = input(DEFAULT_EDITOR_TOOLS, {
    transform: (value: readonly EditorTool[] | null | undefined) =>
      value?.length ? value : DEFAULT_EDITOR_TOOLS,
  });
  /** Hint shown while the editor is empty (no native placeholder on contenteditable). */
  placeholder = input<string>();
  /** Minimum height of the editing area, in lines of text. */
  minRows = input<number>(4);
  /** Maximum number of **text** characters (markup is not counted). */
  maxlength = input<number>();
  /** Shows a character counter under the field (`count` or `count / maxlength`). */
  showCount = input(false, { transform: booleanAttribute });
  /** Toolbar placement relative to the editing area. */
  toolbarPosition = input<EditorToolbarPosition>('top');

  /** Emitted on each edit with the new HTML value. */
  valueChange = output<string>();
  /** Emitted when the editing area receives focus. */
  editorFocus = output<FocusEvent>();
  /** Emitted when the editing area loses focus. */
  editorBlur = output<FocusEvent>();
  /** Emitted when the formatting under the caret changes. */
  selectionChange = output<EditorState>();

  /** @ignore */
  private readonly sanitizer = inject(DomSanitizer);
  /** @ignore */
  private readonly contentEl = viewChild<ElementRef<HTMLElement>>('contentEl');
  /** @ignore The rendered toolbar — holds the roving tabindex ring, in DOM order. */
  private readonly toolbarEl = viewChild<ElementRef<HTMLElement>>('toolbarEl');

  /**
   * @ignore Last HTML this component wrote out.
   *
   * The editing area owns its own DOM while the user types, so the value cannot be
   * bound with `[innerHTML]`: re-rendering it on every keystroke would collapse the
   * caret. Instead the DOM is only rewritten when the incoming value differs from
   * what we last emitted — i.e. when a form writes to us.
   */
  private lastEmitted = '';

  /** @ignore Formatting active at the caret. */
  protected readonly state = signal<EditorState>(emptyEditorState());
  /** @ignore Type family at the caret (`null` = the default family). */
  protected readonly currentFont = signal<EditorFont | null>(null);
  /** @ignore Text size at the caret (`null` = the default size). */
  protected readonly currentSize = signal<EditorSize | null>(null);
  /** @ignore Block level at the caret (`null` = neither a paragraph nor a heading). */
  protected readonly currentBlock = signal<EditorBlock | null>(null);
  /** @ignore Index of the toolbar button reachable with Tab (roving tabindex). */
  protected readonly activeTool = signal(0);

  /**
   * @ignore Last selection seen inside the editing area.
   *
   * The buttons cancel their own mousedown and never take the focus, but opening
   * the font dropdown does — and a `contenteditable` loses its selection with it.
   * The range is therefore kept here and restored before the command runs.
   */
  private savedRange: Range | null = null;

  /** @ignore Sanitised value — never inject `modelValue` into the DOM raw. */
  private readonly safeValue = computed(
    () => this.sanitizer.sanitize(SecurityContext.HTML, this.modelValue() ?? '') ?? '',
  );

  /** @ignore Plain-text length, what `maxlength` and the counter measure. */
  protected readonly charCount = computed(() => htmlToText(this.safeValue()).length);
  /** @ignore Keeps a floating label raised once focus leaves. */
  protected readonly isFilled = computed(() => this.charCount() > 0);
  /** @ignore Over the maxlength (only reachable programmatically). */
  protected readonly overLimit = computed(() => {
    const max = this.maxlength();
    return max != null && this.charCount() > max;
  });
  /** @ignore The placeholder only shows while there is nothing to read. */
  protected readonly showPlaceholder = computed(
    () => !!this.placeholder() && !this.hasFloatLabel() && this.charCount() === 0,
  );
  /** @ignore The area is editable (a read-only editor keeps its caret but not its edits). */
  protected readonly isEditable = computed(() => !this.isDisabled() && !this.readonly());

  /** @ignore Resolved toolbar entries (icon + accessible name + toggle state). */
  protected readonly toolbar = computed(() =>
    this.tools().map((tool, index) => ({
      tool,
      index,
      isSeparator: tool === 'separator',
      select: (EDITOR_SELECT_TOOLS.includes(tool as EditorSelectTool)
        ? tool
        : null) as EditorSelectTool | null,
      buttonTool: (tool === 'separator' || EDITOR_SELECT_TOOLS.includes(tool as EditorSelectTool)
        ? null
        : tool) as EditorButtonTool | null,
      meta:
        tool === 'separator' || EDITOR_SELECT_TOOLS.includes(tool as EditorSelectTool)
          ? null
          : EDITOR_TOOL_META[tool as EditorButtonTool],
    })),
  );
  /** @ignore Block levels offered by the `blockFormat` dropdown. */
  protected readonly blocks = EDITOR_BLOCKS;
  /** @ignore Text sizes offered by the `fontSize` dropdown. */
  protected readonly sizes = EDITOR_SIZES;
  /**
   * @ignore Type families, labelled with the face each token actually resolves to.
   *
   * Read once the view exists, since the value comes from the computed style: a
   * hardcoded "Inter" would lie as soon as a project rebinds the token.
   */
  protected readonly fonts = signal(EDITOR_FONTS.map((f) => ({ ...f })));
  /** @ignore The toolbar has at least one actionable entry. */
  protected readonly hasToolbar = computed(() => this.tools().some((t) => t !== 'separator'));
  /**
   * @ignore Index carrying the toolbar's single tab stop.
   *
   * Falls back to the first actionable tool, so a `tools` list opening on a
   * separator still leaves the toolbar reachable with Tab.
   */
  protected readonly tabStop = computed(() => {
    const actionable = this.toolbar().filter((entry) => !entry.isSeparator);
    if (!actionable.length) return -1;
    const active = this.activeTool();
    return actionable.some((entry) => entry.index === active) ? active : actionable[0].index;
  });

  /** @ignore id of the character counter (for `aria-describedby`). */
  protected readonly countId = computed(() => `${this.resolvedId()}-count`);
  /** @ignore `aria-describedby` combines the message and the counter, whichever are shown. */
  protected readonly describedByIds = computed(() => {
    const ids = [
      this.displayMessage() ? this.messageId() : null,
      this.showCount() ? this.countId() : null,
    ].filter(Boolean);
    return ids.length ? ids.join(' ') : null;
  });

  constructor() {
    super();
    // Label each family with the face its token actually resolves to.
    afterNextRender(() => {
      this.fonts.set(
        EDITOR_FONTS.map((f) => ({ ...f, label: resolveFontLabel(f.cssVar, f.label) })),
      );
    });
    // Sync the DOM when the value comes from outside (form write, reset).
    effect(() => {
      const value = this.safeValue();
      const el = this.contentEl()?.nativeElement;
      if (!el) return;
      // Already on screen, or the value we just read back from the user's own
      // edit: rewriting would collapse the caret mid-keystroke. Comparing the
      // live DOM too covers the case where sanitising reshapes the markup.
      if (el.innerHTML === value || value === this.lastEmitted) return;
      el.innerHTML = value;
      this.lastEmitted = value;
    });
  }

  /** @ignore Auto-generated ids read as `ui-editor-*`. */
  protected override uidPrefix(): string {
    return 'ui-editor';
  }

  /** Focuses the editing area. */
  focus(options?: FocusOptions): void {
    this.contentEl()?.nativeElement.focus(options);
  }

  // --- Editing ----------------------------------------------------------

  /** @ignore Input: single source of the value (view → form). */
  protected onInput(): void {
    const el = this.contentEl()?.nativeElement;
    if (!el) return;
    const html = isEmptyHtml(el.innerHTML) ? '' : el.innerHTML;
    this.lastEmitted = html;
    this.modelValue.set(html);
    this.emitChange(html);
    this.valueChange.emit(html);
    this.refreshState();
  }

  /**
   * @ignore Enforces `maxlength` on the text, not the markup.
   *
   * Deletions and formatting must stay available once the limit is reached, so only
   * the insertion intents are cancelled.
   */
  protected onBeforeInput(event: InputEvent): void {
    const max = this.maxlength();
    if (max == null || !event.inputType.startsWith('insert')) return;
    const selection = document.getSelection();
    const replaced = selection && !selection.isCollapsed ? selection.toString().length : 0;
    const incoming = event.data?.length ?? 1;
    if (this.charCount() - replaced + incoming > max) event.preventDefault();
  }

  /** @ignore Paste is reduced to the editor's own tag whitelist. */
  protected onPaste(event: ClipboardEvent): void {
    if (!this.isEditable()) return;
    event.preventDefault();
    const clipboard = event.clipboardData;
    if (!clipboard) return;
    const html = clipboard.getData('text/html');
    if (html) {
      const safe = this.sanitizer.sanitize(SecurityContext.HTML, normalizeHtml(html)) ?? '';
      insertHtml(safe);
      // `insertHTML` re-decorates what it inserted; strip that back off in place.
      const el = this.contentEl()?.nativeElement;
      if (el) scrubInPlace(el);
    } else {
      insertText(clipboard.getData('text/plain'));
    }
    this.onInput();
  }

  /** @ignore The browser applies Ctrl/Cmd+B/I/U itself; we only mirror the state. */
  protected onContentKeydown(event: KeyboardEvent): void {
    if (!(event.metaKey || event.ctrlKey)) return;
    if (!SHORTCUTS[event.key.toLowerCase()]) return;
    // Let the native shortcut run, then read the resulting formatting back.
    queueMicrotask(() => this.refreshState());
  }

  /** @ignore */
  protected onBlur(event: FocusEvent): void {
    this.emitTouch();
    this.editorBlur.emit(event);
  }

  /** @ignore Recomputes the active formatting and notifies the consumer. */
  protected refreshState(): void {
    this.rememberSelection();
    const anchor = document.getSelection()?.anchorNode ?? null;
    this.currentFont.set(readFontFamily(anchor));
    this.currentSize.set(readFontSize(anchor));
    this.currentBlock.set(readBlockFormat());

    const next = readEditorState();
    const prev = this.state();
    if ((Object.keys(next) as (keyof EditorState)[]).every((k) => next[k] === prev[k])) return;
    this.state.set(next);
    this.selectionChange.emit(next);
  }

  /** @ignore Keeps the caret position around for controls that steal the focus. */
  private rememberSelection(): void {
    const el = this.contentEl()?.nativeElement;
    const selection = document.getSelection();
    if (!el || !selection?.rangeCount) return;
    const range = selection.getRangeAt(0);
    if (el.contains(range.commonAncestorContainer)) this.savedRange = range.cloneRange();
  }

  /** @ignore Puts the remembered caret back before running a command. */
  private restoreSelection(): void {
    this.focus();
    const range = this.savedRange;
    if (!range) return;
    const selection = document.getSelection();
    selection?.removeAllRanges();
    selection?.addRange(range);
  }

  // --- Toolbar ----------------------------------------------------------

  /** @ignore Runs a button tool against the selection the mousedown handler preserved. */
  protected runTool(tool: EditorButtonTool, index: number): void {
    if (!this.isEditable()) return;
    this.activeTool.set(index);
    this.focus();
    if (tool === 'link') this.promptForLink();
    else if (tool === 'codeBlock') toggleCodeBlock();
    else applyCommand(tool);
    this.onInput();
  }

  /**
   * @ignore Applies a dropdown choice to the selection.
   *
   * The dropdown took the focus, so the caret is put back first. The family and
   * size commands emit legacy `<font>` elements, immediately rewritten into a
   * class; the block command writes a real tag and needs no conversion.
   */
  protected onSelectChange(tool: EditorSelectTool, event: Event, index: number): void {
    const value = (event.target as HTMLSelectElement).value;
    this.activeTool.set(index);
    if (!this.isEditable() || !value) return;

    this.restoreSelection();
    const el = this.contentEl()?.nativeElement;

    if (tool === 'blockFormat') {
      applyBlockFormat(value as EditorBlock);
    } else if (tool === 'fontFamily') {
      const choice = this.fonts().find((f) => f.key === value);
      if (!choice) return;
      applyFontFamily();
      if (el) convertFontMarkers(el, choice.className);
    } else {
      const choice = this.sizes.find((s) => s.key === value);
      if (!choice) return;
      applyFontSize();
      if (el) convertSizeMarkers(el, choice.className);
    }

    this.onInput();
  }

  /**
   * @ignore Current value of a dropdown, so it reflects the caret.
   *
   * Family and size fall back to the value actually in force: text carrying no
   * class really is rendered with `--fontfamily-base` at the default size, so
   * naming them states a fact rather than a placeholder.
   *
   * The block level has no such fallback. When the caret sits in something the
   * list does not offer — a code block, a list item — there is no honest value to
   * show, and claiming "Normal" would invite a click that reformats the block.
   */
  protected selectValue(tool: EditorSelectTool): string {
    if (tool === 'blockFormat') return this.currentBlock() ?? '';
    if (tool === 'fontFamily') return this.currentFont() ?? 'base';
    return this.currentSize() ?? 'default';
  }

  /** @ignore Accessible name of a dropdown — spelled out, it is never truncated. */
  protected selectLabel(tool: EditorSelectTool): string {
    if (tool === 'blockFormat') return 'Niveau de texte';
    if (tool === 'fontFamily') return 'Police';
    return 'Taille du texte';
  }

  /**
   * @ignore The dropdown shows no value at all.
   *
   * Only reachable for the block level (see {@link selectValue}). Left blank
   * rather than labelled with the control's own name: the closed state is where
   * the current formatting is read, not where the control introduces itself.
   */
  protected readonly hasNoValue = computed(() => this.currentBlock() === null);

  /**
   * @ignore v1 link flow: the native prompt.
   *
   * Deliberately minimal — a popover with a `ui-input` is the planned replacement,
   * and it changes the component's overlay footprint, not this call site.
   */
  private promptForLink(): void {
    const href = window.prompt('Adresse du lien (laisser vide pour retirer le lien)');
    if (href === null) return;
    if (href.trim() === '') removeLink();
    else applyLink(href.trim());
  }

  /** @ignore Keeps the caret in the editing area when a tool is clicked. */
  protected onToolbarMousedown(event: MouseEvent): void {
    event.preventDefault();
  }

  /** @ignore Roving tabindex: the toolbar is one tab stop, arrows move within it. */
  protected onToolbarKeydown(event: KeyboardEvent): void {
    const indexes = this.toolbar()
      .filter((entry) => !entry.isSeparator)
      .map((entry) => entry.index);
    if (!indexes.length) return;
    const current = Math.max(0, indexes.indexOf(this.tabStop()));

    let next: number | null = null;
    switch (event.key) {
      case 'ArrowRight':
        next = indexes[(current + 1) % indexes.length];
        break;
      case 'ArrowLeft':
        next = indexes[(current - 1 + indexes.length) % indexes.length];
        break;
      case 'Home':
        next = indexes[0];
        break;
      case 'End':
        next = indexes[indexes.length - 1];
        break;
      case 'Escape':
        event.preventDefault();
        this.focus();
        return;
      default:
        return;
    }

    event.preventDefault();
    this.activeTool.set(next);
    this.focusTool(next);
  }

  /**
   * @ignore Moves the DOM focus onto the control now holding the tab stop.
   *
   * Queried from the live toolbar rather than from the `ui-button` children: the
   * ring mixes buttons and the font `<select>`, and DOM order is the visual order.
   */
  private focusTool(index: number): void {
    const position = this.toolbar().filter((e) => !e.isSeparator && e.index <= index).length - 1;
    const controls =
      this.toolbarEl()?.nativeElement.querySelectorAll<HTMLElement>('button, select');
    controls?.[position]?.focus();
  }

  /**
   * @ignore Native attributes forwarded to a tool button.
   *
   * `aria-pressed` only on the toggles: `link` and `clearFormat` are one-shot
   * actions, and a permanently unpressed toggle would misreport them.
   */
  protected toolProps(tool: EditorTool): Record<string, string> | undefined {
    const state = this.state();
    if (!(tool in state)) return undefined;
    return { 'aria-pressed': state[tool as keyof EditorState] ? 'true' : 'false' };
  }
}
