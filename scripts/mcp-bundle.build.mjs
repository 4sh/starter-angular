#!/usr/bin/env node
/**
 * mcp-bundle.build.mjs — assemble le serveur MCP (`projects/ui-kit-mcp/`) en un
 * artefact autonome : `dist/ui-kit-mcp/index.js`, un seul fichier ESM qui
 * embarque le SDK MCP, Zod et MiniSearch (esbuild `--bundle`), plus son
 * manifeste doc à côté (`data/`, copié tel quel — jamais bundlé : voir
 * `src/data.ts`, qui le lit par `readFileSync` au runtime, pas par `import`).
 *
 * `@4sh/ui-kit-mcp` n'est PAS publié sur npm : ce dossier n'est qu'un artefact
 * de build intermédiaire, embarqué ensuite par deux consommateurs :
 *   - `scripts/ui-kit-mcp-embed.build.mjs` → `dist/ui-kit/mcp/` (mode librairie) ;
 *   - `scripts/schematics-assets.build.mjs` → `assets/mcp-server/` (mode starter,
 *     copié par `ng add` dans le projet consommateur).
 * Bundler plutôt que publier : zéro dépendance npm à résoudre chez le
 * consommateur (`node index.js` suffit), et zéro registre à interroger — le
 * fichier voyage avec le tarball qui l'embarque, quel qu'il soit.
 *
 * Usage : node scripts/mcp-bundle.build.mjs
 */
import { execSync } from 'node:child_process';
import { copyFileSync, cpSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as esbuild from 'esbuild';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const PKG = join(ROOT, 'projects/ui-kit-mcp');
const DEST = join(ROOT, 'dist/ui-kit-mcp');

function run(cmd) {
  execSync(cmd, { cwd: ROOT, stdio: 'inherit' });
}

// 1. Doc à jour, puis manifeste embarqué copié dans projects/ui-kit-mcp/data/.
run('pnpm docs:config');
run('pnpm docs:search');
run('node scripts/mcp-assets.build.mjs');

// 2. Bundle ESM autonome — `platform: 'node'` laisse les built-ins (node:fs,
//    node:path…) en `import` natif ; tout le reste (le SDK MCP, ses propres
//    dépendances, zod, minisearch) est inliné dans le fichier de sortie.
//    Nettoyé d'abord : sinon un artefact d'un ancien pipeline (ex. les .js
//    éclatés de la version tsc précédente) survivrait ici, et se retrouverait
//    embarqué dans les deux tarballs qui copient ce dossier tel quel.
rmSync(DEST, { recursive: true, force: true });
mkdirSync(DEST, { recursive: true });
await esbuild.build({
  entryPoints: [join(PKG, 'src/index.ts')],
  outfile: join(DEST, 'index.js'),
  bundle: true,
  platform: 'node',
  format: 'esm',
  target: 'node18',
  minify: false,
  sourcemap: false,
  banner: {
    js: '// @4sh/ui-kit-mcp — bundle généré par scripts/mcp-bundle.build.mjs, ne pas éditer à la main.',
  },
});

// 3. Fichiers statiques copiés tels quels à côté du bundle.
cpSync(join(PKG, 'data'), join(DEST, 'data'), { recursive: true });
// `package.json` : NE PAS supprimer de l'artefact, malgré son air de métadonnée
// inerte. Il porte deux choses dont le bundle dépend au runtime :
//   - `type: module`, qui fait lire `index.js` comme ESM. En mode starter la
//     copie atterrit dans un projet Angular (CommonJS) : sans lui, Node 18 —
//     le plancher déclaré par `engines` — échoue sèchement, et les versions
//     plus récentes ne s'en sortent qu'en émettant un avertissement sur
//     stderr, c'est-à-dire dans le transport stdio du serveur ;
//   - `version`, lue par `src/server.ts` et annoncée au client MCP. Sans ce
//     fichier, la lecture remonte d'un cran et rapporte la version du paquet
//     hôte (l'appli du consommateur en mode starter).
//
// Cette `version` est tamponnée depuis celle du kit, au moment de l'assemblage —
// même parti que `scripts/schematics-package.build.mjs`. Ce que le serveur
// annonce au client, c'est la version de la doc qu'il sert : un agent qui
// interroge le MCP doit pouvoir la rapprocher du `@4sh/ui-kit` installé. Un
// numéro propre au serveur ne voulait rien dire pour personne, et figeait à
// 0.1.0 quel que soit le kit embarquant le bundle. Le numéro écrit dans
// `projects/ui-kit-mcp/package.json` n'est donc qu'un repère de développement.
//
// `private: true` en revanche n'a pas sa place dans un paquet publié : au mieux
// inerte, au pire trompeur (il a déjà fait conclure à tort que le serveur MCP
// n'était pas livré, cf. FSHSP-146). Il reste dans la source, où il garde son
// sens de garde-fou contre un `npm publish` lancé depuis `projects/ui-kit-mcp/`.
const mcpManifest = JSON.parse(readFileSync(join(PKG, 'package.json'), 'utf8'));
delete mcpManifest.private;
mcpManifest.version = JSON.parse(
  readFileSync(join(ROOT, 'projects/ui-kit/package.json'), 'utf8'),
).version;
writeFileSync(join(DEST, 'package.json'), `${JSON.stringify(mcpManifest, null, 2)}\n`);
// Apache-2.0 (§4a) : toute redistribution doit fournir une copie de la licence
// — et ce bundle est redistribué, deux fois (voir les deux embed scripts).
copyFileSync(join(PKG, 'LICENSE'), join(DEST, 'LICENSE'));

console.log(`[mcp-bundle] serveur MCP bundlé → ${DEST}`);
