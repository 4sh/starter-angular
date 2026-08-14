import { Component, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { FormField, form, max, min, required } from '@angular/forms/signals';
import { UiInputNumber } from '@4sh/ui-kit/forms/ui-input-number';

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
    currency: { control: 'text', description: 'ISO currency code (e.g. EUR) → currency format.', table: { type: { summary: 'string' } } },
    useGrouping: { control: 'boolean', description: 'Thousands separators on blur.', table: { defaultValue: { summary: 'true' } } },
    required: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    disabled: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    readonly: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    invalid: { control: 'boolean', table: { defaultValue: { summary: 'false' } } },
    valueChange: { action: 'valueChange', table: { disable: true } },
    inputBlur: { action: 'inputBlur', table: { disable: true } },
  },
  args: { label: 'Quantity', size: 'default', level: 'default', step: 1, showButtons: true, allowDecimals: true, useGrouping: true },
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

export const Default: Story = { render: story(3), args: { label: 'Quantity' } };
export const Empty: Story = { render: story(null), args: { label: 'Quantity', placeholder: '0' } };
export const MinMax: Story = { render: story(5), args: { label: 'Note (0–10)', min: 0, max: 10, helperText: 'Bounded between 0 and 10.' } };
export const Step: Story = { render: story(10), args: { label: 'Price', step: 5, unit: '€' } };
export const Integer: Story = { render: story(2), args: { label: 'People', allowDecimals: false, min: 1 } };
export const WithUnit: Story = { render: story(70), args: { label: 'Weight', unit: 'kg' } };
export const NoButtons: Story = { render: story(42), args: { label: 'Sans spinner', showButtons: false } };
export const Small: Story = { render: story(3), args: { label: 'Compact', size: 'small' } };
export const Error: Story = { render: story(150), args: { label: 'Age', max: 120, level: 'error', errorText: 'Value too high.' } };
export const Disabled: Story = { render: story(3), args: { label: 'Quantity', disabled: true } };

// Formatage Intl (appliqué au blur ; forme éditable au focus)
export const Currency: Story = { render: story(1234.5), args: { label: 'Price', locale: 'fr-FR', currency: 'EUR', step: 0.5, helperText: 'Focus to edit, blur to format.' } };
export const Grouped: Story = { render: story(1234567), args: { label: 'Population', locale: 'fr-FR', useGrouping: true } };

// --- Signal Forms (@angular/forms/signals) ------------------------------
@Component({
  selector: 'demo-input-number-signal-forms',
  standalone: true,
  imports: [UiInputNumber, FormField],
  template: `
    <div style="width:220px; display:grid; gap:12px; justify-items:start;">
      <ui-input-number [formField]="quantity" label="Note (0–10)" [min]="0" [max]="10" />
      <code>value = {{ quantity().value() }} · valid = {{ quantity().valid() }}</code>
    </div>
  `,
})
class SignalFormsDemo {
  protected readonly model = signal(5);
  protected readonly quantity = form(this.model, (path) => {
    required(path);
    min(path, 0);
    max(path, 10);
  });
}

export const SignalForms: Story = {
  name: 'Signal Forms',
  render: () => ({ template: `<demo-input-number-signal-forms />` }),
  decorators: [moduleMetadata({ imports: [SignalFormsDemo] })],
};
