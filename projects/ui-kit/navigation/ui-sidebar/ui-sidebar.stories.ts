import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiSidebar } from '@4sh/ui-kit/navigation/ui-sidebar';
import { UiSidebarMenu, UiSidebarMenuItem } from '@4sh/ui-kit/navigation/ui-sidebar';
import { UiSidebarTrigger } from '@4sh/ui-kit/navigation/ui-sidebar';
import { UiButton } from '@4sh/ui-kit/actions/ui-button';
import { UiIcon } from '@4sh/ui-kit/base/ui-icon';

// `tooltips` is a `ui-sidebar-menu` input surfaced as a playground control.
type SidebarArgs = UiSidebar & { tooltips: boolean };

const meta: Meta<SidebarArgs> = {
  title: 'Components/ui/navigation/ui-sidebar',
  component: UiSidebar,
  decorators: [moduleMetadata({ imports: [UiSidebar, UiSidebarMenu, UiSidebarTrigger, UiButton, UiIcon] })],
  parameters: {
    layout: 'fullscreen',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=0-1&t=PXOwFotKvf72dn1c-1',
    },
  },
  argTypes: {
    side: {
      control: { type: 'inline-radio' },
      options: ['left', 'right'],
      description: "Anchor edge of the bar.",
      table: { type: { summary: 'SidebarSide' }, defaultValue: { summary: '"left"' } },
    },
    mode: {
      control: { type: 'inline-radio' },
      options: ['static', 'overlay'],
      description:
        'Presentation strategy: `static` (in the flow, pushes the content, collapsible to a rail) or `overlay` (floating offcanvas + backdrop).',
      table: { type: { summary: 'SidebarMode' }, defaultValue: { summary: '"static"' } },
    },
    collapsible: {
      control: { type: 'boolean' },
      description: 'Allows collapsing to an icon rail (static mode).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    collapsed: {
      control: { type: 'boolean' },
      description: "Icon rail state (two-way `[(collapsed)]`, static mode).",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    visible: {
      control: { type: 'boolean' },
      description: "Offcanvas open state (two-way `[(visible)]`, overlay mode).",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    openOnHover: {
      control: { type: 'boolean' },
      description: 'A collapsed rail expands on hover / focus (without pushing the content).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    backdrop: {
      control: { type: 'boolean' },
      description: 'Shows the backdrop (dims + captures clicks) and locks scroll — overlay mode.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    dismissable: {
      control: { type: 'boolean' },
      description: 'Closes on clicking the backdrop / on Escape — overlay mode.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    responsive: {
      control: { type: 'boolean' },
      description: 'Bascule automatiquement en overlay sous `breakpoint`.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    breakpoint: {
      control: { type: 'text' },
      description:
        'Width below which a responsive bar becomes an offcanvas. Align with the `$breakpoint-*` scale.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"1024px"' } },
    },
    contained: {
      control: { type: 'boolean' },
      description: "Scopes the overlay to the positioned ancestor (embed the bar in a bounded region).",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    ariaLabel: {
      control: { type: 'text' },
      description: 'Accessible name of the navigation area.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"Navigation"' } },
    },
    tooltips: {
      control: { type: 'boolean' },
      description:
        "In collapsed rail, reveals each item's label as a tooltip on hover (via `[uiTooltip]`, `ui-sidebar-menu` entry).",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
  },
};
export default meta;
type Story = StoryObj<SidebarArgs>;

// --- Shared demo data -------------------------------------------------
const PLAYGROUND_ITEMS: UiSidebarMenuItem[] = [
  { label: 'Dashboard', icon: 'gauge', active: true },
  { label: 'Projects', icon: 'folder-open' },
  { label: 'Calendar', icon: 'calendar-days' },
  { label: 'Messages', icon: 'envelope', badge: '3', badgeLevel: 'highlight' },
  { label: 'Settings', icon: 'gear' },
];

/**
 * Interactive playground. Combine `side`, `mode`, `collapsible`, `collapsed`,
 * `openOnHover` and `backdrop`. The bar is embedded (`contained`) in a
 * bounded region for the preview.
 */
