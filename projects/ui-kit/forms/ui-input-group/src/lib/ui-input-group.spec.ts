/**
 * TestBed spec for `ui-input-group` (FSHSP-231): the `role="group"` wiring and
 * the row shaping (radius, flex, merged insets) of the projected items.
 */
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { describe, expect, it } from 'vitest';
import { FieldLevel } from '@4sh/ui-kit/forms';
import { UiInputGroup } from './ui-input-group';
import { UiInputGroupAddon } from './ui-input-group-addon';

@Component({
  imports: [UiInputGroup, UiInputGroupAddon],
  template: `<ui-input-group
      [label]="label()"
      [required]="required()"
      [message]="message()"
      [level]="level()"
      [merged]="merged()"
    >
      <ui-input-group-addon>+33</ui-input-group-addon>
      <input aria-label="Numéro de téléphone" />
    </ui-input-group>
    <ui-input-group label="Autre" message="Autre message">
      <input aria-label="Autre champ" />
    </ui-input-group>
    <ui-input-group id="trio" merged>
      <input aria-label="Montant" />
      <input aria-label="Centimes" />
      <ui-input-group-addon>€</ui-input-group-addon>
    </ui-input-group>`,
})
class GroupHost {
  readonly label = signal<string | undefined>(undefined);
  readonly required = signal(false);
  readonly message = signal<string | undefined>(undefined);
  readonly level = signal<FieldLevel>('default');
  readonly merged = signal(false);
}

async function setup() {
  await TestBed.configureTestingModule({ imports: [GroupHost] }).compileComponents();
  const fixture: ComponentFixture<GroupHost> = TestBed.createComponent(GroupHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const root = () => fixture.nativeElement.querySelector('.ui-input-group') as HTMLElement;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return { fixture, host: fixture.componentInstance, root, settle };
}

describe('ui-input-group field chrome', () => {
  it('stays a plain layout wrapper without label nor message', async () => {
    const { root } = await setup();
    expect(root().getAttribute('role')).toBeNull();
    expect(root().getAttribute('aria-labelledby')).toBeNull();
    expect(root().getAttribute('aria-describedby')).toBeNull();
    expect(root().querySelector('ui-label')).toBeNull();
    expect(root().querySelector('ui-helper')).toBeNull();
  });

  it('becomes a group named by its label', async () => {
    const { host, root, settle } = await setup();
    host.label.set('Téléphone');
    host.required.set(true);
    await settle();

    expect(root().getAttribute('role')).toBe('group');
    const label = root().querySelector('ui-label') as HTMLElement;
    expect(root().getAttribute('aria-labelledby')).toBe(label.id);
    expect(label.querySelector('.ui-label-text')?.textContent?.trim()).toBe('Téléphone');
    // The asterisk is left out of the name the label gives to the group.
    expect(label.querySelector('.ui-label-marker')?.getAttribute('aria-hidden')).toBe('true');
    expect(label.querySelector('label')?.hasAttribute('for')).toBe(false);
  });

  it('is described by its message, tinted with the level', async () => {
    const { host, root, settle } = await setup();
    host.message.set('Numéro invalide');
    host.level.set('error');
    await settle();

    expect(root().getAttribute('role')).toBe('group');
    expect(root().getAttribute('aria-labelledby')).toBeNull();
    const helper = root().querySelector('ui-helper') as HTMLElement;
    expect(root().getAttribute('aria-describedby')).toBe(helper.id);
    expect(helper.textContent?.trim()).toBe('Numéro invalide');
    expect(helper.querySelector('.ui-helper')?.className).toContain('_error');
    expect(root().className).toContain('_error');
  });

  it('gives each group its own ids', async () => {
    const { host, fixture, settle } = await setup();
    host.label.set('Téléphone');
    host.message.set('Aide');
    await settle();

    const [first, second] = Array.from(
      fixture.nativeElement.querySelectorAll('.ui-input-group'),
    ) as HTMLElement[];
    expect(first.getAttribute('aria-labelledby')).not.toBe(second.getAttribute('aria-labelledby'));
    expect(first.getAttribute('aria-describedby')).not.toBe(
      second.getAttribute('aria-describedby'),
    );
  });

  it('shapes the projected items only, not the label nor the message', async () => {
    const { host, root, settle } = await setup();
    host.label.set('Téléphone');
    host.message.set('Aide');
    await settle();

    const addon = root().querySelector('ui-input-group-addon') as HTMLElement;
    const input = root().querySelector('input') as HTMLElement;
    expect(addon.style.getPropertyValue('--ui-field-radius')).toBe(
      'var(--_radius) 0 0 var(--_radius)',
    );
    expect(input.style.getPropertyValue('--ui-field-radius')).toBe(
      '0 var(--_radius) var(--_radius) 0',
    );
    expect((root().querySelector('ui-label') as HTMLElement).getAttribute('style')).toBeNull();
    expect((root().querySelector('ui-helper') as HTMLElement).getAttribute('style')).toBeNull();
  });

  it('writes each item flex through a hook the item can override', async () => {
    const { root } = await setup();
    const addon = root().querySelector('ui-input-group-addon') as HTMLElement;
    const input = root().querySelector('input') as HTMLElement;
    expect(addon.style.flex).toBe('var(--ui-input-group-item-flex, 0 0 auto)');
    expect(input.style.flex).toBe('var(--ui-input-group-item-flex, 1 1 0)');
  });

  it('tightens only the sides two controls share', async () => {
    const { fixture } = await setup();
    const trio = fixture.nativeElement.querySelector('#trio') as HTMLElement;
    const [first, second, addon] = Array.from(
      trio.querySelector('.ui-input-group-row')!.children,
    ) as HTMLElement[];
    const inset = (el: HTMLElement, side: 'start' | 'end') =>
      el.style.getPropertyValue(`--_field-inset-inline-${side}`);

    expect(inset(first, 'start')).toBe('');
    expect(inset(first, 'end')).toBe('var(--_group-item-inset)');
    expect(inset(second, 'start')).toBe('var(--_group-item-inset)');
    expect(inset(second, 'end')).toBe('');
    expect(inset(addon, 'start')).toBe('');
  });

  it('flags the merged mode on the root', async () => {
    const { host, root, settle } = await setup();
    expect(root().className).not.toContain('_merged');
    host.merged.set(true);
    await settle();
    expect(root().className).toContain('_merged');
  });
});
