import {
  Component,
  computed,
  ElementRef,
  forwardRef,
  input,
  output,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseFieldControl } from '@app/shared/components/ui/forms/base-form-field';

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
export class UiRadio<T = unknown> extends BaseFieldControl<T> {
  /** Value carried by this radio (the model takes it when selected). */
  value = input.required<T>();
  /** Label displayed next to the radio (clicking it selects it). */
  label = input<string>();

  /** Emitted when this radio becomes selected by user interaction, with its value. */
  radioChange = output<T>();
  /** Emitted when the native input receives focus. */
  radioFocus = output<FocusEvent>();
  /** Emitted when the native input loses focus. */
  radioBlur = output<FocusEvent>();

  /** @ignore */
  private readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>('inputEl');

  /** @ignore */
  protected readonly checked = computed(() => this.modelValue() === this.value());

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-radio'];
    if (this.checked()) c.push('_checked');
    if (this.isDisabled()) c.push('_disabled');
    if (this.isInvalid()) c.push('_invalid');
    return c.join(' ');
  });

  /** @ignore */
  protected override uidPrefix(): string {
    return 'ui-radio';
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
