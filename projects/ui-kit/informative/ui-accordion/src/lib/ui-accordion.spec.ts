/**
 * Roving-focus keyboard navigation of `ui-accordion` (WAI-ARIA accordion
 * pattern): Up/Down move focus between panel headers (wrapping at the ends)
 * and Home/End jump to the first/last enabled header.
 *
 * Note: unlike `ui-tabs` / `ui-segment-control`, the accordion does not manage
 * an explicit roving `tabindex` — each header is a plain native `<button>`
 * (all reachable via Tab in DOM order); only the *keyboard-arrow* focus
 * movement is roving. See `onKeydown` in `ui-accordion.ts`.
 */
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { UiAccordion, UiAccordionPanel } from './ui-accordion';

@Component({
  imports: [UiAccordion, UiAccordionPanel],
  template: `
    <ui-accordion [(value)]="active">
      <ui-accordion-panel [value]="'a'" header="Section A">Contenu A</ui-accordion-panel>
      <ui-accordion-panel [value]="'b'" header="Section B">Contenu B</ui-accordion-panel>
      <ui-accordion-panel [value]="'c'" header="Section C" [disabled]="disableThird()"
        >Contenu C</ui-accordion-panel
      >
    </ui-accordion>
  `,
})
class Host {
  readonly active = signal<string | undefined>(undefined);
  readonly disableThird = signal(false);
}

async function setup(): Promise<{
  fixture: ComponentFixture<Host>;
  host: Host;
  headers: HTMLButtonElement[];
}> {
  await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  await fixture.whenStable();
  const headers = Array.from(
    (fixture.nativeElement as HTMLElement).querySelectorAll('button.ui-accordion-header'),
  ) as HTMLButtonElement[];
  return { fixture, host: fixture.componentInstance, headers };
}

function arrowKey(el: HTMLElement, key: string): void {
  el.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));
}

describe('UiAccordion — roving focus across headers', () => {
  it('does not manage an explicit roving tabindex: every header is a native, reachable button', async () => {
    const { headers } = await setup();
    for (const header of headers) {
      expect(header.hasAttribute('tabindex')).toBe(false);
    }
  });

  it('ArrowDown moves focus to the next header', async () => {
    const { fixture, headers } = await setup();
    headers[0].focus();
    arrowKey(headers[0], 'ArrowDown');
    fixture.detectChanges();
    expect(document.activeElement).toBe(headers[1]);
  });

  it('ArrowDown wraps around from the last header to the first', async () => {
    const { fixture, headers } = await setup();
    headers[2].focus();
    arrowKey(headers[2], 'ArrowDown');
    fixture.detectChanges();
    expect(document.activeElement).toBe(headers[0]);
  });

  it('ArrowUp moves focus to the previous header, wrapping at the start', async () => {
    const { fixture, headers } = await setup();
    headers[0].focus();
    arrowKey(headers[0], 'ArrowUp');
    fixture.detectChanges();
    expect(document.activeElement).toBe(headers[2]);
  });

  it('Home moves focus to the first header, End to the last', async () => {
    const { fixture, headers } = await setup();
    headers[1].focus();
    arrowKey(headers[1], 'Home');
    fixture.detectChanges();
    expect(document.activeElement).toBe(headers[0]);

    arrowKey(headers[0], 'End');
    fixture.detectChanges();
    expect(document.activeElement).toBe(headers[2]);
  });

  it('skips a disabled panel header when roving with the arrow keys', async () => {
    const { fixture, host, headers } = await setup();
    host.disableThird.set(true);
    fixture.detectChanges();
    await fixture.whenStable();
    headers[1].focus();
    arrowKey(headers[1], 'ArrowDown');
    fixture.detectChanges();
    expect(document.activeElement).toBe(headers[0]);
  });
});
