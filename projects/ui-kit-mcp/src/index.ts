#!/usr/bin/env node
/**
 * index — point d'entrée du bin `ui-kit-mcp`. Transport stdio uniquement pour
 * l'instant (usage nominal MCP : lancé par le client — Claude Code, Claude
 * Desktop… — via `npx -y @4sh/ui-kit-mcp`, jamais exposé en réseau).
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
