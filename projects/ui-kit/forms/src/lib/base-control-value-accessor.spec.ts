/**
 * First TestBed-based spec in this repo (see FSHSP-93): `BaseControlValueAccessor`
 * needs a real Angular injection context (`inject(Injector)`, `afterNextRender`),
 * so it can't be tested as plain logic like `mask-engine`/`option-resolver`.
 *
 * A minimal concrete subclass stands in for a real field component (`ui-checkbox`,
 * `ui-input`…), wired the same way: NG_VALUE_ACCESSOR provider, `writeValue`
 * implemented, `emitChange`/`emitTouch` called on user interaction.
 */
import { Component, forwardRef, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { By } from '@angular/platform-browser';
import { FormControl, NG_VALUE_ACCESSOR, ReactiveFormsModule, Validators } from '@angular/forms';
import { describe, expect, it } from 'vitest';
import { BaseControlValueAccessor } from './base-control-value-accessor';

@Component({
  selector: 'demo-cva',
  template: `<input [value]="value()" (input)="onInput($event)" (blur)="emitTouch()" />`,
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => DemoCva), multi: true }],
})
class DemoCva extends BaseControlValueAccessor<string> {
  readonly value = signal('');

  writeValue(value: string): void {
    this.value.set(value ?? '');
  }

  onInput(event: Event): void {
    const next = (event.target as HTMLInputElement).value;
    this.value.set(next);
    this.emitChange(next);
  }
}

@Component({
  imports: [ReactiveFormsModule, DemoCva],
  template: `<demo-cva [formControl]="control" />`,
})
class ReactiveHost {
  readonly control = new FormControl('', { nonNullable: true, validators: Validators.required });
}

@Component({
  imports: [DemoCva],
  template: `<demo-cva />`,
})
class StandaloneHost {}

async function setupReactive() {
  await TestBed.configureTestingModule({ imports: [ReactiveHost] }).compileComponents();
  const fixture: ComponentFixture<ReactiveHost> = TestBed.createComponent(ReactiveHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const cva = fixture.debugElement.query(By.directive(DemoCva)).componentInstance as DemoCva;
  return { fixture, host: fixture.componentInstance, cva };
}

describe('BaseControlValueAccessor', () => {
  describe('mirroring a reactive-forms NgControl', () => {
    it("seeds the signals from the control's initial state", async () => {
      const { cva } = await setupReactive();
      expect(cva.pristine()).toBe(true);
      expect(cva.dirty()).toBe(false);
      expect(cva.touched()).toBe(false);
      expect(cva.untouched()).toBe(true);
      expect(cva.controlInvalid()).toBe(true); // required, seeded empty
      expect(cva.controlErrors()).toEqual({ required: true });
    });

    it('writes the form value into the view (form → view)', async () => {
      const { fixture, host, cva } = await setupReactive();
      host.control.setValue('preset');
      fixture.detectChanges();
      expect(cva.value()).toBe('preset');
    });

    it('propagates a view-driven change to the FormControl (view → form)', async () => {
      const { fixture, host } = await setupReactive();
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      input.value = 'hello';
      input.dispatchEvent(new Event('input'));
      fixture.detectChanges();
      expect(host.control.value).toBe('hello');
    });

    it('mirrors dirty/invalid once the control changes value', async () => {
      const { fixture, host, cva } = await setupReactive();
      host.control.setValue('hello');
      host.control.markAsDirty();
      fixture.detectChanges();
      await fixture.whenStable();
      expect(cva.dirty()).toBe(true);
      expect(cva.pristine()).toBe(false);
      expect(cva.controlInvalid()).toBe(false); // "hello" satisfies required
      expect(cva.controlErrors()).toBeNull();
    });

    it('mirrors touched/untouched on blur (view → form)', async () => {
      const { fixture, cva } = await setupReactive();
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      await fixture.whenStable();
      expect(cva.touched()).toBe(true);
      expect(cva.untouched()).toBe(false);
    });

    it('reflects control.disable() into controlDisabled (setDisabledState)', async () => {
      const { fixture, host, cva } = await setupReactive();
      host.control.disable();
      fixture.detectChanges();
      expect(cva.controlDisabled()).toBe(true);
    });

    describe('showError — invalid AND (touched OR dirty)', () => {
      it('stays false while invalid but neither touched nor dirty', async () => {
        const { cva } = await setupReactive();
        expect(cva.controlInvalid()).toBe(true);
        expect(cva.showError()).toBe(false);
      });

      it('turns true once invalid AND touched', async () => {
        const { fixture, host, cva } = await setupReactive();
        host.control.markAsTouched();
        fixture.detectChanges();
        await fixture.whenStable();
        expect(cva.showError()).toBe(true);
      });

      it('turns true once invalid AND dirty, even untouched', async () => {
        const { fixture, host, cva } = await setupReactive();
        host.control.markAsDirty();
        fixture.detectChanges();
        await fixture.whenStable();
        expect(cva.touched()).toBe(false);
        expect(cva.showError()).toBe(true);
      });

      it('stays false once valid again, even touched/dirty', async () => {
        const { fixture, host, cva } = await setupReactive();
        host.control.markAsTouched();
        host.control.setValue('hello');
        fixture.detectChanges();
        await fixture.whenStable();
        expect(cva.controlInvalid()).toBe(false);
        expect(cva.showError()).toBe(false);
      });
    });
  });

  describe('without any NgControl (standalone usage)', () => {
    async function setupStandalone() {
      await TestBed.configureTestingModule({ imports: [StandaloneHost] }).compileComponents();
      const fixture = TestBed.createComponent(StandaloneHost);
      fixture.detectChanges();
      await fixture.whenStable();
      const cva = fixture.debugElement.query(By.directive(DemoCva)).componentInstance as DemoCva;
      return { fixture, cva };
    }

    it('keeps every signal at its default — nothing to mirror', async () => {
      const { cva } = await setupStandalone();
      expect(cva.pristine()).toBe(true);
      expect(cva.dirty()).toBe(false);
      expect(cva.touched()).toBe(false);
      expect(cva.untouched()).toBe(true);
      expect(cva.controlInvalid()).toBe(false);
      expect(cva.controlErrors()).toBeNull();
      expect(cva.controlDisabled()).toBe(false);
      expect(cva.showError()).toBe(false);
    });

    it('still lets emitTouch flip touched/untouched locally', async () => {
      const { fixture, cva } = await setupStandalone();
      const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
      input.dispatchEvent(new Event('blur'));
      fixture.detectChanges();
      expect(cva.touched()).toBe(true);
      expect(cva.untouched()).toBe(false);
    });
  });
});
