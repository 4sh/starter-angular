import {
  booleanAttribute,
  Component,
  computed,
  effect,
  ElementRef,
  forwardRef,
  input,
  isDevMode,
  numberAttribute,
  output,
  signal,
  viewChild,
  viewChildren,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseControlValueAccessor } from '@app/core/controlValueAccessor/BaseControlValueAccessor';

export type SliderOrientation = 'horizontal' | 'vertical';
/** Model value: a single number, or a `[start, end]` tuple in `range` mode. */
export type SliderValue = number | number[];

/** A slider handle projected to the view (its live value + track position). */
interface SliderHandle {
  index: number;
  value: number;
  percent: number;
}

/** A step tick projected to the view. */
interface SliderMark {
  value: number;
  percent: number;
  active: boolean;
}

let nextUid = 0;

/**
 * ui-slider — headless slider to pick a numeric value (or a range) by dragging
 * a handle along a track.
 *
 * Built on the WAI-ARIA slider pattern: each handle is a `role="slider"` element
 * exposing `aria-valuemin/max/now` and `aria-orientation`, fully keyboard driven
 * (arrows, Page Up/Down, Home/End). Pointer events cover mouse, touch and pen
 * with a single code path. Interactive states (hover/focus/pressed/disabled) are
 * pure CSS driven by `actions.*` / `form.*` design tokens.
 *
 * Works standalone, with `[(ngModel)]`, Reactive Forms or Signal Forms
 * (`[field]`) — it is a `ControlValueAccessor`. In `range` mode the model is a
 * two-item array, otherwise a single number.
 */
@Component({
  selector: 'ui-slider',
  standalone: true,
  templateUrl: './ui-slider.html',
  styleUrl: './ui-slider.scss',
  // The host fills its container in horizontal mode (a slider has no intrinsic
  // width) and hugs its content in vertical mode (it manages its own height).
  host: {
    '[style.display]': "orientation() === 'vertical' ? 'inline-block' : 'block'",
    '[style.width]': "orientation() === 'vertical' ? null : '100%'",
  },
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiSlider), multi: true },
  ],
})
export class UiSlider extends BaseControlValueAccessor<SliderValue> {
  /** Minimum boundary value. */
  min = input(0, { transform: numberAttribute });
  /** Maximum boundary value. */
  max = input(100, { transform: numberAttribute });
  /** Increment/decrement granularity (drag snapping + keyboard step). */
  step = input(1, { transform: numberAttribute });
  /** Two handles selecting a `[start, end]` range (the model becomes an array). */
  range = input(false, { transform: booleanAttribute });
  /** Minimum number of steps kept between the two handles (range mode only). */
  minStepsBetweenHandles = input(0, { transform: numberAttribute });
  /** Renders a tick for every step along the track. */
  marks = input(false, { transform: booleanAttribute });
  /** Orientation of the slider (drives the arrow keys and layout). */
  orientation = input<SliderOrientation>('horizontal');
  /** Disables the control (no pointer nor keyboard interaction). */
  disabled = input(false, { transform: booleanAttribute });
  /** Focusable but not modifiable. */
  readonly = input(false, { transform: booleanAttribute });
  /** Required marker for the attached form control (native validation). */
  required = input(false, { transform: booleanAttribute });
  /** Forces the error styling (automatic when the attached control is invalid and touched/dirty). */
  invalid = input(false, { transform: booleanAttribute });
  /** name forwarded for form semantics. */
  name = input<string>();
  /** Accessible name applied to the handle(s). */
  ariaLabel = input<string>();
  /** id of an external element that labels the handle(s). */
  ariaLabelledBy = input<string>();
  /** id applied to the first handle (auto-generated when omitted). */
  inputId = input<string>();
  /** tabindex forwarded to the handle(s). */
  tabindex = input<number>();

  /** Emitted continuously while the value changes (drag, keyboard, track click). */
  sliderChange = output<SliderValue>();
  /** Emitted once a drag (or track click) completes — mirrors PrimeNG `onSlideEnd`. */
  slideEnd = output<SliderValue>();
  /** Emitted when a handle receives focus. */
  sliderFocus = output<FocusEvent>();
  /** Emitted when a handle loses focus. */
  sliderBlur = output<FocusEvent>();

  /** @ignore Positioned root: the pointer target and % reference for handles. */
  private readonly root = viewChild.required<ElementRef<HTMLElement>>('root');
  /** @ignore The handle elements (one, or two in range mode). */
  private readonly handleEls = viewChildren<ElementRef<HTMLElement>>('handle');

