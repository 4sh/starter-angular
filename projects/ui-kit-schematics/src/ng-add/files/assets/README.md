# `src/assets/`

Arborescence d'assets posée par `ng add @4sh/ui-kit-schematics`. Elle est servie
sous `/assets/` par le builder Angular (entrée ajoutée à `angular.json`), et
c'est ce chemin-là que les composants du kit résolvent.

Les dossiers vides portent un `.gitkeep` : sans lui, ni git ni le schematic ne
peuvent poser un dossier sans fichier. Supprimez-le dès que vous y déposez
quelque chose.

```
src/assets/
├── favicon.png              ← placeholder, à remplacer (référencé par src/index.html)
├── assets-map.json          ← index des images locales lues par `ui-image`
├── fonts/
│   ├── police/              ← vos fichiers de police (.woff2 de préférence)
│   └── icon/                ← polices d'icônes, si vous en avez
└── img/
    ├── common/              ← visuels partagés par toutes les marques
    │   ├── jpg/
    │   ├── png/
    │   └── svg/
    │       └── flags/       ← drapeaux (fournis) pour l'indicatif de ui-input-group
    ├── brand1/              ← visuels propres à la marque 1 (marque par défaut)
    ├── brand2/
    └── brand3/              ← même sous-arborescence jpg/ png/ svg/
```

Un visuel qui change entre thème clair et thème sombre se range dans un
sous-dossier `light/` ou `dark/` du type concerné (ex.
`img/common/svg/dark/logo.svg`). Ces deux dossiers ne sont pas échafaudés — ils
sont l'exception, pas la règle : créez-les là où vous en avez besoin.

Ni les polices ni les images de démonstration ne sont fournies : le kit livre
l'emplacement, votre projet livre le contenu. Seuls les drapeaux (génériques) et
le favicon (placeholder) sont posés.

## Polices

Les fichiers ne sont **pas** fournis : les design tokens ne font que _nommer_ les
familles (`--fontfamily-base`, `--fontfamily-title`), chaque famille se terminant
par une pile système. Sans police embarquée, le rendu tombe sur le sans-serif de
l'OS — jamais sur le serif du navigateur.

Pour embarquer les vôtres : déposez-les dans `fonts/police/`, déclarez-les dans
`src/styles/vendors/_fonts.scss` (le scaffold porte le mixin et un exemple
commenté), et surchargez-y `--fontfamily-*` en **gardant la queue de pile**.

Un `.woff2` suffit : supporté partout, et une _variable font_ couvre toute la
plage de graisses en une seule ressource.

## Images et `assets-map.json`

`ui-image` ne devine pas votre arborescence : il résout un nom de fichier via
`assets-map.json`, en fonction de la marque active (`BrandService`) et du mode
clair/sombre (`ThemeService`). Le fichier est posé vide (`{}`) — à vous de
l'alimenter.

Une entrée par nom de fichier, puis une clé par marque (`common`, `brand1`,
`brand2`, `brand3`), puis le type de fichier par variante :

```json
{
  "logo.svg": {
    "common": { "light": "svg", "dark": "svg" }
  },
  "hero.png": {
    "brand2": { "base": "png" },
    "common": { "base": "png" }
  }
}
```

Ce que le composant va chercher :

| Entrée                        | Chemin résolu                                                  |
| ----------------------------- | -------------------------------------------------------------- |
| `{ "light": "svg" }` en clair | `assets/img/common/svg/light/logo.svg`                         |
| `{ "dark": "svg" }` en sombre | `assets/img/common/svg/dark/logo.svg`                          |
| `{ "base": "png" }`           | `assets/img/common/png/hero.png` (pas de sous-dossier de mode) |

La marque active est essayée d'abord, `common` sert de repli. Un nom absent de la
map — ou un fichier manquant — affiche le placeholder tokenisé du composant,
jamais une image cassée.

> Les clés de marque sont celles que `BrandService` émet : `brand1` (défaut),
> `brand2`, `brand3`. Renommez les dossiers si votre projet nomme ses marques
> autrement — c'est la même chaîne des deux côtés.

## Favicon

`favicon.png` est un **placeholder**, référencé par `src/index.html`. Remplacez le
fichier (même nom, ou ajustez le `<link rel="icon">`). Le `public/favicon.ico`
qu'`ng new` avait posé n'est plus référencé : à supprimer si vous ne le
réutilisez pas.
