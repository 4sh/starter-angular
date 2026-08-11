import type { Decorator, Preview } from '@storybook/angular';

// =====================================================================
// Brand selector for the Storybook toolbar.
//
// Exact mirror of `BrandService` (@4sh/ui-kit/theming):
// the brand is carried by `[data-brand]` on <html>, and since `brand1` is
// the default (emitted under `:root` by the token pipeline) the attribute
// is removed rather than set to `brand1`.
//
// PROJECT WITHOUT MULTI-BRAND → remove everything in 4 steps: delete this
// file, then in `storybook/preview.ts` remove the import, the `initialGlobals`
// key, and `withBrand` from `decorators`. Nothing else depends on it.
// =====================================================================

/** Brands declared by the `primitives` collection (modeBrand1/2/3). */
export const BRANDS = [
  { value: 'brand1', title: 'Brand 1' },
  { value: 'brand2', title: 'Brand 2' },
  { value: 'brand3', title: 'Brand 3' },
];

/** Brand served by `:root`: it has no attribute of its own. */
export const DEFAULT_BRAND = 'brand1';

// Typed here rather than at usage: `toolbar.icon` is a union of Storybook
// icon names, not a free `string` — the annotation validates it in the right place.
export const brandGlobalTypes: NonNullable<Preview['globalTypes']> = {
  brand: {
    description: 'Active brand (primitives collection)',
    toolbar: { title: 'Brand', icon: 'paintbrush', items: BRANDS, dynamicTitle: true },
  },
};

/**
 * Applies the selected brand, just like `BrandService` does in the application.
 *
 * Set on <html> rather than on a story container: semantic tokens
 * reference primitives via `var(--primitives-*)`, resolved on the element
 * that consumes them — the attribute must therefore be above all rendering,
 * including overlays that Storybook adds on <body>.
 */
export const withBrand: Decorator = (Story, context) => {
  if (typeof document !== 'undefined') {
    const brand = (context.globals['brand'] as string | undefined) ?? DEFAULT_BRAND;
    const root = document.documentElement;
    if (brand === DEFAULT_BRAND) root.removeAttribute('data-brand');
    else root.setAttribute('data-brand', brand);
  }
  return Story();
};
