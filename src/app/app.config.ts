import { ApplicationConfig, provideZoneChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { provideAnimations } from '@angular/platform-browser/animations';
import { routes } from './app.routes';

/**
 * Detect the active brand from the first subdomain segment.
 * e.g. themeone.localhost → 'themeone', themetwo.app.com → 'themetwo'.
 * `BrandService` maps this value to a Brand and applies it on <html> via the
 * `[data-brand]` attribute, which switches the generated `--primitives-*` tokens.
 * Fallback: 'themeone'.
 */
const regex = /(?:https?:\/\/)?([-\w]*)\..*/;
const match = typeof window !== 'undefined' ? regex.exec(window.location.href) : null;
export const subdomain = match ? match[1] : 'themeone';

export const appConfig: ApplicationConfig = {
  providers: [
    provideZoneChangeDetection({ eventCoalescing: true }),
    provideRouter(routes),
    provideAnimations(),
  ],
};
