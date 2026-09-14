/**
 * Addon local « recherche plein texte » — côté Node.
 *
 * Deux responsabilités :
 *   1. enregistrer l'entrée manager (`manager.tsx`, l'outil de la barre) ;
 *   2. garantir que `storybook/public/text-search-docs.json` existe et est à
 *      jour — au démarrage, puis à chaque `.mdx` modifié.
 *
 * Le point 2 est aussi couvert par le script `docs:search`, chaîné avant
 * `storybook` et `build-storybook`. Le doublon est volontaire : les cibles
 * `ng run demo:storybook` se lancent aussi directement (IDE, `.claude/launch.json`),
 * sans passer par les scripts npm.
 *
 * La position de l'outil dans la barre du manager est celle de cet addon dans
 * le tableau `addons` de `storybook/main.js` — ici, juste avant le toggle
 * dark mode.
 */

const { join } = require('node:path');
const { pathToFileURL } = require('node:url');

const BUILDER = pathToFileURL(join(__dirname, '../../../scripts/docs.search.mjs')).href;

/**
 * Où trouver le générateur, et sur quoi le faire tourner.
 *
 * Par défaut : le script du dépôt qui héberge cet addon, sur ses propres racines. Le
 * Storybook jetable de `ui-kit-preview` (FSHSP-208) passe les siennes via les options du
 * preset — il embarque sa copie du générateur et n'écrit que dans son dossier :
 *
 *   addons: [{ name: './addons/text-search/preset.cjs',
 *              options: { textSearch: { builder, index: { root, docDirs, outFile, uiConfigFile } } } }]
 */
function resolveConfig(options = {}) {
  const own = options.textSearch ?? {};
  return {
    builder: own.builder ? pathToFileURL(own.builder).href : BUILDER,
    index: own.index ?? {},
  };
}

async function rebuild(reason, options) {
  const { builder, index } = resolveConfig(options);
  try {
    const { writeSearchIndex } = await import(builder);
    const { pages, sections } = writeSearchIndex(index);
    console.log(`🔍 Index de recherche (${reason}) : ${pages} pages, ${sections} sections.`);
  } catch (error) {
    // Ne jamais faire tomber Storybook pour un index : l'outil affiche de
    // lui-même que l'index est absent, et la doc reste consultable.
    console.warn(`⚠️ Index de recherche non régénéré (${reason}) :`, error.message);
  }
}

module.exports = {
  managerEntries: (entries = []) => [...entries, require.resolve('./manager.tsx')],

  webpack: async (config, options) => {
    await rebuild('démarrage', options);

    config.plugins.push({
      apply(compiler) {
        compiler.hooks.watchRun.tapPromise('text-search-rebuild-index', async (watching) => {
          const modified = watching.modifiedFiles;
          if (modified && [...modified].some((file) => file.endsWith('.mdx'))) {
            await rebuild('hot reload', options);
          }
        });
      },
    });

    return config;
  },
};
