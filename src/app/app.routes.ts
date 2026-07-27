import { Routes } from '@angular/router';
import { DemoOrders } from '@app/shared/components/domain/demo-orders/demo-orders';

export const routes: Routes = [
  { path: '', component: DemoOrders },
  { path: '**', redirectTo: '' },
];
