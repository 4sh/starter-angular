/**
 * Localisation primitive for the doc blocks (FSHSP-88).
 *
 * `useLocale()` reads the active locale and re-renders on change; `<L>` picks
 * one of two contents. English is the source language (FSHSP-87), so `en` is
 * both the default and the fallback when a translation is missing.
 *
 * The locale is read from the `lang` attribute of <html> — set by
 * `storybook/locale-toolbar.ts` — and NOT from Storybook's globals: a doc block
 * renders outside the story context and has no access to them. Same mechanism
 * as `config-table.js` for theme and brand, for the same reason.
 *
 * Usage in an `.mdx`:
 *   import { L } from '../../../../storybook/blocks/locale';
 *
 *   <L en="Body inset." fr="Inset du corps." />
 *   <L en={<>A <code>rich</code> node.</>} fr={<>Un nœud <code>riche</code>.</>} />
 */

import React from 'react';
import { DEFAULT_LOCALE, LOCALES } from '../locale-toolbar';

const SUPPORTED = LOCALES.map((l) => l.value);

/** Normalizes a `lang` value (`fr-FR`, `FR`) to a supported locale. */
function normalize(lang) {
  const base = (lang ?? '').toLowerCase().split('-')[0];
  return SUPPORTED.includes(base) ? base : DEFAULT_LOCALE;
}

/** Active documentation locale, resynced when the toolbar changes it. */
export function useLocale() {
  const read = () =>
    typeof document === 'undefined'
      ? DEFAULT_LOCALE
      : normalize(document.documentElement.getAttribute('lang'));

  const [locale, setLocale] = React.useState(read);

  React.useEffect(() => {
    // Catch-up: the attribute may have been set between the initial render and
    // this effect (the decorator and this block render independently).
    setLocale(read());

    const observer = new MutationObserver(() => setLocale(read()));
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['lang'],
    });
    return () => observer.disconnect();
  }, []);

  return locale;
}

// A string is returned as is; a JSX node is already renderable. Wrapping in a
// fragment keeps the return type uniform for React.
const el = (value) => React.createElement(React.Fragment, null, value);

/**
 * Picks the content matching the active locale.
 *
 * A missing translation falls back to the source language rather than rendering
 * empty: a half-translated page stays readable, which is what makes it possible
 * to translate the 67 pages progressively instead of in one shot.
 */
export function L(props) {
  const locale = useLocale();
  const value = props[locale] ?? props[DEFAULT_LOCALE];
  return value === undefined ? null : el(value);
}

export default L;