export const Variants: Story = {
  args: {
    side: 'left',
    mode: 'static',
    collapsible: true,
    collapsed: false,
    visible: false,
    openOnHover: false,
    backdrop: true,
    dismissable: true,
    contained: true,
    ariaLabel: 'Demo navigation',
    tooltips: true,
  },
  render: (args) => ({
    props: { ...args, items: PLAYGROUND_ITEMS },
    template: `
      <div style="position:relative; display:flex; height:460px; overflow:hidden;
                  border:1px solid var(--global-border-subtle); border-radius:var(--radius-md);
                  background:var(--global-background-default);">
        <ui-sidebar #sb
          [side]="side" [mode]="mode" [collapsible]="collapsible"
          [(collapsed)]="collapsed" [(visible)]="visible"
          [openOnHover]="openOnHover" [backdrop]="backdrop" [dismissable]="dismissable"
          [contained]="contained" [ariaLabel]="ariaLabel">
          <ng-template #header let-collapsed="collapsed">
            <ui-icon name="bolt" size="lg" />
            @if (!collapsed) { <strong>App</strong> }
          </ng-template>
          <ui-sidebar-menu [items]="items" [tooltips]="tooltips" ariaLabel="Sections" />
          <ng-template #footer let-collapsed="collapsed">
            <ui-icon name="circle-user" size="lg" />
            @if (!collapsed) { <span>Jane Doe</span> }
          </ng-template>
        </ui-sidebar>

        <main style="flex:1 1 auto; min-width:0; padding:var(--units-xl); overflow:auto;">
          <div style="display:flex; gap:var(--units-sm); margin-bottom:var(--units-lg);">
            <ui-button [uiSidebarTrigger]="sb" level="low" size="small"
              [icon]="mode === 'overlay' ? 'bars' : (collapsed ? 'angles-right' : 'angles-left')"
              [label]="mode === 'overlay' ? 'Open' : (collapsed ? 'Expand' : 'Collapse')" />
          </div>
          <h2 style="margin:0 0 var(--units-sm); color:var(--global-text-default);">Content</h2>
          <p style="color:var(--global-text-muted); max-width:52ch; line-height:1.6;">
            The bar pushes this space in static mode, and floats above it in overlay mode.
            Try the collapse, hover and backgrounds via the Storybook controls.
          </p>
        </main>
      </div>
    `,
  }),
};

// --- With Menu --------------------------------------------------------
const WORKSPACE_NAV: UiSidebarMenuItem[] = [
  {
    label: 'Workspace',
    items: [
      { label: 'Overview', icon: 'house', active: true },
      { label: 'Analytics', icon: 'chart-line' },
      { label: 'Reports', icon: 'file-lines', badge: '5', badgeLevel: 'highlight' },
    ],
  },
  {
    label: 'Management',
    items: [
      { label: 'Team', icon: 'users' },
      { label: 'Billing', icon: 'credit-card' },
      { label: 'Integrations', icon: 'plug' },
    ],
  },
  { separator: true },
  { label: 'Help & support', icon: 'circle-question' },
];

/**
 * Full application chrome: workspace selector in the header,
 * grouped navigation, user card in the footer. Collapsible to an icon rail
 * via the trigger.
 */
