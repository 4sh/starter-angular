import type { Decorator, Preview } from '@storybook/angular';

// =====================================================================
// Locale selector for the Storybook toolbar (FSHSP-88).
//
// Modeled on `brand-toolbar.ts`, with one deliberate difference: the
// locale is carried by the native `lang` attribute on <html>, and it is
// ALWAYS set — including for the default. `lang` is what assistive tech
// reads to pick a pronunciation, so "no attribute" is not an acceptable
// representation of "English" the way it is for `brand1`.
//
// English is the source language (FSHSP-87); French is a translation.
//
// PROJECT WITH MONOLINGUAL DOCS → remove everything in 4 steps: delete
// this file, then in `storybook/preview.ts` remove the import, the
// `initialGlobals` key and `withLocale` from `decorators`. The doc blocks
// degrade on their own: `useLocale()` falls back to `DEFAULT_LOCALE`.
// =====================================================================

/** Locales the documentation is published in. */
export const LOCALES = [
  { value: 'en', title: 'English' },
  { value: 'fr', title: 'Français' },
];

/** Source language of the documentation — served when nothing is selected. */
export const DEFAULT_LOCALE = 'en';

// Typed here rather than at usage: `toolbar.icon` is a union of Storybook
// icon names, not a free `string` — the annotation validates it in the right place.
export const localeGlobalTypes: NonNullable<Preview['globalTypes']> = {
  locale: {
    description: 'Documentation language',
    toolbar: { title: 'Language', icon: 'globe', items: LOCALES, dynamicTitle: true },
  },
};

/**
 * Writes the locale onto <html>, which is what the doc blocks observe.
 *
 * Exported because a decorator alone is not enough: decorators only run when a
 * story renders, so a docs-only MDX page (Introduction, foundations…) would
 * never get the attribute. `preview.ts` also calls this from the globals
 * channel event, which fires on those pages too.
 */
export const syncLocale = (locale: string | undefined) => {
  if (typeof document === 'undefined') return;
  document.documentElement.setAttribute('lang', locale ?? DEFAULT_LOCALE);
};

// Sane value before any story renders or any global event fires: a docs-only
// page opened cold still reads as English rather than as un-tagged content.
syncLocale(DEFAULT_LOCALE);

/** Applies the selected locale to <html> for every story render. */
export const withLocale: Decorator = (Story, context) => {
  syncLocale(context.globals['locale'] as string | undefined);
  return Story();
};
