/**
 * TestBed spec for `ui-datepicker`'s keyboard-entry masking (FSHSP-118), pattern from
 * `ui-select.spec.ts`: native `input` events dispatched on the trigger's `<input>` — set value +
 * caret, dispatch, flush CD — mirroring a real keystroke.
 *
 * Covers: `hasValue()`-gated mask on/off (`single` and `range`), the `enforceBounds`/`dataEnd`
 * deletion fixes, re-arming the mask on a manual clear, the in-place-edit suspension and the
 * custom-`dateFormat` field order, which trigger clicks open the panel
 * , and the opening keys / `showOnFocus`. Not covered: `multiple` (no
 * live mask) or the format-hint derivation.
 *
 * The panel is rendered through a `cdkConnectedOverlay`, so once opened it lives in the global
 * overlay container under `document.body`, not in `fixture.nativeElement` — as in
 * `ui-select.spec.ts`, assertions on it query `document` directly.
 */
import { Component } from '@angular/core';
import { FocusMonitor } from '@angular/cdk/a11y';
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

/** `dateFormat` in `fr-FR` (day-first) with NO `locale` and NO `parseDate` — so `LOCALE_ID`
 *  stays whatever the environment resolves (`en-US` here, month-first). The exact shape of the
 *  demo stories that surfaced FSHSP-179. */
@Component({
  imports: [ReactiveFormsModule, UiDatepicker],
  template: `<ui-datepicker
    label="Date"
    valueType="date"
    [dateFormat]="dateFormat"
    [formControl]="control"
  />`,
})
class DatepickerCustomFormatHost {
  readonly control = new FormControl<Date | null>(null);
  readonly dateFormat = (d: Date): string =>
    new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(d);
}

/** Non-typeable trigger (`allowInput=false`): the field itself is the affordance, so it keeps
 *  opening the panel on click. */
@Component({
  imports: [ReactiveFormsModule, UiDatepicker],
  template: `<ui-datepicker
    label="Date"
    valueType="date"
    locale="fr-FR"
    [allowInput]="false"
    [formControl]="control"
  />`,
})
class DatepickerReadonlyTriggerHost {
  readonly control = new FormControl<Date | null>(null);
}

/** Typeable but icon-less (`showIcon=false`): nothing else could open the panel with a mouse,
 *  so the click keeps doing it. */
@Component({
  imports: [ReactiveFormsModule, UiDatepicker],
  template: `<ui-datepicker
    label="Date"
    valueType="date"
    locale="fr-FR"
    [showIcon]="false"
    [formControl]="control"
  />`,
})
class DatepickerNoIconHost {
  readonly control = new FormControl<Date | null>(null);
}

/** `showOnFocus` on an otherwise default (typeable, icon-bearing) field. */
@Component({
  imports: [ReactiveFormsModule, UiDatepicker],
  template: `<ui-datepicker
    label="Date"
    valueType="date"
    locale="fr-FR"
    [showOnFocus]="true"
    [formControl]="control"
  />`,
})
class DatepickerShowOnFocusHost {
  readonly control = new FormControl<Date | null>(null);
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
  const fixture: ComponentFixture<DatepickerRangeHost> =
    TestBed.createComponent(DatepickerRangeHost);
  const host = fixture.componentInstance;
  if (initial) host.control.setValue(initial);
  fixture.detectChanges();
  await fixture.whenStable();
  const input = fixture.nativeElement.querySelector(
    '.ui-datepicker-trigger input.ui-input-native',
  ) as HTMLInputElement;
  return { fixture, host, input };
}

/** Same as {@link setup}, for the custom-`dateFormat` host (own component, same reason). */
async function setupCustomFormat() {
  await TestBed.configureTestingModule({
    imports: [DatepickerCustomFormatHost],
  }).compileComponents();
  const fixture: ComponentFixture<DatepickerCustomFormatHost> = TestBed.createComponent(
    DatepickerCustomFormatHost,
  );
  fixture.detectChanges();
  await fixture.whenStable();
  const input = fixture.nativeElement.querySelector(
    '.ui-datepicker-trigger input.ui-input-native',
  ) as HTMLInputElement;
  return { fixture, host: fixture.componentInstance, input };
}

/** Same as {@link setup}, for a host whose only difference is static template inputs. */
async function setupHost<T>(host: new () => T) {
  await TestBed.configureTestingModule({ imports: [host] }).compileComponents();
  const fixture: ComponentFixture<T> = TestBed.createComponent(host);
  fixture.detectChanges();
  await fixture.whenStable();
  const trigger = fixture.nativeElement.querySelector('.ui-datepicker-trigger') as HTMLElement;
  const input = trigger.querySelector('input.ui-input-native') as HTMLInputElement;
  const icon = trigger.querySelector('.ui-input-action') as HTMLButtonElement | null;
  return { fixture, trigger, input, icon };
}

