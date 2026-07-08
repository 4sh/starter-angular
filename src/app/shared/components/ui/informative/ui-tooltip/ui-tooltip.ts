import { isPlatformBrowser } from '@angular/common';
import {
  afterNextRender,
  booleanAttribute,
  ComponentRef,
  computed,
  DestroyRef,
  Directive,
  effect,
  ElementRef,
  inject,
  Injector,
  input,
  NgZone,
  numberAttribute,
  output,
  PLATFORM_ID,
  Renderer2,
  TemplateRef,
  untracked,
  ViewContainerRef,
} from '@angular/core';
import {
  ConnectedPosition,
  FlexibleConnectedPositionStrategy,
  Overlay,
  OverlayRef,
} from '@angular/cdk/overlay';
import { ComponentPortal } from '@angular/cdk/portal';
import { TooltipPosition, UiTooltipPanel } from './ui-tooltip-panel';

export type TooltipEvent = 'hover' | 'focus' | 'both';

/** Gap (px) left between the trigger and the tooltip for the arrow — mirrors `$tooltip-arrow-size` in the SCSS. */
const ARROW_GAP = 8;

/** Process-wide counter for unique tooltip ids (aria-describedby wiring). */
let nextId = 0;

/**
 * Attribute directive that attaches an advisory tooltip to its host element.
 *
 * Headless behavior (Angular CDK Overlay) + a co-located, fully token-driven panel
 * ({@link UiTooltipPanel}). Inspired by the PrimeNG `pTooltip` API, adapted to the
 * signals idiom of this design system.
 *
 * Positioning, viewport flipping and scroll re-alignment are delegated to the CDK
 * `FlexibleConnectedPositionStrategy` (no manual geometry).
 *
 * @example
 * ```html
 * <button uiTooltip="Save the document" tooltipPosition="bottom">Save</button>
 * <button [uiTooltip]="tpl" [tooltipContext]="{ $implicit: user }">Profile</button>
 * <ng-template #tpl let-u>{{ u.name }}</ng-template>
 * ```
 */
@Directive({
  selector: '[uiTooltip]',
  exportAs: 'uiTooltip',
})
export class UiTooltip {
  /** Content: plain text, HTML (with `escape=false`) or a `TemplateRef` for rich content. */
  content = input<string | TemplateRef<unknown> | undefined>(undefined, { alias: 'uiTooltip' });
  /** Preferred side of the trigger. CDK flips it automatically when space is lacking. */
  tooltipPosition = input<TooltipPosition>('top');
  /** Auto-flip to another side when the preferred one lacks space (default). `false` locks the side. */
  fitContent = input(true, { transform: booleanAttribute });
  /** Interaction(s) that reveal the tooltip. `both` (default) also covers keyboard focus (a11y). */
  tooltipEvent = input<TooltipEvent>('both');
  /** Disables the tooltip entirely. */
  tooltipDisabled = input(false, { transform: booleanAttribute });
  /** Delay before showing, in ms. */
  showDelay = input(150, { transform: numberAttribute });
  /** Delay before hiding, in ms. */
  hideDelay = input(0, { transform: numberAttribute });
  /** `true` (default): content rendered as text. `false`: `content` bound as sanitized HTML. */
  escape = input(true, { transform: booleanAttribute });
  /** Extra class(es) applied to the tooltip panel. */
  tooltipStyleClass = input<string>();
  /** Auto-hide when the pointer leaves the trigger (default). `false` keeps it open while hovered. */
  autoHide = input(true, { transform: booleanAttribute });
  /** Hide when the Escape key is pressed (default, WCAG dismissible). */
  hideOnEscape = input(true, { transform: booleanAttribute });
  /** Auto-hide after N ms even while active. `0` (default) disables it. */
  life = input(0, { transform: numberAttribute });
  /** Only show when the trigger text is truncated (ellipsis active). */
  showOnEllipsis = input(false, { transform: booleanAttribute });
  /** Additional vertical offset (px) from the computed position. */
  positionTop = input(0, { transform: numberAttribute });
  /** Additional horizontal offset (px) from the computed position. */
  positionLeft = input(0, { transform: numberAttribute });
  /** Context object forwarded to a `TemplateRef` content. */
  tooltipContext = input<unknown>();

