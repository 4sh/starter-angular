import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { provideRouter } from '@angular/router';
import { signal } from '@angular/core';
import { UiContextMenu } from '@4sh/ui-kit/navigation/ui-context-menu';
import { UiMenuItem } from '@4sh/ui-kit/navigation/ui-menu';
import { UiIcon } from '@4sh/ui-kit/base/ui-icon';
import { UiTag } from '@4sh/ui-kit/informative/ui-tag';

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
      description: 'Declarative menu model (`UiMenuItem[]`): items, nested submenus, commands, links.',
      table: { type: { summary: 'UiMenuItem[]' }, defaultValue: { summary: '[]' } },
    },
    target: {
      control: false,
      description: 'Element the context menu is attached to (template reference variable).',
      table: { type: { summary: 'HTMLElement | ElementRef' }, defaultValue: { summary: 'null' } },
    },
    global: {
      control: false,
      description: 'Attaches the context menu to the whole document rather than to a `target`.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    triggerEvent: {
      control: false,
      description: 'DOM event that opens the menu on the target (right click by default).',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'contextmenu'" } },
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
      description: 'Menu density — compact by default (contextual action menus).',
      table: { type: { summary: "'default' | 'small'" }, defaultValue: { summary: "'small'" } },
    },
    submenus: {
      control: { type: 'inline-radio' },
      options: ['flyout', 'inline'],
      description: 'Group rendering: cascading side panels (default) or sections/accordions within the panel.',
      table: { type: { summary: "'inline' | 'flyout'" }, defaultValue: { summary: "'flyout'" } },
    },
    motion: {
      control: { type: 'boolean' },
      description: 'Animates the menu\'s appearance (reduced-motion respected).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    ariaLabel: {
      control: { type: 'text' },
      description: 'Accessible name of the list (`aria-label` on `role="menu"`).',
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
const zone = (label = 'Right click in this area') => `
  <div #zone tabindex="0" style="display:flex; align-items:center; justify-content:center; max-width:420px; height:160px;
    border:2px dashed var(--global-border-default); border-radius:12px; color:var(--global-text-default);
    font-family:var(--fontfamily-base); user-select:none">
    ${label}
  </div>`;

const BASIC_ITEMS: UiMenuItem[] = [
  { label: 'Copier', icon: 'copy' },
  { label: 'Rename', icon: 'pen' },
  { separator: true },
  { label: 'Remove', icon: 'trash' },
];

// --- Basic -------------------------------------------------------------
// Attached to a target element (template reference), opened with right-click.
export const Basic: Story = {
  render: (args) => ({
    props: { ...args, items: BASIC_ITEMS },
    template: `
      ${zone()}
      <ui-context-menu [target]="zone" [items]="items" [level]="level" [size]="size" [submenus]="submenus" [motion]="motion"
        ariaLabel="Document actions" />
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
        label: 'Share',
        icon: 'share-nodes',
        items: [
          { label: 'Send by email', icon: 'paper-plane' },
          { label: 'Copy link', icon: 'link' },
          {
            label: 'Networks',
            icon: 'globe',
            items: [
              { label: 'Mastodon', icon: 'hashtag' },
              { label: 'LinkedIn', icon: 'briefcase' },
            ],
          },
        ],
      },
      {
        label: 'Save as',
        icon: 'download',
        items: [
          { label: 'PDF', icon: 'file-pdf' },
          { label: 'PNG', icon: 'file-image' },
        ],
      },
      { separator: true },
      { label: 'Remove', icon: 'trash' },
    ];
    return {
      props: { ...args, items },
      template: `
        ${zone('Right click: nested submenus')}
        <ui-context-menu [target]="zone" [items]="items" [level]="level" [size]="size" [submenus]="submenus" [motion]="motion"
          ariaLabel="File actions" />
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
        The menu is attached to the <strong>document</strong>: right click anywhere in the preview area.
      </p>
      <ui-context-menu global [items]="items" [level]="level" [size]="size" [submenus]="submenus" [motion]="motion"
        ariaLabel="Global actions" />
    `,
  }),
};

// --- Template ----------------------------------------------------------------
// The #item template receives the menuitem instance ($implicit) from the model.
export const Template: Story = {
  render: (args) => {
    const items: UiMenuItem[] = [
      { label: 'Preview', icon: 'eye' },
      { label: 'Exporter', icon: 'file-export', title: 'PRO' },
      { separator: true },
      { label: 'Remove', icon: 'trash' },
    ];
    return {
      props: { ...args, items },
      template: `
        ${zone('Right click: custom items')}
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
      { label: 'Pin', icon: 'thumbtack', command: ({ item }) => lastAction.set(`« ${item.label} »`) },
      { label: 'Archive', icon: 'box-archive', command: ({ item }) => lastAction.set(`« ${item.label} »`) },
      { separator: true },
      { label: 'Signaler', icon: 'flag', command: ({ item }) => lastAction.set(`« ${item.label} »`) },
    ];
    return {
      props: { ...args, items, lastAction },
      template: `
        ${zone('Right click: commands')}
        <ui-context-menu [target]="zone" [items]="items" [level]="level" [size]="size" [submenus]="submenus" [motion]="motion"
          ariaLabel="Message actions" />
        <p aria-live="polite" style="font-family:var(--fontfamily-base)">
          Last command: <strong>{{ lastAction() }}</strong>
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
      { label: 'Home', icon: 'house', routerLink: '/', routerLinkActiveExact: true },
      { label: 'Profile', icon: 'user', routerLink: '/profil' },
      { separator: true },
      { label: 'Documentation Angular', icon: 'up-right-from-square', url: 'https://angular.dev', target: '_blank' },
    ];
    return {
      props: { ...args, items },
      template: `
        ${zone('Right click: navigation')}
        <ui-context-menu [target]="zone" [items]="items" [level]="level" [size]="size" [submenus]="submenus" [motion]="motion"
          ariaLabel="Navigation" />
      `,
    };
  },
};
