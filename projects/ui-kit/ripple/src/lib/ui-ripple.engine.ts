import { DOCUMENT, isPlatformBrowser } from '@angular/common';
import { DestroyRef, inject, Injectable, InjectionToken, NgZone, PLATFORM_ID } from '@angular/core';

/**
 * What a delegated root (global scope or `[uiRippleScope]`) makes rippling by
 * default: only what declares itself, i.e. the kit's curated controls (which
 * carry `data-ripple="on"`) and whatever the application marks the same way.
 * A design system paints no wave on markup it does not own.
 */
export const UI_RIPPLE_DEFAULT_SELECTOR = '[data-ripple="on"]';

/**
 * Everything clickable, curated set included. Pass it to
 * `provideUiRipple({ selector: UI_RIPPLE_INTERACTIVE_SELECTOR })` to ripple the
 * application's own controls too, without listing them one by one.
 */
export const UI_RIPPLE_INTERACTIVE_SELECTOR =
  'button, [role="button"], a[href], [data-ripple="on"]';

/** Kit-wide ripple options, set once through `provideUiRipple()`. */
export interface UiRippleOptions {
  /** Ripple the whole document (delegated on `<body>`). Default `true`. */
  global?: boolean;
  /** Elements a delegated root ripples. Default {@link UI_RIPPLE_DEFAULT_SELECTOR}. */
  selector?: string;
}

export const UI_RIPPLE_OPTIONS = new InjectionToken<UiRippleOptions>('UI_RIPPLE_OPTIONS');

/** Settings of one binding, read at press time so signal inputs stay live. */
export interface UiRippleSettings {
  /** `false` stands the binding down without unwiring it. */
  enabled: boolean;
  /** Start the wave at the element's centre rather than at the pointer. */
  centered: boolean;
  /** Delegation only: what ripples inside the root. */
  selector: string;
}

const LAYER_CLASS = 'ui-ripple-layer';
const INK_CLASS = 'ui-ripple-ink';
/** Waves alive at once on one host, so a fast clicker cannot pile up nodes. */
const MAX_INK = 4;

/**
 * Engine behind `[uiRipple]`, `[uiRippleScope]` and `provideUiRipple()`.
 *
 * One `pointerdown` listener per binding (passive, registered outside Angular:
 * a press never triggers change detection), one clipping layer per host created
 * on first use, one `<span>` per wave removed on `animationend`. Nothing is
 * measured until a press actually happens.
 *
 * Appearance is not its business: the layer and the ink read the inherited
 * `--ui-ripple-*` custom properties (`styles/base/_ripple.scss`).
 */
@Injectable({ providedIn: 'root' })
export class UiRippleEngine {
  private readonly document = inject(DOCUMENT);
  private readonly zone = inject(NgZone);
  private readonly isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private readonly options = inject(UI_RIPPLE_OPTIONS, { optional: true }) ?? {};

  /** One press, one wave: the innermost binding claims the event, outer roots stand down. */
  private readonly claimed = new WeakSet<Event>();
  private readonly layers = new WeakMap<Element, HTMLElement>();
  private reducedMotion: MediaQueryList | undefined;
  private uninstallGlobal: (() => void) | undefined;

  /** Settings a binding starts from. */
  readonly defaults: UiRippleSettings = {
    enabled: true,
    centered: false,
    selector: this.options.selector ?? UI_RIPPLE_DEFAULT_SELECTOR,
  };

  constructor() {
    inject(DestroyRef).onDestroy(() => this.uninstallGlobal?.());
  }

  /** Ripples the whole document. Called by `provideUiRipple()`. */
  installGlobal(): void {
    if (this.options.global === false || this.uninstallGlobal) return;
    this.uninstallGlobal = this.delegate(this.document.body, () => this.defaults);
  }

