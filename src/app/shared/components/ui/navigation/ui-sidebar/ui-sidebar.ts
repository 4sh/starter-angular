import {
  booleanAttribute,
  Component,
  computed,
  contentChild,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  isDevMode,
  model,
  numberAttribute,
  output,
  PLATFORM_ID,
  signal,
  TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser, NgTemplateOutlet } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { UiMotion, UiMotionPreset } from '@app/shared/motion/ui-motion';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';

/** Edge the sidebar is docked to. */
export type SidebarSide = 'left' | 'right';

/**
 * Layout strategy:
 * - `static`  — the sidebar lives in the page flow and pushes the inset. It can
 *   collapse to an icon rail (`collapsed`).
 * - `overlay` — the sidebar floats over the content as an offcanvas panel with a
 *   backdrop, driven by the two-way `visible` model.
 *
 * With `responsive` enabled, a `static` sidebar automatically switches to
 * `overlay` below `breakpoint` (mobile offcanvas), and back to the static rail
 * above it.
 */
export type SidebarMode = 'static' | 'overlay';

/** Base stacking level for the overlay presentation. */
const SIDEBAR_BASE_Z_INDEX = 1000;

/** Process-wide unique id source (aria wiring). */
let nextUid = 0;

// --- Body scroll lock (ref-counted, shared across overlay sidebars) -------
let scrollLockCount = 0;
let savedOverflow = '';
let savedPaddingRight = '';

/** Freeze background scroll, compensating the scrollbar gutter to avoid a shift. */
function lockBodyScroll(doc: Document): void {
  if (scrollLockCount === 0) {
    const body = doc.body;
    const gap = (doc.defaultView?.innerWidth ?? 0) - doc.documentElement.clientWidth;
    savedOverflow = body.style.overflow;
    savedPaddingRight = body.style.paddingRight;
    body.style.overflow = 'hidden';
    if (gap > 0) body.style.paddingRight = `${gap}px`;
  }
  scrollLockCount++;
}

/** Release one scroll lock; restore the body when the last overlay closes. */
function unlockBodyScroll(doc: Document): void {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    doc.body.style.overflow = savedOverflow;
    doc.body.style.paddingRight = savedPaddingRight;
  }
}

/**
 * ui-sidebar — headless application sidebar (navigation chrome).
 *
 * A token-styled vertical surface docked to the `left` or `right` edge, meant to
 * host application navigation (workspace switcher, menus, user footer). Two
 * presentations share the exact same interior:
 *
 * - **Static** (default): the sidebar sits in the layout flow and pushes the
 *   page inset. When `collapsible`, it folds down to an icon **rail**
 *   (`collapsed`, two-way). With `openOnHover`, a collapsed rail temporarily
 *   floats open on hover / focus without shifting the content.
 * - **Overlay**: the sidebar floats over the content as an offcanvas panel with
 *   an optional `backdrop`, driven by the two-way `visible` model — focus trap
 *   and restore (`@angular/cdk/a11y`), `aria-modal`, background scroll lock,
 *   `Escape` to close and an optional click-outside dismiss.
 *
 * With `responsive`, a static sidebar automatically becomes an overlay below
 * `breakpoint` (mobile offcanvas) and returns to the rail above it.
 *
 * Descendant components (e.g. `ui-sidebar-menu`) read the resolved collapsed
 * state through dependency injection, so dropping a menu inside adapts it to the
 * rail automatically. Toggle the sidebar from anywhere with the
 * `[uiSidebarTrigger]` directive.
 *
 * @example
 * ```html
 * <button [uiSidebarTrigger]="sb">Menu</button>
 * <ui-sidebar #sb collapsible ariaLabel="Navigation principale">
 *   <ng-template #header>…</ng-template>
 *   <ui-sidebar-menu [items]="items" />
 *   <ng-template #footer>…</ng-template>
 * </ui-sidebar>
 * ```
 */
@Component({
  selector: 'ui-sidebar',
  imports: [NgTemplateOutlet, A11yModule, UiMotion, UiIcon],
  templateUrl: './ui-sidebar.html',
  styleUrl: './ui-sidebar.scss',
})
export class UiSidebar {
  /** Edge the sidebar docks to. */
  side = input<SidebarSide>('left');
  /** Presentation strategy (see {@link SidebarMode}). */
  mode = input<SidebarMode>('static');

  /** Allow folding to the icon rail (static mode). */
  collapsible = input(true, { transform: booleanAttribute });
  /** Icon-rail state (two-way). Only meaningful in static mode. */
  collapsed = model(false);

  /** Offcanvas open state (two-way). Only meaningful in overlay mode. */
  visible = model(false);

  /** A collapsed rail floats open on hover / focus (static mode). */
  openOnHover = input(false, { transform: booleanAttribute });

