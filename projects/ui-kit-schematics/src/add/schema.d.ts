export interface Schema {
  /** Noms explicites (`ui-button`, `ui-select`…) — court-circuite le prompt interactif. */
  components?: string[];
  /** Copie tous les composants disponibles, sans prompt. */
  all?: boolean;
}
