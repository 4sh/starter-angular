import { getComponentSections, listComponentNames } from '../data.js';

export const GET_COMPONENT_DOC_DESCRIPTION =
  "Retourne la doc complète d'un composant `ui-*` : API (inputs/outputs/types), " +
  'Theming (tokens exposés), tailles, états, exemples — telle que publiée sur Storybook. ' +
  "C'est la source de vérité : préférer cet outil à la lecture des fichiers sources " +
  "(`.ts`/`.html`/`.scss`) pour connaître l'API d'un composant.";

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

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ name, title: sections[0].title, source: sections[0].source, sections: bySection }, null, 2),
      },
    ],
  };
}
