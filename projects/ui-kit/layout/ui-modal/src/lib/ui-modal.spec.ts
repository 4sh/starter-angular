/**
 * TestBed spec for `ui-modal`'s stateful behavior: focus trap (CDK
 * `cdkTrapFocus`/`cdkTrapFocusAutoCapture`) and `Escape`-to-close. Follows the
 * pattern from `base-control-value-accessor.spec.ts` / `ui-select.spec.ts`
 * (FSHSP-93): a minimal host component + `TestBed.configureTestingModule`.
 */
import { Component, signal, Type } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { afterAll, afterEach, beforeAll, describe, expect, it } from 'vitest';
import { UiModal } from './ui-modal';

// CDK's `InteractivityChecker.isVisible` gates every tabbable/focusable lookup
// on `hasGeometry` (`offsetHeight`/`offsetWidth`/`getClientRects().length`),
// which jsdom always reports as 0 — there is no real layout engine. Without
// this, the focus-trap can never find an element to redirect focus to.
let restoreOffsetHeight: (() => void) | undefined;

beforeAll(() => {
  const original = Object.getOwnPropertyDescriptor(HTMLElement.prototype, 'offsetHeight');
  Object.defineProperty(HTMLElement.prototype, 'offsetHeight', {
    configurable: true,
    get: () => 1,
  });
  restoreOffsetHeight = () => {
    if (original) Object.defineProperty(HTMLElement.prototype, 'offsetHeight', original);
  };
});

afterAll(() => restoreOffsetHeight?.());

// Header off = the two projected content buttons are the *only* tabbable
// elements in the dialog, so the focus cycle is unambiguous to assert on.
@Component({
  imports: [UiModal],
  template: `
    <ui-modal [(visible)]="open" [showHeader]="false" ariaLabel="Titre">
      <button type="button" class="first-focusable">Premier</button>
      <button type="button" class="second-focusable">Second</button>
    </ui-modal>
  `,
})
class FocusTrapHost {
  readonly open = signal(true);
}

@Component({
  imports: [UiModal],
  template: `
    <ui-modal [(visible)]="open" [closeOnEscape]="closeOnEscape()" header="Titre">
      <button type="button">Contenu</button>
    </ui-modal>
  `,
})
class EscapeHost {
  readonly open = signal(true);
  readonly closeOnEscape = signal(true);
}

// The CDK focus-trap only redirects focus (and `document.activeElement` only
// reflects reality) once the component is actually connected to the document —
// a bare `TestBed.createComponent` fixture is not, by default.
const attachedElements: HTMLElement[] = [];

afterEach(() => {
  for (const el of attachedElements.splice(0)) el.remove();
});

async function setup<T>(hostType: Type<T>) {
  await TestBed.configureTestingModule({ imports: [hostType] }).compileComponents();
  const fixture: ComponentFixture<T> = TestBed.createComponent(hostType);
  document.body.appendChild(fixture.nativeElement);
  attachedElements.push(fixture.nativeElement);
  fixture.detectChanges();
  await fixture.whenStable();
  // The focus-trap's initial capture runs through `afterNextRender`, which is
  // scheduled on a real animation frame — flush a macrotask so it fires before
  // assertions run.
  await new Promise((resolve) => setTimeout(resolve, 0));
  fixture.detectChanges();
  await fixture.whenStable();
  const dialog = fixture.nativeElement.querySelector('[role="dialog"]') as HTMLElement;
  return { fixture, host: fixture.componentInstance, dialog };
}

describe('UiModal — focus trap', () => {
  it('auto-captures focus onto an element inside the dialog when it opens', async () => {
    const { dialog } = await setup(FocusTrapHost);
    expect(dialog.contains(document.activeElement)).toBe(true);
  });

  it('cycles focus from the last focusable element back to the first on Tab', async () => {
    const { fixture, dialog } = await setup(FocusTrapHost);
    const first = dialog.querySelector('.first-focusable') as HTMLElement;
    const second = dialog.querySelector('.second-focusable') as HTMLElement;

    second.focus();
    expect(document.activeElement).toBe(second);

    // The CDK focus-trap places an "end anchor" right after the trapped content:
    // tabbing out of the last focusable element lands on it, which redirects
    // focus back to the first tabbable element inside the dialog.
    const endAnchor = dialog.parentElement?.querySelector(
      '.cdk-focus-trap-anchor:last-of-type',
    ) as HTMLElement | null;
    endAnchor?.focus();
    fixture.detectChanges();
    await fixture.whenStable();

    expect(document.activeElement).toBe(first);
  });
});

describe('UiModal — Escape to close', () => {
  it('closes the dialog on Escape when closeOnEscape is enabled (default)', async () => {
    const { fixture, host, dialog } = await setup(EscapeHost);
    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(host.open()).toBe(false);
  });

  it('does not close the dialog on Escape when closeOnEscape is disabled', async () => {
    const { fixture, host, dialog } = await setup(EscapeHost);
    host.closeOnEscape.set(false);
    fixture.detectChanges();
    await fixture.whenStable();

    dialog.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    fixture.detectChanges();
    await fixture.whenStable();

    expect(host.open()).toBe(true);
  });
});
