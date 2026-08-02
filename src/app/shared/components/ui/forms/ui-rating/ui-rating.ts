import {
  booleanAttribute,
  Component,
  computed,
  contentChild,
  ElementRef,
  forwardRef,
  input,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { NgTemplateOutlet } from '@angular/common';
import { BaseFieldControl } from '@app/shared/components/ui/forms/base-form-field';
import { UiIcon, UiIconSize } from '@app/shared/components/ui/ui-icon/ui-icon';

export interface UiRatingIconContext {
  /** The current star value (1-based index). */
  $implicit: number;
  /** Whether this star is active (value <= current rating). */
  active: boolean;
  /** Filled portion of this star, `0` to `1` (hover preview included). */
  fill: number;
}

/**
 * ui-rating — headless rating component built over a native <input type="range">.
 */
@Component({
  selector: 'ui-rating',
  templateUrl: './ui-rating.html',
  styleUrl: './ui-rating.scss',
  standalone: true,
  imports: [UiIcon, NgTemplateOutlet],
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiRating), multi: true },
  ],
})
export class UiRating extends BaseFieldControl<number | null> {
  /** Size of the rating stars. */
  size = input<UiIconSize>('default');
  /** Number of stars to display. */
  stars = input(5, { transform: numberAttribute });
  /** Enables half-star notation: the value moves by 0.5 (click on a half, arrow keys). */
  allowHalf = input(false, { transform: booleanAttribute });
  /** Allows clearing the rating by clicking the current value. */
  cancel = input(true, { transform: booleanAttribute });
  /** Native autofocus attribute. */
  autofocus = input(false, { transform: booleanAttribute });
  /** Orientation of the rating control. */
  orientation = input<'horizontal' | 'vertical'>('horizontal');

  /** Custom template for active stars. */
  onIconTemplate = contentChild('onIcon', { read: TemplateRef<UiRatingIconContext> });
  /** Custom template for inactive stars. */
  offIconTemplate = contentChild('offIcon', { read: TemplateRef<UiRatingIconContext> });

  /** Emitted when rating changes (`null` = cleared / not rated). */
  rateChange = output<number | null>();
  /** Emitted when the native input receives focus. */
  ratingFocus = output<FocusEvent>();
  /** Emitted when the native input loses focus. */
  ratingBlur = output<FocusEvent>();

  /** @ignore */
  private readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>('inputEl');
  /** @ignore Redeclared over the base signal: `null` = not rated (never `undefined`). */
  protected override readonly modelValue = signal<number | null>(null);
  /** @ignore */
  protected readonly hoverValue = signal<number>(0);
  /** @ignore Selection granularity: one star, or a half when `allowHalf`. */
  protected readonly step = computed(() => (this.allowHalf() ? 0.5 : 1));
  /**
   * @ignore Numeric value used for display comparisons (`null` renders as 0 stars).
   * Floored to the granularity so an out-of-step value (an average pushed by the
   * host, e.g. 4.3) never renders a fill the user could not have selected.
   */
  protected readonly currentValue = computed(() => {
    const step = this.step();
    return Math.floor(Math.max(0, this.modelValue() ?? 0) / step) * step;
  });

  /** @ignore Per-star render model; `fill` (0 → 1) drives the clipped overlay. */
  protected readonly starList = computed(() => {
    const value = this.currentValue();
    const preview = this.hoverValue() || value;
    return Array.from({ length: this.stars() }, (_, i) => ({
      index: i + 1,
      fill: Math.min(1, Math.max(0, preview - i)),
      active: i + 1 <= value,
    }));
  });

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-rating', `_size-${this.size()}`];
    if (this.orientation() === 'vertical') c.push('_vertical');
    if (this.isDisabled()) c.push('_disabled');
    if (this.readonly()) c.push('_readonly');
    if (this.isInvalid()) c.push('_invalid');
    return c.join(' ');
  });

  override writeValue(value: number | null): void {
    this.modelValue.set(value ?? null);
  }

  /** @ignore */
  protected override uidPrefix(): string {
    return 'ui-rating';
  }

  focus(options?: FocusOptions): void {
    this.inputEl().nativeElement.focus(options);
  }

  /** @ignore Native change is triggered by keyboard or programmatic native actions */
  protected onNativeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseFloat(input.value);
    if (this.isDisabled() || this.readonly() || Number.isNaN(value)) {
      // Revert the native range so its value stays in sync with the model.
      input.value = String(this.currentValue());
      return;
    }
    // The range's 0 means "not rated" → null at the public boundary.
    this.updateValue(value === 0 ? null : value);
  }

  /** @ignore */
  protected rate(star: number, event: MouseEvent): void {
    if (this.isDisabled() || this.readonly()) return;

    const value = this.pointedValue(star, event);
    let newValue: number | null = value;
    if (this.cancel() && this.modelValue() === value) {
      newValue = null;
    }

    this.updateValue(newValue);
    this.focus();
  }

  /**
   * @ignore Value pointed at by the cursor: the star itself, or its first half
   * when `allowHalf`. Reads the writing direction so the "first half" stays the
   * leading one in RTL, like the clip applied by the stylesheet.
   */
  private pointedValue(star: number, event: MouseEvent): number {
    if (!this.allowHalf()) return star;
    const el = event.currentTarget as HTMLElement;
    const { left, width } = el.getBoundingClientRect();
    if (!width) return star;
    const ratio = (event.clientX - left) / width;
    const leadingHalf = getComputedStyle(el).direction === 'rtl' ? ratio > 0.5 : ratio < 0.5;
    return leadingHalf ? star - 0.5 : star;
  }

  private updateValue(value: number | null): void {
    if (this.modelValue() !== value) {
      this.modelValue.set(value);
      this.emitChange(value);
      this.rateChange.emit(value);
    }
  }

  /** @ignore Bound to `mousemove`: the preview must follow the cursor across the two halves. */
  protected setHover(star: number, event: MouseEvent): void {
    if (this.isDisabled() || this.readonly()) return;
    this.hoverValue.set(this.pointedValue(star, event));
  }

  /** @ignore */
  protected clearHover(): void {
    if (this.isDisabled() || this.readonly()) return;
    this.hoverValue.set(0);
  }

  /** @ignore */
  protected onFocus(event: FocusEvent): void {
    this.ratingFocus.emit(event);
  }

  /** @ignore */
  protected onBlur(event: FocusEvent): void {
    this.emitTouch();
    this.ratingBlur.emit(event);
  }
}
