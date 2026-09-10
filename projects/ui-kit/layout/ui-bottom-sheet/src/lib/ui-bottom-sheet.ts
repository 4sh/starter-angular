import {
  afterNextRender,
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
  model,
  numberAttribute,
  output,
  PLATFORM_ID,
  signal,
  untracked,
  viewChild,
} from '@angular/core';
import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { A11yModule } from '@angular/cdk/a11y';
import { UiIcon } from '@4sh/ui-kit/base/ui-icon';

/** Named opening detents. */
export type BottomSheetHeightPreset = 'auto' | 'half' | 'full';

/**
 * Opening height: a preset detent, or any CSS length (`'70vh'`, `'400px'`).
 * `Record<never, never>` keeps the presets suggested by the editor while still
 * accepting a free-form string.
 */
export type BottomSheetHeight = BottomSheetHeightPreset | (string & Record<never, never>);

/** The preset detents, for the runtime discrimination `height` needs. */
const HEIGHT_PRESETS: readonly string[] = ['auto', 'half', 'full'];

/** Base stacking level, mirroring `$sheet-z-index` in the SCSS. */
const SHEET_BASE_Z_INDEX = 1100;

/** Fallback settle delay when the transition duration cannot be read (ms). */
const SETTLE_FALLBACK_MS = 320;
/** Margin added to the measured duration before the settle fallback fires (ms). */
const SETTLE_MARGIN_MS = 60;

/** Interactive descendants that must keep their own gesture instead of starting a drag. */
const INTERACTIVE = 'button, a[href], input, select, textarea, [role="button"], [contenteditable]';
/** The handle itself is interactive in snapping mode, yet it IS the grab affordance. */
const HANDLE_CLASS = 'ui-bottom-sheet-handle';

/** Process-wide sequence so `autoZIndex` layers a later sheet above earlier ones. */
let zIndexSeq = 0;
/** Process-wide unique id source (aria wiring). */
let nextUid = 0;

// --- Body scroll lock (ref-counted, shared across nested sheets) --------
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

/** Release one scroll lock; restore the body when the last sheet closes. */
function unlockBodyScroll(doc: Document): void {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    doc.body.style.overflow = savedOverflow;
    doc.body.style.paddingRight = savedPaddingRight;
  }
}

/**
 * Slot markers routing projected content to a region. No behaviour: the sheet
 * only queries their presence. Each accepts the kebab attribute and the kit's
 * camelCase alias (`uiBottomSheetHeader`).
 */
/** Header region: title and/or close button. Stays pinned above the scrolling body. */
@Directive({ selector: '[uiBottomSheetHeader], [ui-bottom-sheet-header]' })
export class UiBottomSheetHeader {}

/** Main region. Scrolls natively when the content overflows the sheet. */
@Directive({ selector: '[uiBottomSheetContent], [ui-bottom-sheet-content]' })
export class UiBottomSheetContent {}

/** Footer region: actions. Stays pinned below the scrolling body. */
@Directive({ selector: '[uiBottomSheetFooter], [ui-bottom-sheet-footer]' })
export class UiBottomSheetFooter {}

/**
 * ui-bottom-sheet: headless, mobile-first panel that slides up from the bottom
 * edge, driven by the two-way `visible` model.
 *
 * Enter/leave are CSS transitions on `transform`, which is what lets the
 * drag-to-close gesture flow straight into the closing animation. Content goes
 * into three projected regions laid out as a flex column, so header and footer
 * stay put while the body scrolls. See the MDX page for the full contract.
 *
 * @example
 * ```html
 * <ui-button label="Rechercher" (buttonClick)="open.set(true)" />
 * <ui-bottom-sheet [(visible)]="open" height="half" autoFocusElement="#q">
 *   <h2 ui-bottom-sheet-header>Recherche</h2>
 *   <div ui-bottom-sheet-content><ui-input id="q" /></div>
 * </ui-bottom-sheet>
 * ```
 */
@Component({
  selector: 'ui-bottom-sheet',
  imports: [A11yModule, UiIcon],
  templateUrl: './ui-bottom-sheet.html',
  styleUrl: './ui-bottom-sheet.scss',
})
export class UiBottomSheet {
  /** Open state (two-way). Toggling it drives the enter/leave animation. */
  visible = model(false);

  /**
   * Opening height: `'auto'` (hugs the content, capped), `'half'` (half the
   * screen), `'full'` (the whole screen) or any CSS length (`'70vh'`, `'400px'`).
   */
  height = input<BottomSheetHeight>('auto');

