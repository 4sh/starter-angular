/**
 * `scrollable` on `ui-stepper` (FSHSP-236): the step list becomes a horizontal scroll
 * viewport and scrolls by the minimum that brings the active step fully into view.
 *
 * jsdom has no layout: the strip's geometry is stubbed (8 steps of 120px behind a 38px
 * inline padding, the last one 44px wide, each title 80px wide centred on its 44px
 * marker), and `scrollTo` is a spy that does not move anything.
 */
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { UiStep, UiStepList, UiStepper, UiStepperOrientation } from './ui-stepper';

const STEP = 120;
const PADDING = 38;
const MARKER = 44;
const TITLE = 80;

@Component({
  imports: [UiStepper, UiStepList, UiStep],
  template: `
    <ui-stepper [(value)]="active" [scrollable]="scrollable()" [orientation]="orientation()">
      <ui-step-list ariaLabel="Étapes">
        @for (n of steps; track n) {
          <ui-step [value]="n">Étape {{ n }}</ui-step>
        }
      </ui-step-list>
    </ui-stepper>
  `,
})
class Host {
  readonly steps = [1, 2, 3, 4, 5, 6, 7, 8];
  readonly active = signal<number | undefined>(1);
  readonly scrollable = signal(true);
  readonly orientation = signal<UiStepperOrientation>('horizontal');
}

/** Fake ResizeObserver: tests fire the callbacks by hand (first layout, resize). */
let observers: (() => void)[] = [];
class FakeResizeObserver {
  constructor(private readonly callback: () => void) {}
  observe(): void {
    observers.push(this.callback);
  }
  unobserve(): void {
    // noop
  }
  disconnect(): void {
    observers = observers.filter((cb) => cb !== this.callback);
  }
}

const rect = (left: number, right: number) =>
  ({ left, right, width: right - left, top: 0, bottom: 0, height: 0, x: left, y: 0 }) as DOMRect;

/** Lay the strip out: `width` visible px, scrolled by `scrollLeft`. */
function layout(root: HTMLElement, width: number, scrollLeft = 0) {
  const strip = root.querySelector('ui-step-list') as HTMLElement;
  Object.defineProperty(strip, 'clientWidth', { configurable: true, value: width });
  Object.defineProperty(strip, 'scrollLeft', { configurable: true, value: scrollLeft });
  strip.getBoundingClientRect = () => rect(0, width);
  const scrollTo = vi.fn();
  strip.scrollTo = scrollTo as unknown as HTMLElement['scrollTo'];

  const steps = Array.from(root.querySelectorAll('ui-step')) as HTMLElement[];
  steps.forEach((step, i) => {
    const left = PADDING + i * STEP - scrollLeft;
    const right = left + (i === steps.length - 1 ? MARKER : STEP);
    const center = left + MARKER / 2;
    step.getBoundingClientRect = () => rect(left, right);
    const title = step.querySelector('.ui-step-title-text') as HTMLElement;
    title.getBoundingClientRect = () => rect(center - TITLE / 2, center + TITLE / 2);
  });
  return { strip, scrollTo };
}

async function setup(init?: (host: Host) => void) {
  await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
  const fixture = TestBed.createComponent(Host);
  init?.(fixture.componentInstance);
  fixture.detectChanges();
  await fixture.whenStable();
  return { fixture, host: fixture.componentInstance, root: fixture.nativeElement as HTMLElement };
}

async function activate(fixture: ComponentFixture<Host>, value: number) {
  fixture.componentInstance.active.set(value);
  fixture.detectChanges();
  await fixture.whenStable();
}

async function resize(fixture: ComponentFixture<Host>) {
  observers.forEach((cb) => cb());
  fixture.detectChanges();
  await fixture.whenStable();
}

describe('ui-stepper scrollable', () => {
  beforeEach(() => {
    observers = [];
    vi.stubGlobal('ResizeObserver', FakeResizeObserver);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('marks the list and the steps as scrollable, horizontal only', async () => {
    const { fixture, host, root } = await setup();
    const list = root.querySelector('ui-step-list') as HTMLElement;
    expect(list.classList).toContain('_scrollable');
    expect(root.querySelector('ui-step')!.classList).toContain('_scrollable');

    host.orientation.set('vertical');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(list.classList).not.toContain('_scrollable');
    expect(root.querySelector('ui-step')!.classList).not.toContain('_scrollable');
  });

  it('jumps to the active step on first layout, without animating', async () => {
    const { fixture, root } = await setup((host) => host.active.set(6));
    const { scrollTo } = layout(root, 300);
    await resize(fixture);
    // Step 6: [638, 758] → its end is 458px past the 300px viewport.
    expect(scrollTo).toHaveBeenCalledExactlyOnceWith({ left: 458, behavior: 'instant' });
  });

  it('scrolls a step clipped at the end by the minimum, animated', async () => {
    const { fixture, root } = await setup();
    const { scrollTo } = layout(root, 300);
    await resize(fixture);
    expect(scrollTo).not.toHaveBeenCalled(); // step 1 already fully visible.

    await activate(fixture, 3);
    // Step 3: [278, 398] with its connector → end aligned on the right edge.
    expect(scrollTo).toHaveBeenCalledExactlyOnceWith({ left: 98, behavior: 'auto' });
  });

  it('scrolls a step clipped at the start back to the start edge', async () => {
    const { fixture, root } = await setup((host) => host.active.set(5));
    const { scrollTo } = layout(root, 300, 500);
    await resize(fixture);
    scrollTo.mockClear();

    await activate(fixture, 2);
    // Step 2's title starts at 140 - 500 = -360: scroll back by 360.
    expect(scrollTo).toHaveBeenCalledExactlyOnceWith({ left: 140, behavior: 'auto' });
  });

  it('leaves a fully visible step alone', async () => {
    const { fixture, root } = await setup();
    const { scrollTo } = layout(root, 300);
    await resize(fixture);

    await activate(fixture, 2);
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('never scrolls the page', async () => {
    const original = Element.prototype.scrollIntoView;
    const intoView = vi.fn();
    Element.prototype.scrollIntoView = intoView;
    const windowScroll = vi.spyOn(window, 'scrollTo').mockImplementation(() => undefined);
    try {
      const { fixture, root } = await setup();
      const { scrollTo } = layout(root, 300);
      await resize(fixture);

      await activate(fixture, 8);
      expect(scrollTo).toHaveBeenCalledOnce();
      expect(intoView).not.toHaveBeenCalled();
      expect(windowScroll).not.toHaveBeenCalled();
    } finally {
      Element.prototype.scrollIntoView = original;
      windowScroll.mockRestore();
    }
  });

  it('does nothing without scrollable', async () => {
    const { fixture, root } = await setup((host) => host.scrollable.set(false));
    const { scrollTo } = layout(root, 300);
    expect(observers).toHaveLength(0);

    await activate(fixture, 8);
    expect(root.querySelector('ui-step-list')!.classList).not.toContain('_scrollable');
    expect(scrollTo).not.toHaveBeenCalled();
  });

  it('renders without ResizeObserver (jsdom in consumer tests)', async () => {
    vi.stubGlobal('ResizeObserver', undefined);
    const { fixture } = await setup();
    await activate(fixture, 4);
    expect(fixture.nativeElement.querySelector('ui-step-list')).not.toBeNull();
  });
});
