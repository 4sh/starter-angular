# @4sh/ui-kit-mcp

Serveur MCP (Model Context Protocol) qui expose le design system **[@4sh/ui-kit](https://www.npmjs.com/package/@4sh/ui-kit)**
à un agent IA de développement (Claude Code, Claude Desktop, Cursor…) : catalogue des
composants `ui-*`, leur API (inputs/outputs/types), leurs tokens, et la doc Storybook
associée — sans que l'agent ait besoin de lire les fichiers sources ou de deviner l'API.

> ⚠️ **Ce package n'est pas publié sur npm.** C'est le code source de dev de ce
> serveur, avec ses tests. Il est **bundlé** (`scripts/mcp-bundle.build.mjs`, esbuild —
> un seul fichier ESM, zéro dépendance à installer) puis **embarqué** dans les deux
> packages qui, eux, sont publiés :
>
> | Consommateur                    | Où le bundle atterrit                 | Qui l'y met                                                     |
> | ------------------------------- | ------------------------------------- | --------------------------------------------------------------- |
> | `npm install @4sh/ui-kit`       | `node_modules/@4sh/ui-kit/mcp/`       | `scripts/ui-kit-mcp-embed.build.mjs`, chaîné dans `ui-kit:pack` |
> | `ng add @4sh/ui-kit-schematics` | `.ui-kit-mcp/` du projet consommateur | `scripts/schematics-assets.build.mjs`, copié par `ng add`       |
>
> Voir le README de chacun de ces deux packages pour l'usage côté consommateur — celui-ci
> ne documente que le développement du serveur lui-même.

## Pourquoi

> Storybook est la source de vérité du kit. Un agent qui lit `.ts`/`.scss` directement
> risque de rater un changement récent, ou de confondre un détail d'implémentation avec
> l'API publique. Ce serveur donne à l'agent un accès direct et toujours à jour à cette
> même doc, sous une forme structurée pensée pour lui.

## Tools exposés

| Tool                | Usage                                                                     |
| ------------------- | ------------------------------------------------------------------------- |
| `list_components`   | Catalogue de tous les composants `ui-*` disponibles.                      |
| `get_component_doc` | Doc complète d'un composant (API, theming, tailles, états, exemples).     |
| `search_docs`       | Recherche plein texte dans toute la doc (composants, fondations, tokens). |
| `get_shared_config` | Config structurelle transverse du kit (`_ui-config.scss`).                |

## Développement (dans ce monorepo)

```bash
npm run mcp:bundle   # régénère la doc, copie le manifeste, bundle → dist/ui-kit-mcp/index.js
npm run mcp:test     # Vitest — logique testée sur fixtures, sans dépendre du manifeste généré
```

Le serveur ne lit jamais le repo en live : il embarque une copie figée du manifeste doc
(`storybook/public/text-search-docs.json`, `storybook/generated/ui-config.json`), prise au
moment du build — voir `src/data.ts`.

Le `version` du `package.json` ci-contre **ne sert à rien** : ne le montez pas à la main.
La version annoncée au client MCP est celle de `@4sh/ui-kit`, tamponnée à l'assemblage par
`scripts/mcp-bundle.build.mjs` — ce que le serveur annonce, c'est la version de la doc
qu'il sert. Le numéro d'ici n'est qu'un repère de développement, comme celui de
`projects/ui-kit-schematics/package.json`.

Pour tester le bundle en conditions réelles (dialogue JSON-RPC brut sur stdio) :

```bash
npm run mcp:bundle
node dist/ui-kit-mcp/index.js   # puis envoyer des requêtes MCP sur stdin
```
