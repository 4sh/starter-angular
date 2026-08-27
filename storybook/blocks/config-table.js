/**
 * <ConfigTable of="ui-card" /> — bloc de doc pour la section « Theming ».
 *
 * La table n'est PAS écrite à la main : elle est lue dans
 * `storybook/generated/ui-config.json` (produit par le script `docs:config` depuis
 * les `.scss`), et la colonne « Valeur résolue » est mesurée dans le navigateur.
 *
 * Conséquence : un projet qui rebinde `$card-radius: var(--radius-xs)` ou qui
 * remplace une constante partagée par la sienne n'a AUCUNE doc à reprendre — la
 * table suit, valeurs comprises (thème, marque et viewport actifs inclus).
 *
 * Props :
 *   of           nom du composant (clé du manifeste, ex. `ui-card`)
 *   only         (option) liste blanche de noms de variables à afficher
 *   hooks        (option, défaut true) affiche la table des custom properties
 */

import React from 'react';
import manifest from '../generated/ui-config.json';

const el = React.createElement;

/** Toutes les variables CSS à sonder dans une valeur résolue (maps incluses). */
function collectCssVars(resolved, out = []) {
  if (!resolved) return out;
  if (resolved.cssVar) out.push(resolved.cssVar);
  collectCssVars(resolved.fallback, out);
  for (const entry of resolved.entries ?? []) collectCssVars(entry.value, out);
  return out;
}

/**
 * Lit la valeur des variables CSS dans le contexte de la page de doc.
 *
 * Une custom property est substituée au moment du calcul : poser
 * `--probe: var(--units-lg)` puis relire `--probe` traverse toute la chaîne de
 * références et respecte le mode / la marque / les media queries actifs.
 */
function probe(scope, names) {
  const node = document.createElement('span');
  node.style.position = 'absolute';
  node.style.visibility = 'hidden';
  node.setAttribute('aria-hidden', 'true');
  scope.appendChild(node);

  const style = getComputedStyle(node);
  const out = {};
  for (const name of names) {
    node.style.setProperty('--probe', `var(${name})`);
    out[name] = style.getPropertyValue('--probe').trim() || null;
  }

  node.remove();
  return out;
}

/** Sonde les variables CSS et se resynchronise sur les changements de contexte. */
function useResolvedVars(names) {
  const scopeRef = React.useRef(null);
  const [values, setValues] = React.useState({});
  const key = names.join('|');

  React.useEffect(() => {
    const scope = scopeRef.current;
    if (!scope || !names.length) return undefined;

    // `setTimeout` et non `requestAnimationFrame` : rAF ne tire jamais dans un
    // onglet throttlé / masqué, la table resterait vide.
    let timer = setTimeout(() => setValues(probe(scope, names)), 0);
    const resync = () => {
      clearTimeout(timer);
      timer = setTimeout(() => setValues(probe(scope, names)), 120);
    };

    // Mode clair/sombre et marque : attributs posés sur `<html>`.
    const attributes = new MutationObserver(resync);
    attributes.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class', 'style', 'data-theme', 'data-brand'],
    });

    // Viewport : les tokens responsive changent par media query.
    const box = new ResizeObserver(resync);
    box.observe(document.documentElement);
    window.addEventListener('resize', resync);

    // Rattrapage : un onglet masqué ne rend pas la page, donc ni `resize` ni
    // `ResizeObserver` ne tirent pendant ce temps. On resonde au retour.
    document.addEventListener('visibilitychange', resync);

    return () => {
      clearTimeout(timer);
      attributes.disconnect();
      box.disconnect();
      window.removeEventListener('resize', resync);
      document.removeEventListener('visibilitychange', resync);
    };
  }, [key]);

  return [scopeRef, values];
}

// --- Rendu ------------------------------------------------------------

