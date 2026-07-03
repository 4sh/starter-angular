# Versioning

Ce projet suit [Semantic Versioning](https://semver.org/) adapté à un Design System.

Format : `MAJOR.MINOR.PATCH`

## Quand bumper

| Bump | Quand |
|---|---|
| **MAJOR** | Breaking change : rename/suppression d'un token, suppression d'un composant, changement d'API d'un input |
| **MINOR** | Nouveau composant, nouveau token, nouvelle variante non-breaking |
| **PATCH** | Fix visuel, fix bug, ajustement de valeur d'un token existant sans rename |

Tant que la version commence par `0.x.y`, l'API est considérée comme instable : les évolutions `MINOR` peuvent contenir des breaking changes documentés dans le CHANGELOG. Le passage à `1.0.0` fige l'API publique.

## Workflow de release

1. Travail sur une branche `feat/*`, `fix/*`, `chore/*` ou `breaking/*`
2. Ajouter une ligne dans `CHANGELOG.md` sous `## [Unreleased]` dans la bonne section (`Added` / `Changed` / `Deprecated` / `Removed` / `Fixed`)
3. PR → merge sur `main`
4. Au moment de release :
   - Déplacer le contenu de `[Unreleased]` vers une nouvelle section `[X.Y.Z] - YYYY-MM-DD`
   - `npm version major|minor|patch` (bump `package.json` + commit + tag)
   - `git push --follow-tags`

## Convention de branches

| Préfixe | Usage | SemVer attendu |
|---|---|---|
| `feat/<nom>` | Nouvelle fonctionnalité | MINOR |
| `fix/<nom>` | Correction de bug | PATCH |
| `chore/<nom>` | Tooling, refacto interne | hors release |
| `breaking/<nom>` | Rupture d'API/tokens | MAJOR |

## Convention de commits (optionnel)

Format [Conventional Commits](https://www.conventionalcommits.org/) :

```
feat(button): add outlined variant
fix(tokens): correct dark mode contrast on form.error
feat(tokens)!: rename actions.primary to actions.high
```

Le `!` ou `BREAKING CHANGE:` dans le body indique un MAJOR.
