import { applicationConfig, Preview } from '@storybook/angular';
import { setCompodocJson } from '@storybook/addon-docs/angular';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { lightTheme, darkTheme } from './myTheme';
import { addons } from 'storybook/preview-api';
import docJson from '../documentation.json';
import { brandGlobalTypes, withBrand, DEFAULT_BRAND } from './brand-toolbar';
import { localeGlobalTypes, withLocale, syncLocale, DEFAULT_LOCALE } from './locale-toolbar';
import { withComponentMetadata } from './restore-component-metadata';
import { provideUiImageAssets, UiImageAssetsMap } from '@4sh/ui-kit/base/ui-image';
import assetsMap from '../src/assets/assets-map.json';

setCompodocJson(docJson);

const syncTheme = (isDark: boolean) => {
  if (typeof document === 'undefined') return;

  const root = document.documentElement;

  if (isDark) {
    root.setAttribute('data-theme', 'dark');
  } else {
    root.removeAttribute('data-theme');
  }
};

const channel = addons.getChannel();
channel.on('DARK_MODE', (isDark) => {
  setTimeout(() => syncTheme(isDark), 0);
});

// The `withLocale` decorator only fires when a story renders, so a docs-only MDX
// page (Introduction, foundations…) would never see a locale change. Storybook's
// globals event fires on those pages too — hence this second, non-story path.
// String literal rather than the `GLOBALS_UPDATED` constant, to match the
// `DARK_MODE` listener above and avoid importing from a `core-events` path.
channel.on('globalsUpdated', ({ globals }) => {
  syncLocale(globals?.['locale']);
});

const preview: Preview = {
  initialGlobals: { brand: DEFAULT_BRAND, locale: DEFAULT_LOCALE },
  globalTypes: { ...brandGlobalTypes, ...localeGlobalTypes },
  decorators: [
    // Must stay first: it repairs `context.component` before Storybook derives the
    // implicit template from it.
    withComponentMetadata,
    withBrand,
    withLocale,
    (Story, context) => {
      syncTheme(context.globals['darkMode']);
      return Story();
    },
    applicationConfig({
      providers: [
        provideRouter([]),
        provideAnimations(),
        // `ui-image` reads its local assets from an injected map (the kit can't know a
        // project's assets) — same wiring as the demo app's `app.config.ts`.
        provideUiImageAssets(assetsMap as UiImageAssetsMap),
      ],
    }),
  ],
  parameters: {
    layout: 'centered',
    docs: {
      story: { inline: true },
    },
    darkMode: {
      dark: darkTheme,
      light: lightTheme,
      stylePreview: true,
      classTarget: 'html',
      darkClass: 'dark-mode',
      lightClass: 'light-mode',
    },
    backgrounds: { disable: true },
  },
};

export default preview;
