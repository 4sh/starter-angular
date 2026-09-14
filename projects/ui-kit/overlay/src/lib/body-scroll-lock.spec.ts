/**
 * Ref-counting contract of the shared body scroll lock. The cross-entry-point
 * half of the regression (a modal and a drawer sharing ONE counter) is covered
 * by `ui-modal.spec.ts`; here we pin the arithmetic itself.
 */
import { afterEach, describe, expect, it } from 'vitest';
import { lockBodyScroll, unlockBodyScroll } from './body-scroll-lock';

function resetBody(): void {
  document.body.style.overflow = '';
  document.body.style.paddingRight = '';
}

afterEach(resetBody);

describe('body scroll lock', () => {
  it('freezes the body on the first lock and restores it on the last release', () => {
    lockBodyScroll(document);
    expect(document.body.style.overflow).toBe('hidden');

    unlockBodyScroll(document);
    expect(document.body.style.overflow).toBe('');
  });

  it('keeps the body frozen while a nested overlay releases its own lock', () => {
    lockBodyScroll(document); // outer overlay
    lockBodyScroll(document); // nested overlay
    expect(document.body.style.overflow).toBe('hidden');

    unlockBodyScroll(document); // the nested one closes…
    expect(document.body.style.overflow).toBe('hidden'); // …the outer is still open

    unlockBodyScroll(document);
    expect(document.body.style.overflow).toBe('');
  });

  it('restores the styles the body had before the first lock', () => {
    document.body.style.overflow = 'auto';
    document.body.style.paddingRight = '4px';

    lockBodyScroll(document);
    lockBodyScroll(document);
    unlockBodyScroll(document);
    unlockBodyScroll(document);

    expect(document.body.style.overflow).toBe('auto');
    expect(document.body.style.paddingRight).toBe('4px');
  });
});
