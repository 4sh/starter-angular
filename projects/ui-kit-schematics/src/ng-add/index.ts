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
import type { JsonValue, workspaces } from '@angular-devkit/core';
import { chain, Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { updateWorkspace } from '@schematics/angular/utility/workspace';
import { readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Schema } from './schema';
import { addDependency, addNpmScript, readPackageJson } from '../utils/package-json';
import { emptyManifest, MANIFEST_PATH, writeManifest } from '../utils/manifest';
import { CONFIG_TABLE_PATH, docsPipelineDir, stylesFoundationDir } from '../utils/component-registry';
import { readKitManifestInfo } from '../utils/kit-manifest';
import { rewriteKitPaths } from '../utils/kit-paths';
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
 * `anyComponentStyle` floor (FSHSP-127). `ng new` ships 8kB, which applies to
 * EACH component's compiled CSS — `ui-button` alone emits 55.7kB, so a copied
 * source tree cannot build for production.
 *
 * 128kB, not just above 55.7: `ui-button`'s axes are multiplicative (+10.5kB per
 * level, +17.2kB per variant) and adding one is what starter mode is for.
 * Angular's unit, not the SI one: `BYTES_IN_KILOBYTE = 1000`.
 */
const ANY_COMPONENT_STYLE_FLOOR = '128kB';
const ANY_COMPONENT_STYLE_FLOOR_BYTES = 128_000;

/** An `angular.json` budget, narrowed to the fields read here. */
interface Budget {
  type?: string;
  maximumWarning?: string;
  maximumError?: string;
}

/**
 * Threshold to bytes, using Angular's own grammar (`bundle-calculator.js`).
 * `null` for what cannot be compared — percentages need a `baseline`.
 */
function budgetBytes(value: string | undefined): number | null {
  const matches = value?.trim().match(/^(\d+(?:\.\d+)?)[ \t]*(k?b|mb|gb)?$/i);
  if (!matches) return null;
  const factor = { b: 1, kb: 1e3, mb: 1e6, gb: 1e9 }[matches[2]?.toLowerCase() ?? 'b'] ?? 1;
  return Number(matches[1]) * factor;
}

/**
 * Raises the `anyComponentStyle` budget wherever it exists, across every
 * configuration (`production` for `ng new`, but a project may name others).
 *
 * Never ADDS a missing budget, never LOWERS a higher one, never touches a
 * percentage: each would undo a choice the project made. `maximumWarning` is
 * dropped — at 4kB some fifteen kit components would warn on every build.
 */
function relaxAnyComponentStyleBudget(target: workspaces.TargetDefinition): void {
  for (const configuration of Object.values(target.configurations ?? {})) {
    const budgets = configuration?.['budgets'];
    if (!Array.isArray(budgets)) continue;

    let changed = false;
    const relaxed = budgets.map((entry) => {
      const budget = entry as Budget;
      if (budget?.type !== 'anyComponentStyle') return entry;

      const error = budgetBytes(budget.maximumError);
      if (error !== null && error >= ANY_COMPONENT_STYLE_FLOOR_BYTES) return entry;
      if (budget.maximumError !== undefined && error === null) return entry; // percentage: not comparable

      changed = true;
      // Destructured out rather than set to `undefined`: the key must be absent
      // from the written JSON, not present without a value.
      const { maximumWarning, ...rest } = budget;
      const warning = budgetBytes(maximumWarning);
      const next: Budget = { ...rest, maximumError: ANY_COMPONENT_STYLE_FLOOR };
      if (warning !== null && warning >= ANY_COMPONENT_STYLE_FLOOR_BYTES) next.maximumWarning = maximumWarning;
      return next;
    });

    if (changed) configuration!['budgets'] = relaxed as JsonValue;
  }
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
      // Budgets live on `build` only — `test` declares none.
      const build = project.targets.get('build');
      if (build) relaxAnyComponentStyleBudget(build);

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

/**
 * Chaîne de doc (FSHSP-125), pendant de `copyTokensPipeline` : le bloc
 * `<ConfigTable>` qu'importe chaque MDX copié, et le script qui lui produit son
 * manifeste depuis les `///` des `.scss` du projet.
 *
 * Sans elle, la section « Theming » de chaque page décrirait les valeurs du kit
 * au jour de la copie, pas celles du projet — or c'est précisément ce que ce
 * système existe pour éviter. Le script est copié tel quel : il reconnaît seul
 * la disposition d'un projet consommateur.
 */
function copyDocsPipeline(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const dir = docsPipelineDir();
    for (const [name, targetPath] of [
      ['docs.config.mjs', 'scripts/docs.config.mjs'],
      ['config-table.js', CONFIG_TABLE_PATH],
    ] as const) {
      if (tree.exists(targetPath)) continue; // éditable : jamais réécrasé
      tree.create(targetPath, readFileSync(join(dir, name), 'utf8'));
    }
    addNpmScript(tree, 'docs:config', 'node scripts/docs.config.mjs');
    context.logger.info(`✔ Chaîne de doc copiée (scripts/docs.config.mjs, ${CONFIG_TABLE_PATH}).`);
    return tree;
  };
}

