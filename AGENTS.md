# AGENTS.md — Starter Angular Headless (Design System)

> Single entry point for any AI agent. Read this file first, then consult the indicated sources of truth. For the Figma side (component generation/audit), see `CLAUDE.md`.
>
> Release/versioning: `docs/VERSIONING.md` + `CHANGELOG.md`. Publishing the npm package: `docs/PUBLISHING.md`.
>
> Security rules (Angular bypass APIs are **banned by default**) and the register of
> authorised exceptions: `docs/SECURITY-PRACTICES.md`.

---

## Stack

| Technology          | Role                                                                            |
| ------------------- | ------------------------------------------------------------------------------- |
| Angular 22          | Framework — standalone, Signals API mandatory, zoneless                         |
| Headless components | No proprietary UI library; Angular CDK where needed (overlay, a11y, focus-trap) |
| Design Tokens JSON  | `src/design-tokens/*.json` (DTCG) → Style Dictionary → generated CSS variables  |
| Gridaflex 1.0.0     | Flexbox grid (24 col) + breakpoints, configured by the tokens                   |
| FontAwesome Free    | Icons, via the `ui-icon` component                                              |
| Storybook 10        | **Source of truth** — components, tokens, foundations                           |

Fonts embedded locally (DM Sans + Inter, variable fonts): `src/styles/src/vendors/_fonts.scss`.

---

## ⚠️ Absolute rule — Read before coding

**Storybook is the source of truth.** Never guess a component's API, its variants or its tokens.

| Question                                       | Where to look                                                                         |
| ---------------------------------------------- | ------------------------------------------------------------------------------------- |
| Existing components / roadmap                  | `docs/components-index.md`                                                            |
| A component's API (`inputs`, `outputs`, types) | `projects/ui-kit/<category>/ui-<name>/ui-<name>.stories.ts` → `argTypes` (co-located) |
| Colors, semantic tokens                        | Storybook → `Foundations / Colors` (brand + mode explorer)                            |
| Typography                                     | Storybook → `Foundations / Typography`                                                |
| Shadows & effects                              | Storybook → `Foundations / Shadows`                                                   |
| Tokens pipeline, theme, responsive             | Storybook → `Spécifications / *`                                                      |
| Source Angular component                       | `projects/ui-kit/<category>/ui-<name>/src/lib/`                                       |
| **Reference pattern**                          | `projects/ui-kit/actions/ui-button/` (+ `base/ui-icon`)                               |

---

## The `ui-*` kit lives in the `@4sh/ui-kit` package (FSHSP-83)

All 54 `ui-*` components live in `projects/ui-kit/` — an `ng-packagr` library
published as a **single** npm package with one _secondary entry point_ per
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
  generated there (`tokens.config.json`), and `pnpm ui-kit:styles` compiles
  `index.scss` → `dist/ui-kit/styles.css`, shipped alongside the SCSS sources.
- **Never `@forward` anything that emits CSS from `utils.scss`.** Each component
  `.scss` is its own Sass compilation unit, so emitted rules get duplicated into all
  54 components. Global utility classes belong in `index.scss` (and, app-side, in
  `src/styles/main.scss`).
