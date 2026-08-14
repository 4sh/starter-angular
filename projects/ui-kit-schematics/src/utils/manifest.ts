/**
 * manifest — lecture/écriture de `ui-kit.json`, à la racine du projet
 * consommateur. Format défini dans FSHSP-109.
 *
 * L'entrée par composant porte la version du PACKAGE `@4sh/ui-kit` au moment
 * de la copie, pas une version propre au composant : le kit n'est versionné
 * que globalement (`projects/ui-kit/package.json`, cf. `docs/VERSIONING.md`)
 * et un versionnage par composant n'est pas prévu. `update` répond donc à
 * « ce composant a été copié depuis une version antérieure du kit », ce qui
 * suffit à le proposer à la mise à jour.
 *
 * L'entrée reste un objet par composant (et non une simple version globale) :
 * c'est ce qui permet de mettre à jour composant par composant, et de savoir
 * lesquels ont été copiés — indépendamment de la granularité des versions.
 */
import type { Tree } from '@angular-devkit/schematics';

export const MANIFEST_PATH = '/ui-kit.json';

export interface ManifestComponentEntry {
  version: string;
  installedAt: string;
}

export interface UiKitManifest {
  kitVersion: string;
  components: Record<string, ManifestComponentEntry>;
}

export function readManifest(tree: Tree): UiKitManifest | null {
  const buffer = tree.read(MANIFEST_PATH);
  if (!buffer) return null;
  return JSON.parse(buffer.toString('utf8')) as UiKitManifest;
}

export function writeManifest(tree: Tree, manifest: UiKitManifest): void {
  const content = JSON.stringify(manifest, null, 2) + '\n';
  if (tree.exists(MANIFEST_PATH)) {
    tree.overwrite(MANIFEST_PATH, content);
  } else {
    tree.create(MANIFEST_PATH, content);
  }
}

export function emptyManifest(kitVersion: string): UiKitManifest {
  return { kitVersion, components: {} };
}

/** Horodatage ISO, tronqué au jour — cohérent avec l'exemple du ticket (`"2026-08-13"`). */
export function today(): string {
  return new Date().toISOString().slice(0, 10);
}
