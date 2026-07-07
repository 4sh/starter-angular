import { booleanAttribute, Component, computed, input } from '@angular/core';
import { UiLabel } from '@app/shared/components/ui/forms/ui-label/ui-label';
import { UiHelper } from '@app/shared/components/ui/informative/ui-helper/ui-helper';
import { FieldLevel, FieldSize } from '@app/shared/components/ui/forms/base-form-field';

/**
 * ui-field — shared presentational shell for "box" fields.
 *
 * Renders: `ui-label` (top) + a bordered box (states/levels via `form.*` tokens)
 * + `ui-helper` (bottom). The field content is **projected**:
 * - `[uiFieldPrefix]`: element(s) before the input (left icon…),
 * - default: the native `<input>`/`<textarea>`,
 * - `[uiFieldSuffix]`: element(s) after (unit, action, spinner…).
 *
 * Purely visual (no `ControlValueAccessor`): the concrete components
 * (`ui-input`, `ui-input-number`, `ui-input-mask`) own the value and provide the
 * computed `id`/`level`/`message` (via `BaseFormField`).
 */
@Component({
  selector: 'ui-field',
  imports: [UiLabel, UiHelper],
  templateUrl: './ui-field.html',
  styleUrl: './ui-field.scss',
})
export class UiField {
  /** Label (rendered via `ui-label`). */
  label = input<string>();
  /** Label `for` = id of the projected input. */
  for = input<string>();
  /** Required marker (*). */
  required = input(false, { transform: booleanAttribute });
  /** Size. */
  size = input<FieldSize>('default');
  /** Effective level (drives the border + message color). */
  level = input<FieldLevel>('default');
  /** Disabled state (visual). */
  disabled = input(false, { transform: booleanAttribute });
  /** Read-only state (visual). */
  readonly = input(false, { transform: booleanAttribute });
  /** Message under the field (helper or error, already resolved by the component). */
  message = input<string>();
  /** id of the message (for `aria-describedby`, set by the component on the input). */
  messageId = input<string>();

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-field', `_${this.level()}`];
    if (this.size() !== 'default') c.push(`_${this.size()}`);
    if (this.disabled()) c.push('_disabled');
    if (this.readonly()) c.push('_readonly');
    return c.join(' ');
  });
}
