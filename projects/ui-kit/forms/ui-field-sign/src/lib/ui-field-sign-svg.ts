/**
 * Reads back an SVG value `ui-field-sign` exported itself, so that a signature edited again
 * is re-exported **flat** — its strokes copied next to the new ones — rather than nested as
 * an `<image>` whose data URL is encoded once more on every edit.
 *
 * Only this field's own shape is recognised, attribute by attribute: anything else (another
 * element, an unknown attribute, a script, a remote reference) is "foreign" and the caller
 * keeps it as an image. What is recognised is rebuilt from the values read, never copied as
 * markup. Needs `DOMParser` (browser, jsdom); `null` without it.
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

/** Commands the field writes in a path: move, line, quadratic curve. */
const PATH_DATA = /^[MLQ\d\s.,eE+-]+$/;
/** A colour as `getComputedStyle` hands it back, or a keyword — never `url()` nor `var()`. */
const COLOR = /^(#[\da-f]{3,8}|[a-z]+|[a-z-]+\([\w\s.,%/+-]*\))$/i;
const FOREIGN_COLOR = /^(url|var|env|attr)\(/i;
/** The `transform` the field writes: a uniform scale and a translation. */
const MATRIX = /^matrix\(\s*(\S+)\s+0\s+0\s+(\S+)\s+(\S+)\s+(\S+)\s*\)$/;

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

/** `value` as a finite number, else `NaN`. */
const num = (value: string | null): number =>
  value !== null && value.trim() !== '' ? Number(value) : NaN;

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

function readTransform(el: Element): SignTransform | null {
  const value = el.getAttribute('transform');
  if (value === null) return IDENTITY;
  const m = MATRIX.exec(value);
  if (!m) return null;
  const [a, d, x, y] = [m[1], m[2], m[3], m[4]].map(Number);
  return a === d && a > 0 && Number.isFinite(x) && Number.isFinite(y) ? { scale: a, x, y } : null;
}

function readRect(el: Element): SignRect | null {
  const [x, y, width, height] = ['x', 'y', 'width', 'height'].map((n) => num(el.getAttribute(n)));
  return [x, y, width, height].every(Number.isFinite) && width > 0 && height > 0
    ? { x, y, width, height }
    : null;
}

function readImage(el: Element): SignSvgLayer | null {
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
  return { kind: 'image', href, rect, transform };
}

function readInk(el: Element): SignSvgLayer | null {
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
    !COLOR.test(color) ||
    FOREIGN_COLOR.test(color) ||
    !(width > 0) ||
    !transform
  ) {
    return null;
  }
  const children = elementChildren(el);
  if (!children) return null;
  const paths: string[] = [];
  for (const path of children) {
    const d = path.getAttribute('d') ?? '';
    if (path.localName !== 'path' || !onlyAttributes(path, ['d']) || !PATH_DATA.test(d))
      return null;
    if (elementChildren(path)?.length !== 0) return null;
    paths.push(d);
  }
  return { kind: 'ink', paths, color, width, transform };
}

/**
 * The layers of an SVG data URL this field exported, or `null` when the value is anything
 * else — another image type, someone else's SVG, or one of ours altered by hand.
 */
export function readSignSvg(src: string): SignSvgDrawing | null {
  const text = decodeSvgDataUrl(src);
  if (text === null || typeof DOMParser === 'undefined') return null;
  const doc = new DOMParser().parseFromString(text, 'image/svg+xml');
  const root = doc.documentElement;
  if (root.localName !== 'svg' || root.namespaceURI !== SVG_NS) return null;
  if (doc.getElementsByTagName('parsererror').length > 0) return null;
  if (!onlyAttributes(root, ['xmlns', 'viewBox', 'width', 'height'])) return null;

  const box = (root.getAttribute('viewBox') ?? '')
    .trim()
    .split(/[\s,]+/)
    .map(Number);
  const width = num(root.getAttribute('width'));
  const height = num(root.getAttribute('height'));
  if (box.length !== 4 || !box.every(Number.isFinite) || !(box[2] > 0) || !(box[3] > 0)) {
    return null;
  }
  // On screen the value is fitted by its width / height, here by its viewBox: they must agree.
  if (!(width > 0) || !(height > 0) || Math.abs(width / height - box[2] / box[3]) > 0.01) {
    return null;
  }

  const children = elementChildren(root);
  if (!children) return null;
  const layers: SignSvgLayer[] = [];
  for (const child of children) {
    const layer =
      child.localName === 'image'
        ? readImage(child)
        : child.localName === 'g'
          ? readInk(child)
          : null;
    if (!layer) return null;
    layers.push(layer);
  }
  return { viewBox: { x: box[0], y: box[1], width: box[2], height: box[3] }, layers };
}
