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

## Branch convention

| Prefix | Usage | Expected SemVer |
|---|---|---|
| `feat/<name>` | New feature | MINOR |
| `fix/<name>` | Bug fix | PATCH |
| `chore/<name>` | Tooling, internal refactoring | no release |
| `breaking/<name>` | API/tokens breakage | MAJOR |

## Commit convention (optional)

[Conventional Commits](https://www.conventionalcommits.org/) format:

```
feat(button): add outlined variant
fix(tokens): correct dark mode contrast on form.error
feat(tokens)!: rename actions.primary to actions.high
```

The `!` or `BREAKING CHANGE:` in the body indicates a MAJOR.
