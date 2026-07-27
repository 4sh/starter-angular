import {
  booleanAttribute,
  Component,
  computed,
  effect,
  forwardRef,
  input,
  isDevMode,
  numberAttribute,
  output,
  signal,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseControlValueAccessor } from '@app/core/controlValueAccessor/BaseControlValueAccessor';
import { UiLevel } from '@app/shared/types/ui-level';
import { UiButton } from '@app/shared/components/ui/actions/ui-button/ui-button';

export type NudgerSize = 'default' | 'small';

let nextUid = 0;

/**
 * ui-nudger : headless numeric stepper (`[−] value [+]`).
 *
 * Composes two icon-only `ui-button` instances around a read-only value
 * display. Holds a `number` value via `ControlValueAccessor` (standalone,
 * `[(ngModel)]`, Reactive Forms, Signal Forms). `min`/`max` disable the
 * relevant button at the bound (the Figma `interaction` states Min/Max are
 * **derived** from the value here, never a prop); `step` sizes each nudge.
 *
 * Keyboard: each button is a real `<button>` (Tab + Enter/Space). The value
 * is a live region announced on change.
 */
@Component({
  selector: 'ui-nudger',
  imports: [UiButton],
  templateUrl: './ui-nudger.html',
  styleUrl: './ui-nudger.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiNudger), multi: true }],
})
export class UiNudger extends BaseControlValueAccessor<number> {
  /** Minimum value (disables "−" at the bound). */
  min = input<number, unknown>(undefined, { transform: numberAttribute });
  /** Maximum value (disables "+" at the bound). */
  max = input<number, unknown>(undefined, { transform: numberAttribute });
  /** Increment/decrement step. */
  step = input<number, unknown>(1, { transform: numberAttribute });
  /** Value used when the model is empty (also the standalone default). */
  defaultValue = input<number, unknown>(0, { transform: numberAttribute });

  /** Size. */
  size = input<NudgerSize>('default');
  /** Color family of the two buttons. */
  level = input<UiLevel>('high');

  /** Disables the whole control (native on both buttons). */
  disabled = input(false, { transform: booleanAttribute });
  /** Read-only: value can't be changed, buttons are inert. */
  readonly = input(false, { transform: booleanAttribute });
  /** Required marker (used for the accessible name / forms). */
  required = input(false, { transform: booleanAttribute });
  /** Forces error styling (automatic when the attached control is invalid + touched/dirty). */
  invalid = input(false, { transform: booleanAttribute });

  /** name reflected on the hidden form value holder. */
  name = input<string>();
  /** id of the root group (auto-generated when omitted). */
  inputId = input<string>();
  /** Accessible name of the whole stepper. */
  ariaLabel = input<string>();
  /** id of an external element that labels this stepper. */
  ariaLabelledBy = input<string>();
  /** tabindex forwarded to the increment button (the group's primary control). */
  tabindex = input<number>();

  /** Accessible label of the decrement button. */
  decrementLabel = input<string>('Diminuer');
  /** Accessible label of the increment button. */
  incrementLabel = input<string>('Augmenter');
  /** FontAwesome icon name of the decrement button. */
  decrementIcon = input<string>('minus');
  /** FontAwesome icon name of the increment button. */
  incrementIcon = input<string>('plus');
  /** Optional display formatter for the value (e.g. `(v) => v + ' kg'`). */
  formatValue = input<(value: number) => string>();

  /** Emitted on each value change. */
  valueChange = output<number>();

  /** @ignore */
  private readonly uid = `ui-nudger-${nextUid++}`;
  /** @ignore Current value (written by the form or by user interaction). */
  protected readonly modelValue = signal<number | undefined>(undefined);

  constructor() {
    super();
    // A11y safeguard: a stepper needs an accessible name.
    if (isDevMode()) {
      effect(() => {
        if (!this.ariaLabel() && !this.ariaLabelledBy()) {
          console.warn('[ui-nudger] Sans nom accessible : renseignez `ariaLabel` (ou `ariaLabelledBy`).');
        }
      });
    }
  }

  /** @ignore Effective numeric value (falls back to `defaultValue`). */
  protected readonly currentValue = computed(() => this.modelValue() ?? this.defaultValue());
  /** @ignore */
  protected readonly resolvedId = computed(() => this.inputId() ?? this.uid);
  /** @ignore Input disabled OR control disabled (forms API). */
  protected readonly isDisabled = computed(() => this.disabled() || this.controlDisabled());
  /** @ignore Explicit error OR invalid control worth surfacing. */
  protected readonly isInvalid = computed(() => this.invalid() || this.showError());

  /** @ignore Bounds reached. */
  protected readonly atMin = computed(() => {
    const min = this.min();
    return min != null && this.currentValue() <= min;
  });
  protected readonly atMax = computed(() => {
    const max = this.max();
    return max != null && this.currentValue() >= max;
  });

  /** @ignore Per-button disabled state. */
  protected readonly decrementDisabled = computed(
    () => this.isDisabled() || this.readonly() || this.atMin(),
  );
  protected readonly incrementDisabled = computed(
    () => this.isDisabled() || this.readonly() || this.atMax(),
  );

  /** @ignore Value shown (custom formatter or plain number). */
  protected readonly displayValue = computed(() => {
    const v = this.currentValue();
    return this.formatValue()?.(v) ?? String(v);
  });

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-nudger'];
    if (this.size() !== 'default') c.push(`_${this.size()}`);
    if (this.isDisabled()) c.push('_disabled');
    if (this.isInvalid()) c.push('_invalid');
    return c.join(' ');
  });

  override writeValue(value: number | null): void {
    this.modelValue.set(value ?? undefined);
  }

  /** Increments the value by one `step` (clamped to `max`). */
  increment(): void {
    this.stepBy(1);
  }

  /** Decrements the value by one `step` (clamped to `min`). */
  decrement(): void {
    this.stepBy(-1);
  }

  /** @ignore Apply a signed step, clamp, emit. */
  protected stepBy(direction: 1 | -1): void {
    if (this.isDisabled() || this.readonly()) return;
    const next = this.clamp(this.currentValue() + direction * this.step());
    if (next === this.modelValue()) return;
    this.modelValue.set(next);
    this.emitChange(next);
    this.valueChange.emit(next);
  }

  /** @ignore Mark as touched when focus leaves the stepper. */
  protected onBlur(event: FocusEvent): void {
    // Ignore focus moving between the two internal buttons.
    const next = event.relatedTarget as Node | null;
    const root = event.currentTarget as HTMLElement;
    if (next && root.contains(next)) return;
    this.emitTouch();
  }

  /** @ignore Clamp a value into [min, max]. */
  private clamp(value: number): number {
    const min = this.min();
    const max = this.max();
    let v = value;
    if (min != null && v < min) v = min;
    if (max != null && v > max) v = max;
    return v;
  }
}
