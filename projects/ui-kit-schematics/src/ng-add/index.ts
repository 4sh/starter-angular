/**
 * ng-add — `ng add @4sh/ui-kit` (ou directement `@4sh/ui-kit-schematics`).
 * Étape « fondation », une seule fois : dépendances runtime, styles verrouillés
 * + éditables, chaîne de génération des tokens, manifeste vide.
 * La copie des composants eux-mêmes est le rôle du schematic `add` (FSHSP-109).
 */
import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Schema } from './schema';
import { addDependency, addNpmScript, readPackageJson } from '../utils/package-json';
import { emptyManifest, MANIFEST_PATH, writeManifest } from '../utils/manifest';
import { stylesFoundationDir } from '../utils/component-registry';

/** `projects/ui-kit/package.json` — copié tel quel dans `assets/` : source de vérité
 * pour la version du kit et pour les peer dependencies runtime à répercuter. */
const KIT_PACKAGE_JSON = join(stylesFoundationDir(), '..', 'ui-kit-package.json');

function readKitManifestInfo(): { version: string; peerDependencies: Record<string, string> } {
  const json = JSON.parse(readFileSync(KIT_PACKAGE_JSON, 'utf8'));
  return { version: json.version, peerDependencies: json.peerDependencies ?? {} };
}

/** Copie la fondation de styles selon l'arborescence validée avec le designer
 * (FSHSP-109) : `ui-kit/` verrouillé (régénéré à chaque `ng add`), `base/`
 * copié une fois et laissé éditable ensuite. */
function copyStylesFoundationRule(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const root = stylesFoundationDir();

    const copyAll = (srcDir: string, targetDir: string, overwrite: boolean) => {
      for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
        const full = join(srcDir, entry.name);
        const targetPath = `${targetDir}/${entry.name}`;
        if (entry.isDirectory()) {
          copyAll(full, targetPath, overwrite);
          continue;
        }
        const exists = tree.exists(targetPath);
        if (exists && !overwrite) continue; // éditable : jamais réécrasé après la première copie
        const content = readFileSync(full, 'utf8');
        if (exists) tree.overwrite(targetPath, content);
        else tree.create(targetPath, content);
      }
    };

    // 🔒 verrouillé — régénéré à chaque `ng add`/mise à jour de la fondation.
    copyAll(join(root, 'utils'), 'src/styles/ui-kit/utils', true);
    copyAll(join(root, 'settings'), 'src/styles/ui-kit/settings', true);
    copyAll(join(root, 'generated'), 'src/styles/ui-kit/generated', true);
    // ✏️ copié UNE FOIS, éditable ensuite.
    copyAll(join(root, 'base'), 'src/styles/base', false);

    context.logger.info('✔ Fondation de styles copiée (src/styles/ui-kit/, src/styles/base/).');
    return tree;
  };
}

function copyTokensPipeline(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const pipelineDir = join(stylesFoundationDir(), '..', 'tokens-pipeline');

    const copyAll = (srcDir: string, targetDir: string) => {
      for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
        const full = join(srcDir, entry.name);
        const targetPath = `${targetDir}/${entry.name}`;
        if (entry.isDirectory()) {
          copyAll(full, targetPath);
        } else if (!tree.exists(targetPath)) {
          // Éditable dès le départ (le consommateur peut rebrander) : jamais écrasé.
          tree.create(targetPath, readFileSync(full, 'utf8'));
        }
      }
    };

    copyAll(join(pipelineDir, 'design-tokens'), 'src/design-tokens');
    if (!tree.exists('tokens.config.json')) {
      tree.create('tokens.config.json', readFileSync(join(pipelineDir, 'tokens.config.json'), 'utf8'));
    }
    if (!tree.exists('scripts/tokens.build.mjs')) {
      tree.create('scripts/tokens.build.mjs', readFileSync(join(pipelineDir, 'tokens.build.mjs'), 'utf8'));
    }

    context.logger.info('✔ Chaîne de génération des tokens copiée (src/design-tokens/, tokens.config.json, scripts/tokens.build.mjs).');
    return tree;
  };
}

function addRuntimeDependencies(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const { peerDependencies } = readKitManifestInfo();
    // Toutes les peerDependencies déjà déclarées par @4sh/ui-kit (@angular/cdk, rxjs…)
    // deviennent des dependencies directes chez le consommateur — pas @4sh/ui-kit
    // lui-même, gardé en devDependency pour piloter la CLI (voir ticket).
    for (const [name, version] of Object.entries(peerDependencies)) {
      addDependency(tree, name, version, 'dependencies');
    }
    addNpmScript(tree, 'tokens:build', 'node scripts/tokens.build.mjs');
    // `postinstall` : concaténé s'il existe déjà, jamais écrasé.
    const json = readPackageJson(tree);
    const existingPostinstall: string | undefined = json.scripts?.['postinstall'];
    if (!existingPostinstall?.includes('tokens:build')) {
      json.scripts = {
        ...json.scripts,
        postinstall: existingPostinstall ? `${existingPostinstall} && npm run tokens:build` : 'npm run tokens:build',
      };
      tree.overwrite('/package.json', JSON.stringify(json, null, 2) + '\n');
    }
    context.logger.info('✔ Dépendances runtime + script tokens:build + hook postinstall ajoutés.');
    return tree;
  };
}

function createManifest(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    if (tree.exists(MANIFEST_PATH)) return tree; // ré-exécution de `ng add` : on ne réinitialise pas
    const { version } = readKitManifestInfo();
    writeManifest(tree, emptyManifest(version));
    context.logger.info(`✔ ${MANIFEST_PATH} créé (kitVersion: ${version}).`);
    return tree;
  };
}

export function ngAdd(_options: Schema): Rule {
  return chain([copyStylesFoundationRule(), copyTokensPipeline(), addRuntimeDependencies(), createManifest()]);
}
