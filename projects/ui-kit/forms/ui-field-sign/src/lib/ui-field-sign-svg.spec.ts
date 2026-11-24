/**
 * Reading back the field's own SVG exports (FSHSP-266): a signature edited again is
 * re-exported flat, so its value does not grow on every edit — and nothing but the field's
 * own shape is ever rebuilt from markup it received.
 */
import { describe, expect, it } from 'vitest';
import {
  type SignRect,
  type SignStroke,
  strokesBounds,
  strokesToSvg,
  svgToDataUrl,
  unionRect,
} from './ui-field-sign-strokes';
import { decodeSvgDataUrl, readSignSvg } from './ui-field-sign-svg';

const stroke = (...coords: [number, number][]): SignStroke => coords.map(([x, y]) => ({ x, y }));
const frame: SignRect = { x: 0, y: 0, width: 300, height: 150 };
/** What the field exports: the frame grown to every stroke, cap included. */
const exportOf = (strokes: SignStroke[], background: string | null = null, color = 'black') =>
  svgToDataUrl(
    strokesToSvg(strokes, {
      frame: unionRect(frame, strokesBounds(strokes, 1)),
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
    const drawing = readSignSvg(exportOf([stroke([10, 10], [20, 20]), stroke([15, 15])]));
    expect(drawing?.viewBox).toEqual(frame);
    expect(drawing?.layers).toEqual([
      {
        kind: 'ink',
        paths: ['M10 10L20 20', 'M15 15L15.2 15'],
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
    ['no ink', `${INK.replace('stroke="black"', 'stroke="none"')}<path d="M0 0L1 1"/></g>`],
    [
      'an ink that is not a colour of its own',
      `${INK.replace('stroke="black"', 'stroke="currentColor"')}<path d="M0 0L1 1"/></g>`,
    ],
    ['path commands it does not chain that way', `${INK}<path d="M1 2LLL"/></g>`],
    ['a path not starting with a move', `${INK}<path d="L1 2"/></g>`],
  ])('treats an SVG holding %s as foreign', (_, body) => {
    expect(readSignSvg(wrap(body))).toBeNull();
  });

  // Copied flat, nothing clips a layer any more: what the screen hid must not reach the export.
  it.each([
    [
      'a hexadecimal scale',
      `${INK.replace('<g ', '<g transform="matrix(0x2 0 0 0x2 0 0)" ')}<path d="M0 0L1 1"/></g>`,
    ],
    [
      'an infinite scale',
      `${INK.replace('<g ', '<g transform="matrix(Infinity 0 0 Infinity 0 0)" ')}<path d="M0 0L1 1"/></g>`,
    ],
    [
      'a scale that overflows to infinity',
      `${INK.replace('<g ', '<g transform="matrix(1e400 0 0 1e400 0 0)" ')}<path d="M0 0L1 1"/></g>`,
    ],
    ['ink outside the viewBox', `${INK}<path d="M-500 -500L900 900"/></g>`],
    [
      'ink moved outside by its transform',
      `${INK.replace('<g ', '<g transform="matrix(1 0 0 1 400 0)" ')}<path d="M0 0L1 1"/></g>`,
    ],
    [
      'a stroke wider than the frame',
      `${INK.replace('stroke-width="2"', 'stroke-width="1e6"')}<path d="M10 10L20 20"/></g>`,
    ],
    [
      'an image larger than the frame',
      `<image href="data:image/png;base64,AA" x="0" y="0" width="900" height="900"/>`,
    ],
  ])('treats an SVG with %s as foreign', (_, body) => {
    expect(readSignSvg(wrap(body))).toBeNull();
  });

  it('accepts ink up to the frame edge, round cap included — as the field draws it', () => {
    expect(readSignSvg(wrap(`${INK}<path d="M1 1L299 149"/></g>`))).not.toBeNull();
  });

  it('refuses a round cap past the frame edge — the field never writes one', () => {
    expect(readSignSvg(wrap(`${INK}<path d="M0 0L300 150"/></g>`))).toBeNull();
  });

  // Bands of ink just outside each edge — and within the other three: hidden on screen (the
  // image is clipped), revealed flat.
  it.each([
    ['above', 'M80 -70L220 -70'],
    ['below', 'M80 220L220 220'],
    ['left of', 'M-70 75L-70 76'],
    ['right of', 'M370 75L370 76'],
  ])('refuses a wide stroke drawn just %s the frame', (_, d) => {
    const band =
      '<g fill="none" stroke="red" stroke-width="140" stroke-linecap="round" ' +
      `stroke-linejoin="round"><path d="${d}"/></g>`;
    expect(readSignSvg(wrap(band))).toBeNull();
  });

  it('treats a DOCTYPE or an entity as foreign — never expanded', () => {
    const doctype =
      '<!DOCTYPE svg [<!ENTITY c "red">]><svg xmlns="http://www.w3.org/2000/svg" ' +
      'viewBox="0 0 300 150" width="300" height="150"></svg>';
    expect(readSignSvg(svgToDataUrl(doctype))).toBeNull();
  });

  it('treats as foreign a viewBox that overflows to infinity — anything would fit in it', () => {
    const root = 'viewBox="0 0 1e400 1e400" width="1e400" height="1e400"';
    expect(readSignSvg(wrap(`${INK}<path d="M0 0L9 9"/></g>`, root))).toBeNull();
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
    const first = exportOf([stroke([10, 10], [20, 20])]);
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

  it('drops an empty ink layer an earlier export may hold', () => {
    const empty = wrap(`${INK}<path d="M10 10L11 11"/></g>${INK}</g>`);
    const next = svgOf(exportOf([stroke([2, 2], [3, 3])], empty));
    // The copied stroke's group, and the new one: no empty group carried along.
    expect(next.match(/<g /g)).toHaveLength(2);
  });

  it('reads back every edit as its own, whatever the box proportions in between', () => {
    // Frames of the box at each edit: a phone turned, a desktop, a narrow column…
    const boxes: SignRect[] = [
      { x: 0, y: 0, width: 300, height: 150 },
      { x: 0, y: 0, width: 150, height: 300 },
      { x: 0, y: 0, width: 640, height: 120 },
      { x: 0, y: 0, width: 333.3, height: 177.7 },
      { x: 0, y: 0, width: 90, height: 260 },
    ];
    let value: string | null = null;
    for (let edit = 0; edit < 15; edit++) {
      const box = boxes[edit % boxes.length];
      // Points stay half the ink width inside the box, as the field clamps them; a tap too.
      const strokes = [
        stroke([1, 1], [box.width - 1, box.height - 1]),
        stroke([box.width - 1.2, box.height / 2]),
      ];
      const drawing = value ? readSignSvg(value) : null;
      if (value) expect(drawing, `edit ${edit}`).not.toBeNull();
      value = svgToDataUrl(
        strokesToSvg(strokes, {
          frame: unionRect(box, strokesBounds(strokes, 1)),
          color: 'black',
          lineWidth: 2,
          background: value ? { href: value, rect: box, drawing } : null,
        }),
      );
    }
    expect(svgOf(value!)).not.toContain('<image');
    expect(svgOf(value!)).not.toMatch(/matrix\(0 /);
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
