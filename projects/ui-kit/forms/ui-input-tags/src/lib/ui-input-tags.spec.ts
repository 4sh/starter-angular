/**
 * TestBed spec for `ui-input-tags`'s typeahead dropdown overlay: open/close,
 * keyboard navigation (ArrowUp/ArrowDown) and selection (Enter). Follows the
 * pattern from `base-control-value-accessor.spec.ts` (FSHSP-93) /
 * `ui-select.spec.ts`: a minimal host component + `TestBed.configureTestingModule`.
 *
 * Unlike `ui-select`/`ui-autocomplete`, there is no click trigger: the panel
 * only exists in `typeahead` mode and opens on focus/typing. `completeOnFocus`
 * is used here so the query runs synchronously on focus, with no `delay`
 * debounce to fake-time around.
 *
 * The suggestions panel is rendered through a CDK `cdkConnectedOverlay`, so
 * once opened its content is attached to the global overlay container
 * (appended to `document.body`, not `fixture.nativeElement`) — assertions on
 * the panel/options query `document` directly.
 */
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { InputTagsCompleteEvent, UiInputTags } from './ui-input-tags';

// jsdom doesn't implement scrollIntoView (used to keep the focused option
// visible) — stub it so option navigation doesn't throw.
if (!Element.prototype.scrollIntoView) {
  // eslint-disable-next-line @typescript-eslint/no-empty-function -- jsdom stub, intentionally a no-op
  Element.prototype.scrollIntoView = () => {};
}

const FRUITS = ['Pomme', 'Poire', 'Banane'];

@Component({
  imports: [ReactiveFormsModule, UiInputTags],
  template: `
    <ui-input-tags
      label="Mots-clés"
      typeahead
      completeOnFocus
      [suggestions]="suggestions"
      [formControl]="control"
      (completeMethod)="onComplete($event)"
    />
  `,
})
class InputTagsHost {
  readonly control = new FormControl<string[]>([], { nonNullable: true });
  suggestions: string[] = [];

  onComplete(event: InputTagsCompleteEvent): void {
    const needle = event.query.trim().toLowerCase();
    this.suggestions = needle ? FRUITS.filter((f) => f.toLowerCase().includes(needle)) : FRUITS;
  }
}

async function setup() {
  await TestBed.configureTestingModule({ imports: [InputTagsHost] }).compileComponents();
  const fixture: ComponentFixture<InputTagsHost> = TestBed.createComponent(InputTagsHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const input = fixture.nativeElement.querySelector('.ui-input-tags-input') as HTMLInputElement;
  return { fixture, host: fixture.componentInstance, input };
}

function panelOptions(): HTMLElement[] {
  return Array.from(document.querySelectorAll('.ui-input-tags-option'));
}

// A real `.focus()` (not a synthetic dispatched event) so `document.activeElement`
// actually moves: `close()` re-focuses the input, and a synthetic-only "focus"
// would let that re-focus fire a *second* native focus event, re-opening the
// panel through `completeOnFocus`.
async function focusInput(input: HTMLInputElement, fixture: ComponentFixture<unknown>) {
  input.focus();
  fixture.detectChanges();
  await fixture.whenStable();
}

async function keydown(target: HTMLElement, key: string, fixture: ComponentFixture<unknown>) {
  target.dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true, cancelable: true }));
  fixture.detectChanges();
  await fixture.whenStable();
}

describe('UiInputTags — typeahead overlay', () => {
  it('is closed by default', async () => {
    await setup();
    expect(document.querySelector('.ui-input-tags-panel')).toBeNull();
    expect(panelOptions().length).toBe(0);
  });

  it('opens the panel on input focus (completeOnFocus)', async () => {
    const { fixture, input } = await setup();
    await focusInput(input, fixture);
    expect(document.querySelector('.ui-input-tags-panel')).not.toBeNull();
    expect(panelOptions().map((el) => el.textContent?.trim())).toEqual(FRUITS);
  });

  it('ArrowDown moves the visual focus to the next option', async () => {
    const { fixture, input } = await setup();
    await focusInput(input, fixture);
    await keydown(input, 'ArrowDown', fixture); // focuses index 0
    let options = panelOptions();
    expect(options[0].classList.contains('_focused')).toBe(true);

    await keydown(input, 'ArrowDown', fixture); // moves to index 1
    options = panelOptions();
    expect(options[0].classList.contains('_focused')).toBe(false);
    expect(options[1].classList.contains('_focused')).toBe(true);
  });

  it('ArrowUp moves the visual focus to the previous option', async () => {
    const { fixture, input } = await setup();
    await focusInput(input, fixture);
    await keydown(input, 'ArrowDown', fixture); // index 0
    await keydown(input, 'ArrowDown', fixture); // index 1
    await keydown(input, 'ArrowUp', fixture); // back to index 0
    const options = panelOptions();
    expect(options[0].classList.contains('_focused')).toBe(true);
    expect(options[1].classList.contains('_focused')).toBe(false);
  });

  it('Escape closes the panel', async () => {
    const { fixture, input } = await setup();
    await focusInput(input, fixture);
    expect(document.querySelector('.ui-input-tags-panel')).not.toBeNull();
    await keydown(input, 'Escape', fixture);
    expect(document.querySelector('.ui-input-tags-panel')).toBeNull();
  });

  it('Enter selects the focused suggestion, adds it as a tag and closes the panel', async () => {
    const { fixture, host, input } = await setup();
    await focusInput(input, fixture);
    await keydown(input, 'ArrowDown', fixture); // focus 'Pomme'
    await keydown(input, 'ArrowDown', fixture); // focus 'Poire'
    await keydown(input, 'Enter', fixture);
    expect(host.control.value).toEqual(['Poire']);
    expect(document.querySelector('.ui-input-tags-panel')).toBeNull();
  });
});
