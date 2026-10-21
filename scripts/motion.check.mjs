#!/usr/bin/env node
/**
 * motion.check.mjs — vérifie qu'aucun composant ne décide de son timing à la main.
 *
 * Pourquoi : le mouvement passe par des jetons (FSHSP-252). Les primitives
 * `--transition-*` portent les valeurs, les recettes `--motion-*` les associent à un
 * usage, et le kit les lit à travers `ui-config` et les mixins `utils`. Une durée ou
 * une courbe écrite dans le SCSS d'un composant échappe à tout cela : elle ne suit ni
 * un recadençage du kit, ni le mode `Reduced` du mouvement réduit.
 *
 * Règles vérifiées, dans le SCSS de `projects/ui-kit/` hors `styles/settings` (où les
 * recettes choisissent leurs primitives) et `styles/generated` :
 *   A. pas de durée brute (`180ms`, `1.2s`) dans une déclaration `transition*` ou
 *      `animation*`, ni dans une variable `$…-duration` / `$…-delay` ;
 *   B. pas de courbe brute (`ease-out`, `linear`, `cubic-bezier(…)`) dans ces
 *      mêmes déclarations ;
 *   C. pas de lecture directe d'une primitive `var(--transition-*)` : un composant lit
 *      une recette.
 * `0`, `0ms`, `0s` et `0.01ms` (les coupe-circuits) restent permis.
 *
 * Une exception se déclare dans `ALLOWED`, avec sa raison : elle se voit dans la
 * sortie, et une exception devenue inutile fait échouer la vérification.
 *
 * Usage : node scripts/motion.check.mjs
 */

import { readdirSync, readFileSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const KIT = join(ROOT, 'projects/ui-kit');
const SKIPPED_DIRS = ['styles/settings', 'styles/generated'];
// Generated list of every hook at its shipped value (component-vars.build.mjs).
const SKIPPED_FILES = ['styles/component-vars.scss'];

/** Fichier (relatif à `projects/ui-kit`) → raison de l'exception. */
export const ALLOWED = {
  'informative/ui-skeleton/src/lib/ui-skeleton.scss':
    'boucle infinie : attend la recette `loop` (atelier FSHSP-252).',
  'informative/ui-spinner/src/lib/ui-spinner.scss':
    'boucle infinie : attend la recette `loop` (atelier FSHSP-252).',
  'informative/ui-progress-bar/src/lib/ui-progress-bar.scss':
    'boucle infinie : attend la recette `loop` (atelier FSHSP-252).',
};

/** Value of every `transition*` / `animation*` declaration on a line. */
const TIMED_DECLARATION = /(?:^|[\s{;])(?:transition|animation)(?:-[a-z-]+)?\s*:([^;}]*)/g;
/** Value of a `$…-duration` / `$…-delay` variable. */
const TIMING_VARIABLE = /^\s*\$[\w-]*(?:duration|delay)[\w-]*\s*:([^;]*)/;
const RAW_DURATION = /(?<![\w.-])(\d*\.?\d+)(?:ms|s)\b/g;
const RAW_EASING =
  /(?<![\w-])(?:ease(?:-in-out|-in|-out)?|linear|step-start|step-end)(?![\w-])|(?<![\w-])(?:cubic-bezier|steps)\(/;
const PRIMITIVE = /var\(--transition-[\w-]+/;
const KILL_SWITCH = new Set(['0', '0.01']);

/** A duration other than a kill switch (`0`, `0ms`, `0.01ms`). */
const hasRawDuration = (value) =>
  [...value.matchAll(RAW_DURATION)].some(([, n]) => !KILL_SWITCH.has(String(Number(n))));

/** Problèmes de mouvement d'un fichier SCSS : [{ line, rule, text }]. */
export function findMotionProblems(source) {
  const problems = [];
  source.split('\n').forEach((raw, i) => {
    // Comments (`//`, `///` docs) never carry timing; keyframe and class names never a curve.
    const line = raw.replace(/\/\/.*$/, '');
    const report = (rule) => problems.push({ line: i + 1, rule, text: raw.trim() });
    const declarations = [...line.matchAll(TIMED_DECLARATION)].map(([, value]) => value);
    const variable = TIMING_VARIABLE.exec(line)?.[1];
    if ([...declarations, variable].some((v) => v !== undefined && hasRawDuration(v))) report('A');
    if (declarations.some((v) => RAW_EASING.test(v.replace(/(?<![\w-])ui-[\w-]+/g, ''))))
      report('B');
    if (PRIMITIVE.test(line)) report('C');
  });
  return problems;
}

function scssFiles(dir) {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) return entry.name === 'node_modules' ? [] : scssFiles(full);
    return entry.name.endsWith('.scss') ? [full] : [];
  });
}

const RULES = {
  A: 'durée écrite à la main',
  B: 'courbe écrite à la main',
  C: 'primitive --transition-* lue directement',
};

function main() {
  const failures = [];
  const allowedHits = new Set();
  for (const file of scssFiles(KIT)) {
    const rel = relative(KIT, file).split(sep).join('/');
    if (SKIPPED_DIRS.some((d) => rel.startsWith(`${d}/`)) || SKIPPED_FILES.includes(rel)) continue;
    const problems = findMotionProblems(readFileSync(file, 'utf8'));
    if (!problems.length) continue;
    if (ALLOWED[rel]) {
      allowedHits.add(rel);
      continue;
    }
    for (const p of problems)
      failures.push(`  ${rel}:${p.line} (${RULES[p.rule]})\n      ${p.text}`);
  }
  const unused = Object.keys(ALLOWED).filter((rel) => !allowedHits.has(rel));
  for (const rel of unused) {
    failures.push(`  ${rel} : exception devenue inutile, la retirer de ALLOWED (motion.check.mjs)`);
  }

  if (failures.length) {
    console.error(
      `✗ Mouvement : ${failures.length} problème(s).\n${failures.join('\n')}\n\n` +
        `Un composant lit une recette --motion-* (via ui-config ou les mixins utils) : ` +
        `une valeur écrite à la main ne suit ni un recadençage du kit ni le mouvement réduit.`,
    );
    process.exit(1);
  }
  const note = allowedHits.size
    ? ` ${allowedHits.size} exception(s) : ${[...new Set(Object.values(ALLOWED))].join(' ')}`
    : '';
  console.log(`✓ Mouvement : aucun timing écrit à la main dans les composants.${note}`);
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? '').href) main();
