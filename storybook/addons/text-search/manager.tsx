/**
 * Addon local « recherche plein texte » — côté manager.
 *
 * Un outil de la barre du manager : un déclencheur qui ouvre une modale de
 * recherche sur la doc MDX. L'index est produit par `scripts/docs.search.mjs`
 * et servi en statique depuis `storybook/public/`.
 *
 * Tout est peint avec le thème Storybook actif (`storybook/theming`), donc la
 * modale suit le toggle dark mode sans une seule couleur en dur — le thème est
 * remplacé à chaud par `storybook/manager.ts` et emotion re-rend.
 *
 * Un résultat = une section de page. On navigue par `api.selectStory()` (pas de
 * rechargement, et aucune URL à construire — ce qui rend le déploiement sous
 * `/starter-angular/` transparent), puis l'ancre part sur le canal vers la
 * preview qui fait défiler.
 */

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { addons, types, useChannel, useStorybookApi } from 'storybook/manager-api';
import { PREVIEW_KEYDOWN } from 'storybook/internal/core-events';
import { styled } from 'storybook/theming';
import MiniSearch from 'minisearch';
import { DOCS_SCROLL_TO_ANCHOR } from './events';

const ADDON_ID = '4sh/text-search';
const TOOL_ID = `${ADDON_ID}/tool`;
const INDEX_URL = 'text-search-docs.json';
const MAX_RESULTS = 25;
// L'extrait tient sur une ligne tronquée en `text-overflow`, donc peu de
// contexte AVANT la correspondance : sinon le surlignage sort du cadre visible.
const SNIPPET_LEAD = 32;
const SNIPPET_LENGTH = 260;

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

// ---------------------------------------------------------------------------
// Styles — 100 % pilotés par le thème du manager
// ---------------------------------------------------------------------------

const Trigger = styled.button(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 6,
  height: 28,
  minWidth: 190,
  padding: '0 8px',
  border: `1px solid ${theme.appBorderColor}`,
  borderRadius: theme.input.borderRadius,
  background: theme.input.background,
  color: theme.textMutedColor,
  font: 'inherit',
  fontSize: theme.typography.size.s1,
  cursor: 'pointer',
  transition: 'border-color 150ms, color 150ms',

  '&:hover': {
    borderColor: theme.color.secondary,
    color: theme.color.defaultText,
  },
  '&:focus-visible': {
    outline: `2px solid ${theme.color.secondary}`,
    outlineOffset: 1,
  },
}));

const TriggerLabel = styled.span({ flex: 1, textAlign: 'left' });

const Shortcut = styled.kbd(({ theme }) => ({
  padding: '1px 5px',
  border: `1px solid ${theme.appBorderColor}`,
  borderRadius: 3,
  background: theme.background.app,
  color: theme.textMutedColor,
  fontFamily: theme.typography.fonts.base,
  fontSize: 10,
  lineHeight: '15px',
}));

const Backdrop = styled.div(({ theme }) => ({
  position: 'fixed',
  inset: 0,
  zIndex: 9999,
  display: 'flex',
  alignItems: 'flex-start',
  justifyContent: 'center',
  padding: '10vh 24px 24px',
  background: theme.base === 'dark' ? 'rgba(0, 0, 0, 0.6)' : 'rgba(27, 28, 35, 0.35)',
}));

const Panel = styled.div(({ theme }) => ({
  display: 'flex',
  flexDirection: 'column',
  width: '100%',
  maxWidth: 620,
  maxHeight: '70vh',
  overflow: 'hidden',
  border: `1px solid ${theme.appBorderColor}`,
  borderRadius: theme.appBorderRadius,
  background: theme.background.content,
  color: theme.color.defaultText,
  boxShadow:
    theme.base === 'dark' ? '0 16px 40px rgba(0, 0, 0, 0.6)' : '0 16px 40px rgba(27, 28, 35, 0.25)',
}));

const Field = styled.div(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '14px 16px',
  borderBottom: `1px solid ${theme.appBorderColor}`,
  color: theme.textMutedColor,
}));

const Input = styled.input(({ theme }) => ({
  flex: 1,
  border: 0,
  background: 'transparent',
  color: theme.input.color,
  font: 'inherit',
  fontSize: theme.typography.size.s3,
  outline: 'none',

  '&::placeholder': { color: theme.textMutedColor },

  // La croix native de `type="search"` est dessinée par le navigateur : gris fixe,
  // insensible au thème. On la remplace par `<ClearButton>`.
  '&::-webkit-search-cancel-button': { display: 'none' },
  '&::-webkit-search-decoration': { display: 'none' },
}));

