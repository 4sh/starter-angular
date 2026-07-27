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
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { CdkVirtualScrollViewport, ScrollingModule } from '@angular/cdk/scrolling';
import { BaseFormField } from '@app/shared/components/ui/forms/base-form-field';
import { UiField } from '@app/shared/components/ui/forms/ui-field/ui-field';
import { UiIcon, UiIconSize } from '@app/shared/components/ui/ui-icon/ui-icon';
import { UiSpinner } from '@app/shared/components/ui/informative/ui-spinner/ui-spinner';
import { UiMotion } from '@app/shared/motion/ui-motion';

/** Model value: a single value, an array (`multiple`), or `null` when cleared. */
export type SelectValue<T = unknown> = T | T[] | null;

/** Context handed to the `#item` template. */
export interface SelectItemContext<T = unknown> {
  /** The original option (default `$implicit`). */
  $implicit: T;
  /** Same as `$implicit`, named for readability. */
  option: T;
  /** Whether this option is currently selected. */
  selected: boolean;
  /** Index of the option in the (filtered) list. */
  index: number;
}

/** Context handed to the `#selectedItem` template (once per selected option). */
export interface SelectSelectedItemContext<T = unknown> {
  /** The selected option (default `$implicit`). */
  $implicit: T;
  /** Same as `$implicit`, named for readability. */
  option: T;
  /** Index among the selected options (0 in single mode). */
  index: number;
  /** Deselects this option (e.g. wire it to a removable chip). */
  remove: () => void;
}

/** Context handed to the `#group` template. */
export interface SelectGroupContext<G = unknown> {
  /** The original group object (default `$implicit`). */
  $implicit: G;
  /** Same as `$implicit`, named for readability. */
  group: G;
}

/** Payload of the `filterChange` output. */
export interface SelectFilterEvent {
  /** Originating DOM event. */
  originalEvent: Event;
  /** Current filter text. */
  filter: string;
}

/** Payload of the `lazyLoad` output (rendered range of the virtual viewport). */
export interface SelectLazyLoadEvent {
  /** Index of the first rendered row. */
  first: number;
  /** Index after the last rendered row (exclusive). */
  last: number;
}

/** @ignore Flat, unfiltered view of one option (logic source). */
interface SelectEntry {
  value: unknown;
  label: string;
  disabled: boolean;
  original: unknown;
}

/** @ignore Unfiltered group of entries (when `group` is enabled). */
interface SelectGroupEntry {
  label: string;
  original: unknown;
  entries: SelectEntry[];
}

/** @ignore Rendered row: a group header or an option. */
type SelectRow =
  | { kind: 'group'; key: string; label: string; original: unknown }
  | { kind: 'option'; key: string; id: string; index: number; entry: SelectEntry; selected: boolean };

/**
 * ui-select — headless dropdown list built on the `ui-field` shell
 * (label + box + helper) with a token-styled options panel in a CDK overlay.
 *
 * The trigger is a native element following the WAI-ARIA combobox pattern
 * (`role="combobox"` + `aria-activedescendant`: focus never leaves the trigger
 * or the filter input, options are only visually focused). Supports primitive
 * or object options (`optionLabel` / `optionValue` / `optionDisabled`), grouped
 * options, single or `multiple` selection (checkmark / checkbox display),
 * built-in filtering, an `editable` free-text mode, `showClear`, `loading`, and
 * CDK virtual scrolling (plus lazy loading of huge lists) — all wired through
 * `ControlValueAccessor` on {@link BaseFormField} (shared label / helper /
 * level / validation / states).
 *
 * Customisation: the `#item`, `#selectedItem`, `#group`, `#header`, `#footer`
 * and `#empty` templates, `panelStyleClass`, and the local SCSS variables.
 *
 * @example
 * ```html
 * <ui-select label="Ville" [options]="cities" optionLabel="name" optionValue="code" [(ngModel)]="city" />
 * ```
 */
