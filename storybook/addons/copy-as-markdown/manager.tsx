/**
 * Addon local « copier en Markdown » — côté manager.
 *
 * Un outil de la barre du manager, visible uniquement sur une page de doc
 * (`viewMode === 'docs'`) : il en récupère les sections dans le même index
 * que la recherche plein texte (`storybook/addons/text-search`), produit par
 * `scripts/docs.search.mjs` et servi en statique depuis `storybook/public/`.
 *
 * L'intérêt : donner, sans agent MCP, le même contenu que le serveur
 * `@4sh/ui-kit-mcp` (`get_component_doc`) — collable dans n'importe quel chat
 * LLM. Les deux lisent la même doc, donc jamais en désaccord.
 */

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { addons, types, useStorybookState } from 'storybook/manager-api';
import { styled } from 'storybook/theming';

const ADDON_ID = '4sh/copy-as-markdown';
const TOOL_ID = `${ADDON_ID}/tool`;
const INDEX_URL = 'text-search-docs.json';
/** Le bouton revient à son libellé normal après ce délai. */
const RESET_DELAY_MS = 1600;

interface SearchDoc {
  id: string;
  docId: string;
  anchor: string | null;
  title: string;
  name: string;
  section: string | null;
  text: string;
  source: string;
}

type IndexState =
  { status: 'idle' | 'loading' } | { status: 'ready'; docs: SearchDoc[] } | { status: 'error' };
type CopyState = 'idle' | 'copied' | 'error';

/**
 * Sections d'une page → Markdown. La première section (titre sans `section`)
 * n'est qu'un marqueur d'identité pour l'index (son texte redouble le nom du
 * composant) — jamais un vrai contenu à copier.
 *
 * Le H1 reprend `name` (« ui-button »), pas `title` (« Components/ui/actions/
 * ui-button ») : c'est ce nom-là qu'on tape pour utiliser le composant, le
 * chemin Storybook n'apporte rien à un assistant IA — il part en note de bas
 * de page, avec la source, pour qui veut retrouver la page d'origine.
 */
function buildMarkdown(docs: SearchDoc[], docId: string): string | null {
  const sections = docs.filter((doc) => doc.docId === docId);
  if (!sections.length) return null;

  const lines = [`# ${sections[0].name}`, ''];
  for (const { section, text } of sections) {
    if (!section || !text.trim()) continue; // marqueur d'identité, ou section vide (à écrire)
    lines.push(`## ${section}`, '', text.trim(), '');
  }
  lines.push(`_Storybook : ${sections[0].title} — Source : ${sections[0].source}_`);
  return `${lines.join('\n').trim()}\n`;
}

// ---------------------------------------------------------------------------
// Styles — mêmes tokens que l'outil de recherche (storybook/theming)
// ---------------------------------------------------------------------------

const Trigger = styled.button(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  height: 28,
  padding: '0 8px',
  border: `1px solid ${theme.appBorderColor}`,
  borderRadius: theme.input.borderRadius,
  background: theme.input.background,
  color: theme.textMutedColor,
  font: 'inherit',
  fontSize: theme.typography.size.s1,
  cursor: 'pointer',
  transition: 'border-color 150ms, color 150ms',
  whiteSpace: 'nowrap',

  '&:hover:not(:disabled)': {
    borderColor: theme.color.secondary,
    color: theme.color.defaultText,
  },
  '&:focus-visible': {
    outline: `2px solid ${theme.color.secondary}`,
    outlineOffset: 1,
  },
  '&:disabled': {
    cursor: 'default',
    opacity: 0.5,
  },
}));

const MarkdownGlyph = () => (
  <svg width="13" height="13" viewBox="0 0 20 14" fill="none" aria-hidden="true">
    <rect
      x="0.75"
      y="0.75"
      width="18.5"
      height="12.5"
      rx="1.5"
      stroke="currentColor"
      strokeWidth="1.4"
    />
    <path
      d="M3 10V4l2.6 3L8.2 4v6M12 4v4.2M10 6.6l2 2 2-2M17 6l-2.2 4"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

const CheckGlyph = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <path
      d="M2.5 7.3 5.6 10.4 11.5 3.6"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

function CopyAsMarkdownTool() {
  const { storyId } = useStorybookState();
  const [index, setIndex] = useState<IndexState>({ status: 'idle' });
  const [copyState, setCopyState] = useState<CopyState>('idle');
  const requested = useRef(false);
  const resetTimer = useRef<ReturnType<typeof setTimeout>>();

  // Même compromis que l'outil de recherche : l'index n'est chargé qu'à la
  // première ouverture/survol, gratuit grâce au préchargement au hover.
  const loadIndex = useCallback(() => {
    if (requested.current) return;
    requested.current = true;
    setIndex({ status: 'loading' });

    fetch(INDEX_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((payload: { docs: SearchDoc[] }) => setIndex({ status: 'ready', docs: payload.docs }))
      .catch(() => setIndex({ status: 'error' }));
  }, []);

  useEffect(() => {
    loadIndex(); // le bouton n'apparaît que sur une page de doc : on ne rate pas grand-chose à charger tout de suite.
  }, [loadIndex]);

  useEffect(() => () => clearTimeout(resetTimer.current), []);

  const markdown = index.status === 'ready' ? buildMarkdown(index.docs, storyId) : null;
  const disabled = markdown === null;

  const onClick = useCallback(async () => {
    if (!markdown) return;
    try {
      await navigator.clipboard.writeText(markdown);
      setCopyState('copied');
    } catch {
      setCopyState('error');
    }
    clearTimeout(resetTimer.current);
    resetTimer.current = setTimeout(() => setCopyState('idle'), RESET_DELAY_MS);
  }, [markdown]);

  const label =
    copyState === 'copied'
      ? 'Copié !'
      : copyState === 'error'
        ? 'Échec de la copie'
        : 'Copier en Markdown';
  const title =
    index.status === 'error'
      ? 'Index introuvable — lance `npm run docs:search`.'
      : disabled
        ? 'Doc non indexée pour cette page.'
        : 'Copier cette page (API, theming, exemples…) en Markdown, pour la coller à un assistant IA.';

  return (
    <Trigger type="button" disabled={disabled} onClick={onClick} title={title}>
      {copyState === 'copied' ? <CheckGlyph /> : <MarkdownGlyph />}
      <span>{label}</span>
    </Trigger>
  );
}

addons.register(ADDON_ID, () => {
  addons.add(TOOL_ID, {
    type: types.TOOL,
    title: 'Copier en Markdown',
    // Seulement sur une page de doc : une story isolée n'a pas de « page » à
    // convertir (pas d'API, pas de Theming — juste ses contrôles).
    match: ({ viewMode }) => viewMode === 'docs',
    render: () => <CopyAsMarkdownTool />,
  });
});
