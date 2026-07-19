// Design tokens build — Style Dictionary v5 driver.
//
// Reads DTCG token JSON files (exported from Figma) and generates the SCSS/CSS
// partials in src/styles/src/generated. Everything is driven by tokens.config.json
// (documented by scripts/tokens.config.schema.json): collections, mode axes
// (brand / theme / viewport → CSS selectors or media queries) and outputs.
//
// Style Dictionary is used as the token engine (DTCG parsing, alias resolution,
// name transforms, formatting); the mode → selector/media grouping is implemented
// as custom hooks, registered below.
import { readFileSync, mkdirSync, writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, isAbsolute, join } from 'node:path';
import StyleDictionary from 'style-dictionary';
import { createPropertyFormatter, usesReferences, getReferences } from 'style-dictionary/utils';

// --- Config & paths ---------------------------------------------------------

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..');
const CONFIG = JSON.parse(readFileSync(join(ROOT, 'tokens.config.json'), 'utf8'));
const SRC = isAbsolute(CONFIG.sourceRoot) ? CONFIG.sourceRoot : join(ROOT, CONFIG.sourceRoot);
const HEADER = `/* ${CONFIG.header ?? 'Generated — do not edit.'} */\n\n`;

// --- Naming helpers (shared by the name transform and the manifest) ----------

const kebab = (parts) =>
  parts.filter(Boolean).join('-').toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
const slug = (id) => String(id).replace(/[^a-zA-Z0-9]+/g, '-').replace(/^-|-$/g, '').toLowerCase();

/** Mode names to strip from paths/names for a collection (all axes, defaults included). */
function modeSegments(col) {
  const s = new Set();
  for (const a of col.modeAxes ?? []) {
    for (const k of Object.keys(a.map ?? {})) s.add(k);
    if (a.default) s.add(a.default);
    const detected = detectModeNames(col, a);
    for (const m of detected) s.add(m);
  }
  return s;
}

/** Variable name for a (collection, mode-stripped path). */
function varName(col, body) {
  if (col.preserveCase) return [col.prefix, body[body.length - 1] ?? ''].filter(Boolean).join('-');
  return kebab([col.prefix, ...body]);
}

/** Keys under which a collection can be addressed in {…} references. */
function refKeys(col) {
  return [...new Set([col.prefix, kebab([col.id])].filter(Boolean))];
}

const byRefKey = {};
for (const c of CONFIG.collections) for (const k of refKeys(c)) byRefKey[k] = c;

// --- Token file walking -------------------------------------------------------

/** Flatten a DTCG tree into [{ path, token }] leaves ($value nodes). */
function leaves(node, path = [], out = []) {
  if (!node || typeof node !== 'object') return out;
  if ('$value' in node) {
    out.push({ path, token: node });
    return out;
  }
  for (const k of Object.keys(node)) if (!k.startsWith('$')) leaves(node[k], [...path, k], out);
  return out;
}

const leavesByCol = {};
for (const c of CONFIG.collections) {
  leavesByCol[c.id] = (c.files ?? []).flatMap((f) => leaves(JSON.parse(readFileSync(join(SRC, f), 'utf8'))));
}

/** Detect all mode names from the JSON structure for a given axis. */
function detectModeNames(col, axis) {
  const modes = new Set();
  const seen = new Set();
  for (const l of leavesByCol[col.id]) {
    const modeIndex = l.path.findIndex((p) => p.startsWith('mode'));
    if (modeIndex !== -1) {
      const mode = l.path[modeIndex];
      if (mode !== axis.default && !seen.has(mode)) {
        modes.add(mode);
        seen.add(mode);
      }
    }
  }
  if (col.id === 'responsive') {
    console.log(`[detectModeNames] Detected modes for ${col.id}:`, [...modes]);
  }
  return modes;
}

/** Non-default mode of a leaf (first matching axis), or undefined. */
function leafMode(col, leaf) {
  for (const a of col.modeAxes ?? []) {
    const known = new Set([...Object.keys(a.map ?? {}), a.default, ...detectModeNames(col, a)]);
    const m = leaf.path.find((p) => known.has(p));
    if (m !== undefined && m !== a.default) return m;
  }
  return undefined;
}

/**
 * Extra selectors under which the default mode should ALSO be emitted, so a
 * default-mode block can be re-declared on a nested element (e.g. force light
 * theme locally). Derived from the `selectors`-strategy axes' default map entry;
 * the value must include `:root` to keep the global default intact.
 * Returns ':root' when no axis overrides it (unchanged behaviour).
 */
