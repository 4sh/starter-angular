/**
 * <LocalizedPage of={{ en: EnContent, fr: FrContent }} /> — renders the page
 * content matching the active locale (FSHSP-88).
 *
 * Why a shell rather than one Storybook entry per language: a localized `.mdx`
 * must stay plain MDX (markdown links, lists and inline code are lost the moment
 * text moves into a JSX expression), but two indexed entries would mean two
 * sidebar items with two different titles, and a page whose translation does not
 * exist yet would vanish instead of falling back. So a single indexed page — the
 * one carrying `<Meta>` — imports the content files and renders one of them.
 *
 * Adding a language = one entry in `LOCALES` (`storybook/locale-toolbar.ts`),
 * one `<name>.<locale>.mdx` content file, one key here. Nothing else, and no
 * count of languages is hardcoded anywhere.
 *
 * Usage — `ui-button.mdx` (the indexed page):
 *   import { Meta } from '@storybook/addon-docs/blocks';
 *   import { LocalizedPage } from '<…>/storybook/blocks/localized-page';
 *   import En from './ui-button.en.mdx';
 *   import Fr from './ui-button.fr.mdx';
 *
 *   <Meta title="…" />
 *   <LocalizedPage of={{ en: En, fr: Fr }} />
 *
 * The content files (`*.<locale>.mdx`) must stay out of the `stories` globs in
 * `storybook/main.js`, otherwise they get indexed as pages of their own.
 */

import React from 'react';
import { useLocale } from './locale';
import { DEFAULT_LOCALE } from '../locale-toolbar';

export function LocalizedPage({ of }) {
  const locale = useLocale();
  // Fall back to the source language so a page can be translated later without
  // going missing in the meantime — the same rule as `<L>`.
  const Content = of?.[locale] ?? of?.[DEFAULT_LOCALE];

  if (!Content) {
    return React.createElement(
      'p',
      null,
      React.createElement('strong', null, 'LocalizedPage: no content. '),
      `Pass at least the source language (\`${DEFAULT_LOCALE}\`) in \`of\`.`
    );
  }

  return React.createElement(Content);
}

export default LocalizedPage;
