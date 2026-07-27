import {
  booleanAttribute,
  Component,
  computed,
  ElementRef,
  forwardRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseControlValueAccessor } from '@app/core/controlValueAccessor/BaseControlValueAccessor';

let nextUid = 0;

/**
 * ui-radio — headless radio button built on a real native <input type="radio">.
 *
 * Each ui-radio holds one `value`; the group is formed by binding every member
 * to the same form control (same `formControlName` / `[(ngModel)]`) AND giving
 * them the same `name` (native grouping = roving arrow-key navigation for free).
 * The one whose `value` equals the model value is checked.
 *
 * Interactive states (hover/focus/disabled/checked) are pure CSS driven by
 * `form.*` design tokens.
 */
@Component({
  selector: 'ui-radio',
  templateUrl: './ui-radio.html',
  styleUrl: './ui-radio.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiRadio), multi: true },
  ],
})
export class UiRadio<T = unknown> extends BaseControlValueAccessor<T> {
  /** Value carried by this radio (the model takes it when selected). */
  value = input.required<T>();
  /** Native group name — same name for every radio of the group. */
  name = input<string>();
  /** Label displayed next to the radio (clicking it selects it). */
  label = input<string>();
  /** Accessible name when no visible label is provided. */
  ariaLabel = input<string>();
  /** id of an external element that labels this radio. */
  ariaLabelledBy = input<string>();
  /** id forwarded to the native input (auto-generated when omitted). */
  inputId = input<string>();
  /** Required marker on the label + native required attribute. */
  required = input(false, { transform: booleanAttribute });
  /** Disables this radio (native attribute). */
  disabled = input(false, { transform: booleanAttribute });
  /** Forces the error styling (automatic when the attached control is invalid and touched/dirty). */
  invalid = input(false, { transform: booleanAttribute });
  /** tabindex forwarded to the native input. */
  tabindex = input<number>();

  /** Emitted when this radio becomes selected by user interaction, with its value. */
  radioChange = output<T>();
  /** Emitted when the native input receives focus. */
  radioFocus = output<FocusEvent>();
  /** Emitted when the native input loses focus. */
  radioBlur = output<FocusEvent>();

  /** @ignore */
  private readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>('inputEl');
  /** @ignore Group model value (written by the form or by user selection). */
  private readonly modelValue = signal<T | undefined>(undefined);
  /** @ignore */
  private readonly uid = `ui-radio-${nextUid++}`;

  /** @ignore */
  protected readonly checked = computed(() => this.modelValue() === this.value());
  /** @ignore Input disabled OR control disabled (form API). */
  protected readonly isDisabled = computed(() => this.disabled() || this.controlDisabled());
  /** @ignore Explicit `invalid` input OR invalid control worth surfacing. */
  protected readonly isInvalid = computed(() => this.invalid() || this.showError());
  /** @ignore */
  protected readonly resolvedId = computed(() => this.inputId() ?? this.uid);

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-radio'];
    if (this.checked()) c.push('_checked');
    if (this.isDisabled()) c.push('_disabled');
    if (this.isInvalid()) c.push('_invalid');
    return c.join(' ');
  });

  writeValue(value: T): void {
    this.modelValue.set(value);
  }

  /** Focus the native input programmatically. */
  focus(options?: FocusOptions): void {
    this.inputEl().nativeElement.focus(options);
  }

  /** @ignore Native change fires only when this radio becomes checked. */
  protected onNativeChange(): void {
    const value = this.value();
    this.modelValue.set(value);
    this.emitChange(value);
    this.radioChange.emit(value);
  }

  /** @ignore */
  protected onBlur(event: FocusEvent): void {
    this.emitTouch();
    this.radioBlur.emit(event);
  }
}
