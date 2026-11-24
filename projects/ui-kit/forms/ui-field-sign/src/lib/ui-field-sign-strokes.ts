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
 * Length given to a tap (the dot of an "i"). A zero-length segment is not painted by every
 * renderer even with round caps — the canvas spec prunes it, so do some PDF converters. Two
 * tenths of a pixel survive the SVG export's rounding (a tenth could round back onto the
 * start point) and still read as a dot.
 */
const DOT_LENGTH = 0.2;

/** A coordinate as the SVG export writes it: in tenths of a pixel. */
const tenths = (n: number): number => Math.round(n * 10);

/**
 * Whether `stroke` is a tap: every point lands on the first once rounded as the export
 * rounds them. A finger or a stylus that does not move still sends `pointermove` events, at
 * the same spot or a hair away — exported as is, that would be a zero-length segment.
 */
export function isTap(stroke: SignStroke): boolean {
  if (stroke.length === 0) return false;
  const [first] = stroke;
  const x = tenths(first.x);
  const y = tenths(first.y);
  return stroke.every((p) => tenths(p.x) === x && tenths(p.y) === y);
}

/**
 * Traces `stroke` into `sink`, smoothed: each point becomes the control point of a
 * quadratic curve running between the midpoints of its two segments. The curve still
 * starts on the first point and ends on the last, so a stroke never loses its ends.
 */
