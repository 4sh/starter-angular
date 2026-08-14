# Versioning

This project follows [Semantic Versioning](https://semver.org/) adapted to a Design System.

Format: `MAJOR.MINOR.PATCH`

## Scope: one version number, two published packages

SemVer applies to **`projects/ui-kit/package.json`** only — that is the artifact
published as `@4sh/ui-kit`, the one a consumer's `package.json` pins a version
against.

`@4sh/ui-kit-schematics` (the raw sources the starter copies, see
[`PUBLISHING.md`](./PUBLISHING.md)) is published from the same repo, at the same
time, carrying **the same number** — stamped from the kit's at assembly time
rather than maintained separately. It has no version of its own to bump: the
number written in `projects/ui-kit-schematics/package.json` is a development
placeholder and is overwritten by the build.

That lockstep is not cosmetic. The kit's `ng-add` requests the companion as
`^<kit version>`, so the two moving independently would break `ng add` for
consumers. It also means the table below is read against the **kit**: a change
confined to the schematics still ships under the kit's next version.

The root `package.json` (demo app + Storybook tooling) is **not** versioned in
step with it. Nothing depends on it: it is never published, `private: true`, and
its own version number carries no meaning to anyone outside this repo. Bumping it
alongside `projects/ui-kit` was a drafting convenience from before the package
existed (see `0.1.2`'s history) — not a deliberate choice, and there is no reason
to keep it. It can drift, stay put, or get dropped entirely; nothing consumes it.

## When to bump `projects/ui-kit`

| Bump | When |
|---|---|
| **MAJOR** | Breaking change: rename/removal of a token, removal of a component, API change of an input, entry point renamed/removed, new `peerDependency` or a raised floor on an existing one, a schematic option removed or renamed |
| **MINOR** | New component, new token, new non-breaking variant, new entry point, a new schematic or a new option on an existing one |
| **PATCH** | Visual fix, bug fix, adjustment of an existing token value without rename, fix inside a schematic that leaves its options untouched |

As long as the version starts with `0.x.y`, the API is considered unstable: `MINOR` releases may contain breaking changes documented in the CHANGELOG. Moving to `1.0.0` freezes the public API.

## No release without a tarball change

**If neither `projects/ui-kit` nor `projects/ui-kit-schematics` changed, there is
no release** — no version bump,
no tag, no CHANGELOG entry, no publish. A change scoped to Storybook (stories,
MDX, `storybook/` config), the demo app, CI, or documentation ships by merging to
`main` like any other change: Storybook and the demo app redeploy on every push to `main`
([`deploy-pages.yml`](../.github/workflows/deploy-pages.yml)), completely
independently of [`publish-ui-kit.yml`](../.github/workflows/publish-ui-kit.yml),
which only ever runs on manual dispatch. There is nothing to gate.

`0.1.2` published with an unchanged tarball on purpose, to prove the tag+release
chain on a version with nothing at stake — that was a one-off exercise, not a
precedent. Do not reproduce it: a version with an identical tarball to its
predecessor should not exist.

## Release workflow

1. Work on a `feat/*`, `fix/*`, `chore/*` or `breaking/*` branch
2. Add a line in `CHANGELOG.md` under `## [Unreleased]` in the right section (`Added` / `Changed` / `Deprecated` / `Removed` / `Fixed`) — **only if the change touches `projects/ui-kit`** (see above)
3. PR → merge into `main`
4. At release time, on `main`:
   - Move the `[Unreleased]` content to a new `[X.Y.Z] - YYYY-MM-DD` section
   - Bump the version in **`projects/ui-kit/package.json`** — that is the one that
     gets published, and the one the tag is named after. The root `package.json`
     is left untouched.
   - Commit and push (no tag needed — see below)
5. Run the publish workflow ([`PUBLISHING.md`](./PUBLISHING.md))

## Tag and GitHub release: produced by the CI

Neither is created by hand. The `release` job of
[`publish-ui-kit.yml`](../.github/workflows/publish-ui-kit.yml) runs **after a
successful `npm publish`** and creates the `vX.Y.Z` tag on the published commit,
plus the GitHub release whose body is the `[X.Y.Z]` section of `CHANGELOG.md`.

Hanging it off the publish job is what makes the release trustworthy: it exists
only if the registry accepted the tarball, and it points at the exact commit that
produced it. A tag pushed manually carries no such guarantee — that is how
`0.1.0` and `0.1.1` ended up on npm with no tag at all.

Consequence: **the `[X.Y.Z]` section must exist in `CHANGELOG.md` before you
publish.** The `verify` job checks it (via `scripts/changelog.section.mjs`), so a
`dry_run: true` run reports a missing section *before* the irreversible publish.

Pushing a tag yourself still works — `npm version` + `git push --follow-tags` —
and the release job reuses an existing tag rather than creating one. It is simply
no longer necessary.

## Branch and commit conventions

Branch prefixes (`feat/`, `fix/`, `chore/`, `breaking/`), the Conventional
Commits format and the CHANGELOG discipline are defined **once**, in
[`.claude/rules/git-conventions.md`](../.claude/rules/git-conventions.md).

What matters here is only how they map onto a release: the branch prefix
announces the expected bump, and a `!` after the scope (or a `BREAKING CHANGE:`
footer) forces a MAJOR — see the table at the top of this page.
