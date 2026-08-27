import { readFileSync } from 'node:fs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { FIXTURE_SEARCH_DOCS, FIXTURE_UI_CONFIG } from './test-fixtures.js';

// `data.ts` lit le manifeste sur disque via `readFileSync` (chemin calculé
// depuis `import.meta.url`) : on mocke le module `node:fs` plutôt que
// d'écrire de vrais fichiers, pour rester indépendant du manifeste embarqué
// (généré par `pnpm mcp:assets`, absent d'un checkout propre).
vi.mock('node:fs', () => ({ readFileSync: vi.fn() }));

// Chaque test recharge le module : `data.ts` met en cache le manifeste au
// premier appel (`searchDocsCache`/`uiConfigCache`), ce qui ferait fuiter le
// mock d'un test vers l'autre sans ce reset.
async function importFreshData() {
  vi.resetModules();
  return import('./data.js');
}

describe('data', () => {
  beforeEach(() => {
    vi.mocked(readFileSync).mockImplementation((path) => {
      const p = String(path);
      if (p.endsWith('text-search-docs.json')) return JSON.stringify(FIXTURE_SEARCH_DOCS);
      if (p.endsWith('ui-config.json')) return JSON.stringify(FIXTURE_UI_CONFIG);
      throw new Error(`unexpected path in test: ${p}`);
    });
  });

  afterEach(() => {
    vi.resetAllMocks();
  });

  describe('loadSearchDocs', () => {
    it('parses and returns the manifest', async () => {
      const { loadSearchDocs } = await importFreshData();
      expect(loadSearchDocs()).toEqual(FIXTURE_SEARCH_DOCS);
    });

    it('reads the file only once (caches across calls)', async () => {
      const { loadSearchDocs } = await importFreshData();
      loadSearchDocs();
      loadSearchDocs();
      expect(readFileSync).toHaveBeenCalledTimes(1);
    });

    it('wraps a read failure in a helpful error, with the original as cause', async () => {
      vi.mocked(readFileSync).mockImplementation(() => {
        throw new Error('ENOENT');
      });
      const { loadSearchDocs } = await importFreshData();
      expect(() => loadSearchDocs()).toThrowError(/text-search-docs\.json/);
      try {
        loadSearchDocs();
        expect.unreachable();
      } catch (error) {
        expect((error as Error).cause).toBeInstanceOf(Error);
        expect(((error as Error).cause as Error).message).toBe('ENOENT');
      }
    });
  });

  describe('loadUiConfig', () => {
    it('parses and returns the manifest', async () => {
      const { loadUiConfig } = await importFreshData();
      expect(loadUiConfig()).toEqual(FIXTURE_UI_CONFIG);
    });
  });

  describe('listComponentNames', () => {
    it('lists only components under projects/ui-kit/, deduplicated and sorted', async () => {
      const { listComponentNames } = await importFreshData();
      // ui-button apparaît 3 fois dans la fixture (Overview/API/Theming) : une seule entrée attendue.
      expect(listComponentNames()).toEqual(['ui-button', 'ui-select']);
    });

    it('excludes foundations/guideline pages (not sourced from projects/ui-kit/)', async () => {
      const { listComponentNames } = await importFreshData();
      expect(listComponentNames()).not.toContain('colors');
    });
  });

  describe('getComponentSections', () => {
    it('returns every section for a known component, in disk order', async () => {
      const { getComponentSections } = await importFreshData();
      const sections = getComponentSections('ui-button');
      expect(sections.map((s) => s.section)).toEqual([null, 'API', 'Theming']);
    });

    it('returns an empty array for an unknown component', async () => {
      const { getComponentSections } = await importFreshData();
      expect(getComponentSections('ui-does-not-exist')).toEqual([]);
    });
  });
});
