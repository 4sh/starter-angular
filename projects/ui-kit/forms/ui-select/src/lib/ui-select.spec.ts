/**
 * TestBed spec for `ui-select`'s dropdown overlay: open/close, keyboard
 * navigation (ArrowUp/ArrowDown) and selection (Enter). Follows the pattern
 * from `base-control-value-accessor.spec.ts` (FSHSP-93): a minimal host
 * component + `TestBed.configureTestingModule`.
 *
 * The options panel is rendered through a CDK `cdkConnectedOverlay`, so once
 * opened its content is attached to the global overlay container (appended to
 * `document.body`, not `fixture.nativeElement`) — assertions on the panel/options
 * query `document` directly.
 */
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { UiSelect } from './ui-select';

// jsdom doesn't implement scrollIntoView (used to keep the focused option
// visible) — stub it so `setFocusedIndex` doesn't throw during navigation.
if (!Element.prototype.scrollIntoView) {
  // eslint-disable-next-line @typescript-eslint/no-empty-function -- jsdom stub, intentionally a no-op
  Element.prototype.scrollIntoView = () => {};
}

const CITIES = ['Paris', 'Lyon', 'Marseille'];

@Component({
  imports: [ReactiveFormsModule, UiSelect],
  template: `<ui-select label="Ville" [options]="options" [formControl]="control" />`,
})
class SelectHost {
  readonly options = CITIES;
  readonly control = new FormControl<string | null>(null);
}

async function setup() {
  await TestBed.configureTestingModule({ imports: [SelectHost] }).compileComponents();
  const fixture: ComponentFixture<SelectHost> = TestBed.createComponent(SelectHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const trigger = fixture.nativeElement.querySelector('.ui-select-trigger') as HTMLButtonElement;
  return { fixture, host: fixture.componentInstance, trigger };
}

function panelOptions(): HTMLElement[] {
  return Array.from(document.querySelectorAll('.ui-select-option'));
}

async function keydown(target: HTMLElement, key: string, fixture: ComponentFixture<unknown>) {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  fixture.detectChanges();
  await fixture.whenStable();
}

describe('UiSelect — dropdown overlay', () => {
  it('is closed by default', async () => {
    await setup();
    expect(document.querySelector('.ui-select-panel')).toBeNull();
    expect(panelOptions().length).toBe(0);
  });

  it('opens the panel on trigger click', async () => {
    const { fixture, trigger } = await setup();
    trigger.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.querySelector('.ui-select-panel')).not.toBeNull();
    expect(panelOptions().map((el) => el.textContent?.trim())).toEqual(CITIES);
  });

  it('ArrowDown opens the panel and focuses the first option', async () => {
    const { fixture, trigger } = await setup();
    await keydown(trigger, 'ArrowDown', fixture);
    expect(document.querySelector('.ui-select-panel')).not.toBeNull();
    const options = panelOptions();
    expect(options[0].classList.contains('_focused')).toBe(true);
  });

  it('ArrowDown moves the visual focus to the next option', async () => {
    const { fixture, trigger } = await setup();
    await keydown(trigger, 'ArrowDown', fixture); // opens, focuses index 0
    await keydown(trigger, 'ArrowDown', fixture); // moves to index 1
    const options = panelOptions();
    expect(options[0].classList.contains('_focused')).toBe(false);
    expect(options[1].classList.contains('_focused')).toBe(true);
  });

  it('ArrowUp moves the visual focus to the previous option', async () => {
    const { fixture, trigger } = await setup();
    await keydown(trigger, 'ArrowDown', fixture); // index 0
    await keydown(trigger, 'ArrowDown', fixture); // index 1
    await keydown(trigger, 'ArrowUp', fixture); // back to index 0
    const options = panelOptions();
    expect(options[0].classList.contains('_focused')).toBe(true);
    expect(options[1].classList.contains('_focused')).toBe(false);
  });

  it('Escape closes the panel', async () => {
    const { fixture, trigger } = await setup();
    await keydown(trigger, 'ArrowDown', fixture);
    expect(document.querySelector('.ui-select-panel')).not.toBeNull();
    await keydown(trigger, 'Escape', fixture);
    expect(document.querySelector('.ui-select-panel')).toBeNull();
  });

  it('Enter selects the focused option and closes the panel', async () => {
    const { fixture, host, trigger } = await setup();
    await keydown(trigger, 'ArrowDown', fixture); // focus 'Paris'
    await keydown(trigger, 'ArrowDown', fixture); // focus 'Lyon'
    await keydown(trigger, 'Enter', fixture);
    expect(host.control.value).toBe('Lyon');
    expect(document.querySelector('.ui-select-panel')).toBeNull();
  });
});
