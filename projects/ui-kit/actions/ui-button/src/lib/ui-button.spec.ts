/**
 * Ripple declaration of `ui-button`: the component marks the control it renders
 * so a delegated ripple root (global or `[uiRippleScope]`) picks it up, and the
 * `ripple` input flips that marker to the opt-out value.
 *
 * The marker is a plain attribute on purpose: `@4sh/ui-kit/actions/ui-button`
 * takes no dependency on `@4sh/ui-kit/ripple`, so a project that never enables
 * the effect ships none of its code.
 */
import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { UiButton } from './ui-button';

@Component({
  imports: [UiButton],
  template: `
    <ui-button class="plain" label="Valider" [ripple]="on()" />
    <ui-button class="linked" label="Voir" href="/ailleurs" [ripple]="on()" />
  `,
})
class Host {
  readonly on = signal(true);
}

async function setup() {
  await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  await fixture.whenStable();
  const root = fixture.nativeElement as HTMLElement;
  const attr = (selector: string) =>
    root.querySelector(selector)?.getAttribute('data-ripple') ?? null;
  return { fixture, attr };
}

describe('UiButton, ripple declaration', () => {
  it('marks the rendered control, button and link alike', async () => {
    const { attr } = await setup();
    expect(attr('.plain button')).toBe('on');
    expect(attr('.linked a')).toBe('on');
  });

  it('flips the marker to `off` when the input says so', async () => {
    const { fixture, attr } = await setup();
    fixture.componentInstance.on.set(false);
    fixture.detectChanges();
    await fixture.whenStable();

    expect(attr('.plain button')).toBe('off');
    expect(attr('.linked a')).toBe('off');
  });
});
