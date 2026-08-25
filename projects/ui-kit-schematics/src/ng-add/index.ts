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
import { confirm } from '@inquirer/prompts';
import { NodePackageInstallTask } from '@angular-devkit/schematics/tasks';
import { updateWorkspace } from '@schematics/angular/utility/workspace';
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import type { Schema } from './schema';
import { addDependency, addNpmScript, readPackageJson } from '../utils/package-json';
import { emptyManifest, MANIFEST_PATH, writeManifest } from '../utils/manifest';
import {
  CONFIG_TABLE_PATH,
  docsPipelineDir,
  mcpServerDir,
  prettierConfigDir,
  projectAssetsDir,
  stylesFoundationDir,
} from '../utils/component-registry';
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
    if (tree.exists('src/styles/ui-kit/utils.scss'))
      tree.overwrite('src/styles/ui-kit/utils.scss', utilsBarrel);
    else tree.create('src/styles/ui-kit/utils.scss', utilsBarrel);
    // ✏️ copié UNE FOIS, éditable ensuite.
    copyAll(join(root, 'base'), 'src/styles/base', false);

    context.logger.info('✔ Fondation de styles copiée (src/styles/ui-kit/, src/styles/base/).');
    return tree;
  };
}

const FONTS_MODULE = 'vendors/fonts';
const FONTS_PATH = 'src/styles/vendors/_fonts.scss';

function createStyleScaffolds(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const filesDir = join(__dirname, 'files');
    for (const name of ['main.scss', 'variables.scss']) {
      const targetPath = `src/styles/${name}`;
      if (tree.exists(targetPath)) continue;
      tree.create(targetPath, readFileSync(join(filesDir, name), 'utf8'));
    }
    if (!tree.exists(FONTS_PATH)) {
      tree.create(FONTS_PATH, readFileSync(join(filesDir, 'vendors', '_fonts.scss'), 'utf8'));
    }
    importInMainScss(tree, FONTS_MODULE, '// ✏️ Vos polices (`@font-face` + `--fontfamily-*`).');

    context.logger.info(
      `✔ Scaffolds ${MAIN_SCSS_PATH}, src/styles/variables.scss et ${FONTS_PATH} créés.`,
    );
    return tree;
  };
}

/** Racine des assets du projet. Servie sous `/assets/` par le builder (entrée
 * ajoutée à `angular.json` par {@link updateAngularJson}) : c'est ce chemin-là
 * que `ui-image` et les stories du kit résolvent. */
const ASSETS_ROOT = 'src/assets';
/** Index des images locales lues par `ui-image`. Posé vide : le composant ne
 * peut pas deviner l'arborescence d'un projet, et un nom absent affiche son
 * placeholder tokenisé plutôt que de casser la compilation. */
const ASSETS_MAP_PATH = `${ASSETS_ROOT}/assets-map.json`;
/** Marques telles que `BrandService` les émet — `brand1` est le défaut. */
const ASSET_BRANDS = ['common', 'brand1', 'brand2', 'brand3'];
/** Types de fichier, chacun pouvant contenir un sous-dossier `light/`/`dark/`
 * quand le visuel a des variantes de mode (voir `resolvePath` de `ui-image`).
 * Ces deux-là ne sont PAS échafaudés : ils sont l'exception, pas la règle, et
 * les poser partout ferait 24 `.gitkeep` au lieu de 12, le README les décrit. */
const ASSET_IMAGE_TYPES = ['jpg', 'png', 'svg'];

/**
 * Squelette de l'arborescence : un `Tree` de schematic ne porte que des
 * fichiers, et git ne versionne pas un dossier vide. Le `.gitkeep` est donc la
 * seule façon de livrer un emplacement, à supprimer dès qu'on y dépose
 * quelque chose.
 */
function projectAssetDirs(): string[] {
  const dirs = ['fonts/police', 'fonts/icon'];
  for (const brand of ASSET_BRANDS) {
    for (const type of ASSET_IMAGE_TYPES) dirs.push(`img/${brand}/${type}`);
  }
  return dirs;
}

