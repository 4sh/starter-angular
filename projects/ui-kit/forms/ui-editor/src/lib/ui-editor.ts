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
import {NgTemplateOutlet} from '@angular/common';
import {NG_VALUE_ACCESSOR} from '@angular/forms';
import {DomSanitizer} from '@angular/platform-browser';
import {BaseFormField} from '@4sh/ui-kit/forms';
import {UiField} from '@4sh/ui-kit/forms/ui-field';
import {UiButton} from '@4sh/ui-kit/actions/ui-button';
import {UiMenu, UiMenuItem} from '@4sh/ui-kit/navigation/ui-menu';
import {UiSwatch, UiSwatchPicker} from '@4sh/ui-kit/forms/ui-swatch-picker';
import {
  applyCommand,
  applyFontFamily,
  applyFontSize,
  applyHighlightColor,
  applyLink,
  applyTextColor,
  clearMarkerClass,
  convertColorMarkers,
  convertFontMarkers,
  convertHighlightMarkers,
  convertSizeMarkers,
  DEFAULT_EDITOR_TOOLS,
  EDITOR_COLORS,
  EDITOR_FONTS,
  EDITOR_HIGHLIGHTS,
  EDITOR_SELECT_TOOLS,
  EDITOR_SIZES,
  EDITOR_TOOL_META,
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
  readEditorState,
  readFontFamily,
  readFontSize,
  readHighlightColor,
  readTextColor,
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
  imports: [UiField, UiButton, UiMenu, UiSwatchPicker, NgTemplateOutlet],
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
  /** @ignore Font family popup (see {@link onSelectMenuTrigger}). */
  private readonly fontFamilyMenu = viewChild<UiMenu>('fontFamilyMenu');
  /** @ignore Font size popup (see {@link onSelectMenuTrigger}). */
  private readonly fontSizeMenu = viewChild<UiMenu>('fontSizeMenu');
  /** @ignore Text color popup (see {@link onColorToolClick}). */
  private readonly textColorPicker = viewChild<UiSwatchPicker>('textColorPicker');
  /** @ignore Highlight color popup (see {@link onColorToolClick}). */
  private readonly highlightColorPicker = viewChild<UiSwatchPicker>('highlightColorPicker');

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
  /** @ignore Text color at the caret (`null` = the default color). */
  protected readonly currentTextColor = signal<string | null>(null);
  /** @ignore Highlight color at the caret (`null` = no highlight). */
  protected readonly currentHighlightColor = signal<string | null>(null);
  /** @ignore Index of the toolbar button reachable with Tab (roving tabindex). */
  protected readonly activeTool = signal(0);
  /** @ignore Open state of the `fontFamily` popup (drives its trigger's `aria-expanded`). */
  protected readonly fontFamilyMenuOpen = signal(false);
  /** @ignore Open state of the `fontSize` popup (drives its trigger's `aria-expanded`). */
  protected readonly fontSizeMenuOpen = signal(false);
  /** @ignore Open state of the `textColor` popup (drives its trigger's `aria-expanded`). */
  protected readonly textColorPickerOpen = signal(false);
  /** @ignore Open state of the `highlightColor` popup (drives its trigger's `aria-expanded`). */
  protected readonly highlightColorPickerOpen = signal(false);

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
  /** @ignore Text sizes offered by the `fontSize` dropdown. */
  protected readonly sizes = EDITOR_SIZES;
  /**
   * @ignore Type families, labelled with the face each token actually resolves to.
   *
   * Read once the view exists, since the value comes from the computed style: a
   * hardcoded "Inter" would lie as soon as a project rebinds the token.
   */
  protected readonly fonts = signal(EDITOR_FONTS.map((f) => ({ ...f })));
  /** @ignore `fontFamily` popup entries — one `command` per family, closed over its key. */
  protected readonly fontFamilyMenuItems = computed<UiMenuItem[]>(() =>
    this.fonts().map((font) => ({
      id: font.key,
      label: font.label,
      command: () => this.selectFontFamily(font.key),
    })),
  );
  /** @ignore `fontSize` popup entries — one `command` per size, closed over its key. */
  protected readonly fontSizeMenuItems = computed<UiMenuItem[]>(() =>
    this.sizes.map((size) => ({
      id: size.key,
      label: size.label,
      command: () => this.selectFontSize(size.key),
    })),
  );
  /** @ignore Swatch entry backing the `textColor` button's color indicator. */
  protected readonly currentTextColorSwatch = computed(() =>
    EDITOR_COLORS.find((c) => c.key === this.currentTextColor()),
  );
  /** @ignore Swatch entry backing the `highlightColor` button's color indicator. */
  protected readonly currentHighlightColorSwatch = computed(() =>
    EDITOR_HIGHLIGHTS.find((c) => c.key === this.currentHighlightColor()),
  );
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
    this.currentTextColor.set(readTextColor(anchor));
    this.currentHighlightColor.set(readHighlightColor(anchor));

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
  protected runTool(tool: EditorButtonTool, index: number, event?: MouseEvent): void {
    if (!this.isEditable()) return;
    this.activeTool.set(index);
    if (tool === 'textColor' || tool === 'highlightColor') {
      this.onColorToolClick(tool, event!);
      return;
    }
    this.focus();
    if (tool === 'link') this.promptForLink();
    else if (tool === 'codeBlock') toggleCodeBlock();
    else applyCommand(tool);
    this.onInput();
  }

  /**
   * @ignore Trigger click for `textColor`/`highlightColor`: opens the matching
   * `ui-swatch-picker` instead of applying a command directly — same
   * "picker takes the focus, the caret is restored before the real command
   * runs" pattern as {@link onSelectMenuTrigger}, but these two are button
   * tools (a one-shot action button, not a value dropdown), so they run
   * through `runTool` rather than `onSelectChange`.
   */
  private onColorToolClick(tool: 'textColor' | 'highlightColor', event: MouseEvent): void {
    this.rememberSelection();
    const picker =
      tool === 'textColor' ? this.textColorPicker() : this.highlightColorPicker();
    picker?.toggle(event);
  }

  /**
   * @ignore Applies the text color chosen in the `textColor` picker.
   *
   * The popup took the focus, so the caret is put back first. `foreColor`
   * emits a legacy `<font>` element, immediately rewritten into a class.
   */
  protected onTextColorSelect(swatch: UiSwatch | null): void {
    if (!this.isEditable()) return;
    this.restoreSelection();
    const el = this.contentEl()?.nativeElement;
    if (swatch) {
      applyTextColor();
      if (el) convertColorMarkers(el, `ui-editor-color-${swatch.key}`);
    } else if (el && this.savedRange) {
      for (const color of EDITOR_COLORS) clearMarkerClass(el, this.savedRange, color.className);
    }
    this.onInput();
  }

  /**
   * @ignore Applies the highlight color chosen in the `highlightColor` picker.
   *
   * The popup took the focus, so the caret is put back first. `hiliteColor`
   * emits a `<span style="background-color:…">`, immediately rewritten into a
   * class (see {@link convertHighlightMarkers}).
   */
  protected onHighlightColorSelect(swatch: UiSwatch | null): void {
    if (!this.isEditable()) return;
    this.restoreSelection();
    const el = this.contentEl()?.nativeElement;
    if (swatch) {
      applyHighlightColor();
      if (el) convertHighlightMarkers(el, `ui-editor-highlight-${swatch.key}`);
    } else if (el && this.savedRange) {
      for (const color of EDITOR_HIGHLIGHTS) {
        clearMarkerClass(el, this.savedRange, color.className);
      }
    }
    this.onInput();
  }

  /**
   * @ignore Trigger click: mark the tool active, then toggle its popup menu.
   *
   * `fontFamily` and `fontSize` are the only select-style tools left (there is
   * no block-level dropdown), so `tool` narrows the same as `entry.select`.
   */
  protected onSelectMenuTrigger(tool: EditorSelectTool, index: number, event: MouseEvent): void {
    this.activeTool.set(index);
    if (!this.isEditable()) return;
    if (tool === 'fontFamily') this.fontFamilyMenu()?.toggle(event);
    else if (tool === 'fontSize') this.fontSizeMenu()?.toggle(event);
  }

  /** @ignore Whether a popup-menu dropdown is currently open (its trigger's `aria-expanded`). */
  protected selectMenuOpen(tool: EditorSelectTool): boolean {
    return tool === 'fontFamily' ? this.fontFamilyMenuOpen() : this.fontSizeMenuOpen();
  }

  /**
   * @ignore Applies a type family from the `fontFamily` popup.
   *
   * The popup took the focus, so the caret is put back first. `fontName` emits
   * a legacy `<font>` element, immediately rewritten into a class.
   */
  private selectFontFamily(key: EditorFont): void {
    if (!this.isEditable()) return;
    const choice = this.fonts().find((f) => f.key === key);
    if (!choice) return;
    this.restoreSelection();
    applyFontFamily();
    const el = this.contentEl()?.nativeElement;
    if (el) convertFontMarkers(el, choice.className);
    this.onInput();
  }

  /**
   * @ignore Applies a text size from the `fontSize` popup.
   *
   * The popup took the focus, so the caret is put back first. `fontSize` emits
   * a legacy `<font>` element, immediately rewritten into a class.
   */
  private selectFontSize(key: EditorSize): void {
    if (!this.isEditable()) return;
    const choice = this.sizes.find((s) => s.key === key);
    if (!choice) return;
    this.restoreSelection();
    applyFontSize();
    const el = this.contentEl()?.nativeElement;
    if (el) convertSizeMarkers(el, choice.className);
    this.onInput();
  }

  /** @ignore Accessible name of a dropdown — spelled out, it is never truncated. */
  protected selectLabel(tool: EditorSelectTool): string {
    if (tool === 'fontFamily') return 'Police';
    return 'Taille du texte';
  }

  /**
   * @ignore Label shown on the `fontFamily`/`fontSize` popup triggers.
   *
   * Falls back to the value actually in force when no class was applied: text
   * carrying no class really is rendered with `--fontfamily-base` at the
   * default size, so naming it states a fact rather than a placeholder.
   */
  protected selectDisplayLabel(tool: EditorSelectTool): string {
    if (tool === 'fontFamily') {
      const key = this.currentFont() ?? 'base';
      return this.fonts().find((f) => f.key === key)?.label ?? '';
    }
    const key = this.currentSize() ?? 'default';
    return this.sizes.find((s) => s.key === key)?.label ?? '';
  }

  /**
   * @ignore Accessible name of a popup trigger, combining the dropdown's own
   * name with the value it currently shows.
   *
   * `ui-button` reports an explicit `ariaLabel` as the whole accessible name,
   * which would otherwise hide the visible value (`selectDisplayLabel`) from
   * assistive tech — announcing "Police" instead of "Police : Inter".
   */
  protected selectTriggerAriaLabel(tool: EditorSelectTool): string {
    return `${this.selectLabel(tool)} : ${this.selectDisplayLabel(tool)}`;
  }

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

    let next: number;
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
   * Queried from the live toolbar rather than from the `ui-button` children:
   * DOM order is the visual order, and every tool (buttons and select-menu
   * triggers alike) renders as a `<button>`.
   */
  private focusTool(index: number): void {
    const position = this.toolbar().filter((e) => !e.isSeparator && e.index <= index).length - 1;
    const controls = this.toolbarEl()?.nativeElement.querySelectorAll<HTMLElement>('button');
    controls?.[position]?.focus();
  }

  /**
   * @ignore `var(--primitives-…)` for the `textColor`/`highlightColor`
   * buttons' color indicator, or `null` for every other tool (no swatch
   * active, or a tool the indicator does not apply to).
   */
  protected colorIndicatorVar(tool: EditorButtonTool | null): string | null {
    const swatch =
      tool === 'textColor'
        ? this.currentTextColorSwatch()
        : tool === 'highlightColor'
          ? this.currentHighlightColorSwatch()
          : null;
    return swatch ? `var(${swatch.cssVar})` : null;
  }

  /**
   * @ignore Native attributes forwarded to a tool button.
   *
   * `aria-pressed` only on the toggles: `link` and `clearFormat` are one-shot
   * actions, and a permanently unpressed toggle would misreport them.
   * `textColor`/`highlightColor` forward `aria-haspopup`/`aria-expanded`
   * instead — they open a `ui-swatch-picker` popup, not a toggle.
   */
  protected toolProps(tool: EditorTool): Record<string, string> | undefined {
    if (tool === 'textColor' || tool === 'highlightColor') {
      const open =
        tool === 'textColor' ? this.textColorPickerOpen() : this.highlightColorPickerOpen();
      return { 'aria-haspopup': 'true', 'aria-expanded': open ? 'true' : 'false' };
    }
    const state = this.state();
    if (!(tool in state)) return undefined;
    return { 'aria-pressed': state[tool as keyof EditorState] ? 'true' : 'false' };
  }
}
