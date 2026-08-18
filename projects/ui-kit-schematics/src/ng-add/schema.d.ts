export interface Schema {
  skipInstall?: boolean;
  /** Noms explicites (`ui-button`, `ui-select`…) — court-circuite le prompt interactif. */
  components?: string[];
  /** Copie tous les composants disponibles, sans prompt. */
  all?: boolean;
  /** Pose la fondation seule, sans copier de composant. */
  skipComponents?: boolean;
}
