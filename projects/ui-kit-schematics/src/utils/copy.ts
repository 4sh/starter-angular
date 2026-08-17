/**
 * copy — recopie une unité (`AssetUnit`) dans l'arbre du projet consommateur,
 * aplatie (FSHSP-121), avec en-tête de traçabilité (origine + version +
 * licence) sur chaque fichier.
 */
import type { Tree } from '@angular-devkit/schematics';
import { readFileSync } from 'node:fs';
import type { AssetUnit } from './component-registry';
import { flattenedRelPath, unitSourceFiles } from './component-registry';
import { BARREL_FILENAME } from './export-map';

const HEADER_STYLE: Record<string, (lines: string[]) => string> = {
  '.ts': (lines) => lines.map((l) => `// ${l}`).join('\n') + '\n',
  '.scss': (lines) => lines.map((l) => `// ${l}`).join('\n') + '\n',
  '.html': (lines) => `<!--\n${lines.map((l) => `  ${l}`).join('\n')}\n-->\n`,
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

/** Calcule le contenu final (en-tête inclus) de chaque fichier d'une unité,
 * sans rien écrire — réutilisé par `copyUnit` et par le diff d'`update`. */
export function renderUnitFiles(unit: AssetUnit, kitVersion: string): RenderedFile[] {
  const files: RenderedFile[] = [];

  for (const absSrc of unitSourceFiles(unit)) {
    // Le barrel est une surface de publication de librairie : il n'a rien à
    // faire chez le consommateur, où les imports désignent les fichiers.
    if (absSrc.endsWith(BARREL_FILENAME)) continue;

    const relPath = flattenedRelPath(unit, absSrc);
    const ext = absSrc.slice(absSrc.lastIndexOf('.'));
    const targetPath = `${unit.targetDir}/${relPath}`;

    files.push({
      targetPath,
      content: traceabilityHeader(unit, relPath, kitVersion, ext) + readFileSync(absSrc, 'utf8'),
    });
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