@Component({
  selector: 'ui-select',
  imports: [NgTemplateOutlet, OverlayModule, ScrollingModule, UiField, UiIcon, UiSpinner, UiMotion],
  templateUrl: './ui-select.html',
  styleUrl: './ui-select.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiSelect), multi: true }],
})
export class UiSelect<T = unknown> extends BaseFormField<SelectValue<T>> {
  /** Options to display. Primitives, objects, or groups (see `group`). */
  options = input<readonly unknown[]>([]);
  /** Field name (dot-path) to read a label from, when options are objects. */
  optionLabel = input<string>();
  /** Field name (dot-path) to read the value from, when options are objects. */
  optionValue = input<string>();
  /** Field name (dot-path) to read the disabled flag from, when options are objects. */
  optionDisabled = input<string>();
  /** Treat `options` as groups (`optionGroupLabel` + `optionGroupChildren`). */
  group = input(false, { transform: booleanAttribute });
  /** Field name of a group's label. */
  optionGroupLabel = input<string>('label');
  /** Field name of a group's children array. */
  optionGroupChildren = input<string>('items');
  /** Property used to compare object values for equality (selection matching). */
  dataKey = input<string>();

  /** Allow selecting several values (the model becomes an array, the panel stays open). */
  multiple = input(false, { transform: booleanAttribute });
  /** Display a check indicator on the selected option(s). */
  checkmark = input(false, { transform: booleanAttribute });
  /** Display a checkbox in front of each option (`multiple` mode). */
  checkbox = input(false, { transform: booleanAttribute });
  /** Max number of selected items rendered in the trigger (`multiple`); the rest collapses into `overflowLabel`. */
  maxSelectedLabels = input<number>();
  /** Collapsed-count indicator — `{0}` is replaced by the number of hidden items. */
  overflowLabel = input<string>('(+{0} autres)');

  /** Placeholder shown in the trigger when nothing is selected. */
  placeholder = input<string>();
  /** Show a clear (×) action in the trigger when a value is set. */
  showClear = input(false, { transform: booleanAttribute });
  /** Accessible name of the clear action. */
  clearAriaLabel = input<string>('Effacer la sélection');
  /** FontAwesome icon of the dropdown chevron. */
  icon = input<string>('angle-down');

  /** Show the built-in filter input inside the panel. */
  filter = input(false, { transform: booleanAttribute });
  /** Placeholder of the filter input. */
  filterPlaceholder = input<string>();
  /** Accessible name of the filter input. */
  filterAriaLabel = input<string>('Filtrer les options');
  /** Comma-separated field names (dot-paths) the filter matches against (defaults to the label). */
  filterBy = input<string>();
  /** Move the focus into the filter input when the panel opens. */
  autofocusFilter = input(true, { transform: booleanAttribute });
  /** Reset the filter text when the panel closes. */
  resetFilterOnHide = input(false, { transform: booleanAttribute });

  /** Message shown when there is no option. */
  emptyMessage = input<string>('Aucune option disponible');
  /** Message shown when the filter matches nothing. */
  emptyFilterMessage = input<string>('Aucun résultat');

  /** Free-text mode: the trigger becomes a real `<input>`, typing sets the value directly. */
  editable = input(false, { transform: booleanAttribute });
  /** Loading state: a spinner replaces the chevron and the options are not interactive. */
  loading = input(false, { transform: booleanAttribute });

  /** Visually focus the first option when the panel opens. */
  autoOptionFocus = input(false, { transform: booleanAttribute });
  /** Select an option as soon as it is visually focused with the keyboard (single mode). */
  selectOnFocus = input(false, { transform: booleanAttribute });
  /** Visually focus the option under the mouse pointer. */
  focusOnHover = input(true, { transform: booleanAttribute });

  /** Render the options through a CDK virtual-scroll viewport. */
  virtualScroll = input(false, { transform: booleanAttribute });
  /** Fixed height (px) of one row — required by the virtual scroller. */
  virtualScrollItemSize = input<number, unknown>(40, { transform: numberAttribute });
  /** With `virtualScroll`: emit `lazyLoad` with the rendered range (lazy loading). */
  lazy = input(false, { transform: booleanAttribute });
  /** Max height of the options list (CSS size, e.g. `'320px'`). Defaults from the SCSS. */
  scrollHeight = input<string>();

  /**
   * Auto-flip the panel above the trigger when there isn't enough room below
   * (default). Set `false` to lock it below the trigger regardless of space.
   */
  autoFlip = input(true, { transform: booleanAttribute });
  /** Extra class(es) applied to the panel (scoped custom styling). */
  panelStyleClass = input<string>();

