#!/usr/bin/env node
/**
 * component-vars.build.mjs — emits the kit's customisation surface:
 *
 *   projects/ui-kit/styles/component-vars.scss   every `--ui-*` variable at its
 *                                                shipped value, ready to copy
 *   figma/component-vars.json                    the same list in DTCG form (same
 *                                                shape as src/design-tokens/*.json)
 *
 * VALUES come from the CSS Sass actually compiles, not from reading the SCSS:
 * `rem-calc(44px - 2 * $gutter)` has to be evaluated, not guessed. DESCRIPTIONS come
 * from the `///` comments, via the docs.config.mjs manifest.
 *
 * `--check` also confronts the counts quoted in figma/README.md with the ones computed
 * here: that prose is hand-written, so nothing else would notice it going stale.
 *
 * Usage:
 *   node scripts/component-vars.build.mjs           # generate
 *   node scripts/component-vars.build.mjs --check   # fail if stale or off-convention
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, isAbsolute, join, relative, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import * as sass from 'sass';

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const KIT = join(ROOT, 'projects/ui-kit');
const STYLES = join(KIT, 'styles');
const MANIFEST_FILE = join(ROOT, 'storybook/generated/ui-config.json');
const SCSS_OUT = join(STYLES, 'component-vars.scss');
const JSON_OUT = join(ROOT, 'figma/component-vars.json');
// Prose, hand-written — but it quotes the counts of the file above. Nothing regenerates
// it, so `--check` confronts its figures with the ones just computed (see step 8).
const JSON_README = join(ROOT, 'figma/README.md');
// Served by Storybook (staticDirs) for the doc page's download button. Byproduct:
// regenerated on every build, never committed.
const PUBLIC_COPY = join(ROOT, 'storybook/public/component-vars.scss');

const TOKENS_CONFIG = JSON.parse(readFileSync(join(ROOT, 'tokens.config.json'), 'utf8'));
const TOKENS_SRC = isAbsolute(TOKENS_CONFIG.sourceRoot)
  ? TOKENS_CONFIG.sourceRoot
  : join(ROOT, TOKENS_CONFIG.sourceRoot);

// The Figma file that OWNS the variable collections (see CLAUDE.md): in the UI Kit
// they are `remote`, hence read-only.
const TARGET_FILE_KEY = 'lH4jhyZFkIeJ1Ob1tlY7Wm';
const COLLECTION = 'component-vars';
const REM_BASE = 16;

// --- Naming vocabulary ------------------------------------------------------
// `--ui-{family}[-{part}]-{property}[-{modifier}]`, modifier last — same rule as the
// tokens (`actions-high-surface-hover`). An unparsable name fails the build.

const MODIFIERS = new Set([
  'small',
  'large',
  'tiny',
  'compact',
  'dense',
  '2xs',
  'xs',
  'sm',
  'md',
  'lg',
  'xl',
  '2xl',
  '3xl',
  'active',
  'disabled',
  'hover',
  'focus',
  'pressed',
  'checked',
  'selected',
  'indeterminate',
  'vertical',
  'horizontal',
  'inline',
  'rounded',
  'square',
  'open',
  'closed',
  'collapsed',
  'expanded',
  'flush',
  'first',
  'last',
  'dark',
  'light',
  'overlay',
  'inset',
  'removable',
  'custom',
  'multiline',
  'side',
  'edge',
  'outside',
  'default',
]);

/**
 * property → { French label, display group, Figma type + scopes }.
 * `bindable: false` = no Figma variable equivalent (duration, easing, cursor…).
 */
