/**
 * TestBed spec for a value the browser writes into `ui-autocomplete` without a
 * keystroke: the model follows, the query runs, but no panel opens under a
 * field the user is not in. With `forceSelection`, the suggestion carrying
 * that label is picked once it arrives.
 */
import { Component, signal, viewChild } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { AutocompleteCompleteEvent, UiAutocomplete } from './ui-autocomplete';

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
      [delay]="0"
      [completeOnFocus]="completeOnFocus()"
      [forceSelection]="forceSelection()"
      [suggestions]="suggestions()"
      [formControl]="control"
      (completeMethod)="onComplete($event)"
      (valueChange)="emitted.push($event)"
      (optionSelect)="selected.push($event)"
    />
  `,
})
class FillHost {
  readonly autocomplete = viewChild.required(UiAutocomplete);
  readonly control = new FormControl<string | null>(null);
  readonly forceSelection = signal(false);
  readonly completeOnFocus = signal(false);
  readonly suggestions = signal<string[]>([]);
  /** Answers each query at once, unless the test answers it later. */
  answerAtOnce = true;
  readonly queries: string[] = [];
  readonly emitted: unknown[] = [];
  readonly selected: unknown[] = [];

  onComplete(event: AutocompleteCompleteEvent): void {
    this.queries.push(event.query);
    if (this.answerAtOnce) this.answer(event.query);
  }

  answer(query: string): void {
    const needle = query.trim().toLowerCase();
    this.suggestions.set(CITIES.filter((c) => c.toLowerCase().includes(needle)));
  }
}

async function setup(forceSelection = false) {
  await TestBed.configureTestingModule({ imports: [FillHost] }).compileComponents();
  const fixture: ComponentFixture<FillHost> = TestBed.createComponent(FillHost);
  fixture.componentInstance.forceSelection.set(forceSelection);
  fixture.detectChanges();
  await fixture.whenStable();
  const input = fixture.nativeElement.querySelector('.ui-autocomplete-input') as HTMLInputElement;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const fire = async (type: string, animationName?: string) => {
    const event = new Event(type, { bubbles: true });
    if (animationName) Object.defineProperty(event, 'animationName', { value: animationName });
    input.dispatchEvent(event);
    await settle();
  };
  return { host: fixture.componentInstance, input, settle, fire };
}

const panel = () => document.querySelector('.ui-autocomplete-panel');
const tick = () => new Promise((resolve) => setTimeout(resolve));

describe('UiAutocomplete — browser fill', () => {
  it('takes a value written without focus, queries at once, opens nothing', async () => {
    const { host, input, fire } = await setup();
    input.value = 'Paris';
    await fire('input');
    await tick();
    expect(host.control.value).toBe('Paris');
    expect(host.emitted).toEqual(['Paris']);
    expect(host.queries).toEqual(['Paris']);
    expect(panel()).toBeNull();
    expect(document.activeElement).not.toBe(input);
  });

  it('takes a value revealed by a change alone, once', async () => {
    const { host, input, fire } = await setup();
    input.value = 'Lyon';
    await fire('change');
    await fire('animationstart', 'ui-browser-fill');
    await tick();
    expect(host.control.value).toBe('Lyon');
    expect(host.emitted).toEqual(['Lyon']);
    expect(host.queries).toEqual(['Lyon']);
    expect(panel()).toBeNull();
  });

  it('still opens the panel for a typed query', async () => {
    const { host, input, settle, fire } = await setup();
    input.focus();
    input.value = 'Par';
    await fire('input');
    await tick();
    await settle();
    expect(host.queries).toEqual(['Par']);
    expect(panel()).not.toBeNull();
  });

  describe('with forceSelection', () => {
    it('picks the suggestion carrying the filled label', async () => {
      const { host, input, fire } = await setup(true);
      input.value = 'paris';
      await fire('input');
      expect(host.control.value).toBe('Paris');
      expect(host.selected).toEqual(['Paris']);
      expect(input.value).toBe('Paris');
      expect(panel()).toBeNull();
    });

    it('waits for the suggestions answering the query', async () => {
      const { host, input, settle, fire } = await setup(true);
      host.answerAtOnce = false;
      input.value = 'Marseille';
      await fire('change');
      expect(host.control.value).toBeNull();
      host.answer('Marseille');
      await settle();
      expect(host.control.value).toBe('Marseille');
      expect(host.selected).toEqual(['Marseille']);
    });

    it('keeps the model empty when no suggestion carries the label', async () => {
      const { host, input, fire } = await setup(true);
      input.value = 'Pa';
      await fire('input');
      expect(host.control.value).toBeNull();
      expect(host.selected).toEqual([]);
    });

    it('drops the pending fill once the user types', async () => {
      const { host, input, settle, fire } = await setup(true);
      host.answerAtOnce = false;
      input.value = 'Lyon';
      await fire('input');
      input.focus();
      input.value = 'Lyo';
      await fire('input');
      host.answer('Lyon');
      await settle();
      expect(host.control.value).toBeNull();
      expect(host.selected).toEqual([]);
    });
  });

  it('ignores the focus event Chrome sends to a field its autofill fills', async () => {
    const { host, input, settle } = await setup();
    host.completeOnFocus.set(true);
    await settle();
    input.dispatchEvent(new FocusEvent('focus'));
    await settle();
    expect(host.queries).toEqual([]);
    expect(panel()).toBeNull();
    input.focus();
    await settle();
    expect(host.queries).toEqual(['']);
  });

  it('exposes its native input and closes without taking the focus', async () => {
    const { host, input, settle, fire } = await setup();
    expect(host.autocomplete().nativeInputElement()).toBe(input);
    input.focus();
    input.value = 'Par';
    await fire('input');
    await tick();
    await settle();
    expect(panel()).not.toBeNull();
    input.blur();
    host.autocomplete().close();
    await settle();
    expect(panel()).toBeNull();
    expect(document.activeElement).not.toBe(input);
  });
});