  /** Show the backdrop (dim + capture), which is also what makes the sheet modal. */
  hasBackdrop = input(true, { transform: booleanAttribute });
  /** Close when the backdrop is clicked. */
  closeOnOverlayClick = input(true, { transform: booleanAttribute });
  /** Close the sheet when `Escape` is pressed. */
  closeOnEscape = input(true, { transform: booleanAttribute });
  /** Block background scroll while the sheet is open. */
  blockScroll = input(true, { transform: booleanAttribute });

  /** Close the sheet by dragging it down (touch, mouse, pen). */
  enableDragToClose = input(true, { transform: booleanAttribute });
  /** Distance to drag before the release closes the sheet (px). */
  dragThreshold = input(96, { transform: numberAttribute });
  /**
   * Let the user drag a `'half'` sheet up to `'full'` (and back down again).
   * The detent change is the only motion that touches `height`.
   */
  enableSnapping = input(false, { transform: booleanAttribute });
  /** Show the grab handle at the top of the sheet. */
  showHandle = input(true, { transform: booleanAttribute });

  /** Trap Tab focus inside the sheet while it is open. */
  trapFocus = input(true, { transform: booleanAttribute });
  /** Move focus into the sheet when it opens (restored on close). */
  focusOnShow = input(true, { transform: booleanAttribute });
  /** CSS selector of the element to focus on opening (e.g. `'#searchInput'`). */
  autoFocusElement = input<string | null>(null);

  /** Simple header text (ignored when a header slot is projected). */
  header = input<string>();
  /** Show the close (×) button in the header region. Off by default, as in the design. */
  closable = input(false, { transform: booleanAttribute });
  /** FontAwesome name of the close button icon. */
  closeIcon = input<string>('xmark');
  /** Accessible name of the close button. */
  closeAriaLabel = input<string>('Fermer');
  /** Accessible name of the handle when it is operable (`enableSnapping`). */
  handleAriaLabel = input<string>('Redimensionner le panneau');

  /** ARIA role of the sheet surface. */
  role = input<string>('dialog');
  /** Accessible name when there is no visible header to reference. */
  ariaLabel = input<string>();
  /** Id of an external element naming the sheet (overrides the header title). */
  ariaLabelledBy = input<string>();

  /** Reserve the OS inset at the bottom of the screen (home indicator, gesture bar). */
  safeArea = input(true, { transform: booleanAttribute });
  /**
   * Scope the sheet to the nearest positioned ancestor (`position: absolute`)
   * instead of the viewport, and skip the body scroll lock. Detents become
   * fractions of that container.
   */
  contained = input(false, { transform: booleanAttribute });
  /** Disable the open/close animation for this sheet. */
  motionDisabled = input(false, { transform: booleanAttribute });
  /** Extra class(es) merged onto the sheet surface. */
  styleClass = input<string>();

  /** Layer this sheet above earlier overlays automatically. */
  autoZIndex = input(true, { transform: booleanAttribute });
  /** Floor z-index (added to the auto value, or used as-is when `autoZIndex=false`). */
  baseZIndex = input(0, { transform: numberAttribute });

  /** Emitted at the end of the opening animation. */
  opened = output<void>();
  /** Emitted at the end of the closing animation. */
  closed = output<void>();

  /** @ignore */
  protected readonly headerSlot = contentChild(UiBottomSheetHeader);
  /** @ignore */
  protected readonly contentSlot = contentChild(UiBottomSheetContent);
  /** @ignore */
  protected readonly footerSlot = contentChild(UiBottomSheetFooter);

  /** @ignore */
  private readonly positionerRef = viewChild<ElementRef<HTMLElement>>('positioner');
  /** @ignore */
  private readonly panelRef = viewChild<ElementRef<HTMLElement>>('panel');

  /** @ignore */
  private readonly document = inject(DOCUMENT);
  /** @ignore */
  private readonly injector = inject(Injector);
  /** @ignore */
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  /** @ignore Per-instance layering rank for `autoZIndex`. */
  private readonly zSeq = ++zIndexSeq;

  /** @ignore */
  protected readonly uid = `ui-bottom-sheet-${nextUid++}`;
  /** @ignore */
  protected readonly titleId = `${this.uid}-title`;

  // --- Internal state --------------------------------------------------
  // `mounted` keeps the node in the DOM while the leave transition plays;
  // `atRest` is the position the panel transitions towards.

  /** @ignore */
  protected readonly mounted = signal(false);
  /** @ignore */
  protected readonly atRest = signal(false);
  /** @ignore Live drag distance, downwards only (px). */
  protected readonly dragOffset = signal(0);
  /** @ignore Live height while dragging a snapping sheet upwards (px). */
  protected readonly dragHeight = signal<number | null>(null);
  /** @ignore */
  protected readonly dragging = signal(false);
  /** @ignore The `'half'` sheet is currently snapped to `'full'`. */
  protected readonly snapped = signal(false);