  /** Show the backdrop (dim + capture) and block background scroll — overlay only. */
  backdrop = input(true, { transform: booleanAttribute });
  /** Close on backdrop click / `Escape` — overlay only. */
  dismissable = input(true, { transform: booleanAttribute });
  /** Close the overlay when `Escape` is pressed. */
  closeOnEscape = input(true, { transform: booleanAttribute });
  /** Render the built-in close button in the overlay presentation. */
  showCloseButton = input(true, { transform: booleanAttribute });

  /**
   * Auto-switch a static sidebar to an overlay below `breakpoint`. Aligns with
   * the design-system breakpoint scale (`$breakpoint-*`).
   */
  responsive = input(false, { transform: booleanAttribute });
  /**
   * Viewport width under which a responsive sidebar becomes an offcanvas
   * overlay. Any CSS length; prefer a value from the breakpoint scale
   * (`tabletLandscape` 900px / `desktop` 1200px).
   */
  breakpoint = input<string>('1024px');

  /** Accessible name for the landmark region. */
  ariaLabel = input<string>();
  /** Id of an external element naming the region. */
  ariaLabelledBy = input<string>();

  /** FontAwesome name of the close button icon. */
  closeIcon = input<string>('xmark');
  /** Accessible name of the close button. */
  closeAriaLabel = input<string>('Fermer');

  /** Extra class(es) merged onto the panel surface. */
  styleClass = input<string>();

  /**
   * Scope the overlay presentation to the nearest positioned ancestor
   * (`position: absolute`) instead of the viewport, and skip the body scroll
   * lock. Useful to embed a sidebar inside a bounded region (docs previews,
   * split panels).
   */
  contained = input(false, { transform: booleanAttribute });

  /** Floor z-index for the overlay presentation. */
  baseZIndex = input(0, { transform: numberAttribute });
  /** Disable the open/close animation for this sidebar. */
  motionDisabled = input(false, { transform: booleanAttribute });

  /** Header region template (logo, workspace switcher…). */
  protected readonly headerTemplate = contentChild<TemplateRef<unknown>>('header');
  /** Footer region template (user card, actions…). */
  protected readonly footerTemplate = contentChild<TemplateRef<unknown>>('footer');

  /** Emitted after the overlay becomes visible. */
  onShow = output<void>();
  /** Emitted after the overlay is hidden. */
  onHide = output<void>();

  /** @ignore */
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');
  /** @ignore */
  private readonly document = inject(DOCUMENT);
  /** @ignore */
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** Stable id of the panel — referenced by `[uiSidebarTrigger]` (`aria-controls`). */
  readonly controlsId = `ui-sidebar-${nextUid++}`;
  /** @ignore */
  protected readonly titleId = `${this.controlsId}-title`;

  /** @ignore This instance currently holds a body scroll lock. */
  private locked = false;
  /** @ignore Pointer is over the panel (drives `openOnHover`). */
  private readonly hovering = signal(false);
  /** @ignore Viewport is below `breakpoint` (responsive switch). */
  private readonly belowBreakpoint = signal(false);

  /** True when the sidebar is presented as a floating overlay. */
  readonly isOverlay = computed(
    () => this.mode() === 'overlay' || (this.responsive() && this.belowBreakpoint()),
  );

  /**
   * Resolved icon-rail state exposed to descendants (menus). Always expanded in
   * the overlay presentation, and temporarily expanded while an `openOnHover`
   * rail is hovered / focused.
   */
  readonly effectiveCollapsed = computed(() => {
    if (this.isOverlay()) return false;
    if (!this.collapsed()) return false;
    return !(this.openOnHover() && this.hovering());
  });

  /** Whether the trigger should report an expanded state (`aria-expanded`). */
  readonly expanded = computed(() => (this.isOverlay() ? this.visible() : !this.collapsed()));

  /** @ignore Layout footprint follows the toggled state, never the hover float. */
  protected readonly railCollapsed = computed(() => !this.isOverlay() && this.collapsed());

  /** @ignore Panel is floating over the content (hover-expanded rail). */
  protected readonly floating = computed(
    () => this.openOnHover() && this.collapsed() && this.hovering() && !this.isOverlay(),
  );

  /** @ignore Classes applied to the panel surface. */
  protected readonly panelClasses = computed(() => {
    const c = ['ui-sidebar', `_${this.side()}`];
    if (this.effectiveCollapsed()) c.push('_collapsed');
    if (this.floating()) c.push('_floating');
    if (this.isOverlay()) c.push('_overlay');
    const extra = this.styleClass();
    if (extra) c.push(extra);
    return c.join(' ');
  });

  /** @ignore Directional slide preset for the overlay presentation. */
  protected readonly motionPreset = computed<UiMotionPreset>(() =>
    this.side() === 'right' ? 'slide-left' : 'slide-right',
  );

