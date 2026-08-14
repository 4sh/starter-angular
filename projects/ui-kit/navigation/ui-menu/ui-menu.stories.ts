import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { provideRouter } from '@angular/router';
import { JsonPipe } from '@angular/common';
import { computed, signal } from '@angular/core';
import { UiMenu, UiMenuItem } from '@4sh/ui-kit/navigation/ui-menu';
import { UiButton } from '@4sh/ui-kit/actions/ui-button';
import { UiIcon } from '@4sh/ui-kit/base/ui-icon';
import { UiTag } from '@4sh/ui-kit/informative/ui-tag';

const meta: Meta<UiMenu> = {
  title: 'Components/ui/navigation/ui-menu',
  component: UiMenu,
  decorators: [
    moduleMetadata({
      imports: [UiMenu, UiButton, UiIcon, UiTag, JsonPipe],
    }),
    // The menu embeds RouterLink: give every story a catch-all route so the
    // router's initial navigation on iframe.html doesn't error (NG04002).
    applicationConfig({ providers: [provideRouter([{ path: '**', children: [] }])] }),
  ],
  parameters: {
    layout: 'padded',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=3094-10720&t=frNskMgWPnG5cChx-1',
    },
  },
  argTypes: {
    items: {
      control: false,
      description: 'Declarative menu model (`UiMenuItem[]`): groups, separators, commands, links.',
      table: { type: { summary: 'UiMenuItem[]' }, defaultValue: { summary: '[]' } },
    },
    popup: {
      control: false,
      description: 'Popup mode: the panel opens in an overlay via `toggle(event)` / `show(event)`.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    expandedKeys: {
      control: false,
      description:
        'Open/closed state of collapsible groups, indexed by item `id` (`{ [id]: boolean }`). Two-way bindable.',
      table: { type: { summary: 'Record<string, boolean>' }, defaultValue: { summary: '{}' } },
    },
    level: {
      control: { type: 'inline-radio' },
      options: ['high', 'low'],
      description: 'Navigation color family used (`navigation.high` or `navigation.low`).',
      table: { type: { summary: "'high' | 'low'" }, defaultValue: { summary: "'high'" } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'small'],
      description: 'Density: `small` for a compact rendering (« … » action menus).',
      table: { type: { summary: "'default' | 'small'" }, defaultValue: { summary: "'default'" } },
    },
    motion: {
      control: { type: 'boolean' },
      description: 'Animates the popup opening and the submenus collapsing (reduced-motion respected).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    autoFlip: {
      control: { type: 'boolean' },
      description: 'Flips the popup above the trigger when there\'s no room below.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    ariaLabel: {
      control: { type: 'text' },
      description: 'Accessible name of the list (`aria-label` on `role="menu"`).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    tabindex: {
      control: false,
      description: 'Tabindex of the menu\'s roving tab stop.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' } },
    },
  },
  args: {
    level: 'high',
    size: 'default',
    motion: true,
    autoFlip: true,
  },
};

export default meta;
type Story = StoryObj<UiMenu>;

const box = (inner: string, width = 280) => `<div style="max-width:${width}px">${inner}</div>`;

// --- Basic -------------------------------------------------------------
// Groupes à en-tête (label) + séparateur plat entre les sections.
const BASIC_ITEMS: UiMenuItem[] = [
  {
    label: 'Documents',
    items: [
      { label: 'New', icon: 'plus' },
      { label: 'Search', icon: 'magnifying-glass' },
    ],
  },
  { separator: true },
  {
    label: 'Profile',
    items: [
      { label: 'Settings', icon: 'gear' },
      { label: 'Messages', icon: 'inbox' },
      { label: 'Sign out', icon: 'right-from-bracket' },
    ],
  },
];

export const Basic: Story = {
  render: (args) => ({
    props: { ...args, items: BASIC_ITEMS },
    template: box(`<ui-menu [items]="items" [level]="level" [size]="size" [motion]="motion" ariaLabel="Menu principal" />`),
  }),
};

// --- Group -------------------------------------------------------------
// Sélections case à cocher / radio pilotées depuis le modèle : le `command`
// bascule l'état, l'icône de l'item est recalculée depuis ce même état.
export const Group: Story = {
  render: (args) => {
    const prefs = signal({ grille: true, details: false });
    const sort = signal<'nom' | 'date'>('nom');
    const items = computed<UiMenuItem[]>(() => [
      {
        label: 'Display',
        items: [
          {
            label: 'Grille',
            icon: prefs().grille ? 'square-check' : 'square',
            command: () => prefs.update((p) => ({ ...p, grille: !p.grille })),
          },
          {
            label: 'Details',
            icon: prefs().details ? 'square-check' : 'square',
            command: () => prefs.update((p) => ({ ...p, details: !p.details })),
          },
        ],
      },
      { separator: true },
      {
        label: 'Sort by',
        items: [
          {
            label: 'Name',
            icon: sort() === 'nom' ? 'circle-dot' : 'circle',
            command: () => sort.set('nom'),
          },
          {
            label: 'Date',
            icon: sort() === 'date' ? 'circle-dot' : 'circle',
            command: () => sort.set('date'),
          },
        ],
      },
    ]);
    return {
      props: { ...args, items },
      template: box(`<ui-menu [items]="items()" [level]="level" [motion]="motion" ariaLabel="Display options" />`),
    };
  },
};

