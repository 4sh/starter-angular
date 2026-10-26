/**
 * TestBed spec for a value the browser writes into `ui-input-number` without a
 * keystroke: parsed into the model and formatted at once, since no blur follows.
 */
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { UiInputNumber } from './ui-input-number';

@Component({
  imports: [ReactiveFormsModule, UiInputNumber],
  template: `<ui-input-number
    label="Surface"
    locale="en-US"
    [formControl]="control"
    (valueChange)="emitted.push($event)"
  />`,
})
class FillHost {
  readonly control = new FormControl<number | null>(null);
  readonly emitted: (number | null)[] = [];
}

async function setup() {
  await TestBed.configureTestingModule({ imports: [FillHost] }).compileComponents();
  const fixture: ComponentFixture<FillHost> = TestBed.createComponent(FillHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
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

describe('ui-input-number — browser fill', () => {
  it('parses and formats a value written without focus', async () => {
    const { host, input, fire } = await setup();
    input.value = '1234.5';
    await fire('input');
    expect(host.control.value).toBe(1234.5);
    expect(input.value).toBe('1,234.5');
    expect(host.emitted).toEqual([1234.5]);
  });

  it('syncs a value revealed by the autofill animation alone, once', async () => {
    const { host, input, fire } = await setup();
    input.value = '42';
    await fire('animationstart', 'ui-browser-fill');
    await fire('change');
    expect(host.control.value).toBe(42);
    expect(host.emitted).toEqual([42]);
  });

  it('clears the text of a fill that is not a number', async () => {
    const { host, input, fire } = await setup();
    input.value = 'abc';
    await fire('change');
    expect(host.control.value).toBeNull();
    expect(input.value).toBe('');
  });

  it('leaves the typed text unformatted until blur', async () => {
    const { host, input, settle, fire } = await setup();
    input.focus();
    input.value = '1234';
    await fire('input');
    expect(input.value).toBe('1234');
    expect(host.control.value).toBe(1234);
    await fire('change');
    input.blur();
    await settle();
    expect(input.value).toBe('1,234');
    expect(host.emitted).toEqual([1234, 1234]);
  });
});