  /** @ignore Current model value (written by the form or by user interaction). */
  private readonly modelValue = signal<SliderValue>(0);
  /** @ignore Index of the handle currently being dragged (null when idle). */
  private readonly activeHandle = signal<number | null>(null);
  /** @ignore */
  private readonly uid = `ui-slider-${nextUid++}`;

  constructor() {
    super();
    // A11y safeguard: a slider needs an accessible name.
    if (isDevMode()) {
      effect(() => {
        if (!this.ariaLabel() && !this.ariaLabelledBy()) {
          console.warn(
            '[ui-slider] Aucun nom accessible : renseignez `ariaLabel` (ou `ariaLabelledBy`).',
          );
        }
      });
    }
  }

  /** @ignore Input disabled OR control disabled (form API). */
  protected readonly isDisabled = computed(() => this.disabled() || this.controlDisabled());
  /** @ignore Explicit `invalid` input OR invalid control worth surfacing. */
  protected readonly isInvalid = computed(() => this.invalid() || this.showError());
  /** @ignore */
  protected readonly resolvedId = computed(() => this.inputId() ?? this.uid);

  /** @ignore Normalized `[start, end]` values (range mode). */
  private readonly rangeValues = computed<[number, number]>(() => {
    const v = this.modelValue();
    if (Array.isArray(v)) return [v[0] ?? this.min(), v[1] ?? this.max()];
    return [this.min(), this.max()];
  });

  /** @ignore Normalized single value (non-range mode). */
  private readonly singleValue = computed<number>(() => {
    const v = this.modelValue();
    if (typeof v === 'number') return v;
    return Array.isArray(v) ? (v[0] ?? this.min()) : this.min();
  });

  /** @ignore Handles projected to the view (value + position). */
  protected readonly handles = computed<SliderHandle[]>(() => {
    if (this.range()) {
      const [a, b] = this.rangeValues();
      return [
        { index: 0, value: a, percent: this.toPercent(a) },
        { index: 1, value: b, percent: this.toPercent(b) },
      ];
    }
    const v = this.singleValue();
    return [{ index: 0, value: v, percent: this.toPercent(v) }];
  });

  /** @ignore Filled portion of the track (offset % + length %). */
  protected readonly fill = computed(() => {
    if (this.range()) {
      const [a, b] = this.handles().map((h) => h.percent);
      return { start: Math.min(a, b), size: Math.abs(b - a) };
    }
    return { start: 0, size: this.handles()[0].percent };
  });