/**
 * Pose l'arborescence d'assets maison sous `src/assets/`.
 *
 * Avant, `ng add` n'y écrivait qu'un `assets-map.json` vide, et seulement si
 * `ui-image` faisait partie des composants copiés : le consommateur héritait
 * d'un composant qui résout `assets/img/{marque}/{type}/…` sans un seul dossier
 * pour l'accueillir, ni rien qui dise où déposer une police ou un favicon.
 *
 * Trois natures de fichier, trois traitements :
 *   - le SQUELETTE (`.gitkeep`), calculé ici — voir {@link projectAssetDirs} ;
 *   - les fichiers TRANSPOSABLES tels quels (drapeaux, favicon placeholder),
 *     copiés depuis les assets du package, en binaire;
 *   - le README et l'`assets-map.json`, scaffolds destinés à être édités.
 *
 * `create()` uniquement, jamais `overwrite()` : tout ce qui est ici appartient
 * au consommateur dès la première pose. Un `ng add` rejoué complète les trous
 * sans rien écraser.
 */
function copyProjectAssetsRule(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const create = (targetPath: string, content: string | Buffer) => {
      if (tree.exists(targetPath)) return;
      tree.create(targetPath, content);
    };

    for (const dir of projectAssetDirs()) create(`${ASSETS_ROOT}/${dir}/.gitkeep`, '');

    const root = projectAssetsDir();
    const copyAll = (srcDir: string, targetDir: string) => {
      for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
        const full = join(srcDir, entry.name);
        if (entry.isDirectory()) copyAll(full, `${targetDir}/${entry.name}`);
        else create(`${targetDir}/${entry.name}`, readFileSync(full));
      }
    };
    if (existsSync(root)) copyAll(root, ASSETS_ROOT);

    create(ASSETS_MAP_PATH, '{}\n');
    create(
      `${ASSETS_ROOT}/README.md`,
      readFileSync(join(__dirname, 'files', 'assets', 'README.md'), 'utf8'),
    );

    context.logger.info(
      `✔ Arborescence d'assets posée (${ASSETS_ROOT}/ : fonts, img, favicon — voir son README).`,
    );
    return tree;
  };
}

/**
 * Bascule le `<link rel="icon">` de chaque `index.html` d'application sur le
 * favicon placeholder de l'arborescence maison.
 *
 * Conservateur par construction : on ne réécrit QUE le `favicon.ico` d'`ng new`.
 * Un `href` déjà personnalisé est le choix du projet, et le réécrire lui
 * remplacerait sa marque par notre placeholder — l'inverse du service rendu.
 *
 * Le `public/favicon.ico` d'`ng new` n'est pas supprimé : c'est un fichier du
 * consommateur, qui peut vouloir le garder (ou y revenir). Il devient seulement
 * non référencé — le README le signale.
 */
