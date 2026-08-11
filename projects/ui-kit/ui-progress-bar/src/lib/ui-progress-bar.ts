import {
  booleanAttribute,
  Component,
  computed,
  input,
  numberAttribute,
  TemplateRef,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';

export type UiProgressBarSize = 'default' | 'small';
export type UiProgressBarMode = 'determinate' | 'indeterminate';
export type UiProgressBarValuePosition = 'right' | 'bottom' | 'inside';

/** Context passed to a custom value template. */
export interface UiProgressBarValueContext {
  $implicit: number;
}

/**
 * ui-progress-bar — process status indicator (headless).
 *
 * Renders a token-coloured track filled to `value`% (`determinate`), a looping
 * animation with no tracked value (`indeterminate`), or a set of discrete
 * segments when `steps` is provided. The completion value can be shown next to
 * (`right`) or below (`bottom`) the bar, formatted freely through a custom
 * `valueTemplate`. The fill colour is overridable per instance via `color`
 * (or the `--ui-progress-bar-color` CSS hook).
 *
 * Accessible: the track carries `role="progressbar"` with `aria-valuemin`,
 * `aria-valuemax` and (when determinate) `aria-valuenow`; name it with
 * `ariaLabel` / `ariaLabelledBy`. Motion honours the OS reduced-motion
 * preference and the kit-wide `data-motion="off"` switch.
 */
@Component({
  selector: 'ui-progress-bar',
  imports: [NgTemplateOutlet],
  templateUrl: './ui-progress-bar.html',
  styleUrl: './ui-progress-bar.scss',
})
export class UiProgressBar {
  /** Current progress, 0–100 (clamped). Ignored when `mode="indeterminate"`. */
  value = input(0, { transform: numberAttribute });
  /** `determinate` tracks a value; `indeterminate` loops with no value. */
  mode = input<UiProgressBarMode>('determinate');
  /** Show the completion value beside/below the bar (determinate, non-steps). */
  showValue = input(true, { transform: booleanAttribute });
  /** Unit appended to the numeric value (e.g. "%"). */
  unit = input('%');
  /** Size preset. */
  size = input<UiProgressBarSize>('default');
  /**
   * Where the value label sits: beside (`right`), below (`bottom`), or centered
   * within the filled portion of the bar itself (`inside`).
   */
  valuePosition = input<UiProgressBarValuePosition>('right');
  /**
   * When > 0, render the bar as this many discrete segments; the number of
   * filled segments is derived from `value`. Hides the numeric label.
   */
  steps = input(0, { transform: numberAttribute });
  /** Fill colour override (any CSS colour). Sets `--ui-progress-bar-color`. */
  color = input<string>();
  /** Custom label content; context `{ $implicit: value }`. */
  valueTemplate = input<TemplateRef<UiProgressBarValueContext>>();
  /** Accessible name of the progress bar. */
  ariaLabel = input<string>();
  /** Id of the element labelling the progress bar. */
  ariaLabelledBy = input<string>();

  /** @ignore Value clamped to the 0–100 range. */
  protected readonly clampedValue = computed(() => {
    const v = this.value() ?? 0;
    return Math.min(100, Math.max(0, v));
  });

  /** @ignore */
  protected readonly isIndeterminate = computed(() => this.mode() === 'indeterminate');

  /** @ignore Whole number of segments requested (0 = continuous bar). */
  protected readonly stepCount = computed(() => Math.max(0, Math.floor(this.steps() ?? 0)));

  /** @ignore Steps mode is active. */
  protected readonly isSteps = computed(() => this.stepCount() > 0);

  /** @ignore Number of filled segments, derived from the value. */
  protected readonly filledSteps = computed(() =>
    Math.round((this.clampedValue() / 100) * this.stepCount()),
  );

  /** @ignore One boolean (active?) per segment. */
  protected readonly segments = computed(() => {
    const filled = this.filledSteps();
    return Array.from({ length: this.stepCount() }, (_, i) => i < filled);
  });

  /** @ignore The numeric label is rendered (not indeterminate, not steps). */
  protected readonly showLabel = computed(
    () => this.showValue() && !this.isIndeterminate() && !this.isSteps(),
  );

  /** @ignore Label sits inside the filled portion of the bar. */
  protected readonly labelInside = computed(
    () => this.showLabel() && this.valuePosition() === 'inside',
  );

  /** @ignore `aria-valuenow`: the value when tracked, otherwise omitted. */
  protected readonly ariaValueNow = computed(() =>
    this.isIndeterminate() ? null : this.clampedValue(),
  );

  /** @ignore Human-readable value for steps ("3 / 5"); omitted otherwise. */
  protected readonly ariaValueText = computed(() =>
    this.isSteps() ? `${this.filledSteps()} / ${this.stepCount()}` : null,
  );

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-progress-bar', `_${this.valuePosition()}`];
    if (this.size() !== 'default') c.push(`_${this.size()}`);
    if (this.isIndeterminate()) c.push('_indeterminate');
    if (this.isSteps()) c.push('_steps');
    return c.join(' ');
  });
}
