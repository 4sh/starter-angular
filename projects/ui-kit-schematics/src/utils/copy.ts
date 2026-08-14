/**
 * copy — recopie une unité (`AssetUnit`) dans l'arbre du projet consommateur,
 * avec en-tête de traçabilité (origine + version) sur chaque fichier.
 */
import type { Tree } from '@angular-devkit/schematics';
import { readFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';
import type { AssetUnit } from './component-registry';

const HEADER_STYLE: Record<string, (body: string) => string> = {
  '.ts': (body) => `// ${body}\n`,
  '.scss': (body) => `// ${body}\n`,
  '.html': (body) => `<!-- ${body} -->\n`,
};

function traceabilityHeader(unit: AssetUnit, relPath: string, kitVersion: string, ext: string): string {
  const make = HEADER_STYLE[ext];
  if (!make) return '';
  const body =
    `Copié depuis @4sh/ui-kit@${kitVersion} (${unit.kind === 'component' ? unit.category + '/' + unit.name : 'base partagée ' + unit.name}, ${relPath}). ` +
    `Géré par ui-kit.json — voir \`ng generate @4sh/ui-kit-schematics:update\`.`;
  return make(body);
}

function walk(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else out.push(full);
  }
  return out;
}

export interface RenderedFile {
  targetPath: string;
  content: string;
}

/** Calcule le contenu final (en-tête inclus) de chaque fichier d'une unité,
 * sans rien écrire — réutilisé par `copyUnit` et par le diff d'`update`. */
export function renderUnitFiles(unit: AssetUnit, kitVersion: string): RenderedFile[] {
  return walk(unit.dir).map((absSrc) => {
    const relPath = relative(unit.dir, absSrc);
    const ext = absSrc.slice(absSrc.lastIndexOf('.'));
    const targetPath = join(unit.targetDir, relPath);
    const header = traceabilityHeader(unit, relPath, kitVersion, ext);
    return { targetPath, content: header + readFileSync(absSrc, 'utf8') };
  });
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