const PROPERTIES = {
  // Dimensions
  size: { fr: 'Taille', group: 'dimensions', type: 'FLOAT', scopes: ['WIDTH_HEIGHT'] },
  height: { fr: 'Hauteur', group: 'dimensions', type: 'FLOAT', scopes: ['WIDTH_HEIGHT'] },
  'min-height': {
    fr: 'Hauteur minimale',
    group: 'dimensions',
    type: 'FLOAT',
    scopes: ['WIDTH_HEIGHT'],
  },
  'max-height': {
    fr: 'Hauteur maximale',
    group: 'dimensions',
    type: 'FLOAT',
    scopes: ['WIDTH_HEIGHT'],
  },
  width: { fr: 'Largeur', group: 'dimensions', type: 'FLOAT', scopes: ['WIDTH_HEIGHT'] },
  'min-width': {
    fr: 'Largeur minimale',
    group: 'dimensions',
    type: 'FLOAT',
    scopes: ['WIDTH_HEIGHT'],
  },
  'max-width': {
    fr: 'Largeur maximale',
    group: 'dimensions',
    type: 'FLOAT',
    scopes: ['WIDTH_HEIGHT'],
  },
  length: { fr: 'Longueur', group: 'dimensions', type: 'FLOAT', scopes: ['WIDTH_HEIGHT'] },
  thickness: { fr: 'Épaisseur', group: 'dimensions', type: 'FLOAT', scopes: ['WIDTH_HEIGHT'] },
  'aspect-ratio': {
    fr: 'Ratio',
    group: 'dimensions',
    type: 'FLOAT',
    scopes: ['ALL_SCOPES'],
    bindable: false,
  },

  // Spacing
  padding: { fr: 'Inset', group: 'spacing', type: 'FLOAT', scopes: ['GAP'] },
  'padding-x': { fr: 'Inset horizontal', group: 'spacing', type: 'FLOAT', scopes: ['GAP'] },
  'padding-y': { fr: 'Inset vertical', group: 'spacing', type: 'FLOAT', scopes: ['GAP'] },
  'padding-top': { fr: 'Inset haut', group: 'spacing', type: 'FLOAT', scopes: ['GAP'] },
  'padding-bottom': { fr: 'Inset bas', group: 'spacing', type: 'FLOAT', scopes: ['GAP'] },
  'padding-left': { fr: 'Inset gauche', group: 'spacing', type: 'FLOAT', scopes: ['GAP'] },
  'padding-right': { fr: 'Inset droit', group: 'spacing', type: 'FLOAT', scopes: ['GAP'] },
  'padding-inline': { fr: 'Inset horizontal', group: 'spacing', type: 'FLOAT', scopes: ['GAP'] },
  'padding-block': { fr: 'Inset vertical', group: 'spacing', type: 'FLOAT', scopes: ['GAP'] },
  'padding-inline-start': {
    fr: 'Inset de début',
    group: 'spacing',
    type: 'FLOAT',
    scopes: ['GAP'],
  },
  'padding-inline-end': { fr: 'Inset de fin', group: 'spacing', type: 'FLOAT', scopes: ['GAP'] },
  gap: { fr: 'Espacement', group: 'spacing', type: 'FLOAT', scopes: ['GAP'] },
  indent: { fr: 'Retrait', group: 'spacing', type: 'FLOAT', scopes: ['GAP'] },
  overlap: { fr: 'Chevauchement', group: 'spacing', type: 'FLOAT', scopes: ['GAP'] },
  offset: { fr: 'Décalage', group: 'spacing', type: 'FLOAT', scopes: ['WIDTH_HEIGHT'] },
  'offset-x': {
    fr: 'Décalage horizontal',
    group: 'spacing',
    type: 'FLOAT',
    scopes: ['WIDTH_HEIGHT'],
  },
  'offset-y': {
    fr: 'Décalage vertical',
    group: 'spacing',
    type: 'FLOAT',
    scopes: ['WIDTH_HEIGHT'],
  },
  distance: { fr: 'Distance', group: 'spacing', type: 'FLOAT', scopes: ['WIDTH_HEIGHT'] },

  // Borders & radii
  radius: { fr: 'Rayon des coins', group: 'border', type: 'FLOAT', scopes: ['CORNER_RADIUS'] },
  'stroke-width': {
    fr: 'Épaisseur de bordure',
    group: 'border',
    type: 'FLOAT',
    scopes: ['STROKE_FLOAT'],
  },
  'border-width': {
    fr: 'Épaisseur de bordure',
    group: 'border',
    type: 'FLOAT',
    scopes: ['STROKE_FLOAT'],
  },
  'focus-ring-width': {
    fr: "Épaisseur de l'anneau de focus",
    group: 'border',
    type: 'FLOAT',
    scopes: ['STROKE_FLOAT'],
  },

  // Typography
  'font-size': {
    fr: 'Taille de police',
    group: 'typography',
    type: 'FLOAT',
    scopes: ['FONT_SIZE'],
  },
  'line-height': { fr: 'Interligne', group: 'typography', type: 'FLOAT', scopes: ['LINE_HEIGHT'] },
  weight: {
    fr: 'Graisse',
    group: 'typography',
    type: 'STRING',
    scopes: ['FONT_WEIGHT', 'FONT_STYLE'],
  },

  // Colours
  color: { fr: 'Couleur', group: 'color', type: 'COLOR', scopes: ['ALL_FILLS'] },
  background: { fr: 'Fond', group: 'color', type: 'COLOR', scopes: ['FRAME_FILL', 'SHAPE_FILL'] },
  surface: { fr: 'Fond', group: 'color', type: 'COLOR', scopes: ['FRAME_FILL', 'SHAPE_FILL'] },
  stroke: { fr: 'Couleur de bordure', group: 'color', type: 'COLOR', scopes: ['STROKE_COLOR'] },
  shine: { fr: 'Teinte du reflet', group: 'color', type: 'COLOR', scopes: ['ALL_FILLS'] },
  fill: {
    fr: 'Remplissage',
    group: 'color',
    type: 'FLOAT',
    scopes: ['ALL_SCOPES'],
    bindable: false,
  },

  // Motion
  duration: {
    fr: 'Durée',
    group: 'motion',
    type: 'FLOAT',
    scopes: ['ALL_SCOPES'],
    bindable: false,
  },
  delay: { fr: 'Délai', group: 'motion', type: 'FLOAT', scopes: ['ALL_SCOPES'], bindable: false },
  easing: {
    fr: 'Courbe de transition',
    group: 'motion',
    type: 'STRING',
    scopes: ['ALL_SCOPES'],
    bindable: false,
  },
  scale: { fr: 'Échelle', group: 'motion', type: 'FLOAT', scopes: ['ALL_SCOPES'], bindable: false },

  // Misc
  opacity: { fr: 'Opacité', group: 'misc', type: 'FLOAT', scopes: ['OPACITY'] },
  shadow: { fr: 'Ombre', group: 'misc', type: 'FLOAT', scopes: ['EFFECT_FLOAT'] },
  'z-index': {
    fr: 'Plan de superposition',
    group: 'misc',
    type: 'FLOAT',
    scopes: ['ALL_SCOPES'],
    bindable: false,
  },
  top: {
    fr: 'Décalage haut',
    group: 'spacing',
    type: 'FLOAT',
    scopes: ['WIDTH_HEIGHT'],
    bindable: false,
  },
  cursor: { fr: 'Curseur', group: 'misc', type: 'STRING', scopes: ['ALL_SCOPES'], bindable: false },
  'object-fit': {
    fr: 'Cadrage du média',
    group: 'misc',
    type: 'STRING',
    scopes: ['ALL_SCOPES'],
    bindable: false,
  },
  'text-decoration': {
    fr: 'Décoration du texte',
    group: 'misc',
    type: 'STRING',
    scopes: ['ALL_SCOPES'],
    bindable: false,
  },
  columns: {
    fr: 'Colonnes',
    group: 'misc',
    type: 'FLOAT',
    scopes: ['ALL_SCOPES'],
    bindable: false,
  },
};

