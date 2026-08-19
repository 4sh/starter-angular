/**
 * Roving-tabindex keyboard navigation of `ui-segment-control` (WAI-ARIA
 * radiogroup/radio pattern in single mode): only one segment is a tab stop
 * (the selected one, or the last-focused one absent a selection); Arrow keys
 * roving along the group's axis wrap at the ends and, in single mode, also
 * select (radio pattern); Home/End jump to the first/last enabled segment.
 */
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { beforeAll, describe, expect, it } from 'vitest';
import { SegmentControlOption, SegmentControlValue, UiSegmentControl } from './ui-segment-control';

// jsdom has no ResizeObserver: the control observes its own host to
// re-measure the sliding selection indicator. Not exercised by these
// keyboard-navigation tests, but the component still instantiates it.
beforeAll(() => {
  if (typeof ResizeObserver === 'undefined') {
    (globalThis as { ResizeObserver?: unknown }).ResizeObserver = class {
      observe(): void {
        // noop — geometry isn't relevant to keyboard-navigation assertions.
      }
      unobserve(): void {
        // noop
      }
      disconnect(): void {
        // noop
      }
    };
  }
});

@Component({
  imports: [UiSegmentControl, ReactiveFormsModule],
  template: `
    <ui-segment-control
      ariaLabel="Vue"
      [options]="options()"
      [orientation]="orientation()"
      [formControl]="control"
    />
  `,
})
class Host {
  readonly control = new FormControl<SegmentControlValue<string>>(null);
  readonly orientation = signal<'horizontal' | 'vertical'>('horizontal');
  readonly options = signal<SegmentControlOption<string>[]>([
    { label: 'Un', value: 'un' },
    { label: 'Deux', value: 'deux' },
    { label: 'Trois', value: 'trois' },
  ]);
}

async function setup(): Promise<{
  fixture: ComponentFixture<Host>;
  host: Host;
  buttons: HTMLButtonElement[];
}> {
  await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  await fixture.whenStable();
  const buttons = Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll('button.ui-segment-control-option'),
  ) as HTMLButtonElement[];
  return { fixture, host: fixture.componentInstance, buttons };
}

function arrowKey(el: HTMLElement, key: string): void {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

describe('UiSegmentControl — roving tabindex', () => {
  it('exposes only the first segment as a tab stop when nothing is selected', async () => {
    const { buttons } = await setup();
    expect(buttons[0].getAttribute('tabindex')).toBe('0');
    expect(buttons[1].getAttribute('tabindex')).toBe('-1');
    expect(buttons[2].getAttribute('tabindex')).toBe('-1');
  });

  it('moves the tab stop to the selected segment', async () => {
    const { fixture, host, buttons } = await setup();
    host.control.setValue('deux');
    fixture.detectChanges();
    await fixture.whenStable();
    expect(buttons[0].getAttribute('tabindex')).toBe('-1');
    expect(buttons[1].getAttribute('tabindex')).toBe('0');
    expect(buttons[2].getAttribute('tabindex')).toBe('-1');
  });

  describe('horizontal orientation (default)', () => {
    it('ArrowRight moves focus to the next segment and selects it (radio pattern)', async () => {
      const { fixture, host, buttons } = await setup();
      buttons[0].focus();
      arrowKey(buttons[0], 'ArrowRight');
      fixture.detectChanges();
      expect(document.activeElement).toBe(buttons[1]);
      expect(host.control.value).toBe('deux');
    });

    it('ArrowRight wraps around from the last segment to the first', async () => {
      const { fixture, buttons } = await setup();
      buttons[2].focus();
      arrowKey(buttons[2], 'ArrowRight');
      fixture.detectChanges();
      expect(document.activeElement).toBe(buttons[0]);
    });

    it('ArrowLeft moves focus to the previous segment, wrapping at the start', async () => {
      const { fixture, buttons } = await setup();
      buttons[0].focus();
      arrowKey(buttons[0], 'ArrowLeft');
      fixture.detectChanges();
      expect(document.activeElement).toBe(buttons[2]);
    });

    it('Home moves focus to the first segment, End to the last', async () => {
      const { fixture, buttons } = await setup();
      buttons[1].focus();
      arrowKey(buttons[1], 'Home');
      fixture.detectChanges();
      expect(document.activeElement).toBe(buttons[0]);

      arrowKey(buttons[0], 'End');
      fixture.detectChanges();
      expect(document.activeElement).toBe(buttons[2]);
    });

    it('skips a disabled segment when roving with the arrow keys', async () => {
      const { fixture, host, buttons } = await setup();
      host.options.set([
        { label: 'Un', value: 'un' },
        { label: 'Deux', value: 'deux' },
        { label: 'Trois', value: 'trois', disabled: true },
      ]);
      fixture.detectChanges();
      await fixture.whenStable();
      buttons[1].focus();
      arrowKey(buttons[1], 'ArrowRight');
      fixture.detectChanges();
      expect(document.activeElement).toBe(buttons[0]);
    });
  });

  describe('vertical orientation', () => {
    it('ArrowDown/ArrowUp move focus along the vertical axis, wrapping at the ends', async () => {
      const { fixture, host, buttons } = await setup();
      host.orientation.set('vertical');
      fixture.detectChanges();
      await fixture.whenStable();

      buttons[0].focus();
      arrowKey(buttons[0], 'ArrowDown');
      fixture.detectChanges();
      expect(document.activeElement).toBe(buttons[1]);

      arrowKey(buttons[1], 'ArrowUp');
      fixture.detectChanges();
      expect(document.activeElement).toBe(buttons[0]);

      arrowKey(buttons[0], 'ArrowUp');
      fixture.detectChanges();
      expect(document.activeElement).toBe(buttons[2]);
    });

    it('ArrowRight (the horizontal key) is a no-op in vertical orientation', async () => {
      const { fixture, host, buttons } = await setup();
      host.orientation.set('vertical');
      fixture.detectChanges();
      await fixture.whenStable();
      buttons[0].focus();
      arrowKey(buttons[0], 'ArrowRight');
      fixture.detectChanges();
      expect(document.activeElement).toBe(buttons[0]);
    });
  });
});
