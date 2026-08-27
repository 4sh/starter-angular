# @4sh/ui-kit

_[English](./README.md) · **Français**_

Composants Angular _headless_ du Design System 4SH : logique et accessibilité en
natif (signals + Angular CDK), style piloté par les design tokens.

**Documentation complète (Storybook)** :
<https://4sh.github.io/starter-angular/?path=/docs/introduction--docs>

---

## Deux modes de consommation

À choisir **avant** d'installer : la décision conditionne toute la suite.

|                                | **dépendance**                                             | **starter**                                                                            |
| ------------------------------ | ---------------------------------------------------------- | -------------------------------------------------------------------------------------- |
| Installation                   | `pnpm add @4sh/ui-kit`                                     | `ng add @4sh/ui-kit-schematics`                                                        |
| Ce qui arrive dans votre dépôt | rien — les composants compilés restent dans `node_modules` | les _sources_ des composants, dans `src/app/shared/`                                   |
| Imports                        | `@4sh/ui-kit/actions/ui-button`                            | votre propre chemin (`./shared/components/ui/actions/ui-button`)                       |
| Styles                         | `node_modules/@4sh/ui-kit/styles.css`, chargée globalement | copiés dans `src/styles/`, avec la chaîne de génération des tokens (`tokens:build`)    |
| Documentation                  | le Storybook lié ci-dessus                                 | la vôtre, sur vos copies (posée par `ng add`)                                          |
| Personnalisation               | inputs + variables CSS                                     | modifier le code lui-même                                                              |
| Mise à jour                    | bump de version                                            | `ng generate @4sh/ui-kit-schematics:update` — diff par composant, appliquer ou ignorer |

**dépendance** est le mode par défaut : rien à maintenir, une seule version à
suivre, et la garantie que tous les projets affichent le même kit. **starter** —
l'approche de shadcn/ui ou spartan-ng — échange cette garantie contre la
possession du code : à choisir quand le projet doit s'écarter du Design System,
en assumant que les mises à jour deviennent semi-manuelles.

