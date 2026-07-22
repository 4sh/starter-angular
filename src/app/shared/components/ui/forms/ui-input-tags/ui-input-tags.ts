import {
  booleanAttribute,
  Component,
  computed,
  contentChild,
  effect,
  ElementRef,
  forwardRef,
  input,
  isDevMode,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  viewChild,
  viewChildren,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { BaseFormField } from '@app/shared/components/ui/forms/base-form-field';
import { UiField } from '@app/shared/components/ui/forms/ui-field/ui-field';
import { UiIcon, UiIconSize } from '@app/shared/components/ui/ui-icon/ui-icon';
import { UiChip } from '@app/shared/components/ui/informative/ui-chip/ui-chip';
import { UiFeedbackLevel, UiSubLevel } from '@app/shared/types/ui-level';
import { UiMotion } from '@app/shared/motion/ui-motion';

/** Delimiter used to split the typed text (and pasted text) into several tags. */
export type TagDelimiter = string | RegExp;

/** Payload of the `tagAdd` output. */
export interface InputTagsAddEvent {
  /** Originating DOM event. */
  originalEvent: Event;
  /** Added value. */
  value: unknown;
}

/** Payload of the `tagRemove` output. */
export interface InputTagsRemoveEvent {
  /** Originating DOM event. */
  originalEvent: Event;
  /** Removed value. */
  value: unknown;
  /** Index of the removed value. */
  index: number;
}

/** Payload of the `completeMethod` output (typeahead). */
export interface InputTagsCompleteEvent {
  /** Originating DOM event. */
  originalEvent: Event;
  /** Search query. */
  query: string;
}

/** Payload of the `optionSelect` output (typeahead). */
export interface InputTagsSelectEvent {
  /** Originating DOM event. */
  originalEvent: Event;
  /** Selected suggestion (original object/primitive). */
  value: unknown;
}

/** Context handed to the `#item` template (per tag). */
export interface InputTagsItemContext<T = unknown> {
  /** The tag value (default `$implicit`). */
  $implicit: T;
  /** Same as `$implicit`, named for readability. */
  value: T;
  /** Resolved display label of the tag. */
  label: string;
  /** Index of the tag. */
  index: number;
  /** Removes this tag. */
  onRemove: (event: Event) => void;
}

/** Context handed to the `#option` template (per suggestion). */
export interface InputTagsOptionContext<T = unknown> {
  /** The suggestion (default `$implicit`). */
  $implicit: T;
  /** Same as `$implicit`, named for readability. */
  option: T;
  /** Index of the suggestion in the visible list. */
  index: number;
}

/** Context handed to the `#group` template. */
export interface InputTagsGroupContext<G = unknown> {
  /** The group object (default `$implicit`). */
  $implicit: G;
  /** Same as `$implicit`, named for readability. */
  group: G;
}

/** @ignore Flat view of one suggestion. */
interface TagEntry {
  value: unknown;
  label: string;
  disabled: boolean;
  original: unknown;
}

/** @ignore Group of entries. */
interface TagGroupEntry {
  label: string;
  original: unknown;
  entries: TagEntry[];
}

/** @ignore Rendered suggestion row. */
type TagRow =
  | { kind: 'group'; key: string; label: string; original: unknown }
  | { kind: 'option'; key: string; id: string; index: number; entry: TagEntry; present: boolean };

/**
 * ui-input-tags — headless multi-value tag entry built on the `ui-field` shell
 * (label + box + helper). Tags are entered by typing and pressing `Entrée`
 * (and/or a `delimiter`), and removed with `Retour arrière` / the × action.
 *
 * The model is an **array** driven through {@link BaseFormField}
 * (`ControlValueAccessor`) — compatible with `[(ngModel)]`, Reactive Forms and
 * the upcoming Signal Forms (`[field]`, Angular 22). Options: `max`,
 * `allowDuplicate`, `addOnBlur` / `addOnTab` / `addOnPaste`, and a `typeahead`
 * mode (a CDK-overlay suggestions panel fed by the parent via `completeMethod`).
 *
 * A11y: the tag list is a `role="listbox"` (`aria-orientation="horizontal"`);
 * each tag is a `role="option"` with roving focus (`←` / `→` between tags,
 * `Retour arrière` / `Suppr` to delete). The editable input follows the combobox
 * pattern in `typeahead` mode.
 *
 * @example
 * ```html
 * <ui-input-tags label="Mots-clés" [(ngModel)]="keywords" placeholder="Ajouter…" />
 * ```
 */
@Component({
  selector: 'ui-input-tags',
  imports: [NgTemplateOutlet, OverlayModule, UiField, UiIcon, UiChip, UiMotion],
  templateUrl: './ui-input-tags.html',
  styleUrl: './ui-input-tags.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiInputTags), multi: true }],
})
export class UiInputTags<T = unknown> extends BaseFormField<T[]> {
  /** Native placeholder shown when the input is empty (and no tag exists). */
  placeholder = input<string>();
  /** Maximum number of tags allowed (`undefined` = unlimited). */
  max = input<number, unknown>(undefined, { transform: numberAttribute });
  /** Delimiter that splits typed/pasted text into several tags (in addition to `Entrée`). */
  delimiter = input<TagDelimiter>();
  /** Allow the same value to be added several times. */
  allowDuplicate = input(false, { transform: booleanAttribute });
  /** Add the current input as a tag when the field loses focus. */
  addOnBlur = input(false, { transform: booleanAttribute });
  /** Add the current input as a tag on `Tab`. */
  addOnTab = input(false, { transform: booleanAttribute });
  /** Split pasted text with the `delimiter` (or whitespace/newlines) and add each part. */
  addOnPaste = input(false, { transform: booleanAttribute });
  /** Max character length of a single typed tag. */
  maxLength = input<number, unknown>(undefined, { transform: numberAttribute });

  /** Color family of the default `ui-chip` tags (ignored when an `#item` template is used). */
  chipLevel = input<UiFeedbackLevel>('default');
  /** Intensity of the default `ui-chip` tags: `low` (subtle, default) or `high` (solid). */
  chipSubLevel = input<UiSubLevel>('low');
  /** Pill shape (default) vs rounded-rectangle for the default `ui-chip` tags. */
  chipRounded = input(true, { transform: booleanAttribute });

  /** Show a suggestions dropdown as the user types (fed via `completeMethod`). */
  typeahead = input(false, { transform: booleanAttribute });
  /** Suggestions to display — set by the parent in response to `completeMethod`. */
  suggestions = input<readonly unknown[]>([]);
  /** Field name (dot-path) read as a suggestion label. */
  optionLabel = input<string>();
  /** Field name (dot-path) read as the value added to the model. */
  optionValue = input<string>();
  /** Field name (dot-path) read as a suggestion's disabled flag. */
  optionDisabled = input<string>();
  /** Property compared for value equality (duplicate detection on objects). */
  dataKey = input<string>();
  /** Treat `suggestions` as groups. */
  group = input(false, { transform: booleanAttribute });
  /** Field name of a group's label. */
  optionGroupLabel = input<string>('label');
  /** Field name of a group's children array. */
  optionGroupChildren = input<string>('items');
  /** Minimum number of characters before `completeMethod` is emitted. */
  minLength = input<number, unknown>(1, { transform: numberAttribute });
  /** Debounce (ms) between the last keystroke and `completeMethod`. */
  delay = input<number, unknown>(300, { transform: numberAttribute });
  /** Emit a query as soon as the input is focused (before any typing). */
  completeOnFocus = input(false, { transform: booleanAttribute });
  /** Max height of the suggestions list (CSS size). Defaults from the SCSS. */
  scrollHeight = input<string>();
  /** Visually focus the first suggestion when the panel opens. */
  autoOptionFocus = input(false, { transform: booleanAttribute });
  /** Visually focus the suggestion under the mouse pointer. */
  focusOnHover = input(true, { transform: booleanAttribute });
  /** Auto-flip the panel above the input when space is lacking below. */
  autoFlip = input(true, { transform: booleanAttribute });
  /** Extra class(es) applied to the suggestions panel. */
  panelStyleClass = input<string>();

  /** Message shown when a query returns no suggestion. */
  emptyMessage = input<string>('Aucun résultat');

  /** Emitted when a tag is added. */
  tagAdd = output<InputTagsAddEvent>();
  /** Emitted when a tag is removed. */
  tagRemove = output<InputTagsRemoveEvent>();
  /** Emitted whenever the model changes. */
  valueChange = output<T[]>();
  /** Emitted (debounced) when a typeahead query should run. */
  completeMethod = output<InputTagsCompleteEvent>();
  /** Emitted when a suggestion is selected. */
  optionSelect = output<InputTagsSelectEvent>();
  /** Emitted when the suggestions panel opens. */
  opened = output<void>();
  /** Emitted when the suggestions panel closes. */
  closed = output<void>();
  /** Emitted when the input receives focus. */
  inputFocus = output<FocusEvent>();
  /** Emitted when the input loses focus. */
  inputBlur = output<FocusEvent>();

  /** Custom tag template: `<ng-template #item let-value let-remove="onRemove">`. */
  protected readonly itemTemplate = contentChild<TemplateRef<InputTagsItemContext<T>>>('item');
  /** Custom suggestion template: `<ng-template #option let-option>`. */
  protected readonly optionTemplate = contentChild<TemplateRef<InputTagsOptionContext<T>>>('option');
  /** Custom group-header template: `<ng-template #group let-group>`. */
  protected readonly groupTemplate = contentChild<TemplateRef<InputTagsGroupContext>>('group');

  /** @ignore Component root (overlay origin). */
  private readonly containerEl = viewChild.required<ElementRef<HTMLElement>>('container');
  /** @ignore Editable input. */
  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('inputEl');
  /** @ignore Panel root element. */
  private readonly panelEl = viewChild<ElementRef<HTMLElement>>('panel');
  /** @ignore Tag option elements (roving focus). `read: ElementRef` covers both the
   *  plain `<span>` (template mode) and the `<ui-chip>` host (default mode). */
  private readonly tagEls = viewChildren('tagEl', { read: ElementRef });

  /** @ignore */
  protected readonly panelOpen = signal(false);
  /** @ignore */
  protected readonly overlayOrigin = signal<Element | null>(null);
  /** @ignore */
  protected readonly overlayWidth = signal<number | null>(null);
  /** @ignore Text currently typed in the input. */
  protected readonly inputText = signal('');
  /** @ignore Index of the roving-focused tag (-1 = the input holds focus). */
  protected readonly focusedTag = signal(-1);
  /** @ignore Index of the visually focused suggestion (-1 = none). */
  protected readonly focusedOption = signal(-1);
  /** @ignore A query has been emitted and is awaiting fresh suggestions. */
  private queryDirty = false;
  /** @ignore Debounce handle for `completeMethod`. */
  private searchTimeout: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    super();

    if (isDevMode()) {
      effect(() => {
        if (!this.label() && !this.ariaLabel() && !this.ariaLabelledBy()) {
          console.warn(
            '[ui-input-tags] Champ sans nom accessible : renseignez `label`, `ariaLabel` ou `ariaLabelledBy`.',
          );
        }
      });
    }
  }

  // --- Derived state -----------------------------------------------------

  /** @ignore Current tags. */
  protected readonly tagValues = computed<T[]>(() => this.modelValue() ?? []);
  /** @ignore Tags as display rows (value + resolved label). */
  protected readonly tagRows = computed(() =>
    this.tagValues().map((value, index) => ({ value, index, label: this.labelOfValue(value) })),
  );
  /** @ignore */
  protected readonly listboxId = computed(() => `${this.resolvedId()}-tags`);
  /** @ignore */
  protected readonly panelListId = computed(() => `${this.resolvedId()}-list`);
  /** @ignore Icon size aligned with the field size. */
  protected readonly iconSize = computed<UiIconSize>(() => (this.size() === 'small' ? 'sm' : 'md'));
  /** @ignore Tags can be removed (not disabled / read-only). */
  protected readonly canRemove = computed(() => !this.isDisabled() && !this.readonly());
  /** @ignore The tag cap has been reached. */
  protected readonly isFull = computed(() => {
    const max = this.max();
    return max != null && max > 0 && this.tagValues().length >= max;
  });
  /** @ignore The input accepts typing. */
  protected readonly canType = computed(() => !this.isDisabled() && !this.readonly() && !this.isFull());
  /** @ignore The placeholder is shown only while there is no tag. */
  protected readonly effectivePlaceholder = computed(() => (this.tagValues().length ? '' : (this.placeholder() ?? '')));

  /** @ignore Flat entries (no groups). */
  private readonly flatEntries = computed<TagEntry[]>(() => {
    if (this.group()) return this.groupEntries().flatMap((g) => g.entries);
    return (this.suggestions() ?? []).map((option) => this.toEntry(option));
  });

  /** @ignore Groups of entries. */
  private readonly groupEntries = computed<TagGroupEntry[]>(() => {
    if (!this.group()) return [];
    return (this.suggestions() ?? []).map((groupOption) => {
      const children = this.getField(groupOption, this.optionGroupChildren());
      return {
        label: this.asText(this.getField(groupOption, this.optionGroupLabel())) ?? '',
        original: groupOption,
        entries: (Array.isArray(children) ? children : []).map((option) => this.toEntry(option)),
      };
    });
  });

  /** @ignore Rendered suggestion rows (already-added values are marked present/disabled). */
  protected readonly visibleRows = computed<TagRow[]>(() => {
    const rows: TagRow[] = [];
    let index = 0;
    const pushOption = (entry: TagEntry): void => {
      const present = this.isPresent(entry.value);
      rows.push({
        kind: 'option',
        key: `${this.panelListId()}-${index}`,
        id: `${this.resolvedId()}-option-${index}`,
        index,
        entry: { ...entry, disabled: entry.disabled || (present && !this.allowDuplicate()) },
        present,
      });
      index++;
    };

    if (this.group()) {
      this.groupEntries().forEach((g, gi) => {
        if (!g.entries.length) return;
        rows.push({ kind: 'group', key: `${this.panelListId()}-group-${gi}`, label: g.label, original: g.original });
        g.entries.forEach(pushOption);
      });
    } else {
      this.flatEntries().forEach(pushOption);
    }
    return rows;
  });

  /** @ignore Visible option rows only (visual-focus space). */
  protected readonly visibleOptions = computed(() =>
    this.visibleRows().filter((r): r is Extract<TagRow, { kind: 'option' }> => r.kind === 'option'),
  );

  /** @ignore */
  protected readonly optionCount = computed(() => this.visibleOptions().length);
  /** @ignore */
  protected readonly showEmpty = computed(() => this.panelOpen() && !this.visibleRows().length);

  /** @ignore id of the visually focused suggestion (aria-activedescendant). */
  protected readonly activeDescendant = computed(() => {
    if (!this.panelOpen()) return null;
    return this.visibleOptions()[this.focusedOption()]?.id ?? null;
  });

  /** @ignore */
  protected readonly overlayPositions = computed<ConnectedPosition[]>(() => {
    const below: ConnectedPosition = { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 8 };
    const above: ConnectedPosition = { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -8 };
    return this.autoFlip() ? [below, above] : [below];
  });

  // --- CVA -----------------------------------------------------------------

  override writeValue(value: T[]): void {
    this.modelValue.set(Array.isArray(value) ? value : []);
  }

  /** Moves focus to the input. */
  focus(options?: FocusOptions): void {
    this.inputEl()?.nativeElement.focus(options);
  }

  // --- Tag mutations -------------------------------------------------------

  /** @ignore Add one value as a tag (respects `max` and `allowDuplicate`). Returns true if added. */
  private addValue(value: T, event: Event): boolean {
    if (!this.canType()) return false;
    if (!this.allowDuplicate() && this.isPresent(value)) return false;
    this.commit([...this.tagValues(), value]);
    this.tagAdd.emit({ originalEvent: event, value });
    return true;
  }

  /** @ignore Add the typed text (or its delimiter-split parts) as tag(s). */
  private addFromInput(event: Event): void {
    const parts = this.split(this.inputText())
      .map((p) => p.trim())
      .filter(Boolean);
    let added = false;
    for (const part of parts) {
      if (this.addValue(part as T, event)) added = true;
      if (this.isFull()) break;
    }
    if (added || parts.length) this.inputText.set('');
  }

  /** Removes the tag at `index`. */
  removeAt(index: number, event: Event): void {
    if (this.isDisabled() || this.readonly()) return;
    const tags = this.tagValues();
    if (index < 0 || index >= tags.length) return;
    const value = tags[index];
    this.commit(tags.filter((_, i) => i !== index));
    this.tagRemove.emit({ originalEvent: event, value, index });
    // Keep the roving focus coherent after removal.
    const nextCount = tags.length - 1;
    if (nextCount === 0) this.focusInput();
    else this.focusTag(Math.min(index, nextCount - 1));
  }

  /** @ignore Propagate a user-driven value change (view → form). */
  private commit(value: T[]): void {
    this.modelValue.set(value);
    this.emitChange(value);
    this.valueChange.emit(value);
  }

  // --- Input interactions --------------------------------------------------

  /** @ignore */
  protected onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.inputText.set(value);

    // A typed delimiter flushes the completed part(s) into tags.
    if (this.delimiter() && this.split(value).length > 1) {
      this.flushDelimited(event);
      return;
    }

    if (!this.typeahead()) return;

    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    const query = this.inputText();
    if (query.length < this.minLength()) {
      this.close(false);
      return;
    }
    this.focusedOption.set(-1);
    this.searchTimeout = setTimeout(() => this.runSearch(event, query), this.delay());
  }

  /** @ignore Split the text, add every completed part, keep the trailing remainder in the input. */
  private flushDelimited(event: Event): void {
    const parts = this.split(this.inputText());
    const remainder = parts.pop() ?? '';
    parts.map((p) => p.trim()).filter(Boolean).forEach((p) => this.addValue(p as T, event));
    this.inputText.set(remainder);
  }

  /** @ignore */
  protected onKeydown(event: KeyboardEvent): void {
    if (this.isDisabled() || this.readonly()) return;
    const input = this.inputEl()?.nativeElement;
    const atStart = !input || (input.selectionStart === 0 && input.selectionEnd === 0);

    switch (event.key) {
      case 'Enter':
        event.preventDefault();
        if (this.panelOpen() && this.focusedOption() !== -1) this.selectFocusedOption(event);
        else this.addFromInput(event);
        return;
      case 'Backspace':
        if (this.inputText().length === 0 && this.tagValues().length) {
          event.preventDefault();
          this.removeAt(this.tagValues().length - 1, event);
        }
        return;
      case 'ArrowLeft':
        if (atStart && this.tagValues().length) {
          event.preventDefault();
          this.focusTag(this.tagValues().length - 1);
        }
        return;
      case 'ArrowDown':
        if (this.typeahead()) {
          event.preventDefault();
          this.panelOpen() ? this.moveOption(1) : this.reopen();
        }
        return;
      case 'ArrowUp':
        if (this.typeahead() && this.panelOpen()) {
          event.preventDefault();
          this.moveOption(-1);
        }
        return;
      case 'Escape':
        if (this.panelOpen()) {
          event.preventDefault();
          event.stopPropagation();
          this.close();
        }
        return;
      case 'Tab':
        if (this.addOnTab() && this.inputText().trim()) {
          event.preventDefault();
          this.addFromInput(event);
        }
        if (this.panelOpen()) this.close(false);
        return;
      default:
        return;
    }
  }

  /** @ignore */
  protected onPaste(event: ClipboardEvent): void {
    if (!this.addOnPaste() || !this.canType()) return;
    const text = event.clipboardData?.getData('text') ?? '';
    if (!text) return;
    event.preventDefault();
    const parts = (this.delimiter() ? this.split(text) : text.split(/[\r\n\t,;]+/))
      .map((p) => p.trim())
      .filter(Boolean);
    for (const part of parts) {
      this.addValue(part as T, event);
      if (this.isFull()) break;
    }
  }

  /** @ignore */
  protected onInputFocus(event: FocusEvent): void {
    if (this.isDisabled()) return;
    this.focusedTag.set(-1);
    if (this.typeahead() && !this.queryDirty && this.completeOnFocus()) this.runSearch(event, this.inputText());
    this.inputFocus.emit(event);
  }

  /** @ignore */
  protected onInputBlur(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    const insideComponent = this.containerEl().nativeElement.contains(next);
    const insidePanel = this.panelEl()?.nativeElement.contains(next);
    if (!insideComponent && !insidePanel) {
      if (this.addOnBlur() && this.inputText().trim()) this.addFromInput(event);
      this.emitTouch();
    }
    this.inputBlur.emit(event);
  }

  /** @ignore Focus / clicks on the field box (but not a tag / button) land on the input. */
  protected onBoxMousedown(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('button') || target.closest('.ui-input-tags-tag') || target.closest('input')) return;
    event.preventDefault();
    this.focusInput();
  }

  // --- Roving tag focus ----------------------------------------------------

  /** @ignore */
  protected onTagKeydown(event: KeyboardEvent, index: number): void {
    if (this.isDisabled() || this.readonly()) return;
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        if (index > 0) this.focusTag(index - 1);
        return;
      case 'ArrowRight':
        event.preventDefault();
        if (index < this.tagValues().length - 1) this.focusTag(index + 1);
        else this.focusInput();
        return;
      case 'Backspace':
      case 'Delete':
        event.preventDefault();
        this.removeAt(index, event);
        return;
      case 'Home':
        event.preventDefault();
        this.focusTag(0);
        return;
      case 'End':
        event.preventDefault();
        this.focusTag(this.tagValues().length - 1);
        return;
      default:
        return;
    }
  }

  /** @ignore */
  private focusTag(index: number): void {
    this.focusedTag.set(index);
    setTimeout(() => this.tagEls()[index]?.nativeElement.focus());
  }

  /** @ignore */
  private focusInput(): void {
    this.focusedTag.set(-1);
    this.focus();
  }

  // --- Typeahead panel -----------------------------------------------------

  /** @ignore */
  private runSearch(event: Event, query: string): void {
    this.queryDirty = true;
    this.completeMethod.emit({ originalEvent: event, query });
    this.open();
  }

  /** @ignore */
  private open(): void {
    if (!this.canType() || this.panelOpen()) return;
    const origin =
      this.containerEl().nativeElement.querySelector('.ui-field-box') ?? this.containerEl().nativeElement;
    this.overlayOrigin.set(origin);
    this.overlayWidth.set(origin.getBoundingClientRect().width);
    this.focusedOption.set(this.autoOptionFocus() ? this.visibleOptions().findIndex((o) => !o.entry.disabled) : -1);
    this.panelOpen.set(true);
    this.opened.emit();
  }

  /** @ignore */
  protected close(focusInput = true): void {
    if (!this.panelOpen()) return;
    this.panelOpen.set(false);
    this.focusedOption.set(-1);
    this.queryDirty = false;
    this.closed.emit();
    if (focusInput) this.focus();
  }

  /** @ignore */
  private reopen(): void {
    if (!this.visibleRows().length) return;
    this.open();
    if (this.focusedOption() === -1) this.moveOption(1);
  }

  /** @ignore */
  protected onOptionClick(row: Extract<TagRow, { kind: 'option' }>, event: Event): void {
    event.preventDefault();
    this.selectRow(row, event);
  }

  /** @ignore Keep focus on the input when clicking an option. */
  protected onOptionMousedown(event: MouseEvent): void {
    event.preventDefault();
  }

  /** @ignore */
  protected onOptionMouseEnter(row: Extract<TagRow, { kind: 'option' }>): void {
    if (this.focusOnHover() && !row.entry.disabled) this.focusedOption.set(row.index);
  }

  /** @ignore */
  private selectRow(row: Extract<TagRow, { kind: 'option' }>, event: Event): void {
    if (row.entry.disabled) return;
    if (this.addValue(row.entry.value as T, event)) {
      this.optionSelect.emit({ originalEvent: event, value: row.entry.original });
    }
    this.inputText.set('');
    this.close();
  }

  /** @ignore */
  private selectFocusedOption(event: Event): void {
    const row = this.visibleOptions()[this.focusedOption()];
    if (row) this.selectRow(row, event);
    else this.addFromInput(event);
  }

  /** @ignore Move the visual focus, skipping disabled options (no wrap). */
  private moveOption(delta: 1 | -1): void {
    const options = this.visibleOptions();
    if (!options.length) return;
    let i = this.focusedOption();
    if (i === -1) i = delta === 1 ? -1 : options.length;
    for (i += delta; i >= 0 && i < options.length; i += delta) {
      if (!options[i].entry.disabled) {
        this.focusedOption.set(i);
        this.scrollOptionIntoView(options[i].id);
        return;
      }
    }
  }

  /** @ignore */
  private scrollOptionIntoView(id: string): void {
    this.panelEl()?.nativeElement.querySelector(`[id="${id}"]`)?.scrollIntoView({ block: 'nearest' });
  }

  // --- Option resolution ---------------------------------------------------

  /** @ignore Display label for a tag value. */
  private labelOfValue(value: unknown): string {
    if (value === null || value === undefined) return '';
    const entry = this.flatEntries().find((e) => this.equals(e.value, value));
    if (entry) return entry.label;
    return this.resolveLabel(value) ?? this.asText(value) ?? '';
  }

  /** @ignore */
  private toEntry(option: unknown): TagEntry {
    return {
      value: this.resolveValue(option),
      label: this.resolveLabel(option) ?? '',
      disabled: this.resolveDisabled(option),
      original: option,
    };
  }

  /** @ignore */
  private isObject(option: unknown): option is Record<string, unknown> {
    return typeof option === 'object' && option !== null;
  }

  /** @ignore */
  private getField(target: unknown, path: string | undefined): unknown {
    if (!path || !this.isObject(target)) return undefined;
    return path.split('.').reduce<unknown>((acc, key) => (this.isObject(acc) ? acc[key] : undefined), target);
  }

  /** @ignore */
  private resolveValue(option: unknown): unknown {
    const field = this.optionValue();
    if (field && this.isObject(option)) return this.getField(option, field);
    return option;
  }

  /** @ignore */
  private resolveLabel(option: unknown): string | null {
    const field = this.optionLabel();
    if (field && this.isObject(option)) return this.asText(this.getField(option, field));
    if (this.isObject(option) && 'label' in option) return this.asText(option['label']);
    return this.asText(option);
  }

  /** @ignore */
  private resolveDisabled(option: unknown): boolean {
    const field = this.optionDisabled();
    if (field && this.isObject(option)) return !!this.getField(option, field);
    if (this.isObject(option) && 'disabled' in option) return !!option['disabled'];
    return false;
  }

  /** @ignore */
  private asText(value: unknown): string | null {
    return value === null || value === undefined ? null : String(value);
  }

  /** @ignore Whether a value is already a tag. */
  private isPresent(value: unknown): boolean {
    return this.tagValues().some((v) => this.equals(v, value));
  }

  /** @ignore Value equality — by `dataKey` for objects, strict otherwise. */
  private equals(a: unknown, b: unknown): boolean {
    const key = this.dataKey();
    if (key && this.isObject(a) && this.isObject(b)) return a[key] === b[key];
    return a === b;
  }

  /** @ignore Split text by the delimiter (string or regex); whole text when none. */
  private split(text: string): string[] {
    const d = this.delimiter();
    if (!d) return [text];
    return text.split(d as string | RegExp);
  }
}
