/**
 * copy — recopie une unité (`AssetUnit`) dans l'arbre du projet consommateur,
 * aplatie (FSHSP-121), imports réadressés vers les copies voisines (FSHSP-119),
 * avec en-tête de traçabilité (origine + version + licence) sur chaque fichier.
 */
import type { Tree } from '@angular-devkit/schematics';
import { SchematicsException } from '@angular-devkit/schematics';
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import type { AssetUnit } from './component-registry';
import { flattenedRelPath, isStorybookFile, unitSourceFiles } from './component-registry';
import { BARREL_FILENAME } from './export-map';
import { rewriteDocImports, rewriteKitImports } from './rewrite-imports';

const HEADER_STYLE: Record<string, (lines: string[]) => string> = {
  '.ts': (lines) => lines.map((l) => `// ${l}`).join('\n') + '\n',
  '.scss': (lines) => lines.map((l) => `// ${l}`).join('\n') + '\n',
  '.html': (lines) => `<!--\n${lines.map((l) => `  ${l}`).join('\n')}\n-->\n`,
  // Commentaire d'expression JSX : le MDX v3 ne connaît plus `<!-- -->`, qu'il
  // rendrait tel quel en haut de la page de doc.
  '.mdx': (lines) => `{/*\n${lines.map((l) => `  ${l}`).join('\n')}\n*/}\n\n`,
};

function traceabilityHeader(unit: AssetUnit, relPath: string, kitVersion: string, ext: string): string {
  const make = HEADER_STYLE[ext];
  if (!make) return '';
  const origin = unit.kind === 'component' ? `${unit.category}/${unit.name}` : `base partagée ${unit.name}`;
  return make([
    `Copié depuis @4sh/ui-kit@${kitVersion} (${origin}, ${relPath}). ` +
      `Géré par ui-kit.json — voir \`ng generate @4sh/ui-kit-schematics:update\`.`,
    // Le fichier quitte le package pour vivre dans le dépôt du consommateur :
    // sans cette ligne, plus rien n'y rattache les termes sous lesquels il est
    // fourni (Apache-2.0 §4b — conserver les mentions dans les copies).
    `Apache-2.0 — Copyright 2026 4SH.`,
  ]);
}

export interface RenderedFile {
  targetPath: string;
  content: string;
}

export interface RenderOptions {
  /** Poser aussi la story et le MDX du composant (FSHSP-125). Par défaut non :
   * sans Storybook dans le projet, ce sont deux fichiers qui importent des
   * packages absents. Le choix est mémorisé dans `ui-kit.json`, pour qu'`update`
   * le reconduise au lieu de le redemander. */
  withStorybook?: boolean;
}

/** Calcule le contenu final (en-tête inclus) de chaque fichier d'une unité,
 * sans rien écrire — réutilisé par `copyUnit` et par le diff d'`update`. */
export function renderUnitFiles(unit: AssetUnit, kitVersion: string, options: RenderOptions = {}): RenderedFile[] {
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
    if (!options.withStorybook && isStorybookFile(absSrc)) continue;

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
    if (ext === '.ts' || ext === '.mdx') {
      const result = ext === '.mdx' ? rewriteDocImports(source, targetPath) : rewriteKitImports(source, targetPath);
      source = result.content;
      unresolved.push(...result.unresolved.map((item) => `${relPath} → ${item}`));
    }

    files.push({ targetPath, content: traceabilityHeader(unit, relPath, kitVersion, ext) + source });
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
export function copyUnit(tree: Tree, unit: AssetUnit, kitVersion: string, options: RenderOptions = {}): string[] {
  const written: string[] = [];
  for (const { targetPath, content } of renderUnitFiles(unit, kitVersion, options)) {
    if (tree.exists(targetPath)) tree.overwrite(targetPath, content);
    else tree.create(targetPath, content);
    written.push(targetPath);
  }
  return written;
}
