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
 * Seuls `*.ts`, `*.html`, `*.scss`, `*.mdx` sont copiés — jamais `*.spec.ts`.
 * La story et le MDX en font partie depuis FSHSP-125 : ils sont la doc du
 * composant, et un composant copié sans sa doc laisse le consommateur avec un
 * Storybook hébergé qui décrit NOS composants, pas ses copies éditées. C'est
 * `add` qui décide de les poser ou non chez lui, pas ce script.
 *
 * La fondation de styles (`styles/base`, `styles/utils`, `styles/settings`,
 * `styles/generated`) part elle aussi dans `assets/styles/`, pour `ng-add`.
 *
 * Usage : node scripts/schematics-assets.build.mjs
 */

import { execSync } from 'node:child_process';
import {
  readdirSync,
  readFileSync,
  writeFileSync,
  existsSync,
  mkdirSync,
  copyFileSync,
  cpSync,
  rmSync,
} from 'node:fs';
import { dirname, join, resolve, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const KIT = join(ROOT, 'projects/ui-kit');
const ASSETS = join(ROOT, 'projects/ui-kit-schematics/assets');

const SOURCE_EXTENSIONS = new Set(['.ts', '.html', '.scss', '.mdx']);
// Les tests restent au kit : ils s'appuient sur son harnais, pas sur celui du
// consommateur, chez qui ils échoueraient sans rien lui apprendre.
const EXCLUDED_SUFFIXES = ['.spec.ts'];

function isSourceFile(name) {
  const ext = name.slice(name.lastIndexOf('.'));
  if (!SOURCE_EXTENSIONS.has(ext)) return false;
  return !EXCLUDED_SUFFIXES.some((suffix) => name.endsWith(suffix));
}

/** Copie récursivement les fichiers source (.ts/.html/.scss/.mdx) d'un dossier vers un autre. */
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
      // `siblingDir` (= `dir`, le dossier de catégorie lui-même) porte les
      // fichiers de doc co-localisés à côté de `src/` — ex. `motion/ui-motion.mdx`,
      // `motion/ui-motion.stories.ts`, `motion/ui-motion.demo.ts` — même
      // traitement qu'un composant, dont le `.mdx`/`.stories.ts` vit dans son
      // propre dossier `ui-*/` (FSHSP-138 : ces fichiers manquaient jusqu'ici).
      sharedDirs.push({ category, dir: full, siblingDir: dir });
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
  for (const { category, dir, siblingDir } of sharedDirs) {
    const dest = join(ASSETS, 'shared', category);
    copySourceTree(dir, dest);
    // Doc co-localisée à côté de `src/` (ex. `motion/ui-motion.mdx` + son
    // `.stories.ts`/`.demo.ts`) : `add`/`copyUnit` la traite déjà comme
    // n'importe quel fichier de l'unité (réécriture d'imports, en-tête de
    // traçabilité, exclusion sur `--skip-storybook`) — il ne manquait que sa
    // copie ici, jusqu'ici oubliée pour les bases partagées.
    if (siblingDir) {
      const siblingFiles = readdirSync(siblingDir, { withFileTypes: true }).filter(
        (entry) => !entry.isDirectory() && isSourceFile(entry.name),
      );
      if (siblingFiles.length) mkdirSync(dest, { recursive: true });
      for (const entry of siblingFiles) {
        copyFileSync(join(siblingDir, entry.name), join(dest, entry.name));
      }
    }
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
    tokenFiles += copyTree(designTokensSrc, join(tokensDest, 'design-tokens'), (n) =>
      n.endsWith('.json'),
    );
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

  // Chaîne de doc (FSHSP-125) — pendant exact de la chaîne de tokens, pour la
  // même raison : la section « Theming » de chaque MDX n'est pas écrite à la
  // main, elle est lue dans `ui-config.json` que `docs.config.mjs` extrait des
  // `///` des `.scss`. Sans le script chez le consommateur, ses tables gèlent
  // sur NOS valeurs à la première copie — l'inverse de ce que la doc promet.
  // `docs.config.mjs` est copié tel quel : il détecte lui-même sa disposition
  // (monorepo ou projet consommateur), aucun chemin à réécrire ici.
  let docFiles = 0;
  const docsDest = join(ASSETS, 'docs-pipeline');
  for (const [src, name] of [
    [join(ROOT, 'scripts/docs.config.mjs'), 'docs.config.mjs'],
    [join(ROOT, 'storybook/blocks/config-table.js'), 'config-table.js'],
    // Index de recherche plein texte (FSHSP-138) : même disposition à double
    // détection que `docs.config.mjs`, cf. son commentaire.
    [join(ROOT, 'scripts/docs.search.mjs'), 'docs.search.mjs'],
  ]) {
    if (!existsSync(src)) continue;
    mkdirSync(docsDest, { recursive: true });
    copyFileSync(src, join(docsDest, name));
    docFiles++;
  }

  // Configuration Storybook — la part qui vaut TELLE QUELLE chez le
  // consommateur, donc copiée d'ici pour rester en phase avec ce dépôt sans
  // recopie manuelle. Ce qui doit diverger (`main.js` et ses globs, `preview.ts`
  // et ses couplages, `myTheme.ts` et sa marque, les tsconfig) est écrit en
  // scaffold dans `src/ng-add/files/storybook/` : deux natures, deux endroits.
  //
  // `restore-component-metadata.ts` n'est PAS du lot : il répare les
  // annotations que le linker retire du package *compilé* que nos stories
  // importent. Chez le consommateur les stories visent des sources, compilées
  // avec le reste de son app — le décorateur n'aurait rien à réparer.
  for (const name of ['manager.ts', 'brand-toolbar.ts', 'preview-head.html', 'typings.d.ts']) {
    const src = join(ROOT, 'storybook', name);
    if (!existsSync(src)) continue;
    mkdirSync(join(ASSETS, 'storybook'), { recursive: true });
    copyFileSync(src, join(ASSETS, 'storybook', name));
    docFiles++;
  }

  // Addons de la barre du manager (recherche plein texte, copie Markdown) —
  // FSHSP-138 : posés sur CE Storybook (`storybook/main.js`) mais jamais
  // répercutés ici jusqu'à présent, alors qu'ils sont génériques (aucune
  // dépendance au monorepo, cf. `preset.cjs`/`manager.tsx` de chacun).
  for (const addon of ['text-search', 'copy-as-markdown']) {
    const src = join(ROOT, 'storybook/addons', addon);
    if (!existsSync(src)) continue;
    docFiles += copyTree(src, join(ASSETS, 'storybook/addons', addon));
  }

  // Pages de doc transverses. `GettingStarted` et `Overview` restent ici :
  // la première compare les deux modes de consommation — dont le mode
  // librairie, hors périmètre du starter (FSHSP-139) —, la seconde est
  // validée par `components.check.mjs` contre NOTRE inventaire ET importe en
  // dur les stories de tous les composants du monorepo. Ni l'une ni l'autre
  // ne transposent tel quel chez un consommateur qui n'a copié qu'une partie
  // des composants.
  // `Introduction`, elle, n'a aucune dépendance au monorepo (texte + images
  // statiques) : FSHSP-138 corrige son absence, oubliée jusqu'ici.
  const introSrc = join(ROOT, 'storybook/docs/Introduction.mdx');
  if (existsSync(introSrc)) {
    mkdirSync(join(ASSETS, 'storybook/docs'), { recursive: true });
    copyFileSync(introSrc, join(ASSETS, 'storybook/docs/Introduction.mdx'));
    docFiles++;
  }
  for (const group of ['foundations', 'specifications', 'config']) {
    const src = join(ROOT, 'storybook/docs', group);
    if (!existsSync(src)) continue;
    docFiles += copyTree(src, join(ASSETS, 'storybook/docs', group), (n) => n.endsWith('.mdx'));
  }

  // Images référencées par `Introduction.mdx` (`./doc-*.png`) : servies par
  // `staticDirs: ['./public']` (scaffold `main.js`), jamais copiées jusqu'ici
  // puisque la page elle-même ne l'était pas (FSHSP-138).
  const introImages = ['doc-token.png', 'doc-token-json.png', 'doc-tfm.png', 'doc-gridaflex.png', 'doc-icon.png'];
  for (const name of introImages) {
    const src = join(ROOT, 'storybook/public', name);
    if (!existsSync(src)) continue;
    mkdirSync(join(ASSETS, 'storybook/public'), { recursive: true });
    copyFileSync(src, join(ASSETS, 'storybook/public', name));
    docFiles++;
  }

  // Serveur MCP compagnon (FSHSP-115) : bundlé (esbuild, un seul fichier ESM,
  // zéro dépendance) puis copié tel quel — c'est CE dossier que `ng-add`
  // recopiera chez le consommateur (`.ui-kit-mcp/`), jamais publié à part.
  // Voir `projects/ui-kit-mcp/README.md`.
  execSync('npm run mcp:bundle', { cwd: ROOT, stdio: 'inherit' });
  const mcpServerDir = join(ROOT, 'dist/ui-kit-mcp');
  let mcpFiles = 0;
  if (existsSync(mcpServerDir)) {
    cpSync(mcpServerDir, join(ASSETS, 'mcp-server'), { recursive: true });
    mcpFiles = readdirSync(mcpServerDir, { recursive: true }).length;
  }

  console.log(
    `[schematics-assets] ${componentCount} composant(s), ${sharedCount} base(s) partagée(s), ` +
      `${styleFiles} fichier(s) de style, ${tokenFiles} fichier(s) de pipeline de tokens, ` +
      `${docFiles} fichier(s) de chaîne de doc, ${mcpFiles} fichier(s) de serveur MCP → ${relative(ROOT, ASSETS)}`,
  );
}

main();
