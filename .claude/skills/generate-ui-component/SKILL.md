---
name: generate-ui-component
description: >-
  Generates a headless `ui-*` component (Angular 22 signals + CDK) and its
  Storybook docs (stories + MDX) from a Figma component YAML, following this
  starter's conventions (design tokens, shared types, a11y, co-located SCSS).
  Use as soon as the user provides a Figma specs YAML
  (title/anatomy/props/variants) and asks to create/generate/prepare a
  `ui-*` or `sp-*` component. Providing the YAML as an argument is enough.
---

# Generating a `ui-*` component from a Figma YAML

This skill produces a component that is **consistent** with the rest of the design system.
The provided Figma YAML describes `anatomy`, `props`, `default`, `variants`. The logic
depends on the stack (Angular CDK + signals); the shared layer = **design tokens**.

> Read `CLAUDE.md` (root) for the full rules. This skill is their operational
> application on the Angular code-generation side.

## Input

- **Figma YAML** (required): component specs.
- **PrimeNG path** (optional): `.primeng-master/packages/primeng/src/<name>` — API/behavior inspiration only, never for styling.

## Workflow

### 1. Analyze the sources
1. Read the YAML: `props` (→ inputs), `variants` (→ visual states), `anatomy` (→ DOM structure), tokens in `styles.fills/strokes/...`.
2. Read the **reference pattern** `src/app/shared/components/ui/actions/ui-button/` (ts/html/scss).
3. Read the **closest sibling** based on the category:
   - `forms/` → `ui-checkbox` (form control + `BaseControlValueAccessor`).
   - `informative/` → `ui-badge` / `ui-helper`.
   - otherwise → `ui-icon`.
4. If PrimeNG is provided: read it for the API (inputs, keyboard behavior, CVA).

### 2. Category & location
Infer the category from the tokens used / the role:
- `actions.*` tokens → `ui/actions/` · `form.*` tokens → `ui/forms/` · `informative.*` tokens → `ui/informative/` · generic → `ui/`.

Files **all co-located** in the component's directory:
`src/app/shared/components/ui/{cat}/ui-{name}/ui-{name}.{ts,html,scss,stories.ts,mdx}`.
(**Global** docs — foundations/guidelines — would go in `storybook/docs/`, not here.)

### 3. Map the tokens (see table below)
For **every** color/spacing/typography value in the YAML, find the corresponding generated
CSS var in `src/styles/src/generated/`. **Verify that it exists**
(`grep` in `generated/`). Zero hardcoded values.

### 4. Types
- Levels: reuse `@app/shared/types/ui-level.ts` (`UiLevel`, `UiFeedbackLevel`, `UiSubLevel`). Extend this file only if a new shared level emerges.
- Sizes: local type `type {Name}Size = 'default' | 'small' | ...` (the starter uses `default` as the base, not `undefined`).

### 5. Write the component (see "Angular conventions")
### 6. Write the SCSS, including `///` theming comments (see "SCSS conventions")
### 7. Write stories + MDX, `## Theming` as the last section (see "Storybook")
### 8. Integrate: check off `components-index.md` (⬜→✅), add the card to `Overview.mdx` (correct category section), **add the entry to `CHANGELOG.md`** (`[Unreleased]` section), and — if a shared variable was added — update the `config/` docs (see "Shared variables").
### 9. Verify (see "Verification").

## Figma tokens → CSS var mapping

The YAML references tokens as `{group.path.in.camelCase}`. The generated CSS var
is **kebab/flat**, prefixed per collection:

