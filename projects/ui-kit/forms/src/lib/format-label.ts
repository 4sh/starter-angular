/**
 * Substitutes the `{0}` token of a (possibly user-overridden) label with a value.
 * Plain split/join — never interprets `$` sequences in `value` (unlike `String.replace`).
 */
export function formatLabel(template: string, value: string | number): string {
  return template.split('{0}').join(String(value));
}
