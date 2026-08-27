# Angular Starter

Angular 22 starter (standalone, signals, zoneless) for building a **fully in-house** design system,
with no dependency on a proprietary UI library. **Headless** components (Angular CDK +
native signals) styled exclusively through **design tokens**.

This is the **Starter Angular** side of the _Dual-Engine_ strategy:

- The **logic** depends on the stack: Angular CDK here (Radix UI on the React side).
- The layer shared across stacks = the **design tokens** (CSS variables).
- The **component styling is co-located** (Angular scoped `.scss`) and consumes these tokens.

This repo holds the **[`@4sh/ui-kit`](https://www.npmjs.com/package/@4sh/ui-kit)** package
(54 `ui-*` components on 53 entry points, plus 5 cross-cutting ones) and the demo
application that consumes it.

|                                                     |                                                                            |
| --------------------------------------------------- | -------------------------------------------------------------------------- |
| **Storybook** — component catalogue and foundations | <https://4sh.github.io/starter-angular/?path=/docs/introduction--docs>     |
| **Demo application** — the kit in a real app        | <https://4sh.github.io/starter-angular/demo/>                              |
| **Package**                                         | [npmjs.com/package/@4sh/ui-kit](https://www.npmjs.com/package/@4sh/ui-kit) |

Both sites are redeployed on every push to `main`
([`deploy-pages.yml`](.github/workflows/deploy-pages.yml)).

> **This page is for whoever works on the design system itself** — adding a `ui-*`
> component, editing the tokens, cutting a release. **To use the kit in an application you
> do not need this repo**: everything is in the README shipped with the package,
> [`projects/ui-kit/README.md`](projects/ui-kit/README.md) ·
> [Français](projects/ui-kit/README.fr.md).

---

## Stack

| Layer     | Tech                                                              |
| --------- | ----------------------------------------------------------------- |
| Framework | Angular 22 standalone, signals, zoneless                          |
| Behavior  | Components + `@angular/cdk`                                       |
| Style     | Co-located per component (scoped `.scss`) + CSS custom properties |
| Tokens    | JSON (Token Flow Manager) → `scripts/tokens.build.mjs` → SCSS     |
| Storybook | 10.x + addon-designs (Figma)                                      |
| Grid      | Gridaflex                                                         |
| Icons     | FontAwesome Free                                                  |

> **Stylesheets are SCSS (Sass), not the plain CSS Angular scaffolds by default.**
> `schematics.@schematics/angular:component.style` is set to `scss` in
> [`angular.json`](angular.json), and every component ships a `.scss` file — never
> `.css`. `ng generate component` in this repo therefore already generates the right
> extension; do not switch it back to `css`.

---

## Using the kit in an application

The kit is published on the public npm registry, in one of two modes:

```bash
pnpm add @4sh/ui-kit            # dependency — compiled components, updated by version bump
ng add @4sh/ui-kit-schematics   # starter — component sources copied into your project, yours to edit
```

Which one to pick, the entry points, the stylesheet to load, the required providers,
building your own field: **[`projects/ui-kit/README.md`](projects/ui-kit/README.md)** ·
[Français](projects/ui-kit/README.fr.md) — documented once, and that page _is_ the npmjs
one. Each component's API is in the
[Storybook](https://4sh.github.io/starter-angular/?path=/docs/introduction--docs).

---

## Working in this repo

Node `v24.15.0` ([`.nvmrc`](.nvmrc)). Four commands cover the work itself:

```bash
pnpm install       # install + postinstall: tokens:build, ui-kit:build, docs:config
pnpm start         # Storybook          → http://localhost:6006
pnpm serve         # demo application   → http://localhost:4200
pnpm tokens:build  # regenerate the token CSS variables
```

> Under IntelliJ, a `pnpm start` run configuration ships with the repo
> ([`.idea/runConfigurations/`](.idea/runConfigurations/pnpm_start.xml)).
>
> `pnpm start`, `pnpm serve` and the builds all run `ui-kit:build` first: the demo app
> consumes the kit through its **built** output (`dist/ui-kit`, mapped by the
> `@4sh/ui-kit/*` `paths` of `tsconfig.json`), exactly like an external consumer would.
>
> `projects/ui-kit/styles/generated/` and `storybook/generated/` are **generated**
> (gitignored), rebuilt by `tokens:build` and `docs:config`.

### Verifying

[`pr-checks.yml`](.github/workflows/pr-checks.yml) runs lint, types, unit tests, the doc
guardrail and a Storybook build on every pull request — **you do not have to replay them
locally**. Two are worth the detour anyway, because they save a round-trip:

```bash
pnpm lint               # ESLint --fix — repairs instead of reporting
pnpm docs:config:check  # the hand-written doc vs the code
```

`docs:config:check` is the guardrail on everything this repo states by hand: six places
claim to describe `projects/ui-kit/`, and nothing in the code forces them to follow when a
component lands. Full list of what it rejects: [`AGENTS.md`](AGENTS.md#commands).

---

## Contributing

Conventions to follow before writing code — repo layout, naming, CSS/SCSS rules (no BEM),
component creation recipe, Storybook file organization, token workflow — are all in
**[`AGENTS.md`](AGENTS.md)**. It is the single source of truth for them, for humans as
much as for AI agents.

|           |                                                                                                               |
| --------- | ------------------------------------------------------------------------------------------------------------- |
| Branch    | `feat/` · `fix/` · `chore/` · `breaking/` — the prefix drives the SemVer bump                                 |
| Commit    | `FSHSP-XXX type(scope): imperative description` — Jira key **first**, English, imperative                     |
| CHANGELOG | every user-visible change under `## [Unreleased]`; a doc-, CI- or Storybook-only change does not belong there |

Details: [`.claude/rules/git-conventions.md`](.claude/rules/git-conventions.md) for git,
[`docs/VERSIONING.md`](docs/VERSIONING.md) for the release flow.

---

## Releasing a new version

Once all your changes are on `main` (⚠️ **never push directly to `main`**), here's how
to publish a new version of the `@4sh/ui-kit` and `@4sh/ui-kit-schematics` npm packages
(same version, same job).

1. **Prepare the release, on `main`**: move `[Unreleased]` to a new
   `[X.Y.Z] - YYYY-MM-DD` section in `CHANGELOG.md`, bump the version in
   `projects/ui-kit/package.json`, commit.
2. **Publish**: _Actions → Publish @4sh/ui-kit to npm → Run workflow_ with
   `dry_run: true` first, then `dry_run: false` — this waits for reviewer approval on
   the `npm-publish` environment before actually publishing.
3. **Tag & release**: created **by the CI** after a successful publish — never tag or
   release by hand.

Full detail: [`docs/VERSIONING.md`](docs/VERSIONING.md) (when to bump what) ·
[`docs/PUBLISHING.md`](docs/PUBLISHING.md) (full publish workflow, npm auth).

---

## Going further

| Topic                           | Where                                                                                                         |
| ------------------------------- | ------------------------------------------------------------------------------------------------------------- |
| Consuming the package           | [`projects/ui-kit/README.md`](projects/ui-kit/README.md) ([FR](projects/ui-kit/README.fr.md))                 |
| Coding conventions in this repo | [`AGENTS.md`](AGENTS.md) · [`CLAUDE.md`](CLAUDE.md)                                                           |
| Versioning & releases           | [`docs/VERSIONING.md`](docs/VERSIONING.md) · [`CHANGELOG.md`](CHANGELOG.md)                                   |
| Publishing to npm               | [`docs/PUBLISHING.md`](docs/PUBLISHING.md)                                                                    |
| Schematics companion package    | [`projects/ui-kit-schematics/README.md`](projects/ui-kit-schematics/README.md)                                |
| Figma ↔ code workflow           | [`CLAUDE.md`](CLAUDE.md) · [`docs/figma-migration-global.md`](docs/figma-migration-global.md)                 |
| Security policy                 | [`SECURITY.md`](SECURITY.md) (reporting) · [`docs/SECURITY-PRACTICES.md`](docs/SECURITY-PRACTICES.md) (rules) |
