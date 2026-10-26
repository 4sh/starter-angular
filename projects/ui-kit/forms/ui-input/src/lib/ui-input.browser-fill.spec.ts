/**
 * TestBed spec for a value the browser writes into `ui-input` without a
 * keystroke (autofill): the model, `valueChange` and the CVA must follow,
 * exactly once, while typing keeps emitting once per `input`.
 */
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { UiInput } from './ui-input';

@Component({
  imports: [ReactiveFormsModule, UiInput],
  template: `<ui-input
    label="Code postal"
    [formControl]="control"
    (valueChange)="emitted.push($event)"
  />`,
})
class FillHost {
  readonly control = new FormControl('');
  readonly emitted: string[] = [];
}

async function setup() {
  await TestBed.configureTestingModule({ imports: [FillHost] }).compileComponents();
  const fixture: ComponentFixture<FillHost> = TestBed.createComponent(FillHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const host = fixture.componentInstance;
  const changes: (string | null)[] = [];
  host.control.valueChanges.subscribe((value) => changes.push(value));
  const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  const fire = async (type: string, init: Record<string, unknown> = {}) => {
    const event = new Event(type, { bubbles: true });
    for (const [key, value] of Object.entries(init)) Object.defineProperty(event, key, { value });
    input.dispatchEvent(event);
    await settle();
  };
  const autofill = () => fire('animationstart', { animationName: 'ui-browser-fill' });
  return { host, input, changes, settle, fire, autofill };
}

describe('ui-input — browser fill', () => {
  it('syncs a value revealed by the autofill animation alone', async () => {
    const { host, input, changes, autofill } = await setup();
    input.value = '75001';
    await autofill();
    expect(host.control.value).toBe('75001');
    expect(host.emitted).toEqual(['75001']);
    expect(changes).toEqual(['75001']);
  });

  it('syncs a value revealed by a change alone', async () => {
    const { host, input, fire } = await setup();
    input.value = '75001';
    await fire('change');
    expect(host.control.value).toBe('75001');
    expect(host.emitted).toEqual(['75001']);
  });

  it('emits once for a fill reported through input, change and animation', async () => {
    const { host, input, changes, fire, autofill } = await setup();
    input.value = '75001';
    await fire('input');
    await fire('change');
    await autofill();
    expect(host.emitted).toEqual(['75001']);
    expect(changes).toEqual(['75001']);
  });

  it('ignores an autofill animation over a value it cannot read yet', async () => {
    const { host, autofill } = await setup();
    await autofill();
    expect(host.emitted).toEqual([]);
  });

  it('keeps emitting once per keystroke, none on the closing change', async () => {
    const { host, input, changes, fire } = await setup();
    input.focus();
    for (const value of ['7', '75', '750']) {
      input.value = value;
      await fire('input');
    }
    await fire('change');
    input.blur();
    expect(host.emitted).toEqual(['7', '75', '750']);
    expect(changes).toEqual(['7', '75', '750']);
  });

  it('emits a paste once', async () => {
    const { host, input, fire } = await setup();
    input.focus();
    input.value = '75001';
    await fire('input', { inputType: 'insertFromPaste' });
    await fire('change');
    input.blur();
    expect(host.emitted).toEqual(['75001']);
  });

  it('syncs a fill repeating a text typed before the form reset it', async () => {
    const { host, input, settle, fire, autofill } = await setup();
    input.focus();
    input.value = '75001';
    await fire('input');
    host.control.setValue('');
    await settle();
    input.blur();
    input.value = '75001';
    await autofill();
    expect(host.control.value).toBe('75001');
    expect(host.emitted).toEqual(['75001', '75001']);
  });

  it('syncs a fill over a value the form wrote', async () => {
    const { host, input, settle, autofill } = await setup();
    host.control.setValue('13001');
    await settle();
    expect(input.value).toBe('13001');
    input.value = '75001';
    await autofill();
    expect(host.control.value).toBe('75001');
  });
});
