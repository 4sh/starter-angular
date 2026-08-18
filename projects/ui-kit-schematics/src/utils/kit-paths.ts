/**
 * kit-paths — réadresse les chemins du monorepo cités par les pages de doc
 * transverses (FSHSP-125).
 *
 * Ces pages sont copiées telles quelles depuis ce dépôt, où la fondation de
 * styles vit sous `projects/ui-kit/styles/`. Chez le consommateur elle est
 * ailleurs, et la citation n'est pas décorative : `Colors.mdx` IMPORTE le
 * manifeste de tokens, et le build s'arrête net sur un module introuvable.
 * Les mentions en prose passent par la même table — un chemin faux dans une
 * doc coûte au lecteur le temps de le chercher.
 */

/** Ordre significatif : `base/` sort de `ui-kit/`, il doit être testé avant le préfixe général. */
const PATH_MAP: readonly (readonly [string, string])[] = [
  ['projects/ui-kit/styles/base/', 'src/styles/base/'],
  ['projects/ui-kit/styles/', 'src/styles/ui-kit/'],
];

export function rewriteKitPaths(content: string): string {
  let out = content;
  for (const [from, to] of PATH_MAP) {
    out = out.split(from).join(to);
  }
  return out;
}