  /** Emitted whenever the value changes (selection, typing, clear). */
  valueChange = output<SelectValue<T>>();
  /** Emitted when the panel opens. */
  opened = output<void>();
  /** Emitted when the panel closes. */
  closed = output<void>();
  /** Emitted when the value is cleared. */
  cleared = output<void>();
  /** Emitted on each filter keystroke. */
  filterChange = output<SelectFilterEvent>();
  /** Emitted when the virtual viewport's rendered range changes (`virtualScroll` + `lazy`). */
  lazyLoad = output<SelectLazyLoadEvent>();
  /** Emitted when the trigger receives focus. */
  inputFocus = output<FocusEvent>();
  /** Emitted when the trigger loses focus. */
  inputBlur = output<FocusEvent>();

  /** Custom option template: `<ng-template #item let-option let-selected="selected">`. */
  protected readonly itemTemplate = contentChild<TemplateRef<SelectItemContext<T>>>('item');
  /** Custom selected-value template (per selected option): `<ng-template #selectedItem let-option>`. */
  protected readonly selectedItemTemplate = contentChild<TemplateRef<SelectSelectedItemContext<T>>>('selectedItem');
  /** Custom group-header template: `<ng-template #group let-group>`. */
  protected readonly groupTemplate = contentChild<TemplateRef<SelectGroupContext>>('group');
  /** Free content pinned above the list (before the filter). */
  protected readonly headerTemplate = contentChild<TemplateRef<unknown>>('header');
  /** Free content pinned under the list. */
  protected readonly footerTemplate = contentChild<TemplateRef<unknown>>('footer');
  /** Custom empty-state template. */
  protected readonly emptyTemplate = contentChild<TemplateRef<unknown>>('empty');

  /** @ignore Component root (overlay origin + outside-focus detection). */
  private readonly containerEl = viewChild.required<ElementRef<HTMLElement>>('container');
  /** @ignore Focusable trigger (combobox button or editable input). */
  private readonly triggerEl = viewChild<ElementRef<HTMLElement>>('trigger');
  /** @ignore Panel root element (for scrolling the focused option into view). */
  private readonly panelEl = viewChild<ElementRef<HTMLElement>>('panel');
  /** @ignore Filter input (auto-focused on open). */
  private readonly filterInputEl = viewChild<ElementRef<HTMLInputElement>>('filterInput');
  /** @ignore Virtual-scroll viewport (lazy range + scrollToIndex). */
  private readonly viewport = viewChild(CdkVirtualScrollViewport);

  /** @ignore */
  protected readonly panelOpen = signal(false);
  /** @ignore Element the overlay is anchored to (the field box). */
  protected readonly overlayOrigin = signal<Element | null>(null);
  /** @ignore Panel width, locked to the field box width on open. */
  protected readonly overlayWidth = signal<number | null>(null);
  /** @ignore Current filter text. */
  protected readonly filterValue = signal('');
  /** @ignore Raw text typed in the editable trigger (`null` when not typing) — filters the list. */
  protected readonly editableQuery = signal<string | null>(null);
  /** @ignore Index of the visually focused option among the visible options (-1 = none). */
  protected readonly focusedIndex = signal(-1);
  /** @ignore Type-ahead buffer. */
  private searchBuffer = '';
  /** @ignore */
  private searchTimeout: ReturnType<typeof setTimeout> | undefined;

