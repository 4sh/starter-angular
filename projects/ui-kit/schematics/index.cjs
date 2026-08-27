/**
 * Façade de schematics de `@4sh/ui-kit` — bloque `ng add @4sh/ui-kit` (FSHSP-142).
 *
 * `@4sh/ui-kit` a deux usages :
 *
 *  - **mode librairie** : `npm i @4sh/ui-kit`, puis
 *    `import { UiButton } from '@4sh/ui-kit/actions/ui-button'`. C'est un
 *    `npm install` ordinaire — rien à générer, `ng add` n'apporte donc aucune
 *    valeur par rapport à `npm install` (pas d'ajout de `styles.css` dans
 *    `angular.json`, pas d'`includePaths`, rien) : voir le README pour les
 *    étapes manuelles.
 *  - **mode starter** (sources copiées, façon shadcn/spartan-ng) : le point
 *    d'entrée est `ng add @4sh/ui-kit-schematics`. Le kit n'y est délibérément
 *    PAS installé — sans lui dans `node_modules`, aucun import ne peut viser son
 *    code compilé à la place des copies locales, et l'auto-complétion de l'IDE
 *    ne propose plus que ces dernières.
 *
 * `ng add @4sh/ui-kit` est la commande que l'on tente naturellement pour le
 * starter — et comme le mode librairie n'a de toute façon aucun intérêt à
 * passer par `ng add` (cf. ci-dessus), ce point d'entrée n'a pas de raison
 * d'exister : on fait échouer la commande plutôt que de laisser passer un
 * package installé sans une seule source copiée.
 *
 * ⚠️ CommonJS et extension `.cjs` OBLIGATOIRES : ng-packagr ajoute
 * `"type": "module"` au package.json publié, donc un `.js` serait interprété
 * en ESM et le `require()` du chargeur de schematics échouerait. L'extension
 * est également explicite dans `collection.json` : la résolution CommonJS
 * sans extension n'essaie que `.js`/`.json`/`.node`, jamais `.cjs`.
 */

const { SchematicsException } = require('@angular-devkit/schematics');

const COMPANION = '@4sh/ui-kit-schematics';

/**
 * `ng add @4sh/ui-kit` — la CLI a déjà installé le package avant d'arriver ici,
 * on ne peut pas l'empêcher : on ne peut que faire échouer la commande pour
 * que ça ne passe pas pour un succès.
 */
function ngAdd() {
  return () => {
    throw new SchematicsException(
      [
        '',
        "`ng add @4sh/ui-kit` est bloqué : ce point d'entrée n'apporte rien de plus",
        `qu'un simple \`npm install @4sh/ui-kit\` (aucune configuration générée).`,
        '',
        `Pour COPIER les sources dans le projet et les posséder :`,
        `    ng add ${COMPANION}`,
        '',
        "@4sh/ui-kit vient d'être ajouté à votre package.json par la CLI avant ce",
        'contrôle — retirez-le si vous vouliez le starter. Si vous vouliez vraiment',
        'le mode librairie, gardez-le et suivez les étapes manuelles du README',
        "(installer la dépendance suffit, `ng add` n'était pas nécessaire).",
        '',
      ].join('\n'),
    );
  };
}

module.exports = { ngAdd };
