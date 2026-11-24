/**
 * Reads back an SVG value `ui-field-sign` exported itself, so that a signature edited again
 * is re-exported **flat** — its strokes copied next to the new ones — rather than nested as
 * an `<image>` whose data URL is encoded once more on every edit.
 *
 * Only this field's own shape is recognised, attribute by attribute: anything else (another
 * element, an unknown attribute, a script, a remote reference, a DOCTYPE) is "foreign" and the
 * caller keeps it as an image. What is recognised is rebuilt from the values read, never copied
 * as markup.
 *
 * The geometry is checked too, not only the shape. As an `<image>`, the value is clipped to its
 * viewBox; copied flat, nothing would clip it — so a layer reaching outside the viewBox (ink
 * hidden off-frame on screen, that would show in the export only) is foreign as well.
 *
 * Needs `DOMParser` (browser, jsdom); `null` without it.
 */
import {
  IMAGE_DATA_URL,
  type SignRect,
  type SignSvgDrawing,
  type SignSvgLayer,
  type SignTransform,
} from './ui-field-sign-strokes';

const SVG_NS = 'http://www.w3.org/2000/svg';
const IDENTITY: SignTransform = { scale: 1, x: 0, y: 0 };

/** A plain decimal number — no hexadecimal, no `Infinity`, which `Number()` would accept. */
const NUMBER = /^[+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;
/** One command of a path the field writes: `M x y`, `L x y`, `Q cx cy x y`. */
const PATH_COMMAND = /([MLQ])([^MLQ]*)/g;
/** A colour as `getComputedStyle` hands it back, or a colour keyword. */
const COLOR = /^(#[\da-f]{3,8}|[a-z]+|[a-z-]+\([\w\s.,%/+-]*\))$/i;
/** Functions that are references rather than colours. */
const REFERENCE_FUNCTIONS = ['url(', 'var(', 'attr(', 'env('];
/** Keywords that carry no colour of their own. */
const NOT_AN_INK = new Set([
  'none',
  'transparent',
  'currentcolor',
  'inherit',
  'initial',
  'unset',
  'revert',
  'revert-layer',
  'context-fill',
  'context-stroke',
]);
/** The `transform` the field writes: a uniform scale and a translation. */
const MATRIX = /^matrix\(\s*(\S+)\s+0\s+0\s+(\S+)\s+(\S+)\s+(\S+)\s*\)$/;
/** Rounding slack of the export (a tenth of a pixel), and then some. */
const SLACK = 0.5;

/** Text of an SVG data URL, percent-encoded or base64. `null` for anything else. */
export function decodeSvgDataUrl(src: string): string | null {
  const match = /^data:image\/svg\+xml((?:;[^,]*)?),(.*)$/is.exec(src);
  if (!match) return null;
  try {
    if (/;base64$/i.test(match[1])) {
      const binary = atob(match[2]);
      const bytes = Uint8Array.from(binary, (c) => c.charCodeAt(0));
      return new TextDecoder().decode(bytes);
    }
    return decodeURIComponent(match[2]);
  } catch {
    return null;
  }
}

/** `value` as a finite plain number, else `NaN`. */
const num = (value: string | null | undefined): number => {
  const v = value?.trim() ?? '';
  const n = NUMBER.test(v) ? Number(v) : NaN;
  return Number.isFinite(n) ? n : NaN;
};

/** A colour the field could have written. */
const isInk = (color: string): boolean => {
  const lower = color.toLowerCase();
  return (
    COLOR.test(color) &&
    !NOT_AN_INK.has(lower) &&
    !REFERENCE_FUNCTIONS.some((f) => lower.startsWith(f))
  );
};

/** Every attribute of `el` is in `allowed`. */
const onlyAttributes = (el: Element, allowed: readonly string[]): boolean =>
  Array.from(el.attributes).every((a) => allowed.includes(a.name));

/** Element children, `null` as soon as a node is neither an element nor blank text. */
function elementChildren(el: Element): Element[] | null {
  const out: Element[] = [];
  for (const node of Array.from(el.childNodes)) {
    if (node.nodeType === 1 && (node as Element).namespaceURI === SVG_NS) {
      out.push(node as Element);
    } else if (node.nodeType !== 3 || node.textContent?.trim()) {
      return null;
    }
  }
  return out;
}

/**
 * Points of a path the field wrote — every command explicit, `M`/`L` with 2 numbers, `Q` with
 * 4, starting with `M`. Control points included: a quadratic curve stays inside the hull of
 * its points, so they bound it. `null` for any other path.
 */
function readPath(d: string): [number, number][] | null {
  const body = d.trim();
  if (!body.startsWith('M')) return null;
  const points: [number, number][] = [];
  // Starting with `M`, every character belongs to a command: the pattern leaves none out.
  for (const [, command, args] of body.matchAll(PATH_COMMAND)) {
    const values = args
      .trim()
      .split(/[\s,]+/)
      .map(num);
    if (values.length !== (command === 'Q' ? 4 : 2) || values.some(Number.isNaN)) return null;
    for (let i = 0; i < values.length; i += 2) points.push([values[i], values[i + 1]]);
  }
  return points.length > 0 ? points : null;
}

function readTransform(el: Element): SignTransform | null {
  const value = el.getAttribute('transform');
  if (value === null) return IDENTITY;
  const m = MATRIX.exec(value);
  if (!m) return null;
  const [a, d, x, y] = [m[1], m[2], m[3], m[4]].map(num);
  return a === d && a > 0 && Number.isFinite(x) && Number.isFinite(y) ? { scale: a, x, y } : null;
}

function readRect(el: Element): SignRect | null {
  const [x, y, width, height] = ['x', 'y', 'width', 'height'].map((n) => num(el.getAttribute(n)));
  return [x, y, width, height].every(Number.isFinite) && width > 0 && height > 0
    ? { x, y, width, height }
    : null;
}

/** A layer as read, with every point its ink reaches — for {@link insideViewBox}. */
interface ReadLayer {
  readonly layer: SignSvgLayer;
  readonly points: readonly [number, number][];
  /** Half the painted width around each point (a round cap), before the transform. */
  readonly pad: number;
}

function readImage(el: Element): ReadLayer | null {
  if (
    !onlyAttributes(el, ['href', 'x', 'y', 'width', 'height', 'preserveAspectRatio', 'transform'])
  )
    return null;
  const href = el.getAttribute('href') ?? '';
  const aspect = el.getAttribute('preserveAspectRatio');
  const rect = readRect(el);
  const transform = readTransform(el);
  if (!IMAGE_DATA_URL.test(href) || (aspect !== null && aspect !== 'xMidYMid meet')) return null;
  if (!rect || !transform || elementChildren(el)?.length !== 0) return null;
  return {
    layer: { kind: 'image', href, rect, transform },
    points: [
      [rect.x, rect.y],
      [rect.x + rect.width, rect.y + rect.height],
    ],
    pad: 0,
  };
}

function readInk(el: Element): ReadLayer | null {
  const allowed = [
    'fill',
    'stroke',
    'stroke-width',
    'stroke-linecap',
    'stroke-linejoin',
    'transform',
  ];
  if (!onlyAttributes(el, allowed)) return null;
  const color = el.getAttribute('stroke') ?? '';
  const width = num(el.getAttribute('stroke-width'));
  const transform = readTransform(el);
  if (
    el.getAttribute('fill') !== 'none' ||
    el.getAttribute('stroke-linecap') !== 'round' ||
    el.getAttribute('stroke-linejoin') !== 'round' ||
    !isInk(color) ||
    !(width > 0) ||
    !transform
  ) {
    return null;
  }
  const children = elementChildren(el);
  if (!children) return null;
  const paths: string[] = [];
  const points: [number, number][] = [];
  for (const path of children) {
    const d = path.getAttribute('d') ?? '';
    const read = path.localName === 'path' && onlyAttributes(path, ['d']) ? readPath(d) : null;
    if (!read || elementChildren(path)?.length !== 0) return null;
    paths.push(d);
    points.push(...read);
  }
  return { layer: { kind: 'ink', paths, color, width, transform }, points, pad: width / 2 };
}

/**
 * Whether everything a layer paints stays inside `viewBox`: the field never exports ink
 * outside its frame, nor a stroke wider than it. Points once transformed, grown by half the
 * ink width, plus the export's rounding slack.
 */
function insideViewBox({ layer, points, pad }: ReadLayer, viewBox: SignRect): boolean {
  const { scale, x: dx, y: dy } = layer.transform;
  const margin = pad * scale + SLACK;
  if (pad * 2 * scale > Math.min(viewBox.width, viewBox.height)) return false;
  return points.every(([px, py]) => {
    const x = px * scale + dx;
    const y = py * scale + dy;
    return (
      x >= viewBox.x - margin &&
      y >= viewBox.y - margin &&
      x <= viewBox.x + viewBox.width + margin &&
      y <= viewBox.y + viewBox.height + margin
    );
  });
}

/**
 * The layers of an SVG data URL this field exported, or `null` when the value is anything
 * else — another image type, someone else's SVG, or one of ours altered by hand.
 */
export function readSignSvg(src: string): SignSvgDrawing | null {
  const text = decodeSvgDataUrl(src);
  if (text === null || typeof DOMParser === 'undefined') return null;
  // Never written by the field — and entities are best not expanded at all (billion laughs).
  if (/<!(DOCTYPE|ENTITY)/i.test(text)) return null;
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const root = doc.documentElement;
  if (root.localName !== 'svg' || root.namespaceURI !== SVG_NS || doc.doctype) return null;
  if (doc.getElementsByTagName('parsererror').length > 0) return null;
  if (!onlyAttributes(root, ['xmlns', 'viewBox', 'width', 'height'])) return null;

  const box = (root.getAttribute('viewBox') ?? '')
    .trim()
    .split(/[\s,]+/)
    .map(num);
  const width = num(root.getAttribute('width'));
  const height = num(root.getAttribute('height'));
  if (box.length !== 4 || box.some(Number.isNaN) || !(box[2] > 0) || !(box[3] > 0)) {
    return null;
  }
  // On screen the value is fitted by its width / height, here by its viewBox: they must agree.
  if (!(width > 0) || !(height > 0) || Math.abs(width / height - box[2] / box[3]) > 0.01) {
    return null;
  }
  const viewBox: SignRect = { x: box[0], y: box[1], width: box[2], height: box[3] };

  const children = elementChildren(root);
  if (!children) return null;
  const layers: SignSvgLayer[] = [];
  for (const child of children) {
    const read =
      child.localName === 'image'
        ? readImage(child)
        : child.localName === 'g'
          ? readInk(child)
          : null;
    if (!read || !insideViewBox(read, viewBox)) return null;
    layers.push(read.layer);
  }
  return { viewBox, layers };
}
