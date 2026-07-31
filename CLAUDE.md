# Design System : Angular Headless → Figma

## Read before doing anything

This repository is a **fully in-house** Angular 22 (standalone) Design System: **headless**
components (Angular CDK + native signals) styled exclusively through design tokens.

It is the "Starter Angular" side of the **Dual-Engine** strategy: the *logic* depends on
the stack (Angular CDK here, Radix on the React side). The layer actually shared across stacks
= the **design tokens** (CSS variables). Component styling is **co-located** (scoped
to the Angular component) and consumes these tokens.

Before generating anything in Figma, you **must** audit the source Angular component.

> **Repo-wide agent conventions live in `AGENTS.md`** — read it first for any code task
> (Claude Code only auto-loads this file). Release/versioning conventions:
> `docs/VERSIONING.md` + `CHANGELOG.md`.

---

## Tech stack

| Layer | Technology |
|---|---|
| Framework | Angular 22, standalone, signals API, zoneless |
| Behavior (headless) | Components + Angular CDK (overlay, a11y, focus-trap…) |
| Style | Co-located per component (scoped `.scss`) + CSS custom properties (`--var`) |
| Design Tokens | JSON (Token Flow Manager) → `scripts/tokens.build.mjs` → SCSS (`src/styles/src/generated/`) |
| Storybook | v10.5.4 + addon-designs (Figma panel) |
| Themes | themeOne (purple), themeTwo, themeThree × light/dark (via `._themeX` / `.dark-mode` classes) |
| Icons | FontAwesome Free |
| Grid | Gridaflex 1.0.0 |

> **Reference pattern**: `src/app/shared/components/ui/actions/ui-button/`. Every new
> `ui-*` component is built on this model (signals + SCSS visual-DNA classes).

### Figma files (two, with distinct roles)

| File | `fileKey` | Role |
|---|---|---|
| **[Projet] - UI Kit** | `GZww5hdUA49LB8XWeWP6tl` | The **components**. Target every component generation/audit here. Consumes the variables as `remote`. |
| **[Projet] - Composants metiers** | `lH4jhyZFkIeJ1Ob1tlY7Wm` | **Owns the variable collections** (`semantics`, `primitives`, `metrics`, `typography`, `responsive`, `transitions`, `breakpoint`, `utils`). |

UI Kit URL: `https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=0-1&t=PXOwFotKvf72dn1c-1`

> ⚠️ **Any write to a variable — create, rename, retarget, delete — must happen in
> `lH4jhyZFkIeJ1Ob1tlY7Wm`.** In the UI Kit the variables are `remote`, therefore
> read-only: the Plugin API can only mutate *local* variables. From the UI Kit you can
> only rebind a node to another variable (`importVariableByKeyAsync`).
>
> Never write to another project's library (`[TEST]`, `[NAXOS] VUP`, `[EasyFret]`,
> `BeCLM`, `[ARKHE] OKWEB`, `[Celebrads]`, `Mode 2 - Projet B`): they carry the same
> token structure, inherited from this starter, but their own variable keys.

---

## Token architecture

### Mandatory hierarchy

```
primitives/   → raw colors (50-900 per palette)
    ↓
semantics/    → meaning tokens (global.high.content.default)
    ↓
metrics/      → spacing, radius, stroke, shadow
typography/   → families, sizes, weights
responsive/   → sizing per breakpoint
transitions/  → durations, easing
```

### Semantic categories (`semantics.json`)

```
global.{modeLight|modeDark}.{high|low}.{content|surface|stroke}.{default|hover|focused|pressed|disabled}
token.{modeLight|modeDark}.actions.{high|low|success|warning|error}.{content|surface|stroke}.{states}
token.{modeLight|modeDark}.form.{high|low|success|error}.{content|surface|stroke}.{states}
token.{modeLight|modeDark}.informative.{defaultHigh|defaultLow|highlightHigh|...}
token.{modeLight|modeDark}.navigation.{high|low}.{states}
token.{modeLight|modeDark}.table.{head|body|footer}.{content|surface|stroke}
effects.{modeLight|modeDark}.{default|highlight|success|warning|error}
```

