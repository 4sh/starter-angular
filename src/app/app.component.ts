import { Component, inject } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BrandService } from '@app/core/service/brand.service';
import { ThemeService } from '@app/core/service/theme.service';

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