const GROUPS = [
  ['dimensions', 'Dimensions'],
  ['spacing', 'Espacements'],
  ['border', 'Bordures & rayons'],
  ['typography', 'Typographie'],
  ['color', 'Couleurs'],
  ['motion', 'Motion'],
  ['misc', 'Divers'],
];

/** A part that implies text: the colour then carries the TEXT_FILL scope. */
const TEXT_PARTS = new Set(['label', 'text', 'content', 'title', 'subtitle', 'message', 'caption']);

// --- 1. Values: read from the compiled CSS ---------------------------------

function walk(dir, out = [], test = (n) => /^(ui|sp)-[\w-]+\.scss$/.test(n)) {
  for (const e of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, e.name);
    if (e.isDirectory()) {
      if (e.name !== 'styles') walk(full, out, test);
    } else if (test(e.name)) out.push(full);
  }
  return out;
}

/** End of the `var(` opened at `start` (balanced parens). */
function closingParen(text, start) {
  let depth = 0;
  for (let i = start; i < text.length; i++) {
    if (text[i] === '(') depth++;
    else if (text[i] === ')') {
      depth--;
      if (depth === 0) return i;
    }
  }
  return -1;
}

/** Every `var(--ui-x, default)` in a CSS string, nested ones included. */
function extractHooks(css, out = new Map()) {
  const re = /var\(\s*(--ui-[\w-]+)\s*(,|\))/g;
  let m;
  while ((m = re.exec(css))) {
    const open = css.lastIndexOf('var(', m.index + 4);
    const end = closingParen(css, open + 3);
    if (end === -1) continue;
    const inner = css.slice(open + 4, end);
    const comma = inner.indexOf(',');
    const fallback = comma === -1 ? null : inner.slice(comma + 1).trim();
    if (!out.has(m[1])) out.set(m[1], new Set());
    out.get(m[1]).add(fallback);
    if (fallback) extractHooks(fallback, out); // hooks empilés (`--ui-icon-size`)
  }
  return out;
}

const files = walk(KIT);
/** hook → { defaults:Set, files:Set } */
const found = new Map();
for (const file of files) {
  const css = sass.compile(file, { loadPaths: [STYLES], style: 'expanded' }).css;
  for (const [hook, defaults] of extractHooks(css)) {
    if (!found.has(hook)) found.set(hook, { defaults: new Set(), files: new Set() });
    const entry = found.get(hook);
    for (const d of defaults) entry.defaults.add(d);
    entry.files.add(relative(ROOT, file).split(sep).join('/'));
  }
}

// --- 2. Metadata: read from the manifest (`///`) ---------------------------

if (!existsSync(MANIFEST_FILE)) {
  console.error('✗ storybook/generated/ui-config.json manquant : lance `pnpm docs:config`.');
  process.exit(1);
}
const manifest = JSON.parse(readFileSync(MANIFEST_FILE, 'utf8'));

/** hook → { role, component, category, entryPoint, family, scssVar, isMapEntry } */
const meta = new Map();
function collectMeta(resolved, path, ctx) {
  if (!resolved) return;
  if (resolved.cssVar?.startsWith('--ui-') && !meta.has(resolved.cssVar)) {
    meta.set(resolved.cssVar, { ...ctx, scssVar: path, isMapEntry: path !== ctx.rowName });
  }
  collectMeta(resolved.fallback, path, ctx);
  for (const e of resolved.entries ?? []) collectMeta(e.value, `${path}['${e.key}']`, ctx);
}
for (const [component, data] of Object.entries(manifest.components)) {
  if (!component.startsWith('ui-')) continue;
  const parts = data.file.split('/');
  const i = parts.indexOf('ui-kit');
  const category = parts[i + 1];
  const entry = parts[i + 2];
  for (const row of [...data.vars, ...data.hooks]) {
    collectMeta(row.default, row.name, {
      role: row.role,
      component,
      category,
      entryPoint: `@4sh/ui-kit/${category}/${entry}`,
      family: entry.replace(/^ui-/, ''),
      file: data.file,
      rowName: row.name,
    });
  }
  // A custom property the component declares is keyed under its own name.
  for (const row of data.hooks) {
    if (row.name.startsWith('--ui-') && !meta.has(row.name)) {
      meta.set(row.name, {
        role: row.role,
        component,
        category,
        entryPoint: `@4sh/ui-kit/${category}/${entry}`,
        family: entry.replace(/^ui-/, ''),
        file: data.file,
        scssVar: row.name,
        isMapEntry: false,
      });
    }
  }
}

