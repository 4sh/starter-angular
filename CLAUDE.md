# Design System : Angular Headless → Figma

## À lire avant toute action

Ce repository est un Design System Angular 21 (standalone) **100% maison** : composants
**headless** (Angular CDK + signals natifs) stylés exclusivement via des design tokens.

C'est le volet « Starter Angular » de la stratégie **Double-Moteur** : la *logique* dépend
de la stack (Angular CDK ici, Radix côté React). La couche réellement partagée entre stacks
= les **design tokens** (variables CSS). Le style des composants est **co-localisé** (scopé
au composant Angular) et consomme ces tokens.

Avant de générer quoi que ce soit dans Figma, tu **dois** auditer le composant Angular source.

---

## Stack technique

| Couche | Technologie |
|---|---|
| Framework | Angular 21, standalone, signals API |
| Comportement (headless) | Composants maison + Angular CDK (overlay, a11y, focus-trap…) |
| Style | Co-localisé par composant (`.scss` scopé) + CSS custom properties (`--var`) |
| Design Tokens | JSON (Token Flow Manager) → `scripts/tokens.build.mjs` → SCSS (`src/styles/src/generated/`) |
| Storybook | v10.1.11 + addon-designs (Figma panel) |
| Thèmes | themeOne (purple), themeTwo, themeThree × light/dark (via classes `._themeX` / `.dark-mode`) |
| Icons | FontAwesome Free |
| Grid | Gridaflex 1.0.0 |

