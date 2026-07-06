/**
 * Semantic level shared by the `ui-*` components.
 * Mapped to the design system's `--actions-{level}-*` / `--token-*` tokens.
 */
export type UiLevel = 'high' | 'low' | 'success' | 'warning' | 'error';

/** Hierarchical sub-level (intensity). */
export type UiSubLevel = 'high' | 'low';

/**
 * Level of informative feedback
 */
export type UiFeedbackLevel = 'default' | 'highlight' | Extract<UiLevel, 'success' | 'warning' | 'error'>;
