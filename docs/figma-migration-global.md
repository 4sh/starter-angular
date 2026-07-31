# Runbook — Migration Figma des tokens `global`

> **À exécuter uniquement après validation et merge de la PR
> `breaking/global-tokens-semantics`.** Ce document décrit le travail Figma
> correspondant au renommage déjà réalisé côté code.
>
> Table de correspondance machine : [`token-migration-global.json`](./token-migration-global.json)
> — source unique pour le code **et** pour Figma. Toutes les valeurs ci-dessous
> en sont issues ou ont été relevées en lecture seule sur les fichiers Figma.

---

## 1. Périmètre

### Fichiers concernés

| Fichier | `fileKey` | Rôle |
|---|---|---|
| **[Projet] - Composants metiers** | `lH4jhyZFkIeJ1Ob1tlY7Wm` | **Propriétaire** de la collection `semantics`. Seul fichier où les variables sont *locales*, donc le seul où le renommage est possible. |
| **[Projet] - UI Kit** | `GZww5hdUA49LB8XWeWP6tl` | **Consommateur** : variables en `remote`. Renommage impossible, mais rebind possible via `importVariableByKeyAsync`. |

### ⛔ Fichiers à ne PAS toucher

Sept bibliothèques sœurs de l'org 4SH portent la même structure de tokens
(`Global/High/Content/Default`, en PascalCase) car elles dérivent du même starter.
Elles ont leurs **propres clés de variables** : rien de ce runbook ne les affecte,
et aucune action ne doit être menée dessus.

`[TEST]` · `[NAXOS] VUP` · `[EasyFret] WMS (AARG)` · `BeCLM UI 2.0` ·
`[ARKHE] OKWEB` · `[Celebrads]` · `✅ Mode 2 - Projet B`

> ⚠️ Le `fileKey` `XgSemnGLFrAq75CxcjPVf1` cité dans les templates de prompt de
> `CLAUDE.md` **n'est pas un fichier `[Projet]`** : il souscrit aux bibliothèques
> *BeCLM UI 2.0*. Référence périmée, à corriger séparément.

### Collection cible

```
semantics · VariableCollectionId:4:763
           key c7d5fad4d47bf024137cc272036425e244406096
           421 variables · modes : Light = 4:3 · Dark = 5:0
```

Les 21 variables `global/*` en font partie. **Aucune variable d'une autre famille
sémantique (`actions`, `form`, `informative`, `navigation`, `table`) n'alias un token
`global`** (vérifié : `variablesAliasingGlobal: []`) — le renommage ne peut donc pas
cascader hors du groupe `global`.

---

## 2. État relevé (lecture seule, avant toute action)

| Fichier | Pages | Nœuds scannés | Bindings `global/*` |
|---|---|---|---|
| Composants metiers | 45 / 45 | 5 353 | 1 076 |
| UI Kit | 50 / 50 | 6 386 | 403 |

Bindings par variable (Composants metiers + UI Kit) :

| Variable | Owner | UI Kit | Total |
|---|---:|---:|---:|
| `global/default/surface/default` | 475 | 79 | **554** |
| `global/high/content/default` | 318 | 103 | **421** |
| `global/high/stroke/default` | 257 | 144 | **401** |
| `global/low/surface/default` | 6 | 27 | 33 |
| `global/low/content/default` | 6 | 14 | 20 |
| `global/high/surface/default` | 8 | 6 | 14 |
| `global/default/content/default` | 0 | 13 | 13 |
| `global/low/surface/hover` | 0 | 12 | 12 |
| `global/low/stroke/default` | 6 | 1 | 7 |
| `global/high/surface/hover` | 0 | 4 | 4 |
| *les 11 autres* | 0 | 0 | **0** |

---

## 3. Actions : 14 renommages, 34 rebinds, 7 suppressions

### 3.1 Renommages (14) — aucun binding cassé

Les bindings Figma se font **par identifiant**, jamais par nom : renommer une
variable publiée ne casse aucun composant, ni dans le fichier propriétaire ni chez
les consommateurs. C'est l'opération la plus sûre du lot.

