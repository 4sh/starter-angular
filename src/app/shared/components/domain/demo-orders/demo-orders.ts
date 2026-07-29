import { Component, signal, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DecimalPipe } from '@angular/common';
import { ThemeService } from '@app/core/service/theme.service';

// Actions
import { UiButton } from '@app/shared/components/ui/actions/ui-button/ui-button';
import { UiLink } from '@app/shared/components/ui/actions/ui-link/ui-link';

// Forms
import { UiInput } from '@app/shared/components/ui/forms/ui-input/ui-input';
import { UiSelect } from '@app/shared/components/ui/forms/ui-select/ui-select';
import { UiDatepicker } from '@app/shared/components/ui/forms/ui-datepicker/ui-datepicker';
import { UiCheckbox } from '@app/shared/components/ui/forms/ui-checkbox/ui-checkbox';
import { UiSegmentControl } from '@app/shared/components/ui/forms/ui-segment-control/ui-segment-control';
import { UiToggle } from '@app/shared/components/ui/forms/ui-toggle/ui-toggle';
import { UiInputMask } from '@app/shared/components/ui/forms/ui-input-mask/ui-input-mask';
import { UiNudger } from '@app/shared/components/ui/forms/ui-nudger/ui-nudger';
import { UiSlider } from '@app/shared/components/ui/forms/ui-slider/ui-slider';
import { UiTextarea } from '@app/shared/components/ui/forms/ui-textarea/ui-textarea';
import { TableSize } from '@app/shared/components/ui/table/ui-table/ui-table';

// Informative
import { UiTag } from '@app/shared/components/ui/informative/ui-tag/ui-tag';
import { UiBadge } from '@app/shared/components/ui/informative/ui-badge/ui-badge';
import { UiAvatar } from '@app/shared/components/ui/informative/ui-avatar/ui-avatar';
import { UiProgressBar } from '@app/shared/components/ui/informative/ui-progress-bar/ui-progress-bar';
import { UiTooltip } from '@app/shared/components/ui/informative/ui-tooltip/ui-tooltip';
import { UiSeparator } from '@app/shared/components/ui/informative/ui-separator/ui-separator';
import { UiReadOnly } from '@app/shared/components/ui/informative/ui-read-only/ui-read-only';
import { UiSkeleton } from '@app/shared/components/ui/informative/ui-skeleton/ui-skeleton';

// Layout
import { UiCard } from '@app/shared/components/ui/layout/ui-card/ui-card';
import { UiDrawer } from '@app/shared/components/ui/layout/ui-drawer/ui-drawer';
import { UiModal } from '@app/shared/components/ui/layout/ui-modal/ui-modal';

// Navigation
import { UiBreadcrumb } from '@app/shared/components/ui/navigation/ui-breadcrumb/ui-breadcrumb';
import { UiTabs, UiTabList, UiTab, UiTabPanels, UiTabPanel } from '@app/shared/components/ui/navigation/ui-tabs/ui-tabs';
import { UiSidebar } from '@app/shared/components/ui/navigation/ui-sidebar/ui-sidebar';
import { UiSidebarMenu, UiSidebarMenuItem } from '@app/shared/components/ui/navigation/ui-sidebar/ui-sidebar-menu';
import { UiSidebarTrigger } from '@app/shared/components/ui/navigation/ui-sidebar/ui-sidebar-trigger';

// Table
import {
  UiTable,
  UiTableCheckbox,
  UiTableHeaderCheckbox,
  UiTableSelectableRow,
  UiTableSortableColumn,
  UiTableSortIcon,
} from '@app/shared/components/ui/table/ui-table/ui-table';

// Root
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';
import { UiFeedbackLevel } from '@app/shared/types/ui-level';

// ---- Types ----------------------------------------------------------------

export type OrderStatus = 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  number: string;
  customer: { name: string; initials: string; email: string };
  date: string;
  amount: number;
  status: OrderStatus;
  items: { label: string; qty: number; unitPrice: number }[];
}

// ---- Data -----------------------------------------------------------------

