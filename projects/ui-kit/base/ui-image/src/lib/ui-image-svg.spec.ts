import { describe, expect, it } from 'vitest';
import { sanitizeInlineSvg } from './ui-image-svg';

/**
 * FSHSP-177 — `ui-image` is the kit's single `bypassSecurityTrustHtml()`, and
 * these tests are what make that bypass defensible: they pin what the scrub
 * removes before the markup reaches it.
 */
describe('sanitizeInlineSvg', () => {
  it('keeps a plain SVG intact', () => {
    const out = sanitizeInlineSvg(
      '<svg viewBox="0 0 16 16"><path d="M0 0h16v16H0z" fill="currentColor"/></svg>',
    );
    expect(out).toContain('viewBox="0 0 16 16"');
    expect(out).toContain('fill="currentColor"');
  });

  it('drops a <script> with its content', () => {
    const out = sanitizeInlineSvg('<svg><script>alert(1)</script><circle r="4"/></svg>');
    expect(out).not.toContain('script');
    expect(out).not.toContain('alert(1)');
    expect(out).toContain('<circle');
  });

  it('drops <foreignObject> — it re-opens the HTML namespace', () => {
    const out = sanitizeInlineSvg(
      '<svg><foreignObject><body><img src="x" onerror="alert(1)"></body></foreignObject></svg>',
    );
    expect(out).not.toContain('foreignObject');
    expect(out).not.toContain('onerror');
  });

  it.each(['animate', 'set', 'animateTransform', 'animateMotion'])(
    'drops <%s> — SMIL can retarget an attribute after the scrub',
    (tag) => {
      const out = sanitizeInlineSvg(
        `<svg><a><${tag} attributeName="href" to="javascript:alert(1)"/></${tag}></a></svg>`,
      );
      expect(out).not.toContain(tag);
      expect(out).not.toContain('javascript:');
    },
  );

  it('strips every event-handler attribute', () => {
    const out = sanitizeInlineSvg(
      '<svg onload="alert(1)"><rect onclick="alert(2)" ONMOUSEOVER="alert(3)" width="4"/></svg>',
    );
    expect(out.toLowerCase()).not.toContain('onload');
    expect(out.toLowerCase()).not.toContain('onclick');
    expect(out.toLowerCase()).not.toContain('onmouseover');
    expect(out).toContain('width="4"');
  });

  it('strips a javascript: reference but keeps a fragment one', () => {
    const out = sanitizeInlineSvg(
      '<svg><a href="javascript:alert(1)"><use href="#icon"/></a></svg>',
    );
    expect(out).not.toContain('javascript:');
    expect(out).toContain('href="#icon"');
  });

  it('strips a data: reference', () => {
    const out = sanitizeInlineSvg(
      '<svg><image href="data:image/svg+xml;base64,PHN2Zz48L3N2Zz4="/></svg>',
    );
    expect(out).not.toContain('data:');
  });

  it('keeps an http(s) reference', () => {
    const out = sanitizeInlineSvg('<svg><image href="https://example.test/a.png"/></svg>');
    expect(out).toContain('https://example.test/a.png');
  });

  it('strips a legacy xlink:href carrying a script URL', () => {
    const out = sanitizeInlineSvg(
      '<svg xmlns:xlink="http://www.w3.org/1999/xlink"><a xlink:href="javascript:alert(1)"><circle r="2"/></a></svg>',
    );
    expect(out).not.toContain('javascript:');
    expect(out).toContain('<circle');
  });

  it('drops the XML prolog and the doctype', () => {
    const out = sanitizeInlineSvg('<?xml version="1.0"?><!DOCTYPE svg><svg><circle r="1"/></svg>');
    expect(out).not.toContain('<?xml');
    expect(out).not.toContain('DOCTYPE');
    expect(out).toContain('<circle');
  });

  it('is idempotent', () => {
    const raw = '<svg onload="x()"><script>y()</script><path d="M0 0"/></svg>';
    const once = sanitizeInlineSvg(raw);
    expect(sanitizeInlineSvg(once)).toBe(once);
  });
});
