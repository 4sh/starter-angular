import { Component, inject } from '@angular/core';
import { BrandService } from '@app/core/service/brand.service';
import { ThemeService } from '@app/core/service/theme.service';

@Component({
  selector: 'app-root',
  template: `
    <main style="font-family: var(--fontfamily-base); padding: 2rem; color: var(--global-high-content-default)">
      <h1>Angular Starter</h1>
      <p>La documentation de ce design system est dans <strong>Storybook</strong>.</p>
      <p><code>npm start</code></p>
    </main>
  `,
})
export class AppComponent {
  // Instancie les services : leurs effects appliquent [data-brand] / [data-theme] sur <html>.
  protected readonly brand = inject(BrandService);
  protected readonly theme = inject(ThemeService);
}
