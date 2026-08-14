#!/usr/bin/env node
/**
 * schematics-package.build.mjs — assemble le package publiable
 * `dist/ui-kit-schematics/` : compile `src/**​/*.ts` (tsc, voir
 * `projects/ui-kit-schematics/tsconfig.json`) puis copie à côté les fichiers
 * statiques que la compilation ne touche pas (`collection.json`,
 * `package.json`, les `schema.json`, et `assets/` — alimenté par
 * `schematics-assets.build.mjs`).
 *
 * Pendant réplique volontairement `ui-kit:build` (ng-packagr + copie
 * manuelle des styles) : même idée, pipeline différent (voir FSHSP-109 —
 * ng-packagr et @angular-devkit/schematics ne peuvent pas partager un build).
 *
 * Usage : node scripts/schematics-package.build.mjs
 */

import { execSync } from 'node:child_process';
import { cpSync, copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PKG = join(ROOT, 'projects/ui-kit-schematics');
const DEST = join(ROOT, 'dist/ui-kit-schematics');

function run(cmd) {
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

// 1. Sources brutes à jour (composants, styles, pipeline de tokens).
run('node scripts/schematics-assets.build.mjs');

// 2. Compilation TypeScript des schematics (préserve le préfixe `src/` —
//    `collection.json` référence ses factories en `./src/...`).
run(`npx tsc -p ${join(PKG, 'tsconfig.json')}`);

// 3. Fichiers statiques copiés tels quels à côté du JS compilé.
mkdirSync(DEST, { recursive: true });
copyFileSync(join(PKG, 'collection.json'), join(DEST, 'collection.json'));
copyFileSync(join(PKG, 'package.json'), join(DEST, 'package.json'));
for (const name of ['README.md', 'README.fr.md']) {
  const src = join(PKG, name);
  if (existsSync(src)) copyFileSync(src, join(DEST, name));
}
// `schema.json` n'est pas un `.ts` : tsc ne le copie pas tout seul.
cpSync(join(PKG, 'src'), join(DEST, 'src'), {
  recursive: true,
  filter: (path) => !path.endsWith('.ts'),
});
cpSync(join(PKG, 'assets'), join(DEST, 'assets'), { recursive: true });

console.log(`[schematics-package] package assemblé → ${DEST}`);
