import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { provideRouter } from '@angular/router';
import { UiSpeedDial, UiSpeedDialItem } from '@4sh/ui-kit/actions/ui-speed-dial';

const ITEMS: UiSpeedDialItem[] = [
  { label: 'Modifier', icon: 'pen' },
  { label: 'Dupliquer', icon: 'copy' },
  { label: 'Partager', icon: 'share-nodes' },
  { label: 'Supprimer', icon: 'trash' },
];

const meta: Meta<UiSpeedDial> = {
  title: 'Components/ui/actions/ui-speed-dial',
  component: UiSpeedDial,
  decorators: [
    moduleMetadata({ imports: [UiSpeedDial] }),
    applicationConfig({ providers: [provideRouter([{ path: '**', children: [] }])] }),
  ],
  parameters: {
    // Extra room: the fanned-out actions extend well past the trigger's own box.
    layout: 'padded',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=0-1&t=PXOwFotKvf72dn1c-1',
    },
  },
  argTypes: {
    items: {
      control: false,
      description: 'Actions révélées par le bouton (modèle déclaratif UiSpeedDialItem[]).',
      table: { type: { summary: 'UiSpeedDialItem[]' }, defaultValue: { summary: '[]' } },
    },
    visible: {
      control: 'boolean',
      description: 'État ouvert/fermé (two-way).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    type: {
      control: 'select',
      options: ['linear', 'circle', 'semi-circle', 'quarter-circle'],
      description:
        'Disposition : `linear` (empilée selon `direction`), `circle` (anneau complet), `semi-circle` (demi-anneau centré sur `direction`) ou `quarter-circle` (quart d’anneau dans le coin `direction`).',
      table: { type: { summary: 'SpeedDialType' }, defaultValue: { summary: "'linear'" } },
    },
    direction: {
      control: 'select',
      options: ['up', 'down', 'left', 'right', 'up-left', 'up-right', 'down-left', 'down-right'],
      description:
        '`linear`/`semi-circle` lisent les 4 valeurs cardinales ; `quarter-circle` lit les 4 coins.',
      table: { type: { summary: 'SpeedDialDirection' }, defaultValue: { summary: "'up'" } },
    },
    radius: {
      control: 'number',
      description: "Rayon de l'arc (px) — toute disposition sauf `linear`. Calculé sinon.",
      table: { type: { summary: 'number' }, defaultValue: { summary: 'undefined' } },
    },
    level: {
      control: 'select',
      options: ['high', 'low', 'success', 'warning', 'error'],
      description: 'Niveau sémantique du déclencheur.',
      table: { type: { summary: 'UiLevel' }, defaultValue: { summary: '"high"' } },
    },
    itemLevel: {
      control: 'select',
      options: ['high', 'low', 'success', 'warning', 'error'],
      description:
        'Niveau sémantique des actions — `low` par défaut, volontairement distinct du déclencheur.',
      table: { type: { summary: 'UiLevel' }, defaultValue: { summary: '"low"' } },
    },
    variant: {
      control: 'select',
      options: ['filled', 'outlined', 'ghost'],
      table: { type: { summary: 'ButtonVariant' }, defaultValue: { summary: '"filled"' } },
    },
    size: {
      control: 'inline-radio',
      options: ['default', 'small'],
      table: { type: { summary: 'ButtonSize' }, defaultValue: { summary: '"default"' } },
    },
    showIcon: {
      control: 'text',
      description: 'Icône du déclencheur fermé.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"plus"' } },
    },
    hideIcon: {
      control: 'text',
      description:
        'Icône du déclencheur ouvert. Non renseignée, `showIcon` pivote de 45° sur lui-même.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    rotateAnimation: {
      control: 'boolean',
      description: "Anime la rotation de l'icône (sans `hideIcon`).",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    mask: {
      control: 'boolean',
      description: 'Assombrit la page derrière le bouton ouvert.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    hideOnClickOutside: {
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Désactive le déclencheur et toutes les actions.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    showTooltips: {
      control: 'boolean',
      description: 'Affiche le libellé de chaque action en infobulle (actions icon-only).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    motion: {
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    ariaLabel: {
      control: 'text',
      description: 'Nom accessible du déclencheur.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    triggerClick: { action: 'triggerClick', table: { disable: true } },
    opened: { action: 'opened', table: { disable: true } },
    closed: { action: 'closed', table: { disable: true } },
    itemClick: { action: 'itemClick', table: { disable: true } },
  },
  args: {
    items: ITEMS,
    visible: true,
    type: 'linear',
    direction: 'up',
    level: 'high',
    size: 'default',
    ariaLabel: 'Actions',
  },
};

export default meta;
type Story = StoryObj<UiSpeedDial>;

// --- Basic -------------------------------------------------------------
// Rendered open (`visible`) so the fanned-out actions are visible in the docs.
export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `<div style="min-height:220px; display:flex; align-items:flex-end;">
      <ui-speed-dial [items]="items" [(visible)]="visible" [type]="type" [direction]="direction"
        [level]="level" [variant]="variant" [size]="size" [ariaLabel]="ariaLabel"
        (itemClick)="itemClick($event)" />
    </div>`,
  }),
};

// --- Directions ----------------------------------------------------------
// `linear` stacks the actions along `direction`, closest to the trigger first.
export const Directions: Story = {
  render: () => ({
    props: { items: ITEMS },
    template: `
      <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:64px; padding:80px 16px;">
        <ui-speed-dial [items]="items" [visible]="true" direction="up" ariaLabel="Actions haut" />
        <ui-speed-dial [items]="items" [visible]="true" direction="down" ariaLabel="Actions bas" />
        <ui-speed-dial [items]="items" [visible]="true" direction="left" ariaLabel="Actions gauche" />
        <ui-speed-dial [items]="items" [visible]="true" direction="right" ariaLabel="Actions droite" />
      </div>
    `,
  }),
};

