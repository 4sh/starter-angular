/**
 * ng-add — `ng add @4sh/ui-kit-schematics`, la commande UNIQUE d'installation
 * (FSHSP-122) : fondation (dépendances runtime, styles verrouillés + éditables,
 * chaîne de génération des tokens, manifeste) puis sélection et copie des
 * composants, enchaînées.
 *
 * Le point d'entrée est ce package, et non `@4sh/ui-kit`, pour deux raisons
 * liées : le kit n'entre jamais dans `node_modules`, donc aucun import ne peut
 * viser son code compilé au lieu des copies locales ; et sans package compagnon
 * à installer au préalable, plus besoin de la `RunSchematicTask` différée dans
 * laquelle un prompt interactif ne tenait pas — d'où la commande unique.
 */
import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { updateWorkspace } from '@schematics/angular/utility/workspace';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Schema } from './schema';
import { addDependency, addNpmScript, readPackageJson } from '../utils/package-json';
import { emptyManifest, MANIFEST_PATH, writeManifest } from '../utils/manifest';
import { stylesFoundationDir } from '../utils/component-registry';
import { readKitManifestInfo } from '../utils/kit-manifest';
import { add } from '../add';

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
    // La barrel `utils.scss` : c'est elle que résout le `@use 'utils'` en tête
    // de chaque `.scss` de composant, via l'includePath `src/styles/ui-kit`.
    const utilsBarrel = readFileSync(join(root, 'utils.scss'), 'utf8');
    if (tree.exists('src/styles/ui-kit/utils.scss')) tree.overwrite('src/styles/ui-kit/utils.scss', utilsBarrel);
    else tree.create('src/styles/ui-kit/utils.scss', utilsBarrel);
    // ✏️ copié UNE FOIS, éditable ensuite.
    copyAll(join(root, 'base'), 'src/styles/base', false);

    context.logger.info('✔ Fondation de styles copiée (src/styles/ui-kit/, src/styles/base/).');
    return tree;
  };
}

/** Scaffolds `main.scss` / `variables.scss` : le point d'entrée global du projet.
 * Créés une seule fois — ce sont des fichiers du consommateur dès la première
 * copie, jamais réécrasés ensuite (FSHSP-109). */
function createStyleScaffolds(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const filesDir = join(__dirname, 'files');
    for (const name of ['main.scss', 'variables.scss']) {
      const targetPath = `src/styles/${name}`;
      if (tree.exists(targetPath)) continue;
      tree.create(targetPath, readFileSync(join(filesDir, name), 'utf8'));
    }
    context.logger.info('✔ Scaffolds src/styles/main.scss et src/styles/variables.scss créés.');
    return tree;
  };
}

/**
 * Câble la feuille globale dans `angular.json` : `styles` + les `includePaths`
 * dont dépendent les `@use` sans chemin relatif (`utils`, `generated/tokens`…).
 * Passe par `updateWorkspace` plutôt qu'un `JSON.parse`/`stringify` maison :
 * l'API préserve commentaires et mise en forme du fichier existant.
 */
function updateAngularJson(): Rule {
  return updateWorkspace((workspace) => {
    for (const project of workspace.projects.values()) {
      for (const targetName of ['build', 'test'] as const) {
        const target = project.targets.get(targetName);
        if (!target) continue;
        const options = (target.options ??= {});

        const styles = ((options['styles'] as string[] | undefined) ?? []).slice();
        for (const entry of [
          'src/styles/main.scss',
          'node_modules/@fortawesome/fontawesome-free/css/all.css',
          'node_modules/@angular/cdk/overlay-prebuilt.css',
        ]) {
          if (!styles.includes(entry)) styles.push(entry);
        }
        options['styles'] = styles;

        const preprocessor = (options['stylePreprocessorOptions'] ?? {}) as { includePaths?: string[] };
        const includePaths = (preprocessor.includePaths ?? []).slice();
        // `src/styles/ui-kit` résout `@use 'utils'` et `generated/tokens` ;
        // `src/styles` résout `base/base` et les couches du projet.
        for (const path of ['src/styles/ui-kit', 'src/styles', 'node_modules']) {
          if (!includePaths.includes(path)) includePaths.push(path);
        }
        options['stylePreprocessorOptions'] = { ...preprocessor, includePaths };
        options['inlineStyleLanguage'] ??= 'scss';
      }
    }
  });
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
    // FontAwesome n'est pas une peerDependency du kit (elle n'est pas importée
    // par le TypeScript : `ui-icon` ne pose que des classes CSS), mais la
    // feuille `all.css` est référencée dans `angular.json` juste après — sans
    // le package, aucune icône ne s'affiche. Version alignée sur celle de la
    // démo (`package.json` racine du starter).
    addDependency(tree, '@fortawesome/fontawesome-free', '^7.0.0', 'dependencies');
    // `style-dictionary` : moteur de `tokens.build.mjs`, copié juste avant.
    addDependency(tree, 'style-dictionary', '^5.0.0', 'devDependencies');
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

export function ngAdd(options: Schema): Rule {
  const foundation = [
    copyStylesFoundationRule(),
    createStyleScaffolds(),
    copyTokensPipeline(),
    addRuntimeDependencies(),
    updateAngularJson(),
    createManifest(),
  ];

  // La fondation seule ne rend aucun composant disponible : enchaîner la copie
  // est ce qui fait de `ng add` une commande complète. `--skip-components` reste
  // là pour poser la fondation dans un projet qui choisira ses composants plus
  // tard, ou pour un enchaînement scripté.
  if (options.skipComponents) {
    return chain([
      ...foundation,
      (_tree: Tree, context: SchematicContext) => {
        context.logger.info(
          'Fondation posée. Composants à copier ensuite : `ng generate @4sh/ui-kit-schematics:add`.',
        );
      },
    ]);
  }

  return chain([...foundation, add({ components: options.components, all: options.all })]);
}