// Texte de l'infobulle du repère « générée depuis … ». Dit le modèle une fois,
// au lieu d'un paragraphe recopié dans chaque section Theming.
// Texte brut : une infobulle native ne rend ni markdown ni HTML.
const ORIGIN_TOOLTIP =
  'Table générée par le script « docs:config ». Le contrat, c’est le nom de la variable et son rôle. ' +
  'La colonne « Hook exposé » donne la custom property à poser pour retoucher la valeur sans forker ' +
  'le SCSS (mode package) : sur :root pour tous les exemplaires, sur un sélecteur pour une seule zone. ' +
  'La colonne « Défaut (starter) » n’est que le réglage livré par ce starter : la rebinder ne demande ' +
  'aucune reprise de doc. La valeur résolue est mesurée dans le thème, la marque et le viewport actifs.';

const BADGES = {
  token: { label: 'token', title: 'Pointe directement sur un design token.' },
  shared: { label: 'partagé', title: 'Passe par une constante mutualisée de ui-config.' },
  literal: { label: 'en dur', title: 'Valeur littérale : ne suit ni le thème ni les tokens.' },
  list: { label: 'liste', title: 'Liste SCSS des valeurs supportées.' },
  map: { label: 'map', title: 'Map SCSS : une entrée par variante.' },
};

function badge(kind) {
  const meta = BADGES[kind];
  if (!meta) return null;
  return el(
    'span',
    {
      title: meta.title,
      style: {
        display: 'inline-block',
        marginLeft: 6,
        padding: '0 6px',
        borderRadius: 999,
        border: '1px solid var(--sb-border)',
        background: 'var(--sb-bg-subtle)',
        color: 'var(--sb-text-subtle)',
        fontSize: 11,
        lineHeight: '17px',
        verticalAlign: '1px',
        whiteSpace: 'nowrap',
      },
    },
    meta.label,
  );
}

