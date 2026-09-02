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
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseFieldControl, warnMissingAccessibleName } from '@4sh/ui-kit/forms';

export type UiKnobSize = 'small' | 'default' | 'large';

// --- Dial geometry (viewBox 0 0 100 100) -------------------------------
// A 300° arc opening at the bottom: min at 240°, max at -60°. Everything is
// expressed in viewBox units, so the drawing scales with the rendered diameter.
const CENTER = 50;
const MIN_RADIANS = (4 * Math.PI) / 3;
const MAX_RADIANS = -Math.PI / 3;
/** Bottom gap, where a pointer angle maps to no value. */
const GAP_START = -(2 * Math.PI) / 3;
/** Breathing room kept between the arc and the focus ring drawn on the box edge. */
const RING_GAP = 3;

const round = (n: number): number => Number(n.toFixed(3));

/**
 * Centreline radius for a given thickness: the arc, caps included, always fits
 * its box, so a thick stroke never spills over the focus ring.
 */
function dialRadius(strokeWidth: number): number {
  return Math.max(2, CENTER - strokeWidth / 2 - RING_GAP);
}

/** Point on the dial for an angle, in viewBox coordinates (y grows downwards). */
function polar(radians: number, radius: number): { x: number; y: number } {
  return {
    x: round(CENTER + Math.cos(radians) * radius),
    y: round(CENTER - Math.sin(radians) * radius),
  };
}

function mapRange(x: number, inMin: number, inMax: number, outMin: number, outMax: number): number {
  if (inMax === inMin) return outMin;
  return ((x - inMin) * (outMax - outMin)) / (inMax - inMin) + outMin;
}

/**
 * ui-knob — headless circular dial to pick a numeric value.
 *
 * Follows the WAI-ARIA slider pattern: the dial is a single `role="slider"`
 * stop exposing `aria-valuemin/max/now`, driven at the keyboard (arrows,
 * Page Up/Down, Home/End) and by pointer (mouse, touch, pen) through one code
 * path. The drawing is an SVG arc in a 100×100 viewBox, so it scales with the
 * rendered diameter; every colour comes from the design tokens and can be
 * repainted per instance.
 *
 * Works standalone, with `[(ngModel)]`, Reactive Forms or Signal Forms
 * (`[formField]`) — it is a `ControlValueAccessor`.
 */
@Component({
  selector: 'ui-knob',
  standalone: true,
  templateUrl: './ui-knob.html',
  styleUrl: './ui-knob.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiKnob), multi: true }],
})
export class UiKnob extends BaseFieldControl<number> {
  /** Minimum boundary value. */
  min = input(0, { transform: numberAttribute });
  /** Maximum boundary value. */
  max = input(100, { transform: numberAttribute });
  /** Increment/decrement granularity (drag snapping + keyboard step). */
  step = input(1, { transform: numberAttribute });
  /** Diameter preset (override any diameter with the `--ui-knob-size` hook). */
  size = input<UiKnobSize>('default');
  /** Arc thickness, in viewBox units (100 = the diameter), so it scales with the knob. */
  strokeWidth = input(14, { transform: numberAttribute });
  /** Renders the value at the centre of the dial. */
  showValue = input(true, { transform: booleanAttribute });
  /** Template of the centre label, `{value}` being the placeholder. */
  valueTemplate = input('{value}');
  /** Colour of the filled arc (any CSS colour). Sets `--ui-knob-value-color`. */
  valueColor = input<string>();
  /** Colour of the track behind it. Sets `--ui-knob-range-color`. */
  rangeColor = input<string>();
  /** Colour of the centre label. Sets `--ui-knob-text-color`. */
  textColor = input<string>();

  /** Emitted on every value change (drag, keyboard, click on the dial). */
  knobChange = output<number>();

  /** @ignore Pointer target, focus stop and % reference of the dial. */
  private readonly root = viewChild.required<ElementRef<HTMLElement>>('root');
  /** @ignore True while a drag is in progress. */
  private dragging = false;

  constructor() {
    super();
    if (isDevMode()) {
      effect(() => {
        if (!this.ariaLabel() && !this.ariaLabelledBy()) {
          warnMissingAccessibleName(
            'ui-knob',
            'No accessible name: provide `ariaLabel` (or `ariaLabelledBy`).',
          );
        }
      });
    }
  }

  /** @ignore Current value, clamped to the boundaries (falls back to `min`). */
  protected readonly currentValue = computed(() => {
    const value = this.modelValue();
    return this.clamp(typeof value === 'number' && !Number.isNaN(value) ? value : this.min());
  });

  /** @ignore Centre label, with `{value}` substituted. */
  protected readonly displayValue = computed(() =>
    this.valueTemplate().replace('{value}', String(this.currentValue())),
  );

  /** @ignore Announced only when the label differs from the raw value. */
  protected readonly ariaValueText = computed(() => {
    const label = this.displayValue();
    return label === String(this.currentValue()) ? null : label;
  });

