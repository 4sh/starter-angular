/**
 * component-registry — inventaire des unités copiables, lu directement sur
 * le disque (`assets/`, alimenté par `scripts/schematics-assets.build.mjs`
 * à la racine du repo). Aucune liste à maintenir à la main : cf.
 * `components.check.mjs`, même philosophie côté kit publié.
 */
import { readdirSync, existsSync } from 'node:fs';
import { join, relative, sep } from 'node:path';

/** Une unité copiable : un composant `ui-*`, ou une base partagée de catégorie. */
export interface AssetUnit {
  /** Nom stable utilisé dans `ui-kit.json` : `ui-select`, ou `forms` pour une base partagée. */
  name: string;
  category: string;
  kind: 'component' | 'shared';
  /** Chemin absolu vers les fichiers source à copier. */
  dir: string;
  /** Chemin de destination relatif à la racine du projet consommateur. */
  targetDir: string;
}

const ASSETS_ROOT = join(__dirname, '..', '..', 'assets');
const COMPONENTS_ROOT = 'src/app/shared/components/ui';
/** Directives de base, services, utilitaires et types transverses : hors de
 * `components/`, qui ne doit contenir que des composants (FSHSP-121). */
const CORE_ROOT = 'src/app/shared/ui-core';
/** Bloc de doc `<ConfigTable>` chez le consommateur (FSHSP-125) : sa place
 * décide du chemin relatif réécrit dans chaque MDX copié, d'où la constante
 * partagée plutôt qu'un littéral des deux côtés. Même disposition qu'ici, pour
 * que le scaffold Storybook à venir tombe juste autour. */
export const CONFIG_TABLE_PATH = 'storybook/blocks/config-table.js';

function listDirs(dir: string): string[] {
  if (!existsSync(dir)) return [];
  return readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory())
    .map((e) => e.name);
}

/** Tous les composants `ui-*` disponibles, tous catégories confondues. */
export function listComponents(): AssetUnit[] {
  const componentsRoot = join(ASSETS_ROOT, 'components');
  const units: AssetUnit[] = [];
  for (const category of listDirs(componentsRoot)) {
    for (const name of listDirs(join(componentsRoot, category))) {
      units.push({
        name,
        category,
        kind: 'component',
        dir: join(componentsRoot, category, name),
        targetDir: join(COMPONENTS_ROOT, category, name),
      });
    }
  }
  return units;
}

/** Toutes les bases partagées (transverses à une catégorie, ex. `forms`). */
export function listSharedBases(): AssetUnit[] {
  const sharedRoot = join(ASSETS_ROOT, 'shared');
  return listDirs(sharedRoot).map((category) => ({
    name: category,
    category,
    kind: 'shared',
    dir: join(sharedRoot, category),
    targetDir: join(CORE_ROOT, category),
  }));
}

export function findUnit(name: string): AssetUnit | undefined {
  return [...listComponents(), ...listSharedBases()].find((u) => u.name === name);
}

/**
 * Résout un spécificateur importé vers son unité : `{catégorie}/{ui-nom}` →
 * composant (`forms/ui-field`), `{catégorie}` seul → base partagée (`forms`).
 * Partagé par le graphe de dépendances et la réécriture des imports, qui
 * doivent impérativement s'accorder sur ce mapping.
 */
export function resolveSpecifier(specifier: string): AssetUnit | undefined {
  const segments = specifier.split('/');
  const candidateName = segments.length > 1 ? segments[segments.length - 1] : segments[0];
  return findUnit(candidateName);
}

export function stylesFoundationDir(): string {
  return join(ASSETS_ROOT, 'styles');
}

/** Chaîne de doc embarquée : `docs.config.mjs` + le bloc `<ConfigTable>` (FSHSP-125). */
export function docsPipelineDir(): string {
  return join(ASSETS_ROOT, 'docs-pipeline');
}

/** Serveur MCP compagnon, bundlé (FSHSP-115) — voir `scripts/mcp-bundle.build.mjs`. */
export function mcpServerDir(): string {
  return join(ASSETS_ROOT, 'mcp-server');
}

/**
 * `.prettierrc`/`.prettierignore` du kit (FSHSP-140) : posés tels quels chez
 * le consommateur pour que `ng generate …:update` compare deux copies
 * reformatées avec LA MÊME config — sinon le CLI Angular reformate les
 * fichiers écrits avec celle (ou l'absence) trouvée chez le consommateur, et
 * le diff se noie dans du bruit d'indentation plutôt que du contenu.
 */
export function prettierConfigDir(): string {
  return join(ASSETS_ROOT, 'prettier');
}

/** Story et MDX d'un composant : sa doc, laissée de côté sur `--skip-storybook`. */
export function isStorybookFile(path: string): boolean {
  return path.endsWith('.stories.ts') || path.endsWith('.mdx');
}

/** Tous les fichiers d'une unité, chemins absolus. */
export function unitSourceFiles(unit: AssetUnit): string[] {
  const out: string[] = [];
  const walk = (dir: string) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else out.push(full);
    }
  };
  walk(unit.dir);
  return out;
}

/**
 * Chemin d'un fichier dans l'unité APRÈS aplatissement, relatif à `targetDir`.
 *
 * `src/` et `lib/` sont l'échafaudage d'`ng-packagr` : ils délimitent la surface
 * publiée d'une librairie. Copiés chez le consommateur ils n'encadrent plus rien
 * et ne font qu'enfouir les fichiers de deux niveaux (FSHSP-121). On les retire.
 *
 * `src/lib/ui-icon.ts` → `ui-icon.ts` ; `lib/base-form-field.ts` →
 * `base-form-field.ts` ; `ui-level.ts` (déjà à plat) → inchangé.
 */
export function flattenedRelPath(unit: AssetUnit, absPath: string): string {
  const segments = relative(unit.dir, absPath).split(sep);
  if (segments[0] === 'src') segments.shift();
  if (segments[0] === 'lib') segments.shift();
  return segments.join('/');
}