### Metrics (`metrics.json`)

| Category | Available values |
|---|---|
| Spacing | 2xs (2px), xs (4px), sm (8px), md (12px), lg (16px), xl (24px), 2xl (32px), 3xl (40px), 4xl (56px) |
| Radius | 2xs, xs, sm, md, lg, xl, 2xl, full |
| Stroke | sm (1px), default (2px), lg (4px) |
| Shadow | sm, md, lg |

---

## Strict rules: Tokens

**FORBIDDEN**:
- No hardcoded hexadecimal color in Figma
- No numeric spacing value outside `metrics`
- No `font-size` outside `typography`
- No `border-radius` outside `metrics.radius`
- No duplicated style (always a Figma variable)

**MANDATORY**:
- Always read `src/design-tokens/semantics.json` before choosing a color
- Always use semantic tokens, never primitives directly in components
- Figma tokens must carry the same names as the generated SCSS tokens in `src/styles/src/generated/`
- Every color must exist in both light AND dark mode

---

## Angular component architecture

### File structure

```
ui-{name}/
├── ui-{name}.ts          ← logic + inputs (signals), classes computed via computed()
├── ui-{name}.html        ← headless native HTML template (+ Angular CDK if needed)
├── ui-{name}.scss        ← CO-LOCATED component STYLE (scoped to the component)
├── ui-{name}.stories.ts  ← CO-LOCATED Storybook story
└── ui-{name}.mdx         ← CO-LOCATED Storybook doc
```

> A component's **story and MDX doc are co-located** in its folder. **Global** doc
> (foundations, guidelines, design system) lives in `storybook/docs/`. Config:
> `storybook/main.js`.

> Each component's **style is co-located** in its own `.scss` (Angular scoped
> styles). The global layer (`src/styles/`) contains ONLY the generated tokens + utilities.
> All values (color, spacing, radius…) come from token CSS variables.
> Reference pattern: `ui-button` (+ `ui-icon`).

### Theming doc: generated from SCSS

The `## Theming` section of each component doc is **never written by hand**. It is produced
by `npm run docs:config` (`scripts/docs.config.mjs` → `storybook/generated/ui-config.json`) and
rendered by `<ConfigTable of="ui-{name}" />` (`storybook/blocks/config-table.js`).

**The `.scss` comments are what write the doc**: `///` = documented public contract (in
French), `//` = internal note (English, invisible in the doc). The `///` goes **at the end of
the declaration**, vertically aligned with its visual group:

```scss
$card-padding: var(--units-lg);       /// Inset du corps.
$card-radius: var(--radius-md);       /// Rayon des coins.
```

Rules:

- **Never a resolved value in a role** (`(12px)`): the doc measures it at runtime, in the active
  theme, brand and viewport. A hand-written value goes stale as soon as a project rebinds
  the variable — that's exactly what this system removes.
- Describe the **role** only: the binding, the pass-through via `ui-config` and the value are inferred.
- A **multi-line map** is the only exception: its `///` goes on the line above.
- An exposed **custom property** is only public if it carries a `///`, placed where the hook lives
  (declaration, or a fallback read) — never on an internal dark-mode override.
- `## Theming` is **always the last section** of the MDX page.
- `npm run docs:config --check` (or `npm run docs:config:check`) fails if the manifest is stale;
  it is regenerated by `postinstall` and before `storybook` / `build-storybook`.

### Categories

| Category | Selector prefix | Location |
|---|---|---|
| Generic UI | `ui-` | `src/app/shared/components/ui/` |
| Business domain | `sp-` or project prefix | `src/app/shared/components/domain/` |

### Signals patterns

```typescript
// Inputs
label = input<string>();                    // optional
name = input.required<string>();            // required
level = input<'high' | 'low'>('high');      // with default
disabled = input<boolean>(false);

// Outputs
buttonClick = output<MouseEvent>();

// Computed (CSS classes, derived state)
wrapperClass = computed(() => {
  const classes = ['component-root'];
  if (this.error()) classes.push('is-error');
  return classes.join(' ');
});
```

