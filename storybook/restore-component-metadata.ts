import { Component } from '@angular/core';
import type { Decorator } from '@storybook/angular';

/**
 * Restores the `@Component` decorator metadata that the Angular linker drops.
 *
 * The stories import the kit from its built package (`@4sh/ui-kit/*` → `dist/ui-kit`),
 * whose fesm files are partially compiled: the linker only re-emits
 * `setClassMetadata()` in JIT mode, so in `build-storybook` the classes end up with
 * `ɵcmp` but no `__annotations__`. `@storybook/angular` reads those annotations to
 * build the implicit template of a story that only declares `component` + `args`
 * (`computesTemplateFromComponent`), and crashes on the missing selector:
 * `Cannot read properties of undefined (reading 'selector')`.
 *
 * The component definition still carries everything needed, so we re-publish the
 * selector as an annotation before the story renders. Inputs/outputs are already
 * read from `ɵcmp` by Storybook, and `standalone` defaults to `true` on Angular ≥ 19.
 */
const selectorOf = (def: unknown): string | undefined => {
  const selectors = (def as { selectors?: unknown[] } | undefined)?.selectors;
  const first = Array.isArray(selectors) ? selectors[0] : undefined;
  if (!Array.isArray(first)) return undefined;
  return first.find((part): part is string => typeof part === 'string' && part.length > 0);
};

export const withComponentMetadata: Decorator = (story, context) => {
  const type = context.component as (Record<string, unknown> & { ɵcmp?: unknown }) | undefined;

  if (type && type.ɵcmp && !Object.prototype.hasOwnProperty.call(type, '__annotations__')) {
    const selector = selectorOf(type.ɵcmp);
    if (selector) {
      Object.defineProperty(type, '__annotations__', {
        value: [new (Component as unknown as new (meta: { selector: string }) => unknown)({ selector })],
        configurable: true,
      });
    }
  }

  return story();
};