  /** @ignore Step ticks (only when `marks`, capped to keep the DOM sane). */
  protected readonly markList = computed<SliderMark[]>(() => {
    if (!this.marks()) return [];
    const step = this.stepSize();
    const min = this.min();
    const max = this.max();
    const count = Math.floor((max - min) / step);
    if (count < 1 || count > 100) return [];
    const [lo, hi] = this.range() ? this.rangeValues() : [min, this.singleValue()];
    return Array.from({ length: count + 1 }, (_, i) => {
      const value = this.round(min + i * step);
      return { value, percent: this.toPercent(value), active: value >= lo && value <= hi };
    });
  });

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-slider'];
    if (this.orientation() === 'vertical') c.push('_vertical');
    if (this.range()) c.push('_range');
    if (this.isDisabled()) c.push('_disabled');
    if (this.readonly()) c.push('_readonly');
    if (this.isInvalid()) c.push('_invalid');
    return c.join(' ');
  });

  writeValue(value: SliderValue): void {
    if (this.range()) {
      this.modelValue.set(Array.isArray(value) ? value : [this.min(), this.max()]);
    } else {
      this.modelValue.set(typeof value === 'number' ? value : this.min());
    }
  }

  /** Focus the first handle programmatically. */
  focus(options?: FocusOptions): void {
    this.handleEls()[0]?.nativeElement.focus(options);
  }

  // --- Pointer interaction (mouse / touch / pen) -----------------------

  /** @ignore Start dragging: pick the closest handle, capture the pointer, seed the value. */
  protected onPointerDown(event: PointerEvent): void {
    if (this.isDisabled() || this.readonly()) return;
    const value = this.valueFromPointer(event);
    const index = this.range() ? this.nearestHandle(value) : 0;
    this.activeHandle.set(index);
    this.root().nativeElement.setPointerCapture(event.pointerId);
    this.updateValue(index, value);
    this.handleEls()[index]?.nativeElement.focus();
    event.preventDefault();
  }

  /** @ignore */
  protected onPointerMove(event: PointerEvent): void {
    const index = this.activeHandle();
    if (index === null) return;
    this.updateValue(index, this.valueFromPointer(event));
  }

  /** @ignore End of drag: release capture and fire `slideEnd`. */
  protected onPointerUp(event: PointerEvent): void {
    if (this.activeHandle() === null) return;
    this.activeHandle.set(null);
    this.root().nativeElement.releasePointerCapture?.(event.pointerId);
    this.slideEnd.emit(this.modelValue());
  }

  // --- Keyboard --------------------------------------------------------

  /** @ignore Arrow / Page / Home / End move the focused handle. */
  protected onKeyDown(event: KeyboardEvent, index: number): void {
    if (this.isDisabled() || this.readonly()) return;
    const step = this.stepSize();
    const current = this.range() ? this.rangeValues()[index] : this.singleValue();
    let next: number;
    switch (event.key) {
      case 'ArrowLeft':
      case 'ArrowDown':
        next = current - step;
        break;
      case 'ArrowRight':
      case 'ArrowUp':
        next = current + step;
        break;
      case 'PageDown':
        next = current - step * 10;
        break;
      case 'PageUp':
        next = current + step * 10;
        break;
      case 'Home':
        next = this.min();
        break;
      case 'End':
        next = this.max();
        break;
      default:
        return;
    }
    event.preventDefault();
    this.updateValue(index, next);
  }

  /** @ignore */
  protected onFocus(event: FocusEvent): void {
    this.sliderFocus.emit(event);
  }

  /** @ignore */
  protected onBlur(event: FocusEvent): void {
    this.emitTouch();
    this.sliderBlur.emit(event);
  }

  // --- Value helpers ---------------------------------------------------

  /** @ignore Effective step (never 0). */
  private stepSize(): number {
    const s = this.step();
    return s > 0 ? s : 1;
  }

  /** @ignore Value → track position as a 0–100% ratio. */
  private toPercent(value: number): number {
    const min = this.min();
    const span = this.max() - min;
    if (span <= 0) return 0;
    return Math.min(100, Math.max(0, ((value - min) / span) * 100));
  }

  /** @ignore Pointer coordinate → raw value in [min, max]. */
  private valueFromPointer(event: PointerEvent): number {
    const rect = this.root().nativeElement.getBoundingClientRect();
    const ratio =
      this.orientation() === 'horizontal'
        ? (event.clientX - rect.left) / rect.width
        : (rect.bottom - event.clientY) / rect.height;
    const clamped = Math.min(1, Math.max(0, ratio));
    return this.min() + clamped * (this.max() - this.min());
  }

  /** @ignore Closest handle to a value (range mode). */
  private nearestHandle(value: number): number {
    const [a, b] = this.rangeValues();
    return Math.abs(value - a) <= Math.abs(value - b) ? 0 : 1;
  }

  /** @ignore Snap to the step grid, relative to `min`. */
  private snap(value: number): number {
    const step = this.stepSize();
    const min = this.min();
    return this.round(min + Math.round((value - min) / step) * step);
  }

  /** @ignore Round to the step's decimal precision (avoids float drift). */
  private round(value: number): number {
    const step = this.stepSize();
    const decimals = Number.isInteger(step) ? 0 : (step.toString().split('.')[1]?.length ?? 0);
    return decimals > 0 ? +value.toFixed(decimals) : Math.round(value);
  }

  /** @ignore Clamp to [min, max]. */
  private clamp(value: number): number {
    return Math.min(this.max(), Math.max(this.min(), value));
  }

  /** @ignore Snap + clamp + range-gap enforcement, then commit if changed. */
  private updateValue(index: number, raw: number): void {
    if (this.isDisabled() || this.readonly()) return;
    let value = this.clamp(this.snap(raw));

    if (this.range()) {
      const values = [...this.rangeValues()] as [number, number];
      const gap = this.minStepsBetweenHandles() * this.stepSize();
      if (index === 0) value = Math.min(value, values[1] - gap);
      else value = Math.max(value, values[0] + gap);
      value = this.clamp(value);
      if (values[index] === value) return;
      values[index] = value;
      this.commit(values);
    } else {
      if (this.singleValue() === value) return;
      this.commit(value);
    }
  }

  /** @ignore Update the model + propagate to the form and the output. */
  private commit(value: SliderValue): void {
    this.modelValue.set(value);
    this.emitChange(value);
    this.sliderChange.emit(value);
  }
}