const NG_NEW_FAVICON_LINK = /<link\b[^>]*\brel=(["'])(?:shortcut\s+)?icon\1[^>]*>/gi;
const NG_NEW_FAVICON_HREF = /\bhref=(["'])\.?\/?favicon\.ico\1/i;

function retargetFaviconRule(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    let retargeted = 0;
    for (const path of applicationIndexPaths(tree)) {
      const buffer = tree.read(`/${path}`);
      if (!buffer) continue;
      const content = buffer.toString('utf8');
      const updated = content.replace(NG_NEW_FAVICON_LINK, (link) =>
        NG_NEW_FAVICON_HREF.test(link)
          ? link
              .replace(NG_NEW_FAVICON_HREF, 'href="assets/favicon.png"')
              .replace(/\btype=(["'])[^"']*\1/i, 'type="image/png"')
          : link,
      );
      if (updated === content) continue;
      tree.overwrite(`/${path}`, updated);
      retargeted++;
    }
    if (retargeted) {
      context.logger.info(
        '✔ Favicon : <link rel="icon"> pointé sur assets/favicon.png (placeholder, à remplacer). L\'ancien public/favicon.ico n\'est plus référencé.',
      );
    }
    return tree;
  };
}

/**
 * Pose `.prettierrc`/`.prettierignore` + `prettier` en devDependency (FSHSP-140).
 *
 * Le CLI Angular reformate les fichiers qu'il écrit (`add`/`update`) avec la
 * config Prettier trouvée chez le consommateur — ou son absence. Sans la
 * MÊME config des deux côtés, un `update` compare une copie fraîche formatée
 * façon kit à une copie existante formatée autrement (ou pas), et le diff se
 * noie dans du bruit d'indentation plutôt que du contenu changé.
 *
 * `create()` uniquement : un `.prettierrc` existant chez le consommateur est
 * le sien, jamais réécrasé — les deux configs divergeraient alors quand même,
 * mais c'est un choix explicite du projet, pas un oubli.
 */
function copyPrettierConfigRule(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const dir = prettierConfigDir();
    let created = 0;
    for (const name of ['.prettierrc', '.prettierignore']) {
      if (tree.exists(name)) continue;
      tree.create(name, readFileSync(join(dir, name), 'utf8'));
      created++;
    }
    addDependency(tree, 'prettier', '3.9.6', 'devDependencies');
    addNpmScript(tree, 'format', 'prettier --write .');
    addNpmScript(tree, 'format:check', 'prettier --check .');
    context.logger.info(
      created
        ? '✔ .prettierrc/.prettierignore posés (format/format:check ajoutés).'
        : '✔ .prettierrc déjà présent, inchangé (format/format:check ajoutés).',
    );
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
      if (warning !== null && warning >= ANY_COMPONENT_STYLE_FLOOR_BYTES)
        next.maximumWarning = maximumWarning;
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
/**
 * La cible de test accepte-t-elle `styles` / `stylePreprocessorOptions` /
 * `inlineStyleLanguage` ?
 *
 * Seuls les builders Karma les déclarent. `@angular/build:unit-test` (défaut
 * depuis Angular 20) a un schéma en `additionalProperties: false` qui n'en
 * déclare aucune : les écrire rendait `angular.json` invalide et cassait
 * `ng test` pour tout le projet, sans message exploitable (FSHSP-152). Il n'en
 * a d'ailleurs pas besoin — il dérive sa configuration de build du
 * `buildTarget`, donc de la cible `build` que `updateAngularJson` traite déjà.
 *
 * On énumère donc ce qui ACCEPTE plutôt que ce qui refuse : un builder inconnu
 * est présumé dériver du `build` — c'est le sens de l'évolution d'Angular —
 * plutôt que de casser `ng test` par défaut.
 */
function acceptsStyleOptions(target: workspaces.TargetDefinition): boolean {
  return target.builder.includes(':karma');
}

function updateAngularJson(): Rule {
  return updateWorkspace((workspace) => {
    for (const project of workspace.projects.values()) {
      // Budgets live on `build` only — `test` declares none.
      const build = project.targets.get('build');
      if (build) relaxAnyComponentStyleBudget(build);

      for (const targetName of ['build', 'test'] as const) {
        const target = project.targets.get(targetName);
        if (!target) continue;
        if (targetName === 'test' && !acceptsStyleOptions(target)) continue;
        const options = (target.options ??= {});

        // Arborescence d'assets maison (FSHSP-164), servie sous `/assets/` :
        // c'est ce préfixe que `ui-image` construit (`assets/img/{marque}/…`)
        // et que la story `ui-input-group` code en dur pour ses drapeaux.
        // Sans cette entrée, `ng new` ne sert que `public/` et tout ce que le
        // kit résout sous `/assets/` répond 404 — le composant tombant alors
        // sur son placeholder, sans rien dire de la cause.
        //
        // AJOUTÉE à l'existant, jamais substituée : `public/` reste servi.
        const assets = ((options['assets'] as JsonValue[] | undefined) ?? []).slice();
        const hasAssetsRoot = assets.some((asset) =>
          typeof asset === 'string'
            ? asset === ASSETS_ROOT
            : !!asset &&
              typeof asset === 'object' &&
              !Array.isArray(asset) &&
              asset['input'] === ASSETS_ROOT,
        );
        if (!hasAssetsRoot) {
          assets.push({
            glob: '**/*',
            input: ASSETS_ROOT,
            output: './assets/',
            // Le README documente l'arborescence pour le développeur, et les
            // `.gitkeep` ne tiennent que des dossiers vides : ni l'un ni les
            // autres n'ont à être servis en production. `ignore` est accepté
            // par le builder d'application ET par celui de Storybook.
            ignore: ['README.md', '**/.gitkeep'],
          });
        }
        options['assets'] = assets;

        const styles = ((options['styles'] as string[] | undefined) ?? []).slice();
        for (const entry of [
          'src/styles/main.scss',
          'node_modules/@fortawesome/fontawesome-free/css/all.css',
          'node_modules/@angular/cdk/overlay-prebuilt.css',
        ]) {
          if (!styles.includes(entry)) styles.push(entry);
        }
        options['styles'] = styles;

        const preprocessor = (options['stylePreprocessorOptions'] ?? {}) as {
          includePaths?: string[];
        };
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
      tree.create(
        'tokens.config.json',
        readFileSync(join(pipelineDir, 'tokens.config.json'), 'utf8'),
      );
    }
    if (!tree.exists('scripts/tokens.build.mjs')) {
      tree.create(
        'scripts/tokens.build.mjs',
        readFileSync(join(pipelineDir, 'tokens.build.mjs'), 'utf8'),
      );
    }

    context.logger.info(
      '✔ Chaîne de génération des tokens copiée (src/design-tokens/, tokens.config.json, scripts/tokens.build.mjs).',
    );
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
      // Index de recherche plein texte de l'addon `text-search` (FSHSP-138) :
      // même logique que `docs.config.mjs`, chaîné à part car indépendant.
      ['docs.search.mjs', 'scripts/docs.search.mjs'],
    ] as const) {
      if (tree.exists(targetPath)) continue; // éditable : jamais réécrasé
      tree.create(targetPath, readFileSync(join(dir, name), 'utf8'));
    }
    addNpmScript(tree, 'docs:config', 'node scripts/docs.config.mjs');
    addNpmScript(tree, 'docs:search', 'node scripts/docs.search.mjs');
    context.logger.info(
      `✔ Chaîne de doc copiée (scripts/docs.config.mjs, scripts/docs.search.mjs, ${CONFIG_TABLE_PATH}).`,
    );
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
 * et sa marque, les tsconfig, `docs/Introduction.mdx` et ses liens vers la
 * démo/le Figma DE CE DÉPÔT) est un scaffold écrit pour le consommateur.
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

    const create = (targetPath: string, content: string | Buffer) => {
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
        // Les pages transverses citent la fondation de styles — `Colors.mdx`
        // va jusqu'à importer le manifeste de tokens. Aux chemins du monorepo,
        // le build échoue sur un module introuvable.
        //
        // Tout le reste passe en Buffer : décoder en utf8 remplace chaque octet
        // invalide par U+FFFD, ce qui détruit les images de la doc.
        create(
          `${targetDir}/${entry.name}`,
          entry.name.endsWith('.mdx')
            ? rewriteKitPaths(readFileSync(full, 'utf8'))
            : readFileSync(full),
        );
      }
    };

    // `Introduction.mdx` des assets cite la démo et les Figma DE CE DÉPÔT
    // (sections "Application de démonstration" / "Ressources Figma") : sans
    // objet chez un consommateur. Scaffold posé en premier pour que `create()`
    // dans `copyAll` le trouve déjà là et n'écrase pas avec la version brute.
    create(
      'storybook/docs/Introduction.mdx',
      readFileSync(join(scaffolds, 'docs/Introduction.mdx'), 'utf8'),
    );

    copyAll(assets, 'storybook');

    for (const name of ['main.js', 'myTheme.ts', 'tsconfig.json', 'tsconfig.doc.json']) {
      create(`storybook/${name}`, readFileSync(join(scaffolds, name), 'utf8'));
    }

    const hasUiImage = tree.exists(UI_IMAGE_PATH);
    const preview = readFileSync(join(scaffolds, 'preview.ts'), 'utf8');
    create(
      'storybook/preview.ts',
      hasUiImage ? preview.replace(UI_IMAGE_MARKER_RE, '') : preview.replace(UI_IMAGE_BLOCK_RE, ''),
    );

    // La map que `preview.ts` importe dans son bloc `<ui-image>` n'est plus
    // créée ici : elle fait partie de l'arborescence d'assets, posée par
    // `copyProjectAssetsRule` quels que soient les composants copiés
    // (FSHSP-164). Elle est donc là avant que cette règle ne tourne.

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
          asset && typeof asset === 'object' && !('output' in asset)
            ? { ...asset, output: '.' }
            : asset,
        );
      }

      const shared = {
        configDir: 'storybook',
        browserTarget: `${name}:build`,
        // Repris de `build`, pas réécrit : `updateAngularJson` y a déjà ajouté
        // `src/assets` (FSHSP-164) et normalisé les `output`. L'entrée était
        // codée en dur ici, ce qui rendait la preview le SEUL endroit où
        // `/assets/` était servi — et faisait disparaître le `public/`
        // d'`ng new` des stories qui s'en servaient.
        assets: build.options?.['assets'],
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
 * `index.html` de chaque application, lu dans `angular.json` plutôt que
 * supposé à `src/index.html` : l'option `index` peut être déplacée, et elle
 * accepte aussi bien une chaîne qu'un objet `{ input, output }`.
 *
 * Elle peut aussi être ABSENTE — c'est même le cas d'`ng new` depuis Angular 22,
 * qui laisse le builder appliquer son défaut, `{sourceRoot}/index.html` (lui-même
 * `{root}/src` par défaut). Sans ce repli, un projet fraîchement créé n'a aucun
 * `index.html` à nos yeux. `index: false` (pas de page générée) ne compte pas.
 *
 * `architect` ou `targets` : les deux clés sont valides dans `angular.json` et
 * `updateWorkspace` accepte l'une comme l'autre — un parse maison doit donc
 * regarder les deux, sans quoi un workspace en `targets` ne trouverait rien.
 */
function applicationIndexPaths(tree: Tree): string[] {
  const buffer = tree.read('/angular.json');
  if (!buffer) return [];
  type Target = { options?: { index?: string | false | { input?: string } } };
  type Project = {
    projectType?: string;
    root?: string;
    sourceRoot?: string;
    architect?: Record<string, Target>;
    targets?: Record<string, Target>;
  };
  const workspace = JSON.parse(buffer.toString('utf8')) as { projects?: Record<string, Project> };
  const paths: string[] = [];
  for (const project of Object.values(workspace.projects ?? {})) {
    if (project.projectType !== 'application') continue;
    const index = (project.architect ?? project.targets)?.['build']?.options?.index;
    if (index === false) continue;
    if (typeof index === 'string') {
      paths.push(index);
      continue;
    }
    if (index?.input) {
      paths.push(index.input);
      continue;
    }
    const sourceRoot = project.sourceRoot ?? [project.root, 'src'].filter(Boolean).join('/');
    paths.push(`${sourceRoot}/index.html`);
  }
  return paths;
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
      // Addon `text-search` (FSHSP-138) : index de recherche construit par
      // `scripts/docs.search.mjs` (minisearch au runtime manager, remark/unified
      // pour parser les `.mdx` à la génération).
      ['minisearch', '^7.2.0'],
      ['unified', '^11.0.5'],
      ['remark-parse', '^11.0.0'],
      ['remark-mdx', '^3.1.1'],
      ['unist-util-visit', '^5.1.0'],
    ] as const) {
      addDependency(tree, name, version, 'devDependencies');
    }
    // Les générations d'abord, dans cet ordre : la page « Colors » importe
    // `tokens.manifest.json` (produit par `tokens:build`), le bloc
    // `<ConfigTable>` lit `ui-config.json` (produit par `docs:config`), et
    // l'addon `text-search` lit `storybook/public/text-search-docs.json`
    // (produit par `docs:search`, qui a lui-même besoin de `ui-config.json`
    // pour le theming des pages composant — d'où son rang après `docs:config`).
    // Les chaîner ici plutôt que de compter sur le `postinstall` : sur une
    // installation fraîche, le build tomberait sinon sur un module introuvable.
    const project = firstApplicationName(tree);
    if (project) {
      const generate = 'npm run tokens:build && npm run docs:config && npm run docs:search';
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
        postinstall: existingPostinstall
          ? `${existingPostinstall} && npm run tokens:build`
          : 'npm run tokens:build',
      };
      tree.overwrite('/package.json', JSON.stringify(json, null, 2) + '\n');
    }
    context.logger.info('✔ Dépendances runtime + script tokens:build + hook postinstall ajoutés.');
    return tree;
  };
}

/** Dossier du serveur MCP compagnon chez le consommateur (FSHSP-115). Un
 * point (comme `.storybook` ailleurs dans l'écosystème) : c'est un outil, pas
 * une source à éditer — voir {@link copyMcpServerRule}. */
const MCP_SERVER_DIR = '.ui-kit-mcp';
const MCP_SERVER_NAME = 'ui-kit';
/** `node`, pas `npx` : le bundle copié est autonome (esbuild, zéro dépendance
 * à résoudre), donc rien à aller chercher sur le registre npm pour le lancer. */
const MCP_SERVER_ENTRY = { command: 'node', args: [`${MCP_SERVER_DIR}/index.js`] };

/**
 * Copie le serveur MCP bundlé (FSHSP-115) dans `.ui-kit-mcp/`, à la racine du
 * projet. 🔒 Verrouillé comme la fondation de styles : régénéré à chaque
 * `ng add`/mise à jour — c'est un outil, jamais une source à éditer.
 */
function copyMcpServerRule(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const root = mcpServerDir();

    const copyAll = (srcDir: string, targetDir: string) => {
      for (const entry of readdirSync(srcDir, { withFileTypes: true })) {
        const full = join(srcDir, entry.name);
        const targetPath = `${targetDir}/${entry.name}`;
        if (entry.isDirectory()) {
          copyAll(full, targetPath);
          continue;
        }
        const content = readFileSync(full, 'utf8');
        if (tree.exists(targetPath)) tree.overwrite(targetPath, content);
        else tree.create(targetPath, content);
      }
    };

    copyAll(root, MCP_SERVER_DIR);
    context.logger.info(`✔ Serveur MCP copié (${MCP_SERVER_DIR}/).`);
    return tree;
  };
}

/**
 * Déclare le serveur MCP `ui-kit` dans `.mcp.json`, à la racine du projet.
 *
 * Fusionne plutôt qu'écrase : un `.mcp.json` existant peut déjà déclarer
 * d'autres serveurs (ou celui-ci, retouché par le consommateur) — on
 * n'ajoute la clé `ui-kit` que si elle est absente, jamais en écrasant une
 * entrée déjà présente.
 */
function scaffoldMcpConfig(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const path = '/.mcp.json';
    const buffer = tree.read(path);
    const json: { mcpServers?: Record<string, unknown>; [key: string]: unknown } = buffer
      ? JSON.parse(buffer.toString('utf8'))
      : {};

    if (json.mcpServers?.[MCP_SERVER_NAME]) {
      context.logger.info(`✔ .mcp.json : serveur "${MCP_SERVER_NAME}" déjà déclaré, inchangé.`);
      return tree;
    }

    json.mcpServers = { ...json.mcpServers, [MCP_SERVER_NAME]: MCP_SERVER_ENTRY };
    const content = JSON.stringify(json, null, 2) + '\n';
    if (buffer) tree.overwrite(path, content);
    else tree.create(path, content);
    context.logger.info(
      `✔ .mcp.json : serveur "${MCP_SERVER_NAME}" déclaré (${MCP_SERVER_DIR}/, local).`,
    );
    return tree;
  };
}

