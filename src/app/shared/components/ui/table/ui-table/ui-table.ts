import {
  afterNextRender,
  afterRenderEffect,
  booleanAttribute,
  Component,
  computed,
  contentChild,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  isDevMode,
  linkedSignal,
  model,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  viewChild,
  ViewEncapsulation,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiCheckbox } from '@app/shared/components/ui/forms/ui-checkbox/ui-checkbox';
import { UiRadio } from '@app/shared/components/ui/forms/ui-radio/ui-radio';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';
import { UiEmptyState } from '@app/shared/components/ui/informative/ui-empty-state/ui-empty-state';
import { UiSpinner } from '@app/shared/components/ui/informative/ui-spinner/ui-spinner';
import { UiPaginator, UiPaginatorPageEvent } from '@app/shared/components/ui/table/ui-paginator/ui-paginator';

/** Cell padding density. */
export type TableSize = 'default' | 'small' | 'large';
/** Row selection behavior (null = no selection). */
export type TableSelectionMode = 'single' | 'multiple' | null;
/** Sorting behavior: one column at a time, or several (Ctrl/Cmd + click). */
export type TableSortMode = 'single' | 'multiple';
/** Edge a frozen column sticks to. */
export type TableFrozenAlign = 'left' | 'right';

/** One (field, direction) pair of a multiple sort. */
export interface UiTableSortMeta {
  field: string;
  /** 1 = ascending, -1 = descending. */
  order: number;
}

/** Payload of `sortFunction` (emitted when `customSort` is enabled). */
export interface UiTableSortEvent<T = unknown> {
  /** The data array to sort in place. */
  data: T[];
  mode: TableSortMode;
  field?: string;
  order?: number;
  multiSortMeta?: UiTableSortMeta[];
}

/** Payload of `rowSelect` / `rowUnselect`. */
export interface UiTableRowSelectEvent<T = unknown> {
  originalEvent?: Event;
  data: T;
  index?: number;
  /** Interaction that triggered the (un)selection. */
  type: 'row' | 'checkbox' | 'radio';
}

/** Payload of `headerCheckboxToggle`. */
export interface UiTableHeaderCheckboxToggleEvent {
  originalEvent?: Event;
  checked: boolean;
}

/** Payload of `pageChange` (same shape as the standalone `ui-paginator`). */
export type UiTablePageEvent = UiPaginatorPageEvent;

/** Payload of `rowReorder` (drag & drop). */
export interface UiTableRowReorderEvent<T = unknown> {
  dragIndex: number;
  dropIndex: number;
  /** Reordered copy of `value` — rebind it to the table. */
  value: T[];
}

/** Payload of `lazyLoad` (virtual scroll in lazy mode). */
export interface UiTableLazyLoadEvent {
  /** Index of the first row of the rendered window. */
  first: number;
  /** Index right after the last rendered row. */
  last: number;
}

/** Payload of `rowExpand` / `rowCollapse`. */
export interface UiTableRowExpandEvent<T = unknown> {
  originalEvent?: Event;
  data: T;
}

/** Payload of `colResize`. */
export interface UiTableColResizeEvent {
  /** The resized header cell. */
  element: HTMLElement;
  /** Applied horizontal delta in px. */
  delta: number;
}

/** Context handed to the `#body` (and frozen body) row template. */
export interface UiTableBodyContext<T = unknown> {
  $implicit: T;
  /** Absolute row index in the (sorted) dataset. */
  rowIndex: number;
  /** Even position within the rendered page (for manual striping needs). */
  even: boolean;
  selected: boolean;
  expanded: boolean;
  /** True when the row comes from `frozenValue`. */
  frozen: boolean;
}

/** Reads a (possibly dotted) field path on a row object. */
function resolveFieldData(data: unknown, field: string): unknown {
  if (data == null) return null;
  if (!field.includes('.')) return (data as Record<string, unknown>)[field];
  let value: unknown = data;
  for (const part of field.split('.')) {
    if (value == null) return null;
    value = (value as Record<string, unknown>)[part];
  }
  return value;
}

/** Null-safe, locale-aware comparison shared by the sort pipeline. */
function compareValues(a: unknown, b: unknown): number {
  if (a == null && b == null) return 0;
  if (a == null) return -1;
  if (b == null) return 1;
  if (typeof a === 'string' && typeof b === 'string') return a.localeCompare(b);
  const na = a as number | Date;
  const nb = b as number | Date;
  return na < nb ? -1 : na > nb ? 1 : 0;
}

/** Minimum width a column can be resized down to (px). */
const COLUMN_MIN_WIDTH = 64;

let nextUid = 0;

/**
 * ui-table — headless data table.
 *
 * The consumer owns the markup of the rows (`#header` / `#body` / `#footer`
 * templates rendering real `<tr>/<th>/<td>`); the component owns the data
 * pipeline (sort → pagination), the selection / expansion state, the scroll
 * shell and the paginator. Column-level behaviors are opt-in via the
 * companion directives (`uiSortableColumn`, `uiSelectableRow`,
 * `uiFrozenColumn`, `uiResizableColumn`, `uiRowToggler`) and sub-components
 * (`ui-table-sort-icon`, `ui-table-checkbox`, `ui-table-header-checkbox`,
 * `ui-table-radio`).
 *
 * Styles are global (`ViewEncapsulation.None`, everything nested under
 * `.ui-table`) because the row markup is projected from the consumer and
 * would not match emulated-encapsulation selectors.
 */
@Component({
  selector: 'ui-table',
  imports: [NgTemplateOutlet, UiPaginator, UiEmptyState, UiSpinner],
  templateUrl: './ui-table.html',
  styleUrl: './ui-table.scss',
  encapsulation: ViewEncapsulation.None,
})
export class UiTable<T = unknown> {
  /** Rows to display. */
  value = input<T[]>([]);
  /** Property (dotted path allowed) uniquely identifying a row — required for expansion, recommended for selection. */
  dataKey = input<string>();
  /** Cell padding density. */
  size = input<TableSize>('default');
  /** Displays borders between cells. */
  showGridlines = input(false, { transform: booleanAttribute });
  /** Alternates the background of even rows. */
  stripedRows = input(false, { transform: booleanAttribute });
  /** Highlights the hovered row (implicit when a selection mode is active). */
  rowHover = input(false, { transform: booleanAttribute });
  /** Inline styles applied to the inner `<table>` (e.g. `{'min-width': '60rem'}` for horizontal scroll). */
  tableStyle = input<Record<string, string>>();

