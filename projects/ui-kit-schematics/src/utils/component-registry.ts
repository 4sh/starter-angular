/**
 * component-registry — inventaire des unités copiables, lu directement sur
 * le disque (`assets/`, alimenté par `scripts/schematics-assets.build.mjs`
 * à la racine du repo). Aucune liste à maintenir à la main : cf.
 * `components.check.mjs`, même philosophie côté kit publié.
 */
import { readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';

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
const CONSUMER_ROOT = 'src/app/shared/components/ui';

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
        targetDir: join(CONSUMER_ROOT, category, name),
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
    // Copiée à côté des composants de sa catégorie, jamais dans un composant précis.
    targetDir: join(CONSUMER_ROOT, category, `_shared`),
  }));
}

export function findUnit(name: string): AssetUnit | undefined {
  return [...listComponents(), ...listSharedBases()].find((u) => u.name === name);
}

export function stylesFoundationDir(): string {
  return join(ASSETS_ROOT, 'styles');
}
