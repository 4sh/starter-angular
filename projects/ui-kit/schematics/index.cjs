/**
 * Façade de schematics de `@4sh/ui-kit` (FSHSP-109).
 *
 * Le kit publié ne contient que du code COMPILÉ : les sources brutes que le
 * starter recopie chez le consommateur vivent dans le package compagnon
 * `@4sh/ui-kit-schematics`. Ce fichier n'existe que pour offrir un nom unique
 * au consommateur — `ng add @4sh/ui-kit`, `ng generate @4sh/ui-kit:add` — et
 * délègue tout le travail au compagnon. Aucune logique métier ici.
 *
 * ⚠️ CommonJS et extension `.cjs` OBLIGATOIRES : ng-packagr ajoute
 * `"type": "module"` au package.json publié, donc un `.js` serait interprété
 * en ESM et le `require()` du chargeur de schematics échouerait. L'extension
 * est également explicite dans `collection.json` : la résolution CommonJS
 * sans extension n'essaie que `.js`/`.json`/`.node`, jamais `.cjs`.
 */

const { externalSchematic, SchematicsException } = require('@angular-devkit/schematics');
const { NodePackageInstallTask, RunSchematicTask } = require('@angular-devkit/schematics/tasks');

/** Le compagnon est versionné en lockstep avec le kit : même version publiée. */
const COMPANION = '@4sh/ui-kit-schematics';
const COMPANION_VERSION = `^${require('../package.json').version}`;

/**
 * `ng add @4sh/ui-kit`.
 *
 * Le compagnon n'est pas encore installé à ce stade, donc pas d'appel direct :
 * on l'inscrit en devDependency, on programme l'installation, puis on demande
 * son `ng-add` en TÂCHE dépendante de cette installation. `RunSchematicTask`
 * résout la collection au moment de son exécution — après l'install — là où
 * `externalSchematic` la résoudrait tout de suite, et échouerait.
 * (Même enchaînement que le `ng-add` d'`@angular/material`.)
 */
function ngAdd(options) {
  return (tree, context) => {
    const pkg = JSON.parse(tree.read('/package.json').toString('utf8'));
    pkg.devDependencies = { ...pkg.devDependencies, [COMPANION]: COMPANION_VERSION };
    tree.overwrite('/package.json', JSON.stringify(pkg, null, 2) + '\n');

    const installId = context.addTask(new NodePackageInstallTask());
    context.addTask(new RunSchematicTask(COMPANION, 'ng-add', options ?? {}), [installId]);

    return tree;
  };
}

/**
 * Délégation directe, pour les schematics lancés APRÈS `ng add` : le compagnon
 * est alors présent dans `node_modules`, `externalSchematic` le résout donc
 * immédiatement — et le prompt interactif reste au premier plan, ce qu'une
 * tâche différée ne permettrait pas.
 */
function delegate(schematicName) {
  return (options) => () => {
    // Vérification AVANT de rendre la règle : `externalSchematic` ne résout la
    // collection qu'à l'exécution de la règle qu'il renvoie, donc l'entourer
    // d'un try/catch ici n'attraperait rien (le message resterait le laconique
    // « Collection ... cannot be resolved »). On teste donc la résolution
    // nous-mêmes, pour pouvoir dire quoi faire.
    try {
      require.resolve(`${COMPANION}/package.json`);
    } catch {
      throw new SchematicsException(
        `${COMPANION} est introuvable. Ce package porte les sources copiées par le starter ; ` +
          `il est installé par \`ng add @4sh/ui-kit\` — lancez cette commande d'abord.`,
      );
    }
    return externalSchematic(COMPANION, schematicName, options ?? {});
  };
}

module.exports = {
  ngAdd,
  add: delegate('add'),
  update: delegate('update'),
};
