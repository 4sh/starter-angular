/**
 * TestBed spec for `ui-datepicker`'s keyboard-entry masking (FSHSP-118). Follows the pattern
 * from `ui-select.spec.ts`/`ui-autocomplete.spec.ts`: a minimal host component +
 * `TestBed.configureTestingModule`, native `input` events dispatched directly on the trigger's
 * `<input>` — set the raw value + caret, dispatch `input`, flush CD — mirroring exactly what a
 * real keystroke does (`ui-datepicker` reads `nativeInputElement().value`/`.selectionStart`
 * itself in `onTriggerInput`, not anything carried on the event).
 *
 * Scope: the three behaviors chased down (and initially mis-fixed) across FSHSP-118 —
 * `hasValue()`-gated mask on/off, the `enforceBounds`/`dataEnd` deletion fixes, and re-arming the
 * mask on a manual clear — plus `range`'s own live mask (added later, same gating). Not covered
 * here: `multiple` typed parsing (no live mask — unbounded date count, see the component doc) or
 * the format-hint/placeholder derivation.
 */
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { UiDatepicker } from './ui-datepicker';

@Component({
  imports: [ReactiveFormsModule, UiDatepicker],
  // `locale="fr-FR"` pins the field order to day/month/year for deterministic assertions,
  // independent of whatever `LOCALE_ID` the test environment resolves by default.
  template: `<ui-datepicker
    label="Date"
    valueType="date"
    locale="fr-FR"
    [formControl]="control"
  />`,
})
class DatepickerHost {
  readonly control = new FormControl<Date | null>(null);
}

@Component({
  imports: [ReactiveFormsModule, UiDatepicker],
  template: `<ui-datepicker
    label="Période"
    valueType="date"
    locale="fr-FR"
    selectionMode="range"
    [formControl]="control"
  />`,
})
class DatepickerRangeHost {
  readonly control = new FormControl<Date[] | null>(null);
}

async function setup(initial: Date | null = null) {
  await TestBed.configureTestingModule({ imports: [DatepickerHost] }).compileComponents();
  const fixture: ComponentFixture<DatepickerHost> = TestBed.createComponent(DatepickerHost);
  const host = fixture.componentInstance;
  if (initial) host.control.setValue(initial);
  fixture.detectChanges();
  await fixture.whenStable();
  const input = fixture.nativeElement.querySelector(
    '.ui-datepicker-trigger input.ui-input-native',
  ) as HTMLInputElement;
  return { fixture, host, input };
}

/** Same as {@link setup}, for the `range`-mode host (own component: `selectionMode` is a
 *  static template attribute, not reactively settable on the single-mode host). */
async function setupRange(initial: Date[] | null = null) {
  await TestBed.configureTestingModule({ imports: [DatepickerRangeHost] }).compileComponents();
  const fixture: ComponentFixture<DatepickerRangeHost> = TestBed.createComponent(
    DatepickerRangeHost,
  );
  const host = fixture.componentInstance;
  if (initial) host.control.setValue(initial);
  fixture.detectChanges();
  await fixture.whenStable();
  const input = fixture.nativeElement.querySelector(
    '.ui-datepicker-trigger input.ui-input-native',
  ) as HTMLInputElement;
  return { fixture, host, input };
}

/** Mirrors a single native keystroke: sets the raw value + caret, dispatches `input`, flushes CD. */
async function typeInto(
  input: HTMLInputElement,
  value: string,
  caret: number,
  fixture: ComponentFixture<unknown>,
) {
  input.value = value;
  input.setSelectionRange(caret, caret);
  input.dispatchEvent(new Event('input', { bubbles: true }));
  fixture.detectChanges();
  await fixture.whenStable();
}

/**
 * Types each character of `text` one at a time at the end of the field — the mask reacts
 * per-keystroke, not to a value set in one go, so a real user's sequential typing has to be
 * simulated as such rather than dispatching the final string directly. Using a plain digit
 * prefix at every step (rather than replaying the mask's own auto-inserted separators) is
 * equivalent: `extractMaskData` strips punctuation before the code under test ever sees it, and
 * the caret is always placed at the logical end of whatever's provided either way.
 */
async function typeSequentially(
  input: HTMLInputElement,
  text: string,
  fixture: ComponentFixture<unknown>,
) {
  for (let i = 1; i <= text.length; i++) {
    await typeInto(input, text.slice(0, i), i, fixture);
  }
}

