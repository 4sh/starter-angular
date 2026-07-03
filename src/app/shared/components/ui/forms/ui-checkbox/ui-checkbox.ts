import {
  booleanAttribute,
  Component,
  computed,
  effect,
  ElementRef,
  forwardRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseControlValueAccessor } from '@app/core/controlValueAccessor/BaseControlValueAccessor';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';

let nextUid = 0;

/**
 * ui-checkbox — headless checkbox built on a real native <input type="checkbox">.
 *
 * The native input stays in the DOM (visually covering the styled box) so
 * keyboard, screen readers, label click and form semantics come for free.
 * Interactive states (hover/focus/disabled/checked) are pure CSS driven by
 * `form.*` design tokens.
 *
 * Works standalone, with [(ngModel)] or with reactive forms (ControlValueAccessor).
 * By default the model value is boolean; `trueValue`/`falseValue` let the model
 * carry any pair of values (e.g. 'yes'/'no', 1/0).
 */
@Component({
  selector: 'ui-checkbox',
  imports: [UiIcon],
  templateUrl: './ui-checkbox.html',
  styleUrl: './ui-checkbox.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiCheckbox), multi: true },
  ],
})
export class UiCheckbox<T = boolean> extends BaseControlValueAccessor<T> {
  /** Label displayed next to the box (clicking it toggles the checkbox). */
  label = input<string>();
  /** Accessible name when no visible label is provided. */
  ariaLabel = input<string>();
  /** id of an external element that labels this checkbox. */
  ariaLabelledBy = input<string>();
  /** id forwarded to the native input (auto-generated when omitted). */
  inputId = input<string>();
  /** name forwarded to the native input. */
  name = input<string>();
  /** Model value emitted when checked. */
  trueValue = input<T>(true as T);
  /** Model value emitted when unchecked. */
  falseValue = input<T>(false as T);
  /** Visual indeterminate state ("some but not all selected"). Purely visual: the model keeps its value. */
  indeterminate = input(false, { transform: booleanAttribute });
  /** Required marker on the label + native required attribute. */
  required = input(false, { transform: booleanAttribute });
  /** Disables the checkbox (native attribute). */
  disabled = input(false, { transform: booleanAttribute });
  /** Focusable but not editable. */
  readonly = input(false, { transform: booleanAttribute });
  /** Forces the error styling (automatic when the attached control is invalid and touched/dirty). */
  invalid = input(false, { transform: booleanAttribute });
  /** tabindex forwarded to the native input. */
  tabindex = input<number>();
  /** Icon shown when checked. */
  checkIcon = input<string>('check');
  /** Icon shown when indeterminate. */
  indeterminateIcon = input<string>('minus');

  /** Emitted on user toggle with the new model value (never when disabled/readonly). */
  checkboxChange = output<T>();
  /** Emitted when the native input receives focus. */
  checkboxFocus = output<FocusEvent>();
  /** Emitted when the native input loses focus. */
  checkboxBlur = output<FocusEvent>();

  /** @ignore */
  private readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>('inputEl');
  /** @ignore Current model value (written by the form or by user toggles). */
  private readonly modelValue = signal<T | undefined>(undefined);
  /** @ignore */
  private readonly uid = `ui-checkbox-${nextUid++}`;

  constructor() {
    super();
    // The `indeterminate` state only exists as a DOM property.
    effect(() => {
      this.inputEl().nativeElement.indeterminate = this.indeterminate();
    });
  }

  /** @ignore */
  protected readonly checked = computed(() => this.modelValue() === this.trueValue());
  /** @ignore Input disabled OR control disabled (form API). */
  protected readonly isDisabled = computed(() => this.disabled() || this.controlDisabled());
  /** @ignore Explicit `invalid` input OR invalid control worth surfacing. */
  protected readonly isInvalid = computed(() => this.invalid() || this.showError());
  /** @ignore */
  protected readonly resolvedId = computed(() => this.inputId() ?? this.uid);

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-checkbox'];
    if (this.checked()) c.push('_checked');
    if (this.indeterminate()) c.push('_indeterminate');
    if (this.isDisabled()) c.push('_disabled');
    if (this.readonly()) c.push('_readonly');
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

  /** @ignore Native change: single source of truth for user toggles. */
  protected onNativeChange(): void {
    const inputEl = this.inputEl().nativeElement;
    if (this.readonly()) {
      inputEl.checked = this.checked(); // revert the native toggle
      return;
    }
    const value = inputEl.checked ? this.trueValue() : this.falseValue();
    this.modelValue.set(value);
    this.emitChange(value);
    this.checkboxChange.emit(value);
  }

  /** @ignore */
  protected onBlur(event: FocusEvent): void {
    this.emitTouch();
    this.checkboxBlur.emit(event);
  }
}
