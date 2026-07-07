import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { UiInputMask } from './ui-input-mask';

const meta: Meta<UiInputMask> = {
  title: 'Components/ui/forms/ui-input-mask',
  component: UiInputMask,
  decorators: [moduleMetadata({ imports: [UiInputMask, FormsModule] })],
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
    mask: { control: 'text', description: '9 chiffre · a lettre · * alphanumérique · autre = littéral.', table: { type: { summary: 'string' } } },
    slotChar: { control: 'text', table: { type: { summary: 'string' }, defaultValue: { summary: '"_"' } } },
    unmask: { control: 'boolean', description: 'Émet la valeur brute (sans littéraux).', table: { defaultValue: { summary: 'false' } } },
    size: { control: 'inline-radio', options: ['default', 'small'], table: { defaultValue: { summary: '"default"' } } },
    level: { control: 'inline-radio', options: ['default', 'success', 'error'], table: { defaultValue: { summary: '"default"' } } },
    iconLeft: { control: 'text', table: { type: { summary: 'string' } } },
    required: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    disabled: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    readonly: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    invalid: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    valueChange: { action: 'valueChange', table: { disable: true } },
    inputBlur: { action: 'inputBlur', table: { disable: true } },
  },
  args: { label: 'Téléphone', mask: '(999) 999-9999', slotChar: '_', size: 'default', level: 'default' },
};

export default meta;
type Story = StoryObj<UiInputMask>;

const TEMPLATE = `<div style="width:240px"><ui-input-mask
    [(ngModel)]="model"
    [label]="label" [helperText]="helperText" [placeholder]="placeholder"
    [mask]="mask" [slotChar]="slotChar" [unmask]="unmask"
    [size]="size" [level]="level" [iconLeft]="iconLeft"
    [required]="required" [disabled]="disabled" [readonly]="readonly" [invalid]="invalid"
    (valueChange)="valueChange($event)" /></div>`;

const story = (value = ''): Story['render'] => (args) => ({ props: { ...args, model: value }, template: TEMPLATE });

export const Phone: Story = { render: story(), args: { label: 'Téléphone', mask: '(999) 999-9999' } };
export const Time: Story = { render: story(), args: { label: 'Heure', mask: '99:99', helperText: 'Format 24h.' } };
export const Date: Story = { render: story(), args: { label: 'Date', mask: '99/99/9999', placeholder: 'jj/mm/aaaa', iconLeft: 'calendar' } };
export const License: Story = { render: story(), args: { label: 'Immatriculation', mask: 'aa-999-aa' } };
export const Prefilled: Story = { render: story('12/09/2024'), args: { label: 'Date', mask: '99/99/9999' } };
export const Unmask: Story = { render: story(), args: { label: 'IBAN (brut)', mask: 'FR99 9999 9999 9999', unmask: true, helperText: 'Émet la valeur sans espaces.' } };
export const Small: Story = { render: story(), args: { label: 'Date', mask: '99/99/9999', size: 'small' } };
export const Error: Story = { render: story('12/'), args: { label: 'Date', mask: '99/99/9999', level: 'error', errorText: 'Date incomplète.' } };
export const Disabled: Story = { render: story('12/09/2024'), args: { label: 'Date', mask: '99/99/9999', disabled: true } };
