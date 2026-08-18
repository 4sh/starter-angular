/**
 * Configuration Storybook posée par `ng add @4sh/ui-kit-schematics
 * --with-storybook`. Fichier à vous : modifiez-le librement.
 *
 * Les globs couvrent `components/` en entier — les composants copiés du kit
 * comme les vôtres : une story écrite à côté de votre propre composant est
 * ramassée sans rien changer ici.
 */
module.exports = {
  stories: [
    './docs/**/*.mdx',
    '../src/app/shared/components/**/*.mdx',
    '../src/app/shared/components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  addons: ['@storybook/addon-docs', '@storybook/addon-a11y', '@storybook-community/storybook-dark-mode'],
  framework: {
    name: '@storybook/angular',
    options: {},
  },
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