/** Rend les backticks d'un commentaire `///` en code inline. */
function inlineCode(text) {
  if (!text) return '—';
  return text
    .split(/`([^`]+)`/)
    .map((part, index) => (index % 2 ? el('code', { key: `${part}-${index}` }, part) : part));
}

/** Chaîne d'indirections : `Forms · $form-field-height → $control-stroke-width`. */
function chain(steps) {
  if (!steps.length) return null;
  return el(
    'div',
    { style: { marginTop: 4, fontSize: 12, color: 'var(--sb-text-subtle)' } },
    steps.map((step, index) =>
      el(
        React.Fragment,
        { key: `${step.name}-${index}` },
        index > 0 ? ' → ' : 'via ',
        step.group
          ? el(
              'a',
              { href: `?path=/docs/${manifest.groups[step.group].docId}--docs` },
              `${manifest.groups[step.group].label} · ${step.name}`,
            )
          : el('code', null, step.name),
      ),
    ),
  );
}

/** Un binding `var(--ui-x, défaut)` : le hook exposé au consommateur, sinon null. */
function hookOf(resolved) {
  return resolved?.cssVar?.startsWith('--ui-') ? resolved.cssVar : null;
}

/**
 * Cellule « Hook exposé » : le point de surcharge en mode package. Le composant ne
 * déclare jamais ce nom, donc le poser n'importe où au-dessus (`:root`, un
 * sélecteur, l'élément) suffit à gagner.
 */
function hookCell(resolved) {
  const hook = hookOf(resolved);
  if (!hook) return el('td', { style: { color: 'var(--sb-text-subtle)' } }, '—');
  return el('td', null, el('code', null, hook));
}

/** Cellule « Défaut (starter) ». */
function defaultCell(row) {
  // Derrière un hook, le réglage livré est son FALLBACK : c'est lui qu'on décrit
  // (badge + chaîne d'indirections), le nom du hook ayant sa propre colonne.
  const resolved = hookOf(row) ? (row.fallback ?? row) : row;
  const kind = resolved.steps.some((s) => s.via === 'shared') ? 'shared' : resolved.kind;
  // Map : lister les clés plutôt que le mot « map », que le badge dit déjà.
  const inlineItems =
    resolved.kind === 'list'
      ? resolved.items
      : resolved.kind === 'map'
        ? (resolved.entries ?? []).map((e) => e.key)
        : null;

  const head = inlineItems
    ? inlineItems.map((item, i) =>
        el(React.Fragment, { key: item }, i > 0 ? ', ' : null, el('code', null, item)),
      )
    : el('code', null, resolved.cssVar ? `var(${resolved.cssVar})` : (resolved.literal ?? 'map'));

  return el('td', null, head, badge(kind), chain(resolved.steps));
}

/** Cellule « Valeur résolue » (mesurée dans le navigateur). */
function valueCell(resolved, values) {
  if (resolved.cssVar) {
    const hasValue = resolved.cssVar in values;
    // Distinguer « pas encore sondé » d'un token absent du thème courant.
    if (!hasValue) return el('td', { style: { color: 'var(--sb-text-subtle)' } }, '…');
    const value = values[resolved.cssVar];
    if (value) return el('td', null, el('code', null, value));
    // Hook non posé : c'est le fallback qui s'applique réellement.
    const fallback = resolved.fallback;
    const fallbackValue = fallback?.cssVar ? values[fallback.cssVar] : fallback?.literal;
    if (fallbackValue) {
      return el(
        'td',
        null,
        el('code', null, fallbackValue),
        el('span', { style: { color: 'var(--sb-text-subtle)', fontSize: 12 } }, ' (défaut)'),
      );
    }
    return el('td', { style: { color: 'var(--sb-text-subtle)' } }, 'non défini');
  }
  if (resolved.literal) return el('td', null, el('code', null, resolved.literal));
  return el('td', { style: { color: 'var(--sb-text-subtle)' } }, '—');
}

/** Lignes filles d'une map : une par entrée (`default.height → 44px`). */
function mapRows(name, resolved, values, withHook, prefix = '') {
  const rows = [];
  for (const entry of resolved.entries ?? []) {
    const path = `${prefix}${entry.key}`;
    if (entry.value?.kind === 'map') {
      rows.push(...mapRows(name, entry.value, values, withHook, `${path}.`));
      continue;
    }
    rows.push(
      el(
        'tr',
        { key: `${name}-${path}` },
        el(
          'td',
          { style: { paddingLeft: 32, color: 'var(--sb-text-subtle)' } },
          el('code', null, `${path}`),
        ),
        el('td', { style: { color: 'var(--sb-text-subtle)' } }, '↳ entrée de map'),
        ...(withHook ? [entry.value ? hookCell(entry.value) : el('td', null, '—')] : []),
        entry.value ? defaultCell(entry.value) : el('td', null, '—'),
        entry.value ? valueCell(entry.value, values) : el('td', null, '—'),
      ),
    );
  }
  return rows;
}

/**
 * `withHook` : la table des `$var` porte la colonne du hook exposé. La table des
 * custom properties ne l'a pas — son nom de variable EST déjà le hook.
 */
function table(caption, rows, values, withHook) {
  return el(
    'div',
    null,
    caption ? el('p', { style: { margin: '0 0 8px', fontWeight: 600 } }, caption) : null,
    el(
      'table',
      { className: 'doc-table' },
      el(
        'thead',
        null,
        el(
          'tr',
          null,
          el('th', { style: { width: 200 } }, 'Variable'),
          el('th', { style: { width: 200 } }, 'Rôle'),
          ...(withHook ? [el('th', { style: { width: 260 } }, 'Hook exposé')] : []),
          el('th', { style: { width: 200 } }, 'Défaut (starter)'),
          el('th', { style: { width: 130 } }, 'Valeur résolue'),
        ),
      ),
      el(
        'tbody',
        null,
        rows.flatMap((row) => [
          el(
            'tr',
            { key: row.name },
            el('td', null, el('code', null, row.name)),
            el('td', null, inlineCode(row.role)),
            ...(withHook ? [hookCell(row.default)] : []),
            defaultCell(row.default),
            valueCell(row.default, values),
          ),
          ...mapRows(row.name, row.default, values, withHook),
        ]),
      ),
    ),
  );
}

/**
 * <SharedConfigTable group="global-ui" /> — les constantes mutualisées de
 * `_ui-config.scss` pour un groupe. Même contrat que ConfigTable : le rôle vient du
 * `///`, la valeur est mesurée, et la colonne « Hook exposé » donne le nom à poser
 * pour retoucher toute la catégorie sans recompiler.
 */