  /** @ignore Radius of the arc centreline, inset so the stroke fits the box. */
  private readonly radius = computed(() => dialRadius(this.strokeWidth()));

  /** @ignore The full track. */
  protected readonly rangePath = computed(() => {
    const radius = this.radius();
    const from = polar(MIN_RADIANS, radius);
    const to = polar(MAX_RADIANS, radius);
    return `M ${from.x} ${from.y} A ${radius} ${radius} 0 1 1 ${to.x} ${to.y}`;
  });

  /** @ignore Arc drawn from the origin (0, or the nearest boundary) to the value. */
  protected readonly valuePath = computed(() => {
    const radius = this.radius();
    const from = polar(this.originRadians(), radius);
    const to = polar(this.valueRadians(), radius);
    const largeArc = Math.abs(this.originRadians() - this.valueRadians()) < Math.PI ? 0 : 1;
    const sweep = this.valueRadians() > this.originRadians() ? 0 : 1;
    return `M ${from.x} ${from.y} A ${radius} ${radius} 0 ${largeArc} ${sweep} ${to.x} ${to.y}`;
  });

  /** @ignore */
  protected readonly classes = computed(() => {
    const classes = ['ui-knob'];
    if (this.size() !== 'default') classes.push(`_${this.size()}`);
    if (this.isDisabled()) classes.push('_disabled');
    if (this.readonly()) classes.push('_readonly');
    if (this.isInvalid()) classes.push('_invalid');
    return classes.join(' ');
  });

  /** @ignore */
  protected override uidPrefix(): string {
    return 'ui-knob';
  }

  /** Focus the dial programmatically. */
  focus(options?: FocusOptions): void {
    this.root().nativeElement.focus(options);
  }

  // --- Pointer interaction (mouse / touch / pen) -----------------------

  /** @ignore */
  protected onPointerDown(event: PointerEvent): void {
    if (this.isDisabled() || this.readonly()) return;
    this.dragging = true;
    this.root().nativeElement.setPointerCapture(event.pointerId);
    this.updateFromPointer(event);
    // preventDefault kills the implicit focus, so take it explicitly.
    event.preventDefault();
    this.root().nativeElement.focus();
  }

  /** @ignore */
  protected onPointerMove(event: PointerEvent): void {
    if (!this.dragging) return;
    this.updateFromPointer(event);
  }

  /** @ignore */
  protected onPointerUp(event: PointerEvent): void {
    if (!this.dragging) return;
    this.dragging = false;
    this.root().nativeElement.releasePointerCapture?.(event.pointerId);
  }

  // --- Keyboard --------------------------------------------------------

  /** @ignore */
  protected onKeyDown(event: KeyboardEvent): void {
    if (this.isDisabled() || this.readonly()) return;
    const step = this.stepSize();
    const current = this.currentValue();
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
    this.commit(next);
  }

  /** @ignore */
  protected onBlur(): void {
    this.emitTouch();
  }

  // --- Value helpers ---------------------------------------------------

  /** @ignore Effective step (never 0). */
  private stepSize(): number {
    const step = this.step();
    return step > 0 ? step : 1;
  }

  /** @ignore Angle of the value on the dial. */
  private valueRadians(): number {
    return mapRange(this.currentValue(), this.min(), this.max(), MIN_RADIANS, MAX_RADIANS);
  }

  /** @ignore Angle the filled arc starts from: zero when it is inside the boundaries. */
  private originRadians(): number {
    const origin = Math.min(Math.max(0, this.min()), this.max());
    return mapRange(origin, this.min(), this.max(), MIN_RADIANS, MAX_RADIANS);
  }

  /** @ignore Pointer position → value, or `null` inside the bottom gap. */
  private updateFromPointer(event: PointerEvent): void {
    const rect = this.root().nativeElement.getBoundingClientRect();
    if (!rect.width || !rect.height) return;
    const dx = (event.clientX - rect.left) / rect.width - 0.5;
    const dy = 0.5 - (event.clientY - rect.top) / rect.height;
    const angle = Math.atan2(dy, dx);

    if (angle > MAX_RADIANS) {
      this.commit(mapRange(angle, MIN_RADIANS, MAX_RADIANS, this.min(), this.max()));
    } else if (angle <= GAP_START) {
      this.commit(mapRange(angle + 2 * Math.PI, MIN_RADIANS, MAX_RADIANS, this.min(), this.max()));
    }
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

  /** @ignore Snap to the step grid, clamp, then propagate if it moved. */
  private commit(raw: number): void {
    const step = this.stepSize();
    const min = this.min();
    const value = this.clamp(this.round(min + Math.round((raw - min) / step) * step));
    if (value === this.currentValue()) return;
    this.modelValue.set(value);
    this.emitChange(value);
    this.knobChange.emit(value);
  }
}
