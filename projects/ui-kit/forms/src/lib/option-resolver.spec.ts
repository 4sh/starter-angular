import { describe, expect, it } from 'vitest';
import { createOptionResolver, OptionResolverFields } from './option-resolver';

/** All fields unset by default — tests override the ones they exercise. */
function fields(overrides: Partial<OptionResolverFields> = {}): OptionResolverFields {
  return {
    optionValue: () => undefined,
    optionLabel: () => undefined,
    optionDisabled: () => undefined,
    dataKey: () => undefined,
    ...overrides,
  };
}

describe('createOptionResolver', () => {
  describe('getField', () => {
    it('reads a dot-path off a plain object', () => {
      const resolver = createOptionResolver(fields());
      expect(resolver.getField({ user: { name: 'Ada' } }, 'user.name')).toBe('Ada');
    });

    it('returns undefined for a missing path', () => {
      const resolver = createOptionResolver(fields());
      expect(resolver.getField({ user: {} }, 'user.name')).toBeUndefined();
    });

    it('returns undefined for a non-object target', () => {
      const resolver = createOptionResolver(fields());
      expect(resolver.getField('ada', 'name')).toBeUndefined();
      expect(resolver.getField(null, 'name')).toBeUndefined();
    });

    it('returns undefined when no path is given', () => {
      const resolver = createOptionResolver(fields());
      expect(resolver.getField({ name: 'Ada' }, undefined)).toBeUndefined();
    });
  });

  describe('resolveValue', () => {
    it('returns the option itself when no optionValue field is configured', () => {
      const resolver = createOptionResolver(fields());
      const option = { id: 1, name: 'Ada' };
      expect(resolver.resolveValue(option)).toBe(option);
    });

    it('reads the configured field on an object option', () => {
      const resolver = createOptionResolver(fields({ optionValue: () => 'id' }));
      expect(resolver.resolveValue({ id: 1, name: 'Ada' })).toBe(1);
    });

    it('returns the option itself when it is not an object, even with a field configured', () => {
      const resolver = createOptionResolver(fields({ optionValue: () => 'id' }));
      expect(resolver.resolveValue('Ada')).toBe('Ada');
    });
  });

  describe('resolveLabel', () => {
    it('prefers the configured optionLabel field', () => {
      const resolver = createOptionResolver(fields({ optionLabel: () => 'name' }));
      expect(resolver.resolveLabel({ name: 'Ada', label: 'ignored' })).toBe('Ada');
    });

    it('falls back to a "label" property when no field is configured', () => {
      const resolver = createOptionResolver(fields());
      expect(resolver.resolveLabel({ label: 'Ada' })).toBe('Ada');
    });

    it('falls back to the stringified option for primitives', () => {
      const resolver = createOptionResolver(fields());
      expect(resolver.resolveLabel(42)).toBe('42');
    });

    it('returns null for a null/undefined option', () => {
      const resolver = createOptionResolver(fields());
      expect(resolver.resolveLabel(null)).toBeNull();
      expect(resolver.resolveLabel(undefined)).toBeNull();
    });
  });

  describe('resolveDisabled', () => {
    it('prefers the configured optionDisabled field', () => {
      const resolver = createOptionResolver(fields({ optionDisabled: () => 'locked' }));
      expect(resolver.resolveDisabled({ locked: true, disabled: false })).toBe(true);
    });

    it('falls back to a "disabled" property', () => {
      const resolver = createOptionResolver(fields());
      expect(resolver.resolveDisabled({ disabled: true })).toBe(true);
    });

    it('defaults to false for primitives or missing fields', () => {
      const resolver = createOptionResolver(fields());
      expect(resolver.resolveDisabled('Ada')).toBe(false);
      expect(resolver.resolveDisabled({})).toBe(false);
    });
  });

  describe('asText', () => {
    it('stringifies non-nullish values', () => {
      const resolver = createOptionResolver(fields());
      expect(resolver.asText(42)).toBe('42');
      expect(resolver.asText(false)).toBe('false');
    });

    it('returns null for null/undefined', () => {
      const resolver = createOptionResolver(fields());
      expect(resolver.asText(null)).toBeNull();
      expect(resolver.asText(undefined)).toBeNull();
    });
  });

  describe('equals', () => {
    it('compares by dataKey when both sides are objects and a key is configured', () => {
      const resolver = createOptionResolver(fields({ dataKey: () => 'id' }));
      expect(resolver.equals({ id: 1, name: 'Ada' }, { id: 1, name: 'different' })).toBe(true);
      expect(resolver.equals({ id: 1 }, { id: 2 })).toBe(false);
    });

    it('falls back to strict equality without a dataKey', () => {
      const resolver = createOptionResolver(fields());
      const option = { id: 1 };
      expect(resolver.equals(option, option)).toBe(true);
      expect(resolver.equals({ id: 1 }, { id: 1 })).toBe(false); // different references
    });

    it('falls back to strict equality for primitives even with a dataKey configured', () => {
      const resolver = createOptionResolver(fields({ dataKey: () => 'id' }));
      expect(resolver.equals(1, 1)).toBe(true);
      expect(resolver.equals(1, '1')).toBe(false);
    });
  });

  describe('toEntry', () => {
    it('bundles resolved value/label/disabled with the original option', () => {
      const resolver = createOptionResolver(
        fields({ optionValue: () => 'id', optionLabel: () => 'name', optionDisabled: () => 'locked' }),
      );
      const option = { id: 1, name: 'Ada', locked: true };
      expect(resolver.toEntry(option)).toEqual({
        value: 1,
        label: 'Ada',
        disabled: true,
        original: option,
      });
    });

    it('defaults the label to an empty string when it cannot be resolved', () => {
      const resolver = createOptionResolver(fields());
      expect(resolver.toEntry(null).label).toBe('');
    });
  });
});
