import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { signal } from '@angular/core';
import { JsonPipe } from '@angular/common';
import { UiSwatchPicker, UiSwatch } from '@4sh/ui-kit/forms/ui-swatch-picker';
import { UiButton } from '@4sh/ui-kit/actions/ui-button';

const meta: Meta<UiSwatchPicker> = {
  title: 'Components/ui/forms/ui-swatch-picker',
  component: UiSwatchPicker,
  decorators: [
    moduleMetadata({
      imports: [UiSwatchPicker, UiButton, JsonPipe],
    }),
  ],
  parameters: {
    layout: 'padded',
  },
  argTypes: {
    palette: {
      control: false,
      description:
        'Palette rendue en sections de pastilles (`UiSwatchGroup[]`). Par défaut : `DEFAULT_SWATCH_PALETTE` (7 teintes × 5 nuances + noir/blanc, dérivée des tokens `primitives.*`).',
      table: { type: { summary: 'UiSwatchGroup[]' }, defaultValue: { summary: 'DEFAULT_SWATCH_PALETTE' } },
    },
    value: {
      control: false,
      description: '`key` de la pastille sélectionnée (two-way bindable), ou `null` pour « Aucune couleur ».',
      table: { type: { summary: 'string | null' }, defaultValue: { summary: 'null' } },
    },
    popup: {
      control: false,
      description:
        'Mode popup : le panneau s’ouvre dans un overlay via `toggle(event)` / `show(event)`.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'small'],
      description: 'Densité de la grille.',
      table: { type: { summary: "'default' | 'small'" }, defaultValue: { summary: "'small'" } },
    },
    allowClear: {
      control: { type: 'boolean' },
      description: 'Affiche une pastille « Aucune couleur » en tête de grille.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    ariaLabel: {
      control: { type: 'text' },
      description: 'Nom accessible de la grille (`aria-label` sur `role="listbox"`).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
  },
  args: {
    size: 'small',
    allowClear: true,
  },
};

export default meta;
type Story = StoryObj<UiSwatchPicker>;

const box = (inner: string, width = 320) => `<div style="max-width:${width}px">${inner}</div>`;

// --- Default -------------------------------------------------------------
// Rendu inline (pas de popup) : visible sans interaction.
export const Default: Story = {
  render: (args) => {
    const value = signal<string | null>('red-500');
    return {
      props: { ...args, value, setValue: (v: string | null) => value.set(v) },
      template: box(`
        <ui-swatch-picker [size]="size" [allowClear]="allowClear" [value]="value()"
          (valueChange)="setValue($event)" ariaLabel="Couleurs" />
        <p>Sélection : <strong>{{ value() ?? '—' }}</strong></p>
      `),
    };
  },
};

// --- Small -----------------------------------------------------------------
export const Small: Story = {
  render: (args) => ({
    props: { ...args, size: 'small' },
    template: box(`<ui-swatch-picker size="small" [allowClear]="allowClear" ariaLabel="Couleurs" />`),
  }),
};

// --- WithClear ---------------------------------------------------------------
// `allowClear` (défaut true) ajoute la pastille « Aucune couleur » en tête.
export const WithClear: Story = {
  render: (args) => {
    const value = signal<string | null>(null);
    return {
      props: { ...args, value, setValue: (v: string | null) => value.set(v) },
      template: box(`
        <ui-swatch-picker [size]="size" allowClear [value]="value()"
          (valueChange)="setValue($event)" ariaLabel="Couleurs" />
        <pre style="font-size:12px">value = {{ value() | json }}</pre>
      `),
    };
  },
};

// --- Popup -----------------------------------------------------------------
// Sans bouton trigger propre : un `ui-button` externe pilote `toggle(event)`,
// exactement comme `ui-button-split` pilote son `ui-menu` popup.
export const Popup: Story = {
  render: (args) => {
    const selected = signal<UiSwatch | null>(null);
    return {
      props: {
        ...args,
        onSelect: (swatch: UiSwatch | null) => selected.set(swatch),
        selected,
      },
      template: box(`
        <ui-button label="Couleur" icon="palette" (buttonClick)="picker.toggle($event)"
          [buttonProps]="{ 'aria-haspopup': 'listbox', 'aria-controls': picker.uid }" />
        <ui-swatch-picker #picker popup [size]="size" [allowClear]="allowClear"
          ariaLabel="Couleur du texte" (swatchSelect)="onSelect($event)" />
        <p>Dernière sélection : <strong>{{ selected()?.label ?? '—' }}</strong></p>
      `),
    };
  },
};
