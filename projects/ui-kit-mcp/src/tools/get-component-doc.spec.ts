import { describe, expect, it, vi } from 'vitest';
import { FIXTURE_DOCS } from '../test-fixtures.js';

const buttonSections = FIXTURE_DOCS.filter((d) => d.name === 'ui-button');

vi.mock('../data.js', () => ({
  getComponentSections: vi.fn((name: string) => (name === 'ui-button' ? buttonSections : [])),
  listComponentNames: vi.fn(() => ['ui-button', 'ui-select']),
}));

import { getComponentDoc } from './get-component-doc.js';

describe('getComponentDoc', () => {
  it('returns every section of a known component, with title and source', () => {
    const result = getComponentDoc('ui-button');
    const payload = JSON.parse(result.content[0].text);
    expect(payload.name).toBe('ui-button');
    expect(payload.title).toBe('Components/ui/actions/ui-button');
    expect(payload.source).toBe('projects/ui-kit/actions/ui-button/ui-button.mdx');
    expect(payload.sections).toEqual([
      { section: 'Overview', text: 'ui-button' },
      { section: 'API', text: buttonSections[1].text },
      { section: 'Theming', text: buttonSections[2].text },
    ]);
    expect(result.isError).toBeUndefined();
  });

  it('falls back to "Overview" for the section-less first entry', () => {
    const result = getComponentDoc('ui-button');
    const payload = JSON.parse(result.content[0].text);
    expect(payload.sections[0].section).toBe('Overview');
  });

  it('reports an error and suggests available names for an unknown component', () => {
    const result = getComponentDoc('ui-does-not-exist');
    const payload = JSON.parse(result.content[0].text);
    expect(result.isError).toBe(true);
    expect(payload.error).toMatch(/ui-does-not-exist/);
    expect(payload.available).toEqual(['ui-button', 'ui-select']);
  });
});
