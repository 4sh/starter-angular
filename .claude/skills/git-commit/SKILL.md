---
name: git-commit
description: Create a git commit following this repo's conventions (Conventional Commits, CHANGELOG [Unreleased] entry, explicit staging, never push). Use when ready to commit changes.
disable-model-invocation: true
allowed-tools: Bash(git status), Bash(git diff:*), Bash(git log:*), Bash(git add:*), Bash(git commit:*), Bash(git rev-parse:*), Read, Edit
---

Create a git commit following the project conventions (`.claude/rules/git-conventions.md`, `docs/VERSIONING.md`).

## Steps

### 1. Analyze the current state

Run in parallel:

- `git status` — see modified/untracked files
- `git diff` — see staged and unstaged changes
- `git log --oneline -20` — see recent commit style
- `git rev-parse --abbrev-ref HEAD` — check the branch prefix (`feat/`, `fix/`, `chore/`, `breaking/`)

**Edge cases**:

- If `git status` shows no changes → tell the user and stop.
- If everything is already staged → skip step 5 (staging) and go directly to step 4 (confirm).

### 2. Check the CHANGELOG

Apply the CHANGELOG discipline from `.claude/rules/git-conventions.md`: if the change is
user-visible and no `## [Unreleased]` entry covers it, propose one (right Keep-a-Changelog
section), add it once approved, and stage `CHANGELOG.md` with the commit.

### 3. Draft the commit message

Format (Conventional Commits):

```
type(scope): imperative description
```

- **Types:** `feat`, `fix`, `chore`, `docs`, `refactor`, `style`, `test`
- **Scope:** component, token area, or tooling area (`button`, `tokens`, `storybook`…)
- Always in **English**, **imperative mood** (`add`, `fix`, `rename` — not `added`/`adds`)
- Breaking change → `!` after the scope (or `BREAKING CHANGE:` footer): `feat(tokens)!: rename actions.primary to actions.high`
- Body allowed only when needed (breaking change details); otherwise one line.

**If the changes cover multiple unrelated concerns**: warn the user and propose to
split into multiple atomic commits (one logical change each).

### 4. Show and confirm

Show the user:

- Files to be staged (including `CHANGELOG.md` if updated)
- The commit message

Ask for confirmation before proceeding.

### 5. Stage specific files

Stage files **explicitly by name** — never `git add .` or `git add -A`.

```bash
git add <file1> <file2> ...
```

### 6. Create the commit

Use a heredoc for the message:

```bash
git commit -m "$(cat <<'EOF'
type(scope): imperative description
EOF
)"
```

### 7. Verify

Run `git status` to confirm the commit succeeded.

## Examples

```
feat(button): add outlined variant
feat(tokens): add informative.highlightLow palette
fix(tokens): correct dark mode contrast on form.error
fix(table): stop infinite scroll loop under virtual scroll
refactor(field): extract spinner mixin into ui-config
docs(storybook): document Signal Forms interop in ui-input MDX
chore(deps): bump storybook to 10.5.4
```

## Absolute rules

- **NEVER run `git push`** — the developer pushes manually after review
- **NEVER use `git add .` or `git add -A`** — always stage files explicitly
