/**
 * <ConfigTable of="ui-card" /> — bloc de doc pour la section « Theming ».
 *
 * La table n'est PAS écrite à la main : elle est lue dans
 * `storybook/generated/ui-config.json` (produit par `npm run docs:config` depuis
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
    meta.label
  );
}

/** Rend les backticks d'un commentaire `///` en code inline. */
function inlineCode(text) {
  if (!text) return '—';
  return text
    .split(/`([^`]+)`/)
    .map((part, index) =>
      index % 2 ? el('code', { key: `${part}-${index}` }, part) : part
    );
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
              `${manifest.groups[step.group].label} · ${step.name}`
            )
          : el('code', null, step.name)
      )
    )
  );
}

/** Cellule « Défaut (starter) ». */
function defaultCell(resolved) {
  const kind = resolved.steps.some((s) => s.via === 'shared') ? 'shared' : resolved.kind;
  // Map : lister les clés plutôt que le mot « map », que le badge dit déjà.
  const inlineItems =
    resolved.kind === 'list' ? resolved.items
    : resolved.kind === 'map' ? (resolved.entries ?? []).map((e) => e.key)
    : null;

  const head =
    inlineItems
      ? inlineItems.map((item, i) =>
          el(React.Fragment, { key: item }, i > 0 ? ', ' : null, el('code', null, item))
        )
      : el(
          'code',
          null,
          resolved.cssVar
            ? // Un hook `var(--x, défaut)` : montrer le défaut, c'est lui qui s'applique
              // tant que la custom property n'est pas posée par le consommateur.
              `var(${resolved.cssVar}${resolved.fallback ? `, ${resolved.fallback.cssVar ? `var(${resolved.fallback.cssVar})` : resolved.fallback.literal}` : ''})`
            : (resolved.literal ?? 'map')
        );

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
        el('span', { style: { color: 'var(--sb-text-subtle)', fontSize: 12 } }, ' (défaut)')
      );
    }
    return el('td', { style: { color: 'var(--sb-text-subtle)' } }, 'non défini');
  }
  if (resolved.literal) return el('td', null, el('code', null, resolved.literal));
  return el('td', { style: { color: 'var(--sb-text-subtle)' } }, '—');
}

/** Lignes filles d'une map : une par entrée (`default.height → 44px`). */
function mapRows(name, resolved, values, prefix = '') {
  const rows = [];
  for (const entry of resolved.entries ?? []) {
    const path = `${prefix}${entry.key}`;
    if (entry.value?.kind === 'map') {
      rows.push(...mapRows(name, entry.value, values, `${path}.`));
      continue;
    }
    rows.push(
      el(
        'tr',
        { key: `${name}-${path}` },
        el(
          'td',
          { style: { paddingLeft: 32, color: 'var(--sb-text-subtle)' } },
          el('code', null, `${path}`)
        ),
        el('td', { style: { color: 'var(--sb-text-subtle)' } }, '↳ entrée de map'),
        entry.value ? defaultCell(entry.value) : el('td', null, '—'),
        entry.value ? valueCell(entry.value, values) : el('td', null, '—')
      )
    );
  }
  return rows;
}

function table(caption, rows, values) {
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
          el('th', { style: { width: 230 } }, 'Variable'),
          el('th', null, 'Rôle'),
          el('th', { style: { width: 240 } }, 'Défaut (starter)'),
          el('th', { style: { width: 130 } }, 'Valeur résolue')
        )
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
            defaultCell(row.default),
            valueCell(row.default, values)
          ),
          ...mapRows(row.name, row.default, values),
        ])
      )
    )
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
      el('code', null, 'npm run docs:config'),
      ' (ou vérifie que le composant déclare bien des variables documentées par un commentaire ',
      el('code', null, '///'),
      ').'
    );
  }

  return el(
    'div',
    { ref: scopeRef },
    // Repère discret sous le titre : dit de quel `.scss` la table est extraite.
    el(
      'p',
      {
        style: { margin: '0 0 12px', fontSize: 12, color: 'var(--sb-text-subtle)' },
      },
      'générée depuis ',
      el('code', null, component.file)
    ),
    // `label` : à passer quand une page documente plusieurs composants, pour
    // qu'on sache à quel `.scss` chaque table appartient.
    vars.length ? table(label ? el('code', null, label) : null, vars, values) : null,
    hookRows.length
      ? table(label ? ['Custom properties exposées — ', el('code', { key: label }, label)] : 'Custom properties exposées', hookRows, values)
      : null
  );
}

export default ConfigTable;
