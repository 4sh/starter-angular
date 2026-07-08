---
name: generate-ui-component
description: >-
  Génère un composant headless `ui-*` (Angular 21 signals + CDK) et sa doc
  Storybook (stories + MDX) à partir d'un YAML de composant Figma, en respectant
  les conventions de ce starter (design tokens, types partagés, a11y, SCSS
  co-localisé). À utiliser dès que l'utilisateur fournit un YAML de specs Figma
  (title/anatomy/props/variants) et demande de créer/générer/préparer un
  composant `ui-*` ou `sp-*`. Fournir le YAML en argument suffit.
---

# Génération d'un composant `ui-*` depuis un YAML Figma

Ce skill produit un composant **homogène** avec le reste du design system.
Le YAML Figma fourni décrit `anatomy`, `props`, `default`, `variants`. La logique
dépend de la stack (Angular CDK + signals) ; la couche partagée = **design tokens**.

> Lire `CLAUDE.md` (racine) pour les règles complètes. Ce skill en est l'application
> opérationnelle côté génération de code Angular.

## Entrée

- **YAML Figma** (obligatoire) : specs du composant.
- **Chemin PrimeNG** (optionnel) : `.primeng-master/packages/primeng/src/<name>` — inspiration API/comportement uniquement, jamais pour le style.

## Workflow

### 1. Analyser les sources
1. Lire le YAML : `props` (→ inputs), `variants` (→ états visuels), `anatomy` (→ structure DOM), tokens dans `styles.fills/strokes/...`.
2. Lire le **patron de référence** `src/app/shared/components/ui/actions/ui-button/` (ts/html/scss).
3. Lire le **sibling le plus proche** selon la catégorie :
   - `forms/` → `ui-checkbox` (contrôle de formulaire + `BaseControlValueAccessor`).
   - `informative/` → `ui-badge` / `ui-helper`.
   - sinon → `ui-icon`.
4. Si PrimeNG fourni : lire pour l'API (inputs, comportement clavier, CVA).

### 2. Catégorie & emplacement
Déduire la catégorie des tokens utilisés / du rôle :
- tokens `actions.*` → `ui/actions/` · tokens `form.*` → `ui/forms/` · tokens `informative.*` → `ui/informative/` · générique → `ui/`.

Fichiers **tous co-localisés** dans le dossier du composant :
`src/app/shared/components/ui/{cat}/ui-{name}/ui-{name}.{ts,html,scss,stories.ts,mdx}`.
(La doc **globale** — fondations/guidelines — irait dans `storybook/docs/`, pas ici.)

### 3. Mapper les tokens (voir table plus bas)
Pour **chaque** couleur/espacement/typo du YAML, trouver la var CSS générée
correspondante dans `src/styles/src/generated/`. **Vérifier qu'elle existe**
(`grep` dans `generated/`). Zéro valeur hardcodée.

### 4. Types
- Niveaux : réutiliser `@app/shared/types/ui-level.ts` (`UiLevel`, `UiFeedbackLevel`, `UiSubLevel`). Étendre ce fichier seulement si un nouveau niveau partagé émerge.
- Tailles : type local `type {Name}Size = 'default' | 'small' | ...` (le starter utilise `default` comme base, pas `undefined`).

### 5. Écrire le composant (voir « Conventions Angular »)
### 6. Écrire le SCSS (voir « Conventions SCSS »)
### 7. Écrire stories + MDX (voir « Storybook »)
### 8. Intégrer : cocher `components-index.md` (⬜→✅), ajouter la carte dans `Overview.mdx` (bonne section de catégorie), **ajouter l'entrée dans `CHANGELOG.md`** (section `[Unreleased]`), et — si une variable partagée a été ajoutée — mettre à jour la doc `config/` (voir « Variables partagées »).
### 9. Vérifier (voir « Vérification »).

## Mapping tokens Figma → CSS var

Le YAML référence les tokens en `{groupe.chemin.en.camelCase}`. La var CSS générée
est en **kebab/plat**, préfixe selon la collection :

| YAML Figma | Var CSS |
|---|---|
| `{informative.errorLow.content.default}` | `var(--informative-errorlow-content-default)` |
| `{informative.{level}{Sub}.surface.default}` | `var(--informative-{level}{sub}-surface-default)` (tout en minuscules, concaténé) |
| `{form.high.surface.checked}` | `var(--form-high-surface-checked)` |
| `{form.low.content.default}` | `var(--form-low-content-default)` |
| `{actions.high.surface.hover}` | `var(--actions-high-surface-hover)` |
| `{units.sm}` / `{units.xs}` / `{units.2xs}` | `var(--units-sm)` … |
| `cornerRadius: 999` | `var(--radius-full)` |
| `cornerRadius: <n>` | `var(--radius-{2xs..2xl})` selon la valeur |
| `strokeWeight: 1 / 2 / 4` | `var(--stroke-sm)` / `var(--stroke-default)` / `var(--stroke-lg)` |
| `textStyleId: text/{weight}/{size}` | `font-weight: var(--weight-{weight})` + `font-size: var(--size-typography-text-{size})` |

