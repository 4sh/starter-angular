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
  untracked,
  viewChild,
  viewChildren,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { BaseFormField } from '@4sh/ui-kit/forms';
import { createOptionResolver } from '@4sh/ui-kit/forms';
import { dropdownOverlayPositions } from '@4sh/ui-kit/forms';
import { formatLabel } from '@4sh/ui-kit/forms';
import { UiField } from '@app/shared/components/ui/forms/ui-field/ui-field';
import { UiIcon, UiIconSize } from '@4sh/ui-kit/ui-icon';
import { UiSpinner } from '@app/shared/components/ui/informative/ui-spinner/ui-spinner';
import { UiChip } from '@app/shared/components/ui/informative/ui-chip/ui-chip';
import { UiMotion } from '@app/shared/motion/ui-motion';
import { closeOnNavigation } from '@app/shared/overlay/close-on-navigation';

/** Model value: the selected suggestion (or its `optionValue`), free text, an array (`multiple`), or `null`. */
export type AutocompleteValue<T = unknown> = T | string | T[] | null;

/** How the dropdown trigger builds its query. */
export type AutocompleteDropdownMode = 'blank' | 'current';

/** Payload of the `completeMethod` output — the parent fills `suggestions` from it. */
export interface AutocompleteCompleteEvent {
  /** Originating DOM event (keystroke, dropdown click, focus). */
  originalEvent: Event;
  /** Current query text (empty string is valid — e.g. a `blank` dropdown). */
  query: string;
}

/** Context handed to the `#item` template. */
export interface AutocompleteItemContext<T = unknown> {
  /** The original suggestion (default `$implicit`). */
  $implicit: T;
  /** Same as `$implicit`, named for readability. */
  option: T;
  /** Whether this suggestion is the current value. */
  selected: boolean;
  /** Index of the suggestion in the visible list. */
  index: number;
}

/** Context handed to the `#selectedItem` template (once per selected value, `multiple`). */
export interface AutocompleteSelectedItemContext<T = unknown> {
  /** The original selected suggestion (default `$implicit`). */
  $implicit: T;
  /** Same as `$implicit`, named for readability. */
  option: T;
  /** Index among the selected values. */
  index: number;
  /** Removes this value (e.g. wire it to a removable chip). */
  remove: () => void;
}

/** Context handed to the `#group` template. */
export interface AutocompleteGroupContext<G = unknown> {
  /** The original group object (default `$implicit`). */
  $implicit: G;
  /** Same as `$implicit`, named for readability. */
  group: G;
}

/** Payload of the `lazyLoad` output (rendered range of the virtual viewport). */
export interface AutocompleteLazyLoadEvent {
  /** Index of the first rendered row. */
  first: number;
  /** Index after the last rendered row (exclusive). */
  last: number;
}

/** @ignore Flat view of one suggestion (logic source). */
interface AcEntry {
  value: unknown;
  label: string;
  disabled: boolean;
  original: unknown;
}

/** @ignore Group of entries (when `group` is enabled). */
interface AcGroupEntry {
  label: string;
  original: unknown;
  entries: AcEntry[];
}

/** @ignore Rendered row: a group header or a suggestion. */
type AcRow =
  | { kind: 'group'; key: string; label: string; original: unknown }
  | { kind: 'option'; key: string; id: string; index: number; entry: AcEntry; selected: boolean };

/**
 * ui-autocomplete — headless suggestion field built on the `ui-field` shell
 * (label + box + helper) with a token-styled suggestions panel in a CDK overlay.
 *
 * Two-way bound via `[(ngModel)]` (or reactive forms) through
 * {@link BaseFormField}. Typing emits `completeMethod` (debounced by `delay`,
 * gated by `minLength`); the parent answers by updating `suggestions`. Supports
 * primitive or object suggestions (`optionLabel` / `optionValue` /
 * `optionDisabled`), grouped suggestions, a `dropdown` trigger
 * (`dropdownMode`), a `multiple` mode (array model, removable chips in the
 * field, `unique`, `maxSelectedLabels`), `forceSelection`, `showClear`,
 * `loading`, configurable
 * focus behaviour (`autoOptionFocus` / `selectOnFocus` / `focusOnHover`) and
 * CDK virtual scrolling (plus lazy loading).
 *
 * The trigger is a real `<input>` following the WAI-ARIA combobox pattern
 * (`role="combobox"` + `aria-activedescendant`: focus never leaves the input,
 * suggestions are only visually focused).
 *
 * Customisation: the `#item`, `#selectedItem`, `#group`, `#header`, `#footer`
 * and `#empty` templates, `panelStyleClass`, and the local SCSS variables.
 *
 * @example
 * ```html
 * <ui-autocomplete label="Pays" [(ngModel)]="country"
 *                  [suggestions]="results()" optionLabel="name"
 *                  (completeMethod)="search($event)" />
 * ```
 */
