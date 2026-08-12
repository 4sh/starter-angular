# Publier `@4sh/ui-kit`

Le kit est publié sur le **registre npm public**, sous l'organisation **`4sh`**.
Versionnage : voir [`VERSIONING.md`](./VERSIONING.md).

---

## Authentification : Trusted Publishing (OIDC), aucun token

La publication s'authentifie par **Trusted Publishing** : GitHub Actions présente
à npm le jeton OIDC du job, npm vérifie qu'il provient bien du dépôt et du
workflow déclarés sur la page du package, et délivre un droit de publication
éphémère valable le temps du job.

**Il n'y a donc aucun secret à stocker, ni à faire tourner.**

| | |
|---|---|
| Organisation npm | `4sh` — porte les packages `@4sh/*` |
| Dépôt autorisé | `4sh/starter-angular` |
| Workflow autorisé | `publish-ui-kit.yml` |
| Environment | `npm-publish` (approbation humaine, voir plus bas) |
| Secret GitHub | **aucun** |

### Configurer (une seule fois, sur npmjs)

Page du package → *Settings* → section **Trusted Publisher** :

| Champ | Valeur |
|---|---|
| Publisher | GitHub Actions |
| Organization / user | `4sh` |
| Repository | `starter-angular` |
| Workflow filename | `publish-ui-kit.yml` |
| Environment | `npm-publish` |
| **Allowed actions** | **`npm publish` uniquement** |

Le champ *Allowed actions* propose aussi `npm stage publish` (publication en
deux temps : dépôt en zone de staging, puis promotion). Le workflow ne lance que
`npm publish` : cocher la seconde case élargirait le droit délivré sans usage.
Réglage modifiable après coup si le staging devenait utile.

Le réglage n'est possible qu'une fois le package **déjà présent** sur le
registre : la `0.1.0` a donc été publiée par token, et c'est ce token que la
bascule supprime.

### Pourquoi c'est strictement mieux qu'un token

| | Token | Trusted Publishing |
|---|---|---|
| Secret stocké dans GitHub | oui (`NPM_TOKEN`) | **aucun** |
| Utilisable par quiconque peut modifier un workflow | oui | **non** — lié au dépôt + workflow déclarés |
| Expiration / rotation | à gérer | **rien** |
| « Bypass 2FA » | nécessaire | **inutile** |
| Provenance | à demander | implicite |

npm affiche d'ailleurs un avertissement sur l'option *bypass 2FA* d'un token,
recommandant Trusted Publishing pour tout usage CI/CD.

### Qui peut publier, qui peut administrer

Deux accès distincts, à ne pas confondre :

| | Ce qu'il faut | Qui l'a |
|---|---|---|
| **Publier une version** | lancer le workflow + approuver l'environment `npm-publish` | toute personne *required reviewer* sur GitHub — **aucun compte npm, aucun 2FA** |
| **Administrer le package** (Trusted Publisher, mainteneurs, révocations) | se connecter au compte `4sh-package-admin` sur npmjs | seulement qui détient le mot de passe **et** un second facteur enrôlé |

C'est l'intérêt de l'OIDC : la publication ne dépend plus d'une identité npm.
Reste l'administration, et elle mérite sa propre discipline, le compte étant
partagé mais son second facteur nécessairement porté par un appareil :

- **Codes de récupération** de la 2FA → dans **Vaultier**, avec les identifiants.
  Sans eux, la perte de l'appareil enrôlé ferme définitivement le compte.
- **Au moins deux facteurs enrôlés**, sur les appareils de deux personnes
  différentes (npm accepte plusieurs méthodes sur un même compte). Un seul
  appareil = un seul point de défaillance sur un compte censé être collectif.
- À terme, préférer des **comptes nominatifs déclarés mainteneurs** de
  `@4sh/ui-kit` à un compte partagé : chacun son 2FA, plus aucun secret
  d'authentification en commun. Le compte de service perd l'essentiel de sa
  raison d'être maintenant que la publication ne passe plus par lui.

### Exigence de version

Trusted Publishing réclame **npm ≥ 11.5.1**. Le `.nvmrc` est sur Node 24.15.0,
qui embarque npm 11.12.1 — rien à installer. Le workflow le vérifie explicitement
avant de publier, pour qu'une descente de version du `.nvmrc` échoue avec un
message clair plutôt qu'avec un `401` obscur.

### Si l'OIDC échoue un jour

**Ne pas remettre de token dans la CI.** C'est la tentation évidente en situation
de panne, et c'est exactement ce que cette bascule a supprimé : un secret
persistant, publiant *en tant que* son porteur, utilisable par toute personne
pouvant modifier un workflow. npm restreint d'ailleurs progressivement les tokens
qui contournent la 2FA — la voie se ferme.

Deux réponses saines :

1. **Attendre.** Publier un design system n'est jamais urgent à l'heure près.
2. **Publier interactivement depuis un poste** (voir « Publier depuis un poste »
   plus bas) : `npm login`, code 2FA saisi à la main, `npm publish`. La session
   meurt avec le terminal, aucun secret n'est stocké ni partagé.

Le token du compte de service a été révoqué et le secret `NPM_TOKEN` supprimé de
GitHub après la publication de la `0.1.1` — le premier passage réussi par OIDC.

### L'environment `npm-publish` (approbation humaine)

Le job de publication est rattaché à l'environment **`npm-publish`**. À
configurer **une fois**, sinon la protection n'existe pas :

*Settings → Environments → New environment → `npm-publish`* puis cocher
**Required reviewers** et y mettre les personnes autorisées à publier.