export const WithMenu: Story = {
  render: () => ({
    props: { nav: WORKSPACE_NAV, collapsed: false },
    template: `
      <div style="position:relative; display:flex; height:520px; overflow:hidden;
                  border:1px solid var(--global-border-subtle); border-radius:var(--radius-md);
                  background:var(--global-background-default);">
        <ui-sidebar #sb collapsible [(collapsed)]="collapsed" ariaLabel="Workspace navigation">
          <ng-template #header let-collapsed="collapsed">
            <button [uiSidebarTrigger]="sb" aria-label="Toggle navigation"
              style="display:flex; align-items:center; gap:var(--units-sm); width:100%; padding:var(--units-xs);
                     border:none; border-radius:var(--radius-sm); background:var(--global-background-muted);
                     color:inherit; cursor:pointer; font:inherit; text-align:left;">
              <ui-icon name="layer-group" size="lg" />
              @if (!collapsed) {
                <span style="display:flex; flex-direction:column; line-height:1.2; min-width:0;">
                  <strong>App</strong>
                  <small style="color:var(--global-text-muted);">Pro workspace</small>
                </span>
                <ui-icon name="angles-up-down" size="sm" style="margin-left:auto;" />
              }
            </button>
          </ng-template>

          <ui-sidebar-menu [items]="nav" tooltips ariaLabel="Main sections" />

          <ng-template #footer let-collapsed="collapsed">
            <ui-icon name="circle-user" size="lg" />
            @if (!collapsed) {
              <span style="display:flex; flex-direction:column; line-height:1.2; min-width:0;">
                <strong>Jane Doe</strong>
                <small style="color:var(--global-text-muted); overflow:hidden; text-overflow:ellipsis;">jane&#64;acme.io</small>
              </span>
              <ui-icon name="right-from-bracket" size="sm" style="margin-left:auto;" />
            }
          </ng-template>
        </ui-sidebar>

        <main style="flex:1 1 auto; min-width:0; padding:var(--units-xl); overflow:auto;">
          <ui-button [uiSidebarTrigger]="sb" level="low" size="small"
            [icon]="collapsed ? 'angles-right' : 'angles-left'"
            [label]="collapsed ? 'Expand' : 'Collapse'" />
          <h2 style="margin:var(--units-lg) 0 var(--units-sm); color:var(--global-text-default);">Overview</h2>
          <p style="color:var(--global-text-muted); max-width:52ch; line-height:1.6;">
            Collapse the bar: labels, section headers and badges disappear,
            leaving only the icon column.
          </p>
        </main>
      </div>
    `,
  }),
};

/**
 * Under 1024px, the bar becomes an offcanvas with a backdrop; above it, it stays
 * an icon rail that pushes the content. The switch uses the design system's
 * breakpoint scale. Resize the preview to see the
 * change.
 */
export const Responsive: Story = {
  render: () => ({
    props: { nav: PLAYGROUND_ITEMS },
    template: `
      <div style="position:relative; display:flex; height:520px; overflow:hidden;
                  border:1px solid var(--global-border-subtle); border-radius:var(--radius-md);
                  background:var(--global-background-default);">
        <ui-sidebar #sb responsive breakpoint="1024px" mode="static" collapsible [collapsed]="true" contained
          ariaLabel="Navigation responsive">
          <ng-template #header let-collapsed="collapsed">
            <ui-icon name="compass" size="lg" />
            @if (!collapsed) { <strong>App</strong> }
          </ng-template>
          <ui-sidebar-menu [items]="nav" ariaLabel="Sections" />
        </ui-sidebar>

        <main style="flex:1 1 auto; min-width:0; padding:var(--units-xl); overflow:auto;">
          <ui-button [uiSidebarTrigger]="sb" level="low" size="small" icon="bars" label="Menu" />
          <h2 style="margin:var(--units-lg) 0 var(--units-sm); color:var(--global-text-default);">Adaptive</h2>
          <p style="color:var(--global-text-muted); max-width:52ch; line-height:1.6;">
            On large screens, an icon rail borders the content. Under 1024px, the Menu button
            opens an offcanvas panel on top, with a dimmed background.
          </p>
        </main>
      </div>
    `,
  }),
};

// Primary icon rail (permanently collapsed → icon-only, labels via tooltip).
const RAIL_NAV: UiSidebarMenuItem[] = [
  { label: 'Home', icon: 'house', active: true },
  { label: 'Database', icon: 'database' },
  { label: 'Recherche', icon: 'magnifying-glass' },
  { label: 'Logs', icon: 'table-list' },
  { label: 'Domains', icon: 'globe' },
  { label: 'API', icon: 'code' },
];

// Secondary section navigation (text-only items, grouped by section).
const SETTINGS_NAV: UiSidebarMenuItem[] = [
  {
    label: 'Configuration',
    items: [
      { label: 'General', active: true },
      { label: 'Compute and storage' },
      { label: 'Infrastructure' },
      { label: 'Integrations' },
      { label: 'API keys' },
      { label: 'JWT keys' },
      { label: 'Log drains' },
      { label: 'Add-ons' },
    ],
  },
  {
    label: 'Integrations',
    items: [
      { label: 'Data API', external: true },
      { label: 'Vault', badge: 'BETA' },
    ],
  },
  {
    label: 'Billing',
    items: [
      { label: 'Subscription', external: true },
      { label: 'Usage', external: true },
    ],
  },
];

/**
 * Two-level admin-console-style chrome: a permanent **icon rail**
 * (collapsed, tooltip labels) as primary navigation, next to a
 * **secondary navigation bar** listing a module's sections — the
 * whole thing bordering the main content. Two static `ui-sidebar` side by side, no
 * offcanvas.
 */
