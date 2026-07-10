import { booleanAttribute, computed, Directive, input } from '@angular/core';

/**
 * Built-in motion presets. Each maps to a pair of global CSS classes
 * (`ui-motion-<preset>-enter` / `ui-motion-<preset>-leave`) defined in
 * `src/styles/src/base/_motion.scss`.
 *
 * - `fade`         — opacity only (neutral).
 * - `slide-up`     — rise + fade (toasts, tooltips above a trigger).
 * - `slide-down`   — drop + fade (menus/dropdowns below a trigger).
 * - `slide-left`   — enter from the right (drawers/panels).
 * - `slide-right`  — enter from the left.
 * - `zoom`         — scale + fade (modals, dialogs, popovers).
 * - `collapse`     — grid-row height + fade (accordions, panels; needs a grid wrapper).
 */
export type UiMotionPreset =
  | 'fade'
  | 'slide-up'
  | 'slide-down'
  | 'slide-left'
  | 'slide-right'
  | 'zoom'
  | 'collapse';

/** All preset keys, in declaration order (handy for stories/docs). */
export const UI_MOTION_PRESETS: readonly UiMotionPreset[] = [
  'fade',
  'slide-up',
  'slide-down',
  'slide-left',
  'slide-right',
  'zoom',
  'collapse',
];

/** CSS class to bind to `animate.enter` for a preset. */
export const motionEnterClass = (preset: UiMotionPreset): string => `ui-motion-${preset}-enter`;
/** CSS class to bind to `animate.leave` for a preset. */
export const motionLeaveClass = (preset: UiMotionPreset): string => `ui-motion-${preset}-leave`;

/**
 * uiMotion — ergonomic wiring for the motion system on a conditionally
 * rendered element (`@if`, `@for`, control-flow insert/remove).
 *
 * It selects an enter/leave **preset** and exposes the matching class names for
 * Angular's native `animate.enter` / `animate.leave`, while letting you re-time
 * a single instance through the `--ui-motion-*` custom properties — no extra
 * CSS. Set `motionDisabled` (or the global `data-motion="off"` switch / the
 * user's reduced-motion preference) to opt out.
 *
 * The enter/leave bindings stay in the template (Angular resolves them at the
 * insertion/removal boundary); the directive supplies the class strings and the
 * timing variables:
 *
 * @example
 * ```html
 * @if (open()) {
 *   <div class="panel"
 *        [uiMotion]="'zoom'" #m="uiMotion"
 *        [animate.enter]="m.enter()" [animate.leave]="m.leave()">…</div>
 * }
 *
 * <!-- faster, custom easing, disabled on demand -->
 * <div [uiMotion]="'slide-down'" motionDuration="120ms"
 *      [motionDisabled]="prefersStillness()" #m="uiMotion"
 *      [animate.enter]="m.enter()" [animate.leave]="m.leave()">…</div>
 * ```
 */
@Directive({
  selector: '[uiMotion]',
  exportAs: 'uiMotion',
  host: {
    '[style.--ui-motion-duration]': '_duration()',
    '[style.--ui-motion-delay]': '_delay()',
    '[style.--ui-motion-easing-enter]': '_enterEasing()',
    '[style.--ui-motion-easing-leave]': '_leaveEasing()',
    '[style.--ui-motion-distance]': '_distance()',
    '[style.--ui-motion-scale]': '_scale()',
  },
})
export class UiMotion {
  /** Motion preset (enter/leave pair). */
  preset = input.required<UiMotionPreset>({ alias: 'uiMotion' });
  /** Override the duration for this element (e.g. `"120ms"`). */
  motionDuration = input<string>();
  /** Override the delay before the animation starts (e.g. `"40ms"`). */
  motionDelay = input<string>();
  /** Override both enter and leave easing (CSS timing function). */
  motionEasing = input<string>();
  /** Override only the enter easing (falls back to `motionEasing`). */
  motionEnterEasing = input<string>();
  /** Override only the leave easing (falls back to `motionEasing`). */
  motionLeaveEasing = input<string>();
  /** Override the slide offset for the directional presets (e.g. `"12px"`). */
  motionDistance = input<string>();
  /** Override the start/end scale for the `zoom` preset (e.g. `0.9`). */
  motionScale = input<number | string>();
  /** Disable motion for this element (renders/removes with no animation). */
  motionDisabled = input(false, { transform: booleanAttribute });

  /** Class to bind to `animate.enter` (empty when disabled → instant appear). */
  readonly enter = computed(() => (this.motionDisabled() ? '' : motionEnterClass(this.preset())));
  /** Class to bind to `animate.leave` (empty when disabled → instant removal). */
  readonly leave = computed(() => (this.motionDisabled() ? '' : motionLeaveClass(this.preset())));

  /** @ignore */
  protected readonly _duration = computed(() => this.motionDuration() ?? null);
  /** @ignore */
  protected readonly _delay = computed(() => this.motionDelay() ?? null);
  /** @ignore */
  protected readonly _enterEasing = computed(() => this.motionEnterEasing() ?? this.motionEasing() ?? null);
  /** @ignore */
  protected readonly _leaveEasing = computed(() => this.motionLeaveEasing() ?? this.motionEasing() ?? null);
  /** @ignore */
  protected readonly _distance = computed(() => this.motionDistance() ?? null);
  /** @ignore */
  protected readonly _scale = computed(() => {
    const s = this.motionScale();
    return s === undefined ? null : String(s);
  });
}
