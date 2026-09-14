#!/usr/bin/env node
/**
 * ui-kit-preview — monte un Storybook JETABLE sur le kit, dans le projet
 * consommateur (FSHSP-202).
 *
 * À qui ça sert : au designer, au démarrage d'un projet. Il vient d'appliquer
 * ses jetons Figma et veut voir l'ensemble du kit rendu avec SON thème — le
 * geste central quand on construit un thème, et celui qu'un projet consommant
 * le kit en paquet ne pouvait pas faire : son Storybook n'a aucune page de
 * composant, puisqu'il n'a copié aucune source.
 *
 * Pourquoi une commande et pas un schematic. Un schematic écrit dans le dépôt
 * et s'y installe ; ici tout est jetable. Le dossier produit n'appartient pas
 * au projet : il est réécrit à chaque exécution et se supprime d'un bloc. Le
 * Storybook du projet (`storybook/`) n'est jamais touché.
 *
 * Pourquoi ça rend le thème du projet sans rien transporter : `--config-dir`
 * ne change QUE le dossier de configuration. Les options `styles`, `assets` et
 * `stylePreprocessorOptions` de la cible `storybook` d'`angular.json` — posée
 * par `ng add` — sont réutilisées telles quelles. Polices, jetons générés,
 * preset, arborescence d'assets : tout arrive nativement, comme dans
 * l'application. C'est ce qu'aucun visualiseur externe ne pouvait donner.
 *
 * Usage :
 *   pnpm exec ui-kit-preview              # monte et démarre
 *   pnpm exec ui-kit-preview --port 6100
 *   pnpm exec ui-kit-preview --clean      # supprime le dossier et sort
 */
import { spawn } from 'node:child_process';
import { copyFileSync, existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { docsPipelineDir, mcpServerDir, storybookAssetsDir } from '../utils/component-registry';
import { kitVersion as embeddedKitVersion } from '../utils/kit-manifest';
import {
  PREVIEW_CONFIG_TABLE,
  PREVIEW_ROOT,
  PREVIEW_UI_CONFIG,
  previewUnits,
  renderPreviewFiles,
} from '../utils/preview';

const KIT_PACKAGE = '@4sh/ui-kit';
const DEFAULT_PORT = 6007;

const ROOT = process.cwd();
const TEMPLATES = join(__dirname, 'files');

function fail(message: string): never {
  console.error(`\n✗ ${message}\n`);
  process.exit(1);
}

/**
 * `angular.json` accepte les commentaires (le CLI Angular en écrit lui-même, et
 * ce dépôt en a). `JSON.parse` les refuse, et aucune dépendance de ce paquet ne
 * sait les lire — d'où ce retrait, qui ignore ce qui est entre guillemets pour
 * ne pas amputer une valeur contenant `//` (une URL, typiquement).
 */
function parseJsonc(text: string): unknown {
  let out = '';
  let inString = false;
  let escaped = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inString) {
      out += c;
      if (escaped) escaped = false;
      else if (c === '\\') escaped = true;
      else if (c === '"') inString = false;
      continue;
    }
    if (c === '"') {
      inString = true;
      out += c;
      continue;
    }
    if (c === '/' && text[i + 1] === '/') {
      while (i < text.length && text[i] !== '\n') i++;
      out += '\n';
      continue;
    }
    if (c === '/' && text[i + 1] === '*') {
      i += 2;
      while (i < text.length && !(text[i] === '*' && text[i + 1] === '/')) i++;
      i++;
      continue;
    }
    out += c;
  }
  // Virgules traînantes, que le CLI tolère aussi.
  return JSON.parse(out.replace(/,(\s*[}\]])/g, '$1'));
}

/**
 * Le projet qui porte la cible `storybook`. C'est d'elle qu'on hérite styles et
 * assets : sans elle il n'y a rien à surcharger, et c'est le signe que `ng add`
 * n'a pas posé de Storybook.
 */
function storybookProject(): string {
  const path = join(ROOT, 'angular.json');
  if (!existsSync(path))
    fail(`Pas d'angular.json dans ${ROOT}. Lancez la commande à la racine du projet.`);

  const workspace = parseJsonc(readFileSync(path, 'utf8')) as {
    projects?: Record<
      string,
      { architect?: Record<string, unknown>; targets?: Record<string, unknown> }
    >;
  };
  for (const [name, project] of Object.entries(workspace.projects ?? {})) {
    const targets = project.architect ?? project.targets ?? {};
    if ('storybook' in targets) return name;
  }
  return fail(
    'Aucun projet ne porte de cible `storybook` dans angular.json.\n' +
      '  Cette commande complète un Storybook déjà posé :\n' +
      '  `ng add @4sh/ui-kit-schematics --skip-components` d’abord.',
  );
}

/**
 * Les stories viennent de CE paquet, les composants du paquet `@4sh/ui-kit`
 * installé. Si les deux versions divergent, une story peut déclarer un
 * `argType` que le composant compilé n'a pas — et Storybook s'arrête sur un
 * `TS2353` désignant une ligne que le lecteur n'a pas écrite. Vécu pendant la
 * mise au point : on le dit plutôt que de le laisser arriver.
 */
