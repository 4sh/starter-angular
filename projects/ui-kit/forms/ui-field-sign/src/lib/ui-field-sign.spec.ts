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

  it('exports in `exportColor`, not in the screen ink', async () => {
    const { host, draw } = await setup();
    await draw([0, 0], [5, 5]);
    expect(svg(host.value)).toContain('stroke="black"');
  });

  it('falls back to black when `exportColor` is not a colour — an invalid stroke is invisible', async () => {
    vi.stubGlobal('CSS', { supports: (_: string, v: string) => v !== 'var(--nope)' });
    vi.spyOn(console, 'warn').mockImplementation(() => undefined);
    const { host, draw } = await setup(null, (h) => h.exportColor.set('var(--nope)'));
    await draw([0, 0], [5, 5]);
    expect(svg(host.value)).toContain('stroke="black"');
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

  it('keeps its frame when the box is resized: nothing is cropped out of the value', async () => {
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

    it('shows the field empty when the image cannot be loaded', async () => {
      vi.stubGlobal('Image', FakeImage);
      vi.spyOn(console, 'warn').mockImplementation(() => undefined);
      const { placeholder, status, settle } = await setup(SAMPLE);
      expect(placeholder()).toBeNull();
      FakeImage.last!.onerror!();
      await settle();
      expect(placeholder()).not.toBeNull();
      expect(status().textContent?.trim()).toBe('Signez ici');
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