Règles :
- **semantics** (`--actions-*`, `--form-*`, `--informative-*`, `--global-*`) : **aucun préfixe**.
- **metrics** : `--units-*`, `--radius-*`, `--stroke-*`. **typography** : `--fontfamily-*`, `--weight-*`, `--size-typography-*`. **transitions** : `--transition-*`.
- Toujours `grep -rhoE '\--<motif>' src/styles/src/generated/` pour confirmer l'existence AVANT usage.
- Les états interactifs Figma (`hover/focused/pressed/disabled`) → **pseudo-classes CSS** pilotées par les tokens `-hover/-focused/-pressed/-disabled`, **jamais** des props Angular.

## Conventions Angular

- **Standalone**, signals API. `input()`, `input.required()`, `input(false, { transform: booleanAttribute })` pour les booléens, `output()`, `computed()`.
- **Encapsulation émulée** : styliser un **élément interne** via `[class]="classes()"` (comme `ui-button`/`ui-label`/`ui-badge`). Ne PAS compter sur `.ui-{name}` pour matcher l'hôte (il porte `_nghost`, pas `_ngcontent`).
- `classes = computed()` : `['ui-{name}']` + `_{modifier}` (préfixe `_`), état dérivé via computed. Taille `default` = pas de classe (base) ; n'émettre que les non-default.
- Props Figma booléennes `text`/`icon`/… → **présence** d'un input (`hasIcon = computed(() => !!this.icon())`), pas un booléen dédié — cf. `ui-button`.
- Commentaires internes : `/** @ignore */` sur les membres protégés.
- **Commentaires de code toujours en anglais** (JSDoc, commentaires inline dans `.ts`/`.html`/`.scss`). La doc destinée à l'utilisateur (stories/MDX) reste en français.
- Icônes : composant `ui-icon` (`[name]`, `[size]`), décoratif par défaut.

## Conventions SCSS

- Co-localisé, `@use 'utils';` (donne `rem-calc`, `control-transition`, `form-control-palette`, `$control-stroke-width`, `$focus-ring-width`, `$form-control-gap`…), `@use 'sass:map';`.
- **Pas de BEM.** Racine `.ui-{name}`, sous-éléments `&-{part}` (→ `.ui-{name}-{part}`), modifiers `&._{mod}`.
- Config d'extension en tête : `$sizes` (map), `$levels`/`$sublevels` (listes) + boucles `@each` pour générer variantes/couleurs (cf. `ui-button`, `ui-badge`).
- **100% tokens** : aucune couleur hex, aucun px d'espacement/radius/typo hors tokens. Dimensions issues du YAML → `utils.rem-calc(<px>)`.
- États interactifs = `:hover`, `:focus-visible`, `:active`, `:disabled` (jamais des classes modifier).

## Variables partagées (`ui-config`)

Avant d'écrire le SCSS, **inspecter `src/styles/src/settings/_ui-config.scss`** : une constante
structurelle existante (focus ring, épaisseur de bordure, taille de contrôle, transition, `$form-*`,
`$avatar-*`…) correspond-elle à une propriété du **type** de composant que tu génères ?

- **Oui** → la consommer via une variable **locale** en tête du `.scss` (`$x: utils.$…;`), jamais recopier la valeur.
- **Valeur potentiellement commune à ≥ 2 composants** d'une même famille et absente de `ui-config` →
  **l'ajouter** dans `_ui-config.scss` (niveau **catégorie** `$form-*`/`$action-*`/`$avatar-*`… si propre
  à une famille, **global** sinon ; jamais de couleur — elle reste un design token runtime), puis
  **documenter** systématiquement :
  1. la page de groupe dans `storybook/docs/config/` (`config-{catégorie}.mdx` — ex. `config-informative.mdx` ;
     créer la page + l'ajouter au sommaire de `component-config.mdx` si la catégorie n'existe pas encore) ;
  2. la section **« Configuration (SCSS) »** de la doc du composant (table variable locale → source → rôle).
- **Valeur propre à un seul composant** → elle reste **locale** (documentée seulement dans la section
  « Configuration (SCSS) » du composant).

## Contrôles de formulaire (catégorie `forms/`)

