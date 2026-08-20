#!/usr/bin/env node
/**
 * changelog.section.mjs — extrait de `CHANGELOG.md` le corps de la section
 * d'une version, et échoue si elle n'existe pas.
 *
 * Pourquoi : la release GitHub est créée par la CI à partir du CHANGELOG. Une
 * release vide serait pire que pas de release — elle donnerait l'illusion que
 * la version n'a rien changé. Ce script transforme donc l'oubli de l'étape
 * « déplacer `[Unreleased]` vers `[X.Y.Z]` » (voir docs/VERSIONING.md) en échec
 * explicite, et le workflow l'appelle **dès le job `verify`** : la faute est
 * signalée pendant le `dry_run`, avant la publication irréversible.
 *
 * Le corps est rendu tel quel : les liens du CHANGELOG sont relatifs au dépôt,
 * et GitHub les résout correctement dans le texte d'une release.
 *
 * Usage : node scripts/changelog.section.mjs <version>
 *   ex.  : node scripts/changelog.section.mjs 0.1.1
 */

import { readFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const CHANGELOG = join(ROOT, 'CHANGELOG.md');

/** Une section de version : `## [X.Y.Z] - YYYY-MM-DD`. `[Unreleased]` en est une. */
const isSectionHeader = (line) => line.startsWith('## [');

function fail(message) {
  console.error(`✗ ${message}`);
  process.exit(1);
}

const version = process.argv[2];
if (!version) fail('version manquante — usage : node scripts/changelog.section.mjs <version>');

const lines = readFileSync(CHANGELOG, 'utf8').split('\n');
const header = `## [${version}]`;
const start = lines.findIndex((line) => line.startsWith(header));

if (start === -1) {
  // Lister ce qui existe : l'erreur la plus fréquente est un décalage d'une
  // version entre `package.json` et le CHANGELOG, invisible sans la liste.
  const known = lines.filter(isSectionHeader).map((l) => l.slice(3).split(']')[0].concat(']'));
  fail(
    `CHANGELOG.md ne contient aucune section « ${header} ».\n` +
      `  Sections présentes : ${known.join(', ') || '(aucune)'}\n` +
      `  Déplacez le contenu de [Unreleased] vers une section [${version}] — voir docs/VERSIONING.md.`,
  );
}

const rest = lines.slice(start + 1);
const end = rest.findIndex(isSectionHeader);
const body = (end === -1 ? rest : rest.slice(0, end)).join('\n').trim();

if (!body) {
  fail(
    `la section « ${header} » de CHANGELOG.md est vide — une release sans notes n'a pas d'intérêt.`,
  );
}

process.stdout.write(`${body}\n`);