// --- Circle ----------------------------------------------------------------
// `type="circle"` arranges the actions on a ring; `radius` overrides the default.
export const Circle: Story = {
  render: () => ({
    props: { items: ITEMS },
    template: `<div style="min-height:260px; display:flex; align-items:center; justify-content:center;">
      <ui-speed-dial [items]="items" [visible]="true" type="circle" ariaLabel="Actions" />
    </div>`,
  }),
};

/**
 * `semi-circle` spans 180°, centred on `direction`: `up` domes above the
 * trigger, `down` below, `left`/`right` to either side.
 */
export const SemiCircle: Story = {
  render: () => ({
    props: { items: ITEMS },
    template: `
      <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:64px; padding:120px 16px 16px;">
        <ui-speed-dial [items]="items" [visible]="true" type="semi-circle" direction="up" ariaLabel="Actions haut" />
        <ui-speed-dial [items]="items" [visible]="true" type="semi-circle" direction="down" ariaLabel="Actions bas" />
        <ui-speed-dial [items]="items" [visible]="true" type="semi-circle" direction="left" ariaLabel="Actions gauche" />
        <ui-speed-dial [items]="items" [visible]="true" type="semi-circle" direction="right" ariaLabel="Actions droite" />
      </div>
    `,
  }),
};

/**
 * `quarter-circle` spans 90°, filling the corner named by `direction`
 * (`up-left`, `up-right`, `down-left`, `down-right` — not the cardinal values).
 */
export const QuarterCircle: Story = {
  render: () => ({
    props: { items: ITEMS },
    template: `
      <div style="display:grid; grid-template-columns:repeat(4, 1fr); gap:64px; padding:64px 16px;">
        <ui-speed-dial [items]="items" [visible]="true" type="quarter-circle" direction="up-left" ariaLabel="Actions haut-gauche" />
        <ui-speed-dial [items]="items" [visible]="true" type="quarter-circle" direction="up-right" ariaLabel="Actions haut-droite" />
        <ui-speed-dial [items]="items" [visible]="true" type="quarter-circle" direction="down-left" ariaLabel="Actions bas-gauche" />
        <ui-speed-dial [items]="items" [visible]="true" type="quarter-circle" direction="down-right" ariaLabel="Actions bas-droite" />
      </div>
    `,
  }),
};

/** `itemLevel` (`low` par défaut) distingue les actions du déclencheur — comparer à `level` seul. */
export const ItemLevel: Story = {
  render: () => ({
    props: { items: ITEMS },
    template: `
      <div style="display:flex; gap:64px; padding:80px 16px;">
        <ui-speed-dial [items]="items" [visible]="true" ariaLabel="itemLevel=low (défaut)" />
        <ui-speed-dial [items]="items" [visible]="true" itemLevel="high" ariaLabel="itemLevel=high" />
      </div>
    `,
  }),
};

// --- Mask --------------------------------------------------------------
// `mask` dims the page behind the open dial (same token as `ui-modal`'s scrim).
export const Mask: Story = {
  render: () => ({
    props: { items: ITEMS },
    template: `<div style="min-height:220px; display:flex; align-items:flex-end;">
      <ui-speed-dial [items]="items" [visible]="true" mask ariaLabel="Actions" />
    </div>`,
  }),
};

// --- Tooltips ------------------------------------------------------------
// Actions are icon-only: `showTooltips` surfaces each `label` on hover/focus.
export const Tooltips: Story = {
  render: () => ({
    props: { items: ITEMS },
    template: `<div style="min-height:220px; display:flex; align-items:flex-end;">
      <ui-speed-dial [items]="items" [visible]="true" showTooltips ariaLabel="Actions" />
    </div>`,
  }),
};

// --- Levels ----------------------------------------------------------------
export const Levels: Story = {
  render: () => ({
    props: { items: ITEMS },
    template: `
      <div style="display:flex; gap:64px; padding:80px 16px;">
        <ui-speed-dial [items]="items" [visible]="true" level="high" ariaLabel="Actions high" />
        <ui-speed-dial [items]="items" [visible]="true" level="success" ariaLabel="Actions success" />
        <ui-speed-dial [items]="items" [visible]="true" level="error" ariaLabel="Actions error" />
      </div>
    `,
  }),
};

// --- Custom trigger icon ---------------------------------------------------
// `hideIcon` swaps the icon outright instead of rotating `showIcon`.
export const CustomIcons: Story = {
  render: () => ({
    props: { items: ITEMS },
    template: `<div style="min-height:220px; display:flex; align-items:flex-end;">
      <ui-speed-dial [items]="items" [visible]="true" showIcon="bars" hideIcon="xmark" ariaLabel="Actions" />
    </div>`,
  }),
};

// --- Disabled --------------------------------------------------------------
export const Disabled: Story = {
  render: () => ({
    props: { items: ITEMS },
    template: `<ui-speed-dial [items]="items" disabled ariaLabel="Actions" />`,
  }),
};

// --- Closed (interactive) ---------------------------------------------------
// The default, un-forced state: click the trigger to open it.
export const Closed: Story = {
  render: () => ({
    props: { items: ITEMS },
    template: `<div style="min-height:220px; display:flex; align-items:flex-end;">
      <ui-speed-dial [items]="items" ariaLabel="Actions" />
    </div>`,
  }),
};
