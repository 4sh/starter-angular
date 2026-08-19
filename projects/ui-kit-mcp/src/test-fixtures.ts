/**
 * test-fixtures — jeux de données minimaux, au même format que les manifestes
 * réels (`storybook/public/text-search-docs.json`,
 * `storybook/generated/ui-config.json`), pour tester la logique sans dépendre
 * du manifeste embarqué (généré par `npm run mcp:assets`, absent d'un
 * checkout propre — voir `.gitignore`).
 */
import type { DocSection, SearchDocsManifest, UiConfigManifest } from './data.js';

export const FIXTURE_DOCS: DocSection[] = [
  {
    id: 'components-ui-actions-ui-button--docs',
    docId: 'components-ui-actions-ui-button--docs',
    anchor: null,
    title: 'Components/ui/actions/ui-button',
    name: 'ui-button',
    section: null,
    text: 'ui-button',
    source: 'projects/ui-kit/actions/ui-button/ui-button.mdx',
  },
  {
    id: 'components-ui-actions-ui-button--docs#api',
    docId: 'components-ui-actions-ui-button--docs',
    anchor: 'api',
    title: 'Components/ui/actions/ui-button',
    name: 'ui-button',
    section: 'API',
    text: "label text Texte du bouton. string undefined level select high low. Épaisseur de l'anneau de focus.",
    source: 'projects/ui-kit/actions/ui-button/ui-button.mdx',
  },
  {
    id: 'components-ui-actions-ui-button--docs#theming',
    docId: 'components-ui-actions-ui-button--docs',
    anchor: 'theming',
    title: 'Components/ui/actions/ui-button',
    name: 'ui-button',
    section: 'Theming',
    text: '$focus-ring-width Épaisseur de l’anneau de focus. --ui-button-focus-ring-width',
    source: 'projects/ui-kit/actions/ui-button/ui-button.mdx',
  },
  {
    id: 'components-ui-forms-ui-select--docs',
    docId: 'components-ui-forms-ui-select--docs',
    anchor: null,
    title: 'Components/ui/forms/ui-select',
    name: 'ui-select',
    section: null,
    text: 'ui-select',
    source: 'projects/ui-kit/forms/ui-select/ui-select.mdx',
  },
  {
    id: 'components-ui-forms-ui-select--docs#api',
    docId: 'components-ui-forms-ui-select--docs',
    anchor: 'api',
    title: 'Components/ui/forms/ui-select',
    name: 'ui-select',
    section: 'API',
    text: 'options array Liste des options du select.',
    source: 'projects/ui-kit/forms/ui-select/ui-select.mdx',
  },
  {
    // Page de fondations : présente dans l'index de recherche, mais ne doit
    // pas apparaître dans `list_components` (source hors `projects/ui-kit/`).
    id: 'foundations-colors--docs',
    docId: 'foundations-colors--docs',
    anchor: null,
    title: 'Foundations/Colors',
    name: 'colors',
    section: null,
    text: 'Palette de couleurs et tokens sémantiques.',
    source: 'storybook/docs/foundations/colors.mdx',
  },
];

export const FIXTURE_SEARCH_DOCS: SearchDocsManifest = {
  $generatedBy: 'scripts/docs.search.mjs',
  $source: 'storybook/docs, projects/ui-kit',
  docs: FIXTURE_DOCS,
};

export const FIXTURE_UI_CONFIG: UiConfigManifest = {
  $generatedBy: 'scripts/docs.config.mjs',
  $source: {
    shared: 'projects/ui-kit/styles/settings/_ui-config.scss',
    components: 'projects/ui-kit',
  },
  groups: {
    'global-ui': { label: 'Global UI', docId: 'components-configuration-global-ui' },
  },
  shared: {
    '$focus-ring-width': {
      group: 'global-ui',
      role: "Épaisseur de l'anneau de focus, pour tout le kit.",
      default: { cssVar: '--ui-focus-ring-width', raw: 'var(--ui-focus-ring-width)' },
    },
  },
};
