#!/usr/bin/env node
/**
 * mcp-package.build.mjs — assemble le package publiable `dist/ui-kit-mcp/` :
 * régénère la doc (`docs:config`/`docs:search`), copie le manifeste embarqué
 * (`mcp-assets.build.mjs`), compile `src/**​/*.ts` (tsc), puis recopie à côté
 * du JS les fichiers statiques que la compilation ne touche pas (`package.json`,
 * `README.md`, `LICENSE`, `data/`). Même principe que
 * `schematics-package.build.mjs` (voir ce fichier pour le pourquoi du choix
 * tsc plutôt qu'ng-packagr).
 *
 * Usage : node scripts/mcp-package.build.mjs
 */
import { execSync } from 'node:child_process';
import { chmodSync, copyFileSync, cpSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PKG = join(ROOT, 'projects/ui-kit-mcp');
const DEST = join(ROOT, 'dist/ui-kit-mcp');

function run(cmd) {
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

// 1. Doc à jour, puis manifeste embarqué copié dans projects/ui-kit-mcp/data/.
run('npm run docs:config');
run('npm run docs:search');
run('node scripts/mcp-assets.build.mjs');

// 2. Compilation TypeScript (ESM, voir projects/ui-kit-mcp/tsconfig.json).
run(`npx tsc -p ${join(PKG, 'tsconfig.json')}`);

// 3. Fichiers statiques copiés tels quels à côté du JS compilé.
mkdirSync(DEST, { recursive: true });
copyFileSync(join(PKG, 'package.json'), join(DEST, 'package.json'));
// Apache-2.0 (§4a) : toute redistribution doit fournir une copie de la licence.
for (const name of ['README.md', 'README.fr.md', 'LICENSE']) {
  const src = join(PKG, name);
  if (existsSync(src)) copyFileSync(src, join(DEST, name));
}
cpSync(join(PKG, 'data'), join(DEST, 'data'), { recursive: true });

// 4. Bin exécutable — npm le fait à l'installation via `bin`, mais le
//    garantir ici permet de lancer `node dist/ui-kit-mcp/index.js` direct en dev.
chmodSync(join(DEST, 'index.js'), 0o755);

console.log(`[mcp-package] package assemblé → ${DEST}`);
