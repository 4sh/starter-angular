import { booleanAttribute, Component, computed, input } from '@angular/core';
import { UiLabel } from '@4sh/ui-kit/forms/ui-label';
import { UiHelper } from '@4sh/ui-kit/informative/ui-helper';
import { FieldFloatLabel, FieldLevel, FieldSize } from '@4sh/ui-kit/forms';

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
 *
 * `floatLabel` switches the label into the box, where it plays the placeholder
 * role and rises on focus or once `filled` is set. The raised state is CSS-only
 * for focus (`:focus-within`) and autofill; the "has a value" half cannot be
 * expressed in CSS for every control (a `<button>` trigger has no `value`), so
 * the concrete component reports it through `filled`.
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
  /** Floating label placement (`over` | `in` | `on`). Unset = classic label above the box. */
  floatLabel = input<FieldFloatLabel>();
  /** The control holds a value: keeps the floating label raised once focus leaves. */
  filled = input(false, { transform: booleanAttribute });
  /** Disabled state (visual). */
  disabled = input(false, { transform: booleanAttribute });
  /** Read-only state (visual). */
  readonly = input(false, { transform: booleanAttribute });
  /** Multiline box (top-aligned, auto-height with min-height) — used by `ui-textarea`. */
  multiline = input(false, { transform: booleanAttribute });
  /**
   * Auto-height box (grows with wrapping content, keeps padding + centering) —
   * used by `ui-select` in `multiple` mode so chips/values can wrap.
   */
  autoHeight = input(false, { transform: booleanAttribute });
  /** Message under the field (helper or error, already resolved by the component). */
  message = input<string>();
  /** id of the message (for `aria-describedby`, set by the component on the input). */
  messageId = input<string>();
  /** Renders the footer row even without a message (e.g. to host a `[uiFieldFooter]` counter). */
  hasFooter = input(false, { transform: booleanAttribute });
  /**
   * An affix is projected into `[uiFieldPrefix]` (left icon…). Only read in
   * `floatLabel` mode, to indent the floating label past it: the prefix is
   * projected content, so no scoped selector here can see it.
   */
  hasPrefix = input(false, { transform: booleanAttribute });

  /** @ignore */
  protected onBoxMouseDown(event: MouseEvent): void {
    if (this.disabled() || this.readonly()) return;
    const target = event.target as HTMLElement;
    if (target.closest('button, a[href], input, textarea, select, [contenteditable="true"]'))
      return;
    const box = event.currentTarget as HTMLElement;
    const control = box.querySelector<HTMLElement>('input, textarea, select');
    if (!control || control.matches(':disabled')) return;
    event.preventDefault();
    control.focus();
  }

  /** @ignore The label is rendered inside the box, as a floating label. */
  protected readonly isFloating = computed(() => !!this.floatLabel() && !!this.label());

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-field', `_${this.level()}`];
    if (this.size() !== 'default') c.push(`_${this.size()}`);
    if (this.disabled()) c.push('_disabled');
    if (this.readonly()) c.push('_readonly');
    if (this.multiline()) c.push('_multiline');
    if (this.autoHeight()) c.push('_auto-height');
    if (this.isFloating()) {
      c.push('_float', `_float-${this.floatLabel()}`);
      if (this.filled()) c.push('_filled');
      if (this.hasPrefix()) c.push('_has-prefix');
    }
    return c.join(' ');
  });
}