function checkKitVersion(): string {
  const manifest = join(ROOT, 'node_modules', KIT_PACKAGE, 'package.json');
  if (!existsSync(manifest)) {
    fail(
      `${KIT_PACKAGE} n'est pas installé. Cette preview rend le paquet, pas des sources :\n` +
        `  installez-le d'abord (\`pnpm add ${KIT_PACKAGE}\`).`,
    );
  }
  const installed = (JSON.parse(readFileSync(manifest, 'utf8')) as { version: string }).version;
  const embedded = embeddedKitVersion();
  if (installed !== embedded) {
    fail(
      `Versions divergentes — rien n'a été écrit.\n` +
        `  ${KIT_PACKAGE} installé : ${installed}\n` +
        `  stories embarquées par @4sh/ui-kit-schematics : ${embedded}\n` +
        `  Les deux paquets sont publiés ensemble : alignez-les (\`pnpm add ${KIT_PACKAGE}@${embedded}\`\n` +
        `  ou montez le compagnon), sinon une story peut décrire une API que le paquet n'a pas.`,
    );
  }
  return installed;
}

function write(relPath: string, content: string | Buffer): void {
  const target = join(ROOT, relPath);
  mkdirSync(dirname(target), { recursive: true });
  writeFileSync(target, content);
}

/** `copyFileSync` ne crée pas l'arborescence de destination, et le dossier vient
 * d'être effacé : sans ce `mkdir`, la copie échoue sur un ENOENT qui désigne le
 * fichier source, ce qui envoie chercher au mauvais endroit. */
function copyInto(absSource: string, relPath: string): void {
  const target = join(ROOT, relPath);
  mkdirSync(dirname(target), { recursive: true });
  copyFileSync(absSource, target);
}

/** `.ui-kit-preview/` hors du suivi git : il est régénéré, jamais édité. */
function ignoreInGit(): void {
  const path = join(ROOT, '.gitignore');
  const entry = `/${PREVIEW_ROOT}`;
  const current = existsSync(path) ? readFileSync(path, 'utf8') : '';
  if (current.split('\n').some((line) => line.trim() === entry || line.trim() === PREVIEW_ROOT))
    return;
  const prefix = current && !current.endsWith('\n') ? '\n' : '';
  writeFileSync(
    path,
    `${current}${prefix}\n# Storybook jetable du kit (ui-kit-preview) — régénéré, jamais commité.\n${entry}\n`,
  );
}

function main(): void {
  const args = process.argv.slice(2);

  if (args.includes('--clean')) {
    rmSync(join(ROOT, PREVIEW_ROOT), { recursive: true, force: true });
    console.log(`✔ ${PREVIEW_ROOT}/ supprimé.`);
    return;
  }

  const portArg = args.indexOf('--port');
  const port = portArg !== -1 ? Number(args[portArg + 1]) : DEFAULT_PORT;
  if (!Number.isInteger(port) || port <= 0) fail(`Port invalide : ${args[portArg + 1]}`);

  const project = storybookProject();
  const version = checkKitVersion();

  // Réécrit à chaque exécution : ce dossier est à nous, et un reliquat d'une
  // version antérieure du kit indexerait des stories qui ne correspondent plus.
  rmSync(join(ROOT, PREVIEW_ROOT), { recursive: true, force: true });

  let fileCount = 0;
  for (const unit of previewUnits()) {
    for (const { targetPath, content } of renderPreviewFiles(unit, version)) {
      write(targetPath, content);
      fileCount++;
    }
  }

  // Bloc `<ConfigTable>` + catalogue, DANS le dossier : les tables « Theming »
  // listent les hooks CSS surchargeables, c'est-à-dire exactement ce que le
  // designer vient écrire dans son preset. Embarqués plutôt que lus dans
  // `storybook/` du projet, pour que rien ne soit écrit hors d'ici.
  copyInto(join(docsPipelineDir(), 'config-table.js'), PREVIEW_CONFIG_TABLE);
  copyInto(join(mcpServerDir(), 'data', 'ui-config.json'), PREVIEW_UI_CONFIG);

  for (const name of ['main.js', 'preview.ts', 'tsconfig.json']) {
    write(`${PREVIEW_ROOT}/${name}`, readFileSync(join(TEMPLATES, name), 'utf8'));
  }

  // Réparation des métadonnées : le MÊME fichier que celui du Storybook du
  // monorepo du kit, pour la même raison — là-bas aussi les stories visent le
  // paquet compilé. Dans le dossier jetable, comme tout le reste.
  copyInto(
    join(storybookAssetsDir(), 'restore-component-metadata.ts'),
    `${PREVIEW_ROOT}/restore-component-metadata.ts`,
  );

  ignoreInGit();

  console.log(
    `✔ ${fileCount} fichiers de doc du kit ${version} posés dans ${PREVIEW_ROOT}/\n` +
      `  Démarrage du Storybook sur le port ${port} — styles, polices et assets du projet inclus.\n` +
      `  Pour tout retirer ensuite : \`pnpm exec ui-kit-preview --clean\`.\n`,
  );

  // Le CLI du projet, résolu et non supposé sur le PATH : un poste sans `ng`
  // global est le cas courant.
  let cli: string;
  try {
    cli = require.resolve('@angular/cli/bin/ng.js', { paths: [ROOT] });
  } catch {
    return fail('@angular/cli est introuvable dans ce projet — impossible de démarrer Storybook.');
  }

  const child = spawn(
    process.execPath,
    [
      cli,
      'run',
      `${project}:storybook`,
      '--config-dir',
      PREVIEW_ROOT,
      // Compodoc analyse les SOURCES du projet pour produire les descriptions
      // d'API. Ici les composants vivent dans `node_modules` : il n'aurait rien
      // à lire, et ne ferait que rallonger le démarrage. Les `argTypes` des
      // stories du kit sont écrits à la main, ils se suffisent.
      '--no-compodoc',
      '--port',
      String(port),
    ],
    { cwd: ROOT, stdio: 'inherit' },
  );
  child.on('exit', (code) => process.exit(code ?? 0));
}

main();
