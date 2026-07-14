import {
  booleanAttribute,
  Component,
  computed,
  contentChild,
  effect,
  ElementRef,
  inject,
  input,
  output,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { UiSubLevel } from '@app/shared/types/ui-level';
import {
  MenuSize,
  MenuSubmenuMode,
  UiMenu,
  UiMenuItem,
  UiMenuItemCommandEvent,
} from '@app/shared/components/ui/navigation/ui-menu/ui-menu';
import { UiMotion } from '@app/shared/motion/ui-motion';

/** Accepted shapes for the `target` input. */
export type ContextMenuTarget = HTMLElement | ElementRef<HTMLElement> | null;

/**
 * ui-context-menu — contextual menu opened with a right-click (or any
 * `triggerEvent`), positioned at the pointer.
 *
 * Attach it to an element with `target` (template reference variable), or to
 * the whole document with `global`. The panel is a {@link UiMenu} rendered in
 * a CDK overlay anchored on the click coordinates: same declarative
 * {@link UiMenuItem} model (nested submenus, `command`, `routerLink` / `url`),
 * same keyboard navigation, same `navigation.*` tokens — compact density
 * (`size="small"`) by default.
 *
 * Manual wiring is also possible through the public `show(event)` / `hide()` /
 * `toggle(event)` methods.
 *
 * Customisation: `#item` and `#submenuheader` templates (forwarded to the
 * embedded menu), `styleClass`, `level`, `size`.
 */
@Component({
  selector: 'ui-context-menu',
  imports: [OverlayModule, UiMenu, UiMotion],
  templateUrl: './ui-context-menu.html',
  styleUrl: './ui-context-menu.scss',
})
export class UiContextMenu {
  /** Menu entries (see {@link UiMenuItem}). */
  items = input<UiMenuItem[]>([]);
  /** Element the context menu is attached to (template reference variable). */
  target = input<ContextMenuTarget>(null);
  /** Attach to the whole document instead of a specific `target`. */
  global = input(false, { transform: booleanAttribute });
  /** DOM event opening the menu on the target (right-click by default). */
  triggerEvent = input<string>('contextmenu');
  /** Accessible name of the menu list. */
  ariaLabel = input<string>();
  /** Extra class(es) applied to the panel (scoped custom styling). */
  styleClass = input<string>();
  /** Color family: `high` (default) or `low` navigation tokens. */
  level = input<UiSubLevel>('high');
  /** Density — compact by default (contextual action menus). */
  size = input<MenuSize>('small');
  /** Group rendering — cascading side panels by default (classic context menus). */
  submenus = input<MenuSubmenuMode>('flyout');
  /** Animate the menu entrance (reduced-motion always wins). */
  motion = input(true, { transform: booleanAttribute });

  /** Emitted when the menu opens. */
  opened = output<void>();
  /** Emitted when the menu closes. */
  closed = output<void>();
  /** Emitted when a leaf item is clicked / keyboard-activated. */
  itemClick = output<UiMenuItemCommandEvent>();

  /** Custom menuitem content: `<ng-template #item let-item>` (forwarded to the menu). */
  protected readonly itemTemplateContent = contentChild<TemplateRef<unknown>>('item');
  /** Custom group-header content: `<ng-template #submenuheader let-item>` (forwarded). */
  protected readonly submenuHeaderTemplateContent = contentChild<TemplateRef<unknown>>('submenuheader');

  /** @ignore Embedded menu (roving focus entry point). */
  private readonly menu = viewChild<UiMenu>('menu');
  /** @ignore */
  private readonly doc = inject(DOCUMENT);

  /** @ignore Menu visibility. */
  protected readonly open = signal(false);
  /** @ignore Viewport coordinates the overlay is anchored on (derived from `anchorPage`). */
  protected readonly overlayPoint = signal<{ x: number; y: number }>({ x: 0, y: 0 });
  /** @ignore DOCUMENT coordinates of the anchor: the menu belongs to the content,
   * not to the screen — it must follow the page when it scrolls. */
  private anchorPage = { x: 0, y: 0 };

  /** @ignore Below-right of the pointer, flipping on the viewport edges. */
  protected readonly overlayPositions: ConnectedPosition[] = [
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'top' },
    { originX: 'start', originY: 'top', overlayX: 'end', overlayY: 'top' },
    { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom' },
    { originX: 'start', originY: 'top', overlayX: 'end', overlayY: 'bottom' },
  ];

  /** @ignore `_floating` gives the embedded panel its own viewport cap +
   * internal scroll (a wrapper overflow would clip the panel's shadow). */
  protected readonly menuClasses = computed(() =>
    ['_floating', this.styleClass()].filter(Boolean).join(' '),
  );

  /** @ignore */
  private readonly resolvedTarget = computed<HTMLElement | null>(() => {
    const target = this.target();
    return target instanceof ElementRef ? target.nativeElement : (target ?? null);
  });

  constructor() {
    // Bind the trigger listener on the target (or the document when `global`);
    // re-bound whenever target/global/triggerEvent change. Browser only.
    effect((onCleanup) => {
      const trigger = this.triggerEvent();
      const host: EventTarget | null = this.global() ? this.doc : this.resolvedTarget();
      if (!host || typeof window === 'undefined') return;
      const handler = (event: Event) => this.onTrigger(event as MouseEvent);
      host.addEventListener(trigger, handler);
      onCleanup(() => host.removeEventListener(trigger, handler));
    });

    // While open, follow the page scroll: the anchor is a DOCUMENT point
    // (page coordinates captured at open), re-projected into the viewport on
    // every scroll — the menu stays where it was opened, like a DOM node.
    effect((onCleanup) => {
      if (!this.open() || typeof window === 'undefined') return;
      const handler = () =>
        this.overlayPoint.set({
          x: this.anchorPage.x - window.scrollX,
          y: this.anchorPage.y - window.scrollY,
        });
      this.doc.addEventListener('scroll', handler, { capture: true, passive: true });
      onCleanup(() => this.doc.removeEventListener('scroll', handler, true));
    });

    // While open, close on the PRESS of any pointer outside the overlays —
    // not on release: CDK's outside-click dispatcher attributes the opening
    // right-click's own `auxclick` (fired on release) to its pre-open
    // `pointerdown` and would close the menu as soon as the button is let go.
    effect((onCleanup) => {
      if (!this.open() || typeof window === 'undefined') return;
      const handler = (event: Event) => this.onDocumentPointerdown(event as PointerEvent);
      this.doc.addEventListener('pointerdown', handler, true);
      onCleanup(() => this.doc.removeEventListener('pointerdown', handler, true));
    });
  }

  // --- Public API ---------------------------------------------------------

  /** Opens the menu at the event's pointer coordinates. */
  show(event: MouseEvent): void {
    const scrollX = typeof window === 'undefined' ? 0 : window.scrollX;
    const scrollY = typeof window === 'undefined' ? 0 : window.scrollY;
    this.anchorPage = { x: event.clientX + scrollX, y: event.clientY + scrollY };
    this.overlayPoint.set({ x: event.clientX, y: event.clientY });
    if (!this.open()) {
      this.open.set(true);
      this.opened.emit();
    }
    this.queueFocusFirst();
  }

  /** Closes the menu. */
  hide(): void {
    if (!this.open()) return;
    this.open.set(false);
    this.closed.emit();
  }

  /** Toggles the menu at the event's pointer coordinates. */
  toggle(event: MouseEvent): void {
    this.open() ? this.hide() : this.show(event);
  }

  // --- Interactions ---------------------------------------------------------

  /** @ignore Trigger event on the target/document: hijack it and open at the pointer. */
  private onTrigger(event: MouseEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.show(event);
  }

  /** @ignore A new pointer press outside every overlay closes the menu.
   * Presses inside an overlay (menu panel, flyout side panels) are kept;
   * a press on the attached zone closes then immediately reopens through
   * the trigger handler (native repositioning behavior). */
  private onDocumentPointerdown(event: PointerEvent): void {
    if (event.target instanceof Element && event.target.closest('.cdk-overlay-container')) return;
    this.hide();
  }

  /** @ignore */
  protected onEscape(event: Event): void {
    event.stopPropagation();
    this.hide();
    this.resolvedTarget()?.focus?.();
  }

  /** @ignore Activation of a leaf item: re-emit and close. */
  protected onItemClick(event: UiMenuItemCommandEvent): void {
    this.itemClick.emit(event);
    this.hide();
  }

  /** @ignore Focus the menu's first entry once the overlay is rendered.
   * The overlay attaches after change detection: retry over macrotasks
   * (NOT rAF — it never fires in throttled/background tabs). */
  private queueFocusFirst(attempts = 20): void {
    setTimeout(() => {
      const menu = this.menu();
      if (menu) menu.focusFirst();
      else if (attempts > 0) this.queueFocusFirst(attempts - 1);
    });
  }
}
