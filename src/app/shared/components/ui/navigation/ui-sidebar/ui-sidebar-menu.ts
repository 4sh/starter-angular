import { booleanAttribute, Component, computed, inject, input, model, output } from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { UiFeedbackLevel, UiSubLevel } from '@app/shared/types/ui-level';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';
import { UiBadge } from '@app/shared/components/ui/informative/ui-badge/ui-badge';
import { UiTooltip } from '@app/shared/components/ui/informative/ui-tooltip/ui-tooltip';
import { UiSidebar } from './ui-sidebar';

/** Menu density. */
export type SidebarMenuSize = 'default' | 'small';

/** Payload emitted by `itemClick` / passed to `command`. */
export interface UiSidebarMenuItemCommandEvent {
  originalEvent: Event;
  item: UiSidebarMenuItem;
}

/**
 * Declarative sidebar navigation entry. An item is either a separator, a leaf
 * (command / router / external link), a plain **section** (a labelled group of
 * items) or a collapsible **group** (`toggleable`) revealing a nested sub-tree.
 */
export interface UiSidebarMenuItem {
  /** Stable identifier — drives expansion state and active tracking. */
  id?: string;
  /** Text of the item / group header. */
  label?: string;
  /** Leading FontAwesome icon name (also shown in the collapsed rail). */
  icon?: string;
  /** Child items: turns the entry into a section or collapsible group. */
  items?: UiSidebarMenuItem[];
  /** Render a separator rule instead of a regular entry. */
  separator?: boolean;
  /** Disable the entry (skipped by pointer / keyboard). */
  disabled?: boolean;
  /** Hide the entry entirely (default visible). */
  visible?: boolean;
  /** Callback invoked when the leaf is activated. */
  command?: (event: UiSidebarMenuItemCommandEvent) => void;
  /** Angular router target — the leaf renders a RouterLink anchor. */
  routerLink?: string | unknown[];
  /** Router query params (routerLink mode). */
  queryParams?: Record<string, unknown>;
  /** Exact matching for the active-link style (default false). */
  routerLinkActiveExact?: boolean;
  /** External URL — the leaf renders a plain anchor. */
  url?: string;
  /** Anchor target (e.g. `_blank`). */
  target?: string;
  /** Manual active state (for non-router navigation). */
  active?: boolean;
  /** Trailing badge text (count, status…), rendered as a `ui-badge`. */
  badge?: string;
  /** Level of the trailing badge (defaults to `default`). */
  badgeLevel?: UiFeedbackLevel;
  /** Force the trailing "opens elsewhere" icon (auto for `target="_blank"`). */
  external?: boolean;
  /**
   * Collapsible group header. Defaults to `false` at the top level (a plain
   * section header) and `true` for nested groups. Ignored on non-group items.
   */
  toggleable?: boolean;
  /** Initial expanded state of a collapsible group (`expandedKeys` wins). */
  expanded?: boolean;
  /** Accessible name override. */
  ariaLabel?: string;
  /** Extra class on the entry. */
  styleClass?: string;
}

/** @ignore Resolved render node. */
interface UiSidebarMenuNode {
  item: UiSidebarMenuItem;
  key: string;
  kind: 'separator' | 'section' | 'group' | 'item';
  children: UiSidebarMenuNode[];
  depth: number;
  /** A descendant is marked active (drives auto-expand + `_active-within`). */
  activeWithin: boolean;
}

/**
 * ui-sidebar-menu — declarative navigation menu for `ui-sidebar`.
 *
 * Renders a `UiSidebarMenuItem[]` model as an accessible navigation landmark:
 * a `<nav>` wrapping semantic `role="list"` / `role="listitem"` containers.
 * Supports labelled **sections** (grouped navigation), **collapsible groups**
 * (`toggleable`) revealing deep nested sub-trees with expansion state
 * (two-way `expandedKeys`), and per-item **active tracking** (RouterLink for
 * router items, `active` for manual navigation — groups containing an active
 * descendant auto-expand).
 *
 * Dropped inside a `ui-sidebar`, it reads the resolved collapsed state through
 * DI and folds to an **icon rail** automatically (labels hidden, icon tooltips).
 * Used standalone, control the rail with the `collapsed` input.
 *
 * Keyboard support is native: `Tab` / `Shift+Tab` move between the links,
 * toggles and rails; `Enter` / `Space` activate the focused control.
 */