export const DualSidebar: Story = {
  render: () => ({
    props: { rail: RAIL_NAV, settings: SETTINGS_NAV },
    template: `
      <div style="display:flex; height:640px; overflow:hidden;
                  border:1px solid var(--global-border-subtle); border-radius:var(--radius-md);
                  background:var(--global-background-default);">
        <!-- Icon rail (primary navigation) -->
        <ui-sidebar [collapsed]="true" [collapsible]="false" ariaLabel="Main navigation">
          <ng-template #header>
            <span style="display:inline-flex; align-items:center; justify-content:center;
                         width:36px; height:36px; border-radius:var(--radius-sm);
                         background:var(--actions-high-surface-default); color:var(--actions-high-content-default);">
              <ui-icon name="bolt" size="default" />
            </span>
          </ng-template>
          <ui-sidebar-menu [items]="rail" tooltips ariaLabel="Application sections" />
          <ng-template #footer>
            <ui-icon name="gear" size="lg" />
          </ng-template>
        </ui-sidebar>

        <!-- Secondary navigation (module sections) -->
        <ui-sidebar [collapsible]="false" ariaLabel="Project settings">
          <ng-template #header>
            <strong style="font-size:var(--size-typography-title-default);">Settings</strong>
          </ng-template>
          <ui-sidebar-menu [items]="settings" ariaLabel="Settings sections" />
        </ui-sidebar>

        <main style="flex:1 1 auto; min-width:0; padding:var(--units-xl); overflow:auto;">
          <h2 style="margin:0 0 var(--units-lg); color:var(--global-text-default);">Table editor</h2>
          <div style="display:flex; flex-direction:column; gap:var(--units-md);">
            <div style="height:120px; border-radius:var(--radius-md); background:var(--global-background-muted);"></div>
            <div style="height:220px; border-radius:var(--radius-md); background:var(--global-background-muted);"></div>
          </div>
        </main>
      </div>
    `,
  }),
};

// --- Nested Menu ------------------------------------------------------
const NESTED_NAV: UiSidebarMenuItem[] = [
  { label: 'Dashboard', icon: 'gauge', active: true },
  {
    label: 'Catalog',
    icon: 'box-archive',
    toggleable: true,
    items: [
      { label: 'Products', icon: 'tag' },
      {
        label: 'Collections',
        icon: 'layer-group',
        items: [
          { label: 'What\'s new', icon: 'sparkles' },
          { label: 'Promotions', icon: 'percent', active: true },
          { label: 'Archives', icon: 'box' },
        ],
      },
      { label: 'Providers', icon: 'truck' },
    ],
  },
  {
    label: 'Customers',
    icon: 'users',
    toggleable: true,
    items: [
      { label: 'Accounts', icon: 'address-card' },
      { label: 'Segments', icon: 'chart-pie' },
    ],
  },
  { separator: true },
  { label: 'Settings', icon: 'gear' },
];

/**
 * Entries become collapsible groups revealing a nested subtree.
 * The active state is tracked: a group containing the active item expands
 * automatically (here « Promotions » under « Collections »).
 */
export const NestedMenu: Story = {
  render: () => ({
    props: { nav: NESTED_NAV },
    template: `
      <div style="display:flex; height:560px; overflow:hidden;
                  border:1px solid var(--global-border-subtle); border-radius:var(--radius-md);
                  background:var(--global-background-default);">
        <ui-sidebar collapsible="false" ariaLabel="Nested navigation">
          <ng-template #header>
            <ui-icon name="store" size="lg" />
            <strong>Shop</strong>
          </ng-template>
          <ui-sidebar-menu [items]="nav" ariaLabel="Nested sections" />
        </ui-sidebar>

        <main style="flex:1 1 auto; min-width:0; padding:var(--units-xl); overflow:auto;">
          <h2 style="margin:0 0 var(--units-sm); color:var(--global-text-default);">Deep tree</h2>
          <p style="color:var(--global-text-muted); max-width:52ch; line-height:1.6;">
            Click « Catalog » or « Customers » to expand / collapse the submenus.
            Subtrees indent and animate in height.
          </p>
        </main>
      </div>
    `,
  }),
};