| Figma YAML | CSS var |
|---|---|
| `{informative.errorLow.content.default}` | `var(--informative-errorlow-content-default)` |
| `{informative.{level}{Sub}.surface.default}` | `var(--informative-{level}{sub}-surface-default)` (all lowercase, concatenated) |
| `{form.high.surface.checked}` | `var(--form-high-surface-checked)` |
| `{form.low.content.default}` | `var(--form-low-content-default)` |
| `{actions.high.surface.hover}` | `var(--actions-high-surface-hover)` |
| `{units.sm}` / `{units.xs}` / `{units.2xs}` | `var(--units-sm)` … |
| `cornerRadius: 999` | `var(--radius-full)` |
| `cornerRadius: <n>` | `var(--radius-{2xs..2xl})` depending on the value |
| `strokeWeight: 1 / 2 / 4` | `var(--stroke-sm)` / `var(--stroke-default)` / `var(--stroke-lg)` |
| `textStyleId: text/{weight}/{size}` | `font-weight: var(--weight-{weight})` + `font-size: var(--size-typography-text-{size})` |

Rules:
- **semantics** (`--actions-*`, `--form-*`, `--informative-*`, `--global-*`): **no prefix**.
- **metrics**: `--units-*`, `--radius-*`, `--stroke-*`. **typography**: `--fontfamily-*`, `--weight-*`, `--size-typography-*`. **transitions**: `--transition-*`.
- Always `grep -rhoE '\--<pattern>' src/styles/src/generated/` to confirm existence BEFORE using.
- Figma interactive states (`hover/focused/pressed/disabled`) → **CSS pseudo-classes** driven by the `-hover/-focused/-pressed/-disabled` tokens, **never** Angular props.

## Angular conventions

- **Standalone**, signals API. `input()`, `input.required()`, `input(false, { transform: booleanAttribute })` for booleans, `output()`, `computed()`.
- **Emulated encapsulation**: style an **internal element** via `[class]="classes()"` (like `ui-button`/`ui-label`/`ui-badge`). Do NOT rely on `.ui-{name}` to match the host (it carries `_nghost`, not `_ngcontent`).
- `classes = computed()`: `['ui-{name}']` + `_{modifier}` (`_` prefix), derived state via computed. Size `default` = no class (base); only emit non-default ones.
- Figma boolean props `text`/`icon`/… → **presence** of an input (`hasIcon = computed(() => !!this.icon())`), not a dedicated boolean — see `ui-button`.
- Internal comments: `/** @ignore */` on protected members.
- **Code comments always in English** (JSDoc, inline comments in `.ts`/`.html`/`.scss`). User-facing documentation (stories/MDX) stays in French.
- Icons: `ui-icon` component (`[name]`, `[size]`), decorative by default.

## SCSS conventions

- Co-located, `@use 'utils';` (provides `rem-calc`, `control-transition`, `form-control-palette`, `$control-stroke-width`, `$focus-ring-width`, `$form-control-gap`…), `@use 'sass:map';`.
- **No BEM.** Root `.ui-{name}`, sub-elements `&-{part}` (→ `.ui-{name}-{part}`), modifiers `&._{mod}`.
- Extension config at the top: `$sizes` (map), `$levels`/`$sublevels` (lists) + `@each` loops to generate variants/colors (see `ui-button`, `ui-badge`).
- **100% tokens**: no hex colors, no px spacing/radius/typography outside tokens. Dimensions from the YAML → `utils.rem-calc(<px>)`.
- Interactive states = `:hover`, `:focus-visible`, `:active`, `:disabled` (never modifier classes).
- **Never reference Figma** in comments: the `.scss` must read without the mockup. Keep the
  intent ("enlarged for readability"), not the origin ("Figma 3px").

### `///` comments = the theming doc (mandatory)

The doc's "Theming" table is **generated** from the `.scss` by `npm run docs:config`
(`scripts/docs.config.mjs` → `storybook/generated/ui-config.json`). So the SCSS comments are
what write the doc: nothing to copy elsewhere.

| Marker | Meaning |
|---|---|
| `///` | **public contract**, in **French** → appears in the doc |
| `//` | internal note (implementation), in English like the rest of the file → invisible |

