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

async function rebuild(reason) {
  try {
    const { writeSearchIndex } = await import(BUILDER);
    const { pages, sections } = writeSearchIndex();
    console.log(`🔍 Index de recherche (${reason}) : ${pages} pages, ${sections} sections.`);
  } catch (error) {
    // Ne jamais faire tomber Storybook pour un index : l'outil affiche de
    // lui-même que l'index est absent, et la doc reste consultable.
    console.warn(`⚠️ Index de recherche non régénéré (${reason}) :`, error.message);
  }
}

module.exports = {
  managerEntries: (entries = []) => [...entries, require.resolve('./manager.tsx')],

  webpack: async (config) => {
    await rebuild('démarrage');

    config.plugins.push({
      apply(compiler) {
        compiler.hooks.watchRun.tapPromise('text-search-rebuild-index', async (watching) => {
          const modified = watching.modifiedFiles;
          if (modified && [...modified].some((file) => file.endsWith('.mdx'))) {
            await rebuild('hot reload');
          }
        });
      },
    });

    return config;
  },
};
