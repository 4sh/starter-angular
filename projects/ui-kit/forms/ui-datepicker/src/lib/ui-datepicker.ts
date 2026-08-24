import {
  booleanAttribute,
  Component,
  computed,
  contentChild,
  effect,
  ElementRef,
  forwardRef,
  inject,
  input,
  linkedSignal,
  LOCALE_ID,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  untracked,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { OverlayModule } from '@angular/cdk/overlay';
import { dropdownOverlayPositions } from '@4sh/ui-kit/forms';
import { CdkTrapFocus } from '@angular/cdk/a11y';
import { BaseFormField } from '@4sh/ui-kit/forms';
import {
  autoFormatSegments,
  buildMaskSlots,
  caretForMask,
  extractMaskData,
  MaskBounds,
  MaskSlot,
} from '@4sh/ui-kit/forms';
import { UiInput, UiInputIconContext } from '@4sh/ui-kit/forms/ui-input';
import { UiButton } from '@4sh/ui-kit/actions/ui-button';
import { UiIcon } from '@4sh/ui-kit/base/ui-icon';
import { closeOnNavigation } from '@4sh/ui-kit/overlay';
import {
  addDays,
  addMonths,
  finalizeParsed,
  firstOfMonth,
  isSameDay,
  normalizeDateInput,
  parseIsoDate,
  parseIsoDateTime,
  startOfDay,
  toIsoDate,
  toIsoDateTime,
} from './date-utils';

export type DatepickerHourFormat = '12' | '24';
/** Base picking granularity — also the drill-down levels of the panel. */
export type DatepickerView = 'date' | 'month' | 'year';
/** Selection quantity. */
export type DatepickerSelectionMode = 'single' | 'multiple' | 'range';
/**
 * Shape of the value crossing the CVA boundary — see {@link DatepickerValue}. Mandatory
 * (`input.required`, no default): the consumer must pick one explicitly rather than accidentally
 * relying on a default that may not match its model's actual type.
 *
 * `'date'` matches a DTO round-tripped through `class-transformer` (`@Type(() => Date)`): the
 * value stays a plain `Date` end to end, normalized to midnight when no time is shown. `'iso'`
 * emits ISO `"yyyy-MM-dd"` strings instead — for consumers reading/writing the value directly
 * against a backend `LocalDate` without going through a DTO layer that already handles the
 * conversion.
 */
export type DatepickerValueType = 'date' | 'iso';
/**
 * Model value. `writeValue` accepts `Date` **or** ISO string transparently (auto-detected,
 * mixable in `multiple`/`range` arrays) — whatever the host app already has at hand. What gets
 * **emitted** (`valueChange`, `dateSelect`, and so whatever lands in the `FormControl`) strictly
 * follows {@link valueType}: always `Date` in `'date'` mode, always `string` in `'iso'` mode —
 * never a silent mix, so the consumer's own model type stays predictable in either mode.
 */
export type DatepickerValue = Date | Date[] | string | string[] | null;
/** @ignore Internal calendar representation — the only shape `selectedDates`/`buildDay`/grid
 *  navigation ever see. `writeValue`/`commit` are the sole two conversion points to/from
 *  {@link DatepickerValue} (`Date` or ISO string depending on {@link DatepickerValueType}). */
type DatepickerDateValue = Date | Date[] | null;

/** A single day cell of the month grid. Also the `$implicit` context of the `#date` template. */
export interface DatepickerDay {
  date: Date;
  day: number;
  month: number;
  year: number;
  otherMonth: boolean;
  today: boolean;
  selected: boolean;
  disabled: boolean;
  rangeStart: boolean;
  rangeEnd: boolean;
  inRange: boolean;
  ts: number;
  /** Full date, locale-formatted (e.g. "8 juillet 2026") — the gridcell's `aria-label`. */
  ariaLabel: string;
}

/** A month cell of the month-picker grid. */
export interface DatepickerMonthCell {
  index: number;
  label: string;
  selected: boolean;
  disabled: boolean;
}

/** A year cell of the year-picker grid. */
export interface DatepickerYearCell {
  year: number;
  selected: boolean;
  disabled: boolean;
}

/** One rendered month panel (supports `numberOfMonths`). */
export interface DatepickerMonthPanel {
  monthDate: Date;
  label: string;
  weeks: DatepickerDay[][];
  showPrev: boolean;
  showNext: boolean;
}

let nextPanelUid = 0;

/**
 * ui-datepicker — headless date / month / year (and optional time) picker.
 *
 * A readonly {@link UiInput} trigger opens a token-styled panel in a CDK overlay
 * (or renders inline). Supports single / multiple / range selection, drill-down
 * views (day → month → year), `MonthPicker`/`YearPicker` modes (`view`), several
 * months side-by-side (`numberOfMonths`), a time row, and roving keyboard focus.
 *
 * Value is `Date` or ISO `"yyyy-MM-dd"` string depending on the **required** `valueType` input (no
 * default — the consumer must pick one), wired through `ControlValueAccessor` on
 * {@link BaseFormField} (shared label / helper / level / validation / states). `writeValue`
 * accepts either shape transparently; what gets **emitted** always follows `valueType` — see
 * {@link DatepickerValueType}.
 *
 * Customisation: `panelStyleClass`, the `#date` cell template
 * (`let-date let-selected="selected"`) and the `#buttonbar` template
 * (`let-todayCallback let-clearCallback`), plus the local SCSS variables.
 */
@Component({
  selector: 'ui-datepicker',
  imports: [NgTemplateOutlet, OverlayModule, CdkTrapFocus, UiInput, UiButton, UiIcon],
  templateUrl: './ui-datepicker.html',
  styleUrl: './ui-datepicker.scss',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiDatepicker), multi: true },
  ],
})
export class UiDatepicker extends BaseFormField<DatepickerValue> {
  /** Placeholder shown in the trigger when nothing is selected. */
  placeholder = input<string>();
  /** FontAwesome icon of the trigger's toggle button. */
  icon = input<string>('calendar');
  /** Show the trigger's calendar toggle button. */
  showIcon = input(true, { transform: booleanAttribute });
  /** Accessible name of the toggle button (a11y). */
  iconAriaLabel = input<string>('Ouvrir le calendrier');
  /**
   * Show a clear (×) button in the trigger when a value is set. **Default `true`** (FSHSP-118):
   * only takes effect when `showIcon` is `false` — the calendar/clock toggle otherwise always
   * wins the trigger's single icon slot, so the panel stays reachable by click even once a value
   * is set. With `showIcon` at its own default (`true`), clearing goes through the keyboard
   * (`allowInput`, itself `true` by default) instead: select the text and delete it.
   */
  showClear = input(true, { transform: booleanAttribute });

  /**
   * Shape of the emitted value: `'date'` (a plain `Date` — matches a DTO round-tripped through
   * `class-transformer`) or `'iso'` (ISO `"yyyy-MM-dd"` string, for a value read/written directly
   * against a backend `LocalDate`). `writeValue` always accepts either shape regardless of this
   * setting — it only governs what `valueChange`/`dateSelect` emit. **Required, no default**: the
   * consumer must pick the one matching its own model's type rather than inherit a silent default.
   */
  valueType = input.required<DatepickerValueType>();
  /** Selection quantity: `single` (default), `multiple` or `range`. */
  selectionMode = input<DatepickerSelectionMode>('single');
  /** Base picking granularity: `date` (default), `month` (MonthPicker) or `year` (YearPicker). */
  view = input<DatepickerView>('date');
  /** Number of month panels shown side-by-side (date view only). */
  numberOfMonths = input<number, unknown>(1, { transform: numberAttribute });

  /** Earliest selectable date (inclusive). `Date` or ISO `"yyyy-MM-dd"`. */
  minDate = input<Date | string | null>(null);
  /** Latest selectable date (inclusive). `Date` or ISO `"yyyy-MM-dd"`. */
  maxDate = input<Date | string | null>(null);
  /** Individual dates to disable. `Date` or ISO `"yyyy-MM-dd"`, mixable. */
  disabledDates = input<(Date | string)[]>([]);
  /** Week days to disable (0 = Sunday … 6 = Saturday). */
  disabledDays = input<number[]>([]);

