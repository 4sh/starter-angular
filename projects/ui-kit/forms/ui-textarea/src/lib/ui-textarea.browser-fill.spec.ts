/**
 * TestBed spec for a value the browser writes into `ui-textarea` without a
 * keystroke: the model and `valueChange` follow it once.
 */
import { Component } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { UiTextarea } from './ui-textarea';

@Component({
  imports: [ReactiveFormsModule, UiTextarea],
  template: `<ui-textarea
    label="Adresse"
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
  const textarea = fixture.nativeElement.querySelector('textarea') as HTMLTextAreaElement;
  const fire = async (type: string, animationName?: string) => {
    const event = new Event(type, { bubbles: true });
    if (animationName) Object.defineProperty(event, 'animationName', { value: animationName });
    textarea.dispatchEvent(event);
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return { host: fixture.componentInstance, textarea, fire };
}

describe('ui-textarea — browser fill', () => {
  it('syncs a value revealed by the autofill animation alone', async () => {
    const { host, textarea, fire } = await setup();
    textarea.value = '1 rue de la Paix';
    await fire('animationstart', 'ui-browser-fill');
    expect(host.control.value).toBe('1 rue de la Paix');
    expect(host.emitted).toEqual(['1 rue de la Paix']);
  });

  it('syncs a value revealed by a change alone, once', async () => {
    const { host, textarea, fire } = await setup();
    textarea.value = '1 rue de la Paix';
    await fire('change');
    await fire('animationstart', 'ui-browser-fill');
    expect(host.emitted).toEqual(['1 rue de la Paix']);
  });

  it('emits once per keystroke, none on the closing change', async () => {
    const { host, textarea, fire } = await setup();
    textarea.focus();
    textarea.value = '1';
    await fire('input');
    textarea.value = '1 ';
    await fire('input');
    await fire('change');
    textarea.blur();
    expect(host.emitted).toEqual(['1', '1 ']);
  });
});