- `pnpm ui-kit:build` runs before the app/Storybook (chained into `serve` /
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
        domain/              # Business components (project prefix) — created per project
  design-tokens/             # Token JSON sources (Figma / Token Flow export)

docs/
  components-index.md        # Index: components built ✅ / to build ⬜
  VERSIONING.md · PUBLISHING.md · figma-migration-global.md
```

Each component's style is **co-located** in its `.scss` (Angular scoped) and consumes
**only** token CSS variables. The kit's SCSS foundation (tokens, `utils`, base layer)
lives in `projects/ui-kit/styles/` and ships with the package; `src/styles/` only
holds what is specific to the demo app (aggregator, fonts, grid settings, layout).

---

## Naming conventions

### UI components (generic)

| Element          | Convention                                                                                | Example                         |
| ---------------- | ----------------------------------------------------------------------------------------- | ------------------------------- |
| Angular selector | `ui-<name>`                                                                               | `ui-button`                     |
| TypeScript class | `Ui<Name>`                                                                                | `UiButton`                      |
| File             | `ui-<name>.ts` (without `.component`)                                                     | `ui-button.ts`                  |
| Story & doc      | co-located: `projects/ui-kit/<category>/ui-<name>/ui-<name>.stories.ts` + `ui-<name>.mdx` | `ui-button.stories.ts`          |
| Import alias     | Kit components: `@4sh/ui-kit/<category>/<entry>` · app code: `@app/`                      | `@4sh/ui-kit/actions/ui-button` |

### Business components (domain)

| Element          | Convention           | Example                 |
| ---------------- | -------------------- | ----------------------- |
| Angular selector | `<prefix>-<name>`    | `ds-button-critical`    |
| TypeScript class | `<Prefix><Name>`     | `DsButtonCritical`      |
| File             | `<prefix>-<name>.ts` | `ds-button-critical.ts` |

> ⚠️ The **prefix** is defined by the project (e.g. `ds`, `myapp`, `crm`). It is not fixed in
> the starter — ask the project before creating a business component. `domain/` components
> **instantiate** `ui/` components, they never copy their style.

---

## Non-negotiable code rules

### Never bypass Angular's protections

`DomSanitizer.bypassSecurityTrust…()`, a direct `innerHTML` / `outerHTML` write,
`insertAdjacentHTML()`, `eval()`, `new Function()` — **banned by default**, and
enforced by `no-restricted-syntax` in `eslint.config.js` (TypeScript **and** HTML
templates), which is blocking in CI.

```typescript
// ✅ Angular sanitises it
this.sanitizer.sanitize(SecurityContext.HTML, value);

// ❌ marks the value safe WITHOUT checking it
this.sanitizer.bypassSecurityTrustHtml(value);
```

Angular only sanitises what goes through a **template binding**. `el.innerHTML = x`
is not sanitised by anything.

An exception is raised in three steps, never fewer: **scrub the value in code you
can test**, justify it on the spot (`/* eslint-disable-next-line no-restricted-syntax
-- EXCEPTION JUSTIFIÉE: … */`), and add it to the register in
`docs/SECURITY-PRACTICES.md`. The kit holds **one** bypass in total (`ui-image`, for
inline SVG) — read §3 of that doc before adding a second one.

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
[label]="label()" [disabled]="disabled()"

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

### Layout: the Gridaflex grid (optional package)

Gridaflex is **offered, not imposed**: `ng add` asks for it, and a consumer project may
have declined it. Never assume the classes exist outside this repo.

- **A component never sits between the group and its cells.** Angular renders the host
  element (`<ui-card>`, `<sp-block>`) as a real DOM node, so `.flex-x > ui-card > .cell`
  makes the cells grandchildren: they stop being flex items, the `> .cell` rules
  (`flex-padding-*`, `[bp]-up-[n]`, `[bp]-padding-collapse`) no longer match, and the
  width percentages resolve against the host box. `display: contents` does not fix it.
- **Group and cells are native elements of the same template.** To lay out components,
  put each one _inside_ a `.cell`, never _as_ a cell.
- Need the grid inside a component? Pass the classes through its class inputs
  (`ui-card` `contentClass`, `ui-read-only` `rowClass`/`labelClass`/`valueClass`), or, when
  writing the component, put the group on the element that directly wraps `<ng-content />`.

Full rules and examples: `storybook/docs/specifications/responsive.mdx` (section 3).

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
- **Language**: comments in **English**… **except** a component's config `///` comments (below), which are published in the docs and therefore in French.
- **Never reference Figma**: keep the intent ("enlarged for readability"), not the origin ("Figma 3px"). The `.scss` must read without the mockup.

#### A `///` on a config variable = the published doc

In a **component** `.scss`, a `///` on a declaration (`$var` or custom property) is the
**public contract**: `pnpm docs:config` reads it and the doc's "Theming" section displays it.
`//` remains the internal note, invisible in the doc. (The `///` on mixins/functions in
`projects/ui-kit/styles/utils/` is never scanned: the generator only reads components.)

The `///` goes **at the end of the declaration**, vertically aligned with its visual group (blank
lines separate groups):

```scss
$card-padding: var(--units-lg); /// Inset du corps.
$card-radius: var(--radius-md); /// Rayon des coins.
```

- **Never a resolved value in a role** (`(12px)`): the doc measures it at runtime, in the active
  theme, brand and viewport — a hand-written value goes stale as soon as a project rebinds the
  variable.
- Describe the **role** only: the binding and the pass-through via `ui-config` are inferred.
- A **multi-line map** is the only exception: its `///` goes on the line above.
- A **custom property** is only public if it carries a `///`, placed where the hook lives
  (declaration, or a fallback read `var(--ui-x, <default>)`) — never on an internal dark-mode
  override, otherwise the doc shows the wrong default value.
- Every config variable must have its `///`: `pnpm docs:config` counts the missing ones.

#### Every structural value is read through a `--ui-*` hook

In **package mode** the kit's SCSS is already compiled, so `_ui-config.scss` and a component's
local variables are out of reach. Each structural value is therefore read _through_ a custom
property whose fallback is the shipped default — the hook goes on the **config variable**, never
on the usage sites:

```scss
// --- Config ---
$radius: var(--ui-button-radius, var(--radius-sm)); /// Rayon des coins.
$stroke-width: var(
  --ui-button-stroke-width,
  #{utils.$control-stroke-width}
); /// Épaisseur de la bordure.

.ui-button {
  border-radius: $radius;
  border: $stroke-width solid transparent;
}
```

- **Naming**: `--ui-{family}[-{part}]-{property}[-{modifier}]`, modifier **last** (same rule as
  the tokens: `actions-high-surface-hover`). `{family}` is the entry-point folder minus `ui-`, so
  a sub-component uses its family (`ui-tab-list.scss` → `--ui-tabs-*`). The property vocabulary
  and the modifier list live in `scripts/component-vars.build.mjs`; `pnpm docs:config` **fails**
  on a hook that doesn't parse, so extend the vocabulary there rather than inventing a name.
- **Inside a map**, every value carries its own hook (`height: var(--ui-button-height-small, …)`).
- **What gets one**: dimensions, spacings, gaps, radii, stroke/focus-ring widths, font sizes,
  durations, offsets, z-index — anything structural, including raw `px`/`rem` literals.
- **What doesn't**: SCSS lists/maps that generate classes (`$levels`, `$variants` — build-time,
  no custom property can carry them), and **colours**, which stay on the semantic tokens (theme ×
  3 brands × WCAG). Exception: a colour whose per-instance repaint is a real use case (mask
  backdrop, loading marker, skeleton shine, rating fill).