const ClearButton = styled.button(({ theme }) => ({
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  width: 22,
  height: 22,
  padding: 0,
  border: 0,
  borderRadius: '50%',
  background: 'transparent',
  color: theme.color.defaultText,
  cursor: 'pointer',
  transition: 'background 150ms',

  '&:hover': { background: theme.background.hoverable },
  '&:focus-visible': { outline: `2px solid ${theme.color.secondary}`, outlineOffset: 1 },
}));

const Results = styled.ul({
  flex: 1,
  margin: 0,
  padding: 4,
  overflowY: 'auto',
  listStyle: 'none',
});

const Result = styled.li<{ selected: boolean }>(({ theme, selected }) => ({
  padding: '8px 12px',
  borderRadius: theme.appBorderRadius,
  background: selected ? theme.background.hoverable : 'transparent',
  cursor: 'pointer',
}));

const ResultTitle = styled.div(({ theme }) => ({
  fontSize: theme.typography.size.s2,
  fontWeight: theme.typography.weight.bold,
  color: theme.color.defaultText,
}));

const ResultPath = styled.div(({ theme }) => ({
  marginTop: 1,
  fontSize: theme.typography.size.s1,
  color: theme.textMutedColor,
}));

const ResultSnippet = styled.div(({ theme }) => ({
  marginTop: 4,
  overflow: 'hidden',
  fontSize: theme.typography.size.s1,
  color: theme.textMutedColor,
  lineHeight: '17px',
  textOverflow: 'ellipsis',
  whiteSpace: 'nowrap',
}));

/**
 * Seule couleur qui ne vient pas des variables de thème du projet : la palette
 * de base de Storybook (`gold` / `darkest`, identiques en clair et en sombre).
 * Un surlignage doit rester lisible quoi que `colorSecondary` vaille — et il
 * doit ressortir sur la ligne sélectionnée, dont le fond est déjà
 * `background.hoverable`.
 */
const Mark = styled.mark(({ theme }) => ({
  padding: '0 2px',
  borderRadius: 2,
  background: theme.color.gold,
  color: theme.color.darkest,
  fontWeight: theme.typography.weight.bold,
}));

const Empty = styled.div(({ theme }) => ({
  padding: '28px 16px',
  color: theme.textMutedColor,
  fontSize: theme.typography.size.s2,
  textAlign: 'center',
}));

const Footer = styled.div(({ theme }) => ({
  display: 'flex',
  gap: 14,
  padding: '8px 16px',
  borderTop: `1px solid ${theme.appBorderColor}`,
  background: theme.background.app,
  color: theme.textMutedColor,
  fontSize: theme.typography.size.s1,
}));

const SearchGlyph = () => (
  <svg width="13" height="13" viewBox="0 0 14 14" fill="none" aria-hidden="true">
    <circle cx="6" cy="6" r="4.4" stroke="currentColor" strokeWidth="1.4" />
    <path d="M9.3 9.3 L12.6 12.6" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" />
  </svg>
);

const ClearGlyph = () => (
  <svg width="11" height="11" viewBox="0 0 12 12" fill="none" aria-hidden="true">
    <path
      d="M2.6 2.6 L9.4 9.4 M9.4 2.6 L2.6 9.4"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
    />
  </svg>
);

// ---------------------------------------------------------------------------
// Extrait + surlignage
// ---------------------------------------------------------------------------

const escapeRegExp = (value: string) => value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

/**
 * Le tokenizer par défaut de MiniSearch coupe sur la ponctuation, donc
 * `--ui-form-control-size` devient `ui` `form` `control` `size` — et une page
 * `ui-segment-control` sort devant celle qui contient réellement le hook.
 *
 * On garde donc l'identifiant **entier** en plus de ses morceaux. Comme la même
 * fonction sert à l'indexation et à la requête, un `combineWith: 'AND'` exige
 * alors le compound : les correspondances exactes remontent, le bruit tombe.
 * Vaut pour tout ce qui s'écrit avec des tirets ici — hooks `--ui-*`, tokens
 * `--global-*`, sélecteurs `ui-button`, variables SCSS `$form-control-size`.
 */
function tokenize(text: string): string[] {
  const tokens: string[] = [];

  for (const raw of text.split(/[^\p{L}\p{N}_-]+/u)) {
    const word = raw.replace(/^-+|-+$/g, '');
    if (!word) continue;
    tokens.push(word);
    if (word.includes('-')) tokens.push(...word.split('-').filter(Boolean));
  }

  return tokens;
}

const queryTerms = (query: string) =>
  query
    .toLowerCase()
    .split(/\s+/)
    .filter((term) => term.length > 1);

