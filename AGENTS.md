# AGENTS.md — Starter Angular Headless (Design System)

> Point d'entrée unique pour tout agent IA. Lis ce fichier en premier, puis consulte les sources de vérité indiquées. Pour le volet Figma (génération/audit de composants), voir `CLAUDE.md`.

---

## Stack

| Technologie | Rôle |
|---|---|
| Angular 21 | Framework — standalone, Signals API obligatoire |
| Composants headless | Aucune librairie UI propriétaire ; Angular CDK au besoin (overlay, a11y, focus-trap) |
| Design Tokens JSON | `src/design-tokens/*.json` (DTCG) → Style Dictionary → variables CSS générées |
| Gridaflex 1.0.0 | Grille flexbox (24 col) + breakpoints, configurée par les tokens |
| FontAwesome Free | Icônes, via le composant `ui-icon` |
| Storybook 10 | **Source de vérité** — composants, tokens, fondations |

Polices embarquées en local (DM Sans + Inter, variable fonts) : `src/styles/src/vendors/_fonts.scss`.

---

## ⚠️ Règle absolue — Lire avant de coder

**Storybook est la source de vérité.** Ne jamais deviner l'API d'un composant, ses variantes ou ses tokens.

| Question | Où chercher |
|---|---|
| Composants existants / feuille de route | `src/app/shared/components/components-index.md` |
| API d'un composant (`inputs`, `outputs`, types) | `src/app/shared/components/ui/**/ui-<nom>/ui-<nom>.stories.ts` → `argTypes` (co-localisée) |
| Couleurs, tokens sémantiques | Storybook → `Foundations / Colors` (explorateur marque + mode) |
| Typographie | Storybook → `Foundations / Typography` |
| Ombres & effets | Storybook → `Foundations / Shadows` |
| Pipeline tokens, thème, responsive | Storybook → `Spécifications / *` |
| Composant Angular source | `src/app/shared/components/ui/<catégorie>/ui-<nom>/` |
| **Patron de référence** | `src/app/shared/components/ui/actions/ui-button/` (+ `ui-icon`) |

---

## Architecture

```
src/
  app/
    core/
      controlValueAccessor/  # BaseControlValueAccessor (composants de formulaire)
      service/               # ThemeService ([data-theme]) · BrandService ([data-brand])
    shared/
      components/
        components-index.md  # Sommaire : composants réalisés ✅ / à construire ⬜
        ui/                  # Composants génériques headless — source de vérité du DS
          actions/           # ui-button (patron de référence)
          ui-icon/           # Icônes FontAwesome
        domain/              # Composants métier (préfixe projet) — à créer par projet
      types/                 # Types partagés (ui-level…)
  design-tokens/             # JSON sources des tokens (export Figma / Token Flow)
  styles/
    main.scss                # Point d'entrée global
    src/
      generated/             # _tokens-*.scss — GÉNÉRÉ, ne pas éditer
      vendors/               # gridaflex-settings.scss, _fonts.scss
      base/                  # base, typographie (classes utilitaires)

storybook/
  stories/
    foundations/             # Colors.mdx, Typography.mdx, Shadows.mdx
    specifications/          # design-tokens.mdx, theme.mdx, responsive.mdx
    components/ui/           # Stories + MDX par composant
tokens.config.json           # Config du pipeline tokens (collections, modes, sorties)
scripts/tokens.build.mjs     # Build Style Dictionary → src/styles/src/generated/
```

Le style de chaque composant est **co-localisé** dans son `.scss` (scopé Angular) et ne
consomme **que** des variables CSS de tokens. Le global (`src/styles/`) ne contient que les
tokens générés, les vendors et des utilitaires.

---

## Conventions de nommage

### Composants UI (génériques)