/**
 * Bloc d'instruction agent, entre marqueurs pour rester idempotent d'un
 * `ng add` à l'autre (jamais dupliqué, jamais réécrasé — un consommateur peut
 * l'avoir retouché).
 */
const AGENTS_MCP_MARKER_START = '<!-- ui-kit-mcp:start -->';
const AGENTS_MCP_MARKER_END = '<!-- ui-kit-mcp:end -->';
const AGENTS_MCP_BLOCK = [
  AGENTS_MCP_MARKER_START,
  '## Design system (@4sh/ui-kit)',
  '',
  "Avant d'utiliser un composant `ui-*`, interroge le serveur MCP `ui-kit` (`list_components`, " +
    '`get_component_doc`, `search_docs`) plutôt que de lire les fichiers sources ou de deviner une ' +
    "API — c'est la doc publiée du kit, toujours à jour avec la version installée.",
  AGENTS_MCP_MARKER_END,
  '',
].join('\n');

/**
 * Ajoute ce bloc à `AGENTS.md`, à la racine du projet (convention déjà en
 * place dans ce repo — voir son propre `AGENTS.md`). Crée le fichier s'il
 * n'existe pas encore ; l'étend sinon, sans jamais toucher au reste.
 */
function scaffoldAgentsInstructions(): Rule {
  return (tree: Tree, context: SchematicContext) => {
    const path = '/AGENTS.md';
    const buffer = tree.read(path);

    if (!buffer) {
      tree.create(path, `# AGENTS.md\n\n${AGENTS_MCP_BLOCK}`);
      context.logger.info('✔ AGENTS.md créé (instruction agent pour le serveur MCP ui-kit).');
      return tree;
    }

    const content = buffer.toString('utf8');
    if (content.includes(AGENTS_MCP_MARKER_START)) {
      context.logger.info('✔ AGENTS.md : instruction agent déjà présente, inchangée.');
      return tree;
    }

    tree.overwrite(path, `${content.trimEnd()}\n\n${AGENTS_MCP_BLOCK}`);
    context.logger.info('✔ AGENTS.md : instruction agent ajoutée pour le serveur MCP ui-kit.');
    return tree;
  };
}