const ALL_ORDERS: Order[] = [
  {
    id: '1', number: 'CMD-2025-001',
    customer: { name: 'Alice Martin', initials: 'AM', email: 'alice@example.com' },
    date: '12/07/2025', amount: 189.90, status: 'delivered',
    items: [{ label: 'T-shirt premium', qty: 2, unitPrice: 49.95 }, { label: 'Ceinture cuir', qty: 1, unitPrice: 90 }],
  },
  {
    id: '2', number: 'CMD-2025-002',
    customer: { name: 'Bob Durand', initials: 'BD', email: 'bob@example.com' },
    date: '13/07/2025', amount: 74.50, status: 'shipped',
    items: [{ label: 'Casquette', qty: 1, unitPrice: 34.50 }, { label: 'Chaussettes (lot)', qty: 2, unitPrice: 20 }],
  },
  {
    id: '3', number: 'CMD-2025-003',
    customer: { name: 'Claire Petit', initials: 'CP', email: 'claire@example.com' },
    date: '14/07/2025', amount: 320.00, status: 'confirmed',
    items: [{ label: 'Manteau hiver', qty: 1, unitPrice: 320 }],
  },
  {
    id: '4', number: 'CMD-2025-004',
    customer: { name: 'David Legrand', initials: 'DL', email: 'david@example.com' },
    date: '14/07/2025', amount: 45.00, status: 'pending',
    items: [{ label: 'Écharpe laine', qty: 3, unitPrice: 15 }],
  },
  {
    id: '5', number: 'CMD-2025-005',
    customer: { name: 'Emma Rousseau', initials: 'ER', email: 'emma@example.com' },
    date: '15/07/2025', amount: 219.80, status: 'cancelled',
    items: [{ label: 'Sneakers blanc', qty: 1, unitPrice: 119.90 }, { label: 'Polo slim', qty: 2, unitPrice: 49.95 }],
  },
  {
    id: '6', number: 'CMD-2025-006',
    customer: { name: 'François Blanc', initials: 'FB', email: 'francois@example.com' },
    date: '16/07/2025', amount: 98.50, status: 'shipped',
    items: [{ label: 'Jeans coupe droite', qty: 1, unitPrice: 98.50 }],
  },
  {
    id: '7', number: 'CMD-2025-007',
    customer: { name: 'Gabrielle Noir', initials: 'GN', email: 'gabrielle@example.com' },
    date: '17/07/2025', amount: 55.00, status: 'pending',
    items: [{ label: 'Chapeau été', qty: 1, unitPrice: 55 }],
  },
  {
    id: '8', number: 'CMD-2025-008',
    customer: { name: 'Hugo Lefevre', initials: 'HL', email: 'hugo@example.com' },
    date: '18/07/2025', amount: 430.00, status: 'confirmed',
    items: [{ label: 'Costume cérémonie', qty: 1, unitPrice: 430 }],
  },
  {
    id: '9', number: 'CMD-2025-009',
    customer: { name: 'Isabelle Morel', initials: 'IM', email: 'isabelle@example.com' },
    date: '19/07/2025', amount: 67.90, status: 'delivered',
    items: [{ label: 'Gants hiver', qty: 2, unitPrice: 22.95 }, { label: 'Bonnet', qty: 1, unitPrice: 22 }],
  },
  {
    id: '10', number: 'CMD-2025-010',
    customer: { name: 'Julien Simon', initials: 'JS', email: 'julien@example.com' },
    date: '20/07/2025', amount: 149.90, status: 'pending',
    items: [{ label: 'Blouson cuir', qty: 1, unitPrice: 149.90 }],
  },
];

// ---- Status helpers -------------------------------------------------------

const STATUS_CONFIG: Record<OrderStatus, { label: string; level: UiFeedbackLevel; icon: string }> = {
  pending:   { label: 'En attente',  level: 'warning',   icon: 'clock' },
  confirmed: { label: 'Confirmée',   level: 'highlight', icon: 'check-circle' },
  shipped:   { label: 'Expédiée',    level: 'default',   icon: 'truck' },
  delivered: { label: 'Livrée',      level: 'success',   icon: 'circle-check' },
  cancelled: { label: 'Annulée',     level: 'error',     icon: 'ban' },
};

// ---- Component ------------------------------------------------------------

@Component({
  selector: 'sp-demo-orders',
  templateUrl: './demo-orders.html',
  styleUrl: './demo-orders.scss',
  imports: [
    FormsModule,
    // Actions
    UiButton, UiLink,
    // Forms
    UiInput, UiSelect, UiDatepicker, UiCheckbox, UiSegmentControl, UiToggle, UiInputMask, UiNudger, UiSlider, UiTextarea,
    // Informative
    UiTag, UiBadge, UiAvatar, UiProgressBar, UiTooltip, UiSeparator, UiReadOnly, UiSkeleton,
    // Layout
    UiCard, UiDrawer, UiModal,
    // Navigation
    UiBreadcrumb, UiTabs, UiTabList, UiTab, UiTabPanels, UiTabPanel,
    UiSidebar, UiSidebarMenu, UiSidebarTrigger,
    // Table
    UiTable, UiTableCheckbox, UiTableHeaderCheckbox, UiTableSelectableRow,
    UiTableSortableColumn, UiTableSortIcon,
    // Root
    UiIcon, DecimalPipe,
  ],
})
export class DemoOrders {
  readonly themeService = inject(ThemeService);

  // ---- State
  readonly sidebarCollapsed = signal(false);
  readonly newOrderDrawerVisible = signal(false);

  readonly navItems: UiSidebarMenuItem[] = [
    {
      label: 'Espace de travail',
      items: [
        { label: 'Tableau de bord', icon: 'gauge' },
        { label: 'Commandes', icon: 'bag-shopping', active: true, badge: '3', badgeLevel: 'warning' },
        { label: 'Clients', icon: 'users' },
        { label: 'Produits', icon: 'tag' },
        { label: 'Entrepôt', icon: 'warehouse' },
      ],
    },
    {
      label: 'Analyse',
      items: [
        { label: 'Rapports', icon: 'chart-line' },
        { label: 'Analytique', icon: 'chart-pie' },
      ],
    },
    { separator: true },
    { label: 'Paramètres', icon: 'gear' },
  ];

