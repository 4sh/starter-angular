import {
  booleanAttribute,
  Component,
  computed,
  ElementRef,
  forwardRef,
  input,
  output,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseControlValueAccessor } from '@app/core/controlValueAccessor/BaseControlValueAccessor';

export type ToggleSize = 'default' | 'small';
export type ToggleLabelPosition = 'before' | 'after';
export interface ToggleHandleContext {
  checked: boolean;
}

let nextUid = 0;

/**
 * ui-toggle — headless switch built on a real native `<input type="checkbox" role="switch">`.
 *
 * The native input stays in the DOM (invisible, covering the track) so keyboard,
 * screen readers, label click and form semantics come for free. `role="switch"`
 * + `aria-checked` make assistive tech announce it as on/off. Interactive states
 * (hover/focus/disabled/checked) are pure CSS driven by `form.*` design tokens.
 *
 * Works standalone, with `[(ngModel)]` or reactive forms (ControlValueAccessor).
 * By default the model value is boolean; `trueValue`/`falseValue` let the model
 * carry any pair of values (e.g. 'on'/'off', 1/0).
 */
@Component({
  selector: 'ui-toggle',
  imports: [NgTemplateOutlet],
  templateUrl: './ui-toggle.html',
  styleUrl: './ui-toggle.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiToggle), multi: true }],
})
export class UiToggle<T = boolean> extends BaseControlValueAccessor<T> {
  /** Label displayed next to the switch (clicking it toggles the switch). */
  label = input<string>();
  /** Side of the switch the label sits on (both sides are clickable). */
  labelPosition = input<ToggleLabelPosition>('after');
  /** Accessible name when no visible label is provided. */
  ariaLabel = input<string>();
  /** id of an external element that labels this switch. */
  ariaLabelledBy = input<string>();
  /** id forwarded to the native input (auto-generated when omitted). */
  inputId = input<string>();
  /** name forwarded to the native input. */
  name = input<string>();
  /** Size. */
  size = input<ToggleSize>('default');
  /** Model value emitted when on. */
  trueValue = input<T>(true as T);
  /** Model value emitted when off. */
  falseValue = input<T>(false as T);
  /** Required marker on the label + native required attribute. */
  required = input(false, { transform: booleanAttribute });
  /** Disables the switch (native attribute). */
  disabled = input(false, { transform: booleanAttribute });
  /** Focusable but not editable. */
  readonly = input(false, { transform: booleanAttribute });
  /** Forces the error styling (automatic when the attached control is invalid and touched/dirty). */
  invalid = input(false, { transform: booleanAttribute });
  /** tabindex forwarded to the native input. */
  tabindex = input<number>();
  /**
   * Custom handle (thumb) template. Receives a `{ checked }` context, so the
   * rendered content can react to the on/off state (e.g. a check / times icon).
   */
  handle = input<TemplateRef<ToggleHandleContext>>();

  /** Emitted on user toggle with the new model value (never when disabled/readonly). */
  toggleChange = output<T>();
  /** Emitted when the native input receives focus. */
  toggleFocus = output<FocusEvent>();
  /** Emitted when the native input loses focus. */
  toggleBlur = output<FocusEvent>();

  /** @ignore */
  private readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>('inputEl');
  /** @ignore Current model value (written by the form or by user toggles). */
  private readonly modelValue = signal<T | undefined>(undefined);
  /** @ignore */
  private readonly uid = `ui-toggle-${nextUid++}`;

  constructor() {
    super();
  }

  /** @ignore */
  protected readonly checked = computed(() => this.modelValue() === this.trueValue());
  /** @ignore A visible label is provided. */
  protected readonly hasLabel = computed(() => !!this.label());
  /** @ignore Context handed to the custom handle template. */
  protected readonly handleContext = computed<ToggleHandleContext>(() => ({ checked: this.checked() }));
  /** @ignore Input disabled OR control disabled (form API). */
  protected readonly isDisabled = computed(() => this.disabled() || this.controlDisabled());
  /** @ignore Explicit `invalid` input OR invalid control worth surfacing. */
  protected readonly isInvalid = computed(() => this.invalid() || this.showError());
  /** @ignore */
  protected readonly resolvedId = computed(() => this.inputId() ?? this.uid);

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-toggle'];
    if (this.size() !== 'default') c.push(`_${this.size()}`);
    if (this.checked()) c.push('_checked');
    if (this.isDisabled()) c.push('_disabled');
    if (this.readonly()) c.push('_readonly');
    if (this.isInvalid()) c.push('_invalid');
    return c.join(' ');
  });

  writeValue(value: T): void {
    this.modelValue.set(value);
  }

  /** Focus the native input programmatically. */
  focus(options?: FocusOptions): void {
    this.inputEl().nativeElement.focus(options);
  }

  /** @ignore Native change: single source of truth for user toggles. */
  protected onNativeChange(): void {
    const inputEl = this.inputEl().nativeElement;
    if (this.readonly()) {
      inputEl.checked = this.checked(); // revert the native toggle
      return;
    }
    const value = inputEl.checked ? this.trueValue() : this.falseValue();
    this.modelValue.set(value);
    this.emitChange(value);
    this.toggleChange.emit(value);
  }

  /** @ignore */
  protected onBlur(event: FocusEvent): void {
    this.emitTouch();
    this.toggleBlur.emit(event);
  }
}
