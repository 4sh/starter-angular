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
  TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser, NgStyle, NgTemplateOutlet } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { UiMotion, UiMotionPreset } from '@app/shared/motion/ui-motion';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';

/** Edge the drawer is anchored to (and slides in from). */
export type DrawerPosition = 'left' | 'right' | 'top' | 'bottom';

/** Base stacking level — mirrors `$drawer-z-index` in the SCSS. */
const DRAWER_BASE_Z_INDEX = 1100;

/** Process-wide sequence so `autoZIndex` layers a later drawer above earlier ones. */
let zIndexSeq = 0;
/** Process-wide unique id source (aria wiring). */
let nextUid = 0;

// --- Body scroll lock (ref-counted, shared across nested drawers) -------
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

/** Release one scroll lock; restore the body when the last drawer closes. */
function unlockBodyScroll(doc: Document): void {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    doc.body.style.overflow = savedOverflow;
    doc.body.style.paddingRight = savedPaddingRight;
  }
}

/**
 * ui-drawer — headless slide-in panel anchored to a screen edge.
 *
 * A token-styled surface docked to an edge (`left` / `right` / `top` / `bottom`)
 * and rendered over an optional viewport mask, driven by the two-way `visible`
 * model. Enter/leave run through the shared motion system: the mask fades while
 * the panel slides in from its edge (the slide direction is derived from
 * `position`, the offset stretched to the panel's own size). Built for
 * accessibility: focus trap with focus restore (`@angular/cdk/a11y`),
 * `aria-modal`, background scroll lock, `Escape` to close, and an optional
 * click-outside dismiss.
 *
 * Composes header / content / footer regions: a plain `header` string (or the
 * `#header` template), the default `<ng-content>` for the body, and a `#footer`
 * template for actions. A `#headless` template takes over the whole panel when
 * total control of the interface is required (the drawer still owns the overlay
 * mechanics: mask, motion, focus trap, `Escape`).
 *
 * @example
 * ```html
 * <ui-button label="Ouvrir" (buttonClick)="open.set(true)" />
 * <ui-drawer [(visible)]="open" header="Menu" position="right">
 *   <p>Contenu…</p>
 * </ui-drawer>
 * ```
 */
@Component({
  selector: 'ui-drawer',
  imports: [NgTemplateOutlet, NgStyle, A11yModule, UiMotion, UiIcon],
  templateUrl: './ui-drawer.html',
  styleUrl: './ui-drawer.scss',
})
export class UiDrawer {
  /** Open state (two-way). Toggling it drives the enter/leave animation. */
  visible = model(false);

  /** Edge the drawer docks to and slides in from. */
  position = input<DrawerPosition>('left');
  /** Fill the whole viewport (the panel fades in instead of sliding). */
  fullScreen = input(false, { transform: booleanAttribute });

  /** Simple header text (ignored when a `#header` template is projected). */
  header = input<string>();
  /** ARIA role of the panel surface. */
  role = input<string>('dialog');
  /** Accessible name when there is no visible header to reference. */
  ariaLabel = input<string>();
  /** Id of an external element naming the panel (overrides the header title). */
  ariaLabelledBy = input<string>();

  /** Show the mask (dim + capture) and block background scroll. */
  modal = input(true, { transform: booleanAttribute });
  /** Close when the mask (outside the panel) is clicked — modal only. */
  dismissableMask = input(true, { transform: booleanAttribute });
  /** Show the close (×) button. */
  closable = input(true, { transform: booleanAttribute });
  /** Close the drawer when `Escape` is pressed. */
  closeOnEscape = input(true, { transform: booleanAttribute });
  /** Block background scroll even for a non-modal drawer. */
  blockScroll = input(false, { transform: booleanAttribute });
  /** Render the header region (title + close button). */
  showHeader = input(true, { transform: booleanAttribute });

  /** Move focus into the panel when it opens (auto-captured, restored on close). */
  focusOnShow = input(true, { transform: booleanAttribute });
  /** Trap Tab focus inside the panel while open. */
  focusTrap = input(true, { transform: booleanAttribute });

  /** FontAwesome name of the close button icon. */
  closeIcon = input<string>('xmark');
  /** Accessible name of the close button. */
  closeAriaLabel = input<string>('Fermer');

  /** Extra class(es) merged onto the panel surface. */
  styleClass = input<string>();
  /** Extra class(es) merged onto the mask. */
  maskStyleClass = input<string>();
  /** Inline styles applied to the panel (e.g. `{ width: '30rem' }`). */
  drawerStyle = input<Record<string, string>>();

  /**
   * Scope the drawer to the nearest positioned ancestor (`position: absolute`)
   * instead of the viewport (`position: fixed`), and skip the body scroll lock.
   * Useful to embed a drawer inside a bounded container (docs previews, panels).
   */
  contained = input(false, { transform: booleanAttribute });

  /** Layer this drawer above earlier overlays automatically. */
  autoZIndex = input(true, { transform: booleanAttribute });
  /** Floor z-index (added to the auto value, or used as-is when `autoZIndex=false`). */
  baseZIndex = input(0, { transform: numberAttribute });

  /** Disable the open/close animation for this drawer. */
  motionDisabled = input(false, { transform: booleanAttribute });

  /** Custom header template (replaces the `header` string). */
  protected readonly headerTemplate = contentChild<TemplateRef<unknown>>('header');
  /** Footer template (actions row). */
  protected readonly footerTemplate = contentChild<TemplateRef<unknown>>('footer');
  /** Custom close-icon template (replaces `closeIcon`). */
  protected readonly closeIconTemplate = contentChild<TemplateRef<unknown>>('closeicon');
  /** Headless template — takes over the entire panel interior when provided. */
  protected readonly headlessTemplate = contentChild<TemplateRef<unknown>>('headless');

