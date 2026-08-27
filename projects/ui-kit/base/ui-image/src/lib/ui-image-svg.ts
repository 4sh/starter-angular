/**
 * Assainissement des SVG inlinés par `ui-image`.
 *
 * Angular's HTML sanitizer strips `<svg>` wholesale, so inlining an SVG — which
 * is what lets the asset inherit `currentColor` and the theme's CSS — has no
 * choice but to go through `bypassSecurityTrustHtml()`. That bypass is only
 * defensible if the markup has already been scrubbed here, which is the single
 * reason this file exists. See `docs/SECURITY-PRACTICES.md`.
 *
 * The threat model is not "the kit's own assets": it is a project serving
 * `assets/img/` from a CDN, or letting a client drop its own logo in a brand
 * folder (white-label). In both cases the SVG is markup of unknown origin
 * rendered into the application's own origin.
 */

/**
 * Tags dropped WITH their content — unwrapping them would put their body in the
 * document as text, or leave the vector intact.
 *
 * `foreignObject` re-opens the whole HTML namespace inside the SVG, and the SMIL
 * elements (`animate`, `set`…) can retarget an attribute *after* this scrub ran.
 */
const VOIDED_TAGS =
  'script, foreignObject, iframe, object, embed, animate, animateTransform, animateMotion, set, handler';

/** Attributes carrying a reference — the only ones allowed to name a target. */
const REF_ATTRS = new Set(['href', 'xlink:href', 'src']);

/** A reference either stays inside the document, or navigates over http(s). */
const ALLOWED_REF_PROTOCOLS = ['http:', 'https:'];

/**
 * Strips from an SVG everything that can execute or fetch, and returns the
 * scrubbed markup.
 *
 * Parsing happens inside a detached `<template>`: its content is inert, so
 * nothing runs and nothing is fetched while we inspect it. Returns `''` when
 * there is no DOM to parse with (SSR) — failing closed, since un-scrubbed
 * markup must never reach the bypass.
 */
export function sanitizeInlineSvg(raw: string): string {
  if (typeof document === 'undefined') return '';

  const template = document.createElement('template');
  /* eslint-disable-next-line no-restricted-syntax -- EXCEPTION JUSTIFIÉE : on
     écrit DANS un `<template>` détaché, dont le contenu est inerte — rien ne
     s'exécute et rien n'est chargé. C'est l'étape de PARSING du scrub, pas une
     injection dans le document. Registre : docs/SECURITY-PRACTICES.md. */
  template.innerHTML = raw;

  for (const el of Array.from(template.content.querySelectorAll(VOIDED_TAGS))) el.remove();

  for (const el of Array.from(template.content.querySelectorAll('*'))) {
    for (const attr of Array.from(el.attributes)) {
      const name = attr.name.toLowerCase();
      // Every event handler, whatever the element it sits on.
      if (name.startsWith('on')) {
        el.removeAttributeNode(attr);
        continue;
      }
      if (REF_ATTRS.has(name) && !isSafeRef(attr.value)) el.removeAttributeNode(attr);
    }
  }

  return template.innerHTML;
}

/** @internal Rejects `javascript:`, `data:` and the other non-navigational schemes. */
function isSafeRef(value: string): boolean {
  const ref = value.trim();
  // `<use href="#icon">` — a same-document reference names no external target.
  if (ref.startsWith('#')) return true;
  try {
    return ALLOWED_REF_PROTOCOLS.includes(new URL(ref, document.baseURI).protocol);
  } catch {
    return false;
  }
}