/** Version alignée sur celle du starter (`package.json` racine). */
const GRIDAFLEX_VERSION = '^1.0.0';
const GRIDAFLEX_SETTINGS_PATH = 'src/styles/vendors/_gridaflex-settings.scss';
const MAIN_SCSS_PATH = 'src/styles/main.scss';
/** Résolu par l'includePath `src/styles` déjà écrit dans `angular.json`. */
const GRIDAFLEX_MODULE = 'vendors/gridaflex-settings';

/**
 * Réponse à la question Gridaflex : l'option la tranche sans prompt (usage
 * scripté), sinon on demande. Hors terminal interactif (CI, `--all` dans un
 * script), on ne pose rien : ajouter une dépendance sans que personne ne
 * puisse répondre est le pire des deux défauts.
 */
async function resolveGridaflexChoice(
  options: Schema,
  context: SchematicContext,
): Promise<boolean> {
  if (options.gridaflex !== undefined) return options.gridaflex;
  if (!process.stdin.isTTY) {
    context.logger.info(
      'Gridaflex : pas de terminal interactif, question sautée (`--gridaflex` pour le poser).',
    );
    return false;
  }
  return confirm({
    message: 'Utiliser Gridaflex (grille flexbox 24 colonnes, réglée par les breakpoints du kit) ?',
    default: true,
  });
}