export function SharedConfigTable({ group, prefix, exclude }) {
  const rows = React.useMemo(() => {
    const skip = exclude ?? [];
    return Object.entries(manifest.shared ?? {})
      .filter(([name, entry]) => entry.group === group)
      .filter(([name]) => (prefix ? name.startsWith(`$${prefix}`) : true))
      .filter(([name]) => !skip.some((p) => name.startsWith(`$${p}`)))
      .map(([name, entry]) => ({ name, role: entry.role, default: entry.default }));
  }, [group, prefix, exclude && exclude.join('|')]);

  const names = React.useMemo(() => {
    const all = [];
    for (const row of rows) collectCssVars(row.default, all);
    return [...new Set(all)].sort();
  }, [rows]);

  const [scopeRef, values] = useResolvedVars(names);

  if (!rows.length) {
    return el(
      'p',
      null,
      el('strong', null, `SharedConfigTable : aucune constante pour le groupe « ${group} ». `),
      'Lance ',
      el('code', null, 'docs:config'),
      '.',
    );
  }

  return el(
    'div',
    { ref: scopeRef },
    el(
      'p',
      { style: { margin: '0 0 12px', fontSize: 12, color: 'var(--sb-text-subtle)' } },
      el(
        'span',
        {
          title: ORIGIN_TOOLTIP,
          style: { cursor: 'help', borderBottom: '1px dotted currentColor' },
        },
        'ⓘ générée depuis ',
        el('code', null, manifest.$source.shared),
      ),
    ),
    table(null, rows, values, true),
  );
}

export function ConfigTable({ of, only, hooks = true, label }) {
  const component = manifest.components[of];

  const vars = React.useMemo(() => {
    if (!component) return [];
    return only ? component.vars.filter((v) => only.includes(v.name)) : component.vars;
  }, [component, only && only.join('|')]);

  const hookRows = hooks && component ? component.hooks : [];
  const names = React.useMemo(() => {
    const all = [];
    for (const row of [...vars, ...hookRows]) collectCssVars(row.default, all);
    return [...new Set(all)].sort();
  }, [vars, hookRows]);

  const [scopeRef, values] = useResolvedVars(names);

  if (!component) {
    return el(
      'p',
      null,
      el('strong', null, `ConfigTable : « ${of} » est absent du manifeste. `),
      'Lance ',
      el('code', null, 'docs:config'),
      ' (ou vérifie que le composant déclare bien des variables documentées par un commentaire ',
      el('code', null, '///'),
      ').',
    );
  }

  return el(
    'div',
    { ref: scopeRef },
    // Repère discret sous le titre : l'explication du modèle (contrat vs réglage
    // livré vs valeur mesurée) tient dans l'infobulle, pour ne pas alourdir la
    // page d'un paragraphe répété sur chaque composant.
    el(
      'p',
      {
        style: { margin: '0 0 12px', fontSize: 12, color: 'var(--sb-text-subtle)' },
      },
      el(
        'span',
        {
          title: ORIGIN_TOOLTIP,
          style: { cursor: 'help', borderBottom: '1px dotted currentColor' },
        },
        'ⓘ générée depuis ',
        el('code', null, component.file),
      ),
    ),
    // `label` : à passer quand une page documente plusieurs composants, pour
    // qu'on sache à quel `.scss` chaque table appartient.
    vars.length ? table(label ? el('code', null, label) : null, vars, values, true) : null,
    hookRows.length
      ? table(
          label
            ? ['Custom properties exposées — ', el('code', { key: label }, label)]
            : 'Custom properties exposées',
          hookRows,
          values,
          false,
        )
      : null,
  );
}

export default ConfigTable;