  constructor() {
    super();

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
          console.warn('[ui-select] Champ sans nom accessible : renseignez `label`, `ariaLabel` ou `ariaLabelledBy`.');
        }
        if (this.editable() && this.multiple()) {
          console.warn('[ui-select] `editable` est ignoré en mode `multiple` (saisie libre mono-valeur uniquement).');
        }
        if (this.checkbox() && !this.multiple()) {
          console.warn('[ui-select] `checkbox` est prévu pour le mode `multiple` (une case par option).');
        }
      });
    }
  }

  // --- Derived state -----------------------------------------------------

  /** @ignore Effective free-text mode (`multiple` wins over `editable`). */
  protected readonly isEditable = computed(() => this.editable() && !this.multiple());
  /** @ignore */
  protected readonly listboxId = computed(() => `${this.resolvedId()}-list`);
  /** @ignore Icon size aligned with the field size. */
  protected readonly iconSize = computed<UiIconSize>(() => (this.size() === 'small' ? 'sm' : 'md'));

  /** @ignore Flat, unfiltered entries (no groups). */
  private readonly flatEntries = computed<SelectEntry[]>(() => {
    if (this.group()) return this.groupEntries().flatMap((g) => g.entries);
    return (this.options() ?? []).map((option) => this.toEntry(option));
  });

  /** @ignore Unfiltered groups (when `group` is enabled). */
  private readonly groupEntries = computed<SelectGroupEntry[]>(() => {
    if (!this.group()) return [];
    return (this.options() ?? []).map((groupOption) => {
      const children = this.getField(groupOption, this.optionGroupChildren());
      return {
        label: this.asText(this.getField(groupOption, this.optionGroupLabel())) ?? '',
        original: groupOption,
        entries: (Array.isArray(children) ? children : []).map((option) => this.toEntry(option)),
      };
    });
  });

  /** @ignore Normalized filter text ('' = no filtering). */
  private readonly normalizedFilter = computed(() => this.normalize(this.filterValue().trim()));

  /** @ignore Normalized editable-typing text ('' = no filtering). */
  private readonly normalizedEditableQuery = computed(() => {
    const query = this.editableQuery();
    return this.isEditable() && query ? this.normalize(query.trim()) : '';
  });

  /** @ignore Rendered rows: filtered options + their group headers, with stable ids. */
  protected readonly visibleRows = computed<SelectRow[]>(() => {
    const rows: SelectRow[] = [];
    let index = 0;
    const pushOption = (entry: SelectEntry): void => {
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
        const entries = g.entries.filter((e) => this.matchesFilter(e));
        if (!entries.length) return;
        rows.push({ kind: 'group', key: `${this.listboxId()}-group-${gi}`, label: g.label, original: g.original });
        entries.forEach(pushOption);
      });
    } else {
      this.flatEntries().filter((e) => this.matchesFilter(e)).forEach(pushOption);
    }
    return rows;
  });

  /** @ignore Visible option rows only (visual-focus / type-ahead space). */
  protected readonly visibleOptions = computed(() =>
    this.visibleRows().filter((r): r is Extract<SelectRow, { kind: 'option' }> => r.kind === 'option'),
  );

  /** @ignore aria-setsize of the visible listbox. */
  protected readonly optionCount = computed(() => this.visibleOptions().length);

  /** @ignore trackBy of the virtual list. */
  protected readonly trackRow = (_: number, row: SelectRow): string => row.key;

  /** @ignore Empty state: no option at all, or nothing matches the filter / typed text. */
  protected readonly emptyLabel = computed(() =>
    this.normalizedFilter() || this.normalizedEditableQuery() ? this.emptyFilterMessage() : this.emptyMessage(),
  );

  /** @ignore Selected values as an array (whatever the mode). */
  private readonly selectedValues = computed<unknown[]>(() => {
    const v = this.modelValue();
    if (v === null || v === undefined) return [];
    return this.multiple() ? (Array.isArray(v) ? v : []) : [v];
  });

  /** @ignore Selected options resolved against the (unfiltered) entries. Falls back to the raw value. */
  protected readonly selectedEntries = computed<SelectEntry[]>(() =>
    this.selectedValues().map(
      (value) =>
        this.flatEntries().find((e) => this.equals(e.value, value)) ?? {
          value,
          label: this.asText(value) ?? '',
          disabled: false,
          original: value,
        },
    ),
  );

  /** @ignore A value is currently set. */
  protected readonly hasValue = computed(() => {
    if (this.multiple()) return this.selectedValues().length > 0;
    const v = this.modelValue();
    return v !== null && v !== undefined && v !== '';
  });

  /** @ignore Selected entries actually rendered in the trigger (`maxSelectedLabels` cap). */
  protected readonly displayedSelectedEntries = computed<SelectEntry[]>(() => {
    const all = this.selectedEntries();
    const max = this.maxSelectedLabels();
    return this.multiple() && max != null && max > 0 && all.length > max ? all.slice(0, max) : all;
  });

  /** @ignore Number of selected items collapsed behind the overflow indicator. */
  protected readonly overflowCount = computed(
    () => this.selectedEntries().length - this.displayedSelectedEntries().length,
  );

  /** @ignore Rendered overflow indicator (e.g. `(+2 autres)`). */
  protected readonly overflowText = computed(() =>
    this.overflowLabel().replace('{0}', String(this.overflowCount())),
  );

  /** @ignore Contexts handed to the `#selectedItem` template (one per displayed selection). */
  protected readonly selectedItemContexts = computed<SelectSelectedItemContext<T>[]>(() =>
    this.displayedSelectedEntries().map((entry, index) => ({
      $implicit: entry.original as T,
      option: entry.original as T,
      index,
      remove: () => this.removeValue(entry.value),
    })),
  );

  /** @ignore Text rendered in the trigger (and in the editable input). */
  protected readonly selectedLabel = computed(() => {
    const shown = this.displayedSelectedEntries().map((e) => e.label).join(', ');
    return this.overflowCount() > 0 ? `${shown} ${this.overflowText()}` : shown;
  });

  /** @ignore The clear action is shown. */
  protected readonly showClearButton = computed(
    () => this.showClear() && this.hasValue() && !this.isDisabled() && !this.readonly(),
  );

  /** @ignore id of the visually focused option (for aria-activedescendant). */
  protected readonly activeDescendant = computed(() => {
    if (!this.panelOpen()) return null;
    return this.visibleOptions()[this.focusedIndex()]?.id ?? null;
  });

  /** @ignore Below the trigger, flipping above when `autoFlip` and space is lacking. */
  protected readonly overlayPositions = computed<ConnectedPosition[]>(() => {
    const below: ConnectedPosition = { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 8 };
    const above: ConnectedPosition = { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -8 };
    return this.autoFlip() ? [below, above] : [below];
  });

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

  override writeValue(value: SelectValue<T>): void {
    this.modelValue.set(value);
  }

  /** Moves focus to the trigger. */
  focus(options?: FocusOptions): void {
    this.triggerEl()?.nativeElement.focus(options);
  }

  // --- Panel open/close ----------------------------------------------------

  open(): void {
    if (this.isDisabled() || this.readonly() || this.panelOpen()) return;
    const origin =
      this.containerEl().nativeElement.querySelector('.ui-field-box') ?? this.containerEl().nativeElement;
    this.overlayOrigin.set(origin);
    this.overlayWidth.set(origin.getBoundingClientRect().width);
    this.focusedIndex.set(this.initialFocusIndex());
    this.panelOpen.set(true);
    this.opened.emit();
    this.queueAfterOpen();
  }

  close(focusTrigger = true): void {
    if (!this.panelOpen()) return;
    this.panelOpen.set(false);
    this.clearSearchBuffer();
    this.editableQuery.set(null);
    if (this.resetFilterOnHide()) this.filterValue.set('');
    this.emitTouch();
    this.closed.emit();
    if (focusTrigger) this.focus();
  }

  /** @ignore */
  protected toggle(): void {
    this.panelOpen() ? this.close() : this.open();
  }

  /** @ignore First visually focused option when the panel opens. */
  private initialFocusIndex(): number {
    const options = this.visibleOptions();
    const selected = options.findIndex((o) => o.selected && !o.entry.disabled);
    if (selected !== -1) return selected;
    if (this.autoOptionFocus()) return options.findIndex((o) => !o.entry.disabled);
    return -1;
  }

  /**
   * @ignore Post-open work once the overlay is attached: focus the filter,
   * scroll the focused option into view (the virtual viewport is re-measured
   * by its own effect). `setTimeout` (not rAF) so it also runs in
   * throttled/background tabs.
   */
  private queueAfterOpen(): void {
    setTimeout(() => {
      // Never steal the focus from the editable input while the user types.
      if (this.filter() && this.autofocusFilter() && !this.isEditable()) this.filterInputEl()?.nativeElement.focus();
      this.scrollFocusedIntoView();
    });
  }

  // --- Trigger interactions --------------------------------------------------

  /** @ignore Container click: open (button mode) or toggle from the chevron (editable mode). */
  protected onContainerClick(event: MouseEvent): void {
    if (this.isDisabled() || this.readonly()) return;
    const target = event.target as HTMLElement;
    // Inner actions (clear, chip remove buttons in `#selectedItem`…) handle themselves.
    if (target.closest('button') && !target.closest('.ui-select-trigger')) return;
    if (this.isEditable()) {
      if (target.closest('.ui-select-chevron')) this.toggle();
      return;
    }
    this.open();
  }

  /** @ignore Clear action (does not bubble to the container, which would re-open). */
  protected onClearClick(event: MouseEvent): void {
    event.stopPropagation();
    this.clear();
  }

  /** Clears the value. */
  clear(): void {
    this.commit(null);
    this.cleared.emit();
    this.focus();
  }

  /**
   * @ignore Editable mode: typing sets the value directly (view → form) and
   * surfaces the matching options (the panel opens and filters as you type).
   */
  protected onEditableInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.editableQuery.set(value);
    this.commit(value as SelectValue<T>);
    if (!this.panelOpen()) this.open();
    // Re-anchor the visual focus on the first matching option.
    this.focusedIndex.set(this.visibleOptions().findIndex((o) => !o.entry.disabled));
  }

  /** Deselects one value (`multiple`) or clears the value (single). */
  removeValue(value: unknown): void {
    if (this.isDisabled() || this.readonly()) return;
    if (!this.multiple()) {
      this.commit(null);
      return;
    }
    const current = (this.selectedValues() as T[]).filter((v) => !this.equals(v, value));
    this.commit(current as SelectValue<T>);
  }

  /** @ignore */
  protected onTriggerFocus(event: FocusEvent): void {
    this.inputFocus.emit(event);
  }

  /** @ignore Mark touched when focus leaves the component (trigger → outside, not into the panel). */
  protected onTriggerBlur(event: FocusEvent): void {
    const next = event.relatedTarget as Node | null;
    if (!next || !this.panelEl()?.nativeElement.contains(next)) this.emitTouch();
    this.inputBlur.emit(event);
  }

  /** @ignore Keyboard on the trigger (combobox pattern). */
  protected onTriggerKeydown(event: KeyboardEvent): void {
    if (this.isDisabled() || this.readonly()) return;

    // Multiple: Backspace deselects the last selected item (chip-removal keyboard path).
    if (event.key === 'Backspace' && !this.isEditable() && this.multiple() && this.hasValue()) {
      event.preventDefault();
      const values = this.selectedValues();
      this.removeValue(values[values.length - 1]);
      return;
    }

    if (this.handleNavigationKey(event)) return;

    // Type-ahead (button trigger only — the editable input types for real).
    if (!this.isEditable() && event.key.length === 1 && !event.ctrlKey && !event.metaKey && !event.altKey) {
      event.preventDefault();
      if (!this.panelOpen()) this.open();
      this.searchOption(event.key);
    }
  }

  /** @ignore Keyboard inside the filter input (navigation delegated, typing kept native). */
  protected onFilterKeydown(event: KeyboardEvent): void {
    if (event.key === 'Home' || event.key === 'End') return; // keep caret moves native
    this.handleNavigationKey(event);
  }

  /**
   * @ignore Shared open/navigate/select/close keys. Returns true when handled.
   * Focus stays on the trigger / filter input; options are focused visually
   * through `aria-activedescendant`.
   */
  private handleNavigationKey(event: KeyboardEvent): boolean {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        if (!this.panelOpen()) {
          this.open();
          if (this.focusedIndex() === -1) this.moveFocus(1);
        } else {
          this.moveFocus(1);
        }
        return true;
      case 'ArrowUp':
        event.preventDefault();
        if (event.altKey) {
          this.close();
        } else if (!this.panelOpen()) {
          this.open();
          if (this.focusedIndex() === -1) this.moveFocus(-1);
        } else {
          this.moveFocus(-1);
        }
        return true;
      case 'Home':
      case 'End':
        if (!this.panelOpen()) return false;
        event.preventDefault();
        this.focusEdge(event.key === 'Home' ? 1 : -1);
        return true;
      case 'Enter':
        if (!this.panelOpen()) return false; // closed: native click (button) / form submit (input)
        event.preventDefault();
        this.selectFocused();
        return true;
      case ' ':
        if (this.isEditable() || (this.filter() && event.target === this.filterInputEl()?.nativeElement)) {
          return false; // space types in the inputs
        }
        if (!this.panelOpen()) return false; // closed button: native click opens
        event.preventDefault();
        this.selectFocused();
        return true;
      case 'Escape':
        if (!this.panelOpen()) return false;
        event.preventDefault();
        event.stopPropagation();
        this.close();
        return true;
      case 'Tab':
        if (this.panelOpen()) this.close(false);
        return false; // let the focus move on
      default:
        return false;
    }
  }

  // --- Options interactions --------------------------------------------------

  /** @ignore */
  protected onOptionClick(row: Extract<SelectRow, { kind: 'option' }>, event: Event): void {
    event.preventDefault();
    if (this.loading()) return;
    this.selectRow(row);
  }

  /** @ignore Keep the focus on the trigger / filter input when clicking an option. */
  protected onOptionMousedown(event: MouseEvent): void {
    event.preventDefault();
  }

  /** @ignore */
  protected onOptionMouseEnter(row: Extract<SelectRow, { kind: 'option' }>): void {
    if (this.focusOnHover() && !row.entry.disabled) this.focusedIndex.set(row.index);
  }

  /** @ignore Select (single) or toggle (multiple) an option. */
  private selectRow(row: Extract<SelectRow, { kind: 'option' }>, keepOpen = false): void {
    if (row.entry.disabled || this.readonly()) return;
    this.focusedIndex.set(row.index);
    this.editableQuery.set(null); // picking an option ends the typing session (display shows the label)

    if (this.multiple()) {
      const current = [...(this.selectedValues() as T[])];
      const at = current.findIndex((v) => this.equals(v, row.entry.value));
      if (at !== -1) current.splice(at, 1);
      else current.push(row.entry.value as T);
      this.commit(current);
      return; // multiple: the panel stays open
    }

    this.commit(row.entry.value as SelectValue<T>);
    if (!keepOpen) this.close();
  }

  /** @ignore */
  private selectFocused(): void {
    const row = this.visibleOptions()[this.focusedIndex()];
    if (row) this.selectRow(row);
    else if (!this.multiple()) this.close();
  }

  /** @ignore Propagate a user-driven value change (view → form). */
  private commit(value: SelectValue<T>): void {
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
        this.setFocusedIndex(i);
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
        this.setFocusedIndex(i);
        return;
      }
    }
  }

  /** @ignore Apply a visual-focus move (+ select-on-focus, + scroll into view). */
  private setFocusedIndex(index: number): void {
    this.focusedIndex.set(index);
    if (this.selectOnFocus() && !this.multiple()) {
      const row = this.visibleOptions()[index];
      if (row) this.selectRow(row, true);
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

  // --- Type-ahead ---------------------------------------------------------------

  /** @ignore Accumulate printable characters and focus the first matching option. */
  private searchOption(char: string): void {
    this.searchBuffer += char.toLowerCase();
    if (this.searchTimeout) clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => this.clearSearchBuffer(), 500);

    const options = this.visibleOptions();
    if (!options.length) return;
    const needle = this.normalize(this.searchBuffer);
    // Restart the scan below the focused option only for a fresh (1-char) search.
    const from = this.searchBuffer.length === 1 ? this.focusedIndex() + 1 : Math.max(0, this.focusedIndex());
    for (let k = 0; k < options.length; k++) {
      const i = (from + k) % options.length;
      const option = options[i];
      if (!option.entry.disabled && this.normalize(option.entry.label).startsWith(needle)) {
        this.setFocusedIndex(i);
        return;
      }
    }
  }

  /** @ignore */
  private clearSearchBuffer(): void {
    this.searchBuffer = '';
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
      this.searchTimeout = undefined;
    }
  }

  // --- Filter -------------------------------------------------------------------

  /** @ignore */
  protected onFilterInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.filterValue.set(value);
    this.filterChange.emit({ originalEvent: event, filter: value });
    // Re-anchor the visual focus on the first matching option.
    const first = this.visibleOptions().findIndex((o) => !o.entry.disabled);
    this.focusedIndex.set(first);
  }

  /** @ignore An entry passes the current filter(s): panel filter and/or editable typing. */
  private matchesFilter(entry: SelectEntry): boolean {
    const needles = [this.normalizedFilter(), this.normalizedEditableQuery()].filter(Boolean);
    if (!needles.length) return true;
    const fields = this.filterBy()
      ?.split(',')
      .map((f) => f.trim())
      .filter(Boolean);
    const haystacks = fields?.length
      ? fields.map((f) => this.asText(this.getField(entry.original, f)) ?? '')
      : [entry.label];
    return needles.every((needle) => haystacks.some((text) => this.normalize(text).includes(needle)));
  }

  /** @ignore Case- and diacritics-insensitive comparison text. */
  private normalize(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '');
  }

  // --- Option resolution ----------------------------------------------------------

  /** @ignore */
  private toEntry(option: unknown): SelectEntry {
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

  /** @ignore Read a (dot-path) field from an object. */
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

  /** @ignore Whether a resolved value is part of the current model. */
  private isValueSelected(value: unknown): boolean {
    return this.selectedValues().some((v) => this.equals(v, value));
  }

  /** @ignore Value equality — by `dataKey` for objects, strict otherwise. */
  private equals(a: unknown, b: unknown): boolean {
    const key = this.dataKey();
    if (key && this.isObject(a) && this.isObject(b)) return a[key] === b[key];
    return a === b;
  }
}
