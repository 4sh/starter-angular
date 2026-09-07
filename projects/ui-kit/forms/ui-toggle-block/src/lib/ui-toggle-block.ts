import {
  afterNextRender,
  booleanAttribute,
  Component,
  computed,
  effect,
  ElementRef,
  forwardRef,
  input,
  output,
  signal,
  viewChild,
} from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseFieldControl, warnMissingAccessibleName } from '@4sh/ui-kit/forms';
import { UiCheckbox } from '@4sh/ui-kit/forms/ui-checkbox';
import { UiRadio } from '@4sh/ui-kit/forms/ui-radio';
import { UiToggle } from '@4sh/ui-kit/forms/ui-toggle';

/** Selection control embedded in the block. */
export type ToggleBlockIndicator = 'checkbox' | 'radio' | 'toggle';
export type ToggleBlockSize = 'default' | 'small' | 'large';
export type ToggleBlockIndicatorPosition = 'start' | 'end';
/** Vertical alignment of the indicator against the block content. */
export type ToggleBlockAlign = 'center' | 'start';

/** @ignore Surface the three indicator components share. */
interface IndicatorControl<T> {
  writeValue(value: T): void;
  focus(options?: FocusOptions): void;
}

/**
 * ui-toggle-block: selectable block wrapping a checkbox, a radio or a switch.
 *
 * The block is the clickable surface; the selection control is an instance of
 * `ui-checkbox` / `ui-radio` / `ui-toggle`, so the indicator keeps the exact
 * appearance and behaviour it has on its own. A stretched `<label for>` covers
 * the block, which makes the whole surface activate the native input without a
 * click handler; the content region is the control's accessible name
 * (`aria-labelledby`), so any markup can be projected without wrapping it in a
 * `<label>`.
 *
 * `label` / `description` cover the common case; `<ng-content>` composes with
 * them for a fully custom body.
 *
 * Works standalone, with `[(ngModel)]`, reactive forms or Signal Forms
 * (ControlValueAccessor). Blocks form a group the native way: same `name`, same
 * bound model.
 */
@Component({
  selector: 'ui-toggle-block',
  imports: [UiCheckbox, UiRadio, UiToggle],
  templateUrl: './ui-toggle-block.html',
  styleUrl: './ui-toggle-block.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiToggleBlock), multi: true },
  ],
  host: {
    '[class._fluid]': 'fluid()',
    '(keydown)': 'onKeydown($event)',
  },
})
export class UiToggleBlock<T = boolean> extends BaseFieldControl<T> {
  /** Selection control embedded in the block. */
  indicator = input<ToggleBlockIndicator>('checkbox');
  /** Side of the block the indicator sits on. */
  indicatorPosition = input<ToggleBlockIndicatorPosition>('start');
  /** Vertical alignment of the indicator against the content. */
  align = input<ToggleBlockAlign>('center');
  /** Keeps the control operable but removes the indicator from view (selection card). */
  hideIndicator = input(false, { transform: booleanAttribute });
  /** Size. */
  size = input<ToggleBlockSize>('default');
  /** Main line of the block. */
  label = input<string>();
  /** Secondary line under the label. */
  description = input<string>();
  /** Span the full width of the parent (a flex/grid parent otherwise sizes the block to its content). */
  fluid = input(false, { transform: booleanAttribute });
  /** Ripple Effect */
  ripple = input(true, { transform: booleanAttribute });
  /** Value carried by this block in `radio` mode (the model takes it when selected). */
  value = input<T>();
  /** Model value emitted when selected, in `checkbox` / `toggle` mode. */
  trueValue = input<T>(true as T);
  /** Model value emitted when cleared, in `checkbox` / `toggle` mode. */
  falseValue = input<T>(false as T);

  /** Emitted on user selection with the new model value (never when disabled/readonly). */
  blockChange = output<T>();
  /** Emitted when the embedded control receives focus. */
  blockFocus = output<FocusEvent>();
  /** Emitted when the embedded control loses focus. */
  blockBlur = output<FocusEvent>();

  /** @ignore */
  private readonly checkboxRef = viewChild<UiCheckbox<T>>(UiCheckbox);
  /** @ignore */
  private readonly radioRef = viewChild<UiRadio<T>>(UiRadio);
  /** @ignore */
  private readonly toggleRef = viewChild<UiToggle<T>>(UiToggle);
  /** @ignore */
  private readonly bodyEl = viewChild.required<ElementRef<HTMLElement>>('bodyEl');