- **A component must never declare a name it also exposes**: a custom property cannot reference
  itself, and a declaration on the element beats an inherited override. When a value must live on
  a variable (read by a sub-component, re-read by the consumer), declare a **private mirror** and
  read the public hook in its fallback:
  ```scss
  :host {
    --_width: var(--ui-sidebar-width, #{$width-default});
  } /// Largeur du panneau déployé.
  ```
  The `///` stays on the mirror: that is what publishes the public hook's role.
- Never a value hardcoded inline in a rule when it is structural: promote it to a config variable
  with its hook and its `///`.
- `pnpm docs:config` regenerates `projects/ui-kit/styles/component-vars.scss` (the consumer's copy-me
  theme) and `figma/component-vars.json` from these hooks. Both are committed;
  `docs:config:check` fails when they are stale, when a hook doesn't parse, or when a hook has
  no `///`. Values in both files are read from the **compiled CSS**, not from the SCSS text — so
  `rem-calc(44px - 2 * $gutter)` lands as `2.25rem`, not as an unevaluated expression.
- A hook whose default **differs per variant** (`--ui-button-radius` is `--radius-sm`, or
  `--radius-full` when `_rounded`) is excluded from the theme file: declaring one value there
  would flatten the others. So is a hook the component declares itself. The generator classifies
  this on its own — nothing to annotate.