---

## Mapping Angular inputs → Figma Properties

| Angular (input) | Figma (component property) | Figma type |
|---|---|---|
| `level: 'high'\|'low'\|'success'\|'warning'\|'error'\|'info'\|'danger'` | `Level` | Variant |
| `size: 'small'\|undefined\|'large'` | `Size` | Variant |
| `outlined: boolean` | `Outlined` | Boolean |
| `disabled: boolean` | `State = disabled` | Variant (within State) |
| `iconLeft: string\|null` | `Icon Left` | Boolean |
| `iconRight: string\|null` | `Icon Right` | Boolean |
| `label: string` | `Label` | Text |
| `state: 'default'\|'success'\|'error'\|'warning'\|'neutral'` | `State` | Variant |
| `active: boolean` | `Active` | Boolean |
| `readonly: boolean` | `State = readonly` | Variant (within State) |
| `error: string\|null` | included in `State = error` | Variant |

### Interactive states rule

Interactive states (`hover`, `focused`, `pressed`, `disabled`) are **never** Angular props (they are handled by CSS/tokens). In Figma, they are **State variants**, not separate boolean Component Properties.

---

## Figma variants architecture

### Fundamental rule

**Prefer Component Properties over variant explosions.**

```
BAD: 1 variant for every combination (high+small+outlined+icon = 1 frame)
→ combinatorial explosion

GOOD: separate Component Properties that compose
→ Level [high|low|success|warning|error]
→ Size [default|small|large]
→ Outlined [true|false]
→ Has Icon [true|false]
→ State [default|hover|focused|pressed|disabled]
```

### Expected structure for every Figma component

```
ComponentSet "{ComponentName}"
├── Primary variants (the distinct visual states)
│   ├── Level=high, State=default
│   ├── Level=high, State=hover
│   ├── Level=high, State=focused
│   ├── Level=high, State=disabled
│   ├── Level=low, State=default
│   └── ...
└── Component Properties (composition)
    ├── Boolean: "Has Label", "Has Icon Left", "Has Icon Right"
    ├── Text: "Label"
    └── Instance swap: "Icon"
```

### Variant naming rule

- PascalCase names for properties: `Level`, `State`, `Size`
- Lowercase values: `high`, `low`, `default`, `hover`, `small`
- No spaces, no hyphens in property names
- State always last in the property list

---

## Auto Layout rules

**Always use Auto Layout**, never fixed-position frames for components.

| Case | Rule |
|---|---|
| Component with label | `direction: horizontal`, `align: center`, `gap: metrics.sm (8px)` |
| Vertical list | `direction: vertical`, `gap: metrics.md or lg` |
| Internal padding | Use `metrics.sm/md/lg` for horizontal and vertical padding |
| Expand | `fill container` on the main child, never a hardcoded width |
| Icon only | `width/height: fixed` per size token |
| Full-width component | `fill` constraint on the parent |

**FORBIDDEN**:
- `position: absolute` on elements inside a component
- Hardcoded fixed dimensions outside the `metrics` tokens
- Asymmetric padding not justified by the design token

---

## Accessibility rules

Every Figma component **must** have:
- A descriptive layer name (not "Frame 42", but "Button/High/Default")
- The Figma `aria-label` property filled in on interactive elements
- Color contrast compliant with WCAG 2.1 AA minimum (verify with the semantic tokens)
- `focused` states visible and distinct from `hover` states
- `disabled` states using the `disabled` token opacity or color (never just a hardcoded `opacity: 0.5`)

---

## Storybook → Figma rules

Every story with a Figma `parameters.design.url` **must** correspond to an existing Figma component.

Expected URL format in stories:
```typescript
parameters: {
  design: {
    type: 'figma',
    url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=0-1&t=PXOwFotKvf72dn1c-1?node-id=XX-XX',
  },
}
```

Rule: the `node-id` in the Figma parameter must point to the **ComponentSet** (variant set), not to an instance.

---

## Naming rules

### Figma

