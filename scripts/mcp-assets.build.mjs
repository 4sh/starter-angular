#!/usr/bin/env node
/**
 * mcp-assets.build.mjs — copie dans `projects/ui-kit-mcp/data/` les artefacts
 * déjà générés par le pipeline doc du kit (`docs:config`, `docs:search`), pour
 * qu'ils voyagent AVEC le package publié `@4sh/ui-kit-mcp` (voir `src/data.ts`
 * pour le pourquoi). Suppose que `npm run docs:config && npm run docs:search`
 * ont déjà tourné — c'est `mcp-package.build.mjs` qui orchestre l'ordre.
 *
 * Usage : node scripts/mcp-assets.build.mjs
 */
import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const DEST = join(ROOT, 'projects/ui-kit-mcp/data');

const SOURCES = [
  join(ROOT, 'storybook/public/text-search-docs.json'),
  join(ROOT, 'storybook/generated/ui-config.json'),
];

mkdirSync(DEST, { recursive: true });

for (const src of SOURCES) {
  if (!existsSync(src)) {
    throw new Error(
      `[mcp-assets] ${src} n'existe pas — lance \`npm run docs:config && npm run docs:search\` avant ce script.`,
    );
  }
  copyFileSync(src, join(DEST, src.split('/').pop()));
}

console.log(`[mcp-assets] manifeste copié → ${DEST}`);
