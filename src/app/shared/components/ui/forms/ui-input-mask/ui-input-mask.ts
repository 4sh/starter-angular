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
import { BaseFormField } from '@app/shared/components/ui/forms/base-form-field';
import { UiField } from '@app/shared/components/ui/forms/ui-field/ui-field';
import { UiIcon, UiIconSize } from '@app/shared/components/ui/ui-icon/ui-icon';
import {
  applyMaskTemplate,
  buildMaskSlots,
  caretForMask,
  extractMaskData,
  MaskBounds,
  MaskSlot,
  parseMaskRanges,
} from '@app/shared/components/ui/forms/mask-engine';

/**
 * ui-input-mask — headless masked field (`ui-field` shell).
 *
 * `mask` describes the template: `9` digit, `a` letter, `*` alphanumeric; any
 * other character is a literal inserted automatically (e.g. `99/99/9999`,
 * `(999) 999-9999`). Empty positions show `slotChar`.
 *
 * Model value = string: masked (`12/09/2024`) by default, or raw (`12092024`)
 * when `unmask`. Standalone, `[(ngModel)]` or reactive forms.
 */
@Component({
  selector: 'ui-input-mask',
  imports: [UiField, UiIcon],
  templateUrl: './ui-input-mask.html',
  styleUrl: './ui-input-mask.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiInputMask), multi: true },
  ],
})
export class UiInputMask extends BaseFormField<string> {
  /** Mask template (9 digit · a letter · * alphanumeric · other = literal). */
  mask = input.required<string>();
  /**
   * Inclusive bounds of each numeric segment (run of consecutive `9` tokens),
   * in mask order and space-separated: `"0-23 0-59"` for `99:99`,
   * `"1-31 1-12 1900-2100"` for `99/99/9999`. `*` leaves a segment unbounded.
   * A character that could not lead to an in-range segment is rejected.
   */
  ranges = input('');
  /** Fill character for empty positions. */
  slotChar = input('_');
  /** Emit the raw value (without literals) instead of the masked value. */
  unmask = input(false, { transform: booleanAttribute });
  /** Native placeholder (shown when the field is empty). */
  placeholder = input<string>();
  /** Left FontAwesome icon name (decorative). */
  iconLeft = input<string>();

  /** Emitted on each value change. */
  valueChange = output<string>();
  /** Emitted when the input loses focus. */
  inputBlur = output<FocusEvent>();

  /** @ignore */
  private readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>('inputEl');
  /** @ignore Masked displayed text. */
  protected readonly text = signal('');

  /** @ignore */
  protected readonly iconSize = computed<UiIconSize>(() => (this.size() === 'small' ? 'sm' : 'md'));

  /** @ignore Bounds declared by `ranges`, one entry per numeric segment (`null` = unbounded). */
  private readonly parsedRanges = computed<(MaskBounds | null)[]>(() => parseMaskRanges(this.ranges()));

  /**
   * @ignore The mask resolved once per template: literals, input slots, and the
   * `ranges` bounds attached to every slot of the numeric segment it belongs to.
   */
  private readonly slots = computed<MaskSlot[]>(() => buildMaskSlots(this.mask(), this.parsedRanges()));

  override writeValue(value: string | null): void {
    const built = applyMaskTemplate(this.slots(), extractMaskData(value ?? ''), this.slotChar());
    this.modelValue.set(this.emitValue(built));
    this.text.set(built.data.length ? built.display : '');
  }

  /** Focuses the input. */
  focus(options?: FocusOptions): void {
    this.inputEl().nativeElement.focus(options);
  }

  /** @ignore Input: apply the mask, update model + display + caret. */
  protected onInput(): void {
    const el = this.inputEl().nativeElement;
    const raw = el.value;
    const caret = el.selectionStart ?? raw.length;
    // Number of data characters located BEFORE the caret (stable anchor).
    const dataBeforeCaret = extractMaskData(raw.slice(0, caret)).length;

    const built = applyMaskTemplate(this.slots(), extractMaskData(raw), this.slotChar());
    const value = this.emitValue(built);
    const display = built.data.length ? built.display : '';

    this.text.set(display);
    this.modelValue.set(value);
    this.emitChange(value);
    this.valueChange.emit(value);

    // Apply synchronously + restore the caret after the Nth typed character
    // (auto-inserted literals skipped). The [value] binding becomes a no-op.
    el.value = display;
    const pos = caretForMask(built.tokenIndices, dataBeforeCaret, display.length);
    el.setSelectionRange(pos, pos);
  }

  /** @ignore */
  protected onBlur(event: FocusEvent): void {
    this.emitTouch();
    this.inputBlur.emit(event);
  }

  /** @ignore Emitted value depending on `unmask`. */
  private emitValue(built: { masked: string; data: string }): string {
    return this.unmask() ? built.data : built.masked;
  }
}
