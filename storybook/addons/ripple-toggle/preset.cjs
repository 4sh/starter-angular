/**
 * Addon local « effet ripple » — côté Node.
 *
 * Une seule responsabilité : enregistrer l'entrée manager (`manager.tsx`).
 * La position du bouton dans la barre est celle de cet addon dans le tableau
 * `addons` de `storybook/main.js` : il est déclaré juste avant le toggle
 * clair / sombre, donc rendu juste à sa gauche.
 */
module.exports = {
  managerEntries: (entries = []) => [...entries, require.resolve('./manager.tsx')],
};
