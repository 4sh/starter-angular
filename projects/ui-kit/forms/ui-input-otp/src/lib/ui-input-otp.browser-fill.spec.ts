/**
 * TestBed spec for a code the browser or the system writes into `ui-input-otp`
 * (`autocomplete="one-time-code"`): spread over the cells into the model,
 * moving the focus only when the user is in the group.
 */
import { Component, ErrorHandler } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { describe, expect, it, vi } from 'vitest';
import { UiBrowserFill } from '@4sh/ui-kit/forms';
import { UiInputOtp } from './ui-input-otp';

@Component({
  imports: [ReactiveFormsModule, UiInputOtp],
  template: `<ui-input-otp
    ariaLabel="Code"
    [length]="4"
    integerOnly
    [formControl]="control"
    (valueChange)="emitted.push($event)"
    (completed)="completed.push($event)"
  />`,
})
class FillHost {
  readonly control = new FormControl('');
  readonly emitted: string[] = [];
  readonly completed: string[] = [];
}

@Component({
  imports: [ReactiveFormsModule, UiInputOtp, UiBrowserFill],
  template: `<ui-input-otp ariaLabel="Code" [length]="4" [formControl]="control">
    <ng-template #input let-value let-events="events" let-tabindex="tabindex">
      <input
        uiBrowserFill
        class="custom-cell"
        [value]="value"
        [attr.tabindex]="tabindex"
        (input)="events.input($event)"
        (browserFill)="events.browserFill($event)"
      />
    </ng-template>
  </ui-input-otp>`,
})
class CustomCellHost {
  readonly control = new FormControl('');
}

async function setup() {
  const errors: unknown[] = [];
  await TestBed.configureTestingModule({
    imports: [FillHost],
    providers: [
      { provide: ErrorHandler, useValue: { handleError: (e: unknown) => errors.push(e) } },
    ],
  }).compileComponents();
  const fixture: ComponentFixture<FillHost> = TestBed.createComponent(FillHost);
  fixture.detectChanges();
  await fixture.whenStable();
  const cells = Array.from(fixture.nativeElement.querySelectorAll('input')) as HTMLInputElement[];
  const fire = async (cell: HTMLInputElement, type: string, animationName?: string) => {
    const event = new Event(type, { bubbles: true });
    if (animationName) Object.defineProperty(event, 'animationName', { value: animationName });
    cell.dispatchEvent(event);
    fixture.detectChanges();
    await fixture.whenStable();
  };
  return { host: fixture.componentInstance, cells, errors, fire };
}

describe('ui-input-otp — browser fill', () => {
  it('spreads a code written without focus, leaving the focus where it is', async () => {
    const { host, cells, fire } = await setup();
    cells[0].value = '1234';
    await fire(cells[0], 'input');
    expect(host.control.value).toBe('1234');
    expect(host.completed).toEqual(['1234']);
    expect(cells.map((c) => c.value)).toEqual(['1', '2', '3', '4']);
    expect(cells).not.toContain(document.activeElement);
  });

  it('syncs a code revealed by a change alone, once', async () => {
    const { host, cells, fire } = await setup();
    cells[0].value = '1234';
    await fire(cells[0], 'change');
    await fire(cells[0], 'animationstart', 'ui-browser-fill');
    expect(host.emitted).toEqual(['1234']);
  });

  it('spreads a code filled into the focused cell and moves to the last one', async () => {
    const { host, cells, fire } = await setup();
    cells[0].focus();
    cells[0].value = '1234';
    await fire(cells[0], 'input');
    expect(host.control.value).toBe('1234');
    expect(document.activeElement).toBe(cells[3]);
  });

  it('stays out of the way of the events Chrome sends with its autofill', async () => {
    const { host, cells, errors, fire } = await setup();
    const select = vi.spyOn(cells[0], 'select');
    // A focus event without the focus, then a keydown that is a bare `Event`.
    cells[0].dispatchEvent(new FocusEvent('focus'));
    await fire(cells[0], 'keydown');
    cells[0].value = '1';
    await fire(cells[0], 'input');
    expect(host.control.value).toBe('1');
    expect(select).not.toHaveBeenCalled();
    expect(errors).toEqual([]);
    expect(cells).not.toContain(document.activeElement);
  });

  it('still moves to the next cell on a keystroke', async () => {
    const { host, cells, fire } = await setup();
    cells[0].focus();
    cells[0].value = '7';
    await fire(cells[0], 'input');
    expect(document.activeElement).toBe(cells[1]);
    await fire(cells[0], 'change');
    expect(host.emitted).toEqual(['7']);
  });
});

describe('ui-input-otp — browser fill in a custom cell', () => {
  it('syncs a code written into a cell wired to events.browserFill', async () => {
    await TestBed.configureTestingModule({ imports: [CustomCellHost] }).compileComponents();
    const fixture = TestBed.createComponent(CustomCellHost);
    fixture.detectChanges();
    await fixture.whenStable();
    const cell = fixture.nativeElement.querySelector('.custom-cell') as HTMLInputElement;
    cell.value = '1234';
    cell.dispatchEvent(new Event('change', { bubbles: true }));
    fixture.detectChanges();
    await fixture.whenStable();
    expect(fixture.componentInstance.control.value).toBe('1234');
  });
});
