import { describe, expect, it, vi } from 'vitest';
import { FIXTURE_DOCS } from '../test-fixtures.js';

const buttonSections = FIXTURE_DOCS.filter((d) => d.name === 'ui-button');

const buttonHooks = [
  { name: '--ui-button-gap', themable: true },
  {
    name: '--ui-button-surface',
    themable: false,
    exclusion: 'perVariant',
    reason: '…',
    defaults: 29,
  },
];

vi.mock('../data.js', () => ({
  getComponentSections: vi.fn((name: string) =>
    name === 'ui-button' || name === 'ui-select' ? FIXTURE_DOCS.filter((d) => d.name === name) : [],
  ),
  getComponentHooks: vi.fn((name: string) => (name === 'ui-button' ? buttonHooks : [])),
  listComponentNames: vi.fn(() => ['ui-button', 'ui-select']),
}));

import { getComponentDoc, THEMING_NOTE } from './get-component-doc.js';

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

  it('says which hooks may go in a global theme, with the note that reads the fields', () => {
    const payload = JSON.parse(getComponentDoc('ui-button').content[0].text);
    expect(payload.theming).toEqual({ note: THEMING_NOTE, hooks: buttonHooks });
    expect(THEMING_NOTE).toMatch(/perVariant/);
  });

  it('omits theming when the manifest has no hook status for the component', () => {
    const payload = JSON.parse(getComponentDoc('ui-select').content[0].text);
    expect(payload).not.toHaveProperty('theming');
  });

  it('reports an error and suggests available names for an unknown component', () => {
    const result = getComponentDoc('ui-does-not-exist');
    const payload = JSON.parse(result.content[0].text);
    expect(result.isError).toBe(true);
    expect(payload.error).toMatch(/ui-does-not-exist/);
    expect(payload.available).toEqual(['ui-button', 'ui-select']);
  });
});
