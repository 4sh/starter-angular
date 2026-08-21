/**
 * update — `ng generate @4sh/ui-kit-schematics:update [--force]`.
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
import { kitVersion as readKitVersion } from '../utils/kit-manifest';

type Action = 'apply' | 'skip' | 'view-diff';

/**
 * Version à partir de laquelle l'arborescence copiée est aplatie (FSHSP-121,
 * livré en 0.3.0) : `src/` et `lib/` retirés, barrel `public-api.ts` supprimé.
 *
 * Un composant copié AVANT cette version vit donc à des chemins que
 * `renderUnitFiles` ne calcule plus. `update` écrirait les nouveaux fichiers à
 * côté des anciens sans les remplacer — que des CREATE — en laissant
 * l'application compiler l'ancien code par ses imports vers `src/public-api`.
 * C'est ce qui a fait passer une montée sans aucun effet pour un succès
 * (FSHSP-150, remonté par le REX FSHSP-146).
 */
const FLATTENED_LAYOUT_SINCE = '0.3.0';

/**
 * Comparaison de deux `x.y.z`. Pas de `semver` en dépendance pour ça : les
 * versions du kit sont toujours de cette forme (cf. `docs/VERSIONING.md`), et
 * on ne compare ici que des numéros que ce package a lui-même écrits.
 */
function compareVersions(a: string, b: string): number {
  const parse = (v: string) =>
    v
      .split('-')[0]
      .split('.')
      .map((part) => Number.parseInt(part, 10) || 0);
  const [left, right] = [parse(a), parse(b)];
  for (let i = 0; i < 3; i++) {
    const diff = (left[i] ?? 0) - (right[i] ?? 0);
    if (diff !== 0) return diff;
  }
  return 0;
}

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

/**
 * `update` ne traite que les composants de `ui-kit.json`. Tout ce que `ng add`
 * a posé autour — serveur MCP, config Storybook, chaîne de tokens, cibles
 * d'`angular.json`, dépendances — reste à la version du `ng add` initial, sans
 * que rien ne le signale : c'est ainsi qu'un projet installé en 0.2.0 puis
 * monté en 0.5.0 n'a jamais eu le serveur MCP, arrivé en 0.4.0 (FSHSP-151,
 * remonté par le REX FSHSP-146).
 *
 * On le DIT plutôt que de le rattraper d'office. `update` ne peut pas
 * distinguer ce qui manque parce que ça n'existait pas encore de ce que le
 * consommateur a délibérément écarté (`--skip-mcp`, `--skip-storybook`) : rien
 * ne le consigne. Poser d'autorité imposerait ; le rattrapage reste donc une
 * commande qu'on choisit de lancer.
 */
function logUncoveredConcerns(context: SchematicContext): void {
  context.logger.info(
    `\nÀ noter : \`update\` ne couvre que les composants. La fondation posée par ` +
      `\`ng add\` — serveur MCP, config Storybook, chaîne de tokens, cibles ` +
      `d'\`angular.json\`, dépendances — n'est pas mise à jour ici. Si vous venez ` +
      `d'une version plus ancienne du kit, \`ng add @4sh/ui-kit-schematics ` +
      `--skip-components\` réapplique ce qui peut l'être sans risque : vos composants, ` +
      `votre \`.mcp.json\`, votre config Prettier et vos styles retouchés sont ` +
      `préservés. Seule réserve mesurée : une dépendance que vous auriez épinglée peut ` +
      `y être ré-élargie vers la plage du kit.`,
  );
}

