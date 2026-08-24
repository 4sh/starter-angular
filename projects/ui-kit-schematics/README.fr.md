# @4sh/ui-kit-schematics

_[English](./README.md) · **Français**_

Package compagnon de **[`@4sh/ui-kit`](https://www.npmjs.com/package/@4sh/ui-kit)** :
il porte les _sources brutes_ des composants du Design System, et les schematics
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

|                                                     |                                                                                       |
| --------------------------------------------------- | ------------------------------------------------------------------------------------- |
| `ng add @4sh/ui-kit-schematics`                     | fondation **et** composants, d'un coup                                                |
| `ng add @4sh/ui-kit-schematics --skip-components`   | fondation seule, composants choisis plus tard                                         |
| `ng add @4sh/ui-kit-schematics --skip-install`      | ne pas lancer `npm install` (projet qui pilote son lockfile)                          |
| `ng add @4sh/ui-kit-schematics --skip-storybook`    | ne pas poser de Storybook (voir ci-dessous)                                           |
| `ng add @4sh/ui-kit-schematics --skip-mcp`          | ne pas déclarer le serveur MCP (voir ci-dessous)                                      |
| `ng add @4sh/ui-kit-schematics --gridaflex`         | poser la grille Gridaflex sans question (`--no-gridaflex` pour s'en passer)           |
| `ng generate @4sh/ui-kit-schematics:add`            | copier d'autres composants (interactif, ou `--components`, ou `--all`)                |
| `ng generate @4sh/ui-kit-schematics:update`         | diff des composants copiés face aux sources publiées                                  |
| `ng generate @4sh/ui-kit-schematics:update --force` | applique toutes les mises à jour sans diff ni confirmation (**écrase vos retouches**) |

`ui-kit.json` se trouve à la racine de votre projet, à côté de `package.json`.

> ⚠️ **`update` remplace, il ne fusionne pas.** Accepter un composant écrit la version
> publiée par-dessus la vôtre : **vos modifications sont perdues**. Lisez le diff, reportez
> à la main ce que vous voulez garder, ou sautez le composant. `--force` accepte tout sans
> afficher un seul diff : à réserver aux composants que vous n'avez pas touchés.

### Rattraper la fondation

`update` ne touche jamais qu'aux composants listés dans `ui-kit.json`. Tout le reste
de ce que `ng add` a posé — serveur MCP, config Storybook, chaîne de tokens, cibles
d'`angular.json`, dépendances — reste à la version de votre installation d'origine.
Un projet installé avant une version donnée ne récupère jamais ce que cette version a
ajouté autour des composants : c'est ainsi qu'un projet installé en `0.2.0` et monté
en `0.5.0` n'a jamais eu le serveur MCP, arrivé en `0.4.0`.

Pour réappliquer la fondation, relancez `ng add` en sautant les composants :

```bash
ng add @4sh/ui-kit-schematics --skip-components
```

La commande est sûre sur un projet existant. Vos composants copiés ne sont pas
touchés, un `.mcp.json` existant est fusionné et non remplacé (vos autres serveurs
sont conservés), et votre config Prettier comme vos feuilles de style retouchées sont
laissées telles quelles — ces règles n'écrivent que ce qui est absent. Une réserve à
connaître : une dépendance que **vous** auriez épinglée peut être ré-élargie vers la
plage demandée par le kit.

`update` ne le fait pas à votre place, et c'est volontaire : rien ne consigne si une
pièce manque parce qu'elle n'existait pas encore, ou parce que vous l'avez écartée
avec `--skip-mcp` ou `--skip-storybook`. La réappliquer sans demander imposerait.

### Votre propre Storybook

Posé par défaut : à la fin du `ng add`, vous avez un Storybook qui tourne, sur
les composants que vous avez copiés :

```bash
npm run storybook
```

Chaque composant arrive avec sa story et sa page MDX, à côté de ses sources. La
configuration atterrit dans `storybook/` — `main.js`, `preview.ts`, le thème du
manager, le sélecteur de marque, et les pages transverses _Foundations_,
_Spécifications_ et _Configuration_. Les cibles `storybook` et `build-storybook`
sont ajoutées à `angular.json`, les devDependencies au `package.json`.

Deux choses font que cette doc est **la vôtre**, et non une photo de la nôtre.
Les tables _Theming_ sont lues sur vos propres `.scss` au build
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

### Système de grille (Gridaflex)

Question posée juste après le choix des composants : le projet utilise-t-il
**[Gridaflex](https://www.npmjs.com/package/gridaflex)**, la grille flexbox 24
colonnes autour de laquelle le kit est pensé. Si oui, vous recevez la dépendance,
ses réglages dans `src/styles/vendors/_gridaflex-settings.scss` (à vous de les
retoucher : colonnes, breakpoints, gouttières) et le `@use` qui les charge en
premier dans `src/styles/main.scss`. Si non, aucun des trois n'apparaît.

`--gridaflex` / `--no-gridaflex` répond à votre place, pour une install scriptée ;
sans terminal pour poser la question (CI), elle est sautée et rien n'est posé.

Le fichier de réglages est créé une seule fois, jamais réécrasé ensuite, et
répondre non plus tard ne retire rien de ce qu'une install précédente a posé. À
savoir : les stories de `ui-card` et `ui-read-only` s'appuient sur les classes
Gridaflex (`flex-x`, `flex-gap-x`…) pour leur mise en page : sans la grille, ces
deux-là s'affichent à plat.

### Motion, et sa désactivation

Copiés sous `src/app/shared/ui-core/motion/` : la directive `UiMotion` et ses
presets d'animation, entièrement pilotés par les tokens `--transition-*` —
aucun composant ne code une durée en dur. Un consommateur qui ne veut aucun
motion pose un seul attribut, rien à toucher composant par composant :

```html
<html data-motion="off"></html>
```

Même réinitialisation que celle déjà appliquée automatiquement pour
`prefers-reduced-motion: reduce`. Référence complète, une fois votre Storybook
posé (voir ci-dessus) : **Foundations → Motion**.

### Agent IA (serveur MCP)

Posé par défaut aussi : un petit serveur MCP copié dans `.ui-kit-mcp/` (un fichier
bundlé, zéro dépendance — 🔒 verrouillé, régénéré à chaque `ng add`, comme la
fondation de styles — jamais retouché à la main), une entrée `.mcp.json` qui le
déclare (`node .ui-kit-mcp/index.js` — rien à aller chercher sur le registre npm,
il est déjà sur le disque), et une courte instruction ajoutée à votre `AGENTS.md`
qui dit à un agent compatible MCP de l'interroger — API des composants, tokens,
recherche plein texte dans la doc — plutôt que de lire les sources ou de deviner.

`.mcp.json` et `AGENTS.md` sont additifs : un `.mcp.json` existant garde ses
autres serveurs, un `AGENTS.md` existant garde son contenu, et relancer `ng add`
ne duplique jamais le bloc. `--skip-mcp` si vous n'utilisez pas d'agent compatible
MCP, ou gérez cette
config vous-même.

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

`ng-packagr` _inline_ template et SCSS dans le `.mjs` publié. Les sources que ces
schematics copient n'existent donc nulle part dans le tarball du kit, d'où leur
présence ici. Cette séparation a une conséquence voulue, dans les deux sens : un
consommateur en mode librairie ne télécharge jamais les sources brutes, et un
consommateur en mode starter ne télécharge jamais le kit compilé.

## Versionnage

**Les deux packages portent toujours le même numéro de version**, estampillé
depuis celui du kit à l'assemblage. Ce package embarque une copie des sources du
kit, et ce numéro commun est ce qui identifie _de quel_ kit vient un fichier
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
