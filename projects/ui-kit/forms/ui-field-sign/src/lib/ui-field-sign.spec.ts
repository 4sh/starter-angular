/**
 * TestBed spec for `ui-field-sign` (FSHSP-266). What is worth asserting: the value leaves
 * once a stroke ends (never mid-stroke), `null` means empty, a previous signature is never
 * dropped from the export silently, the drawing keeps its frame when the box is resized, and
 * the read-only / disabled states really stop the pen.
 *
 * jsdom has no 2D canvas, loads no image and has no ResizeObserver: the field falls back to
 * its SVG export (so nothing depends on pixels), and the two others are faked where a test
 * needs them. Pixels are checked in Storybook.
 */
import { Component, signal, type Type, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { type FieldSignFormat, type FieldSignValue, UiFieldSign } from './ui-field-sign';
import { strokesToSvg, svgToDataUrl } from './ui-field-sign-strokes';

@Component({
  imports: [FormsModule, UiFieldSign],
  template: `<ui-field-sign
    label="Signature"
    [format]="format()"
    [exportColor]="exportColor()"
    [required]="required()"
    [readonly]="readonly()"
    [disabled]="disabled()"
    [(ngModel)]="value"
    (valueChange)="changes.push($event)"
    (imageError)="imageErrors.push($event)"
  />`,
})
class SignHost {
  readonly sign = viewChild.required(UiFieldSign);
  readonly format = signal<FieldSignFormat>('svg');
  readonly exportColor = signal('black');
  readonly required = signal(false);
  readonly readonly = signal(false);
  readonly disabled = signal(false);
  value: FieldSignValue = null;
  changes: FieldSignValue[] = [];
  imageErrors: Event[] = [];
}

@Component({
  imports: [ReactiveFormsModule, UiFieldSign],
  template: `<ui-field-sign label="Signature" format="svg" [formControl]="control" />`,
})
class ReactiveHost {
  readonly sign = viewChild.required(UiFieldSign);
  readonly control = new FormControl<FieldSignValue>(null, Validators.required);
}

const SAMPLE = 'data:image/svg+xml;charset=utf-8,%3Csvg%2F%3E';
const PNG_SAMPLE = 'data:image/png;base64,AAAA';
/** A value this field exported itself: one stroke, in SVG. */
const OWN_EXPORT = svgToDataUrl(
  strokesToSvg(
    [
      [
        { x: 0, y: 0 },
        { x: 10, y: 10 },
      ],
    ],
    {
      frame: { x: 0, y: 0, width: 300, height: 150 },
      color: 'black',
      lineWidth: 2,
    },
  ),
);

/** An `Image` whose load / error the test decides. */
class FakeImage {
  static last: FakeImage | null = null;
  onload: (() => void) | null = null;
  onerror: (() => void) | null = null;
  src = '';
  naturalWidth = 100;
  naturalHeight = 50;
  constructor() {
    FakeImage.last = this;
  }
}

/** A `ResizeObserver` the test triggers by hand. */
class FakeResizeObserver {
  static callbacks: (() => void)[] = [];
  constructor(private readonly callback: () => void) {
    FakeResizeObserver.callbacks.push(callback);
  }
  observe(): void {
    /* manual */
  }
  disconnect(): void {
    /* manual */
  }
}

/** Gives every canvas a CSS box (jsdom reports 0 × 0). */
function setBox(width: number, height: number): void {
  vi.spyOn(Element.prototype, 'clientWidth', 'get').mockReturnValue(width);
  vi.spyOn(Element.prototype, 'clientHeight', 'get').mockReturnValue(height);
}

async function render<T>(type: Type<T>) {
  await TestBed.configureTestingModule({ imports: [type] }).compileComponents();
  const fixture: ComponentFixture<T> = TestBed.createComponent(type);
  return fixture;
}

function helpers(fixture: ComponentFixture<unknown>) {
  const canvas = () => fixture.nativeElement.querySelector('canvas') as HTMLCanvasElement;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const pointer = (type: string, x: number, y: number, pointerId = 1, button = 0) =>
    canvas().dispatchEvent(
      new PointerEvent(type, {
        pointerId,
        pointerType: 'touch',
        button,
        clientX: x,
        clientY: y,
        bubbles: true,
        cancelable: true,
      }),
    );
  /** One stroke through the given points. */
  const draw = async (...points: [number, number][]) => {
    const [first, ...rest] = points;
    pointer('pointerdown', ...first);
    for (const p of rest) pointer('pointermove', ...p);
    pointer('pointerup', ...(points[points.length - 1] ?? first));
    await settle();
  };
  const key = async (key: string, init: KeyboardEventInit = {}) => {
    canvas().dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, ...init }));
    await settle();
  };
  return { canvas, settle, pointer, draw, key };
}

