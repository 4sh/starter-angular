/**
 * angular-version — refuser un projet dont le majeur d'Angular n'est pas celui du kit.
 *
 * Les sources copiées et les dépendances que `ng add` inscrit visent le majeur
 * des `peerDependencies` du kit. Posées dans un projet d'un autre majeur, elles
 * ne compilent pas, et l'install s'arrête sur un ERESOLVE qui ne dit pas d'où il
 * vient (Angular 20 : `@angular-devkit/build-angular@^22` contre le
 * `compiler-cli@^20` du projet). Monter Angular d'un majeur est le travail
 * d'`ng update`, avec ses migrations : un schematic de composants ne le fait pas
 * à moitié. On s'arrête donc AVANT toute écriture, en disant quoi faire.
 */
import type { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { SchematicsException } from '@angular-devkit/schematics';
import { readKitManifestInfo } from './kit-manifest';
import { readPackageJson } from './package-json';

/**
 * Majeur plancher d'une plage npm : `^20.3.0`, `~20.3.0`, `20.3.0`, `>=20.0.0`,
 * `20.x`, `v20` → 20. `undefined` pour ce qui ne se lit pas ainsi (`latest`,
 * `*`, `file:…`, `workspace:*`, `npm:…`) : l'appelant ne devine pas.
 */
export function majorOf(range: string | undefined): number | undefined {
  const match = /^\s*(?:[\^~]|>=?)?\s*v?(\d+)(?:[.\sx*]|$)/.exec(range ?? '');
  return match ? Number(match[1]) : undefined;
}

/** Plage de `@angular/core` du projet, dépendances puis devDependencies. */
function projectCoreRange(tree: Tree): string | undefined {
  const json = readPackageJson(tree);
  return json.dependencies?.['@angular/core'] ?? json.devDependencies?.['@angular/core'];
}

/** Version installée de `@angular/core`, quand la plage déclarée ne se lit pas. */
function installedCoreVersion(tree: Tree): string | undefined {
  const buffer = tree.read('/node_modules/@angular/core/package.json');
  if (!buffer) return undefined;
  try {
    return JSON.parse(buffer.toString('utf8')).version;
  } catch {
    return undefined;
  }
}

/**
 * Message d'échec, ou `undefined` si le projet est compatible ou illisible.
 * Séparé de la règle pour être testé sans arbre.
 */
export function angularMismatch(
  projectRange: string | undefined,
  kitRange: string,
  kitVersion: string,
): string | undefined {
  const project = majorOf(projectRange);
  const kit = majorOf(kitRange);
  if (project === undefined || kit === undefined || project === kit) return undefined;

  const found =
    `@4sh/ui-kit ${kitVersion} demande Angular ${kit} (@angular/core ${kitRange}), ` +
    `ce projet est en Angular ${project} (@angular/core ${projectRange}).`;
  const untouched =
    "Le schematic n'a rien modifié. Seul `@4sh/ui-kit-schematics`, ajouté par `ng add`, " +
    'est à retirer du package.json si vous en restez là.';
  if (project > kit) {
    return `${found}\nCette version du kit ne connaît pas encore Angular ${project}.\n${untouched}`;
  }
  const steps = Array.from({ length: kit - project }, (_, i) => project + i + 1)
    .map((major) => `    ng update @angular/core@${major} @angular/cli@${major}`)
    .join('\n');
  return (
    `${found}\nMettre le projet à niveau d'abord, un majeur à la fois ` +
    `(https://angular.dev/update-guide) :\n${steps}\n` +
    `puis relancer \`ng add @4sh/ui-kit-schematics\`.\n${untouched}`
  );
}

/**
 * À appeler avant toute écriture ET avant tout prompt. Ne lit que
 * `package.json` (et, à défaut, la version installée) : un projet dont la plage
 * ne se lit pas passe, avec un avertissement, plutôt que d'être refusé sur une
 * supposition.
 */
export function checkAngularCompatibility(tree: Tree, context: SchematicContext): void {
  const { version, peerDependencies } = readKitManifestInfo();
  const kitRange = peerDependencies['@angular/core'];
  if (!kitRange) return;

  const declared = projectCoreRange(tree);
  const range = majorOf(declared) !== undefined ? declared : installedCoreVersion(tree);
  if (majorOf(range) === undefined) {
    context.logger.warn(
      `Version d'Angular du projet illisible (@angular/core « ${declared ?? 'absent'} ») : ` +
        `le kit demande ${kitRange}, vérification sautée.`,
    );
    return;
  }

  const mismatch = angularMismatch(range, kitRange, version);
  if (mismatch) throw new SchematicsException(mismatch);
}

/** {@link checkAngularCompatibility} en règle, pour la tête d'une chaîne. */
export function assertAngularCompatible(): Rule {
  return (tree, context) => {
    checkAngularCompatibility(tree, context);
    return tree;
  };
}
