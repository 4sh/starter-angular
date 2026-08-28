import {
  booleanAttribute,
  DestroyRef,
  Directive,
  ElementRef,
  EnvironmentProviders,
  inject,
  input,
  makeEnvironmentProviders,
  provideEnvironmentInitializer,
} from '@angular/core';
import { UI_RIPPLE_OPTIONS, UiRippleEngine, UiRippleOptions } from './ui-ripple.engine';

/**
 * Turns the ripple on for the WHOLE application: every `<button>`, every
 * `[role="button"]` and everything marked `data-ripple="on"` answers a press
 * with a wave, kit components included (the effect lands on their inner native
 * control, not on the custom element).
 *
 * ```ts
 * // app.config.ts
 * providers: [provideUiRipple()];
 *
 * // widen what ripples
 * providers: [provideUiRipple({ selector: 'button, [role="button"], a[href]' })];
 *
 * // set the kit-wide selector without turning the effect on everywhere
 * providers: [provideUiRipple({ global: false, selector: '.card, button' })];
 * ```
 *
 * Any element or subtree opts out with `data-ripple="off"` (or `[uiRipple]="false"`
 * / `[uiRippleScope]="false"`). No provider is needed to use the directives.
 */
export function provideUiRipple(options: UiRippleOptions = {}): EnvironmentProviders {
  return makeEnvironmentProviders([
    { provide: UI_RIPPLE_OPTIONS, useValue: options },
    provideEnvironmentInitializer(() => inject(UiRippleEngine).installGlobal()),
  ]);
}

/**
 * uiRipple, targeted: THIS element answers a press with a wave starting at the
 * pointer.
 *
 * ```html
 * <button uiRipple>Valider</button>
 * <div class="tile" uiRipple rippleCentered>…</div>
 * <button uiRipple [uiRipple]="false">jamais d'onde, ici ni au-dessous</button>
 * ```
 *
 * The wave is clipped by the element's own box and follows its `border-radius`.
 * Retune it with the inherited `--ui-ripple-*` custom properties, on the element
 * or on any ancestor. Put the directive on a native control rather than on a kit
 * component: `<ui-button uiRipple>` would ripple the custom element's square box,
 * where `<ui-button uiRippleScope>` reaches its inner `<button>`.
 */
@Directive({
  selector: '[uiRipple]',
  host: { '[attr.data-ripple]': 'enabled() ? null : "off"' },
})
export class UiRipple {
  /** Wave on this element. `false` opts it and its subtree out, global effect included. */
  readonly enabled = input(true, { alias: 'uiRipple', transform: booleanAttribute });
  /** Start at the centre rather than at the pointer (icon-only controls). */
  readonly rippleCentered = input(false, { transform: booleanAttribute });

  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const engine = inject(UiRippleEngine);

    inject(DestroyRef).onDestroy(
      engine.bind(host, () => ({
        ...engine.defaults,
        enabled: this.enabled(),
        centered: this.rippleCentered(),
      })),
    );
  }
}

/**
 * uiRippleScope, local: everything interactive INSIDE this element ripples, with
 * a single listener on the container rather than one directive per control.
 *
 * ```html
 * <div class="toolbar" uiRippleScope>
 *   <ui-button label="Enregistrer" />
 *   <button>Annuler</button>
 * </div>
 *
 * <nav uiRippleScope rippleSelector="a, button">…</nav>
 * <section [uiRippleScope]="false">…</section>
 * ```
 *
 * Also the way to ripple a single kit component: `<ui-button uiRippleScope />`
 * reaches the native `<button>` it renders, so the wave follows its radius.
 * Nested scopes and `[uiRipple]` do not stack: the innermost declaration wins.
 */
@Directive({
  selector: '[uiRippleScope]',
  host: { '[attr.data-ripple]': 'enabled() ? null : "off"' },
})
export class UiRippleScope {
  /** Ripple inside this element. `false` opts the whole subtree out. */
  readonly enabled = input(true, { alias: 'uiRippleScope', transform: booleanAttribute });
  /** Start at the centre rather than at the pointer. */
  readonly rippleCentered = input(false, { transform: booleanAttribute });
  /** What ripples inside. Defaults to the kit-wide selector. */
  readonly rippleSelector = input<string>();

  constructor() {
    const root = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const engine = inject(UiRippleEngine);

    inject(DestroyRef).onDestroy(
      engine.delegate(root, () => ({
        enabled: this.enabled(),
        centered: this.rippleCentered(),
        selector: this.rippleSelector() || engine.defaults.selector,
      })),
    );
  }
}
