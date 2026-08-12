# @4sh/ui-kit

***English** · [Français](./README.fr.md)*

*Headless* Angular components from the 4SH Design System: logic and accessibility
built in natively (signals + Angular CDK), styling driven by design tokens.

**Full documentation (Storybook)**:
<https://4sh.github.io/starter-angular/?path=/docs/introduction--docs>

---

## Installation

```bash
npm install @4sh/ui-kit
```

Published on the **public npm registry**, under the **`4sh`** organization:
[npmjs.com/package/@4sh/ui-kit](https://www.npmjs.com/package/@4sh/ui-kit)

Dependencies are declared as `peerDependencies` — the version already present in
your application is the one used (never a second copy of Angular):
`@angular/core`, `@angular/common`, `@angular/forms`, `@angular/router`,
`@angular/cdk`, `@angular/platform-browser` and `rxjs`.

---

## À la carte imports (secondary entry points)

Every component is exposed through its own *entry point*. You import what you
need, and tree-shaking drops the rest from your final bundle:

```ts
import { UiButton } from '@4sh/ui-kit/ui-button';
import { UiIcon } from '@4sh/ui-kit/ui-icon';
```

> `@4sh/ui-kit` is **a single npm package**. Entry points are not installed
> separately: they are all there from the moment you install, and dependencies
> between them resolve automatically (importing `UiDatepicker` pulls in whatever
> it needs, you have nothing to declare).

### Available entry points

**53 components**, one entry point each — the entry point is named after the
component: `@4sh/ui-kit/ui-button`, `@4sh/ui-kit/ui-select`,
`@4sh/ui-kit/ui-datepicker`…

| Family | Entry points |
|---|---|
| Actions | `ui-button` · `ui-button-split` · `ui-link` |
| Forms | `ui-input` · `ui-textarea` · `ui-select` · `ui-autocomplete` · `ui-datepicker` · `ui-checkbox` · `ui-radio` · `ui-toggle` · `ui-slider` · `ui-nudger` · `ui-rating` · `ui-segment-control` · `ui-input-number` · `ui-input-mask` · `ui-input-otp` · `ui-input-tags` · `ui-input-group` · `ui-file-upload` · `ui-field` · `ui-label` |
| Informative | `ui-alert` · `ui-toast` · `ui-badge` · `ui-chip` · `ui-tag` · `ui-avatar` · `ui-avatar-group` · `ui-accordion` · `ui-tooltip` · `ui-spinner` · `ui-skeleton` · `ui-progress-bar` · `ui-empty-state` · `ui-read-only` · `ui-separator` · `ui-helper` |
| Layout | `ui-card` · `ui-modal` · `ui-drawer` · `ui-popover` |
| Navigation | `ui-menu` · `ui-context-menu` · `ui-tabs` · `ui-stepper` · `ui-sidebar` · `ui-breadcrumb` |
| Table | `ui-table` · `ui-paginator` |
| Misc | `ui-icon` · `ui-image` |

Plus the cross-cutting entry points:

| Entry point | Contents |
|---|---|
| `@4sh/ui-kit/forms` | Form field foundation — see below |
| `@4sh/ui-kit/theming` | `ThemeService` (light/dark, `[data-theme]`) · `BrandService` (`[data-brand]`) · `provideUiKitBrand()` |
| `@4sh/ui-kit/motion` | `UiMotion` directive + animation presets |
| `@4sh/ui-kit/overlay` | Helpers for CDK overlay components (`closeOnNavigation`) |
| `@4sh/ui-kit/types` | Cross-cutting types (`UiLevel`, `UiSubLevel`, `UiFeedbackLevel`) |

---

## Configuration required by some components

Two components need a piece of data the kit cannot know about — it is therefore
**injected** by the application rather than hardcoded:

```ts
// app.config.ts
import { brandFromSubdomain, provideUiKitBrand } from '@4sh/ui-kit/theming';
import { provideUiImageAssets } from '@4sh/ui-kit/ui-image';
import assetsMap from './assets/assets-map.json';

providers: [
  // active brand — how you detect it (subdomain, user setting…) is up to you
  provideUiKitBrand(brandFromSubdomain(subdomain)),
  // map of YOUR project's local assets, consumed by `ui-image` (`name` input)
  provideUiImageAssets(assetsMap),
]
```

Both are **optional**: without them the brand defaults to `brand1`, and
`ui-image` only renders its remote images (`src`), `name` falling back to the
placeholder.

---

Example — using only the date picker, without pulling the rest of the kit into
your bundle:

```ts
import { UiDatepicker } from '@4sh/ui-kit/ui-datepicker';

@Component({
  selector: 'app-booking',
  imports: [UiDatepicker],
  template: `<ui-datepicker label="Date" valueType="date" [(ngModel)]="date" />`,
})
export class Booking { date = signal<Date | null>(null); }
```

---

## Styles: loading the kit's stylesheet

The components are **headless**: no color, size or spacing is hardcoded —
everything is read from CSS variables. The package **ships** that stylesheet,
to be loaded **once**, globally:

```jsonc
// angular.json
"styles": [
  "node_modules/@4sh/ui-kit/styles.css",   // ← tokens + base + typography + motion
  "src/styles/main.scss"
]
```

`styles.css` contains the design tokens (all 3 brands, light/dark, responsive),
the base layer, the typography classes and the animation presets of the
`UiMotion` directive. **Without it, components render unstyled.**

`@font-face` rules are **not** included: the tokens merely *name* the families
(`--fontfamily-base`). Ship your own fonts and override `--fontfamily-*` if
needed.

### Writing your own styles on the kit's foundation

The SCSS sources ship with the package: your own components can use the same
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

---

## `@4sh/ui-kit/forms` — form field foundation

This entry point gathers the infrastructure shared by every field in the kit.
**You do not need to import it to use an existing field** (`UiInput`,
`UiSelect`, `UiDatepicker`… already pull it in). It becomes useful when you
build **your own field** while reusing the kit's conventions.

| Export | Role |
|---|---|
| `BaseControlValueAccessor<T>` | Implements `ControlValueAccessor` and mirrors the state of the attached `NgControl` into signals (`touched`, `dirty`, `controlInvalid`, `controlErrors`, `showError`). This is what makes a field compatible in one go with `[(ngModel)]`, Reactive Forms **and** Signal Forms. |
| `BaseFieldControl<T>` | A "bare" control, with no chrome: common inputs (`ariaLabel`, `inputId`, `name`, `required`, `disabled`, `readonly`, `invalid`, `tabindex`), accessible `id` generation, `modelValue`, derived `isDisabled`/`isInvalid` states. Base of `ui-checkbox`, `ui-toggle`, `ui-slider`, `ui-radio`, `ui-nudger`. |
| `BaseFormField<T>` | Extends the previous one with the "box" chrome: `label`, `helperText`, `errorText`, `size`, `level`, plus `effectiveLevel` / `displayMessage` / `displayValue`. Base of `ui-input`, `ui-select`, `ui-datepicker`, `ui-textarea`… |
| `dropdownOverlayPositions()` | Standard CDK anchoring for a dropdown panel (below the field, flipped above when needed). |
| `maskEngine` | Shared input mask engine (`ui-input-mask`, `ui-datepicker`). |
| `option-resolver`, `format-label`, `warn-missing-accessible-name` | Option resolution, label formatting and accessibility guardrail helpers. |

### Building your own field

```ts
import { Component, forwardRef } from '@angular/core';
import { NG_VALUE_ACCESSOR } from '@angular/forms';
import { BaseFormField } from '@4sh/ui-kit/forms';

@Component({
  selector: 'app-my-field',
  templateUrl: './my-field.html',
  providers: [
    { provide: NG_VALUE_ACCESSOR, useExisting: forwardRef(() => MyField), multi: true },
  ],
})
export class MyField extends BaseFormField<string> {
  // `writeValue` is provided by default (writes into `modelValue`).
  // Call `emitChange(value)` on input and `emitTouch()` on blur.
}
```

---

## Contributing (development inside this repo)

```bash
npm run ui-kit:build   # builds the package into dist/ui-kit
npm run ui-kit:pack    # + produces a tarball installable elsewhere
npm run storybook      # component catalogue (port 6006)
```

Publishing: see [`docs/PUBLISHING.md`](../../docs/PUBLISHING.md) (manual GitHub
Actions workflow, `4sh-package-admin` service account).

⚠️ **Hard rule for imports internal to the package**: always use the real
package name (`@4sh/ui-kit/ui-icon`), never a relative path to another entry
point nor a shortcut. `ng-packagr` only detects a dependency between entry
points if the import literally starts with the package name; otherwise the
compilation order becomes undefined and the build fails intermittently.

---

## License

[Apache-2.0](./LICENSE) — Copyright 2026 4SH.
