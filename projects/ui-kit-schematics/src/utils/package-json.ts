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
