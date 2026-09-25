import { defineConfig } from 'vitest/config';

// Les scripts d'outillage sont du Node pur (`.mjs`, aucun builder Angular) :
// Vitest tourne dessus directement. Les specs lancent le script en
// sous-processus sur un jeu de jetons jetable plutôt que d'importer son module —
// il a des effets de bord au chargement (il lit la config et écrit sur disque),
// et c'est de toute façon le vrai chemin d'exécution qu'on veut couvrir.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['**/*.spec.mjs'],
    passWithNoTests: false,
  },
});
