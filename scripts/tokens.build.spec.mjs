import { execFileSync } from 'node:child_process';
import { mkdtempSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { tmpdir } from 'node:os';
import { fileURLToPath } from 'node:url';
import { afterEach, describe, expect, it } from 'vitest';

const SCRIPT = join(dirname(fileURLToPath(import.meta.url)), 'tokens.build.mjs');

/**
 * Le pipeline est piloté par `tokens.config.json` et écrit à côté : chaque cas
 * s'exécute dans son propre dossier jetable, via `--config`, donc rien ne touche
 * aux fichiers générés du dépôt.
 */
const dirs = [];
afterEach(() => {
  for (const d of dirs.splice(0)) rmSync(d, { recursive: true, force: true });
});

/** Deux collections : une préfixée (`primitives`), une au préfixe vide (`semantics`,
 * avec un axe de modes) — la configuration du starter, en miniature. */
function config(extraCollections = []) {
  return {
    sourceRoot: 'design-tokens',
    header: 'test',
    collections: [
      {
        id: 'primitives',
        prefix: 'primitives',
        preserveCase: false,
        files: ['primitives.json'],
        modeAxes: [],
      },
      ...extraCollections,
      {
        id: 'semantics',
        prefix: '',
        preserveCase: false,
        files: ['semantics.json'],
        modeAxes: [
          {
            name: 'theme',
            source: 'nested',
            strategy: 'selectors',
            default: 'modeLight',
            map: { modeLight: ':root', modeDark: "[data-theme='dark']" },
          },
        ],
      },
    ],
    outputs: [
      {
        id: 'css',
        format: 'css-vars',
        destination: 'out',
        collections: ['primitives', ...extraCollections.map((c) => c.id), 'semantics'],
      },
    ],
  };
}

const PRIMITIVES = {
  grey: {
    900: { $value: '#111111', $type: 'color' },
    50: { $value: '#fafafa', $type: 'color' },
  },
};

/** `global.text.default` existe dans les deux modes : c'est la cible des alias. */
function semantics(extra = {}) {
  return {
    global: {
      modeLight: { text: { default: { $value: '{primitives.grey.900}', $type: 'color' } } },
      modeDark: { text: { default: { $value: '{primitives.grey.50}', $type: 'color' } } },
    },
    ...extra,
  };
}

function run({ tokens, extraCollections = [] }) {
  const dir = mkdtempSync(join(tmpdir(), 'tokens-build-'));
  dirs.push(dir);
  mkdirSync(join(dir, 'design-tokens'), { recursive: true });
  writeFileSync(join(dir, 'tokens.config.json'), JSON.stringify(config(extraCollections), null, 2));
  for (const [name, content] of Object.entries(tokens)) {
    writeFileSync(join(dir, 'design-tokens', name), JSON.stringify(content, null, 2));
  }
  try {
    execFileSync(process.execPath, [SCRIPT, '--config', join(dir, 'tokens.config.json')], {
      encoding: 'utf8',
      stdio: 'pipe',
    });
  } catch (error) {
    return { ok: false, message: `${error.stdout ?? ''}${error.stderr ?? ''}`, dir };
  }
  return {
    ok: true,
    dir,
    semantics: readFileSync(join(dir, 'out', '_tokens-semantics.scss'), 'utf8'),
  };
}

describe('tokens.build — résolution des références', () => {
  it('résout un alias intra-collection écrit SANS le nom de sa collection', () => {
    // La forme qu'exporte Figma / Token Flow Manager : le nom de la collection
    // ne fait pas partie du chemin d'une variable (FSHSP-203).
    const result = run({
      tokens: {
        'primitives.json': PRIMITIVES,
        'semantics.json': semantics({
          form: {
            modeLight: { content: { $value: '{global.text.default}', $type: 'color' } },
            modeDark: { content: { $value: '{global.text.default}', $type: 'color' } },
          },
        }),
      },
    });

    expect(result.message ?? '').toBe('');
    expect(result.ok).toBe(true);
    // L'indirection est conservée, pas aplatie : c'est elle qui rend l'alias
    // juste par mode, la cible ne valant pas la même chose en clair et en sombre.
    expect(result.semantics).toContain('--form-content: var(--global-text-default)');
  });

  it('donne le même résultat quand la référence porte déjà sa collection', () => {
    const bare = run({
      tokens: {
        'primitives.json': PRIMITIVES,
        'semantics.json': semantics({
          form: {
            modeLight: { content: { $value: '{global.text.default}', $type: 'color' } },
            modeDark: { content: { $value: '{global.text.default}', $type: 'color' } },
          },
        }),
      },
    });
    const prefixed = run({
      tokens: {
        'primitives.json': PRIMITIVES,
        'semantics.json': semantics({
          form: {
            modeLight: { content: { $value: '{semantics.global.text.default}', $type: 'color' } },
            modeDark: { content: { $value: '{semantics.global.text.default}', $type: 'color' } },
          },
        }),
      },
    });

    expect(prefixed.ok).toBe(true);
    expect(prefixed.semantics).toBe(bare.semantics);
  });

  it('laisse intacte une référence vers une autre collection', () => {
    const result = run({
      tokens: { 'primitives.json': PRIMITIVES, 'semantics.json': semantics() },
    });

    expect(result.ok).toBe(true);
    expect(result.semantics).toContain('--global-text-default: var(--primitives-grey-900)');
    expect(result.semantics).toContain('--global-text-default: var(--primitives-grey-50)');
  });

  it("suit l'alias jusqu'à la bonne valeur dans CHAQUE mode", () => {
    const result = run({
      tokens: {
        'primitives.json': PRIMITIVES,
        'semantics.json': semantics({
          form: {
            modeLight: { content: { $value: '{global.text.default}', $type: 'color' } },
            modeDark: { content: { $value: '{global.text.default}', $type: 'color' } },
          },
        }),
      },
    });

    const light = result.semantics.slice(
      result.semantics.indexOf(':root'),
      result.semantics.indexOf('[data-theme='),
    );
    const dark = result.semantics.slice(result.semantics.indexOf('[data-theme='));
    expect(light).toContain('--global-text-default: var(--primitives-grey-900)');
    expect(dark).toContain('--global-text-default: var(--primitives-grey-50)');
    // Le même `var(…)` dans les deux blocs : c'est la cible qui change, pas l'alias.
    expect(light).toContain('--form-content: var(--global-text-default)');
    expect(dark).toContain('--form-content: var(--global-text-default)');
  });

  it('donne la priorité à la collection quand un groupe porte le même nom', () => {
    // `metrics` est à la fois une collection ET un groupe de `semantics`. La
    // référence nue `{metrics.sm}` vise la COLLECTION : le préfixage automatique
    // ne s'applique jamais à une racine qui est déjà une clé de collection.
    const metrics = {
      id: 'metrics',
      prefix: 'metrics',
      preserveCase: false,
      files: ['metrics.json'],
      modeAxes: [],
    };
    const result = run({
      extraCollections: [metrics],
      tokens: {
        'primitives.json': PRIMITIVES,
        'metrics.json': { sm: { $value: '8px', $type: 'dimension' } },
        'semantics.json': semantics({
          metrics: { modeLight: { local: { $value: '4px', $type: 'dimension' } } },
          gap: {
            modeLight: { field: { $value: '{metrics.sm}', $type: 'dimension' } },
          },
        }),
      },
    });

    expect(result.message ?? '').toBe('');
    expect(result.ok).toBe(true);
    expect(result.semantics).toContain('--gap-field: var(--metrics-sm)');
  });

  it('échoue sur une référence réellement cassée, en nommant le fichier et le jeton', () => {
    const result = run({
      tokens: {
        'primitives.json': PRIMITIVES,
        'semantics.json': semantics({
          form: {
            modeLight: { content: { $value: '{global.text.nope}', $type: 'color' } },
          },
        }),
      },
    });

    expect(result.ok).toBe(false);
    expect(result.message).toContain('semantics.json');
    expect(result.message).toContain('form.modeLight.content');
    expect(result.message).toContain('{global.text.nope}');
  });
});
