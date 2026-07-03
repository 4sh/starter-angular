/**
 * Niveau sémantique partagé par les composants `ui-*`.
 * Mappé sur les tokens `--actions-{level}-*` / `--token-*` du design system.
 */
export type UiLevel = 'high' | 'low' | 'success' | 'warning' | 'error';

/** Sous-niveau hiérarchique (intensité). */
export type UiSubLevel = 'high' | 'low';

/** Taille standard des composants. */
export type UiSize = 'small' | 'large' | undefined;
