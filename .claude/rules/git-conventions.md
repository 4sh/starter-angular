# Git conventions

Full release workflow (SemVer bumps, `npm version`, tags): see `docs/VERSIONING.md`.

## Commit format — Conventional Commits

```
type(scope): imperative description
```

- Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `style`, `test`
- Scope: the component, token area, or tooling area (`button`, `tokens`, `storybook`, `assets`…)
- English, imperative mood (`add`, `fix`, `rename` — not `added`/`adds`)
- Breaking change: `!` after the scope, or a `BREAKING CHANGE:` footer → MAJOR

```
feat(button): add outlined variant
fix(tokens): correct dark mode contrast on form.error
feat(tokens)!: rename actions.primary to actions.high
```

## Branches

| Prefix | Usage | SemVer |
|---|---|---|
| `feat/<name>` | New feature | MINOR |
| `fix/<name>` | Bug fix | PATCH |
| `chore/<name>` | Tooling, internal refactoring | no release |
| `breaking/<name>` | API/tokens breakage | MAJOR |

## CHANGELOG discipline

Every user-visible change (component, token, visual behavior) adds an entry to
`CHANGELOG.md` under `## [Unreleased]` in the right Keep-a-Changelog section
(`Added` / `Changed` / `Deprecated` / `Removed` / `Fixed`) — before the commit
that ships it.

## Restrictions

- **Never `git push`** unless the user explicitly asks.
- Stage files explicitly by name — never `git add .` or `git add -A`.
- **Never add a `Co-Authored-By` trailer** in any form.