  /** Emitted right after the tooltip becomes visible. */
  tooltipShow = output<void>();
  /** Emitted right after the tooltip is hidden. */
  tooltipHide = output<void>();

  /** @ignore */
  private readonly el = inject<ElementRef<HTMLElement>>(ElementRef);
  /** @ignore */
  private readonly overlay = inject(Overlay);
  /** @ignore */
  private readonly vcr = inject(ViewContainerRef);
  /** @ignore */
  private readonly injector = inject(Injector);
  /** @ignore */
  private readonly zone = inject(NgZone);
  /** @ignore */
  private readonly renderer = inject(Renderer2);
  /** @ignore */
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));

  /** @ignore */
  private overlayRef: OverlayRef | null = null;
  /** @ignore */
  private positionStrategy: FlexibleConnectedPositionStrategy | null = null;
  /** @ignore */
  private panelRef: ComponentRef<UiTooltipPanel> | null = null;
  /** @ignore */
  private readonly tooltipId = `ui-tooltip-${nextId++}`;

  /** @ignore Deferred timers. */
  private showTimer: ReturnType<typeof setTimeout> | null = null;
  private hideTimer: ReturnType<typeof setTimeout> | null = null;
  private lifeTimer: ReturnType<typeof setTimeout> | null = null;

  /** @ignore Teardown handles for host / document listeners. */
  private readonly disposers: Array<() => void> = [];

  /** @ignore Content is a template (vs a string). */
  private readonly hasTemplate = computed(() => this.content() instanceof TemplateRef);

  constructor() {
    // Inputs are only resolved after construction → bind once the view exists (browser only).
    if (this.isBrowser) {
      afterNextRender(() => this.bindTriggerEvents());
    }

    // Keep an open tooltip in sync with live content / option changes.
    effect(() => {
      // Track the visible inputs so the effect re-runs on any change.
      const content = this.content();
      this.escape();
      this.tooltipStyleClass();
      this.tooltipContext();
      untracked(() => {
        if (!this.panelRef) return;
        this.applyContent();
        if (!content) this.hide();
      });
    });

    // Hide as soon as the tooltip is disabled.
    effect(() => {
      if (this.tooltipDisabled()) untracked(() => this.hide());
    });

    inject(DestroyRef).onDestroy(() => this.destroy());
  }

  /** Programmatically show the tooltip (respects `showDelay`). */
  show(): void {
    this.activate();
  }

  /** Programmatically hide the tooltip (respects `hideDelay`). */
  hide(): void {
    this.deactivate();
  }

  // --- Trigger events --------------------------------------------------

  /** @ignore */
  private bindTriggerEvents(): void {
    const host = this.el.nativeElement;
    this.zone.runOutsideAngular(() => {
      const evt = this.tooltipEvent();
      if (evt === 'hover' || evt === 'both') {
        this.disposers.push(
          this.renderer.listen(host, 'mouseenter', () => this.activate()),
          this.renderer.listen(host, 'mouseleave', () => this.deactivate()),
          this.renderer.listen(host, 'click', () => this.deactivate()),
          this.renderer.listen(host, 'touchstart', () => this.activate()),
        );
      }
      if (evt === 'focus' || evt === 'both') {
        // focusin/focusout bubble → also works when the host wraps the focusable element.
        this.disposers.push(
          this.renderer.listen(host, 'focusin', () => this.activate()),
          this.renderer.listen(host, 'focusout', () => this.deactivate()),
        );
      }
    });
  }

  // --- Activation lifecycle -------------------------------------------

  /** @ignore */
  private activate(): void {
    if (this.tooltipDisabled() || !this.hasContent()) return;
    if (this.showOnEllipsis() && !this.hasEllipsis()) return;

    this.clearHideTimer();
    if (this.overlayRef?.hasAttached()) return;

    const delay = this.showDelay();
    this.clearShowTimer();
    if (delay > 0) {
      this.showTimer = setTimeout(() => this.zone.run(() => this.render()), delay);
    } else {
      this.zone.run(() => this.render());
    }
  }

  /** @ignore */
  private deactivate(): void {
    this.clearShowTimer();
    const delay = this.hideDelay();
    if (delay > 0) {
      this.clearHideTimer();
      this.hideTimer = setTimeout(() => this.zone.run(() => this.remove()), delay);
    } else {
      this.zone.run(() => this.remove());
    }
  }

  // --- Overlay rendering ----------------------------------------------

  /** @ignore */
  private render(): void {
    if (!this.hasContent() || this.tooltipDisabled()) return;

    const overlayRef = this.getOverlayRef();
    if (!overlayRef.hasAttached()) {
      this.panelRef = overlayRef.attach(new ComponentPortal(UiTooltipPanel, this.vcr, this.injector));
      this.panelRef.setInput('tooltipId', this.tooltipId);
      this.applyContent();
      this.renderer.setAttribute(this.el.nativeElement, 'aria-describedby', this.tooltipId);
      // Let hover pass through unless the tooltip is interactive (autoHide=false).
      overlayRef.overlayElement.style.pointerEvents = this.autoHide() ? 'none' : 'auto';
      if (!this.autoHide()) this.bindPanelHover(overlayRef);
    }

    // Trigger the fade-in on the next frame so the transition runs.
    requestAnimationFrame(() => this.panelRef?.setInput('visible', true));

    this.armLifeTimer();
    if (this.hideOnEscape()) this.bindEscape();
    this.tooltipShow.emit();
  }

  /** @ignore */
  private remove(): void {
    this.clearLifeTimer();
    this.clearShowTimer();
    if (!this.overlayRef?.hasAttached()) return;
    this.overlayRef.detach();
    this.panelRef = null;
    this.renderer.removeAttribute(this.el.nativeElement, 'aria-describedby');
    this.tooltipHide.emit();
  }

  /** @ignore Built once, reused across shows; positions refreshed each time. */
  private getOverlayRef(): OverlayRef {
    if (this.overlayRef) {
      this.positionStrategy?.withPositions(this.positionsFor(this.tooltipPosition()));
      return this.overlayRef;
    }
    this.positionStrategy = this.overlay
      .position()
      .flexibleConnectedTo(this.el)
      .withFlexibleDimensions(false)
      .withPush(false)
      .withViewportMargin(ARROW_GAP)
      .withPositions(this.positionsFor(this.tooltipPosition()));

    // Single subscription for the whole lifecycle → arrow follows the effective side.
    this.positionStrategy.positionChanges.subscribe((change) => {
      this.panelRef?.setInput('position', this.sideOf(change.connectionPair));
    });

    this.overlayRef = this.overlay.create({
      positionStrategy: this.positionStrategy,
      scrollStrategy: this.overlay.scrollStrategies.reposition(),
      panelClass: 'ui-tooltip-overlay',
      hasBackdrop: false,
    });
    return this.overlayRef;
  }

  /** @ignore Ordered positions (preferred first, then fallbacks) for CDK auto-flip. */
  private positionsFor(pos: TooltipPosition): ConnectedPosition[] {
    const ox = this.positionLeft();
    const oy = this.positionTop();
    const top: ConnectedPosition = {
      originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom',
      offsetX: ox, offsetY: -ARROW_GAP + oy,
    };
    const bottom: ConnectedPosition = {
      originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top',
      offsetX: ox, offsetY: ARROW_GAP + oy,
    };
    const left: ConnectedPosition = {
      originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center',
      offsetX: -ARROW_GAP + ox, offsetY: oy,
    };
    const right: ConnectedPosition = {
      originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center',
      offsetX: ARROW_GAP + ox, offsetY: oy,
    };
    const primary: Record<TooltipPosition, ConnectedPosition> = { top, bottom, left, right };
    // fitContent=false → keep only the preferred side (no auto-flip).
    if (!this.fitContent()) return [primary[pos]];

    const order: Record<TooltipPosition, ConnectedPosition[]> = {
      top: [top, bottom, right, left],
      bottom: [bottom, top, right, left],
      left: [left, right, top, bottom],
      right: [right, left, top, bottom],
    };
    return order[pos];
  }

  /** @ignore Map the active CDK connection pair back to the visual side (for the arrow). */
  private sideOf(pair: ConnectedPosition): TooltipPosition {
    if (pair.overlayY === 'bottom') return 'top';
    if (pair.overlayY === 'top') return 'bottom';
    if (pair.overlayX === 'end') return 'left';
    return 'right';
  }

  // --- Content ---------------------------------------------------------

  /** @ignore */
  private applyContent(): void {
    if (!this.panelRef) return;
    const content = this.content();
    if (this.hasTemplate()) {
      this.panelRef.setInput('template', content as TemplateRef<unknown>);
      this.panelRef.setInput('templateContext', this.tooltipContext());
      this.panelRef.setInput('text', undefined);
    } else {
      this.panelRef.setInput('text', content as string | undefined);
      this.panelRef.setInput('template', undefined);
    }
    this.panelRef.setInput('escape', this.escape());
    this.panelRef.setInput('styleClass', this.tooltipStyleClass());
    this.panelRef.setInput('interactive', !this.autoHide());
  }

  /** @ignore */
  private hasContent(): boolean {
    const c = this.content();
    return this.hasTemplate() || !!(typeof c === 'string' && c.length);
  }

  /** @ignore Whether the trigger text is visually truncated. */
  private hasEllipsis(): boolean {
    const el = this.el.nativeElement;
    return el.offsetWidth < el.scrollWidth || el.offsetHeight < el.scrollHeight;
  }

  // --- Interactive / dismiss listeners --------------------------------

  /** @ignore Keep the tooltip open while the pointer is over it (autoHide=false). */
  private bindPanelHover(overlayRef: OverlayRef): void {
    const panel = overlayRef.overlayElement;
    const enter = this.renderer.listen(panel, 'mouseenter', () => this.clearHideTimer());
    const leave = this.renderer.listen(panel, 'mouseleave', () => this.deactivate());
    this.disposers.push(enter, leave);
  }

  /** @ignore */
  private bindEscape(): void {
    const off = this.renderer.listen('document', 'keydown.escape', () => {
      this.deactivate();
      off();
    });
    this.disposers.push(off);
  }

  // --- Timers ----------------------------------------------------------

  /** @ignore */
  private armLifeTimer(): void {
    this.clearLifeTimer();
    const life = this.life();
    if (life > 0) this.lifeTimer = setTimeout(() => this.zone.run(() => this.remove()), life);
  }

  /** @ignore */
  private clearShowTimer(): void {
    if (this.showTimer) { clearTimeout(this.showTimer); this.showTimer = null; }
  }

  /** @ignore */
  private clearHideTimer(): void {
    if (this.hideTimer) { clearTimeout(this.hideTimer); this.hideTimer = null; }
  }

  /** @ignore */
  private clearLifeTimer(): void {
    if (this.lifeTimer) { clearTimeout(this.lifeTimer); this.lifeTimer = null; }
  }

  /** @ignore */
  private destroy(): void {
    this.clearShowTimer();
    this.clearHideTimer();
    this.clearLifeTimer();
    this.disposers.forEach((off) => off());
    this.disposers.length = 0;
    this.overlayRef?.dispose();
    this.overlayRef = null;
    this.panelRef = null;
  }
}