> **Patron de référence** : `src/app/shared/components/ui/actions/ui-button/`. Tout nouveau
> composant `ui-*` se construit sur ce modèle (signals + classes de l'ADN visuel SCSS).

**Figma file** : `https://www.figma.com/design/XgSemnGLFrAq75CxcjPVf1/-Projet----UI-Kit`

---

## Architecture des tokens

### Hiérarchie obligatoire

```
primitives/   → couleurs brutes (50-900 par palettes)
    ↓
semantics/    → tokens de sens (global.high.content.default)
    ↓
metrics/      → espacement, radius, stroke, shadow
typography/   → familles, tailles, poids
responsive/   → sizing par breakpoint
transitions/  → durées, easing
```

### Catégories sémantiques (`semantics.json`)

```
global.{modeLight|modeDark}.{high|low}.{content|surface|stroke}.{default|hover|focused|pressed|disabled}
token.{modeLight|modeDark}.actions.{high|low|success|warning|error}.{content|surface|stroke}.{states}
token.{modeLight|modeDark}.form.{high|low|success|error}.{content|surface|stroke}.{states}
token.{modeLight|modeDark}.informative.{defaultHigh|defaultLow|highlightHigh|...}
token.{modeLight|modeDark}.navigation.{high|low}.{states}
token.{modeLight|modeDark}.table.{head|body|footer}.{content|surface|stroke}
effects.{modeLight|modeDark}.{default|highlight|success|warning|error}
```

### Métriques (`metrics.json`)

| Catégorie | Valeurs disponibles |
|---|---|
| Spacing | 2xs (2px), xs (4px), sm (8px), md (12px), lg (16px), xl (24px), 2xl (32px), 3xl (40px), 4xl (56px) |
| Radius | 2xs, xs, sm, md, lg, xl, 2xl, full |
| Stroke | sm (1px), default (2px), lg (4px) |
| Shadow | sm, md, lg |

---

## Règles strictes : Tokens

**INTERDIT** :
- Aucune couleur hexadécimale hardcodée dans Figma
- Aucune valeur numérique d'espacement hors de `metrics`
- Aucun `font-size` hors de `typography`
- Aucun `border-radius` hors de `metrics.radius`
- Aucun style dupliqué (toujours une variable Figma)

**OBLIGATOIRE** :
- Toujours lire `src/design-tokens/semantics.json` avant de choisir une couleur
- Toujours utiliser les tokens sémantiques, jamais les primitifs directement dans les composants
- Les tokens Figma doivent porter les mêmes noms que les tokens SCSS générés dans `src/styles/src/generated/`
- Chaque couleur doit exister en mode light ET dark

---

## Architecture des composants Angular

### Structure de fichiers

```
ui-{name}/
├── ui-{name}.ts          ← logique + inputs (signals), classes calculées via computed()
├── ui-{name}.html        ← template HTML natif headless (+ Angular CDK si besoin)
├── ui-{name}.scss        ← STYLE CO-LOCALISÉ du composant (scopé au composant)
├── ui-{name}.stories.ts  ← story Storybook CO-LOCALISÉE
└── ui-{name}.mdx         ← doc Storybook CO-LOCALISÉE
```

> La **story et la doc MDX d'un composant sont co-localisées** dans son dossier. La doc
> **globale** (fondations, guidelines, design system) vit dans `storybook/docs/`. Config :
> `storybook/main.js`.

> Le **style de chaque composant est co-localisé** dans son propre `.scss` (styles scopés
> Angular). Le global (`src/styles/`) ne contient QUE les tokens générés + des utilitaires.
> Toutes les valeurs (couleur, espacement, radius…) proviennent des variables CSS de tokens.
> Patron de référence : `ui-button` (+ `ui-icon`).

### Catégories

| Catégorie | Préfixe sélecteur | Emplacement |
|---|---|---|
| UI générique | `ui-` | `src/app/shared/components/ui/` |
| Domaine métier | `sp-` ou préfixe projet | `src/app/shared/components/domain/` |

### Patterns signals (Angular 17+)

```typescript
// Inputs
label = input<string>();                    // optionnel
name = input.required<string>();            // requis
level = input<'high' | 'low'>('high');      // avec défaut
disabled = input<boolean>(false);

// Outputs
buttonClick = output<MouseEvent>();

// Computed (classes CSS, état dérivé)
wrapperClass = computed(() => {
  const classes = ['component-root'];
  if (this.error()) classes.push('is-error');
  return classes.join(' ');
});
```

---

## Mapping Angular inputs → Figma Properties

| Angular (input) | Figma (component property) | Type Figma |
|---|---|---|
| `level: 'high'\|'low'\|'success'\|'warning'\|'error'\|'info'\|'danger'` | `Level` | Variant |
| `size: 'small'\|undefined\|'large'` | `Size` | Variant |
| `outlined: boolean` | `Outlined` | Boolean |
| `disabled: boolean` | `State = disabled` | Variant (dans State) |
| `iconLeft: string\|null` | `Icon Left` | Boolean |
| `iconRight: string\|null` | `Icon Right` | Boolean |
| `label: string` | `Label` | Text |
| `state: 'default'\|'success'\|'error'\|'warning'\|'neutral'` | `State` | Variant |
| `active: boolean` | `Active` | Boolean |
| `readonly: boolean` | `State = readonly` | Variant (dans State) |
| `error: string\|null` | inclus dans `State = error` | Variant |

### Règle états interactifs

Les états interactifs (`hover`, `focused`, `pressed`, `disabled`) ne sont **jamais** des props Angular (gérés par CSS/tokens). Dans Figma, ce sont des **variants de State**, pas des Component Properties booléennes séparées.

---

## Architecture variants Figma

### Règle fondamentale

**Préférer Component Properties aux explosions de variants.**

```
MAUVAIS : 1 variant pour chaque combinaison (high+small+outlined+icon = 1 frame)
→ explosion combinatoire

BON : Component Properties séparées qui se composent
→ Level [high|low|success|warning|error]
→ Size [default|small|large]
→ Outlined [true|false]
→ Has Icon [true|false]
→ State [default|hover|focused|pressed|disabled]
```

### Structure attendue pour chaque composant Figma

```
ComponentSet "{ComponentName}"
├── Variants primaires (les states visuels distincts)
│   ├── Level=high, State=default
│   ├── Level=high, State=hover
│   ├── Level=high, State=focused
│   ├── Level=high, State=disabled
│   ├── Level=low, State=default
│   └── ...
└── Component Properties (composition)
    ├── Boolean: "Has Label", "Has Icon Left", "Has Icon Right"
    ├── Text: "Label"
    └── Instance swap: "Icon"
```

### Règle de nommage des variants

- Noms en PascalCase pour les properties : `Level`, `State`, `Size`
- Valeurs en lowercase : `high`, `low`, `default`, `hover`, `small`
- Pas d'espace, pas de tiret dans les noms de properties
- State toujours en dernier dans la liste des properties

---

## Règles Auto Layout

**Toujours utiliser Auto Layout**, jamais de frames à position fixe pour les composants.

| Cas | Règle |
|---|---|
| Composant avec label | `direction: horizontal`, `align: center`, `gap: metrics.sm (8px)` |
| Liste verticale | `direction: vertical`, `gap: metrics.md ou lg` |
| Padding interne | Utiliser `metrics.sm/md/lg` pour padding horizontal et vertical |
| Expand | `fill container` sur le child principal, jamais de width hardcodée |
| Icon seul | `width/height: fixed` selon size token |
| Composant full-width | Contrainte `fill` sur le parent |

**INTERDIT** :
- `position: absolute` sur les éléments dans un composant
- Dimensions fixes hardcodées hors des tokens `metrics`
- Padding asymétrique non justifié par le design token

---

## Règles Accessibilité

Chaque composant Figma **doit** avoir :
- Un nom de layer descriptif (pas "Frame 42", mais "Button/High/Default")
- La propriété Figma `aria-label` renseignée sur les éléments interactifs
- Contraste de couleur conforme WCAG 2.1 AA minimum (vérifier avec les tokens sémantiques)
- Les états `focused` visibles et distincts des états `hover`
- Les états `disabled` avec opacité ou couleur token `disabled` (jamais seulement `opacity: 0.5` hardcodé)

---

## Règles Storybook → Figma

Chaque story avec un `parameters.design.url` Figma **doit** correspondre à un composant Figma existant.

Format URL attendu dans les stories :
```typescript
parameters: {
  design: {
    type: 'figma',
    url: 'https://www.figma.com/design/XgSemnGLFrAq75CxcjPVf1/-Projet----UI-Kit?node-id=XX-XX',
  },
}
```

Règle : le `node-id` du paramètre Figma doit pointer sur le **ComponentSet** (ensemble de variants), pas sur une instance.

---

## Règles Naming

### Figma

| Élément | Convention | Exemple |
|---|---|---|
| ComponentSet | `ComponentName` | `Button` |
| Variant frame | `Level=high, State=default` | - |
| Layer racine | `{prefix}/{category}` | `ui/button` |
| Variable collection | `Semantics`, `Metrics`, `Typography` | - |
| Variable token | `{category}/{subcategory}/{property}` | `actions/high/surface/default` |
| Mode | `Light`, `Dark` | - |
| Theme | `ThemeOne`, `ThemeTwo`, `ThemeThree` | - |

### Angular (existant : ne pas changer)

| Élément | Convention |
|---|---|
| Sélecteur UI | `ui-{kebab-case}` |
| Sélecteur domaine | `sp-{kebab-case}` |
| Classe TypeScript | `Ui{PascalCase}` |
| Input type union | `type {Name}Variant = '...' \| '...'` |

### Classes CSS/SCSS (OBLIGATOIRE : pas de BEM)

> ⚠️ **Ne PAS utiliser la notation BEM** (`ui-button__icon`, `ui-button--active`).

| Élément | Convention | SCSS | Exemple |
|---|---|---|---|
| Racine | `ui-{name}` | `.ui-{name}` | `.ui-button` |
| Sous-élément | `ui-{name}-{part}` | `&-{part}` | `&-icon` → `.ui-button-icon` |
| Modifier | `_{modifier}` (préfixe `_`) | `&._{modifier}` | `&._small`, `&._high`, `&._active` |

```scss
.ui-button {
  &-icon { … }        // → .ui-button-icon
  &-label { … }       // → .ui-button-label
  &._small { … }      // modifier
  &._high { … }       // modifier de niveau
}
```

États interactifs (`hover`/`focus`/`active`/`disabled`) = **pseudo-classes CSS**, jamais des classes modifier.

---

## Règles de Composition

- Un composant Figma ne doit **jamais** copier/coller les styles d'un autre : il doit l'**instancier**
- Les composants `domain/` utilisent des instances de composants `ui/`
- Pas de nesting de ComponentSets (un composant dans un composant = instance, pas inclusion de sets)
- Les icônes sont des instances FontAwesome ou du système d'icônes, jamais des formes dessinées

---

## Règles Scalabilité

- Un composant ne doit pas avoir plus de **5 properties Figma** top-level (sinon décomposer)
- Si un composant a plus de **30 variants**, revoir l'architecture properties vs variants
- Les tokens de couleur doivent être dans des collections de variables Figma (pas des styles de couleur)
- Les modes light/dark s'appliquent **toujours** via les modes de variables, jamais via duplication de composants
- Les 3 thèmes s'appliquent via la sélection de collection, jamais via duplication

---

## Règles Anti-Duplication

- Une couleur n'apparaît **qu'une fois** : dans le token primitif. Toutes les références passent par les tokens sémantiques
- Si deux composants partagent une apparence, créer un composant de base commun
- Pas de frame de documentation dupliquée : utiliser les stories Storybook comme source unique de vérité
- Si un style est répété 3 fois, créer une variable Figma

---

## Workflow obligatoire avant génération Figma

**Étape 1 : Analyse du composant Angular**
```
1. Lire le fichier .ts → identifier tous les inputs et leur type
2. Lire le fichier .html → identifier la structure DOM
3. Lire le fichier .scss → identifier les classes de state et les overrides
4. Lire la story Storybook → identifier les argTypes et les states documentés
5. Identifier le node-id Figma existant dans la story (si présent)
```

**Étape 2 : Mapping tokens**
```
1. Pour chaque couleur CSS utilisée → trouver le token sémantique correspondant
2. Pour chaque espacement → trouver la valeur metrics correspondante
3. Pour chaque état interactif → mapper sur les states sémantiques
4. Vérifier que light ET dark sont couverts
```

**Étape 3 : Architecture Figma**
```
1. Définir les properties du ComponentSet (pas les variants individuels)
2. Lister les states visuellement distincts (nécessitant des variants)
3. Définir les Component Properties composables (booléens, text, instance swap)
4. Définir les bindings de variables Figma
```

**Étape 4 : Génération**
```
1. Utiliser use_figma pour créer le composant
2. Appliquer les variables Figma pour toutes les couleurs
3. Configurer Auto Layout
4. Créer les variants de states
5. Configurer les Component Properties
6. Vérifier la conformité avec la checklist
```

---

## Checklist de conformité composant Figma

Avant de valider un composant Figma :

- [ ] Aucune couleur hexadécimale hardcodée (toutes bindées à des variables)
- [ ] Aucun espacement hors des tokens metrics
- [ ] Auto Layout sur tous les frames (pas de position absolue)
- [ ] Nommage des layers descriptif et cohérent
- [ ] States interactifs couverts (default, hover, focused, disabled minimum)
- [ ] Mode light ET dark fonctionnels via modes de variables
- [ ] ComponentSet avec Component Properties (pas explosion de variants)
- [ ] node-id à jour dans la story Storybook
- [ ] Accessibilité : contraste WCAG AA vérifié

---

## Mode "Design System Reviewer"

Quand l'utilisateur demande un audit d'un composant Figma, appliquer cette grille :

### Détection mauvais variants
- Variants redondants (même apparence visuelle)
- Variants qui devraient être des Component Properties booléennes
- Plus de 30 variants pour un seul composant → proposer restructuration

### Détection hardcoded values
- Couleurs hexadécimales non bindées à des variables Figma
- Nombres de padding/gap/spacing qui ne correspondent à aucun token metric
- Font-size/weight/family hardcodés hors des variables typography

### Détection problèmes scalabilité
- Duplication de composants au lieu d'instanciation
- Styles de couleur au lieu de variables Figma
- Modes light/dark implémentés par copie au lieu de modes de variables
- Thèmes implémentés par duplication au lieu de collections

### Détection mauvaises properties Figma
- Property `Disabled` booléenne alors que c'est un State
- Properties Angular `error`/`success`/`warning` séparées alors qu'elles devraient être un seul `State`
- Absence de property pour les contenus variables (label, icon)

### Détection problèmes Auto Layout
- Frames sans Auto Layout dans un composant
- Dimensions fixed sur des éléments qui devraient être `fill`
- Padding/gap sans binding sur les tokens metrics

### Détection violations tokens
- Primitif utilisé directement dans un composant (ex: `primary.500` au lieu de `actions.high.surface.default`)
- Token d'une catégorie utilisé dans une autre (ex: token `navigation` sur un bouton)

---

## Templates de prompts réutilisables

### 1. Analyse composant Angular

```
Analyse le composant Angular suivant pour préparer sa création dans Figma :
- Lis `src/app/shared/components/{category}/{name}/{name}.ts`
- Lis `src/app/shared/components/{category}/{name}/{name}.html`
- Lis `src/app/shared/components/{category}/{name}/{name}.scss`
- Lis `src/app/shared/components/{category}/{name}/{name}.stories.ts` (co-localisée)
Produis :
1. Liste des inputs avec types et valeurs par défaut
2. États visuels distincts (variants Figma nécessaires)
3. Component Properties composables suggérées
4. Mapping vers les tokens sémantiques pour chaque couleur/espacement
5. Problèmes potentiels d'architecture Figma
```

### 2. Génération composant Figma depuis Angular

```
Crée le composant Figma pour `{ComponentName}` en suivant le workflow obligatoire :
1. Analyse le composant Angular source
2. Mappe tous les tokens
3. Définis l'architecture variants/properties
4. Génère avec use_figma dans le fichier XgSemnGLFrAq75CxcjPVf1
5. Applique les variables Figma (zéro hardcode)
6. Configure Auto Layout
7. Retourne le node-id pour mise à jour de la story Storybook
```

### 3. Audit composant Figma

```
Audite le composant Figma node-id="{nodeId}" du fichier XgSemnGLFrAq75CxcjPVf1 en mode Design System Reviewer :
- Détecte les hardcoded values
- Détecte les mauvais variants
- Détecte les violations de tokens
- Détecte les problèmes Auto Layout
- Détecte les problèmes de scalabilité
Produis un rapport avec : problèmes critiques / améliorations / conformité globale (%)
```

### 4. Migration Storybook → Figma

```
Pour le composant dont la story est `src/app/shared/components/{path}/{name}/{name}.stories.ts` (co-localisée) :
1. Extrait tous les argTypes et leurs valeurs possibles
2. Identifie le node-id Figma actuel dans `parameters.design.url`
3. Vérifie que le composant Figma couvre toutes les stories exportées
4. Liste les stories manquantes dans Figma
5. Propose le plan de mise à jour
```

### 5. Optimisation variants

```
Audite l'architecture variants du ComponentSet Figma "{ComponentName}" :
1. Liste toutes les properties actuelles
2. Identifie les variants qui devraient être des Component Properties
3. Identifie les Component Properties manquantes
4. Calcule la réduction de variants possible
5. Propose la nouvelle architecture avec justification
6. Implémente la refactorisation si approuvée
```

---

## Variables Figma : Structure attendue

### Collections à créer dans Figma

```
Collection: "Primitives" (modes: ThemeOne, ThemeTwo, ThemeThree)
Collection: "Semantics" (modes: Light, Dark)
  └── Référence les variables Primitives
Collection: "Metrics" (mode unique)
Collection: "Typography" (mode unique)
```

### Nommage des variables Figma (aligne avec les tokens SCSS)

```
Semantics/global/high/content/default
Semantics/global/high/surface/default
Semantics/token/actions/high/surface/default
Semantics/token/actions/high/surface/hover
Semantics/token/form/error/stroke/default
Metrics/spacing/sm
Metrics/spacing/md
Metrics/radius/sm
Typography/fontFamily/base
Typography/fontSize/md
```

---

## Style des composants : Points d'attention Figma

Les composants sont **headless maison**. Le style est **co-localisé** dans le `.scss` du
composant (scopé Angular) et consomme les variables CSS générées (`src/styles/src/generated/`).

Les états `hover`/`focused`/`pressed`/`disabled` sont gérés en CSS via les tokens sémantiques
(ex: `--actions-high-surface-hover`), jamais en props Angular. Dans Figma, ces états doivent
se calquer sur ces mêmes valeurs de tokens.

### Accessibilité (obligatoire)

- `<button>`/`<a>` natifs ; pas de `<div>` cliquable.
- `aria-label` obligatoire en mode **icon-only** (fallback sur le label sinon).
- Icônes décoratives en `aria-hidden` (cf. `ui-icon` : `decorative` par défaut).
- `:focus-visible` toujours visible et distinct du `hover`.
- `disabled` natif (pas seulement visuel).

---

## Pipeline de design tokens

Source : `src/design-tokens/*.json` (format DTCG + extensions Figma, exporté depuis Figma).
Build : `npm run tokens:build` (`scripts/tokens.build.mjs`, moteur **Style Dictionary v5**) →
partials SCSS dans `src/styles/src/generated/`.

Configuration : **`tokens.config.json`** (racine du repo, documenté/validé par
`scripts/tokens.config.schema.json`) : déclare les collections, les axes de modes
(brand/theme/viewport → sélecteurs CSS ou media queries) et les sorties (`css-vars`,
`scss-vars`). Ajouter une collection ou un mode = éditer ce JSON, pas le script.

### Nommage des variables CSS

| Collection | Préfixe var | Exemple |
|---|---|---|
| primitives | `--primitives-*` | `--primitives-primary-500` |
| metrics | `--metrics-*` | `--metrics-units-sm`, `--metrics-radius-sm` |
| semantics | *(aucun)* | `--actions-high-surface-default`, `--global-high-content-default` |
| typography | *(aucun)* | `--fontfamily-base`, `--weight-bold` |
| transitions | *(aucun)* | `--transition-fast` |

Les **semantics référencent les primitives** en `var(--primitives-*)` (outputReferences) → le
switch de marque/mode se fait à l'exécution sans duplication.

### Dimensions / modes

| Dimension | Porté par | Application runtime |
|---|---|---|
| Marque | primitives (modeBrand1/2/3) | `[data-brand='brand2'\|'brand3']` (brand1 = défaut) : `BrandService` |
| Clair/Sombre | semantics (modeLight/modeDark) | `[data-theme='dark']` (light = défaut) : `ThemeService` |
| Viewport | responsive (modeMobile/Tablet/Desktop) | `@media (min-width: …)` |

---

## Breakpoints

| Token | Valeur | Usage |
|---|---|---|
| `phone` | 0px | Mobile first |
| `tabletPortrait` | 600px | Petit tablet |
| `tabletLandscape` | 900px | Tablet paysage |
| `desktop` | 1200px | Desktop standard |
| `mediumDesktop` | 1440px | Desktop large |
| `bigDesktop` | 1800px | Très grand écran |

Dans Figma, utiliser les frames à 1440px (mediumDesktop) comme taille de référence desktop.
Documenter les adaptations mobiles via des frames séparés, pas des duplication de composants.