| Variable à renommer | `localId` | Nouveau nom |
|---|---|---|
| `global/high/content/default` | `VariableID:5:104` | `global/text/default` |
| `global/high/content/hover` | `VariableID:5:105` | `global/text/default-hover` |
| `global/low/content/default` | `VariableID:5:113` | `global/text/muted` |
| `global/low/content/hover` | `VariableID:5:114` | `global/text/muted-hover` |
| `global/high/content/focused` | `VariableID:5:106` | `global/text/brand` |
| **`global/default/surface/default`** | `VariableID:5:103` | `global/background/default` |
| `global/high/surface/hover` | `VariableID:5:108` | `global/background/default-hover` |
| `global/low/surface/default` | `VariableID:5:116` | `global/background/muted` |
| `global/low/surface/hover` | `VariableID:5:117` | `global/background/muted-hover` |
| `global/high/surface/focused` | `VariableID:5:109` | `global/background/brand` |
| `global/high/stroke/default` | `VariableID:5:110` | `global/border/default` |
| `global/high/stroke/hover` | `VariableID:5:111` | `global/border/default-hover` |
| `global/default/stroke/default` | `VariableID:1003:113` | `global/border/subtle` |
| `global/high/stroke/focused` | `VariableID:5:112` | `global/border/focus` |

#### ⚠️ Un survivant diffère du code

Pour `global/background/default`, le code conserve `high.surface.default` ; **Figma
conserve `default/surface/default`**. Motif : 554 bindings contre 14. Garder le
survivant du code aurait imposé 554 rebinds au lieu de 14.

C'est **neutre en valeur** — les deux variables pointent sur `grey/050` (Light) et
`grey/900` (Dark), à l'identique. Bénéfice annexe : le survivant retenu a le scope
`ALL_FILLS` (contre `FRAME_FILL`), donc plus large — aucun élargissement de scope
n'est nécessaire. L'écart est tracé dans le JSON sous
`figma.survivorDiffersFromCode`.

### 3.2 Rebinds (34 bindings) — **obligatoirement avant les suppressions**

Supprimer une variable publiée casse les bindings de ses consommateurs. Les trois
variables fusionnées portent encore des bindings, à réaffecter vers leur survivant.

| Fichier | Variable à vider | Prop | Nb | Vers |
|---|---|---|---:|---|
| Owner | `global/high/surface/default` | `fills` | 8 | `global/background/default` |
| Owner | `global/low/stroke/default` | `strokes` | 6 | `global/border/default` |
| UI Kit | `global/default/content/default` | `fills` | 13 | `global/text/default` |
| UI Kit | `global/high/surface/default` | `fills` | 6 | `global/background/default` |
| UI Kit | `global/low/stroke/default` | `strokes` | 1 | `global/border/default` |

Pages concernées côté UI Kit : `Drawer` (4), `Spinner` (4), `Bottom Sheet` (5) pour
`default/content/default` ; `COMPONENTS` (4), `Card` (1), `Bottom Sheet` (1) pour
`high/surface/default` ; `Card` (1) pour `low/stroke/default`.

#### Écart de valeur assumé (miroir du code)

