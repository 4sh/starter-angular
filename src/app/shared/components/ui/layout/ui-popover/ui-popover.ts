import {
  booleanAttribute,
  Component,
  computed,
  DOCUMENT,
  effect,
  ElementRef,
  inject,
  input,
  isDevMode,
  output,
  signal,
  viewChild,
} from '@angular/core';
import {
  ConnectedOverlayPositionChange,
  ConnectedPosition,
  OverlayModule,
} from '@angular/cdk/overlay';
import { A11yModule } from '@angular/cdk/a11y';
import { UiMotion } from '@app/shared/motion/ui-motion';

/** Preferred side of the trigger the panel is displayed on (drives the arrow). */
export type PopoverPosition = 'top' | 'bottom' | 'left' | 'right';

/** Accepted shapes for the anchor passed to `show` / `toggle`. */
export type PopoverTarget = HTMLElement | ElementRef<HTMLElement>;

/** Gap (px) between the trigger and the panel, leaving room for the arrow — mirrors `$popover-arrow-size` in the SCSS. */
const ARROW_GAP = 8;

/** Focusable descendants used to move focus into the panel on open. */
const FOCUSABLE_SELECTOR = [
  'a[href]',
  'button:not([disabled])',
  'input:not([disabled])',
  'select:not([disabled])',
  'textarea:not([disabled])',
  '[tabindex]:not([tabindex="-1"])',
].join(',');

/** Process-wide counter for unique panel ids (aria-controls wiring). */
let nextId = 0;

/**
 * ui-popover — headless floating panel anchored to a trigger.
 *
 * A token-styled surface (shared `overlay-panel` shell + `global.*` tokens)
 * rendered in a CDK connected overlay, driven imperatively through the public
 * `show` / `hide` / `toggle` methods. The consumer keeps a template reference
 * variable on the popover and wires a trigger to it; the panel holds arbitrary
 * projected content.
 *
 * Built for accessibility: `role="dialog"` + `aria-modal`, focus trap
 * (`@angular/cdk/a11y`) with the first focusable element (or an element
 * carrying `autofocus`) focused on open, `Escape` to close and return focus to
 * the trigger, and `aria-expanded` / `aria-controls` reflected on the trigger.
 *
 * Positioning, viewport flipping and scroll re-alignment are delegated to the
 * CDK connected overlay (no manual geometry); the arrow follows the effective
 * side.
 *
 * @example
 * ```html
 * <!-- Basic: the trigger's click event carries the anchor -->
 * <ui-button label="Détails" (buttonClick)="op.toggle($event)" />
 * <ui-popover #op ariaLabel="Détails du produit">…</ui-popover>
 *
 * <!-- Controlled: pass the trigger element as the second argument -->
 * <span #anchor>Ancre</span>
 * <ui-button label="Ouvrir" (buttonClick)="op.show($event, anchor)" />
 * <ui-popover #op ariaLabel="Détails">…</ui-popover>
 * ```
 */
@Component({
  selector: 'ui-popover',
  imports: [OverlayModule, A11yModule, UiMotion],
  templateUrl: './ui-popover.html',
  styleUrl: './ui-popover.scss',
})
export class UiPopover {
  /** Hide the panel when a click lands outside it (and outside the trigger). */
  dismissable = input(true, { transform: booleanAttribute });
  /** Preferred side of the trigger; the overlay flips it when space is lacking. */
  position = input<PopoverPosition>('bottom');
  /** Render the arrow pointing back to the trigger. */
  showArrow = input(true, { transform: booleanAttribute });
  /** ARIA role of the panel. */
  role = input<string>('dialog');
  /** Accessible name of the panel (recommended). */
  ariaLabel = input<string>();
  /** Id of an external element naming the panel. */
  ariaLabelledBy = input<string>();
  /** Move focus into the panel when it opens. */
  focusOnShow = input(true, { transform: booleanAttribute });
  /** Close the panel when `Escape` is pressed. */
  closeOnEscape = input(true, { transform: booleanAttribute });
  /** Animate the panel entrance (reduced-motion / `data-motion="off"` always win). */
  motion = input(true, { transform: booleanAttribute });
  /** Extra class(es) applied to the panel (scoped custom styling). */
  styleClass = input<string>();

  /** Emitted after the panel becomes visible. */
  onShow = output<void>();
  /** Emitted after the panel is hidden. */
  onHide = output<void>();

  /** @ignore */
  private readonly doc = inject(DOCUMENT);
  /** @ignore Panel root (only present while open — queried after the overlay attaches). */
  private readonly panel = viewChild<ElementRef<HTMLElement>>('panel');

  /** @ignore Panel visibility. */
  private readonly _open = signal(false);
  /** Read-only open state (for host bindings / conditional logic). */
  readonly visible = this._open.asReadonly();

  /** @ignore Element the overlay is anchored to. */
  protected readonly origin = signal<HTMLElement | null>(null);
  /** @ignore Effective side (updated from the CDK connection pair) — drives the arrow. */
  protected readonly side = signal<PopoverPosition>('bottom');
  /** @ignore Unique panel id, wired to the trigger via `aria-controls`. */
  protected readonly panelId = `ui-popover-${nextId++}`;

  /** @ignore Resolved trigger element (kept for focus restore + aria cleanup). */
  private targetEl: HTMLElement | null = null;

  constructor() {
    // A11y safeguard: an open dialog must have an accessible name.
    if (isDevMode()) {
      effect(() => {
        if (this._open() && !this.ariaLabel() && !this.ariaLabelledBy()) {
          console.warn(
            '[ui-popover] Popover sans nom accessible : renseignez `ariaLabel` ou `ariaLabelledBy`.',
          );
        }
      });
    }
  }

