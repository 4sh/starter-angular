# Git conventions

Full release workflow (SemVer bumps, `npm version`, tags): see `docs/VERSIONING.md`.

## Commit format — Conventional Commits

```
FSHSP-XXX type(scope): imperative description
```

- **The Jira ticket key comes first**, before the type — never in brackets at the end.
  It keeps the ticket readable in `git log --oneline`.
- Types: `feat`, `fix`, `chore`, `docs`, `refactor`, `style`, `test`
- Scope: the component, token area, or tooling area (`button`, `tokens`, `storybook`, `assets`…)
- English, imperative mood (`add`, `fix`, `rename` — not `added`/`adds`)
- Breaking change: `!` after the scope, or a `BREAKING CHANGE:` footer → MAJOR

```
FSHSP-42 feat(button): add outlined variant
FSHSP-58 fix(tokens): correct dark mode contrast on form.error
FSHSP-61 feat(tokens)!: rename actions.primary to actions.high
```

Commits made before this rule carry the key at the end (`… [FSHSP-90]`); the history is
left as is.

## Branches

| Prefix            | Usage                         | SemVer     |
| ----------------- | ----------------------------- | ---------- |
| `feat/<name>`     | New feature                   | MINOR      |
| `fix/<name>`      | Bug fix                       | PATCH      |
| `chore/<name>`    | Tooling, internal refactoring | no release |
| `breaking/<name>` | API/tokens breakage           | MAJOR      |

## Jira tickets (project `FSHSP`)

- A bug with no ticket: **create one** (type `Bug`) before committing the fix.
- Keep the description short — symptom, where, root cause, fix. A wall of text is not read.
- **Move the ticket without being asked**: `DEV IN PROGRESS` when work starts,
  `CLOSE PROPOSED` once the fix is committed.

## CHANGELOG discipline

Every user-visible change (component, token, visual behavior) adds an entry to
`CHANGELOG.md` under `## [Unreleased]` in the right Keep-a-Changelog section
(`Added` / `Changed` / `Deprecated` / `Removed` / `Fixed`) — before the commit
that ships it.

## Restrictions

- **Never `git push`** unless the user explicitly asks.
- Stage files explicitly by name — never `git add .` or `git add -A`.
- **Never add a `Co-Authored-By` trailer** in any form.
