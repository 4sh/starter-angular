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
const { existsSync } = require('node:fs');
const { join } = require('node:path');

/**
 * Motifs de stories, avant filtrage.
 *
 * Aucun de ces dossiers n'est garanti : `components/` n'existe que si vous
 * avez copié au moins un composant, et `ui-core/` que si l'un d'eux tire une
 * base partagée (`ui-icon` seul, par exemple, n'en tire aucune). Poser la
 * fondation sans composant laissait donc les deux absents.
 */
const storyGlobs = [
  './docs/**/*.mdx',
  '../src/app/shared/components/**/*.mdx',
  '../src/app/shared/components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  '../src/app/shared/ui-core/**/*.mdx',
  '../src/app/shared/ui-core/**/*.stories.@(js|jsx|mjs|ts|tsx)',
];

/**
 * Un motif dont la racine n'existe pas est écarté.
 *
 * Webpack ne traite pas un glob comme une recherche : il le réduit à un
 * `require.context(<racine du motif>)`. Une racine absente n'est donc pas un
 * motif qui ne ramasse rien, c'est un module introuvable, et le build entier
 * s'arrête dessus, en désignant un chemin que le projet n'a jamais eu de
 * raison de créer.
 *
 * Le filtre est réévalué à chaque démarrage : le dossier créé plus tard par
 * `ng generate @4sh/ui-kit-schematics:add` remet son motif en service, sans
 * rien à modifier ici. Un motif dont la racine porte elle-même un joker est
 * gardé tel quel, impossible d'en vérifier l'existence, et c'est à webpack
 * de trancher.
 */
function rootExists(glob) {
  const root = glob.split('/*')[0];
  return root.includes('*') || existsSync(join(__dirname, root));
}

module.exports = {
  stories: storyGlobs.filter(rootExists),
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