/**
 * CROSS-CUTTING hooks: they belong to no component. Their `///` lives on the mixin
 * that reads them (`styles/utils/_motion.scss`, `_overlay.scss`), which the doc
 * generator does not scan — hence this list. They are meant for one element, never a
 * global preset: a component with its own setting (ui-tooltip forces a fast duration)
 * would win anyway.
 */
const SHARED_HOOKS = {
  '--ui-motion-duration': 'Durée de la transition / de l’animation, pour un exemplaire.',
  '--ui-motion-easing': 'Courbe de la transition, pour un exemplaire.',
  '--ui-motion-delay': 'Délai avant démarrage, pour un exemplaire.',
  '--ui-overlay-surface': 'Fond du panneau flottant, pour un exemplaire.',
  '--ui-overlay-stroke': 'Couleur de bordure du panneau flottant, pour un exemplaire.',
  '--ui-overlay-radius': 'Rayon des coins du panneau flottant, pour un exemplaire.',
  '--ui-overlay-shadow': 'Ombre du panneau flottant, pour un exemplaire.',
};

/**
 * Hooks the kit sets ON ITSELF (SCSS declaration, `setProperty`, `[style.--x]`),
 * per component family. Declared by the family that reads it, it is plumbing: the
 * component overwrites it, so a preset value would do nothing. Declared by a
 * NEIGHBOURING family (ui-button-split reshaping a ui-button's corners), it stays a
 * public handle.
 */