  // --- Selection --------------------------------------------------------
  /** Row selection behavior. `single` keeps one row, `multiple` an array. */
  selectionMode = input<TableSelectionMode>(null);
  /** Selected row (single) or rows (multiple). Two-way bindable. */
  selection = model<T | T[] | null>(null);
  /** Desktop-like selection: plain click replaces, Ctrl/Cmd+click toggles, Shift+click ranges. */
  metaKeySelection = input(false, { transform: booleanAttribute });

  // --- Sort ---------------------------------------------------------------
  /** One column at a time, or several with Ctrl/Cmd + click. */
  sortMode = input<TableSortMode>('single');
  /** Initial sorted field (presort). */
  sortField = input<string>();
  /** Initial sort direction (1 asc, -1 desc). */
  sortOrder = input(1, { transform: numberAttribute });
  /** Initial multiple-sort state (presort, `sortMode="multiple"`). */
  multiSortMeta = input<UiTableSortMeta[]>();
  /** Direction applied when a column becomes sorted. */
  defaultSortOrder = input(1, { transform: numberAttribute });
  /** Delegates sorting: the table stops sorting itself and emits `sortFunction`. */
  customSort = input(false, { transform: booleanAttribute });

  // --- Pagination ---------------------------------------------------------
  /** Splits rows into pages and renders the paginator bar. */
  paginator = input(false, { transform: booleanAttribute });
  /** Rows per page. */
  rows = input(10, { transform: numberAttribute });
  /** Index of the first displayed row. Two-way bindable (programmatic pagination). */
  first = model(0);
  /** Choices offered in the rows-per-page select (omit to hide it). */
  rowsPerPageOptions = input<number[]>();
  /** Maximum number of page-number buttons. */
  pageLinks = input(5, { transform: numberAttribute });

  // --- Scroll -------------------------------------------------------------
  /** Enables the scroll shell (sticky header inside the scrollable viewport). */
  scrollable = input(false, { transform: booleanAttribute });
  /** Viewport height: a CSS size (e.g. `'400px'`) or `'flex'` to fill the flex parent. */
  scrollHeight = input<string>();

  // --- Frozen rows ----------------------------------------------------------
  /** Rows pinned above the body while scrolling. */
  frozenValue = input<T[]>();

  // --- Expansion ------------------------------------------------------------
  /** Expanded rows, keyed by `dataKey` value. Two-way bindable. */
  expandedRowKeys = model<Record<string, boolean>>({});

  // --- Column resize ----------------------------------------------------------
  /** Enables column resizing (fit mode: the next column absorbs the delta). */
  resizableColumns = input(false, { transform: booleanAttribute });

  // --- Loading -------------------------------------------------------------------
  /** Displays a mask + spinner over the table while data is being fetched. */
  loading = input(false, { transform: booleanAttribute });
  /** Accessible name of the loading indicator. */
  loadingAriaLabel = input<string>('Chargement des données');

  // --- Empty state ------------------------------------------------------------------
  /** Title of the default empty state (rendered with `ui-empty-state`; `#emptymessage` overrides it). */
  emptyMessage = input<string>('Aucune donnée à afficher');
  /** Icon of the default empty state. */
  emptyIcon = input<string>('inbox');

  // --- Virtual scroll ------------------------------------------------------------------
  /** Windows the rendered rows to the visible viewport (requires `scrollable` + a fixed `scrollHeight`). */
  virtualScroll = input(false, { transform: booleanAttribute });
  /** Fixed row height in px (also apply it to the `<tr>` of the body template). */
  virtualScrollItemSize = input(50, { transform: numberAttribute });
  /** Lazy mode: rows are fetched on demand — `lazyLoad` emits the rendered range. */
  lazy = input(false, { transform: booleanAttribute });

  /** Emitted when a row becomes selected. */
  rowSelect = output<UiTableRowSelectEvent<T>>();
  /** Emitted when a row becomes unselected. */
  rowUnselect = output<UiTableRowSelectEvent<T>>();
  /** Emitted when the header select-all checkbox is toggled. */
  headerCheckboxToggle = output<UiTableHeaderCheckboxToggleEvent>();
  /** Emitted instead of sorting internally when `customSort` is enabled. */
  sortFunction = output<UiTableSortEvent<T>>();
  /** Emitted on any pagination change (navigation or rows-per-page). */
  pageChange = output<UiTablePageEvent>();
  /** Emitted when a row expands. */
  rowExpand = output<UiTableRowExpandEvent<T>>();
  /** Emitted when a row collapses. */
  rowCollapse = output<UiTableRowExpandEvent<T>>();
  /** Emitted after a column resize. */
  colResize = output<UiTableColResizeEvent>();
  /** Emitted after a row drag & drop, with the reordered copy of `value`. */
  rowReorder = output<UiTableRowReorderEvent<T>>();
  /** Emitted when the virtual-scroll window changes (lazy mode). */
  lazyLoad = output<UiTableLazyLoadEvent>();

  // --- Templates (projected) -------------------------------------------------
  /** @ignore Free content rendered above the table. */
  protected readonly captionTemplate = contentChild<TemplateRef<unknown>>('caption');
  /** @ignore `<tr>` of header cells. */
  protected readonly headerTemplate = contentChild<TemplateRef<unknown>>('header');
  /** @ignore Row template (context: row, rowIndex, even, selected, expanded, frozen). */
  protected readonly bodyTemplate = contentChild<TemplateRef<UiTableBodyContext<T>>>('body');
  /** @ignore `<tr>` of footer cells. */
  protected readonly footerTemplate = contentChild<TemplateRef<unknown>>('footer');
  /** @ignore Extra `<tr>` rendered under an expanded row. */
  protected readonly expandedRowTemplate = contentChild<TemplateRef<UiTableBodyContext<T>>>('expandedrow');
  /** @ignore Content of the "no rows" cell. */
  protected readonly emptyMessageTemplate = contentChild<TemplateRef<unknown>>('emptymessage');

  /** @ignore */
  private readonly tableEl = viewChild<ElementRef<HTMLTableElement>>('tableEl');
  /** @ignore */
  private readonly theadEl = viewChild<ElementRef<HTMLTableSectionElement>>('theadEl');
  /** @ignore */
  private readonly wrapperEl = viewChild<ElementRef<HTMLDivElement>>('wrapperEl');

  /** @ignore Scroll position of the wrapper (drives the virtual window). */
  private readonly wrapperScrollTop = signal(0);
  /** @ignore Measured height of the scroll viewport. */
  private readonly wrapperHeight = signal(0);
  /** @ignore Row index currently dragged (row reorder). */
  draggedRowIndex: number | null = null;

  /** @ignore Selectable-row directives currently rendered, by host element (keyboard range selection). */
  readonly selectableRowRefs = new Map<Element, { data: T; index: number }>();