async function setup(initialValue: FieldSignValue = null, configure?: (host: SignHost) => void) {
  const fixture = await render(SignHost);
  const host = fixture.componentInstance;
  host.value = initialValue;
  configure?.(host);
  fixture.detectChanges();
  await fixture.whenStable();
  // `ngModel` writes the initial value asynchronously: one more pass to render it.
  fixture.detectChanges();
  await fixture.whenStable();
  const clearButton = () =>
    fixture.nativeElement.querySelector('.ui-field-sign-clear') as HTMLButtonElement | null;
  const placeholder = () => fixture.nativeElement.querySelector('.ui-field-sign-placeholder');
  const status = () =>
    fixture.nativeElement.querySelector(
      `#${helpers(fixture).canvas().getAttribute('aria-describedby')!.split(' ')[0]}`,
    ) as HTMLElement;
  return { fixture, host, clearButton, placeholder, status, ...helpers(fixture) };
}

const svg = (value: FieldSignValue | undefined) => decodeURIComponent(value ?? '');
const paths = (value: FieldSignValue | undefined) => svg(value).match(/<path /g)?.length ?? 0;

describe('ui-field-sign', () => {
  // jsdom answers `null` anyway, but logs on every call: answer it silently.
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    FakeResizeObserver.callbacks = [];
    FakeImage.last = null;
  });

  it('starts empty: placeholder shown, clear disabled, value null', async () => {
    const { host, placeholder, clearButton } = await setup();
    expect(placeholder()?.textContent?.trim()).toBe('Signez ici');
    expect(clearButton()?.disabled).toBe(true);
    expect(host.value).toBeNull();
  });

  it('emits an SVG data URL once the stroke ends — never mid-stroke', async () => {
    const { host, pointer, settle } = await setup();
    pointer('pointerdown', 10, 10);
    pointer('pointermove', 20, 15);
    pointer('pointermove', 30, 25);
    await settle();
    expect(host.changes).toEqual([]);

    pointer('pointerup', 30, 25);
    await settle();
    expect(host.changes).toHaveLength(1);
    expect(host.changes[0]!.startsWith('data:image/svg+xml')).toBe(true);
    expect(svg(host.changes[0])).toContain('<path d="M10 10Q20 15 25 20L30 25"/>');
    expect(host.value).toBe(host.changes[0]);
  });

  it('exports in `exportColor` resolved to rgb(), not in the screen ink', async () => {
    const { host, draw } = await setup();
    await draw([0, 0], [5, 5]);
    expect(svg(host.value)).toContain('stroke="rgb(0, 0, 0)"');
  });

  describe('exportColor', () => {
    afterEach(() => document.body.style.removeProperty('--test-ink'));

    it('resolves a design token where the field sits — an image cannot carry var()', async () => {
      document.body.style.setProperty('--test-ink', '#1d3b8f');
      const { host, draw } = await setup(null, (h) => h.exportColor.set('var(--test-ink)'));
      await draw([0, 0], [5, 5]);
      expect(svg(host.value)).toContain('stroke="rgb(29, 59, 143)"');
    });

    it('falls back to black on a var() that does not resolve — the SVG stroke would be invisible', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { host, draw } = await setup(null, (h) => h.exportColor.set('var(--nope)'));
      await draw([0, 0], [5, 5]);
      expect(svg(host.value)).toContain('stroke="black"');
      expect(warn).toHaveBeenCalled();
    });

    it('falls back to black on a value that is not a colour', async () => {
      vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { host, draw } = await setup(null, (h) => h.exportColor.set('not-a-colour'));
      await draw([0, 0], [5, 5]);
      expect(svg(host.value)).toContain('stroke="black"');
    });
  });

  it('hides the placeholder and enables clearing once signed', async () => {
    const { draw, placeholder, clearButton } = await setup();
    await draw([0, 0], [5, 5]);
    expect(placeholder()).toBeNull();
    expect(clearButton()?.disabled).toBe(false);
  });

  it('ignores a second finger while a stroke is under way', async () => {
    const { host, pointer, settle } = await setup();
    pointer('pointerdown', 0, 0, 1);
    pointer('pointerdown', 50, 50, 2);
    pointer('pointermove', 60, 60, 2);
    pointer('pointerup', 60, 60, 2);
    await settle();
    expect(host.changes).toEqual([]);
    pointer('pointerup', 0, 0, 1);
    await settle();
    expect(paths(host.value)).toBe(1);
  });

  it('ignores any button but the main one (right-click, stylus eraser)', async () => {
    const { host, pointer, settle } = await setup();
    pointer('pointerdown', 0, 0, 1, 5);
    pointer('pointerup', 5, 5, 1, 5);
    await settle();
    expect(host.changes).toEqual([]);
  });

  it('ends the stroke on a lost pointer capture — the next one still draws', async () => {
    const { host, pointer, draw, settle } = await setup();
    pointer('pointerdown', 0, 0);
    pointer('pointermove', 5, 5);
    pointer('lostpointercapture', 5, 5);
    await settle();
    expect(paths(host.value)).toBe(1);
    await draw([10, 10], [20, 20]);
    expect(paths(host.value)).toBe(2);
  });

  it('keeps its frame when the box shrinks: nothing is cropped out of the value', async () => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    setBox(400, 200);
    const { host, draw } = await setup();
    await draw([300, 150], [390, 190]);

    // The box halves (a phone rotated): the drawing is scaled down, not cropped.
    setBox(200, 100);
    FakeResizeObserver.callbacks.forEach((cb) => cb());
    await draw([150, 75], [160, 80]);

    const out = svg(host.value);
    expect(out).toContain('viewBox="0 0 400 200"');
    expect(out).toContain('<path d="M300 150L390 190"/>');
    // A point at half the box is half the frame, in frame coordinates.
    expect(out).toContain('<path d="M300 150L320 160"/>');
    expect(paths(host.value)).toBe(2);
  });

  it('grows the frame to a stroke drawn beside it after the box widened — screen = value', async () => {
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
    setBox(400, 200);
    const { host, draw } = await setup();
    await draw([10, 10], [20, 20]);

    // Wider box, same height: the region is centred, with 100px of room on each side.
    setBox(600, 200);
    FakeResizeObserver.callbacks.forEach((cb) => cb());
    await draw([50, 100], [60, 110]);

    const out = svg(host.value);
    // The stroke in the left margin is in the value, the frame grown to hold it (+1px cap).
    expect(out).toContain('<path d="M-50 100L-40 110"/>');
    expect(out).toContain('viewBox="-51 0 451 200"');
  });

  it('clamps a captured pointer dragged past the box to its edge', async () => {
    setBox(400, 200);
    const { host, pointer, settle } = await setup();
    pointer('pointerdown', 390, 190);
    pointer('pointermove', 900, 700);
    pointer('pointerup', 900, 700);
    await settle();
    expect(svg(host.value)).toContain('<path d="M390 190L400 200"/>');
  });

  describe('clear / undo', () => {
    it('clear() empties the field and emits null', async () => {
      const { host, draw, settle } = await setup();
      await draw([0, 0], [5, 5]);
      host.sign().clear();
      await settle();
      expect(host.value).toBeNull();
      expect(host.changes.at(-1)).toBeNull();
    });

    it('the clear button empties the field and focuses the drawing area', async () => {
      const { host, draw, clearButton, canvas, settle } = await setup();
      await draw([0, 0], [5, 5]);
      clearButton()!.click();
      await settle();
      expect(host.value).toBeNull();
      expect(document.activeElement).toBe(canvas());
    });

    it('undo() removes the last stroke, then null once none is left', async () => {
      const { host, draw, settle } = await setup();
      await draw([0, 0], [5, 5]);
      await draw([10, 10], [15, 15]);
      host.sign().undo();
      await settle();
      expect(paths(host.value)).toBe(1);
      host.sign().undo();
      await settle();
      expect(host.value).toBeNull();
    });

    it('undo() brings back what clear() removed', async () => {
      const { host, draw, settle } = await setup();
      await draw([0, 0], [5, 5]);
      await draw([10, 10], [15, 15]);
      host.sign().clear();
      await settle();
      host.sign().undo();
      await settle();
      expect(paths(host.value)).toBe(2);
    });

    it('clear() does nothing under the pen — a blank image would pass `required`', async () => {
      const { host, pointer, draw, settle } = await setup();
      await draw([0, 0], [5, 5]);
      pointer('pointerdown', 10, 10);
      host.sign().clear();
      await settle();
      expect(paths(host.value)).toBe(1);
      pointer('pointerup', 20, 20);
      await settle();
      expect(paths(host.value)).toBe(2);
    });

    it('Backspace and Ctrl+Z undo the last stroke; Delete clears, undoably', async () => {
      const { host, draw, key } = await setup();
      await draw([0, 0], [5, 5]);
      await draw([10, 10], [15, 15]);
      await draw([20, 20], [25, 25]);
      await key('Backspace');
      expect(paths(host.value)).toBe(2);
      await key('z', { ctrlKey: true });
      expect(paths(host.value)).toBe(1);
      await key('Delete');
      expect(host.value).toBeNull();
      await key('Backspace');
      expect(paths(host.value)).toBe(1);
    });
  });

  describe('value written by the form', () => {
    it('is shown, and kept under new strokes', async () => {
      const { host, placeholder, draw } = await setup(SAMPLE);
      expect(placeholder()).toBeNull();
      await draw([0, 0], [5, 5]);
      expect(svg(host.value)).toContain(`<image href="${SAMPLE}"`);
      expect(paths(host.value)).toBe(1);
    });

    it('is not removed by undo() — clear() removes it', async () => {
      const { host, settle } = await setup(SAMPLE);
      host.sign().undo();
      await settle();
      expect(host.changes).toEqual([]);
      host.sign().clear();
      await settle();
      expect(host.value).toBeNull();
    });

    it('is refused when it is not an image data URL — a remote URL would taint the export', async () => {
      const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { placeholder, host, draw } = await setup('https://example.test/signature.png');
      expect(placeholder()).not.toBeNull();
      expect(warn).toHaveBeenCalled();
      await draw([0, 0], [5, 5]);
      expect(svg(host.value)).not.toContain('<image');
    });

    it('undo() after Delete brings it back', async () => {
      const { host, key } = await setup(SAMPLE);
      await key('Delete');
      expect(host.value).toBeNull();
      await key('Backspace');
      expect(svg(host.value)).toContain(`<image href="${SAMPLE}"`);
    });

    it('cleared while loading then undone, it is loaded again — the PNG export does not stall', async () => {
      vi.stubGlobal('Image', FakeImage);
      const { host, key, settle } = await setup(PNG_SAMPLE, (h) => h.format.set('png'));
      const first = FakeImage.last!;
      await key('Delete');
      first.onload!(); // lands while cleared: dropped
      await key('Backspace');
      expect(FakeImage.last).not.toBe(first);
      expect(host.changes).toEqual([null]);

      FakeImage.last!.onload!();
      await settle();
      expect(svg(host.changes.at(-1))).toContain(`<image href="${PNG_SAMPLE}"`);
    });

    it('shows the field empty when the image cannot be loaded, and says so', async () => {
      vi.stubGlobal('Image', FakeImage);
      vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { host, placeholder, status, settle } = await setup(SAMPLE);
      expect(placeholder()).toBeNull();
      FakeImage.last!.onerror!();
      await settle();
      expect(placeholder()).not.toBeNull();
      expect(status().textContent?.trim()).toBe('Signez ici');
      expect(host.imageErrors).toHaveLength(1);
      // Not overwritten: a value this browser cannot decode may be valid elsewhere.
      expect(host.changes).toEqual([]);
      expect(host.value).toBe(SAMPLE);
    });

    it('re-exported, one of its own SVG values is extended, not nested — it does not grow', async () => {
      const { host, draw } = await setup(OWN_EXPORT);
      await draw([20, 20], [30, 30]);
      expect(svg(host.value)).not.toContain('<image');
      expect(paths(host.value)).toBe(2);
    });

    it('in PNG, holds the export until the previous signature is loaded — never drops it', async () => {
      vi.stubGlobal('Image', FakeImage);
      const { host, draw, settle } = await setup(PNG_SAMPLE, (h) => h.format.set('png'));
      await draw([0, 0], [5, 5]);
      expect(host.changes).toEqual([]);

      FakeImage.last!.onload!();
      await settle();
      // No 2D canvas in jsdom: the export falls back to SVG, previous signature included.
      expect(host.changes).toHaveLength(1);
      expect(svg(host.value)).toContain(`<image href="${PNG_SAMPLE}"`);
    });
  });

  it('falls back to SVG when the browser refuses to read the PNG back (tainted canvas)', async () => {
    const ctx = new Proxy({} as Record<string | symbol, unknown>, {
      get: (target, prop) =>
        prop in target
          ? target[prop]
          : prop === 'canvas'
            ? { width: 1, height: 1 }
            : () => undefined,
    });
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
      ctx as unknown as CanvasRenderingContext2D,
    );
    vi.spyOn(HTMLCanvasElement.prototype, 'toDataURL').mockImplementation(() => {
      throw new DOMException('Tainted canvases may not be exported.', 'SecurityError');
    });
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    setBox(100, 50);
    const { host, draw } = await setup(null, (h) => h.format.set('png'));
    await draw([0, 0], [5, 5]);
    expect(host.value!.startsWith('data:image/svg+xml')).toBe(true);
  });

  it('does not draw when read-only, and hides the clear button', async () => {
    const { host, draw, clearButton } = await setup(null, (h) => h.readonly.set(true));
    await draw([0, 0], [5, 5]);
    expect(host.changes).toEqual([]);
    expect(clearButton()).toBeNull();
  });

  it('does not draw when disabled, and leaves the tab order', async () => {
    const { host, draw, canvas } = await setup(null, (h) => h.disabled.set(true));
    await draw([0, 0], [5, 5]);
    expect(host.changes).toEqual([]);
    expect(canvas().hasAttribute('tabindex')).toBe(false);
    expect(canvas().getAttribute('aria-disabled')).toBe('true');
  });

  it('is named by its label and described by its state, required included', async () => {
    const { canvas, draw, status } = await setup(null, (h) => h.required.set(true));
    expect(canvas().getAttribute('role')).toBe('img');
    expect(canvas().getAttribute('aria-label')).toBe('Signature');
    expect(status().textContent?.trim()).toBe('Signez ici, obligatoire');
    await draw([0, 0], [5, 5]);
    expect(status().textContent?.trim()).toBe('Signature saisie, obligatoire');
  });

  it('marks the control touched on blur', async () => {
    const { host, canvas, settle } = await setup();
    const touched = vi.spyOn(host.sign() as unknown as { emitTouch(): void }, 'emitTouch');
    canvas().focus();
    canvas().blur();
    await settle();
    expect(touched).toHaveBeenCalled();
  });

  describe('reactive forms', () => {
    async function reactive() {
      const fixture = await render(ReactiveHost);
      fixture.detectChanges();
      await fixture.whenStable();
      return { fixture, host: fixture.componentInstance, ...helpers(fixture) };
    }

    it('is invalid while empty under Validators.required, valid once signed', async () => {
      const { host, draw } = await reactive();
      expect(host.control.valid).toBe(false);
      await draw([0, 0], [5, 5]);
      expect(host.control.valid).toBe(true);
      expect(host.control.value!.startsWith('data:image/svg+xml')).toBe(true);
    });

    it('keeps the strokes when the form writes back the value it received', async () => {
      const { host, draw, settle } = await reactive();
      await draw([0, 0], [5, 5]);
      await draw([10, 10], [15, 15]);
      // `setValue` DOES call writeValue: without the echo guard the two strokes would be
      // flattened into a background, and undo() would have nothing left to remove.
      host.control.setValue(host.control.value);
      await settle();
      host.sign().undo();
      await settle();
      expect(paths(host.control.value)).toBe(1);
    });

    it('reset() empties the field', async () => {
      const { fixture, host, draw, settle } = await reactive();
      await draw([0, 0], [5, 5]);
      host.control.reset();
      await settle();
      expect(fixture.nativeElement.querySelector('.ui-field-sign-placeholder')).not.toBeNull();
    });

    it('disable() from the form stops the pen', async () => {
      const { host, draw, settle } = await reactive();
      host.control.disable();
      await settle();
      await draw([0, 0], [5, 5]);
      expect(host.control.value).toBeNull();
    });
  });
});
