import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { UiContextMenu } from './ui-context-menu';
import { UiMenuItem } from '@app/shared/components/ui/navigation/ui-menu/ui-menu';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';
import { UiTag } from '@app/shared/components/ui/informative/ui-tag/ui-tag';

const meta: Meta<UiContextMenu> = {
  title: 'Components/ui/navigation/ui-context-menu',
  component: UiContextMenu,
  decorators: [
    moduleMetadata({
      imports: [UiContextMenu, UiIcon, UiTag],
    }),
    // The embedded menu supports RouterLink items: give every story a
    // catch-all route so the router's initial navigation doesn't error.
    applicationConfig({ providers: [provideRouter([{ path: '**', children: [] }])] }),
  ],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    items: {
      control: false,
      description: 'Modèle déclaratif du menu (`UiMenuItem[]`) : items, sous-menus imbriqués, commandes, liens.',
      table: { type: { summary: 'UiMenuItem[]' }, defaultValue: { summary: '[]' } },
    },
    target: {
      control: false,
      description: 'Élément auquel le menu contextuel est attaché (variable de référence de template).',
      table: { type: { summary: 'HTMLElement | ElementRef' }, defaultValue: { summary: 'null' } },
    },
    global: {
      control: false,
      description: 'Attache le menu contextuel au document entier plutôt qu’à un `target`.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    triggerEvent: {
      control: false,
      description: 'Événement DOM qui ouvre le menu sur la cible (clic droit par défaut).',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'contextmenu'" } },
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
      description: 'Densité du menu — compacte par défaut (menus d’actions contextuels).',
      table: { type: { summary: "'default' | 'small'" }, defaultValue: { summary: "'small'" } },
    },
    submenus: {
      control: { type: 'inline-radio' },
      options: ['flyout', 'inline'],
      description: 'Rendu des groupes : panneaux latéraux en cascade (défaut) ou sections/accordéons dans le panneau.',
      table: { type: { summary: "'inline' | 'flyout'" }, defaultValue: { summary: "'flyout'" } },
    },
    motion: {
      control: { type: 'boolean' },
      description: 'Anime l’apparition du menu (reduced-motion respecté).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    ariaLabel: {
      control: { type: 'text' },
      description: 'Nom accessible de la liste (`aria-label` sur `role="menu"`).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
  },
  args: {
    level: 'high',
    size: 'small',
    submenus: 'flyout',
    motion: true,
  },
};

export default meta;
type Story = StoryObj<UiContextMenu>;

// Shared demo target: a card-like zone inviting the right-click.
const zone = (label = 'Clic droit dans cette zone') => `
  <div #zone tabindex="0" style="display:flex; align-items:center; justify-content:center; max-width:420px; height:160px;
    border:2px dashed var(--global-high-stroke-default); border-radius:12px; color:var(--global-high-content-default);
    font-family:var(--fontfamily-base); user-select:none">
    ${label}
  </div>`;

const BASIC_ITEMS: UiMenuItem[] = [
  { label: 'Copier', icon: 'copy' },
  { label: 'Renommer', icon: 'pen' },
  { separator: true },
  { label: 'Supprimer', icon: 'trash' },
];

// --- Basic -------------------------------------------------------------
// Attached to a target element (template reference), opened with right-click.
export const Basic: Story = {
  render: (args) => ({
    props: { ...args, items: BASIC_ITEMS },
    template: `
      ${zone()}
      <ui-context-menu [target]="zone" [items]="items" [level]="level" [size]="size" [submenus]="submenus" [motion]="motion"
        ariaLabel="Actions du document" />
    `,
  }),
};

