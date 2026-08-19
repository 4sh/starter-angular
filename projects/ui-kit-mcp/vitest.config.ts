import { defineConfig } from 'vitest/config';

// Package Node pur (pas de builder Angular ici, cf. tsconfig.json) : Vitest
// tourne directement sur les `.spec.ts`, sans étape de build ni DOM.
export default defineConfig({
  test: {
    environment: 'node',
    include: ['src/**/*.spec.ts'],
    passWithNoTests: false,
  },
});
