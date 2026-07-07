# Changelog

Toutes les évolutions notables de ce Design System sont documentées dans ce fichier.

Le format suit [Keep a Changelog](https://keepachangelog.com/fr/1.1.0/) et le projet adhère à [Semantic Versioning](https://semver.org/) (voir [VERSIONING.md](./VERSIONING.md)).

> Phase de construction des fondations : tout reste versionné `0.1.0`. Le versioning
> sémantique sera activé une fois la base stabilisée.

## [Unreleased]

## [0.1.0]

### Added
- Socle du Design System Angular 21 **headless** (standalone + signals), sans librairie UI propriétaire ; Angular CDK au besoin
- Pipeline de design tokens : sources DTCG (`src/design-tokens/*.json`) → Style Dictionary (`scripts/tokens.build.mjs`, `tokens.config.json`) → variables SCSS/CSS générées
- Architecture de tokens : primitives, semantics, metrics, typography, responsive, transitions
- Multi-marque (brand1/2/3) et clair/sombre via `[data-brand]` / `[data-theme]`, pilotés par `BrandService` et `ThemeService`
- Styles composites (`src/design-tokens/styles.json`) : ombres en variables `--shadow-{catégorie}-{taille}` **et** classes utilitaires `.shadow-{catégorie}-{taille}`
- `ui-config` (`src/styles/src/settings/_ui-config.scss`) : constantes structurelles partagées (focus ring, bordure, taille des contrôles, transition, champ `$form-field-*`) sur 3 niveaux — global / catégorie / composant — + mixin `control-transition()`
- Polices auto-hébergées (variable fonts DM Sans + Inter) via `src/styles/src/vendors/_fonts.scss`
- Composants UI génériques : `ui-button` (patron de référence), `ui-icon`, `ui-image`
- Composants de formulaire headless (`ControlValueAccessor` via `BaseControlValueAccessor` ; input natif invisible superposé ; erreur auto invalide + touché) :
  - `ui-label` (marqueur requis, tailles, hook `--ui-label-color`)
  - `ui-checkbox` (`indeterminate`, `trueValue`/`falseValue`)
  - `ui-radio` (groupe natif par `name`)
  - `ui-toggle` (interrupteur, `role="switch"`, `trueValue`/`falseValue`)
- Famille de champs de saisie sur un **shell partagé** `ui-field` + base `BaseFormField` (label + boîte + helper + états + `errorText`) :
  - `ui-input` (text/password/email/tel/url/search ; icône gauche, unité, **zone d'action** droite pour reveal/clear)
  - `ui-input-number` (`min`/`max`/`step`, spinner ±, flèches clavier, clamp au blur, formatage `Intl` locale/devise/groupement, `role="spinbutton"`)
  - `ui-input-mask` (tokens `9`/`a`/`*`, littéraux auto-insérés, gestion fine du caret, `unmask`)
- Composants informatifs : `ui-helper` (texte d'aide/feedback, niveaux + icône déduite, `ariaLive`), `ui-badge` (compteur/statut, `level` × `subLevel`, point)
- Types partagés de niveaux (`UiLevel`, `UiSubLevel`, `UiFeedbackLevel`) dans `src/app/shared/types/ui-level.ts`
- Storybook 10 (addon-designs Figma, dark-mode) : stories & MDX **co-localisées** par composant dans `src/`, documentation globale dans `storybook/docs/` ; pages `Overview` (galerie par catégorie), `Foundations`, `Spécifications`
- Skill de génération de composant `ui-*` depuis un YAML Figma (`.claude/skills/`)
- Documentation projet (`CLAUDE.md`, `AGENTS.md`) et workflow de versioning (`VERSIONING.md`)

### Changed
- `BaseControlValueAccessor` complété (setDisabledState, état `showError`, désabonnement automatique)
- `ui-icon` : boîte **carrée adaptative** (`aspect-ratio: 1`) pour un encombrement prévisible quelle que soit l'avance du glyphe FontAwesome
- Explorateur `Foundations/Colors` : bascule marque + mode en direct, y compris en mode clair

### Fixed
- Storybook (dark) : le recolor typographique global n'écrase plus les couleurs de tokens des composants rendus (canvas + docs)
- Page `Foundations/Shadows` : les aperçus utilisent les tokens d'ombre existants
- Explorateur `Colors` : la marque fonctionne aussi en mode clair (sélecteur `[data-theme='light']`)

### Removed
- Type `UiSize` (inutilisé)
