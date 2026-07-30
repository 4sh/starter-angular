// --- Body scroll lock (ref-counted, shared across every overlay type:
// ui-modal, ui-drawer, ui-lightbox…) -----------------------------------
let scrollLockCount = 0;
let savedOverflow = '';
let savedPaddingRight = '';

/** Freeze background scroll, compensating the scrollbar gutter to avoid a shift. */
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

/** Release one scroll lock; restore the body when the last overlay closes. */
export function unlockBodyScroll(doc: Document): void {
  scrollLockCount = Math.max(0, scrollLockCount - 1);
  if (scrollLockCount === 0) {
    doc.body.style.overflow = savedOverflow;
    doc.body.style.paddingRight = savedPaddingRight;
  }
}
