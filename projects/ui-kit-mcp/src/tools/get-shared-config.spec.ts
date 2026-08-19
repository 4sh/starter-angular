import { describe, expect, it, vi } from 'vitest';
import { FIXTURE_UI_CONFIG } from '../test-fixtures.js';

vi.mock('../data.js', () => ({
  loadUiConfig: vi.fn(() => FIXTURE_UI_CONFIG),
}));

import { getSharedConfig } from './get-shared-config.js';

describe('getSharedConfig', () => {
  it('passes groups and shared config through as-is', () => {
    const result = getSharedConfig();
    const payload = JSON.parse(result.content[0].text);
    expect(payload).toEqual({ groups: FIXTURE_UI_CONFIG.groups, shared: FIXTURE_UI_CONFIG.shared });
  });

  it('never leaks the components-specific part of the manifest', () => {
    const result = getSharedConfig();
    const payload = JSON.parse(result.content[0].text);
    expect(payload).not.toHaveProperty('components');
  });
});
