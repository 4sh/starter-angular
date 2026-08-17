# @4sh/ui-kit-schematics

*[English](./README.md) · **Français***

Package compagnon de **[`@4sh/ui-kit`](https://www.npmjs.com/package/@4sh/ui-kit)** :
il porte les *sources brutes* des composants du Design System, et les schematics
Angular qui les recopient dans un projet consommateur.

**Documentation complète (Storybook)** :
<https://4sh.github.io/starter-angular/?path=/docs/introduction--docs>

---

## ⚠️ Ne pas installer ce package directement

Vous ne l'installez jamais vous-même, et vous n'épinglez jamais sa version. Il
est tiré automatiquement par le kit :

```bash
ng add @4sh/ui-kit
```

Tout est documenté sur
[`@4sh/ui-kit`](https://www.npmjs.com/package/@4sh/ui-kit) — c'est ce package
qu'il faut lire, et le seul dont dépendre.

---

## Pourquoi un package séparé

`ng-packagr` *inline* template et SCSS dans le `.mjs` publié. Les sources que
`ng generate @4sh/ui-kit:add` doit copier n'existent donc nulle part dans le
tarball du kit. Les garder ici a une conséquence voulue : un consommateur
classique de `@4sh/ui-kit`, qui importe seulement les composants compilés, ne les
télécharge jamais.

Le kit expose une façade de schematics sans aucune logique, qui délègue à ce
package. C'est toute la relation entre les deux.

## Contenu

| | |
|---|---|
| `ng-add` | fondation : styles, tokens, `angular.json` |
| `add` | copie les composants dans le projet (sélection interactive, ou `--all`) |
| `update` | diff par composant face aux sources publiées |
| `assets/` | les sources brutes des composants, et la chaîne de génération des tokens |

## Versionnage

**Les deux packages portent toujours le même numéro de version**, estampillé
depuis celui du kit à l'assemblage — la façade du kit réclame le compagnon en
`^<version du kit>`. Il n'y a rien à tenir à jour à la main, ni aucune raison
d'épingler ce package vous-même.

Voir [`docs/VERSIONING.md`](https://github.com/4sh/starter-angular/blob/main/docs/VERSIONING.md)
et [`docs/PUBLISHING.md`](https://github.com/4sh/starter-angular/blob/main/docs/PUBLISHING.md).

---

## Licence

Apache-2.0 — Copyright 2026 4SH.
