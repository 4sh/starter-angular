/**
 * Roving-tabindex keyboard navigation of `ui-tab-list` (WAI-ARIA tabs pattern):
 * only the active tab (or the first enabled one, absent an active value) is a
 * tab stop; Arrow keys move the roving focus along the list's axis, wrapping
 * at the ends, and Home/End jump to the first/last enabled tab.
 */
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeAll, describe, expect, it } from 'vitest';
import { UiTab, UiTabList, UiTabPanel, UiTabPanels, UiTabs } from './ui-tabs';

// jsdom has no ResizeObserver: `ui-tab-list` observes its scroll viewport to
// re-measure the sliding indicator and the scroll navigators. Not exercised
// by these keyboard-navigation tests, but the component still instantiates it.
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
  imports: [UiTabs, UiTabList, UiTab, UiTabPanels, UiTabPanel],
  template: `
    <ui-tabs [(value)]="active" [orientation]="orientation()">
      <ui-tab-list ariaLabel="Sections">
        <ui-tab [value]="0">Un</ui-tab>
        <ui-tab [value]="1">Deux</ui-tab>
        <ui-tab [value]="2" [disabled]="disableThird()">Trois</ui-tab>
      </ui-tab-list>
      <ui-tab-panels>
        <ui-tab-panel [value]="0">Contenu 1</ui-tab-panel>
        <ui-tab-panel [value]="1">Contenu 2</ui-tab-panel>
        <ui-tab-panel [value]="2">Contenu 3</ui-tab-panel>
      </ui-tab-panels>
    </ui-tabs>
  `,
})
class Host {
  active: number | undefined = 0;
  readonly orientation = signal<'horizontal' | 'vertical'>('horizontal');
  readonly disableThird = signal(false);
}

/** `ui-tabs` as a navigation menu: tabs, but no `ui-tab-panels` at all (the content lives
 *  behind a router outlet). See the `TabMenu` story. */
@Component({
  imports: [UiTabs, UiTabList, UiTab],
  template: `
    <ui-tabs [value]="0">
      <ui-tab-list ariaLabel="Navigation">
        <ui-tab [value]="0">Un</ui-tab>
        <ui-tab [value]="1">Deux</ui-tab>
      </ui-tab-list>
    </ui-tabs>
  `,
})
class PanellessHost {}

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
    (fixture.nativeElement as HTMLElement).querySelectorAll('button.ui-tab-button'),
  ) as HTMLButtonElement[];
  return { fixture, host: fixture.componentInstance, buttons };
}

function arrowKey(el: HTMLElement, key: string): void {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

describe('UiTabList — roving tabindex', () => {
  it('exposes only the active tab as a tab stop, the rest at -1', async () => {
    const { buttons } = await setup();
    expect(buttons[0].getAttribute('tabindex')).toBe('0');
    expect(buttons[1].getAttribute('tabindex')).toBe('-1');
    expect(buttons[2].getAttribute('tabindex')).toBe('-1');
  });

  it('moves the tab stop to the first enabled tab when none is active', async () => {
    const { fixture, host, buttons } = await setup();
    host.active = undefined;
    fixture.detectChanges();
    await fixture.whenStable();
    expect(buttons[0].getAttribute('tabindex')).toBe('0');
  });

  describe('horizontal orientation (default)', () => {
    it('ArrowRight moves focus to the next tab', async () => {
      const { fixture, buttons } = await setup();
      buttons[0].focus();
      arrowKey(buttons[0], 'ArrowRight');
      fixture.detectChanges();
      expect(document.activeElement).toBe(buttons[1]);
    });

    it('ArrowRight wraps around from the last tab to the first', async () => {
      const { fixture, buttons } = await setup();
      buttons[2].focus();
      arrowKey(buttons[2], 'ArrowRight');
      fixture.detectChanges();
      expect(document.activeElement).toBe(buttons[0]);
    });

    it('ArrowLeft moves focus to the previous tab, wrapping at the start', async () => {
      const { fixture, buttons } = await setup();
      buttons[0].focus();
      arrowKey(buttons[0], 'ArrowLeft');
      fixture.detectChanges();
      expect(document.activeElement).toBe(buttons[2]);
    });

    it('Home moves focus to the first tab, End to the last', async () => {
      const { fixture, buttons } = await setup();
      buttons[1].focus();
      arrowKey(buttons[1], 'Home');
      fixture.detectChanges();
      expect(document.activeElement).toBe(buttons[0]);

      arrowKey(buttons[0], 'End');
      fixture.detectChanges();
      expect(document.activeElement).toBe(buttons[2]);
    });

    it('skips a disabled tab when roving with the arrow keys', async () => {
      const { fixture, host, buttons } = await setup();
      host.disableThird.set(true);
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

/**
 * The tab label is projected through `<ng-content>`, and the `aria-controls` wiring depends on
 * whether panels exist at all — neither was asserted anywhere before.
 *
 * Motivated by FSHSP-106, where a content-query change in the container silently dropped every
 * projected label but the first. Note these tests would NOT have caught that one: verified by
 * reintroducing the faulty query, and they still pass. The defect only shows in a real compiled
 * build, not under TestBed/jsdom — the Storybook a11y run is what surfaced it (as `button-name`
 * on the tabs whose label vanished). Kept anyway: they pin the two contracts cheaply.
 */
describe('UiTab — projected label', () => {
  it('renders every tab label, not just the first', async () => {
    const { buttons } = await setup();
    expect(buttons.map((b) => b.textContent?.trim())).toEqual(['Un', 'Deux', 'Trois']);
  });
});

describe('UiTab — aria-controls', () => {
  it('points at the panel id when panels are projected', async () => {
    const { buttons } = await setup();
    for (const button of buttons) {
      expect(button.getAttribute('aria-controls')).toMatch(/^ui-tabs-\d+-panel-/);
    }
  });

  it('is omitted entirely when no panel is projected', async () => {
    await TestBed.configureTestingModule({ imports: [PanellessHost] }).compileComponents();
    const fixture = TestBed.createComponent(PanellessHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const buttons = Array.from(
      (fixture.nativeElement as HTMLElement).querySelectorAll('button.ui-tab-button'),
    ) as HTMLButtonElement[];

    expect(buttons.map((b) => b.textContent?.trim())).toEqual(['Un', 'Deux']);
    for (const button of buttons) {
      expect(button.hasAttribute('aria-controls')).toBe(false);
    }
  });
});
