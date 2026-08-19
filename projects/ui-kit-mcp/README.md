# @4sh/ui-kit-mcp

Serveur MCP (Model Context Protocol) qui expose le design system **[@4sh/ui-kit](https://www.npmjs.com/package/@4sh/ui-kit)**
à un agent IA de développement (Claude Code, Claude Desktop, Cursor…) : catalogue des
composants `ui-*`, leur API (inputs/outputs/types), leurs tokens, et la doc Storybook
associée — sans que l'agent ait besoin de lire les fichiers sources ou de deviner l'API.

## Pourquoi

> Storybook est la source de vérité du kit. Un agent qui lit `.ts`/`.scss` directement
> risque de rater un changement récent, ou de confondre un détail d'implémentation avec
> l'API publique. Ce serveur donne à l'agent un accès direct et toujours à jour à cette
> même doc, sous une forme structurée pensée pour lui.

## Installation

Rien à installer dans le projet — le serveur se lance à la demande via `npx` et se
déclare dans la config MCP du client :

```json
{
  "mcpServers": {
    "ui-kit": {
      "command": "npx",
      "args": ["-y", "@4sh/ui-kit-mcp"]
    }
  }
}
```

- Projets créés via `ng add @4sh/ui-kit-schematics` : cette configuration est écrite
  automatiquement (voir le schematic `ng-add`).
- Projets utilisant `@4sh/ui-kit` seul (`npm install`) : copier le snippet ci-dessus dans
  le `.mcp.json` du projet (ou l'équivalent pour Claude Desktop/Cursor).

Pour qu'un agent privilégie ces outils plutôt que de lire les sources, ajouter dans le
`CLAUDE.md`/`AGENTS.md` du projet consommateur : *"Avant d'utiliser un composant `ui-*`,
interroge le serveur MCP `ui-kit` (`get_component_doc`) plutôt que de lire les sources —
c'est la source de vérité, toujours à jour."*

## Tools exposés

| Tool | Usage |
|---|---|
| `list_components` | Catalogue de tous les composants `ui-*` disponibles. |
| `get_component_doc` | Doc complète d'un composant (API, theming, tailles, états, exemples). |
| `search_docs` | Recherche plein texte dans toute la doc (composants, fondations, tokens). |
| `get_shared_config` | Config structurelle transverse du kit (`_ui-config.scss`). |

## Développement (dans ce monorepo)

```bash
npm run mcp:build   # régénère la doc, copie le manifeste, compile → dist/ui-kit-mcp
npm run mcp:pack    # + npm pack, pour tester l'installation d'un tarball local
npm run mcp:test    # Vitest — logique testée sur fixtures, sans dépendre du manifeste généré
```

Le serveur ne lit jamais le repo en live : il embarque une copie figée du manifeste doc
(`storybook/public/text-search-docs.json`, `storybook/generated/ui-config.json`), prise au
moment du build — voir `src/data.ts`.
