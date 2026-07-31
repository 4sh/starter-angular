# AGENTS.md — Starter Angular Headless (Design System)

> Single entry point for any AI agent. Read this file first, then consult the indicated sources of truth. For the Figma side (component generation/audit), see `CLAUDE.md`.

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
| A component's API (`inputs`, `outputs`, types) | `src/app/shared/components/ui/**/ui-<name>/ui-<name>.stories.ts` → `argTypes` (co-located) |
| Colors, semantic tokens | Storybook → `Foundations / Colors` (brand + mode explorer) |
| Typography | Storybook → `Foundations / Typography` |
| Shadows & effects | Storybook → `Foundations / Shadows` |
| Tokens pipeline, theme, responsive | Storybook → `Spécifications / *` |
| Source Angular component | `src/app/shared/components/ui/<category>/ui-<name>/` |
| **Reference pattern** | `src/app/shared/components/ui/actions/ui-button/` (+ `ui-icon`) |

---

## Architecture

```
src/
  app/
    core/
      controlValueAccessor/  # BaseControlValueAccessor (form components)
      service/               # ThemeService ([data-theme]) · BrandService ([data-brand])
    shared/
      components/
        components-index.md  # Index: components built ✅ / to build ⬜
        ui/                  # Generic headless components — DS source of truth
          actions/           # ui-button (reference pattern)
          ui-icon/           # FontAwesome icons
        domain/              # Business components (project prefix) — created per project
      types/                 # Shared types (ui-level…)
  design-tokens/             # Token JSON sources (Figma / Token Flow export)
  styles/
    main.scss                # Global entry point
    src/
      generated/             # _tokens-*.scss — GENERATED, do not edit
      vendors/               # gridaflex-settings.scss, _fonts.scss
      base/                  # base, typography (utility classes)

storybook/
  stories/
    foundations/             # Colors.mdx, Typography.mdx, Shadows.mdx
    specifications/          # design-tokens.mdx, theme.mdx, responsive.mdx
    components/ui/           # Stories + MDX per component
tokens.config.json           # Tokens pipeline config (collections, modes, outputs)
scripts/tokens.build.mjs     # Style Dictionary build → src/styles/src/generated/
```

Each component's style is **co-located** in its `.scss` (Angular scoped) and consumes
**only** token CSS variables. The global layer (`src/styles/`) contains only the
generated tokens, vendors and utilities.

---

## Naming conventions

### UI components (generic)

| Element | Convention | Example |
|---|---|---|
| Angular selector | `ui-<name>` | `ui-button` |
| TypeScript class | `Ui<Name>` | `UiButton` |
| File | `ui-<name>.ts` (without `.component`) | `ui-button.ts` |
| Story & doc | co-located: `src/app/shared/components/ui/<cat>/ui-<name>/ui-<name>.stories.ts` + `ui-<name>.mdx` | `ui-button.stories.ts` |
| Import alias | Always `@app/` | `@app/shared/components/ui/...` |

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
- **Mixins/functions** (partials in `src/styles/src/utils/`) — 1 to 2 `///` lines: role + call example. No walls of text.
- **Language**: comments in **English**… **except** a component's config `///` comments (below), which are published in the docs and therefore in French.
- **Never reference Figma**: keep the intent ("enlarged for readability"), not the origin ("Figma 3px"). The `.scss` must read without the mockup.

#### A `///` on a config variable = the published doc

In a **component** `.scss`, a `///` on a declaration (`$var` or custom property) is the
**public contract**: `npm run docs:config` reads it and the doc's "Theming" section displays it.
`//` remains the internal note, invisible in the doc. (The `///` on mixins/functions in
`src/styles/src/utils/` is never published: the generator only scans components.)

The `///` goes **at the end of the declaration**, vertically aligned with its visual group (blank
lines separate groups):

```scss
$card-padding: var(--units-lg);       /// Inset du corps.
$card-radius: var(--radius-md);       /// Rayon des coins.
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

### Shared structural constants — `ui-config`

Structural values common to components (focus ring width, form control size,
transition recipe…) live in **`src/styles/src/settings/_ui-config.scss`**
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
  (`storybook/blocks/config-table.js`), fed by `npm run docs:config` from the `.scss`'s `///`
  comments. It is **always the last section** of the page. Optional prose before the table
  for whatever it doesn't say (architecture, pointer to a shell like `ui-field`); no
  paragraph explaining how to read the table — that's in the block's tooltip. Several
  components on one page → one `label` per table.

---

## Workflows

### Modify an existing ui-* component

1. Read `src/app/shared/components/ui/<cat>/ui-<name>/ui-<name>.stories.ts` → identify `argTypes`
2. Read `src/app/shared/components/ui/<cat>/ui-<name>/` → check types and structure
3. Modify `.ts`, `.html`, `.scss` (tokens only) — any added config variable carries its `///`
4. Update the story + the `.mdx` if the API changes; `npm run docs:config` if the SCSS config moved
5. Verify light + dark + the 3 brands (Storybook → `Foundations / Colors` for the tokens)

### Create a ui-* component (generic)

1. Check `components-index.md` (roadmap, planned name)
2. Replicate the **`ui-button` pattern**: file structure, signals + `computed()` for the classes, co-located SCSS
3. Create the story + the `.mdx` **co-located** in the component folder `src/app/shared/components/ui/<cat>/ui-<name>/` (global doc only → `storybook/docs/`)
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
