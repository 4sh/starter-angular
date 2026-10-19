#!/usr/bin/env node
/**
 * mcp-assets.build.mjs — copie dans `projects/ui-kit-mcp/data/` les artefacts
 * déjà générés par le pipeline doc du kit (`docs:config`, `docs:search`), pour
 * qu'ils voyagent AVEC le package publié `@4sh/ui-kit-mcp` (voir `src/data.ts`
 * pour le pourquoi). Suppose que `pnpm docs:config && pnpm docs:search`
 * ont déjà tourné — c'est `mcp-package.build.mjs` qui orchestre l'ordre.
 *
 * Y écrit aussi `component-api.json` : les inputs et outputs de chaque composant,
 * lus dans ses sources par le compilateur TypeScript (`scripts/lib/component-api.mjs`).
 *
 * Usage : node scripts/mcp-assets.build.mjs
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

import { extractComponentApi } from './lib/component-api.mjs';

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
      `[mcp-assets] ${src} n'existe pas : lance \`pnpm docs:config && pnpm docs:search\` avant ce script.`,
    );
  }
  copyFileSync(src, join(DEST, src.split('/').pop()));
}

const api = extractComponentApi();
writeFileSync(
  join(DEST, 'component-api.json'),
  `${JSON.stringify({ $generatedBy: 'scripts/mcp-assets.build.mjs', entries: api }, null, 2)}\n`,
);
const classes = Object.values(api).flatMap((e) => e.components);
const inputs = classes.reduce((n, c) => n + c.inputs.length, 0);
const outputs = classes.reduce((n, c) => n + c.outputs.length, 0);

console.log(`[mcp-assets] manifeste copié → ${DEST}`);
console.log(
  `[mcp-assets] API : ${Object.keys(api).length} points d'entrée, ${classes.length} classes, ` +
    `${inputs} inputs, ${outputs} outputs.`,
);
