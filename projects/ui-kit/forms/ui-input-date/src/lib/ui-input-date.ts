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
  TemplateRef,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import {
  BaseFormField,
  parseIsoDate,
  parseIsoDateTime,
  parseIsoTime,
  startOfDay,
  toIsoDate,
  toIsoDateTime,
  toIsoTime,
} from '@4sh/ui-kit/forms';
import { UiField } from '@4sh/ui-kit/forms/ui-field';
import type { UiInputIconContext } from '@4sh/ui-kit/forms/ui-input';
import { UiIcon, type UiIconSize } from '@4sh/ui-kit/base/ui-icon';

/** Granularity of the field — picks which native control the browser renders. */
export type InputDateMode = 'date' | 'time' | 'datetime';

/**
 * Shape of the emitted value. **Identical to `ui-datepicker`'s**, so a host can swap one for
 * the other (native picker on mobile, overlay on desktop) without converting anything.
 */
export type InputDateValueType = 'date' | 'iso';

/** Value carried by the field, whichever `valueType` is in force. */
export type InputDateValue = Date | string | null;

/** `mode` → the native `type` that draws the OS picker. */
const NATIVE_TYPE: Record<InputDateMode, string> = {
  date: 'date',
  time: 'time',
  datetime: 'datetime-local',
};

/**
 * ui-input-date — **native** date/time field on the `ui-field` shell (label + box + helper).
 *
 * The picker belongs to the OS: the system wheel on mobile — which no overlay matches —
 * and the browser's own calendar on desktop. That is the whole reason this component
 * exists next to [`ui-datepicker`](../ui-datepicker), which owns the opposite trade: a
 * calendar carried by the design system, with ranges, multi-month and inline modes.
 *
 * It is a sibling of `ui-input`, not a variant of it: three things a text field cannot do
 * are settled here.
 *
 * 1. **The value is a date, not a string.** `valueType` commits to `Date` or to an ISO
 *    string, exactly as `ui-datepicker` does — that alignment is what lets a host branch
 *    between the two on viewport without converting anything.
 * 2. **It emits on `change`, never on `input`.** A native temporal control blanks its own
 *    value while the entry is incomplete, so an `input`-driven field fires a burst of
 *    empty values as the user types — indistinguishable from clearing the field, and quite
 *    visible on an autosave or a dependent control.
 * 3. **The label stays raised.** The browser draws its own `jj/mm/aaaa` template in the
 *    box, so a floating label at rest would land on top of it.
 *
 * No `placeholder`: the browser ignores it on these types, that template holding the spot.
 *
 * Standalone, `[(ngModel)]` or reactive forms (ControlValueAccessor via BaseFormField).
 */
@Component({
  selector: 'ui-input-date',
  imports: [UiField, UiIcon, NgTemplateOutlet],
  templateUrl: './ui-input-date.html',
  styleUrl: './ui-input-date.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiInputDate), multi: true },
  ],
})
export class UiInputDate extends BaseFormField<InputDateValue> {
  /** Granularity: a day, a time of day, or both. */
  mode = input<InputDateMode>('date');
  /**
   * Shape of the emitted value: `'date'` (a plain `Date`) or `'iso'` (`yyyy-MM-dd`, or
   * `yyyy-MM-ddTHH:mm` as soon as a time is part of it). Incoming values are accepted in
   * **either** shape whatever this says — only the emitted side commits.
   */
  valueType = input<InputDateValueType>('date');
  /** Earliest accepted value, as a `Date` or in the ISO shape of the current `mode`. */
  min = input<Date | string>();
  /** Latest accepted value, same two shapes as {@link min}. */
  max = input<Date | string>();
  /**
   * Native `step`: days on `date`, **seconds** on `time` / `datetime` (`900` = quarters of
   * an hour; the browser's own default is `60`, i.e. whole minutes).
   */
  step = input<number, unknown>(undefined, { transform: numberAttribute });

  icon = input<string>();
  showIcon = input(true, { transform: booleanAttribute });
  /** Accessible name of the picker button. Defaults per {@link mode}. */
  iconAriaLabel = input<string>();
  /** Custom icon, as an input: same context as `ui-input`'s / `ui-datepicker`'s. */
  iconTemplate = input<TemplateRef<UiInputIconContext>>();

  /** Emitted when the browser commits a value — never mid-entry. */
  valueChange = output<InputDateValue>();
  /** Emitted when the field receives focus. */
  inputFocus = output<FocusEvent>();
  /** Emitted when the field loses focus. */
  inputBlur = output<FocusEvent>();

  /** Custom icon: `<ng-template #icon let-name let-size="size">`. */
  private readonly iconTemplateContent = contentChild<TemplateRef<UiInputIconContext>>('icon');

  /** @ignore */
  private readonly inputEl = viewChild.required<ElementRef<HTMLInputElement>>('inputEl');

