/**
 * Preview Storybook posée par `ng add @4sh/ui-kit-schematics`.
 * Fichier à vous : modifiez-le librement.
 *
 * Il fait trois choses que les stories du kit supposent : brancher le thème
 * clair/sombre sur `data-theme` (comme `ThemeService`), offrir le sélecteur de
 * marque de la barre d'outils (comme `BrandService`), et fournir les providers
 * Angular dont les stories ont besoin.
 */
import { applicationConfig, Preview } from '@storybook/angular';
import { setCompodocJson } from '@storybook/addon-docs/angular';
import { provideRouter } from '@angular/router';
import { addons } from 'storybook/preview-api';
import { lightTheme, darkTheme } from './myTheme';
import { brandGlobalTypes, withBrand, DEFAULT_BRAND } from './brand-toolbar';
// Descriptions des inputs dans l'onglet API : produites par Compodoc, que le
// builder `@storybook/angular` lance lui-même (`compodoc: true` dans angular.json).
import docJson from '../documentation.json';
// <ui-image>
import {
  provideUiImageAssets,
  UiImageAssetsMap,
} from '../src/app/shared/components/ui/base/ui-image/ui-image';
// `ui-image` lit ses images locales dans une map injectée : le composant ne peut
// pas deviner l'arborescence d'assets d'un projet. Remplissez
// `src/assets/assets-map.json` pour que ses stories affichent vos visuels.
import assetsMap from '../src/assets/assets-map.json';
// </ui-image>

setCompodocJson(docJson);

/** Applique le mode sombre comme le fait `ThemeService` : un attribut sur <html>. */
const syncTheme = (isDark: boolean) => {
  if (typeof document === 'undefined') return;
  const root = document.documentElement;
  if (isDark) root.setAttribute('data-theme', 'dark');
  else root.removeAttribute('data-theme');
};

const channel = addons.getChannel();
channel.on('DARK_MODE', (isDark) => {
  setTimeout(() => syncTheme(isDark), 0);
});

const preview: Preview = {
  initialGlobals: { brand: DEFAULT_BRAND },
  globalTypes: brandGlobalTypes,
  decorators: [
    withBrand,
    (Story, context) => {
      syncTheme(context.globals['darkMode']);
      return Story();
    },
    applicationConfig({
      providers: [
        // `provideRouter` : plusieurs composants du kit ont des liens
        // (`ui-link`, `ui-breadcrumb`, `ui-menu`…) qui exigent un Router.
        // Pas de `provideAnimations` ici : le kit anime en CSS (`ui-motion`).
        // Le package `@angular/animations` est installé (le renderer Storybook
        // l'exige) : si VOS composants animent avec Angular, ajoutez le
        // provider, rien d'autre à installer.
        provideRouter([]),
        // <ui-image>
        provideUiImageAssets(assetsMap as UiImageAssetsMap),
        // </ui-image>
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
