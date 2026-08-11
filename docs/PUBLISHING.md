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
| Token dans GitHub | secret `NPM_TOKEN` du dépôt |

> Une organisation npm ne peut pas porter d'access token elle-même : c'est la
> raison d'être du compte `4sh-package-admin`.

### Générer le token (granulaire, pas classique)

Sur npmjs, connecté en `4sh-package-admin` : *Access Tokens → Generate New Token
→ **Granular Access Token***.

| Réglage | Valeur |
|---|---|
| Expiration | la plus courte praticable (ex. 90 jours) — à renouveler |
| Packages and scopes | **Read and write**, restreint au seul package `@4sh/ui-kit` |
| Organizations | `4sh` en lecture seule si demandé |

Pourquoi granulaire plutôt qu'un token *classic* : un token classique donne les
pleins droits sur **tous** les packages du compte et **n'expire jamais**. Un token
granulaire limité à `@4sh/ui-kit` avec expiration borne les dégâts en cas de fuite.

⚠️ **Ce que le secret GitHub protège — et ce qu'il ne protège pas.** Un secret est
*write-only* : personne ne peut le relire dans l'interface, et il est masqué dans
les logs. Mais **toute personne pouvant modifier un workflow peut l'utiliser**
(voire l'exfiltrer). Le compte de service limite donc l'impact à une identité non
nominative — il ne rend pas le token inaccessible. Pour resserrer davantage :
placer la publication dans un *environment* GitHub protégé par *required
reviewers*, ce qui exige une approbation humaine avant que le job n'accède au
secret.

---

## Publier (voie normale : CI)

La publication passe par le workflow [`publish-ui-kit.yml`](../.github/workflows/publish-ui-kit.yml),
en **déclenchement manuel** — jamais automatique, car l'opération est
irréversible.

1. Prérequis, une seule fois : ajouter le token de `4sh-package-admin` dans
   *Settings → Secrets and variables → Actions* du dépôt, sous le nom **`NPM_TOKEN`**.
2. Mettre à jour la version dans `projects/ui-kit/package.json` et l'entrée
   `CHANGELOG.md` correspondante, puis merger sur `main`.
3. *Actions → Publish @4sh/ui-kit to npm → Run workflow* avec **`dry_run: true`** :
   le job affiche le contenu exact du tarball sans rien publier.
4. Relancer avec **`dry_run: false`** pour publier.

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
