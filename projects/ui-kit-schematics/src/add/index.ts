/**
 * add — `ng generate @4sh/ui-kit-schematics:add [--components ui-x ui-y | --all]`.
 * Copie les composants choisis + leurs dépendances (résolues par analyse
 * statique, voir `utils/dependency-graph.ts`), avec en-tête de traçabilité,
 * et met à jour `ui-kit.json`.
 */
import type { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { SchematicsException } from '@angular-devkit/schematics';
import { checkbox } from '@inquirer/prompts';
import type { Schema } from './schema';
import { listComponents } from '../utils/component-registry';
import { resolveDependencies } from '../utils/dependency-graph';
import { copyUnit } from '../utils/copy';
import { emptyManifest, readManifest, today, writeManifest } from '../utils/manifest';
import { installedKitVersion } from '../utils/package-json';

/**
 * Sélection interactive : checkbox `@inquirer/prompts`, qui supporte déjà
 * nativement `a` (tout basculer) / `i` (inverser) — exactement le raccourci
 * demandé dans le ticket, sans prompt maison à maintenir.
 */
async function promptComponentNames(): Promise<string[]> {
  const available = listComponents().sort((a, b) => a.name.localeCompare(b.name));
  return checkbox({
    message: 'Composants à copier dans le projet (espace : sélectionner, a : tout, i : inverser)',
    choices: available.map((c) => ({ name: `${c.name} (${c.category})`, value: c.name })),
  });
}

export function add(options: Schema): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const available = listComponents();

    let selected: string[];
    if (options.all) {
      selected = available.map((c) => c.name);
    } else if (options.components?.length) {
      const unknown = options.components.filter((name) => !available.some((c) => c.name === name));
      if (unknown.length) {
        throw new SchematicsException(`Composant(s) inconnu(s) : ${unknown.join(', ')}`);
      }
      selected = options.components;
    } else {
      selected = await promptComponentNames();
    }

    if (!selected.length) {
      context.logger.warn('Aucun composant sélectionné.');
      return tree;
    }

    const kitVersion = installedKitVersion(tree);
    const units = resolveDependencies(selected);
    const manifest = readManifest(tree) ?? emptyManifest(kitVersion);

    for (const unit of units) {
      copyUnit(tree, unit, kitVersion);
      manifest.components[unit.name] = { version: kitVersion, installedAt: today() };
    }
    manifest.kitVersion = kitVersion;
    writeManifest(tree, manifest);

    const extra = units.filter((u) => !selected.includes(u.name)).map((u) => u.name);
    context.logger.info(
      `✔ ${units.length} unité(s) copiée(s)${extra.length ? ` (dont dépendances : ${extra.join(', ')})` : ''}.`,
    );
    return tree;
  };
}
