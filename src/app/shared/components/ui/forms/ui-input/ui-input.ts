import { Component, computed, ElementRef, forwardRef, input, output, viewChild } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseFormField } from '@app/shared/components/ui/forms/base-form-field';
import { UiField } from '@app/shared/components/ui/forms/ui-field/ui-field';
import { UiIcon, UiIconSize } from '@app/shared/components/ui/ui-icon/ui-icon';

/** Supported text types (numeric has its dedicated `ui-input-number` component). */
export type InputType = 'text' | 'password' | 'email' | 'tel' | 'url' | 'search';

/**
 * ui-input — headless composed text field, built on the `ui-field` shell
 * (label + box + helper) + a native `<input>`.
 *
 * Covers all text types (text/email/tel/url/search/**password**). Password
 * reveal, search clearing, etc. are handled via the **right action zone**
 * (`iconRightAriaLabel` + `iconRightClick`).
 *
 * Standalone, `[(ngModel)]` or reactive forms (ControlValueAccessor via BaseFormField).
 * For numbers → `ui-input-number`, for masks → `ui-input-mask`.
 */
@Component({
  selector: 'ui-input',
  imports: [UiField, UiIcon],
  templateUrl: './ui-input.html',
  styleUrl: './ui-input.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiInput), multi: true }],
})
export class UiInput extends BaseFormField<string> {
  /** Native input type. */
  type = input<InputType>('text');
  /** Native placeholder. */
  placeholder = input<string>();
  /** Suffix unit (e.g. "%", "@domain"). Shown when provided. */
  unit = input<string>();
  /** Left FontAwesome icon name (decorative). */
  iconLeft = input<string>();
  /** Right FontAwesome icon name. */
  iconRight = input<string>();
  /**
   * Accessible name of the right icon. **When provided, the right icon becomes a
   * clickable action zone** (square, full-height button) that emits `iconRightClick`.
   */
  iconRightAriaLabel = input<string>();
  /** Native autocomplete. */
  autocomplete = input<string>();
  /** Native maxlength. */
  maxlength = input<number>();

  /** Emitted on each input with the new value. */
  valueChange = output<string>();
  /** Emitted on click of the right action zone (active when `iconRightAriaLabel` is set). */
  iconRightClick = output<MouseEvent>();
  /** Emitted when the input receives focus. */
  inputFocus = output<FocusEvent>();
  /** Emitted when the input loses focus. */
  inputBlur = output<FocusEvent>();

  /** @ignore */
  private readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>('inputEl');

  /** @ignore Icon size aligned with the field size. */
  protected readonly iconSize = computed<UiIconSize>(() => (this.size() === 'small' ? 'sm' : 'md'));
  /** @ignore The right icon is an action zone (has an accessible name). */
  protected readonly hasRightAction = computed(() => !!this.iconRight() && !!this.iconRightAriaLabel());

  /** Focuses the input. */
  focus(options?: FocusOptions): void {
    this.inputEl().nativeElement.focus(options);
  }

  /** @ignore Input: single source of the value (view → form). */
  protected onInput(): void {
    const value = this.inputEl().nativeElement.value;
    this.modelValue.set(value);
    this.emitChange(value);
    this.valueChange.emit(value);
  }

  /** @ignore */
  protected onBlur(event: FocusEvent): void {
    this.emitTouch();
    this.inputBlur.emit(event);
  }
}