  /** @ignore Shift-selection anchor (absolute row index). */
  private anchorRowIndex: number | null = null;

  /** @ignore */
  private readonly uid = `ui-table-${nextUid++}`;
  /** @ignore */
  private readonly destroyRef = inject(DestroyRef);

  // --- Internal state (linked to the presort / pagination inputs) -----------
  /** @ignore Active single sort; reset when the `sortField`/`sortOrder` inputs change. */
  readonly sortState = linkedSignal<{ field: string; order: number } | null>(() => {
    const field = this.sortField();
    return field ? { field, order: this.sortOrder() } : null;
  });
  /** @ignore Active multiple sort. */
  readonly multiSortState = linkedSignal<UiTableSortMeta[]>(() => this.multiSortMeta() ?? []);
  /** @ignore Effective rows-per-page (user can change it via the paginator select). */
  protected readonly rowsState = linkedSignal(() => this.rows());
  /** @ignore Number of header cells (drives the colspan of the empty row). */
  protected readonly columnCount = signal(1);
  /** @ignore Measured header height (sticky offset of frozen rows). */
  protected readonly frozenRowsTop = signal(0);

  constructor() {
    if (isDevMode()) {
      effect(() => {
        if (Object.keys(this.expandedRowKeys()).length && !this.dataKey()) {
          console.warn('[ui-table] `expandedRowKeys` nécessite `dataKey` pour identifier les lignes.');
        }
        if (this.virtualScroll() && (!this.scrollable() || !this.scrollHeight() || this.scrollHeight() === 'flex')) {
          console.warn('[ui-table] `virtualScroll` nécessite `scrollable` et un `scrollHeight` fixe.');
        }
      });
    }

    // Lazy virtual scroll: notify the consumer whenever the window moves.
    let lastLazyRange: UiTableLazyLoadEvent | null = null;
    effect(() => {
      if (!this.virtualScroll() || !this.lazy()) return;
      const { start, end } = this.virtualRange();
      if (lastLazyRange?.first === start && lastLazyRange?.last === end) return;
      lastLazyRange = { first: start, last: end };
      this.lazyLoad.emit(lastLazyRange);
    });

    // Measured DOM facts: column count (empty-row colspan) + header height
    // (sticky offset of the frozen rows). Reads happen after each render so
    // template-driven changes (columns, size…) are picked up.
    afterRenderEffect(() => {
      this.value();
      this.size();
      this.headerTemplate();
      this.frozenValue();
      this.measureStickyMetrics();
      const wrapper = this.wrapperEl()?.nativeElement;
      if (wrapper) this.wrapperHeight.set(wrapper.clientHeight);
    });

    // Late layout shifts (font loading, column resize…) move the sticky
    // offsets without any signal change: re-measure when the table resizes.
    afterNextRender(() => {
      if (typeof ResizeObserver === 'undefined') return;
      const table = this.tableEl()?.nativeElement;
      const wrapper = this.wrapperEl()?.nativeElement;
      const observer = new ResizeObserver(() => {
        this.measureStickyMetrics();
        if (wrapper) this.wrapperHeight.set(wrapper.clientHeight);
      });
      if (table) observer.observe(table);
      if (wrapper) observer.observe(wrapper);
      this.destroyRef.onDestroy(() => observer.disconnect());
    });
  }

  /** @ignore Measures the header height + stacks the frozen-row sticky offsets. */
  private measureStickyMetrics(): void {
    const thead = this.theadEl()?.nativeElement;
    if (!thead) return;
    const cells = thead.querySelectorAll('th').length;
    if (cells > 0) this.columnCount.set(cells);
    const headerHeight = thead.getBoundingClientRect().height;
    this.frozenRowsTop.set(Math.floor(headerHeight));
    const frozenBody = thead.parentElement?.querySelector<HTMLTableSectionElement>('tbody._frozen-rows');
    if (!frozenBody) return;
    // Each frozen row sticks below the previous one (heights are unaffected
    // by the sticky shift, unlike offsetTop). Offsets accumulate fractional
    // heights and are FLOORED: rounding up would open a sub-pixel gap where
    // the scrolled content shows through between two stuck rows — flooring
    // makes rows overlap the previous one by <1px instead (invisible).
    let offset = headerHeight;
    for (const row of Array.from(frozenBody.rows)) {
      for (const cell of Array.from(row.cells)) cell.style.top = `${Math.floor(offset)}px`;
      offset += row.getBoundingClientRect().height;
    }
  }

  // --- Data pipeline ---------------------------------------------------------
  /** @ignore Sorted dataset (identity when `customSort` delegates sorting). */
  readonly processedData = computed<T[]>(() => {
    const data = this.value() ?? [];
    if (!data.length || this.customSort()) return data;
    if (this.sortMode() === 'single') {
      const sort = this.sortState();
      if (!sort) return data;
      return [...data].sort(
        (a, b) => sort.order * compareValues(resolveFieldData(a, sort.field), resolveFieldData(b, sort.field)),
      );
    }
    const metas = this.multiSortState();
    if (!metas.length) return data;
    return [...data].sort((a, b) => {
      for (const meta of metas) {
        const result = meta.order * compareValues(resolveFieldData(a, meta.field), resolveFieldData(b, meta.field));
        if (result !== 0) return result;
      }
      return 0;
    });
  });

  /** @ignore Total row count after processing. */
  protected readonly totalRecords = computed(() => this.processedData().length);
  /** @ignore */
  protected readonly pageCount = computed(() =>
    Math.max(1, Math.ceil(this.totalRecords() / Math.max(1, this.rowsState()))),
  );
  /** @ignore `first` clamped to the dataset (data may shrink under the cursor). */
  protected readonly clampedFirst = computed(() => {
    const rows = Math.max(1, this.rowsState());
    const maxFirst = (this.pageCount() - 1) * rows;
    return Math.min(Math.max(0, this.first()), maxFirst);
  });
  /** @ignore Rendered window of the virtual scroll (with a small buffer). */
  protected readonly virtualRange = computed(() => {
    const total = this.processedData().length;
    if (!this.virtualScroll()) return { start: 0, end: total };
    const itemSize = Math.max(1, this.virtualScrollItemSize());
    const buffer = 5;
    const start = Math.max(0, Math.floor(this.wrapperScrollTop() / itemSize) - buffer);
    const visible = Math.ceil(Math.max(0, this.wrapperHeight()) / itemSize) + 2 * buffer;
    return { start, end: Math.min(total, start + visible) };
  });
  /** @ignore Heights of the spacer rows keeping the scrollbar honest (virtual scroll). */
  protected readonly virtualPadding = computed(() => {
    if (!this.virtualScroll()) return { top: 0, bottom: 0 };
    const itemSize = Math.max(1, this.virtualScrollItemSize());
    const { start, end } = this.virtualRange();
    return { top: start * itemSize, bottom: (this.processedData().length - end) * itemSize };
  });
  /** @ignore Absolute index of the first rendered row. */
  protected readonly pageOffset = computed(() => {
    if (this.virtualScroll()) return this.virtualRange().start;
    return this.paginator() ? this.clampedFirst() : 0;
  });
  /** @ignore Rows actually rendered (page, virtual window, or whole dataset). */
  protected readonly pageData = computed<T[]>(() => {
    const data = this.processedData();
    if (this.virtualScroll()) {
      const { start, end } = this.virtualRange();
      return data.slice(start, end);
    }
    if (!this.paginator()) return data;
    const start = this.clampedFirst();
    return data.slice(start, start + this.rowsState());
  });

