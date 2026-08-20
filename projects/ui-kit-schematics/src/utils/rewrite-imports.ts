/**
 * rewrite-imports — transforme les imports `@4sh/ui-kit/…` des fichiers copiés
 * en chemins relatifs vers les copies voisines (FSHSP-119).
 *
 * Sans cette passe, un composant copié continue de résoudre ses dépendances
 * dans `node_modules/@4sh/ui-kit` : modifier le `ui-icon` copié n'aurait alors
 * aucun effet sur les composants qui l'utilisent, et le modèle « les sources
 * t'appartiennent » ne tiendrait pas. C'est la raison d'être du starter.
 *
 * Les MDX passent par la même porte ({@link rewriteDocImports}, FSHSP-125),
 * avec deux différences : ils importent en plus le bloc `<ConfigTable>`, et
 * leurs blocs de code sont de la prose — on n'y touche pas.
 *
 * Un import peut devoir être SCINDÉ : les symboles d'un même barrel ne vivent
 * pas forcément dans le même fichier (`{ UiIcon, UiIconType }` →
 * `ui-icon.ts` + `ui-icon-families.ts`). Une réécriture qui se contenterait de
 * remplacer le spécificateur produirait un import faux.
 */
import { dirname, relative } from 'node:path';
import type { AssetUnit } from './component-registry';
import { CONFIG_TABLE_PATH, resolveSpecifier } from './component-registry';
import { buildExportMap } from './export-map';

/**
 * `import { A, B } from '@4sh/ui-kit/forms';` — capture la liste de symboles et
 * le spécificateur. Volontairement limité aux imports nommés : le kit n'expose
 * ni export par défaut ni import de namespace, et un `import *` doit échouer
 * bruyamment plutôt que d'être réécrit de travers.
 */
const NAMED_IMPORT_RE =
  /^[ \t]*import\s+(type\s+)?\{([^}]*)\}\s+from\s+['"]@4sh\/ui-kit\/([^'"]+)['"]\s*;?[ \t]*$/gm;

