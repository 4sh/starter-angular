#!/usr/bin/env node
/**
 * build-info.mjs — capture la version du kit publié, le commit courant et
 * l'écart avec la dernière version réellement publiée, pour affichage dans
 * Storybook (barre du manager, `storybook/myTheme.ts`).
 *
 * Le "dernier publié" se lit sur le dernier tag `vX.Y.Z` du dépôt, jamais sur
 * le registre npm : ce tag n'est posé que par le job `release` de
 * `publish-ui-kit.yml`, après un `npm publish` réussi (voir docs/VERSIONING.md)
 * — il *est* donc la dernière version publiée, sans appel réseau ni
 * dépendance à la disponibilité du registre pendant le build.
 *
 * Usage :
 *   node scripts/build-info.mjs
 */

import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const OUT_FILE = join(ROOT, 'storybook/generated/build-info.json');

/** Sortie d'une commande git, ou `fallback` si elle échoue (repo superficiel, pas de tag…). */
function git(args, fallback = null) {
  try {
    return execFileSync('git', args, { cwd: ROOT, stdio: ['ignore', 'pipe', 'ignore'] })
      .toString()
      .trim();
  } catch {
    return fallback;
  }
}

const { version } = JSON.parse(readFileSync(join(ROOT, 'projects/ui-kit/package.json'), 'utf8'));
const commit = git(['rev-parse', '--short', 'HEAD'], 'unknown');
const lastTag = git(['describe', '--tags', '--abbrev=0', '--match', 'v*'], null);
const lastPublished = lastTag ? lastTag.replace(/^v/, '') : null;
const isReleased = lastPublished === version;

const label = [
  isReleased ? version : `${version}-dev`,
  '·',
  commit,
  !isReleased && lastPublished ? `(ahead of ${lastPublished})` : null,
]
  .filter(Boolean)
  .join(' ');

mkdirSync(dirname(OUT_FILE), { recursive: true });
writeFileSync(
  OUT_FILE,
  `${JSON.stringify({ version, commit, lastPublished, isReleased, label }, null, 2)}\n`
);
console.log(`✓ build-info.json : ${label}`);
