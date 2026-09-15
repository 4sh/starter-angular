# Lier le kit à un projet consommateur (`npm link`)

Éditer `projects/ui-kit/**` et voir l'effet dans un projet qui consomme `@4sh/ui-kit`,
sans republier.

On lie **`dist/ui-kit`**, jamais `projects/ui-kit` : c'est `dist/` qui contient le
`package.json` publiable et les entry points produits par ng-packagr. La « liveness »
vient du watch, pas du lien.

---

## 1. Starter — produire `dist/ui-kit` en continu

```bash
pnpm ui-kit:build
```

Puis, dans un terminal laissé ouvert :

```bash
pnpm exec ng build ui-kit --configuration development --watch
```

> ng-packagr découvre les entry points au **démarrage**. Si tu crées un nouveau
> composant, redémarre ce watch.

## 2. Poser le lien

```bash
cd dist/ui-kit && npm link
```

Dans le consommateur :

```bash
npm link @4sh/ui-kit && ls -l node_modules/@4sh/ui-kit
```

La sortie doit afficher une flèche `->` vers `…/starter-angular/dist/ui-kit`.

> En pnpm, une seule commande depuis le consommateur :
> `pnpm link <chemin-absolu>/starter-angular/dist/ui-kit`

## 3. Consommateur — deux réglages dans `angular.json`

Obligatoires, et **à ne pas committer**.

`projects.<app>.architect.build.options` :

```json
"preserveSymlinks": true
```

`projects.<app>.architect.serve.options` (le bloc `options` est souvent à créer) :

```json
"prebundle": { "exclude": ["@4sh/ui-kit"] }
```

## 4. Démarrer

```bash
rm -rf .angular/cache && npm start
```

## Si ça ne marche pas

| Symptôme                                        | Cause quasi certaine                        |
| ----------------------------------------------- | ------------------------------------------- |
| `NG0203`, `NullInjectorError`, composant ignoré | `preserveSymlinks` manquant, ou `ng serve` pas relancé après l'édition d'`angular.json` |
| les modifs n'arrivent pas                       | `prebundle.exclude` manquant, ou `.angular/cache` à purger |
| le lien a disparu                               | un `npm install` est passé — refaire l'étape 2 |

Vérifier aussi que consommateur et starter sont sur la **même version majeure
d'Angular** : un symlink met les deux runtimes face à face.

## Défaire

```bash
npm unlink @4sh/ui-kit && npm install @4sh/ui-kit
```

Puis retirer `preserveSymlinks` et `prebundle.exclude`.