  /** @ignore */
  private locked = false;
  /** @ignore Transition currently awaited, if any. */
  private pending: 'open' | 'close' | null = null;
  /** @ignore */
  private settleTimer: ReturnType<typeof setTimeout> | null = null;
  /** @ignore */
  private focusTimer: ReturnType<typeof setTimeout> | null = null;
  /** @ignore */
  private dragPointerId: number | null = null;
  /** @ignore */
  private dragStartY = 0;
  /** @ignore Panel height when the drag started (px), for the upward clamp. */
  private dragStartHeight = 0;

  /** @ignore Effective stacking level. */
  protected readonly zIndex = computed(() => {
    const base = this.baseZIndex();
    if (this.autoZIndex()) return SHEET_BASE_Z_INDEX + base + this.zSeq;
    return base > 0 ? base : SHEET_BASE_Z_INDEX;
  });

  /** @ignore The `'half'` detent can grow to `'full'` on a drag. */
  protected readonly canSnap = computed(() => this.enableSnapping() && this.height() === 'half');
  /** @ignore A gesture on the drag area does something. */
  protected readonly dragEnabled = computed(() => this.enableDragToClose() || this.canSnap());

  /** @ignore Detent in force, once snapping is taken into account. */
  private readonly effectiveHeight = computed(() =>
    this.canSnap() && this.snapped() ? 'full' : this.height(),
  );
  /** @ignore Preset detent, or `null` for a free-form CSS length. */
  protected readonly heightPreset = computed<BottomSheetHeightPreset | null>(() => {
    const h = this.effectiveHeight();
    return HEIGHT_PRESETS.includes(h) ? (h as BottomSheetHeightPreset) : null;
  });
  /**
   * @ignore Height written inline: the live drag height, else the free-form
   * value. A preset resolves through its class so the SCSS hook stays in charge.
   */
  protected readonly inlineHeight = computed(() => {
    const drag = this.dragHeight();
    if (drag !== null) return `${drag}px`;
    return this.heightPreset() ? null : this.effectiveHeight();
  });

  /** @ignore Sheet position: off-screen, dragged, or at rest. */
  protected readonly panelTransform = computed(() => {
    if (!this.atRest()) return 'translateY(100%)';
    const offset = this.dragOffset();
    return offset > 0 ? `translateY(${offset}px)` : 'translateY(0)';
  });

  /** @ignore */
  protected readonly panelClasses = computed(() => {
    const classes = ['ui-bottom-sheet'];
    const preset = this.heightPreset();
    if (preset) classes.push(`_${preset}`);
    if (this.contained()) classes.push('_contained');
    if (this.safeArea() && !this.contained()) classes.push('_safe-area');
    if (this.dragging()) classes.push('_dragging');
    if (this.motionDisabled()) classes.push('_no-motion');
    const extra = this.styleClass();
    if (extra) classes.push(extra);
    return classes.join(' ');
  });

  /** @ignore A title is available, from the slot or the string shorthand. */
  protected readonly hasTitle = computed(() => !!this.headerSlot() || !!this.header());
  /** @ignore The header region is rendered at all. */
  protected readonly hasHeaderRegion = computed(() => this.hasTitle() || this.closable());
  /** @ignore The `header` string is the title source (a slot takes precedence). */
  protected readonly showHeaderString = computed(() => !this.headerSlot() && !!this.header());

  /** @ignore Id of the element naming the sheet (header title, or an external id). */
  protected readonly labelledBy = computed(
    () => this.ariaLabelledBy() ?? (this.hasTitle() ? this.titleId : null),
  );
  /** @ignore Fallback accessible name when nothing is referenced. */
  protected readonly resolvedAriaLabel = computed(() =>
    this.labelledBy() ? null : this.ariaLabel(),
  );

  constructor() {
    let wasVisible = false;

    effect(() => {
      const v = this.visible();
      untracked(() => {
        if (v && !wasVisible) {
          wasVisible = true;
          this.beginOpen();
        } else if (!v && wasVisible) {
          wasVisible = false;
          this.beginClose();
        }
      });
    });

    // A11y safeguard: a dialog must have an accessible name.
    if (isDevMode()) {
      effect(() => {
        if (this.visible() && !this.labelledBy() && !this.resolvedAriaLabel()) {
          console.warn(
            '[ui-bottom-sheet] Panel has no accessible name: provide `header`, `ariaLabel` or `ariaLabelledBy`.',
          );
        }
      });
    }

    inject(DestroyRef).onDestroy(() => {
      this.clearSettle();
      this.clearFocus();
      this.releaseLock();
    });
  }