- **`_ui-config.scss` carries hooks too**, named `--ui-<scss name>` (`$form-control-size` →
  `--ui-form-control-size`). They sit between the token and the component hook, and reach every
  consumer for free since components _interpolate_ them:
  `var(--ui-checkbox-box-size, var(--ui-form-control-size, var(--size-components-2xs)))`. Use
  this layer when a value is shared by a category and the token it points at is used elsewhere
  too (`--size-components-2xs` also feeds `ui-tag`, so retuning the token would overshoot).
  ⚠️ A constant that **references another constant** (`$form-focus-ring-width: $focus-ring-width`)
  takes **no hook of its own**: it inherits the referenced one, and hooking both makes
  `docs.config.mjs`'s binding resolver recurse forever.

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

| Dimension    | Attribute on `<html>`                                | Service                                                  |
| ------------ | ---------------------------------------------------- | -------------------------------------------------------- |
| Light / Dark | `[data-theme='dark']` (light = default)              | `ThemeService` (`src/app/core/service/theme.service.ts`) |
| Brand        | `[data-brand='brand2'\|'brand3']` (brand1 = default) | `BrandService` (derived from the subdomain)              |
| Viewport     | `@media (min-width: …)`                              | — (responsive tokens)                                    |

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
- **No i18n catalog in the kit.** `*AriaLabel`/`*Label` inputs only carry a French
  default; translating them (and handling singular/plural, e.g. `filesSummaryLabel`
  rendering "1 fichiers") is the consuming app's responsibility via its own i18n
  tooling — the design system does not ship a translation layer.
- Dev-mode "missing accessible name" warnings go through the shared
  `warnMissingAccessibleName` helper (`forms/warn-missing-accessible-name.ts`), not an
  ad hoc `console.warn` per component.

### Documentation (MDX)

- **Tables**: always in HTML tags (`<table>`, `<tr>`, `<td>`) rather than native Markdown in `.mdx` files, to guarantee rendering and CSS control.
- **"Theming" section**: never written by hand. `<ConfigTable of="ui-<name>" />`
  (`storybook/blocks/config-table.js`), fed by `pnpm docs:config` from the `.scss`'s `///`
  comments. It is **always the last section** of the page. Optional prose before the table
  for whatever it doesn't say (architecture, pointer to a shell like `ui-field`); no
  paragraph explaining how to read the table — that's in the block's tooltip. Several
  components on one page → one `label` per table.
- **Anchor sidebar **: built automatically from the page's `##`/`###`
  headings (`parameters.docs.toc` in `storybook/preview.ts`, `tocbot` shipped with
  `@storybook/addon-docs` — no third-party addon). Only **markdown** headings are listed:
  the selector is `h2[id], h3[id]`, and a raw `<h2>`/`<h3>` written inside JSX (the cards
  of `Introduction.mdx` / `Overview.mdx`) carries no `id`, so it stays out — deliberately,
  since `tocbot` would otherwise emit a dead link. A section that must be reachable from
  the sidebar is therefore a markdown `##`, not a styled `<h2>`. To drop the sidebar on one
  page: `docs: { toc: { disable: true } }` in its meta's `parameters`.

---

## Workflows

### Modify an existing ui-* component

1. Read `projects/ui-kit/<category>/ui-<name>/ui-<name>.stories.ts` → identify `argTypes`
2. Read `projects/ui-kit/<category>/ui-<name>/src/lib/` → check types and structure
3. Modify `.ts`, `.html`, `.scss` (tokens only) — any added config variable carries its `///`
4. Update the story + the `.mdx` if the API changes; `pnpm docs:config` if the SCSS config moved
5. Verify light + dark + the 3 brands (Storybook → `Foundations / Colors` for the tokens)

