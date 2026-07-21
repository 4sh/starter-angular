import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiSidebar } from '@app/shared/components/ui/navigation/ui-sidebar/ui-sidebar';
import { UiSidebarMenu, UiSidebarMenuItem } from '@app/shared/components/ui/navigation/ui-sidebar/ui-sidebar-menu';
import { UiSidebarTrigger } from '@app/shared/components/ui/navigation/ui-sidebar/ui-sidebar-trigger';
import { UiButton } from '@app/shared/components/ui/actions/ui-button/ui-button';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';

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
      description: "Bord d'ancrage de la barre.",
      table: { type: { summary: 'SidebarSide' }, defaultValue: { summary: '"left"' } },
    },
    mode: {
      control: { type: 'inline-radio' },
      options: ['static', 'overlay'],
      description:
        'Stratégie de présentation : `static` (dans le flux, pousse le contenu, repliable en rail) ou `overlay` (offcanvas flottant + fond).',
      table: { type: { summary: 'SidebarMode' }, defaultValue: { summary: '"static"' } },
    },
    collapsible: {
      control: { type: 'boolean' },
      description: 'Autorise le repli en rail d’icônes (mode statique).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    collapsed: {
      control: { type: 'boolean' },
      description: "État du rail d'icônes (two-way `[(collapsed)]`, mode statique).",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    visible: {
      control: { type: 'boolean' },
      description: "État d'ouverture de l'offcanvas (two-way `[(visible)]`, mode overlay).",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    openOnHover: {
      control: { type: 'boolean' },
      description: 'Un rail replié se déploie au survol / focus (sans pousser le contenu).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    backdrop: {
      control: { type: 'boolean' },
      description: 'Affiche le fond (assombrit + capture) et bloque le scroll — mode overlay.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    dismissable: {
      control: { type: 'boolean' },
      description: 'Ferme au clic sur le fond / à Échap — mode overlay.',
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
        'Largeur sous laquelle une barre responsive devient un offcanvas. Aligner sur l’échelle `$breakpoint-*`.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"1024px"' } },
    },
    contained: {
      control: { type: 'boolean' },
      description: "Scope l'overlay à l'ancêtre positionné (embarquer la barre dans une région bornée).",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    ariaLabel: {
      control: { type: 'text' },
      description: 'Nom accessible de la zone de navigation.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"Navigation"' } },
    },
    tooltips: {
      control: { type: 'boolean' },
      description:
        "En rail replié, révèle le libellé de chaque item en info-bulle au survol (via `[uiTooltip]`, entrée de `ui-sidebar-menu`).",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
  },
};
export default meta;
type Story = StoryObj<SidebarArgs>;

// --- Shared demo data -------------------------------------------------
const PLAYGROUND_ITEMS: UiSidebarMenuItem[] = [
  { label: 'Tableau de bord', icon: 'gauge', active: true },
  { label: 'Projets', icon: 'folder-open' },
  { label: 'Calendrier', icon: 'calendar-days' },
  { label: 'Messages', icon: 'envelope', badge: '3', badgeLevel: 'highlight' },
  { label: 'Paramètres', icon: 'gear' },
];

/**
 * Playground interactif. Combinez `side`, `mode`, `collapsible`, `collapsed`,
 * `openOnHover` et `backdrop`. La barre est embarquée (`contained`) dans une
 * région bornée pour l'aperçu.
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
    ariaLabel: 'Navigation de démonstration',
    tooltips: true,
  },
  render: (args) => ({
    props: { ...args, items: PLAYGROUND_ITEMS },
    template: `
      <div style="position:relative; display:flex; height:460px; overflow:hidden;
                  border:1px solid var(--global-default-stroke-default); border-radius:var(--radius-md);
                  background:var(--global-default-surface-default);">
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
              [label]="mode === 'overlay' ? 'Ouvrir' : (collapsed ? 'Déplier' : 'Replier')" />
          </div>
          <h2 style="margin:0 0 var(--units-sm); color:var(--global-high-content-default);">Contenu</h2>
          <p style="color:var(--global-low-content-default); max-width:52ch; line-height:1.6;">
            La barre pousse cet espace en mode statique, et flotte par-dessus en mode overlay.
            Testez le repli, le survol et les fonds via les contrôles Storybook.
          </p>
        </main>
      </div>
    `,
  }),
};

// --- With Menu --------------------------------------------------------
const WORKSPACE_NAV: UiSidebarMenuItem[] = [
  {
    label: 'Espace de travail',
    items: [
      { label: 'Vue d’ensemble', icon: 'house', active: true },
      { label: 'Analytique', icon: 'chart-line' },
      { label: 'Rapports', icon: 'file-lines', badge: '5', badgeLevel: 'highlight' },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { label: 'Équipe', icon: 'users' },
      { label: 'Facturation', icon: 'credit-card' },
      { label: 'Intégrations', icon: 'plug' },
    ],
  },
  { separator: true },
  { label: 'Aide & support', icon: 'circle-question' },
];

/**
 * Chrome applicatif complet : sélecteur d’espace de travail en en-tête,
 * navigation groupée, carte utilisateur en pied. Repliable en rail d’icônes
 * via le déclencheur.
 */