  /** First day of the week (0 = Sunday … 6 = Saturday). Defaults to Monday. */
  firstDayOfWeek = input<number, unknown>(1, { transform: numberAttribute });
  /** BCP-47 locale for names and default formatting. Defaults to `LOCALE_ID`. */
  locale = input<string>();
  /** Custom display formatter for a single date (overrides the default `Intl` format) — also
   *  used, unchanged, as the time formatter in `timeOnly` mode. */
  dateFormat = input<(date: Date) => string>();

  /**
   * Allow typing the date directly in the trigger (single selection only). **Default `true`**
   * (FSHSP-118): a calendar grid alone forces a screen-reader user through ~30 cells to pick a
   * date, when typing it is far faster — set `false` to force the grid-only path instead. The
   * typed text is parsed on blur / `Enter`; an unparsable value reverts to the previously
   * displayed one. When enabled (and no custom `dateFormat`), the value is displayed in a
   * numeric locale format so it round-trips with typing. Has no effect in `multiple`/`range`
   * (no parser defined yet for either) or `timeOnly` mode: the trigger stays read-only there.
   */
  allowInput = input(true, { transform: booleanAttribute });
  /**
   * Custom parser for the typed text (symmetric with `dateFormat`). Return `null`
   * to reject the input. When omitted, a locale-aware numeric parser is used.
   */
  parseDate = input<(value: string) => Date | null>();

  /** Enable the time selection row. */
  showTime = input(false, { transform: booleanAttribute });
  /** Time-only mode: hide the calendar, keep the time row. */
  timeOnly = input(false, { transform: booleanAttribute });
  /** 12h (AM/PM) or 24h clock. */
  hourFormat = input<DatepickerHourFormat>('24');
  /** Minute increment of the time stepper (buttons / arrow keys — typing stays exact). */
  stepMinute = input<number, unknown>(1, { transform: numberAttribute });
  /**
   * Let the hours and minutes be typed directly in the time row (default).
   */
  editableTime = input(true, { transform: booleanAttribute });

  /** Show the bottom button bar (Today / Clear) — or the `#buttonbar` template. */
  showButtonBar = input(false, { transform: booleanAttribute });
  /** Label of the default "Today" button. */
  todayLabel = input<string>("Aujourd'hui");
  /** Label of the default "Clear" button. */
  clearLabel = input<string>('Effacer');

  /**
   * Accessible hint announcing the expected typed format, chained onto the trigger's
   * `aria-describedby` (alongside the helper/error message, never replacing it) whenever it's
   * typeable (FSHSP-118): the `placeholder` alone is unreliable across screen readers, and it
   * disappears the moment the user starts typing. Defaults to a sentence built from the resolved
   * placeholder (e.g. "Format attendu : jj/mm/aaaa"); pass an explicit string to override it, or
   * `''` to omit it.
   */
  formatHintLabel = input<string>();

  /** Accessible name of the calendar panel (fallback when no `label`/`ariaLabel`). */
  panelAriaLabel = input<string>('Calendrier');
  /** Accessible label of the previous-month/year navigation arrow. */
  prevAriaLabel = input<string>('Précédent');
  /** Accessible label of the next-month/year navigation arrow. */
  nextAriaLabel = input<string>('Suivant');
  /** Accessible name of the hours spinbutton. */
  hoursAriaLabel = input<string>('Heures');
  /** Accessible name of the minutes spinbutton. */
  minutesAriaLabel = input<string>('Minutes');
  /** Accessible name of the AM/PM spinbutton. */
  meridiemAriaLabel = input<string>('AM/PM');
  /** Accessible label of the hours increment button. */
  incrementHoursAriaLabel = input<string>('Augmenter les heures');
  /** Accessible label of the hours decrement button. */
  decrementHoursAriaLabel = input<string>('Diminuer les heures');
  /** Accessible label of the minutes increment button. */
  incrementMinutesAriaLabel = input<string>('Augmenter les minutes');
  /** Accessible label of the minutes decrement button. */
  decrementMinutesAriaLabel = input<string>('Diminuer les minutes');
  /** Accessible label of the AM/PM toggle buttons. */
  toggleMeridiemAriaLabel = input<string>('Changer AM/PM');

  /** Render the panel inline (no trigger, no overlay). */
  inline = input(false, { transform: booleanAttribute });
  /**
   * Auto-flip the panel above the trigger when there isn't enough room below
   * (default). Set `false` to lock it below the trigger regardless of space.
   */
  autoFlip = input(true, { transform: booleanAttribute });
  /** Close after a complete selection (ignored when `showTime`). */
  closeOnSelect = input(true, { transform: booleanAttribute });
  /** Extra class(es) applied to the panel (scoped custom styling). */
  panelStyleClass = input<string>();

  /** Emitted whenever the value changes (selection, time, clear). */
  valueChange = output<DatepickerValue>();
  /** Emitted when a date/month/year is picked — always a single value (in `valueType`'s
   *  shape), even in `multiple`/`range` (it reports "which day was just clicked", not the model
   *  value, which is why it never becomes an array there). */
  dateSelect = output<Date | string>();
  /** Emitted when the displayed month changes. */
  monthChange = output<{ month: number; year: number }>();
  /** Emitted when the panel opens. */
  opened = output<void>();
  /** Emitted when the panel closes. */
  closed = output<void>();
  /** Emitted when the value is cleared. */
  cleared = output<void>();
  /** Emitted when the trigger receives focus. */
  inputFocus = output<FocusEvent>();
  /** Emitted when the trigger loses focus. */
  inputBlur = output<FocusEvent>();

  /** Custom day-cell template: `<ng-template #date let-date let-selected="selected">`. */
  protected readonly dateTemplate = contentChild<TemplateRef<unknown>>('date');
  /** Custom button-bar template: `<ng-template #buttonbar let-todayCallback let-clearCallback>`. */
  protected readonly buttonBarTemplate = contentChild<TemplateRef<unknown>>('buttonbar');
  /** Custom trigger-icon template: `<ng-template #icon let-name let-size="size">`. */
  private readonly iconTemplate = contentChild<TemplateRef<UiInputIconContext>>('icon');

  /** @ignore */
  private readonly localeId = inject(LOCALE_ID);
  /** @ignore */
  private readonly triggerInput = viewChild<UiInput>('trigger');
  /** @ignore Trigger host (to anchor the overlay on the input box, not the helper). */
  private readonly triggerRef = viewChild<UiInput, ElementRef<HTMLElement>>('trigger', {
    read: ElementRef,
  });
  /** @ignore Panel root element (overlay or inline) — used for roving day focus. */
  private readonly panelEl = viewChild<ElementRef<HTMLElement>>('panel');

  /** @ignore */
  protected readonly panelId = `ui-datepicker-panel-${nextPanelUid++}`;
  /** @ignore */
  protected readonly panelOpen = signal(false);
  /** @ignore Element the overlay is anchored to (the input box). */
  protected readonly overlayOrigin = signal<Element | null>(null);
  /** @ignore Month currently displayed. */
  protected readonly viewDate = signal<Date>(startOfDay(new Date()));
  /** @ignore Active drill-down level; resets to `view()` when it changes. */
  protected readonly currentView = linkedSignal<DatepickerView>(() => this.view());
  /** @ignore Day cell owning the roving tabindex. */
  protected readonly focusedDate = signal<Date>(startOfDay(new Date()));
  /** @ignore Month-picker cell (index 0–11) owning the roving tabindex. */
  protected readonly focusedMonthIndex = signal<number>(new Date().getMonth());
  /** @ignore Year-picker cell (absolute year) owning the roving tabindex. */
  protected readonly focusedYear = signal<number>(new Date().getFullYear());
  /** @ignore Time components. */
  protected readonly hours = signal(0);
  protected readonly minutes = signal(0);
  /** @ignore Raw text while the user edits the trigger (`allowInput`); `null` when not editing. */
  protected readonly typedValue = signal<string | null>(null);
  /** @ignore Date-based source of truth for all calendar/selection logic; `modelValue`
   *  (inherited) only ever carries the public value (`Date` or ISO string per `valueType`),
   *  written in lockstep. */
  protected readonly internalValue = signal<DatepickerDateValue>(null);

  /** @ignore Below the trigger, flipping above when `autoFlip` and space is lacking. */
  protected readonly overlayPositions = computed(() => dropdownOverlayPositions(this.autoFlip()));