### Create a ui-* component (generic)

1. Check `components-index.md` (roadmap, planned name)
2. Replicate the **`actions/ui-button` pattern**: file structure, signals + `computed()` for the classes, co-located SCSS
3. Create the story + the `.mdx` **co-located** in `projects/ui-kit/<category>/ui-<name>/` (outside `src/`; global doc only → `storybook/docs/`) — pick `<category>` from `storybook/docs/Overview.mdx`'s sections, or ask if the component doesn't fit an existing one
4. Check off the component in `components-index.md`, add its card to `Overview.mdx`, add it
   to the family table of **both** package READMEs (EN + FR)
5. `pnpm docs:config:check` — it is what tells you which of those you forgot

> File **placement** does not drive the Storybook sidebar tree — the `title` does
> (`<Meta title="…">`, or the story's `title:`). Placement only decides what ships: a
> co-located `.stories.ts`/`.mdx` sits outside the entry point's `src/`, which is where
> `ng-packagr` starts from, so it never reaches `@4sh/ui-kit`. It does travel in
> `@4sh/ui-kit-schematics` (FSHSP-125), which copies it next to the component so a
> starter project documents its own copies.

### Create a business component (domain)

Like a `ui-*`, but: project prefix, `domain/` folder, and **composition of `ui-*` instances** (never style copying).

### Add / modify a token

1. Edit `src/design-tokens/*.json` (semantics reference primitives; never a primitive directly in a component)
2. `pnpm tokens:build` (adding a collection/mode → edit `tokens.config.json`, not the script)
3. Verify in Storybook `Foundations / Colors`

---

## Versioning & releases

- SemVer adapted to a Design System + branch prefixes (`feat/`, `fix/`, `chore/`, `breaking/`) + release workflow → **`docs/VERSIONING.md`**
- Every user-visible change adds an entry to root **`CHANGELOG.md`** under `## [Unreleased]` (Keep a Changelog)
- Commit format (Conventional Commits) and git restrictions → `.claude/rules/git-conventions.md`; commit via the `/git-commit` skill

---

## Commands

```bash
pnpm start              # Launch Storybook (source of truth) — alias of pnpm storybook
pnpm serve              # Launch the Angular app (minimal demo)
pnpm tokens:build       # Regenerate the CSS variables from the JSON
pnpm docs:search        # Rebuild the doc full-text search index
pnpm build-storybook    # Static Storybook build
pnpm lint               # ESLint --fix
pnpm test               # Unit tests on the kit
pnpm docs:config:check  # Guardrail on the hand-written doc — see below
```

`docs:config:check` is what catches a doc that has drifted from the code, and **you are
expected to run it before committing**. It fails on:

- a component present in `projects/ui-kit/` but missing from one of the six places that
  enumerate the kit (the two package READMEs, `Overview.mdx`, `docs/components-index.md`,
  and the two announced counts) — this is the rule you break by finishing a component
  without updating its lists;
- a `--ui-*` hook off convention, or without a `///` (public, yet invisible in the doc);
- an alias pointing at a token that does not exist in `src/design-tokens/`;
- the counts quoted in prose in `figma/README.md`.

Committed alongside it, `git diff --exit-code -- projects/ui-kit/styles/component-vars.scss
figma/component-vars.json`: those two files are **generated yet committed**, and every
build regenerates them on disk — so only git notices a stale commit. Both run in
[`pr-checks.yml`](.github/workflows/pr-checks.yml).

> `docs:search` (`scripts/docs.search.mjs`) indexes every `.mdx` **section** into
> `storybook/public/text-search-docs.json` — read by the local addon
> `storybook/addons/text-search/`, the search field in the manager toolbar. It is
> chained into `storybook` / `build-storybook`, and the addon rebuilds it on
> startup and on every `.mdx` change, so it rarely needs running by hand.
> A page whose title cannot be resolved (no `<Meta title>` and no resolvable
> `<Meta of>`) **fails the build** rather than dropping out of the index.