/** Fenêtre de texte centrée sur la première occurrence d'un des termes. */
function snippetFor(text: string, terms: string[]): string {
  if (!text) return '';

  const haystack = text.toLowerCase();
  const hit = terms.map((term) => haystack.indexOf(term)).filter((index) => index >= 0);
  const start = hit.length ? Math.max(0, Math.min(...hit) - SNIPPET_LEAD) : 0;
  const end = Math.min(text.length, start + SNIPPET_LENGTH);

  return `${start > 0 ? '…' : ''}${text.slice(start, end).trim()}${end < text.length ? '…' : ''}`;
}

/**
 * Surligne les termes en composant des nœuds React — jamais d'injection HTML :
 * le contenu vient de fichiers MDX qui contiennent, eux, du markup.
 */
function Highlighted({ text, terms }: { text: string; terms: string[] }) {
  if (!terms.length || !text) return <>{text}</>;

  const parts = text.split(new RegExp(`(${terms.map(escapeRegExp).join('|')})`, 'gi'));
  return (
    <>{parts.map((part, index) => (index % 2 === 1 ? <Mark key={index}>{part}</Mark> : part))}</>
  );
}

// ---------------------------------------------------------------------------
// Outil
// ---------------------------------------------------------------------------

const isMac = typeof navigator !== 'undefined' && navigator.userAgent.includes('Mac');
const SHORTCUT_HINT = isMac ? '⇧⌘K' : 'Ctrl⇧K';

/** Les touches relayées par la preview sont sérialisées, pas de vrai KeyboardEvent. */
type ShortcutKeys = Pick<KeyboardEvent, 'key' | 'metaKey' | 'ctrlKey' | 'shiftKey'>;
interface PreviewKeydownPayload {
  event: ShortcutKeys;
}

const isSearchShortcut = (event: ShortcutKeys) =>
  (isMac ? event.metaKey : event.ctrlKey) && event.shiftKey && event.key.toLowerCase() === 'k';

type IndexState =
  | { status: 'idle' | 'loading' }
  | { status: 'ready'; mini: MiniSearch<SearchDoc> }
  | { status: 'error' };