/** Chemin de la copie de `ui-image` : la preview ne câble ses providers que s'il est là. */
const UI_IMAGE_PATH = 'src/app/shared/components/ui/base/ui-image/ui-image.ts';

/** Bornes du bloc conditionnel de `preview.ts` (voir {@link scaffoldStorybook}). */
const UI_IMAGE_BLOCK_RE = /^[ \t]*\/\/ <ui-image>\n[\s\S]*?^[ \t]*\/\/ <\/ui-image>\n/gm;
const UI_IMAGE_MARKER_RE = /^[ \t]*\/\/ <\/?ui-image>\n/gm;

/**
 * Pose la configuration Storybook (FSHSP-125).
 *
 * Deux natures de fichier, deux provenances : ce qui vaut tel quel ici comme
 * là-bas (`manager.ts`, `brand-toolbar.ts`, `preview-head.html`, les pages de
 * doc transverses) vient des assets, synchronisé depuis ce dépôt ; ce qui doit
 * diverger (`main.js` et ses globs, `preview.ts` et ses couplages, `myTheme.ts`
 * et sa marque, les tsconfig) est un scaffold écrit pour le consommateur.
 *
 * La règle tourne APRÈS la copie des composants, et pas avant : c'est l'arbre
 * qui dit si `ui-image` en fait partie. Sa preview a besoin de providers que
 * lui seul utilise — les écrire sans lui casserait tout le Storybook sur un
 * import mort.
 */
function scaffoldStorybook(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const assets = join(stylesFoundationDir(), '..', 'storybook');
    const scaffolds = join(__dirname, 'files', 'storybook');

    const create = (targetPath: string, content: string) => {
      if (tree.exists(targetPath)) return; // fichier du consommateur dès la première pose
      tree.create(targetPath, content);
    };

    const copyAll = (srcDir: string, targetDir: string) => {
      for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
        const full = join(srcDir, entry.name);
        if (entry.isDirectory()) {
          copyAll(full, `${targetDir}/${entry.name}`);
          continue;
        }
        const source = readFileSync(full, 'utf8');
        // Les pages transverses citent la fondation de styles — `Colors.mdx`
        // va jusqu'à importer le manifeste de tokens. Aux chemins du monorepo,
        // le build échoue sur un module introuvable.
        create(`${targetDir}/${entry.name}`, entry.name.endsWith('.mdx') ? rewriteKitPaths(source) : source);
      }
    };

    copyAll(assets, 'storybook');

    for (const name of ['main.js', 'myTheme.ts', 'tsconfig.json', 'tsconfig.doc.json']) {
      create(`storybook/${name}`, readFileSync(join(scaffolds, name), 'utf8'));
    }

    const hasUiImage = tree.exists(UI_IMAGE_PATH);
    const preview = readFileSync(join(scaffolds, 'preview.ts'), 'utf8');
    create('storybook/preview.ts', hasUiImage ? preview.replace(UI_IMAGE_MARKER_RE, '') : preview.replace(UI_IMAGE_BLOCK_RE, ''));

    // `ui-image` résout ses images dans cette map. Vide, ses stories affichent
    // le placeholder plutôt que de faire échouer la compilation de la preview.
    if (hasUiImage) create('src/assets/assets-map.json', '{}\n');

    context.logger.info('✔ Configuration Storybook posée (storybook/).');
    return tree;
  };
}

/**
 * Cibles `storybook` / `build-storybook`, calquées sur les options de `build`
 * du projet — mêmes feuilles de style et mêmes `includePaths`, sans quoi les
 * `@use 'utils'` des composants copiés ne résolvent pas dans la preview.
 *
 * `compodoc: true` : le builder lance Compodoc lui-même avant de démarrer, et
 * c'est ce `documentation.json` qui donne aux `ArgTypes` leurs descriptions.
 */
