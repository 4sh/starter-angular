#!/usr/bin/env node
/**
 * docs.search.mjs — construit l'index de recherche plein texte de la doc
 * Storybook : `storybook/public/text-search-docs.json`, servi comme fichier
 * statique et consommé par l'addon local `storybook/addons/text-search/`.
 *
 * Une entrée d'index = une **section** de page, pas une page. Les pages de
 * composant font plusieurs milliers de pixels de haut : atterrir en haut de
 * `ui-button` parce que « onColor » apparaît quelque part dedans ne rend pas
 * service. Chaque section porte donc l'ancre du titre qui l'ouvre (`#tailles`),
 * calculée avec le même slug que celui rendu par Storybook.
 *
 * L'identifiant de page (`components-ui-actions-ui-button--docs`) est dérivé du
 * titre par le `sanitize()` de Storybook — la même fonction que celle qui
 * indexe les stories, donc pas de slug à deviner. Le titre vient de deux
 * endroits selon la façon dont le MDX s'attache :
 *   - `<Meta title="Foundations/Colors" />` → écrit dans le MDX ;
 *   - `<Meta of={ButtonStories} />` → dans le `meta.title` de la story importée,
 *     qu'on résout en lisant le fichier voisin.
 *
 * Un MDX dont le titre ne se résout pas fait **échouer** le script. C'est
 * délibéré : le générateur précédent avalait l'erreur fichier par fichier, et
 * 54 des 68 pages — toute la doc composants — étaient absentes de l'index sans
 * que rien ne le signale.
 *
 * Usage :
 *   node scripts/docs.search.mjs            # génère l'index
 *   node scripts/docs.search.mjs --check    # échoue si l'index est périmé
 */

import { readdirSync, readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { dirname, join, relative, resolve, sep } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkMdx from 'remark-mdx';
import { visit, SKIP } from 'unist-util-visit';
import { sanitize } from 'storybook/internal/csf';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

/** Mêmes racines que les globs `stories` de `storybook/main.js`. */
const DOC_DIRS = [join(ROOT, 'storybook/docs'), join(ROOT, 'projects/ui-kit')];

const OUT_FILE = join(ROOT, 'storybook/public/text-search-docs.json');

/** Extensions tentées pour résoudre l'import d'un `<Meta of={…} />`. */
const STORY_EXTENSIONS = ['', '.ts', '.tsx', '.js', '.mjs'];

const toPosix = (path) => path.split(sep).join('/');

// ---------------------------------------------------------------------------
// Collecte
// ---------------------------------------------------------------------------

/** Parcours récursif trié — l'ordre du disque ne doit pas changer la sortie. */
function collectMdx(dir) {
  if (!existsSync(dir)) return [];
  const found = [];
  const entries = readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name));
  for (const entry of entries) {
    if (entry.name.startsWith('.') || entry.name === 'node_modules') continue;
    const full = join(dir, entry.name);
    if (entry.isDirectory()) found.push(...collectMdx(full));
    else if (entry.name.endsWith('.mdx')) found.push(full);
  }
  return found;
}

const parseMdx = (source) => unified().use(remarkParse).use(remarkMdx).parse(source);

// ---------------------------------------------------------------------------
// Titre de page
// ---------------------------------------------------------------------------

/** Concatène le texte porté par un nœud et sa descendance. */
function nodeText(node) {
  const parts = [];
  visit(node, (child) => {
    if (child.type === 'text' || child.type === 'inlineCode') parts.push(child.value);
  });
  return parts.join('').replace(/\s+/g, ' ').trim();
}

/** Lit les attributs du `<Meta>` : soit un titre littéral, soit l'identifiant importé. */
function readMetaAttributes(tree) {
  let title = null;
  let ofIdentifier = null;

  visit(tree, 'mdxJsxFlowElement', (node) => {
    if (node.name !== 'Meta') return;
    for (const attribute of node.attributes ?? []) {
      if (attribute.type !== 'mdxJsxAttribute') continue;
      if (attribute.name === 'title' && typeof attribute.value === 'string') {
        title = attribute.value;
      }
      if (attribute.name === 'of' && attribute.value && typeof attribute.value === 'object') {
        ofIdentifier = String(attribute.value.value ?? '').trim();
      }
    }
  });

  return { title, ofIdentifier };
}