  /** Open the sheet. */
  open(): void {
    this.visible.set(true);
  }

  /** Close the sheet. */
  close(): void {
    this.visible.set(false);
  }

  /** Toggle the sheet. */
  toggle(): void {
    this.visible.update((v) => !v);
  }

  /** Move focus onto the sheet surface. */
  focus(): void {
    this.panelRef()?.nativeElement.focus({ preventScroll: true });
  }

  // --- Open / close lifecycle ------------------------------------------

  /** @ignore Mount off-screen, then transition to the rest position. */
  private beginOpen(): void {
    this.clearSettle();
    this.snapped.set(false);
    this.dragOffset.set(0);
    this.dragHeight.set(null);
    this.dragging.set(false);
    this.mounted.set(true);

    if (!this.isBrowser) {
      this.atRest.set(true);
      return;
    }

    if (this.blockScroll() && !this.contained() && !this.locked) {
      lockBodyScroll(this.document);
      this.locked = true;
    }

    afterNextRender(
      () => {
        // Flush the off-screen position so the class swap below interpolates
        // instead of jumping. A layout read is enough, and unlike a rAF it also
        // runs in a throttled tab.
        void this.positionerRef()?.nativeElement.offsetHeight;
        this.atRest.set(true);
        this.awaitTransition('open');
        this.applyAutoFocus();
      },
      { injector: this.injector },
    );
  }

  /** @ignore Transition back off-screen, then unmount. */
  private beginClose(): void {
    if (!this.mounted()) return;
    this.clearSettle();
    this.clearFocus();
    this.endDrag();
    this.dragOffset.set(0);
    this.dragHeight.set(null);
    this.atRest.set(false);
    this.awaitTransition('close');
  }

  /**
   * @ignore Wait for the panel transition to end. `transitionend` is the accurate
   * signal, but it never fires when the duration is zero (motion off, reduced
   * motion) or while the tab is hidden, hence the measured fallback timer.
   */
  private awaitTransition(phase: 'open' | 'close'): void {
    this.pending = phase;
    if (!this.isBrowser) {
      this.settle(phase);
      return;
    }
    this.settleTimer = setTimeout(() => this.settle(phase), this.transitionMs() + SETTLE_MARGIN_MS);
  }

  /** @ignore Resolved transition duration of the panel (ms). */
  private transitionMs(): number {
    const el = this.positionerRef()?.nativeElement;
    const view = this.document.defaultView;
    if (!el || !view) return SETTLE_FALLBACK_MS;
    const raw = view.getComputedStyle(el).transitionDuration.split(',')[0]?.trim() ?? '';
    const value = Number.parseFloat(raw);
    if (Number.isNaN(value)) return SETTLE_FALLBACK_MS;
    return raw.endsWith('ms') ? value : value * 1000;
  }

  /** @ignore */
  protected onTransitionEnd(event: TransitionEvent): void {
    if (event.propertyName !== 'transform') return;
    if (event.target !== this.positionerRef()?.nativeElement) return;
    if (this.pending) this.settle(this.pending);
  }

  /** @ignore End of an open/close transition: emit, and unmount on close. */
  private settle(phase: 'open' | 'close'): void {
    if (this.pending !== phase) return;
    this.clearSettle();
    if (phase === 'open') {
      this.opened.emit();
    } else {
      this.mounted.set(false);
      this.releaseLock();
      this.closed.emit();
    }
  }

  /** @ignore */
  private clearSettle(): void {
    this.pending = null;
    if (this.settleTimer !== null) {
      clearTimeout(this.settleTimer);
      this.settleTimer = null;
    }
  }

  /** @ignore */
  private releaseLock(): void {
    if (this.locked) {
      unlockBodyScroll(this.document);
      this.locked = false;
    }
  }

  // --- Focus -----------------------------------------------------------

  /**
   * @ignore Focus the `autoFocusElement` target once it exists. The CDK focus
   * trap captures first (which is what restores focus on close), so this runs
   * after it and wins. Retried a few times because the target is often projected
   * content that renders a tick later; `setTimeout` rather than a rAF, which
   * never fires in a throttled tab.
   */
  private applyAutoFocus(): void {
    const selector = this.autoFocusElement();
    if (!selector || !this.focusOnShow()) return;

    let attempts = 0;
    const tryFocus = (): void => {
      const target = this.panelRef()?.nativeElement.querySelector<HTMLElement>(selector);
      if (target) {
        target.focus({ preventScroll: true });
        this.focusTimer = null;
        return;
      }
      if (++attempts >= 5) {
        this.focusTimer = null;
        if (isDevMode()) {
          console.warn(`[ui-bottom-sheet] autoFocusElement "${selector}" matched nothing.`);
        }
        return;
      }
      this.focusTimer = setTimeout(tryFocus, 16);
    };
    this.focusTimer = setTimeout(tryFocus, 0);
  }

