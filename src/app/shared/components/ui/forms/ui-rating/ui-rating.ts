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
import { BaseControlValueAccessor } from '@app/core/controlValueAccessor/BaseControlValueAccessor';
import { UiIcon, UiIconSize } from '@app/shared/components/ui/ui-icon/ui-icon';

let nextUid = 0;

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
export class UiRating extends BaseControlValueAccessor<number> {
  /** Size of the rating stars. */
  size = input<UiIconSize>('default');
  /** Number of stars to display. */
  stars = input(5, { transform: numberAttribute });
  /** Allows clearing the rating by clicking the current value. */
  cancel = input(true, { transform: booleanAttribute });
  /** Disables the rating control. */
  disabled = input(false, { transform: booleanAttribute });
  /** Makes the rating read-only. */
  readonly = input(false, { transform: booleanAttribute });
  /** Required marker + native required attribute. */
  required = input(false, { transform: booleanAttribute });
  /** Forces error styling. */
  invalid = input(false, { transform: booleanAttribute });
  /** Native autofocus attribute. */
  autofocus = input(false, { transform: booleanAttribute });
  /** Orientation of the rating control. */
  orientation = input<'horizontal' | 'vertical'>('horizontal');
  
  /** Native group name. */
  name = input<string>();
  /** Accessible name. */
  ariaLabel = input<string>();
  /** id of an external element that labels this rating. */
  ariaLabelledBy = input<string>();
  /** id forwarded to the native input. */
  inputId = input<string>();
  /** tabindex forwarded to the native input. */
  tabindex = input<number>();

  /** Custom template for active stars. */
  onIconTemplate = contentChild('onIcon', { read: TemplateRef<UiRatingIconContext> });
  /** Custom template for inactive stars. */
  offIconTemplate = contentChild('offIcon', { read: TemplateRef<UiRatingIconContext> });

  /** Emitted when rating changes. */
  rateChange = output<number>();
  /** Emitted when the native input receives focus. */
  ratingFocus = output<FocusEvent>();
  /** Emitted when the native input loses focus. */
  ratingBlur = output<FocusEvent>();

  /** @ignore */
  private readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>('inputEl');
  /** @ignore */
  protected readonly modelValue = signal<number>(0);
  /** @ignore */
  protected readonly hoverValue = signal<number>(0);
  
  /** @ignore */
  private readonly uid = `ui-rating-${nextUid++}`;

  /** @ignore */
  protected readonly isDisabled = computed(() => this.disabled() || this.controlDisabled());
  /** @ignore */
  protected readonly isInvalid = computed(() => this.invalid() || this.showError());
  /** @ignore */
  protected readonly resolvedId = computed(() => this.inputId() ?? this.uid);

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

  writeValue(value: number): void {
    this.modelValue.set(value || 0);
  }

  focus(options?: FocusOptions): void {
    this.inputEl().nativeElement.focus(options);
  }

  /** @ignore Native change is triggered by keyboard or programmatic native actions */
  protected onNativeChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    const value = parseInt(input.value, 10);
    this.updateValue(value);
  }

  /** @ignore */
  protected rate(value: number): void {
    if (this.isDisabled() || this.readonly()) return;
    
    let newValue = value;
    if (this.cancel() && this.modelValue() === value) {
      newValue = 0;
    }
    
    this.updateValue(newValue);
    this.focus();
  }

  private updateValue(value: number): void {
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