/** Résout `import * as X from './y.stories'` vers le chemin du fichier de story. */
function resolveStoryPath(tree, mdxPath, identifier) {
  const imports = [];
  visit(tree, 'mdxjsEsm', (node) => imports.push(node.value));

  const importPattern = new RegExp(`import\\s+\\*\\s+as\\s+${identifier}\\s+from\\s+['"]([^'"]+)['"]`);
  const specifier = imports.map((source) => source.match(importPattern)?.[1]).find(Boolean);
  if (!specifier) return null;

  const base = resolve(dirname(mdxPath), specifier);
  return (
    STORY_EXTENSIONS.map((ext) => `${base}${ext}`).find(
      (candidate) => existsSync(candidate) && !candidate.endsWith(sep),
    ) ?? null
  );
}

/** Résout `<Meta of={X} />` puis y lit le `title:` du `meta`. */
function titleFromStories(tree, mdxPath, identifier) {
  const storyPath = resolveStoryPath(tree, mdxPath, identifier);
  if (!storyPath) {
    throw new Error(`<Meta of={${identifier}} /> non résolu depuis ${toPosix(relative(ROOT, mdxPath))}`);
  }

  // Le `title:` recherché est celui du `meta`, pas le premier du fichier : les
  // stories hébergent des composants de démo dont les args en portent aussi
  // (`ui-toast` en déclare sept avant son `meta`).
  const source = readFileSync(storyPath, 'utf8');
  const metaStart = source.search(/^\s*const\s+meta\b/m);
  if (metaStart === -1) {
    throw new Error(`Pas de déclaration \`const meta\` dans ${toPosix(relative(ROOT, storyPath))}`);
  }

  const title = source.slice(metaStart).match(/^\s*title:\s*(['"])(.+?)\1/m)?.[2];
  if (!title) {
    throw new Error(`Pas de \`title:\` dans le \`meta\` de ${toPosix(relative(ROOT, storyPath))}`);
  }
  return title;
}

function resolveTitle(tree, mdxPath) {
  const { title, ofIdentifier } = readMetaAttributes(tree);
  if (title) return title;
  if (ofIdentifier) return titleFromStories(tree, mdxPath, ofIdentifier);
  throw new Error(`Aucun <Meta> exploitable dans ${toPosix(relative(ROOT, mdxPath))}`);
}

// ---------------------------------------------------------------------------
// Contenu des tables générées
// ---------------------------------------------------------------------------
//
// Trois blocs de doc produisent une `<table>` que le MDX ne contient pas — donc
// invisible pour une indexation qui ne lirait que le MDX :
//   <ConfigTable of="ui-x" />        → storybook/generated/ui-config.json
//   <SharedConfigTable group="…" />  → idem, section `shared`
//   <ArgTypes of={XStories} />       → le bloc `argTypes` de la story
// C'est pourtant le contenu le plus cherché : un nom de prop, un hook `--ui-*`.

const UI_CONFIG_FILE = join(ROOT, 'storybook/generated/ui-config.json');

let uiConfigCache = null;
function uiConfig() {
  if (uiConfigCache) return uiConfigCache;
  uiConfigCache = existsSync(UI_CONFIG_FILE)
    ? JSON.parse(readFileSync(UI_CONFIG_FILE, 'utf8'))
    : { shared: {}, components: {} };
  return uiConfigCache;
}

const storySourceCache = new Map();
function storySource(path) {
  if (!storySourceCache.has(path)) storySourceCache.set(path, readFileSync(path, 'utf8'));
  return storySourceCache.get(path);
}

/** Valeur d'un attribut JSX : littéral, ou code source de l'expression. */
function jsxAttribute(node, name) {
  const found = (node.attributes ?? []).find((attr) => attr.type === 'mdxJsxAttribute' && attr.name === name);
  if (!found) return null;
  return typeof found.value === 'string' ? found.value : (found.value?.value ?? null);
}

/** Toute la chaîne de repli d'un réglage : `--ui-checkbox-box-size` → `--ui-form-control-size` → … */
function settingText(setting) {
  const words = [];
  for (let node = setting; node; node = node.fallback) {
    if (node.cssVar) words.push(node.cssVar);
    if (node.literal) words.push(String(node.literal));
    for (const step of node.steps ?? []) if (step.name) words.push(step.name);
  }
  return words;
}

const entryText = (name, entry) => [name, entry.role ?? '', ...settingText(entry.default)];

function configTableText(component) {
  const entry = uiConfig().components?.[component];
  if (!entry) return [];
  return [...(entry.vars ?? []), ...(entry.hooks ?? [])].flatMap((item) => entryText(item.name, item));
}

function sharedConfigTableText(node) {
  const group = jsxAttribute(node, 'group');
  const prefix = jsxAttribute(node, 'prefix');
  // `exclude={['motion-', 'overlay-panel-']}` : on relit les littéraux de l'expression.
  const exclude = [...(jsxAttribute(node, 'exclude') ?? '').matchAll(/['"]([^'"]+)['"]/g)].map((match) => match[1]);

  return Object.entries(uiConfig().shared ?? {})
    .filter(([name, entry]) => {
      if (group && entry.group !== group) return false;
      const bare = name.replace(/^\$/, '');
      if (prefix && !bare.startsWith(prefix)) return false;
      return !exclude.some((skipped) => bare.startsWith(skipped));
    })
    .flatMap(([name, entry]) => entryText(name, entry));
}

/** Fin d'un littéral de chaîne ouvert en `start` (échappements pris en compte). */
function endOfString(source, start) {
  const quote = source[start];
  for (let i = start + 1; i < source.length; i++) {
    if (source[i] === '\\') {
      i++;
      continue;
    }
    if (source[i] === quote) return i;
  }
  return source.length;
}

/**
 * Noms de props et libellés du bloc `argTypes` d'une story — ce que rend
 * `<ArgTypes>`. Les clés de premier niveau sont les props (`iconPos`,
 * `ariaLabel`), les chaînes sont les descriptions, types et valeurs par défaut.
 */
function argTypesText(source) {
  const declaration = source.search(/\bargTypes\s*:\s*\{/);
  if (declaration === -1) return [];

  const words = [];
  let depth = 0;

  for (let i = source.indexOf('{', declaration); i < source.length; i++) {
    const char = source[i];

    if (char === '"' || char === "'" || char === '`') {
      const end = endOfString(source, i);
      words.push(source.slice(i + 1, end));
      i = end;
      continue;
    }
    if (char === '{') {
      depth++;
      continue;
    }
    if (char === '}') {
      depth--;
      if (depth === 0) break;
      continue;
    }
    if (depth === 1) {
      const key = /^([A-Za-z_$][\w$]*)\s*:/.exec(source.slice(i, i + 64));
      if (key) {
        words.push(key[1]);
        i += key[1].length;
      }
    }
  }

  return words;
}

/** Texte rendu par un bloc de doc généré, s'il s'agit de l'un des trois connus. */
function generatedBlockText(node, { tree, mdxPath }) {
  if (node.name === 'ConfigTable') {
    const component = jsxAttribute(node, 'of');
    return component ? configTableText(component) : [];
  }
  if (node.name === 'SharedConfigTable') {
    return sharedConfigTableText(node);
  }
  if (node.name === 'ArgTypes') {
    const identifier = jsxAttribute(node, 'of');
    const storyPath = identifier && resolveStoryPath(tree, mdxPath, identifier);
    return storyPath ? argTypesText(storySource(storyPath)) : [];
  }
  return [];
}

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

/**
 * Reproduit l'ancre que Storybook pose sur les titres (`github-slugger`) :
 * minuscules, ponctuation retirée, espaces en tirets, accents conservés —
 * `Accessibilité` → `accessibilité`, `Bouton posé sur un fond (onColor)` →
 * `bouton-posé-sur-un-fond-oncolor`. Les doublons sont suffixés `-1`, `-2`.
 */
function slugify(text, seen) {
  const base = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, '')
    .trim()
    .replace(/\s+/g, '-');

  const count = seen.get(base) ?? 0;
  seen.set(base, count + 1);
  return count === 0 ? base : `${base}-${count}`;
}

/**
 * Découpe le document aux titres de niveau 2 et 3. Le `#` de niveau 1 est le
 * nom de la page : son texte rejoint l'intro plutôt que d'ouvrir une section.
 */
function extractSections(tree, mdxPath) {
  const sections = [];
  const seenSlugs = new Map();
  let current = { section: null, anchor: null, chunks: [] };

  const flush = () => {
    if (current.section || current.chunks.length) sections.push(current);
  };

  visit(tree, (node) => {
    if (node.type === 'mdxJsxFlowElement') {
      current.chunks.push(...generatedBlockText(node, { tree, mdxPath }));
      return undefined;
    }
    if (node.type === 'heading') {
      const text = nodeText(node);
      if (node.depth === 1) {
        if (text) current.chunks.push(text);
        return SKIP;
      }
      flush();
      current = { section: text, anchor: slugify(text, seenSlugs), chunks: [] };
      return SKIP;
    }
    // Les blocs de code comptent : les noms de variables SCSS et les extraits
    // d'import sont précisément ce qu'on vient chercher dans cette doc.
    if ((node.type === 'text' || node.type === 'inlineCode' || node.type === 'code') && node.value) {
      current.chunks.push(node.value);
    }
    return undefined;
  });

  flush();
  return sections;
}

// ---------------------------------------------------------------------------
// Index
// ---------------------------------------------------------------------------

function build() {
  const files = DOC_DIRS.flatMap(collectMdx);
  const docs = [];

  for (const file of files) {
    const tree = parseMdx(readFileSync(file, 'utf8'));
    const title = resolveTitle(tree, file);
    const docId = `${sanitize(title)}--docs`;
    const name = title.split('/').pop();
    const source = toPosix(relative(ROOT, file));

    for (const { section, anchor, chunks } of extractSections(tree, file)) {
      const text = chunks.join(' ').replace(/\s+/g, ' ').trim();
      if (!text && !section) continue;
      docs.push({
        id: anchor ? `${docId}#${anchor}` : docId,
        docId,
        anchor,
        title,
        name,
        section,
        text,
        source,
      });
    }
  }

  return {
    $generatedBy: 'scripts/docs.search.mjs',
    $source: DOC_DIRS.map((dir) => toPosix(relative(ROOT, dir))).join(', '),
    docs,
  };
}

const serialize = (index) => `${JSON.stringify(index, null, 2)}\n`;

/** Écrit l'index sur disque. Appelée aussi par l'addon (démarrage + hot reload). */
export function writeSearchIndex() {
  const index = build();
  mkdirSync(dirname(OUT_FILE), { recursive: true });
  writeFileSync(OUT_FILE, serialize(index));
  return {
    sections: index.docs.length,
    pages: new Set(index.docs.map((doc) => doc.docId)).size,
  };
}

const isCli = process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url;

if (isCli) {
  if (process.argv.includes('--check')) {
    const current = existsSync(OUT_FILE) ? readFileSync(OUT_FILE, 'utf8') : null;
    if (current !== serialize(build())) {
      console.error('✗ storybook/public/text-search-docs.json est périmé — lance `npm run docs:search`.');
      process.exit(1);
    }
    console.log('✓ text-search-docs.json à jour.');
  } else {
    const { pages, sections } = writeSearchIndex();
    console.log(`✓ text-search-docs.json : ${pages} pages, ${sections} sections indexées.`);
  }
}