@Component({
  selector: 'ui-autocomplete',
  imports: [NgTemplateOutlet, OverlayModule, ScrollingModule, UiField, UiIcon, UiSpinner, UiChip, UiMotion],
  templateUrl: './ui-autocomplete.html',
  styleUrl: './ui-autocomplete.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiAutocomplete), multi: true }],
})
export class UiAutocomplete<T = unknown> extends BaseFormField<AutocompleteValue<T>> {
  /** Suggestions to display — set by the parent in response to `completeMethod`. */
  suggestions = input<readonly unknown[]>([]);
  /** Field name (dot-path) to read a label from, when suggestions are objects. */
  optionLabel = input<string>();
  /** Field name (dot-path) to read the value from, when suggestions are objects. */
  optionValue = input<string>();
  /** Field name (dot-path) to read the disabled flag from, when suggestions are objects. */
  optionDisabled = input<string>();
  /** Property used to compare object values for equality (highlighting the current value). */
  dataKey = input<string>();

  /** Treat `suggestions` as groups (`optionGroupLabel` + `optionGroupChildren`). */
  group = input(false, { transform: booleanAttribute });
  /** Field name of a group's label. */
  optionGroupLabel = input<string>('label');
  /** Field name of a group's children array. */
  optionGroupChildren = input<string>('items');

  /** Native placeholder shown when the input is empty. */
  placeholder = input<string>();
  /** Minimum number of characters before `completeMethod` is emitted while typing. */
  minLength = input<number, unknown>(1, { transform: numberAttribute });
  /** Debounce (ms) between the last keystroke and `completeMethod`. */
  delay = input<number, unknown>(300, { transform: numberAttribute });
  /** Emit a query as soon as the input is focused (before any typing). */
  completeOnFocus = input(false, { transform: booleanAttribute });

  /** Show a trigger button that queries suggestions on click. */
  dropdown = input(false, { transform: booleanAttribute });
  /** `blank` queries with an empty string, `current` with the input's current text. */
  dropdownMode = input<AutocompleteDropdownMode>('blank');
  /** Accessible name of the dropdown trigger. */
  dropdownAriaLabel = input<string>('Afficher les suggestions');
  /** FontAwesome icon of the dropdown trigger. */
  dropdownIcon = input<string>('angle-down');

  /**
   * Validate the typed text against the suggestions on blur: if it matches
   * none, the input is cleared so the model always holds a real suggestion.
   */
  forceSelection = input(false, { transform: booleanAttribute });

  /** Multi-selection: the model is an array, each pick renders as a removable chip in the field. */
  multiple = input(false, { transform: booleanAttribute });
  /** With `multiple`: ignore picks whose value is already selected (no duplicates). */
  unique = input(true, { transform: booleanAttribute });
  /** With `multiple`: max number of chips rendered; the rest collapses behind `overflowLabel`. */
  maxSelectedLabels = input<number>();
  /** With `multiple`: format of the collapsed-count chip (`{0}` = hidden count). */
  overflowLabel = input<string>('(+{0} autres)');
  /** With `multiple`: accessible label of each chip's remove action — `{0}` is the chip label. */
  removeTagLabel = input<string>('Supprimer {0}');

  /** Show a clear (×) action when the input holds text. */
  showClear = input(false, { transform: booleanAttribute });
  /** Accessible name of the clear action. */
  clearAriaLabel = input<string>('Effacer la saisie');

  /** Loading state: a spinner replaces the dropdown trigger while a query runs. */
  loading = input(false, { transform: booleanAttribute });

  /** Message shown when a query returns no suggestion. */
  emptyMessage = input<string>('Aucun résultat');
  /** Render the empty-state row when there is no suggestion. */
  showEmptyMessage = input(true, { transform: booleanAttribute });

  /** Visually focus the first suggestion when the panel opens. */
  autoOptionFocus = input(false, { transform: booleanAttribute });
  /** Set the value as soon as a suggestion is visually focused with the keyboard. */
  selectOnFocus = input(false, { transform: booleanAttribute });
  /** Visually focus the suggestion under the mouse pointer. */
  focusOnHover = input(true, { transform: booleanAttribute });

  /** Render the suggestions through a CDK virtual-scroll viewport. */
  virtualScroll = input(false, { transform: booleanAttribute });
  /** Fixed height (px) of one row — required by the virtual scroller. */
  virtualScrollItemSize = input<number, unknown>(40, { transform: numberAttribute });
  /** With `virtualScroll`: emit `lazyLoad` with the rendered range (lazy loading). */
  lazy = input(false, { transform: booleanAttribute });
  /** Max height of the suggestions list (CSS size, e.g. `'320px'`). Defaults from the SCSS. */
  scrollHeight = input<string>();

