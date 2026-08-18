/**
 * kit-manifest — lit `assets/ui-kit-package.json`, la copie du
 * `projects/ui-kit/package.json` embarquée par `scripts/schematics-assets.build.mjs`.
 *
 * C'est la source de vérité de la version du kit **et** des peer dependencies
 * runtime à répercuter chez le consommateur.
 *
 * Elle vit dans ce package, pas dans le `package.json` du consommateur : le
 * parcours starter n'installe plus `@4sh/ui-kit` (FSHSP-122), justement pour
 * qu'aucun import ne puisse le viser depuis `node_modules`. Il n'y a donc plus
 * de version à y lire, et les deux packages étant publiés en lockstep, celle-ci
 * est exactement celle du kit dont les sources sont copiées.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { stylesFoundationDir } from './component-registry';

const KIT_PACKAGE_JSON = join(stylesFoundationDir(), '..', 'ui-kit-package.json');

export interface KitManifestInfo {
  version: string;
  peerDependencies: Record<string, string>;
}

export function readKitManifestInfo(): KitManifestInfo {
  const json = JSON.parse(readFileSync(KIT_PACKAGE_JSON, 'utf8'));
  return { version: json.version, peerDependencies: json.peerDependencies ?? {} };
}

/** Version du kit dont ce package embarque les sources. */
export function kitVersion(): string {
  return readKitManifestInfo().version;
}
