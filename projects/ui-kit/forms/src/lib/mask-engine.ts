/**
 * Pure masking engine shared by `ui-input-mask` and `ui-datepicker` (auto-formatting the typed
 * date). Same precedent as `overlay-positions.ts` in this folder: framework-free functions, no
 * class/Directive/Component, reusable by any form component that needs literal-inserting input
 * masking. Extracted from `ui-input-mask.ts` — behavior is a byte-for-byte copy, only `this.mask()`
 * /`this.ranges()`/`this.slotChar()` become explicit parameters.
 */

/** Mask tokens → accepted character class. */
export const MASK_TOKENS: Record<string, RegExp> = {
  '9': /[0-9]/, // digit
  a: /[a-zA-Z]/, // letter
  '*': /[a-zA-Z0-9]/, // alphanumeric
};

export interface MaskBounds {
  min: number;
  max: number;
}

export interface MaskSlot {
  char: string | null;
  rgx?: RegExp;
  bound?: MaskBounds & { pos: number; len: number };
}

export interface MaskBuildResult {
  display: string;
  masked: string;
  data: string;
  tokenIndices: number[];
}

/** Parse the `ranges` input (`"1-31 1-12 1900-2100"`) into one bound per numeric segment. */
export function parseMaskRanges(ranges: string): (MaskBounds | null)[] {
  return ranges
    .trim()
    .split(/\s+/)
    .map((part) => {
      const m = /^(\d+)-(\d+)$/.exec(part);
      return m ? { min: Number(m[1]), max: Number(m[2]) } : null;
    });
}

/**
 * Resolve the mask template into slots: literals, input slots, and the `ranges` bounds attached
 * to every slot of the numeric segment (consecutive `9` tokens) it belongs to.
 */
export function buildMaskSlots(
  mask: string,
  bounds: (MaskBounds | null)[],
  tokens: Record<string, RegExp> = MASK_TOKENS,
): MaskSlot[] {
  const slots: MaskSlot[] = [];
  const segments: MaskSlot[][] = [];
  let segment: MaskSlot[] | null = null;

  for (const m of mask) {
    const rgx = tokens[m];
    const slot: MaskSlot = rgx ? { char: null, rgx } : { char: m };
    slots.push(slot);
    if (rgx && m === '9') {
      if (!segment) segments.push((segment = []));
      segment.push(slot);
    } else {
      segment = null;
    }
  }

  segments.forEach((seg, i) => {
    const range = bounds[i];
    if (!range) return;
    seg.forEach((slot, pos) => (slot.bound = { ...range, pos, len: seg.length }));
  });

  return slots;
}

/** Keep only the data characters (alphanumeric) of a raw input string. */
export function extractMaskData(raw: string): string {
  return raw.replace(/[^a-zA-Z0-9]/g, '');
}

/**
 * Can `ch` fill this slot? It must match the token class and — when the segment is bounded —
 * the digits typed so far plus `ch` must still admit at least one in-range completion of the
 * remaining positions (`2` then `4` is refused on `0-23`, `2` then `3` is accepted).
 */
export function acceptsMaskChar(slot: MaskSlot, segment: string, ch: string): boolean {
  if (!slot.rgx?.test(ch)) return false;
  const bound = slot.bound;
  if (!bound) return true;
  const scale = 10 ** (bound.len - bound.pos - 1);
  const low = Number(segment + ch) * scale;
  return low <= bound.max && low + scale - 1 >= bound.min;
}

/** Apply the mask template to a sequence of data characters (fills empty positions with `slotChar`). */
export function applyMaskTemplate(
  slots: MaskSlot[],
  data: string,
  slotChar: string,
): MaskBuildResult {
  let di = 0;
  let display = '';
  let masked = '';
  let lastFilled = 0;
  let used = '';
  const tokenIndices: number[] = [];
  // Characters already accepted in the current numeric segment (drives the bounds check).
  let segment = '';

  for (const slot of slots) {
    if (slot.char !== null) {
      display += slot.char;
      masked += slot.char;
      continue;
    }
    tokenIndices.push(display.length); // index of this token position in `display`
    if (!slot.bound || slot.bound.pos === 0) segment = '';
    while (di < data.length && !acceptsMaskChar(slot, segment, data[di])) di++;
    if (di < data.length) {
      display += data[di];
      masked += data[di];
      used += data[di];
      if (slot.bound) segment += data[di];
      di++;
      lastFilled = masked.length;
    } else {
      display += slotChar;
    }
  }
  // Masked value = up to the last typed character (no trailing literals/slots).
  return { display, masked: masked.slice(0, lastFilled), data: used, tokenIndices };
}

/** Caret position for `n` typed data characters (literals skipped, end-of-text once all filled). */
export function caretForMask(tokenIndices: number[], n: number, length: number): number {
  if (n <= 0) return tokenIndices[0] ?? 0;
  if (n >= tokenIndices.length) return length; // all filled → end
  return tokenIndices[n]; // next input position (literals skipped)
}

/**
 * Auto-format-as-you-type variant of {@link applyMaskTemplate}: inserts a literal separator as
 * soon as the segment right before it is complete, without ever padding unfilled positions with
 * a filler character (unlike `applyMaskTemplate`, meant for a field that displays the full
 * template at rest). Used by `ui-datepicker`'s typeable trigger to auto-insert "/" as digits are
 * typed, the same way a card-expiry field auto-inserts its "/".
 */
export function autoFormatSegments(
  slots: MaskSlot[],
  data: string,
): { text: string; tokenIndices: number[] } {
  let di = 0;
  let text = '';
  let segment = '';
  let atSegmentEnd = false;
  const tokenIndices: number[] = [];

  for (const slot of slots) {
    if (slot.char !== null) {
      if (atSegmentEnd) text += slot.char;
      atSegmentEnd = false;
      continue;
    }
    tokenIndices.push(text.length);
    if (!slot.bound || slot.bound.pos === 0) segment = '';
    while (di < data.length && !acceptsMaskChar(slot, segment, data[di])) di++;
    if (di >= data.length) break; // no more data: stop, no filler
    text += data[di];
    if (slot.bound) segment += data[di];
    atSegmentEnd = !!slot.bound && slot.bound.pos === slot.bound.len - 1;
    di++;
  }
  return { text, tokenIndices };
}
