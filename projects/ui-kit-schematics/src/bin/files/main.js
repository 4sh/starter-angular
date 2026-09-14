/**
 * Configuration du Storybook JETABLE du kit, écrite par `ui-kit-preview`.
 *
 * Ne l'éditez pas : le dossier entier est réécrit à chaque exécution de la
 * commande, et supprimé par `--clean`. Vos réglages vont dans `storybook/`,
 * le Storybook de votre projet, que cette preview ne touche jamais.
 */
const { join } = require('node:path');

/**
 * Un addon que le projet n'a pas forcément.
 *
 * `ng add @4sh/ui-kit-schematics` installe le toggle clair/sombre, mais il ne le
 * fait pas quand le projet portait DÉJÀ une cible `storybook` (il n'y touche
 * alors pas). Plutôt que de tomber sur un module introuvable au démarrage, on
 * s'en passe et on dit lequel — le reste de la preview n'en dépend pas.
 */
function optional(id) {
  try {
    require.resolve(id, { paths: [process.cwd()] });
    return id;
  } catch {
    console.warn(
      `⚠️ Addon absent : ${id} — la preview démarre sans lui.\n` +
        `   Pour l'activer : installez-le dans le projet (\`pnpm add -D ${id}\`).`,
    );
    return null;
  }
}

/**
 * Recherche plein texte : l'addon vient du kit, mais il doit indexer CE dossier
 * et n'écrire que dedans. Sans ces options il balaierait les MDX du projet et
 * écrirait dans son `storybook/public/` — ce que la promesse « tout est
 * jetable, rien n'est écrit ailleurs » interdit.
 */
const textSearch = {
  builder: join(__dirname, 'docs.search.mjs'),
  index: {
    root: __dirname,
    docDirs: [__dirname],
    outFile: join(__dirname, 'public', 'text-search-docs.json'),
    uiConfigFile: join(__dirname, 'generated', 'ui-config.json'),
  },
};

module.exports = {
  // Tout ce que la commande vient de poser : `Overview.mdx` en vue d'ensemble,
  // puis une story et une page MDX par composant du kit, à plat sous
  // `{catégorie}/{ui-nom}/`.
  stories: ['./**/*.mdx', './**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  // Index de recherche, servi tel quel à l'outil de la barre du manager.
  staticDirs: ['./public'],
  // L'ordre est celui des outils dans la barre : la recherche se place juste
  // avant le toggle dark mode, comme dans le Storybook du monorepo.
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    { name: './addons/text-search/preset.cjs', options: { textSearch } },
    optional('@storybook-community/storybook-dark-mode'),
  ].filter(Boolean),
  framework: { name: '@storybook/angular', options: {} },
  webpackFinal: async (config) => {
    // Angular définit déjà `process.env.NODE_ENV` ; la garder ici la déclare
    // deux fois et webpack échoue sur le conflit.
    const definePlugin = config.plugins.find(
      (p) => p.constructor.name === 'DefinePlugin' && p.definitions['process.env.NODE_ENV'],
    );
    if (definePlugin) {
      delete definePlugin.definitions['process.env.NODE_ENV'];
    }
    return config;
  },
};
