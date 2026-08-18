/**
 * Façade de schematics de `@4sh/ui-kit` — réduite à une redirection (FSHSP-122).
 *
 * `@4sh/ui-kit` a deux usages, et un seul passe encore par ici :
 *
 *  - **mode librairie** : `npm i @4sh/ui-kit`, puis
 *    `import { UiButton } from '@4sh/ui-kit/actions/ui-button'`. C'est ce que
 *    fait `ng add @4sh/ui-kit` : installer le package. Rien d'autre à générer.
 *  - **mode starter** (sources copiées, façon shadcn/spartan-ng) : le point
 *    d'entrée est `ng add @4sh/ui-kit-schematics`. Le kit n'y est délibérément
 *    PAS installé — sans lui dans `node_modules`, aucun import ne peut viser son
 *    code compilé à la place des copies locales, et l'auto-complétion de l'IDE
 *    ne propose plus que ces dernières.
 *
 * Ce fichier n'existe donc plus que pour dire laquelle des deux voies on a
 * prise : `ng add @4sh/ui-kit` est la commande que l'on tente naturellement pour
 * le starter, et se retrouver avec un package installé sans une seule source
 * copiée, sans un mot d'explication, serait la pire des issues.
 *
 * ⚠️ CommonJS et extension `.cjs` OBLIGATOIRES : ng-packagr ajoute
 * `"type": "module"` au package.json publié, donc un `.js` serait interprété
 * en ESM et le `require()` du chargeur de schematics échouerait. L'extension
 * est également explicite dans `collection.json` : la résolution CommonJS
 * sans extension n'essaie que `.js`/`.json`/`.node`, jamais `.cjs`.
 */

const COMPANION = '@4sh/ui-kit-schematics';

/** `ng add @4sh/ui-kit` — le package est installé par la CLI avant d'arriver ici. */
function ngAdd() {
  return (tree, context) => {
    context.logger.info(
      [
        '',
        '@4sh/ui-kit est installé : les composants sont utilisables tels quels,',
        "    import { UiButton } from '@4sh/ui-kit/actions/ui-button';",
        '',
        `Pour COPIER les sources dans le projet et les posséder, c'est l'autre voie :`,
        `    ng add ${COMPANION}`,
        '',
        `Elle n'installe pas @4sh/ui-kit, volontairement : hors de node_modules, aucun`,
        'import ne peut viser son code compilé au lieu des copies locales. Les deux',
        'modes ne se combinent pas — choisir celui qui correspond au projet.',
        '',
      ].join('\n'),
    );
    return tree;
  };
}

module.exports = { ngAdd };
