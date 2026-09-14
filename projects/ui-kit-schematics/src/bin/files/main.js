/**
 * Configuration du Storybook JETABLE du kit, écrite par `ui-kit-preview`.
 *
 * Ne l'éditez pas : le dossier entier est réécrit à chaque exécution de la
 * commande, et supprimé par `--clean`. Vos réglages vont dans `storybook/`,
 * le Storybook de votre projet, que cette preview ne touche jamais.
 */
module.exports = {
  // Tout ce que la commande vient de poser : une story et une page MDX par
  // composant du kit, à plat sous `{catégorie}/{ui-nom}/`.
  stories: ['./**/*.mdx', './**/*.stories.@(js|jsx|mjs|ts|tsx)'],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y'],
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
