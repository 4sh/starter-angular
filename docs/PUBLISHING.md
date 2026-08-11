# Publier `@4sh/ui-kit`

Le kit est publié sur le **registre npm public**, sous l'organisation **`4sh`**.
Versionnage : voir [`VERSIONING.md`](./VERSIONING.md).

---

## Authentification : compte dédié, jamais un compte perso

Un *access token* npm est **persistant** et donne le droit de publier **en tant
que** son porteur. Comme le token doit vivre dans les secrets GitHub (donc
visible des personnes ayant accès aux settings du dépôt), un token de compte
personnel donnerait à ces personnes le droit de publier sous cette identité.

D'où le montage retenu :

| | |
|---|---|
| Organisation npm | `4sh` — porte les packages `@4sh/*` |
| Compte publieur | **`4sh-package-admin`** (le nom `4sh` est réservé par l'organisation éponyme) |
| Email du compte | `npm@4sh.fr` (ggroup dédié) |
| Identifiants | **Vaultier** |
| Token dans GitHub | secret `NPM_TOKEN`, porté par l'environment `npm-publish` |

> Une organisation npm ne peut pas porter d'access token elle-même : c'est la
> raison d'être du compte `4sh-package-admin`.

### Générer le token (granulaire, pas classique)

Sur npmjs, connecté en `4sh-package-admin` : *Access Tokens → Generate New Token
→ **Granular Access Token***.

⚠️ **Œuf et poule au premier passage.** Un token granulaire ne peut pas être
restreint à `@4sh/ui-kit` tant que ce package n'existe pas sur le registre : la
liste ne propose que des packages déjà publiés. La sélection se fait donc **au
niveau du scope**, pas du package :

| Réglage | Premier publish | Ensuite (rotation) |
|---|---|---|
| Expiration | la plus courte praticable (ex. 30 jours) | 90 jours, à renouveler |
| Packages and scopes | **Read and write** sur le **scope `@4sh`** — couvre les packages à créer | *Read and write* restreint au seul `@4sh/ui-kit` |
| Organizations | `4sh` — lecture seule suffit | idem |

Autrement dit : le premier token est nécessairement un peu plus large (tout le
scope `@4sh`), et une fois `@4sh/ui-kit` publié, on le remplace par un token
strictement limité à ce package. D'où l'expiration courte sur le premier.

> Si le premier publish échoue malgré un token de scope (npm a eu des
> restrictions changeantes sur la **création** d'un package avec un token
> granulaire), le contournement est un token *classic* de type **Automation**,
> utilisé pour ce seul premier publish, puis **révoqué immédiatement** et
> remplacé par le token granulaire.

Pourquoi granulaire plutôt que *classic* en régime normal : un token classique
donne les pleins droits sur **tous** les packages du compte et **n'expire
jamais**. Un token granulaire borné avec expiration limite les dégâts en cas de
fuite.

### L'environment `npm-publish` (approbation humaine)

Le job de publication est rattaché à l'environment **`npm-publish`**. À
configurer **une fois**, sinon la protection n'existe pas :

*Settings → Environments → New environment → `npm-publish`* puis cocher
**Required reviewers** et y mettre les personnes autorisées à publier.

⚠️ **Piège** : référencer un environment qui n'existe pas le fait créer
automatiquement **sans aucune règle de protection**. Le workflow tournerait alors
sans approbation, en donnant l'illusion d'être protégé. À vérifier explicitement.

Le secret `NPM_TOKEN` peut d'ailleurs être posé **sur l'environment** plutôt que
sur le dépôt : il devient alors inaccessible aux workflows qui ne passent pas par
la porte d'approbation.

⚠️ **Ce que le secret protège — et ce qu'il ne protège pas.** Un secret est
*write-only* : personne ne peut le relire dans l'interface, et il est masqué dans
les logs. Mais **toute personne pouvant modifier un workflow peut l'utiliser**
(voire l'exfiltrer) — c'est justement ce que l'approbation de l'environment
ci-dessus vient borner. Le compte de service, lui, limite l'impact à une identité
non nominative : il ne rend pas le token inaccessible.

---

## Publier (voie normale : CI)

La publication passe par le workflow [`publish-ui-kit.yml`](../.github/workflows/publish-ui-kit.yml),
en **déclenchement manuel** — jamais automatique, car l'opération est
irréversible.

Prérequis, une seule fois :

1. Créer l'environment **`npm-publish`** avec ses *required reviewers* (voir plus haut).
2. Y ajouter le token de `4sh-package-admin` sous le nom **`NPM_TOKEN`**
   (*Settings → Environments → npm-publish → Add secret*, ou à défaut en secret
   de dépôt).

Puis, à chaque version :

3. Mettre à jour la version dans `projects/ui-kit/package.json` et l'entrée
   `CHANGELOG.md` correspondante, puis merger sur `main`.
4. *Actions → Publish @4sh/ui-kit to npm → Run workflow* avec **`dry_run: true`** :
   le job `verify` affiche le contenu exact du tarball. Aucune approbation ni
   secret requis à ce stade.
5. Relancer avec **`dry_run: false`** : le job `verify` rejoue, puis `publish`
   **attend l'approbation d'un reviewer** avant de démarrer et de publier.

Le token ne quitte jamais les secrets GitHub : aucune machine de développeur n'en
a besoin.

### Provenance

Le workflow publie avec `--provenance` : npmjs affiche alors un lien vérifiable
entre le tarball et le commit + workflow qui l'a produit. C'est ce qui permet de
prouver *quoi* a été publié *depuis où*, malgré le compte de service partagé.

---

## Publier depuis un poste (secours)

À éviter — le token se retrouve sur la machine. Si nécessaire :

```bash
npm run ui-kit:build
cd dist/ui-kit
npm publish --dry-run          # toujours, d'abord
npm publish
```

L'authentification se fait par `npm login` (compte `4sh-package-admin`) ou via un
`.npmrc` local **non commité**. Ne jamais écrire un token dans un fichier suivi
par git.

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
