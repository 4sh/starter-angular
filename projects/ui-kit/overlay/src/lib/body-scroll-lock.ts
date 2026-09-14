/**
 * Background scroll lock shared by every full-screen overlay of the kit
 * (modal, drawer, bottom-sheet, sidebar, image preview).
 *
 * The counter below is module state, so it is only shared as long as every
 * caller resolves to **this** module. That is the whole point of the helper
 * living in a cross-cutting entry point: a copy pasted into a component's own
 * entry point is a separate compilation unit, hence a separate counter, and two
 * overlays from two different entry points then release the body independently
 * — the second one to close restores an `overflow` it captured while already
 * locked, unfreezing the page under the overlay that is still open (or leaving
 * a stale scrollbar gutter once the last one closes).
 *
 * Never re-declare these functions inside a component: import them from
 * `@4sh/ui-kit/overlay`.
 */

/** Overlays currently holding a lock, process-wide. */
let scrollLockCount = 0;
/** `body.style.overflow` as it was before the first lock. */
let savedOverflow = '';
/** `body.style.paddingRight` as it was before the first lock. */
let savedPaddingRight = '';

/**
 * Freeze background scroll, compensating the scrollbar gutter to avoid a shift.
 *
 * Ref-counted: nested overlays each take a lock, and only the first one touches
 * the body. Every call must be paired with exactly one {@link unlockBodyScroll}
 * — hold the pairing in the caller (a `locked` flag released on close *and* on
 * destroy), since the helper cannot tell one overlay's locks from another's.
 *
 * @param doc The document owning the `body` to freeze (inject `DOCUMENT`).
 */
export function lockBodyScroll(doc: Document): void {
  if (scrollLockCount === 0) {
    const body = doc.body;
    const gap = (doc.defaultView?.innerWidth ?? 0) - doc.documentElement.clientWidth;
    savedOverflow = body.style.overflow;
    savedPaddingRight = body.style.paddingRight;
    body.style.overflow = 'hidden';
    if (gap > 0) body.style.paddingRight = `${gap}px`;
  }
  scrollLockCount++;
}

/**
 * Release one scroll lock; restore the body when the last overlay closes.
 *
 * @param doc The document passed to the matching {@link lockBodyScroll}.
 */
export function unlockBodyScroll(doc: Document): void {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    doc.body.style.overflow = savedOverflow;
    doc.body.style.paddingRight = savedPaddingRight;
  }
}
