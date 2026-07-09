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
import { FormsModule, NG_VALUE_ACCESSOR } from '@angular/forms';
import { ConnectedPosition, OverlayModule } from '@angular/cdk/overlay';
import { BaseFormField } from '@app/shared/components/ui/forms/base-form-field';
import { UiInput } from '@app/shared/components/ui/forms/ui-input/ui-input';
import { UiButton } from '@app/shared/components/ui/actions/ui-button/ui-button';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';

export type DatepickerHourFormat = '12' | '24';
/** Base picking granularity — also the drill-down levels of the panel. */
export type DatepickerView = 'date' | 'month' | 'year';
/** Selection quantity. */
export type DatepickerSelectionMode = 'single' | 'multiple' | 'range';
/** Model value: single `Date`, or a `Date[]` for `multiple`/`range` (`[start, end]`). */
export type DatepickerValue = Date | Date[] | null;

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

// --- Pure date helpers (module-level, side-effect free) ----------------

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
function firstOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
function isSameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  if (!a || !b) return false;
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}
function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
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
 * Value is `Date | Date[] | null`, wired through `ControlValueAccessor` on
 * {@link BaseFormField} (shared label / helper / level / validation / states).
 *
 * Customisation: `panelStyleClass`, the `#date` cell template
 * (`let-date let-selected="selected"`) and the `#buttonbar` template
 * (`let-todayCallback let-clearCallback`), plus the local SCSS variables.
 */
