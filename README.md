# Angular Starter

Starter Angular 21 (standalone, signals) pour construire un design system **100% maison**,
sans dépendance à une librairie UI propriétaire. Composants **headless** (Angular CDK +
signals natifs) stylés exclusivement via des **design tokens**.

C'est le volet **Starter Angular** de la stratégie *Double-Moteur* :

- La **logique** dépend de la stack : Angular CDK ici (Radix UI côté React).
- La couche partagée entre stacks = les **design tokens** (variables CSS).
- Le **style des composants est co-localisé** (`.scss` scopé Angular) et consomme ces tokens.
---
## Stack

| Couche       | Techno |
|--------------|---|
| Framework    | Angular 21 standalone, signals |
| Comportement | Composants maison + `@angular/cdk` |
| Style        | Co-localisé par composant (`.scss` scopé) + CSS custom properties |
| Tokens       | JSON (Token Flow Manager) → `scripts/tokens.build.mjs` → SCSS (`src/styles/src/generated/`) |
| Storybook    | 10.x + addon-designs (Figma) |
| Grid         | Gridaflex |
| Icons        | FontAwesome Free |


---

## Démarrage

```bash
npm install          # installe + génère les tokens (postinstall → tokens:build)
npm start            # app de démo   → http://localhost:4200
npm run storybook    # Storybook     → http://localhost:6006
npm run tokens:build # régénère les variables CSS de tokens
npm run build && npm run build-storybook
npm run lint
```

### Thèmes & modes (runtime, via attributs sur `<html>`)

| Dimension | Attribut | Service |
|---|---|---|
| Marque | `[data-brand='brand2'\|'brand3']` (brand1 = défaut) | `BrandService` (mappe le sous-domaine) |
| Clair/Sombre | `[data-theme='dark']` (light = défaut) | `ThemeService` |

Les semantics référencent les primitives (`var(--primitives-*)`) : changer marque ou mode
recompose tout sans duplication.

---

## Structure

```
src/
├── app/
│   ├── core/service/             ← ThemeService ([data-theme]), BrandService ([data-brand])
│   ├── core/controlValueAccessor/← BaseControlValueAccessor (formulaires)
│   ├── shared/
│   │   ├── components/ui/         ← composants maison ui-* (ui-button, ui-icon…)
│   │   └── types/                ← types partagés (UiLevel, UiSize…)
│   └── pages/                    ← démo (home, preview)
├── design-tokens/                ← SOURCE des tokens (JSON, export Token Flow Manager)
└── styles/
    └── src/generated/            ← variables CSS GÉNÉRÉES — ne pas éditer
scripts/tokens.build.mjs          ← resolver tokens (DTCG → SCSS vars)
storybook/                        ← config + stories
```

> `src/styles/src/generated/` est **généré** (gitignoré), reconstruit par `npm run tokens:build`.

### Nommage des variables CSS

`--primitives-*` · `--metrics-*` · semantics sans préfixe (`--actions-high-surface-default`,
`--global-*`) · `--fontfamily-*` / `--weight-*` · `--transition-*`.

---

## Conventions de classes CSS (pas de BEM)

| Élément | Convention | SCSS |
|---|---|---|
| Racine | `ui-{name}` | `.ui-{name}` |
| Sous-élément | `ui-{name}-{part}` | `&-{part}` |
| Modifier | `_{modifier}` | `&._{modifier}` |

```scss
.ui-button {
  &-icon { … }     // .ui-button-icon
  &._small { … }   // modifier
  &._high { … }    // modifier de niveau
  &:hover { … }    // états = pseudo-classes (jamais une classe modifier)
}
```

---

## Ajouter un nouveau composant (recette)

On reproduit le patron `ui-button` (+ `ui-icon`). Exemple `ui-input` :

1. **Composant** — `src/app/shared/components/ui/forms/ui-input/`
   - `ui-input.ts` : `input()` signals + `computed()` qui assemble la liste de classes.
   - `ui-input.html` : HTML natif headless (+ CDK si overlay/a11y), accessible.
   - `ui-input.scss` : **style co-localisé**, classes `.ui-input` / `&-…` / `&._…`,
     valeurs uniquement via `var(--…)`.
2. **Story & doc (co-localisées)** — dans le dossier du composant, à côté des `.ts/.html/.scss` :
   `src/app/shared/components/ui/forms/ui-input/ui-input.stories.ts` + `ui-input.mdx`.

Règles d'or : **aucune** valeur en dur (tout via token) · **accessibilité** (élément natif,
`aria-label`, `:focus-visible`, `disabled`).

---

## Storybook — organisation des fichiers

Deux emplacements, une règle simple :

- **Composant → co-localisation.** Chaque composant embarque ses fichiers `*.stories.ts` et
  `*.mdx` **dans son propre dossier**, à côté des `.ts/.html/.scss` :
  `src/app/shared/components/ui/<catégorie>/ui-x/ui-x.stories.ts` + `ui-x.mdx`.
- **Documentation globale** (fondations, guidelines, design system, overview) → **`storybook/docs/`**
  (sous-dossiers `foundations/`, `specifications/`). N'y jamais mettre de doc liée à un composant précis.

La config `storybook/main.js` cible les deux sources :

```js
stories: [
  './docs/**/*.mdx',                                 // doc globale
  '../src/app/shared/components/**/*.mdx',           // doc composant co-localisée
  '../src/app/shared/components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
]
```

> Le **placement** des fichiers n'affecte pas l'arborescence du sidebar : elle est pilotée par le
> `title` (`<Meta title="…">` ou `title:` de la story). Les `.stories.ts` co-localisés ne sont pas
> compilés par `ng build` (`tsconfig.app.json` part de `main.ts`).
