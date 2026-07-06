# Changelog

Toutes les évolutions notables de ce Design System sont documentées dans ce fichier.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le projet adhère à [Semantic Versioning](https://semver.org/) (voir [VERSIONING.md](./VERSIONING.md)).

## [Unreleased]

## [0.2.0] - 2026-07-03

### Added
- Composants de formulaire headless : `ui-checkbox`, `ui-radio`, `ui-label`
  - Input natif invisible superposé au contrôle stylé (clavier, lecteur d'écran, `<label>` cliquable natifs)
  - `ControlValueAccessor` via `BaseControlValueAccessor` (standalone, `[(ngModel)]`, reactive forms)
  - États d'erreur automatiques (invalide + touché/modifié), `indeterminate`, `trueValue`/`falseValue`
- `ui-helper` : texte d'aide / de feedback contextuel (niveaux `default`/`highlight`/`success`/`warning`/`error`, icône FontAwesome déduite du niveau, `ariaLive` pour les feedbacks dynamiques)
  - Type partagé `UiFeedbackLevel` (`src/app/shared/types/ui-level.ts`)
- Styles composites (`src/design-tokens/styles.json`) : ombres générées en variables `--shadow-{catégorie}-{taille}` **et** classes utilitaires `.shadow-{catégorie}-{taille}` (format de sortie `composite-styles`)
- `ui-config` (`src/styles/src/settings/_ui-config.scss`) : constantes structurelles partagées (focus ring, bordure, taille des contrôles, transition) sur 3 niveaux — global / catégorie / composant — + mixin `control-transition()`
- Polices auto-hébergées (variable fonts DM Sans + Inter) via `src/styles/src/vendors/_fonts.scss`
- Pages Storybook : `Overview` (galerie par catégorie), `Foundations/Shadows`, `Spécifications/Configuration (ui-config)`

### Changed
- `BaseControlValueAccessor` complété (setDisabledState, état `showError`, désabonnement automatique)
- Explorateur `Foundations/Colors` : bascule marque + mode en direct, y compris en mode clair

### Fixed
- Page `Foundations/Shadows` : les aperçus utilisent les tokens d'ombre existants
- Explorateur `Colors` : la marque fonctionne aussi en mode clair (sélecteur `[data-theme='light']`)

## [0.1.0] - 2026-06-01

### Added
- Socle du Design System Angular 21 **headless** (standalone + signals), sans librairie UI propriétaire ; Angular CDK au besoin
- Pipeline de design tokens : sources DTCG (`src/design-tokens/*.json`) → Style Dictionary (`scripts/tokens.build.mjs`, `tokens.config.json`) → variables SCSS/CSS générées
- Architecture de tokens : primitives, semantics, metrics, typography, responsive, transitions
- Multi-marque (brand1/2/3) et clair/sombre via `[data-brand]` / `[data-theme]`, pilotés par `BrandService` et `ThemeService`
- Composants UI génériques : `ui-button` (patron de référence), `ui-icon`, `ui-image`
- Grille Gridaflex, icônes FontAwesome Free
- Storybook 10 avec addon-designs (panel Figma) et dark-mode
- Documentation projet (`CLAUDE.md`, `AGENTS.md`) et workflow de versioning (`VERSIONING.md`)
