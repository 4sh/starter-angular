/**
 * Reading back the field's own SVG exports (FSHSP-266): a signature edited again is
 * re-exported flat, so its value does not grow on every edit — and nothing but the field's
 * own shape is ever rebuilt from markup it received.
 */
import { describe, expect, it } from 'vitest';
import {
  type SignRect,
  type SignStroke,
  strokesToSvg,
  svgToDataUrl,
} from './ui-field-sign-strokes';
import { decodeSvgDataUrl, readSignSvg } from './ui-field-sign-svg';

const stroke = (...coords: [number, number][]): SignStroke => coords.map(([x, y]) => ({ x, y }));
const frame: SignRect = { x: 0, y: 0, width: 300, height: 150 };
const exportOf = (strokes: SignStroke[], background: string | null = null, color = 'black') =>
  svgToDataUrl(
    strokesToSvg(strokes, {
      frame,
      color,
      lineWidth: 2,
      background: background
        ? { href: background, rect: frame, drawing: readSignSvg(background) }
        : null,
    }),
  );
const svgOf = (url: string) => decodeSvgDataUrl(url)!;
const wrap = (body: string, root = 'viewBox="0 0 300 150" width="300" height="150"') =>
  svgToDataUrl(`<svg xmlns="http://www.w3.org/2000/svg" ${root}>${body}</svg>`);
const INK =
  '<g fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">';

describe('decodeSvgDataUrl', () => {
  it('decodes a percent-encoded and a base64 SVG data URL', () => {
    expect(decodeSvgDataUrl('data:image/svg+xml;charset=utf-8,%3Csvg%2F%3E')).toBe('<svg/>');
    expect(decodeSvgDataUrl(`data:image/svg+xml;base64,${btoa('<svg/>')}`)).toBe('<svg/>');
  });

  it('is null for another image type or a broken encoding', () => {
    expect(decodeSvgDataUrl('data:image/png;base64,AAAA')).toBeNull();
    expect(decodeSvgDataUrl('data:image/svg+xml,%E0%A4%A')).toBeNull();
  });
});

describe('readSignSvg', () => {
  it('reads back its own export: frame and strokes, in one ink layer', () => {
    const drawing = readSignSvg(exportOf([stroke([0, 0], [10, 10]), stroke([5, 5])]));
    expect(drawing?.viewBox).toEqual(frame);
    expect(drawing?.layers).toEqual([
      {
        kind: 'ink',
        paths: ['M0 0L10 10', 'M5 5L5.2 5'],
        color: 'black',
        width: 2,
        transform: { scale: 1, x: 0, y: 0 },
      },
    ]);
  });

  it('reads an rgb() ink, as `exportColor` resolves it', () => {
    const drawing = readSignSvg(exportOf([stroke([0, 0], [1, 1])], null, 'rgb(29, 59, 143)'));
    expect(drawing?.layers[0]).toMatchObject({ kind: 'ink', color: 'rgb(29, 59, 143)' });
  });

  it.each([
    ['a script', `<script>alert(1)</script>${INK}</g>`],
    ['an event handler', `${INK.replace('<g ', '<g onclick="x()" ')}</g>`],
    ['another element', `<rect width="1" height="1"/>`],
    ['a style', `<style>path{stroke:red}</style>`],
    ['text', `hello${INK}</g>`],
    ['a path attribute it does not write', `${INK}<path d="M0 0L1 1" stroke="red"/></g>`],
    ['path data it does not write', `${INK}<path d="M0 0A1 1 0 0 0 5 5"/></g>`],
    ['a paint server', `${INK.replace('stroke="black"', 'stroke="url(#p)"')}</g>`],
    ['a var() ink', `${INK.replace('stroke="black"', 'stroke="var(--ink)"')}</g>`],
    [
      'a remote image',
      `<image href="https://example.test/a.png" x="0" y="0" width="1" height="1"/>`,
    ],
    ['a rotation', `${INK.replace('<g ', '<g transform="rotate(45)" ')}</g>`],
  ])('treats an SVG holding %s as foreign', (_, body) => {
    expect(readSignSvg(wrap(body))).toBeNull();
  });

  it('treats as foreign an SVG without a viewBox, or sized out of its proportions', () => {
    expect(readSignSvg(wrap('', 'width="300" height="150"'))).toBeNull();
    expect(readSignSvg(wrap('', 'viewBox="0 0 300 150" width="300" height="300"'))).toBeNull();
  });

  it('is null for markup that does not parse, or for a PNG', () => {
    expect(readSignSvg(svgToDataUrl('<svg xmlns="http://www.w3.org/2000/svg"><g>'))).toBeNull();
    expect(readSignSvg('data:image/png;base64,AAAA')).toBeNull();
  });
});

describe('re-exporting a signature it exported', () => {
  it('copies the previous strokes next to the new ones instead of nesting the value', () => {
    const first = exportOf([stroke([0, 0], [10, 10])]);
    const second = svgOf(exportOf([stroke([20, 20], [30, 30])], first));
    expect(second).not.toContain('<image');
    expect(second.match(/<path /g)).toHaveLength(2);
    expect(second).toContain('<path d="M0 0L10 10"/>');
  });

  it('fits the previous frame into its slot, the way the screen draws it', () => {
    const first = exportOf([stroke([0, 0], [10, 10])]);
    const svg = strokesToSvg([], {
      frame,
      color: 'black',
      lineWidth: 2,
      // A slot twice as wide: the 300 × 150 frame is scaled 1, centred horizontally.
      background: {
        href: first,
        rect: { x: 0, y: 0, width: 600, height: 150 },
        drawing: readSignSvg(first),
      },
    });
    expect(svg).toContain('transform="matrix(1 0 0 1 150 0)"');
  });

  it('keeps a foreign image as is — one level, never re-encoded on later edits', () => {
    const png = 'data:image/png;base64,iVBORw0KGgo+/=';
    let value = exportOf([stroke([0, 0], [1, 1])], png);
    const hrefs = () => svgOf(value).match(/<image href="([^"]*)"/g);
    const once = hrefs();
    value = exportOf([stroke([2, 2], [3, 3])], value);
    value = exportOf([stroke([4, 4], [5, 5])], value);
    expect(hrefs()).toEqual(once);
    expect(svgOf(value)).toContain(`href="${png}"`);
  });

  it('drops an empty ink layer (everything undone over a previous signature)', () => {
    const empty = exportOf([], exportOf([stroke([0, 0], [1, 1])]));
    const next = svgOf(exportOf([stroke([2, 2], [3, 3])], empty));
    // The copied stroke's group, and the new one: no empty group carried along.
    expect(next.match(/<g /g)).toHaveLength(2);
  });

  it('grows by the new strokes only, edit after edit', () => {
    let value = exportOf([stroke([0, 0], [10, 10])]);
    const sizes = [value.length];
    for (let i = 1; i <= 6; i++) {
      value = exportOf([stroke([i, i], [i + 10, i + 10])], value);
      sizes.push(value.length);
    }
    const steps = sizes.slice(1).map((size, i) => size - sizes[i]);
    // Nested, each edit encodes the whole previous value once more (`%` → `%25`).
    expect(value).not.toContain('%25');
    expect(Math.max(...steps)).toBeLessThan(400);
    expect(svgOf(value).match(/<path /g)).toHaveLength(7);
  });
});
