/**
 * Substitutes the `{0}`, `{1}`… tokens of a (possibly user-overridden) label with the values, in
 * one pass: a value never gets its own tokens substituted, and its `$` sequences are never
 * interpreted. A token without a matching value is left as is.
 */
export function formatLabel(template: string, ...values: (string | number)[]): string {
  return template.replace(/\{(0|[1-9]\d*)\}/g, (token, index: string) =>
    Number(index) < values.length ? String(values[Number(index)]) : token,
  );
}
