# AGENTS.md — Starter Angular Headless (Design System)

> Single entry point for any AI agent. Read this file first, then consult the indicated sources of truth. For the Figma side (component generation/audit), see `CLAUDE.md`.
>
> Release/versioning: `docs/VERSIONING.md` + `CHANGELOG.md`. Publishing the npm package: `docs/PUBLISHING.md`.

---

## Stack

| Technology | Role |
|---|---|
| Angular 22 | Framework — standalone, Signals API mandatory, zoneless |
| Headless components | No proprietary UI library; Angular CDK where needed (overlay, a11y, focus-trap) |
| Design Tokens JSON | `src/design-tokens/*.json` (DTCG) → Style Dictionary → generated CSS variables |
| Gridaflex 1.0.0 | Flexbox grid (24 col) + breakpoints, configured by the tokens |
| FontAwesome Free | Icons, via the `ui-icon` component |
| Storybook 10 | **Source of truth** — components, tokens, foundations |

Fonts embedded locally (DM Sans + Inter, variable fonts): `src/styles/src/vendors/_fonts.scss`.

---

## ⚠️ Absolute rule — Read before coding

**Storybook is the source of truth.** Never guess a component's API, its variants or its tokens.

| Question | Where to look |
|---|---|
| Existing components / roadmap | `src/app/shared/components/components-index.md` |
| A component's API (`inputs`, `outputs`, types) | `projects/ui-kit/<category>/ui-<name>/ui-<name>.stories.ts` → `argTypes` (co-located) |
| Colors, semantic tokens | Storybook → `Foundations / Colors` (brand + mode explorer) |
| Typography | Storybook → `Foundations / Typography` |
| Shadows & effects | Storybook → `Foundations / Shadows` |
| Tokens pipeline, theme, responsive | Storybook → `Spécifications / *` |
| Source Angular component | `projects/ui-kit/<category>/ui-<name>/src/lib/` |
| **Reference pattern** | `projects/ui-kit/actions/ui-button/` (+ `base/ui-icon`) |

---

## The `ui-*` kit lives in the `@4sh/ui-kit` package (FSHSP-83)

All 54 `ui-*` components live in `projects/ui-kit/` — an `ng-packagr` library
published as a **single** npm package with one *secondary entry point* per
component. `src/app/` now only holds the demo application and its `domain/`
components.

Components are grouped on disk by category (FSHSP-107 — mirrors the sections of
`storybook/docs/Overview.mdx`, the source of truth for the mapping):
`actions/`, `forms/`, `informative/`, `layout/`, `navigation/`, `table/`, `base/`.

⚠️ **The category IS part of the public import path**: `@4sh/ui-kit/actions/ui-button`,
not `@4sh/ui-kit/ui-button`. `ng-packagr` derives a secondary entry point's sub-path
from its folder location relative to the primary entry point
(`secondaryModuleId = primary.moduleId + '/' + relativeSourcePath`) and offers **no
way to decouple the two** — a `package.json` `name` in the component folder is ignored
for a secondary entry point. Moving a component between categories is therefore a
**breaking change** for consumers, never a cosmetic move.

Layout of a component:

```
projects/ui-kit/<category>/ui-<name>/
├── ng-package.json                 ← entry point config (styleIncludePaths → ../../styles)
├── src/public-api.ts               ← what the entry point exports
├── src/lib/ui-<name>.{ts,html,scss}   (+ sub-components, .types.ts, .model.ts…)
├── ui-<name>.stories.ts            ← OUTSIDE src/ (Storybook-only, never packaged)
└── ui-<name>.mdx
```

⚠️ **`styleIncludePaths` and `$schema` in `ng-package.json` are one level deeper**
than a flat layout would suggest (`../../styles`, `../../../../node_modules`) — the
category folder adds a level. Get this wrong and `ui-kit:build` fails to resolve
`utils.scss`/the JSON schema, not always loudly.

