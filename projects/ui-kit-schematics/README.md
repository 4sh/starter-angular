# @4sh/ui-kit-schematics

***English** · [Français](./README.fr.md)*

Companion package of **[`@4sh/ui-kit`](https://www.npmjs.com/package/@4sh/ui-kit)**:
it carries the *raw sources* of the Design System components, and the Angular
schematics that copy them into a consuming project.

**Full documentation (Storybook)**:
<https://4sh.github.io/starter-angular/?path=/docs/introduction--docs>

---

## Install

```bash
ng add @4sh/ui-kit-schematics
```

One command: it lays the foundation (styles, design tokens, `angular.json`), then
asks which components to copy and copies them, dependencies included.

```
src/app/shared/
├── components/ui/{category}/{ui-name}/{ui-name}.ts   ← components only
└── ui-core/{forms|motion|overlay|theming|types}/     ← base directives, services, utils, types
```

Copied files belong to you: edit them freely. `ui-kit.json` records which
component came from which version, so `update` can later show you a per-file diff
against newer sources — never an automatic merge.

| | |
|---|---|
| `ng add @4sh/ui-kit-schematics` | foundation **and** components, in one go |
| `ng add @4sh/ui-kit-schematics --skip-components` | foundation only, pick components later |
| `ng add @4sh/ui-kit-schematics --skip-install` | skip `npm install` (project drives its own lockfile) |
| `ng generate @4sh/ui-kit-schematics:add` | copy more components (interactive, or `--components`, or `--all`) |
| `ng generate @4sh/ui-kit-schematics:update` | diff copied components against the published sources |

### `@4sh/ui-kit` is deliberately **not** installed

This path never puts the kit in `node_modules`, and that is the point: with it
absent, no import can reach its compiled code instead of your local copies — not
in the copied sources, and not in your editor's auto-import either.

## The other way: use it as a library

If you would rather consume compiled components and own no source, install
**[`@4sh/ui-kit`](https://www.npmjs.com/package/@4sh/ui-kit)** instead and follow
its own README — nothing is copied, and you track the kit's releases.

The two modes do not combine: pick the one that fits the project.

---

## Why a separate package

`ng-packagr` *inlines* templates and SCSS into the published `.mjs`. The sources
these schematics copy therefore exist nowhere in the kit's own tarball, which is
why they live here. That split has a deliberate consequence in both directions: a
library-mode consumer never downloads the raw sources, and a starter-mode consumer
never downloads the compiled kit.

## Versioning

**The two packages always carry the same version number**, stamped from the kit's
at assembly time. This package embeds a copy of the kit's sources, and that shared
number is what identifies *which* kit a copied file came from — it is written into
the traceability header of every copied file, and into `ui-kit.json`.

See [`docs/VERSIONING.md`](https://github.com/4sh/starter-angular/blob/main/docs/VERSIONING.md)
and [`docs/PUBLISHING.md`](https://github.com/4sh/starter-angular/blob/main/docs/PUBLISHING.md).

---

## License

Apache-2.0 — Copyright 2026 4SH.
