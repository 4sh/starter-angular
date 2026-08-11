# @4sh/ui-kit

Composants Angular *headless* du Design System 4SH : logique et accessibilité en
natif (signals + Angular CDK), style piloté par les design tokens.

**Documentation complète (Storybook)** :
<https://4sh.github.io/starter-angular/?path=/docs/introduction--docs>

---

## Installation

```bash
npm install @4sh/ui-kit
```

Les dépendances Angular sont déclarées en `peerDependencies` — elles utilisent
donc la version déjà présente dans votre application :
`@angular/core`, `@angular/common`, `@angular/forms`, `@angular/router`.

---

## Import à la carte (secondary entry points)

Chaque composant est exposé par son propre *entry point*. Vous importez ce dont
vous avez besoin, et le tree-shaking élimine le reste de votre bundle final :

```ts
import { UiButton } from '@4sh/ui-kit/ui-button';
import { UiIcon } from '@4sh/ui-kit/ui-icon';
```

> `@4sh/ui-kit` est **un seul package npm**. Les entry points ne s'installent
> pas séparément : ils sont tous présents dès l'installation, et les
> dépendances entre eux se résolvent automatiquement (importer `UiDatepicker`
> tire ce qu'il lui faut, vous n'avez rien à déclarer).

### Entry points disponibles

| Entry point | Contenu |
|---|---|
| `@4sh/ui-kit/ui-button` | `UiButton` |
| `@4sh/ui-kit/ui-icon` | `UiIcon`, `provideUiIconFamilies()` |
| `@4sh/ui-kit/forms` | Socle des champs de formulaire — voir ci-dessous |
| `@4sh/ui-kit/types` | Types transverses (`UiLevel`, `UiSubLevel`, `UiFeedbackLevel`) |

*(La migration des composants est en cours : cette liste s'étoffe progressivement.)*

---

## Styles : les design tokens sont obligatoires

Les composants sont **headless** : ils ne portent aucune valeur de couleur, de
taille ou d'espacement en dur. Tout passe par des variables CSS
(`--actions-high-surface-default`, `--units-sm`, `--radius-md`…) fournies par
les design tokens.

**Sans ces variables, les composants s'affichent sans style.** Chargez la
feuille de tokens **une fois**, globalement, dans votre application.

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
npm run storybook      # catalogue des composants (port 6006)
```

⚠️ **Règle impérative pour les imports internes au package** : toujours utiliser
le nom réel du package (`@4sh/ui-kit/ui-icon`), jamais un chemin relatif vers un
autre entry point ni un raccourci. `ng-packagr` ne détecte une dépendance entre
entry points que si l'import commence littéralement par le nom du package ; à
défaut, l'ordre de compilation devient indéterminé et le build échoue par
intermittence.
