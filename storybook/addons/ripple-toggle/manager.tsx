/**
 * Addon local « effet ripple » — côté manager.
 *
 * Un interrupteur dans la barre d'outils, posé juste avant le bouton clair /
 * sombre, qui active l'onde de pression (`@4sh/ui-kit/ripple`) sur toutes les
 * stories : les neuf composants équipés d'office y répondent sans qu'aucune
 * story ait à être modifiée.
 *
 * Il n'écrit que le global `ripple` ; c'est le décorateur `withRipple`
 * (`storybook/ripple-toolbar.ts`) qui le traduit côté preview. Le moteur, lui,
 * est branché une fois pour toutes par `provideUiRipple()` dans `preview.ts`.
 *
 * Le bouton reprend `IconButton` plutôt que le `Trigger` maison des deux autres
 * outils : c'est le composant qu'utilise le toggle clair / sombre, son voisin
 * immédiat, et un interrupteur en icône seule n'a pas de libellé à porter.
 */

import React, { useCallback } from 'react';
import { addons, types, useGlobals } from 'storybook/manager-api';
import { IconButton } from 'storybook/internal/components';
import { RIPPLE_GLOBAL, RIPPLE_ON } from '../../ripple-toolbar';

const ADDON_ID = '4sh/ripple-toggle';
const TOOL_ID = `${ADDON_ID}/tool`;

/**
 * Un pointeur, et l'onde qui part de son point de contact : deux fronts de
 * plus en plus pâles vers l'extérieur. Des anneaux concentriques seuls se
 * liraient « cible » ; c'est le curseur qui dit qu'il s'agit d'un clic.
 * Éteint, un trait barre le tout sans effacer les arcs, sinon il ne resterait
 * qu'une barre à la taille de la barre d'outils.
 */
const RippleGlyph = ({ on }: { on: boolean }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none" aria-hidden="true">
    <path d="M7.6 7.1 14.2 9.6l-2.8 1.15 2.05 3.2-1.6 1.05-2.05-3.2L8 13.8z" fill="currentColor" />
    <path
      d="M4.5 8.5a4 4 0 1 1 4.3 3.2"
      stroke="currentColor"
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.8"
    />
    <path
      d="M1.9 9.2a6.7 6.7 0 1 1 7.5 5.1"
      stroke="currentColor"
      strokeWidth="1.3"
      strokeLinecap="round"
      opacity="0.5"
    />
    {!on && (
      <path d="M2.5 13.5 13.5 2.5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" />
    )}
  </svg>
);

function RippleToggle() {
  const [globals, updateGlobals] = useGlobals();
  const on = globals[RIPPLE_GLOBAL] === RIPPLE_ON;

  const toggle = useCallback(
    () => updateGlobals({ [RIPPLE_GLOBAL]: on ? 'off' : RIPPLE_ON }),
    [on, updateGlobals],
  );

  return (
    <IconButton
      active={on}
      onClick={toggle}
      ariaLabel={on ? "Désactiver l'effet ripple" : "Activer l'effet ripple"}
      tooltip={
        on
          ? 'Onde de pression active sur les composants équipés (provideUiRipple)'
          : "Activer l'onde de pression sur les composants équipés (provideUiRipple)"
      }
    >
      <RippleGlyph on={on} />
    </IconButton>
  );
}

addons.register(ADDON_ID, () => {
  addons.add(TOOL_ID, {
    type: types.TOOL,
    title: 'Effet ripple',
    match: ({ viewMode }) => viewMode === 'story' || viewMode === 'docs',
    render: () => <RippleToggle />,
  });
});