Les deux modes décrivent les mêmes composants. **La suite de cette page décrit le
mode `dépendance`** ; la voie starter a son propre package et son propre README
(voir [plus bas](#ou-copier-les-sources-à-la-place)).

---

## Installation

```bash
pnpm add @4sh/ui-kit
```

N'importe quel gestionnaire fonctionne : le package est un tarball npm standard,
avec des `peerDependencies` classiques. `pnpm` est celui que le Design System
utilise et recommande (sa résolution stricte fait échouer un peer manquant au
lieu de le masquer, et ses réglages de chaîne de dépendances mettent en
quarantaine les versions fraîchement publiées) ; `npm install @4sh/ui-kit` ou
`yarn add @4sh/ui-kit` installent exactement la même chose.

Publié sur le **registre npm public**, organisation **`4sh`** :
[npmjs.com/package/@4sh/ui-kit](https://www.npmjs.com/package/@4sh/ui-kit)

| Requiert |                                                                            |
| -------- | -------------------------------------------------------------------------- |
| Angular  | `^22.0.0` — `core`, `common`, `forms`, `router`, `platform-browser`, `cdk` |
| RxJS     | `^7.8.0`                                                                   |

Déclarées en `peerDependencies` : c'est la version déjà présente dans votre
application qui est utilisée, jamais un second exemplaire d'Angular.

### Ou copier les sources à la place

Ce package vous donne les composants **compilés** : vous les importez et vous
suivez les releases du kit. Si vous préférez avoir les sources _dans votre propre
dépôt_, pour les lire et les modifier — l'approche shadcn/spartan-ng — c'est
l'autre mode, et il passe par le package compagnon :

```bash
ng add @4sh/ui-kit-schematics
```

Il copie les composants que vous choisissez dans `src/app/shared/`, et n'installe
délibérément **pas** `@4sh/ui-kit` : absent de `node_modules`, plus rien ne peut
importer son code compilé au lieu de vos copies. Voir
**[`@4sh/ui-kit-schematics`](https://www.npmjs.com/package/@4sh/ui-kit-schematics)**.

Les deux modes ne se combinent pas — choisissez celui qui correspond au projet.

### Agent IA (serveur MCP)

Un petit serveur MCP est embarqué **dans ce package**, sous `mcp/` — bundlé au
build (un seul fichier, zéro dépendance), jamais publié à part. Il expose le
catalogue des composants, leur API et leur doc (recherche plein texte incluse) à un
agent IA compatible MCP (Claude Code, Claude Desktop, Cursor…), pour qu'il
l'interroge plutôt que de lire les sources ou de deviner.

Contrairement à `ng add @4sh/ui-kit-schematics` (qui le déclare pour vous), cette
voie n'a pas de hook à l'installation — ajoutez-le vous-même, une fois, dans votre
`.mcp.json` :

```json
{
  "mcpServers": {
    "ui-kit": {
      "command": "npx",
      "args": ["--no-install", "ui-kit-mcp"]
    }
  }
}
```

L'installation pose `ui-kit-mcp` dans le `node_modules/.bin/` du projet : cette forme
se résout donc quel que soit le dossier depuis lequel votre client MCP lance le
serveur — un `node node_modules/@4sh/ui-kit/mcp/index.js` en dur est relatif au
répertoire courant et casse dès que ce n'est pas la racine du projet. Gardez
`--no-install` : npx échoue franchement si le binaire manque, au lieu d'aller
chercher sur le registre un paquet homonyme sans rapport.

Rien à installer au-delà de `@4sh/ui-kit` lui-même, et rien à aller chercher sur le
registre npm à l'usage — le fichier est déjà sur le disque une fois `npm install`
passé. Tools : `list_components`, `get_component_doc`, `search_docs`,
`get_shared_config` — le même contenu que la doc Storybook liée plus haut, et que
son bouton **Copier en Markdown** sur chaque page, pour un chat qui n'est pas
compatible MCP.

---

## Démarrer

Deux étapes, et c'est la seconde qu'on oublie.

**1. Chargez la feuille de style du kit, une fois, globalement.** Les composants sont
**headless** : aucune couleur, taille ni espacement n'est codé en dur — tout est lu
depuis des variables CSS, et le package les livre.

```jsonc
// angular.json
"styles": [
  "node_modules/@4sh/ui-kit/styles.css",   // ← tokens + base + typo + motion
  "src/styles/main.scss"
]
```

`styles.css` contient les design tokens (les 3 marques, clair/sombre, responsive), la
couche de base, les classes typographiques et les presets d'animation de la directive
`UiMotion`. **Sans elle, les composants s'affichent sans style** — rien ne plante, tout
est simplement faux visuellement.

Les `@font-face` ne sont **pas** inclus : les tokens se contentent de _nommer_ les
familles (`--fontfamily-base`), et chacune se termine par une pile système, une
application qui n'embarque aucun fichier de police s'affiche donc dans le sans-serif de
l'OS (San Francisco, Segoe UI, Roboto), jamais dans le serif par défaut du navigateur.
Pour les vôtres : déclarez les `@font-face` dans une feuille globale et surchargez
`--fontfamily-*` au même endroit, en gardant une queue de pile. Le pas-à-pas, pour les
deux modes de consommation : **Foundations → Typography** dans le Storybook.

**2. Importez le composant dont vous avez besoin** — et lui seul. Ici le date picker,
sans tirer le reste du kit dans votre bundle :

```ts
import { UiDatepicker } from '@4sh/ui-kit/forms/ui-datepicker';

@Component({
  selector: 'app-booking',
  imports: [UiDatepicker],
  template: `<ui-datepicker label="Date" valueType="date" [(ngModel)]="date" />`,
})
export class Booking {
  date = signal<Date | null>(null);
}
```

C'est toute l'installation. Deux composants demandent un provider chacun — voir
[plus bas](#configuration-requise-par-certains-composants) — le reste est optionnel.

---

## Import à la carte (secondary entry points)

Chaque composant est exposé par son propre _entry point_. Vous importez ce dont
vous avez besoin, et le tree-shaking élimine le reste de votre bundle final :

```ts
import { UiButton } from '@4sh/ui-kit/actions/ui-button';
import { UiIcon } from '@4sh/ui-kit/base/ui-icon';
```

> `@4sh/ui-kit` est **un seul package npm**. Les entry points ne s'installent
> pas séparément : ils sont tous présents dès l'installation, et les
> dépendances entre eux se résolvent automatiquement (importer `UiDatepicker`
> tire ce qu'il lui faut, vous n'avez rien à déclarer).

### Entry points disponibles

**54 entry points**, chacun nommé `@4sh/ui-kit/<famille>/<composant>` — la
famille ci-dessous est littéralement le segment de chemin, en minuscules :
`@4sh/ui-kit/actions/ui-button`, `@4sh/ui-kit/forms/ui-select`,
`@4sh/ui-kit/forms/ui-datepicker`…
(55 composants au total — `ui-file-upload-list` est livré dans
`ui-file-upload`, dont il consomme le modèle.)

| Famille      | Entry points                                                                                                                                                                                                                                                                                                                                                           |
| ------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actions      | `ui-button` · `ui-button-split` · `ui-link` · `ui-speed-dial`                                                                                                                                                                                                                                                                                                          |
| Formulaires  | `ui-input` · `ui-textarea` · `ui-editor` · `ui-select` · `ui-autocomplete` · `ui-datepicker` · `ui-checkbox` · `ui-radio` · `ui-toggle` · `ui-toggle-button` · `ui-slider` · `ui-nudger` · `ui-rating` · `ui-segment-control` · `ui-input-number` · `ui-input-mask` · `ui-input-otp` · `ui-input-tags` · `ui-input-group` · `ui-file-upload` · `ui-field` · `ui-label` |
| Informatif   | `ui-alert` · `ui-toast` · `ui-badge` · `ui-chip` · `ui-tag` · `ui-avatar` · `ui-avatar-group` · `ui-accordion` · `ui-tooltip` · `ui-spinner` · `ui-skeleton` · `ui-progress-bar` · `ui-empty-state` · `ui-read-only` · `ui-separator` · `ui-helper`                                                                                                                    |
| Mise en page | `ui-card` · `ui-modal` · `ui-drawer` · `ui-popover`                                                                                                                                                                                                                                                                                                                    |
| Navigation   | `ui-menu` · `ui-context-menu` · `ui-tabs` · `ui-stepper` · `ui-sidebar` · `ui-breadcrumb`                                                                                                                                                                                                                                                                              |
| Tableau      | `ui-table` · `ui-paginator`                                                                                                                                                                                                                                                                                                                                            |
| Base         | `ui-icon` · `ui-image`                                                                                                                                                                                                                                                                                                                                                 |

Plus les entry points transverses :

| Entry point           | Contenu                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------- |
| `@4sh/ui-kit/forms`   | Socle des champs de formulaire — voir ci-dessous                                                        |
| `@4sh/ui-kit/theming` | `ThemeService` (clair/sombre, `[data-theme]`) · `BrandService` (`[data-brand]`) · `provideUiKitBrand()` |
| `@4sh/ui-kit/motion`  | Directive `UiMotion` + presets d'animation                                                              |
| `@4sh/ui-kit/overlay` | Utilitaires des composants à overlay CDK (`closeOnNavigation`)                                          |
| `@4sh/ui-kit/types`   | Types transverses (`UiLevel`, `UiSubLevel`, `UiFeedbackLevel`)                                          |

---

## Configuration requise par certains composants

Deux composants ont besoin d'une donnée que le kit ne peut pas connaître — elle
est donc **injectée** par l'application plutôt que codée en dur :

```ts
// app.config.ts
import { brandFromSubdomain, provideUiKitBrand } from '@4sh/ui-kit/theming';
import { provideUiImageAssets } from '@4sh/ui-kit/base/ui-image';
import assetsMap from './assets/assets-map.json';

providers: [
  // marque active — la détection (sous-domaine, réglage utilisateur…) reste à vous
  provideUiKitBrand(brandFromSubdomain(subdomain)),
  // carte des assets locaux de VOTRE projet, consommée par `ui-image` (input `name`)
  provideUiImageAssets(assetsMap),
];
```

Les deux sont **optionnels** : sans eux, la marque vaut `brand1` et `ui-image`
n'affiche que ses images distantes (`src`), `name` retombant sur le placeholder.

---

## Styles : aller plus loin

### Écrire ses propres styles avec le socle du kit

Les styles du kit sont écrits en **SCSS (Sass)**, pas en CSS pur — c'est ce qui
permet d'assembler `styles.css` à partir des tokens, de mixins et de partiels par
composant plutôt que d'une seule feuille plate à maintenir à la main. Le
`styles.css` compilé que vous chargez dans `angular.json` est du CSS pur et ne
nécessite pas Sass de votre côté ; mais les **sources** SCSS sont aussi livrées
avec le package, et vos composants peuvent donc utiliser les mêmes fonctions,
mixins et constantes partagées.

```scss
// avec `node_modules/@4sh/ui-kit/styles` dans vos includePaths
@use 'utils';

.my-field {
  min-height: utils.$form-field-height;
  padding: var(--units-md);
  border-radius: var(--radius-md);
}
```

> `utils` n'expose **que** de l'API (fonctions, mixins, constantes) et n'émet
> aucune règle CSS : chaque `.scss` de composant étant une unité de compilation
> Sass distincte, tout CSS qui y serait exposé serait dupliqué dans chaque
> composant. Les classes utilitaires globales sont dans `styles.css`.

### Thème, marque et surcharges

Le clair/sombre et la marque sont des **attributs sur `<html>`** — rien à importer,
`styles.css` porte déjà tous les modes :

| Attribut     | Valeurs            | Absent signifie |
| ------------ | ------------------ | --------------- |
| `data-theme` | `dark`             | clair           |
| `data-brand` | `brand2`, `brand3` | marque 1        |

```html
<html data-theme="dark" data-brand="brand2"></html>
```

À poser comme vous voulez (un service, du SSR, un flag de build) : le kit ne fait que
les lire.

Pour changer une valeur, trois niveaux, du plus large au plus étroit :

```scss
// src/styles/main.scss — chargé après styles.css
@use 'presets/component-vars'; // 2. les valeurs d'un composant

:root {
  --units-lg: 20px;
} // 1. un token : tout le kit suit
:root[data-theme='dark'] {
  --global-background-default: #101014;
}

.toolbar ui-button {
  --ui-button-height-small: 24px;
} // 3. une zone de l'écran
```

1. **Un token** (`--units-*`, `--radius-*`, `--actions-*`…) — doit venir **après**
   `styles.css`, qui les déclare. Pour une valeur propre à un mode, viser le même
   sélecteur (`:root[data-theme='dark']`).
2. **Les valeurs d'un composant** — copier `@4sh/ui-kit/styles/component-vars.scss`
   dans votre `styles/presets/` : toutes les variables `--ui-*` à leur valeur livrée,
   prêtes à retoucher. L'ordre de chargement n'importe pas ici, le kit ne fait que
   _lire_ ces noms.
   Les valeurs partagées par toute une famille sont dans le même fichier, en
   `--ui-form-*` / `--ui-control-*` / `--ui-overlay-panel-*` : une seule déclaration
   déplace tous les consommateurs, et une variable de composant reste prioritaire.
3. **Une zone** — la même variable `--ui-*` sur n'importe quel sélecteur ou élément.

Référence complète (chaque variable, son rôle, sa valeur mesurée) : Storybook →
_Spécifications → Thème & Système de Tokens_.

### Motion, et sa désactivation

Chaque transition et animation du kit est pilotée par les tokens `--transition-*`
et les presets `UiMotion` — aucun composant ne code une durée en dur. Désactiver
le motion est donc un seul interrupteur global, pas un réglage par composant :

```html
<html data-motion="off"></html>
```

Ça neutralise d'un coup toutes les animations et transitions du kit — la même
réinitialisation déjà appliquée automatiquement quand la préférence système
`prefers-reduced-motion: reduce` est active. Il existe aussi un opt-out par
élément (`[motionDisabled]` sur la directive `UiMotion`, depuis
`@4sh/ui-kit/motion`). Référence complète, presets d'animation compris :
Storybook → **Foundations → Motion**.

---

## `@4sh/ui-kit/forms` — socle des champs

Cet entry point regroupe l'infrastructure partagée par tous les champs du kit.
**Vous n'avez pas à l'importer pour utiliser un champ existant** (`UiInput`,
`UiSelect`, `UiDatepicker`… le tirent déjà). Il devient utile quand vous
construisez **votre propre champ** en réutilisant les conventions du kit.

| Export                                                            | Rôle                                                                                                                                                                                                                                                                                                         |
| ----------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `BaseControlValueAccessor<T>`                                     | Implémente `ControlValueAccessor` et miroite l'état du `NgControl` attaché dans des signals (`touched`, `dirty`, `controlInvalid`, `controlErrors`, `showError`). C'est ce qui rend un champ compatible d'un coup avec `[(ngModel)]`, les Reactive Forms **et** les Signal Forms.                            |
| `BaseFieldControl<T>`                                             | Contrôle « nu », sans habillage : inputs communs (`ariaLabel`, `inputId`, `name`, `required`, `disabled`, `readonly`, `invalid`, `tabindex`), génération d'`id` accessibles, `modelValue`, états dérivés `isDisabled`/`isInvalid`. Base de `ui-checkbox`, `ui-toggle`, `ui-slider`, `ui-radio`, `ui-nudger`. |
| `BaseFormField<T>`                                                | Étend le précédent avec le chrome « boîte » : `label`, `helperText`, `errorText`, `size`, `level`, plus `effectiveLevel` / `displayMessage` / `displayValue`. Base de `ui-input`, `ui-select`, `ui-datepicker`, `ui-textarea`…                                                                               |
| `dropdownOverlayPositions()`                                      | Ancrage CDK standard d'un panneau déroulant (sous le champ, retourné au-dessus si besoin).                                                                                                                                                                                                                   |
| `maskEngine`                                                      | Moteur de masque de saisie partagé (`ui-input-mask`, `ui-datepicker`).                                                                                                                                                                                                                                       |
| `option-resolver`, `format-label`, `warn-missing-accessible-name` | Utilitaires de résolution d'options, de formatage de libellé et garde-fou d'accessibilité.                                                                                                                                                                                                                   |

### Créer son propre champ

```ts
import { Component, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseFormField } from '@4sh/ui-kit/forms';

@Component({
  selector: 'app-my-field',
  templateUrl: './my-field.html',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MyField), multi: true }],
})
export class MyField extends BaseFormField<string> {
  // `writeValue` est fourni par défaut (écrit dans `modelValue`).
  // Appelez `emitChange(value)` à la saisie et `emitTouch()` au blur.
}
```

---

## Accessibilité

Si les composants sont headless, c'est précisément parce que le comportement et
l'accessibilité sont la part que vous ne devriez pas avoir à réécrire :

- Éléments natifs (`<button>`, `<a>`, `<input>`) — jamais un `<div>` cliquable.
- `aria-label` obligatoire en mode icône seule ; les icônes décoratives portent
  `aria-hidden`.
- `:focus-visible` toujours visible, et distinct de `hover`.
- `disabled` est l'attribut natif, pas seulement un état visuel.
- Les composants à overlay (select, menu, modal, drawer…) s'appuient sur le CDK Angular
  pour le piège de focus et la navigation clavier.

Chaque story passe axe-core en CI (`@storybook/addon-a11y` + `test-storybook`).
**Ce contrôle est informatif aujourd'hui** : un reliquat de violations connues reste à
traiter, à lire donc comme un garde-fou en cours, pas comme une déclaration de conformité.
Le kit rend l'accessibilité bien plus facile à réussir ; il ne certifie pas vos écrans.

---

## Contribuer

Le kit est développé dans le dépôt
[starter-angular](https://github.com/4sh/starter-angular) — conventions, commandes et
processus de release y sont documentés.

---

## Licence

[Apache-2.0](./LICENSE) — Copyright 2026 4SH.
