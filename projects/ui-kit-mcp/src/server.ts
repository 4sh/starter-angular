/**
 * server — déclare le serveur MCP et ses tools. Un seul serveur, transport
 * injecté par l'appelant (`index.ts`) : garde ce module testable sans process
 * stdio réel.
 */
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z } from 'zod';
import { listComponents, LIST_COMPONENTS_DESCRIPTION } from './tools/list-components.js';
import { getComponentDoc, GET_COMPONENT_DOC_DESCRIPTION } from './tools/get-component-doc.js';
import { searchDocs, SEARCH_DOCS_DESCRIPTION } from './tools/search-docs.js';
import { getSharedConfig, GET_SHARED_CONFIG_DESCRIPTION } from './tools/get-shared-config.js';

// Lu au runtime plutôt qu'importé : évite de dépendre du support "import
// attributes" (`with { type: 'json' }`) côté Node du consommateur (Node 18
// minimum visé, cf. `engines`). Une fois packagé, `package.json` est copié à
// côté du JS compilé (même dossier, `tsconfig.json` aplatit `src/`) ; en dev
// (`tsx src/index.ts`) il vit un niveau au-dessus — on tente les deux.
const HERE = dirname(fileURLToPath(import.meta.url));
function readOwnVersion(): string {
  for (const candidate of [join(HERE, 'package.json'), join(HERE, '..', 'package.json')]) {
    try {
      return JSON.parse(readFileSync(candidate, 'utf8')).version;
    } catch {
      // essaie le candidat suivant
    }
  }
  return '0.0.0';
}
const version = readOwnVersion();

export function createServer(): McpServer {
  const server = new McpServer({ name: '@4sh/ui-kit-mcp', version });

  server.registerTool(
    'list_components',
    { description: LIST_COMPONENTS_DESCRIPTION, inputSchema: {} },
    async () => listComponents(),
  );

  server.registerTool(
    'get_component_doc',
    {
      description: GET_COMPONENT_DOC_DESCRIPTION,
      inputSchema: { name: z.string().describe('Nom du composant, ex. "ui-button".') },
    },
    async ({ name }) => getComponentDoc(name),
  );

  server.registerTool(
    'search_docs',
    {
      description: SEARCH_DOCS_DESCRIPTION,
      inputSchema: {
        query: z.string().describe('Termes recherchés, en langage naturel ou mots-clés.'),
        limit: z
          .number()
          .int()
          .positive()
          .max(50)
          .optional()
          .describe('Nombre de résultats max (défaut 10).'),
      },
    },
    async ({ query, limit }) => searchDocs(query, limit),
  );

  server.registerTool(
    'get_shared_config',
    { description: GET_SHARED_CONFIG_DESCRIPTION, inputSchema: {} },
    async () => getSharedConfig(),
  );

  return server;
}
