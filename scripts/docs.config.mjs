#!/usr/bin/env node
/**
 * docs.config.mjs — extrait la configuration SCSS des composants `ui-*` vers un
 * manifeste JSON consommé par la doc Storybook (`<ConfigTable of="ui-card" />`).
 *
 * Principe : la doc ne transcrit plus rien. Le contrat (nom de la variable +
 * rôle) et le réglage par défaut (binding vers un token / une constante
 * partagée) sont lus dans le `.scss`, et la valeur résolue est calculée au
 * runtime par le bloc de doc (donc suit le thème / la marque / le viewport).
 *
 * Conventions attendues dans un `.scss` de composant. `///` = contrat public
 * documenté (en français), `//` = note interne. Le rôle se met en FIN de
 * déclaration, aligné verticalement dans son bloc :
 *
 *   // --- Config ------------------------------------------------------
 *   $card-padding: var(--units-lg);       /// Inset du corps.
 *   $card-radius: var(--radius-md);       /// Rayon des coins.
 *
 * Seule exception : une déclaration multi-lignes (map SCSS) porte son `///` sur
 * la ligne au-dessus. Ne jamais écrire de valeur résolue dans un rôle : la doc
 * la mesure au runtime.
 *
 * Sans marqueur `// --- Config`, la région analysée va du début du fichier au
 * premier sélecteur / at-rule de premier niveau.
 *
 * Une custom property n'est documentée que si elle porte un `///`, où que le
 * hook vive — déclaration, ou simple lecture avec fallback (point d'override
 * pur, jamais déclaré par le composant) :
 *
 *   --ui-card-padding: #{$card-padding};                     /// Gouttière exposée.
 *   color: var(--ui-spinner-color, var(--informative-…));    /// Couleur du marqueur.
 *
 * Usage :
 *   node scripts/docs.config.mjs            # génère le manifeste
 *   node scripts/docs.config.mjs --check    # échoue si le manifeste est périmé
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const SHARED_CONFIG = join(ROOT, 'projects/ui-kit/styles/settings/_ui-config.scss');
const COMPONENTS_DIRS = [
  join(ROOT, 'src/app/shared/components'),
  // Components already migrated to the `ui-kit` npm package (`ng-packagr` secondary
  // entry points) — their `.scss` still documents the same public contract.
  join(ROOT, 'projects/ui-kit'),
];
const OUT_FILE = join(ROOT, 'storybook/generated/ui-config.json');

// Sections de `_ui-config.scss` → page de doc du groupe partagé.
const GROUPS = {
  'global-ui': { label: 'Global UI', docId: 'components-configuration-global-ui' },
  forms: { label: 'Forms', docId: 'components-configuration-forms' },
  actions: { label: 'Actions', docId: 'components-configuration-actions' },
  informative: { label: 'Informative', docId: 'components-configuration-informative' },
};

/** Déduit le groupe depuis un en-tête de section `// --- <label> ---`. */
function groupFromSection(section) {
  if (!section) return 'global-ui';
  const s = section.toLowerCase();
  if (s.includes('forms')) return 'forms';
  if (s.includes('actions')) return 'actions';
  if (s.includes('informative')) return 'informative';
  return 'global-ui';
}

// --- Lecture / parsing SCSS -------------------------------------------

