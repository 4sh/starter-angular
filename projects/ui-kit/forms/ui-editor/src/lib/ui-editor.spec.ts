import { Component, signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { UiEditor } from './ui-editor';

@Component({
  imports: [UiEditor, FormsModule],
  template: `<ui-editor label="Description" [(ngModel)]="value" />`,
})
class Host {
  readonly value = signal('');
}

async function setup() {
  await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  await fixture.whenStable();
  const area = fixture.nativeElement.querySelector('.ui-editor-content') as HTMLElement;
  return { fixture, area };
}

describe('ui-editor editing area', () => {
  it('does not rewrite what the user typed, accents included', async () => {
    const { fixture, area } = await setup();

    const typed = document.createTextNode('café crème');
    area.append(typed);
    area.dispatchEvent(new Event('input'));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(fixture.componentInstance.value()).toBe('café crème');
    expect(area.firstChild).toBe(typed);
  });

  it('renders an alignment written from outside', async () => {
    const { fixture, area } = await setup();

    fixture.componentInstance.value.set('<p style="text-align: center;">Centré</p>');
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(area.innerHTML).toBe('<p style="text-align: center;">Centré</p>');
  });
});
