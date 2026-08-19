import MiniSearch from 'minisearch';
import { loadSearchDocs, type DocSection } from '../data.js';

export const SEARCH_DOCS_DESCRIPTION =
  'Recherche plein texte dans toute la doc du design system (composants, tokens, ' +
  "fondations, guidelines) — utile quand on ne connaît pas encore le nom exact d'un " +
  'composant ou qu\'on cherche un concept ("comment styler un état disabled", ' +
  '"quel token pour une bordure de focus"…).';

let index: MiniSearch<DocSection> | undefined;

function getIndex(): MiniSearch<DocSection> {
  if (index) return index;
  const { docs } = loadSearchDocs();
  index = new MiniSearch<DocSection>({
    idField: 'id',
    fields: ['title', 'section', 'text', 'name'],
    storeFields: ['title', 'section', 'name', 'source', 'anchor', 'text'],
  });
  index.addAll(docs);
  return index;
}

export function searchDocs(query: string, limit = 10) {
  const results = getIndex()
    .search(query, { prefix: true, fuzzy: 0.2 })
    .slice(0, limit)
    .map((r) => ({
      // Champs stockés via `storeFields` : MiniSearch les type en index
      // signature (`SearchResult`), d'où l'accès par crochets (`noPropertyAccessFromIndexSignature`).
      title: r['title'],
      section: r['section'],
      name: r['name'],
      source: r['source'],
      excerpt: String(r['text']).slice(0, 400),
      score: r.score,
    }));

  return {
    content: [
      {
        type: 'text' as const,
        text: JSON.stringify({ query, count: results.length, results }, null, 2),
      },
    ],
  };
}
