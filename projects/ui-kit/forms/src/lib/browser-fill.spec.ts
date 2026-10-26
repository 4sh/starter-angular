/**
 * Spec for `UiBrowserFill`: which native events it reports as a possible
 * browser fill. Deduplication against what the host renders is the host's
 * job, covered by each field's own browser-fill spec.
 */
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { hasFocus, UiBrowserFill } from './browser-fill';

@Component({
  imports: [UiBrowserFill],
  template: `<input uiBrowserFill (browserFill)="fills.push($event)" />`,
})
class FillHost {
  readonly fills: Event[] = [];
}

async function setup() {
  await TestBed.configureTestingModule({ imports: [FillHost] }).compileComponents();
  const fixture: ComponentFixture<FillHost> = TestBed.createComponent(FillHost);
  fixture.detectChanges();
  const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  return { fills: fixture.componentInstance.fills, input };
}

function animationStart(el: HTMLElement, animationName: string): Event {
  const event = new Event('animationstart', { bubbles: true });
  Object.defineProperty(event, 'animationName', { value: animationName });
  el.dispatchEvent(event);
  return event;
}

describe('UiBrowserFill', () => {
  it('marks its host for the browser-fill stylesheet rule', async () => {
    const { input } = await setup();
    expect(input.classList).toContain('ui-browser-fill');
  });

  it('reports the autofill animation, under its encapsulated name too', async () => {
    const { fills, input } = await setup();
    const event = animationStart(input, '_ngcontent-ng-c1_ui-browser-fill');
    expect(fills).toEqual([event]);
  });

  it('ignores any other animation', async () => {
    const { fills, input } = await setup();
    animationStart(input, 'ui-ripple-wave');
    expect(fills).toEqual([]);
  });

  it('reports a change', async () => {
    const { fills, input } = await setup();
    const event = new Event('change', { bubbles: true });
    input.dispatchEvent(event);
    expect(fills).toEqual([event]);
  });

  it('leaves input to the host', async () => {
    const { fills, input } = await setup();
    input.dispatchEvent(new Event('input', { bubbles: true }));
    expect(fills).toEqual([]);
  });
});

describe('hasFocus', () => {
  it('tells the focused element apart', async () => {
    const { input } = await setup();
    expect(hasFocus(input)).toBe(false);
    input.focus();
    expect(hasFocus(input)).toBe(true);
  });
});
