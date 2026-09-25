/**
 * TestBed spec for `ui-input-date` (FSHSP-209). What is worth asserting here is the three
 * things that justify a component of its own rather than a type on `ui-input`: it emits on
 * `change` and never mid-entry, it commits to a value SHAPE, and it keeps the label raised
 * over the template the browser draws.
 *
 * Same host pattern as `ui-input.spec.ts`.
 */
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { describe, expect, it, vi } from 'vitest';
import { InputDateMode, InputDateValue, InputDateValueType, UiInputDate } from './ui-input-date';

@Component({
  imports: [FormsModule, UiInputDate],
  template: `<ui-input-date
    [label]="label()"
    [mode]="mode()"
    [valueType]="valueType()"
    [floatLabel]="'on'"
    [min]="min()"
    [icon]="icon()"
    [showIcon]="showIcon()"
    [readonly]="readonly()"
    [(ngModel)]="value"
  />`,
})
class DateHost {
  readonly label = signal<string | undefined>('Date');
  readonly mode = signal<InputDateMode>('date');
  readonly valueType = signal<InputDateValueType>('date');
  readonly min = signal<Date | string | undefined>(undefined);
  readonly icon = signal<string | undefined>(undefined);
  readonly showIcon = signal(true);
  readonly readonly = signal(false);
  value: InputDateValue = null;
}

async function setup(initialValue: InputDateValue = null) {
  await TestBed.configureTestingModule({ imports: [DateHost] }).compileComponents();
  const fixture: ComponentFixture<DateHost> = TestBed.createComponent(DateHost);
  fixture.componentInstance.value = initialValue;
  fixture.detectChanges();
  await fixture.whenStable();
  // A second pass, on purpose: `ngModel` writes the initial value asynchronously, so the
  // `[value]` binding only picks it up on the NEXT change detection. Without this, a test
  // starting from a value reads an empty control and blames the component.
  fixture.detectChanges();
  await fixture.whenStable();
  const input = () => fixture.nativeElement.querySelector('input') as HTMLInputElement;
  const field = () => fixture.nativeElement.querySelector('.ui-field') as HTMLElement;
  const action = () =>
    fixture.nativeElement.querySelector('.ui-input-date-action') as HTMLButtonElement | null;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  /** Types a value the way the browser does: `input` while editing, `change` once committed. */
  const commit = async (raw: string) => {
    input().value = raw;
    input().dispatchEvent(new Event('input'));
    input().dispatchEvent(new Event('change'));
    await settle();
  };
  return { fixture, host: fixture.componentInstance, input, field, action, settle, commit };
}

