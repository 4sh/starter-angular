/**
 * TestBed spec for a value the browser writes into `ui-input-mask` without a
 * keystroke: masked into the model, without pulling the focus in.
 */
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it, vi } from 'vitest';
import { UiInputMask } from './ui-input-mask';

@Component({
  imports: [ReactiveFormsModule, UiInputMask],
  template: `<ui-input-mask
    label="Téléphone"
    mask="99 99 99 99 99"
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
  const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
  const fire = async (type: string, animationName?: string) => {
    const event = new Event(type, { bubbles: true });
    if (animationName) Object.defineProperty(event, 'animationName', { value: animationName });
    input.dispatchEvent(event);
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return { host: fixture.componentInstance, input, fire };
}

describe('ui-input-mask — browser fill', () => {
  it('masks a value written without focus, leaving the caret alone', async () => {
    const { host, input, fire } = await setup();
    const select = vi.spyOn(input, 'setSelectionRange');
    input.value = '0612345678';
    await fire('input');
    expect(host.control.value).toBe('06 12 34 56 78');
    expect(input.value).toBe('06 12 34 56 78');
    expect(select).not.toHaveBeenCalled();
    expect(document.activeElement).not.toBe(input);
  });

  it('syncs a value revealed by a change alone, once', async () => {
    const { host, input, fire } = await setup();
    input.value = '0612345678';
    await fire('change');
    await fire('animationstart', 'ui-browser-fill');
    expect(host.emitted).toEqual(['06 12 34 56 78']);
  });

  it('still places the caret while typing', async () => {
    const { host, input, fire } = await setup();
    input.focus();
    const select = vi.spyOn(input, 'setSelectionRange');
    input.value = '061';
    input.setSelectionRange(3, 3);
    await fire('input');
    expect(input.value).toBe('06 1_ __ __ __');
    expect(select).toHaveBeenLastCalledWith(4, 4);
    await fire('change');
    input.blur();
    expect(host.emitted).toEqual(['06 1']);
  });
});