// --- Toggleable ----------------------------------------------------------
// Les sous-menus imbriqués sont repliables par défaut ; `toggleable` force le
// comportement par item (groupe racine repliable / groupe imbriqué figé ouvert).
const TOGGLEABLE_ITEMS: UiMenuItem[] = [
  {
    id: 'files',
    label: 'Files',
    icon: 'folder',
    toggleable: true, // top-level group: plain header by default, forced toggleable
    items: [
      { label: 'New file', icon: 'file' },
      {
        id: 'shared',
        label: 'Shared',
        icon: 'users',
        toggleable: false, // nested group: toggleable by default, forced always open
        items: [
          { label: 'Design team', icon: 'palette' },
          { label: 'Dev team', icon: 'code' },
        ],
      },
      {
        id: 'archives',
        label: 'Archives',
        icon: 'box-archive',
        items: [
          { label: '2024', icon: 'calendar' },
          { label: '2025', icon: 'calendar' },
        ],
      },
    ],
  },
  { separator: true },
  {
    label: 'Trash',
    icon: 'trash',
  },
];

export const Toggleable: Story = {
  render: (args) => ({
    props: { ...args, items: TOGGLEABLE_ITEMS, keys: { files: true } },
    template: box(
      `<ui-menu [items]="items" [expandedKeys]="keys" [level]="level" [motion]="motion" ariaLabel="Explorer" />`,
    ),
  }),
};

// --- Popup ---------------------------------------------------------------
// `popup` + méthode `toggle(event)` : le panneau s'ancre sous le déclencheur.
export const Popup: Story = {
  render: (args) => ({
    props: { ...args, items: BASIC_ITEMS },
    template: `
      <ui-button label="Options" icon="bars" (buttonClick)="menu.toggle($event)"
        [buttonProps]="{ 'aria-haspopup': 'menu', 'aria-controls': menu.uid }" />
      <ui-menu #menu popup [items]="items" [level]="level" [motion]="motion" ariaLabel="Options" />
    `,
  }),
};

// --- Compact ("…" action menu) ---------------------------------------------
// `size="small"` : rendu compact pour un menu d'actions contextuel ouvert
// depuis un bouton icon-only "…".
export const Compact: Story = {
  render: (args) => {
    const items: UiMenuItem[] = [
      { label: 'Rename', icon: 'pen' },
      { label: 'Duplicate', icon: 'copy' },
      { separator: true },
      { label: 'Remove', icon: 'trash' },
    ];
    return {
      props: { ...args, items },
      template: `
        <div style="display:flex; justify-content:space-between; align-items:center; max-width:320px; padding:8px 12px; border:1px solid var(--global-border-default); border-radius:8px">
          <span>rapport-2026.pdf</span>
          <ui-button level="low" size="small" icon="ellipsis" ariaLabel="File actions"
            (buttonClick)="menu.toggle($event)"
            [buttonProps]="{ 'aria-haspopup': 'menu', 'aria-controls': menu.uid }" />
        </div>
        <ui-menu #menu popup size="small" [items]="items" [level]="level" [motion]="motion" ariaLabel="File actions" />
      `,
    };
  },
};

// --- Template --------------------------------------------------------------
// Templates `#item` (contenu du menuitem, contexte $implicit) et
// `#submenuheader`, + slots `#start` / `#end` autour de la liste.
export const Template: Story = {
  render: (args) => {
    const items: UiMenuItem[] = [
      {
        label: 'Workspace',
        items: [
          { label: 'Tableau de bord', icon: 'gauge' },
          { label: 'Reports', icon: 'chart-line', title: 'PRO feature' },
          { label: 'Automations', icon: 'robot', title: 'PRO feature' },
        ],
      },
    ];
    return {
      props: { ...args, items },
      template: box(`
        <ui-menu [items]="items" [level]="level" [motion]="motion" ariaLabel="Workspace">
          <ng-template #start>
            <strong style="display:block">Acme Corp</strong>
            <small>“Product” workspace</small>
          </ng-template>
          <ng-template #submenuheader let-item>
            <ui-icon name="layer-group" size="sm" />
            <span class="ui-menu-item-label">{{ item.label }}</span>
          </ng-template>
          <ng-template #item let-item>
            <ui-icon [name]="item.icon" size="sm" />
            <span class="ui-menu-item-label">{{ item.label }}</span>
            @if (item.title) {
              <ui-tag label="PRO" level="highlight" subLevel="low" size="small" />
            }
          </ng-template>
          <ng-template #end>
            <small>Signed in as robin&#64;acme.dev</small>
          </ng-template>
        </ui-menu>
      `),
    };
  },
};

