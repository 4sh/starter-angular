import { inject, Injectable, InjectionToken, Provider, signal, effect } from '@angular/core';
import { DOCUMENT } from '@angular/common';

export type Brand = 'brand1' | 'brand2' | 'brand3';

/** Subdomain → brand (primitive tokens use the modeBrand1/2/3 modes). */
const SUBDOMAIN_TO_BRAND: Record<string, Brand> = {
  themeone: 'brand1',
  themetwo: 'brand2',
  themethree: 'brand3',
};

/**
 * Brand the application starts on. Optional — defaults to `brand1`.
 *
 * The kit deliberately does NOT detect the brand itself: how a project picks
 * its brand (subdomain, user setting, backend config…) is an application
 * concern. Provide it with `provideUiKitBrand()`.
 */
export const UI_KIT_INITIAL_BRAND = new InjectionToken<Brand>('UI_KIT_INITIAL_BRAND');

/** Maps a subdomain segment (e.g. "themetwo") to a brand — `brand1` when unknown. */
export function brandFromSubdomain(subdomain: string): Brand {
  return SUBDOMAIN_TO_BRAND[subdomain] ?? 'brand1';
}

/**
 * Sets the initial brand of the application.
 *
 * ```ts
 * providers: [provideUiKitBrand(brandFromSubdomain(subdomain))]
 * ```
 */
export function provideUiKitBrand(brand: Brand): Provider {
  return { provide: UI_KIT_INITIAL_BRAND, useValue: brand };
}

/**
 * Manages the active brand via the `[data-brand]` attribute on <html>.
 * brand1 = default (:root, no attribute). brand2/brand3 override the
 * `--primitives-*` variables, which propagates to the semantics (which reference them).
 */
@Injectable({ providedIn: 'root' })
export class BrandService {
  private document = inject(DOCUMENT);

  readonly currentBrand = signal<Brand>(
    inject(UI_KIT_INITIAL_BRAND, { optional: true }) ?? 'brand1',
  );

  constructor() {
    effect(() => {
      const brand = this.currentBrand();
      const root = this.document.documentElement;
      if (brand === 'brand1') {
        root.removeAttribute('data-brand');
      } else {
        root.setAttribute('data-brand', brand);
      }
    });
  }

  set(brand: Brand) {
    this.currentBrand.set(brand);
  }
}
