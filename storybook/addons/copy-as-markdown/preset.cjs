/**
 * Addon local « copier en Markdown » — côté Node.
 *
 * Une seule responsabilité : enregistrer l'entrée manager (`manager.tsx`).
 * Pas de rebuild d'index ici — c'est celui de `text-search` (même fichier,
 * `storybook/public/text-search-docs.json`) qui s'en charge déjà, chaîné
 * avant `storybook`/`build-storybook` via le script `docs:search`.
 *
 * La position de l'outil dans la barre du manager est celle de cet addon dans
 * le tableau `addons` de `storybook/main.js`.
 */
module.exports = {
  managerEntries: (entries = []) => [...entries, require.resolve('./manager.tsx')],
};
