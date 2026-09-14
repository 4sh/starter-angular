/**
 * Preview du Storybook JETABLE du kit, écrite par `ui-kit-preview`.
 *
 * Ne l'éditez pas : le dossier entier est réécrit à chaque exécution. Elle fait
 * trois choses, et rien d'autre.
 */
import { applicationConfig, Preview } from '@storybook/angular';
import type { Decorator } from '@storybook/angular';
import { provideRouter } from '@angular/router';
import { provideUiImageAssets, UiImageAssetsMap } from '@4sh/ui-kit/base/ui-image';
import { withComponentMetadata } from './restore-component-metadata';
import assetsMap from '../src/assets/assets-map.json';

/**
 * 1. Rafraîchir la page quand vous modifiez vos styles.
 *
 * Le rechargement à chaud de Storybook ne couvre pas les styles GLOBAUX : le
 * builder Angular les émet dans un `main.<hash>.css`, un nom versionné par
 * contenu, que le navigateur ne peut pas récupérer sans recharger. Mesuré : la
 * page ne bougeait pas, même après plusieurs minutes.
 *
 * On surveille donc le nom du fichier et on échange le `<link>`. Sans
 * rechargement de page — l'état de la story est préservé, une modale ouverte le
 * reste. Mesuré à 0,4 s entre l'enregistrement du fichier et le composant à jour.
 */
const withStyleRefresh: Decorator = (story) => {
  const w = window as unknown as { __uiKitStyleWatch?: number };
  if (!w.__uiKitStyleWatch) {
    const styleLink = () =>
      [...document.querySelectorAll<HTMLLinkElement>('link[rel=stylesheet]')].find((l) =>
        /main\.[a-f0-9]+\.css/.test(l.href),
      );
    w.__uiKitStyleWatch = window.setInterval(async () => {
      const link = styleLink();
      if (!link) return;
      try {
        const html = await (await fetch('iframe.html', { cache: 'no-store' })).text();
        const name = html.match(/main\.[a-f0-9]+\.css/)?.[0];
        // Le `<link>` porte déjà ce nom : rien n'a été reconstruit.
        if (!name || link.href.endsWith(name)) return;
        link.href = new URL(name, link.href).href;
      } catch {
        // Serveur arrêté ou requête perdue : on retentera au prochain tour.
      }
    }, 300);
  }
  return story();
};

const preview: Preview = {
  decorators: [
    // 2. Réparer les métadonnées de décorateur. Les stories visent le paquet
    // COMPILÉ, dont le linker n'émet `setClassMetadata()` qu'en JIT : sans
    // cette passe, `@storybook/angular` ne sait pas dériver le template d'une
    // story qui ne déclare que `component` + `args`, et s'arrête sur
    // « Cannot read properties of undefined (reading 'selector') ».
    withComponentMetadata,
    withStyleRefresh,
    applicationConfig({
      providers: [
        // 3. Fournir ce que les stories du kit attendent. `provideRouter` :
        // plusieurs composants ont des liens (`ui-link`, `ui-breadcrumb`,
        // `ui-menu`…) qui exigent un Router.
        provideRouter([]),
        // `ui-image` lit ses images locales dans une map injectée — celle de
        // VOTRE projet, servie depuis `src/assets/`.
        provideUiImageAssets(assetsMap as UiImageAssetsMap),
      ],
    }),
  ],
  parameters: {
    layout: 'centered',
    docs: { story: { inline: true } },
  },
};

export default preview;
