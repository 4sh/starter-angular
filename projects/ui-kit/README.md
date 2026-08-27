# @4sh/ui-kit

_**English** · [Français](./README.fr.md)_

_Headless_ Angular components from the 4SH Design System: logic and accessibility
built in natively (signals + Angular CDK), styling driven by design tokens.

**Full documentation (Storybook)**:
<https://4sh.github.io/starter-angular/?path=/docs/introduction--docs>

---

## Two ways to consume the kit

Choose **before** installing: the decision shapes everything that follows.

|                         | **dependency**                                         | **starter**                                                                         |
| ----------------------- | ------------------------------------------------------ | ----------------------------------------------------------------------------------- |
| Install                 | `npm install @4sh/ui-kit`                              | `ng add @4sh/ui-kit-schematics`                                                     |
| What lands in your repo | nothing — compiled components stay in `node_modules`   | the component _sources_, in `src/app/shared/`                                       |
| Imports                 | `@4sh/ui-kit/actions/ui-button`                        | your own path (`./shared/components/ui/actions/ui-button`)                          |
| Styles                  | `node_modules/@4sh/ui-kit/styles.css`, loaded globally | copied into `src/styles/`, with the token generation chain (`npm run tokens:build`) |
| Documentation           | the Storybook linked above                             | yours, on your own copies (set up by `ng add`)                                      |
| Customization           | inputs + CSS variables                                 | edit the code itself                                                                |
| Updating                | bump the version                                       | `ng generate @4sh/ui-kit-schematics:update` — per-component diff, accept or skip    |

**dependency** is the default: nothing to maintain, one version to follow, and a
guarantee that every project renders the same kit. **starter** — the shadcn/ui or
spartan-ng approach — trades that guarantee for ownership of the code: pick it
when the project needs to diverge from the Design System, and accept that
updates are then semi-manual.