  /** @ignore Bound (stable) callbacks exposed to the `#buttonbar` template. */
  protected readonly todayCallback = (event?: Event): void => {
    event?.stopPropagation?.();
    this.selectToday();
  };
  protected readonly clearCallback = (event?: Event): void => {
    event?.stopPropagation?.();
    this.clear();
  };

  /** @ignore */
  private readonly resolvedLocale = computed(() => this.locale() ?? this.localeId);
  /** @ignore `minDate`/`maxDate`/`disabledDates` normalized to `Date` (accept ISO strings too). */
  private readonly resolvedMinDate = computed(() => normalizeDateInput(this.minDate()));
  private readonly resolvedMaxDate = computed(() => normalizeDateInput(this.maxDate()));
  private readonly resolvedDisabledDates = computed(() =>
    (this.disabledDates() ?? []).map(normalizeDateInput).filter((d): d is Date => d !== null),
  );
  /**
   * @ignore The trigger is not typeable: manual input off, not single, read-only, or
   * `timeOnly` — free-form typing in time-only mode isn't implemented (no dedicated
   * parser/formatter for a bare time string), so it's disabled outright here rather than
   * silently mis-parsing.
   */
  protected readonly triggerReadonly = computed(
    () =>
      this.readonly() || !this.allowInput() || this.selectionMode() !== 'single' || this.timeOnly(),
  );
  /**
   * @ignore Placeholder shown in the typeable trigger. Falls back to a hint derived
   * from the resolved locale's field order (e.g. `jj/mm/aaaa` in French, `mm/dd/yyyy`
   * in en-US) so the field never advertises the wrong format.
   */
  protected readonly resolvedPlaceholder = computed(() => {
    const explicit = this.placeholder();
    // Keep the consumer's placeholder, and don't auto-hint on a read-only trigger.
    if (explicit || this.triggerReadonly()) return explicit;
    const fr = this.resolvedLocale().toLowerCase().startsWith('fr');
    const token = { day: fr ? 'jj' : 'dd', month: 'mm', year: fr ? 'aaaa' : 'yyyy' };
    const view = this.view();
    if (view === 'year') return token.year;
    const opts: Intl.DateTimeFormatOptions =
      view === 'month'
        ? { month: '2-digit', year: 'numeric' }
        : { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Intl.DateTimeFormat(this.resolvedLocale(), opts)
      .formatToParts(new Date(2023, 10, 22))
      .map((p) =>
        p.type === 'day'
          ? token.day
          : p.type === 'month'
            ? token.month
            : p.type === 'year'
              ? token.year
              : p.value,
      )
      .join('');
  });
  /**
   * @ignore Format hint text, or `null` when there's nothing to announce: the trigger isn't
   * typeable, or `formatHintLabel` was explicitly set to `''` to opt out.
   */
  protected readonly resolvedFormatHint = computed(() => {
    if (this.triggerReadonly()) return null;
    const explicit = this.formatHintLabel();
    if (explicit === '') return null;
    return explicit || `Format attendu : ${this.resolvedPlaceholder()}`;
  });
  /** @ignore Stable id for the hint element `resolvedFormatHint` renders into. */
  protected readonly formatHintId = computed(() => `${this.resolvedId()}-format-hint`);

  /** @ignore Order of day/month/year for the resolved locale (drives numeric parsing). */
  private readonly dateFieldOrder = computed<('day' | 'month' | 'year')[]>(() => {
    const parts = new Intl.DateTimeFormat(this.resolvedLocale(), {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).formatToParts(new Date(2023, 10, 22));
    const order = parts
      .map((p) => p.type)
      .filter((t): t is 'day' | 'month' | 'year' => t === 'day' || t === 'month' || t === 'year');
    return order.length === 3 ? order : ['day', 'month', 'year'];
  });
  /** @ignore `dateFieldOrder`, minus `day` in month view — the fields actually typed. */
  private readonly activeFields = computed<('day' | 'month' | 'year')[]>(() =>
    this.dateFieldOrder().filter((f) => (this.view() === 'month' ? f !== 'day' : true)),
  );
  /**
   * @ignore Dynamic mask (day/month/year widths in locale order, plus hour/minute — and AM/PM —
   * widths when `showTime`) driving the auto-"/" (resp. ":") formatting of the typeable trigger.
   * `null` disables it: `triggerReadonly` (covers `timeOnly` — see there), `view === 'year'`
   * (free-form numeric field, out of scope), or a custom `parseDate` (a non-numeric format would
   * make the auto-slash wrong). The `year` segment is deliberately left unbounded so the existing
   * 2-digit shortcut (`normalizeYear`) keeps working — strict validation still happens at
   * `finalizeParsed`. `defaultParse` already expects these trailing hour/minute digits (see its
   * `nums.slice(fields.length)`) — this only keeps the auto-formatting mask in sync with it, so
   * typed hour/minute digits aren't truncated by `autoFormatSegments` before they reach it.
   */
  private readonly typingSlots = computed<MaskSlot[] | null>(() => {
    if (this.triggerReadonly() || this.view() === 'year' || this.parseDate()) return null;
    const widths = { day: '99', month: '99', year: '9999' } as const;
    const bounds: Record<'day' | 'month' | 'year', MaskBounds | null> = {
      day: { min: 1, max: 31 },
      month: { min: 1, max: 12 },
      year: null,
    };
    const fields = this.activeFields();
    let mask = fields.map((f) => widths[f]).join('/');
    const segmentBounds: (MaskBounds | null)[] = fields.map((f) => bounds[f]);

    if (this.showTime() && this.view() === 'date') {
      mask += this.hourFormat() === '12' ? ' 99:99 aa' : ' 99:99';
      segmentBounds.push(this.hourFormat() === '12' ? { min: 1, max: 12 } : { min: 0, max: 23 }, {
        min: 0,
        max: 59,
      });
    }
    return buildMaskSlots(mask, segmentBounds);
  });
  /** @ignore The panel is visible. */
  protected readonly showPanel = computed(() => this.inline() || this.panelOpen());
  /** @ignore Day grid shown (hidden in `timeOnly`). */
  protected readonly showCalendar = computed(() => !this.timeOnly());
  /** @ignore Single-month layout enables the drill-down header + roving focus. */
  protected readonly singleMonth = computed(() => Math.max(1, this.numberOfMonths()) === 1);

  /** @ignore A value is currently set. */
  protected readonly hasValue = computed(() => this.selectedDates().length > 0);
  /**
   * @ignore The trigger's right action clears the value (instead of toggling the panel). Gated
   * on `!showIcon()` (FSHSP-118): the calendar/clock toggle always wins the trigger's single icon
   * slot when it's shown, so there's always a click target to reopen the panel and pick a
   * different date directly — the cross only replaces it in configs that hid it (`showIcon`
   * false), where it's the sole remaining affordance to empty the field without a keyboard.
   */
  protected readonly showClearButton = computed(
    () =>
      this.showClear() &&
      this.hasValue() &&
      !this.isDisabled() &&
      !this.readonly() &&
      !this.showIcon(),
  );
  /** @ignore Right-side icon: clear (×) when clearable + set + no calendar toggle to show
   *  (see `showClearButton`), else the calendar/clock toggle. */
  protected readonly triggerIcon = computed(() => {
    if (this.showClearButton()) return 'xmark';
    if (!this.showIcon()) return undefined;
    // Default to a clock in time-only mode (unless a custom icon was provided).
    return this.timeOnly() && this.icon() === 'calendar' ? 'clock' : this.icon();
  });
  /** @ignore Accessible name of the right action. */
  protected readonly triggerIconAriaLabel = computed(() =>
    this.showClearButton() ? this.clearLabel() : this.iconAriaLabel(),
  );
  /** @ignore Forwarded to the trigger only when an icon zone is rendered — `showIcon="false"` stays icon-less. */
  protected readonly triggerIconTemplate = computed(() =>
    this.triggerIcon() ? this.iconTemplate() : undefined,
  );

  // --- Selection helpers ----------------------------------------------

  /** @ignore Flatten the internal (Date-based) value to a list of selected dates. */
  private readonly selectedDates = computed<Date[]>(() => {
    const v = this.internalValue();
    if (!v) return [];
    return (Array.isArray(v) ? v : [v]).filter((d): d is Date => d instanceof Date);
  });
  /** @ignore First selected date (for view seeding / time / display). */
  private firstSelectedFrom(value: DatepickerDateValue): Date | null {
    if (!value) return null;
    const arr = Array.isArray(value) ? value : [value];
    return arr.find((d) => d instanceof Date) ?? null;
  }

  // --- Value conversion (the ONLY boundary between the public `Date`/ISO contract
  // and the internal Date-based calendar logic) --------------------------------

  /** @ignore Whether the value carries a time component (date+time ISO / non-midnight `Date`). */
  private readonly hasTimeComponent = computed(() => this.showTime() || this.timeOnly());
  /** @ignore Date → ISO string, date-only unless `showTime`/`timeOnly`. */
  private toIsoValue(d: Date): string {
    return this.hasTimeComponent() ? toIsoDateTime(d) : toIsoDate(d);
  }
  /** @ignore ISO string → Date, `null` if malformed (never throws). */
  private fromIsoValue(s: string): Date | null {
    return this.hasTimeComponent() ? parseIsoDateTime(s) : parseIsoDate(s);
  }
  /** @ignore Internal Date → the shape `valueType` commits to emitting: a fresh `Date`
   *  (normalized to midnight when no time is shown — never the original reference) in `'date'`
   *  mode, an ISO string in `'iso'` mode. The single point deciding the emitted type. */
  private serializeValue(d: Date): Date | string {
    if (this.valueType() === 'iso') return this.toIsoValue(d);
    return this.hasTimeComponent() ? new Date(d) : startOfDay(d);
  }
  /** @ignore A single incoming item, `Date` or ISO string, auto-detected — `writeValue` accepts
   *  either shape regardless of `valueType` (only the emitted side commits to one). Cloned when
   *  already a `Date` (never the caller's own reference) — symmetric with `serializeValue`,
   *  which never hands back the internal reference either; protects against the caller later
   *  mutating that `Date` in place and silently desyncing `internalValue`. */
  private parseValue(v: Date | string): Date | null {
    return v instanceof Date ? new Date(v) : this.fromIsoValue(v);
  }
  /** @ignore Internal Date(s) → public value, right before it reaches `modelValue`/the CVA.
   *  The cast is safe: `serializeValue` only branches on `valueType()`, constant across the
   *  `map`, so the array is always homogeneous (`Date[]` or `string[]`, never mixed). */
  private toExternalValue(value: DatepickerDateValue): DatepickerValue {
    if (!value) return null;
    if (Array.isArray(value)) return value.map((d) => this.serializeValue(d)) as Date[] | string[];
    return this.serializeValue(value);
  }
  /** @ignore Public value → internal Date(s), right as it enters via `writeValue`. Invalid
   *  entries are dropped rather than failing the whole value (a malformed item in a
   *  `multiple`/`range` array shouldn't wipe out the rest). */
  private toInternalValue(value: DatepickerValue): DatepickerDateValue {
    if (!value) return null;
    if (Array.isArray(value)) {
      const parsed = value.map((v) => this.parseValue(v)).filter((d): d is Date => d !== null);
      return parsed.length ? parsed : null;
    }
    return this.parseValue(value);
  }

  // --- Display ---------------------------------------------------------

  /** @ignore */
  private formatDate(date: Date): string {
    const custom = this.dateFormat();
    if (custom) return custom(date);
    // Typeable trigger → numeric format that round-trips with the default parser.
    if (this.allowInput()) {
      const opts: Intl.DateTimeFormatOptions = {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      };
      if (this.showTime()) {
        opts.hour = '2-digit';
        opts.minute = '2-digit';
      }
      return new Intl.DateTimeFormat(this.resolvedLocale(), opts).format(date);
    }
    const options: Intl.DateTimeFormatOptions = this.showTime()
      ? { dateStyle: 'medium', timeStyle: 'short' }
      : { dateStyle: 'medium' };
    return new Intl.DateTimeFormat(this.resolvedLocale(), options).format(date);
  }

  /** @ignore `timeOnly` display — respects `hourFormat` (never the locale's own AM/PM-vs-24h
   *  default) and `dateFormat` when provided (symmetric with `formatDate`/`formatMonth`, used
   *  here as a time formatter). */
  private formatTime(date: Date): string {
    const custom = this.dateFormat();
    if (custom) return custom(date);
    return new Intl.DateTimeFormat(this.resolvedLocale(), {
      hour: '2-digit',
      minute: '2-digit',
      hour12: this.hourFormat() === '12',
    }).format(date);
  }

  /** @ignore Month-view display (numeric + round-trippable when the trigger is typeable). */
  private formatMonth(date: Date): string {
    if (this.allowInput() && !this.dateFormat()) {
      const yearFirst = this.dateFieldOrder().filter((f) => f !== 'day')[0] === 'year';
      const mm = this.pad(date.getMonth() + 1);
      const yyyy = String(date.getFullYear());
      return yearFirst ? `${yyyy}/${mm}` : `${mm}/${yyyy}`;
    }
    return this.capitalize(
      new Intl.DateTimeFormat(this.resolvedLocale(), { month: 'long', year: 'numeric' }).format(
        date,
      ),
    );
  }

  /** @ignore Value rendered in the trigger. */
  protected override readonly displayValue = computed(() => {
    // While editing, mirror the raw text so the input keeps what the user types.
    const typed = this.typedValue();
    if (typed !== null) return typed;

    const dates = this.selectedDates();
    if (!dates.length) return '';
    const base = this.view();
    if (base === 'month') return this.formatMonth(dates[0]);
    if (base === 'year') return String(dates[0].getFullYear());

    if (this.timeOnly()) {
      return this.formatTime(dates[0]);
    }
    const mode = this.selectionMode();
    if (mode === 'multiple') return dates.map((d) => this.formatDate(d)).join(', ');
    if (mode === 'range') return dates.map((d) => this.formatDate(d)).join(' – ');
    return this.formatDate(dates[0]);
  });

  // --- Header ----------------------------------------------------------

  /** @ignore Displayed decade start (year view). */
  private readonly decadeStart = computed(
    () => Math.floor(this.viewDate().getFullYear() / 10) * 10,
  );

  /** @ignore Header label depends on the active view. */
  protected readonly headerLabel = computed(() => {
    const v = this.currentView();
    if (v === 'year') return `${this.decadeStart()} - ${this.decadeStart() + 9}`;
    if (v === 'month') return String(this.viewDate().getFullYear());
    return this.capitalize(
      new Intl.DateTimeFormat(this.resolvedLocale(), { month: 'long', year: 'numeric' }).format(
        this.viewDate(),
      ),
    );
  });

  // --- Weekday headers -------------------------------------------------

  /** @ignore Short (visible) + full (aria-label) weekday names — without both, either the header
   *  stays `aria-hidden` or the short text alone leaves screen-reader users without column names. */
  protected readonly weekDayNames = computed<{ short: string; full: string }[]>(() => {
    const shortFmt = new Intl.DateTimeFormat(this.resolvedLocale(), { weekday: 'short' });
    const longFmt = new Intl.DateTimeFormat(this.resolvedLocale(), { weekday: 'long' });
    const sunday = new Date(2023, 0, 1); // getDay() === 0
    const first = this.firstDayOfWeek();
    return Array.from({ length: 7 }, (_, k) => {
      const d = addDays(sunday, (first + k) % 7);
      return {
        short: this.capitalize(shortFmt.format(d)),
        full: this.capitalize(longFmt.format(d)),
      };
    });
  });
  /** @ignore Full-date `aria-label` formatter for day gridcells (e.g. "8 juillet 2026"). */
  private readonly dayAriaFormatter = computed(
    () =>
      new Intl.DateTimeFormat(this.resolvedLocale(), {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }),
  );

  // --- Grids -----------------------------------------------------------

  /** @ignore Month panels (1 or more) for the date view. */
  protected readonly monthPanels = computed<DatepickerMonthPanel[]>(() => {
    const count = Math.max(1, this.numberOfMonths());
    const start = firstOfMonth(this.viewDate());
    const fmt = new Intl.DateTimeFormat(this.resolvedLocale(), { month: 'long', year: 'numeric' });
    return Array.from({ length: count }, (_, i) => {
      const monthDate = addMonths(start, i);
      return {
        monthDate,
        label: this.capitalize(fmt.format(monthDate)),
        weeks: this.buildMonthWeeks(monthDate),
        showPrev: i === 0,
        showNext: i === count - 1,
      };
    });
  });

  /** @ignore Month-picker grid (12 months of the displayed year). */
  protected readonly months = computed<DatepickerMonthCell[]>(() => {
    const fmt = new Intl.DateTimeFormat(this.resolvedLocale(), { month: 'short' });
    const year = this.viewDate().getFullYear();
    const sel = this.selectedDates();
    return Array.from({ length: 12 }, (_, i) => ({
      index: i,
      label: this.capitalize(fmt.format(new Date(year, i, 1))),
      selected: sel.some((d) => d.getFullYear() === year && d.getMonth() === i),
      disabled: this.isMonthDisabled(year, i),
    }));
  });

  /** @ignore Year-picker grid (the displayed decade). */
  protected readonly years = computed<DatepickerYearCell[]>(() => {
    const start = this.decadeStart();
    const sel = this.selectedDates();
    return Array.from({ length: 10 }, (_, i) => {
      const year = start + i;
      return {
        year,
        selected: sel.some((d) => d.getFullYear() === year),
        disabled: this.isYearDisabled(year),
      };
    });
  });

  /** @ignore Hours as shown in the 12h stepper (1–12). */
  protected readonly displayHours = computed(() => {
    if (this.hourFormat() === '24') return this.hours();
    const h = this.hours() % 12;
    return h === 0 ? 12 : h;
  });
  /** @ignore */
  protected readonly meridiem = computed<'AM' | 'PM'>(() => (this.hours() < 12 ? 'AM' : 'PM'));

  constructor() {
    super();

    // Never carry an open panel over to the next page (the field can live in
    // an app shell that survives the navigation).
    closeOnNavigation(() => this.close(false));

    // Keep time signals in sync with the (first) value.
    effect(() => {
      const first = this.firstSelectedFrom(this.internalValue() ?? null);
      untracked(() => {
        if (first) {
          this.hours.set(first.getHours());
          this.minutes.set(first.getMinutes());
        }
      });
    });
  }

  override writeValue(value: DatepickerValue): void {
    this.typedValue.set(null);
    this.hoursDraft.set(null);
    this.minutesDraft.set(null);
    const internal = this.toInternalValue(value ?? null);
    this.internalValue.set(internal);
    this.modelValue.set(value ?? undefined);
    const first = this.firstSelectedFrom(internal);
    if (first) {
      this.viewDate.set(firstOfMonth(first));
      this.focusedDate.set(startOfDay(first));
      this.focusedMonthIndex.set(first.getMonth());
      this.focusedYear.set(first.getFullYear());
    }
  }

  // --- Panel open/close ------------------------------------------------

  open(): void {
    if (this.inline() || this.isDisabled() || this.readonly() || this.panelOpen()) return;
    const base = this.firstSelectedFrom(this.internalValue() ?? null) ?? startOfDay(new Date());
    this.viewDate.set(firstOfMonth(base));
    this.currentView.set(this.view());
    this.focusedDate.set(this.clampToRange(startOfDay(base)));
    this.focusedMonthIndex.set(base.getMonth());
    this.focusedYear.set(base.getFullYear());
    this.overlayOrigin.set(this.resolveOverlayOrigin());
    this.panelOpen.set(true);
    this.opened.emit();
    // Keep focus in the input when it's typeable; otherwise rove into the (active) grid.
    if (this.showCalendar() && this.triggerReadonly()) {
      if (this.currentView() === 'date') this.queueDayFocus();
      else if (this.currentView() === 'month') this.queueMonthFocus();
      else this.queueYearFocus();
    }
  }

  close(focusTrigger = true): void {
    if (!this.panelOpen()) return;
    this.panelOpen.set(false);
    this.emitTouch();
    this.closed.emit();
    if (focusTrigger) this.triggerInput()?.focus();
  }

  /** @ignore */
  protected toggle(): void {
    this.panelOpen() ? this.close() : this.open();
  }

  /** @ignore Right action: clear when clearable + set, otherwise toggle the panel.
   *  `stopPropagation` keeps the click from bubbling to the field (which opens it). */
  protected onIconClick(event: MouseEvent): void {
    event.stopPropagation();
    if (this.showClearButton()) this.clear();
    else this.toggle();
  }

  /** @ignore */
  protected onTriggerKeydown(event: KeyboardEvent): void {
    // Typeable trigger: let printable keys through, only intercept nav/commit.
    if (!this.triggerReadonly()) {
      if (event.key === 'ArrowDown') {
        event.preventDefault();
        this.open();
        this.queueDayFocus();
      } else if (event.key === 'Enter') {
        event.preventDefault();
        this.commitTyped();
        if (this.panelOpen() && this.closeOnSelect() && !this.showTime()) this.close(false);
      } else if (event.key === 'Escape') {
        this.close();
      }
      return;
    }
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.open();
    } else if (event.key === 'Escape') {
      this.close();
    }
  }

  /**
   * @ignore Track the raw text as the user types; live-preview the open panel. When a typing
   * mask applies (see `typingSlots`), auto-insert "/" as soon as a segment is complete (same
   * pattern as a card-expiry field) and reposition the caret accordingly.
   */
  protected onTriggerInput(value: string): void {
    if (this.triggerReadonly()) return;
    const slots = this.typingSlots();
    if (!slots) {
      this.typedValue.set(value);
      if (this.panelOpen()) this.previewTyped();
      return;
    }
    const el = this.triggerInput()?.nativeInputElement();
    const caret = el?.selectionStart ?? value.length;
    // Number of data characters located BEFORE the caret (stable anchor, same trick as ui-input-mask).
    const dataBeforeCaret = extractMaskData(value.slice(0, caret)).length;
    const newData = extractMaskData(value);
    // A deletion (Backspace/Delete/selection-clear) leaves only ALREADY-valid digits behind —
    // re-running the bounds check against them (meant to reject a just-typed invalid leading
    // digit, e.g. "8" can't start a 1-31 day) can instead skip a still-valid residual one and
    // misalign every segment after it (FSHSP-118: only the year, which carries no bound, always
    // survived editing untouched). Comparing data lengths (not `event.inputType`, unavailable
    // here) distinguishes typing/pasting (grows or holds, still bounds-checked) from deleting
    // (shrinks, bounds-checked only up to the final blur/Enter parse — see `finalizeParsed`).
    const enforceBounds = newData.length >= extractMaskData(this.typedValue() ?? '').length;
    const { text, tokenIndices } = autoFormatSegments(slots, newData, { enforceBounds });
    this.typedValue.set(text);
    if (el) {
      el.value = text;
      const pos = caretForMask(tokenIndices, dataBeforeCaret, text.length);
      el.setSelectionRange(pos, pos);
    }
    if (this.panelOpen()) this.previewTyped();
  }

  /**
   * @ignore Reflect a fully-typed date in the open panel (navigate + highlight)
   * without reformatting the field, so the caret stays put while typing.
   */
  private previewTyped(): void {
    const raw = this.typedValue();
    if (raw === null || !raw.trim()) return;
    const parsed = this.parseTyped(raw.trim(), true);
    if (!parsed || this.isParsedDisabled(parsed)) return;
    const picked = this.showTime() ? parsed : startOfDay(parsed);
    // Update the model (drives the selected-day highlight + live value) but keep
    // `typedValue` so `displayValue` still returns the raw text (no caret jump).
    this.internalValue.set(picked);
    const external = this.toExternalValue(picked);
    this.modelValue.set(external ?? undefined);
    this.emitChange(external);
    this.valueChange.emit(external);
    this.viewDate.set(firstOfMonth(picked));
    this.focusedDate.set(startOfDay(picked));
  }

  /** @ignore Parse the typed text on blur, then forward the blur. */
  protected onTriggerBlur(event: FocusEvent): void {
    this.commitTyped();
    const next = event.relatedTarget as Node | null;
    if (!next || !this.panelEl()?.nativeElement.contains(next)) this.emitTouch();
    this.inputBlur.emit(event);
  }

  /** @ignore Parse and apply the typed text; revert to the previous value if invalid. */
  protected commitTyped(): void {
    if (this.triggerReadonly()) return;
    const raw = this.typedValue();
    if (raw === null) return; // untouched
    const text = raw.trim();
    if (!text) {
      this.typedValue.set(null);
      if (this.hasValue()) this.clear();
      return;
    }
    const parsed = this.parseTyped(text, true);
    if (parsed && !this.isParsedDisabled(parsed)) {
      const picked = this.showTime() ? parsed : startOfDay(parsed);
      this.commit(picked); // single-only → clears typedValue and reformats
      this.dateSelect.emit(this.serializeValue(picked));
      this.viewDate.set(firstOfMonth(picked));
      this.focusedDate.set(startOfDay(picked));
    } else {
      this.typedValue.set(null); // revert: displayValue reformats the current value
    }
  }

  /**
   * @ignore Custom parser when provided, otherwise the locale-aware numeric parser.
   * `requireComplete` gates the default parser to fully-typed dates (custom
   * parsers decide completeness themselves).
   */
  private parseTyped(text: string, requireComplete = false): Date | null {
    const custom = this.parseDate();
    return custom ? custom(text) : this.defaultParse(text, requireComplete);
  }

  /**
   * @ignore Locale-aware numeric parser (day/month/year order from `dateFieldOrder`).
   * With `requireComplete`, returns `null` unless every component is present
   * (and the year has 2 or ≥4 digits) — used for live preview to avoid jumps.
   */
  private defaultParse(text: string, requireComplete = false): Date | null {
    const groups = text.match(/\d+/g) ?? [];
    const nums = groups.map(Number);
    if (!nums.length) return null;
    const view = this.view();
    if (view === 'year') {
      if (requireComplete && (groups[0]?.length ?? 0) < 4) return null;
      return finalizeParsed(this.normalizeYear(nums[0]), 0, 1, 0, 0);
    }

    const fields = this.activeFields();
    if (requireComplete) {
      if (groups.length < fields.length) return null;
      const yearLen = groups[fields.indexOf('year')]?.length ?? 0;
      if (yearLen !== 2 && yearLen < 4) return null;
    }
    let day = 1;
    let month = 0;
    let year = this.viewDate().getFullYear();
    fields.forEach((field, i) => {
      const n = nums[i];
      if (n === undefined) return;
      if (field === 'day') day = n;
      else if (field === 'month') month = n - 1;
      else year = this.normalizeYear(n);
    });

    let h = this.hours();
    let min = this.minutes();
    if (this.showTime() && view === 'date') {
      const t = nums.slice(fields.length);
      if (t.length >= 1) h = t[0];
      if (t.length >= 2) min = t[1];
      if (this.hourFormat() === '12') {
        if (/p/i.test(text) && h < 12) h += 12;
        if (/a/i.test(text) && h === 12) h = 0;
      }
    }
    return finalizeParsed(year, month, view === 'month' ? 1 : day, h, min);
  }

  /** @ignore 2-digit years → 2000s. */
  private normalizeYear(y: number): number {
    return y < 100 ? 2000 + y : y;
  }

  /** @ignore Range/disabled check for a parsed value, granular to the base view. */
  private isParsedDisabled(date: Date): boolean {
    const v = this.view();
    if (v === 'year') return this.isYearDisabled(date.getFullYear());
    if (v === 'month') return this.isMonthDisabled(date.getFullYear(), date.getMonth());
    return this.isDateDisabled(startOfDay(date));
  }

  // --- Header interactions --------------------------------------------

  /** @ignore Click the header title → drill up (date → month → year). Single-month only. */
  protected onHeaderClick(): void {
    if (!this.singleMonth()) return;
    const v = this.currentView();
    if (v === 'date') {
      this.focusedMonthIndex.set(this.viewDate().getMonth());
      this.currentView.set('month');
    } else if (v === 'month') {
      this.focusedYear.set(this.viewDate().getFullYear());
      this.currentView.set('year');
    }
  }

  /** @ignore Prev/next arrow — steps month / year / decade depending on the view. */
  protected onPrev(): void {
    this.step(-1);
  }
  protected onNext(): void {
    this.step(1);
  }
  /** @ignore */
  private step(dir: 1 | -1): void {
    const v = this.currentView();
    if (v === 'date') this.changeMonth(dir);
    else if (v === 'month')
      this.viewDate.set(
        new Date(this.viewDate().getFullYear() + dir, this.viewDate().getMonth(), 1),
      );
    else
      this.viewDate.set(
        new Date(this.viewDate().getFullYear() + dir * 10, this.viewDate().getMonth(), 1),
      );
  }
  /** @ignore */
  protected changeMonth(delta: number): void {
    const next = addMonths(this.viewDate(), delta);
    this.viewDate.set(next);
    this.monthChange.emit({ month: next.getMonth(), year: next.getFullYear() });
  }

  // --- Selection -------------------------------------------------------

  /** @ignore Pick a day from the grid. */
  protected selectDay(cell: DatepickerDay): void {
    if (cell.disabled || this.isDisabled() || this.readonly()) return;
    const picked = new Date(cell.date);
    if (this.showTime()) picked.setHours(this.hours(), this.minutes(), 0, 0);

    const mode = this.selectionMode();
    let value: DatepickerDateValue;
    let complete = true;
    if (mode === 'multiple') {
      const arr = [...this.selectedDates()];
      const idx = arr.findIndex((d) => isSameDay(d, picked));
      if (idx >= 0) arr.splice(idx, 1);
      else arr.push(picked);
      value = arr;
      complete = false; // multiple never auto-closes
    } else if (mode === 'range') {
      const arr = this.selectedDates();
      if (arr.length !== 1) {
        value = [picked];
        complete = false;
      } else {
        value = picked < startOfDay(arr[0]) ? [picked] : [arr[0], picked];
        complete = Array.isArray(value) && value.length === 2;
      }
    } else {
      value = picked;
    }

    this.commit(value);
    this.dateSelect.emit(this.serializeValue(picked));
    this.viewDate.set(firstOfMonth(picked));
    this.focusedDate.set(startOfDay(picked));
    if (this.closeOnSelect() && !this.showTime() && !this.inline() && complete) this.close();
  }

  /** @ignore Month-picker / drill-down month selection. */
  protected selectMonth(cell: DatepickerMonthCell): void {
    if (cell.disabled) return;
    const d = new Date(this.viewDate().getFullYear(), cell.index, 1);
    this.viewDate.set(d);
    if (this.view() === 'month') {
      this.commit(d);
      this.dateSelect.emit(this.serializeValue(d));
      if (this.closeOnSelect() && !this.showTime() && !this.inline()) this.close();
    } else {
      this.currentView.set('date');
      this.focusedDate.set(this.clampToRange(startOfDay(d)));
      this.queueDayFocus();
    }
  }

  /** @ignore Year-picker / drill-down year selection. */
  protected selectYear(cell: DatepickerYearCell): void {
    if (cell.disabled) return;
    const d = new Date(cell.year, this.view() === 'year' ? 0 : this.viewDate().getMonth(), 1);
    this.viewDate.set(d);
    if (this.view() === 'year') {
      this.commit(d);
      this.dateSelect.emit(this.serializeValue(d));
      if (this.closeOnSelect() && !this.showTime() && !this.inline()) this.close();
    } else {
      this.currentView.set('month');
      this.focusedMonthIndex.set(d.getMonth());
      this.queueMonthFocus();
    }
  }

  /** @ignore Apply the time signals to the value (single selection only). */
  protected applyTime(): void {
    if (this.selectionMode() !== 'single') return;
    const base =
      this.firstSelectedFrom(this.internalValue() ?? null) ??
      startOfDay(this.timeOnly() ? new Date() : this.viewDate());
    const next = new Date(base);
    next.setHours(this.hours(), this.minutes(), 0, 0);
    this.commit(next);
  }

  /** @ignore Zero-padded labels for the steppers. */
  protected readonly hoursLabel = computed(() =>
    this.pad(this.hourFormat() === '12' ? this.displayHours() : this.hours()),
  );
  protected readonly minutesLabel = computed(() => this.pad(this.minutes()));

  /** @ignore Raw digits while a time field is being typed in; `null` when not editing. */
  private readonly hoursDraft = signal<string | null>(null);
  private readonly minutesDraft = signal<string | null>(null);
  /** @ignore Text rendered in a time field: the draft while typing, the padded label otherwise. */
  protected readonly hoursValue = computed(() => this.hoursDraft() ?? this.hoursLabel());
  protected readonly minutesValue = computed(() => this.minutesDraft() ?? this.minutesLabel());
  /** @ignore Accepted hours range (the 12h clock shows 1–12). */
  protected readonly hourBounds = computed(() =>
    this.hourFormat() === '12' ? { min: 1, max: 12 } : { min: 0, max: 23 },
  );
  /** @ignore The hours/minutes fields accept typing. */
  protected readonly timeEditable = computed(
    () => this.editableTime() && !this.isDisabled() && !this.readonly(),
  );
  /** @ignore The time steppers (chevrons + AM/PM toggle) accept interaction — unlike
   *  `timeEditable`, not gated on `editableTime` (the steppers stay usable in
   *  `StepperOnlyTime`-style configs; only `disabled`/`readonly` freeze them). */
  protected readonly timeControlsEnabled = computed(() => !this.isDisabled() && !this.readonly());

  /** @ignore Step hours (wraps 0↔23; also flips meridiem across the 12h boundary). */
  protected stepHours(dir: 1 | -1): void {
    if (!this.timeControlsEnabled()) return;
    this.hoursDraft.set(null);
    this.hours.set((((this.hours() + dir) % 24) + 24) % 24);
    this.applyTime();
  }
  /** @ignore Step minutes by `stepMinute` (wraps 0↔59). */
  protected stepMinutes(dir: 1 | -1): void {
    if (!this.timeControlsEnabled()) return;
    this.minutesDraft.set(null);
    const step = Math.max(1, this.stepMinute());
    this.minutes.set((((this.minutes() + dir * step) % 60) + 60) % 60);
    this.applyTime();
  }
  /** @ignore */
  protected toggleMeridiem(): void {
    if (!this.timeControlsEnabled()) return;
    this.hoursDraft.set(null);
    this.hours.set((this.hours() + 12) % 24);
    this.applyTime();
  }

  /**
   * @ignore Typing in the hours field. The digits are held as a draft (so `0` can
   * be the start of `09`) and committed as soon as they form a valid hour.
   */
  protected onHoursInput(event: Event): void {
    if (!this.timeEditable()) return; // read-only fields never emit natively — belt and braces
    const { min, max } = this.hourBounds();
    const digits = this.acceptTimeDigits(event, this.hoursValue(), max);
    if (digits === null) return;
    this.hoursDraft.set(digits);
    const n = Number(digits);
    if (!digits || n < min || n > max) return; // not an hour yet (e.g. `0` on a 12h clock)
    this.hours.set(this.hourFormat() === '12' ? this.to24(n) : n);
    this.applyTime();
  }

  /** @ignore Typing in the minutes field — exact value (`stepMinute` only drives the steppers). */
  protected onMinutesInput(event: Event): void {
    if (!this.timeEditable()) return;
    const digits = this.acceptTimeDigits(event, this.minutesValue(), 59);
    if (digits === null || !digits) return;
    this.minutesDraft.set(digits);
    this.minutes.set(Number(digits));
    this.applyTime();
  }

  /**
   * @ignore Keep a time field to at most 2 digits and reject what can never be in
   * range (`33`, or `13` on a 12h clock) — the field reverts to `current`, so the
   * keystroke is simply refused. Returns the accepted digits, or `null` if rejected.
   */
  private acceptTimeDigits(event: Event, current: string, max: number): string | null {
    const el = event.target as HTMLInputElement;
    const digits = el.value.replace(/\D/g, '').slice(0, 2);
    const accepted = !digits || Number(digits) <= max;
    const text = accepted ? digits : current;
    // `[value]` is a no-op whenever the bound text is unchanged → write the DOM here.
    if (el.value !== text) {
      el.value = text;
      el.setSelectionRange(text.length, text.length);
    }
    return accepted ? digits : null;
  }

  /** @ignore 12h display hour (1–12) + the current meridiem → 24h hour. */
  private to24(displayed: number): number {
    return (displayed % 12) + (this.meridiem() === 'PM' ? 12 : 0);
  }

  /** @ignore Focusing a time field selects it, so typing replaces the value. */
  protected onTimeFocus(event: FocusEvent): void {
    (event.target as HTMLInputElement).select();
  }

  /** @ignore Leaving a time field drops the draft: the zero-padded label comes back. */
  protected onHoursBlur(): void {
    this.hoursDraft.set(null);
  }
  /** @ignore */
  protected onMinutesBlur(): void {
    this.minutesDraft.set(null);
  }

  /** @ignore ARIA spinbutton keyboard: ↑/↓ step, PageUp/PageDown ±, Enter commits. */
  protected onHourKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp' || event.key === 'PageUp') {
      event.preventDefault();
      this.stepHours(1);
    } else if (event.key === 'ArrowDown' || event.key === 'PageDown') {
      event.preventDefault();
      this.stepHours(-1);
    } else if (event.key === 'Enter') {
      event.preventDefault(); // commit in place, never submit the surrounding form
      this.hoursDraft.set(null);
    }
  }
  /** @ignore */
  protected onMinuteKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp' || event.key === 'PageUp') {
      event.preventDefault();
      this.stepMinutes(1);
    } else if (event.key === 'ArrowDown' || event.key === 'PageDown') {
      event.preventDefault();
      this.stepMinutes(-1);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      this.minutesDraft.set(null);
    }
  }
  /** @ignore */
  protected onMeridiemKeydown(event: KeyboardEvent): void {
    if (!this.timeControlsEnabled()) return;
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') {
      event.preventDefault();
      this.toggleMeridiem();
    }
  }

  /** @ignore */
  private pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  /** @ignore */
  protected selectToday(): void {
    const today = startOfDay(new Date());
    if (this.isDateDisabled(today)) return;
    if (this.showTime()) today.setHours(this.hours(), this.minutes(), 0, 0);
    this.commit(this.selectionMode() === 'single' ? today : [today]);
    this.dateSelect.emit(this.serializeValue(today));
    this.viewDate.set(firstOfMonth(today));
    this.focusedDate.set(today);
    if (
      this.closeOnSelect() &&
      !this.showTime() &&
      !this.inline() &&
      this.selectionMode() !== 'multiple'
    )
      this.close();
  }

  /** @ignore */
  protected clear(): void {
    this.commit(null);
    this.cleared.emit();
  }

  // --- Grid keyboard navigation (roving focus, date view) ---------------

  /** @ignore */
  protected onGridKeydown(event: KeyboardEvent): void {
    const current = this.focusedDate();
    let next: Date | null;
    switch (event.key) {
      case 'ArrowLeft':
        next = addDays(current, -1);
        break;
      case 'ArrowRight':
        next = addDays(current, 1);
        break;
      case 'ArrowUp':
        next = addDays(current, -7);
        break;
      case 'ArrowDown':
        next = addDays(current, 7);
        break;
      case 'Home':
        next = addDays(current, -((current.getDay() - this.firstDayOfWeek() + 7) % 7));
        break;
      case 'End':
        next = addDays(current, 6 - ((current.getDay() - this.firstDayOfWeek() + 7) % 7));
        break;
      case 'PageUp':
        next = addMonths(current, event.shiftKey ? -12 : -1);
        break;
      case 'PageDown':
        next = addMonths(current, event.shiftKey ? 12 : 1);
        break;
      case 'Enter':
      case ' ':
        event.preventDefault();
        this.selectDay(this.buildDay(startOfDay(current), this.viewDate()));
        return;
      case 'Escape':
        if (!this.inline()) this.close();
        return;
      default:
        return;
    }
    event.preventDefault();
    if (!next) return;
    this.focusedDate.set(startOfDay(next));
    this.ensureMonthVisible(next);
    this.queueDayFocus();
  }

  /** @ignore The roving-focus cell. `otherMonth` cells are excluded so a date
   * shown twice across adjacent panels (multi-month) yields a single tab stop. */
  protected isFocusableDay(cell: DatepickerDay): boolean {
    return !cell.otherMonth && isSameDay(cell.date, this.focusedDate());
  }

  // --- Grid keyboard navigation (roving focus, month/year pickers) -------

  /**
   * @ignore Shared arrow/Home/End math for a fixed-size, `columns`-wide grid (the month picker's
   * 12 cells / 3 columns and the year picker's 10 cells / 2 columns) — the one piece of roving-
   * focus logic actually common to all three grids; `PageUp`/`PageDown`/`Enter`/`Escape` differ
   * per grid (paging semantics, selecting a month vs. a year) and stay in their own handler.
   * Returns `null` for a key it doesn't handle.
   */
  private navigateGridIndex(
    key: string,
    current: number,
    columns: number,
    count: number,
  ): number | null {
    switch (key) {
      case 'ArrowLeft':
        return Math.max(0, current - 1);
      case 'ArrowRight':
        return Math.min(count - 1, current + 1);
      case 'ArrowUp':
        return current - columns >= 0 ? current - columns : current;
      case 'ArrowDown':
        return current + columns < count ? current + columns : current;
      case 'Home':
        return Math.floor(current / columns) * columns;
      case 'End':
        return Math.min(count - 1, Math.floor(current / columns) * columns + columns - 1);
      default:
        return null;
    }
  }

  /** @ignore Month-picker grid: ←↑→↓/Home/End move within the 12 months (3 columns), PageUp/PageDown
   *  step the displayed year (Shift = ×10), Enter/Space picks the focused month. */
  protected onMonthGridKeydown(event: KeyboardEvent): void {
    const current = this.focusedMonthIndex();
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectMonth(this.months()[current]);
      return;
    }
    if (event.key === 'Escape') {
      if (!this.inline()) this.close();
      return;
    }
    if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault();
      const dir = event.key === 'PageUp' ? -1 : 1;
      const years = event.shiftKey ? 10 : 1;
      this.viewDate.set(
        new Date(this.viewDate().getFullYear() + dir * years, this.viewDate().getMonth(), 1),
      );
      this.queueMonthFocus();
      return;
    }
    const next = this.navigateGridIndex(event.key, current, 3, 12);
    if (next === null) return;
    event.preventDefault();
    this.focusedMonthIndex.set(next);
    this.queueMonthFocus();
  }

  /** @ignore Year-picker grid: ←↑→↓/Home/End move within the displayed decade (2 columns),
   *  PageUp/PageDown step by a decade (Shift = ×10 decades), Enter/Space picks the focused year. */
  protected onYearGridKeydown(event: KeyboardEvent): void {
    const current = this.focusedYear();
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.selectYear(this.years()[current - this.decadeStart()]);
      return;
    }
    if (event.key === 'Escape') {
      if (!this.inline()) this.close();
      return;
    }
    if (event.key === 'PageUp' || event.key === 'PageDown') {
      event.preventDefault();
      const dir = event.key === 'PageUp' ? -1 : 1;
      const delta = (event.shiftKey ? 100 : 10) * dir;
      this.viewDate.set(
        new Date(this.viewDate().getFullYear() + delta, this.viewDate().getMonth(), 1),
      );
      this.focusedYear.set(current + delta);
      this.queueYearFocus();
      return;
    }
    const idx = this.navigateGridIndex(event.key, current - this.decadeStart(), 2, 10);
    if (idx === null) return;
    event.preventDefault();
    this.focusedYear.set(this.decadeStart() + idx);
    this.queueYearFocus();
  }

  /** @ignore The month-picker roving-focus cell. */
  protected isFocusableMonth(cell: DatepickerMonthCell): boolean {
    return cell.index === this.focusedMonthIndex();
  }

  /** @ignore The year-picker roving-focus cell. */
  protected isFocusableYear(cell: DatepickerYearCell): boolean {
    return cell.year === this.focusedYear();
  }

  /** @ignore Shift the visible month window just enough to contain `date`. */
  private ensureMonthVisible(date: Date): void {
    const count = Math.max(1, this.numberOfMonths());
    const start = firstOfMonth(this.viewDate());
    const end = addMonths(start, count - 1);
    const month = firstOfMonth(date);
    if (month < start) this.viewDate.set(month);
    else if (month > end) this.viewDate.set(addMonths(month, 1 - count));
  }

  // --- Internals -------------------------------------------------------

  /** @ignore Sole "normal" write path: takes internal Date(s), serializes to the public ISO
   *  string(s) right here, before it ever reaches `modelValue`/the CVA. Callers keep passing
   *  `Date`/`Date[]`/`null` exactly as before — the ISO contract lives entirely in this method. */
  private commit(value: DatepickerDateValue): void {
    this.typedValue.set(null); // any committed value re-formats the trigger
    this.internalValue.set(value ?? null);
    const external = this.toExternalValue(value ?? null);
    this.modelValue.set(external ?? undefined);
    this.emitChange(external);
    this.valueChange.emit(external);
  }

  /** @ignore Build a day-cell descriptor with its selection/range flags. */
  private buildDay(date: Date, viewMonth: Date): DatepickerDay {
    const today = startOfDay(new Date());
    const mode = this.selectionMode();
    const sel = this.selectedDates();
    let selected = false;
    let rangeStart = false;
    let rangeEnd = false;
    let inRange = false;
    if (mode === 'range') {
      const [s, e] = sel;
      if (s && isSameDay(date, s)) {
        rangeStart = true;
        selected = true;
      }
      if (e && isSameDay(date, e)) {
        rangeEnd = true;
        selected = true;
      }
      if (s && e && date > startOfDay(s) && date < startOfDay(e)) inRange = true;
    } else {
      selected = sel.some((d) => isSameDay(d, date));
    }
    return {
      date,
      day: date.getDate(),
      month: date.getMonth(),
      year: date.getFullYear(),
      otherMonth: date.getMonth() !== viewMonth.getMonth(),
      today: isSameDay(date, today),
      selected,
      disabled: this.isDateDisabled(date),
      ariaLabel: this.dayAriaFormatter().format(date),
      rangeStart,
      rangeEnd,
      inRange,
      ts: date.getTime(),
    };
  }

  /** @ignore 6×7 grid for a given month, incl. adjacent-month spill-over. */
  private buildMonthWeeks(monthDate: Date): DatepickerDay[][] {
    const first = firstOfMonth(monthDate);
    const offset = (first.getDay() - this.firstDayOfWeek() + 7) % 7;
    const gridStart = addDays(first, -offset);
    return Array.from({ length: 6 }, (_, w) =>
      Array.from({ length: 7 }, (_, d) => this.buildDay(addDays(gridStart, w * 7 + d), monthDate)),
    );
  }

  /** @ignore */
  private resolveOverlayOrigin(): Element | null {
    const host = this.triggerRef()?.nativeElement;
    // Anchor on the bordered input box so a helper message below doesn't push the panel down.
    return host?.querySelector('.ui-field-box') ?? host ?? null;
  }

  /** @ignore Focus the roving-tabindex cell matching `selector`, once the DOM reflects the
   *  just-updated `focusedDate`/`focusedMonthIndex`/`focusedYear` signal. */
  private queueCellFocus(selector: string): void {
    if (typeof requestAnimationFrame === 'undefined') return;
    requestAnimationFrame(() => {
      this.panelEl()?.nativeElement.querySelector<HTMLElement>(selector)?.focus();
    });
  }
  /** @ignore */
  private queueDayFocus(): void {
    this.queueCellFocus('.ui-datepicker-day._focusable');
  }
  /** @ignore */
  private queueMonthFocus(): void {
    this.queueCellFocus('.ui-datepicker-picker._month .ui-datepicker-cell._focusable');
  }
  /** @ignore */
  private queueYearFocus(): void {
    this.queueCellFocus('.ui-datepicker-picker._year .ui-datepicker-cell._focusable');
  }

  /** @ignore */
  private clampToRange(date: Date): Date {
    const min = this.resolvedMinDate();
    const max = this.resolvedMaxDate();
    if (min && date < startOfDay(min)) return startOfDay(min);
    if (max && date > startOfDay(max)) return startOfDay(max);
    return date;
  }

  /** @ignore */
  private isDateDisabled(date: Date): boolean {
    const min = this.resolvedMinDate();
    const max = this.resolvedMaxDate();
    if (min && date < startOfDay(min)) return true;
    if (max && date > startOfDay(max)) return true;
    if ((this.disabledDays() ?? []).includes(date.getDay())) return true;
    return this.resolvedDisabledDates().some((d) => isSameDay(d, date));
  }

  /** @ignore Whole month out of [min, max]. */
  private isMonthDisabled(year: number, month: number): boolean {
    const min = this.resolvedMinDate();
    const max = this.resolvedMaxDate();
    if (min && new Date(year, month + 1, 0) < startOfDay(min)) return true;
    if (max && new Date(year, month, 1) > startOfDay(max)) return true;
    return false;
  }

  /** @ignore Whole year out of [min, max]. */
  private isYearDisabled(year: number): boolean {
    const min = this.resolvedMinDate();
    const max = this.resolvedMaxDate();
    if (min && year < min.getFullYear()) return true;
    if (max && year > max.getFullYear()) return true;
    return false;
  }

  /** @ignore */
  private capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