  // ---- Breadcrumb
  readonly breadcrumbItems = [
    { icon: 'house', ariaLabel: 'Accueil', url: '#' },
    { label: 'Commandes', url: '#' },
    { label: 'Liste' },
  ];

  // ---- Tabs
  readonly activeTab = signal<string | number | undefined>('orders');

  // ---- KPI data
  readonly kpis: { id: string; label: string; value: string; trend: string; trendColor: UiFeedbackLevel; progress: number; icon: string }[] = [
    { id: 'revenue',  label: 'Chiffre d\'affaires', value: '42 850 €', trend: '+12%', trendColor: 'highlight', progress: 72, icon: 'euro-sign' },
    { id: 'today',    label: 'Commandes aujourd\'hui', value: '18', trend: '+3 vs hier', trendColor: 'success', progress: 60, icon: 'bag-shopping' },
    { id: 'pending',  label: 'En attente', value: '3', trend: 'À traiter', trendColor: 'warning', progress: 30, icon: 'clock' },
    { id: 'delivery', label: 'Taux de livraison', value: '96%', trend: 'Ce mois', trendColor: 'success', progress: 96, icon: 'truck' },
  ];

  // ---- Toolbar
  readonly search = signal('');
  readonly statusFilter = signal<string | null>(null);

  readonly statusOptions = [
    { label: 'Tous les statuts', value: null },
    { label: 'En attente',  value: 'pending' },
    { label: 'Confirmée',   value: 'confirmed' },
    { label: 'Expédiée',    value: 'shipped' },
    { label: 'Livrée',      value: 'delivered' },
    { label: 'Annulée',     value: 'cancelled' },
  ];

  // ---- Filtered orders
  readonly orders = computed(() => {
    const q = this.search().toLowerCase();
    const s = this.statusFilter();
    return ALL_ORDERS.filter(o => {
      const matchQ = !q || o.number.toLowerCase().includes(q) || o.customer.name.toLowerCase().includes(q);
      const matchS = !s || o.status === s;
      return matchQ && matchS;
    });
  });

  // ---- Table selection
  readonly selection = signal<Order[]>([]);

  // ---- Drawer (filters)
  readonly filterVisible = signal(false);
  readonly filterDateFrom = signal<Date | null>(null);
  readonly filterDateTo   = signal<Date | null>(null);
  readonly filterPending   = signal(false);
  readonly filterConfirmed = signal(false);
  readonly filterShipped   = signal(false);
  readonly filterDelivered = signal(false);
  readonly filterAmount = signal<string>('all');
  readonly tableSize = signal<TableSize>('default');

  readonly tableSizeOptions = [
    { value: 'small', ariaLabel: 'Compact', icon: 'compress' },
    { value: 'default', ariaLabel: 'Normal', icon: 'list' },
    { value: 'large', ariaLabel: 'Large', icon: 'expand' }
  ];

  // ---- New Order Form State
  newOrderName = signal('');
  newOrderEmail = signal('');
  newOrderPhone = signal('');
  newOrderStatus = signal('pending');
  newOrderDate = signal<Date | null>(null);
  newOrderPriority = signal('normal');
  newOrderQty = signal(1);
  newOrderDiscount = signal(0);
  newOrderExpress = signal(false);
  newOrderGift = signal(false);
  newOrderNotes = signal('');

  readonly priorityOptions = [
    { label: 'Basse', value: 'low' },
    { label: 'Normale', value: 'normal' },
    { label: 'Haute', value: 'high' }
  ];

  readonly amountOptions = [
    { value: 'all',  label: 'Tous' },
    { value: 'lt',   label: '< 100 €' },
    { value: 'gt',   label: '> 100 €' },
  ];

  openFilters(): void { this.filterVisible.set(true); }
  closeFilters(): void { this.filterVisible.set(false); }
  resetFilters(): void {
    this.filterDateFrom.set(null);
    this.filterDateTo.set(null);
    this.filterPending.set(false);
    this.filterConfirmed.set(false);
    this.filterShipped.set(false);
    this.filterDelivered.set(false);
    this.filterAmount.set('all');
  }
  applyFilters(): void { this.closeFilters(); }

  // ---- Modal (order detail)
  readonly modalVisible = signal(false);
  readonly selectedOrder = signal<Order | null>(null);

  openOrder(order: Order): void {
    this.selectedOrder.set(order);
    this.modalVisible.set(true);
  }
  closeModal(): void { this.modalVisible.set(false); }

  // ---- Helpers
  statusLabel(status: OrderStatus): string { return STATUS_CONFIG[status].label; }
  statusLevel(status: OrderStatus): UiFeedbackLevel { return STATUS_CONFIG[status].level; }
  statusIcon(status: OrderStatus):  string { return STATUS_CONFIG[status].icon; }

  orderTotal(order: Order): number {
    return order.items.reduce((acc, i) => acc + i.qty * i.unitPrice, 0);
  }
}