/**
 * Ajoute un `@use` en TÊTE des `@use` de `main.scss`.
 *
 * En tête, et pas en queue, parce que Gridaflex l'exige : configurer un module
 * Sass (`with (…)`) n'est possible que s'il n'a pas déjà été chargé. Les autres
 * couches s'en accommodent (un `@font-face` n'a pas d'ordre de cascade), donc
 * une seule règle d'insertion pour tout le monde.
 *
 * Idempotent : un `ng add` rejoué ne duplique pas la ligne. Le scaffold
 * `main.scss` porte déjà ces `@use` — cette fonction sert les projets installés
 * avant, dont `main.scss` (fichier du consommateur) n'est jamais réécrasé.
 */
function importInMainScss(
  tree: Tree,
  moduleId: string,
  comment: string,
): 'added' | 'already-there' | 'no-main' {
  const buffer = tree.read(`/${MAIN_SCSS_PATH}`);
  if (!buffer) return 'no-main';
  const content = buffer.toString('utf8');
  if (content.includes(moduleId)) return 'already-there';

  const lines = content.split('\n');
  const block = [comment, `@use "${moduleId}";`, ''];
  const firstUse = lines.findIndex((line) => /^\s*@use\b/.test(line));
  const charset = lines.findIndex((line) => /^\s*@charset\b/.test(line));
  let at = firstUse !== -1 ? firstUse : charset !== -1 ? charset + 1 : 0;
  // Remonter les lignes de commentaire collées au premier `@use` : elles le
  // décrivent, s'insérer entre les deux les séparerait.
  while (firstUse !== -1 && at > 0 && lines[at - 1].trim().startsWith('//')) at--;
  lines.splice(at, 0, ...block);
  tree.overwrite(`/${MAIN_SCSS_PATH}`, lines.join('\n'));
  return 'added';
}

