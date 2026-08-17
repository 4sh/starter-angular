/**
 * copy — recopie une unité (`AssetUnit`) dans l'arbre du projet consommateur,
 * aplatie (FSHSP-121), imports réadressés vers les copies voisines (FSHSP-119),
 * avec en-tête de traçabilité (version + licence) sur chaque fichier.
 */
import type { Tree } from '@angular-devkit/schematics';
import { SchematicsException } from '@angular-devkit/schematics';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import type { AssetUnit } from './component-registry';
import { flattenedRelPath, unitSourceFiles } from './component-registry';
import { BARREL_FILENAME } from './export-map';
import { rewriteKitImports } from './rewrite-imports';

const HEADER_STYLE: Record<string, (line: string) => string> = {
  '.ts': (line) => `// ${line}\n`,
  '.scss': (line) => `// ${line}\n`,
  '.html': (line) => `<!-- ${line} -->\n`,
};

// Une ligne, et rien de déductible : ni l'origine ni le chemin, que le fichier
// copié porte déjà dans son emplacement (`ui/{catégorie}/{ui-nom}/`,
// `ui-core/{domaine}/`). Restent la version, et la mention de licence — le
// fichier quitte le package pour vivre dans le dépôt du consommateur, où plus
// rien d'autre n'y rattache les termes sous lesquels il est fourni
// (Apache-2.0 §4b — conserver les mentions dans les copies).
function traceabilityHeader(kitVersion: string, ext: string): string {
  const make = HEADER_STYLE[ext];
  if (!make) return '';
  return make(`@4sh/ui-kit@${kitVersion} — Apache-2.0 — Copyright 2026 4SH.`);
}

export interface RenderedFile {
  targetPath: string;
  content: string;
}

/** Calcule le contenu final (en-tête inclus) de chaque fichier d'une unité,
 * sans rien écrire — réutilisé par `copyUnit` et par le diff d'`update`. */
export function renderUnitFiles(unit: AssetUnit, kitVersion: string): RenderedFile[] {
  const files: RenderedFile[] = [];
  const unresolved: string[] = [];

  // L'aplatissement retire `src/` et `lib/` : deux sources distinctes peuvent
  // donc viser la même destination (`src/foo.ts` et `src/lib/foo.ts`). Sans ce
  // relevé, la seconde écraserait la première en silence — le seul chemin de
  // perte muette d'un module qui échoue bruyamment partout ailleurs.
  const claimedBy = new Map<string, string>();

  for (const absSrc of unitSourceFiles(unit)) {
    // Le barrel est une surface de publication de librairie : il n'a rien à
    // faire chez le consommateur, où les imports désignent les fichiers.
    // Comparaison sur le nom EXACT : un `endsWith` écarterait aussi un
    // `ui-table-public-api.ts`, qui est un fichier de composant ordinaire.
    if (basename(absSrc) === BARREL_FILENAME) continue;

    const relPath = flattenedRelPath(unit, absSrc);
    const ext = absSrc.slice(absSrc.lastIndexOf('.'));
    const targetPath = `${unit.targetDir}/${relPath}`;

    const previous = claimedBy.get(targetPath);
    if (previous) {
      throw new SchematicsException(
        `${unit.name} : après aplatissement, « ${previous} » et « ${absSrc} » visent tous deux ` +
          `${targetPath}. Renommer l'un des deux dans le kit — la copie ne peut pas trancher.`,
      );
    }
    claimedBy.set(targetPath, absSrc);

    let source = readFileSync(absSrc, 'utf8');
    if (ext === '.ts') {
      const result = rewriteKitImports(source, targetPath);
      source = result.content;
      unresolved.push(...result.unresolved.map((item) => `${relPath} → ${item}`));
    }

    files.push({ targetPath, content: traceabilityHeader(kitVersion, ext) + source });
  }

  if (unresolved.length) {
    // Laisser passer produirait un projet qui ne compile pas, avec une cause
    // très difficile à remonter jusqu'ici. On échoue sur place, en nommant.
    throw new SchematicsException(
      `${unit.name} : ${unresolved.length} import(s) du kit non réadressé(s) —\n  ` +
        unresolved.join('\n  ') +
        `\nCorriger la table d'exports (utils/export-map.ts) ou le mapping ` +
        `(utils/component-registry.ts#resolveSpecifier) avant de publier.`,
    );
  }

  return files;
}

/** Copie tous les fichiers d'une unité dans l'arbre, avec en-tête de traçabilité. */
export function copyUnit(tree: Tree, unit: AssetUnit, kitVersion: string): string[] {
  const written: string[] = [];
  for (const { targetPath, content } of renderUnitFiles(unit, kitVersion)) {
    if (tree.exists(targetPath)) tree.overwrite(targetPath, content);
    else tree.create(targetPath, content);
    written.push(targetPath);
  }
  return written;
}
