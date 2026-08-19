import { listComponentNames } from '../data.js';

export const LIST_COMPONENTS_DESCRIPTION =
  "Liste tous les composants `ui-*` disponibles dans @4sh/ui-kit (nom + slug de doc). " +
  'À appeler en premier pour découvrir le catalogue avant de choisir un composant — ' +
  'ne jamais deviner un nom de composant sans avoir vérifié ici.';

export function listComponents() {
  const names = listComponentNames();
  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ count: names.length, components: names }, null, 2),
      },
    ],
  };
}
