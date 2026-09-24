/**
 * Châssis du Storybook JETABLE du kit, écrit par `ui-kit-preview`.
 *
 * Ne l'éditez pas : le dossier entier est réécrit à chaque exécution.
 *
 * Une seule responsabilité : faire suivre le thème du MANAGER (barre latérale,
 * barre d'outils) à la bascule clair/sombre. L'addon habille la preview tout
 * seul, mais pas le châssis autour — sans ce fichier, basculer en clair laissait
 * une barre latérale sombre autour d'une page claire.
 *
 * Les thèmes sont ceux de Storybook, pas ceux d'une marque : ce dossier est
 * jetable et n'a pas à porter d'identité. Celle du projet est dans les
 * composants — c'est elle qu'on vient regarder.
 */
import { addons } from 'storybook/manager-api';
import { themes } from 'storybook/theming';

addons.setConfig({ theme: themes.light });

addons.ready().then(() => {
  addons.getChannel().on('DARK_MODE', (isDark: boolean) => {
    addons.setConfig({ theme: isDark ? themes.dark : themes.light });
  });
});
