import { Injectable, signal, effect, inject } from '@angular/core';
import { DOCUMENT } from '@angular/common';
import { subdomain } from '@app/app.config';

export type Brand = 'brand1' | 'brand2' | 'brand3';

/** Subdomain → brand (primitive tokens use the modeBrand1/2/3 modes). */
const SUBDOMAIN_TO_BRAND: Record<string, Brand> = {
  themeone: 'brand1',
  themetwo: 'brand2',
  themethree: 'brand3',
};

/**
 * Manages the active brand via the `[data-brand]` attribute on <html>.
 * brand1 = default (:root, no attribute). brand2/brand3 override the
 * `--primitives-*` variables, which propagates to the semantics (which reference them).
 */
@Injectable({ providedIn: 'root' })
export class BrandService {
  private document = inject(DOCUMENT);

  readonly currentBrand = signal<Brand>(SUBDOMAIN_TO_BRAND[subdomain] ?? 'brand1');

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
