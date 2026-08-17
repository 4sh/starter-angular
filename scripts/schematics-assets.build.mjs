#!/usr/bin/env node
/**
 * schematics-assets.build.mjs — copie les sources BRUTES du kit (jamais
 * compilées) vers `projects/ui-kit-schematics/assets/`, pour que le
 * schematic `add` puisse les recopier telles quelles chez le consommateur.
 *
 * Pourquoi un script séparé du build `ng-packagr` : `ng build ui-kit` inline
 * le template et le SCSS de chaque composant dans le `.mjs` publié (voir
 * FSHSP-109) — les sources n'existent nulle part ailleurs qu'ici, sur le
 * disque, avant ce build. Ce script les fige donc en amont, indépendamment.
 *
 * Deux natures d'unité copiée :
 *   - un COMPOSANT   : `projects/ui-kit/{catégorie}/ui-{nom}/` (a un
 *     `ng-package.json`) → `assets/components/{catégorie}/ui-{nom}/`
 *   - une base PARTAGÉE (transverse à une catégorie, ex. `forms/src` qui
 *     porte `BaseFormField`) → `assets/shared/{catégorie}/`
 * Seuls `*.ts`, `*.html`, `*.scss` sont copiés — jamais `*.stories.ts`,
 * `*.spec.ts`, `*.mdx` (contrat repris de `components.check.mjs`).
 *
 * La fondation de styles (`styles/base`, `styles/utils`, `styles/settings`,
 * `styles/generated`) part elle aussi dans `assets/styles/`, pour `ng-add`.
 *
 * Usage : node scripts/schematics-assets.build.mjs
 */

import { readdirSync, readFileSync, writeFileSync, existsSync, mkdirSync, copyFileSync, rmSync } from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const KIT = join(ROOT, 'projects/ui-kit');
const ASSETS = join(ROOT, 'projects/ui-kit-schematics/assets');

const SOURCE_EXTENSIONS = new Set(['.ts', '.html', '.scss']);
const EXCLUDED_SUFFIXES = ['.stories.ts', '.spec.ts', '.mdx'];

function isSourceFile(name) {
  const ext = name.slice(name.lastIndexOf('.'));
  if (!SOURCE_EXTENSIONS.has(ext)) return false;
  return !EXCLUDED_SUFFIXES.some((suffix) => name.endsWith(suffix));
}

/** Copie récursivement les fichiers source (.ts/.html/.scss) d'un dossier vers un autre. */
function copySourceTree(srcDir, destDir) {
  return copyTree(srcDir, destDir, isSourceFile);
}

/** Copie récursivement TOUS les fichiers d'un dossier — pour des arborescences de confiance
 * (pipeline de tokens) où le filtre par extension `.ts/.html/.scss` ne s'applique pas (JSON…). */
function copyTree(srcDir, destDir, filter = () => true) {
  let count = 0;
  for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
    const srcPath = join(srcDir, entry.name);
    if (entry.isDirectory()) {
      count += copyTree(srcPath, join(destDir, entry.name), filter);
      continue;
    }
    if (!filter(entry.name)) continue;
    mkdirSync(destDir, { recursive: true });
    copyFileSync(srcPath, join(destDir, entry.name));
    count++;
  }
  return count;
}

/**
 * Découvre les entry points `ui-*` (composants) et les dossiers `src/`
 * transverses (bases partagées) sous chaque catégorie de `projects/ui-kit`.
 * Même logique de reconnaissance qu'`components.check.mjs` : un `ui-*` avec
 * `ng-package.json` est un composant ; tout `src/` frère est une base
 * partagée de la catégorie qui le contient.
 */
function discover(dir, category = null) {
  const components = [];
  const sharedDirs = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    if (!entry.isDirectory()) continue;
    const full = join(dir, entry.name);
    if (entry.name === 'styles') continue; // géré à part
    if (entry.name === 'src' && category) {
      sharedDirs.push({ category, dir: full });
      continue;
    }
    if (entry.name.startsWith('ui-') && existsSync(join(full, 'ng-package.json'))) {
      components.push({ category: category ?? entry.name, name: entry.name, dir: full });
      continue;
    }
    // Catégorie de premier niveau (actions/, forms/, base/…) : on descend.
    if (!category) {
      const { components: nested, sharedDirs: nestedShared } = discover(full, entry.name);
      components.push(...nested);
      sharedDirs.push(...nestedShared);
    }
  }
  return { components, sharedDirs };
}