const declaredBy = new Map();
for (const file of walk(KIT, [], (n) => /\.(scss|ts|html)$/.test(n))) {
  const text = readFileSync(file, 'utf8');
  const family = /\/ui-kit\/[^/]+\/(ui-[^/]+)\//.exec(file)?.[1]?.replace(/^ui-/, '') ?? null;
  const add = (name, kind) => {
    if (!declaredBy.has(name)) declaredBy.set(name, new Map());
    declaredBy.get(name).set(family, kind);
  };
  // Hardcoded in the SCSS: the component always overwrites.
  for (const m of text.matchAll(/^\s*(--ui-[\w-]+)\s*:/gm)) add(m[1], 'scss');
  // Bound from an Angular input: only overwrites the instances that use it.
  for (const m of text.matchAll(/setProperty\(\s*['"`](--ui-[\w-]+)/g)) add(m[1], 'input');
  for (const m of text.matchAll(/\[style\.(--ui-[\w-]+)(?:\.[\w%]+)?\]/g)) add(m[1], 'input');
}

/**
 * Legacy names kept as a fallback for one version (see CHANGELOG). They sit in the
 * middle of a default chain without being a real override level, so they are stripped
 * before computing the shipped value.
 */
const DEPRECATED_ALIASES = new Set(['--ui-tabs-active-bar-color', '--ui-tabs-active-bar-size']);

/** `var(--legacy, X)` → `X`, recursively, for deprecated aliases only. */
function stripDeprecated(value) {
  if (!value) return value;
  let out = value;
  for (const alias of DEPRECATED_ALIASES) {
    let i;
    while ((i = out.indexOf(`var(${alias},`)) !== -1) {
      const end = closingParen(out, i + 3);
      if (end === -1) break;
      const inner = out.slice(i + 4 + alias.length + 1, end).trim();
      out = out.slice(0, i) + inner + out.slice(end + 1);
    }
  }
  return out;
}

// --- 3. Token index (to link the Figma aliases) ---------------------------

const kebab = (parts) =>
  parts
    .filter(Boolean)
    .join('-')
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');

function leaves(node, path = [], out = []) {
  if (!node || typeof node !== 'object') return out;
  if ('$value' in node) return (out.push({ path, token: node }), out);
  for (const k of Object.keys(node)) if (!k.startsWith('$')) leaves(node[k], [...path, k], out);
  return out;
}

/** `--units-sm` → { collection: 'metrics', name: 'units/sm' } */
const tokenIndex = new Map();
/** Every valid DTCG reference (`{metrics.units.sm}`). */
const tokenRefs = new Set();
for (const col of TOKENS_CONFIG.collections) {
  const modeSegs = new Set();
  for (const a of col.modeAxes ?? []) {
    for (const k of Object.keys(a.map ?? {})) modeSegs.add(k);
    if (a.default) modeSegs.add(a.default);
  }
  for (const f of col.files ?? []) {
    for (const leaf of leaves(JSON.parse(readFileSync(join(TOKENS_SRC, f), 'utf8')))) {
      const body = leaf.path.filter((p) => !modeSegs.has(p) && !/^mode[A-Z0-9]/.test(p));
      const cssVar = col.preserveCase
        ? `--${[col.prefix, body.at(-1)].filter(Boolean).join('-')}`
        : `--${kebab([col.prefix, ...body])}`;
      if (!tokenIndex.has(cssVar)) {
        tokenIndex.set(cssVar, { collection: col.id, name: body.join('/') });
      }
      // DTCG reference as this script will write it — used to prove every emitted
      // alias points at a token that really exists in the source files.
      tokenRefs.add(`{${col.id}.${body.join('.')}}`);
    }
  }
}

// --- 4. Name parsing + value ----------------------------------------------

function parseHook(hook, family) {
  const rest = hook.replace(/^--ui-/, '');
  // A shared constant has no family: its whole name is `part` + `property`.
  if (family !== null && !rest.startsWith(`${family}-`)) {
    return { conforms: false, part: null, property: null, modifier: null };
  }
  let segs = (family === null ? rest : rest.slice(family.length + 1)).split('-');
  const mods = [];
  while (segs.length > 1 && MODIFIERS.has(segs.at(-1))) mods.unshift(segs.pop());
  let property = null;
  for (let take = Math.min(3, segs.length); take >= 1; take--) {
    const candidate = segs.slice(-take).join('-');
    if (PROPERTIES[candidate]) {
      property = candidate;
      segs = segs.slice(0, -take);
      break;
    }
  }
  return {
    part: segs.length ? segs.join('-') : null,
    property,
    modifier: mods.length ? mods.join('-') : null,
    conforms: Boolean(property),
  };
}

const SINGLE_VAR = /^var\(\s*(--[\w-]+)\s*\)$/;
const NUMBER = /^(-?\d*\.?\d+)(px|rem|em|ch|%|s|ms|deg)?$/;

/**
 * Peels the `--ui-*` layers off a default chain to reach the value Figma has to hold.
 * A component default now often routes through a shared constant
 * (`var(--ui-form-field-height, var(--size-components-default))`): Figma only stores
 * one value, and the meaningful one is the token at the end of the chain.
 */
function throughHooks(raw) {
  let out = raw;
  for (let guard = 0; guard < 6; guard++) {
    const m = out?.match(/^var\(\s*(--ui-[\w-]+)\s*,/);
    if (!m) return out;
    const end = closingParen(out, 3);
    if (end === -1 || end !== out.length - 1) return out; // not a single wrapping var()
    out = out.slice(4 + m[1].length + 1, end).trim();
  }
  return out;
}

/** Figma value of a CSS default: token alias, literal, or not representable. */
function figmaValue(rawInput, expectedType) {
  const raw = throughHooks(rawInput);
  if (!raw)
    return {
      type: 'NONE',
      reason: 'hook sans défaut : point de surcharge pur, le composant ne pose rien.',
    };

  const single = raw.match(SINGLE_VAR);
  if (single) {
    const target = tokenIndex.get(single[1]);
    if (target) {
      return { type: 'ALIAS', collection: target.collection, name: target.name, cssVar: single[1] };
    }
    return {
      type: 'UNSUPPORTED',
      raw,
      reason: `\`${single[1]}\` n'est pas un token du pipeline : rien à aliaser.`,
    };
  }

  const num = raw.match(NUMBER);
  if (num) {
    const n = Number(num[1]);
    const unit = num[2] ?? null;
    if (expectedType === 'FLOAT') {
      // The source tokens are all in px, so align on that (1rem = 16px) and drop the
      // units a Figma variable cannot hold: `em`/`ch` depend on the element's font,
      // `%` on its container.
      if (unit === 'em' || unit === 'ch' || unit === '%') {
        return {
          type: 'UNSUPPORTED',
          raw,
          reason: `unité relative \`${unit}\` : sa valeur dépend du contexte de rendu, une variable Figma ne peut pas la porter.`,
        };
      }
      const px = unit === 'rem' ? n * REM_BASE : n;
      return {
        type: 'FLOAT',
        value: px,
        css: unit === 'rem' ? `${px}px` : raw,
        unit: unit ?? 'nombre',
        raw,
      };
    }
    return { type: 'STRING', value: raw };
  }

  if (/^#|^rgb|^hsl/.test(raw)) return { type: 'COLOR', value: raw };
  if (/^calc\(|\) var\(|var\(.*\) /.test(raw)) {
    return {
      type: 'UNSUPPORTED',
      raw,
      reason: /^calc\(/.test(raw)
        ? 'expression calc() : une variable Figma ne porte pas de calcul.'
        : 'raccourci CSS à plusieurs valeurs : une variable Figma n’en porte qu’une.',
    };
  }
  return { type: 'STRING', value: raw };
}

// --- 5. Assembly ----------------------------------------------------------

const problems = [];
const undocumented = [];
const hooks = [];

/**
 * Shared constants of `_ui-config.scss` (`--ui-focus-ring-width`,
 * `--ui-form-control-size`…). They belong to no component: they sit between the token
 * and the component hook, and reach every consumer because components interpolate
 * them. Their role comes from the `///` there, via the manifest's `shared` section.
 */
for (const [scssVar, entry] of Object.entries(manifest.shared ?? {})) {
  const hook = entry.default?.cssVar;
  if (!hook?.startsWith('--ui-')) continue;
  meta.set(hook, {
    role: entry.role,
    component: 'ui-config',
    category: 'shared',
    entryPoint: '@4sh/ui-kit/styles',
    family: null,
    file: 'projects/ui-kit/styles/settings/_ui-config.scss',
    scssVar,
    isMapEntry: false,
    group: entry.group,
  });
}

/** family → { component, category, entryPoint, family, file } */
const familyIndex = new Map();
for (const [component, data] of Object.entries(manifest.components)) {
  if (!component.startsWith('ui-')) continue;
  const parts = data.file.split('/');
  const i = parts.indexOf('ui-kit');
  const family = parts[i + 2].replace(/^ui-/, '');
  if (!familyIndex.has(family)) {
    familyIndex.set(family, {
      component: parts[i + 2],
      category: parts[i + 1],
      entryPoint: `@4sh/ui-kit/${parts[i + 1]}/${parts[i + 2]}`,
      family,
      file: data.file,
    });
  }
}

for (const [hook, { defaults, files: seen }] of [...found].sort(([a], [b]) => a.localeCompare(b))) {
  const shared = SHARED_HOOKS[hook];
  let info = shared
    ? {
        role: shared,
        component: hook.startsWith('--ui-motion-') ? 'système de motion' : 'panneaux flottants',
        category: 'global',
        entryPoint: hook.startsWith('--ui-motion-') ? '@4sh/ui-kit/motion' : '@4sh/ui-kit/overlay',
        family: hook.startsWith('--ui-motion-') ? 'motion' : 'overlay',
        file: hook.startsWith('--ui-motion-')
          ? 'projects/ui-kit/styles/utils/_motion.scss'
          : 'projects/ui-kit/styles/utils/_overlay.scss',
        scssVar: null,
        isMapEntry: false,
      }
    : meta.get(hook);
  if (!info) {
    // No `///`: only acceptable for plumbing the component sets on itself
    // (`[style.--x]`, `setProperty`). Otherwise it is an undocumented public hook,
    // which is an error.
    const family = [...(declaredBy.get(hook)?.keys() ?? [])].find(
      (f) => f && hook.startsWith(`--ui-${f}-`),
    );
    const ref = family ? familyIndex.get(family) : null;
    if (!ref) {
      undocumented.push(`${hook} (${[...seen].join(', ')})`);
      continue;
    }
    info = { role: null, ...ref, scssVar: null, isMapEntry: true };
  }
  const parts = parseHook(hook, info.family);
  if (!parts.conforms) {
    problems.push(
      `${hook} (${info.file}) — hors convention \`--ui-${info.family}[-partie]-propriété[-modifieur]\`.`,
    );
  }
  const spec = PROPERTIES[parts.property] ?? {};
  const values = [...new Set([...defaults].map(stripDeprecated))];
  // A value that references another hook carries the chain with it, so declaring it
  // has no side effect. What rules a variable out is having SEVERAL defaults (pinning
  // one would flatten the other variants), or a default that resolves through a
  // PRIVATE variable — `--_x` means nothing outside the component, so restating it
  // globally would resolve to nothing and break the property.
  const contextual = values.length > 1;
  const privateDefault = values.some((v) => /var\(\s*--_/.test(v ?? ''));
  const declKind = declaredBy.get(hook)?.get(info.family) ?? null;
  const plumbing = declKind !== null;

  hooks.push({
    name: hook,
    component: info.component,
    category: info.category,
    entryPoint: info.entryPoint,
    family: info.family,
    part: parts.part,
    property: parts.property,
    modifier: parts.modifier,
    group: spec.group ?? 'misc',
    description:
      info.role && !info.isMapEntry
        ? info.role
        : `${spec.fr ?? 'Valeur'} de \`${info.component}\`${parts.part ? ` — ${parts.part}` : ''}${parts.modifier ? ` (variante \`${parts.modifier}\`)` : ''}.`,
    descriptionSource: info.role && !info.isMapEntry ? 'scss' : 'derived',
    scssVar: info.scssVar,
    themable: !contextual && !plumbing && !shared && !privateDefault,
    plumbing,
    plumbingKind: declKind,
    sharedHandle: Boolean(shared),
    reason:
      declKind === 'scss'
        ? 'posée par le composant sur son propre élément : la déclarer dans un thème resterait sans effet.'
        : declKind === 'input'
          ? 'pilotée par une entrée Angular du composant : le thème ne vaudrait que pour les exemplaires qui ne s’en servent pas.'
          : shared
            ? 'poignée transverse (motion / panneaux flottants) : à poser sur l’élément visé — un composant qui a son propre réglage l’emporte.'
            : contextual
              ? `${values.length} défauts selon la variante rendue : en déclarer un seul écraserait les autres.`
              : privateDefault
                ? 'surcharge d’un exemplaire : son défaut passe par une variable interne au composant, qui ne résout rien depuis l’extérieur.'
                : null,
    default: values[0] ?? null,
    defaults: values,
    files: [...seen],
    figma: {
      bindable: spec.bindable !== false,
      type: spec.type ?? 'STRING',
      scopes:
        spec.type === 'COLOR' && TEXT_PARTS.has(parts.part ?? '')
          ? ['TEXT_FILL']
          : (spec.scopes ?? ['ALL_SCOPES']),
      name: [info.family, parts.part, [parts.property, parts.modifier].filter(Boolean).join('-')]
        .filter(Boolean)
        .join('/'),
      value: figmaValue(values[0] ?? null, spec.type ?? 'STRING'),
    },
  });
}

// Figma name collision: a variable cannot also be a folder.
const figmaNames = new Set(hooks.map((h) => h.figma.name));
for (const n of figmaNames) {
  for (const other of figmaNames) {
    if (other !== n && other.startsWith(`${n}/`)) {
      problems.push(
        `Collision Figma : « ${n} » est à la fois une variable et un dossier (« ${other} »).`,
      );
    }
  }
}

// --- 6. component-vars.scss -----------------------------------------------

const CAT_LABELS = {
  actions: 'Actions',
  base: 'Base',
  forms: 'Formulaires',
  informative: 'Informatif',
  layout: 'Mise en page',
  navigation: 'Navigation',
  table: 'Tableaux',
};

function themeScss() {
  const themable = hooks.filter((h) => h.themable);
  const perInstance = hooks.filter((h) => !h.themable);

  // Vertical alignment across the WHOLE file: one column of values.
  const width = Math.max(...themable.map((h) => h.name.length)) + 1;
  const line = (h) => `  ${h.name}:${' '.repeat(width - h.name.length)}${h.default};`;

  const L = [];
  L.push('// =====================================================================');
  L.push('// @4sh/ui-kit — component variables.');
  L.push('//');
  L.push('// Copy into `src/styles/presets/`, import it from `main.scss`, change what you');
  L.push('// need. As shipped it changes nothing: it restates the defaults.');
  L.push('//');
  L.push("//   @use 'presets/component-vars';   // src/styles/main.scss");
  L.push('//');
  L.push('// Load order is irrelevant: the kit only reads these names, never declares them.');
  L.push('// For a value shared by the whole kit (spacing, radius, control size), retune the');
  L.push('// design token instead — it follows brand, light/dark and viewport.');
  L.push('//');
  L.push(`// Generated by \`pnpm docs:config\`, values read from the compiled CSS — do not`);
  L.push(
    `// edit here. ${themable.length} variables; ${perInstance.length} more exist whose value depends on the`,
  );
  L.push('// rendered variant, listed in each component’s “Theming” section in Storybook.');
  L.push('// =====================================================================');
  L.push('');
  L.push(':root {');

  const byCategory = new Map();
  for (const h of themable) {
    if (!byCategory.has(h.category)) byCategory.set(h.category, new Map());
    const comps = byCategory.get(h.category);
    if (!comps.has(h.component)) comps.set(h.component, []);
    comps.get(h.component).push(h);
  }

  for (const [category, comps] of [...byCategory].sort(([a], [b]) => a.localeCompare(b))) {
    L.push('');
    L.push(`  // ══════════════════════════════════════════════════════════════════`);
    L.push(`  // ${CAT_LABELS[category] ?? category}`);
    L.push(`  // ══════════════════════════════════════════════════════════════════`);

    for (const [component, list] of [...comps].sort(([a], [b]) => a.localeCompare(b))) {
      L.push('');
      L.push(`  // ── ${component} ──`);
      for (const [group, label] of GROUPS) {
        const rows = list.filter((h) => h.group === group);
        if (!rows.length) continue;
        rows.sort((a, b) => a.name.localeCompare(b.name));
        L.push(`  // ${label}`);
        for (const h of rows) L.push(line(h));
      }
    }
  }

  L.push('}');

  return `${L.join('\n')}\n`;
}

// --- 7. figma/component-vars.json (DTCG, same shape as the token files) ----

/** DTCG `$type`, aligned on the vocabulary of the token files. */
function dtcgType(value, figmaType) {
  if (figmaType === 'COLOR') return 'color';
  if (value.type === 'ALIAS') return figmaType === 'FLOAT' ? 'dimension' : 'string';
  if (value.type === 'FLOAT') return /px|rem|em/.test(value.raw ?? '') ? 'dimension' : 'number';
  return 'string';
}

/** DTCG reference of an alias: `{metrics.units.sm}` (mode segment stripped). */
function dtcgRef(value) {
  return `{${value.collection}.${value.name.split('/').join('.')}}`;
}

function figmaJson() {
  // Internal plumbing is not a design decision: it has no place in a Figma
  // collection (the component overwrites it anyway).
  const importable = hooks.filter(
    (h) => h.figma.bindable && !h.plumbing && !['UNSUPPORTED', 'NONE'].includes(h.figma.value.type),
  );
  const skipped = hooks.filter(
    (h) => !h.figma.bindable || h.plumbing || ['UNSUPPORTED', 'NONE'].includes(h.figma.value.type),
  );

  // Nested tree: `toggle/track/width` → toggle → track → width.
  const tree = {};
  for (const h of importable) {
    const path = h.figma.name.split('/');
    let node = tree;
    for (const seg of path.slice(0, -1)) {
      if (node[seg] && '$value' in node[seg]) {
        problems.push(
          `Collision DTCG : « ${seg} » est à la fois un token et un groupe (${h.figma.name}).`,
        );
      }
      node = node[seg] ??= {};
    }
    const leaf = path.at(-1);
    const v = h.figma.value;
    // An alias that does not resolve would import silently as an empty value.
    if (v.type === 'ALIAS' && !tokenRefs.has(dtcgRef(v))) {
      problems.push(`Alias mort : ${h.name} → ${dtcgRef(v)} n'existe pas dans src/design-tokens.`);
    }
    node[leaf] = {
      $value:
        v.type === 'ALIAS'
          ? dtcgRef(v)
          : v.type === 'FLOAT'
            ? (v.css ?? String(v.value))
            : String(v.value),
      $type: dtcgType(v, h.figma.type),
      $description: h.description,
      $extensions: {
        'com.figma': {
          resolvedType: h.figma.type,
          scopes: h.figma.scopes,
          codeSyntax: { WEB: `var(${h.name})` },
        },
        'com.4sh.ui-kit': {
          cssVar: h.name,
          component: h.component,
          entryPoint: h.entryPoint,
          descriptionSource: h.descriptionSource,
          ...(h.themable ? {} : { perInstance: true, note: h.reason }),
        },
      },
    };
  }

  return {
    $description: COLLECTION,
    $extensions: {
      'com.4sh.ui-kit': {
        generatedBy: 'scripts/component-vars.build.mjs',
        what: 'Les hooks `--ui-*` des composants, au format DTCG, prêts à être importés dans UNE collection Figma dédiée. Ce ne sont pas des design tokens : ils appartiennent à un composant, et la plupart ne font que POINTER vers un token (alias `{collection.chemin}`).',
        figmaCollection: COLLECTION,
        targetFileKey: TARGET_FILE_KEY,
        modes: ['Mode 1'],
        counts: {
          tokens: importable.length,
          alias: importable.filter((h) => h.figma.value.type === 'ALIAS').length,
          literal: importable.filter((h) => h.figma.value.type !== 'ALIAS').length,
          skipped: skipped.length,
          derivedDescriptions: importable.filter((h) => h.descriptionSource === 'derived').length,
        },
        aliasTargets: [
          ...new Set(
            importable
              .filter((h) => h.figma.value.type === 'ALIAS')
              .map((h) => h.figma.value.collection),
          ),
        ].sort(),
        skipped: skipped.map((h) => ({
          cssVar: h.name,
          component: h.component,
          reason:
            h.figma.value.reason ??
            h.reason ??
            'sans équivalent variable Figma (durée, easing, curseur, plan d’empilement, ratio).',
        })),
      },
    },
    ...tree,
  };
}

// --- 8. figma/README.md : les chiffres cités == ceux qu'on vient de calculer ----
// Le README est de la prose (le mode d'emploi de l'import Figma) : rien ne le génère, et
// c'est bien. Mais il annonce des décomptes, et ceux-là dérivent en silence — le fichier
// grossit à chaque hook ajouté, la phrase reste. On valide donc les chiffres, pas le texte.
function readmeCountMismatches(counts) {
  const text = readFileSync(JSON_README, 'utf8');
  const claims = [
    {
      // `[*_]` plutôt que `\*` seul : Prettier normalise l'emphase Markdown en
      // `_alias_` (style souligné), et ce README n'est pas exclu du formatage.
      what: 'alias / total',
      re: /(\d+) of the (\d+) entries merely [*_]alias[*_]/,
      expected: [counts.alias, counts.tokens],
    },
    {
      what: 'entrées écartées',
      re: /`\$extensions\.com\.4sh\.ui-kit\.skipped` lists (\d+) entries/,
      expected: [counts.skipped],
    },
  ];

  const errors = [];
  for (const { what, re, expected } of claims) {
    const found = text.match(re);
    if (!found) {
      errors.push(
        `${what} : phrase introuvable (motif ${re.source}) — le README a été reformulé, adapte le motif.`,
      );
      continue;
    }
    const actual = found.slice(1).map(Number);
    if (actual.join() !== expected.join()) {
      errors.push(
        `${what} : le README annonce ${actual.join(' / ')}, le fichier en compte ${expected.join(' / ')}.`,
      );
    }
  }
  return errors;
}

// --- 9. Write / check -----------------------------------------------------

const scssText = themeScss();
const jsonText = `${JSON.stringify(figmaJson(), null, 2)}\n`;
const check = process.argv.includes('--check');

if (problems.length) {
  console.error(`✗ ${problems.length} problème(s) de nommage :`);
  for (const p of problems) console.error(`  - ${p}`);
  if (check) process.exit(1);
}
if (undocumented.length) {
  console.error(
    `✗ ${undocumented.length} hook(s) sans commentaire \`///\` (invisibles dans le thème) :`,
  );
  for (const u of undocumented) console.error(`  - ${u}`);
  if (check) process.exit(1);
}

if (check) {
  const stale = [
    [SCSS_OUT, scssText],
    [JSON_OUT, jsonText],
  ].filter(([f, t]) => (existsSync(f) ? readFileSync(f, 'utf8') : null) !== t);
  if (stale.length) {
    console.error(
      `✗ périmé(s) : ${stale.map(([f]) => relative(ROOT, f).split(sep).join('/')).join(', ')} — lance \`pnpm docs:config\`.`,
    );
    process.exit(1);
  }
  const readmeErrors = readmeCountMismatches(
    JSON.parse(jsonText).$extensions['com.4sh.ui-kit'].counts,
  );
  if (readmeErrors.length) {
    console.error(`✗ figma/README.md : ${readmeErrors.length} chiffre(s) périmé(s) :`);
    for (const e of readmeErrors) console.error(`  - ${e}`);
    process.exit(1);
  }

  console.log('✓ component-vars.scss, component-vars.json et figma/README.md à jour.');
} else {
  mkdirSync(dirname(SCSS_OUT), { recursive: true });
  mkdirSync(dirname(JSON_OUT), { recursive: true });
  writeFileSync(SCSS_OUT, scssText);
  writeFileSync(JSON_OUT, jsonText);
  // Served by Storybook for the doc page's download button.
  mkdirSync(dirname(PUBLIC_COPY), { recursive: true });
  writeFileSync(PUBLIC_COPY, scssText);
  sass.compileString(scssText, { loadPaths: [STYLES] }); // never ship a broken file
  const c = figmaJson().$extensions['com.4sh.ui-kit'].counts;
  console.log(
    `✓ component-vars.scss : ${hooks.filter((h) => h.themable).length} hooks exposés (+ ${hooks.length - hooks.filter((h) => h.themable).length} hors réglage global).`,
  );
  console.log(
    `✓ figma/component-vars.json (DTCG) : ${c.tokens} tokens (${c.alias} alias, ${c.literal} valeurs), ${c.skipped} écartés.`,
  );
}
