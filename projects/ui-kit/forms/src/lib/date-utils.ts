/**
 * Pure date helpers (no framework dependency), shared by every field that has to cross
 * the `Date` ↔ ISO-string boundary — `ui-datepicker`, which parses what the user types,
 * and `ui-input-date`, which reads what the browser's native picker hands back.
 *
 * They lived inside `ui-datepicker`'s entry point while it was the only caller (FSHSP-209
 * moved them here). Two entry points must never import each other, so the second caller
 * left one choice: the shared `forms/` entry point, which exists for exactly this — the
 * helpers a field is built on. Serializing a `Date` from its LOCAL components rather than
 * through `toISOString()` is the subtle part, and it must not be re-derived twice.
 */

export function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}
export function firstOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1);
}
export function isSameDay(a: Date | null | undefined, b: Date | null | undefined): boolean {
  if (!a || !b) return false;
  return (
    a.getFullYear() === b.getFullYear() &&
    a.getMonth() === b.getMonth() &&
    a.getDate() === b.getDate()
  );
}
export function addDays(d: Date, n: number): Date {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}
export function addMonths(d: Date, n: number): Date {
  return new Date(d.getFullYear(), d.getMonth() + n, 1);
}
/** Build a Date and reject overflowed components (e.g. 31 Feb). */
export function finalizeParsed(
  year: number,
  month: number,
  day: number,
  h: number,
  min: number,
): Date | null {
  if (month < 0 || month > 11 || day < 1 || day > 31 || h > 23 || min > 59) return null;
  const d = new Date(year, month, day, h, min, 0, 0);
  if (d.getFullYear() !== year || d.getMonth() !== month || d.getDate() !== day) return null;
  return d;
}

const ISO_DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/;
const ISO_DATETIME_RE = /^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2})$/;
const ISO_TIME_RE = /^(\d{2}):(\d{2})$/;

function pad2(n: number): string {
  return String(n).padStart(2, '0');
}
/** Serialize a `Date` to `"yyyy-MM-dd"` from its LOCAL components — never `toISOString()`
 *  (which converts to UTC and can shift the day by ±1 depending on the timezone). */
export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}
/** `"HH:mm"` — the shape a native `<input type="time">` reads and writes. */
export function toIsoTime(d: Date): string {
  return `${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
/** `"yyyy-MM-ddTHH:mm"` — date part built the same local, never-UTC way as {@link toIsoDate}. */
export function toIsoDateTime(d: Date): string {
  return `${toIsoDate(d)}T${pad2(d.getHours())}:${pad2(d.getMinutes())}`;
}
/** Strict `"yyyy-MM-dd"` parser (rejects anything else, incl. overflowed dates via `finalizeParsed`). */
export function parseIsoDate(s: string): Date | null {
  const m = ISO_DATE_RE.exec(s);
  if (!m) return null;
  return finalizeParsed(Number(m[1]), Number(m[2]) - 1, Number(m[3]), 0, 0);
}
/** Strict `"yyyy-MM-ddTHH:mm"` parser (`showTime`/`timeOnly` round-trip). */
export function parseIsoDateTime(s: string): Date | null {
  const m = ISO_DATETIME_RE.exec(s);
  if (!m) return null;
  return finalizeParsed(Number(m[1]), Number(m[2]) - 1, Number(m[3]), Number(m[4]), Number(m[5]));
}
/**
 * Strict `"HH:mm"` parser, anchored on `reference` (default: today).
 *
 * A bare time is not a point in time; the caller has to say on which day it lands. Mirrors
 * what `ui-datepicker` does in `timeOnly` mode — it too carries a full `Date` — so both
 * components hand back the same shape.
 */
export function parseIsoTime(s: string, reference: Date = new Date()): Date | null {
  const m = ISO_TIME_RE.exec(s);
  if (!m) return null;
  return finalizeParsed(
    reference.getFullYear(),
    reference.getMonth(),
    reference.getDate(),
    Number(m[1]),
    Number(m[2]),
  );
}
/** Accepts a `Date` as-is, or parses a `"yyyy-MM-dd"` string — used to let config inputs
 *  (`minDate`/`maxDate`/`disabledDates`) take either shape. Invalid strings degrade to `null`
 *  (no constraint) rather than throwing: a malformed config shouldn't crash the picker. */
export function normalizeDateInput(v: Date | string | null | undefined): Date | null {
  if (!v) return null;
  return v instanceof Date ? v : parseIsoDate(v);
}
