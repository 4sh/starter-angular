/**
 * preview — rend la DOC du kit (stories + MDX) pour le Storybook jetable
 * monté par `ui-kit-preview` (FSHSP-202).
 *
 * Le pendant de `copy.ts`, pour l'autre mode de consommation. `add` copie des
 * sources et réadresse leurs imports vers les copies voisines ; ici on ne copie
 * rien d'exécutable, et les imports `@4sh/ui-kit/…` doivent au contraire rester
 * INTACTS — ils visent le paquet installé, c'est lui qu'on veut voir rendu.
 * D'où un module à part plutôt qu'un drapeau de plus sur `renderUnitFiles` :
 * les deux passes n'ont en commun que l'en-tête de traçabilité.
 *
 * Ce que ça rend possible : un projet qui consomme le kit en paquet n'a aucune
 * page de composant dans son Storybook, donc aucun moyen de voir SON thème
 * appliqué à l'ensemble du kit — le geste central quand on construit un thème.
 * Les stories du kit n'importent que `@4sh/ui-kit/<entry point>` : elles sont
 * portables verbatim, il n'y avait qu'à les poser.
 */
import { readFileSync } from 'node:fs';
import { basename } from 'node:path';
import type { AssetUnit } from './component-registry';
import {
  flattenedRelPath,
  isStorybookFile,
  listComponents,
  listSharedBases,
  unitSourceFiles,
} from './component-registry';
import type { RenderedFile } from './copy';
import { traceabilityHeader } from './copy';
import { rewriteConfigTableImport } from './rewrite-imports';
import { stripFigmaDesign } from './strip-figma';

/**
 * Racine du Storybook jetable, à la racine du projet consommateur.
 *
 * Préfixée d'un point, comme `.ui-kit-mcp/` : ce n'est pas du code du projet,
 * c'est un outil posé à côté. Supprimable d'un bloc — et c'est la promesse
 * centrale de ce mode, donc rien de ce que le consommateur édite ne doit y
 * vivre.
 */
export const PREVIEW_ROOT = '.ui-kit-preview';

/** Bloc `<ConfigTable>` DANS le dossier jetable, et non celui du projet : le
 * dossier se suffit à lui-même, donc rien n'est écrit dans `storybook/`. */
export const PREVIEW_CONFIG_TABLE = `${PREVIEW_ROOT}/blocks/config-table.js`;

/** Catalogue que lit ce bloc (`../generated/ui-config.json` depuis `blocks/`). */
export const PREVIEW_UI_CONFIG = `${PREVIEW_ROOT}/generated/ui-config.json`;

/**
 * Harnais de démonstration d'une story (`ui-motion.demo.ts`,
 * `ui-ripple.demo.ts`) : le seul fichier NON publié dans le paquet que deux
 * stories importent (`./ui-motion.demo`). Il part avec elles, sinon leur import
 * relatif ne résout rien.
 */
function isDemoFile(path: string): boolean {
  return path.endsWith('.demo.ts');
}

/** Emplacement de l'unité sous {@link PREVIEW_ROOT} — même disposition que dans
 * le kit (`actions/ui-button/`, `motion/`), pour que le dossier reste lisible
 * et que les imports `./ui-x.stories` d'un MDX retombent sur leur voisin. */
export function previewTargetDir(unit: AssetUnit): string {
  return unit.kind === 'component'
    ? `${PREVIEW_ROOT}/${unit.category}/${unit.name}`
    : `${PREVIEW_ROOT}/${unit.category}`;
}

/** Toutes les unités qui portent de la doc. Les bases partagées sans story ni
 * MDX (`forms`, `types`…) n'ont rien à montrer et ne créent pas de dossier. */
export function previewUnits(): AssetUnit[] {
  return [...listComponents(), ...listSharedBases()]
    .filter((unit) => unitSourceFiles(unit).some(isStorybookFile))
    .sort((a, b) => a.name.localeCompare(b.name));
}

/**
 * Contenu final de chaque fichier de doc d'une unité, sans rien écrire.
 *
 * Trois traitements, un par nature de fichier :
 *   - `.stories.ts` → retrait du bloc `design:` (même raison que dans `add` :
 *     le lien Figma vise NOTRE fichier, que le consommateur ne peut pas ouvrir) ;
 *   - `.mdx` → seule la profondeur de l'import `<ConfigTable>` change ;
 *   - `.demo.ts` → tel quel.
 *
 * Aucun ne passe par `rewriteKitImports` : `@4sh/ui-kit/…` est ici la bonne
 * cible, et la réécrire pointerait vers des copies qui n'existent pas.
 */
export function renderPreviewFiles(unit: AssetUnit, kitVersion: string): RenderedFile[] {
  const files: RenderedFile[] = [];
  const targetDir = previewTargetDir(unit);

  for (const absSrc of unitSourceFiles(unit)) {
    if (!isStorybookFile(absSrc) && !isDemoFile(absSrc)) continue;

    // Pas de `claimedBy` ici, contrairement à `renderUnitFiles` : stories, MDX
    // et harnais vivent tous à la racine de l'unité, l'aplatissement ne retire
    // donc aucun segment et ne peut faire converger deux sources.
    const relPath = flattenedRelPath(unit, absSrc);
    const targetPath = `${targetDir}/${basename(relPath)}`;
    const ext = absSrc.slice(absSrc.lastIndexOf('.'));

    let source = readFileSync(absSrc, 'utf8');
    if (absSrc.endsWith('.stories.ts')) source = stripFigmaDesign(source);
    if (ext === '.mdx') source = rewriteConfigTableImport(source, targetPath, PREVIEW_CONFIG_TABLE);

    files.push({ targetPath, content: traceabilityHeader(kitVersion, ext) + source });
  }

  return files;
}