function baseSelector(col) {
  const parts = [];
  for (const a of col.modeAxes ?? []) {
    if (a.strategy !== 'selectors') continue;
    const sel = a.map?.[a.default];
    if (sel && sel !== ':root') parts.push(sel);
  }
  return parts.length ? parts.join(', ') : ':root';
}

/** Auto-detect media query from screen.{mode}.width token when map is missing. */
function autoDetectMediaQuery(col, mode) {
  for (const l of leavesByCol[col.id]) {
    // Look for screen.{mode}.width pattern
    if (l.path.length >= 3 && l.path[0] === 'screen' && l.path[1] === mode && l.path[2] === 'width') {
      const value = l.token.$value;
      if (value && typeof value === 'string') {
        const pxValue = value.replace('px', '');
        return `(min-width: ${pxValue}px)`;
      }
    }
  }
  console.warn(`Could not auto-detect media query for mode ${mode} in collection ${col.id}`);
  return null;
}

/** Selector/media group of a leaf. Base group is { media: '', selector: ':root' }. */
function leafGroup(col, leaf) {
  const selectors = [];
  const medias = [];
  for (const a of col.modeAxes ?? []) {
    const detectedModes = detectModeNames(col, a);
    const known = new Set([...Object.keys(a.map ?? {}), a.default, ...detectedModes]);
    const m = leaf.path.find((p) => known.has(p));
    if (m === undefined || m === a.default) continue;
    if (a.strategy === 'selectors') selectors.push(a.map?.[m] ?? ':root');
    else if (a.strategy === 'media') {
      const mediaQuery = a.map?.[m] || autoDetectMediaQuery(col, m);
      if (mediaQuery) medias.push(mediaQuery);
    }
  }
  return {
    selector: selectors.length ? selectors.join('') : ':root',
    media: medias.length ? `@media ${medias.join(' and ')}` : '',
  };
}

// --- Style Dictionary tree building ------------------------------------------

/** Insert a leaf into a nested tree, expanding object $values into sub-leaves. */
function setLeaf(tree, path, token) {
  const value = token.$value;
  if (value && typeof value === 'object' && !Array.isArray(value)) {
    for (const k of Object.keys(value)) setLeaf(tree, [...path, k], { ...token, $value: value[k] });
    return;
  }
  let node = tree;
  for (const seg of path.slice(0, -1)) node = node[seg] ??= {};
  node[path.at(-1)] = { $value: Array.isArray(value) ? JSON.stringify(value) : value, $type: token.$type ?? undefined };
}

/** Mode-stripped default-mode tree of a collection (used to resolve {…} references). */
function defaultTree(col) {
  const strip = modeSegments(col);
  const tree = {};
  const seen = new Set();
  for (const l of leavesByCol[col.id]) {
    if (leafMode(col, l) !== undefined) continue;
    const body = l.path.filter((p) => !strip.has(p));
    const key = body.join('.');
    if (seen.has(key)) continue;
    seen.add(key);
    setLeaf(tree, body, l.token);
  }
  return tree;
}

/**
 * Build the SD token tree for one collection build: its base tokens under the
 * collection ref key, one synthetic `__grp__<i>` root per non-default mode group,
 * and every other collection's default tree (reference targets only).
 */
function buildTokens(col) {
  const strip = modeSegments(col);
  const groups = [];
  const byKey = new Map();
  for (const l of leavesByCol[col.id]) {
    const g = leafGroup(col, l);
    const key = `${g.media}||${g.selector}`;
    let entry = byKey.get(key);
    if (!entry) byKey.set(key, (entry = { ...g, leaves: [] })), groups.push(entry);
    entry.leaves.push(l);
  }
  const rank = (g) => (g.media ? 2 : g.selector === ':root' ? 0 : 1);
  const ordered = groups.slice().sort((a, b) => rank(a) - rank(b));

  const primaryKey = refKeys(col)[0];
  const tokens = {};
  const groupSpecs = [];
  ordered.forEach((g, i) => {
    const isBase = !g.media && g.selector === ':root';
    const root = isBase ? primaryKey : `__grp__${i}`;
    groupSpecs.push({ root, media: g.media, selector: isBase ? baseSelector(col) : g.selector });
    const target = isBase ? ((tokens[primaryKey] ??= {})) : ((tokens[root] = {})[primaryKey] = {});
    for (const l of g.leaves) setLeaf(target, l.path.filter((p) => !strip.has(p)), l.token);
  });
  for (const key of refKeys(col).slice(1)) tokens[key] = tokens[primaryKey];
  for (const other of CONFIG.collections) {
    if (other.id === col.id || compositeCols.has(other.id)) continue; // composite: resolved outside SD
    const tree = defaultTree(other);
    for (const key of refKeys(other)) tokens[key] ??= tree;
  }
  return { tokens, groupSpecs, primaryKey };
}

