# Pratiques de sécurité

> Politique de développement. Pour **signaler** une vulnérabilité, voir
> [`SECURITY.md`](../SECURITY.md).

Ce document porte les règles de sécurité du starter et, surtout, le **registre des
exceptions** : chaque contournement autorisé y est nommé, localisé et justifié.
Une exception qui n'est pas dans ce registre est un bug.

Origine : [FSHSP-177](https://4sh-toolkit.atlassian.net/browse/FSHSP-177).

---

## 1. Ne pas contourner les protections d'Angular

Angular assainit automatiquement tout ce qui traverse une **liaison de template**
(`[innerHTML]`, `[src]`, `[href]`, `[style]`…). Les API qui désactivent cet
assainissement — la famille `DomSanitizer.bypassSecurityTrust…()` — sont
**interdites par défaut**.

### Ce qui est interdit

| API                                                                   | Pourquoi                                                                                                               | Alternative                                       |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------- |
| `DomSanitizer.bypassSecurityTrustHtml/Style/Script/Url/ResourceUrl()` | Marque la valeur comme sûre **sans la vérifier**.                                                                      | `DomSanitizer.sanitize(SecurityContext.X, value)` |
| `element.innerHTML = …` / `outerHTML = …`                             | L'assainissement d'Angular ne couvre **que** les liaisons de template : une écriture directe dans le DOM passe à côté. | Liaison `[innerHTML]`, ou assainir avant d'écrire |
| `insertAdjacentHTML()`, `document.write()`                            | Idem — injection de markup hors du pipeline Angular.                                                                   | `textContent`, création de nœuds                  |
| `eval()`, `new Function()`, `setTimeout('…')`, `href="javascript:…"`  | Exécution de chaîne.                                                                                                   | Une fonction                                      |

### Comment c'est appliqué

`eslint.config.js` — règle `no-restricted-syntax`, côté TypeScript **et** côté
template HTML (le parser d'angular-eslint expose les liaisons comme
`BoundAttribute`, ce qui rend les templates auditables par la même règle). Le
lint est bloquant en CI (`pr-checks.yml` → `pnpm lint:check`).

```bash
pnpm lint:check
```

`[innerHTML]` dans un template n'est **pas** un contournement — la liaison passe
par l'assainisseur. La règle la signale quand même : c'est la seule liaison
capable d'injecter du markup, donc la seule qui mérite une revue, et c'est celle
qui accompagne systématiquement un bypass côté TypeScript.

### Comment lever une exception

1. **Assainir en amont.** Un bypass n'est défendable que si la valeur a déjà été
   nettoyée par du code qu'on peut lire et tester.
2. **Justifier sur place**, dans le commentaire de désactivation :

   ```ts
   /* eslint-disable-next-line no-restricted-syntax -- EXCEPTION JUSTIFIÉE :
      <la raison, et pourquoi il n'y a pas d'alternative> */
   ```

   En template HTML, un commentaire ne peut pas se glisser dans une balise
   ouvrante : utiliser une paire `<!-- eslint-disable … -->` /
   `<!-- eslint-enable … -->` autour de l'élément.

3. **Inscrire l'exception au registre ci-dessous.**
4. **Faire relire.** Une PR qui ajoute une ligne au registre est une PR de
   sécurité, pas une PR de composant.

Lister toutes les exceptions du dépôt :

```bash
grep -rn 'eslint-disable.*no-restricted-syntax' projects src
```

---

## 2. Registre des exceptions

Audit du 2026-08-27 sur `projects/`, `src/`, `storybook/`, `scripts/` :
**un seul `bypassSecurityTrust…()` dans tout le dépôt**, et aucun `eval()`,
`new Function()` ni `document.write()`.

| #   | Fichier                                                                | API                       | Justification                                                                                                                                                                     |
| --- | ---------------------------------------------------------------------- | ------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `projects/ui-kit/base/ui-image/src/lib/ui-image.ts`                    | `bypassSecurityTrustHtml` | **Inévitable** : l'assainisseur d'Angular supprime `<svg>` en entier, donc `sanitize()` ne rendrait rien. Valeur assainie en amont par `sanitizeInlineSvg()`. Voir §3.            |
| 2   | `projects/ui-kit/base/ui-image/src/lib/ui-image.html`                  | `[innerHTML]`             | Réception du SVG assaini de l'exception 1.                                                                                                                                        |
| 3   | `projects/ui-kit/base/ui-image/src/lib/ui-image-svg.ts`                | `innerHTML =`             | Écriture dans un `<template>` **détaché** (contenu inerte : rien ne s'exécute, rien n'est chargé). C'est l'étape de parsing du scrub.                                             |
| 4   | `projects/ui-kit/forms/ui-editor/src/lib/ui-editor.ts`                 | `innerHTML =`             | Valeur issue de `sanitize(SecurityContext.HTML, …)`. Écriture directe imposée par le `contenteditable` : une liaison réécrirait la zone à chaque frappe et effondrerait le caret. |
| 5   | `projects/ui-kit/forms/ui-editor/src/lib/ui-editor-commands.ts` ×2     | `innerHTML =`             | `<template>` détaché, contenu inerte — parsing du scrub de collage, et projection en texte pour le compteur de caractères.                                                        |
| 6   | `projects/ui-kit/informative/ui-tooltip/src/lib/ui-tooltip-panel.html` | `[innerHTML]`             | Mode `escape=false`, **opt-in**. Ce n'est pas un contournement : la liaison passe par l'assainisseur, aucun bypass n'est levé.                                                    |

---

## 3. Pourquoi `ui-image` a besoin de son bypass

`ui-image` inline les SVG **locaux** dans le DOM au lieu de les servir dans un
`<img>`. C'est ce qui leur permet d'hériter du CSS de la page — `currentColor`,
tokens de thème, mode sombre. Un `<img>` isole le SVG dans son propre document et
perd tout ça.

Or l'assainisseur d'Angular ne connaît pas `<svg>` : `sanitize(SecurityContext.HTML, svg)`
retire l'arbre entier. Il n'existe donc pas de chemin « propre » pour ce cas —
le bypass est structurel, pas un raccourci.

Ce qui le rend acceptable :

- **Un scrub explicite et testé** en amont — `ui-image-svg.ts` :
  - suppression **avec leur contenu** de `script`, `foreignObject` (qui réouvre
    tout l'espace de noms HTML), `iframe`, `object`, `embed`, et des éléments SMIL
    `animate`/`animateTransform`/`animateMotion`/`set`/`handler` (qui peuvent
    recibler un attribut _après_ le passage du scrub) ;
  - suppression de **tout attribut `on…`**, quel que soit l'élément ;
  - `href` / `xlink:href` / `src` réduits à une référence intra-document (`#id`)
    ou à une URL `http(s)` — `javascript:` et `data:` sont retirés ;
  - parsing dans un `<template>` **détaché**, donc inerte pendant l'inspection ;
  - **échec fermé** en SSR (pas de DOM pour scruber → chaîne vide, jamais du
    markup brut).
  - 14 tests dans `ui-image-svg.spec.ts` verrouillent chacun de ces points.
- **Le cache ne contient que du markup assaini** (`SVG_CACHE`) : rien qui ait
  échappé au scrub ne peut y être relu.
- **La surface est bornée** : seuls les assets **locaux** sont inlinés. Un `src`
  distant passe toujours par `<img [ngSrc]>`, jamais par le bypass.

Le modèle de menace n'est pas « les assets du kit », c'est un projet qui sert
`assets/img/` depuis un CDN, ou qui laisse un client déposer son logo dans un
dossier de marque (white-label) : dans les deux cas, du markup d'origine inconnue
rendu dans l'origine de l'application.

Vérification de non-régression : le scrub a été passé sur les 22 SVG réels de
`src/assets/img/` — **aucun n'est modifié** (même nombre d'éléments et
d'attributs).

---

## 4. Chaîne de dépendances : pnpm

Le dépôt gère ses dépendances avec **pnpm**, pinné par le champ `packageManager`
du `package.json` (un seul endroit à bumper — `pnpm/action-setup` le lit en CI).
Toute la configuration de sécurité vit dans **`pnpm-workspace.yaml`**, commentée
ligne par ligne ; ce qui suit n'en donne que la logique.

| Réglage                     | Valeur        | Ce que ça coupe                                                                                                                                                                  |
| --------------------------- | ------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `minimumReleaseAge`         | `1440` (24 h) | L'installation d'une version publiée il y a moins de 24 h — la fenêtre pendant laquelle un paquet compromis est repéré et dépublié.                                              |
| `allowBuilds`               | 6 paquets     | Les scripts `postinstall` des dépendances, vecteur principal des attaques supply chain. Bloqués par défaut ; seuls les binaires natifs indispensables sont autorisés, nommément. |
| `strictDepBuilds`           | `true`        | L'arrivée SILENCIEUSE d'un nouveau paquet à script de build (échec, au lieu d'un avertissement noyé dans un log de CI).                                                          |
| `blockExoticSubdeps`        | `true`        | Une dépendance **transitive** servie depuis un dépôt git ou une URL de tarball, donc hors registre, hors dépublication, hors alerte.                                             |
| `dangerouslyAllowAllBuilds` | `false`       | Rien en soi — renseigné pour qu'un passage à `true` soit un diff visible en revue.                                                                                               |
| `saveExact`                 | `true`        | Les plages de versions flottantes. **Ce réglage doit être dans `pnpm-workspace.yaml`** : pnpm n'honore PAS `save-exact` depuis `.npmrc` (vérifié — voir §5).                     |

### Ce que la bascule a révélé : trois dépendances fantômes

C'est le gain le moins attendu et le plus concret. Le `node_modules` aplati de npm
rend utilisable n'importe quel paquet **transitif** : un `import` — ou un binaire —
d'un paquet non déclaré fonctionne, jusqu'au jour où la dépendance qui le tirait
change de version et le fait disparaître. pnpm ne résout que ce qui est déclaré,
donc l'install a échoué là où npm se taisait.

**Deux fantômes d'`import`**, découverts à l'install :

| Paquet                | Importé par                                                            | Ce qui le tirait en transitif           |
| --------------------- | ---------------------------------------------------------------------- | --------------------------------------- |
| `sass`                | `scripts/component-vars.build.mjs` (et l'appel CLI de `ui-kit:styles`) | `@angular/build`, `sass-loader`, `vite` |
| `@schematics/angular` | `projects/ui-kit-schematics/src/ng-add/index.ts`                       | `@angular/cli`                          |

Le second cassait `tsc` sur le package des schematics (`TS2307` + deux `any`
implicites), donc les schematics compilaient sur des types perdus.

**Un fantôme de _binaire_**, d'une nature différente et découvert plus tard, en CI :

| Paquet       | Appelé par                                     | Ce qui le tirait en transitif              |
| ------------ | ---------------------------------------------- | ------------------------------------------ |
| `playwright` | l'étape « Install Playwright's Chromium » (CI) | `@storybook/test-runner`, `axe-playwright` |

Celui-ci ne vient pas d'un `import` mais de `npx` : **`npx` télécharge depuis le
registre un binaire absent de `node_modules/.bin`**, alors que `pnpm exec` ne lance
que ce qui est là. La réécriture `npx` → `pnpm exec` a donc transformé un
téléchargement silencieux en `ERR_PNPM_RECURSIVE_EXEC_FIRST_FAIL`.

> Le réflexe « remplacer par `pnpm dlx` » est un piège ici : `dlx` rétablit bien le
> téléchargement, mais en `latest`. Les navigateurs installés ne correspondraient
> plus au `playwright-core` que le test-runner utilise, et les tests échoueraient
> sur un « Executable doesn't exist ». Le bon correctif est de **déclarer
> `playwright` à la version que le graphe résout déjà** (une seule, partagée par
> `@storybook/test-runner` et `axe-playwright`) et de garder `pnpm exec`.
>
> Règle générale : `pnpm dlx` pour un outil qu'on ne veut délibérément pas installer
> (un générateur lancé une fois) ; `pnpm exec` + dépendance déclarée dès qu'une
> version doit rester cohérente avec le reste du graphe.

Les trois sont maintenant des `devDependencies` explicites.

> ⚠️ Le piège de méthode : les deux premières **ne sont apparues qu'après un
> `rm -rf node_modules`**. Un premier `pnpm install` par-dessus une arborescence
> créée par npm laisse assez de restes aplatis pour que tout passe. Et la
> troisième n'est apparue **qu'en CI**, parce qu'aucune porte locale ne lance
> Playwright. Une migration validée sans table rase, et sans faire tourner les
> jobs qui n'appartiennent pas au chemin de build, ne prouve rien.

Reste un import non déclaré, **volontairement** : `react`, dans les addons
Storybook (`storybook/addons/**/manager.tsx`, `storybook/blocks/config-table.js`).
C'est le contrat de Storybook — son builder de _manager_ fournit React et l'alias
lui-même ; déclarer un second React risquerait de dédoubler le runtime. Ces
fichiers ne sont typechecked par aucun `tsconfig` du dépôt, et
`pnpm build-storybook` les bundle sans erreur.

Pour rechercher d'autres imports non déclarés après un ajout de code outillage :

```bash
rm -rf node_modules && pnpm install --frozen-lockfile
```

### Ce que la bascule n'a PAS demandé

- **Rien dans le code du kit.** Le tarball publié est un package npm standard :
  n'importe quel gestionnaire l'installe. Les `peerDependencies` ont été croisées
  avec les imports réels du kit — correspondance exacte, aucun peer manquant.
  C'est le premier risque d'un consommateur en pnpm (pas de hoisting : un peer
  oublié casse au lieu d'être masqué) et il n'existe pas ici.
- **Rien dans `ng-add`, côté install.** Le CLI Angular découvre le gestionnaire
  depuis le lockfile du consommateur et le transmet à `NodePackageInstallTask` :
  un projet en pnpm installe bien avec pnpm. Ne pas forcer `packageManager` sur
  la tâche, ce serait imposer notre choix.

### Ce qui reste délibérément sur le CLI npm

**La publication.** `publish-ui-kit.yml` s'authentifie par **npm Trusted
Publishing (OIDC)**, sans jeton. `pnpm publish` l'a supporté en pnpm 10 puis
régressé en 11.0.8 (le registre répond `404`, l'échange OIDC n'ayant pas lieu —
[pnpm#11513](https://github.com/pnpm/pnpm/issues/11513), corrigé par #11526).
Publier étant **irréversible**, ce risque n'achète rien : pnpm résout le graphe,
`npm publish` remet le tarball au registre, et le tarball ne dépend pas du client
qui l'a construit. Le workflow porte cette justification en commentaire, pour que
personne ne « termine » la migration.

### Deux pièges vérifiés, à ne pas réintroduire

1. **`pnpm` ignore `save-exact` dans `.npmrc`.** `pnpm config get save-exact`
   renvoie `undefined`, et un `pnpm add` écrit `^x.y.z`. La clé n'a d'effet que
   sous la forme `saveExact` dans `pnpm-workspace.yaml`.
2. **`pnpm pack` n'accepte pas d'argument de répertoire**, contrairement à
   `npm pack <dir>` : il empaquette le projet courant. D'où le
   `pnpm -C dist/ui-kit pack` des scripts `*:pack`.

### Interaction avec Dependabot

L'écosystème s'appelle toujours `npm` dans `dependabot.yml` — c'est le nom du
**registre**, et Dependabot lit bien `pnpm-lock.yaml` sous cette clé.

En revanche `minimumReleaseAge` et Dependabot se marchent sur les pieds : une PR
qui propose une version publiée depuis moins de 24 h **échoue à l'install**, puis
passe d'elle-même à la relance suivante. Ce n'est pas une panne à contourner. La
cadence hebdomadaire rend le cas peu fréquent ; pour prendre immédiatement un
correctif de sécurité, inscrire le paquet dans `minimumReleaseAgeExclude` le temps
du bump — **puis l'en retirer**, sinon l'exception devient permanente en silence.

### Recenser à nouveau les scripts d'install

L'allowlist `allowBuilds` est un instantané (audité le 2026-08-27). Après un
ajout de dépendance notable :

```bash
pnpm install   # `strictDepBuilds` fait échouer l'install si un script n'est pas arbitré
```

---

## 5. Ce que le starter ne fait pas (et pourquoi)

- **Pas de Trusted Types / CSP.** Ce sont des réglages d'**application**, pas de
  librairie : une CSP se pose sur les en-têtes du serveur qui sert l'app, et le
  kit n'en sert aucun. À faire côté projet consommateur. À noter : le scrub de
  `ui-image` et celui de `ui-editor` sont ce qui rendrait le kit compatible d'une
  politique Trusted Types.
- **`<style>` conservé dans les SVG inlinés.** Un `<style>` d'un SVG inline
  s'applique au document entier — c'est une collision de style, pas une exécution
  de code. Le retirer casserait des assets légitimes ; à traiter côté convention
  d'asset.