Cross-cutting entry points, at the root of `projects/ui-kit/` (not categorized —
they are not `ui-*` components): `forms` (field base classes + helpers — also
**doubles as the `forms/` category folder**, so it holds both its own
`forms/src/` and the 20 `forms/ui-<name>/` components; this is deliberate, not a
naming accident — see the ticket for why), `theming` (`ThemeService`,
`BrandService`), `motion` (`UiMotion`), `overlay` (`closeOnNavigation`), `types`.

Rules when working in `projects/ui-kit/`:

- **Imports between entry points MUST use the real package name, category included**
  (`@4sh/ui-kit/base/ui-icon`) — never a relative path to another entry point, never a
  shorthand. `ng-packagr` only records a dependency when the specifier literally
  starts with the package name; otherwise build order is undefined and the build
  fails intermittently. **Inside** one entry point, use relative imports
  (`./ui-toast.types`) — self-referencing the entry point is a circular dependency.
- Two entry points must never import each other. A sub-component that consumes its
  parent's model belongs in the parent's entry point (that's why
  `ui-file-upload-list` ships inside `ui-file-upload`).
- Stories/MDX stay **outside** `src/` so Storybook-only imports never leak into the
  packaged build. Their `ConfigTable` import is `../../../../storybook/blocks/config-table`
  (four levels — the category folder adds one, same trap as `ng-package.json` above).
- A component must not depend on app code. Project-specific data is injected:
  `provideUiKitBrand()` (active brand) and `provideUiImageAssets()` (local asset map
  for `ui-image`) — both wired in `src/app/app.config.ts` and `storybook/preview.ts`.
- The kit's SCSS foundation lives in `projects/ui-kit/styles/` (NOT `src/styles/`,
  which is app-only): a published package cannot depend on the host app. Tokens are
  generated there (`tokens.config.json`), and `npm run ui-kit:styles` compiles
  `index.scss` → `dist/ui-kit/styles.css`, shipped alongside the SCSS sources.
- **Never `@forward` anything that emits CSS from `utils.scss`.** Each component
  `.scss` is its own Sass compilation unit, so emitted rules get duplicated into all
  54 components. Global utility classes belong in `index.scss` (and, app-side, in
  `src/styles/main.scss`).
- `npm run ui-kit:build` runs before the app/Storybook (chained into `serve` /
  `build` / `storybook` / `build-storybook` / `postinstall`), since `@4sh/ui-kit/*`
  resolves to `dist/ui-kit/`.

---

## Architecture

```
projects/
  ui-kit/                    # @4sh/ui-kit — the published package (53 entry points, 54 components)
    <category>/              # actions/ forms/ informative/ layout/ navigation/ table/ base/
      <ui-name>/             # one secondary entry point per component
        ng-package.json · src/public-api.ts · src/lib/… · *.stories.ts · *.mdx
    forms/ theming/ motion/ overlay/ types/     # cross-cutting entry points (forms/ doubles as a category, see above)
    styles/                  # the kit's SCSS foundation — SHIPPED with the package
      utils.scss             #   API-only build surface (`@use 'utils'`); emits NO CSS
      utils/ settings/       #   functions, mixins, $ui-config constants
      base/ generated/       #   base layer + generated tokens
      index.scss             #   → compiled to dist/ui-kit/styles.css

src/
  app/
    app.config.ts            # provides the kit's app-level data (brand, ui-image assets)
    shared/
      components/
        components-index.md  # Index: components built ✅ / to build ⬜
        domain/              # Business components (project prefix) — created per project
  design-tokens/             # Token JSON sources (Figma / Token Flow export)
```

Each component's style is **co-located** in its `.scss` (Angular scoped) and consumes
**only** token CSS variables. The kit's SCSS foundation (tokens, `utils`, base layer)
lives in `projects/ui-kit/styles/` and ships with the package; `src/styles/` only
holds what is specific to the demo app (aggregator, fonts, grid settings, layout).

---

## Naming conventions

### UI components (generic)