  /**
   * Auto-flip the panel above the input when there isn't enough room below
   * (default). Set `false` to lock it below the input regardless of space.
   */
  autoFlip = input(true, { transform: booleanAttribute });
  /** Extra class(es) applied to the panel (scoped custom styling). */
  panelStyleClass = input<string>();

  /** Emitted (debounced) when a query should be run — fill `suggestions` from it. */
  completeMethod = output<AutocompleteCompleteEvent>();
  /** Emitted whenever the value changes (selection, typing, clear). */
  valueChange = output<AutocompleteValue<T>>();
  /** Emitted when a suggestion is picked (payload is the original suggestion). */
  optionSelect = output<T>();
  /** With `multiple`: emitted when a selected value is removed (payload is the removed suggestion). */
  optionUnselect = output<T>();
  /** Emitted when the panel opens. */
  opened = output<void>();
  /** Emitted when the panel closes. */
  closed = output<void>();
  /** Emitted when the value is cleared. */
  cleared = output<void>();
  /** Emitted when the dropdown trigger is clicked. */
  dropdownClick = output<AutocompleteCompleteEvent>();
  /** Emitted when the virtual viewport's rendered range changes (`virtualScroll` + `lazy`). */
  lazyLoad = output<AutocompleteLazyLoadEvent>();
  /** Emitted when the input receives focus. */
  inputFocus = output<FocusEvent>();
  /** Emitted when the input loses focus. */
  inputBlur = output<FocusEvent>();

  /** Custom suggestion template: `<ng-template #item let-option let-selected="selected">`. */
  protected readonly itemTemplate = contentChild<TemplateRef<AutocompleteItemContext<T>>>('item');
  /** Custom selected-value template (per selected value, `multiple`): `<ng-template #selectedItem let-option let-remove="remove">`. */
  protected readonly selectedItemTemplate = contentChild<TemplateRef<AutocompleteSelectedItemContext<T>>>('selectedItem');
  /** Custom group-header template: `<ng-template #group let-group>`. */
  protected readonly groupTemplate = contentChild<TemplateRef<AutocompleteGroupContext>>('group');
  /** Free content pinned above the list. */
  protected readonly headerTemplate = contentChild<TemplateRef<unknown>>('header');
  /** Free content pinned under the list. */
  protected readonly footerTemplate = contentChild<TemplateRef<unknown>>('footer');
  /** Custom empty-state template. */
  protected readonly emptyTemplate = contentChild<TemplateRef<unknown>>('empty');

  /** @ignore Component root (overlay origin + outside-focus detection). */
  private readonly containerEl = viewChild.required<ElementRef<HTMLElement>>('container');
  /** @ignore Focusable input (combobox). */
  private readonly inputEl = viewChild<ElementRef<HTMLInputElement>>('inputEl');
  /** @ignore Panel root element (for scrolling the focused option into view). */
  private readonly panelEl = viewChild<ElementRef<HTMLElement>>('panel');
  /** @ignore Virtual-scroll viewport (lazy range + scrollToIndex). */
  private readonly viewport = viewChild(CdkVirtualScrollViewport);
  /** @ignore Rendered chips (`multiple` mode, roving focus). */
  private readonly tagEls = viewChildren('tagEl', { read: ElementRef });

  /** @ignore */
  protected readonly panelOpen = signal(false);
  /** @ignore Element the overlay is anchored to (the field box). */
  protected readonly overlayOrigin = signal<Element | null>(null);
  /** @ignore Panel width, locked to the field box width on open. */
  protected readonly overlayWidth = signal<number | null>(null);
  /** @ignore Text currently shown in the `<input>`. */
  protected readonly inputText = signal('');
  /** @ignore Index of the visually focused option among the visible options (-1 = none). */
  protected readonly focusedIndex = signal(-1);
  /** @ignore Index of the chip holding the roving focus (-1 = the input, `multiple` mode). */
  protected readonly focusedTag = signal(-1);
  /** @ignore Entries recorded at pick time so chip labels survive suggestion churn (`multiple`). */
  private readonly selectionCache = signal<AcEntry[]>([]);
  /** @ignore A query has been emitted and is awaiting fresh suggestions (feeds `completeOnFocus`). */
  private queryDirty = false;
  /** @ignore Debounce handle for `completeMethod`. */
  private searchTimeout: ReturnType<typeof setTimeout> | undefined;
  /** @ignore A written value whose label could not be resolved yet (see `writeValue`). */
  private readonly pendingLabelSync = signal(false);

