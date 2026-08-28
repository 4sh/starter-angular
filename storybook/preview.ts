import { applicationConfig, Preview } from '@storybook/angular';
import { setCompodocJson } from '@storybook/addon-docs/angular';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { lightTheme, darkTheme } from './myTheme';
import { addons } from 'storybook/preview-api';
import docJson from '../documentation.json';
import { brandGlobalTypes, withBrand, DEFAULT_BRAND } from './brand-toolbar';
import { DEFAULT_RIPPLE, RIPPLE_GLOBAL, withRipple } from './ripple-toolbar';
import { DOCS_SCROLL_TO_ANCHOR, type DocsScrollToAnchorPayload } from './addons/text-search/events';
import { withComponentMetadata } from './restore-component-metadata';
import { provideUiImageAssets, UiImageAssetsMap } from '@4sh/ui-kit/base/ui-image';
import { provideUiRipple } from '@4sh/ui-kit/ripple';
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

/**
 * Défilement jusqu'à une section, demandé par la recherche plein texte
 * (`storybook/addons/text-search`). Le manager ne peut pas faire défiler cette
 * iframe — le hash de son URL ne s'y propage pas — il envoie donc l'ancre ici.
 *
 * `selectStory()` et l'arrivée du message se courent après : le rendu de la page
 * de doc n'est pas terminé quand l'ancre arrive. D'où les tentatives bornées,
 * en `setTimeout` et non en `requestAnimationFrame` (qui ne tire jamais dans un
 * onglet en arrière-plan).
 */
const scrollToAnchor = (anchor: string, attempt = 0): void => {
  const target = document.getElementById(anchor);
  if (target) {
    target.scrollIntoView({ block: 'start' });
    return;
  }
  if (attempt < 40) setTimeout(() => scrollToAnchor(anchor, attempt + 1), 50);
};

channel.on(DOCS_SCROLL_TO_ANCHOR, ({ anchor }: DocsScrollToAnchorPayload) =>
  scrollToAnchor(anchor),
);

const preview: Preview = {
  initialGlobals: { brand: DEFAULT_BRAND, [RIPPLE_GLOBAL]: DEFAULT_RIPPLE },
  globalTypes: brandGlobalTypes,
  decorators: [
    // Must stay first: it repairs `context.component` before Storybook derives the
    // implicit template from it.
    withComponentMetadata,
    withBrand,
    withRipple,
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
        // Branché en permanence : l'interrupteur de la barre d'outils ne coupe pas le
        // moteur, il pose `data-ripple="off"` sur <html> (voir `ripple-toolbar.ts`).
        provideUiRipple(),
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
