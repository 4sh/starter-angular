/**
 * TestBed spec for `ui-image-preview`'s transform state machine (zoom bounds,
 * rotation, reset, pan) and its keyboard contract. Same pattern as
 * `ui-modal.spec.ts` (FSHSP-93): a minimal host + `TestBed`.
 */
import { Component, signal } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { beforeEach, describe, expect, it } from 'vitest';
import { UiImagePreview } from './ui-image-preview';

@Component({
  imports: [UiImagePreview],
  template: `
    <ui-image-preview
      src="/img.png"
      alt="Une image"
      [zoomStep]="0.5"
      [minZoom]="0.5"
      [maxZoom]="2"
      (closed)="closedCount.set(closedCount() + 1)"
    />
  `,
})
class Host {
  readonly closedCount = signal(0);
}

describe('ui-image-preview', () => {
  let fixture: ComponentFixture<Host>;

  /** Current `transform` of the enlarged image, as the component wrote it. */
  const transform = () =>
    (fixture.nativeElement as HTMLElement).querySelector<HTMLElement>('.ui-image-preview-media')!
      .style.transform;

  /** Toolbar button carrying `label` as its accessible name. */
  const action = (label: string) =>
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>(
      `.ui-image-preview-action[aria-label="${label}"]`,
    )!;

  const press = (key: string) =>
    (fixture.nativeElement as HTMLElement)
      .querySelector('.ui-image-preview')!
      .dispatchEvent(new KeyboardEvent('keydown', { key, bubbles: true }));

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [Host] }).compileComponents();
    fixture = TestBed.createComponent(Host);
    fixture.detectChanges();
  });

  it('starts neutral, with reset unavailable', () => {
    expect(transform()).toBe('translate(0px, 0px) scale(1) rotate(0deg)');
    expect(action('Réinitialiser l’affichage').getAttribute('aria-disabled')).toBe('true');
  });

  it('zooms in by one step and stops at maxZoom', () => {
    action('Zoom avant').click();
    fixture.detectChanges();
    expect(transform()).toContain('scale(1.5)');

    action('Zoom avant').click();
    fixture.detectChanges();
    expect(transform()).toContain('scale(2)');
    // Clamped: a further press is a no-op rather than an overshoot.
    expect(action('Zoom avant').getAttribute('aria-disabled')).toBe('true');
    action('Zoom avant').click();
    fixture.detectChanges();
    expect(transform()).toContain('scale(2)');
  });

  it('zooms out down to minZoom', () => {
    action('Zoom arrière').click();
    action('Zoom arrière').click();
    fixture.detectChanges();
    expect(transform()).toContain('scale(0.5)');
    expect(action('Zoom arrière').getAttribute('aria-disabled')).toBe('true');
  });

  it('rotates both ways by 90°', () => {
    action('Pivoter vers la droite').click();
    fixture.detectChanges();
    expect(transform()).toContain('rotate(90deg)');

    action('Pivoter vers la gauche').click();
    action('Pivoter vers la gauche').click();
    fixture.detectChanges();
    expect(transform()).toContain('rotate(-90deg)');
  });

  it('resets zoom, rotation and pan at once', () => {
    action('Zoom avant').click();
    action('Pivoter vers la droite').click();
    press('ArrowRight');
    fixture.detectChanges();
    expect(transform()).not.toBe('translate(0px, 0px) scale(1) rotate(0deg)');

    action('Réinitialiser l’affichage').click();
    fixture.detectChanges();
    expect(transform()).toBe('translate(0px, 0px) scale(1) rotate(0deg)');
  });

  it('drops the pan offset when the image is zoomed back to fit', () => {
    action('Zoom avant').click();
    press('ArrowRight');
    press('ArrowDown');
    fixture.detectChanges();
    expect(transform()).toContain('translate(24px, 24px)');

    action('Zoom arrière').click();
    fixture.detectChanges();
    // Back at scale 1 the offset would strand the image off-centre.
    expect(transform()).toBe('translate(0px, 0px) scale(1) rotate(0deg)');
  });

  it('drives zoom, rotation and reset from the keyboard', () => {
    press('+');
    fixture.detectChanges();
    expect(transform()).toContain('scale(1.5)');

    press('r');
    fixture.detectChanges();
    expect(transform()).toContain('rotate(90deg)');

    press('0');
    fixture.detectChanges();
    expect(transform()).toBe('translate(0px, 0px) scale(1) rotate(0deg)');
  });

  it('asks to close on Escape and on the close action', () => {
    press('Escape');
    expect(fixture.componentInstance.closedCount()).toBe(1);

    action('Fermer l’aperçu').click();
    expect(fixture.componentInstance.closedCount()).toBe(2);
  });

  it('leaves Tab to the focus trap', () => {
    const event = new KeyboardEvent('keydown', { key: 'Tab', bubbles: true, cancelable: true });
    (fixture.nativeElement as HTMLElement).querySelector('.ui-image-preview')!.dispatchEvent(event);
    expect(event.defaultPrevented).toBe(false);
  });

  it('names the dialog and hides no toolbar action from screen readers', () => {
    const dialog = (fixture.nativeElement as HTMLElement).querySelector('.ui-image-preview')!;
    expect(dialog.getAttribute('role')).toBe('dialog');
    expect(dialog.getAttribute('aria-modal')).toBe('true');
    expect(dialog.getAttribute('aria-label')).toBe('Aperçu de l’image');

    const actions = dialog.querySelectorAll('.ui-image-preview-action');
    expect(actions.length).toBe(6); // download is opt-in
    for (const el of actions) expect(el.getAttribute('aria-label')).toBeTruthy();
  });
});
