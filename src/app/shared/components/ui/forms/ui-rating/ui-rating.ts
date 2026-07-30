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
  /** @ignore Numeric value used for display comparisons (`null` renders as 0 stars). */
  protected readonly currentValue = computed(() => this.modelValue() ?? 0);

  /** @ignore */
  protected readonly starsArray = computed(() => {
    return Array.from({ length: this.stars() }, (_, i) => i + 1);
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
    const value = parseInt(input.value, 10);
    if (this.isDisabled() || this.readonly() || Number.isNaN(value)) {
      // Revert the native range so its value stays in sync with the model.
      input.value = String(this.currentValue());
      return;
    }
    // The range's 0 means "not rated" → null at the public boundary.
    this.updateValue(value === 0 ? null : value);
  }

  /** @ignore */
  protected rate(value: number): void {
    if (this.isDisabled() || this.readonly()) return;
    
    let newValue: number | null = value;
    if (this.cancel() && this.modelValue() === value) {
      newValue = null;
    }

    this.updateValue(newValue);
    this.focus();
  }

  private updateValue(value: number | null): void {
    if (this.modelValue() !== value) {
      this.modelValue.set(value);
      this.emitChange(value);
      this.rateChange.emit(value);
    }
  }

  /** @ignore */
  protected setHover(value: number): void {
    if (this.isDisabled() || this.readonly()) return;
    this.hoverValue.set(value);
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
