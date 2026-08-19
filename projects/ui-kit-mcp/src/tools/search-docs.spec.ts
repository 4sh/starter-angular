import { describe, expect, it, vi } from 'vitest';
import { FIXTURE_DOCS } from '../test-fixtures.js';

vi.mock('../data.js', () => ({
  loadSearchDocs: vi.fn(() => ({ docs: FIXTURE_DOCS })),
}));

import { searchDocs } from './search-docs.js';

describe('searchDocs', () => {
  it('finds a section by a term that only appears in its text', () => {
    const result = searchDocs('anneau de focus');
    const payload = JSON.parse(result.content[0].text);
    expect(payload.results.some((r: { name: string; section: string }) => r.name === 'ui-button' && r.section === 'Theming')).toBe(
      true,
    );
  });

  it('ranks a title/name match above a body-text-only match', () => {
    const result = searchDocs('select');
    const payload = JSON.parse(result.content[0].text);
    expect(payload.results[0].name).toBe('ui-select');
  });

  it('respects the limit parameter', () => {
    const result = searchDocs('ui', 1);
    const payload = JSON.parse(result.content[0].text);
    expect(payload.results).toHaveLength(1);
  });

  it('returns an empty result set for a query matching nothing', () => {
    const result = searchDocs('zzz-nonexistent-term-zzz');
    const payload = JSON.parse(result.content[0].text);
    expect(payload.count).toBe(0);
    expect(payload.results).toEqual([]);
  });

  it('truncates long excerpts to 400 characters', () => {
    const result = searchDocs('anneau');
    const payload = JSON.parse(result.content[0].text);
    for (const r of payload.results) {
      expect(r.excerpt.length).toBeLessThanOrEqual(400);
    }
  });
});
