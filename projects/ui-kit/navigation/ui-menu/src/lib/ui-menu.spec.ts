import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { UiMenu, UiMenuItem } from './ui-menu';

@Component({
  imports: [UiMenu],
  template: `<ui-menu submenus="flyout" [items]="items" [motion]="false" ariaLabel="Actions" />`,
})
class Host {
  readonly items: UiMenuItem[] = [
    { label: 'Copier' },
    { label: 'Partager', items: [{ label: 'Envoyer par e-mail' }, { label: 'Copier le lien' }] },
  ];
}

async function setup() {
  await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
  const fixture = TestBed.createComponent(Host);
  fixture.detectChanges();
  const parent = fixture.nativeElement.querySelector(
    'button[aria-haspopup="menu"]',
  ) as HTMLButtonElement;
  return { fixture, parent };
}

describe('ui-menu flyout parent', () => {
  it('stays open when the click follows the hover that opened it', async () => {
    const { fixture, parent } = await setup();

    parent.dispatchEvent(new MouseEvent('mouseenter'));
    fixture.detectChanges();
    expect(parent.getAttribute('aria-expanded')).toBe('true');

    parent.click();
    fixture.detectChanges();
    expect(parent.getAttribute('aria-expanded')).toBe('true');
  });

  it('opens on a click alone (keyboard Enter, no hover)', async () => {
    const { fixture, parent } = await setup();

    parent.click();
    fixture.detectChanges();
    expect(parent.getAttribute('aria-expanded')).toBe('true');
  });
});
