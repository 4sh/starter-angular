# Angular Starter

Angular 22 starter (standalone, signals, zoneless) for building a **fully in-house** design system,
with no dependency on a proprietary UI library. **Headless** components (Angular CDK +
native signals) styled exclusively through **design tokens**.

This is the **Starter Angular** side of the *Dual-Engine* strategy:

- The **logic** depends on the stack: Angular CDK here (Radix UI on the React side).
- The layer shared across stacks = the **design tokens** (CSS variables).
- The **component styling is co-located** (Angular scoped `.scss`) and consumes these tokens.

This repo holds the **[`@4sh/ui-kit`](https://www.npmjs.com/package/@4sh/ui-kit)** package
(54 `ui-*` components on 53 entry points, plus 5 cross-cutting ones) and the demo
application that consumes it.

| | |
|---|---|
| **Storybook** — component catalogue and foundations | <https://4sh.github.io/starter-angular/?path=/docs/introduction--docs> |
| **Demo application** — the kit in a real app | <https://4sh.github.io/starter-angular/demo/> |
| **Package** | [npmjs.com/package/@4sh/ui-kit](https://www.npmjs.com/package/@4sh/ui-kit) |

Both sites are redeployed on every push to `main`
([`deploy-pages.yml`](.github/workflows/deploy-pages.yml)).

---

## Stack

| Layer        | Tech |
|--------------|---|
| Framework    | Angular 22 standalone, signals, zoneless |
| Behavior     | Components + `@angular/cdk` |
| Style        | Co-located per component (scoped `.scss`) + CSS custom properties |
| Tokens       | JSON (Token Flow Manager) → `scripts/tokens.build.mjs` → SCSS |
| Storybook    | 10.x + addon-designs (Figma) |
| Grid         | Gridaflex |
| Icons        | FontAwesome Free |

---

## Using the kit in an application

**You do not need this repo.** The kit is published on the public npm registry and
consumed in one of two modes:

```bash
npm install @4sh/ui-kit         # dependency — compiled components, updated by version bump
ng add @4sh/ui-kit-schematics   # starter — component sources copied into your project, yours to edit
```

Starter mode goes through the companion package, and deliberately leaves
`@4sh/ui-kit` out of `node_modules`: the one command lays the foundation and
copies the components you pick, `--with-storybook` brings their documentation
along, and `ng generate @4sh/ui-kit-schematics:update` replays their diff after a
kit release.

Everything a consumer needs — choosing between the two modes, the list of entry
points, the stylesheet to load, the providers expected by `ui-image` and
`BrandService`, building your own field on `@4sh/ui-kit/forms` — is documented
**once**, in the README shipped with the package (which is also what the npmjs
page displays):

**[`projects/ui-kit/README.md`](projects/ui-kit/README.md)** ·
[Français](projects/ui-kit/README.fr.md)

The API of each component, the tokens, the themes and the responsive rules are in
the [Storybook](https://4sh.github.io/starter-angular/?path=/docs/introduction--docs).

---

## Working in this repo

Only needed to build the design system itself: add or modify a `ui-*` component,
edit the tokens, cut a release.

```bash
npm install                 # install + postinstall: tokens:build, ui-kit:build, docs:config
npm start                   # Storybook          → http://localhost:6006
npm run serve               # demo application   → http://localhost:4200
npm run tokens:build        # regenerate the token CSS variables
npm run ui-kit:build        # build the package into dist/ui-kit
npm run lint                # ESLint --fix
npm test                    # unit tests on the kit
npm run docs:config:check   # ← run this before committing documentation
```

> `npm start`, `npm run serve` and the builds all run `ui-kit:build` first: the demo app
> consumes the kit through its **built** output (`dist/ui-kit`, mapped by the
> `@4sh/ui-kit/*` `paths` of `tsconfig.json`), exactly like an external consumer would.
>
> `projects/ui-kit/styles/generated/` and `storybook/generated/` are **generated**
> (gitignored), rebuilt by `tokens:build` and `docs:config`.

**`docs:config:check` is the guardrail on everything this repo states by hand.** Six
places claim to describe `projects/ui-kit/` — the two package READMEs, `Overview.mdx`,
[`docs/components-index.md`](docs/components-index.md) and two announced counts — and
nothing in the code forces them to follow when a component lands. It also fails on an
off-convention `--ui-*` name, a hook with no `///` (public, yet invisible in the doc), an
alias pointing at a token that does not exist, and the figures quoted in
[`figma/README.md`](figma/README.md). Run by
[`pr-checks.yml`](.github/workflows/pr-checks.yml) on every pull request.

Conventions to follow before writing code — repo layout, naming, CSS/SCSS rules
(no BEM), component creation recipe, Storybook file organization, token workflow —
are all in **[`AGENTS.md`](AGENTS.md)**. It is the single source of truth for
them, for humans as much as for AI agents.

---

## Going further

| Topic | Where |
|---|---|
| Consuming the package | [`projects/ui-kit/README.md`](projects/ui-kit/README.md) ([FR](projects/ui-kit/README.fr.md)) |
| Coding conventions in this repo | [`AGENTS.md`](AGENTS.md) · [`CLAUDE.md`](CLAUDE.md) |
| Versioning & releases | [`docs/VERSIONING.md`](docs/VERSIONING.md) · [`CHANGELOG.md`](CHANGELOG.md) |
| Publishing to npm | [`docs/PUBLISHING.md`](docs/PUBLISHING.md) |
| Schematics companion package | [`projects/ui-kit-schematics/README.md`](projects/ui-kit-schematics/README.md) |
| Figma ↔ code workflow | [`CLAUDE.md`](CLAUDE.md) · [`docs/figma-migration-global.md`](docs/figma-migration-global.md) |
| Security policy | [`SECURITY.md`](SECURITY.md) |