| Élément | Convention | Exemple |
|---|---|---|
| Sélecteur Angular | `ui-<nom>` | `ui-button` |
| Classe TypeScript | `Ui<Nom>` | `UiButton` |
| Fichier | `ui-<nom>.ts` (sans `.component`) | `ui-button.ts` |
| Story & doc | co-localisées : `src/app/shared/components/ui/<cat>/ui-<nom>/ui-<nom>.stories.ts` + `ui-<nom>.mdx` | `ui-button.stories.ts` |
| Import alias | Toujours `@app/` | `@app/shared/components/ui/...` |

### Composants Métier (domain)

| Élément | Convention | Exemple |
|---|---|---|
| Sélecteur Angular | `<prefix>-<nom>` | `ds-button-critical` |
| Classe TypeScript | `<Prefix><Nom>` | `DsButtonCritical` |
| Fichier | `<prefix>-<nom>.ts` | `ds-button-critical.ts` |

> ⚠️ Le **prefix** est défini par le projet (ex: `ds`, `myapp`, `crm`). Il n'est pas fixé dans
> le starter — demander au projet avant de créer un composant métier. Les composants `domain/`
> **instancient** des composants `ui/`, ils ne recopient jamais leur style.

---

## Règles de code non-négociables

### Angular Signals — toujours

```typescript
// ✅
label = input<string>();
name = input.required<string>();
level = input<'high' | 'low'>('high');
buttonClick = output<MouseEvent>();

// ❌ interdit
@Input() label: string;
@Output() click = new EventEmitter();
```

### Templates — invoquer les inputs

```html
<!-- ✅ -->
[label]="label()"   [disabled]="disabled()"

<!-- ❌ -->
[label]="label"
```

### CSS / SCSS — tokens & structure (pas de BEM)

- **Tokens uniquement** : jamais de couleur/espacement/radius en dur. S'adapter au light/dark.
- **Naming** : racine `.ui-<nom>` ; sous-élément `&-<part>` (→ `.ui-button-icon`) ; modificateur `&._<modifier>` (→ `._small`, `._high`).
- **États interactifs** (`hover`/`focus`/`active`/`disabled`) : pseudo-classes CSS via les tokens d'état (ex. `--actions-high-surface-hover`), **jamais** des classes modifier ni des props Angular.
- **Ordre des déclarations** : Layout → Metrics → Couleurs → Style → Interaction.

```scss
/* ✅ */
.ui-button {
  display: flex;                                 /* Layout */
  padding: var(--units-sm);                      /* Metrics */
  color: var(--global-high-content-default);     /* Couleurs */
  cursor: pointer;                               /* Interaction */

  &-icon { … }        // → .ui-button-icon
  &._small { … }      // modificateur

  &:hover { background: var(--actions-high-surface-hover); }
}

/* ❌ */
color: #333;
```

> Nommage des variables générées : `--primitives-*`, `--units-*` / `--radius-*` / `--stroke-*` /
> `--shadow-*` (metrics, **sans préfixe `metrics-`**), sémantiques sans préfixe
> (`--actions-high-surface-default`), `--fontfamily-*`, `--transition-*`.

### Commentaires SASS (à respecter en génération IA)

