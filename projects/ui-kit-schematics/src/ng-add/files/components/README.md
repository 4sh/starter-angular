# `src/app/shared/components/`

Dossier posé par `ng add @4sh/ui-kit-schematics`. C'est la racine que la
configuration Storybook (`storybook/main.js`) balaie pour y trouver stories et
MDX — les copies du kit comme vos propres composants.

```
src/app/shared/components/
├── ui/                      ← 🔒 copies du kit, écrites par le schematic
│   └── {catégorie}/ui-{nom}/
└── {vos composants}/        ← ✏️ à vous
```

`ui/` n'apparaît qu'à la première copie :

```
ng generate @4sh/ui-kit-schematics:add
```

Une fois copié, un composant vous appartient : éditez-le. `ng generate
@4sh/ui-kit-schematics:update` compare vos copies à la version installée du kit
et vous propose le diff — il n'écrase rien sans vous le montrer.

Les bases partagées entre composants (directives, services, types, helpers de
formulaire) ne sont **pas** ici : elles vont dans `src/app/shared/ui-core/`,
créé lui aussi à la première copie qui en tire une.

Une story écrite à côté de votre propre composant est indexée sans rien changer
à `storybook/main.js`.