// --- Style Dictionary hooks ----------------------------------------------------

// Variable naming: strip synthetic roots, then map the ref-key root to the
// collection prefix (kebab-case, or last-segment preserveCase).
StyleDictionary.registerTransform({
  name: 'name/starter',
  type: 'name',
  transform: (token) => {
    const segs = token.path[0]?.startsWith('__grp__') ? token.path.slice(1) : token.path;
    const col = byRefKey[segs[0]];
    return col ? varName(col, segs.slice(1)) : kebab(segs);
  },
});

/** `--name: value;` lines of a token list (references kept as var(--…)), deduped by name. */
function cssLines(tokens, dictionary, options) {
  const format = createPropertyFormatter({
    outputReferences: true,
    dictionary,
    format: 'css',
    usesDtcg: options.usesDtcg ?? true,
  });
  const byName = new Map();
  for (const t of tokens) {
    let line = format(t);
    if (options.preserveCase) line = line.replace(/: 0px;$/, ': 0;');
    byName.set(t.name, line);
  }
  return [...byName.values()];
}

// CSS custom properties, one block per mode group (:root, selectors, media queries).
StyleDictionary.registerFormat({
  name: 'starter/css-modes',
  format: ({ dictionary, options }) => {
    const buckets = new Map(options.groupSpecs.map((g) => [g.root, []]));
    for (const t of dictionary.allTokens) {
      const bucket = buckets.get(t.path[0]);
      if (bucket) bucket.push(t);
    }
    let css = options.header;
    for (const g of options.groupSpecs) {
      const lines = cssLines(buckets.get(g.root), dictionary, options).join('\n');
      if (g.media) css += `${g.media} {\n  ${g.selector} {\n${lines.replace(/^/gm, '  ')}\n  }\n}\n`;
      else css += `${g.selector} {\n${lines}\n}\n`;
    }
    return css;
  },
});

// Flat SCSS variables ($name: value;), first occurrence wins.
StyleDictionary.registerFormat({
  name: 'starter/scss-vars',
  format: ({ dictionary, options }) => {
    const usesDtcg = options.usesDtcg ?? true;
    const lines = [];
    const used = new Set();
    for (const t of dictionary.allTokens) {
      if (!options.groupSpecs.some((g) => g.root === t.path[0])) continue;
      if (used.has(t.name)) continue;
      used.add(t.name);
      const original = usesDtcg ? t.original.$value : t.original.value;
      let value = String(usesDtcg ? (t.$value ?? t.value) : t.value);
      if (typeof original === 'string' && usesReferences(original)) {
        const refs = getReferences(original, dictionary.tokens, { usesDtcg });
        let i = 0;
        value = original.replace(/\{[^}]+\}/g, () => `var(--${refs[i++].name})`);
      }
      if (options.preserveCase && value === '0px') value = '0';
      lines.push(`$${t.name}: ${value};`);
    }
    return options.header + lines.join('\n') + '\n';
  },
});

const FORMATS = { 'css-vars': 'starter/css-modes', 'scss-vars': 'starter/scss-vars' };

// --- Composite styles (shadow…) ------------------------------------------------
// Composite DTCG tokens keep an object $value (offsetX/blur/color…). Instead of
// splitting them into parts, we compose ONE ready-to-use CSS value per style and
// expose it as a custom property + a matching utility class:
//   --shadow-default-md: 0px 0px 6px 2px var(--effects-default);
//   .shadow-default-md { box-shadow: var(--shadow-default-md); }
// Usable in SCSS (box-shadow: var(--shadow-default-md)) or in HTML (class).

/** `{effects.default}` → `var(--effects-default)`. */
const refToVar = (str) => String(str).replace(/\{([^}]+)\}/g, (_, ref) => `var(--${kebab(ref.split('.'))})`);