  /** The host itself ripples. Returns the teardown. */
  bind(host: HTMLElement, settings: () => UiRippleSettings): () => void {
    const stop = this.listen(host, (event) => {
      // Claimed even when off: an explicit directive always wins over an outer root.
      this.claimed.add(event);
      const { enabled, centered } = settings();
      if (enabled) this.launch(host, event, centered);
    });

    return () => {
      stop();
      this.layers.get(host)?.remove();
      this.layers.delete(host);
    };
  }

  /** Descendants matching the selector ripple. Returns the teardown. */
  delegate(root: HTMLElement, settings: () => UiRippleSettings): () => void {
    return this.listen(root, (event) => {
      const { enabled, centered, selector } = settings();
      if (!enabled) return;

      const target = (event.target as Element | null)?.closest(selector);
      // `closest` can climb past the root: that match belongs to an outer binding.
      if (!(target instanceof HTMLElement) || !root.contains(target)) return;

      this.claimed.add(event);
      this.launch(target, event, centered);
    });
  }

  /**
   * Spawns one wave on `host`, from the pointer position or from its centre.
   * Public so an application can ripple from its own trigger (a keyboard
   * shortcut, a remote event) without a press.
   */
  launch(host: HTMLElement, event?: PointerEvent, centered = false): void {
    if (!this.isBrowser || this.stilled() || this.inert(host)) return;

    const rect = host.getBoundingClientRect();
    if (!rect.width || !rect.height) return;

    const x = event && !centered ? event.clientX - rect.left : rect.width / 2;
    const y = event && !centered ? event.clientY - rect.top : rect.height / 2;
    // Farthest corner, so the wave always covers the whole element.
    const radius = Math.hypot(Math.max(x, rect.width - x), Math.max(y, rect.height - y));

    const layer = this.layerFor(host);
    while (layer.childElementCount >= MAX_INK && layer.firstElementChild) {
      layer.firstElementChild.remove();
    }

    const ink = this.document.createElement('span');
    ink.className = INK_CLASS;
    ink.style.cssText = `left:${x - radius}px;top:${y - radius}px;width:${radius * 2}px;height:${radius * 2}px`;
    ink.addEventListener('animationend', () => ink.remove(), { once: true });
    layer.appendChild(ink);
  }

  private listen(node: HTMLElement, handle: (event: PointerEvent) => void): () => void {
    if (!this.isBrowser) return () => undefined;

    const onPointerDown = (event: PointerEvent) => {
      if (event.button > 0 || !event.isPrimary || this.claimed.has(event)) return;
      handle(event);
    };

    this.zone.runOutsideAngular(() =>
      node.addEventListener('pointerdown', onPointerDown, { passive: true }),
    );
    return () => node.removeEventListener('pointerdown', onPointerDown);
  }

  /** Clipping layer of a host, created on first press. */
  private layerFor(host: HTMLElement): HTMLElement {
    const cached = this.layers.get(host);
    if (cached?.parentElement === host) return cached;

    // The layer anchors on the host, which must therefore establish the
    // containing block. A host already positioned is left untouched.
    if (this.document.defaultView?.getComputedStyle(host).position === 'static') {
      host.style.position = 'relative';
    }

    const layer = this.document.createElement('span');
    layer.className = LAYER_CLASS;
    layer.setAttribute('aria-hidden', 'true');
    host.appendChild(layer);
    this.layers.set(host, layer);
    return layer;
  }

  /** Disabled host, or a subtree opted out with `data-ripple="off"`. */
  private inert(host: HTMLElement): boolean {
    return (
      (host as HTMLButtonElement).disabled === true ||
      host.getAttribute('aria-disabled') === 'true' ||
      host.closest('[data-ripple="off"]') !== null
    );
  }

  /** Reduced-motion preference, or the kit-wide `data-motion="off"` switch. */
  private stilled(): boolean {
    // Optional call: a non-browser DOM (jsdom) has no `matchMedia`.
    this.reducedMotion ??= this.document.defaultView?.matchMedia?.(
      '(prefers-reduced-motion: reduce)',
    );
    return (
      this.reducedMotion?.matches === true ||
      this.document.documentElement.dataset['motion'] === 'off'
    );
  }
}