// --- Submenus ------------------------------------------------------------
// Nested `items` open as cascading side panels (flyout, the default here).
export const Submenus: Story = {
  render: (args) => {
    const items: UiMenuItem[] = [
      { label: 'Copier', icon: 'copy' },
      {
        label: 'Partager',
        icon: 'share-nodes',
        items: [
          { label: 'Envoyer par e-mail', icon: 'paper-plane' },
          { label: 'Copier le lien', icon: 'link' },
          {
            label: 'Réseaux',
            icon: 'globe',
            items: [
              { label: 'Mastodon', icon: 'hashtag' },
              { label: 'LinkedIn', icon: 'briefcase' },
            ],
          },
        ],
      },
      {
        label: 'Enregistrer sous',
        icon: 'download',
        items: [
          { label: 'PDF', icon: 'file-pdf' },
          { label: 'PNG', icon: 'file-image' },
        ],
      },
      { separator: true },
      { label: 'Supprimer', icon: 'trash' },
    ];
    return {
      props: { ...args, items },
      template: `
        ${zone('Clic droit : sous-menus imbriqués')}
        <ui-context-menu [target]="zone" [items]="items" [level]="level" [size]="size" [submenus]="submenus" [motion]="motion"
          ariaLabel="Actions du fichier" />
      `,
    };
  },
};

// --- Global ---------------------------------------------------------------
// `global` attaches the context menu to the whole document.
export const Global: Story = {
  render: (args) => ({
    props: { ...args, items: BASIC_ITEMS },
    template: `
      <p style="font-family:var(--fontfamily-base)">
        Le menu est attaché au <strong>document</strong> : clic droit n'importe où dans la zone de prévisualisation.
      </p>
      <ui-context-menu global [items]="items" [level]="level" [size]="size" [submenus]="submenus" [motion]="motion"
        ariaLabel="Actions globales" />
    `,
  }),
};

// --- Template ----------------------------------------------------------------
// The #item template receives the menuitem instance ($implicit) from the model.
export const Template: Story = {
  render: (args) => {
    const items: UiMenuItem[] = [
      { label: 'Aperçu', icon: 'eye' },
      { label: 'Exporter', icon: 'file-export', title: 'PRO' },
      { separator: true },
      { label: 'Supprimer', icon: 'trash' },
    ];
    return {
      props: { ...args, items },
      template: `
        ${zone('Clic droit : items personnalisés')}
        <ui-context-menu [target]="zone" [items]="items" [level]="level" [size]="size" [submenus]="submenus" [motion]="motion"
          ariaLabel="Actions">
          <ng-template #item let-item>
            <ui-icon [name]="item.icon" size="sm" />
            <span class="ui-menu-item-label">{{ item.label }}</span>
            @if (item.title) {
              <ui-tag label="PRO" level="highlight" subLevel="low" size="small" />
            }
          </ng-template>
        </ui-context-menu>
      `,
    };
  },
};

// --- Command --------------------------------------------------------------------
// `command` is invoked on activation with { originalEvent, item }.
export const Command: Story = {
  render: (args) => {
    const lastAction = signal('—');
    const items: UiMenuItem[] = [
      { label: 'Épingler', icon: 'thumbtack', command: ({ item }) => lastAction.set(`« ${item.label} »`) },
      { label: 'Archiver', icon: 'box-archive', command: ({ item }) => lastAction.set(`« ${item.label} »`) },
      { separator: true },
      { label: 'Signaler', icon: 'flag', command: ({ item }) => lastAction.set(`« ${item.label} »`) },
    ];
    return {
      props: { ...args, items, lastAction },
      template: `
        ${zone('Clic droit : commandes')}
        <ui-context-menu [target]="zone" [items]="items" [level]="level" [size]="size" [submenus]="submenus" [motion]="motion"
          ariaLabel="Actions du message" />
        <p aria-live="polite" style="font-family:var(--fontfamily-base)">
          Dernière commande : <strong>{{ lastAction() }}</strong>
        </p>
      `,
    };
  },
};

// --- Router --------------------------------------------------------------------
// routerLink / programmatic routing in a command / external URLs.
export const Router: Story = {
  render: (args) => {
    const items: UiMenuItem[] = [
      { label: 'Accueil', icon: 'house', routerLink: '/', routerLinkActiveExact: true },
      { label: 'Profil', icon: 'user', routerLink: '/profil' },
      { separator: true },
      { label: 'Documentation Angular', icon: 'up-right-from-square', url: 'https://angular.dev', target: '_blank' },
    ];
    return {
      props: { ...args, items },
      template: `
        ${zone('Clic droit : navigation')}
        <ui-context-menu [target]="zone" [items]="items" [level]="level" [size]="size" [submenus]="submenus" [motion]="motion"
          ariaLabel="Navigation" />
      `,
    };
  },
};