| Element | Convention | Example |
|---|---|---|
| ComponentSet | `ComponentName` | `Button` |
| Variant frame | `Level=high, State=default` | - |
| Root layer | `{prefix}/{category}` | `ui/button` |
| Variable collection | `Semantics`, `Metrics`, `Typography` | - |
| Variable token | `{category}/{subcategory}/{property}` | `actions/high/surface/default` |
| Mode | `Light`, `Dark` | - |
| Theme | `ThemeOne`, `ThemeTwo`, `ThemeThree` | - |

### Angular (existing: do not change)

| Element | Convention |
|---|---|
| UI selector | `ui-{kebab-case}` |
| Domain selector | `sp-{kebab-case}` |
| TypeScript class | `Ui{PascalCase}` |
| Input union type | `type {Name}Variant = '...' \| '...'` |

### CSS/SCSS classes (MANDATORY: no BEM)

> ⚠️ **Do NOT use BEM notation** (`ui-button__icon`, `ui-button--active`).

| Element | Convention | SCSS | Example |
|---|---|---|---|
| Root | `ui-{name}` | `.ui-{name}` | `.ui-button` |
| Sub-element | `ui-{name}-{part}` | `&-{part}` | `&-icon` → `.ui-button-icon` |
| Modifier | `_{modifier}` (`_` prefix) | `&._{modifier}` | `&._small`, `&._high`, `&._active` |

```scss
.ui-button {
  &-icon { … }        // → .ui-button-icon
  &-label { … }       // → .ui-button-label
  &._small { … }      // modifier
  &._high { … }       // level modifier
}
```

Interactive states (`hover`/`focus`/`active`/`disabled`) = **CSS pseudo-classes**, never modifier classes.

---

## Composition rules

- A Figma component must **never** copy/paste another one's styles: it must **instantiate** it
- `domain/` components use instances of `ui/` components
- No nesting of ComponentSets (a component inside a component = instance, not set inclusion)
- Icons are FontAwesome or icon-system instances, never drawn shapes

---

## Scalability rules

- A component must not have more than **5 top-level Figma properties** (otherwise decompose)
- If a component has more than **30 variants**, rethink the properties-vs-variants architecture
- Color tokens must live in Figma variable collections (not color styles)
- Light/dark modes are **always** applied via variable modes, never via component duplication
- The 3 themes are applied via collection selection, never via duplication

---

## Anti-duplication rules

- A color appears **only once**: in the primitive token. All references go through the semantic tokens
- If two components share an appearance, create a common base component
- No duplicated documentation frame: use the Storybook stories as the single source of truth
- If a style is repeated 3 times, create a Figma variable

---

## Mandatory workflow before Figma generation

**Step 1: Angular component analysis**
```
1. Read the .ts file → identify all inputs and their types
2. Read the .html file → identify the DOM structure
3. Read the .scss file → identify state classes and overrides
4. Read the Storybook story → identify argTypes and documented states
5. Identify the existing Figma node-id in the story (if present)
```

**Step 2: Token mapping**
```
1. For each CSS color used → find the corresponding semantic token
2. For each spacing → find the corresponding metrics value
3. For each interactive state → map onto the semantic states
4. Verify that both light AND dark are covered
```

**Step 3: Figma architecture**
```
1. Define the ComponentSet properties (not the individual variants)
2. List the visually distinct states (requiring variants)
3. Define the composable Component Properties (booleans, text, instance swap)
4. Define the Figma variable bindings
```

**Step 4: Generation**
```
1. Use use_figma to create the component
2. Apply Figma variables for all colors
3. Configure Auto Layout
4. Create the state variants
5. Configure the Component Properties
6. Verify compliance with the checklist
```

---

## Figma component compliance checklist

Before validating a Figma component:

- [ ] No hardcoded hexadecimal color (all bound to variables)
- [ ] No spacing outside the metrics tokens
- [ ] Auto Layout on all frames (no absolute positioning)
- [ ] Descriptive and consistent layer naming
- [ ] Interactive states covered (default, hover, focused, disabled minimum)
- [ ] Light AND dark modes working via variable modes
- [ ] ComponentSet with Component Properties (no variant explosion)
- [ ] node-id up to date in the Storybook story
- [ ] Accessibility: WCAG AA contrast verified