| Element | Convention | Example |
|---|---|---|
| Angular selector | `ui-<name>` | `ui-button` |
| TypeScript class | `Ui<Name>` | `UiButton` |
| File | `ui-<name>.ts` (without `.component`) | `ui-button.ts` |
| Story & doc | co-located: `projects/ui-kit/<category>/ui-<name>/ui-<name>.stories.ts` + `ui-<name>.mdx` | `ui-button.stories.ts` |
| Import alias | Kit components: `@4sh/ui-kit/<category>/<entry>` · app code: `@app/` | `@4sh/ui-kit/actions/ui-button` |

### Business components (domain)

| Element | Convention | Example |
|---|---|---|
| Angular selector | `<prefix>-<name>` | `ds-button-critical` |
| TypeScript class | `<Prefix><Name>` | `DsButtonCritical` |
| File | `<prefix>-<name>.ts` | `ds-button-critical.ts` |

> ⚠️ The **prefix** is defined by the project (e.g. `ds`, `myapp`, `crm`). It is not fixed in
> the starter — ask the project before creating a business component. `domain/` components
> **instantiate** `ui/` components, they never copy their style.

---

## Non-negotiable code rules

### Angular Signals — always

```typescript
// ✅
label = input<string>();
name = input.required<string>();
level = input<'high' | 'low'>('high');
buttonClick = output<MouseEvent>();

// ❌ forbidden
@Input() label: string;
@Output() click = new EventEmitter();
```

### Templates — invoke the inputs

```html
<!-- ✅ -->
[label]="label()"   [disabled]="disabled()"

<!-- ❌ -->
[label]="label"
```

### CSS / SCSS — tokens & structure (no BEM)

- **Tokens only**: never hardcode a color/spacing/radius. Adapt to light/dark.
- **Naming**: root `.ui-<name>`; sub-element `&-<part>` (→ `.ui-button-icon`); modifier `&._<modifier>` (→ `._small`, `._high`).
- **Interactive states** (`hover`/`focus`/`active`/`disabled`): CSS pseudo-classes via the state tokens (e.g. `--actions-high-surface-hover`), **never** modifier classes or Angular props.
- **Declaration order**: Layout → Metrics → Colors → Style → Interaction.

```scss
/* ✅ */
.ui-button {
  display: flex;                                 /* Layout */
  padding: var(--units-sm);                      /* Metrics */
  color: var(--global-high-content-default);     /* Colors */
  cursor: pointer;                               /* Interaction */

  &-icon { … }        // → .ui-button-icon
  &._small { … }      // modifier

  &:hover { background: var(--actions-high-surface-hover); }
}

/* ❌ */
color: #333;
```

> Generated variable naming: `--primitives-*`, `--units-*` / `--radius-*` / `--stroke-*` /
> `--shadow-*` (metrics, **without the `metrics-` prefix**), semantics without prefix
> (`--actions-high-surface-default`), `--fontfamily-*`, `--transition-*`.

### SASS comments (to respect in AI generation)

Stay **restrained**: the code speaks for itself, only comment the **non-obvious** (recipe,
pitfall, extension point). No paraphrasing of what the next line does.

- **File header** — framed block, 1 title line + optionally 1 to 3 note lines:
  ```scss
  // =====================================================================
  // <name> : <one-line role>.
  //
  // <optional note, terse — mechanism / extension only>
  // =====================================================================
  ```
  Components: `<name> : co-located styles. All values come from design tokens.`
- **Inline** — to flag a non-obvious choice, at end of line (`// …`); never to describe the obvious.
- **Sections** — short separators `// --- <Title> ---` to break up a long file.
- **Mixins/functions** (partials in `projects/ui-kit/styles/utils/`) — 1 to 2 `///` lines: role + call example. No walls of text.
- **Language**: comments in **English**, including a component's config `///` comments (below) — the kit is published on the public npm registry (FSHSP-87).
- **Never reference Figma**: keep the intent ("enlarged for readability"), not the origin ("Figma 3px"). The `.scss` must read without the mockup.

#### A `///` on a config variable = the published doc

In a **component** `.scss`, a `///` on a declaration (`$var` or custom property) is the
**public contract**: `npm run docs:config` reads it and the doc's "Theming" section displays it.
`//` remains the internal note, invisible in the doc. (The `///` on mixins/functions in
`projects/ui-kit/styles/utils/` is never scanned: the generator only reads components.)

