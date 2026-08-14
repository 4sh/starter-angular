/**
 * manifest — lecture/écriture de `ui-kit.json`, à la racine du projet
 * consommateur. Format défini dans FSHSP-109 : versionné par composant, pas
 * juste une version globale du kit, pour permettre un `update` sélectif.
 *
 * ⚠️ Limite connue : la version stockée par composant est aujourd'hui celle
 * du PACKAGE `@4sh/ui-kit` entier au moment de la copie (le repo ne suit pas
 * de version par composant — un seul numéro dans `projects/ui-kit/package.json`,
 * voir `docs/VERSIONING.md`). `update` détecte donc « ce composant a été copié
 * depuis une version antérieure du kit », pas un changement ciblé sur LUI.
 * Un vrai suivi par composant est un chantier à part, pas traité ici.
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