Les **13 nœuds** liés à `global/default/content/default` passeront, **en mode Dark
uniquement**, de `white/Base` (#ffffff) à `grey/050` (#f6f7f9). C'est exactement
l'écart documenté côté code sur `ui-spinner`. Concerne Drawer, Spinner et Bottom
Sheet. Écart de luminance ~1,5 %, validé.

### 3.3 Suppressions (7) — après rebind uniquement

**Fusionnées** (0 binding après l'étape 3.2) :

| Variable | `localId` |
|---|---|
| `global/default/content/default` | `VariableID:1003:112` |
| `global/high/surface/default` | `VariableID:5:107` |
| `global/low/stroke/default` | `VariableID:5:119` |

**Mortes** — 0 binding dans les deux fichiers **et** 0 usage dans le code. Les trois
premières étaient teintées `secondary` : un anneau de focus rose n'a jamais servi.

| Variable | `localId` |
|---|---|
| `global/low/content/focused` | `VariableID:5:115` |
| `global/low/surface/focused` | `VariableID:5:118` |
| `global/low/stroke/focused` | `VariableID:5:121` |
| `global/low/stroke/hover` | `VariableID:5:120` |

---

## 4. Procédure

> Chaque étape est un appel `use_figma` distinct, avec `fileKey` explicite.
> `use_figma` est **atomique** : un script qui échoue ne modifie rien.
> Après chaque étape : relire, vérifier, puis avancer.

### Étape 0 — Pré-vol

1. Re-scanner les bindings des deux fichiers et **comparer aux compteurs du §2**.
   S'ils ont bougé, le fichier a été édité depuis le relevé : recalculer avant
   d'agir.
2. **Vérifier qu'aucun autre fichier ne consomme la bibliothèque.** Le Plugin API
   n'expose pas la liste des consommateurs — passer par les *library analytics*
   Figma. Un consommateur inconnu verrait ses bindings cassés à l'étape 3.
3. Noter la version du fichier propriétaire (historique de versions) pour pouvoir
   revenir en arrière.

### Étape 1 — Renommer les 14 survivantes (owner)

```js
// fileKey: lH4jhyZFkIeJ1Ob1tlY7Wm
const RENAMES = {
  'VariableID:5:104':    'global/text/default',
  'VariableID:5:105':    'global/text/default-hover',
  'VariableID:5:113':    'global/text/muted',
  'VariableID:5:114':    'global/text/muted-hover',
  'VariableID:5:106':    'global/text/brand',
  'VariableID:5:103':    'global/background/default',
  'VariableID:5:108':    'global/background/default-hover',
  'VariableID:5:116':    'global/background/muted',
  'VariableID:5:117':    'global/background/muted-hover',
  'VariableID:5:109':    'global/background/brand',
  'VariableID:5:110':    'global/border/default',
  'VariableID:5:111':    'global/border/default-hover',
  'VariableID:1003:113': 'global/border/subtle',
  'VariableID:5:112':    'global/border/focus',
};
const done = [], errors = [];
for (const [id, newName] of Object.entries(RENAMES)) {
  const v = await figma.variables.getVariableByIdAsync(id);
  if (!v) { errors.push(`${id} introuvable`); continue; }
  const before = v.name;
  v.name = newName;
  done.push({ id, before, after: v.name });
}
return { renamed: done.length, done, errors, mutatedVariableIds: Object.keys(RENAMES) };
```

**Puis publier la bibliothèque** (action manuelle dans Figma : *Assets → Publier*).
Sans publication, le UI Kit continue d'afficher les anciens noms.

### Étape 2 — Rebinder (les deux fichiers)

Rappel API : pour `fills`/`strokes`, `setBoundVariableForPaint` **retourne un
nouveau paint** — il faut le capturer et réassigner le tableau entier.

**2a — owner** (`lH4jhyZFkIeJ1Ob1tlY7Wm`) :

```js
// high/surface/default -> background/default (8 fills)
// low/stroke/default   -> border/default     (6 strokes)
const MAP = [
  { from: 'VariableID:5:107', to: 'VariableID:5:103', prop: 'fills' },
  { from: 'VariableID:5:119', to: 'VariableID:5:110', prop: 'strokes' },
];
const TYPES = ['COMPONENT','COMPONENT_SET','FRAME','TEXT','RECTANGLE','INSTANCE','ELLIPSE','VECTOR','LINE','GROUP'];
const mutated = [];
for (const { from, to, prop } of MAP) {
  const target = await figma.variables.getVariableByIdAsync(to);
  for (const page of figma.root.children) {
    await page.loadAsync();
    for (const node of page.findAllWithCriteria({ types: TYPES })) {
      const paints = node[prop];
      if (!Array.isArray(paints) || !paints.length) continue;
      let hit = false;
      const next = paints.map((p) => {
        if (p.boundVariables?.color?.id !== from) return p;
        hit = true;
        return figma.variables.setBoundVariableForPaint(p, 'color', target);
      });
      if (hit) { node[prop] = next; mutated.push({ id: node.id, page: page.name, prop }); }
    }
  }
}
return { rebound: mutated.length, mutatedNodeIds: mutated.map((m) => m.id), detail: mutated };
```

**2b — UI Kit** (`GZww5hdUA49LB8XWeWP6tl`) : même script, mais les variables sont
distantes → les importer par **clé** et matcher l'identifiant distant
`VariableID:<key>/<localId>` :

```js
const MAP = [
  { fromKey: '9ae5d9a691c26557e6406b23c7e9e1f2dece0d4d', toKey: '0c98a229d2f11a73ff2cebe8b0b842ff4f65d213', prop: 'fills'   }, // text/default
  { fromKey: 'dbdd1740f2b95c121a51a0ee9e4b011721ded1e2', toKey: 'f7f095c7265df1d331d191ec59d3f57c8dbdbb22', prop: 'fills'   }, // background/default
  { fromKey: 'c8ccca49f183cd3ecd2df6c20104b98c450ad6b4', toKey: '02d064b7a69fb86b1b6dacee642a5e33561b7e9e', prop: 'strokes' }, // border/default
];
const TYPES = ['COMPONENT','COMPONENT_SET','FRAME','TEXT','RECTANGLE','INSTANCE','ELLIPSE','VECTOR','LINE','GROUP'];
const mutated = [];
for (const { fromKey, toKey, prop } of MAP) {
  const target = await figma.variables.importVariableByKeyAsync(toKey);
  for (const page of figma.root.children) {
    await page.loadAsync();
    for (const node of page.findAllWithCriteria({ types: TYPES })) {
      const paints = node[prop];
      if (!Array.isArray(paints) || !paints.length) continue;
      let hit = false;
      const next = paints.map((p) => {
        const id = p.boundVariables?.color?.id;
        if (!id || !String(id).startsWith(`VariableID:${fromKey}/`)) return p;
        hit = true;
        return figma.variables.setBoundVariableForPaint(p, 'color', target);
      });
      if (hit) { node[prop] = next; mutated.push({ id: node.id, page: page.name, prop }); }
    }
  }
}
return { rebound: mutated.length, mutatedNodeIds: mutated.map((m) => m.id), detail: mutated };
```

**Contrôle de sortie attendu : 14 rebinds en 2a, 20 en 2b.** Tout écart = arrêt et
diagnostic avant l'étape 3.

### Étape 3 — Supprimer les 7 variables (owner)

Ne lancer que si l'étape 2 a rendu les compteurs à zéro.

```js
const TO_DELETE = [
  'VariableID:1003:112', // global/default/content/default (fusionnée)
  'VariableID:5:107',    // global/high/surface/default    (fusionnée)
  'VariableID:5:119',    // global/low/stroke/default      (fusionnée)
  'VariableID:5:115',    // global/low/content/focused     (morte)
  'VariableID:5:118',    // global/low/surface/focused     (morte)
  'VariableID:5:121',    // global/low/stroke/focused      (morte)
  'VariableID:5:120',    // global/low/stroke/hover        (morte)
];
const deleted = [], skipped = [];
for (const id of TO_DELETE) {
  const v = await figma.variables.getVariableByIdAsync(id);
  if (!v) { skipped.push({ id, reason: 'introuvable' }); continue; }
  const name = v.name;
  v.remove();
  deleted.push({ id, name });
}
return { deleted, skipped };
```

**Puis republier la bibliothèque**, et accepter la mise à jour dans le UI Kit.

### Étape 4 — Vérification

1. Re-scanner les deux fichiers : il doit rester **exactement 14 variables
   `global/*`**, toutes nommées `global/{background|text|border}/…`, et **0 binding**
   vers un ancien nom.
2. Vérifier qu'aucun nœud n'affiche de variable manquante (`boundVariables`
   pointant vers un id qui ne résout plus).
3. Captures avant/après en Light **et** Dark sur `Card`, `Modal`, `Drawer`,
   `Bottom Sheet`, `Spinner`, `Separator`, `Progress Bar`, `Accessibility`. Seuls les
   13 nœuds de l'écart documenté doivent bouger, et seulement en Dark.
4. Comparer avec le rendu Storybook des mêmes composants (`npm run build-storybook`)
   pour confirmer l'alignement code ↔ design.

---

## 5. Dérives code ↔ Figma révélées par le scan

Indépendantes de cette migration, mais mises au jour par le relevé. À traiter
séparément, elles ne bloquent pas le runbook.

| Constat | Détail |
|---|---|
| **Figma ne modélise aucun état de focus** | `high/stroke/focused` → futur `border/focus` : **0 binding** dans les deux fichiers, alors que le code l'utilise **14 fois** (l'anneau de `:focus-visible`). Les composants Figma n'ont pas de variante `focused` reliée au token. |
| **La bordure la plus utilisée du code est absente de Figma** | `default/stroke/default` → futur `border/subtle` : **0 binding** Figma, **27 usages** code. Figma utilise `high/stroke/default` partout où le code met la bordure discrète. |
| **États hover partiellement absents** | `high/content/hover`, `high/stroke/hover`, `low/content/hover` : 0 binding Figma, mais utilisés dans le code. |

Conséquence : après migration, ces 5 variables existeront dans Figma sans y être
consommées. Elles restent nécessaires (le code s'en sert) — c'est le kit Figma qui
sous-modélise les états, pas les tokens qui sont en trop.

---

## 6. Rollback

- **Étape 1 seule** : re-renommer en sens inverse (la table ci-dessus est
  bijective), republier.
- **Après l'étape 3** : `Variable.remove()` est irréversible. Le retour arrière
  passe par la **restauration de version** du fichier propriétaire (cf. étape 0.3),
  puis republication. D'où l'importance de ne lancer l'étape 3 qu'après validation
  complète de l'étape 2.
