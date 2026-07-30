# Angular Starter

Angular 22 starter (standalone, signals, zoneless) for building a **fully in-house** design system,
with no dependency on a proprietary UI library. **Headless** components (Angular CDK +
native signals) styled exclusively through **design tokens**.

This is the **Starter Angular** side of the *Dual-Engine* strategy:

- The **logic** depends on the stack: Angular CDK here (Radix UI on the React side).
- The layer shared across stacks = the **design tokens** (CSS variables).
- The **component styling is co-located** (Angular scoped `.scss`) and consumes these tokens.
---
## Stack

| Layer        | Tech |
|--------------|---|
| Framework    | Angular 22 standalone, signals, zoneless |
| Behavior     | Components + `@angular/cdk` |
| Style        | Co-located per component (scoped `.scss`) + CSS custom properties |
| Tokens       | JSON (Token Flow Manager) → `scripts/tokens.build.mjs` → SCSS (`src/styles/src/generated/`) |
| Storybook    | 10.x + addon-designs (Figma) |
| Grid         | Gridaflex |
| Icons        | FontAwesome Free |


---

## Getting started

```bash
npm install          # installs + generates the tokens (postinstall → tokens:build)
npm start            # Storybook   → http://localhost:6006
npm run storybook    # Storybook   → http://localhost:6006
npm run tokens:build # regenerates the token CSS variables
npm run build && npm run build-storybook
npm run lint
```

### Themes & modes (runtime, via attributes on `<html>`)

| Dimension | Attribute | Service |
|---|---|---|
| Brand | `[data-brand='brand2'\|'brand3']` (brand1 = default) | `BrandService` (maps the subdomain) |
| Light/Dark | `[data-theme='dark']` (light = default) | `ThemeService` |

The semantics reference the primitives (`var(--primitives-*)`): switching brand or mode
recomposes everything without duplication.

---

## Structure

```
src/
├── app/
│   ├── core/service/             ← ThemeService ([data-theme]), BrandService ([data-brand])
│   ├── core/controlValueAccessor/← BaseControlValueAccessor (forms)
│   ├── shared/
│   │   ├── components/ui/         ← ui-* components (ui-button, ui-icon…)
│   │   └── types/                ← shared types (UiLevel, UiSize…)
│   └── pages/                    ← demo (home, preview)
├── design-tokens/                ← token SOURCE (JSON, Token Flow Manager export)
└── styles/
    └── src/generated/            ← GENERATED CSS variables — do not edit
scripts/tokens.build.mjs          ← token resolver (DTCG → SCSS vars)
storybook/                        ← config + stories
```

> `src/styles/src/generated/` is **generated** (gitignored), rebuilt by `npm run tokens:build`.

### CSS variable naming

`--primitives-*` · `--metrics-*` · semantics without prefix (`--actions-high-surface-default`,
`--global-*`) · `--fontfamily-*` / `--weight-*` · `--transition-*`.

---

## CSS class conventions (no BEM)

| Element | Convention | SCSS |
|---|---|---|
| Root | `ui-{name}` | `.ui-{name}` |
| Sub-element | `ui-{name}-{part}` | `&-{part}` |
| Modifier | `_{modifier}` | `&._{modifier}` |

```scss
.ui-button {
  &-icon { … }     // .ui-button-icon
  &._small { … }   // modifier
  &._high { … }    // level modifier
  &:hover { … }    // states = pseudo-classes (never a modifier class)
}
```

---

## Adding a new component (recipe)

Replicate the `ui-button` (+ `ui-icon`) pattern. Example `ui-input`:

1. **Component** — `src/app/shared/components/ui/forms/ui-input/`
   - `ui-input.ts`: `input()` signals + `computed()` that assembles the class list.
   - `ui-input.html`: headless native HTML (+ CDK if overlay/a11y), accessible.
   - `ui-input.scss`: **co-located style**, classes `.ui-input` / `&-…` / `&._…`,
     values only via `var(--…)`.
2. **Story & doc (co-located)** — in the component folder, next to the `.ts/.html/.scss`:
   `src/app/shared/components/ui/forms/ui-input/ui-input.stories.ts` + `ui-input.mdx`.

Golden rules: **no** hardcoded values (everything via tokens) · **accessibility** (native element,
`aria-label`, `:focus-visible`, `disabled`).

---

## Storybook — file organization

Two locations, one simple rule:

- **Component → co-location.** Each component carries its `*.stories.ts` and
  `*.mdx` files **in its own folder**, next to the `.ts/.html/.scss`:
  `src/app/shared/components/ui/<category>/ui-x/ui-x.stories.ts` + `ui-x.mdx`.
- **Global documentation** (foundations, guidelines, design system, overview) → **`storybook/docs/`**
  (subfolders `foundations/`, `specifications/`). Never put component-specific doc there.

The `storybook/main.js` config targets both sources:

```js
stories: [
  './docs/**/*.mdx',                                 // global doc
  '../src/app/shared/components/**/*.mdx',           // co-located component doc
  '../src/app/shared/components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
]
```

> File **placement** does not affect the sidebar tree: it is driven by the
> `title` (`<Meta title="…">` or the story's `title:`). Co-located `.stories.ts` files are not
> compiled by `ng build` (`tsconfig.app.json` starts from `main.ts`).
