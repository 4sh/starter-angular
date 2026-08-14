/**
 * update — `ng generate @4sh/ui-kit-schematics:update [--yes]`.
 * Pour chaque composant du manifeste dont la version diffère de la version
 * installée de `@4sh/ui-kit`, affiche un diff par fichier et propose
 * Appliquer / Ignorer / Voir le diff. Jamais de merge automatique : une fois
 * copié, le fichier appartient au consommateur (même compromis que
 * spartan-ng/shadcn — assumé dans le ticket).
 */
import type { Rule, SchematicContext, Tree } from '@angular-devkit/schematics';
import { SchematicsException } from '@angular-devkit/schematics';
import { select } from '@inquirer/prompts';
import { createTwoFilesPatch } from 'diff';
import type { Schema } from './schema';
import { findUnit } from '../utils/component-registry';
import { renderUnitFiles } from '../utils/copy';
import { readManifest, today, writeManifest } from '../utils/manifest';
import { installedKitVersion } from '../utils/package-json';

type Action = 'apply' | 'skip' | 'view-diff';

function diffFor(tree: Tree, targetPath: string, newContent: string): string {
  const oldContent = tree.read(targetPath)?.toString('utf8') ?? '';
  return createTwoFilesPatch(targetPath, targetPath, oldContent, newContent, 'installé', 'kit');
}

async function promptAction(componentName: string): Promise<Action> {
  return select<Action>({
    message: `${componentName} : version plus récente disponible`,
    choices: [
      { name: 'Appliquer', value: 'apply' },
      { name: 'Ignorer', value: 'skip' },
      { name: 'Voir le diff', value: 'view-diff' },
    ],
  });
}

export function update(options: Schema): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const manifest = readManifest(tree);
    if (!manifest) {
      throw new SchematicsException(
        "Aucun ui-kit.json trouvé — lancez d'abord `ng add @4sh/ui-kit` puis `ng generate @4sh/ui-kit-schematics:add`.",
      );
    }

    const kitVersion = installedKitVersion(tree);
    const outdated = Object.entries(manifest.components).filter(([, entry]) => entry.version !== kitVersion);

    if (!outdated.length) {
      context.logger.info(`Rien à mettre à jour — tout est déjà en ${kitVersion}.`);
      return tree;
    }

    let applied = 0;
    for (const [name, entry] of outdated) {
      const unit = findUnit(name);
      if (!unit) {
        context.logger.warn(`${name} : présent dans ui-kit.json mais introuvable dans le kit installé — ignoré.`);
        continue;
      }
      const files = renderUnitFiles(unit, kitVersion);

       
      while (true) {
        const action = options.yes ? 'apply' : await promptAction(`${name} (${entry.version} → ${kitVersion})`);
        if (action === 'view-diff') {
          for (const file of files) {
            context.logger.info(diffFor(tree, file.targetPath, file.content));
          }
          continue; // reboucle sur la même question après affichage
        }
        if (action === 'apply') {
          for (const file of files) {
            if (tree.exists(file.targetPath)) tree.overwrite(file.targetPath, file.content);
            else tree.create(file.targetPath, file.content);
          }
          manifest.components[name] = { version: kitVersion, installedAt: today() };
          applied++;
        }
        break;
      }
    }

    manifest.kitVersion = kitVersion;
    writeManifest(tree, manifest);
    context.logger.info(`✔ ${applied}/${outdated.length} composant(s) mis à jour vers ${kitVersion}.`);
    return tree;
  };
}