  /** @ignore */
  protected readonly isFlexScroll = computed(() => this.scrollable() && this.scrollHeight() === 'flex');
  /** @ignore Viewport max-height (fixed scrollHeight mode only). */
  protected readonly scrollMaxHeight = computed(() => {
    const height = this.scrollHeight();
    return this.scrollable() && height && height !== 'flex' ? height : null;
  });

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-table'];
    if (this.size() !== 'default') c.push(`_${this.size()}`);
    if (this.showGridlines()) c.push('_gridlines');
    if (this.stripedRows()) c.push('_striped');
    if (this.rowHover() || this.selectionMode()) c.push('_hoverable');
    if (this.scrollable()) c.push('_scrollable');
    if (this.isFlexScroll()) c.push('_flex-scroll');
    if (this.resizableColumns()) c.push('_resizable');
    if (this.virtualScroll()) c.push('_virtual');
    return c.join(' ');
  });

  /** @ignore Template context of a body row. */
  protected rowContext(row: T, pageIndex: number, frozen = false): UiTableBodyContext<T> {
    return {
      $implicit: row,
      rowIndex: frozen ? pageIndex : this.pageOffset() + pageIndex,
      even: pageIndex % 2 === 1,
      selected: this.isSelected(row),
      expanded: this.isRowExpanded(row),
      frozen,
    };
  }

  // --- Sort --------------------------------------------------------------------
  /** Current direction of a column: 1, -1, or 0 when unsorted. */
  getSortOrder(field: string): number {
    if (this.sortMode() === 'single') {
      const sort = this.sortState();
      return sort?.field === field ? sort.order : 0;
    }
    return this.multiSortState().find((m) => m.field === field)?.order ?? 0;
  }

  /** @ignore Cycles the sort of a column (called by `uiSortableColumn`). */
  toggleColumnSort(field: string, originalEvent: Event): void {
    const defaultOrder = this.defaultSortOrder() || 1;
    if (this.sortMode() === 'single') {
      const current = this.sortState();
      if (current?.field === field) {
        // asc → desc → unsorted cycle.
        this.sortState.set(current.order === defaultOrder ? { field, order: -defaultOrder } : null);
      } else {
        this.sortState.set({ field, order: defaultOrder });
      }
    } else {
      const metas = [...this.multiSortState()];
      const index = metas.findIndex((m) => m.field === field);
      const metaKey = originalEvent instanceof MouseEvent && (originalEvent.metaKey || originalEvent.ctrlKey);
      if (!metaKey) {
        // Plain click: restart a fresh sort on this column alone.
        const existing = index >= 0 ? metas[index] : undefined;
        this.multiSortState.set([{ field, order: existing ? -existing.order : defaultOrder }]);
      } else if (index >= 0) {
        metas[index] = { field, order: -metas[index].order };
        this.multiSortState.set(metas);
      } else {
        this.multiSortState.set([...metas, { field, order: defaultOrder }]);
      }
    }

    if (this.customSort()) {
      const single = this.sortState();
      this.sortFunction.emit({
        data: this.value() ?? [],
        mode: this.sortMode(),
        field: this.sortMode() === 'single' ? single?.field : undefined,
        order: this.sortMode() === 'single' ? (single?.order ?? 0) : undefined,
        multiSortMeta: this.sortMode() === 'multiple' ? this.multiSortState() : undefined,
      });
    }
    if (this.paginator()) this.first.set(0);
  }

  // --- Selection ------------------------------------------------------------------
  /** @ignore Row equality: by `dataKey` when provided, by reference otherwise. */
  private rowEquals(a: T, b: T): boolean {
    const key = this.dataKey();
    return key ? resolveFieldData(a, key) === resolveFieldData(b, key) : a === b;
  }

  /** @ignore Selection normalized as an array. */
  readonly selectionArray = computed<T[]>(() => {
    const sel = this.selection();
    if (sel == null) return [];
    return Array.isArray(sel) ? sel : [sel];
  });

  /** True when the row is part of the current selection. */
  isSelected(row: T): boolean {
    return this.selectionArray().some((s) => this.rowEquals(s, row));
  }

  /** @ignore Every processed row is selected (header checkbox state). */
  readonly allSelected = computed(() => {
    const data = this.processedData();
    if (!data.length) return false;
    const selection = this.selectionArray();
    return data.every((row) => selection.some((s) => this.rowEquals(s, row)));
  });
  /** @ignore Partial selection (header checkbox indeterminate state). */
  readonly partiallySelected = computed(() => !this.allSelected() && this.selectionArray().length > 0);

  /** @ignore Row click / Enter / Space (called by `uiSelectableRow`). */
  handleRowClick(originalEvent: Event, data: T, index: number): void {
    const mode = this.selectionMode();
    if (!mode) return;
    // Clicks on interactive descendants (buttons, links, form controls…)
    // belong to those controls, not to the row selection.
    const target = originalEvent.target as HTMLElement | null;
    if (target?.closest('button, a, input, label, select, textarea')) return;

    const pointer = originalEvent instanceof MouseEvent ? originalEvent : null;
    if (mode === 'multiple' && pointer?.shiftKey && this.anchorRowIndex != null) {
      this.selectRange(originalEvent, index);
      return;
    }

    const selected = this.isSelected(data);
    const metaKey = !!pointer && (pointer.metaKey || pointer.ctrlKey);

    if (this.metaKeySelection()) {
      if (selected && metaKey) {
        this.unselectRow(originalEvent, data, index, 'row');
      } else if (mode === 'single') {
        this.selection.set(data);
        this.rowSelect.emit({ originalEvent, data, index, type: 'row' });
      } else {
        this.selection.set(metaKey ? [...this.selectionArray(), data] : [data]);
        this.rowSelect.emit({ originalEvent, data, index, type: 'row' });
      }
    } else if (selected) {
      this.unselectRow(originalEvent, data, index, 'row');
    } else if (mode === 'single') {
      this.selection.set(data);
      this.rowSelect.emit({ originalEvent, data, index, type: 'row' });
    } else {
      this.selection.set([...this.selectionArray(), data]);
      this.rowSelect.emit({ originalEvent, data, index, type: 'row' });
    }
    this.anchorRowIndex = index;
  }

  /** @ignore Shift+click / Shift+Arrow range selection (replaces the selection). */
  selectRange(originalEvent: Event, index: number): void {
    if (this.anchorRowIndex == null) this.anchorRowIndex = index;
    const start = Math.min(this.anchorRowIndex, index);
    const end = Math.max(this.anchorRowIndex, index);
    const range = this.processedData().slice(start, end + 1);
    this.selection.set([...range]);
    for (const [offset, data] of range.entries()) {
      this.rowSelect.emit({ originalEvent, data, index: start + offset, type: 'row' });
    }
  }

  /** @ignore Checkbox-column toggle (called by `ui-table-checkbox`). */
  toggleRowWithCheckbox(originalEvent: Event | undefined, data: T, index?: number): void {
    if (this.isSelected(data)) {
      this.selection.set(this.selectionArray().filter((s) => !this.rowEquals(s, data)));
      this.rowUnselect.emit({ originalEvent, data, index, type: 'checkbox' });
    } else {
      this.selection.set([...this.selectionArray(), data]);
      this.rowSelect.emit({ originalEvent, data, index, type: 'checkbox' });
    }
    this.anchorRowIndex = index ?? null;
  }

  /** @ignore Header checkbox toggle: selects / clears every processed row. */
  toggleAllRows(originalEvent: Event | undefined, checked: boolean): void {
    this.selection.set(checked ? [...this.processedData()] : []);
    this.headerCheckboxToggle.emit({ originalEvent, checked });
  }

  /** @ignore Radio-column selection (called by `ui-table-radio`). */
  selectRowWithRadio(originalEvent: Event | undefined, data: T, index?: number): void {
    if (this.isSelected(data)) return;
    this.selection.set(data);
    this.rowSelect.emit({ originalEvent, data, index, type: 'radio' });
    this.anchorRowIndex = index ?? null;
  }

  /** @ignore */
  private unselectRow(originalEvent: Event, data: T, index: number, type: 'row'): void {
    const mode = this.selectionMode();
    if (mode === 'single') this.selection.set(null);
    else this.selection.set(this.selectionArray().filter((s) => !this.rowEquals(s, data)));
    this.rowUnselect.emit({ originalEvent, data, index, type });
  }

  // --- Expansion ----------------------------------------------------------------------
  /** @ignore Key of a row for the expansion map. */
  rowKey(data: T): string | undefined {
    const key = this.dataKey();
    if (!key) {
      if (isDevMode()) console.warn('[ui-table] L’expansion de ligne nécessite `dataKey`.');
      return undefined;
    }
    return String(resolveFieldData(data, key));
  }

  /** True when the row is expanded. */
  isRowExpanded(data: T): boolean {
    const key = this.dataKey();
    if (!key) return false;
    return !!this.expandedRowKeys()[String(resolveFieldData(data, key))];
  }

  /** Toggles the expansion of a row (used by `uiRowToggler`). */
  toggleRow(data: T, originalEvent?: Event): void {
    const key = this.rowKey(data);
    if (key === undefined) return;
    const keys = { ...this.expandedRowKeys() };
    if (keys[key]) {
      delete keys[key];
      this.expandedRowKeys.set(keys);
      this.rowCollapse.emit({ originalEvent, data });
    } else {
      keys[key] = true;
      this.expandedRowKeys.set(keys);
      this.rowExpand.emit({ originalEvent, data });
    }
  }

  // --- Pagination (delegated to the standalone ui-paginator) ------------------------------
  /** @ignore Rows-per-page picked in the paginator select. */
  protected onPaginatorRows(rows: number): void {
    this.rowsState.set(rows);
  }

  // --- Row reorder (drag & drop) -----------------------------------------------------------
  /** @ignore Drop of a dragged row: emits the reordered copy of `value`. */
  dropRow(dropIndex: number): void {
    const dragIndex = this.draggedRowIndex;
    this.draggedRowIndex = null;
    if (dragIndex == null || dragIndex === dropIndex) return;
    const value = [...(this.value() ?? [])];
    if (dragIndex < 0 || dragIndex >= value.length || dropIndex < 0 || dropIndex >= value.length) return;
    const [moved] = value.splice(dragIndex, 1);
    value.splice(dropIndex, 0, moved);
    this.rowReorder.emit({ dragIndex, dropIndex, value });
  }

  // --- Virtual scroll -------------------------------------------------------------------------
  /** @ignore */
  protected onWrapperScroll(): void {
    if (!this.virtualScroll()) return;
    const wrapper = this.wrapperEl()?.nativeElement;
    if (wrapper) this.wrapperScrollTop.set(wrapper.scrollTop);
  }

  // --- Keyboard selection helpers ---------------------------------------------------------------
  /** @ignore Row receiving the tab stop (first selected row on the page, else the first row). */
  private readonly tabbableRow = computed<T | undefined>(() => {
    const page = this.pageData();
    return page.find((row) => this.isSelected(row)) ?? page[0];
  });

  /** @ignore Roving tabindex: only one row is tabbable (WAI-ARIA grid-like navigation). */
  isRowTabbable(data: T): boolean {
    const tabbable = this.tabbableRow();
    return tabbable !== undefined && this.rowEquals(tabbable, data);
  }

  /** @ignore Selects every processed row (Ctrl+A). */
  selectAllRows(originalEvent: Event): void {
    if (this.selectionMode() !== 'multiple') return;
    this.selection.set([...this.processedData()]);
    this.headerCheckboxToggle.emit({ originalEvent, checked: true });
  }

  /** @ignore Selects from a row to the first / last processed row (Ctrl+Shift+Home / End). */
  selectRangeToEdge(index: number, edge: 'start' | 'end'): void {
    if (this.selectionMode() !== 'multiple') return;
    const data = this.processedData();
    const range = edge === 'start' ? data.slice(0, index + 1) : data.slice(index);
    this.selection.set([...range]);
    this.anchorRowIndex = index;
  }

  // --- Column resize (fit mode) -------------------------------------------------------------
  /** @ignore Freezes every column width in px so the drag only moves the shared edge. */
  lockColumnWidths(): void {
    const table = this.tableEl()?.nativeElement;
    if (!table) return;
    const headerRow = table.querySelector('thead tr');
    if (!headerRow) return;
    // Measure everything BEFORE mutating: setting a width relayouts the table.
    const tableWidth = table.getBoundingClientRect().width;
    const cells = Array.from(headerRow.children) as HTMLElement[];
    const widths = cells.map((cell) => cell.getBoundingClientRect().width);
    cells.forEach((cell, i) => (cell.style.width = `${widths[i]}px`));
    table.style.tableLayout = 'fixed';
    table.style.width = `${tableWidth}px`;
  }

  /** @ignore Fit-mode resize: the delta moves the edge between `cell` and its next sibling. */
  resizeColumnFit(cell: HTMLElement, startWidth: number, nextStartWidth: number, delta: number): boolean {
    const next = cell.nextElementSibling as HTMLElement | null;
    if (!next) return false;
    const width = startWidth + delta;
    const nextWidth = nextStartWidth - delta;
    if (width < COLUMN_MIN_WIDTH || nextWidth < COLUMN_MIN_WIDTH) return false;
    cell.style.width = `${width}px`;
    next.style.width = `${nextWidth}px`;
    return true;
  }

  /** @ignore Forwarded from the resize directive once the drag ends. */
  notifyColResize(element: HTMLElement, delta: number): void {
    this.colResize.emit({ element, delta });
  }

  /** @ignore Stable id base for internal controls. */
  protected readonly idBase = this.uid;
}

