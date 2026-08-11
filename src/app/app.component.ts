import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BrandService } from '@4sh/ui-kit/theming';
import { ThemeService } from '@4sh/ui-kit/theming';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet],
  template: `<router-outlet />`,
})
export class AppComponent {
  // Instantiates the services: their effects apply [data-brand] / [data-theme] on <html>.
  protected readonly brand = inject(BrandService);
  protected readonly theme = inject(ThemeService);
}
