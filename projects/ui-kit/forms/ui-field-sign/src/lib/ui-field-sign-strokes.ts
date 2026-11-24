/**
 * Pure geometry of `ui-field-sign`: how a stroke is smoothed, and how a set of strokes
 * becomes an SVG. No DOM, no canvas — the component and the tests share this one path
 * builder, so what is drawn on screen and what is exported cannot drift apart.
 */

/** A point of a stroke, in CSS pixels from the top-left corner of the drawing area. */
export interface SignPoint {
  readonly x: number;
  readonly y: number;
}

/** One continuous stroke: everything between a pointer going down and coming back up. */
export type SignStroke = readonly SignPoint[];

/**
 * The subset of `CanvasRenderingContext2D` / `Path2D` a stroke is traced with — also
 * implemented by {@link SvgPathBuilder}, which is how the SVG export reuses the exact
 * curve drawn on screen.
 */
export interface SignPathSink {
  moveTo(x: number, y: number): void;
  lineTo(x: number, y: number): void;
  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void;
}

/**
 * Length given to a single-point stroke (a tap: the dot of an "i"). A zero-length segment
 * is not painted by every canvas implementation even with round caps; this one is, and
 * still reads as a dot.
 */
const DOT_LENGTH = 0.01;

/**
 * Traces `stroke` into `sink`, smoothed: each point becomes the control point of a
 * quadratic curve running between the midpoints of its two segments. The curve still
 * starts on the first point and ends on the last, so a stroke never loses its ends.
 */
export function traceStroke(sink: SignPathSink, stroke: SignStroke): void {
  if (stroke.length === 0) return;
  const [first] = stroke;
  sink.moveTo(first.x, first.y);
  if (stroke.length === 1) {
    sink.lineTo(first.x + DOT_LENGTH, first.y);
    return;
  }
  for (let i = 1; i < stroke.length - 1; i++) {
    const p = stroke[i];
    const next = stroke[i + 1];
    sink.quadraticCurveTo(p.x, p.y, (p.x + next.x) / 2, (p.y + next.y) / 2);
  }
  const last = stroke[stroke.length - 1];
  sink.lineTo(last.x, last.y);
}

/** Rounds to a tenth of a pixel: below what a screen or a printer resolves, and it keeps
 *  the exported path short. */
const round = (n: number): string => String(Math.round(n * 10) / 10);

/** Records traced commands as an SVG path `d` attribute. */
export class SvgPathBuilder implements SignPathSink {
  private readonly parts: string[] = [];

  moveTo(x: number, y: number): void {
    this.parts.push(`M${round(x)} ${round(y)}`);
  }

  lineTo(x: number, y: number): void {
    this.parts.push(`L${round(x)} ${round(y)}`);
  }

  quadraticCurveTo(cpx: number, cpy: number, x: number, y: number): void {
    this.parts.push(`Q${round(cpx)} ${round(cpy)} ${round(x)} ${round(y)}`);
  }

  toString(): string {
    return this.parts.join('');
  }
}

/** Smoothed SVG path of one stroke (`''` for an empty one). */
export function strokeToPath(stroke: SignStroke): string {
  const builder = new SvgPathBuilder();
  traceStroke(builder, stroke);
  return builder.toString();
}

/** An axis-aligned rectangle, in CSS pixels of the drawing space. */
export interface SignRect {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

/**
 * Bounding box of every point of `strokes`, grown by `pad` on each side (half the ink width,
 * so a round cap is not shaved off). `null` when there is no point at all.
 */
export function strokesBounds(strokes: readonly SignStroke[], pad = 0): SignRect | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const stroke of strokes) {
    for (const { x, y } of stroke) {
      if (x < minX) minX = x;
      if (y < minY) minY = y;
      if (x > maxX) maxX = x;
      if (y > maxY) maxY = y;
    }
  }
  if (minX === Infinity) return null;
  return {
    x: minX - pad,
    y: minY - pad,
    width: maxX - minX + 2 * pad,
    height: maxY - minY + 2 * pad,
  };
}

/** Smallest rectangle holding both — `b` may be `null`. */
export function unionRect(a: SignRect, b: SignRect | null): SignRect {
  if (!b) return a;
  const x = Math.min(a.x, b.x);
  const y = Math.min(a.y, b.y);
  return {
    x,
    y,
    width: Math.max(a.x + a.width, b.x + b.width) - x,
    height: Math.max(a.y + a.height, b.y + b.height) - y,
  };
}

/** A previous signature laid under the strokes: fitted (`contain`, centred) into `rect`. */
export interface SignSvgBackground {
  readonly href: string;
  readonly rect: SignRect;
}

/** Everything an export needs besides the strokes. */
export interface SignSvgOptions {
  /** Area exported, in drawing-space CSS pixels — the SVG's `viewBox`. */
  readonly frame: SignRect;
  /** Ink colour of the export (any CSS colour). */
  readonly color: string;
  /** Ink width, in CSS pixels. */
  readonly lineWidth: number;
  /** Previous signature to keep underneath (usually a data URL). */
  readonly background?: SignSvgBackground | null;
}

/** Escapes a value for a double-quoted XML attribute. */
const attr = (value: string): string =>
  value.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');

/**
 * Serializes strokes as a standalone SVG document, on a transparent background. One
 * `<path>` per stroke, round caps and joins — the same pen the canvas uses on screen.
 * A `background` image is laid underneath, fitted into its rectangle the way the component
 * draws it (`contain`, centred).
 */
export function strokesToSvg(strokes: readonly SignStroke[], options: SignSvgOptions): string {
  const { frame, color, lineWidth, background } = options;
  const box = (r: SignRect) =>
    `x="${round(r.x)}" y="${round(r.y)}" width="${round(r.width)}" height="${round(r.height)}"`;
  const image = background
    ? `<image href="${attr(background.href)}" ${box(background.rect)} preserveAspectRatio="xMidYMid meet"/>`
    : '';
  const paths = strokes
    .filter((s) => s.length > 0)
    .map((s) => `<path d="${strokeToPath(s)}"/>`)
    .join('');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `viewBox="${round(frame.x)} ${round(frame.y)} ${round(frame.width)} ${round(frame.height)}" ` +
    `width="${round(frame.width)}" height="${round(frame.height)}">` +
    image +
    `<g fill="none" stroke="${attr(color)}" stroke-width="${round(lineWidth)}" ` +
    `stroke-linecap="round" stroke-linejoin="round">${paths}</g></svg>`
  );
}

/** Data URL of an SVG document — the shape the field emits in `format="svg"`. */
export function svgToDataUrl(svg: string): string {
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
}

/**
 * Rectangle that fits a `sourceWidth × sourceHeight` image inside the drawing area while
 * keeping its proportions, centred — the canvas counterpart of the SVG export's
 * `preserveAspectRatio="xMidYMid meet"`.
 */
export function containRect(
  sourceWidth: number,
  sourceHeight: number,
  width: number,
  height: number,
): { x: number; y: number; width: number; height: number } {
  if (sourceWidth <= 0 || sourceHeight <= 0) return { x: 0, y: 0, width, height };
  const scale = Math.min(width / sourceWidth, height / sourceHeight);
  const w = sourceWidth * scale;
  const h = sourceHeight * scale;
  return { x: (width - w) / 2, y: (height - h) / 2, width: w, height: h };
}