export const WithMenu: Story = {
  render: () => ({
    props: { nav: WORKSPACE_NAV, collapsed: false },
    template: `
      <div style="position:relative; display:flex; height:520px; overflow:hidden;
                  border:1px solid var(--global-default-stroke-default); border-radius:var(--radius-md);
                  background:var(--global-default-surface-default);">
        <ui-sidebar #sb collapsible [(collapsed)]="collapsed" ariaLabel="Navigation de l'espace de travail">
          <ng-template #header let-collapsed="collapsed">
            <button [uiSidebarTrigger]="sb" aria-label="Basculer la navigation"
              style="display:flex; align-items:center; gap:var(--units-sm); width:100%; padding:var(--units-xs);
                     border:none; border-radius:var(--radius-sm); background:var(--global-low-surface-default);
                     color:inherit; cursor:pointer; font:inherit; text-align:left;">
              <ui-icon name="layer-group" size="lg" />
              @if (!collapsed) {
                <span style="display:flex; flex-direction:column; line-height:1.2; min-width:0;">
                  <strong>App</strong>
                  <small style="color:var(--global-low-content-default);">Espace Pro</small>
                </span>
                <ui-icon name="angles-up-down" size="sm" style="margin-left:auto;" />
              }
            </button>
          </ng-template>

          <ui-sidebar-menu [items]="nav" tooltips ariaLabel="Sections principales" />

          <ng-template #footer let-collapsed="collapsed">
            <ui-icon name="circle-user" size="lg" />
            @if (!collapsed) {
              <span style="display:flex; flex-direction:column; line-height:1.2; min-width:0;">
                <strong>Jane Doe</strong>
                <small style="color:var(--global-low-content-default); overflow:hidden; text-overflow:ellipsis;">jane&#64;acme.io</small>
              </span>
              <ui-icon name="right-from-bracket" size="sm" style="margin-left:auto;" />
            }
          </ng-template>
        </ui-sidebar>

        <main style="flex:1 1 auto; min-width:0; padding:var(--units-xl); overflow:auto;">
          <ui-button [uiSidebarTrigger]="sb" level="low" size="small"
            [icon]="collapsed ? 'angles-right' : 'angles-left'"
            [label]="collapsed ? 'Déplier' : 'Replier'" />
          <h2 style="margin:var(--units-lg) 0 var(--units-sm); color:var(--global-high-content-default);">Vue d’ensemble</h2>
          <p style="color:var(--global-low-content-default); max-width:52ch; line-height:1.6;">
            Repliez la barre : les libellés, en-têtes de sections et badges disparaissent,
            ne laissant que la colonne d’icônes.
          </p>
        </main>
      </div>
    `,
  }),
};

/**
 * Sous 1024px, la barre devient un offcanvas avec fond ; au-dessus, elle reste
 * en rail d’icônes qui pousse le contenu. La bascule utilise l’échelle de
 * breakpoints du design system. Redimensionnez l’aperçu pour observer le
 * changement.
 */
export const Responsive: Story = {
  render: () => ({
    props: { nav: PLAYGROUND_ITEMS },
    template: `
      <div style="position:relative; display:flex; height:520px; overflow:hidden;
                  border:1px solid var(--global-default-stroke-default); border-radius:var(--radius-md);
                  background:var(--global-default-surface-default);">
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
          <h2 style="margin:var(--units-lg) 0 var(--units-sm); color:var(--global-high-content-default);">Adaptatif</h2>
          <p style="color:var(--global-low-content-default); max-width:52ch; line-height:1.6;">
            Sur écran large, un rail d’icônes borde le contenu. Sous 1024px, le bouton Menu
            ouvre un panneau offcanvas par-dessus, avec un fond assombri.
          </p>
        </main>
      </div>
    `,
  }),
};

// Primary icon rail (permanently collapsed → icon-only, labels via tooltip).
const RAIL_NAV: UiSidebarMenuItem[] = [
  { label: 'Accueil', icon: 'house', active: true },
  { label: 'Base de données', icon: 'database' },
  { label: 'Recherche', icon: 'magnifying-glass' },
  { label: 'Journaux', icon: 'table-list' },
  { label: 'Domaines', icon: 'globe' },
  { label: 'API', icon: 'code' },
];

// Secondary section navigation (text-only items, grouped by section).
const SETTINGS_NAV: UiSidebarMenuItem[] = [
  {
    label: 'Configuration',
    items: [
      { label: 'Général', active: true },
      { label: 'Compute et disque' },
      { label: 'Infrastructure' },
      { label: 'Intégrations' },
      { label: 'Clés API' },
      { label: 'Clés JWT' },
      { label: 'Drains de logs' },
      { label: 'Add-ons' },
    ],
  },
  {
    label: 'Intégrations',
    items: [
      { label: 'Data API', external: true },
      { label: 'Vault', badge: 'BETA' },
    ],
  },
  {
    label: 'Facturation',
    items: [
      { label: 'Abonnement', external: true },
      { label: 'Usage', external: true },
    ],
  },
];