- The `///` goes **at the end of the declaration**, vertically aligned with its **visual group**
  (blank lines separate groups; a long line doesn't stretch its neighbors):

  ```scss
  // --- Config ---------------------------------------------------
  $card-padding: var(--units-lg);       /// Inset du corps.
  $card-radius: var(--radius-md);       /// Rayon des coins.
  ```

- Only exception: a **multi-line map** carries its `///` on the line above.
- **Never a resolved value in a role** ("Corner radius (12px)"): the doc measures the value at
  runtime, in the active theme / brand / viewport. A hand-written `12px` goes stale as soon as a
  project rebinds the variable.
- Describe the **role**, not the binding: the "Default (starter)" column and the chain to
  `ui-config` are inferred automatically.
- **Every** config variable must have its `///` — `npm run docs:config` counts the missing ones
  (they don't appear in the table).
- **Exposed custom properties** (override points) are documented with a `///` where the hook
  lives: on its declaration, or on the line reading it with its fallback
  (`color: var(--ui-x, var(--token));  /// Role.`) — never on an internal declaration
  (dark-mode override, etc.), otherwise the doc shows the wrong default value. Without a `///`,
  a custom property stays private.

## Shared variables (`ui-config`)

Before writing the SCSS, **inspect `src/styles/src/settings/_ui-config.scss`**: does an existing
structural constant (focus ring, border width, control size, transition, `$form-*`,
`$avatar-*`…) correspond to a property of the **type** of component you are generating?

- **Yes** → consume it via a **local** variable at the top of the `.scss` (`$x: utils.$…;`), never copy the value.
- **Value potentially shared by ≥ 2 components** of the same family and absent from `ui-config` →
  **add it** to `_ui-config.scss` (**category** level `$form-*`/`$action-*`/`$avatar-*`… if specific
  to a family, **global** otherwise; never a color — that stays a runtime design token), then
  **document** the group page in `storybook/docs/config/` (`config-{category}.mdx` — e.g.
  `config-informative.mdx`; create the page + add it to the table of contents of
  `component-config.mdx` if the category does not exist yet).
- **Value specific to a single component** → it stays **local**.

On the component doc side, there is **nothing to write by hand**: the local variable's `///` is
enough, the `## Theming` table alone shows the pass-through via `ui-config` (a "shared" badge +
link to the group page) and the resolved value.

## Form controls (`forms/` category)

If the component holds a value (checked, selection, input):
- `extends BaseControlValueAccessor<T>` (`@app/core/controlValueAccessor/BaseControlValueAccessor`), `T = boolean` by default if relevant.
- Provider: `{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => Ui{Name}), multi: true }`.
- **Real native input** (`<input>`), invisible (`opacity:0`, `position:absolute; inset:0`) covering the styled control → keyboard/screen reader/clickable `<label>`/native forms. Appropriate ARIA role (`role="switch"` for a toggle) + `aria-checked`/`aria-invalid`.
- Standard inputs: `label`, `ariaLabel`, `ariaLabelledBy`, `inputId` (auto uid), `name`, `trueValue`/`falseValue`, `required`, `disabled`, `readonly`, `invalid`, `tabindex`.
- `writeValue` → sets a `modelValue` signal. `onNativeChange` → single source of user toggles (respects `readonly`), `emitChange` + `{name}Change` output. `onBlur` → `emitTouch()`.
- `isDisabled = disabled() || controlDisabled()`, `isInvalid = invalid() || showError()`.
- Inline label (span + required marker) — **no** `ui-label` instance (nested label is invalid). `--ui-label-color` to drive the color via states.
- The CVA is enough for **Signal Forms** interop (`@angular/forms/signals`, `[formField]` directive, stable since Angular 22) — no additional code in the component.

## Accessibility (mandatory)

- Native elements (`<button>`, `<input>`, `<label>`), never a clickable `<div>`.
- Icon-only: `ariaLabel` mandatory + **warning in `isDevMode()`** via `effect()` (see `ui-button`/`ui-badge`).
- `:focus-visible` visible and distinct from `hover`. Native `disabled` (not just visual), colors via `-disabled` tokens.
- Color is never the only carrier of meaning (text/icon as a complement).

## Storybook

**stories.ts**:
- `title: 'Components/ui/{cat}/ui-{name}'`, `component`, `decorators: [moduleMetadata({ imports: [...] })]` (+ `FormsModule` if `ngModel`).
- `parameters.design.url` Figma (UI Kit file `GZww5hdUA49LB8XWeWP6tl`) — point to the ComponentSet's `node-id` if known.
- `argTypes` documented (control, description in French, `table.type`/`defaultValue`).
- One story per distinct visual state from the YAML (levels, sizes, states…). Form controls: drive with `[(ngModel)]` via a `render` factory for real interactivity.
- Form controls: add a **`SignalForms`** story (`form()` + `required()` + `[formField]` from `@angular/forms/signals`, demo in a co-located `@Component` class) modeled on `ui-slider.stories.ts`, in addition to the Template-driven/Reactive demos; the "Formulaires" section of the mdx shows all three APIs.

**mdx** (co-located, imports its sibling story via relative `./ui-{name}.stories`): `import { Meta, Canvas, ArgTypes } from '@storybook/addon-docs/blocks'`; sections `# ui-{name}` (French intro + tokens), `## API` (`<ArgTypes>`), `## États`, `## Accessibilité` (table `className="doc-table"`), `html` examples.

**`## Theming`** — as soon as the component has an SCSS config, **always the last section of the page**:

```mdx
import { ConfigTable } from '<…>/storybook/blocks/config-table';

## Theming

<ConfigTable of="ui-{name}" />
```

- **Never write the table by hand**: it is generated from the `.scss` (see "`///` comments").
- Optional prose before the table, for what the table doesn't say (architecture, pointer to a
  shell like `ui-field`). No paragraph explaining how the table works: that's already in the
  block's tooltip.
- A page documenting **several** components (sub-components: `ui-tab` + `ui-tab-list`…) passes a
  `label` on each table: `<ConfigTable of="ui-tab" label="ui-tab" />`.
- Other props: `only={[...]}` (allow-list of variables), `hooks={false}` (hides the custom
  properties table).

## Integration

- `src/app/shared/components/components-index.md`: move the component's line from ⬜ to ✅ (with a short description of its capabilities).
- `storybook/docs/Overview.mdx` (global docs): import the story via a **relative** path (`../../src/app/shared/components/ui/{cat}/ui-{name}/ui-{name}.stories`) + add a `ComponentCard` in the corresponding `CategorySection` (create the section if missing). Pick a representative + reliable story (avoid `ngModel` stories that render in their initial state in docs-blocks).
- `CHANGELOG.md`: **always** add an entry for a new component, in the `[Unreleased]` section (under `### Added`; `### Changed` for a shared constant adjustment / docs). Group by component, describe the key capabilities.
- `storybook/docs/config/`: if a shared variable was added to `ui-config`, update the group page (`config-{category}.mdx`) and the table of contents of `component-config.mdx` (see "Shared variables").

## Verification

1. `npx tsc --noEmit -p tsconfig.json` → must pass.
2. Compile the SCSS: `node_modules/.bin/sass --load-path=src/styles --no-source-map --quiet <file.scss>` and check the generated selectors/values.
2bis. `npm run docs:config` → the component must appear, with **0 variables missing a `///`
   comment** (the script prints the count), and every line resolved to a token, a map, a list, or
   an accepted literal value.
3. **Live Storybook** (already running on `:6006`, HMR): via the browser tools, open `iframe.html?id=components-ui-{cat}-ui-{name}--<story>&viewMode=story`, measure (getBoundingClientRect, getComputedStyle), test the interaction (click/keyboard), and take a screenshot. Wait for transitions to settle before measuring.
4. Never ask the user to verify manually: provide the proof (measurements + screenshot).

## Accepted divergences (document in the response)

- Figma booleans `text`/`icon` → input presence (Angular idiom).
- Figma interactive states → CSS pseudo-classes, not Angular props / variants.
- Useful degenerate states not drawn (e.g. "dot" badge without content): implementable if standard, to be flagged.
- Minor/inconsistent metric discrepancies in the YAML → normalize cleanly (e.g. `min-width = height` for a circle) and note it.
