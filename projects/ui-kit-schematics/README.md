# @4sh/ui-kit-schematics

_**English** · [Français](./README.fr.md)_

Companion package of **[`@4sh/ui-kit`](https://www.npmjs.com/package/@4sh/ui-kit)**:
it carries the _raw sources_ of the Design System components, and the Angular
schematics that copy them into a consuming project.

**Full documentation (Storybook)**:
<https://4sh.github.io/starter-angular/?path=/docs/introduction--docs>

---

## Install

```bash
ng add @4sh/ui-kit-schematics
```

One command: it lays the foundation (styles, design tokens, `angular.json`), then
asks which components to copy and copies them, dependencies included. The prompt
is a checkbox list — <kbd>space</kbd> to pick, <kbd>a</kbd> for all,
<kbd>i</kbd> to invert.

```
src/app/shared/
├── components/ui/{category}/{ui-name}/{ui-name}.ts   ← components only
└── ui-core/{forms|motion|overlay|theming|types}/     ← base directives, services, utils, types
```

Copied files belong to you: edit them freely. `ui-kit.json` records which
component came from which version, so `update` can later show you a per-file diff
against newer sources, to accept or skip.

> Each component ships with a **`.scss`** file, not `.css`: the foundation step sets
> `schematics.@schematics/angular:component.style` to `scss` in your `angular.json`,
> so `ng generate component` in your project keeps generating SCSS afterwards too —
> Angular's plain-CSS default is intentionally overridden.

|                                                     |                                                                           |
| --------------------------------------------------- | ------------------------------------------------------------------------- |
| `ng add @4sh/ui-kit-schematics`                     | foundation **and** components, in one go                                  |
| `ng add @4sh/ui-kit-schematics --skip-components`   | foundation only, pick components later                                    |
| `ng add @4sh/ui-kit-schematics --skip-install`      | skip `npm install` (project drives its own lockfile)                      |
| `ng add @4sh/ui-kit-schematics --skip-storybook`    | do not set up a Storybook (see below)                                     |
| `ng add @4sh/ui-kit-schematics --skip-mcp`          | do not declare the MCP server (see below)                                 |
| `ng add @4sh/ui-kit-schematics --gridaflex`         | set up the Gridaflex grid without being asked (`--no-gridaflex` skips it) |
| `ng generate @4sh/ui-kit-schematics:add`            | copy more components (interactive, or `--components ui-button ui-select`) |
| `ng generate @4sh/ui-kit-schematics:add --all`      | copy every available component, no prompt                                 |
| `ng generate @4sh/ui-kit-schematics:update`         | diff copied components against the published sources                      |
| `ng generate @4sh/ui-kit-schematics:update --force` | apply every update without a diff or a prompt (**overwrites your edits**) |

`ui-kit.json` sits at the root of your project, next to `package.json`.

> ⚠️ **`update` replaces, it does not merge.** Accepting a component writes the
> published version over yours — **your edits are lost**. Read the diff, carry over by
> hand what you want to keep, or skip the component. `--force` accepts everything without
> showing a single diff: keep it for components you have not touched.

### Catching up on the foundation

`update` only ever touches the components listed in `ui-kit.json`. Everything else
`ng add` laid down — the MCP server, the Storybook config, the tokens pipeline, the
`angular.json` targets, the dependencies — stays at the version of your original
install. A project set up before a given release never picks up what that release
added around the components: this is how a project installed at `0.2.0` and moved to
`0.5.0` never got the MCP server, which landed in `0.4.0`.

To re-apply the foundation, re-run `ng add` and skip the components:

```bash
ng add @4sh/ui-kit-schematics --skip-components
```

It is safe to re-run on an existing project. Your copied components are untouched,
an existing `.mcp.json` is merged rather than replaced (other servers are kept), and
your Prettier config and edited stylesheets are left alone — those rules only write
what is absent. One caveat worth knowing: a dependency **you** pinned may be widened
back to the range the kit asks for.

It is not done for you by `update`, and that is deliberate: nothing records whether a
missing piece is missing because it did not exist yet, or because you turned it down
with `--skip-mcp` or `--skip-storybook`. Re-applying it unasked would impose.

### Your own Storybook

Set up by default: when `ng add` returns, you have a working Storybook of the
components you copied:

```bash
npm run storybook
```

Each component arrives with its story and its MDX page, next to its sources. The
config lands in `storybook/` — `main.js`, `preview.ts`, the manager theme, the
brand switcher, and the shared _Foundations_ / _Specifications_ / _Configuration_
pages. The `storybook` and `build-storybook` targets are added to `angular.json`,
the devDependencies to `package.json`.

Two things make the doc _yours_ rather than a snapshot of ours. The _Theming_
tables are read off your own `.scss` at build time (`scripts/docs.config.mjs`
collects the `///` roles), so they describe your values, rebranding included. And
the globs cover `src/app/shared/components/**` whole: a story you write next to
your own component shows up with no config change.

`--skip-storybook` if you document elsewhere: no story, no MDX, no config, and
none of the preview devDependencies. The choice is recorded in `ui-kit.json`, and
`update` honours it — re-running `ng add` without the flag brings it back.

Not carried over: the `parameters.design` links to our Figma file — you cannot
open it, so it is stripped at copy time. Put your own `node-id` back if you have
one.

### Grid system (Gridaflex)

Asked, right after you pick your components: whether the project uses
**[Gridaflex](https://www.npmjs.com/package/gridaflex)**, the 24-column flexbox grid
the kit is designed around. Say yes and you get the dependency, its settings in
`src/styles/vendors/_gridaflex-settings.scss` (yours to retune: columns,
breakpoints, gutters) and the `@use` that loads them first in `src/styles/main.scss`.
Say no and none of the three appears.

`--gridaflex` / `--no-gridaflex` answers for you, for a scripted install; with no
terminal to prompt on (CI), the question is skipped and nothing is set up.

The settings file is created once and never overwritten afterwards, and declining
later never removes what an earlier install put in place. Note that the `ui-card`
and `ui-read-only` stories use Gridaflex classes (`flex-x`, `flex-gap-x`…) for
their layout: without the grid, those two render flat.

### AI agent (MCP server)

Also set up by default: a small MCP server copied into `.ui-kit-mcp/` (a bundled,
dependency-free file — 🔒 locked, refreshed on every `ng add`, like the styles
foundation — never hand-edit it), an `.mcp.json` entry declaring it (`node
.ui-kit-mcp/index.js` — nothing to fetch from the npm registry, it is already on
disk), and a short instruction appended to your `AGENTS.md` telling an MCP-aware
coding agent to query it — component API, tokens, full-text doc search — instead
of reading sources or guessing.

`.mcp.json` and `AGENTS.md` are additive: an existing `.mcp.json` keeps its other
servers, an existing `AGENTS.md` keeps its content, and re-running `ng add` never
duplicates the block. `--skip-mcp` if you do not use an MCP-aware agent, or manage
that config yourself.

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

`ng-packagr` _inlines_ templates and SCSS into the published `.mjs`. The sources
these schematics copy therefore exist nowhere in the kit's own tarball, which is
why they live here. That split has a deliberate consequence in both directions: a
library-mode consumer never downloads the raw sources, and a starter-mode consumer
never downloads the compiled kit.

## Versioning

**The two packages always carry the same version number**, stamped from the kit's
at assembly time. This package embeds a copy of the kit's sources, and that shared
number is what identifies _which_ kit a copied file came from — it is written into
the traceability header of every copied file, and into `ui-kit.json`.

> Reading the sources, do not trust the `version` of this package's own
> `package.json`: it is inert, overwritten with the kit's at assembly time
> (`scripts/schematics-package.build.mjs`). Only the published number is meaningful.

See [`docs/VERSIONING.md`](https://github.com/4sh/starter-angular/blob/main/docs/VERSIONING.md)
and [`docs/PUBLISHING.md`](https://github.com/4sh/starter-angular/blob/main/docs/PUBLISHING.md).

---

## License

Apache-2.0 — Copyright 2026 4SH.