function addStorybookTargets(): Rule {
  return updateWorkspace((workspace) => {
    for (const [name, project] of workspace.projects) {
      const build = project.targets.get('build');
      if (!build || project.extensions['projectType'] !== 'application') continue;
      if (project.targets.has('storybook')) continue; // déjà câblé : on ne réécrit pas

      // Le builder Storybook valide les options du `browserTarget` contre SON
      // schéma, plus ancien : il y exige `output` sur chaque motif d'asset,
      // qu'`ng new` n'écrit plus depuis que `@angular/build` lui donne `.`
      // pour défaut. Sans ce complément, `ng run …:build-storybook` s'arrête
      // sur « must have required property 'output' » en désignant un fichier
      // que le consommateur n'a pas écrit. La valeur ajoutée est celle que le
      // builder d'application applique déjà : le comportement ne change pas.
      const assets = build.options?.['assets'];
      if (Array.isArray(assets)) {
        build.options!['assets'] = assets.map((asset) =>
          asset && typeof asset === 'object' && !('output' in asset) ? { ...asset, output: '.' } : asset,
        );
      }

      const shared = {
        configDir: 'storybook',
        browserTarget: `${name}:build`,
        assets: [{ glob: '**/*', input: 'src/assets', output: './assets/' }],
        styles: build.options?.['styles'],
        stylePreprocessorOptions: build.options?.['stylePreprocessorOptions'],
        compodoc: true,
        compodocArgs: ['-e', 'json', '-d', '.'],
      };

      project.targets.add({
        name: 'storybook',
        builder: '@storybook/angular:start-storybook',
        options: { ...shared, port: 6006 },
      });
      project.targets.add({
        name: 'build-storybook',
        builder: '@storybook/angular:build-storybook',
        options: { ...shared, outputDir: 'storybook-static' },
      });
    }
  });
}

/**
 * Nom du projet que les scripts npm doivent viser : la première application
 * d'`angular.json`, celle à laquelle `addStorybookTargets` a ajouté ses cibles.
 */
function firstApplicationName(tree: Tree): string | null {
  const buffer = tree.read('/angular.json');
  if (!buffer) return null;
  const workspace = JSON.parse(buffer.toString('utf8')) as {
    projects?: Record<string, { projectType?: string; architect?: Record<string, unknown> }>;
  };
  for (const [name, project] of Object.entries(workspace.projects ?? {})) {
    if (project.projectType === 'application') return name;
  }
  return null;
}

/**
 * Plage de version d'Angular déclarée par le projet (`^22.1.0`), telle quelle.
 *
 * Reprise mot pour mot, et non normalisée en `^22.0.0` : les paquets Angular
 * s'exigent l'un l'autre à la version EXACTE, donc un `platform-browser-dynamic`
 * résolu plus haut que le `@angular/common` déjà verrouillé casse l'install.
 * Demander la même plage laisse npm les déduire ensemble.
 */
function angularRange(tree: Tree): string {
  return readPackageJson(tree).dependencies?.['@angular/core'] ?? '^22.0.0';
}