/**
 * uiSortableColumn — makes a `<th>` sortable.
 *
 * Click / Enter / Space cycles ascending → descending → unsorted (single
 * mode) or composes with Ctrl/Cmd in multiple mode. Exposes `aria-sort`.
 */
@Directive({
  selector: '[uiSortableColumn]',
  host: {
    class: 'ui-table-sortable-column',
    '[class._sorted]': 'sorted()',
    '[attr.tabindex]': 'disabled() ? null : 0',
    '[attr.role]': '"columnheader"',
    '[attr.aria-sort]': 'ariaSort()',
    '(click)': 'onTrigger($event)',
    '(keydown.enter)': 'onTrigger($event)',
    '(keydown.space)': 'onTrigger($event)',
  },
})
export class UiTableSortableColumn {
  /** @ignore */
  private readonly table = inject(UiTable);

  /** Field (dotted path allowed) this column sorts on. */
  field = input.required<string>({ alias: 'uiSortableColumn' });
  /** Disables the sort interaction. */
  disabled = input(false, { transform: booleanAttribute, alias: 'uiSortableColumnDisabled' });

  /** @ignore */
  protected readonly sorted = computed(() => this.table.getSortOrder(this.field()) !== 0);
  /** @ignore */
  protected readonly ariaSort = computed(() => {
    const order = this.table.getSortOrder(this.field());
    return order === 0 ? 'none' : order > 0 ? 'ascending' : 'descending';
  });

