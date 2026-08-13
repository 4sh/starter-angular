# Angular Starter

Angular 22 starter (standalone, signals, zoneless) for building a **fully in-house** design system,
with no dependency on a proprietary UI library. **Headless** components (Angular CDK +
native signals) styled exclusively through **design tokens**.

This is the **Starter Angular** side of the *Dual-Engine* strategy:

- The **logic** depends on the stack: Angular CDK here (Radix UI on the React side).
- The layer shared across stacks = the **design tokens** (CSS variables).
- The **component styling is co-located** (Angular scoped `.scss`) and consumes these tokens.

The `ui-*` kit is published as the **[`@4sh/ui-kit`](https://www.npmjs.com/package/@4sh/ui-kit)**
npm package (one secondary entry point per component) — see
[`projects/ui-kit/README.md`](projects/ui-kit/README.md). This repo holds both the
package and the demo application that consumes it.

**Storybook** (published catalogue):
<https://4sh.github.io/starter-angular/?path=/docs/introduction--docs>

---
## Stack

| Layer        | Tech |
|--------------|---|
| Framework    | Angular 22 standalone, signals, zoneless |
| Behavior     | Components + `@angular/cdk` |
| Style        | Co-located per component (scoped `.scss`) + CSS custom properties |
| Tokens       | JSON (Token Flow Manager) → `scripts/tokens.build.mjs` → SCSS (`projects/ui-kit/styles/generated/`) |
| Storybook    | 10.x + addon-designs (Figma) |
| Grid         | Gridaflex |
| Icons        | FontAwesome Free |


---

## Getting started

```bash
npm install            # install + postinstall: tokens:build, ui-kit:build, docs:config
npm start              # Storybook          → http://localhost:6006
npm run serve          # demo application   → http://localhost:4200
npm run tokens:build   # regenerate the token CSS variables
npm run ui-kit:build   # build the @4sh/ui-kit package into dist/ui-kit
npm run docs:config    # regenerate the Theming tables of the Storybook docs
npm run build && npm run build-storybook
npm run lint
```

> `npm start`, `npm run serve` and the two builds all run `ui-kit:build` first: the
> demo app consumes the kit through its **built** output (`dist/ui-kit`, mapped by the
> `@4sh/ui-kit/*` `paths` of `tsconfig.json`), exactly like an external consumer would.

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
projects/ui-kit/                  ← the @4sh/ui-kit PACKAGE (published)
├── ui-button/ … ui-tooltip/      ← 53 entry points / 54 ui-* components
│   ├── src/lib/ui-x.{ts,html,scss}          ← the component, co-located
│   └── ui-x.{stories.ts,mdx}                ← its doc, outside src/ (not packaged)
├── forms/                        ← BaseControlValueAccessor, BaseFieldControl, BaseFormField…
├── theming/                      ← ThemeService ([data-theme]), BrandService ([data-brand])
├── motion/  overlay/  types/     ← UiMotion · closeOnNavigation · UiLevel, UiSize…
└── styles/                       ← SCSS foundation shipped with the package
    ├── generated/                ← GENERATED CSS variables — do not edit
    ├── base/  settings/  utils/  ← base layer, settings, utils API (no CSS emitted)
    └── index.scss                ← compiled to dist/ui-kit/styles.css

src/                              ← DEMO application only
├── app/shared/components/domain/ ← business components (project prefix), compose ui-*
├── design-tokens/                ← token SOURCE (JSON, Token Flow Manager export)
└── styles/                       ← app-side global styles (Gridaflex, layout, vendors)

scripts/tokens.build.mjs          ← token resolver (DTCG → SCSS vars)
scripts/docs.config.mjs           ← SCSS roles → storybook/generated/ui-config.json
storybook/                        ← config + global documentation
docs/                             ← VERSIONING.md · PUBLISHING.md · Figma runbooks
```

> `projects/ui-kit/styles/generated/` is **generated** (gitignored), rebuilt by
> `npm run tokens:build`. Same for `storybook/generated/` (`npm run docs:config`).

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

Replicate the `actions/ui-button` (+ `base/ui-icon`) reference pattern. One folder
per component under `projects/ui-kit/<category>/` (grouped by category — see
`storybook/docs/Overview.mdx` for the mapping), which **is** the secondary entry
point — example for `@4sh/ui-kit/ui-input` (category `forms`):

```
projects/ui-kit/forms/ui-input/
├── ng-package.json        ← declares the entry point (entryFile + styleIncludePaths)
├── src/
│   ├── public-api.ts      ← what the entry point exports
│   └── lib/ui-input.{ts,html,scss}
├── ui-input.stories.ts    ← OUTSIDE src/: Storybook only, never packaged
└── ui-input.mdx
```

1. **Component** — in `src/lib/`:
   - `ui-input.ts`: `input()` signals + `computed()` that assembles the class list.
   - `ui-input.html`: headless native HTML (+ CDK if overlay/a11y), accessible.
   - `ui-input.scss`: **co-located style**, classes `.ui-input` / `&-…` / `&._…`,
     values only via `var(--…)`. Document the public roles with `///` comments —
     they feed the `## Theming` section of the MDX (see below).
2. **Entry point** — copy the `ng-package.json` of a neighbouring component and export
   the class from `src/public-api.ts`.
3. **Story & doc** — `ui-input.stories.ts` + `ui-input.mdx` at the folder root.

⚠️ Importing from **another entry point** must use the real package name
(`@4sh/ui-kit/ui-icon`), never a relative path: `ng-packagr` only records the
dependency in that form — otherwise the build order is undefined and fails
intermittently.

Golden rules: **no** hardcoded values (everything via tokens) · **accessibility** (native element,
`aria-label`, `:focus-visible`, `disabled`).

---

## Storybook — file organization

Three locations, one simple rule:

- **Component → co-location.** Each component carries its `*.stories.ts` and `*.mdx`
  files **in its own folder**, at the entry point root (outside `src/`, so they never
  ship in the package): `projects/ui-kit/<category>/ui-x/ui-x.stories.ts` + `ui-x.mdx`.
- **Global documentation** (foundations, guidelines, design system, overview) → **`storybook/docs/`**
  (subfolders `foundations/`, `specifications/`). Never put component-specific doc there.

The `storybook/main.js` config targets all three sources:

```js
stories: [
  './docs/**/*.mdx',                                 // global doc
  '../projects/ui-kit/**/*.mdx',                     // co-located kit doc
  '../projects/ui-kit/**/*.stories.@(js|jsx|mjs|ts|tsx)',
  '../src/app/shared/components/**/*.mdx',           // app-side domain/ components
  '../src/app/shared/components/**/*.stories.@(js|jsx|mjs|ts|tsx)',
]
```

> File **placement** does not affect the sidebar tree: it is driven by the
> `title` (`<Meta title="…">` or the story's `title:`). Co-located `.stories.ts` files
> never reach the published package: they sit outside the entry point's `src/`, which
> is where `ng-packagr` starts from.

### The `## Theming` section is generated, never written by hand

`npm run docs:config` (`scripts/docs.config.mjs`) reads the `///` comments of each
component `.scss` and produces `storybook/generated/ui-config.json`, rendered by
`<ConfigTable of="ui-x" />`. So a role is documented **where it is declared**:

```scss
$card-padding: var(--units-lg);       /// Inset du corps.
$card-radius: var(--radius-md);       /// Rayon des coins.
```

Never write a resolved value (`(12px)`) in a role: the doc measures it at runtime, in
the active theme, brand and viewport. `npm run docs:config:check` fails if the manifest
is stale — it runs on `postinstall` and before `storybook` / `build-storybook`.

---

## Going further

| Topic | Where |
|---|---|
| Consuming the package | [`projects/ui-kit/README.md`](projects/ui-kit/README.md) ([FR](projects/ui-kit/README.fr.md)) |
| Versioning & releases | [`docs/VERSIONING.md`](docs/VERSIONING.md) · [`CHANGELOG.md`](CHANGELOG.md) |
| Publishing to npm | [`docs/PUBLISHING.md`](docs/PUBLISHING.md) |
| Conventions for AI agents | [`AGENTS.md`](AGENTS.md) · [`CLAUDE.md`](CLAUDE.md) |
| Figma ↔ code workflow | [`CLAUDE.md`](CLAUDE.md) · [`docs/figma-migration-global.md`](docs/figma-migration-global.md) |
