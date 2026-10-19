import { getComponentHooks, getComponentSections, listComponentNames } from '../data.js';

export const GET_COMPONENT_DOC_DESCRIPTION =
  "Retourne la doc complète d'un composant `ui-*` : API (inputs/outputs/types), " +
  'Theming (tokens exposés), tailles, états, exemples — telle que publiée sur Storybook. ' +
  'Le champ `theming.hooks` dit, pour chaque hook `--ui-*`, s’il peut aller dans un thème ' +
  'global (`themable`) et sinon pourquoi. ' +
  "C'est la source de vérité : préférer cet outil à la lecture des fichiers sources " +
  "(`.ts`/`.html`/`.scss`) pour connaître l'API d'un composant.";

export const THEMING_NOTE =
  'Un hook `themable` se pose où l’on veut, `:root` compris : il figure dans ' +
  '`component-vars.scss`, le thème global du kit. Les autres ne vont pas dans un thème ' +
  'global, `exclusion` et `reason` disent pourquoi. Un hook `perVariant` a un défaut par ' +
  'variante rendue (`defaults`) : posé sur `:root`, il donnerait la même valeur à toutes. ' +
  'Il se pose sur l’élément ou sur une zone.';

export function getComponentDoc(name: string) {
  const sections = getComponentSections(name);
  if (sections.length === 0) {
    const available = listComponentNames();
    return {
      content: [
        {
          type: 'text' as const,
          text: JSON.stringify(
            {
              error: `Composant "${name}" introuvable.`,
              hint: 'Utilise list_components pour voir les noms disponibles.',
              available,
            },
            null,
            2,
          ),
        },
      ],
      isError: true,
    };
  }

  const bySection = sections.map((s) => ({
    section: s.section ?? 'Overview',
    text: s.text,
  }));
  const hooks = getComponentHooks(name);

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify(
          {
            name,
            title: sections[0].title,
            source: sections[0].source,
            sections: bySection,
            // Absent d'un manifeste antérieur à `hookStatus` : rien à affirmer.
            ...(hooks.length ? { theming: { note: THEMING_NOTE, hooks } } : {}),
          },
          null,
          2,
        ),
      },
    ],
  };
}