  /** @ignore */
  protected onTrigger(event: Event): void {
    if (this.disabled()) return;
    event.preventDefault();
    this.table.toggleColumnSort(this.field(), event);
  }
}

/**
 * ui-table-sort-icon — direction indicator of a sortable column.
 * Decorative: the accessible state lives on the `<th>` (`aria-sort`).
 */
@Component({
  selector: 'ui-table-sort-icon',
  imports: [UiIcon],
  template: `<ui-icon class="ui-table-sort-icon" [name]="iconName()" size="sm" />`,
})
export class UiTableSortIcon {
  /** @ignore */
  private readonly table = inject(UiTable);

  /** Field of the column this icon reflects. */
  field = input.required<string>();

  /** @ignore */
  protected readonly iconName = computed(() => {
    const order = this.table.getSortOrder(this.field());
    return order === 0 ? 'sort' : order > 0 ? 'sort-up' : 'sort-down';
  });
}

/**
 * uiSelectableRow — makes a `<tr>` selectable.
 *
 * Click selects (composing with Ctrl/Cmd / Shift according to
 * `metaKeySelection`); Arrow Up/Down moves the focus between rows, Space /
 * Enter toggles, Shift+Arrow extends the range.
 */
@Directive({
  selector: '[uiSelectableRow]',
  host: {
    class: 'ui-table-selectable-row',
    '[class._selected]': 'selected()',
    '[attr.tabindex]': 'tabindex()',
    '[attr.aria-selected]': 'selected()',
    '(click)': 'onClick($event)',
    '(keydown)': 'onKeydown($event)',
  },
})
export class UiTableSelectableRow<T = unknown> {
  /** @ignore */
  private readonly table = inject<UiTable<T>>(UiTable);
  /** @ignore */
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Row data carried by this `<tr>`. */
  data = input.required<T>({ alias: 'uiSelectableRow' });
  /** Absolute row index (from the body template context). */
  index = input(0, { transform: numberAttribute, alias: 'uiSelectableRowIndex' });
  /** Disables the selection interaction. */
  disabled = input(false, { transform: booleanAttribute, alias: 'uiSelectableRowDisabled' });

  /** @ignore */
  protected readonly selected = computed(() => this.table.isSelected(this.data()));
  /** @ignore Roving tabindex: a single row carries the tab stop. */
  protected readonly tabindex = computed(() => {
    if (this.disabled()) return null;
    return this.table.isRowTabbable(this.data()) ? 0 : -1;
  });

  constructor() {
    // Registry lookup used by Shift+Arrow (the moving row must resolve the
    // data/index of its target sibling).
    effect(() => {
      this.table.selectableRowRefs.set(this.el.nativeElement, { data: this.data(), index: this.index() });
    });
    inject(DestroyRef).onDestroy(() => this.table.selectableRowRefs.delete(this.el.nativeElement));
  }

  /** @ignore */
  protected onClick(event: MouseEvent): void {
    if (this.disabled()) return;
    this.table.handleRowClick(event, this.data(), this.index());
  }

  /** @ignore */
  protected onKeydown(event: KeyboardEvent): void {
    if (this.disabled()) return;
    const meta = event.metaKey || event.ctrlKey;
    switch (event.key) {
      case 'ArrowDown':
      case 'ArrowUp': {
        event.preventDefault();
        const target = this.findSiblingRow(event.key === 'ArrowDown' ? 'next' : 'previous');
        if (!target) return;
        target.focus();
        if (event.shiftKey) {
          const ref = this.table.selectableRowRefs.get(target);
          if (ref) this.table.selectRange(event, ref.index);
        }
        break;
      }
      case 'Home':
      case 'End': {
        event.preventDefault();
        const edge = event.key === 'Home' ? 'start' : 'end';
        this.findEdgeRow(edge)?.focus();
        if (meta && event.shiftKey) this.table.selectRangeToEdge(this.index(), edge);
        break;
      }
      case 'Enter': {
        event.preventDefault();
        this.table.handleRowClick(event, this.data(), this.index());
        break;
      }
      case ' ': {
        event.preventDefault();
        // Shift+Space selects the range from the last anchor to this row.
        if (event.shiftKey) this.table.selectRange(event, this.index());
        else this.table.handleRowClick(event, this.data(), this.index());
        break;
      }
      case 'a':
      case 'A': {
        if (!meta) return;
        event.preventDefault();
        this.table.selectAllRows(event);
        break;
      }
    }
  }

