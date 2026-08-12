#!/usr/bin/env node
/**
 * components.check.mjs — vérifie que les listes de composants écrites à la main
 * correspondent aux entry points réellement présents dans `projects/ui-kit/`.
 *
 * Pourquoi : le kit est énuméré à quatre endroits (les deux README du package,
 * l'index de composants, la page Storybook « Composants »). Rien ne les reliait,
 * et ils avaient divergé — d'où un décompte annoncé faux. Générer ces listes
 * n'est pas possible sans inventer de la métadonnée (le regroupement par famille
 * et l'ordre pédagogique sont des choix éditoriaux, pas des faits du disque) :
 * on les valide donc au lieu de les produire.
 *
 * Règles vérifiées :
 *   A. table des familles des README (EN + FR) == entry points du disque
 *   B. tout entry point porteur d'une story est présenté dans `Overview.mdx`
 *   C. tout entry point est coché ✅ dans `components-index.md`
 *
 * L'index peut légitimement contenir en plus : des ✅ pour des composants livrés
 * dans l'entry point d'un autre (`ui-file-upload-list`), et des ⬜ pour ceux
 * restant à construire.
 *
 * Usage : node scripts/components.check.mjs
 */

import { readdirSync, readFileSync, existsSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const KIT = join(ROOT, 'projects/ui-kit');

const READMES = [
  { file: join(KIT, 'README.md'), heading: '### Available entry points' },
  { file: join(KIT, 'README.fr.md'), heading: '### Entry points disponibles' },
];
const OVERVIEW = join(ROOT, 'storybook/docs/Overview.mdx');
const INDEX = join(ROOT, 'src/app/shared/components/components-index.md');

/** Entry points du disque : un dossier `ui-*` portant un `ng-package.json`. */
function entryPointsOnDisk() {
  return readdirSync(KIT, { withFileTypes: true })
    .filter((e) => e.isDirectory() && e.name.startsWith('ui-'))
    .filter((e) => existsSync(join(KIT, e.name, 'ng-package.json')))
    .map((e) => e.name)
    .sort();
}

/**
 * Composants cités dans la table des familles d'un README : premier bloc de
 * lignes `|` suivant le titre de section. Les tables voisines (entry points
 * transverses, exports de `forms`) citent aussi des `ui-*` en prose — d'où le
 * découpage strict plutôt qu'un scan du fichier entier.
 */
function componentsInReadme(file, heading) {
  const lines = readFileSync(file, 'utf8').split('\n');
  const start = lines.findIndex((l) => l.trim() === heading);
  if (start === -1) throw new Error(`${file} : section « ${heading} » introuvable.`);

  const table = [];
  let seen = false;
  for (const line of lines.slice(start + 1)) {
    if (line.startsWith('|')) {
      seen = true;
      table.push(line);
    } else if (seen) break;
  }
  if (!table.length) throw new Error(`${file} : aucune table sous « ${heading} ».`);

  return [...new Set(table.join('\n').match(/`ui-[a-z0-9-]+`/g) ?? [])]
    .map((t) => t.replaceAll('`', ''))
    .sort();
}

/** Chemins `projects/ui-kit/<name>/` importés par la page « Composants ». */
function componentsInOverview() {
  const src = readFileSync(OVERVIEW, 'utf8');
  return [...new Set([...src.matchAll(/projects\/ui-kit\/(ui-[a-z0-9-]+)\//g)].map((m) => m[1]))].sort();
}

/** Composants cochés ✅ dans l'index. */
function checkedInIndex() {
  const src = readFileSync(INDEX, 'utf8');
  return [...new Set([...src.matchAll(/^- ✅ `(ui-[a-z0-9-]+)`/gm)].map((m) => m[1]))].sort();
}

const diff = (a, b) => a.filter((x) => !b.includes(x));

const disk = entryPointsOnDisk();
const errors = [];

for (const { file, heading } of READMES) {
  const listed = componentsInReadme(file, heading);
  const label = file.replace(`${ROOT}/`, '');
  const missing = diff(disk, listed);
  const extra = diff(listed, disk);
  if (missing.length) errors.push(`${label} : entry points absents de la table — ${missing.join(', ')}`);
  if (extra.length) errors.push(`${label} : table citant des entry points inexistants — ${extra.join(', ')}`);
}

const overview = componentsInOverview();
const withStories = disk.filter((name) =>
  readdirSync(join(KIT, name)).some((f) => f.endsWith('.stories.ts')),
);
const missingFromOverview = diff(withStories, overview);
if (missingFromOverview.length) {
  errors.push(
    `storybook/docs/Overview.mdx : composants avec story mais absents de la page — ${missingFromOverview.join(', ')}`,
  );
}
const staleOverview = diff(overview, disk);
if (staleOverview.length) {
  errors.push(`storybook/docs/Overview.mdx : imports pointant un entry point inexistant — ${staleOverview.join(', ')}`);
}

const uncheckedInIndex = diff(disk, checkedInIndex());
if (uncheckedInIndex.length) {
  errors.push(
    `src/app/shared/components/components-index.md : entry points livrés mais non cochés ✅ — ${uncheckedInIndex.join(', ')}`,
  );
}

if (errors.length) {
  console.error('✗ Listes de composants désynchronisées :\n');
  for (const e of errors) console.error(`  - ${e}`);
  console.error('\nCorrigez la liste fautive, ou le disque si un entry point manque.');
  process.exit(1);
}

console.log(`✓ ${disk.length} entry points — README (EN/FR), Overview.mdx et components-index.md sont à jour.`);
