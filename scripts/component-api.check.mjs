#!/usr/bin/env node
/**
 * component-api.check.mjs — confronts each story's `argTypes` with the API the
 * MCP server publishes, read in the component sources (`scripts/lib/component-api.mjs`).
 * The story is hand-written: nothing else notices it drifting.
 *
 * Fails when:
 *   - an `argTypes` key is no input or output of any class of the entry point
 *     (renamed or removed input), unless DEMO_ARGS lists it;
 *   - the default the story announces differs from the one declared in the code,
 *     when the code default is a literal.
 *
 * Inputs missing from `argTypes` are only counted: they lack a Storybook control,
 * but the MCP server lists them anyway.
 *
 * Usage: node scripts/component-api.check.mjs
 */

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';

import ts from 'typescript';

import { extractComponentApi, ROOT } from './lib/component-api.mjs';

/** Story args that drive the demo, not an input: `Class.arg` → why. */
const DEMO_ARGS = {
  'UiAvatarGroup.size': 'taille appliquée aux avatars projetés par la démo',
};

const prop = (node, name) =>
  node.properties.find((p) => ts.isPropertyAssignment(p) && p.name.getText() === name);

/** `table.defaultValue.summary` of one `argTypes` entry, or null. */
function announcedDefault(entry) {
  const table = ts.isObjectLiteralExpression(entry) && prop(entry, 'table');
  const defaultValue =
    table &&
    ts.isObjectLiteralExpression(table.initializer) &&
    prop(table.initializer, 'defaultValue');
  const summary =
    defaultValue &&
    ts.isObjectLiteralExpression(defaultValue.initializer) &&
    prop(defaultValue.initializer, 'summary');
  return summary && ts.isStringLiteralLike(summary.initializer) ? summary.initializer.text : null;
}

/** Every object literal carrying both `component` and `argTypes` (the story meta). */
function storyMetas(file) {
  const source = ts.createSourceFile(
    file,
    readFileSync(file, 'utf8'),
    ts.ScriptTarget.Latest,
    true,
  );
  const metas = [];
  const visit = (node) => {
    if (ts.isObjectLiteralExpression(node)) {
      const component = prop(node, 'component');
      const argTypes = prop(node, 'argTypes');
      if (component && argTypes && ts.isObjectLiteralExpression(argTypes.initializer)) {
        const args = {};
        for (const entry of argTypes.initializer.properties) {
          if (!ts.isPropertyAssignment(entry)) continue;
          args[entry.name.getText().replace(/^['"]|['"]$/g, '')] = announcedDefault(
            entry.initializer,
          );
        }
        metas.push({ component: component.initializer.getText(), args });
      }
    }
    ts.forEachChild(node, visit);
  };
  visit(source);
  return metas;
}

// `'high'`, `"high"` and `high` are the same default; `true as T` is `true`.
const normalize = (value) =>
  String(value)
    .trim()
    .replace(/\s+as\s+[\w.]+$/, '')
    .replace(/^(['"`])(.*)\1$/, '$2');
const isLiteral = (value) =>
  /^(['"`].*['"`]|-?\d+(\.\d+)?|true|false|null|undefined|\[\]|\{\})$/.test(
    String(value)
      .trim()
      .replace(/\s+as\s+[\w.]+$/, ''),
  );

const api = extractComponentApi();
const problems = [];
let missing = 0;
let checked = 0;

for (const [dir, entry] of Object.entries(api)) {
  const metas = readdirSync(join(ROOT, dir))
    .filter((file) => file.endsWith('.stories.ts'))
    .flatMap((file) => storyMetas(join(ROOT, dir, file)).map((meta) => ({ ...meta, file })));
  // A story may surface a sub-component's input as a playground control.
  const entryNames = new Set(
    entry.components.flatMap((c) => [...c.inputs, ...c.outputs].map((member) => member.name)),
  );

  for (const component of entry.components) {
    for (const meta of metas.filter((m) => m.component === component.name)) {
      checked++;
      const where = `${dir}/${meta.file}`;
      for (const [arg, announced] of Object.entries(meta.args)) {
        if (entryNames.has(arg) || DEMO_ARGS[`${component.name}.${arg}`]) continue;
        problems.push(`${where} : \`${arg}\` n'est ni un input ni un output de ${entry.import}.`);
      }
      for (const input of component.inputs) {
        if (!(input.name in meta.args)) {
          missing++;
          continue;
        }
        const announced = meta.args[input.name];
        if (announced === null || input.default === undefined || !isLiteral(input.default))
          continue;
        if (normalize(announced) !== normalize(input.default)) {
          problems.push(
            `${where} : \`${input.name}\` annonce le défaut ${announced}, le code déclare ${input.default}.`,
          );
        }
      }
    }
  }
}

if (problems.length) {
  console.error(`✗ ${problems.length} écart(s) entre les stories et l'API des composants :`);
  for (const problem of problems) console.error(`  - ${problem}`);
  process.exit(1);
}
console.log(
  `✓ argTypes : ${checked} stories conformes à l'API des composants ` +
    `(${missing} input(s) sans contrôle Storybook, publiés quand même par le serveur MCP).`,
);
