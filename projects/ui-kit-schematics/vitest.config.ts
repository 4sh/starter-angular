import { defineConfig } from 'vitest/config';

// Package Node pur, comme projects/ui-kit-mcp : Vitest tourne directement sur
// les `.spec.ts` (exclus du build par tsconfig.json). Les specs lisent `assets/`,
// produit par `pnpm schematics:assets` : lancer `pnpm schematics:test`, qui le
// régénère d'abord.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    passWithNoTests: false,
  },
});
