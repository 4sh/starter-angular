import {
  booleanAttribute,
  Component,
  computed,
  contentChild,
  ElementRef,
  input,
  model,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { QueryParamsHandling, RouterLink, RouterLinkActive } from '@angular/router';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { UiSubLevel } from '@app/shared/types/ui-level';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';
import { UiMotion } from '@app/shared/motion/ui-motion';

/** Menu density: `small` = compact rendering ("…" action menus). */
export type MenuSize = 'default' | 'small';

/** Payload passed to `command` callbacks and emitted by `itemClick`. */
export interface UiMenuItemCommandEvent {
  originalEvent: Event;
  item: UiMenuItem;
}

/**
 * Declarative menu entry. An item is either a separator, a leaf (command /
 * router / external link), or a group (`items`) whose header is a plain
 * label or a collapsible toggle (see `toggleable`).
 */
export interface UiMenuItem {
  /** Stable identifier — required to drive the item through `expandedKeys`. */
  id?: string;
  /** Text of the item / group header. */
  label?: string;
  /** Leading FontAwesome icon name. */
  icon?: string;
  /** Child items: turns the entry into a group (labeled section or submenu). */
  items?: UiMenuItem[];
  /** Render a separator rule instead of a regular entry. */
  separator?: boolean;
  /** Disable the entry (skipped by keyboard navigation). */
  disabled?: boolean;
  /** Hide the entry entirely (default true). */
  visible?: boolean;
  /** Callback invoked when the item is clicked / activated by keyboard. */
  command?: (event: UiMenuItemCommandEvent) => void;
  /** Angular router target — the item renders a RouterLink anchor. */
  routerLink?: string | unknown[];
  /** Router query params (routerLink mode). */
  queryParams?: Record<string, unknown>;
  /** Router queryParamsHandling (routerLink mode). */
  queryParamsHandling?: QueryParamsHandling;
  /** Exact matching for the active-link style (default false). */
  routerLinkActiveExact?: boolean;
  /** External URL — the item renders a plain anchor. */
  url?: string;
  /** Anchor target (e.g. `_blank`). */
  target?: string;
  /**
   * Collapsible group header. Defaults to `true` for nested groups and
   * `false` for top-level groups (plain section headers); set it to
   * override either way. Ignored on non-group items.
   */
  toggleable?: boolean;
  /** Initial expanded state of a toggleable group (`expandedKeys` wins). */
  expanded?: boolean;
  /** Native tooltip (`title` attribute). */
  title?: string;
  /** Accessible name override. */
  ariaLabel?: string;
  /** Extra class on the item's `<li>`. */
  styleClass?: string;
}

/** @ignore Resolved render node (item + derived kind/key/children). */
interface UiMenuNode {
  item: UiMenuItem;
  /** `item.id`, or a generated positional key. */
  key: string;
  kind: 'separator' | 'header' | 'toggle' | 'item';
  children: UiMenuNode[];
  expanded: boolean;
  depth: number;
}

/** Process-wide counter for unique menu ids (aria wiring). */
let nextUid = 0;

/** Trigger ↔ panel gap — keep aligned with `$overlay-panel-offset` (ui-config). */
const OVERLAY_OFFSET = 8;

/**
 * ui-menu — headless navigation / command menu, static or popup.
 *
 * Driven by a declarative `items` model ({@link UiMenuItem}): labeled groups
 * with separators, collapsible submenus (nested groups are toggleable by
 * default, override per item with `toggleable`), commands, router links and
 * external URLs. The open/closed state of toggleable groups is controllable
 * (and two-way bindable) through `expandedKeys`, keyed by the items' `id`.
 *
 * `popup` mode renders the panel in a CDK overlay anchored to the element
 * that triggered `toggle(event)` / `show(event)`.
 *
 * Styled 100% with the `navigation.*` tokens; the panel shell shares the
 * structural `overlay-panel` recipe with the other floating panels.
 *
 * Customisation: `#item` template (menuitem content, `$implicit` = item),
 * `#submenuheader` (group headers), `#start` / `#end` slots around the list.
 */
@Component({
  selector: 'ui-menu',
  imports: [NgTemplateOutlet, OverlayModule, RouterLink, RouterLinkActive, UiIcon, UiMotion],
  templateUrl: './ui-menu.html',
  styleUrl: './ui-menu.scss',
  host: {
    '[style.display]': "popup() ? 'contents' : 'block'",
  },
})
export class UiMenu {
  /** Menu entries (see {@link UiMenuItem}). */
  items = input<UiMenuItem[]>([]);
  /** Popup mode: the panel opens in an overlay via `toggle(event)` / `show(event)`. */
  popup = input(false, { transform: booleanAttribute });
  /**
   * Open/closed state of the toggleable groups, keyed by item `id`
   * (`{ [id]: boolean }`). Two-way bindable; a key absent from the map
   * falls back to the item's own `expanded`, then to closed.
   */
  expandedKeys = model<Record<string, boolean>>({});
  /** Accessible name of the menu list. */
  ariaLabel = input<string>();
  /** id of an external element labelling the menu list. */
  ariaLabelledBy = input<string>();
  /** Extra class(es) applied to the panel (scoped custom styling). */
  styleClass = input<string>();
  /** Color family: `high` (default) or `low` navigation tokens. */
  level = input<UiSubLevel>('high');
  /** Density: `default`, or `small` for compact action menus ("…" buttons). */
  size = input<MenuSize>('default');
  /** Animate the popup entrance and the submenu collapse (reduced-motion always wins). */
  motion = input(true, { transform: booleanAttribute });
  /** Auto-flip the popup above the trigger when space is lacking below. */
  autoFlip = input(true, { transform: booleanAttribute });
  /** Tabindex of the menu's roving tab stop. */
  tabindex = input(0, { transform: numberAttribute });

  /** Emitted when the popup opens. */
  opened = output<void>();
  /** Emitted when the popup closes. */
  closed = output<void>();
  /** Emitted when a leaf item is clicked / keyboard-activated (never when disabled). */
  itemClick = output<UiMenuItemCommandEvent>();

  /** Custom menuitem content: `<ng-template #item let-item>`. */
  protected readonly itemTemplate = contentChild<TemplateRef<unknown>>('item');
  /** Custom group-header content: `<ng-template #submenuheader let-item>`. */
  protected readonly submenuHeaderTemplate = contentChild<TemplateRef<unknown>>('submenuheader');
  /** Free content rendered before the list. */
  protected readonly startTemplate = contentChild<TemplateRef<unknown>>('start');
  /** Free content rendered after the list. */
  protected readonly endTemplate = contentChild<TemplateRef<unknown>>('end');

  /** @ignore Panel root (overlay or inline) — keyboard focus queries. */
  private readonly panelEl = viewChild<ElementRef<HTMLElement>>('panel');

  /** Unique id of the panel (public: wire the trigger's `aria-controls` to it). */
  readonly uid = `ui-menu-${nextUid++}`;
  /** @ignore Popup open state. */
  protected readonly popupOpen = signal(false);
  /** @ignore Element the overlay is anchored to (the `toggle(event)` trigger). */
  protected readonly overlayOrigin = signal<Element | null>(null);
  /** @ignore Key of the node owning the roving tabindex. */
  protected readonly focusedKey = signal<string | null>(null);

  /** @ignore Below the trigger, flipping above when `autoFlip` and space is lacking. */
  protected readonly overlayPositions = computed<ConnectedPosition[]>(() => {
    const below: ConnectedPosition = { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: OVERLAY_OFFSET };
    const above: ConnectedPosition = { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -OVERLAY_OFFSET };
    return this.autoFlip() ? [below, above] : [below];
  });

  /** @ignore Resolved render tree (kinds, keys, expanded state). */
  protected readonly nodes = computed<UiMenuNode[]>(() => this.buildNodes(this.items(), this.uid, 0));

  /** @ignore Keys of the focusable entries, in visual order (roving focus path). */
  private readonly focusableKeys = computed<string[]>(() => {
    const keys: string[] = [];
    const walk = (nodes: UiMenuNode[]): void => {
      for (const node of nodes) {
        if (node.kind === 'separator') continue;
        if (node.kind === 'item' && !node.item.disabled) keys.push(node.key);
        if (node.kind === 'toggle' && !node.item.disabled) {
          keys.push(node.key);
          if (node.expanded) walk(node.children);
        }
        if (node.kind === 'header') walk(node.children);
      }
    };
    walk(this.nodes());
    return keys;
  });

  /** @ignore Node owning the tab stop: last focused, else first focusable. */
  protected readonly tabStopKey = computed<string | null>(() => {
    const keys = this.focusableKeys();
    const focused = this.focusedKey();
    return focused && keys.includes(focused) ? focused : (keys[0] ?? null);
  });

  /** @ignore */
  protected readonly panelClasses = computed(() => {
    const c = ['ui-menu', `_${this.level()}`];
    if (this.size() !== 'default') c.push(`_${this.size()}`);
    if (this.popup()) c.push('_popup');
    if (!this.motion()) c.push('_no-motion');
    const extra = this.styleClass();
    if (extra) c.push(extra);
    return c.join(' ');
  });

  // --- Popup ------------------------------------------------------------

  /** Toggles the popup relative to the event's `currentTarget`. */
  toggle(event: Event): void {
    this.popupOpen() ? this.hide() : this.show(event);
  }

  /** Opens the popup anchored to the event's `currentTarget`. */
  show(event: Event): void {
    if (!this.popup() || this.popupOpen()) return;
    this.overlayOrigin.set((event.currentTarget ?? event.target) as Element);
    this.popupOpen.set(true);
    this.opened.emit();
    this.queueFocusTabStop();
  }

  /** Closes the popup. */
  hide(focusTrigger = false): void {
    if (!this.popupOpen()) return;
    this.popupOpen.set(false);
    this.focusedKey.set(null);
    this.closed.emit();
    if (focusTrigger) (this.overlayOrigin() as HTMLElement | null)?.focus?.();
  }

  // --- Interactions -------------------------------------------------------

  /** @ignore Leaf activation: command + itemClick, popup auto-close. */
  protected onItemClick(event: Event, node: UiMenuNode): void {
    const item = node.item;
    if (item.disabled) {
      event.preventDefault();
      return;
    }
    if (!item.url && !item.routerLink) event.preventDefault();
    this.focusedKey.set(node.key);
    item.command?.({ originalEvent: event, item });
    this.itemClick.emit({ originalEvent: event, item });
    if (this.popup()) this.hide(true);
  }

  /** @ignore Expand/collapse a toggleable group (updates `expandedKeys`). */
  protected onToggleClick(node: UiMenuNode): void {
    if (node.item.disabled) return;
    this.focusedKey.set(node.key);
    this.setExpanded(node, !node.expanded);
  }

  /** @ignore */
  private setExpanded(node: UiMenuNode, expanded: boolean): void {
    if (node.expanded === expanded) return;
    this.expandedKeys.update((keys) => ({ ...keys, [node.key]: expanded }));
  }

  /** @ignore Roving keyboard navigation (WAI-ARIA menu pattern). */
  protected onListKeydown(event: KeyboardEvent): void {
    const keys = this.focusableKeys();
    if (!keys.length) return;
    const currentKey = this.currentFocusKey(event);
    const index = currentKey ? keys.indexOf(currentKey) : -1;

    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.focusByKey(keys[(index + 1) % keys.length]);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.focusByKey(keys[(index - 1 + keys.length) % keys.length]);
        break;
      case 'Home':
        event.preventDefault();
        this.focusByKey(keys[0]);
        break;
      case 'End':
        event.preventDefault();
        this.focusByKey(keys[keys.length - 1]);
        break;
      case 'ArrowRight':
      case 'ArrowLeft': {
        const node = currentKey ? this.findNode(currentKey) : null;
        if (node?.kind === 'toggle') {
          event.preventDefault();
          this.setExpanded(node, event.key === 'ArrowRight');
        }
        break;
      }
      case ' ': {
        // Space activates anchors too (native only on buttons).
        const target = event.target as HTMLElement;
        if (target.tagName === 'A') {
          event.preventDefault();
          target.click();
        }
        break;
      }
      case 'Escape':
        if (this.popup()) {
          event.preventDefault();
          this.hide(true);
        }
        break;
    }
  }

  /** @ignore */
  protected onEntryFocus(node: UiMenuNode): void {
    this.focusedKey.set(node.key);
  }

  /** @ignore id of a header label (aria-labelledby of its group). */
  protected headerId(node: UiMenuNode): string {
    return `${this.uid}-${node.key}-label`;
  }

  /** @ignore id of a collapsible group (aria-controls of its toggle). */
  protected groupId(node: UiMenuNode): string {
    return `${this.uid}-${node.key}-group`;
  }

  // --- Internals ----------------------------------------------------------

  /** @ignore */
  private buildNodes(items: UiMenuItem[], parentKey: string, depth: number): UiMenuNode[] {
    const expandedKeys = this.expandedKeys();
    return items
      .filter((item) => item.visible !== false)
      .map((item, index) => {
        const key = item.id ?? `${parentKey}_${index}`;
        if (item.separator) {
          return { item, key, kind: 'separator', children: [], expanded: false, depth } satisfies UiMenuNode;
        }
        if (item.items) {
          const toggleable = item.toggleable ?? depth > 0;
          const expanded = toggleable ? (expandedKeys[key] ?? item.expanded ?? false) : true;
          return {
            item,
            key,
            kind: toggleable ? 'toggle' : 'header',
            children: this.buildNodes(item.items, key, depth + 1),
            expanded,
            depth,
          } satisfies UiMenuNode;
        }
        return { item, key, kind: 'item', children: [], expanded: false, depth } satisfies UiMenuNode;
      });
  }

  /** @ignore */
  private findNode(key: string, nodes: UiMenuNode[] = this.nodes()): UiMenuNode | null {
    for (const node of nodes) {
      if (node.key === key) return node;
      const found = this.findNode(key, node.children);
      if (found) return found;
    }
    return null;
  }

  /** @ignore Key of the entry currently holding DOM focus. */
  private currentFocusKey(event: KeyboardEvent): string | null {
    const el = (event.target as HTMLElement).closest?.('[data-key]');
    return el?.getAttribute('data-key') ?? this.focusedKey();
  }

  /** @ignore Move DOM focus (and the tab stop) to the entry with the given key. */
  private focusByKey(key: string | undefined): void {
    if (!key) return;
    this.focusedKey.set(key);
    this.panelEl()
      ?.nativeElement.querySelector<HTMLElement>(`[data-key="${CSS.escape(key)}"]`)
      ?.focus();
  }

  /** @ignore Focus the roving tab stop once the popup panel is rendered. */
  private queueFocusTabStop(): void {
    if (typeof requestAnimationFrame === 'undefined') return;
    requestAnimationFrame(() => this.focusByKey(this.tabStopKey() ?? undefined));
  }
}