  /** @ignore Icon size aligned with the field size, same pairing as `ui-input`. */
  protected readonly iconSize = computed<UiIconSize>(() => (this.size() === 'small' ? 'sm' : 'md'));
  /** @ignore Calendar, or clock when the field only carries a time. */
  protected readonly resolvedIcon = computed(
    () => this.icon() ?? (this.mode() === 'time' ? 'clock' : 'calendar'),
  );
  /** @ignore */
  protected readonly resolvedIconAriaLabel = computed(
    () =>
      this.iconAriaLabel() ??
      (this.mode() === 'time' ? "Ouvrir le sélecteur d'heure" : 'Ouvrir le calendrier'),
  );
  /** @ignore Input wins over the projected `#icon` template. */
  protected readonly resolvedIconTemplate = computed(
    () => this.iconTemplate() ?? this.iconTemplateContent(),
  );
  /** @ignore */
  protected readonly iconContext = computed<UiInputIconContext>(() => ({
    $implicit: this.resolvedIcon(),
    size: this.iconSize(),
    disabled: this.isDisabled(),
  }));

  /** @ignore The native `type` the OS picker hangs off. */
  protected readonly nativeType = computed(() => NATIVE_TYPE[this.mode()]);
  /** @ignore Whether the value carries a time — decides both serializers. */
  private readonly hasTimeComponent = computed(() => this.mode() !== 'date');

  /** @ignore Model → the string the native control reads, `''` when there is no value. */
  protected readonly nativeValue = computed(() => {
    const date = this.parseValue(this.modelValue() ?? null);
    return date ? this.toNative(date) : '';
  });
  /** @ignore Bounds go through the same serializer as the value: a caller may hand a `Date`
   *  or an already-native string, the attribute only ever sees the latter. */
  protected readonly nativeMin = computed(() => this.toNativeBound(this.min()));
  /** @ignore */
  protected readonly nativeMax = computed(() => this.toNativeBound(this.max()));

  /** @ignore Full `aria-describedby`: the message id, only when a message is rendered. */
  protected readonly resolvedAriaDescribedBy = computed(() =>
    this.displayMessage() ? this.messageId() : null,
  );

  /** Focuses the field. */
  focus(options?: FocusOptions): void {
    this.inputEl().nativeElement.focus(options);
  }

  openPicker(): void {
    if (this.isDisabled() || this.readonly()) return;
    const el = this.inputEl().nativeElement;
    el.focus();
    try {
      el.showPicker();
    } catch {
      /* no picker to show */
    }
  }

  /** Native `<input>` element, for a composite host that needs direct DOM access. */
  nativeInputElement(): HTMLInputElement {
    return this.inputEl().nativeElement;
  }

  /** @ignore */
  protected override uidPrefix(): string {
    return 'ui-input-date';
  }

  /**
   * @ignore The browser committed a value — a complete one, or an empty one because the
   * field was cleared. This is the only place a value leaves the component: `input` fires
   * on every keystroke with the blanks in between, and is deliberately not listened to.
   */
  protected onNativeChange(): void {
    const raw = this.inputEl().nativeElement.value;
    const date = raw ? this.fromNative(raw) : null;
    const value = date ? this.serializeValue(date) : null;
    this.modelValue.set(value);
    this.emitChange(value);
    this.valueChange.emit(value);
  }

  /** @ignore */
  protected onBlur(event: FocusEvent): void {
    this.emitTouch();
    this.inputBlur.emit(event);
  }

  /** @ignore Internal `Date` → the shape `valueType` commits to. Mirrors `ui-datepicker`'s
   *  own `serializeValue`, down to the fresh instance: the caller never gets a reference it
   *  could mutate behind our back. */
  private serializeValue(date: Date): InputDateValue {
    if (this.valueType() === 'iso') return this.toNative(date);
    return this.hasTimeComponent() ? new Date(date) : startOfDay(date);
  }

  /** @ignore Incoming value, `Date` or ISO string, auto-detected — cloned when already a
   *  `Date`, symmetric with {@link serializeValue}. */
  private parseValue(value: InputDateValue | undefined): Date | null {
    if (value === undefined || value === null || value === '') return null;
    return value instanceof Date ? new Date(value) : this.fromNative(value);
  }

  /** @ignore `Date` → the exact string the native control of this `mode` accepts. */
  private toNative(date: Date): string {
    if (this.mode() === 'time') return toIsoTime(date);
    return this.hasTimeComponent() ? toIsoDateTime(date) : toIsoDate(date);
  }

  /** @ignore The reverse. `null` on anything malformed — a bad value degrades to "no value"
   *  rather than throwing, the browser being the one that produced it. */
  private fromNative(value: string): Date | null {
    if (this.mode() === 'time') return parseIsoTime(value);
    return this.hasTimeComponent() ? parseIsoDateTime(value) : parseIsoDate(value);
  }

  /** @ignore A bound is optional, and a string one is already native. */
  private toNativeBound(bound: Date | string | undefined): string | null {
    if (!bound) return null;
    return bound instanceof Date ? this.toNative(bound) : bound;
  }
}
