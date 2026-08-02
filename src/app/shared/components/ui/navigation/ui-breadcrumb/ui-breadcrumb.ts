import {
  afterNextRender,
  Component,
  computed,
  contentChild,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  isDevMode,
  linkedSignal,
  output,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { Params, RouterLink } from '@angular/router';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';

/** Breadcrumb density: `small` = compact rendering. */
export type BreadcrumbSize = 'default' | 'small';

/** Payload passed to `command` callbacks and emitted by `itemClick`. */
export interface UiBreadcrumbItemCommandEvent {
  originalEvent: Event;
  item: UiBreadcrumbItem;
}

/**
 * Declarative breadcrumb entry. An item navigates through `url` (external)
 * or `routerLink` (internal), and/or triggers a `command` callback.
 */
export interface UiBreadcrumbItem {
  /** Text of the crumb. */
  label?: string;
  /** Leading FontAwesome icon name (icon-only crumb when no label, e.g. home). */
  icon?: string;
  /** Accessible name override (required for an icon-only crumb). */
  ariaLabel?: string;
  /** External / plain URL — the crumb renders a plain anchor. */
  url?: string;
  /** Anchor target (e.g. `_blank`). */
  target?: string;
  /** Anchor rel. Defaults to `noopener noreferrer` when `target="_blank"`. */
  rel?: string;
  /** Angular router target — the crumb renders a RouterLink anchor. */
  routerLink?: string | unknown[];
  /** Query params passed to `routerLink`. */
  queryParams?: Params;
  /** URL fragment passed to `routerLink`. */
  fragment?: string;
  /** Callback invoked when the crumb is clicked. */
  command?: (event: UiBreadcrumbItemCommandEvent) => void;
  /** Disable the crumb (no navigation, out of the tab sequence). */
  disabled?: boolean;
  /** Hide the crumb entirely (default true). */
  visible?: boolean;
  /** Extra class on the crumb's `<li>`. */
  styleClass?: string;
}

/** @ignore Resolved render entry (crumb or overflow ellipsis). */
interface UiBreadcrumbEntry {
  kind: 'item' | 'ellipsis';
  item?: UiBreadcrumbItem;
  key: string;
  last: boolean;
}

/** @ignore Focusable descendants of a crumb (native or projected via `#item`). */
const FOCUSABLE_SELECTOR = 'a[href], button:not([disabled]), [tabindex]:not([tabindex="-1"])';

/**
 * ui-breadcrumb — headless breadcrumb trail: shows the current location
 * within a navigational hierarchy.
 *
 * Driven by a declarative `items` model ({@link UiBreadcrumbItem}). Each crumb
 * renders the **native element matching its semantics**, never a wrapper
 * component — so the anchor stays fully controllable (`rel`, `target`,
 * `queryParams`, `fragment`…):
 *
 *   • `routerLink` → `<a>` + `RouterLink` (internal navigation)
 *   • `url`        → `<a href>` (external / plain navigation)
 *   • `command` only → `<button type="button">` (action, not navigation)
 *   • no destination / `disabled` → plain text (never a fake link)
 *
 * The last crumb represents the current page and carries `aria-current="page"`.
 *
 * Long trails collapse behind an accessible ellipsis **button** when `maxItems`
 * is set (first crumb + "…" + trailing crumbs); activating it reveals the
 * hidden crumbs.
 *
 * Customisation: `separator` (string, default "/"), `#separator` template,
 * and `#item` template (crumb content, `$implicit` = item, `last`).
 */
@Component({
  selector: 'ui-breadcrumb',
  imports: [NgTemplateOutlet, RouterLink, UiIcon],
  templateUrl: './ui-breadcrumb.html',
  styleUrl: './ui-breadcrumb.scss',
  host: { '[style.display]': "'block'" },
})
export class UiBreadcrumb {
  /** Breadcrumb entries, in hierarchy order (see {@link UiBreadcrumbItem}). */
  items = input<UiBreadcrumbItem[]>([]);
  /** Density: `default`, or `small` for compact rendering. */
  size = input<BreadcrumbSize>('default');
  /** Separator character(s) between crumbs (overridden by the `#separator` template). */
  separator = input<string>('/');
  /**
   * Maximum number of crumbs displayed (minimum 2). Beyond it, the middle
   * collapses behind an ellipsis button: first crumb + "…" + the trailing
   * crumbs. Unset = never collapse.
   */
  maxItems = input<number>();
  /** Accessible name of the `<nav>` landmark. */
  ariaLabel = input<string>("Fil d'Ariane");
  /** Accessible name of the ellipsis button revealing the hidden crumbs. */
  ellipsisAriaLabel = input<string>('Afficher les éléments masqués');
  /** Extra class(es) applied to the root `<nav>`. */
  styleClass = input<string>();

  /** Emitted when a crumb is clicked (never when disabled). */
  itemClick = output<UiBreadcrumbItemCommandEvent>();

  /** Custom crumb content: `<ng-template #item let-item let-last="last">`. */
  protected readonly itemTemplate = contentChild<TemplateRef<unknown>>('item');
  /** Custom separator content: `<ng-template #separator>`. */
  protected readonly separatorTemplate = contentChild<TemplateRef<unknown>>('separator');

  /** @ignore Root list — focus management after expanding the overflow. */
  private readonly listEl = viewChild<ElementRef<HTMLElement>>('list');

  /** @ignore */
  private readonly injector = inject(Injector);

  constructor() {
    // A11y safeguard: an icon-only crumb must have an accessible name.
    if (isDevMode()) {
      effect(() => {
        const unnamed = this.items().filter(
          (item) => item.visible !== false && item.icon && !item.label && !item.ariaLabel,
        );
        if (unnamed.length) {
          console.warn(
            '[ui-breadcrumb] Icon-only crumb has no accessible name: provide `ariaLabel`.',
            unnamed,
          );
        }
      });
    }
  }

  /** @ignore Overflow revealed by the ellipsis button; resets when items change. */
  protected readonly overflowExpanded = linkedSignal<UiBreadcrumbItem[], boolean>({
    source: this.items,
    computation: () => false,
  });

  /** @ignore Crumb / ellipsis icon size follows the breadcrumb density. */
  protected readonly iconSize = computed(() => (this.size() === 'small' ? 'sm' : 'default'));

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-breadcrumb'];
    if (this.size() !== 'default') c.push(`_${this.size()}`);
    const extra = this.styleClass();
    if (extra) c.push(extra);
    return c.join(' ');
  });

  /** @ignore Render entries: visible crumbs, middle collapsed when overflowing. */
  protected readonly entries = computed<UiBreadcrumbEntry[]>(() => {
    const items = this.items().filter((item) => item.visible !== false);
    const max = this.maxItems();
    const kept = max != null ? Math.max(2, max) : Infinity;

    let entries: UiBreadcrumbEntry[];
    if (!this.overflowExpanded() && items.length > kept) {
      entries = [
        { kind: 'item', item: items[0], key: 'item-0', last: false },
        { kind: 'ellipsis', key: 'ellipsis', last: false },
        ...items.slice(items.length - (kept - 1)).map((item, i) => ({
          kind: 'item' as const,
          item,
          key: `item-${items.length - (kept - 1) + i}`,
          last: false,
        })),
      ];
    } else {
      entries = items.map((item, i) => ({ kind: 'item' as const, item, key: `item-${i}`, last: false }));
    }
    if (entries.length) entries[entries.length - 1].last = true;
    return entries;
  });

  /** @ignore Class list of a crumb `<li>` (base + per-item styleClass). */
  protected itemClasses(item: UiBreadcrumbItem): string {
    return item.styleClass ? `ui-breadcrumb-item ${item.styleClass}` : 'ui-breadcrumb-item';
  }

  /** @ignore Internal navigation: `routerLink` wins over `url`. */
  protected isRouterCrumb(item: UiBreadcrumbItem): boolean {
    return !item.disabled && item.routerLink != null;
  }

  /** @ignore Plain navigation: an `url` and no `routerLink`. */
  protected isHrefCrumb(item: UiBreadcrumbItem): boolean {
    return !item.disabled && item.routerLink == null && !!item.url;
  }

  /** @ignore Action-only crumb (a `command` with no destination) → real `<button>`. */
  protected isActionCrumb(item: UiBreadcrumbItem): boolean {
    return !item.disabled && item.routerLink == null && !item.url && !!item.command;
  }

  /** @ignore Anchor `rel`: explicit, or a safe default for `target="_blank"`. */
  protected relFor(item: UiBreadcrumbItem): string | null {
    if (item.rel) return item.rel;
    return item.target === '_blank' ? 'noopener noreferrer' : null;
  }

  /** @ignore Reveal the hidden crumbs, moving focus to the first revealed one. */
  protected expandOverflow(): void {
    this.overflowExpanded.set(true);
    // After the next render the full list is in the DOM: focus the first
    // focusable crumb revealed by the expansion (skipping the leading one).
    afterNextRender(
      () => {
        const list = this.listEl()?.nativeElement;
        if (!list) return;
        const crumbs = Array.from(list.querySelectorAll<HTMLElement>('.ui-breadcrumb-item'));
        for (const crumb of crumbs.slice(1)) {
          const focusable = crumb.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
          if (focusable) {
            focusable.focus();
            return;
          }
        }
      },
      { injector: this.injector },
    );
  }

  /** @ignore Crumb activation: command + itemClick (navigation stays native). */
  protected onItemClick(event: Event, item: UiBreadcrumbItem): void {
    if (item.disabled) return;
    item.command?.({ originalEvent: event, item });
    this.itemClick.emit({ originalEvent: event, item });
  }
}
