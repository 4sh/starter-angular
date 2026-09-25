import { describe, expect, it } from 'vitest';
import { listComponents, listSharedBases } from './component-registry';
import { renderUnitFiles } from './copy';

// Le seul endroit où TOUS les imports du kit passent par la réécriture. Sans
// lui, un import que la table ne sait pas réadresser n'échoue que chez le
// consommateur, au `ng add` : c'est ainsi que `type UiIconSize` (ui-input-date)
// est parti en 0.11.0 et 0.12.0.
describe('renderUnitFiles, sur chaque unité du kit', () => {
  const units = [...listComponents(), ...listSharedBases()];

  it('trouve les unités (assets/ généré)', () => {
    // Une liste vide ferait passer la suite sans rien vérifier.
    expect(listComponents().length).toBeGreaterThan(40);
    expect(listSharedBases().length).toBeGreaterThan(0);
  });

  it.each(units.map((unit) => [unit.name, unit] as const))(
    '%s : aucun import du kit non réadressé',
    (_name, unit) => {
      expect(() => renderUnitFiles(unit, '0.0.0-test', { withStorybook: true })).not.toThrow();
    },
  );
});
