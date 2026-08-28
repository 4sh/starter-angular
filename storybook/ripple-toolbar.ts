import type { Decorator } from '@storybook/angular';

// =====================================================================
// Ripple switch for the Storybook toolbar.
//
// The engine is installed once for the whole preview (`provideUiRipple()` in
// `preview.ts`), so switching it is a matter of muting it, not of rebuilding
// it: the kit's documented kill switch is `data-ripple="off"` on an ancestor,
// and <html> is the ancestor of everything, overlays included.
//
// The button that writes this global lives in
// `storybook/addons/ripple-toggle/`.
// =====================================================================

/** Global written by the toolbar button, read here. */
export const RIPPLE_GLOBAL = 'ripple';
/** Value that turns the effect on. */
export const RIPPLE_ON = 'on';
/** Off by default: a project that never calls `provideUiRipple()` sees no wave. */
export const DEFAULT_RIPPLE = 'off';

/** Mutes or unmutes the effect for every story, exactly as an application would. */
export const withRipple: Decorator = (Story, context) => {
  if (typeof document !== 'undefined') {
    const on = (context.globals[RIPPLE_GLOBAL] ?? DEFAULT_RIPPLE) === RIPPLE_ON;
    const root = document.documentElement;
    if (on) root.removeAttribute('data-ripple');
    else root.setAttribute('data-ripple', 'off');
  }
  return Story();
};
