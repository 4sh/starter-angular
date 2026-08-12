import { Component } from '@angular/core';
import type { Decorator } from '@storybook/angular';

/**
 * Restores the `@Component` / `@Directive` metadata that the Angular linker drops.
 *
 * The stories import the kit from its built package (`@4sh/ui-kit/*` → `dist/ui-kit`),
 * whose fesm files are partially compiled: the linker only re-emits
 * `setClassMetadata()` in JIT mode, so in `build-storybook` the classes arrive with
 * their `ɵcmp` / `ɵdir` but no `__annotations__`. `@storybook/angular` reads those
 * annotations, and two of its features break without them:
 *
 * - the implicit template of a story that only declares `component` + `args`
 *   (`computesTemplateFromComponent`) → `Cannot read properties of undefined
 *   (reading 'selector')`;
 * - the "props that are neither inputs nor outputs" pass, which assigns them straight
 *   onto the story component instance. Its fallback (`ɵgetComponentDef`) only reads
 *   `ɵcmp`, so for a **directive** every arg looks like a plain prop and overwrites the
 *   input signals → `this.<input> is not a function`.
 *
 * The definition still carries everything needed, so we re-publish the selector and the
 * inputs / outputs as an annotation before the story renders.
 */
interface ComponentDefLike {
  selectors?: unknown[];
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
}

type AnnotatedType = Record<string, unknown> & { ɵcmp?: ComponentDefLike; ɵdir?: ComponentDefLike };

/**
 * `selectors` is the CSS-selector-list encoding of the compiler:
 * `[['ui-button']]` for an element, `[['', 'uiTooltip', '']]` for an attribute.
 */
const selectorOf = (def: ComponentDefLike): string | undefined => {
  const first = Array.isArray(def.selectors) ? def.selectors[0] : undefined;
  if (!Array.isArray(first)) return undefined;

  const [element, ...rest] = first as unknown[];
  if (typeof element === 'string' && element.length > 0) return element;

  // Attribute selectors are flattened as name / value pairs.
  const attributes = rest
    .filter((_, index) => index % 2 === 0)
    .filter((name): name is string => typeof name === 'string' && name.length > 0)
    .map((name) => `[${name}]`)
    .join('');

  return attributes || undefined;
};

/** Mirrors how Storybook itself reads `def.inputs` (`string` or `[propName, …flags]`). */
const inputsOf = (def: ComponentDefLike) =>
  Object.entries(def.inputs ?? {}).map(([publicName, raw]) => ({
    name: (Array.isArray(raw) ? (raw[0] as string) : (raw as string)) ?? publicName,
    alias: publicName,
  }));

const outputsOf = (def: ComponentDefLike) => Object.keys(def.outputs ?? {});

export const withComponentMetadata: Decorator = (story, context) => {
  const type = context.component as AnnotatedType | undefined;
  const def = type?.ɵcmp ?? type?.ɵdir;

  if (type && def && !Object.prototype.hasOwnProperty.call(type, '__annotations__')) {
    const selector = selectorOf(def);
    if (selector) {
      // Always a `Component` annotation, directives included: Storybook only keeps the
      // annotations that are `instanceof Component` (`getComponentDecoratorMetadata`), so a
      // `Directive` one would be ignored and its inputs would stay invisible. This
      // annotation is a Storybook-side shim — Angular itself renders from `ɵcmp` / `ɵdir`.
      const asComponent = Component as unknown as new (meta: {
        selector: string;
        inputs: { name: string; alias: string }[];
        outputs: string[];
      }) => unknown;

      Object.defineProperty(type, '__annotations__', {
        value: [new asComponent({ selector, inputs: inputsOf(def), outputs: outputsOf(def) })],
        configurable: true,
      });
    }
  }

  return story();
};
