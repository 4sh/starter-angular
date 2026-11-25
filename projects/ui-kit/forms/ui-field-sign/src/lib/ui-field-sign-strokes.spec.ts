/**
 * Pure geometry of `ui-field-sign` (FSHSP-266): the smoothing shared by the canvas and the
 * SVG export, and the export document itself.
 */
import { describe, expect, it } from 'vitest';
import {
  containRect,
  strokesBounds,
  strokesToSvg,
  strokeToPath,
  svgToDataUrl,
  unionRect,
  type SignStroke,
} from './ui-field-sign-strokes';

const stroke = (...coords: [number, number][]): SignStroke => coords.map(([x, y]) => ({ x, y }));

describe('strokeToPath', () => {
  it('returns nothing for an empty stroke', () => {
    expect(strokeToPath([])).toBe('');
  });

  it('draws a tap as a dot — a zero-length segment is not painted everywhere', () => {
    expect(strokeToPath(stroke([10, 20]))).toBe('M10 20L10.2 20');
  });

  it('draws a tap as a dot even when the pointer reported a few moves on the spot', () => {
    expect(strokeToPath(stroke([5, 5], [5, 5]))).toBe('M5 5L5.2 5');
    expect(strokeToPath(stroke([5, 5], [5.02, 5.01], [5.03, 5]))).toBe('M5 5L5.2 5');
  });

  it('draws a tap as a dot when its jitter would round onto one point', () => {
    const [, x1, x2] = /^M(\S+) \S+L(\S+) /.exec(strokeToPath(stroke([10.05, 10], [10.11, 10])))!;
    expect(Number(x2)).toBeGreaterThan(Number(x1));
  });

  it('keeps a previous signature scaled far down visible — scales keep significant digits', () => {
    const svg = strokesToSvg([], {
      frame: { x: 0, y: 0, width: 300, height: 150 },
      color: 'black',
      lineWidth: 2,
      background: {
        href: 'data:image/svg+xml,x',
        rect: { x: 0, y: 0, width: 300, height: 150 },
        drawing: {
          viewBox: { x: 0, y: 0, width: 1e8, height: 5e7 },
          layers: [
            {
              kind: 'ink',
              paths: ['M10 10L20 20'],
              color: 'black',
              width: 2,
              transform: { scale: 1, x: 0, y: 0 },
            },
          ],
        },
      },
    });
    expect(svg).toContain('transform="matrix(0.000003 0 0 0.000003 0 0)"');
  });

  it('keeps the dot a segment after rounding, wherever the tap lands', () => {
    for (const x of [0.05, 0.15, 3.25, 7.349, 12.95]) {
      const [, x1, x2] = /^M(\S+) \S+L(\S+) /.exec(strokeToPath(stroke([x, 1])))!;
      expect(Number(x2)).toBeGreaterThan(Number(x1));
    }
  });

  it('keeps both ends of a two-point stroke', () => {
    expect(strokeToPath(stroke([0, 0], [10, 10]))).toBe('M0 0L10 10');
  });

  it('runs a curve through segment midpoints, each inner point as control point', () => {
    expect(strokeToPath(stroke([0, 0], [10, 0], [10, 10], [20, 10]))).toBe(
      'M0 0Q10 0 10 5Q10 10 15 10L20 10',
    );
  });

  it('rounds to a tenth of a pixel', () => {
    expect(strokeToPath(stroke([1.234, 5.678], [9.99, 0.04]))).toBe('M1.2 5.7L10 0');
  });
});