  /** @ignore */
  private clearFocus(): void {
    if (this.focusTimer !== null) {
      clearTimeout(this.focusTimer);
      this.focusTimer = null;
    }
  }

  // --- Keyboard --------------------------------------------------------

  /** @ignore Escape-to-close. Only swallowed when it actually closes, so a
   *  parent overlay still sees the key otherwise. */
  protected onKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.closeOnEscape()) {
      event.stopPropagation();
      this.close();
    }
  }

  /** @ignore Keyboard equivalent of the snap gesture (the handle is a button). */
  protected onHandleKeydown(event: KeyboardEvent): void {
    if (!this.canSnap()) return;
    switch (event.key) {
      case 'ArrowUp':
        this.snapped.set(true);
        break;
      case 'ArrowDown':
        this.snapped.set(false);
        break;
      case 'Enter':
      case ' ':
        this.snapped.update((s) => !s);
        break;
      default:
        return;
    }
    event.preventDefault();
  }

  // --- Overlay ---------------------------------------------------------

  /** @ignore Backdrop click dismiss (backdrop target only). */
  protected onScrimPointerDown(event: PointerEvent): void {
    if (!this.closeOnOverlayClick()) return;
    if (event.target === event.currentTarget) this.close();
  }

  // --- Drag gesture (touch / mouse / pen) ------------------------------

  /** @ignore */
  protected onDragPointerDown(event: PointerEvent): void {
    if (!this.dragEnabled() || this.dragPointerId !== null) return;
    if (event.pointerType === 'mouse' && event.button !== 0) return;
    // A control inside the drag area keeps its own gesture (close button, link…),
    // except the handle, which is a button in snapping mode.
    const control = (event.target as Element | null)?.closest(INTERACTIVE);
    if (control && !control.classList.contains(HANDLE_CLASS)) return;

    const host = event.currentTarget as HTMLElement;
    this.dragPointerId = event.pointerId;
    this.dragStartY = event.clientY;
    this.dragStartHeight = this.panelRef()?.nativeElement.offsetHeight ?? 0;
    this.dragging.set(true);
    host.setPointerCapture(event.pointerId);
  }

  /** @ignore */
  protected onDragPointerMove(event: PointerEvent): void {
    if (event.pointerId !== this.dragPointerId) return;
    const delta = event.clientY - this.dragStartY;

    if (delta >= 0) {
      // Downwards: translate the sheet, the cheap property.
      this.dragHeight.set(null);
      this.dragOffset.set(this.enableDragToClose() ? delta : 0);
      return;
    }

    // Upwards: only a snapping sheet reacts, by growing towards `full`.
    this.dragOffset.set(0);
    if (!this.canSnap() || this.snapped()) return;
    const ceiling = this.viewportHeight();
    this.dragHeight.set(Math.min(ceiling, this.dragStartHeight - delta));
  }

  /** @ignore Release: past the threshold the gesture commits, otherwise it springs back. */
  protected onDragPointerUp(event: PointerEvent): void {
    if (event.pointerId !== this.dragPointerId) return;
    const offset = this.dragOffset();
    const grown = (this.dragHeight() ?? this.dragStartHeight) - this.dragStartHeight;
    const threshold = Math.max(1, this.dragThreshold());

    this.endDrag();
    this.dragOffset.set(0);
    this.dragHeight.set(null);

    if (grown >= threshold) {
      this.snapped.set(true);
    } else if (offset >= threshold) {
      // From `full`, a snapping sheet steps back to `half` before closing.
      if (this.canSnap() && this.snapped()) this.snapped.set(false);
      else if (this.enableDragToClose()) this.close();
    }
  }

  /** @ignore */
  private endDrag(): void {
    this.dragPointerId = null;
    this.dragging.set(false);
  }

  /** @ignore Ceiling of the upward drag: the viewport, or the container when `contained`. */
  private viewportHeight(): number {
    if (this.contained()) {
      const parent = this.positionerRef()?.nativeElement.parentElement;
      if (parent) return parent.clientHeight;
    }
    return this.document.defaultView?.innerHeight ?? this.dragStartHeight;
  }
}