⚠️ **Piège** : référencer un environment qui n'existe pas le fait créer
automatiquement **sans aucune règle de protection**. Le workflow tournerait alors
sans approbation, en donnant l'illusion d'être protégé. À vérifier explicitement.

⚠️ **L'approbation reste indispensable, même sans secret à protéger.** L'OIDC
garantit *d'où* vient la publication, jamais *qui* l'a décidée : sans la porte
d'approbation, toute personne pouvant lancer le workflow publierait. Les deux
mécanismes sont complémentaires, et le nom de l'environment fait partie de la
déclaration côté npm — le renommer ici casse l'authentification.

---

## Publier (voie normale : CI)

La publication passe par le workflow [`publish-ui-kit.yml`](../.github/workflows/publish-ui-kit.yml),
en **déclenchement manuel** — jamais automatique, car l'opération est
irréversible.

Prérequis, une seule fois :

1. Créer l'environment **`npm-publish`** avec ses *required reviewers* (voir plus haut).
2. Déclarer le *Trusted Publisher* sur npmjs (voir « Authentification »).

Puis, à chaque version :

3. Mettre à jour la version dans `projects/ui-kit/package.json` et l'entrée
   `CHANGELOG.md` correspondante, puis merger sur `main`.
4. *Actions → Publish @4sh/ui-kit to npm → Run workflow* avec **`dry_run: true`** :
   le job `verify` affiche le contenu exact du tarball. Aucune approbation ni
   secret requis à ce stade.
5. Relancer avec **`dry_run: false`** : le job `verify` rejoue, puis `publish`
   **attend l'approbation d'un reviewer** avant de démarrer et de publier, et
   `release` pose le tag et ouvre la release GitHub.

Aucun secret n'intervient : le droit de publier est émis à la demande, pour ce
job, et expire avec lui.

### Tag et release GitHub

Le job `release` s'exécute **après** une publication réussie : il crée le tag
`vX.Y.Z` sur le commit publié et la release GitHub, dont le corps est la section
`[X.Y.Z]` de `CHANGELOG.md`. Rien à poser à la main.

L'accrochage à la publication est le point : la release n'existe que si le
registre a accepté le tarball, et elle désigne le commit exact qui l'a produit —
là où un tag poussé manuellement ne garantit ni l'un ni l'autre (`0.1.0` et
`0.1.1` sont sur npm sans aucun tag, précisément pour cette raison).

Le job est **séparé de `publish`** parce qu'il lui faut `contents: write` : ce
droit n'a rien à faire dans le job qui porte déjà celui de publier sur npm.

⚠️ **La section `[X.Y.Z]` doit exister dans `CHANGELOG.md` avant de publier.** Le
job `verify` la vérifie ([`scripts/changelog.section.mjs`](../scripts/changelog.section.mjs)),
donc un lancement en `dry_run: true` signale l'oubli **avant** la publication
irréversible, et affiche les notes de release telles qu'elles seront rendues.

### Provenance

Le workflow publie avec `--provenance` : npmjs affiche un lien vérifiable entre
le tarball et le commit + workflow qui l'a produit. Trusted Publishing la rend
implicite, mais le drapeau reste explicite — il ne coûte rien et documente
l'intention. Les attestations SLSA de la `0.1.0` et de la `0.1.1` sont
consultables via `npm view @4sh/ui-kit dist --json`.

---

## Publier depuis un poste (secours)

La voie normale reste la CI : elle publie depuis un environnement reproductible,
sous approbation, avec provenance. Mais si l'OIDC était indisponible, c'est
**ici** qu'il faut se replier — pas dans un token de CI.

```bash
npm login                      # compte 4sh-package-admin, code 2FA à la saisie
npm run ui-kit:build
cd dist/ui-kit
npm publish --dry-run          # toujours, d'abord
npm publish --provenance=false # pas de provenance hors CI : rien à attester
```

`npm login` ouvre une **session interactive**, pas un secret partagé : elle est
liée au poste, expire, et se ferme avec `npm logout`. C'est ce qui distingue ce
repli d'un token de CI. Ne jamais écrire de token dans un fichier suivi par git,
et vérifier que le `.npmrc` du poste ne l'est pas.

Contrepartie assumée : le tarball ne porte alors aucune attestation de
provenance, puisqu'il n'est produit par aucun workflow vérifiable.

---

## Points d'attention

- **`publishConfig.access: "public"`** est déclaré dans le `package.json` du
  package. Sans lui, un package *scopé* est `restricted` par défaut et la
  publication échoue en 402 (les packages privés sont payants).
- **On publie `dist/ui-kit/`, pas le dépôt.** Le `package.json` de
  `projects/ui-kit/` est un modèle : `ng-packagr` le recopie dans `dist/` en y
  injectant `exports`, `module` et `typings`.
- **Une version publiée est définitive.** `npm unpublish` n'est possible que dans
  les 72 h et sous conditions, et un couple nom+version ne peut **jamais** être
  réutilisé. En cas d'erreur, on publie un correctif (`0.1.1`), on ne réécrit pas.
- Le `package.json` **racine** du dépôt porte `"private": true` : l'application
  de démonstration ne peut pas être publiée par accident.

---

## Consommer sans publier

Pour tester le kit dans un autre projet sans passer par le registre :

```bash
npm run ui-kit:pack                                  # → 4sh-ui-kit-<version>.tgz
npm install /chemin/vers/4sh-ui-kit-<version>.tgz    # dans le projet consommateur
```

Contenu et résolution des imports strictement identiques à une vraie
publication. Pour du développement en parallèle :
`npm install ../starter-angular/dist/ui-kit`.
