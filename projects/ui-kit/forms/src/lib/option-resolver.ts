/**
 * Shared option-resolution helpers for list-based form fields
 * (`ui-select`, `ui-autocomplete`, `ui-input-tags`).
 *
 * Options can be primitives or objects; `optionValue` / `optionLabel` /
 * `optionDisabled` are (dot-path) fields read on object options, and `dataKey`
 * drives object equality. The accessors are passed as thunks so the resolver
 * stays reactive when bound to signal inputs.
 */

/** Normalized option: resolved value/label/disabled + the original option. */
export interface OptionEntry {
  value: unknown;
  label: string;
  disabled: boolean;
  original: unknown;
}

/** Field accessors (typically the component's signal inputs). */
export interface OptionResolverFields {
  optionValue: () => string | undefined;
  optionLabel: () => string | undefined;
  optionDisabled: () => string | undefined;
  dataKey: () => string | undefined;
}

export interface OptionResolver {
  /** Normalizes an option into an {@link OptionEntry}. */
  toEntry(option: unknown): OptionEntry;

  /** Reads a (dot-path) field from an object (`undefined` otherwise). */
  getField(target: unknown, path: string | undefined): unknown;

  /** Model value of an option (`optionValue` field, or the option itself). */
  resolveValue(option: unknown): unknown;

  /** Display label of an option (`optionLabel` field, `label` key, or text). */
  resolveLabel(option: unknown): string | null;

  /** Disabled flag of an option (`optionDisabled` field, or `disabled` key). */
  resolveDisabled(option: unknown): boolean;

  /** `String(value)`, or `null` for null/undefined. */
  asText(value: unknown): string | null;

  /** Value equality — by `dataKey` for objects, strict otherwise. */
  equals(a: unknown, b: unknown): boolean;
}

export function createOptionResolver(fields: OptionResolverFields): OptionResolver {
  const isObject = (option: unknown): option is Record<string, unknown> =>
    typeof option === 'object' && option !== null;

  const getField = (target: unknown, path: string | undefined): unknown => {
    if (!path || !isObject(target)) return undefined;
    return path
      .split('.')
      .reduce<unknown>((acc, key) => (isObject(acc) ? acc[key] : undefined), target);
  };

  const asText = (value: unknown): string | null =>
    value === null || value === undefined ? null : String(value);

  const resolveValue = (option: unknown): unknown => {
    const field = fields.optionValue();
    if (field && isObject(option)) return getField(option, field);
    return option;
  };

  const resolveLabel = (option: unknown): string | null => {
    const field = fields.optionLabel();
    if (field && isObject(option)) return asText(getField(option, field));
    if (isObject(option) && 'label' in option) return asText(option['label']);
    return asText(option);
  };

  const resolveDisabled = (option: unknown): boolean => {
    const field = fields.optionDisabled();
    if (field && isObject(option)) return !!getField(option, field);
    if (isObject(option) && 'disabled' in option) return !!option['disabled'];
    return false;
  };

  const equals = (a: unknown, b: unknown): boolean => {
    const key = fields.dataKey();
    if (key && isObject(a) && isObject(b)) return a[key] === b[key];
    return a === b;
  };

  const toEntry = (option: unknown): OptionEntry => ({
    value: resolveValue(option),
    label: resolveLabel(option) ?? '',
    disabled: resolveDisabled(option),
    original: option,
  });

  return { toEntry, getField, resolveValue, resolveLabel, resolveDisabled, asText, equals };
}
