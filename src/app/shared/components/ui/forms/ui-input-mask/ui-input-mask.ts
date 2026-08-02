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

/** Mask tokens → accepted character class. */
const MASK_TOKENS: Record<string, RegExp> = {
  '9': /[0-9]/, // digit
  a: /[a-zA-Z]/, // letter
  '*': /[a-zA-Z0-9]/, // alphanumeric
};

interface MaskBounds {
  min: number;
  max: number;
}

interface MaskSlot {
  char: string | null;
  rgx?: RegExp;
  bound?: MaskBounds & { pos: number; len: number };
}

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
  private readonly parsedRanges = computed<(MaskBounds | null)[]>(() =>
    this.ranges()
      .trim()
      .split(/\s+/)
      .map((part) => {
        const m = /^(\d+)-(\d+)$/.exec(part);
        return m ? { min: Number(m[1]), max: Number(m[2]) } : null;
      }),
  );

  /**
   * @ignore The mask resolved once per template: literals, input slots, and the
   * `ranges` bounds attached to every slot of the numeric segment it belongs to.
   */
  private readonly slots = computed<MaskSlot[]>(() => {
    const bounds = this.parsedRanges();
    const slots: MaskSlot[] = [];
    // Consecutive `9` tokens = one numeric segment, indexed in mask order.
    const segments: MaskSlot[][] = [];
    let segment: MaskSlot[] | null = null;

    for (const m of this.mask()) {
      const rgx = MASK_TOKENS[m];
      const slot: MaskSlot = rgx ? { char: null, rgx } : { char: m };
      slots.push(slot);
      if (rgx && m === '9') {
        if (!segment) segments.push((segment = []));
        segment.push(slot);
      } else {
        segment = null;
      }
    }

    segments.forEach((seg, i) => {
      const range = bounds[i];
      if (!range) return;
      seg.forEach((slot, pos) => (slot.bound = { ...range, pos, len: seg.length }));
    });

    return slots;
  });

  override writeValue(value: string | null): void {
    const built = this.build(this.extract(value ?? ''));
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
    const dataBeforeCaret = this.extract(raw.slice(0, caret)).length;

    const built = this.build(this.extract(raw));
    const value = this.emitValue(built);
    const display = built.data.length ? built.display : '';

    this.text.set(display);
    this.modelValue.set(value);
    this.emitChange(value);
    this.valueChange.emit(value);

    // Apply synchronously + restore the caret after the Nth typed character
    // (auto-inserted literals skipped). The [value] binding becomes a no-op.
    el.value = display;
    const pos = this.caretFor(built.tokenIndices, dataBeforeCaret, display.length);
    el.setSelectionRange(pos, pos);
  }

  /** @ignore Caret position for `n` typed data characters. */
  private caretFor(tokenIndices: number[], n: number, length: number): number {
    if (n <= 0) return tokenIndices[0] ?? 0;
    if (n >= tokenIndices.length) return length; // all filled → end
    return tokenIndices[n]; // next input position (literals skipped)
  }

  /** @ignore */
  protected onBlur(event: FocusEvent): void {
    this.emitTouch();
    this.inputBlur.emit(event);
  }

  /** @ignore Keep only the data characters (alphanumeric). */
  private extract(raw: string): string {
    return raw.replace(/[^a-zA-Z0-9]/g, '');
  }

  /** @ignore Apply the mask to a sequence of data characters. */
  private build(data: string): {
    display: string;
    masked: string;
    data: string;
    tokenIndices: number[];
  } {
    const fill = this.slotChar();
    let di = 0;
    let display = '';
    let masked = '';
    let lastFilled = 0;
    let used = '';
    const tokenIndices: number[] = [];
    // Characters already accepted in the current numeric segment (drives the bounds check).
    let segment = '';

    for (const slot of this.slots()) {
      if (slot.char !== null) {
        display += slot.char;
        masked += slot.char;
        continue;
      }
      tokenIndices.push(display.length); // index of this token position in `display`
      if (!slot.bound || slot.bound.pos === 0) segment = '';
      while (di < data.length && !this.accepts(slot, segment, data[di])) di++;
      if (di < data.length) {
        display += data[di];
        masked += data[di];
        used += data[di];
        if (slot.bound) segment += data[di];
        di++;
        lastFilled = masked.length;
      } else {
        display += fill;
      }
    }
    // Masked value = up to the last typed character (no trailing literals/slots).
    return { display, masked: masked.slice(0, lastFilled), data: used, tokenIndices };
  }

  /**
   * @ignore Can `ch` fill this slot? It must match the token class and — when the
   * segment is bounded — the digits typed so far plus `ch` must still admit at
   * least one in-range completion of the remaining positions (`2` then `4` is
   * refused on `0-23`, `2` then `3` is accepted).
   */
  private accepts(slot: MaskSlot, segment: string, ch: string): boolean {
    if (!slot.rgx?.test(ch)) return false;
    const bound = slot.bound;
    if (!bound) return true;
    const scale = 10 ** (bound.len - bound.pos - 1);
    const low = Number(segment + ch) * scale;
    return low <= bound.max && low + scale - 1 >= bound.min;
  }

  /** @ignore Emitted value depending on `unmask`. */
  private emitValue(built: { masked: string; data: string }): string {
    return this.unmask() ? built.data : built.masked;
  }
}
