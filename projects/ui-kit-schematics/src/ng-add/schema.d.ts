export interface Schema {
  skipInstall?: boolean;
  /** Copie tous les composants disponibles, sans prompt. */
  all?: boolean;
  /** Pose la fondation seule, sans copier de composant. */
  skipComponents?: boolean;
  /** Copie la doc des composants (story + MDX) et la chaîne qui l'alimente. */
  withStorybook?: boolean;
}
