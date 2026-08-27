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
import { cpSync, copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve, sep } from 'node:path';
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
run(`pnpm exec tsc -p ${join(PKG, 'tsconfig.json')}`);

// 3. Fichiers statiques copiés tels quels à côté du JS compilé.
mkdirSync(DEST, { recursive: true });
copyFileSync(join(PKG, 'collection.json'), join(DEST, 'collection.json'));

// Version alignée sur celle du kit, au moment de l'assemblage. La façade de
// `@4sh/ui-kit` demande le compagnon en `^<version du kit>` (voir
// projects/ui-kit/schematics/index.cjs) : une version propre au compagnon
// pourrait ne pas satisfaire cette plage, et `ng add` échouerait à
// l'installation. Le numéro écrit dans `projects/ui-kit-schematics/package.json`
// n'est donc qu'un repère de développement — c'est celui du kit qui est publié.
const companionPkg = JSON.parse(readFileSync(join(PKG, 'package.json'), 'utf8'));
const kitVersion = JSON.parse(
  readFileSync(join(ROOT, 'projects/ui-kit/package.json'), 'utf8'),
).version;
companionPkg.version = kitVersion;
writeFileSync(join(DEST, 'package.json'), JSON.stringify(companionPkg, null, 2) + '\n');
// LICENSE inclus : l'Apache-2.0 (§4a) demande que toute redistribution en
// fournisse une copie, et ce package est précisément fait pour que son contenu
// soit recopié ailleurs.
for (const name of ['README.md', 'README.fr.md', 'LICENSE']) {
  const src = join(PKG, name);
  if (existsSync(src)) copyFileSync(src, join(DEST, name));
}
// `schema.json` n'est pas un `.ts` : tsc ne le copie pas tout seul.
// Les `files/` échappent au filtre : ce sont des scaffolds pour le projet
// consommateur (`preview.ts`, `myTheme.ts`…), exclus de la compilation
// justement parce qu'ils doivent partir tels quels — les filtrer ici les
// ferait disparaître du package sans que rien ne le signale.
cpSync(join(PKG, 'src'), join(DEST, 'src'), {
  recursive: true,
  filter: (path) => !path.endsWith('.ts') || path.includes(`${sep}files${sep}`),
});
cpSync(join(PKG, 'assets'), join(DEST, 'assets'), { recursive: true });

console.log(`[schematics-package] package assemblé → ${DEST}`);