@Component({
  selector: 'ui-sidebar-menu',
  imports: [NgTemplateOutlet, RouterLink, RouterLinkActive, UiIcon, UiBadge, UiTooltip],
  templateUrl: './ui-sidebar-menu.html',
  styleUrl: './ui-sidebar-menu.scss',
})
export class UiSidebarMenu {
  /** Declarative menu model. */
  items = input<UiSidebarMenuItem[]>([]);
  /** Navigation token family. */
  level = input<UiSubLevel>('high');
  /** Menu density. */
  size = input<SidebarMenuSize>('default');
  /** Icon-rail state when used standalone (a parent `ui-sidebar` overrides it). */
  collapsed = input(false, { transform: booleanAttribute });
  /** Accessible name for the navigation landmark. */
  ariaLabel = input<string>();
  /** Id of an external element naming the landmark. */
  ariaLabelledBy = input<string>();
  /** Play the collapse animation on nested groups. */
  motion = input(true, { transform: booleanAttribute });
  /**
   * In the collapsed icon rail, reveal each item's label as a tooltip on hover /
   * focus (via the `[uiTooltip]` directive). No effect when expanded.
   */
  tooltips = input(false, { transform: booleanAttribute });

  /** Expanded group keys (two-way). Keyed by `id`, or a positional key. */
  expandedKeys = model<string[]>();

  /** Emitted when a leaf item is activated. */
  itemClick = output<UiSidebarMenuItemCommandEvent>();

  /** @ignore Optional host sidebar — supplies the resolved collapsed state. */
  private readonly parent = inject(UiSidebar, { optional: true });

  /** @ignore Effective icon-rail state (parent sidebar wins). */
  protected readonly isCollapsed = computed(() => this.parent?.effectiveCollapsed() ?? this.collapsed());

  /** @ignore Show label tooltips (collapsed rail + `tooltips` enabled). */
  protected readonly showTooltips = computed(() => this.tooltips() && this.isCollapsed());

  /** @ignore Leaf opens elsewhere → trailing external icon (expanded only). */
  protected isExternal(node: UiSidebarMenuNode): boolean {
    return node.kind === 'item' && (node.item.external === true || node.item.target === '_blank');
  }

  /** @ignore Resolved render tree. */
  protected readonly nodes = computed(() => this.resolve(this.items(), 0, 'n'));

  /** @ignore Keys of groups seeded expanded (item.expanded or active descendant). */
  private readonly seedKeys = computed(() => {
    const keys: string[] = [];
    const walk = (nodes: UiSidebarMenuNode[]): void => {
      for (const node of nodes) {
        if (node.kind === 'group' && (node.item.expanded || node.activeWithin)) keys.push(node.key);
        if (node.children.length) walk(node.children);
      }
    };
    walk(this.nodes());
    return keys;
  });

  /** @ignore Currently expanded group keys. */
  protected readonly expandedSet = computed(() => new Set(this.expandedKeys() ?? this.seedKeys()));

  /** @ignore */
  protected isExpanded(node: UiSidebarMenuNode): boolean {
    return this.expandedSet().has(node.key);
  }

  /** @ignore Toggle a collapsible group. */
  protected onToggle(node: UiSidebarMenuNode): void {
    if (node.item.disabled) return;
    const next = new Set(this.expandedSet());
    if (next.has(node.key)) next.delete(node.key);
    else next.add(node.key);
    this.expandedKeys.set([...next]);
  }

  /** @ignore Leaf activation (command items). */
  protected onItemClick(event: Event, node: UiSidebarMenuNode): void {
    if (node.item.disabled) return;
    node.item.command?.({ originalEvent: event, item: node.item });
    this.itemClick.emit({ originalEvent: event, item: node.item });
  }

  /** @ignore Accessible name / tooltip target for the collapsed rail. */
  protected railTitle(node: UiSidebarMenuNode): string | null {
    return this.isCollapsed() ? (node.item.ariaLabel ?? node.item.label ?? null) : (node.item.ariaLabel ?? null);
  }

  /** @ignore Resolve the raw model into render nodes. */
  private resolve(items: UiSidebarMenuItem[], depth: number, prefix: string): UiSidebarMenuNode[] {
    const nodes: UiSidebarMenuNode[] = [];
    items.forEach((item, index) => {
      if (item.visible === false) return;
      const key = item.id ?? `${prefix}-${index}`;
      if (item.separator) {
        nodes.push({ item, key, kind: 'separator', children: [], depth, activeWithin: false });
        return;
      }
      const hasChildren = !!item.items?.length;
      if (hasChildren) {
        const children = this.resolve(item.items!, depth + 1, key);
        const toggleable = item.toggleable ?? depth > 0;
        const activeWithin = children.some((c) => c.item.active || c.activeWithin);
        nodes.push({
          item,
          key,
          kind: toggleable ? 'group' : 'section',
          children,
          depth,
          activeWithin,
        });
        return;
      }
      nodes.push({ item, key, kind: 'item', children: [], depth, activeWithin: false });
    });
    return nodes;
  }
}