The `///` goes **at the end of the declaration**, vertically aligned with its visual group (blank
lines separate groups):

```scss
$card-padding: var(--units-lg);       /// Body inset.
$card-radius: var(--radius-md);       /// Corner radius.
```

- **Never a resolved value in a role** (`(12px)`): the doc measures it at runtime, in the active
  theme, brand and viewport — a hand-written value goes stale as soon as a project rebinds the
  variable.
- Describe the **role** only: the binding and the pass-through via `ui-config` are inferred.
- A **multi-line map** is the only exception: its `///` goes on the line above.
- A **custom property** is only public if it carries a `///`, placed where the hook lives
  (declaration, or a fallback read `var(--ui-x, <default>)`) — never on an internal dark-mode
  override, otherwise the doc shows the wrong default value.
- Every config variable must have its `///`: `npm run docs:config` counts the missing ones.
- **Written in English** — published documentation (FSHSP-87). Existing roles are still in
  French: translate the ones you touch, never add a new French one.

### Shared structural constants — `ui-config`

Structural values common to components (focus ring width, form control size,
transition recipe…) live in **`projects/ui-kit/styles/settings/_ui-config.scss`**
(exposed via `@use 'utils'`), in 3 levels: global UI → category (`$form-*` / `$action-*`) →
component.

```scss
// In a component: consume the category value via a LOCAL variable.
$focus-ring-width: utils.$form-focus-ring-width; // ← replace the value here to
                                                 //    adjust THIS component only
```

- Changing a value in `_ui-config.scss` = the whole kit follows at once.
- A new value shared by ≥ 2 components → promote it into `ui-config` (category level
  if specific to forms/actions, global otherwise). A single-component value stays local.
- State transitions: `@include utils.control-transition(background-color, border-color, …)`.
- `ui-config` carries **token choices** (structure); themeable colors remain runtime
  design tokens — never put a color in it.

### Theme, brand, modes (runtime)

| Dimension | Attribute on `<html>` | Service |
|---|---|---|
| Light / Dark | `[data-theme='dark']` (light = default) | `ThemeService` (`src/app/core/service/theme.service.ts`) |
| Brand | `[data-brand='brand2'\|'brand3']` (brand1 = default) | `BrandService` (derived from the subdomain) |
| Viewport | `@media (min-width: …)` | — (responsive tokens) |

> ❌ The `.light-mode` / `.dark-mode` classes no longer exist. See Storybook →
> `Spécifications / Thème & Système de Tokens` for the services API.

### Accessibility

- Native `<button>` / `<a>` — no clickable `<div>`; native `disabled`.
- `aria-label` mandatory for icon-only; decorative icons with `aria-hidden`.
- `:focus-visible` always visible and distinct from hover.
- **Naming**: an input that feeds a raw accessible name (bound to `[attr.aria-label]`)
  is named `*AriaLabel` (e.g. `clearAriaLabel`, `prevAriaLabel`). An input that holds a
  `{0}` template interpolated via the shared `formatLabel` helper
  (`forms/format-label.ts`) keeps a descriptive `*Label`/`*Message` name (e.g.
  `removeTagLabel`, `overflowLabel`) — it is not itself an aria value. Visible button
  text (e.g. `todayLabel`, `clearLabel` on `ui-datepicker`) is never renamed to
  `*AriaLabel` even if it happens to also be reused as the accessible name.
- Every `[attr.aria-label]`/`[attr.aria-labelledby]` binding guards against an empty
  string: `ariaLabel() || null` (never bind the signal raw), so an unset input omits
  the attribute instead of emitting `aria-label=""`.
- **No i18n catalog in the kit.** `*AriaLabel`/`*Label` inputs only carry an **English**
  default; translating them (and handling singular/plural, e.g. `filesSummaryLabel`
  rendering "1 files") is the consuming app's responsibility via its own i18n
  tooling — the design system does not ship a translation layer.
- Dev-mode "missing accessible name" warnings go through the shared
  `warnMissingAccessibleName` helper (`forms/warn-missing-accessible-name.ts`), not an
  ad hoc `console.warn` per component.

