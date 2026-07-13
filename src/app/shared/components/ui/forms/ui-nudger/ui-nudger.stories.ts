import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { UiNudger } from './ui-nudger';

const meta: Meta<UiNudger> = {
  title: 'Components/ui/forms/ui-nudger',
  component: UiNudger,
  decorators: [moduleMetadata({ imports: [UiNudger, FormsModule] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=242-1085&t=pjakBEjs0OKVBact-1',
    },
  },
  argTypes: {
    size: {
      control: 'inline-radio',
      options: ['default', 'small'],
      table: { type: { summary: '"default" | "small"' }, defaultValue: { summary: '"default"' } },
    },
    level: {
      control: 'inline-radio',
      options: ['high', 'low', 'success', 'warning', 'error'],
      description: 'Famille de couleur des deux boutons.',
      table: { defaultValue: { summary: '"high"' } },
    },
    min: { control: 'number', table: { type: { summary: 'number' } } },
    max: { control: 'number', table: { type: { summary: 'number' } } },
    step: { control: 'number', table: { type: { summary: 'number' }, defaultValue: { summary: '1' } } },
    defaultValue: { control: 'number', table: { type: { summary: 'number' }, defaultValue: { summary: '0' } } },
    disabled: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    readonly: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    required: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    invalid: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    ariaLabel: { control: 'text', table: { type: { summary: 'string' } } },
    decrementLabel: { control: 'text', table: { defaultValue: { summary: '"Diminuer"' } } },
    incrementLabel: { control: 'text', table: { defaultValue: { summary: '"Augmenter"' } } },
    decrementIcon: { control: 'text', table: { defaultValue: { summary: '"minus"' } } },
    incrementIcon: { control: 'text', table: { defaultValue: { summary: '"plus"' } } },
    valueChange: { action: 'valueChange', table: { disable: true } },
  },
  args: {
    size: 'default',
    level: 'high',
    step: 1,
    defaultValue: 0,
    ariaLabel: 'Quantité',
    disabled: false,
    readonly: false,
    required: false,
    invalid: false,
    decrementLabel: 'Diminuer',
    incrementLabel: 'Augmenter',
    decrementIcon: 'minus',
    incrementIcon: 'plus',
  },
};

export default meta;
type Story = StoryObj<UiNudger>;

const TEMPLATE = `<ui-nudger
    [(ngModel)]="model"
    [size]="size" [level]="level"
    [min]="min" [max]="max" [step]="step" [defaultValue]="defaultValue"
    [disabled]="disabled" [readonly]="readonly" [required]="required" [invalid]="invalid"
    [ariaLabel]="ariaLabel"
    [decrementLabel]="decrementLabel" [incrementLabel]="incrementLabel"
    [decrementIcon]="decrementIcon" [incrementIcon]="incrementIcon"
    (valueChange)="valueChange($event)" />`;

const story =
  (value = 3): Story['render'] =>
  (args) => ({ props: { ...args, model: value }, template: TEMPLATE });

export const Default: Story = { render: story(3) };

export const MinMax: Story = {
  render: story(5),
  args: { min: 0, max: 10, ariaLabel: 'Note (0–10)' },
};

export const Step: Story = {
  render: story(10),
  args: { step: 5, ariaLabel: 'Prix' },
};

export const AtMin: Story = {
  render: story(0),
  args: { min: 0, max: 10, ariaLabel: 'Bord minimum' },
};

export const AtMax: Story = {
  render: story(10),
  args: { min: 0, max: 10, ariaLabel: 'Bord maximum' },
};

export const Small: Story = {
  render: story(3),
  args: { size: 'small', ariaLabel: 'Compact' },
};

export const LevelLow: Story = {
  render: story(3),
  args: { level: 'low', ariaLabel: 'Niveau low' },
};

export const Disabled: Story = {
  render: story(3),
  args: { disabled: true, ariaLabel: 'Désactivé' },
};

export const Readonly: Story = {
  render: story(3),
  args: { readonly: true, ariaLabel: 'Lecture seule' },
};

export const Invalid: Story = {
  render: story(12),
  args: { min: 0, max: 10, invalid: true, ariaLabel: 'En erreur' },
};

// Formateur d'affichage personnalisé (unité).
export const Formatted: Story = {
  render: (args) => ({
    props: { ...args, model: 2, format: (v: number) => `${v} kg` },
    template: `<ui-nudger [(ngModel)]="model" [min]="0" [step]="1"
        [formatValue]="format" ariaLabel="Poids" />`,
  }),
};