  /** @ignore Nearest selectable `<tr>` sibling (skips expansion rows). */
  private findSiblingRow(direction: 'next' | 'previous'): HTMLElement | null {
    let el: Element | null = this.el.nativeElement;
    while ((el = direction === 'next' ? el.nextElementSibling : el.previousElementSibling)) {
      if (el.classList.contains('ui-table-selectable-row')) return el as HTMLElement;
    }
    return null;
  }

  /** @ignore First / last selectable row of the table. */
  private findEdgeRow(edge: 'start' | 'end'): HTMLElement | null {
    const rows = this.el.nativeElement.closest('table')?.querySelectorAll<HTMLElement>('.ui-table-selectable-row');
    if (!rows?.length) return null;
    return edge === 'start' ? rows[0] : rows[rows.length - 1];
  }
}

/**
 * ui-table-checkbox — row checkbox of a checkbox-based multiple selection.
 * Instantiates `ui-checkbox` bound to the table selection.
 */
@Component({
  selector: 'ui-table-checkbox',
  imports: [UiCheckbox, FormsModule],
  template: `
    <ui-checkbox
      [ngModel]="checked()"
      [disabled]="disabled()"
      [ariaLabel]="ariaLabel()"
      (checkboxChange)="onToggle($event)"
    />
  `,
})
export class UiTableCheckbox<T = unknown> {
  /** @ignore */
  private readonly table = inject<UiTable<T>>(UiTable);

  /** Row this checkbox (un)selects. */
  value = input.required<T>();
  /** Absolute row index (forwarded to the selection events). */
  index = input<number, unknown>(undefined, { transform: (v) => (v == null ? undefined : Number(v)) });
  /** Disables the checkbox. */
  disabled = input(false, { transform: booleanAttribute });
  /** Accessible name of the checkbox. */
  ariaLabel = input<string>('Sélectionner la ligne');

  /** @ignore */
  protected readonly checked = computed(() => this.table.isSelected(this.value()));

  /** @ignore */
  protected onToggle(_checked: unknown): void {
    this.table.toggleRowWithCheckbox(undefined, this.value(), this.index());
  }
}

/**
 * ui-table-header-checkbox — header select-all checkbox (checkbox selection).
 * Checked when every row is selected, indeterminate on partial selection.
 */
@Component({
  selector: 'ui-table-header-checkbox',
  imports: [UiCheckbox, FormsModule],
  template: `
    <ui-checkbox
      [ngModel]="table.allSelected()"
      [indeterminate]="table.partiallySelected()"
      [disabled]="disabled()"
      [ariaLabel]="ariaLabel()"
      (checkboxChange)="onToggle($event)"
    />
  `,
})
export class UiTableHeaderCheckbox<T = unknown> {
  /** @ignore */
  protected readonly table = inject<UiTable<T>>(UiTable);

  /** Disables the checkbox. */
  disabled = input(false, { transform: booleanAttribute });
  /** Accessible name of the checkbox. */
  ariaLabel = input<string>('Tout sélectionner');

  /** @ignore */
  protected onToggle(checked: unknown): void {
    this.table.toggleAllRows(undefined, checked === true);
  }
}

/**
 * ui-table-radio — row radio button of a radio-based single selection.
 * Instantiates `ui-radio` bound to the table selection.
 */
@Component({
  selector: 'ui-table-radio',
  imports: [UiRadio, FormsModule],
  template: `
    <ui-radio
      [value]="value()"
      [ngModel]="table.isSelected(value()) ? value() : undefined"
      [name]="name()"
      [disabled]="disabled()"
      [ariaLabel]="ariaLabel()"
      (radioChange)="onSelect()"
    />
  `,
})
export class UiTableRadio<T = unknown> {
  /** @ignore */
  protected readonly table = inject<UiTable<T>>(UiTable);

  /** Row this radio selects. */
  value = input.required<T>();
  /** Absolute row index (forwarded to the selection events). */
  index = input<number, unknown>(undefined, { transform: (v) => (v == null ? undefined : Number(v)) });
  /** Native group name (defaults to a per-table group). */
  name = input<string>('ui-table-radio');
  /** Disables the radio. */
  disabled = input(false, { transform: booleanAttribute });
  /** Accessible name of the radio. */
  ariaLabel = input<string>('Sélectionner la ligne');

  /** @ignore */
  protected onSelect(): void {
    this.table.selectRowWithRadio(undefined, this.value(), this.index());
  }
}

/**
 * uiRowToggler — toggles the expansion of a row. Place it on the expand
 * button (native `<button>` or `ui-button`); `aria-expanded` is reflected.
 */
@Directive({
  selector: '[uiRowToggler]',
  host: {
    '[attr.aria-expanded]': 'expanded()',
    '(click)': 'onToggle($event)',
  },
})
export class UiTableRowToggler<T = unknown> {
  /** @ignore */
  private readonly table = inject<UiTable<T>>(UiTable);

  /** Row whose expansion this button toggles. */
  data = input.required<T>({ alias: 'uiRowToggler' });

  /** @ignore */
  protected readonly expanded = computed(() => this.table.isRowExpanded(this.data()));

  /** @ignore */
  protected onToggle(event: Event): void {
    this.table.toggleRow(this.data(), event);
    event.stopPropagation();
  }
}

/**
 * uiFrozenColumn — pins a column while scrolling horizontally.
 * Apply to every `<th>`/`<td>` of the column; `alignFrozen` picks the edge.
 */
@Directive({
  selector: '[uiFrozenColumn]',
  host: {
    '[class._frozen-left]': 'isFrozen() && alignFrozen() === "left"',
    '[class._frozen-right]': 'isFrozen() && alignFrozen() === "right"',
  },
})
export class UiTableFrozenColumn {
  /** @ignore */
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  /** @ignore */
  private readonly injector = inject(Injector);

  /** Enables the pinning (attribute presence defaults to true). */
  frozen = input(true, {
    alias: 'uiFrozenColumn',
    transform: (value: unknown) => value === '' || value == null || booleanAttribute(value),
  });
  /** Edge the column sticks to. */
  alignFrozen = input<TableFrozenAlign>('left');