  /** @ignore Keyboard focus only: a pointer press must not ring the block. */
  private readonly focusVisible = signal(false);

  constructor() {
    super();
    // The embedded control owns its own state: push the model into it.
    effect(() => this.control()?.writeValue(this.modelValue() as T));

    afterNextRender(() => {
      if (this.indicator() === 'radio' && this.value() === undefined) {
        warnMissingAccessibleName(
          'ui-toggle-block',
          'indicator="radio" requires a `value`: without it every block of the group shares the same identity.',
        );
      }
      if (!this.hasAccessibleName()) {
        warnMissingAccessibleName(
          'ui-toggle-block',
          'no accessible name: provide `label`, projected content, `ariaLabel` or `ariaLabelledBy`.',
        );
      }
    });
  }

  /** @ignore The embedded control, whichever indicator is rendered. */
  private readonly control = computed<IndicatorControl<T> | undefined>(
    () => this.checkboxRef() ?? this.radioRef() ?? this.toggleRef(),
  );

  /** @ignore Value this block selects (radio carries its own, the others the `trueValue`). */
  protected readonly selectedValue = computed(() =>
    this.indicator() === 'radio' ? (this.value() as T) : this.trueValue(),
  );

  /** @ignore */
  protected readonly checked = computed(() => this.modelValue() === this.selectedValue());

  /** @ignore Id of the region naming the control. */
  protected readonly bodyId = computed(() => `${this.resolvedId()}-body`);
  /**
   * @ignore The block content names the control, unless an explicit name is given
   * (`aria-labelledby` outranks `aria-label`, so the two are mutually exclusive).
   */
  protected readonly controlLabelledBy = computed(() =>
    this.ariaLabelledBy() ? this.ariaLabelledBy() : this.ariaLabel() ? undefined : this.bodyId(),
  );

  /** @ignore The switch follows the block density; the box controls keep the form-wide size. */
  protected readonly toggleSize = computed(() => (this.size() === 'small' ? 'small' : 'default'));

  /**
   * @ignore The wave is carried by the block, not by a native control, so the
   * engine's own `disabled` guard never sees it: fold the inert states in here.
   */
  protected readonly rippleEnabled = computed(
    () => this.ripple() && !this.isDisabled() && !this.readonly(),
  );

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-toggle-block'];
    if (this.size() !== 'default') c.push(`_${this.size()}`);
    if (this.indicatorPosition() === 'end') c.push('_indicator-end');
    if (this.align() === 'start') c.push('_align-start');
    if (this.hideIndicator()) c.push('_hide-indicator');
    if (this.checked()) c.push('_checked');
    if (this.isDisabled()) c.push('_disabled');
    if (this.readonly()) c.push('_readonly');
    if (this.isInvalid()) c.push('_invalid');
    if (this.focusVisible()) c.push('_focus-visible');
    return c.join(' ');
  });

  /** @ignore */
  protected override uidPrefix(): string {
    return 'ui-toggle-block';
  }

  /** Focus the embedded control programmatically. */
  focus(options?: FocusOptions): void {
    this.control()?.focus(options);
  }

  /** @ignore A name reaches assistive tech (explicit, or rendered in the body). */
  private hasAccessibleName(): boolean {
    if (this.ariaLabel() || this.ariaLabelledBy() || this.label()) return true;
    return !!this.bodyEl().nativeElement.textContent?.trim();
  }

  /** @ignore User selection, relayed by whichever indicator is rendered. */
  protected onControlChange(value: T): void {
    if (this.readonly()) {
      this.control()?.writeValue(this.modelValue() as T);
      return;
    }
    this.modelValue.set(value);
    this.emitChange(value);
    this.blockChange.emit(value);
  }

  /** @ignore */
  protected onControlFocus(event: FocusEvent): void {
    this.focusVisible.set((event.target as HTMLElement).matches(':focus-visible'));
    this.blockFocus.emit(event);
  }

  /** @ignore */
  protected onControlBlur(event: FocusEvent): void {
    this.focusVisible.set(false);
    this.emitTouch();
    this.blockBlur.emit(event);
  }

  /**
   * @ignore Read-only blocks stay focusable but must not change value. Pointer
   * activation is already cut off in CSS; this covers the keyboard.
   */
  protected onKeydown(event: KeyboardEvent): void {
    if (!this.readonly()) return;
    if (event.key === ' ' || event.key.startsWith('Arrow')) event.preventDefault();
  }
}
