# Versioning

This project follows [Semantic Versioning](https://semver.org/) adapted to a Design System.

Format: `MAJOR.MINOR.PATCH`

## When to bump

| Bump | When |
|---|---|
| **MAJOR** | Breaking change: rename/removal of a token, removal of a component, API change of an input |
| **MINOR** | New component, new token, new non-breaking variant |
| **PATCH** | Visual fix, bug fix, adjustment of an existing token value without rename |

As long as the version starts with `0.x.y`, the API is considered unstable: `MINOR` releases may contain breaking changes documented in the CHANGELOG. Moving to `1.0.0` freezes the public API.

## Release workflow

1. Work on a `feat/*`, `fix/*`, `chore/*` or `breaking/*` branch
2. Add a line in `CHANGELOG.md` under `## [Unreleased]` in the right section (`Added` / `Changed` / `Deprecated` / `Removed` / `Fixed`)
3. PR → merge into `main`
4. At release time, on `main`:
   - Move the `[Unreleased]` content to a new `[X.Y.Z] - YYYY-MM-DD` section
   - Bump the version in **`projects/ui-kit/package.json`** — that is the one that
     gets published, and the one the tag is named after. Keep the root
     `package.json` in step with it; `npm version` at the root bumps only the
     demo app, which is `private` and never published.
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