/** Compose a shadow object $value into a CSS box-shadow value. */
function composeShadow(v) {
  const geometry = [v.offsetX, v.offsetY, v.blur, v.spread].filter((p) => p != null).join(' ');
  return `${v.inset ? 'inset ' : ''}${geometry} ${refToVar(v.color)}`.trim();
}

const COMPOSERS = { shadow: { prop: 'box-shadow', compose: composeShadow } };

/** Build a partial of composite styles: custom props (:root) + utility classes. */
function buildCompositeStyles(col) {
  const vars = [];
  const rules = [];
  for (const l of leavesByCol[col.id]) {
    const composer = COMPOSERS[l.token.$type];
    const v = l.token.$value;
    if (!composer || !v || typeof v !== 'object') continue;
    const name = kebab(l.path.slice(1)); // drop the top Figma group ("Effects")
    vars.push(`  --${name}: ${composer.compose(v)};`);
    rules.push(`.${name} { ${composer.prop}: var(--${name}); }`);
  }
  return `${HEADER}:root {\n${vars.join('\n')}\n}\n\n${rules.join('\n')}\n`;
}

/** Collection ids emitted only through composite formats (skipped by the manifest). */
const compositeCols = new Set(
  (CONFIG.outputs ?? [])
    .filter((o) => o.format === 'composite-styles')
    .flatMap((o) => (o.collections === 'all' ? CONFIG.collections.map((c) => c.id) : o.collections)),
);

// --- Build -----------------------------------------------------------------------

const written = [];
function emit(destRel, name, content) {
  const dir = isAbsolute(destRel) ? destRel : join(ROOT, destRel);
  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, name), content);
  written.push({ file: `${destRel}/${name}`, bytes: Buffer.byteLength(content) });
}

const partialsByDest = {};
for (const output of CONFIG.outputs ?? []) {
  const ids = output.collections === 'all' ? CONFIG.collections.map((c) => c.id) : output.collections;
  for (const col of CONFIG.collections) {
    if (!ids.includes(col.id)) continue;

    if (output.format === 'composite-styles') {
      const name = `_tokens-${slug(col.id)}.scss`;
      emit(output.destination, name, buildCompositeStyles(col));
      (partialsByDest[output.destination] ??= []).push(name);
      continue;
    }

    const { tokens, groupSpecs } = buildTokens(col);
    const sd = new StyleDictionary({
      tokens,
      log: { verbosity: 'silent', warnings: 'disabled' },
      platforms: {
        out: {
          transforms: ['name/starter'],
          files: [
            {
              destination: `_tokens-${slug(col.id)}.scss`,
              format: FORMATS[output.format],
              options: { groupSpecs, preserveCase: !!col.preserveCase, header: HEADER },
            },
          ],
        },
      },
    });
    const [file] = await sd.formatPlatform('out');
    emit(output.destination, `_tokens-${slug(col.id)}.scss`, file.output);
    (partialsByDest[output.destination] ??= []).push(`_tokens-${slug(col.id)}.scss`);
  }
}

// --- Index (@use every partial) + manifest, per destination ------------------------

function buildManifest() {
  const out = [];
  for (const col of CONFIG.collections) {
    if (compositeCols.has(col.id)) continue; // composite styles: not scalar vars
    const strip = modeSegments(col);
    const byName = new Map();
    for (const l of leavesByCol[col.id]) {
      const body = l.path.filter((p) => !strip.has(p));
      const name = varName(col, body);
      let e = byName.get(name);
      if (!e) {
        e = { name, collection: col.id, category: body[0] ?? col.id, type: l.token.$type ?? null, modes: [] };
        byName.set(name, e);
        out.push(e);
      }
      const mode = leafMode(col, l);
      if (mode && !e.modes.includes(mode)) e.modes.push(mode);
    }
  }
  return out;
}

const manifest = JSON.stringify({ tokens: buildManifest() }, null, 2) + '\n';
for (const dest of new Set((CONFIG.outputs ?? []).map((o) => o.destination))) {
  const partials = partialsByDest[dest] ?? [];
  if (partials.length) {
    const index = HEADER + partials.map((f) => `@use './${f.replace(/^_/, '').replace(/\.scss$/, '')}';`).join('\n') + '\n';
    emit(dest, '_tokens.scss', index);
  }
  if (CONFIG.manifest) emit(dest, 'tokens.manifest.json', manifest);
}

console.log(`tokens:build — ${written.length} files written`);
for (const w of written) console.log(`  ${w.file} (${w.bytes} B)`);
