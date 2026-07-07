import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { UiInputNumber } from './ui-input-number';

const meta: Meta<UiInputNumber> = {
  title: 'Components/ui/forms/ui-input-number',
  component: UiInputNumber,
  decorators: [moduleMetadata({ imports: [UiInputNumber, FormsModule] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=113-2996&t=0SWBsuymjEi87t6k-1',
    },
  },
  argTypes: {
    label: { control: 'text', table: { type: { summary: 'string' } } },
    helperText: { control: 'text', table: { type: { summary: 'string' } } },
    placeholder: { control: 'text', table: { type: { summary: 'string' } } },
    size: { control: 'inline-radio', options: ['default', 'small'], table: { defaultValue: { summary: '"default"' } } },
    level: { control: 'inline-radio', options: ['default', 'success', 'error'], table: { defaultValue: { summary: '"default"' } } },
    min: { control: 'number', table: { type: { summary: 'number' } } },
    max: { control: 'number', table: { type: { summary: 'number' } } },
    step: { control: 'number', table: { type: { summary: 'number' }, defaultValue: { summary: '1' } } },
    allowDecimals: { control: 'boolean', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } } },
    unit: { control: 'text', table: { type: { summary: 'string' } } },
    showButtons: { control: 'boolean', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } } },
    locale: { control: 'text', description: 'Locale BCP-47 (ex. fr-FR).', table: { type: { summary: 'string' } } },
    currency: { control: 'text', description: 'Code devise ISO (ex. EUR) → format monétaire.', table: { type: { summary: 'string' } } },
    useGrouping: { control: 'boolean', description: 'Séparateurs de milliers au blur.', table: { defaultValue: { summary: 'true' } } },
    required: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    disabled: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    readonly: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    invalid: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    valueChange: { action: 'valueChange', table: { disable: true } },
    inputBlur: { action: 'inputBlur', table: { disable: true } },
  },
  args: { label: 'Quantité', size: 'default', level: 'default', step: 1, showButtons: true, allowDecimals: true, useGrouping: true },
};

export default meta;
type Story = StoryObj<UiInputNumber>;

const TEMPLATE = `<div style="width:220px"><ui-input-number
    [(ngModel)]="model"
    [label]="label" [helperText]="helperText" [placeholder]="placeholder"
    [size]="size" [level]="level" [min]="min" [max]="max" [step]="step"
    [allowDecimals]="allowDecimals" [unit]="unit" [showButtons]="showButtons"
    [locale]="locale" [currency]="currency" [useGrouping]="useGrouping"
    [required]="required" [disabled]="disabled" [readonly]="readonly" [invalid]="invalid"
    (valueChange)="valueChange($event)" /></div>`;

const story = (value: number | null = null): Story['render'] => (args) => ({ props: { ...args, model: value }, template: TEMPLATE });

export const Default: Story = { render: story(3), args: { label: 'Quantité' } };
export const Empty: Story = { render: story(null), args: { label: 'Quantité', placeholder: '0' } };
export const MinMax: Story = { render: story(5), args: { label: 'Note (0–10)', min: 0, max: 10, helperText: 'Bornée entre 0 et 10.' } };
export const Step: Story = { render: story(10), args: { label: 'Prix', step: 5, unit: '€' } };
export const Integer: Story = { render: story(2), args: { label: 'Personnes', allowDecimals: false, min: 1 } };
export const WithUnit: Story = { render: story(70), args: { label: 'Poids', unit: 'kg' } };
export const NoButtons: Story = { render: story(42), args: { label: 'Sans spinner', showButtons: false } };
export const Small: Story = { render: story(3), args: { label: 'Compact', size: 'small' } };
export const Error: Story = { render: story(150), args: { label: 'Âge', max: 120, level: 'error', errorText: 'Valeur trop élevée.' } };
export const Disabled: Story = { render: story(3), args: { label: 'Quantité', disabled: true } };

// Formatage Intl (appliqué au blur ; forme éditable au focus)
export const Currency: Story = { render: story(1234.5), args: { label: 'Prix', locale: 'fr-FR', currency: 'EUR', step: 0.5, helperText: 'Focus pour éditer, blur pour formater.' } };
export const Grouped: Story = { render: story(1234567), args: { label: 'Population', locale: 'fr-FR', useGrouping: true } };