Si le composant tient une valeur (checked, sélection, saisie) :
- `extends BaseControlValueAccessor<T>` (`@app/core/controlValueAccessor/BaseControlValueAccessor`), `T = boolean` par défaut si pertinent.
- Provider : `{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ui{Name}), multi: true }`.
- **Input natif réel** (`<input>`), invisible (`opacity:0`, `position:absolute; inset:0`) recouvrant le contrôle stylé → clavier/lecteur d'écran/`<label>` cliquable/form natifs. Rôle ARIA adapté (`role="switch"` pour un toggle) + `aria-checked`/`aria-invalid`.
- Inputs standard : `label`, `ariaLabel`, `ariaLabelledBy`, `inputId` (uid auto), `name`, `trueValue`/`falseValue`, `required`, `disabled`, `readonly`, `invalid`, `tabindex`.
- `writeValue` → set d'un signal `modelValue`. `onNativeChange` → source unique des toggles user (respecte `readonly`), `emitChange` + output `{name}Change`. `onBlur` → `emitTouch()`.
- `isDisabled = disabled() || controlDisabled()`, `isInvalid = invalid() || showError()`.
- Label inline (span + marqueur requis) — **pas** d'instance `ui-label` (label imbriqué invalide). `--ui-label-color` pour piloter la couleur via états.

## Accessibilité (obligatoire)

- Éléments natifs (`<button>`, `<input>`, `<label>`), jamais de `<div>` cliquable.
- Icon-only : `ariaLabel` obligatoire + **warning en `isDevMode()`** via `effect()` (cf. `ui-button`/`ui-badge`).
- `:focus-visible` visible et distinct du `hover`. `disabled` natif (pas seulement visuel), couleurs via tokens `-disabled`.
- La couleur n'est jamais le seul vecteur de sens (texte/icône en complément).

## Storybook

**stories.ts** :
- `title: 'Components/ui/{cat}/ui-{name}'`, `component`, `decorators: [moduleMetadata({ imports: [...] })]` (+ `FormsModule` si `ngModel`).
- `parameters.design.url` Figma (fichier `XgSemnGLFrAq75CxcjPVf1`) — pointer le `node-id` du ComponentSet si connu.
- `argTypes` documentés (control, description FR, `table.type`/`defaultValue`).
- Une story par état visuel distinct du YAML (levels, sizes, states…). Contrôles de formulaire : piloter avec `[(ngModel)]` via un `render` factory pour une interactivité réelle.

**mdx** (co-localisée, importe sa story sœur en relatif `./ui-{name}.stories`) : `import { Meta, Canvas, ArgTypes } from '@storybook/addon-docs/blocks'` ; sections `# ui-{name}` (intro FR + tokens), `## API` (`<ArgTypes>`), `## États`, `## Accessibilité` (table `className="doc-table"`), exemples `html`, et — dès que le composant a des variables locales configurables — `## Configuration (SCSS)` (table variable locale → source → rôle, avec lien vers la page de groupe `config/` et vers `Components/Configuration`).

## Intégration

- `src/app/shared/components/components-index.md` : passer la ligne du composant de ⬜ à ✅ (avec courte description des capacités).
- `storybook/docs/Overview.mdx` (doc globale) : importer la story en **relatif** (`../../src/app/shared/components/ui/{cat}/ui-{name}/ui-{name}.stories`) + ajouter une `ComponentCard` dans la `CategorySection` correspondante (créer la section si absente). Choisir une story représentative + fiable (éviter les stories `ngModel` qui s'affichent à l'état initial dans les docs-blocks).
- `CHANGELOG.md` : **toujours** ajouter une entrée pour un nouveau composant, dans la section `[Unreleased]` (sous `### Added` ; `### Changed` pour un ajustement de constante partagée / doc). Regrouper par composant, décrire les capacités clés.
- `storybook/docs/config/` : si une variable partagée a été ajoutée à `ui-config`, mettre à jour la page de groupe (`config-{catégorie}.mdx`) et le sommaire de `component-config.mdx` (voir « Variables partagées »).

## Vérification

1. `npx tsc --noEmit -p tsconfig.json` → doit passer.
2. Compiler le SCSS : `node_modules/.bin/sass --load-path=src/styles --no-source-map --quiet <fichier.scss>` et vérifier les sélecteurs/valeurs générés.
3. **Live Storybook** (déjà lancé sur `:6006`, HMR) : via les outils navigateur, ouvrir `iframe.html?id=components-ui-{cat}-ui-{name}--<story>&viewMode=story`, mesurer (getBoundingClientRect, getComputedStyle), tester l'interaction (click/clavier), et prendre une capture. Attendre le settle des transitions avant de mesurer.
4. Ne jamais demander à l'utilisateur de vérifier manuellement : fournir la preuve (mesures + capture).

## Divergences assumées (documenter dans la réponse)

- Booléens Figma `text`/`icon` → présence d'input (idiome Angular).
- États interactifs Figma → pseudo-classes CSS, pas des props / variants Angular.
- États dégénérés utiles non dessinés (ex. badge « dot » sans contenu) : implémentables si standards, à signaler.
- Écarts de métriques mineurs/incohérents dans le YAML → uniformiser proprement (ex. `min-width = height` pour un cercle) et le noter.