export function traceStroke(sink: SignPathSink, stroke: SignStroke): void {
  if (stroke.length === 0) return;
  const [first] = stroke;
  sink.moveTo(first.x, first.y);
  if (isTap(stroke)) {
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
 * Bounding box of every point of `strokes` — the segment a tap is drawn as included — grown by
 * `pad` on each side (half the ink width, so a round cap is not shaved off). `null` when there
 * is no point at all.
 */
export function strokesBounds(strokes: readonly SignStroke[], pad = 0): SignRect | null {
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  const add = (x: number, y: number) => {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  };
  for (const stroke of strokes) {
    for (const { x, y } of stroke) add(x, y);
    if (isTap(stroke)) add(stroke[0].x + DOT_LENGTH, stroke[0].y);
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

/**
 * Images the field accepts as a previous signature: an image **data URL**, what it emits
 * itself. A remote URL is refused on purpose — drawn on a canvas it taints it (the PNG export
 * then throws), and carried into an SVG export it would be fetched by whatever renders it.
 */
export const IMAGE_DATA_URL = /^data:image\/(png|jpeg|webp|svg\+xml)[;,]/i;

/** Uniform scale then translation: `p × scale + (x, y)`. */
export interface SignTransform {
  readonly scale: number;
  readonly x: number;
  readonly y: number;
}

/** What a layer of a previous export paints: an image, or a group of strokes in one ink. */
export type SignSvgLayer =
  | {
      readonly kind: 'image';
      readonly href: string;
      readonly rect: SignRect;
      readonly transform: SignTransform;
    }
  | {
      readonly kind: 'ink';
      readonly paths: readonly string[];
      readonly color: string;
      readonly width: number;
      readonly transform: SignTransform;
    };

/** One of this field's own SVG exports, read back: its frame and its layers, bottom first. */
export interface SignSvgDrawing {
  readonly viewBox: SignRect;
  readonly layers: readonly SignSvgLayer[];
}

/** A previous signature laid under the strokes: fitted (`contain`, centred) into `rect`. */
export interface SignSvgBackground {
  readonly href: string;
  readonly rect: SignRect;
  /**
   * The same signature read back as one of this field's own exports. Its layers are then
   * copied next to the new strokes instead of nesting the whole previous value in an
   * `<image>`: a data URL nested in a data URL is encoded once more (`%3C` → `%253C`), and the
   * value would grow on every edit.
   */
  readonly drawing?: SignSvgDrawing | null;
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

/**
 * Escapes a value for a double-quoted XML attribute — line breaks and tabs too, which an XML
 * parser would otherwise normalise to spaces: what is read back is what was written.
 */
const attr = (value: string): string =>
  value
    .replace(/&/g, '&amp;')
    .replace(/"/g, '&quot;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/\n/g, '&#10;')
    .replace(/\r/g, '&#13;')
    .replace(/\t/g, '&#9;');

/** `then` applied after `first`. */
const compose = (then: SignTransform, first: SignTransform): SignTransform => ({
  scale: first.scale * then.scale,
  x: first.x * then.scale + then.x,
  y: first.y * then.scale + then.y,
});

/** Transform that fits `source` into `target`, keeping its proportions, centred. */
const fitTransform = (source: SignRect, target: SignRect): SignTransform => {
  const r = containRect(source.width, source.height, target.width, target.height);
  const scale = source.width > 0 ? r.width / source.width : 1;
  return { scale, x: target.x + r.x - source.x * scale, y: target.y + r.y - source.y * scale };
};

/**
 * A scale keeps six significant digits — relative, not absolute: scaled down edit after edit,
 * a fixed number of decimals would end at `0` and the layer would vanish.
 */
const roundScale = (n: number): string => String(Number(n.toPrecision(6)));

/** `transform` attribute, omitted for the identity. */
const transformAttr = ({ scale, x, y }: SignTransform): string =>
  scale === 1 && x === 0 && y === 0
    ? ''
    : ` transform="matrix(${roundScale(scale)} 0 0 ${roundScale(scale)} ${round(x)} ${round(y)})"`;

const rectAttrs = (r: SignRect): string =>
  `x="${round(r.x)}" y="${round(r.y)}" width="${round(r.width)}" height="${round(r.height)}"`;

const imageElement = (href: string, rect: SignRect, transform = ''): string =>
  `<image href="${attr(href)}" ${rectAttrs(rect)} preserveAspectRatio="xMidYMid meet"${transform}/>`;

const inkGroup = (paths: readonly string[], color: string, width: number, transform = ''): string =>
  `<g fill="none" stroke="${attr(color)}" stroke-width="${round(width)}" ` +
  `stroke-linecap="round" stroke-linejoin="round"${transform}>` +
  paths.map((d) => `<path d="${attr(d)}"/>`).join('') +
  `</g>`;

/** The previous signature: its own layers when it is one of this field's exports, else an image. */
function backgroundMarkup(background: SignSvgBackground | null | undefined): string {
  if (!background) return '';
  const { drawing, href, rect } = background;
  if (!drawing) return imageElement(href, rect);
  const fit = fitTransform(drawing.viewBox, rect);
  return drawing.layers
    .filter((layer) => layer.kind === 'image' || layer.paths.length > 0)
    .map((layer) => {
      const transform = transformAttr(compose(fit, layer.transform));
      return layer.kind === 'image'
        ? imageElement(layer.href, layer.rect, transform)
        : inkGroup(layer.paths, layer.color, layer.width, transform);
    })
    .join('');
}

/**
 * Serializes strokes as a standalone SVG document, on a transparent background. One
 * `<path>` per stroke, round caps and joins — the same pen the canvas uses on screen.
 * A `background` is laid underneath, fitted into its rectangle the way the component
 * draws it (`contain`, centred).
 */
export function strokesToSvg(strokes: readonly SignStroke[], options: SignSvgOptions): string {
  const { frame, color, lineWidth, background } = options;
  const paths = strokes.filter((s) => s.length > 0).map(strokeToPath);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" ` +
    `viewBox="${round(frame.x)} ${round(frame.y)} ${round(frame.width)} ${round(frame.height)}" ` +
    `width="${round(frame.width)}" height="${round(frame.height)}">` +
    backgroundMarkup(background) +
    (paths.length > 0 ? inkGroup(paths, color, lineWidth) : '') +
    `</svg>`
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