/**
 * Chrome à deux niveaux façon console d'administration : un **rail d'icônes**
 * permanent (replié, libellés en info-bulle) comme navigation primaire, accolé à
 * une **barre de navigation secondaire** listant les sections d'un module — le
 * tout bordant le contenu principal. Deux `ui-sidebar` statiques côte à côte, pas
 * d'offcanvas.
 */
export const DualSidebar: Story = {
  render: () => ({
    props: { rail: RAIL_NAV, settings: SETTINGS_NAV },
    template: `
      <div style="display:flex; height:640px; overflow:hidden;
                  border:1px solid var(--global-default-stroke-default); border-radius:var(--radius-md);
                  background:var(--global-default-surface-default);">
        <!-- Rail d'icônes (navigation primaire) -->
        <ui-sidebar [collapsed]="true" [collapsible]="false" ariaLabel="Navigation principale">
          <ng-template #header>
            <span style="display:inline-flex; align-items:center; justify-content:center;
                         width:36px; height:36px; border-radius:var(--radius-sm);
                         background:var(--actions-high-surface-default); color:var(--actions-high-content-default);">
              <ui-icon name="bolt" size="default" />
            </span>
          </ng-template>
          <ui-sidebar-menu [items]="rail" tooltips ariaLabel="Sections de l'application" />
          <ng-template #footer>
            <ui-icon name="gear" size="lg" />
          </ng-template>
        </ui-sidebar>

        <!-- Navigation secondaire (sections du module) -->
        <ui-sidebar [collapsible]="false" ariaLabel="Réglages du projet">
          <ng-template #header>
            <strong style="font-size:var(--size-typography-title-default);">Réglages</strong>
          </ng-template>
          <ui-sidebar-menu [items]="settings" ariaLabel="Sections des réglages" />
        </ui-sidebar>

        <main style="flex:1 1 auto; min-width:0; padding:var(--units-xl); overflow:auto;">
          <h2 style="margin:0 0 var(--units-lg); color:var(--global-high-content-default);">Éditeur de table</h2>
          <div style="display:flex; flex-direction:column; gap:var(--units-md);">
            <div style="height:120px; border-radius:var(--radius-md); background:var(--global-low-surface-default);"></div>
            <div style="height:220px; border-radius:var(--radius-md); background:var(--global-low-surface-default);"></div>
          </div>
        </main>
      </div>
    `,
  }),
};

// --- Nested Menu ------------------------------------------------------
const NESTED_NAV: UiSidebarMenuItem[] = [
  { label: 'Tableau de bord', icon: 'gauge', active: true },
  {
    label: 'Catalogue',
    icon: 'box-archive',
    toggleable: true,
    items: [
      { label: 'Produits', icon: 'tag' },
      {
        label: 'Collections',
        icon: 'layer-group',
        items: [
          { label: 'Nouveautés', icon: 'sparkles' },
          { label: 'Promotions', icon: 'percent', active: true },
          { label: 'Archives', icon: 'box' },
        ],
      },
      { label: 'Fournisseurs', icon: 'truck' },
    ],
  },
  {
    label: 'Clients',
    icon: 'users',
    toggleable: true,
    items: [
      { label: 'Comptes', icon: 'address-card' },
      { label: 'Segments', icon: 'chart-pie' },
    ],
  },
  { separator: true },
  { label: 'Paramètres', icon: 'gear' },
];

/**
 * Les entrées deviennent des groupes repliables révélant un sous-arbre imbriqué.
 * L’état actif est suivi : un groupe contenant l’élément actif se déplie
 * automatiquement (ici « Promotions » sous « Collections »).
 */
export const NestedMenu: Story = {
  render: () => ({
    props: { nav: NESTED_NAV },
    template: `
      <div style="display:flex; height:560px; overflow:hidden;
                  border:1px solid var(--global-default-stroke-default); border-radius:var(--radius-md);
                  background:var(--global-default-surface-default);">
        <ui-sidebar collapsible="false" ariaLabel="Navigation imbriquée">
          <ng-template #header>
            <ui-icon name="store" size="lg" />
            <strong>Boutique</strong>
          </ng-template>
          <ui-sidebar-menu [items]="nav" ariaLabel="Sections imbriquées" />
        </ui-sidebar>

        <main style="flex:1 1 auto; min-width:0; padding:var(--units-xl); overflow:auto;">
          <h2 style="margin:0 0 var(--units-sm); color:var(--global-high-content-default);">Arborescence profonde</h2>
          <p style="color:var(--global-low-content-default); max-width:52ch; line-height:1.6;">
            Cliquez sur « Catalogue » ou « Clients » pour déplier / replier les sous-menus.
            Les sous-arbres s’indentent et s’animent en hauteur.
          </p>
        </main>
      </div>
    `,
  }),
};
