import { describe, expect, it } from 'vitest';
import { rewriteKitImports, symbolName } from './rewrite-imports';

const FROM = 'src/app/shared/components/ui/forms/ui-input-date/ui-input-date.ts';

describe('symbolName', () => {
  it.each([
    ['UiIcon', 'UiIcon'],
    ['UiIcon as Icon', 'UiIcon'],
    ['type UiIconSize', 'UiIconSize'],
    ['  type UiIconSize as Size ', 'UiIconSize'],
  ])('%s → %s', (clause, expected) => {
    expect(symbolName(clause)).toBe(expected);
  });
});

describe('rewriteKitImports', () => {
  it('réadresse un symbole importé avec le modificateur `type` en ligne', () => {
    const { content, unresolved } = rewriteKitImports(
      "import { UiIcon, type UiIconSize } from '@4sh/ui-kit/base/ui-icon';",
      FROM,
    );
    expect(unresolved).toEqual([]);
    expect(content).not.toContain('@4sh/ui-kit');
    // Le modificateur survit à la réécriture : l'import reste valide pour
    // `verbatimModuleSyntax` / `isolatedModules`.
    expect(content).toMatch(/import \{ UiIcon, type UiIconSize \} from '\.\.?\/[^']*ui-icon';/);
  });

  it('garde un import `type` complet en `import type`', () => {
    const { content, unresolved } = rewriteKitImports(
      "import type { UiIconSize } from '@4sh/ui-kit/base/ui-icon';",
      FROM,
    );
    expect(unresolved).toEqual([]);
    expect(content).toMatch(/^import type \{ UiIconSize \} from '/);
  });

  it('signale un symbole que le kit n’exporte pas, sans deviner', () => {
    const { unresolved } = rewriteKitImports(
      "import { NotAKitSymbol } from '@4sh/ui-kit/base/ui-icon';",
      FROM,
    );
    expect(unresolved).toEqual(['base/ui-icon (symbole NotAKitSymbol)']);
  });
});