/** Dépendances et scripts du Storybook du consommateur. Versions alignées sur ce dépôt. */
function addStorybookDependencies(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    // Deux peerDependencies de `@storybook/angular` qu'un projet Angular récent
    // n'a plus : il bâtit avec `@angular/build`, et ne rend plus en JIT. Sans
    // elles au `package.json`, npm les résout seul — il tombe sur le majeur
    // précédent, dont les peers entrent en conflit avec l'Angular du projet, et
    // l'install s'arrête sur un ERESOLVE qui ne dit pas d'où il vient. On les
    // déclare au millésime du projet, comme ce dépôt le fait pour lui-même.
    // `@angular/animations` est de la partie bien que le kit ne s'en serve pas :
    // le renderer de `@storybook/angular` fait un `import()` dynamique de
    // `@angular/platform-browser/animations` pour reconnaître
    // `BrowserAnimationsModule`. Absent, le build PASSE — webpack se contente
    // d'un stub — et c'est au premier rendu d'une story que tout s'arrête sur
    // « Cannot find module ». Le package doit être là, pas son provider.
    for (const name of [
      '@angular-devkit/build-angular',
      '@angular/platform-browser-dynamic',
      '@angular/animations',
    ]) {
      addDependency(tree, name, angularRange(tree), 'devDependencies');
    }
    for (const [name, version] of [
      ['storybook', '^10.5.0'],
      ['@storybook/angular', '^10.5.0'],
      ['@storybook/addon-docs', '^10.5.0'],
      ['@storybook/addon-a11y', '^10.5.0'],
      ['@storybook-community/storybook-dark-mode', '^7.1.0'],
      // Lancé par le builder (`compodoc: true`), pas par un script à nous.
      ['@compodoc/compodoc', '^1.1.26'],
    ] as const) {
      addDependency(tree, name, version, 'devDependencies');
    }
    // Les deux générations d'abord, dans cet ordre : la page « Colors » importe
    // `tokens.manifest.json` (produit par `tokens:build`) et le bloc
    // `<ConfigTable>` lit `ui-config.json` (produit par `docs:config`). Les
    // chaîner ici plutôt que de compter sur le `postinstall` : sur une
    // installation fraîche, le build tomberait sinon sur un module introuvable.
    const project = firstApplicationName(tree);
    if (project) {
      const generate = 'npm run tokens:build && npm run docs:config';
      addNpmScript(tree, 'storybook', `${generate} && ng run ${project}:storybook`);
      addNpmScript(tree, 'build-storybook', `${generate} && ng run ${project}:build-storybook`);
    } else {
      context.logger.warn(
        "Aucune application trouvée dans angular.json : scripts npm `storybook` non écrits (les cibles, elles, n'ont pas pu être ajoutées non plus).",
      );
    }
    context.logger.info('✔ Dépendances et scripts Storybook ajoutés.');
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

function createManifest(withStorybook: boolean): Rule {
  return (tree: Tree, context: SchematicContext) => {
    if (tree.exists(MANIFEST_PATH)) return tree; // ré-exécution de `ng add` : on ne réinitialise pas
    const { version } = readKitManifestInfo();
    writeManifest(tree, emptyManifest(version, withStorybook));
    context.logger.info(`✔ ${MANIFEST_PATH} créé (kitVersion: ${version}).`);
    return tree;
  };
}

/**
 * Programme le `npm install` des dépendances que `addRuntimeDependencies` vient
 * d'inscrire.
 *
 * Sans lui, `angular.json` référence `node_modules/@angular/cdk/overlay-prebuilt.css`
 * et la feuille FontAwesome alors que ni l'un ni l'autre n'est installé : le
 * projet ne compile pas, et l'erreur (`Could not resolve`) ne dit rien de sa
 * cause. C'est le seul install du parcours — `ng add` n'installe que le package
 * qu'on lui nomme, pas ce que son schematic ajoute ensuite au `package.json`.
 */
function installRuntimeDependencies(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.addTask(new NodePackageInstallTask());
    return tree;
  };
}

export function ngAdd(options: Schema): Rule {
  const withStorybook = options.withStorybook ?? false;

  const foundation = [
    copyStylesFoundationRule(),
    createStyleScaffolds(),
    copyTokensPipeline(),
    // La chaîne de doc ne sert qu'aux MDX copiés : sans eux, ce sont deux
    // fichiers morts dans le dépôt du consommateur.
    ...(withStorybook ? [copyDocsPipeline()] : []),
    addRuntimeDependencies(),
    updateAngularJson(),
    createManifest(withStorybook),
  ];

  // Après la fondation ET après la copie : le scaffold lit l'arbre pour savoir
  // si `ui-image` est là. Les cibles et les dépendances peuvent, elles, être
  // écrites n'importe quand — on les groupe ici pour n'avoir qu'un seul bloc
  // Storybook dans la chaîne.
  const storybook = withStorybook
    ? [scaffoldStorybook(), addStorybookTargets(), addStorybookDependencies()]
    : [];

  // En queue de chaîne : la tâche s'exécute après application de l'arbre, donc
  // une fois `package.json` écrit. `--skip-install` la retire, pour un projet qui
  // pilote son lockfile lui-même (CI, monorepo).
  const install = options.skipInstall ? [] : [installRuntimeDependencies()];

  // La fondation seule ne rend aucun composant disponible : enchaîner la copie
  // est ce qui fait de `ng add` une commande complète. `--skip-components` reste
  // là pour poser la fondation dans un projet qui choisira ses composants plus
  // tard, ou pour un enchaînement scripté.
  if (options.skipComponents) {
    return chain([
      ...foundation,
      ...storybook,
      (_tree: Tree, context: SchematicContext) => {
        context.logger.info(
          'Fondation posée. Composants à copier ensuite : `ng generate @4sh/ui-kit-schematics:add`.',
        );
      },
      ...install,
    ]);
  }

  return chain([
    ...foundation,
    // Pas de `components` ici : `ng add` enchaîne sur le prompt, où l'on coche
    // à la barre d'espace (`a` = tout). Une liste en ligne de commande ne
    // rendrait pas le service que rend déjà cet écran, deux secondes plus tard.
    // Elle reste sur `ng generate …:add`, pour un usage scripté.
    add({ all: options.all, withStorybook }),
    ...storybook,
    ...install,
  ]);
}