function TextSearch() {
  const api = useStorybookApi();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const [index, setIndex] = useState<IndexState>({ status: 'idle' });

  const triggerRef = useRef<HTMLButtonElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultRefs = useRef<(HTMLLIElement | null)[]>([]);

  // L'index pèse quelques centaines de Ko : il n'est chargé qu'à la première
  // ouverture, et préchargé au survol du déclencheur pour que ce soit gratuit.
  // Le garde-fou est une ref, pas l'état : un `setState` peut être rejoué (mode
  // strict de React), et le fetch partirait deux fois.
  const requested = useRef(false);

  const loadIndex = useCallback(() => {
    if (requested.current) return;
    requested.current = true;
    setIndex({ status: 'loading' });

    fetch(INDEX_URL)
      .then((response) => {
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        return response.json();
      })
      .then((payload: { docs: SearchDoc[] }) => {
        const mini = new MiniSearch<SearchDoc>({
          idField: 'id',
          fields: ['name', 'section', 'title', 'text'],
          storeFields: ['docId', 'anchor', 'title', 'name', 'section', 'text'],
          tokenize,
        });
        mini.addAll(payload.docs);
        setIndex({ status: 'ready', mini });
      })
      .catch(() => setIndex({ status: 'error' }));
  }, []);

  const results = useMemo(() => {
    if (index.status !== 'ready' || query.trim().length < 2) return [];

    return index.mini
      .search(query, {
        prefix: true,
        fuzzy: 0.15,
        combineWith: 'AND',
        boost: { name: 5, section: 3, title: 2 },
      })
      .slice(0, MAX_RESULTS) as unknown as (SearchDoc & { id: string })[];
  }, [index, query]);

  const terms = useMemo(() => queryTerms(query), [query]);

  const close = useCallback(() => {
    setOpen(false);
    setQuery('');
    setSelected(0);
    triggerRef.current?.focus();
  }, []);

  const openSearch = useCallback(() => {
    loadIndex();
    setOpen(true);
  }, [loadIndex]);

  const go = useCallback(
    (doc: SearchDoc) => {
      close();
      api.selectStory(doc.docId);
      if (doc.anchor) api.emit(DOCS_SCROLL_TO_ANCHOR, { anchor: doc.anchor });
    },
    [api, close],
  );

  // Raccourci global. `⌘K` seul appartient déjà à la recherche de composants
  // de la sidebar, d'où le `⇧`.
  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (!isSearchShortcut(event)) return;
      event.preventDefault();
      openSearch();
    };

    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [openSearch]);

  // Dès qu'on a cliqué dans la page de doc, le focus est DANS l'iframe de
  // preview : le `keydown` y reste et n'atteint jamais cette fenêtre, donc le
  // raccourci semble mort. Storybook relaie ces touches sur le canal — c'est le
  // seul chemin qui couvre le cas le plus courant, un lecteur en train de lire.
  useChannel(
    {
      [PREVIEW_KEYDOWN]: ({ event }: PreviewKeydownPayload) =>
        isSearchShortcut(event) && openSearch(),
    },
    [openSearch],
  );

  useEffect(() => setSelected(0), [query]);

  useEffect(() => {
    if (open) inputRef.current?.focus();
  }, [open]);

  useEffect(() => {
    resultRefs.current[selected]?.scrollIntoView({ block: 'nearest' });
  }, [selected]);

  const onInputKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Escape') {
      event.preventDefault();
      close();
      return;
    }
    if (!results.length) return;

    if (event.key === 'ArrowDown' || (event.key === 'Tab' && !event.shiftKey)) {
      event.preventDefault();
      setSelected((current) => (current + 1) % results.length);
    } else if (event.key === 'ArrowUp' || (event.key === 'Tab' && event.shiftKey)) {
      event.preventDefault();
      setSelected((current) => (current - 1 + results.length) % results.length);
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const doc = results[selected];
      if (doc) go(doc);
    }
  };

  return (
    <>
      <Trigger
        ref={triggerRef}
        type="button"
        title="Rechercher dans la documentation"
        onClick={openSearch}
        onMouseEnter={loadIndex}
        onFocus={loadIndex}
      >
        <SearchGlyph />
        <TriggerLabel>Rechercher dans la doc</TriggerLabel>
        <Shortcut>{SHORTCUT_HINT}</Shortcut>
      </Trigger>

      {open && (
        <Backdrop onMouseDown={close}>
          <Panel
            role="dialog"
            aria-modal="true"
            aria-label="Rechercher dans la documentation"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <Field>
              <SearchGlyph />
              <Input
                ref={inputRef}
                type="search"
                value={query}
                placeholder="Rechercher dans la documentation…"
                aria-label="Rechercher dans la documentation"
                aria-controls={`${TOOL_ID}-results`}
                aria-activedescendant={
                  results[selected] ? `${TOOL_ID}-result-${selected}` : undefined
                }
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={onInputKeyDown}
              />
              {query && (
                // Hors parcours Tab : dans la modale, Tab fait défiler les
                // résultats. Au clavier, on vide avec Échap.
                <ClearButton
                  type="button"
                  tabIndex={-1}
                  aria-label="Effacer la recherche"
                  onClick={() => {
                    setQuery('');
                    inputRef.current?.focus();
                  }}
                >
                  <ClearGlyph />
                </ClearButton>
              )}
            </Field>

            {results.length > 0 ? (
              <Results id={`${TOOL_ID}-results`} role="listbox" aria-label="Résultats">
                {results.map((doc, position) => (
                  <Result
                    key={doc.id}
                    id={`${TOOL_ID}-result-${position}`}
                    ref={(element) => {
                      resultRefs.current[position] = element;
                    }}
                    role="option"
                    aria-selected={position === selected}
                    selected={position === selected}
                    onMouseMove={() => setSelected(position)}
                    onClick={() => go(doc)}
                  >
                    <ResultTitle>
                      <Highlighted
                        text={doc.section ? `${doc.name} › ${doc.section}` : doc.name}
                        terms={terms}
                      />
                    </ResultTitle>
                    <ResultPath>{doc.title}</ResultPath>
                    {doc.text && (
                      <ResultSnippet>
                        <Highlighted text={snippetFor(doc.text, terms)} terms={terms} />
                      </ResultSnippet>
                    )}
                  </Result>
                ))}
              </Results>
            ) : (
              <Empty>
                {index.status === 'error'
                  ? 'Index introuvable — lance `npm run docs:search`.'
                  : index.status === 'loading'
                    ? 'Chargement de l’index…'
                    : query.trim().length < 2
                      ? 'Tape au moins deux caractères.'
                      : 'Aucun résultat.'}
              </Empty>
            )}

            <Footer>
              <span>↑ ↓ naviguer</span>
              <span>↵ ouvrir</span>
              <span>Esc fermer</span>
            </Footer>
          </Panel>
        </Backdrop>
      )}
    </>
  );
}

addons.register(ADDON_ID, () => {
  addons.add(TOOL_ID, {
    type: types.TOOL,
    title: 'Recherche plein texte',
    render: () => <TextSearch />,
  });
});