/** Toute autre forme d'import du kit — non gérée, donc signalée. */
const ANY_KIT_IMPORT_RE =
  /^[ \t]*import\s+(?!(?:type\s+)?\{)[^;\n]*['"]@4sh\/ui-kit(?:\/[^'"]*)?['"]/gm;

/** Cache par unité : `buildExportMap` relit tous les fichiers de l'unité, et une
 * même unité est consultée par chaque fichier qui l'importe. */
const exportMapCache = new Map<string, Map<string, string>>();

function exportMapFor(unit: AssetUnit): Map<string, string> {
  let map = exportMapCache.get(unit.name);
  if (!map) {
    map = buildExportMap(unit);
    exportMapCache.set(unit.name, map);
  }
  return map;
}

/** `../../base/ui-icon/ui-icon` — toujours préfixé `./` ou `../`, jamais nu. */
function relativeSpecifier(fromFileTargetPath: string, toTargetPath: string): string {
  const rel = relative(dirname(fromFileTargetPath), toTargetPath).split(/[\\/]/).join('/');
  return rel.startsWith('.') ? rel : `./${rel}`;
}

/** Un symbole importé, avec son éventuel alias : `UiIcon`, `UiIcon as Icon`. */
function symbolName(clause: string): string {
  return clause
    .trim()
    .split(/\s+as\s+/)[0]
    .trim();
}

export interface RewriteResult {
  content: string;
  /** Spécificateurs rencontrés qu'aucune unité ne porte (à remonter à l'appelant). */
  unresolved: string[];
}

/**
 * Réécrit les imports du kit dans le contenu d'un fichier déjà copié.
 *
 * @param content contenu source du fichier
 * @param fileTargetPath chemin du fichier CHEZ LE CONSOMMATEUR (c'est depuis lui
 *   que les chemins relatifs sont calculés, pas depuis la source)
 */
export function rewriteKitImports(content: string, fileTargetPath: string): RewriteResult {
  const unresolved: string[] = [];

  const rewritten = content.replace(
    NAMED_IMPORT_RE,
    (whole, typeOnly: string | undefined, clauses: string, specifier: string) => {
      const unit = resolveSpecifier(specifier);
      if (!unit) {
        unresolved.push(specifier);
        return whole; // laissé tel quel : l'appelant décide quoi en faire
      }

      const map = exportMapFor(unit);
      const prefix = `import ${typeOnly ? 'type ' : ''}`;

      // Regroupe les symboles par fichier de destination : c'est ce qui permet
      // de scinder un import dont les symboles sont dispersés.
      const byFile = new Map<string, string[]>();
      for (const clause of clauses.split(',')) {
        const trimmed = clause.trim();
        if (!trimmed) continue;
        const target = map.get(symbolName(trimmed));
        if (!target) {
          // Symbole absent de la table : on ne devine pas. L'unité est signalée
          // comme non résolue et l'import d'origine est conservé, ce qui casse
          // au build du consommateur — bien plus lisible qu'un chemin inventé.
          unresolved.push(`${specifier} (symbole ${symbolName(trimmed)})`);
          return whole;
        }
        const list = byFile.get(target);
        if (list) list.push(trimmed);
        else byFile.set(target, [trimmed]);
      }

      return [...byFile.entries()]
        .map(([file, symbols]) => {
          const to = `${unit.targetDir}/${file}`;
          return `${prefix}{ ${symbols.join(', ')} } from '${relativeSpecifier(fileTargetPath, to)}';`;
        })
        .join('\n');
    },
  );

  // Une forme d'import non couverte (namespace, défaut) passerait sans bruit :
  // on la remonte explicitement.
  for (const match of rewritten.matchAll(ANY_KIT_IMPORT_RE)) {
    unresolved.push(`forme d'import non gérée : ${match[0].trim()}`);
  }

  return { content: rewritten, unresolved };
}

/** `import { ConfigTable } from '../../../../storybook/blocks/config-table';` */
const CONFIG_TABLE_IMPORT_RE =
  /^([ \t]*import\s+(?:type\s+)?\{[^}]*\}\s+from\s+)['"](?:\.\.\/)+storybook\/blocks\/config-table['"](\s*;?[ \t]*)$/gm;

/** Délimiteur de bloc de code MDX : ``` ou ~~~, éventuellement indenté. */
const FENCE_RE = /^\s*(```|~~~)/;

/**
 * Applique une réécriture aux seules lignes HORS bloc de code.
 *
 * Un MDX mêle deux natures de code : ses propres imports ESM, qui doivent
 * suivre les copies, et des extraits pédagogiques entre ``` qui montrent au
 * lecteur ce qu'il écrira dans SON application. Réécrire les seconds
 * produirait des chemins relatifs faux — ils dépendent de l'emplacement du
 * fichier du lecteur, que nous ne connaissons pas.
 */
function outsideFencedBlocks(content: string, rewrite: (chunk: string) => string): string {
  const lines = content.split('\n');
  const out: string[] = [];
  let buffer: string[] = [];
  let inFence = false;

  const flush = () => {
    if (buffer.length) out.push(rewrite(buffer.join('\n')));
    buffer = [];
  };

  for (const line of lines) {
    if (FENCE_RE.test(line)) {
      if (!inFence) flush();
      inFence = !inFence;
      out.push(line);
      continue;
    }
    if (inFence) out.push(line);
    else buffer.push(line);
  }
  flush();

  return out.join('\n');
}

/**
 * Réécrit les imports d'un MDX copié : ceux du kit comme dans un `.ts`, plus
 * l'import du bloc `<ConfigTable>` — qui pointe ici, depuis le kit, vers
 * `storybook/blocks/` du monorepo (49 MDX sur 54), et doit désigner chez le
 * consommateur la copie que `ng add` y a posée.
 *
 * Ce que ce passage NE corrige PAS : les extraits de code pédagogiques qui
 * importent `@4sh/ui-kit/…` (aujourd'hui `ui-icon.mdx`) restent tels quels —
 * voir {@link outsideFencedBlocks}. Le lecteur y verra un package qu'il n'a
 * pas ; c'est de la prose à reprendre, pas un import à résoudre.
 */
export function rewriteDocImports(content: string, fileTargetPath: string): RewriteResult {
  const unresolved: string[] = [];

  const rewritten = outsideFencedBlocks(content, (chunk) => {
    const kit = rewriteKitImports(chunk, fileTargetPath);
    unresolved.push(...kit.unresolved);
    return kit.content.replace(
      CONFIG_TABLE_IMPORT_RE,
      (_whole, prefix: string, suffix: string) =>
        `${prefix}'${relativeSpecifier(fileTargetPath, CONFIG_TABLE_PATH.replace(/\.js$/, ''))}'${suffix}`,
    );
  });

  return { content: rewritten, unresolved };
}
