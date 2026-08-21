export interface Schema {
  /**
   * Applique toutes les mises à jour sans afficher les diffs ni demander
   * confirmation. `update` remplaçant au lieu de fusionner, cela écrase les
   * retouches locales sur les composants concernés — d'où `force` et non `yes`.
   */
  force?: boolean;
}