describe('UiDatepicker — keyboard entry masking (FSHSP-118)', () => {
  describe('mask on/off gated by hasValue (single mode)', () => {
    it('auto-formats while constructing a date from an empty field', async () => {
      const { input, fixture } = await setup();
      await typeSequentially(input, '08072026', fixture);
      expect(input.value).toBe('08/07/2026');
    });

    it('does not auto-format once a value already exists — plain text editing instead', async () => {
      const { input, fixture } = await setup(new Date(2026, 6, 8));
      expect(input.value).toBe('08/07/2026');
      // A single raw digit string, no slashes: if the mask were still on, it would reformat
      // this into "01/01/1999". Off, it's echoed back verbatim — plain text editing.
      await typeInto(input, '01011999', 8, fixture);
      expect(input.value).toBe('01011999');
    });
  });

  // Both fixes only ever engage in the masked branch, i.e. while hasValue() is still false —
  // constructing a date from an empty field, never committed/blurred yet.
  describe('enforceBounds / dataEnd deletion fixes', () => {
    it('does not scramble digits across segments when deleting mid-string', async () => {
      const { input, fixture } = await setup();
      await typeSequentially(input, '08072026', fixture);
      expect(input.value).toBe('08/07/2026');
      // Forward-delete the leading '0' of the day (caret at position 0, browser already
      // removed it): the residual stream "8072026" used to have its bounds check reject the
      // leading '8' (no valid 1-31 day starts with it) and reassign month/year's digits to
      // the wrong segment, producing "07/02/6" — day/month/year no longer matching anything
      // the user typed. Fixed: each segment keeps its own positional slice instead.
      await typeInto(input, '8/07/2026', 0, fixture);
      expect(input.value).toBe('80/72/026');
      expect(input.value).not.toBe('07/02/6');
    });

    it('does not get stuck backspacing through a completed segment', async () => {
      const { input, fixture } = await setup();
      await typeSequentially(input, '20082020', fixture);
      expect(input.value).toBe('20/08/2020');

      // Regression: this exact sequence used to stall at "20/08/" — the auto-inserted "/"
      // between month and year parked the caret just after itself, so the next Backspace
      // deleted that decorative separator instead of a digit, and it was silently
      // re-inserted next render (the field looked frozen one keystroke short of empty).
      const expected = ['20/08/202', '20/08/20', '20/08/2', '20/08/', '20/0', '20/', '2', ''];
      let caret = input.value.length;
      for (const expectedValue of expected) {
        const next = input.value.slice(0, caret - 1) + input.value.slice(caret);
        await typeInto(input, next, caret - 1, fixture);
        expect(input.value).toBe(expectedValue);
        caret = input.selectionStart ?? input.value.length;
      }
    });
  });

  describe('mask re-arms once the field reads empty (no blur needed)', () => {
    it('re-enables the auto-"/" mask immediately after a manual clear, before any blur', async () => {
      const { input, fixture } = await setup(new Date(2026, 6, 8));
      expect(input.value).toBe('08/07/2026');

      // Clear by hand — no blur/Enter dispatched anywhere in this test, and no clear cross
      // either: the field just reads empty. Without this fix, hasValue() (and so the mask)
      // would stay off until a real commit happened, e.g. on blur.
      await typeInto(input, '', 0, fixture);
      expect(input.value).toBe('');

      await typeSequentially(input, '08072026', fixture);
      expect(input.value).toBe('08/07/2026');
    });
  });

  // FSHSP-118 follow-up: `range` reuses the same live mask (own describe block, own host — it
  // never applied before this, see `typingSlots`).
  describe('range mode also gets the live auto-"/" mask (mask-engine follow-up)', () => {
    it('auto-formats both dates, joined by " - ", while constructing a fresh range', async () => {
      const { input, fixture } = await setupRange();
      await typeSequentially(input, '0807202618072026', fixture);
      expect(input.value).toBe('08/07/2026 - 18/07/2026');
    });

    it('does not auto-format once a complete range already exists — plain text instead', async () => {
      const { input, fixture } = await setupRange([new Date(2026, 6, 8), new Date(2026, 6, 18)]);
      expect(input.value).toBe('08/07/2026 – 18/07/2026'); // en dash: displayValue, not the mask
      // Same probe as the single-mode equivalent above: a raw digit string, if the mask were
      // still on, would get reformatted instead of echoed back verbatim.
      await typeInto(input, '0101199901012000', 16, fixture);
      expect(input.value).toBe('0101199901012000');
    });
  });
});
