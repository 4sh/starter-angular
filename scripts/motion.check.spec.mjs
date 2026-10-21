import { describe, expect, it } from 'vitest';

import { findMotionProblems } from './motion.check.mjs';

const rules = (scss) => findMotionProblems(scss).map((p) => p.rule);

describe('motion.check — timing écrit à la main', () => {
  it('accepte un composant qui passe par les recettes', () => {
    expect(
      rules(`
.x {
  @include utils.control-transition(background-color, transform);
  animation: ui-motion-fade-in #{utils.$motion-overlay-in-duration} #{utils.$motion-overlay-in-easing} both;
  --ui-motion-easing: #{utils.$motion-easing-enter};
}
$item-delay: var(--ui-speed-dial-item-delay, #{utils.$motion-stagger-delay}); /// Décalage de 80ms.
`),
    ).toEqual([]);
  });

  it('laisse passer les coupe-circuits', () => {
    expect(
      rules(`
.x { transition: none; }
.y { transition-duration: 0.01ms; animation-delay: 0ms; }
`),
    ).toEqual([]);
  });

  it('refuse une durée brute, dans une déclaration comme dans une variable', () => {
    expect(rules('.x { transition: opacity 180ms; }')).toContain('A');
    expect(rules('.x { animation: spin var(--ui-spinner-duration, 1.2s) infinite; }')).toContain(
      'A',
    );
    expect(rules('$indeterminate-duration: var(--ui-x-duration, 1.6s);')).toEqual(['A']);
  });

  it('refuse une courbe brute, mot-clé ou fonction', () => {
    expect(rules('.x { animation: ui-skeleton-wave var(--y) ease-in-out infinite; }')).toEqual([
      'B',
    ]);
    expect(rules('.x { transition-timing-function: cubic-bezier(0.2, 0, 0, 1); }')).toEqual(['B']);
    expect(rules('.x { animation: ui-spinner-rotate var(--y) linear infinite; }')).toEqual(['B']);
  });

  it('refuse la lecture directe d’une primitive', () => {
    expect(rules('.x { animation: fade var(--transition-default) both; }')).toContain('C');
  });

  it('ignore les commentaires', () => {
    expect(rules('.x { color: red; } // transition: opacity 180ms ease-in')).toEqual([]);
  });
});
