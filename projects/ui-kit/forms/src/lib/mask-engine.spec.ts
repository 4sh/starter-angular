import { describe, expect, it } from 'vitest';
import {
  acceptsMaskChar,
  applyMaskTemplate,
  autoFormatSegments,
  buildMaskSlots,
  caretForMask,
  extractMaskData,
  parseMaskRanges,
} from './mask-engine';

// A date-style mask ("15/01/2024") is used throughout: it exercises literals,
// multiple bounded numeric segments of different lengths, and the day/month
// leading-digit edge case (a single "2" must stay valid while typing "23").
const DATE_MASK = '99/99/9999';
const DATE_RANGES = '1-31 1-12 1900-2100';

function dateSlots() {
  return buildMaskSlots(DATE_MASK, parseMaskRanges(DATE_RANGES));
}

describe('parseMaskRanges', () => {
  it('parses one bound per whitespace-separated "min-max" segment', () => {
    expect(parseMaskRanges('1-31 1-12 1900-2100')).toEqual([
      { min: 1, max: 31 },
      { min: 1, max: 12 },
      { min: 1900, max: 2100 },
    ]);
  });

  it('yields null for a segment that does not match "min-max"', () => {
    expect(parseMaskRanges('1-31 garbage')).toEqual([{ min: 1, max: 31 }, null]);
  });
});

describe('buildMaskSlots', () => {
  it('turns literals into char slots and tokens into rgx slots', () => {
    const slots = buildMaskSlots('99/99', []);
    expect(slots.map((s) => s.char)).toEqual([null, null, '/', null, null]);
    expect(slots[2].rgx).toBeUndefined();
    expect(slots[0].rgx).toEqual(/[0-9]/);
  });

  it('groups consecutive "9" tokens into one bounded segment per group', () => {
    const slots = dateSlots();
    // day (pos 0-1), literal, month (pos 0-1), literal, year (pos 0-3).
    expect(slots[0].bound).toEqual({ min: 1, max: 31, pos: 0, len: 2 });
    expect(slots[1].bound).toEqual({ min: 1, max: 31, pos: 1, len: 2 });
    expect(slots[2].bound).toBeUndefined(); // literal "/"
    expect(slots[3].bound).toEqual({ min: 1, max: 12, pos: 0, len: 2 });
    expect(slots[4].bound).toEqual({ min: 1, max: 12, pos: 1, len: 2 });
    expect(slots[6].bound).toEqual({ min: 1900, max: 2100, pos: 0, len: 4 });
    expect(slots[9].bound).toEqual({ min: 1900, max: 2100, pos: 3, len: 4 });
  });

  it('leaves a segment unbounded when no matching range was provided', () => {
    const slots = buildMaskSlots('99', []);
    expect(slots[0].bound).toBeUndefined();
  });
});

describe('extractMaskData', () => {
  it('keeps only alphanumeric characters', () => {
    expect(extractMaskData('15/01/2024')).toBe('15012024');
    expect(extractMaskData('ab-12_cd!')).toBe('ab12cd');
  });
});

describe('acceptsMaskChar', () => {
  const slots = dateSlots();

  it('rejects a character that does not match the token class', () => {
    expect(acceptsMaskChar(slots[0], '', 'a')).toBe(false);
  });

  it('accepts an unbounded slot as soon as the token class matches', () => {
    const slot = buildMaskSlots('9', [])[0];
    expect(acceptsMaskChar(slot, '', '9')).toBe(true);
  });

  it('accepts a leading digit that still admits an in-range completion (hour-style 0-23)', () => {
    const hourSlots = buildMaskSlots('99', parseMaskRanges('0-23'));
    // "2" then "3" → 23, in range.
    expect(acceptsMaskChar(hourSlots[0], '', '2')).toBe(true);
    expect(acceptsMaskChar(hourSlots[1], '2', '3')).toBe(true);
  });

  it('rejects a second digit that cannot complete an in-range value (hour-style 0-23)', () => {
    const hourSlots = buildMaskSlots('99', parseMaskRanges('0-23'));
    // "2" then "4" → 24, out of range.
    expect(acceptsMaskChar(hourSlots[1], '2', '4')).toBe(false);
  });

  it('accepts a month leading digit only if it can still complete to 1-12', () => {
    // "0" (→01-09) and "1" (→10-12) can complete to a valid month; "3" cannot
    // (30-39 is entirely out of range).
    expect(acceptsMaskChar(slots[3], '', '0')).toBe(true);
    expect(acceptsMaskChar(slots[3], '', '1')).toBe(true);
    expect(acceptsMaskChar(slots[3], '', '3')).toBe(false);
  });
});

describe('applyMaskTemplate', () => {
  it('fills every slot for a fully typed value', () => {
    const result = applyMaskTemplate(dateSlots(), '15012024', '_');
    expect(result.display).toBe('15/01/2024');
    expect(result.masked).toBe('15/01/2024');
    expect(result.data).toBe('15012024');
    expect(result.tokenIndices).toEqual([0, 1, 3, 4, 6, 7, 8, 9]);
  });

  it('pads unfilled slots with slotChar in the display, but trims them from masked', () => {
    const result = applyMaskTemplate(dateSlots(), '1501', '_');
    expect(result.display).toBe('15/01/____');
    expect(result.masked).toBe('15/01'); // no trailing literal/filler
    expect(result.data).toBe('1501');
  });

  it('skips a character rejected by the current slot instead of consuming it', () => {
    // "a" fails the digit token class for the day's first slot and is
    // dropped — it never reaches `used`/`data`, unlike "1" and "5" which do.
    const dayOnly = buildMaskSlots('99', parseMaskRanges('1-31'));
    const result = applyMaskTemplate(dayOnly, 'a15', '_');
    expect(result.data).toBe('15');
    expect(result.display).toBe('15');
  });
});

describe('caretForMask', () => {
  const tokenIndices = [0, 1, 3, 4, 6, 7, 8, 9];

  it('returns the first token position for zero typed characters', () => {
    expect(caretForMask(tokenIndices, 0, 10)).toBe(0);
  });

  it('returns the position of the n-th token, skipping literals', () => {
    expect(caretForMask(tokenIndices, 2, 10)).toBe(3);
  });

  it('returns the end of the string once every slot is filled', () => {
    expect(caretForMask(tokenIndices, tokenIndices.length, 10)).toBe(10);
    expect(caretForMask(tokenIndices, 999, 10)).toBe(10);
  });
});

describe('autoFormatSegments', () => {
  it('auto-inserts a literal only once the segment before it is complete', () => {
    const result = autoFormatSegments(dateSlots(), '1501');
    expect(result.text).toBe('15/01/');
    expect(result.tokenIndices).toEqual([0, 1, 3, 4, 6]);
  });

  it('never pads with a filler character — stops as soon as data runs out', () => {
    const result = autoFormatSegments(dateSlots(), '15');
    expect(result.text).toBe('15/');
  });

  it('produces an empty string for empty data', () => {
    const result = autoFormatSegments(dateSlots(), '');
    expect(result.text).toBe('');
    expect(result.tokenIndices).toEqual([0]);
  });
});
