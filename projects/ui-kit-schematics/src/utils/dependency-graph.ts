/**
 * dependency-graph — résolution des dépendances entre unités copiables,
 * dérivée par analyse statique des imports `@4sh/ui-kit/...` déjà présents
 * dans les `.ts` (voir FSHSP-109 : constaté sur `ui-select` → `ui-icon`,
 * `ui-spinner`, `forms` (base partagée), `motion`, `overlay`). Aucun graphe
 * à déclarer/maintenir à la main : les composants s'importent déjà entre eux
 * via leur spécificateur de package public.
 */
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import { type AssetUnit, findUnit } from './component-registry';

const IMPORT_RE = /from\s+['"]@4sh\/ui-kit\/([^'"]+)['"]/g;

function readTsFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) {
      out.push(...readTsFiles(full));
    } else if (entry.name.endsWith('.ts')) {
      out.push(full);
    }
  }
  return out;
}

/** Spécificateurs importés par une unité, ex. `forms/ui-field`, `base/ui-icon`, `forms`. */
function importedSpecifiers(unit: AssetUnit): string[] {
  const specifiers = new Set<string>();
  for (const file of readTsFiles(unit.dir)) {
    const content = readFileSync(file, 'utf8');
    for (const match of content.matchAll(IMPORT_RE)) {
      specifiers.add(match[1]);
    }
  }
  return [...specifiers];
}

/** Résout un spécificateur importé (`forms/ui-field`, `forms`) vers son unité. */
function resolveSpecifier(specifier: string): AssetUnit | undefined {
  const segments = specifier.split('/');
  // `{catégorie}/{ui-nom}` → composant ; `{catégorie}` seul → base partagée.
  const candidateName = segments.length > 1 ? segments[segments.length - 1] : segments[0];
  return findUnit(candidateName);
}

/**
 * Clôture transitive des dépendances pour une liste de noms sélectionnés.
 * Renvoie les unités dans un ordre stable, sélection d'origine en tête.
 */
export function resolveDependencies(names: string[]): AssetUnit[] {
  const resolved = new Map<string, AssetUnit>();
  const queue = [...names];

  while (queue.length) {
    const name = queue.shift()!;
    if (resolved.has(name)) continue;
    const unit = findUnit(name);
    if (!unit) continue; // spécificateur hors kit (@angular/*, rxjs…) : ignoré en amont
    resolved.set(name, unit);
    for (const specifier of importedSpecifiers(unit)) {
      const dep = resolveSpecifier(specifier);
      if (dep && !resolved.has(dep.name)) queue.push(dep.name);
    }
  }

  return [...resolved.values()];
}