describe('strokesToSvg', () => {
  const base = { frame: { x: 0, y: 0, width: 300, height: 150 }, color: 'black', lineWidth: 2 };

  it('is a standalone document sized on the drawing area', () => {
    const svg = strokesToSvg([], base);
    expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
    expect(svg).toContain('viewBox="0 0 300 150"');
  });

  it('paints one round-capped path per stroke, in the export ink', () => {
    const svg = strokesToSvg([stroke([0, 0], [5, 5]), stroke([1, 1])], {
      ...base,
      color: '#1d3b8f',
    });
    expect(svg.match(/<path /g)).toHaveLength(2);
    expect(svg).toContain('stroke="#1d3b8f"');
    expect(svg).toContain('stroke-linecap="round"');
  });

  it('skips empty strokes', () => {
    expect(strokesToSvg([[]], base)).not.toContain('<path');
  });

  it('keeps a previous signature underneath, fitted into its own rectangle', () => {
    const svg = strokesToSvg([stroke([0, 0])], {
      ...base,
      background: {
        href: 'data:image/png;base64,AA',
        rect: { x: 10, y: 5, width: 200, height: 100 },
      },
    });
    expect(svg.indexOf('<image')).toBeLessThan(svg.indexOf('<path'));
    expect(svg).toContain(
      'x="10" y="5" width="200" height="100" preserveAspectRatio="xMidYMid meet"',
    );
  });

  it('exports a frame that does not start at the origin — strokes drawn left of the region', () => {
    const svg = strokesToSvg([stroke([-50, 10], [20, 30])], {
      ...base,
      frame: { x: -51, y: 0, width: 351, height: 150 },
    });
    expect(svg).toContain('viewBox="-51 0 351 150" width="351" height="150"');
  });

  it('escapes what it puts in attributes', () => {
    const svg = strokesToSvg([stroke([0, 0], [1, 1])], { ...base, color: 'x" onload="alert(1)' });
    expect(svg).not.toContain('" onload="');
    expect(svg).toContain('&quot;');
  });

  it('escapes line breaks and tabs too — an XML parser would turn them into spaces', () => {
    const svg = strokesToSvg([], {
      ...base,
      background: { href: 'data:image/png;base64,A\nB\tC', rect: base.frame },
    });
    expect(svg).toContain('href="data:image/png;base64,A&#10;B&#9;C"');
  });

  it('writes no empty ink group when there is no stroke', () => {
    expect(strokesToSvg([], base)).not.toContain('<g');
  });
});

describe('svgToDataUrl', () => {
  it('encodes the document as an SVG data URL', () => {
    const url = svgToDataUrl('<svg a="1"/>');
    expect(url.startsWith('data:image/svg+xml;charset=utf-8,')).toBe(true);
    expect(decodeURIComponent(url.split(',')[1])).toBe('<svg a="1"/>');
  });
});

describe('containRect', () => {
  it('fits a wider image to the width, centred vertically', () => {
    expect(containRect(400, 100, 200, 100)).toEqual({ x: 0, y: 25, width: 200, height: 50 });
  });

  it('fits a taller image to the height, centred horizontally', () => {
    expect(containRect(100, 200, 200, 100)).toEqual({ x: 75, y: 0, width: 50, height: 100 });
  });

  it('fills the area when the image has no intrinsic size', () => {
    expect(containRect(0, 0, 200, 100)).toEqual({ x: 0, y: 0, width: 200, height: 100 });
  });
});

describe('strokesBounds', () => {
  it('holds the segment a tap is drawn as — else the frame would crop it', () => {
    const bounds = strokesBounds([stroke([10, 10])])!;
    expect(bounds.width).toBeCloseTo(0.2);
    expect(bounds).toMatchObject({ x: 10, y: 10, height: 0 });
  });

  it('is null without any point', () => {
    expect(strokesBounds([])).toBeNull();
    expect(strokesBounds([[]])).toBeNull();
  });

  it('spans every point of every stroke, grown by the pad', () => {
    expect(strokesBounds([stroke([10, 20], [30, 5]), stroke([-4, 8])], 1)).toEqual({
      x: -5,
      y: 4,
      width: 36,
      height: 17,
    });
  });
});

describe('unionRect', () => {
  it('returns the first rectangle when there is nothing to add', () => {
    expect(unionRect({ x: 0, y: 0, width: 10, height: 10 }, null)).toEqual({
      x: 0,
      y: 0,
      width: 10,
      height: 10,
    });
  });

  it('holds both rectangles', () => {
    expect(
      unionRect({ x: 0, y: 0, width: 400, height: 200 }, { x: -51, y: 99, width: 12, height: 12 }),
    ).toEqual({ x: -51, y: 0, width: 451, height: 200 });
  });
});