### Documentation (MDX)

- **Language — English is the source** (FSHSP-87). Everything published to a consumer is
  written in English: `.mdx` pages (component + global), `argTypes` descriptions in the
  stories, the `///` roles in the `.scss`, and `projects/ui-kit/README.md` (the npmjs page).
  Much of the existing content is still in French — translate what you touch, never add new
  French. No bilingual mechanism: a single English source is simpler to keep in sync than
  maintaining two languages, which was evaluated and dropped for that reason.
- Deliberately excluded: the `CHANGELOG.md` history, `docs/figma-migration-global.md`
  (internal runbook), and `projects/ui-kit/README.fr.md` — a French translation of the npmjs
  page predating this convention (FSHSP-92), left as is and not actively maintained.
- The kit's input defaults (`*AriaLabel`/`*Label`, see «&nbsp;No i18n catalog&nbsp;» below) are
  **public API of the package**, not documentation. They were switched to English (see the
  `CHANGELOG` `[Unreleased]` entry); changing one again is a consumer-facing change and needs
  its own `CHANGELOG` entry — not a doc task.
- **Tables**: always in HTML tags (`<table>`, `<tr>`, `<td>`) rather than native Markdown in `.mdx` files, to guarantee rendering and CSS control.
- **"Theming" section**: never written by hand. `<ConfigTable of="ui-<name>" />`
  (`storybook/blocks/config-table.js`), fed by `npm run docs:config` from the `.scss`'s `///`
  comments. It is **always the last section** of the page. Optional prose before the table
  for whatever it doesn't say (architecture, pointer to a shell like `ui-field`); no
  paragraph explaining how to read the table — that's in the block's tooltip. Several
  components on one page → one `label` per table.

---

## Workflows

### Modify an existing ui-* component

1. Read `projects/ui-kit/<category>/ui-<name>/ui-<name>.stories.ts` → identify `argTypes`
2. Read `projects/ui-kit/<category>/ui-<name>/src/lib/` → check types and structure
3. Modify `.ts`, `.html`, `.scss` (tokens only) — any added config variable carries its `///`
4. Update the story + the `.mdx` if the API changes; `npm run docs:config` if the SCSS config moved
5. Verify light + dark + the 3 brands (Storybook → `Foundations / Colors` for the tokens)

### Create a ui-* component (generic)

1. Check `components-index.md` (roadmap, planned name)
2. Replicate the **`actions/ui-button` pattern**: file structure, signals + `computed()` for the classes, co-located SCSS
3. Create the story + the `.mdx` **co-located** in `projects/ui-kit/<category>/ui-<name>/` (outside `src/`; global doc only → `storybook/docs/`) — pick `<category>` from `storybook/docs/Overview.mdx`'s sections, or ask if the component doesn't fit an existing one
4. Check off the component in `components-index.md`

### Create a business component (domain)

Like a `ui-*`, but: project prefix, `domain/` folder, and **composition of `ui-*` instances** (never style copying).

### Add / modify a token

1. Edit `src/design-tokens/*.json` (semantics reference primitives; never a primitive directly in a component)
2. `npm run tokens:build` (adding a collection/mode → edit `tokens.config.json`, not the script)
3. Verify in Storybook `Foundations / Colors`

---

## Versioning & releases

- SemVer adapted to a Design System + branch prefixes (`feat/`, `fix/`, `chore/`, `breaking/`) + release workflow → **`docs/VERSIONING.md`**
- Every user-visible change adds an entry to root **`CHANGELOG.md`** under `## [Unreleased]` (Keep a Changelog)
- Commit format (Conventional Commits) and git restrictions → `.claude/rules/git-conventions.md`; commit via the `/git-commit` skill

---

## Commands

```bash
npm start                # Launch Storybook (source of truth) — alias of npm run storybook
npm run serve            # Launch the Angular app (minimal demo)
npm run tokens:build     # Regenerate the CSS variables from the JSON
npm run build-storybook  # Static Storybook build
npm run lint             # ESLint --fix
```