  constructor() {
    super();

    // Never carry an open panel over to the next page (the field can live in
    // an app shell that survives the navigation).
    closeOnNavigation(() => this.close(false));

    // Late label resolution: a value written before suggestions exist (e.g. a
    // pre-filled form using `optionValue`) displays the raw value; swap in the
    // real label once a matching suggestion arrives.
    effect(() => {
      const entry = this.pendingLabelSync() ? this.entryOfValue(untracked(this.modelValue) ?? null) : undefined;
      if (!entry) return;
      untracked(() => {
        this.pendingLabelSync.set(false);
        this.inputText.set(entry.label);
      });
    });

    // Forward the rendered range of the virtual viewport (lazy loading).
    effect((onCleanup) => {
      const vp = this.viewport();
      if (!vp || !this.lazy()) return;
      const sub = vp.renderedRangeStream.subscribe((range) =>
        this.lazyLoad.emit({ first: range.start, last: range.end }),
      );
      onCleanup(() => sub.unsubscribe());
    });

    // Re-measure the virtual viewport once it exists: it initialises while the
    // overlay panel is still laying out and can capture a 0 viewport size,
    // which freezes the rendered range on the first rows.
    effect(() => {
      const vp = this.viewport();
      if (!vp) return;
      setTimeout(() => {
        vp.checkViewportSize();
        this.scrollFocusedIntoView();
      });
    });

    // A11y / API safeguards (dev only).
    if (isDevMode()) {
      effect(() => {
        if (!this.label() && !this.ariaLabel() && !this.ariaLabelledBy()) {
          console.warn(
            '[ui-autocomplete] Field has no accessible name: provide `label`, `ariaLabel` or `ariaLabelledBy`.',
          );
        }
      });
    }
  }

  // --- Derived state -----------------------------------------------------

  /** @ignore */
  protected readonly listboxId = computed(() => `${this.resolvedId()}-list`);
  /** @ignore Icon size aligned with the field size. */
  protected readonly iconSize = computed<UiIconSize>(() => (this.size() === 'small' ? 'sm' : 'md'));

  /** @ignore Flat entries (no groups). */
  private readonly flatEntries = computed<AcEntry[]>(() => {
    if (this.group()) return this.groupEntries().flatMap((g) => g.entries);
    return (this.suggestions() ?? []).map((option) => this.toEntry(option));
  });