---

## "Design System Reviewer" mode

When the user requests an audit of a Figma component, apply this grid:

### Bad variants detection
- Redundant variants (same visual appearance)
- Variants that should be boolean Component Properties
- More than 30 variants for a single component → propose restructuring

### Hardcoded values detection
- Hexadecimal colors not bound to Figma variables
- Padding/gap/spacing numbers that match no metric token
- Font-size/weight/family hardcoded outside the typography variables

### Scalability issues detection
- Component duplication instead of instantiation
- Color styles instead of Figma variables
- Light/dark modes implemented by copying instead of variable modes
- Themes implemented by duplication instead of collections

### Bad Figma properties detection
- Boolean `Disabled` property when it is a State
- Separate Angular `error`/`success`/`warning` properties when they should be a single `State`
- Missing property for variable content (label, icon)

### Auto Layout issues detection
- Frames without Auto Layout inside a component
- Fixed dimensions on elements that should be `fill`
- Padding/gap without binding to the metrics tokens

### Token violations detection
- Primitive used directly in a component (e.g. `primary.500` instead of `actions.high.surface.default`)
- Token from one category used in another (e.g. `navigation` token on a button)

---

## Reusable prompt templates

### 1. Angular component analysis

```
Analyze the following Angular component to prepare its creation in Figma:
- Read `src/app/shared/components/{category}/{name}/{name}.ts`
- Read `src/app/shared/components/{category}/{name}/{name}.html`
- Read `src/app/shared/components/{category}/{name}/{name}.scss`
- Read `src/app/shared/components/{category}/{name}/{name}.stories.ts` (co-located)
Produce:
1. List of inputs with types and default values
2. Distinct visual states (required Figma variants)
3. Suggested composable Component Properties
4. Mapping to semantic tokens for each color/spacing
5. Potential Figma architecture issues
```

### 2. Figma component generation from Angular

```
Create the Figma component for `{ComponentName}` following the mandatory workflow:
1. Analyze the source Angular component
2. Map all tokens
3. Define the variants/properties architecture
4. Generate with use_figma in the UI Kit file GZww5hdUA49LB8XWeWP6tl
5. Apply Figma variables (zero hardcoding)
6. Configure Auto Layout
7. Return the node-id to update the Storybook story
```

### 3. Figma component audit

```
Audit the Figma component node-id="{nodeId}" of the UI Kit file GZww5hdUA49LB8XWeWP6tl in Design System Reviewer mode:
- Detect hardcoded values
- Detect bad variants
- Detect token violations
- Detect Auto Layout issues
- Detect scalability issues
Produce a report with: critical issues / improvements / overall compliance (%)
```

### 4. Storybook → Figma migration

```
For the component whose story is `src/app/shared/components/{path}/{name}/{name}.stories.ts` (co-located):
1. Extract all argTypes and their possible values
2. Identify the current Figma node-id in `parameters.design.url`
3. Verify that the Figma component covers all exported stories
4. List the stories missing in Figma
5. Propose the update plan
```

### 5. Variants optimization

```
Audit the variants architecture of the Figma ComponentSet "{ComponentName}":
1. List all current properties
2. Identify variants that should be Component Properties
3. Identify missing Component Properties
4. Compute the possible variant reduction
5. Propose the new architecture with justification
6. Implement the refactoring if approved
```

---

## Figma variables: Expected structure

### Existing collections (do NOT recreate them)

All of them already live in `lH4jhyZFkIeJ1Ob1tlY7Wm`. Names are **lowercase**, and the
mode names are not the ones the SCSS uses. Read before writing.

| Collection | Modes | Vars |
|---|---|---|
| `primitives` | `Brand 1`, `Brand 2`, `Brand 3` | 85 |
| `semantics` | `Light`, `Dark` | 421 |
| `metrics` | `Mode 1` | 33 |
| `typography` | `Mode 1` | 10 |
| `responsive` | `Desktop`, `Tablet`, `Mobile` | 32 |
| `utils` | `Mode 1` | 31 |
| `breakpoint` | `Mode 1` | 6 |
| `transitions` | `Mode 1` | 7 |