/** Focuses `el` the way a user would (the origin is what `showOnFocus` gates on), flushes CD. */
async function focusVia(
  el: HTMLElement,
  origin: 'keyboard' | 'mouse' | 'program',
  fixture: ComponentFixture<unknown>,
) {
  TestBed.inject(FocusMonitor).focusVia(el, origin);
  fixture.detectChanges();
  await fixture.whenStable();
}

function panel(): HTMLElement | null {
  return document.querySelector('.ui-datepicker-panel');
}
/** Clicks `el` and flushes CD. */
async function click(el: HTMLElement, fixture: ComponentFixture<unknown>) {
  el.click();
  fixture.detectChanges();
  await fixture.whenStable();
}
/** Dispatches a `keydown` on `el`, flushes CD, and hands the event back, whether it was
 *  `preventDefault()`-ed is the only thing that says if a native `<button>` activation survived
 *  the trigger's own handler (jsdom never synthesises the click itself). */
async function keydown(
  el: HTMLElement,
  key: string,
  fixture: ComponentFixture<unknown>,
  init: KeyboardEventInit = {},
) {
  const event = new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true, ...init });
  el.dispatchEvent(event);
  fixture.detectChanges();
  await fixture.whenStable();
  return event;
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
      // the user typed. Then re-slicing the stream positionally still shifted them ("80/72/026",
      // FSHSP-118). The edit isn't at the tail at all, so no re-derivation can be right: the
      // mask steps aside and the text is left exactly as edited (FSHSP-179).
      await typeInto(input, '8/07/2026', 0, fixture);
      expect(input.value).toBe('8/07/2026');
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

  // FSHSP-179: two field-reported bugs, one per describe block below.
  describe('editing a segment in place suspends the mask instead of shifting the rest', () => {
    it('leaves the text as typed when a 2-digit month is replaced by one digit', async () => {
      const { input, fixture } = await setup();
      await typeSequentially(input, '08072026', fixture);
      expect(input.value).toBe('08/07/2026');

      // Select the month "07" and type "1" (the browser has already replaced the selection).
      // The mask used to re-slice the whole digit stream positionally: "08/12/026" — the "2" of
      // the year promoted into the month, the year down to 3 digits. Nothing the mask can derive
      // from a flat stream is right here, so it steps aside for the rest of the entry.
      await typeInto(input, '08/1/2026', 4, fixture);
      expect(input.value).toBe('08/1/2026');

      // Typing the month's second digit no longer re-formats either (the "2026" stays intact),
      // and the completed date parses on blur.
      await typeInto(input, '08/12/2026', 5, fixture);
      expect(input.value).toBe('08/12/2026');
    });

    it('re-arms the mask once the suspended field reads empty', async () => {
      const { input, fixture } = await setup();
      await typeSequentially(input, '08072026', fixture);
      await typeInto(input, '08/1/2026', 4, fixture); // suspends the mask (in-place edit)
      expect(input.value).toBe('08/1/2026');

      await typeInto(input, '', 0, fixture);
      await typeSequentially(input, '20082020', fixture);
      expect(input.value).toBe('20/08/2020');
    });
  });

  describe('a custom dateFormat drives the parsed field order (FSHSP-179)', () => {
    it("reads the typed date back in the order that formatter writes, not the locale's", async () => {
      const { input, fixture, host } = await setupCustomFormat();
      // The placeholder advertises the formatter's own day-first output…
      expect(input.placeholder).toBe('22/11/2023');

      await typeSequentially(input, '08072026', fixture);
      expect(input.value).toBe('08/07/2026');
      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      await fixture.whenStable();

      // …and the parser now agrees with it. Under the resolved `LOCALE_ID` (`en-US`, month-first)
      // this committed 7 August and redisplayed it day-first as "07/08/2026": day and month
      // visibly swapped the moment the entry ended.
      expect(input.value).toBe('08/07/2026');
      expect(host.control.value?.getMonth()).toBe(6); // July
      expect(host.control.value?.getDate()).toBe(8);
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

  describe('which trigger clicks open the panel (FSHSP-180)', () => {
    it('does not open on a click in a typeable field — the icon and the keyboard do', async () => {
      const { fixture, input } = await setup();
      const trigger = fixture.nativeElement.querySelector('.ui-datepicker-trigger') as HTMLElement;
      // Opening on this click made the field unusable with a mouse: the overlay's permanent
      // backdrop then swallowed every further click, so the caret couldn't be moved — and the
      // panel's live preview disarmed the auto-"/" mask mid-entry.
      await click(trigger, fixture);
      expect(panel()).toBeNull();

      // The calendar toggle still opens it…
      const icon = fixture.nativeElement.querySelector(
        '.ui-datepicker-trigger .ui-input-action',
      ) as HTMLButtonElement;
      await click(icon, fixture);
      expect(panel()).not.toBeNull();
      await keydown(input, 'Escape', fixture);
      expect(panel()).toBeNull();

      // …and so does the keyboard.
      await keydown(input, 'ArrowDown', fixture);
      expect(panel()).not.toBeNull();
    });

    it('still opens on click when the field is not typeable', async () => {
      const { fixture, trigger } = await setupHost(DatepickerReadonlyTriggerHost);
      await click(trigger, fixture);
      expect(panel()).not.toBeNull();
    });

    it('still opens on click when no calendar icon is shown', async () => {
      const { fixture, trigger } = await setupHost(DatepickerNoIconHost);
      await click(trigger, fixture);
      expect(panel()).not.toBeNull();
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

  describe('opening keys', () => {
    it('leaves Enter to the calendar toggle instead of consuming it', async () => {
      const { fixture, icon, input } = await setupHost(DatepickerHost);
      // The toggle sits inside the wrapper that carries the trigger's keydown handler, so its
      // own keys bubble through it. Consuming Enter there `preventDefault()`-ed the native
      // button activation away, leaving the icon openable by Space (and `↓`) only.
      expect((await keydown(icon!, 'Enter', fixture)).defaultPrevented).toBe(false);
      // On the field itself Enter stays the commit key: it is spoken for (and submits a form),
      // so it is deliberately NOT an opening key there — `↓` / `Alt+↓` are.
      expect((await keydown(input, 'Enter', fixture)).defaultPrevented).toBe(true);
      expect(panel()).toBeNull();
    });

    it('still closes on Escape pressed on the toggle', async () => {
      const { fixture, icon } = await setupHost(DatepickerHost);
      await click(icon!, fixture);
      expect(panel()).not.toBeNull();
      await keydown(icon!, 'Escape', fixture);
      expect(panel()).toBeNull();
    });

    it('consumes Escape only when it actually closes the panel', async () => {
      const { fixture, input } = await setupHost(DatepickerHost);
      let seenByDocument = 0;
      const spy = () => seenByDocument++;
      document.addEventListener('keydown', spy);
      try {
        // Closed: the key belongs to whatever wraps the field (a modal closes on it too).
        await keydown(input, 'Escape', fixture);
        expect(seenByDocument).toBe(1);
        // Open: the panel takes it, so one Escape does not also dismiss that parent.
        await keydown(input, 'ArrowDown', fixture);
        expect(panel()).not.toBeNull();
        await keydown(input, 'Escape', fixture);
        expect(panel()).toBeNull();
        expect(seenByDocument).toBe(2); // the ArrowDown is not counted
      } finally {
        document.removeEventListener('keydown', spy);
      }
    });

    it('closes on Alt+ArrowUp, the APG counterpart of the opening ArrowDown', async () => {
      const { fixture, input } = await setupHost(DatepickerHost);
      await keydown(input, 'ArrowDown', fixture, { altKey: true });
      expect(panel()).not.toBeNull();
      await keydown(input, 'ArrowUp', fixture, { altKey: true });
      expect(panel()).toBeNull();
    });
  });

  describe('showOnFocus', () => {
    it('stays closed on focus by default', async () => {
      const { fixture, input } = await setupHost(DatepickerHost);
      await focusVia(input, 'keyboard', fixture);
      expect(panel()).toBeNull();
    });

    it('opens on a user focus without moving it out of the field (WCAG 3.2.1)', async () => {
      const { fixture, input } = await setupHost(DatepickerShowOnFocusHost);
      await focusVia(input, 'keyboard', fixture);
      expect(panel()).not.toBeNull();
      expect(document.activeElement).toBe(input);
    });

    it('opens as a non-modal popup — no aria-modal, no backdrop', async () => {
      const { fixture, input } = await setupHost(DatepickerShowOnFocusHost);
      await focusVia(input, 'mouse', fixture);
      // `aria-modal` would hide the very field being typed in from a screen reader's virtual
      // buffer; the backdrop would swallow the next click on it.
      expect(panel()!.getAttribute('aria-modal')).toBeNull();
      expect(document.querySelector('.cdk-overlay-backdrop')).toBeNull();
    });

    it('keeps the panel non-modal whichever way it was opened', async () => {
      const { fixture, icon } = await setupHost(DatepickerShowOnFocusHost);
      await click(icon!, fixture);
      expect(panel()).not.toBeNull();
      expect(panel()!.getAttribute('aria-modal')).toBeNull();
      expect(document.querySelector('.cdk-overlay-backdrop')).toBeNull();
    });

    it('is not dismissed by a press that started in the field', async () => {
      const { fixture, input } = await setupHost(DatepickerShowOnFocusHost);
      await focusVia(input, 'mouse', fixture);
      expect(panel()).not.toBeNull();
      // Panel opened under the cursor: the release lands on it, so the browser dispatches the
      // click on the common ancestor of both, which the overlay reports as "outside".
      input.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      fixture.detectChanges();
      await fixture.whenStable();
      expect(panel()).not.toBeNull();
    });

    it('is dismissed by a press that started outside', async () => {
      const { fixture, input } = await setupHost(DatepickerShowOnFocusHost);
      await focusVia(input, 'mouse', fixture);
      expect(panel()).not.toBeNull();
      document.body.dispatchEvent(new Event('pointerdown', { bubbles: true }));
      document.body.dispatchEvent(new MouseEvent('click', { bubbles: true }));
      fixture.detectChanges();
      await fixture.whenStable();
      expect(panel()).toBeNull();
    });

    it('keeps the focus in the field when the panel chrome is pressed', async () => {
      const { fixture, input } = await setupHost(DatepickerShowOnFocusHost);
      await focusVia(input, 'mouse', fixture);
      const press = (el: Element) => {
        const event = new MouseEvent('mousedown', { bubbles: true, cancelable: true });
        el.dispatchEvent(event);
        return event;
      };
      // Losing the focus to <body> would make the panel dismiss itself through its own focusout.
      expect(press(panel()!).defaultPrevented).toBe(true);
      // Its own controls keep the native behaviour.
      const day = panel()!.querySelector('.ui-datepicker-day')!;
      expect(press(day).defaultPrevented).toBe(false);
    });

    it('ignores a programmatic focus', async () => {
      const { fixture, input } = await setupHost(DatepickerShowOnFocusHost);
      await focusVia(input, 'program', fixture);
      expect(panel()).toBeNull();
    });

    it('does not re-open when closing hands the focus back to the field', async () => {
      const { fixture, input } = await setupHost(DatepickerShowOnFocusHost);
      await focusVia(input, 'keyboard', fixture);
      expect(panel()).not.toBeNull();
      // The focus has to genuinely leave the field first: `close()` re-focuses the trigger, and
      // re-focusing an already-focused element fires nothing. Rove into the grid, as `↓` does.
      const cell = panel()!.querySelector('.ui-datepicker-day[tabindex="0"]') as HTMLElement;
      cell.focus();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(panel()).not.toBeNull(); // the roving focus is not a dismissal
      // Escaping out of the grid gives the focus back to the field, a focus the monitor still
      // attributes to that very keystroke, so only the explicit guard stops the panel from
      // re-opening the instant it closed.
      await keydown(cell, 'Escape', fixture);
      expect(panel()).toBeNull();
    });

    it('closes when the focus leaves the trigger for good, not on the way to its toggle', async () => {
      const { fixture, input, icon } = await setupHost(DatepickerShowOnFocusHost);
      await focusVia(input, 'keyboard', fixture);
      expect(panel()).not.toBeNull();
      // `Tab` from the field lands on the calendar toggle, still the trigger, still its popup.
      icon!.focus();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(panel()).not.toBeNull();
      // The next one leaves for real. Nothing else would dismiss a panel with no backdrop and
      // no focus trap.
      const outside = document.createElement('button');
      document.body.appendChild(outside);
      outside.focus();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(panel()).toBeNull();
      outside.remove();
    });

    it('closes on the Tab that leaves the trigger, not on the one reaching its toggle', async () => {
      const { fixture, input, icon } = await setupHost(DatepickerShowOnFocusHost);
      await focusVia(input, 'keyboard', fixture);
      // Field → toggle: still the trigger, the panel is still its popup.
      await keydown(input, 'Tab', fixture);
      expect(panel()).not.toBeNull();
      // Toggle → out. The overlay follows the trigger in the DOM, so leaving it open would send
      // the tabulation through the whole calendar instead of on to the next field.
      await keydown(icon!, 'Tab', fixture);
      expect(panel()).toBeNull();
    });

    it('re-opens on a click, the dismissed field still holding the focus', async () => {
      const { fixture, input } = await setupHost(DatepickerShowOnFocusHost);
      await focusVia(input, 'keyboard', fixture);
      await keydown(input, 'Escape', fixture);
      expect(panel()).toBeNull();
      // No second focus event is coming, without click-to-open the field would be a dead end
      // for a mouse user from here on.
      await click(input, fixture);
      expect(panel()).not.toBeNull();
    });
  });
});
