# @4sh/ui-kit-schematics

*[English](./README.md) · **Français***

Package compagnon de **[`@4sh/ui-kit`](https://www.npmjs.com/package/@4sh/ui-kit)** :
il porte les *sources brutes* des composants du Design System, et les schematics
Angular qui les recopient dans un projet consommateur.

**Documentation complète (Storybook)** :
<https://4sh.github.io/starter-angular/?path=/docs/introduction--docs>

---

## Installation

```bash
ng add @4sh/ui-kit-schematics
```

Une seule commande : elle pose la fondation (styles, design tokens,
`angular.json`), puis demande quels composants copier et les copie, dépendances
comprises. La sélection se fait à la case à cocher — <kbd>espace</kbd> pour
choisir, <kbd>a</kbd> pour tout, <kbd>i</kbd> pour inverser.

```
src/app/shared/
├── components/ui/{catégorie}/{ui-nom}/{ui-nom}.ts    ← uniquement des composants
└── ui-core/{forms|motion|overlay|theming|types}/     ← directives de base, services, utilitaires, types
```

Les fichiers copiés vous appartiennent : modifiez-les librement. `ui-kit.json`
retient de quelle version vient chaque composant, ce qui permet ensuite à `update`
de vous présenter un diff fichier par fichier face à des sources plus récentes, à
accepter ou à sauter.

> Chaque composant est livré avec un fichier **`.scss`**, pas `.css` : l'étape de
> fondation positionne `schematics.@schematics/angular:component.style` à `scss`
> dans votre `angular.json`, si bien que `ng generate component` continue ensuite à
> générer du SCSS dans votre projet — le CSS pur par défaut d'Angular est
> délibérément surchargé.

| | |
|---|---|
| `ng add @4sh/ui-kit-schematics` | fondation **et** composants, d'un coup |
| `ng add @4sh/ui-kit-schematics --skip-components` | fondation seule, composants choisis plus tard |
| `ng add @4sh/ui-kit-schematics --skip-install` | ne pas lancer `npm install` (projet qui pilote son lockfile) |
| `ng add @4sh/ui-kit-schematics --skip-storybook` | ne pas poser de Storybook (voir ci-dessous) |
| `ng generate @4sh/ui-kit-schematics:add` | copier d'autres composants (interactif, ou `--components`, ou `--all`) |
| `ng generate @4sh/ui-kit-schematics:update` | diff des composants copiés face aux sources publiées |

`ui-kit.json` se trouve à la racine de votre projet, à côté de `package.json`.

> ⚠️ **`update` remplace, il ne fusionne pas.** Accepter un composant écrit la version
> publiée par-dessus la vôtre : **vos modifications sont perdues**. Lisez le diff, reportez
> à la main ce que vous voulez garder, ou sautez le composant. `--yes` accepte tout sans
> afficher un seul diff : à réserver aux composants que vous n'avez pas touchés.

### Votre propre Storybook

Posé par défaut : à la fin du `ng add`, vous avez un Storybook qui tourne, sur
les composants que vous avez copiés :

```bash
npm run storybook
```

Chaque composant arrive avec sa story et sa page MDX, à côté de ses sources. La
configuration atterrit dans `storybook/` — `main.js`, `preview.ts`, le thème du
manager, le sélecteur de marque, et les pages transverses *Foundations*,
*Spécifications* et *Configuration*. Les cibles `storybook` et `build-storybook`
sont ajoutées à `angular.json`, les devDependencies au `package.json`.

Deux choses font que cette doc est **la vôtre**, et non une photo de la nôtre.
Les tables *Theming* sont lues sur vos propres `.scss` au build
(`scripts/docs.config.mjs` en extrait les rôles `///`) : elles décrivent vos
valeurs, rebranding compris. Et les globs couvrent tout
`src/app/shared/components/**` : une story écrite à côté de votre propre
composant apparaît sans toucher à la configuration.

`--skip-storybook` si vous documentez ailleurs : ni story, ni MDX, ni
configuration, ni les devDependencies de la preview. Le choix est retenu dans
`ui-kit.json`, et `update` s'y tient — relancer `ng add` sans le flag revient
dessus.

Non repris : les liens `parameters.design` vers notre fichier Figma — vous ne
pouvez pas l'ouvrir, ils sont retirés à la copie. Remettez votre `node-id` si
vous en avez un.

### `@4sh/ui-kit` n'est délibérément **pas** installé

Cette voie ne met jamais le kit dans `node_modules`, et c'est précisément le but :
absent, aucun import ne peut viser son code compilé au lieu de vos copies
locales — ni dans les sources copiées, ni dans l'auto-complétion de votre éditeur.

## L'autre voie : l'utiliser comme librairie

Si vous préférez consommer les composants compilés, sans posséder aucune source,
installez **[`@4sh/ui-kit`](https://www.npmjs.com/package/@4sh/ui-kit)** et suivez
son propre README — rien n'est copié, et vous suivez les releases du kit.

Les deux modes ne se combinent pas : choisissez celui qui correspond au projet.

---

## Pourquoi un package séparé

`ng-packagr` *inline* template et SCSS dans le `.mjs` publié. Les sources que ces
schematics copient n'existent donc nulle part dans le tarball du kit, d'où leur
présence ici. Cette séparation a une conséquence voulue, dans les deux sens : un
consommateur en mode librairie ne télécharge jamais les sources brutes, et un
consommateur en mode starter ne télécharge jamais le kit compilé.

## Versionnage

**Les deux packages portent toujours le même numéro de version**, estampillé
depuis celui du kit à l'assemblage. Ce package embarque une copie des sources du
kit, et ce numéro commun est ce qui identifie *de quel* kit vient un fichier
copié — il est inscrit dans l'en-tête de traçabilité de chaque fichier, et dans
`ui-kit.json`.

> En lisant les sources, ne vous fiez pas au `version` du `package.json` de ce package :
> il est inerte, réécrit avec celui du kit à l'assemblage
> (`scripts/schematics-package.build.mjs`). Seul le numéro publié a du sens.

Voir [`docs/VERSIONING.md`](https://github.com/4sh/starter-angular/blob/main/docs/VERSIONING.md)
et [`docs/PUBLISHING.md`](https://github.com/4sh/starter-angular/blob/main/docs/PUBLISHING.md).

---

## Licence

Apache-2.0 — Copyright 2026 4SH.