/** Retire un commentaire de fin de ligne hors chaîne de caractères. */
function stripTrailingComment(value) {
  let quote = null;
  for (let i = 0; i < value.length; i++) {
    const c = value[i];
    if (quote) {
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") quote = c;
    else if (c === '/' && value[i + 1] === '/') return { value: value.slice(0, i), comment: value.slice(i) };
  }
  return { value, comment: '' };
}

/** Profondeur de parenthèses d'un fragment (pour les maps SCSS multi-lignes). */
function parenDelta(text) {
  let depth = 0;
  for (const c of text) {
    if (c === '(') depth++;
    else if (c === ')') depth--;
  }
  return depth;
}

const SECTION_RE = /^\/\/\s*-{2,}\s*(.+?)\s*-*\s*$/;
const DOC_RE = /^\/\/\/\s?(.*)$/;
const DECL_RE = /^(\$[\w-]+|--[\w-]+)\s*:\s*([\s\S]*)$/;

/**
 * Parse les déclarations `$var:` / `--custom-prop:` d'un texte SCSS.
 * Ne considère que le premier niveau d'indentation demandé (`topLevelOnly`).
 */
function parseDeclarations(text, { topLevelOnly = true } = {}) {
  const lines = text.split('\n');
  const out = [];
  let doc = [];
  let section = null;

  for (let i = 0; i < lines.length; i++) {
    const raw = lines[i];
    const trimmed = raw.trim();

    if (!trimmed) {
      doc = [];
      continue;
    }

    const docMatch = trimmed.match(DOC_RE);
    if (docMatch) {
      doc.push(docMatch[1].trim());
      continue;
    }

    const sectionMatch = trimmed.match(SECTION_RE);
    if (sectionMatch) {
      section = sectionMatch[1];
      doc = [];
      continue;
    }

    if (trimmed.startsWith('//')) continue; // commentaire interne : sans effet

    const indented = /^\s/.test(raw);
    const decl = trimmed.match(DECL_RE);
    if (!decl || (topLevelOnly && indented)) {
      doc = [];
      continue;
    }

    // Accumule la valeur jusqu'au `;` de fin (maps SCSS sur plusieurs lignes).
    // Les commentaires sont retirés ligne par ligne : un `//` au milieu d'une
    // map ne doit pas tronquer le reste de la valeur.
    const rawParts = [decl[2]];
    let clean = stripTrailingComment(decl[2]).value;
    while (!(parenDelta(clean) <= 0 && clean.trimEnd().endsWith(';')) && i + 1 < lines.length) {
      i++;
      rawParts.push(lines[i]);
      clean += `\n${stripTrailingComment(lines[i]).value}`;
    }

    const semi = clean.lastIndexOf(';');
    const valuePart = semi === -1 ? clean : clean.slice(0, semi);
    // Le `///` est repéré comme début de commentaire, PAS après le dernier `;` :
    // un rôle peut lui-même contenir un point-virgule.
    const lastRaw = rawParts[rawParts.length - 1];
    const trailingDoc = stripTrailingComment(lastRaw).comment.trim().match(DOC_RE);
    const inlineDoc = trailingDoc ? [trailingDoc[1].trim()] : [];

    out.push({
      name: decl[1],
      value: valuePart.trim().replace(/\s*\n\s*/g, ' '),
      doc: (doc.length ? doc : inlineDoc).join(' ').trim() || null,
      section,
      line: i + 1,
    });
    doc = [];
  }

  return out;
}

/**
 * Isole la région de configuration d'un `.scss` de composant : entre
 * `// --- Config` et `// --- End config`, sinon du début du fichier au premier
 * sélecteur / at-rule de premier niveau.
 */
function configRegion(text) {
  const lines = text.split('\n');
  let start = 0;
  const markerIdx = lines.findIndex((l) => /^\/\/\s*-{2,}\s*(Config|Local structural config)/i.test(l.trim()));
  if (markerIdx !== -1) start = markerIdx;

  let end = lines.length;
  let depth = 0; // ne jamais couper au milieu d'une map SCSS multi-lignes
  for (let i = start; i < lines.length; i++) {
    const line = lines[i];
    if (depth === 0 && /^\/\/\s*-{2,}\s*End config/i.test(line.trim())) {
      end = i;
      break;
    }
    // Premier sélecteur / at-rule de premier niveau (hors `@use`, en tête).
    if (
      depth === 0 &&
      i > start &&
      /^\S/.test(line) &&
      !/^(\/\/|\/\*|\s*\*|\$|--)/.test(line) &&
      !/^@use\b/.test(line)
    ) {
      end = i;
      break;
    }
    depth += parenDelta(stripTrailingComment(line).value);
  }

  return lines.slice(start, end).join('\n');
}

// --- Résolution des bindings ------------------------------------------

const VAR_RE = /^var\(\s*(--[\w-]+)\s*(?:,([\s\S]*))?\)$/;
const UTILS_REF_RE = /^utils\.(\$[\w-]+)$/;
const LOCAL_REF_RE = /^(\$[\w-]+)$/;
const LITERAL_RE = /^-?(\d+\.?\d*|\.\d+)(px|rem|em|ch|%|vh|vw|s|ms|deg)?$/;
const REM_CALC_RE = /^utils\.rem-calc\(\s*(-?[\d.]+)\s*\)$/;
const MAP_RE = /^\(([\s\S]*)\)$/;
const MAP_GET_RE = /^map\.get\(\s*(\$[\w-]+)\s*,\s*['"]?([\w-]+)['"]?\s*\)$/;
const LIST_RE = /^[\w-]+(\s*,\s*[\w-]+)+,?$/;

const REM_BASE = 16; // utils.$rem-base

/** Retire l'interpolation `#{…}` d'une valeur. */
function unwrapInterpolation(value) {
  const m = value.match(/^#\{([\s\S]*)\}$/);
  return m ? m[1].trim() : value;
}

/** Découpe sur un séparateur de premier niveau (hors parenthèses / quotes). */
function splitTopLevel(text, separator = ',') {
  const parts = [];
  let depth = 0;
  let quote = null;
  let current = '';
  for (const c of text) {
    if (quote) {
      current += c;
      if (c === quote) quote = null;
      continue;
    }
    if (c === '"' || c === "'") quote = c;
    else if (c === '(') depth++;
    else if (c === ')') depth--;
    else if (c === separator && depth === 0) {
      parts.push(current);
      current = '';
      continue;
    }
    current += c;
  }
  if (current.trim()) parts.push(current);
  return parts.map((p) => p.trim()).filter(Boolean);
}

/**
 * Suit la chaîne d'indirections d'un binding jusqu'à un token CSS ou une
 * valeur littérale. Retourne les étapes traversées (pour l'affichage) et la
 * variable CSS terminale (pour la résolution runtime).
 */
function resolveBinding(rawValue, { shared, local }) {
  const steps = [];
  const seen = new Set();
  let value = unwrapInterpolation(rawValue);
  // Dès qu'on a franchi `utils.$…`, on reste dans `_ui-config.scss` : une
  // référence nue y vise une constante partagée, jamais la variable locale du
  // composant (qui peut porter le même nom — cf. `ui-field.$focus-ring-width`).
  let inShared = local === shared;

  for (let guard = 0; guard < 10; guard++) {
    const varMatch = value.match(VAR_RE);
    if (varMatch) {
      // `var(--hook, défaut)` : la custom property est souvent non définie (point
      // d'override par instance) — c'est le fallback qui s'applique réellement.
      const fallback = varMatch[2]?.trim()
        ? resolveBinding(varMatch[2].trim(), { shared, local })
        : null;
      return { steps, cssVar: varMatch[1], literal: null, kind: 'token', fallback, raw: rawValue };
    }

    const utilsMatch = value.match(UTILS_REF_RE);
    if (utilsMatch) {
      const target = shared.get(utilsMatch[1]);
      if (!target || seen.has(utilsMatch[1])) break;
      seen.add(utilsMatch[1]);
      inShared = true;
      steps.push({ via: 'shared', name: utilsMatch[1], group: target.group });
      value = unwrapInterpolation(target.value);
      continue;
    }

    const localMatch = value.match(LOCAL_REF_RE);
    if (localMatch) {
      const target = inShared ? shared.get(localMatch[1]) : local.get(localMatch[1]);
      if (!target || seen.has(localMatch[1])) break;
      seen.add(localMatch[1]);
      steps.push({ via: inShared ? 'shared' : 'local', name: localMatch[1], group: target.group ?? null });
      value = unwrapInterpolation(target.value);
      continue;
    }

    // Alias dérivé d'une map locale : `map.get($sizes, 'default')`.
    const mapGet = value.match(MAP_GET_RE);
    if (mapGet) {
      const target = (inShared ? shared : local).get(mapGet[1]);
      const key = mapGet[2];
      if (!target || seen.has(`${mapGet[1]}.${key}`)) break;
      seen.add(`${mapGet[1]}.${key}`);
      const entries = MAP_RE.exec(unwrapInterpolation(target.value));
      if (!entries) break;
      const hit = splitTopLevel(entries[1])
        .map((entry) => {
          const [rawKey, ...rest] = splitTopLevel(entry, ':');
          return { key: rawKey.replace(/^['"]|['"]$/g, ''), body: rest.join(':').trim() };
        })
        .find((e) => e.key === key);
      if (!hit) break;
      steps.push({ via: 'map', name: `${mapGet[1]}['${key}']`, group: null });
      value = unwrapInterpolation(hit.body);
      continue;
    }

    break;
  }

  const remCalc = value.match(REM_CALC_RE);
  if (remCalc) {
    const rem = Number(remCalc[1]) / REM_BASE;
    return { steps, cssVar: null, literal: `${rem}rem`, kind: 'literal', raw: rawValue };
  }

  if (LITERAL_RE.test(value)) {
    // Une valeur en dur est un candidat violation de token : on le signale.
    return { steps, cssVar: null, literal: value, kind: 'literal', raw: rawValue };
  }

  // Map SCSS : on résout chaque entrée (récursivement) pour rester exploitable.
  const map = value.match(MAP_RE);
  if (map) {
    const entries = splitTopLevel(map[1]).map((entry) => {
      const [rawKey, ...rest] = splitTopLevel(entry, ':');
      const key = rawKey.replace(/^['"]|['"]$/g, '');
      const body = rest.join(':').trim();
      return { key, value: body ? resolveBinding(body, { shared, local }) : null };
    });
    return { steps, cssVar: null, literal: null, kind: 'map', entries, raw: rawValue };
  }

  if (LIST_RE.test(value)) {
    return {
      steps,
      cssVar: null,
      literal: null,
      kind: 'list',
      items: splitTopLevel(value),
      raw: rawValue,
    };
  }

  return { steps, cssVar: null, literal: value, kind: 'expression', raw: rawValue };
}

// --- Collecte ---------------------------------------------------------

function walk(dir, out = []) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) walk(full, out);
    else if (entry.name.endsWith('.scss')) out.push(full);
  }
  return out;
}

function parseSharedConfig() {
  const text = readFileSync(SHARED_CONFIG, 'utf8');
  const map = new Map();
  for (const decl of parseDeclarations(text)) {
    if (!decl.name.startsWith('$')) continue;
    map.set(decl.name, { ...decl, group: groupFromSection(decl.section) });
  }
  return map;
}

function collectComponents(shared) {
  const components = {};
  const files = COMPONENTS_DIRS.flatMap((dir) => walk(dir)).sort();

  for (const file of files) {
    const text = readFileSync(file, 'utf8');
    const name = file.split(sep).pop().replace(/\.scss$/, '');
    if (!/^(ui|sp)-/.test(name)) continue;

    const region = configRegion(text);
    const declarations = parseDeclarations(region).filter((d) => d.name.startsWith('$'));
    const local = new Map(declarations.map((d) => [d.name, d]));

    // Custom properties exposées : opt-in via `///`, où que le hook vive.
    //  1. déclaré      → `--ui-x: valeur;             /// rôle`
    //  2. seulement lu → `prop: var(--ui-x, défaut);  /// rôle`
    // Le cas 2 est le point d'override pur : jamais déclaré par le composant,
    // c'est son fallback qui s'applique tant que le consommateur ne le pose pas.
    const hooks = parseDeclarations(text, { topLevelOnly: false }).filter(
      (d) => d.name.startsWith('--') && d.doc
    );
    const declared = new Set(hooks.map((h) => h.name));
    for (const line of text.split('\n')) {
      const { value: code, comment } = stripTrailingComment(line);
      const doc = comment.trim().match(DOC_RE);
      if (!doc || DECL_RE.test(code.trim())) continue;
      // Sans fallback (`var(--ui-x)`), le hook est volontairement non défini par
      // défaut : la valeur résolue affichera « non défini », ce qui est exact.
      const hook = code.match(/var\(\s*(--ui-[\w-]+)\s*(?:,([\s\S]*))?\)/);
      if (!hook || declared.has(hook[1])) continue;
      declared.add(hook[1]);
      const fallback = hook[2]?.trim();
      hooks.push({
        name: hook[1],
        value: `var(${hook[1]}${fallback ? `, ${fallback}` : ''})`,
        doc: doc[1].trim(),
      });
    }

    if (!declarations.length && !hooks.length) continue;

    const toRow = (decl) => ({
      name: decl.name,
      role: decl.doc,
      default: resolveBinding(decl.value, { shared, local }),
    });

    components[name] = {
      file: relative(ROOT, file).split(sep).join('/'),
      vars: declarations.map(toRow),
      hooks: hooks.map(toRow),
      undocumented: declarations.filter((d) => !d.doc).map((d) => d.name),
    };
  }

  return components;
}

function build() {
  const shared = parseSharedConfig();
  const sharedOut = {};
  for (const [name, decl] of shared) {
    sharedOut[name] = {
      group: decl.group,
      role: decl.doc,
      default: resolveBinding(decl.value, { shared, local: shared }),
    };
  }

  return {
    $generatedBy: 'scripts/docs.config.mjs',
    $source: {
      shared: relative(ROOT, SHARED_CONFIG).split(sep).join('/'),
      components: COMPONENTS_DIRS.map((dir) => relative(ROOT, dir).split(sep).join('/')).join(', '),
    },
    groups: GROUPS,
    shared: sharedOut,
    components: collectComponents(shared),
  };
}

const manifest = build();
const serialized = `${JSON.stringify(manifest, null, 2)}\n`;

if (process.argv.includes('--check')) {
  const current = existsSync(OUT_FILE) ? readFileSync(OUT_FILE, 'utf8') : null;
  if (current !== serialized) {
    console.error('✗ storybook/generated/ui-config.json est périmé — lance `npm run docs:config`.');
    process.exit(1);
  }
  console.log('✓ ui-config.json à jour.');
} else {
  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, serialized);
  const count = Object.keys(manifest.components).length;
  const rows = Object.values(manifest.components).reduce((n, c) => n + c.vars.length + c.hooks.length, 0);
  const missing = Object.entries(manifest.components).filter(([, c]) => c.undocumented.length);
  console.log(`✓ ui-config.json : ${count} composants, ${rows} lignes documentées.`);
  if (missing.length) {
    const total = missing.reduce((n, [, c]) => n + c.undocumented.length, 0);
    console.log(`  ${total} variables sans commentaire /// (non affichées) sur ${missing.length} composants.`);
  }
}
