import { describe, expect, it } from 'vitest';
import { formatLabel } from './format-label';

describe('formatLabel', () => {
  it('substitutes the {0} token with the stringified value', () => {
    expect(formatLabel('Page {0}', 3)).toBe('Page 3');
  });

  it('substitutes every occurrence of the token', () => {
    expect(formatLabel('{0} of {0}', 'x')).toBe('x of x');
  });

  it('returns the template unchanged when it has no token', () => {
    expect(formatLabel('No token here', 42)).toBe('No token here');
  });

  it('does not interpret $-sequences in the value (unlike String.replace)', () => {
    // A naive `template.replace('{0}', value)` would treat "$&"/"$0"/"$$" in
    // `value` as replacement patterns. split/join never does.
    expect(formatLabel('Amount: {0}', '$100')).toBe('Amount: $100');
    expect(formatLabel('{0}', '$&')).toBe('$&');
  });
});