Both modes describe the same components. **The rest of this page describes the
`dependency` mode**; the starter path has its own package and its own README (see
[below](#or-copy-the-sources-instead)).

---

## Installation

```bash
npm install @4sh/ui-kit
```

Published on the **public npm registry**, under the **`4sh`** organization:
[npmjs.com/package/@4sh/ui-kit](https://www.npmjs.com/package/@4sh/ui-kit)

| Requires |                                                                            |
| -------- | -------------------------------------------------------------------------- |
| Angular  | `^22.0.0` — `core`, `common`, `forms`, `router`, `platform-browser`, `cdk` |
| RxJS     | `^7.8.0`                                                                   |

These are declared as `peerDependencies`: the version already present in your
application is the one used, never a second copy of Angular.

### Or copy the sources instead

This package gives you **compiled** components: you import them and follow the
kit's releases. If you would rather have the sources _in your own repository_, to
read and edit them — the shadcn/spartan-ng approach — that is the other mode, and
it goes through the companion package:

```bash
ng add @4sh/ui-kit-schematics
```

It copies the components you pick into `src/app/shared/`, and deliberately does
**not** install `@4sh/ui-kit`: absent from `node_modules`, nothing can import its
compiled code instead of your copies. See
**[`@4sh/ui-kit-schematics`](https://www.npmjs.com/package/@4sh/ui-kit-schematics)**.

The two modes do not combine — pick the one that fits the project.

### AI agent (MCP server)

A small MCP server ships **inside this package**, under `mcp/` — bundled at build
time (a single dependency-free file), not published on its own. It exposes the kit's
component catalog, API and doc (full-text search included) to an MCP-aware coding
agent (Claude Code, Claude Desktop, Cursor…), so it can look things up instead of
reading sources or guessing.

Unlike `ng add @4sh/ui-kit-schematics` (which declares it for you), this path has no
install-time hook — add it yourself, once, to your `.mcp.json`:

```json
{
  "mcpServers": {
    "ui-kit": {
      "command": "npx",
      "args": ["--no-install", "ui-kit-mcp"]
    }
  }
}
```

`npm install` links `ui-kit-mcp` into your project's `node_modules/.bin/`, so this
form resolves no matter which directory your MCP client starts the server from — a
hardcoded `node node_modules/@4sh/ui-kit/mcp/index.js` is relative to the working
directory and breaks as soon as that isn't the project root. Keep `--no-install`: it
makes npx fail loudly when the bin is missing, rather than fetching an unrelated
package of that name from the registry.

Nothing to install beyond `@4sh/ui-kit` itself, and nothing to reach on the npm
registry at run time — the file is already on disk once `npm install` has run. Tools:
`list_components`, `get_component_doc`, `search_docs`, `get_shared_config` — same
content as the Storybook doc linked above, and as its per-page **Copy as Markdown**
button, for a chat that isn't MCP-aware.

---

## Getting started

Two steps, and the second one is the one people forget.

**1. Load the kit's stylesheet, once, globally.** The components are **headless**: no
color, size or spacing is hardcoded — everything is read from CSS variables, and the
package ships them.

```jsonc
// angular.json
"styles": [
  "node_modules/@4sh/ui-kit/styles.css",   // ← tokens + base + typography + motion
  "src/styles/main.scss"
]
```

`styles.css` contains the design tokens (all 3 brands, light/dark, responsive), the base
layer, the typography classes and the animation presets of the `UiMotion` directive.
**Without it, components render unstyled** — nothing errors, everything just looks wrong.

`@font-face` rules are **not** included: the tokens merely _name_ the families
(`--fontfamily-base`), and every one of them ends with a system fallback stack, so an app
that ships no font file renders in the OS sans (San Francisco, Segoe UI, Roboto), never in
the browser's serif default. To use your own: declare the `@font-face` rules in a global
stylesheet and override `--fontfamily-*` there, keeping a fallback tail. Step by step, for
both consumption modes: **Foundations → Typography** in the Storybook.

**2. Import the component you need** — and only that one. Here, the date picker, without
pulling the rest of the kit into your bundle:

```ts
import { UiDatepicker } from '@4sh/ui-kit/forms/ui-datepicker';

@Component({
  selector: 'app-booking',
  imports: [UiDatepicker],
  template: `<ui-datepicker label="Date" valueType="date" [(ngModel)]="date" />`,
})
export class Booking {
  date = signal<Date | null>(null);
}
```

That is the whole setup. Two components need one provider each — see
[below](#configuration-required-by-some-components) — and everything else is opt-in.

---

## À la carte imports (secondary entry points)

Every component is exposed through its own _entry point_. You import what you
need, and tree-shaking drops the rest from your final bundle:

```ts
import { UiButton } from '@4sh/ui-kit/actions/ui-button';
import { UiIcon } from '@4sh/ui-kit/base/ui-icon';
```

> `@4sh/ui-kit` is **a single npm package**. Entry points are not installed
> separately: they are all there from the moment you install, and dependencies
> between them resolve automatically (importing `UiDatepicker` pulls in whatever
> it needs, you have nothing to declare).

### Available entry points

**57 entry points**, each named `@4sh/ui-kit/<family>/<component>` — the family
below is literally the path segment, lowercased:
`@4sh/ui-kit/actions/ui-button`, `@4sh/ui-kit/forms/ui-select`,
`@4sh/ui-kit/forms/ui-datepicker`…
(58 components in total — `ui-file-upload-list` ships inside `ui-file-upload`,
whose model it consumes.)

| Family      | Entry points                                                                                                                                                                                                                                                                                                                                                           |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Actions     | `ui-button` · `ui-button-split` · `ui-link` · `ui-speed-dial`                                                                                                                                                                                                                                                                                                          |
| Forms       | `ui-input` · `ui-textarea` · `ui-editor` · `ui-select` · `ui-autocomplete` · `ui-datepicker` · `ui-checkbox` · `ui-radio` · `ui-toggle` · `ui-toggle-button` · `ui-slider` · `ui-nudger` · `ui-rating` · `ui-segment-control` · `ui-input-number` · `ui-input-mask` · `ui-input-otp` · `ui-input-tags` · `ui-input-group` · `ui-file-upload` · `ui-field` · `ui-label` · `ui-swatch-picker` |
| Informative | `ui-alert` · `ui-toast` · `ui-badge` · `ui-chip` · `ui-tag` · `ui-avatar` · `ui-avatar-group` · `ui-accordion` · `ui-tooltip` · `ui-spinner` · `ui-skeleton` · `ui-progress-bar` · `ui-empty-state` · `ui-read-only` · `ui-separator` · `ui-helper`                                                                                                                    |
| Layout      | `ui-card` · `ui-modal` · `ui-drawer` · `ui-popover`                                                                                                                                                                                                                                                                                                                    |
| Navigation  | `ui-menu` · `ui-context-menu` · `ui-tabs` · `ui-stepper` · `ui-sidebar` · `ui-breadcrumb`                                                                                                                                                                                                                                                                              |
| Table       | `ui-table` · `ui-paginator`                                                                                                                                                                                                                                                                                                                                            |
| Base        | `ui-icon` · `ui-image`                                                                                                                                                                                                                                                                                                                                                 |

Plus the cross-cutting entry points:

| Entry point           | Contents                                                                                              |
| --------------------- | ----------------------------------------------------------------------------------------------------- |
| `@4sh/ui-kit/forms`   | Form field foundation — see below                                                                     |
| `@4sh/ui-kit/theming` | `ThemeService` (light/dark, `[data-theme]`) · `BrandService` (`[data-brand]`) · `provideUiKitBrand()` |
| `@4sh/ui-kit/motion`  | `UiMotion` directive + animation presets                                                              |
| `@4sh/ui-kit/overlay` | Helpers for CDK overlay components (`closeOnNavigation`)                                              |
| `@4sh/ui-kit/types`   | Cross-cutting types (`UiLevel`, `UiSubLevel`, `UiFeedbackLevel`)                                      |

---

## Configuration required by some components

Two components need a piece of data the kit cannot know about — it is therefore
**injected** by the application rather than hardcoded:

```ts
// app.config.ts
import { brandFromSubdomain, provideUiKitBrand } from '@4sh/ui-kit/theming';
import { provideUiImageAssets } from '@4sh/ui-kit/base/ui-image';
import assetsMap from './assets/assets-map.json';

providers: [
  // active brand — how you detect it (subdomain, user setting…) is up to you
  provideUiKitBrand(brandFromSubdomain(subdomain)),
  // map of YOUR project's local assets, consumed by `ui-image` (`name` input)
  provideUiImageAssets(assetsMap),
];
```

Both are **optional**: without them the brand defaults to `brand1`, and
`ui-image` only renders its remote images (`src`), `name` falling back to the
placeholder.

---

## Styles: going further

### Writing your own styles on the kit's foundation

The kit's styles are authored in **SCSS (Sass)**, not plain CSS — that is what
lets `styles.css` be assembled from tokens, mixins and per-component partials
instead of one flat, hand-maintained stylesheet. The compiled `styles.css` you
load in `angular.json` is plain CSS and needs no Sass on your side; but the SCSS
**sources** ship with the package too, so your own components can use the same
shared functions, mixins and constants.

```scss
// with `node_modules/@4sh/ui-kit/styles` in your includePaths
@use 'utils';

.my-field {
  min-height: utils.$form-field-height;
  padding: var(--units-md);
  border-radius: var(--radius-md);
}
```

> `utils` exposes **API only** (functions, mixins, constants) and emits no CSS
> rule: since each component `.scss` is a separate Sass compilation unit, any
> CSS exposed there would be duplicated into every component. The global utility
> classes live in `styles.css`.

### Theme, brand and overrides

Light/dark and brand are **attributes on `<html>`** — nothing to import, `styles.css`
already carries every mode:

| Attribute    | Values             | Absent means |
| ------------ | ------------------ | ------------ |
| `data-theme` | `dark`             | light        |
| `data-brand` | `brand2`, `brand3` | brand 1      |

```html
<html data-theme="dark" data-brand="brand2"></html>
```

Set them however suits you (a service, SSR, a build flag): the kit only reads them.

To change a value, three levels, from the broadest to the narrowest:

```scss
// src/styles/main.scss — loaded after styles.css
@use 'presets/component-vars'; // 2. one component's values

:root {
  --units-lg: 20px;
} // 1. a token: the whole kit follows
:root[data-theme='dark'] {
  --global-background-default: #101014;
}

.toolbar ui-button {
  --ui-button-height-small: 24px;
} // 3. one area of the screen
```

1. **A token** (`--units-*`, `--radius-*`, `--actions-*`…) — must come **after**
   `styles.css`, which declares them. For a mode-specific value, match the same
   selector (`:root[data-theme='dark']`).
2. **A component's values** — copy `@4sh/ui-kit/styles/component-vars.scss` into your
   `styles/presets/`: every `--ui-*` variable at its shipped value, ready to retune.
   Load order is irrelevant here, the kit only _reads_ these names.
   Values shared by a whole family live in the same file under `--ui-form-*` /
   `--ui-control-*` / `--ui-overlay-panel-*`: one declaration moves every consumer,
   and a component-level variable still wins over it.
3. **One area** — the same `--ui-*` on any selector or element.

Full reference (every variable, its role and its measured value): Storybook →
_Spécifications → Thème & Système de Tokens_.

### Motion, and turning it off

Every transition and animation in the kit is driven by the `--transition-*`
tokens and the `UiMotion` presets — no component hardcodes a duration. Turning
motion off is therefore a single global switch, not a per-component setting:

```html
<html data-motion="off"></html>
```

This neutralizes every animation and transition in the kit at once — the same
reset already applied automatically when the OS-level `prefers-reduced-motion:
reduce` preference is on. A per-element opt-out also exists (`[motionDisabled]`
on the `UiMotion` directive, from `@4sh/ui-kit/motion`). Full reference,
including the animation presets: Storybook → **Foundations → Motion**.

---

## `@4sh/ui-kit/forms` — form field foundation

This entry point gathers the infrastructure shared by every field in the kit.
**You do not need to import it to use an existing field** (`UiInput`,
`UiSelect`, `UiDatepicker`… already pull it in). It becomes useful when you
build **your own field** while reusing the kit's conventions.

| Export                                                            | Role                                                                                                                                                                                                                                                                                                      |
| ----------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `BaseControlValueAccessor<T>`                                     | Implements `ControlValueAccessor` and mirrors the state of the attached `NgControl` into signals (`touched`, `dirty`, `controlInvalid`, `controlErrors`, `showError`). This is what makes a field compatible in one go with `[(ngModel)]`, Reactive Forms **and** Signal Forms.                           |
| `BaseFieldControl<T>`                                             | A "bare" control, with no chrome: common inputs (`ariaLabel`, `inputId`, `name`, `required`, `disabled`, `readonly`, `invalid`, `tabindex`), accessible `id` generation, `modelValue`, derived `isDisabled`/`isInvalid` states. Base of `ui-checkbox`, `ui-toggle`, `ui-slider`, `ui-radio`, `ui-nudger`. |
| `BaseFormField<T>`                                                | Extends the previous one with the "box" chrome: `label`, `helperText`, `errorText`, `size`, `level`, plus `effectiveLevel` / `displayMessage` / `displayValue`. Base of `ui-input`, `ui-select`, `ui-datepicker`, `ui-textarea`…                                                                          |
| `dropdownOverlayPositions()`                                      | Standard CDK anchoring for a dropdown panel (below the field, flipped above when needed).                                                                                                                                                                                                                 |
| `maskEngine`                                                      | Shared input mask engine (`ui-input-mask`, `ui-datepicker`).                                                                                                                                                                                                                                              |
| `option-resolver`, `format-label`, `warn-missing-accessible-name` | Option resolution, label formatting and accessibility guardrail helpers.                                                                                                                                                                                                                                  |

### Building your own field

```ts
import { Component, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseFormField } from '@4sh/ui-kit/forms';

@Component({
  selector: 'app-my-field',
  templateUrl: './my-field.html',
  providers: [{ provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MyField), multi: true }],
})
export class MyField extends BaseFormField<string> {
  // `writeValue` is provided by default (writes into `modelValue`).
  // Call `emitChange(value)` on input and `emitTouch()` on blur.
}
```

---

## Accessibility

The reason the components are headless is that behaviour and accessibility are the part
you should not have to rewrite:

- Native elements (`<button>`, `<a>`, `<input>`) — never a clickable `<div>`.
- `aria-label` required in icon-only mode; decorative icons carry `aria-hidden`.
- `:focus-visible` always visible, and distinct from `hover`.
- `disabled` is the native attribute, not just a visual state.
- Overlay components (select, menu, modal, drawer…) use the Angular CDK for focus
  trapping and keyboard navigation.

Every story runs through axe-core in CI (`@storybook/addon-a11y` + `test-storybook`).
**That check is informational today**: a backlog of known violations is still being worked
through, so read it as a guardrail in progress, not as a conformance claim. The kit makes
accessibility much easier to get right; it does not certify your screens.

---

## Contributing

The kit is developed in the
[starter-angular](https://github.com/4sh/starter-angular) repository — conventions,
commands and release flow are documented there.

---

## License

[Apache-2.0](./LICENSE) — Copyright 2026 4SH.
