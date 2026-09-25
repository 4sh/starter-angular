import { SecurityContext } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { afterEach, describe, expect, it } from 'vitest';
import {
  convertColorMarkers,
  EDITOR_COLORS,
  EDITOR_HIGHLIGHTS,
  sanitizeEditorHtml,
  sanitizeStyle,
} from './ui-editor-commands';

function sanitize(html: string): string {
  const sanitizer = TestBed.inject(DomSanitizer);
  return sanitizeEditorHtml(html, (h) => sanitizer.sanitize(SecurityContext.HTML, h) ?? '');
}

describe('sanitizeEditorHtml', () => {
  it('keeps the alignment and indentation the browser writes, byte for byte', () => {
    const aligned = '<p style="text-align: center;">Un</p>';
    const indented =
      '<blockquote style="margin: 0 0 0 40px; border: none; padding: 0px;"><p>Deux</p></blockquote>';
    expect(sanitize(aligned)).toBe(aligned);
    expect(sanitize(indented)).toBe(indented);
  });

  it('drops every other declaration, and still sanitises the rest', () => {
    expect(sanitize('<p style="color: red; text-align: right">a</p>')).toBe(
      '<p style="text-align: right;">a</p>',
    );
    expect(sanitize('<p style="background: url(https://evil.example/x)">a</p>')).toBe('<p>a</p>');
    expect(
      sanitize('<p style="text-align: center" onclick="alert(1)">a</p><script>x</script>'),
    ).toBe('<p style="text-align: center;">a</p>');
  });

  it('does not honour a relay class forged in the value', () => {
    expect(sanitize('<p class="ui-editor-style-0">a</p><p style="text-align: left">b</p>')).toBe(
      '<p>a</p><p style="text-align: left;">b</p>',
    );
  });
});

describe('sanitizeStyle', () => {
  it('lets no url() or expression through', () => {
    expect(sanitizeStyle('margin: url(x)')).toBe('');
    expect(sanitizeStyle('text-align: expression(alert(1))')).toBe('');
    expect(sanitizeStyle('border: 1px solid red')).toBe('');
  });
});

describe('convertColorMarkers', () => {
  const red = EDITOR_COLORS[0].className;
  const blue = EDITOR_COLORS[1].className;
  const highlight = EDITOR_HIGHLIGHTS[0].className;
  let root: HTMLElement;

  afterEach(() => root?.remove());

  function mount(html: string): HTMLElement {
    root = document.createElement('div');
    root.setAttribute('contenteditable', 'true');
    root.append(...new DOMParser().parseFromString(html, 'text/html').body.childNodes);
    document.body.append(root);
    return root;
  }

  it('recolors a word that already had a color, and only the color', () => {
    mount(
      `<p><font color="#010203"><span class="${red} ${highlight}">mot</span> et suite</font></p>`,
    );
    convertColorMarkers(root, blue);
    expect(root.innerHTML).toBe(
      `<p><span class="${blue}"><span class="${highlight}">mot</span> et suite</span></p>`,
    );
  });

  it('unwraps a span the recolor left bare', () => {
    mount(`<p><font color="#010203"><span class="${red}">mot</span> et suite</font></p>`);
    convertColorMarkers(root, blue);
    expect(root.innerHTML).toBe(`<p><span class="${blue}">mot et suite</span></p>`);
  });

  it('puts the selection back over the formatted text', () => {
    mount('<p>avant <font color="#010203">formaté</font> après</p>');
    getSelection()?.selectAllChildren(root.querySelector('font')!);
    convertColorMarkers(root, blue);
    const selection = getSelection()!;
    expect(selection.isCollapsed).toBe(false);
    expect(selection.toString()).toBe('formaté');
  });
});