/**
 * Pose Gridaflex si le consommateur en veut : les réglages sous
 * `src/styles/vendors/`, leur import dans `main.scss`, la dépendance.
 *
 * Le scaffold est un fichier du consommateur (il y règle SES colonnes et SES
 * gouttières) : créé une seule fois, jamais réécrasé. Un refus ne défait rien
 * d'une install précédente : supprimer les réglages d'un projet qui s'en sert
 * déjà casserait sa feuille globale.
 */
function setupGridaflexRule(options: Schema): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    if (!(await resolveGridaflexChoice(options, context))) {
      context.logger.info(
        '✔ Gridaflex non posé. Les stories de `ui-card` et `ui-read-only` utilisent ses classes ' +
          "(`flex-x`, `flex-gap-x`…) : leur mise en page s'affichera à plat.",
      );
      return tree;
    }

    if (!tree.exists(GRIDAFLEX_SETTINGS_PATH)) {
      tree.create(
        GRIDAFLEX_SETTINGS_PATH,
        readFileSync(join(__dirname, 'files', 'vendors', '_gridaflex-settings.scss'), 'utf8'),
      );
    }
    const imported = importInMainScss(
      tree,
      GRIDAFLEX_MODULE,
      '// ✏️ Grille Gridaflex : colonnes, breakpoints et gouttières.',
    );
    addDependency(tree, 'gridaflex', GRIDAFLEX_VERSION, 'dependencies');

    if (imported === 'no-main') {
      context.logger.warn(
        `Gridaflex posé (${GRIDAFLEX_SETTINGS_PATH}) mais ${MAIN_SCSS_PATH} est introuvable : ` +
          `ajoutez-y \`@use "${GRIDAFLEX_MODULE}";\` avant vos autres \`@use\`.`,
      );
      return tree;
    }
    context.logger.info(
      `✔ Gridaflex posé (${GRIDAFLEX_SETTINGS_PATH}, importé par ${MAIN_SCSS_PATH}).`,
    );
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

