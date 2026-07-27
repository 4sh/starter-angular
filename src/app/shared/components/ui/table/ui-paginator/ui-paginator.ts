import {
  booleanAttribute,
  Component,
  computed,
  contentChild,
  input,
  linkedSignal,
  model,
  numberAttribute,
  output,
  TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';
import { UiSelect } from '@app/shared/components/ui/forms/ui-select/ui-select';

/** Payload of `pageChange`. */
export interface UiPaginatorPageEvent {
  /** Index of the first row of the page. */
  first: number;
  /** Rows per page. */
  rows: number;
  /** Zero-based page index. */
  page: number;
  pageCount: number;
}

/** Context handed to the `#pagelink` template. */
export interface UiPaginatorPageLinkContext {
  /** One-based page number (display value). */
  $implicit: number;
  /** Zero-based page index. */
  page: number;
  /** True for the current page. */
  active: boolean;
}

/** Pagination snapshot handed to the `#start` / `#end` / `#report` templates. */
export interface UiPaginatorState {
  /** One-based index of the first displayed row (0 when empty). */
  first: number;
  /** One-based index of the last displayed row. */
  last: number;
  rows: number;
  /** Zero-based current page. */
  page: number;
  pageCount: number;
  totalRecords: number;
}

/** @ignore Sentinel used in the page-item list to mark an ellipsis gap. */
const ELLIPSIS = -1;

/**
 * ui-paginator — standalone pagination bar.
 *
 * Faithful to the Figma `ui-paginator` component: native `<button>` controls
 * and page numbers styled straight with the `actions.low` tokens (current
 * page in `actions.high`), 40px squircles (`--radius-default`), `ui-icon`
 * chevrons, plus an `ui-select` rows-per-page choice. Used by `ui-table`,
 * works standalone over any collection: bind `totalRecords`, `rows` and the
 * two-way `first`.
 *
 * With `ellipsis`, long page lists collapse to `1 2 3 … 30 31 32`
 * (`boundaryCount` pages on each edge + the current page neighborhood).
 * The control icons and the page-link content are overridable via the
 * `#firsticon` / `#previcon` / `#nexticon` / `#lasticon` / `#pagelink`
 * templates.
 */
@Component({
  selector: 'ui-paginator',
  imports: [NgTemplateOutlet, FormsModule, UiIcon, UiSelect],
  templateUrl: './ui-paginator.html',
  styleUrl: './ui-paginator.scss',
})
export class UiPaginator {
  /** Total number of rows across all pages. */
  totalRecords = input(0, { transform: numberAttribute });
  /** Rows per page. Two-way bindable (updated by the rows-per-page select). */
  rows = model(10);
  /** Index of the first displayed row. Two-way bindable (programmatic pagination). */
  first = model(0);
  /** Maximum number of page-number buttons (windowed mode, without `ellipsis`). */
  pageLinks = input(5, { transform: numberAttribute });
  /** Compact mode: `1 2 3 … 30 31 32` — edges + current-page neighborhood, `…` in the gaps. */
  ellipsis = input(false, { transform: booleanAttribute });
  /** Pages always shown on each edge in `ellipsis` mode. */
  boundaryCount = input(3, { transform: numberAttribute });
  /** Choices offered in the rows-per-page select (omit to hide it — Figma `selectPage`). */
  rowsPerPageOptions = input<number[]>();
  /** Shows the "first page" / "last page" edge controls. */
  showFirstLastIcon = input(true, { transform: booleanAttribute });
  /** Shows the page-number buttons (disable for a compact prev/next bar). */
  showPageLinks = input(true, { transform: booleanAttribute });
  /** Shows the current-page report (e.g. `1 - 10 sur 120`). */
  showCurrentPageReport = input(false, { transform: booleanAttribute });
  /** Report pattern — placeholders: `{first}` `{last}` `{rows}` `{page}` `{pageCount}` `{totalRecords}`. */
  currentPageReportTemplate = input<string>('{first} - {last} sur {totalRecords}');
  /** Disables every control. */
  disabled = input(false, { transform: booleanAttribute });
  /** Accessible name of the navigation landmark. */
  ariaLabel = input<string>('Pagination');
  /** Accessible name pattern of a page button (`{page}` is replaced). */
  pageAriaLabel = input<string>('Page {page}');
  /** Accessible names of the edge / step controls. */
  firstPageAriaLabel = input<string>('Première page');
  prevPageAriaLabel = input<string>('Page précédente');
  nextPageAriaLabel = input<string>('Page suivante');
  lastPageAriaLabel = input<string>('Dernière page');
  /** Accessible name of the rows-per-page select. */
  rowsPerPageAriaLabel = input<string>('Lignes par page');

  /** Emitted on any pagination change (navigation or rows-per-page). */
  pageChange = output<UiPaginatorPageEvent>();

  // --- Templates (projected) — override the default content of each element.
  /** @ignore Icon of the "first page" control. */
  protected readonly firstIconTemplate = contentChild<TemplateRef<unknown>>('firsticon');
  /** @ignore Icon of the "previous page" control. */
  protected readonly prevIconTemplate = contentChild<TemplateRef<unknown>>('previcon');
  /** @ignore Icon of the "next page" control. */
  protected readonly nextIconTemplate = contentChild<TemplateRef<unknown>>('nexticon');
  /** @ignore Icon of the "last page" control. */
  protected readonly lastIconTemplate = contentChild<TemplateRef<unknown>>('lasticon');
  /** @ignore Content of a page-number button (context: number, page, active). */
  protected readonly pageLinkTemplate = contentChild<TemplateRef<UiPaginatorPageLinkContext>>('pagelink');
  /** @ignore Free content rendered before the controls (context: pagination state). */
  protected readonly startTemplate = contentChild<TemplateRef<{ $implicit: UiPaginatorState }>>('start');
  /** @ignore Free content rendered after the rows-per-page select (context: pagination state). */
  protected readonly endTemplate = contentChild<TemplateRef<{ $implicit: UiPaginatorState }>>('end');
  /** @ignore Rich current-page report (overrides `currentPageReportTemplate`). */
  protected readonly reportTemplate = contentChild<TemplateRef<{ $implicit: UiPaginatorState }>>('report');

  /** @ignore Exposes the ellipsis sentinel to the template. */
  protected readonly ELLIPSIS = ELLIPSIS;

  /** @ignore Rows-per-page kept locally so the select can drive it. */
  protected readonly rowsState = linkedSignal(() => Math.max(1, this.rows()));

  /** @ignore */
  protected readonly pageCount = computed(() => Math.max(1, Math.ceil(this.totalRecords() / this.rowsState())));
  /** @ignore `first` clamped to the dataset (data may shrink under the cursor). */
  protected readonly clampedFirst = computed(() => {
    const maxFirst = (this.pageCount() - 1) * this.rowsState();
    return Math.min(Math.max(0, this.first()), maxFirst);
  });
  /** @ignore Zero-based current page. */
  protected readonly currentPage = computed(() => Math.floor(this.clampedFirst() / this.rowsState()));

  /** @ignore Page items to render: zero-based page indexes, `ELLIPSIS` for a gap. */
  protected readonly pageItems = computed<number[]>(() => {
    const count = this.pageCount();
    const current = this.currentPage();

    if (!this.ellipsis()) {
      // Windowed mode: `pageLinks` numbers centered on the current page.
      const visible = Math.min(this.pageLinks(), count);
      const start = Math.max(0, Math.min(current - Math.floor(visible / 2), count - visible));
      return Array.from({ length: visible }, (_, i) => start + i);
    }

    // Compact mode: edges + current neighborhood, ellipsis in the gaps.
    const boundary = Math.max(1, this.boundaryCount());
    const pages = new Set<number>();
    for (let i = 0; i < Math.min(boundary, count); i++) pages.add(i);
    for (let i = Math.max(0, current - 1); i <= Math.min(count - 1, current + 1); i++) pages.add(i);
    for (let i = Math.max(0, count - boundary); i < count; i++) pages.add(i);

    const sorted = [...pages].sort((a, b) => a - b);
    const items: number[] = [];
    let previous: number | null = null;
    for (const page of sorted) {
      if (previous != null) {
        // A single missing page is cheaper to show than an ellipsis.
        if (page - previous === 2) items.push(previous + 1);
        else if (page - previous > 2) items.push(ELLIPSIS);
      }
      items.push(page);
      previous = page;
    }
    return items;
  });

  /** @ignore Pagination snapshot (templates + report placeholders). */
  protected readonly state = computed<UiPaginatorState>(() => {
    const total = this.totalRecords();
    const rows = this.rowsState();
    const first = this.clampedFirst();
    return {
      first: total === 0 ? 0 : first + 1,
      last: Math.min(first + rows, total),
      rows,
      page: this.currentPage(),
      pageCount: this.pageCount(),
      totalRecords: total,
    };
  });

  /** @ignore Context shared by the #start / #end / #report templates. */
  protected readonly stateContext = computed(() => ({ $implicit: this.state() }));

  /** @ignore Report pattern with its placeholders resolved. */
  protected readonly reportText = computed(() => {
    const state = this.state();
    return this.currentPageReportTemplate()
      .replace('{first}', String(state.first))
      .replace('{last}', String(state.last))
      .replace('{rows}', String(state.rows))
      .replace('{page}', String(state.page + 1))
      .replace('{pageCount}', String(state.pageCount))
      .replace('{totalRecords}', String(state.totalRecords));
  });

  /** @ignore */
  protected readonly isFirstPage = computed(() => this.currentPage() === 0);
  /** @ignore */
  protected readonly isLastPage = computed(() => this.currentPage() >= this.pageCount() - 1);

  /** @ignore */
  protected goToPage(page: number): void {
    const target = Math.min(Math.max(0, page), this.pageCount() - 1);
    const first = target * this.rowsState();
    if (first === this.first()) return;
    this.first.set(first);
    this.emitPage();
  }

  /** @ignore */
  protected onRowsPerPageChange(rows: unknown): void {
    const value = Number(rows);
    if (!Number.isFinite(value) || value <= 0 || value === this.rowsState()) return;
    this.rowsState.set(value);
    this.rows.set(value);
    this.first.set(0);
    this.emitPage();
  }

  /** @ignore */
  protected pageLabel(page: number): string {
    return this.pageAriaLabel().replace('{page}', String(page + 1));
  }

  /** @ignore */
  protected pageLinkContext(page: number): UiPaginatorPageLinkContext {
    return { $implicit: page + 1, page, active: page === this.currentPage() };
  }

  /** @ignore */
  private emitPage(): void {
    this.pageChange.emit({
      first: this.clampedFirst(),
      rows: this.rowsState(),
      page: this.currentPage(),
      pageCount: this.pageCount(),
    });
  }
}