  /** @ignore Effective overlay stacking level. */
  protected readonly zIndex = computed(() => SIDEBAR_BASE_Z_INDEX + this.baseZIndex());

  /** @ignore Id naming the region (external id wins). */
  protected readonly labelledBy = computed(() => this.ariaLabelledBy() ?? null);
  /** @ignore Fallback accessible name. */
  protected readonly resolvedAriaLabel = computed(() =>
    this.labelledBy() ? null : (this.ariaLabel() ?? 'Navigation'),
  );

  constructor() {
    const destroyRef = inject(DestroyRef);
    let wasOpen = false;

    // Overlay lifecycle: scroll lock + show/hide events.
    effect(() => {
      const open = this.isOverlay() && this.visible();
      untracked(() => {
        if (open && !wasOpen) {
          wasOpen = true;
          if (this.isBrowser && this.backdrop() && !this.contained()) {
            lockBodyScroll(this.document);
            this.locked = true;
          }
          this.onShow.emit();
        } else if (!open && wasOpen) {
          wasOpen = false;
          this.releaseLock();
          this.onHide.emit();
        }
      });
    });

    // Responsive: track the viewport against `breakpoint`.
    if (this.isBrowser) {
      effect((onCleanup) => {
        const query = this.mediaQuery();
        const mql = this.document.defaultView!.matchMedia(query);
        const apply = () => this.belowBreakpoint.set(mql.matches);
        apply();
        mql.addEventListener('change', apply);
        onCleanup(() => mql.removeEventListener('change', apply));
      });
    }

    // A11y safeguard: a landmark region needs an accessible name.
    if (isDevMode()) {
      effect(() => {
        if (!this.labelledBy() && !this.ariaLabel()) {
          // resolvedAriaLabel falls back to "Navigation"; warn so consumers set an explicit name.
          untracked(() => {
            console.warn(
              '[ui-sidebar] Aucune étiquette explicite : renseignez `ariaLabel` ou `ariaLabelledBy` pour nommer la zone de navigation.',
            );
          });
        }
      });
    }

    destroyRef.onDestroy(() => this.releaseLock());
  }

  /** @ignore Media query for the responsive switch (just under the breakpoint). */
  private readonly mediaQuery = computed(() => {
    const bp = this.breakpoint().trim();
    const match = /^(-?\d*\.?\d+)px$/.exec(bp);
    if (match) {
      const px = parseFloat(match[1]) - 0.02;
      return `(max-width: ${px}px)`;
    }
    return `(max-width: ${bp})`;
  });

  /** Toggle the sidebar (visibility in overlay mode, collapse in static mode). */
  toggle(): void {
    if (this.isOverlay()) {
      this.visible.update((v) => !v);
    } else if (this.collapsible()) {
      this.collapsed.update((c) => !c);
    }
  }

  /** Open / expand the sidebar. */
  open(): void {
    if (this.isOverlay()) this.visible.set(true);
    else this.collapsed.set(false);
  }

  /** Close / collapse the sidebar. */
  close(): void {
    if (this.isOverlay()) this.visible.set(false);
    else if (this.collapsible()) this.collapsed.set(true);
  }

  /** Move focus onto the panel surface. */
  focus(): void {
    this.panelRef()?.nativeElement.focus();
  }

  /** @ignore Rail hover in/out (drives `openOnHover`). */
  protected onRailPointerEnter(): void {
    if (this.openOnHover()) this.hovering.set(true);
  }
  /** @ignore */
  protected onRailPointerLeave(): void {
    if (this.openOnHover()) this.hovering.set(false);
  }
  /** @ignore Keep the rail floating open while focus is inside it. */
  protected onRailFocusIn(): void {
    if (this.openOnHover()) this.hovering.set(true);
  }
  /** @ignore */
  protected onRailFocusOut(event: FocusEvent): void {
    if (!this.openOnHover()) return;
    const next = event.relatedTarget as Node | null;
    const rail = event.currentTarget as HTMLElement;
    if (!next || !rail.contains(next)) this.hovering.set(false);
  }

  /** @ignore Escape-to-close (overlay, bubbles from inside the panel). */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.closeOnEscape() && this.dismissable()) {
      event.stopPropagation();
      this.visible.set(false);
    }
  }

  /** @ignore Backdrop click dismiss (overlay). */
  protected onBackdropPointerdown(event: PointerEvent): void {
    if (!this.dismissable()) return;
    if (event.target === event.currentTarget) this.visible.set(false);
  }

  /** @ignore Release this instance's scroll lock, if held. */
  private releaseLock(): void {
    if (this.locked) {
      unlockBodyScroll(this.document);
      this.locked = false;
    }
  }
}
