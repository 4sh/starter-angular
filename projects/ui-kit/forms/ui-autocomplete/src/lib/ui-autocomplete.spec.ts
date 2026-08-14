/**
 * TestBed spec for `ui-autocomplete`'s dropdown overlay: open/close via the
 * `dropdown` trigger, keyboard navigation (ArrowUp/ArrowDown) and selection
 * (Enter). Follows the pattern from `base-control-value-accessor.spec.ts`
 * (FSHSP-93) / `ui-select.spec.ts`: a minimal host component +
 * `TestBed.configureTestingModule`.
 *
 * The suggestions panel is rendered through a CDK `cdkConnectedOverlay`, so
 * once opened its content is attached to the global overlay container
 * (appended to `document.body`, not `fixture.nativeElement`) — assertions on
 * the panel/options query `document` directly.
 *
 * `dropdown` is used as the trigger (rather than typing) so the query runs
 * synchronously on click (`dropdownMode="blank"`), with no `delay` debounce
 * to fake-time around.
 */
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { AutocompleteCompleteEvent, UiAutocomplete } from './ui-autocomplete';

// jsdom doesn't implement scrollIntoView (used to keep the focused option
// visible) — stub it so `setFocusedIndex` doesn't throw during navigation.
if (!Element.prototype.scrollIntoView) {
  // eslint-disable-next-line @typescript-eslint/no-empty-function -- jsdom stub, intentionally a no-op
  Element.prototype.scrollIntoView = () => {};
}

const CITIES = ['Paris', 'Lyon', 'Marseille'];

@Component({
  imports: [ReactiveFormsModule, UiAutocomplete],
  template: `
    <ui-autocomplete
      label="Ville"
      dropdown
      [suggestions]="suggestions"
      [formControl]="control"
      (completeMethod)="onComplete($event)"
    />
  `,
})
class AutocompleteHost {
  readonly control = new FormControl<string | null>(null);
  suggestions: string[] = [];

  onComplete(event: AutocompleteCompleteEvent): void {
    const needle = event.query.trim().toLowerCase();
    this.suggestions = needle ? CITIES.filter((c) => c.toLowerCase().includes(needle)) : CITIES;
  }
}

async function setup() {
  await TestBed.configureTestingModule({ imports: [AutocompleteHost] }).compileComponents();
  const fixture: ComponentFixture<AutocompleteHost> = TestBed.createComponent(AutocompleteHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const input = fixture.nativeElement.querySelector('.ui-autocomplete-input') as HTMLInputElement;
  const dropdownTrigger = fixture.nativeElement.querySelector('.ui-autocomplete-dropdown') as HTMLButtonElement;
  return { fixture, host: fixture.componentInstance, input, dropdownTrigger };
}

function panelOptions(): HTMLElement[] {
  return Array.from(document.querySelectorAll('.ui-autocomplete-option'));
}

async function keydown(target: HTMLElement, key: string, fixture: ComponentFixture<unknown>) {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  fixture.detectChanges();
  await fixture.whenStable();
}

describe('UiAutocomplete — dropdown overlay', () => {
  it('is closed by default', async () => {
    await setup();
    expect(document.querySelector('.ui-autocomplete-panel')).toBeNull();
    expect(panelOptions().length).toBe(0);
  });

  it('opens the panel on dropdown trigger click', async () => {
    const { fixture, dropdownTrigger } = await setup();
    dropdownTrigger.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.querySelector('.ui-autocomplete-panel')).not.toBeNull();
    expect(panelOptions().map((el) => el.textContent?.trim())).toEqual(CITIES);
  });

  it('ArrowDown moves the visual focus to the next option', async () => {
    const { fixture, input, dropdownTrigger } = await setup();
    dropdownTrigger.click();
    fixture.detectChanges();
    await fixture.whenStable();
    await keydown(input, 'ArrowDown', fixture); // focuses index 0
    let options = panelOptions();
    expect(options[0].classList.contains('_focused')).toBe(true);

    await keydown(input, 'ArrowDown', fixture); // moves to index 1
    options = panelOptions();
    expect(options[0].classList.contains('_focused')).toBe(false);
    expect(options[1].classList.contains('_focused')).toBe(true);
  });

  it('ArrowUp moves the visual focus to the previous option', async () => {
    const { fixture, input, dropdownTrigger } = await setup();
    dropdownTrigger.click();
    fixture.detectChanges();
    await fixture.whenStable();
    await keydown(input, 'ArrowDown', fixture); // index 0
    await keydown(input, 'ArrowDown', fixture); // index 1
    await keydown(input, 'ArrowUp', fixture); // back to index 0
    const options = panelOptions();
    expect(options[0].classList.contains('_focused')).toBe(true);
    expect(options[1].classList.contains('_focused')).toBe(false);
  });

  it('Escape closes the panel', async () => {
    const { fixture, input, dropdownTrigger } = await setup();
    dropdownTrigger.click();
    fixture.detectChanges();
    await fixture.whenStable();
    expect(document.querySelector('.ui-autocomplete-panel')).not.toBeNull();
    await keydown(input, 'Escape', fixture);
    expect(document.querySelector('.ui-autocomplete-panel')).toBeNull();
  });

  it('Enter selects the focused option and closes the panel', async () => {
    const { fixture, host, input, dropdownTrigger } = await setup();
    dropdownTrigger.click();
    fixture.detectChanges();
    await fixture.whenStable();
    await keydown(input, 'ArrowDown', fixture); // focus 'Paris'
    await keydown(input, 'ArrowDown', fixture); // focus 'Lyon'
    await keydown(input, 'Enter', fixture);
    expect(host.control.value).toBe('Lyon');
    expect(document.querySelector('.ui-autocomplete-panel')).toBeNull();
  });
});
