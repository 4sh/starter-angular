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
4. At release time:
   - Move the `[Unreleased]` content to a new `[X.Y.Z] - YYYY-MM-DD` section
   - `npm version major|minor|patch` (bumps `package.json` + commit + tag)
   - `git push --follow-tags`

## Branch and commit conventions

Branch prefixes (`feat/`, `fix/`, `chore/`, `breaking/`), the Conventional
Commits format and the CHANGELOG discipline are defined **once**, in
[`.claude/rules/git-conventions.md`](../.claude/rules/git-conventions.md).

What matters here is only how they map onto a release: the branch prefix
announces the expected bump, and a `!` after the scope (or a `BREAKING CHANGE:`
footer) forces a MAJOR — see the table at the top of this page.
