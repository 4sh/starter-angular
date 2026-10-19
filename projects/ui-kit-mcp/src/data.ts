/**
 * data — charge le manifeste embarqué avec le serveur : une copie figée, au
 * moment du build, des artefacts déjà produits par le pipeline doc du kit
 * (`storybook/public/text-search-docs.json`, `storybook/generated/ui-config.json`).
 *
 * Pourquoi une copie et pas une lecture live du repo : ce serveur n'est pas
 * publié sur npm — il est bundlé (`scripts/mcp-bundle.build.mjs`) puis
 * embarqué dans `@4sh/ui-kit` (mode librairie) ou `@4sh/ui-kit-schematics`
 * (mode starter, copié chez le consommateur par `ng add`). Dans les deux cas,
 * il tourne loin de ce repo, sans `storybook/` ni `projects/ui-kit/` sur
 * disque. Le manifeste voyage donc AVEC le serveur : `scripts/mcp-assets.build.mjs`
 * le copie ici avant le bundle, qui le recopie à côté du JS pour que ce
 * chemin relatif reste valide partout où le bundle est embarqué.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATA_DIR = join(dirname(fileURLToPath(import.meta.url)), 'data');

export interface DocSection {
  id: string;
  docId: string;
  anchor: string | null;
  title: string;
  name: string;
  section: string | null;
  text: string;
  source: string;
}

export interface SearchDocsManifest {
  $generatedBy: string;
  $source: string;
  docs: DocSection[];
}

/**
 * Un hook `--ui-*` peut-il aller dans un thème global (`component-vars.scss`), et
 * sinon pourquoi. Calculé par `scripts/component-vars.build.mjs`.
 */
export interface HookStatus {
  entryPoint: string;
  themable: boolean;
  /** Absent quand `themable`. */
  exclusion?: 'perVariant' | 'selfDeclared' | 'inputDriven' | 'crossCutting' | 'privateDefault';
  reason?: string;
  /** `perVariant` seulement : nombre de défauts distincts selon la variante rendue. */
  defaults?: number;
}

export interface UiConfigManifest {
  $generatedBy: string;
  $source: { shared: string; components: string };
  groups: Record<string, { label: string; docId: string }>;
  shared: Record<string, unknown>;
  components?: Record<string, unknown>;
  hookStatus?: Record<string, HookStatus>;
}

function readJson<T>(fileName: string): T {
  const path = join(DATA_DIR, fileName);
  try {
    return JSON.parse(readFileSync(path, 'utf8')) as T;
  } catch (error) {
    throw new Error(
      `[@4sh/ui-kit-mcp] Impossible de lire ${fileName} (${path}). ` +
        `Le manifeste est-il bien embarqué avec le package ?`,
      { cause: error },
    );
  }
}

let searchDocsCache: SearchDocsManifest | undefined;
let uiConfigCache: UiConfigManifest | undefined;

/** Index plein texte de la doc Storybook — une entrée = une section de page. */
export function loadSearchDocs(): SearchDocsManifest {
  return (searchDocsCache ??= readJson<SearchDocsManifest>('text-search-docs.json'));
}

/** Config structurelle des composants (rôles + bindings de tokens partagés). */
export function loadUiConfig(): UiConfigManifest {
  return (uiConfigCache ??= readJson<UiConfigManifest>('ui-config.json'));
}

/**
 * Une entrée par composant `ui-*` documenté, dédupliquée depuis les sections
 * (chaque page composant produit plusieurs sections : API, Theming, Tailles…).
 */
export function listComponentNames(): string[] {
  const { docs } = loadSearchDocs();
  const names = new Set<string>();
  for (const doc of docs) {
    if (doc.source.startsWith('projects/ui-kit/') && doc.name.startsWith('ui-')) {
      names.add(doc.name);
    }
  }
  return [...names].sort();
}

/**
 * Les hooks `--ui-*` d'un composant et leur statut, par nom croissant. Rattachés par
 * point d'entrée (`@4sh/ui-kit/actions/ui-button`) : un sous-composant du même
 * paquet compte avec lui.
 */
export function getComponentHooks(
  name: string,
): (Omit<HookStatus, 'entryPoint'> & { name: string })[] {
  const status = loadUiConfig().hookStatus ?? {};
  return Object.entries(status)
    .filter(([, s]) => s.entryPoint.endsWith(`/${name}`))
    .map(([hook, { entryPoint: _entryPoint, ...rest }]) => ({ name: hook, ...rest }));
}

/** Toutes les sections de doc d'un composant donné, dans l'ordre du disque. */
export function getComponentSections(name: string): DocSection[] {
  const { docs } = loadSearchDocs();
  return docs.filter((doc) => doc.source.startsWith('projects/ui-kit/') && doc.name === name);
}