export function update(options: Schema): Rule {
  return async (tree: Tree, context: SchematicContext) => {
    const manifest = readManifest(tree);
    if (!manifest) {
      throw new SchematicsException(
        "Aucun ui-kit.json trouvé — lancez d'abord `ng add @4sh/ui-kit-schematics`.",
      );
    }

    const kitVersion = readKitVersion();
    const outdated = Object.entries(manifest.components).filter(
      ([, entry]) => entry.version !== kitVersion,
    );

    if (!outdated.length) {
      context.logger.info(`Rien à mettre à jour — tout est déjà en ${kitVersion}.`);
      logUncoveredConcerns(context);
      return tree;
    }

    // Refus AVANT la première écriture, et sur tout le lot : appliquer les
    // composants dont les chemins coïncident tout en sautant les autres
    // laisserait un arbre mi-ancien mi-nouveau et un `ui-kit.json` qui ne
    // décrit ni l'un ni l'autre. Un projet dans cet état a besoin d'une
    // décision de migration, pas d'une montée partielle.
    const staleLayout = outdated.filter(
      ([, entry]) => compareVersions(entry.version, FLATTENED_LAYOUT_SINCE) < 0,
    );
    if (staleLayout.length) {
      const names = staleLayout.map(([name, entry]) => `${name} (${entry.version})`).join(', ');
      throw new SchematicsException(
        `Rien n'a été écrit. ${staleLayout.length} composant(s) ont été copiés avant la ` +
          `${FLATTENED_LAYOUT_SINCE} — ${names} —, quand l'arborescence copiée portait encore ` +
          `\`src/\`, \`lib/\` et un barrel \`public-api.ts\`. Ces chemins ont tous changé en ` +
          `${FLATTENED_LAYOUT_SINCE} (FSHSP-121) : \`update\` écrirait les fichiers de la ` +
          `${kitVersion} À CÔTÉ des anciens sans les remplacer, et votre application ` +
          `continuerait de compiler les anciens par ses imports vers \`src/public-api\`.\n\n` +
          `Deux voies :\n` +
          `  1. repartir d'un « add » propre — supprimer les arborescences copiées et ` +
          `\`ui-kit.json\`, puis relancer \`ng g @4sh/ui-kit-schematics:add\`. Le plus sûr, ` +
          `mais les retouches locales sont perdues.\n` +
          `  2. migrer à la main — déplacer les fichiers vers la nouvelle disposition ` +
          `(\`{ui-nom}/{ui-nom}.ts\`, bases partagées sous \`ui-core/\`), réadresser les ` +
          `imports de votre application, monter les versions dans \`ui-kit.json\`, puis ` +
          `relancer \`update\`. À préférer si vous avez retouché les copies.\n\n` +
          `Voir la section 0.3.0 du CHANGELOG du kit pour la disposition cible.`,
      );
    }

    let applied = 0;
    for (const [name, entry] of outdated) {
      const unit = findUnit(name);
      if (!unit) {
        context.logger.warn(
          `${name} : présent dans ui-kit.json mais introuvable dans le kit installé — ignoré.`,
        );
        continue;
      }
      // Le choix fait à l'installation, pas une valeur par défaut : une mise à
      // jour ne doit ni introduire de la doc chez qui n'en a pas demandé, ni
      // laisser périmée celle du projet qui en a (FSHSP-125).
      const files = renderUnitFiles(unit, kitVersion, {
        withStorybook: manifest.storybook ?? false,
      });

      while (true) {
        const action = options.force
          ? 'apply'
          : await promptAction(`${name} (${entry.version} → ${kitVersion})`);
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

    // Le manifeste est écrit dans tous les cas — les entrées par composant
    // appliquées doivent être persistées — mais `kitVersion` ne monte que si
    // TOUT l'est. Écrit inconditionnellement, il annonçait une version que
    // l'arborescence ne portait pas, y compris après zéro application
    // (FSHSP-150).
    const complete = applied === outdated.length;
    if (complete) manifest.kitVersion = kitVersion;
    writeManifest(tree, manifest);
    if (complete) {
      context.logger.info(
        `✔ ${applied}/${outdated.length} composant(s) mis à jour vers ${kitVersion}.`,
      );
    } else {
      context.logger.warn(
        `${applied}/${outdated.length} composant(s) mis à jour vers ${kitVersion} — ` +
          `${outdated.length - applied} restant(s). \`ui-kit.json\` reste en ` +
          `${manifest.kitVersion} : relancez \`update\` pour les traiter.`,
      );
    }
    logUncoveredConcerns(context);
    return tree;
  };
}