@Component({
  selector: 'ui-datepicker',
  imports: [NgTemplateOutlet, FormsModule, OverlayModule, UiInput, UiButton, UiIcon],
  templateUrl: './ui-datepicker.html',
  styleUrl: './ui-datepicker.scss',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => UiDatepicker), multi: true }],
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
  /** Show a clear (×) button in the trigger when a value is set. */
  showClear = input(false, { transform: booleanAttribute });

  /** Selection quantity: `single` (default), `multiple` or `range`. */
  selectionMode = input<DatepickerSelectionMode>('single');
  /** Base picking granularity: `date` (default), `month` (MonthPicker) or `year` (YearPicker). */
  view = input<DatepickerView>('date');
  /** Number of month panels shown side-by-side (date view only). */
  numberOfMonths = input<number, unknown>(1, { transform: numberAttribute });

  /** Earliest selectable date (inclusive). */
  minDate = input<Date | null>(null);
  /** Latest selectable date (inclusive). */
  maxDate = input<Date | null>(null);
  /** Individual dates to disable. */
  disabledDates = input<Date[]>([]);
  /** Week days to disable (0 = Sunday … 6 = Saturday). */
  disabledDays = input<number[]>([]);

  /** First day of the week (0 = Sunday … 6 = Saturday). Defaults to Monday. */
  firstDayOfWeek = input<number, unknown>(1, { transform: numberAttribute });
  /** BCP-47 locale for names and default formatting. Defaults to `LOCALE_ID`. */
  locale = input<string>();
  /** Custom display formatter for a single date (overrides the default `Intl` format). */
  dateFormat = input<(date: Date) => string>();

  /** Enable the time selection row. */
  showTime = input(false, { transform: booleanAttribute });
  /** Time-only mode: hide the calendar, keep the time row. */
  timeOnly = input(false, { transform: booleanAttribute });
  /** 12h (AM/PM) or 24h clock. */
  hourFormat = input<DatepickerHourFormat>('24');
  /** Minute increment of the time stepper. */
  stepMinute = input<number, unknown>(1, { transform: numberAttribute });

  /** Show the bottom button bar (Today / Clear) — or the `#buttonbar` template. */
  showButtonBar = input(false, { transform: booleanAttribute });
  /** Label of the default "Today" button. */
  todayLabel = input<string>("Aujourd'hui");
  /** Label of the default "Clear" button. */
  clearLabel = input<string>('Effacer');

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
  /** Emitted when a date/month/year is picked. */
  dateSelect = output<Date>();
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

  /** @ignore */
  private readonly localeId = inject(LOCALE_ID);
  /** @ignore */
  private readonly triggerInput = viewChild<UiInput>('trigger');
  /** @ignore Trigger host (to anchor the overlay on the input box, not the helper). */
  private readonly triggerRef = viewChild<UiInput, ElementRef<HTMLElement>>('trigger', { read: ElementRef });
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
  /** @ignore Time components. */
  protected readonly hours = signal(0);
  protected readonly minutes = signal(0);

  /** @ignore Below the trigger, flipping above when `autoFlip` and space is lacking. */
  protected readonly overlayPositions = computed<ConnectedPosition[]>(() => {
    const below: ConnectedPosition = { originX: 'start', originY: 'bottom', overlayX: 'start', overlayY: 'top', offsetY: 8 };
    const above: ConnectedPosition = { originX: 'start', originY: 'top', overlayX: 'start', overlayY: 'bottom', offsetY: -8 };
    return this.autoFlip() ? [below, above] : [below];
  });

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
  /** @ignore The panel is visible. */
  protected readonly showPanel = computed(() => this.inline() || this.panelOpen());
  /** @ignore Day grid shown (hidden in `timeOnly`). */
  protected readonly showCalendar = computed(() => !this.timeOnly());
  /** @ignore Single-month layout enables the drill-down header + roving focus. */
  protected readonly singleMonth = computed(() => Math.max(1, this.numberOfMonths()) === 1);

  /** @ignore A value is currently set. */
  protected readonly hasValue = computed(() => this.selectedDates().length > 0);
  /** @ignore The trigger's right action clears the value (instead of toggling the panel). */
  protected readonly showClearButton = computed(
    () => this.showClear() && this.hasValue() && !this.isDisabled() && !this.readonly(),
  );
  /** @ignore Right-side icon: clear (×) when clearable + set, else the calendar/clock toggle. */
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

  // --- Selection helpers ----------------------------------------------

  /** @ignore Flatten the model to a list of selected dates. */
  private readonly selectedDates = computed<Date[]>(() => {
    const v = this.modelValue();
    if (!v) return [];
    return (Array.isArray(v) ? v : [v]).filter((d): d is Date => d instanceof Date);
  });
  /** @ignore First selected date (for view seeding / time / display). */
  private firstSelectedFrom(value: DatepickerValue): Date | null {
    if (!value) return null;
    const arr = Array.isArray(value) ? value : [value];
    return arr.find((d) => d instanceof Date) ?? null;
  }

  // --- Display ---------------------------------------------------------

  /** @ignore */
  private formatDate(date: Date): string {
    const custom = this.dateFormat();
    if (custom) return custom(date);
    const options: Intl.DateTimeFormatOptions = this.showTime()
      ? { dateStyle: 'medium', timeStyle: 'short' }
      : { dateStyle: 'medium' };
    return new Intl.DateTimeFormat(this.resolvedLocale(), options).format(date);
  }

  /** @ignore Value rendered in the trigger. */
  protected override readonly displayValue = computed(() => {
    const dates = this.selectedDates();
    if (!dates.length) return '';
    const base = this.view();
    if (base === 'month') {
      return this.capitalize(
        new Intl.DateTimeFormat(this.resolvedLocale(), { month: 'long', year: 'numeric' }).format(dates[0]),
      );
    }
    if (base === 'year') return String(dates[0].getFullYear());

    if (this.timeOnly()) {
      return new Intl.DateTimeFormat(this.resolvedLocale(), { timeStyle: 'short' }).format(dates[0]);
    }
    const mode = this.selectionMode();
    if (mode === 'multiple') return dates.map((d) => this.formatDate(d)).join(', ');
    if (mode === 'range') return dates.map((d) => this.formatDate(d)).join(' – ');
    return this.formatDate(dates[0]);
  });

  // --- Header ----------------------------------------------------------

  /** @ignore Displayed decade start (year view). */
  private readonly decadeStart = computed(() => Math.floor(this.viewDate().getFullYear() / 10) * 10);

  /** @ignore Header label depends on the active view. */
  protected readonly headerLabel = computed(() => {
    const v = this.currentView();
    if (v === 'year') return `${this.decadeStart()} - ${this.decadeStart() + 9}`;
    if (v === 'month') return String(this.viewDate().getFullYear());
    return this.capitalize(
      new Intl.DateTimeFormat(this.resolvedLocale(), { month: 'long', year: 'numeric' }).format(this.viewDate()),
    );
  });

  // --- Weekday headers -------------------------------------------------

  /** @ignore */
  protected readonly weekDayNames = computed(() => {
    const fmt = new Intl.DateTimeFormat(this.resolvedLocale(), { weekday: 'short' });
    const sunday = new Date(2023, 0, 1); // getDay() === 0
    const first = this.firstDayOfWeek();
    return Array.from({ length: 7 }, (_, k) => this.capitalize(fmt.format(addDays(sunday, (first + k) % 7))));
  });

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
      return { year, selected: sel.some((d) => d.getFullYear() === year), disabled: this.isYearDisabled(year) };
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
    // Keep time signals in sync with the (first) value.
    effect(() => {
      const first = this.firstSelectedFrom(this.modelValue() ?? null);
      untracked(() => {
        if (first) {
          this.hours.set(first.getHours());
          this.minutes.set(first.getMinutes());
        }
      });
    });
  }

  override writeValue(value: DatepickerValue): void {
    this.modelValue.set(value ?? undefined);
    const first = this.firstSelectedFrom(value);
    if (first) {
      this.viewDate.set(firstOfMonth(first));
      this.focusedDate.set(startOfDay(first));
    }
  }

  // --- Panel open/close ------------------------------------------------

  open(): void {
    if (this.inline() || this.isDisabled() || this.readonly() || this.panelOpen()) return;
    const base = this.firstSelectedFrom(this.modelValue() ?? null) ?? startOfDay(new Date());
    this.viewDate.set(firstOfMonth(base));
    this.currentView.set(this.view());
    this.focusedDate.set(this.clampToRange(startOfDay(base)));
    this.overlayOrigin.set(this.resolveOverlayOrigin());
    this.panelOpen.set(true);
    this.opened.emit();
    if (this.showCalendar() && this.currentView() === 'date') this.queueDayFocus();
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
    if (event.key === 'ArrowDown' || event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      this.open();
    } else if (event.key === 'Escape') {
      this.close();
    }
  }

  // --- Header interactions --------------------------------------------

  /** @ignore Click the header title → drill up (date → month → year). Single-month only. */
  protected onHeaderClick(): void {
    if (!this.singleMonth()) return;
    const v = this.currentView();
    if (v === 'date') this.currentView.set('month');
    else if (v === 'month') this.currentView.set('year');
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
    else if (v === 'month') this.viewDate.set(new Date(this.viewDate().getFullYear() + dir, this.viewDate().getMonth(), 1));
    else this.viewDate.set(new Date(this.viewDate().getFullYear() + dir * 10, this.viewDate().getMonth(), 1));
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
    let value: DatepickerValue;
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
    this.dateSelect.emit(picked);
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
      this.dateSelect.emit(d);
      if (this.closeOnSelect() && !this.inline()) this.close();
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
      this.dateSelect.emit(d);
      if (this.closeOnSelect() && !this.inline()) this.close();
    } else {
      this.currentView.set('month');
    }
  }

  /** @ignore Apply the time signals to the value (single selection only). */
  protected applyTime(): void {
    if (this.selectionMode() !== 'single') return;
    const base = this.firstSelectedFrom(this.modelValue() ?? null) ?? startOfDay(this.timeOnly() ? new Date() : this.viewDate());
    const next = new Date(base);
    next.setHours(this.hours(), this.minutes(), 0, 0);
    this.commit(next);
  }

  /** @ignore Zero-padded labels for the steppers. */
  protected readonly hoursLabel = computed(() =>
    this.pad(this.hourFormat() === '12' ? this.displayHours() : this.hours()),
  );
  protected readonly minutesLabel = computed(() => this.pad(this.minutes()));

  /** @ignore Step hours (wraps 0↔23; also flips meridiem across the 12h boundary). */
  protected stepHours(dir: 1 | -1): void {
    this.hours.set((((this.hours() + dir) % 24) + 24) % 24);
    this.applyTime();
  }
  /** @ignore Step minutes by `stepMinute` (wraps 0↔59). */
  protected stepMinutes(dir: 1 | -1): void {
    const step = Math.max(1, this.stepMinute());
    this.minutes.set((((this.minutes() + dir * step) % 60) + 60) % 60);
    this.applyTime();
  }
  /** @ignore */
  protected toggleMeridiem(): void {
    this.hours.set((this.hours() + 12) % 24);
    this.applyTime();
  }

  /** @ignore ARIA spinbutton keyboard: ↑/↓ step, PageUp/PageDown ±. */
  protected onHourKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp' || event.key === 'PageUp') (event.preventDefault(), this.stepHours(1));
    else if (event.key === 'ArrowDown' || event.key === 'PageDown') (event.preventDefault(), this.stepHours(-1));
  }
  /** @ignore */
  protected onMinuteKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp' || event.key === 'PageUp') (event.preventDefault(), this.stepMinutes(1));
    else if (event.key === 'ArrowDown' || event.key === 'PageDown') (event.preventDefault(), this.stepMinutes(-1));
  }
  /** @ignore */
  protected onMeridiemKeydown(event: KeyboardEvent): void {
    if (event.key === 'ArrowUp' || event.key === 'ArrowDown') (event.preventDefault(), this.toggleMeridiem());
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
    this.dateSelect.emit(today);
    this.viewDate.set(firstOfMonth(today));
    this.focusedDate.set(today);
    if (this.closeOnSelect() && !this.showTime() && !this.inline() && this.selectionMode() !== 'multiple') this.close();
  }

  /** @ignore */
  protected clear(): void {
    this.commit(null);
    this.cleared.emit();
  }

  // --- Grid keyboard navigation (roving focus, date view, single month) --

  /** @ignore */
  protected onGridKeydown(event: KeyboardEvent): void {
    const current = this.focusedDate();
    let next: Date | null = null;
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
    if (next.getMonth() !== current.getMonth() || next.getFullYear() !== current.getFullYear()) {
      this.viewDate.set(firstOfMonth(next));
    }
    this.queueDayFocus();
  }

  /** @ignore */
  protected isFocusableDay(cell: DatepickerDay): boolean {
    return isSameDay(cell.date, this.focusedDate());
  }

  // --- Internals -------------------------------------------------------

  /** @ignore */
  private commit(value: DatepickerValue): void {
    this.modelValue.set(value ?? undefined);
    this.emitChange(value);
    this.valueChange.emit(value);
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
      if (s && isSameDay(date, s)) (rangeStart = true), (selected = true);
      if (e && isSameDay(date, e)) (rangeEnd = true), (selected = true);
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

  /** @ignore */
  private queueDayFocus(): void {
    if (typeof requestAnimationFrame === 'undefined') return;
    requestAnimationFrame(() => {
      this.panelEl()?.nativeElement.querySelector<HTMLElement>('.ui-datepicker-day._focusable')?.focus();
    });
  }

  /** @ignore */
  private clampToRange(date: Date): Date {
    const min = this.minDate();
    const max = this.maxDate();
    if (min && date < startOfDay(min)) return startOfDay(min);
    if (max && date > startOfDay(max)) return startOfDay(max);
    return date;
  }

  /** @ignore */
  private isDateDisabled(date: Date): boolean {
    const min = this.minDate();
    const max = this.maxDate();
    if (min && date < startOfDay(min)) return true;
    if (max && date > startOfDay(max)) return true;
    if ((this.disabledDays() ?? []).includes(date.getDay())) return true;
    return (this.disabledDates() ?? []).some((d) => isSameDay(d, date));
  }

  /** @ignore Whole month out of [min, max]. */
  private isMonthDisabled(year: number, month: number): boolean {
    const min = this.minDate();
    const max = this.maxDate();
    if (min && new Date(year, month + 1, 0) < startOfDay(min)) return true;
    if (max && new Date(year, month, 1) > startOfDay(max)) return true;
    return false;
  }

  /** @ignore Whole year out of [min, max]. */
  private isYearDisabled(year: number): boolean {
    const min = this.minDate();
    const max = this.maxDate();
    if (min && year < min.getFullYear()) return true;
    if (max && year > max.getFullYear()) return true;
    return false;
  }

  /** @ignore */
  private capitalize(s: string): string {
    return s.charAt(0).toUpperCase() + s.slice(1);
  }
}
