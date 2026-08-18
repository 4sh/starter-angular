export interface Schema {
  /** Noms explicites (`ui-button`, `ui-select`…) — court-circuite le prompt interactif. */
  components?: string[];
  /** Copie tous les composants disponibles, sans prompt. */
  all?: boolean;
  /** Copie aussi la story et le MDX de chaque composant. Omis → on reconduit le
   * choix mémorisé dans `ui-kit.json` à l'installation. */
  withStorybook?: boolean;
}