  /** @ignore Groups of entries (when `group` is enabled). */
  private readonly groupEntries = computed<AcGroupEntry[]>(() => {
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

  /** @ignore Rendered rows: suggestions + their group headers, with stable ids. */
  protected readonly visibleRows = computed<AcRow[]>(() => {
    const rows: AcRow[] = [];
    let index = 0;
    const pushOption = (entry: AcEntry): void => {
      rows.push({
        kind: 'option',
        key: `${this.listboxId()}-${index}`,
        id: `${this.resolvedId()}-option-${index}`,
        index,
        entry,
        selected: this.isValueSelected(entry.value),
      });
      index++;
    };

    if (this.group()) {
      this.groupEntries().forEach((g, gi) => {
        if (!g.entries.length) return;
        rows.push({ kind: 'group', key: `${this.listboxId()}-group-${gi}`, label: g.label, original: g.original });
        g.entries.forEach(pushOption);
      });
    } else {
      this.flatEntries().forEach(pushOption);
    }
    return rows;
  });

  /** @ignore Visible option rows only (visual-focus space). */
  protected readonly visibleOptions = computed(() =>
    this.visibleRows().filter((r): r is Extract<AcRow, { kind: 'option' }> => r.kind === 'option'),
  );

  /** @ignore aria-setsize of the visible listbox. */
  protected readonly optionCount = computed(() => this.visibleOptions().length);

  /** @ignore trackBy of the virtual list. */
  protected readonly trackRow = (_: number, row: AcRow): string => row.key;

  /** @ignore The input holds text. */
  protected readonly hasText = computed(() => this.inputText().length > 0);

  /** @ignore The clear action is shown. */
  protected readonly showClearButton = computed(
    () =>
      this.showClear() &&
      (this.hasText() || (this.multiple() && this.selectedValues().length > 0)) &&
      !this.isDisabled() &&
      !this.readonly(),
  );

  /** @ignore Selected values in `multiple` mode (always an array). */
  protected readonly selectedValues = computed<unknown[]>(() => {
    if (!this.multiple()) return [];
    const v = this.modelValue();
    return Array.isArray(v) ? v : [];
  });

  /** @ignore One row per selected value (label resolved from the pick-time cache first). */
  protected readonly tagRows = computed(() =>
    this.selectedValues().map((value, index) => {
      const label = this.labelOfSelected(value);
      return { value, index, label, removeAriaLabel: formatLabel(this.removeTagLabel(), label) };
    }),
  );

  /** @ignore Rows actually rendered as chips (`maxSelectedLabels` cap). */
  protected readonly visibleTagRows = computed(() => {
    const all = this.tagRows();
    const max = this.maxSelectedLabels();
    return max != null && max > 0 && all.length > max ? all.slice(0, max) : all;
  });

  /** @ignore Number of selected values collapsed behind the overflow chip. */
  protected readonly overflowCount = computed(() => this.tagRows().length - this.visibleTagRows().length);

  /** @ignore Rendered overflow chip label (e.g. `(+2 autres)`). */
  protected readonly overflowText = computed(() => formatLabel(this.overflowLabel(), this.overflowCount()));

  /** @ignore Contexts handed to the `#selectedItem` template (one per displayed value). */
  protected readonly selectedItemContexts = computed<AutocompleteSelectedItemContext<T>[]>(() =>
    this.visibleTagRows().map((tag) => ({
      $implicit: this.originalOfSelected(tag.value) as T,
      option: this.originalOfSelected(tag.value) as T,
      index: tag.index,
      remove: () => this.removeAt(tag.index),
    })),
  );

  /** @ignore Placeholder hidden as soon as values are selected (`multiple`). */
  protected readonly effectivePlaceholder = computed(() =>
    this.multiple() && this.selectedValues().length ? '' : (this.placeholder() ?? ''),
  );

  /** @ignore Chips are removable unless the field is disabled/readonly. */
  protected readonly canRemove = computed(() => !this.isDisabled() && !this.readonly());

  /** @ignore The empty-state row is rendered. */
  protected readonly showEmpty = computed(
    () => this.showEmptyMessage() && !this.loading() && !this.visibleRows().length,
  );

  /** @ignore id of the visually focused option (for aria-activedescendant). */
  protected readonly activeDescendant = computed(() => {
    if (!this.panelOpen()) return null;
    return this.visibleOptions()[this.focusedIndex()]?.id ?? null;
  });

  /** @ignore Below the input, flipping above when `autoFlip` and space is lacking. */
  protected readonly overlayPositions = computed(() => dropdownOverlayPositions(this.autoFlip()));

  /** @ignore Concrete viewport height (px) for the virtual scroller. */
  protected readonly viewportHeight = computed(() => {
    const rows = this.visibleRows().length || 1;
    const max = this.scrollHeightPx();
    return `${Math.min(rows * this.virtualScrollItemSize(), max)}px`;
  });

  /** @ignore `scrollHeight` parsed to px, with size-based defaults (matches the SCSS). */
  private readonly scrollHeightPx = computed(() => {
    const parsed = Number.parseFloat(this.scrollHeight() ?? '');
    if (!Number.isNaN(parsed) && parsed > 0) return parsed;
    return this.size() === 'small' ? 256 : 312;
  });

  // --- CVA -----------------------------------------------------------------

  override writeValue(value: AutocompleteValue<T>): void {
    if (this.multiple()) {
      const values = Array.isArray(value) ? value : [];
      this.modelValue.set(values as T[]);
      this.inputText.set('');
      this.seedSelectionCache(values);
      return;
    }
    this.modelValue.set(value);
    this.inputText.set(this.labelOfValue(value));
    // With `optionValue`, the label may be unresolvable until the parent
    // provides suggestions — remember to re-resolve it later.
    this.pendingLabelSync.set(
      value !== null && value !== undefined && this.entryOfValue(value) === undefined,
    );
  }

  /** @ignore Best-effort label seed for values written from the form, from the current suggestions. */
  private seedSelectionCache(values: unknown[]): void {
    const cache = this.selectionCache();
    const entries = this.flatEntries();
    const found = values
      .filter((v) => !cache.some((e) => this.equals(e.value, v)))
      .map((v) => entries.find((e) => this.equals(e.value, v)))
      .filter((e): e is AcEntry => !!e);
    if (found.length) this.selectionCache.set([...cache, ...found]);
  }

  /** Moves focus to the input. */
  focus(options?: FocusOptions): void {
    this.inputEl()?.nativeElement.focus(options);
  }

  // --- Panel open/close ----------------------------------------------------

  /** @ignore */
  private open(): void {
    if (this.isDisabled() || this.readonly() || this.panelOpen()) return;
    const origin =
      this.containerEl().nativeElement.querySelector('.ui-field-box') ?? this.containerEl().nativeElement;
    this.overlayOrigin.set(origin);
    this.overlayWidth.set(origin.getBoundingClientRect().width);
    this.focusedIndex.set(this.initialFocusIndex());
    this.panelOpen.set(true);
    this.opened.emit();
    // Scroll the focused option into view once the overlay is attached.
    // `setTimeout` (not rAF) so it also runs in throttled/background tabs.
    setTimeout(() => this.scrollFocusedIntoView());
  }

  /** @ignore */
  protected close(focusInput = true): void {
    if (!this.panelOpen()) return;
    this.panelOpen.set(false);
    this.focusedIndex.set(-1);
    this.queryDirty = false;
    this.closed.emit();
    if (focusInput) this.focus();
  }

  /** @ignore First visually focused option when the panel opens. */
  private initialFocusIndex(): number {
    if (!this.autoOptionFocus()) return -1;
    return this.visibleOptions().findIndex((o) => !o.entry.disabled);
  }

  // --- Input interactions --------------------------------------------------

  /** @ignore Typing: view → form (free text unless `forceSelection`) + debounced query. */
  protected onInput(event: Event): void {
    const query = (event.target as HTMLInputElement).value;
    this.inputText.set(query);
    // The user took over the text: stop any pending label re-resolution.
    this.pendingLabelSync.set(false);

    // Free-text value while typing; `forceSelection` waits for a real suggestion,
    // `multiple` never lets the query mutate the selection, and an emptied input
    // commits `null` (same normalization as `clear()`).
    if (!this.forceSelection() && !this.multiple())
      this.commit(query === '' ? null : (query as AutocompleteValue<T>));

    if (this.searchTimeout) clearTimeout(this.searchTimeout);

    if (query.length === 0) {
      if (!this.multiple()) this.cleared.emit();
      this.close(false);
      return;
    }

    if (query.length < this.minLength()) {
      this.close(false);
      return;
    }

    this.focusedIndex.set(-1);
    this.searchTimeout = setTimeout(() => this.runSearch(event, query), this.delay());
  }

  /** @ignore Emit a query and open the panel. */
  private runSearch(event: Event, query: string): void {
    this.queryDirty = true;
    this.completeMethod.emit({ originalEvent: event, query });
    this.open();
  }

  /** @ignore */
  protected onDropdownClick(event: MouseEvent): void {
    if (this.isDisabled() || this.readonly()) return;
    if (this.panelOpen()) {
      this.close();
      return;
    }
    // Mark the query as already handled *before* focusing: `focus()` fires a
    // synchronous `focus` event on the input, and `completeOnFocus` would
    // otherwise run its own `completeMethod` in addition to the one below —
    // a single dropdown click must only ever emit one query.
    this.queryDirty = true;
    this.focus();
    const query = this.inputText();
    this.runSearch(event, this.dropdownMode() === 'current' ? query : '');
    this.dropdownClick.emit({ originalEvent: event, query });
  }

  /** @ignore */
  protected onInputFocus(event: FocusEvent): void {
    if (this.isDisabled()) return;
    if (!this.queryDirty && this.completeOnFocus()) this.runSearch(event, this.inputText());
    this.inputFocus.emit(event);
  }

  /** @ignore Mark touched + `forceSelection` validation when focus leaves the component. */
  protected onInputBlur(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    const insideComponent = !!next && this.containerEl().nativeElement.contains(next);
    const insidePanel = !!next && this.panelEl()?.nativeElement.contains(next);
    if (!insideComponent && !insidePanel) {
      this.emitTouch();
      if (this.forceSelection()) this.validateForceSelection(event);
    }
    this.inputBlur.emit(event);
  }

  /**
   * @ignore `forceSelection`: keep the model in sync with a real suggestion.
   * The text is matched (case/diacritics-insensitive) against a known label;
   * on no match the field is reset so the model never holds free text.
   */
  private validateForceSelection(event: Event): void {
    const text = this.inputText().trim();
    if (!text) return;
    const match = this.flatEntries().find((e) => !e.disabled && this.normalize(e.label) === this.normalize(text));
    if (match) {
      this.selectEntry(match, event, false);
    } else if (this.multiple()) {
      // Never commit over the selection: just drop the invalid query.
      this.inputText.set('');
    } else {
      this.commit(null);
      this.inputText.set('');
      this.cleared.emit();
    }
  }

  /** @ignore Clear action (does not bubble to the input). */
  protected onClearClick(event: MouseEvent): void {
    event.stopPropagation();
    this.clear();
  }

  /** Clears the value. */
  clear(): void {
    if (this.multiple()) {
      this.commit([]);
      this.selectionCache.set([]);
    } else {
      this.commit(null);
    }
    this.inputText.set('');
    this.cleared.emit();
    this.close(false);
    this.focus();
  }

  // --- Keyboard --------------------------------------------------------------

  /** @ignore Keyboard on the input (combobox pattern). */
  protected onInputKeydown(event: KeyboardEvent): void {
    if (this.isDisabled() || this.readonly()) return;
    if (this.multiple() && this.selectedValues().length) {
      const input = event.target as HTMLInputElement;
      if (event.key === 'Backspace' && !this.inputText()) {
        this.removeAt(this.selectedValues().length - 1);
        return;
      }
      if (
        event.key === 'ArrowLeft' &&
        !this.selectedItemTemplate() &&
        input.selectionStart === 0 &&
        input.selectionEnd === 0
      ) {
        event.preventDefault();
        this.focusTag(this.visibleTagRows().length - 1);
        return;
      }
    }
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.panelOpen() ? this.moveFocus(1) : this.reopen();
        return;
      case 'ArrowUp':
        event.preventDefault();
        if (event.altKey) this.close();
        else if (this.panelOpen()) this.moveFocus(-1);
        else this.reopen();
        return;
      case 'Home':
        if (!this.panelOpen()) return;
        event.preventDefault();
        this.focusEdge(1);
        return;
      case 'End':
        if (!this.panelOpen()) return;
        event.preventDefault();
        this.focusEdge(-1);
        return;
      case 'Enter':
        if (!this.panelOpen()) return; // closed: native form submit
        event.preventDefault();
        this.selectFocused(event);
        return;
      case 'Escape':
        if (!this.panelOpen()) return;
        event.preventDefault();
        event.stopPropagation();
        this.close();
        return;
      case 'Tab':
        if (this.panelOpen()) this.close(false);
        return; // let the focus move on
      default:
        return;
    }
  }

  /** @ignore Re-open the panel with the current suggestions (no re-query). */
  private reopen(): void {
    if (!this.visibleRows().length) return;
    this.open();
    if (this.focusedIndex() === -1) this.moveFocus(1);
  }

  // --- Options interactions --------------------------------------------------

  /** @ignore */
  protected onOptionClick(row: Extract<AcRow, { kind: 'option' }>, event: Event): void {
    event.preventDefault();
    this.selectEntry(row.entry, event);
  }

  /** @ignore Keep the focus on the input when clicking an option. */
  protected onOptionMousedown(event: MouseEvent): void {
    event.preventDefault();
  }

  /** @ignore */
  protected onOptionMouseEnter(row: Extract<AcRow, { kind: 'option' }>): void {
    if (this.focusOnHover() && !row.entry.disabled) this.focusedIndex.set(row.index);
  }

  /** @ignore Pick a suggestion: set the value + display its label. */
  private selectEntry(entry: AcEntry, event: Event, closePanel = true): void {
    if (entry.disabled || this.readonly()) return;
    if (this.multiple()) {
      const alreadySelected = this.selectedValues().some((v) => this.equals(v, entry.value));
      if (!(this.unique() && alreadySelected)) {
        this.selectionCache.update((cache) => [...cache, entry]);
        this.commit([...this.selectedValues(), entry.value] as T[]);
        this.optionSelect.emit(entry.original as T);
      }
      // The query was just consumed: an open panel would show results for a
      // text the input no longer displays.
      this.inputText.set('');
      if (closePanel) this.close();
      return;
    }
    this.commit(entry.value as AutocompleteValue<T>);
    this.inputText.set(entry.label);
    this.optionSelect.emit(entry.original as T);
    if (closePanel) this.close();
  }

  /** @ignore */
  private selectFocused(event: Event): void {
    const row = this.visibleOptions()[this.focusedIndex()];
    if (row) this.selectEntry(row.entry, event);
    else this.close();
  }

  /** @ignore Propagate a user-driven value change (view → form). */
  private commit(value: AutocompleteValue<T>): void {
    this.pendingLabelSync.set(false);
    this.modelValue.set(value);
    this.emitChange(value);
    this.valueChange.emit(value);
  }

  // --- Visual focus ------------------------------------------------------------

  /** @ignore Move the visual focus, skipping disabled options (no wrap). */
  private moveFocus(delta: 1 | -1): void {
    const options = this.visibleOptions();
    if (!options.length) return;
    let i = this.focusedIndex();
    if (i === -1) i = delta === 1 ? -1 : options.length;
    for (i += delta; i >= 0 && i < options.length; i += delta) {
      if (!options[i].entry.disabled) {
        this.setFocusedIndex(i, null);
        return;
      }
    }
  }

  /** @ignore Focus the first (`1`) or last (`-1`) enabled option. */
  private focusEdge(direction: 1 | -1): void {
    const options = this.visibleOptions();
    const from = direction === 1 ? 0 : options.length - 1;
    for (let i = from; i >= 0 && i < options.length; i += direction) {
      if (!options[i].entry.disabled) {
        this.setFocusedIndex(i, null);
        return;
      }
    }
  }

  /** @ignore Apply a visual-focus move (+ select-on-focus, + scroll into view). */
  private setFocusedIndex(index: number, event: Event | null): void {
    this.focusedIndex.set(index);
    if (this.selectOnFocus()) {
      const row = this.visibleOptions()[index];
      if (row) this.selectEntry(row.entry, event ?? new Event('keydown'), false);
    }
    this.scrollFocusedIntoView();
  }

  /** @ignore Keep the visually focused option visible ('auto' — smooth is unreliable in throttled tabs). */
  private scrollFocusedIntoView(): void {
    const row = this.visibleOptions()[this.focusedIndex()];
    if (!row) return;
    const vp = this.viewport();
    if (vp) {
      const rowIndex = this.visibleRows().findIndex((r) => r.kind === 'option' && r.index === row.index);
      if (rowIndex !== -1) vp.scrollToIndex(Math.max(0, rowIndex - 1), 'auto');
      return;
    }
    this.panelEl()
      ?.nativeElement.querySelector(`[id="${row.id}"]`)
      ?.scrollIntoView({ block: 'nearest' });
  }

  // --- Option resolution ----------------------------------------------------------

  /** @ignore Label displayed for a model value (best-effort against the suggestions). */
  /** Remove the selected value at `index` (`multiple` mode). */
  removeAt(index: number): void {
    if (this.isDisabled() || this.readonly()) return;
    const values = this.selectedValues();
    if (index < 0 || index >= values.length) return;
    const value = values[index];
    const cached = this.selectionCache().find((e) => this.equals(e.value, value));
    this.commit(values.filter((_, i) => i !== index) as T[]);
    this.selectionCache.update((cache) => cache.filter((e) => !this.equals(e.value, value)));
    this.optionUnselect.emit((cached?.original ?? value) as T);
    // Keep the roving focus coherent after removal.
    const remaining = this.visibleTagRows().length;
    if (remaining === 0) this.focusInput();
    else this.focusTag(Math.min(index, remaining - 1));
  }

  /** @ignore Roving keyboard on a chip (`multiple` mode). */
  protected onTagKeydown(event: KeyboardEvent, index: number): void {
    if (this.isDisabled() || this.readonly()) return;
    switch (event.key) {
      case 'ArrowLeft':
        event.preventDefault();
        if (index > 0) this.focusTag(index - 1);
        return;
      case 'ArrowRight':
        event.preventDefault();
        if (index < this.visibleTagRows().length - 1) this.focusTag(index + 1);
        else this.focusInput();
        return;
      case 'Backspace':
      case 'Delete':
        event.preventDefault();
        this.removeAt(index);
        return;
      case 'Home':
        event.preventDefault();
        this.focusTag(0);
        return;
      case 'End':
        event.preventDefault();
        this.focusTag(this.visibleTagRows().length - 1);
        return;
      default:
        return;
    }
  }

  /** @ignore Clicking the box's empty area focuses the input. */
  protected onBoxMousedown(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (target.closest('button') || target.closest('.ui-autocomplete-tag') || target.closest('input')) return;
    event.preventDefault();
    this.focusInput();
  }

  /** @ignore Move the roving focus onto a chip. */
  private focusTag(index: number): void {
    this.focusedTag.set(index);
    setTimeout(() => this.tagEls()[index]?.nativeElement.focus());
  }

  /** @ignore Return the roving focus to the input. */
  private focusInput(): void {
    this.focusedTag.set(-1);
    this.focus();
  }

  /** @ignore Label of a selected value: pick-time cache first, then the current suggestions. */
  private labelOfSelected(value: unknown): string {
    const cached = this.selectionCache().find((e) => this.equals(e.value, value));
    return cached ? cached.label : this.labelOfValue(value as AutocompleteValue<T>);
  }

  /** @ignore Original suggestion of a selected value (pick-time cache first, else the raw value). */
  private originalOfSelected(value: unknown): unknown {
    return this.selectionCache().find((e) => this.equals(e.value, value))?.original ?? value;
  }

  private labelOfValue(value: AutocompleteValue<T>): string {
    if (value === null || value === undefined) return '';
    const entry = this.entryOfValue(value);
    if (entry) return entry.label;
    return this.resolveLabel(value) ?? this.asText(value) ?? '';
  }

  /** @ignore Suggestion entry matching a model value, if currently known. */
  private entryOfValue(value: AutocompleteValue<T>) {
    if (value === null || value === undefined) return undefined;
    return this.flatEntries().find((e) => this.equals(e.value, value));
  }

  /** @ignore Shared option resolution (see `option-resolver.ts`). */
  private readonly resolver = createOptionResolver({
    optionValue: this.optionValue,
    optionLabel: this.optionLabel,
    optionDisabled: this.optionDisabled,
    dataKey: this.dataKey,
  });

  /** @ignore */
  private toEntry(option: unknown): AcEntry {
    return this.resolver.toEntry(option);
  }

  /** @ignore Read a (dot-path) field from an object. */
  private getField(target: unknown, path: string | undefined): unknown {
    return this.resolver.getField(target, path);
  }

  /** @ignore */
  private resolveValue(option: unknown): unknown {
    return this.resolver.resolveValue(option);
  }

  /** @ignore */
  private resolveLabel(option: unknown): string | null {
    return this.resolver.resolveLabel(option);
  }

  /** @ignore */
  private asText(value: unknown): string | null {
    return this.resolver.asText(value);
  }

  /** @ignore Whether a resolved value is the current model value. */
  private isValueSelected(value: unknown): boolean {
    if (this.multiple()) return this.selectedValues().some((v) => this.equals(v, value));
    const current = this.modelValue();
    return current !== null && current !== undefined && this.equals(current, value);
  }

  /** @ignore Value equality — by `dataKey` for objects, strict otherwise. */
  private equals(a: unknown, b: unknown): boolean {
    return this.resolver.equals(a, b);
  }

  /** @ignore Case- and diacritics-insensitive comparison text. */
  private normalize(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  }
}