  /** Emitted after the drawer becomes visible. */
  onShow = output<void>();
  /** Emitted after the drawer is hidden. */
  onHide = output<void>();

  /** @ignore */
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');
  /** @ignore Scrim host (for imperative `maskStyleClass` — a bound `[class]` would
   *  fight the motion classes and break the leave animation). */
  private readonly scrimRef = viewChild<ElementRef<HTMLElement>>('scrim');
  /** @ignore Classes currently applied to the scrim by `maskStyleClass`. */
  private appliedMaskClasses: string[] = [];

  /** @ignore */
  private readonly document = inject(DOCUMENT);
  /** @ignore */
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  /** @ignore Per-instance layering rank for `autoZIndex`. */
  private readonly zSeq = ++zIndexSeq;

  /** @ignore */
  protected readonly uid = `ui-drawer-${nextUid++}`;
  /** @ignore */
  protected readonly titleId = `${this.uid}-title`;

  /** @ignore This instance currently holds a body scroll lock. */
  private locked = false;

  /** @ignore Effective stacking level. */
  protected readonly zIndex = computed(() => {
    const base = this.baseZIndex();
    if (this.autoZIndex()) return DRAWER_BASE_Z_INDEX + base + this.zSeq;
    return base > 0 ? base : DRAWER_BASE_Z_INDEX;
  });

  // NOTE: the scrim and positioner carry `animate.enter`/`animate.leave`. They MUST use
  // a static `class` + per-class `[class.x]` toggles — a whole-string `[class]="expr()"`
  // binding fights the motion classes Angular adds and restarts the animation every
  // frame (leave never ends → node never removed). Sizing/styleClass live on the inner
  // panel, which carries no motion binding.

  /**
   * @ignore Slide preset derived from the anchored edge (offset stretched to 100%
   * of the panel's own size so it travels fully off-screen). A full-screen drawer
   * fades instead of sliding a whole viewport of content.
   */
  protected readonly motionPreset = computed<UiMotionPreset>(() => {
    if (this.fullScreen()) return 'fade';
    switch (this.position()) {
      case 'right':
        return 'slide-left'; // enters from the right edge
      case 'top':
        return 'slide-down'; // drops from the top edge
      case 'bottom':
        return 'slide-up'; // rises from the bottom edge
      default:
        return 'slide-right'; // 'left' — enters from the left edge
    }
  });

  /** @ignore Slide offset: the panel's full extent (omitted for the fade-only full-screen). */
  protected readonly motionDistance = computed(() => (this.fullScreen() ? undefined : '100%'));

  /** @ignore Id of the element naming the panel (header title, or an external id). */
  protected readonly labelledBy = computed(
    () => this.ariaLabelledBy() ?? (this.showHeader() && this.header() ? this.titleId : null),
  );
  /** @ignore Fallback accessible name when nothing is referenced. */
  protected readonly resolvedAriaLabel = computed(() => (this.labelledBy() ? null : this.ariaLabel()));

  constructor() {
    const destroyRef = inject(DestroyRef);
    let wasVisible = false;

    // Open/close side effects: scroll lock, lifecycle events.
    effect(() => {
      const v = this.visible();
      untracked(() => {
        if (v && !wasVisible) {
          wasVisible = true;
          // A contained drawer is embedded, not a real overlay → never lock the body.
          if (this.isBrowser && !this.contained() && (this.modal() || this.blockScroll())) {
            lockBodyScroll(this.document);
            this.locked = true;
          }
          this.onShow.emit();
        } else if (!v && wasVisible) {
          wasVisible = false;
          this.releaseLock();
          this.onHide.emit();
        }
      });
    });

    // Apply `maskStyleClass` imperatively (see scrimRef note).
    effect(() => {
      const el = this.scrimRef()?.nativeElement;
      const raw = this.maskStyleClass();
      untracked(() => {
        for (const c of this.appliedMaskClasses) el?.classList.remove(c);
        this.appliedMaskClasses = el && raw ? raw.split(/\s+/).filter(Boolean) : [];
        for (const c of this.appliedMaskClasses) el!.classList.add(c);
      });
    });

    // A11y safeguard: a drawer must have an accessible name.
    if (isDevMode()) {
      effect(() => {
        if (this.visible() && !this.labelledBy() && !this.resolvedAriaLabel()) {
          console.warn(
            '[ui-drawer] Panneau sans nom accessible : renseignez `header`, `ariaLabel` ou `ariaLabelledBy`.',
          );
        }
      });
    }

    destroyRef.onDestroy(() => this.releaseLock());
  }

  /** Close the drawer. */
  close(): void {
    this.visible.set(false);
  }

  /** Move focus onto the panel surface. */
  focus(): void {
    this.panelRef()?.nativeElement.focus();
  }

  /** @ignore Escape-to-close (bubbles from any focused control inside the panel). */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.closeOnEscape() && this.closable()) {
      event.stopPropagation();
      this.close();
    }
  }

  /** @ignore Click-outside dismiss (mask target only, modal + dismissable). */
  protected onMaskPointerdown(event: PointerEvent): void {
    if (!this.modal() || !this.dismissableMask() || !this.closable()) return;
    if (event.target === event.currentTarget) this.close();
  }

  /** @ignore Release this instance's scroll lock, if held. */
  private releaseLock(): void {
    if (this.locked) {
      unlockBodyScroll(this.document);
      this.locked = false;
    }
  }
}
