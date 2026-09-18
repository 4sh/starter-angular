import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { UiInputDate } from '@4sh/ui-kit/forms/ui-input-date';

const meta: Meta<UiInputDate> = {
  title: 'Components/ui/forms/ui-input-date',
  component: UiInputDate,
  decorators: [moduleMetadata({ imports: [UiInputDate, FormsModule] })],
  parameters: { layout: 'centered' },
  argTypes: {
    label: { control: 'text', table: { type: { summary: 'string' } } },
    mode: {
      control: 'inline-radio',
      options: ['date', 'time', 'datetime'],
      description: 'Granularité — décide du contrôle natif rendu par le navigateur.',
      table: { type: { summary: 'InputDateMode' }, defaultValue: { summary: '"date"' } },
    },
    valueType: {
      control: 'inline-radio',
      options: ['date', 'iso'],
      description: "Forme de la valeur émise. Identique à celle d'`ui-datepicker`.",
      table: { type: { summary: 'InputDateValueType' }, defaultValue: { summary: '"date"' } },
    },
    min: {
      control: 'text',
      description: 'Borne basse (`Date` ou chaîne ISO du `mode`).',
      table: { type: { summary: 'Date | string' } },
    },
    max: {
      control: 'text',
      description: 'Borne haute, mêmes formes que `min`.',
      table: { type: { summary: 'Date | string' } },
    },
    step: {
      control: 'number',
      description: 'Granularité native : jours sur `date`, **secondes** sur `time`/`datetime`.',
      table: { type: { summary: 'number' } },
    },
    icon: {
      control: 'text',
      description: 'Icône du bouton d\'ouverture : `clock` par défaut en `mode="time"`.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"calendar"' } },
    },
    showIcon: {
      control: 'boolean',
      description: "Rend le bouton d'ouverture.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    iconAriaLabel: {
      control: 'text',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"Ouvrir le calendrier"' } },
    },
    helperText: { control: 'text', table: { type: { summary: 'string' } } },
    errorText: { control: 'text', table: { type: { summary: 'string' } } },
    showMessageIcon: {
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    size: {
      control: 'inline-radio',
      options: ['default', 'small'],
      table: { type: { summary: 'FieldSize' }, defaultValue: { summary: '"default"' } },
    },
    level: {
      control: 'inline-radio',
      options: ['default', 'success', 'error'],
      table: { type: { summary: 'FieldLevel' }, defaultValue: { summary: '"default"' } },
    },
    floatLabel: {
      control: 'inline-radio',
      options: [undefined, 'over', 'in', 'on'],
      table: { type: { summary: 'FieldFloatLabel' }, defaultValue: { summary: 'undefined' } },
    },
    required: {
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    readonly: {
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    invalid: {
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    valueChange: { action: 'valueChange', table: { disable: true } },
    inputFocus: { action: 'inputFocus', table: { disable: true } },
    inputBlur: { action: 'inputBlur', table: { disable: true } },
  },
  args: {
    label: 'Date de naissance',
    mode: 'date',
    valueType: 'date',
    showIcon: true,
    size: 'default',
    level: 'default',
    showMessageIcon: false,
  },
};

export default meta;
type Story = StoryObj<UiInputDate>;

const TEMPLATE = `<div style="width:260px"><ui-input-date
    [(ngModel)]="model"
    [label]="label" [mode]="mode" [valueType]="valueType"
    [min]="min" [max]="max" [step]="step"
    [icon]="icon" [showIcon]="showIcon" [iconAriaLabel]="iconAriaLabel"
    [helperText]="helperText" [errorText]="errorText" [size]="size" [level]="level"
    [floatLabel]="floatLabel" [showMessageIcon]="showMessageIcon" [messageIcon]="messageIcon"
    [required]="required" [disabled]="disabled" [readonly]="readonly" [invalid]="invalid"
    (valueChange)="valueChange($event)" /></div>`;

const story =
  (value: Date | string | null = null): Story['render'] =>
  (args) => ({ props: { ...args, model: value }, template: TEMPLATE });

export const Default: Story = { render: story() };
export const WithValue: Story = { render: story(new Date(1990, 4, 17)) };
export const Bounded: Story = {
  render: story(),
  args: {
    label: 'Date de réservation',
    min: '2026-01-01',
    max: '2026-12-31',
    helperText: 'Uniquement sur 2026.',
  },
};
export const Time: Story = {
  render: story('09:30'),
  args: { label: 'Heure du rendez-vous', mode: 'time', step: 900 },
};
export const DateTime: Story = {
  render: story(new Date(2026, 8, 14, 9, 30)),
  args: { label: 'Début', mode: 'datetime' },
};
export const Iso: Story = {
  render: story('2026-09-14'),
  args: { label: 'Date (ISO)', valueType: 'iso', helperText: 'Émet `2026-09-14`, pas un `Date`.' },
};
export const FloatLabel: Story = {
  render: story(),
  args: { label: 'Date de naissance', floatLabel: 'on' },
};
export const Small: Story = { render: story(), args: { label: 'Compact', size: 'small' } };
export const Error: Story = {
  render: story(),
  args: { label: 'Date', level: 'error', helperText: 'Date obligatoire.' },
};
export const CustomIcon: Story = {
  render: story(new Date(2026, 8, 14)),
  args: { label: 'Échéance', icon: 'calendar-day', helperText: "L'icône se remplace par `icon`." },
};
export const NoIcon: Story = {
  render: story(new Date(2026, 8, 14)),
  args: { label: 'Date', showIcon: false },
};
export const Disabled: Story = {
  render: story(new Date(1990, 4, 17)),
  args: { label: 'Date', disabled: true },
};
