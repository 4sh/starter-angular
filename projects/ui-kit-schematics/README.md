# @4sh/ui-kit-schematics

***English** · [Français](./README.fr.md)*

Companion package of **[`@4sh/ui-kit`](https://www.npmjs.com/package/@4sh/ui-kit)**:
it carries the *raw sources* of the Design System components, and the Angular
schematics that copy them into a consuming project.

**Full documentation (Storybook)**:
<https://4sh.github.io/starter-angular/?path=/docs/introduction--docs>

---

## ⚠️ Do not install this package directly

You never install it yourself, and you never pin its version. It is pulled in
automatically by the kit:

```bash
ng add @4sh/ui-kit
```

Everything is documented on
[`@4sh/ui-kit`](https://www.npmjs.com/package/@4sh/ui-kit) — that is the package
to read, and the only one to depend on.

---

## Why a separate package

`ng-packagr` *inlines* templates and SCSS into the published `.mjs`. The sources
that `ng generate @4sh/ui-kit:add` has to copy therefore exist nowhere in the
kit's own tarball. Keeping them here has a deliberate consequence: a regular
consumer of `@4sh/ui-kit`, who only imports compiled components, never downloads
them.

The kit exposes a schematics facade holding no logic, which delegates to this
package. That is the whole relationship between the two.

## Contents

| | |
|---|---|
| `ng-add` | foundation: styles, tokens, `angular.json` |
| `add` | copies components into the project (interactive selection, or `--all`) |
| `update` | per-component diff against the published sources |
| `assets/` | the raw component sources, plus the token generation chain |

## Versioning

**The two packages always carry the same version number**, stamped from the
kit's at assembly time — the kit's facade requires the companion in
`^<kit version>`. There is nothing to keep in sync by hand, and no reason to
pin this package yourself.

See [`docs/VERSIONING.md`](https://github.com/4sh/starter-angular/blob/main/docs/VERSIONING.md)
and [`docs/PUBLISHING.md`](https://github.com/4sh/starter-angular/blob/main/docs/PUBLISHING.md).

---

## License

Apache-2.0 — Copyright 2026 4SH.
