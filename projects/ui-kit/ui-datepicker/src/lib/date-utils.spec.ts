import { describe, expect, it } from 'vitest';
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

describe('startOfDay', () => {
  it('zeroes the time components without mutating the input', () => {
    const input = new Date(2024, 5, 15, 13, 45, 30, 500);
    const result = startOfDay(input);
    expect(result.getHours()).toBe(0);
    expect(result.getMinutes()).toBe(0);
    expect(result.getSeconds()).toBe(0);
    expect(result.getMilliseconds()).toBe(0);
    expect(result.getDate()).toBe(15);
    expect(input.getHours()).toBe(13); // original untouched
  });
});

describe('firstOfMonth', () => {
  it('returns the 1st of the given date\'s month', () => {
    const result = firstOfMonth(new Date(2024, 5, 15));
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(5);
    expect(result.getDate()).toBe(1);
  });
});

describe('isSameDay', () => {
  it('is true for two dates on the same day regardless of time', () => {
    expect(isSameDay(new Date(2024, 5, 15, 1), new Date(2024, 5, 15, 23))).toBe(true);
  });

  it('is false for different days', () => {
    expect(isSameDay(new Date(2024, 5, 15), new Date(2024, 5, 16))).toBe(false);
  });

  it('is false when either side is null/undefined', () => {
    expect(isSameDay(null, new Date())).toBe(false);
    expect(isSameDay(new Date(), undefined)).toBe(false);
    expect(isSameDay(null, undefined)).toBe(false);
  });
});

describe('addDays', () => {
  it('adds days without mutating the input', () => {
    const input = new Date(2024, 0, 30);
    const result = addDays(input, 3);
    expect(result.getMonth()).toBe(1); // rolled over to February
    expect(result.getDate()).toBe(2);
    expect(input.getDate()).toBe(30); // original untouched
  });

  it('supports negative offsets', () => {
    const result = addDays(new Date(2024, 0, 1), -1);
    expect(result.getFullYear()).toBe(2023);
    expect(result.getMonth()).toBe(11);
    expect(result.getDate()).toBe(31);
  });
});

describe('addMonths', () => {
  it('returns the 1st of the target month, n months out', () => {
    const result = addMonths(new Date(2024, 0, 31), 1);
    // Anchored on the 1st precisely to sidestep the "31 Jan + 1 month" JS
    // Date overflow ambiguity (would roll into March, not stay in February).
    expect(result.getFullYear()).toBe(2024);
    expect(result.getMonth()).toBe(1);
    expect(result.getDate()).toBe(1);
  });

  it('rolls over the year boundary', () => {
    const result = addMonths(new Date(2024, 11, 1), 1);
    expect(result.getFullYear()).toBe(2025);
    expect(result.getMonth()).toBe(0);
  });
});

describe('finalizeParsed', () => {
  it('builds a valid date from in-range components', () => {
    const result = finalizeParsed(2024, 5, 15, 13, 30);
    expect(result).not.toBeNull();
    expect(result?.getFullYear()).toBe(2024);
    expect(result?.getMonth()).toBe(5);
    expect(result?.getDate()).toBe(15);
    expect(result?.getHours()).toBe(13);
    expect(result?.getMinutes()).toBe(30);
  });

  it('rejects an out-of-range component upfront', () => {
    expect(finalizeParsed(2024, 12, 1, 0, 0)).toBeNull(); // month 12 (0-based) is invalid
    expect(finalizeParsed(2024, 0, 32, 0, 0)).toBeNull();
    expect(finalizeParsed(2024, 0, 1, 24, 0)).toBeNull();
    expect(finalizeParsed(2024, 0, 1, 0, 60)).toBeNull();
  });

  it('rejects a day that overflows into the next month (e.g. 31 Feb)', () => {
    // month 1 = February (0-based); JS Date would silently roll 31 Feb into
    // 2/3 March — finalizeParsed catches that by re-checking the components.
    expect(finalizeParsed(2024, 1, 31, 0, 0)).toBeNull();
  });
});

describe('toIsoDate / toIsoDateTime', () => {
  it('serializes using local components, zero-padded', () => {
    expect(toIsoDate(new Date(2024, 0, 5))).toBe('2024-01-05');
  });

  it('appends zero-padded local time for toIsoDateTime', () => {
    expect(toIsoDateTime(new Date(2024, 0, 5, 9, 5))).toBe('2024-01-05T09:05');
  });
});

describe('parseIsoDate', () => {
  it('parses a well-formed "yyyy-MM-dd" string', () => {
    const result = parseIsoDate('2024-06-15');
    expect(result).not.toBeNull();
    expect(result?.getFullYear()).toBe(2024);
    expect(result?.getMonth()).toBe(5);
    expect(result?.getDate()).toBe(15);
  });

  it('returns null for a malformed string', () => {
    expect(parseIsoDate('15/06/2024')).toBeNull();
    expect(parseIsoDate('not-a-date')).toBeNull();
    expect(parseIsoDate('')).toBeNull();
  });

  it('returns null for an overflowed date (e.g. 30 Feb)', () => {
    expect(parseIsoDate('2024-02-30')).toBeNull();
  });

  it('round-trips with toIsoDate', () => {
    const date = new Date(2024, 5, 15);
    expect(parseIsoDate(toIsoDate(date))?.getTime()).toBe(startOfDay(date).getTime());
  });
});

describe('parseIsoDateTime', () => {
  it('parses a well-formed "yyyy-MM-ddTHH:mm" string', () => {
    const result = parseIsoDateTime('2024-06-15T09:05');
    expect(result).not.toBeNull();
    expect(result?.getHours()).toBe(9);
    expect(result?.getMinutes()).toBe(5);
  });

  it('returns null for a malformed string', () => {
    expect(parseIsoDateTime('2024-06-15')).toBeNull(); // missing time part
    expect(parseIsoDateTime('2024-06-15T25:00')).toBeNull(); // out-of-range hour
  });
});

describe('normalizeDateInput', () => {
  it('returns a Date input unchanged', () => {
    const date = new Date(2024, 5, 15);
    expect(normalizeDateInput(date)).toBe(date);
  });

  it('parses a valid ISO date string', () => {
    const result = normalizeDateInput('2024-06-15');
    expect(result?.getFullYear()).toBe(2024);
  });

  it('degrades to null for falsy or unparseable input, without throwing', () => {
    expect(normalizeDateInput(null)).toBeNull();
    expect(normalizeDateInput(undefined)).toBeNull();
    expect(normalizeDateInput('')).toBeNull();
    expect(normalizeDateInput('not-a-date')).toBeNull();
  });
});
