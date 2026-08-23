/**
 * TestBed spec for the `floatLabel` mode (FSHSP-157), exercised through
 * `ui-input`: the geometry lives in `ui-field`'s stylesheet, but everything worth
 * asserting is the contract between the two: which classes the shell puts on the
 * field, where the label is rendered, and the two things the concrete component
 * has to report (`filled`, and the placeholder it must stop emitting).
 *
 * Follows the pattern from `base-control-value-accessor.spec.ts` (FSHSP-93):
 * a minimal host component + `TestBed.configureTestingModule`.
 */
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormsModule } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { UiInput } from './ui-input';
import { FieldFloatLabel } from '@4sh/ui-kit/forms';

@Component({
  imports: [FormsModule, UiInput],
  template: `<ui-input
    [label]="label()"
    [floatLabel]="floatLabel()"
    [placeholder]="placeholder()"
    [iconLeft]="iconLeft()"
    [required]="required()"
    [(ngModel)]="value"
  />`,
})
class InputHost {
  readonly label = signal<string | undefined>('Nom');
  readonly floatLabel = signal<FieldFloatLabel | undefined>(undefined);
  readonly placeholder = signal<string | undefined>('Votre nom');
  readonly iconLeft = signal<string | undefined>(undefined);
  readonly required = signal(false);
  value = '';
}

async function setup(initialValue = '') {
  await TestBed.configureTestingModule({ imports: [InputHost] }).compileComponents();
  const fixture: ComponentFixture<InputHost> = TestBed.createComponent(InputHost);
  fixture.componentInstance.value = initialValue;
  fixture.detectChanges();
  await fixture.whenStable();
  const el = (selector: string) => fixture.nativeElement.querySelector(selector) as HTMLElement;
  const settle = async () => {
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return { fixture, host: fixture.componentInstance, el, settle };
}

describe('ui-input floatLabel', () => {
  it('renders the classic label above the box by default', async () => {
    const { el } = await setup();
    expect(el('.ui-field-label')).not.toBeNull();
    expect(el('.ui-field-float-label')).toBeNull();
    expect(el('.ui-field').className).not.toContain('_float');
    expect((el('input') as HTMLInputElement).placeholder).toBe('Votre nom');
  });

  it('keeps the box inside its positioning wrapper in both modes', async () => {
    const { el, host, settle } = await setup();
    expect(el('.ui-field-control > .ui-field-box')).not.toBeNull();
    host.floatLabel.set('over');
    await settle();
    expect(el('.ui-field-control > .ui-field-box')).not.toBeNull();
  });

  it.each(['over', 'in', 'on'] as const)('moves the label into the box (%s)', async (variant) => {
    const { el, host, settle } = await setup();
    host.floatLabel.set(variant);
    await settle();

    const field = el('.ui-field');
    expect(field.className).toContain('_float');
    expect(field.className).toContain(`_float-${variant}`);
    expect(el('.ui-field-label')).toBeNull();
    expect(el('.ui-field-control > .ui-field-float-label')).not.toBeNull();
  });

  it('neutralises the placeholder, which the resting label now stands in for', async () => {
    const { el, host, settle } = await setup();
    host.floatLabel.set('over');
    await settle();
    expect((el('input') as HTMLInputElement).placeholder).toBe('');
  });

  it('does nothing without a label to float', async () => {
    const { el, host, settle } = await setup();
    host.label.set(undefined);
    host.floatLabel.set('over');
    await settle();

    expect(el('.ui-field').className).not.toContain('_float');
    expect(el('.ui-field-float-label')).toBeNull();
    expect((el('input') as HTMLInputElement).placeholder).toBe('Votre nom');
  });

  it('reports `filled` on typing, so the label stays raised once focus leaves', async () => {
    const { el, host, settle } = await setup();
    host.floatLabel.set('on');
    await settle();
    expect(el('.ui-field').className).not.toContain('_filled');

    const input = el('input') as HTMLInputElement;
    input.value = 'Robin';
    input.dispatchEvent(new Event('input'));
    await settle();
    expect(el('.ui-field').className).toContain('_filled');

    input.value = '';
    input.dispatchEvent(new Event('input'));
    await settle();
    expect(el('.ui-field').className).not.toContain('_filled');
  });

  it('reports `filled` on a value written by the form, not just on typing', async () => {
    const { el, host, settle } = await setup('Robin');
    host.floatLabel.set('on');
    await settle();
    expect(el('.ui-field').className).toContain('_filled');
  });

  it('indents the label past a projected prefix', async () => {
    const { el, host, settle } = await setup();
    host.floatLabel.set('in');
    await settle();
    expect(el('.ui-field').className).not.toContain('_has-prefix');

    host.iconLeft.set('magnifying-glass');
    await settle();
    expect(el('.ui-field').className).toContain('_has-prefix');
  });

  it('stays a real label: `for` association and required marker survive', async () => {
    const { el, host, settle } = await setup();
    host.floatLabel.set('over');
    host.required.set(true);
    await settle();

    const label = el('.ui-field-float-label label') as HTMLLabelElement;
    const input = el('input') as HTMLInputElement;
    expect(label.getAttribute('for')).toBe(input.id);
    expect(input.id).not.toBe('');
    expect(el('.ui-field-float-label .ui-label-marker')).not.toBeNull();
  });
});
