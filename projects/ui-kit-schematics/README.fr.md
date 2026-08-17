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
comprises.

```
src/app/shared/
├── components/ui/{catégorie}/{ui-nom}/{ui-nom}.ts    ← uniquement des composants
└── ui-core/{forms|motion|overlay|theming|types}/     ← directives de base, services, utilitaires, types
```

Les fichiers copiés vous appartiennent : modifiez-les librement. `ui-kit.json`
retient de quelle version vient chaque composant, ce qui permet ensuite à `update`
de vous présenter un diff fichier par fichier face à des sources plus récentes —
jamais une fusion automatique.

| | |
|---|---|
| `ng add @4sh/ui-kit-schematics` | fondation **et** composants, d'un coup |
| `ng add @4sh/ui-kit-schematics --skip-components` | fondation seule, composants choisis plus tard |
| `ng add @4sh/ui-kit-schematics --skip-install` | ne pas lancer `npm install` (projet qui pilote son lockfile) |
| `ng add @4sh/ui-kit-schematics --with-storybook` | copier aussi la story et le MDX de chaque composant (voir ci-dessous) |
| `ng generate @4sh/ui-kit-schematics:add` | copier d'autres composants (interactif, ou `--components`, ou `--all`) |
| `ng generate @4sh/ui-kit-schematics:update` | diff des composants copiés face aux sources publiées |

### Documenter ses copies : `--with-storybook`

Désactivé par défaut. Activé, chaque composant arrive avec sa story et sa page
MDX, et le projet reçoit la chaîne qui garde leurs tables *Theming* justes :
`scripts/docs.config.mjs` lit les rôles `///` de vos `.scss`, si bien que les
tables décrivent **vos** valeurs — la raison même de copier les sources. Le choix
est retenu dans `ui-kit.json`, et `update` s'y tient.

Ce que cela ne fait **pas** encore : installer Storybook ni écrire sa
configuration. Pointez votre `storybook/main.js` sur
`src/app/shared/components/**/*.mdx` et `**/*.stories.ts`, et lancez
`npm run docs:config` avant de le démarrer.

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

Voir [`docs/VERSIONING.md`](https://github.com/4sh/starter-angular/blob/main/docs/VERSIONING.md)
et [`docs/PUBLISHING.md`](https://github.com/4sh/starter-angular/blob/main/docs/PUBLISHING.md).

---

## Licence

Apache-2.0 — Copyright 2026 4SH.
