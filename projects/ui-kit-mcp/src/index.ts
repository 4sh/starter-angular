#!/usr/bin/env node
/**
 * index — point d'entrée, bundlé en un seul fichier autonome (voir
 * `scripts/mcp-bundle.build.mjs`). Transport stdio uniquement pour l'instant :
 * lancé localement par le client (Claude Code, Claude Desktop…) via
 * `node <chemin du bundle>`, jamais exposé en réseau.
 */
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { createServer } from './server.js';

async function main() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  // stdout est réservé au protocole MCP ; stderr est le seul canal de log valide ici.
  console.error('[@4sh/ui-kit-mcp] échec au démarrage :', error);
  process.exit(1);
});
