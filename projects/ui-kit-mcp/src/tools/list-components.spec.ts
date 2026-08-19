import { describe, expect, it, vi } from 'vitest';

vi.mock('../data.js', () => ({
  listComponentNames: vi.fn(() => ['ui-button', 'ui-select']),
}));

import { listComponents } from './list-components.js';

describe('listComponents', () => {
  it('returns the component names as JSON, with their count', () => {
    const result = listComponents();
    const payload = JSON.parse(result.content[0].text);
    expect(payload).toEqual({ count: 2, components: ['ui-button', 'ui-select'] });
  });

  it('always answers with a single text content block', () => {
    const result = listComponents();
    expect(result.content).toHaveLength(1);
    expect(result.content[0].type).toBe('text');
  });
});
