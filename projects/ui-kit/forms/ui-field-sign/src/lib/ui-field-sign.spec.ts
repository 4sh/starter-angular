/**
 * TestBed spec for `ui-field-sign` (FSHSP-266). What is worth asserting: the value leaves
 * once a stroke ends (never mid-stroke), `null` means empty, the form's echo does not wipe
 * the strokes, and the read-only / disabled states really stop the pen.
 *
 * jsdom has no 2D canvas: the field falls back to its SVG export, so the host asks for
 * `format="svg"` and nothing depends on pixels. Pixels are checked in Storybook.
 */
import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { type FieldSignValue, UiFieldSign } from './ui-field-sign';

@Component({
  imports: [FormsModule, UiFieldSign],
  template: `<ui-field-sign
    label="Signature"
    format="svg"
    [readonly]="readonly()"
    [disabled]="disabled()"
    [clearable]="clearable()"
    [(ngModel)]="value"
    (valueChange)="changes.push($event)"
  />`,
})
class SignHost {
  readonly sign = viewChild.required(UiFieldSign);
  readonly readonly = signal(false);
  readonly disabled = signal(false);
  readonly clearable = signal(true);
  value: FieldSignValue = null;
  changes: FieldSignValue[] = [];
}

const SAMPLE = 'data:image/svg+xml;charset=utf-8,%3Csvg%2F%3E';

async function setup(initialValue: FieldSignValue = null) {
  await TestBed.configureTestingModule({ imports: [SignHost] }).compileComponents();
  const fixture: ComponentFixture<SignHost> = TestBed.createComponent(SignHost);
  fixture.componentInstance.value = initialValue;
  fixture.detectChanges();
  await fixture.whenStable();
  // `ngModel` writes the initial value asynchronously: one more pass to render it.
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.componentInstance;
  const canvas = () => fixture.nativeElement.querySelector('canvas') as HTMLCanvasElement;
  const clearButton = () =>
    fixture.nativeElement.querySelector('.ui-field-sign-clear') as HTMLButtonElement | null;
  const placeholder = () => fixture.nativeElement.querySelector('.ui-field-sign-placeholder');
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const pointer = (type: string, x: number, y: number, pointerId = 1) =>
    canvas().dispatchEvent(
      new PointerEvent(type, {
        pointerId,
        pointerType: 'touch',
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
  return { fixture, host, canvas, clearButton, placeholder, settle, pointer, draw };
}

describe('ui-field-sign', () => {
  // jsdom answers `null` anyway, but logs on every call: answer it silently.
  beforeEach(() => {
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(null);
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
    const value = host.changes[0]!;
    expect(value.startsWith('data:image/svg+xml')).toBe(true);
    expect(decodeURIComponent(value)).toContain('<path d="M10 10Q20 15 25 20L30 25"/>');
    expect(host.value).toBe(value);
  });

  it('exports in `exportColor`, not in the screen ink', async () => {
    const { host, draw } = await setup();
    await draw([0, 0], [5, 5]);
    expect(decodeURIComponent(host.value!)).toContain('stroke="black"');
  });

  it('hides the placeholder and enables clearing once signed', async () => {
    const { draw, placeholder, clearButton } = await setup();
    await draw([0, 0], [5, 5]);
    expect(placeholder()).toBeNull();
    expect(clearButton()?.disabled).toBe(false);
  });

  it('keeps earlier strokes when the form echoes the emitted value back', async () => {
    const { host, draw } = await setup();
    await draw([0, 0], [5, 5]);
    await draw([10, 10], [15, 15]);
    // ngModel wrote each emitted value back: had it reset the strokes, the second export
    // would only hold one path.
    expect(decodeURIComponent(host.value!).match(/<path /g)).toHaveLength(2);
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
    expect(decodeURIComponent(host.value!).match(/<path /g)).toHaveLength(1);
  });

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
    expect(decodeURIComponent(host.value!).match(/<path /g)).toHaveLength(1);
    host.sign().undo();
    await settle();
    expect(host.value).toBeNull();
  });

  it('Ctrl+Z undoes and Delete clears, on the drawing area', async () => {
    const { host, draw, canvas, settle } = await setup();
    await draw([0, 0], [5, 5]);
    await draw([10, 10], [15, 15]);
    canvas().dispatchEvent(new KeyboardEvent('keydown', { key: 'z', ctrlKey: true }));
    await settle();
    expect(decodeURIComponent(host.value!).match(/<path /g)).toHaveLength(1);
    canvas().dispatchEvent(new KeyboardEvent('keydown', { key: 'Delete' }));
    await settle();
    expect(host.value).toBeNull();
  });

  it('shows a value written by the form, and keeps it under new strokes', async () => {
    const { host, placeholder, draw } = await setup(SAMPLE);
    expect(placeholder()).toBeNull();
    await draw([0, 0], [5, 5]);
    const svg = decodeURIComponent(host.value!);
    expect(svg).toContain(`<image href="${SAMPLE}"`);
    expect(svg.match(/<path /g)).toHaveLength(1);
  });

  it('undo() does not remove a value written by the form — clear() does', async () => {
    const { host, settle } = await setup(SAMPLE);
    host.sign().undo();
    await settle();
    expect(host.changes).toEqual([]);
    host.sign().clear();
    await settle();
    expect(host.value).toBeNull();
  });

  it('does not draw when read-only, and hides the clear button', async () => {
    const { host, draw, clearButton, settle } = await setup();
    host.readonly.set(true);
    await settle();
    await draw([0, 0], [5, 5]);
    expect(host.changes).toEqual([]);
    expect(clearButton()).toBeNull();
  });

  it('does not draw when disabled, and leaves the tab order', async () => {
    const { host, draw, canvas, settle } = await setup();
    host.disabled.set(true);
    await settle();
    await draw([0, 0], [5, 5]);
    expect(host.changes).toEqual([]);
    expect(canvas().hasAttribute('tabindex')).toBe(false);
    expect(canvas().getAttribute('aria-disabled')).toBe('true');
  });

  it('is named by its label and described by its state', async () => {
    const { canvas, draw, fixture } = await setup();
    expect(canvas().getAttribute('role')).toBe('img');
    expect(canvas().getAttribute('aria-label')).toBe('Signature');
    const status = () =>
      fixture.nativeElement.querySelector(
        `#${canvas().getAttribute('aria-describedby')!.split(' ')[0]}`,
      ) as HTMLElement;
    expect(status().textContent?.trim()).toBe('Signez ici');
    await draw([0, 0], [5, 5]);
    expect(status().textContent?.trim()).toBe('Signature saisie');
  });

  it('marks the control touched on blur', async () => {
    const { host, canvas, settle } = await setup();
    const touched = vi.spyOn(host.sign() as unknown as { emitTouch(): void }, 'emitTouch');
    canvas().focus();
    canvas().blur();
    await settle();
    expect(touched).toHaveBeenCalled();
  });
});