/**
 * Dernière ligne de la commande : ce qu'il y a à lancer maintenant.
 *
 * Les scripts npm sont écrits sans être nommés nulle part, et le README du
 * package n'est pas relu après un `ng add` qui vient d'afficher huit `✔` : un
 * `npm run storybook` qu'il faut deviner est un Storybook que l'on croit cassé.
 */
function logNextSteps(withStorybook: boolean, withMcp: boolean): Rule {
  return (tree: Tree, context: SchematicContext) => {
    context.logger.info(
      withStorybook
        ? '\nStorybook posé. Pour le démarrer :\n    npm run storybook\n'
        : '\nStorybook non posé (--skip-storybook). Pour revenir dessus :\n    ng add @4sh/ui-kit-schematics\n',
    );
    if (withMcp) {
      context.logger.info(
        'Serveur MCP "ui-kit" déclaré (.mcp.json) : un agent IA compatible MCP peut interroger la doc du kit directement.\n',
      );
    }
    return tree;
  };
}

export function ngAdd(options: Schema): Rule {
  // Posé par défaut : un consommateur qui possède les sources mais pas leur doc
  // n'a reçu que la moitié du design system, et sa doc ne peut pas être la
  // nôtre — les tables Theming se lisent sur SES `.scss`. `--skip-storybook`
  // reste pour le projet qui documente ailleurs, et qui n'a alors ni story, ni
  // MDX, ni les devDependencies de la preview.
  const withStorybook = !(options.skipStorybook ?? false);
  // Posé par défaut aussi : c'est ce qui permet à un agent IA de consulter la
  // doc du kit sans lire les sources (FSHSP-115). `--skip-mcp` pour le projet
  // qui n'utilise pas d'agent compatible MCP, ou gère sa propre config.
  const withMcp = !(options.skipMcp ?? false);

  const foundation = [
    copyStylesFoundationRule(),
    createStyleScaffolds(),
    // Avant `updateAngularJson`, qui déclare `src/assets` au builder : la
    // règle qui pose l'arborescence et celle qui la fait servir se lisent
    // ainsi dans l'ordre où elles prennent effet.
    copyProjectAssetsRule(),
    retargetFaviconRule(),
    copyPrettierConfigRule(),
    copyTokensPipeline(),
    // La chaîne de doc ne sert qu'aux MDX copiés : sans eux, ce sont deux
    // fichiers morts dans le dépôt du consommateur.
    ...(withStorybook ? [copyDocsPipeline()] : []),
    addRuntimeDependencies(),
    updateAngularJson(),
    createManifest(withStorybook),
    ...(withMcp ? [copyMcpServerRule(), scaffoldMcpConfig(), scaffoldAgentsInstructions()] : []),
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
      setupGridaflexRule(options),
      ...storybook,
      (_tree: Tree, context: SchematicContext) => {
        context.logger.info(
          'Fondation posée. Composants à copier ensuite : `ng generate @4sh/ui-kit-schematics:add`.',
        );
      },
      logNextSteps(withStorybook, withMcp),
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
    // Après la sélection : la question Gridaflex suit le choix des composants,
    // pas l'inverse : c'est la mise en page de ce qu'on vient de copier.
    setupGridaflexRule(options),
    ...storybook,
    logNextSteps(withStorybook, withMcp),
    ...install,
  ]);
}
