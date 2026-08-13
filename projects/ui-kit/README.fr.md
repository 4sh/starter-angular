# @4sh/ui-kit

*[English](./README.md) · **Français***

Composants Angular *headless* du Design System 4SH : logique et accessibilité en
natif (signals + Angular CDK), style piloté par les design tokens.

**Documentation complète (Storybook)** :
<https://4sh.github.io/starter-angular/?path=/docs/introduction--docs>

---

## Installation

```bash
npm install @4sh/ui-kit
```

Publié sur le **registre npm public**, organisation **`4sh`** :
[npmjs.com/package/@4sh/ui-kit](https://www.npmjs.com/package/@4sh/ui-kit)

Les dépendances sont déclarées en `peerDependencies` — c'est la version déjà
présente dans votre application qui est utilisée (jamais un second exemplaire
d'Angular) : `@angular/core`, `@angular/common`, `@angular/forms`,
`@angular/router`, `@angular/cdk`, `@angular/platform-browser` et `rxjs`.

---

## Import à la carte (secondary entry points)

Chaque composant est exposé par son propre *entry point*. Vous importez ce dont
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

**53 entry points**, chacun nommé `@4sh/ui-kit/<famille>/<composant>` — la
famille ci-dessous est littéralement le segment de chemin, en minuscules :
`@4sh/ui-kit/actions/ui-button`, `@4sh/ui-kit/forms/ui-select`,
`@4sh/ui-kit/forms/ui-datepicker`…
(54 composants au total — `ui-file-upload-list` est livré dans
`ui-file-upload`, dont il consomme le modèle.)

| Famille | Entry points |
|---|---|
| Actions | `ui-button` · `ui-button-split` · `ui-link` |
| Formulaires | `ui-input` · `ui-textarea` · `ui-select` · `ui-autocomplete` · `ui-datepicker` · `ui-checkbox` · `ui-radio` · `ui-toggle` · `ui-slider` · `ui-nudger` · `ui-rating` · `ui-segment-control` · `ui-input-number` · `ui-input-mask` · `ui-input-otp` · `ui-input-tags` · `ui-input-group` · `ui-file-upload` · `ui-field` · `ui-label` |
| Informatif | `ui-alert` · `ui-toast` · `ui-badge` · `ui-chip` · `ui-tag` · `ui-avatar` · `ui-avatar-group` · `ui-accordion` · `ui-tooltip` · `ui-spinner` · `ui-skeleton` · `ui-progress-bar` · `ui-empty-state` · `ui-read-only` · `ui-separator` · `ui-helper` |
| Mise en page | `ui-card` · `ui-modal` · `ui-drawer` · `ui-popover` |
| Navigation | `ui-menu` · `ui-context-menu` · `ui-tabs` · `ui-stepper` · `ui-sidebar` · `ui-breadcrumb` |
| Tableau | `ui-table` · `ui-paginator` |
| Base | `ui-icon` · `ui-image` |

Plus les entry points transverses :

| Entry point | Contenu |
|---|---|
| `@4sh/ui-kit/forms` | Socle des champs de formulaire — voir ci-dessous |
| `@4sh/ui-kit/theming` | `ThemeService` (clair/sombre, `[data-theme]`) · `BrandService` (`[data-brand]`) · `provideUiKitBrand()` |
| `@4sh/ui-kit/motion` | Directive `UiMotion` + presets d'animation |
| `@4sh/ui-kit/overlay` | Utilitaires des composants à overlay CDK (`closeOnNavigation`) |
| `@4sh/ui-kit/types` | Types transverses (`UiLevel`, `UiSubLevel`, `UiFeedbackLevel`) |

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
]
```

Les deux sont **optionnels** : sans eux, la marque vaut `brand1` et `ui-image`
n'affiche que ses images distantes (`src`), `name` retombant sur le placeholder.

---

Exemple — n'utiliser que le date picker, sans tirer le reste du kit dans votre bundle :

```ts
import { UiDatepicker } from '@4sh/ui-kit/forms/ui-datepicker';

@Component({
  selector: 'app-booking',
  imports: [UiDatepicker],
  template: `<ui-datepicker label="Date" valueType="date" [(ngModel)]="date" />`,
})
export class Booking { date = signal<Date | null>(null); }
```

---

## Styles : charger la feuille du kit

Les composants sont **headless** : aucune couleur, taille ni espacement n'est
codé en dur — tout est lu depuis des variables CSS. Le package **livre** cette
feuille, à charger **une fois**, globalement :

```jsonc
// angular.json
"styles": [
  "node_modules/@4sh/ui-kit/styles.css",   // ← tokens + base + typo + motion
  "src/styles/main.scss"
]
```

`styles.css` contient les design tokens (les 3 marques, clair/sombre,
responsive), la couche de base, les classes typographiques et les presets
d'animation de la directive `UiMotion`. **Sans elle, les composants s'affichent
sans style.**

Les `@font-face` ne sont **pas** inclus : les tokens se contentent de *nommer*
les familles (`--fontfamily-base`). Livrez vos propres polices et surchargez
`--fontfamily-*` si besoin.

### Écrire ses propres styles avec le socle du kit

Les sources SCSS sont livrées avec le package : vos composants peuvent utiliser
les mêmes fonctions, mixins et constantes partagées.

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

---

## `@4sh/ui-kit/forms` — socle des champs

Cet entry point regroupe l'infrastructure partagée par tous les champs du kit.
**Vous n'avez pas à l'importer pour utiliser un champ existant** (`UiInput`,
`UiSelect`, `UiDatepicker`… le tirent déjà). Il devient utile quand vous
construisez **votre propre champ** en réutilisant les conventions du kit.

| Export | Rôle |
|---|---|
| `BaseControlValueAccessor<T>` | Implémente `ControlValueAccessor` et miroite l'état du `NgControl` attaché dans des signals (`touched`, `dirty`, `controlInvalid`, `controlErrors`, `showError`). C'est ce qui rend un champ compatible d'un coup avec `[(ngModel)]`, les Reactive Forms **et** les Signal Forms. |
| `BaseFieldControl<T>` | Contrôle « nu », sans habillage : inputs communs (`ariaLabel`, `inputId`, `name`, `required`, `disabled`, `readonly`, `invalid`, `tabindex`), génération d'`id` accessibles, `modelValue`, états dérivés `isDisabled`/`isInvalid`. Base de `ui-checkbox`, `ui-toggle`, `ui-slider`, `ui-radio`, `ui-nudger`. |
| `BaseFormField<T>` | Étend le précédent avec le chrome « boîte » : `label`, `helperText`, `errorText`, `size`, `level`, plus `effectiveLevel` / `displayMessage` / `displayValue`. Base de `ui-input`, `ui-select`, `ui-datepicker`, `ui-textarea`… |
| `dropdownOverlayPositions()` | Ancrage CDK standard d'un panneau déroulant (sous le champ, retourné au-dessus si besoin). |
| `maskEngine` | Moteur de masque de saisie partagé (`ui-input-mask`, `ui-datepicker`). |
| `option-resolver`, `format-label`, `warn-missing-accessible-name` | Utilitaires de résolution d'options, de formatage de libellé et garde-fou d'accessibilité. |

### Créer son propre champ

```ts
import { Component, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseFormField } from '@4sh/ui-kit/forms';

@Component({
  selector: 'app-my-field',
  templateUrl: './my-field.html',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MyField), multi: true },
  ],
})
export class MyField extends BaseFormField<string> {
  // `writeValue` est fourni par défaut (écrit dans `modelValue`).
  // Appelez `emitChange(value)` à la saisie et `emitTouch()` au blur.
}
```

---

## Contribuer (développement dans ce repo)

```bash
npm run ui-kit:build   # construit le package dans dist/ui-kit
npm run ui-kit:pack    # + produit un tarball installable ailleurs
npm run storybook      # catalogue des composants (port 6006)
```

Publication : voir [`docs/PUBLISHING.md`](../../docs/PUBLISHING.md) (workflow
GitHub Actions manuel, compte de service `4sh-package-admin`).

⚠️ **Règle impérative pour les imports internes au package** : toujours utiliser
le nom réel du package (`@4sh/ui-kit/base/ui-icon`), jamais un chemin relatif vers un
autre entry point ni un raccourci. `ng-packagr` ne détecte une dépendance entre
entry points que si l'import commence littéralement par le nom du package ; à
défaut, l'ordre de compilation devient indéterminé et le build échoue par
intermittence.

---

## Licence

[Apache-2.0](./LICENSE) — Copyright 2026 4SH.
