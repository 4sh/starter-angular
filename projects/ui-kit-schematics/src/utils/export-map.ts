/**
 * export-map — pour une unité copiable, quel fichier exporte quel symbole.
 *
 * Nécessaire parce que la copie APLATIT l'unité et supprime son barrel
 * (`public-api.ts` est une surface de publication de librairie, sans objet dans
 * l'app du consommateur — FSHSP-121). Un import qui passait par le barrel
 * (`import { BaseFieldControl } from '@4sh/ui-kit/forms'`) doit donc être
 * réadressé vers LE fichier qui porte le symbole : il faut la table.
 *
 * Les barrels du kit sont uniformément `export * from './lib/x'` — aucun
 * renommage, aucun export sélectif — et les déclarations exportées sont toutes
 * de forme simple. Une lecture par expression régulière suffit donc ici, sans
 * embarquer le compilateur TypeScript dans le paquet de schematics. Si l'une ou
 * l'autre de ces hypothèses tombait, `assertBarrelIsTrivial` échoue bruyamment
 * plutôt que de produire un import silencieusement faux.
 */
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import type { AssetUnit } from './component-registry';
import { unitSourceFiles, flattenedRelPath } from './component-registry';

/** `export class Foo`, `export type Bar`, `export abstract class Baz`… */
const EXPORT_DECL_RE =
  /^export\s+(?:declare\s+)?(?:abstract\s+class|class|interface|type|const|let|var|function|enum)\s+([A-Za-z_$][\w$]*)/gm;

/** Une ligne de barrel : `export * from './lib/ui-icon';` */
const BARREL_STAR_RE = /^export\s+\*\s+from\s+['"]([^'"]+)['"]\s*;?\s*$/;

export const BARREL_FILENAME = 'public-api.ts';

/**
 * Vérifie qu'un barrel ne contient que des `export * from './…'`. Un
 * `export { X as Y }` ou un `export default` invaliderait la table construite
 * plus bas : mieux vaut interrompre la copie que livrer des imports faux.
 */
function assertBarrelIsTrivial(unit: AssetUnit, barrelPath: string): void {
  const lines = readFileSync(barrelPath, 'utf8').split('\n');
  let inBlockComment = false;
  for (const [index, raw] of lines.entries()) {
    const line = raw.trim();
    if (inBlockComment) {
      if (line.includes('*/')) inBlockComment = false;
      continue;
    }
    if (line.startsWith('/*')) {
      if (!line.includes('*/')) inBlockComment = true;
      continue;
    }
    if (!line || line.startsWith('//')) continue;
    if (!BARREL_STAR_RE.test(line)) {
      throw new Error(
        `${unit.name} : le barrel ${BARREL_FILENAME} contient une ligne non triviale ` +
          `(ligne ${index + 1} : « ${line} »). La copie aplatie ne sait réadresser que des ` +
          `\`export * from './…'\`. Adapter export-map.ts avant de publier.`,
      );
    }
  }
}

/** Symboles exportés par un fichier source, dans l'ordre de déclaration. */
function exportedSymbols(absPath: string): string[] {
  const content = readFileSync(absPath, 'utf8');
  return [...content.matchAll(EXPORT_DECL_RE)].map((match) => match[1]);
}

/**
 * Table `symbole → chemin du fichier dans l'unité APRÈS aplatissement`
 * (ex. `BaseFieldControl` → `base-form-field`, sans extension : c'est la forme
 * qu'attend un import TypeScript).
 */
export function buildExportMap(unit: AssetUnit): Map<string, string> {
  const map = new Map<string, string>();

  for (const absPath of unitSourceFiles(unit)) {
    // Nom EXACT, comme dans `copy.ts` : sur un `endsWith`, un
    // `ui-table-public-api.ts` serait pris pour un barrel et ferait échouer
    // `assertBarrelIsTrivial` sur sa première déclaration.
    if (basename(absPath) === BARREL_FILENAME) {
      assertBarrelIsTrivial(unit, absPath);
      continue;
    }
    if (!absPath.endsWith('.ts')) continue;
    // Une story exporte des symboles (`export const High: Story`) qui ne sont
    // pas de l'API : les indexer ferait réadresser un import du kit vers un
    // fichier de doc si les deux noms se croisaient (FSHSP-125).
    if (absPath.endsWith('.stories.ts')) continue;

    // Chemin aplati, sans extension — c'est ce qu'un import doit désigner.
    const flattened = flattenedRelPath(unit, absPath).replace(/\.ts$/, '');
    for (const symbol of exportedSymbols(absPath)) {
      // Premier gagnant : un même symbole ne devrait pas être déclaré deux fois
      // dans une unité, et si ça arrive c'est le barrel qui trancherait — on ne
      // peut pas faire mieux sans compilateur, donc on reste déterministe.
      if (!map.has(symbol)) map.set(symbol, flattened);
    }
  }

  return map;
}
