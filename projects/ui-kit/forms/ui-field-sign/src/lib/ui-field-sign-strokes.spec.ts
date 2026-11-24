/**
 * Pure geometry of `ui-field-sign` (FSHSP-266): the smoothing shared by the canvas and the
 * SVG export, and the export document itself.
 */
import { describe, expect, it } from 'vitest';
import {
  containRect,
  strokesToSvg,
  strokeToPath,
  svgToDataUrl,
  type SignStroke,
} from './ui-field-sign-strokes';

const stroke = (...coords: [number, number][]): SignStroke => coords.map(([x, y]) => ({ x, y }));

describe('strokeToPath', () => {
  it('returns nothing for an empty stroke', () => {
    expect(strokeToPath([])).toBe('');
  });

  it('draws a tap as a dot — a zero-length segment is not painted everywhere', () => {
    expect(strokeToPath(stroke([10, 20]))).toBe('M10 20L10 20');
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
  const base = { width: 300, height: 150, color: 'black', lineWidth: 2 };

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

  it('keeps a previous signature underneath, fitted like the canvas draws it', () => {
    const svg = strokesToSvg([stroke([0, 0])], { ...base, background: 'data:image/png;base64,AA' });
    expect(svg.indexOf('<image')).toBeLessThan(svg.indexOf('<path'));
    expect(svg).toContain('preserveAspectRatio="xMidYMid meet"');
  });

  it('escapes what it puts in attributes', () => {
    const svg = strokesToSvg([], { ...base, color: 'x" onload="alert(1)' });
    expect(svg).not.toContain('" onload="');
    expect(svg).toContain('&quot;');
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