function main() {
  rmSync(ASSETS, { recursive: true, force: true });

  const { components, sharedDirs } = discover(KIT);

  let componentCount = 0;
  for (const { category, name, dir } of components) {
    copySourceTree(dir, join(ASSETS, 'components', category, name));
    componentCount++;
  }

  let sharedCount = 0;
  for (const { category, dir } of sharedDirs) {
    copySourceTree(dir, join(ASSETS, 'shared', category));
    sharedCount++;
  }

  // Fondation de styles — arborescence déjà validée avec le designer (FSHSP-109).
  const STYLE_DIRS = ['base', 'utils', 'settings', 'generated'];
  let styleFiles = 0;
  for (const name of STYLE_DIRS) {
    const src = join(KIT, 'styles', name);
    if (!existsSync(src)) continue;
    styleFiles += copySourceTree(src, join(ASSETS, 'styles', name));
  }

  // `utils.scss` est un fichier RACINE de `styles/`, pas un membre de `utils/` :
  // les boucles ci-dessus le rataient. C'est pourtant la barrel que chaque
  // `.scss` de composant résout (`@use 'utils'`, 57 occurrences) — sans lui,
  // rien de ce que copie `add` ne compile chez le consommateur.
  // `index.scss` n'est volontairement PAS copié : le scaffold `main.scss`
  // reprend son rôle côté consommateur (deux entrées globales prêteraient à confusion).
  copyFileSync(join(KIT, 'styles/utils.scss'), join(ASSETS, 'styles/utils.scss'));
  styleFiles++;

  // package.json du kit — source de vérité pour `kitVersion` et les
  // peerDependencies runtime à répercuter chez le consommateur (ng-add).
  copyFileSync(join(KIT, 'package.json'), join(ASSETS, 'ui-kit-package.json'));

  // Plus aucun schéma de façade à synchroniser (FSHSP-122) : la façade de
  // `@4sh/ui-kit` ne délègue plus rien — elle se borne à indiquer que le
  // parcours starter passe par `ng add @4sh/ui-kit-schematics` — et n'expose
  // donc aucune option. Les schémas vivent d'un seul côté, celui du compagnon.

  // Chaîne de génération des tokens — embarquée entière (décision validée avec
  // le designer, FSHSP-109) : `generated/` doit rester régénérable chez le
  // consommateur, pas figé une fois pour toutes.
  let tokenFiles = 0;
  const tokensDest = join(ASSETS, 'tokens-pipeline');
  const designTokensSrc = join(ROOT, 'src/design-tokens');
  if (existsSync(designTokensSrc)) {
    tokenFiles += copyTree(designTokensSrc, join(tokensDest, 'design-tokens'), (n) => n.endsWith('.json'));
  }
  // `tokens.config.json` pointe ici vers `projects/ui-kit/styles/generated` —
  // un chemin propre au monorepo. Côté consommateur, la fondation de styles
  // vit sous `src/styles/ui-kit/generated` (arborescence validée avec le
  // designer) : on réécrit `outputs[].destination` à la copie, pas de copie brute.
  const tokensConfigSrc = join(ROOT, 'tokens.config.json');
  if (existsSync(tokensConfigSrc)) {
    const config = JSON.parse(readFileSync(tokensConfigSrc, 'utf8'));
    for (const output of config.outputs ?? []) {
      if (output.destination === 'projects/ui-kit/styles/generated') {
        output.destination = 'src/styles/ui-kit/generated';
      }
    }
    mkdirSync(tokensDest, { recursive: true });
    writeFileSync(join(tokensDest, 'tokens.config.json'), JSON.stringify(config, null, 2) + '\n');
    tokenFiles++;
  }

  const tokensBuildSrc = join(ROOT, 'scripts/tokens.build.mjs');
  if (existsSync(tokensBuildSrc)) {
    mkdirSync(tokensDest, { recursive: true });
    copyFileSync(tokensBuildSrc, join(tokensDest, 'tokens.build.mjs'));
    tokenFiles++;
  }

  console.log(
    `[schematics-assets] ${componentCount} composant(s), ${sharedCount} base(s) partagée(s), ` +
      `${styleFiles} fichier(s) de style, ${tokenFiles} fichier(s) de pipeline de tokens ` +
      `→ ${relative(ROOT, ASSETS)}`,
  );
}

main();
