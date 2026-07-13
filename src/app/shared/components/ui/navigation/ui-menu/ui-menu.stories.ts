import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { provideRouter } from '@angular/router';
import { JsonPipe } from '@angular/common';
import { computed, signal } from '@angular/core';
import { UiMenu, UiMenuItem } from './ui-menu';
import { UiButton } from '@app/shared/components/ui/actions/ui-button/ui-button';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';
import { UiTag } from '@app/shared/components/ui/informative/ui-tag/ui-tag';

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
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=0-1&t=PXOwFotKvf72dn1c-1',
    },
  },
  argTypes: {
    items: {
      control: false,
      description: 'Modèle déclaratif du menu (`UiMenuItem[]`) : groupes, séparateurs, commandes, liens.',
      table: { type: { summary: 'UiMenuItem[]' }, defaultValue: { summary: '[]' } },
    },
    popup: {
      control: false,
      description: 'Mode popup : le panneau s’ouvre dans un overlay via `toggle(event)` / `show(event)`.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    expandedKeys: {
      control: false,
      description:
        'État ouvert/fermé des groupes repliables, indexé par l’`id` des items (`{ [id]: boolean }`). Two-way bindable.',
      table: { type: { summary: 'Record<string, boolean>' }, defaultValue: { summary: '{}' } },
    },
    level: {
      control: { type: 'inline-radio' },
      options: ['high', 'low'],
      description: 'Famille de couleur navigation utilisée (`navigation.high` ou `navigation.low`).',
      table: { type: { summary: "'high' | 'low'" }, defaultValue: { summary: "'high'" } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'small'],
      description: 'Densité : `small` pour un rendu compact (menus d’actions « … »).',
      table: { type: { summary: "'default' | 'small'" }, defaultValue: { summary: "'default'" } },
    },
    motion: {
      control: { type: 'boolean' },
      description: 'Anime l’ouverture du popup et le repli des sous-menus (reduced-motion respecté).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    autoFlip: {
      control: { type: 'boolean' },
      description: 'Retourne le popup au-dessus du déclencheur quand la place manque en dessous.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    ariaLabel: {
      control: { type: 'text' },
      description: 'Nom accessible de la liste (`aria-label` sur `role="menu"`).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    tabindex: {
      control: false,
      description: 'Tabindex du tab stop roving du menu.',
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
      { label: 'Nouveau', icon: 'plus' },
      { label: 'Rechercher', icon: 'magnifying-glass' },
    ],
  },
  { separator: true },
  {
    label: 'Profil',
    items: [
      { label: 'Paramètres', icon: 'gear' },
      { label: 'Messages', icon: 'inbox' },
      { label: 'Déconnexion', icon: 'right-from-bracket' },
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
        label: 'Affichage',
        items: [
          {
            label: 'Grille',
            icon: prefs().grille ? 'square-check' : 'square',
            command: () => prefs.update((p) => ({ ...p, grille: !p.grille })),
          },
          {
            label: 'Détails',
            icon: prefs().details ? 'square-check' : 'square',
            command: () => prefs.update((p) => ({ ...p, details: !p.details })),
          },
        ],
      },
      { separator: true },
      {
        label: 'Trier par',
        items: [
          {
            label: 'Nom',
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
      template: box(`<ui-menu [items]="items()" [level]="level" [motion]="motion" ariaLabel="Options d'affichage" />`),
    };
  },
};

// --- Toggleable ----------------------------------------------------------
// Les sous-menus imbriqués sont repliables par défaut ; `toggleable` force le
// comportement par item (groupe racine repliable / groupe imbriqué figé ouvert).
const TOGGLEABLE_ITEMS: UiMenuItem[] = [
  {
    id: 'files',
    label: 'Fichiers',
    icon: 'folder',
    toggleable: true, // top-level group: plain header by default, forced toggleable
    items: [
      { label: 'Nouveau fichier', icon: 'file' },
      {
        id: 'shared',
        label: 'Partagés',
        icon: 'users',
        toggleable: false, // nested group: toggleable by default, forced always open
        items: [
          { label: 'Équipe design', icon: 'palette' },
          { label: 'Équipe dev', icon: 'code' },
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
    label: 'Corbeille',
    icon: 'trash',
  },
];

export const Toggleable: Story = {
  render: (args) => ({
    props: { ...args, items: TOGGLEABLE_ITEMS, keys: { files: true } },
    template: box(
      `<ui-menu [items]="items" [expandedKeys]="keys" [level]="level" [motion]="motion" ariaLabel="Explorateur" />`,
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
      { label: 'Renommer', icon: 'pen' },
      { label: 'Dupliquer', icon: 'copy' },
      { separator: true },
      { label: 'Supprimer', icon: 'trash' },
    ];
    return {
      props: { ...args, items },
      template: `
        <div style="display:flex; justify-content:space-between; align-items:center; max-width:320px; padding:8px 12px; border:1px solid var(--global-high-stroke-default); border-radius:8px">
          <span>rapport-2026.pdf</span>
          <ui-button level="low" size="small" icon="ellipsis" ariaLabel="Actions du fichier"
            (buttonClick)="menu.toggle($event)"
            [buttonProps]="{ 'aria-haspopup': 'menu', 'aria-controls': menu.uid }" />
        </div>
        <ui-menu #menu popup size="small" [items]="items" [level]="level" [motion]="motion" ariaLabel="Actions du fichier" />
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
        label: 'Espace de travail',
        items: [
          { label: 'Tableau de bord', icon: 'gauge' },
          { label: 'Rapports', icon: 'chart-line', title: 'Fonction PRO' },
          { label: 'Automatisations', icon: 'robot', title: 'Fonction PRO' },
        ],
      },
    ];
    return {
      props: { ...args, items },
      template: box(`
        <ui-menu [items]="items" [level]="level" [motion]="motion" ariaLabel="Espace de travail">
          <ng-template #start>
            <strong style="display:block">Acme Corp</strong>
            <small>Espace « Produit »</small>
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
            <small>Connecté en tant que robin&#64;acme.dev</small>
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
          { label: 'Enregistrer', icon: 'floppy-disk', command: ({ item }) => lastAction.set(`« ${item.label} »`) },
          { label: 'Dupliquer', icon: 'copy', command: ({ item }) => lastAction.set(`« ${item.label} »`) },
          { label: 'Supprimer', icon: 'trash', command: ({ item }) => lastAction.set(`« ${item.label} »`) },
          { label: 'Action désactivée', icon: 'ban', disabled: true, command: () => lastAction.set('jamais appelé') },
        ],
      },
    ];
    return {
      props: { ...args, items, lastAction },
      template: box(`
        <ui-menu [items]="items" [level]="level" [motion]="motion" ariaLabel="Actions" />
        <p aria-live="polite">Dernière commande : <strong>{{ lastAction() }}</strong></p>
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
          { label: 'Accueil', icon: 'house', routerLink: '/', routerLinkActiveExact: true },
          { label: 'Profil', icon: 'user', routerLink: '/profil' },
          { label: 'Recherche', icon: 'magnifying-glass', routerLink: '/recherche', queryParams: { q: 'tokens' } },
        ],
      },
      { separator: true },
      {
        label: 'Liens externes',
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
        label: 'Projets',
        icon: 'diagram-project',
        toggleable: true,
        items: [
          { label: 'Design System', icon: 'swatchbook' },
          { label: 'Site vitrine', icon: 'globe' },
        ],
      },
      {
        id: 'equipes',
        label: 'Équipes',
        icon: 'users',
        toggleable: true,
        items: [
          { label: 'Design', icon: 'palette' },
          { label: 'Développement', icon: 'code' },
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
          <ui-button size="small" level="low" label="Tout ouvrir" (buttonClick)="expandAll()" />
          <ui-button size="small" level="low" label="Tout fermer" (buttonClick)="collapseAll()" />
        </div>
        <ui-menu [items]="items" [expandedKeys]="keys()" (expandedKeysChange)="setKeys($event)"
          [level]="level" [motion]="motion" ariaLabel="Espaces" />
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
    template: box(`<ui-menu [items]="items" level="low" [motion]="motion" ariaLabel="Menu secondaire" />`),
  }),
};