// --- Command -----------------------------------------------------------------
// `command` est invoqué au clic (souris ou clavier) avec { originalEvent, item }.
export const Command: Story = {
  render: (args) => {
    const lastAction = signal<string>('—');
    const items: UiMenuItem[] = [
      {
        label: 'Actions',
        items: [
          { label: 'Save', icon: 'floppy-disk', command: ({ item }) => lastAction.set(`« ${item.label} »`) },
          { label: 'Duplicate', icon: 'copy', command: ({ item }) => lastAction.set(`« ${item.label} »`) },
          { label: 'Remove', icon: 'trash', command: ({ item }) => lastAction.set(`« ${item.label} »`) },
          { label: 'Disabled action', icon: 'ban', disabled: true, command: () => lastAction.set('never called') },
        ],
      },
    ];
    return {
      props: { ...args, items, lastAction },
      template: box(`
        <ui-menu [items]="items" [level]="level" [motion]="motion" ariaLabel="Actions" />
        <p aria-live="polite">Last order: <strong>{{ lastAction() }}</strong></p>
      `),
    };
  },
};

// --- Router ---------------------------------------------------------------------
// Navigation par `routerLink` (ancre RouterLink + style actif), URL externe (`url`),
// ou routage programmatique dans un `command`.
export const Router: Story = {
  render: (args) => {
    const items: UiMenuItem[] = [
      {
        label: 'Navigation',
        items: [
          { label: 'Home', icon: 'house', routerLink: '/', routerLinkActiveExact: true },
          { label: 'Profile', icon: 'user', routerLink: '/profil' },
          { label: 'Recherche', icon: 'magnifying-glass', routerLink: '/recherche', queryParams: { q: 'tokens' } },
        ],
      },
      { separator: true },
      {
        label: 'External links',
        items: [{ label: 'Documentation Angular', icon: 'up-right-from-square', url: 'https://angular.dev', target: '_blank' }],
      },
    ];
    return {
      props: { ...args, items },
      template: box(`<ui-menu [items]="items" [level]="level" [motion]="motion" ariaLabel="Navigation" />`),
    };
  },
};

// --- Controlled --------------------------------------------------------------------
// `expandedKeys` (two-way) pilote programmatiquement l'ouverture des groupes
// repliables : la clé = l'`id` de l'item, la valeur = ouvert/fermé.
export const Controlled: Story = {
  render: (args) => {
    const keys = signal<Record<string, boolean>>({ projets: true });
    const items: UiMenuItem[] = [
      {
        id: 'projets',
        label: 'Projects',
        icon: 'diagram-project',
        toggleable: true,
        items: [
          { label: 'Design System', icon: 'swatchbook' },
          { label: 'Site vitrine', icon: 'globe' },
        ],
      },
      {
        id: 'equipes',
        label: 'Teams',
        icon: 'users',
        toggleable: true,
        items: [
          { label: 'Design', icon: 'palette' },
          { label: 'Development', icon: 'code' },
        ],
      },
    ];
    return {
      props: {
        ...args,
        items,
        keys,
        setKeys: (value: Record<string, boolean>) => keys.set(value),
        expandAll: () => keys.set({ projets: true, equipes: true }),
        collapseAll: () => keys.set({ projets: false, equipes: false }),
      },
      template: box(
        `
        <div style="display:flex; gap:8px; margin-bottom:12px">
          <ui-button size="small" level="low" label="Open all" (buttonClick)="expandAll()" />
          <ui-button size="small" level="low" label="Close all" (buttonClick)="collapseAll()" />
        </div>
        <ui-menu [items]="items" [expandedKeys]="keys()" (expandedKeysChange)="setKeys($event)"
          [level]="level" [motion]="motion" ariaLabel="Workspaces" />
        <pre style="font-size:12px">expandedKeys = {{ keys() | json }}</pre>
      `,
        320,
      ),
    };
  },
};

// --- Low level -----------------------------------------------------------------------
export const Low: Story = {
  render: (args) => ({
    props: { ...args, items: BASIC_ITEMS },
    template: box(`<ui-menu [items]="items" level="low" [motion]="motion" ariaLabel="Secondary menu" />`),
  }),
};