Rester **sobre** : le code se suffit à lui-même, on ne commente que le **non-évident** (recette,
piège, point d'extension). Pas de paraphrase de ce que fait la ligne suivante.

- **En-tête de fichier** — bloc encadré, 1 ligne de titre + éventuellement 1 à 3 lignes de note :
  ```scss
  // =====================================================================
  // <nom> : <rôle en une ligne>.
  //
  // <note optionnelle, terse — mécanisme / extension uniquement>
  // =====================================================================
  ```
  Composants : `<nom> : co-located styles. All values come from design tokens.`
- **En-ligne** — pour flaguer un choix non-évident, en fin de ligne (`// …`) ; jamais pour décrire l'évident.
- **Sections** — séparateurs courts `// --- <Titre> ---` pour découper un fichier long.
- **Mixins/fonctions** — 1 à 2 lignes `///` : rôle + exemple d'appel. Pas de tartine.
- **Langue** : commentaires en **anglais**.

### Constantes structurelles partagées — `ui-config`

Les valeurs structurelles communes aux composants (largeur du focus ring, taille des contrôles
de formulaire, recette de transition…) vivent dans **`src/styles/src/settings/_ui-config.scss`**
(exposé par `@use 'utils'`), en 3 niveaux : global UI → catégorie (`$form-*` / `$action-*`) →
composant.

```scss
// Dans un composant : consommer la valeur de catégorie via une variable LOCALE.
$focus-ring-width: utils.$form-focus-ring-width; // ← remplacer la valeur ici pour
                                                 //    ajuster CE composant uniquement
```

- Changer une valeur dans `_ui-config.scss` = tout le kit suit d'un coup.
- Une nouvelle valeur partagée par ≥ 2 composants → la remonter dans `ui-config` (niveau
  catégorie si propre à forms/actions, global sinon). Une valeur mono-composant reste locale.
- Transitions d'état : `@include utils.control-transition(background-color, border-color, …)`.
- `ui-config` porte des **choix de tokens** (structure) ; les couleurs thémables restent des
  design tokens runtime — ne jamais y mettre une couleur.

### Thème, marque, modes (runtime)

| Dimension | Attribut sur `<html>` | Service |
|---|---|---|
| Clair / Sombre | `[data-theme='dark']` (light = défaut) | `ThemeService` (`src/app/core/service/theme.service.ts`) |
| Marque | `[data-brand='brand2'\|'brand3']` (brand1 = défaut) | `BrandService` (dérivé du sous-domaine) |
| Viewport | `@media (min-width: …)` | — (tokens responsive) |

> ❌ Les classes `.light-mode` / `.dark-mode` n'existent plus. Voir Storybook →
> `Spécifications / Thème & Système de Tokens` pour l'API des services.

### Accessibilité

- `<button>` / `<a>` natifs — pas de `<div>` cliquable ; `disabled` natif.
- `aria-label` obligatoire en icon-only ; icônes décoratives en `aria-hidden`.
- `:focus-visible` toujours visible et distinct du hover.

### Documentation (MDX)

- **Tableaux** : toujours en balises HTML (`<table>`, `<tr>`, `<td>`) plutôt qu'en Markdown natif dans les `.mdx`, pour garantir rendu et contrôle CSS.

---

## Workflows

### Modifier un composant ui-* existant

1. Lire `src/app/shared/components/ui/<cat>/ui-<nom>/ui-<nom>.stories.ts` → identifier `argTypes`
2. Lire `src/app/shared/components/ui/<cat>/ui-<nom>/` → vérifier types et structure
3. Modifier `.ts`, `.html`, `.scss` (tokens uniquement)
4. Mettre à jour la story + le `.mdx` si l'API change
5. Vérifier light + dark + les 3 marques (Storybook → `Foundations / Colors` pour les tokens)

### Créer un composant ui-* (générique)

1. Vérifier `components-index.md` (roadmap, nom prévu)
2. Recopier le **patron `ui-button`** : structure fichiers, signals + `computed()` pour les classes, SCSS co-localisé
3. Créer la story + le `.mdx` **co-localisés** dans le dossier du composant `src/app/shared/components/ui/<cat>/ui-<nom>/` (doc globale uniquement → `storybook/docs/`)
4. Cocher le composant dans `components-index.md`

### Créer un composant métier (domain)

Comme un `ui-*`, mais : préfixe projet, dossier `domain/`, et **composition d'instances `ui-*`** (jamais de copie de style).

### Ajouter / modifier un token

1. Éditer `src/design-tokens/*.json` (les sémantiques référencent les primitives ; jamais de primitive directement dans un composant)
2. `npm run tokens:build` (ajout de collection/mode → éditer `tokens.config.json`, pas le script)
3. Vérifier dans Storybook `Foundations / Colors`

---

## Commandes

```bash
npm start                # Lancer Storybook (source de vérité) — alias de npm run storybook
npm run serve            # Lancer l'app Angular (démo minimale)
npm run tokens:build     # Régénérer les variables CSS depuis les JSON
npm run build-storybook  # Build statique de Storybook
npm run lint             # ESLint --fix
```