  /** @ignore */
  protected readonly isFrozen = computed(() => this.frozen());

  constructor() {
    // Offset = accumulated width of the previously pinned columns on the same
    // edge. Re-measured whenever the row resizes (column resize, data change).
    afterNextRender(() => {
      this.updatePosition();
      const row = this.el.nativeElement.parentElement;
      if (row && typeof ResizeObserver !== 'undefined') {
        const observer = new ResizeObserver(() => this.updatePosition());
        observer.observe(row);
        this.injector.get(DestroyRef).onDestroy(() => observer.disconnect());
      }
    });
    effect(() => {
      this.frozen();
      this.alignFrozen();
      this.updatePosition();
    });
  }

  /** @ignore */
  private updatePosition(): void {
    const cell = this.el.nativeElement;
    if (!this.frozen()) {
      cell.style.left = '';
      cell.style.right = '';
      return;
    }
    if (this.alignFrozen() === 'left') {
      let offset = 0;
      let sibling = cell.previousElementSibling as HTMLElement | null;
      while (sibling) {
        if (sibling.classList.contains('_frozen-left')) offset += sibling.getBoundingClientRect().width;
        sibling = sibling.previousElementSibling as HTMLElement | null;
      }
      cell.style.left = `${offset}px`;
      cell.style.right = '';
    } else {
      let offset = 0;
      let sibling = cell.nextElementSibling as HTMLElement | null;
      while (sibling) {
        if (sibling.classList.contains('_frozen-right')) offset += sibling.getBoundingClientRect().width;
        sibling = sibling.nextElementSibling as HTMLElement | null;
      }
      cell.style.right = `${offset}px`;
      cell.style.left = '';
    }
  }
}

/**
 * uiResizableColumn — drag handle on a `<th>` to resize the column.
 * Fit mode: the next column absorbs the delta, the table width is preserved.
 */
@Directive({
  selector: '[uiResizableColumn]',
  host: { class: 'ui-table-resizable-column' },
})
export class UiTableResizableColumn {
  /** @ignore */
  private readonly table = inject(UiTable);
  /** @ignore */
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  /** @ignore */
  private readonly destroyRef = inject(DestroyRef);

  /** @ignore */
  private startX = 0;
  /** @ignore */
  private startWidth = 0;
  /** @ignore */
  private nextStartWidth = 0;
  /** @ignore */
  private appliedDelta = 0;
  /** @ignore */
  private cleanupDrag: (() => void) | null = null;

  constructor() {
    afterNextRender(() => {
      const handle = document.createElement('span');
      handle.className = 'ui-table-column-resizer';
      handle.setAttribute('aria-hidden', 'true');
      handle.addEventListener('pointerdown', this.onPointerDown);
      this.el.nativeElement.appendChild(handle);
    });
    this.destroyRef.onDestroy(() => this.cleanupDrag?.());
  }

  /** @ignore */
  private readonly onPointerDown = (event: PointerEvent): void => {
    const cell = this.el.nativeElement;
    const next = cell.nextElementSibling as HTMLElement | null;
    if (!next) return;
    event.preventDefault();
    this.table.lockColumnWidths();
    this.startX = event.clientX;
    this.startWidth = cell.getBoundingClientRect().width;
    this.nextStartWidth = next.getBoundingClientRect().width;
    this.appliedDelta = 0;

    const onMove = (moveEvent: PointerEvent): void => {
      const delta = moveEvent.clientX - this.startX;
      if (this.table.resizeColumnFit(cell, this.startWidth, this.nextStartWidth, delta)) {
        this.appliedDelta = delta;
      }
    };
    const onUp = (): void => {
      this.cleanupDrag?.();
      if (this.appliedDelta !== 0) this.table.notifyColResize(cell, this.appliedDelta);
    };
    document.addEventListener('pointermove', onMove);
    document.addEventListener('pointerup', onUp);
    this.cleanupDrag = () => {
      document.removeEventListener('pointermove', onMove);
      document.removeEventListener('pointerup', onUp);
      this.cleanupDrag = null;
    };
  };
}

/**
 * uiReorderableRow — drag & drop a `<tr>` to reorder rows.
 *
 * Pass the absolute `rowIndex` from the body template context. On drop the
 * table emits `rowReorder` with a reordered copy of `value` (rebind it).
 * Intended for unsorted data (reordering a sorted view is ambiguous).
 */
@Directive({
  selector: '[uiReorderableRow]',
  host: {
    class: 'ui-table-reorderable-row',
    '[attr.draggable]': 'true',
    '[class._drop-above]': 'dropPosition() === "above"',
    '[class._drop-below]': 'dropPosition() === "below"',
    '(dragstart)': 'onDragStart($event)',
    '(dragover)': 'onDragOver($event)',
    '(dragleave)': 'onDragLeave()',
    '(drop)': 'onDrop($event)',
    '(dragend)': 'onDragEnd()',
  },
})
export class UiTableReorderableRow {
  /** @ignore */
  private readonly table = inject(UiTable);
  /** @ignore */
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);

  /** Absolute row index (from the body template context). */
  index = input.required<number, unknown>({ alias: 'uiReorderableRow', transform: numberAttribute });

  /** @ignore Visual drop indicator (edge of the hovered row). */
  protected readonly dropPosition = signal<'above' | 'below' | null>(null);

  /** @ignore */
  protected onDragStart(event: DragEvent): void {
    this.table.draggedRowIndex = this.index();
    // Firefox requires data for the drag to start.
    event.dataTransfer?.setData('text/plain', String(this.index()));
    if (event.dataTransfer) event.dataTransfer.effectAllowed = 'move';
  }

  /** @ignore */
  protected onDragOver(event: DragEvent): void {
    if (this.table.draggedRowIndex == null) return;
    event.preventDefault();
    const rect = this.el.nativeElement.getBoundingClientRect();
    this.dropPosition.set(event.clientY < rect.top + rect.height / 2 ? 'above' : 'below');
  }

  /** @ignore */
  protected onDragLeave(): void {
    this.dropPosition.set(null);
  }

  /** @ignore */
  protected onDrop(event: DragEvent): void {
    event.preventDefault();
    const position = this.dropPosition();
    this.dropPosition.set(null);
    if (position == null) return;
    const drag = this.table.draggedRowIndex;
    let drop = position === 'above' ? this.index() : this.index() + 1;
    if (drag != null && drag < drop) drop--;
    this.table.dropRow(drop);
  }

  /** @ignore */
  protected onDragEnd(): void {
    this.dropPosition.set(null);
    this.table.draggedRowIndex = null;
  }
}
