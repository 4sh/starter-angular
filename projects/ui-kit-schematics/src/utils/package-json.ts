/** package-json — petits utilitaires de lecture/écriture sur le `package.json` du consommateur. */
import type { Tree } from '@angular-devkit/schematics';
import { SchematicsException } from '@angular-devkit/schematics';

export interface PackageJson {
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
  scripts?: Record<string, string>;
  [key: string]: unknown;
}

export function readPackageJson(tree: Tree): PackageJson {
  const buffer = tree.read('/package.json');
  if (!buffer) throw new SchematicsException('package.json introuvable à la racine du projet.');
  return JSON.parse(buffer.toString('utf8'));
}

export function writePackageJson(tree: Tree, json: PackageJson): void {
  tree.overwrite('/package.json', JSON.stringify(json, null, 2) + '\n');
}

export function addDependency(
  tree: Tree,
  name: string,
  version: string,
  target: 'dependencies' | 'devDependencies' = 'dependencies',
): void {
  const json = readPackageJson(tree);
  json[target] = { ...json[target], [name]: version };
  writePackageJson(tree, json);
}

export function addNpmScript(tree: Tree, name: string, command: string): void {
  const json = readPackageJson(tree);
  if (json.scripts?.[name]) return; // ne jamais écraser un script déjà défini par le consommateur
  json.scripts = { ...json.scripts, [name]: command };
  writePackageJson(tree, json);
}

/** Gestionnaires de paquets que `ng add` sait nommer dans les scripts qu'il écrit. */
export type ConsumerPackageManager = 'pnpm' | 'yarn' | 'bun' | 'npm';

/**
 * Lockfiles, dans l'ordre de précédence du CLI Angular
 * (`PACKAGE_MANAGER_PRECEDENCE`). L'aligner évite le pire des cas : un schematic
 * qui écrit `npm run` là où le CLI vient d'installer avec pnpm.
 */
const LOCKFILES: ReadonlyArray<readonly [ConsumerPackageManager, readonly string[]]> = [
  ['pnpm', ['/pnpm-lock.yaml']],
  ['yarn', ['/yarn.lock']],
  ['bun', ['/bun.lockb', '/bun.lock']],
  ['npm', ['/package-lock.json', '/npm-shrinkwrap.json']],
];

/**
 * Devine le gestionnaire de paquets du projet consommateur.
 *
 * Le champ `packageManager` d'abord : c'est une intention déclarée, elle prime
 * sur un lockfile qui peut traîner d'une migration. Puis les lockfiles présents.
 * `npm` en dernier recours : c'est le seul livré avec Node, donc le seul dont la
 * présence est certaine.
 *
 * Ce n'est PAS ce qui pilote l'installation : la tâche `NodePackageInstallTask`
 * reçoit déjà le gestionnaire détecté par le CLI Angular. Cette fonction ne sert
 * qu'aux commandes que l'on ÉCRIT : scripts du `package.json`, messages finaux,
 * pour ne pas inscrire `npm run` dans un projet pnpm.
 */
export function detectPackageManager(tree: Tree): ConsumerPackageManager {
  const declared = readPackageJson(tree)['packageManager'];
  if (typeof declared === 'string') {
    const name = declared.split('@')[0]?.trim();
    const known = LOCKFILES.find(([pm]) => pm === name);
    if (known) return known[0];
  }
  for (const [pm, files] of LOCKFILES) {
    if (files.some((f) => tree.exists(f))) return pm;
  }
  return 'npm';
}

/**
 * Préfixe pour lancer un script du `package.json` avec ce gestionnaire.
 *
 * `npm` et `bun` exigent le mot `run`, `pnpm` et `yarn` s'en passent.
 */
export function runScript(pm: ConsumerPackageManager, script: string): string {
  return pm === 'npm' || pm === 'bun' ? `${pm} run ${script}` : `${pm} ${script}`;
}