describe('ui-input-date', () => {
  it.each([
    ['date', 'date'],
    ['time', 'time'],
    ['datetime', 'datetime-local'],
  ] as const)('renders the native control of mode %s', async (mode, nativeType) => {
    const { host, input, settle } = await setup();
    host.mode.set(mode);
    await settle();
    expect(input().type).toBe(nativeType);
  });

  // The browser draws its own `jj/mm/aaaa` template: a label at rest would land on it.
  it.each(['date', 'time', 'datetime'] as const)(
    'keeps the label raised on an empty %s field',
    async (mode) => {
      const { host, input, field, settle } = await setup();
      host.mode.set(mode);
      await settle();
      expect(input().value).toBe('');
      expect(field().className).toContain('_filled');
    },
  );

  // The reason this is not a type on `ui-input`: a native temporal control blanks its own
  // value while the entry is incomplete, so `input` carries a burst of empty strings.
  it('stays silent on `input` and only commits on `change`', async () => {
    const { host, input, settle } = await setup();

    input().value = '';
    input().dispatchEvent(new Event('input'));
    await settle();
    expect(host.value).toBeNull();

    input().value = '2026-09-14';
    input().dispatchEvent(new Event('input'));
    await settle();
    expect(host.value).toBeNull();

    input().dispatchEvent(new Event('change'));
    await settle();
    expect(host.value).toBeInstanceOf(Date);
  });

  it('emits a Date at midnight in `date` valueType', async () => {
    const { host, commit } = await setup();
    await commit('2026-09-14');

    const value = host.value as Date;
    expect(value.getFullYear()).toBe(2026);
    expect(value.getMonth()).toBe(8);
    expect(value.getDate()).toBe(14);
    expect(value.getHours()).toBe(0);
  });

  it('emits the ISO string in `iso` valueType, per mode', async () => {
    const { host, settle, commit } = await setup();
    host.valueType.set('iso');
    await settle();

    await commit('2026-09-14');
    expect(host.value).toBe('2026-09-14');

    host.mode.set('datetime');
    await settle();
    await commit('2026-09-14T09:30');
    expect(host.value).toBe('2026-09-14T09:30');

    host.mode.set('time');
    await settle();
    await commit('09:30');
    expect(host.value).toBe('09:30');
  });

  // Only the emitted side commits to a shape: a form may hand back either one.
  // (One `setup` per test — `TestBed` refuses a second configuration.)
  it('accepts an ISO string on write', async () => {
    const { input } = await setup('2026-09-14');
    expect(input().value).toBe('2026-09-14');
  });

  it('accepts a Date on write', async () => {
    const { input } = await setup(new Date(2026, 8, 14));
    expect(input().value).toBe('2026-09-14');
  });

  it('carries a bare time on today, like ui-datepicker in timeOnly', async () => {
    const { host, settle, commit } = await setup();
    host.mode.set('time');
    await settle();
    await commit('09:30');

    const value = host.value as Date;
    const today = new Date();
    expect(value.getHours()).toBe(9);
    expect(value.getMinutes()).toBe(30);
    expect(value.getDate()).toBe(today.getDate());
  });

  it('emits null when the field is cleared', async () => {
    const { host, commit } = await setup(new Date(2026, 8, 14));
    await commit('');
    expect(host.value).toBeNull();
  });

  // The button is what makes this field look like `ui-datepicker`'s trigger: the browser's own
  // indicator is hidden, so this markup IS the affordance.
  it.each([
    ['date', 'fa-calendar'],
    ['datetime', 'fa-calendar'],
    ['time', 'fa-clock'],
  ] as const)('renders the picker button with the %s icon', async (mode, iconClass) => {
    const { host, action, settle } = await setup();
    host.mode.set(mode);
    await settle();
    expect(action()?.querySelector('i')?.className).toContain(iconClass);
  });

  it('replaces the glyph through `icon`', async () => {
    const { host, action, settle } = await setup();
    host.icon.set('calendar-day');
    await settle();
    expect(action()?.querySelector('i')?.className).toContain('fa-calendar-day');
  });

  it('drops the button on `showIcon=false`', async () => {
    const { host, action, settle } = await setup();
    host.showIcon.set(false);
    await settle();
    expect(action()).toBeNull();
  });

  // Not a tab stop: the native control already opens its own picker from the keyboard, so a
  // focusable button would only add one redundant stop per field.
  it('keeps the button out of the tab order and names it', async () => {
    const { action } = await setup();
    expect(action()?.getAttribute('tabindex')).toBe('-1');
    expect(action()?.getAttribute('aria-label')).toBe('Ouvrir le calendrier');
  });

  it('opens the system picker on click, and stays shut when readonly', async () => {
    const { host, input, action, settle } = await setup();
    const showPicker = vi.fn();
    (input() as HTMLInputElement & { showPicker: () => void }).showPicker = showPicker;

    action()?.click();
    expect(showPicker).toHaveBeenCalledTimes(1);

    host.readonly.set(true);
    await settle();
    action()?.click();
    expect(showPicker).toHaveBeenCalledTimes(1);
  });

  it('serializes a Date bound to the native attribute', async () => {
    const { host, input, settle } = await setup();
    host.min.set(new Date(2026, 0, 1));
    await settle();
    expect(input().getAttribute('min')).toBe('2026-01-01');

    host.min.set('2026-02-01');
    await settle();
    expect(input().getAttribute('min')).toBe('2026-02-01');
  });
});
