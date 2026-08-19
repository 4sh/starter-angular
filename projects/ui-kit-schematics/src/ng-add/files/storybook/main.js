/**
 * Configuration Storybook posée par `ng add @4sh/ui-kit-schematics
 * --with-storybook`. Fichier à vous : modifiez-le librement.
 *
 * Les globs couvrent `components/` en entier — les composants copiés du kit
 * comme les vôtres : une story écrite à côté de votre propre composant est
 * ramassée sans rien changer ici. `ui-core/` s'y ajoute pour les bases
 * partagées qui embarquent leur propre doc (ex. `motion/ui-motion.mdx`) —
 * sans lui, la story finit copiée sur le disque mais jamais indexée par
 * Storybook (FSHSP-138).
 *
 * L'ordre de `addons` est l'ordre des outils dans la barre du manager :
 * recherche plein texte puis copie Markdown se placent donc juste avant le
 * toggle dark mode (même ordre que le Storybook du monorepo).
 */
module.exports = {
  stories: [
    './docs/**/*.mdx',
    '../src/app/shared/components/**/*.mdx',
    '../src/app/shared/components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
    '../src/app/shared/ui-core/**/*.mdx',
    '../src/app/shared/ui-core/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  ],
  staticDirs: ['./public'],
  addons: [
    '@storybook/addon-docs',
    '@storybook/addon-a11y',
    './addons/text-search/preset.cjs',
    './addons/copy-as-markdown/preset.cjs',
    '@storybook-community/storybook-dark-mode',
  ],
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
