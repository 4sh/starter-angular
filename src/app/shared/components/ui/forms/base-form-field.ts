import { booleanAttribute, computed, Directive, input, signal } from '@angular/core';
import { BaseControlValueAccessor } from '@app/core/controlValueAccessor/BaseControlValueAccessor';
import { UiFeedbackLevel } from '@app/shared/types/ui-level';

export type FieldSize = 'default' | 'small';
/** Visual validation status (subset of `UiFeedbackLevel`, shared with `ui-helper`). */
export type FieldLevel = Extract<UiFeedbackLevel, 'default' | 'success' | 'error'>;

let nextUid = 0;

/**
 * Base class for "box" form fields (`ui-input`, `ui-input-number`,
 * `ui-input-mask`, `ui-textarea`…).
 *
 * Holds the common inputs (label, helper, error, size, level, states) and the
 * derived state (validation, ids, displayed message). Extends
 * `BaseControlValueAccessor`: subclasses only handle their own `<input>`
 * (specific parsing/formatting) and call `emitChange` / `emitTouch`.
 *
 * Decorated with `@Directive()` (no selector) so the signal inputs are inherited
 * correctly by the concrete components.
 */
@Directive()
export abstract class BaseFormField<T> extends BaseControlValueAccessor<T> {
  /** Label (rendered via `ui-label`). */
  label = input<string>();
  /** Helper text under the field (rendered via `ui-helper`). */
  helperText = input<string>();
  /** Error message shown in place of the helper when the field is in error. */
  errorText = input<string>();
  /** Accessible name when no visible `label` is provided. */
  ariaLabel = input<string>();
  /** id of an external element that labels this field. */
  ariaLabelledBy = input<string>();
  /** id forwarded to the native input (auto-generated when omitted). */
  inputId = input<string>();
  /** name forwarded to the native input. */
  name = input<string>();
  /** Size. */
  size = input<FieldSize>('default');
  /** Explicit validation status (`error` is forced when the control is invalid + touched). */
  level = input<FieldLevel>('default');
  /** Required marker (*) + native required attribute. */
  required = input(false, { transform: booleanAttribute });
  /** Disables the field (native attribute). */
  disabled = input(false, { transform: booleanAttribute });
  /** Read-only (native attribute). */
  readonly = input(false, { transform: booleanAttribute });
  /** Forces the error styling (automatic when the attached control is invalid and touched/dirty). */
  invalid = input(false, { transform: booleanAttribute });
  /** tabindex forwarded to the native input. */
  tabindex = input<number>();

  /** @ignore */
  private readonly uid = `ui-field-${nextUid++}`;
  /** @ignore Current value (written by the form or by user input). */
  protected readonly modelValue = signal<T | undefined>(undefined);

  /** @ignore */
  protected readonly resolvedId = computed(() => this.inputId() ?? this.uid);
  /** @ignore id of the message (for aria-describedby). */
  protected readonly messageId = computed(() => `${this.resolvedId()}-message`);
  /** @ignore Input disabled OR control disabled (form API). */
  protected readonly isDisabled = computed(() => this.disabled() || this.controlDisabled());
  /** @ignore Explicit error OR invalid control worth surfacing. */
  protected readonly isInvalid = computed(() => this.invalid() || this.showError());
  /** @ignore Effective level: error when invalid, otherwise the requested `level`. */
  protected readonly effectiveLevel = computed<FieldLevel>(() => (this.isInvalid() ? 'error' : this.level()));
  /** @ignore Displayed message: errorText when in error (if provided), otherwise helperText. */
  protected readonly displayMessage = computed(() =>
    this.isInvalid() && this.errorText() ? this.errorText() : this.helperText(),
  );
  /** @ignore Value shown in the input (string). Override for specific formatting. */
  protected readonly displayValue = computed(() => {
    const v = this.modelValue();
    return v === undefined || v === null ? '' : String(v);
  });

  writeValue(value: T): void {
    this.modelValue.set(value);
  }
}
