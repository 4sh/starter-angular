export interface Schema {
  skipInstall?: boolean;
  /** Copie tous les composants disponibles, sans prompt. */
  all?: boolean;
  /** Pose la fondation seule, sans copier de composant. */
  skipComponents?: boolean;
  /** Ne pas poser de Storybook : ni doc des composants (story + MDX), ni
   * configuration, ni dépendances de preview. Posé par défaut. */
  skipStorybook?: boolean;
  /** Ne pas déclarer le serveur MCP `ui-kit` (.mcp.json) ni l'instruction
   * agent (AGENTS.md). Posé par défaut. */
  skipMcp?: boolean;
  /** Poser la grille Gridaflex (réglages + dépendance). */
  gridaflex?: boolean;
}
