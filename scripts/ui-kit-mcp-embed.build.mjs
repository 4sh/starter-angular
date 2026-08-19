#!/usr/bin/env node
/**
 * ui-kit-mcp-embed.build.mjs — embarque le serveur MCP bundlé
 * (`dist/ui-kit-mcp/`, voir `scripts/mcp-bundle.build.mjs`) dans le tarball de
 * `@4sh/ui-kit`, sous `mcp/`.
 *
 * Pourquoi ici et pas publié à part : un consommateur `npm install @4sh/ui-kit`
 * (mode librairie, sans passer par la schematic) l'a alors déjà sur son
 * disque dès l'install — `node node_modules/@4sh/ui-kit/mcp/index.js` suffit,
 * aucun registre à interroger, aucune dépendance de plus à déclarer sur
 * `@4sh/ui-kit` lui-même (le bundle est autonome).
 *
 * Tourne APRÈS `ng build ui-kit` : ng-packagr régénère `dist/ui-kit/` (et son
 * `.npmignore`) à chaque build, donc tout ajout manuel doit venir après, sous
 * peine d'être effacé. Chaîné dans `ui-kit:pack`, pas dans `ui-kit:build` —
 * inutile de re-bundler le serveur MCP à chaque `npm run serve`.
 *
 * Usage : node scripts/ui-kit-mcp-embed.build.mjs
 */
import { execSync } from 'node:child_process';
import { cpSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const MCP_DIST = join(ROOT, 'dist/ui-kit-mcp');
const DEST = join(ROOT, 'dist/ui-kit/mcp');

execSync('npm run mcp:bundle', { cwd: ROOT, stdio: 'inherit' });

if (!existsSync(join(MCP_DIST, 'index.js'))) {
  throw new Error(`[ui-kit-mcp-embed] ${MCP_DIST}/index.js introuvable après le bundle.`);
}
if (!existsSync(join(ROOT, 'dist/ui-kit'))) {
  throw new Error(
    '[ui-kit-mcp-embed] dist/ui-kit introuvable — lance `npm run ui-kit:build` avant ce script.',
  );
}

cpSync(MCP_DIST, DEST, { recursive: true });

console.log(`[ui-kit-mcp-embed] serveur MCP embarqué → ${DEST}`);