  // --- Public API ---------------------------------------------------------

  /**
   * Show the panel anchored to `target` (or the event's `currentTarget`).
   * @param event Browser event whose `currentTarget` is used as a fallback anchor.
   * @param target Explicit anchor element (kept anchored to it).
   */
  show(event?: Event, target?: PopoverTarget): void {
    const anchor = this.resolveTarget(target) ?? this.resolveEventTarget(event);
    if (!anchor) return;
    event?.stopPropagation();

    this.targetEl = anchor;
    this.origin.set(anchor);
    if (!this._open()) {
      this._open.set(true);
      this.applyTriggerAria(anchor);
      this.onShow.emit();
    }
    if (this.focusOnShow()) this.queueFocus();
  }

  /** Hide the panel; returns focus to the trigger when focus was inside it. */
  hide(): void {
    if (!this._open()) return;
    const panelEl = this.panel()?.nativeElement;
    const active = this.doc.activeElement;
    const focusWasInside = !!panelEl && active instanceof Node && panelEl.contains(active);

    this._open.set(false);
    this.clearTriggerAria();
    if (focusWasInside) this.targetEl?.focus();
    this.onHide.emit();
  }

  /** Toggle the panel, anchoring it like {@link show} when it opens. */
  toggle(event?: Event, target?: PopoverTarget): void {
    this._open() ? this.hide() : this.show(event, target);
  }

  // --- Positioning ----------------------------------------------------------

  /** @ignore Ordered positions (preferred first, then fallbacks) for CDK auto-flip. */
  protected readonly positions = computed<ConnectedPosition[]>(() => {
    const top: ConnectedPosition = {
      originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom', offsetY: -ARROW_GAP,
    };
    const bottom: ConnectedPosition = {
      originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top', offsetY: ARROW_GAP,
    };
    const left: ConnectedPosition = {
      originX: 'start', originY: 'center', overlayX: 'end', overlayY: 'center', offsetX: -ARROW_GAP,
    };
    const right: ConnectedPosition = {
      originX: 'end', originY: 'center', overlayX: 'start', overlayY: 'center', offsetX: ARROW_GAP,
    };
    const order: Record<PopoverPosition, ConnectedPosition[]> = {
      top: [top, bottom, right, left],
      bottom: [bottom, top, right, left],
      left: [left, right, top, bottom],
      right: [right, left, top, bottom],
    };
    return order[this.position()];
  });

  /** @ignore */
  protected readonly panelClasses = computed(() => {
    const c = ['ui-popover', `_${this.side()}`];
    if (!this.showArrow()) c.push('_no-arrow');
    const extra = this.styleClass();
    if (extra) c.push(extra);
    return c.join(' ');
  });

  /** @ignore Map the active CDK connection pair back to the visual side (for the arrow). */
  protected onPositionChange(change: ConnectedOverlayPositionChange): void {
    const pair = change.connectionPair;
    if (pair.overlayY === 'bottom') this.side.set('top');
    else if (pair.overlayY === 'top' && pair.originY === 'bottom') this.side.set('bottom');
    else if (pair.overlayX === 'end') this.side.set('left');
    else if (pair.overlayX === 'start' && pair.originX === 'end') this.side.set('right');
    else this.side.set(this.position());
  }

  // --- Interactions ---------------------------------------------------------

  /** @ignore A click outside the panel closes it — unless it lands on the trigger,
   * whose own handler owns the toggle (avoids close-then-reopen races). */
  protected onOutsideClick(event: MouseEvent): void {
    if (!this.dismissable()) return;
    const target = event.target;
    if (target instanceof Node && this.targetEl?.contains(target)) return;
    this.hide();
  }

  /** @ignore */
  protected onEscape(event: Event): void {
    if (!this.closeOnEscape()) return;
    event.stopPropagation();
    this.hide();
  }

  // --- Internals ------------------------------------------------------------

  /** @ignore */
  private resolveTarget(target?: PopoverTarget): HTMLElement | null {
    if (!target) return null;
    return target instanceof ElementRef ? target.nativeElement : target;
  }

  /** @ignore */
  private resolveEventTarget(event?: Event): HTMLElement | null {
    const el = event?.currentTarget ?? event?.target;
    return el instanceof HTMLElement ? el : null;
  }

  /** @ignore Reflect the open relationship on the trigger. */
  private applyTriggerAria(el: HTMLElement): void {
    el.setAttribute('aria-expanded', 'true');
    el.setAttribute('aria-controls', this.panelId);
  }

  /** @ignore */
  private clearTriggerAria(): void {
    const el = this.targetEl;
    if (!el) return;
    el.setAttribute('aria-expanded', 'false');
    el.removeAttribute('aria-controls');
  }

  /** @ignore Focus the first focusable (or `[autofocus]`) once the overlay renders.
   * The overlay attaches after change detection: retry over macrotasks
   * (NOT rAF — it never fires in throttled/background tabs). */
  private queueFocus(attempts = 20): void {
    setTimeout(() => {
      const panelEl = this.panel()?.nativeElement;
      if (panelEl) this.focusFirst(panelEl);
      else if (attempts > 0) this.queueFocus(attempts - 1);
    });
  }

  /** @ignore */
  private focusFirst(panelEl: HTMLElement): void {
    const auto = panelEl.querySelector<HTMLElement>('[autofocus]');
    if (auto) {
      auto.focus();
      return;
    }
    const focusable = panelEl.querySelector<HTMLElement>(FOCUSABLE_SELECTOR);
    (focusable ?? panelEl).focus();
  }
}