`semantics` references `primitives` through variable aliases — that is what makes the
brand/mode switch work without duplication.

### Figma variable naming (aligned with the SCSS tokens)

The collection is **not** part of the variable name (no `Semantics/` prefix), and
neither is the `token` segment:

```
global/text/default                 → --global-text-default
global/background/default           → --global-background-default
global/border/focus                 → --global-border-focus
actions/high/surface/default        → --actions-high-surface-default
actions/high/surface/hover          → --actions-high-surface-hover
form/error/stroke/default           → --form-error-stroke-default
radius/md                           → --radius-md
units/sm                            → --units-sm
stroke/default                      → --stroke-default
font Family/Base                    → --fontfamily-base
weight/bold                         → --weight-bold
size/typography/text/md             → --size-typography-text-md
```

> The `global/*` names above are the **post-migration** ones (see
> `docs/figma-migration-global.md`). Until that runbook is executed, the Figma file
> still carries `global/{default|high|low}/{content|surface|stroke}/{state}`.

---

## Component styling: Figma points of attention

The components are **headless**. Styling is **co-located** in the component's `.scss`
(Angular scoped) and consumes the generated CSS variables (`src/styles/src/generated/`).

The `hover`/`focused`/`pressed`/`disabled` states are handled in CSS via the semantic tokens
(e.g. `--actions-high-surface-hover`), never as Angular props. In Figma, these states must
mirror these same token values.

### Accessibility (mandatory)

- Native `<button>`/`<a>`; no clickable `<div>`.
- `aria-label` mandatory in **icon-only** mode (falls back to the label otherwise).
- Decorative icons with `aria-hidden` (see `ui-icon`: `decorative` by default).
- `:focus-visible` always visible and distinct from `hover`.
- Native `disabled` (not just visual).

---

## Design tokens pipeline

Source: `src/design-tokens/*.json` (DTCG format + Figma extensions, exported from Figma).
Build: `npm run tokens:build` (`scripts/tokens.build.mjs`, **Style Dictionary v5** engine) →
SCSS partials in `src/styles/src/generated/`.

Configuration: **`tokens.config.json`** (repo root, documented/validated by
`scripts/tokens.config.schema.json`): declares the collections, the mode axes
(brand/theme/viewport → CSS selectors or media queries) and the outputs (`css-vars`,
`scss-vars`). Adding a collection or a mode = edit this JSON, not the script.

### CSS variable naming

| Collection | Var prefix | Example |
|---|---|---|
| primitives | `--primitives-*` | `--primitives-primary-500` |
| metrics | `--metrics-*` | `--metrics-units-sm`, `--metrics-radius-sm` |
| semantics | *(none)* | `--actions-high-surface-default`, `--global-high-content-default` |
| typography | *(none)* | `--fontfamily-base`, `--weight-bold` |
| transitions | *(none)* | `--transition-fast` |

The **semantics reference the primitives** via `var(--primitives-*)` (outputReferences) → the
brand/mode switch happens at runtime without duplication.

### Dimensions / modes

| Dimension | Carried by | Runtime application |
|---|---|---|
| Brand | primitives (modeBrand1/2/3) | `[data-brand='brand2'\|'brand3']` (brand1 = default): `BrandService` |
| Light/Dark | semantics (modeLight/modeDark) | `[data-theme='dark']` (light = default): `ThemeService` |
| Viewport | responsive (modeMobile/Tablet/Desktop) | `@media (min-width: …)` |

---

## Breakpoints

| Token | Value | Usage |
|---|---|---|
| `phone` | 0px | Mobile first |
| `tabletPortrait` | 600px | Small tablet |
| `tabletLandscape` | 900px | Tablet landscape |
| `desktop` | 1200px | Standard desktop |
| `mediumDesktop` | 1440px | Large desktop |
| `bigDesktop` | 1800px | Very large screen |

In Figma, use 1440px frames (mediumDesktop) as the desktop reference size.
Document mobile adaptations via separate frames, not component duplication.
