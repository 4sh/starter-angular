import { Component, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { FormField, form, minLength, required } from '@angular/forms/signals';
import { UiInput } from '@4sh/ui-kit/forms/ui-input';

const meta: Meta<UiInput> = {
  title: 'Components/ui/forms/ui-input',
  component: UiInput,
  decorators: [moduleMetadata({ imports: [UiInput, FormsModule] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=113-2996&t=0SWBsuymjEi87t6k-1',
    },
  },
  argTypes: {
    label: { control: 'text', table: { type: { summary: 'string' } } },
    helperText: { control: 'text', description: "Helper text (via ui-helper).", table: { type: { summary: 'string' } } },
    errorText: { control: 'text', description: "Message shown instead of the helper text when in error.", table: { type: { summary: 'string' } } },
    placeholder: { control: 'text', table: { type: { summary: 'string' } } },
    type: {
      control: 'select',
      options: ['text', 'password', 'email', 'tel', 'url', 'search'],
      table: { type: { summary: 'InputType' }, defaultValue: { summary: '"text"' } },
    },
    size: { control: 'inline-radio', options: ['default', 'small'], table: { type: { summary: 'FieldSize' }, defaultValue: { summary: '"default"' } } },
    level: { control: 'inline-radio', options: ['default', 'success', 'error'], table: { type: { summary: 'FieldLevel' }, defaultValue: { summary: '"default"' } } },
    unit: { control: 'text', description: 'Suffix unit.', table: { type: { summary: 'string' } } },
    iconLeft: { control: 'text', table: { type: { summary: 'string' } } },
    iconRight: { control: 'text', table: { type: { summary: 'string' } } },
    required: { control: 'boolean', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    disabled: { control: 'boolean', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    readonly: { control: 'boolean', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    invalid: { control: 'boolean', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    valueChange: { action: 'valueChange', table: { disable: true } },
    iconRightClick: { action: 'iconRightClick', table: { disable: true } },
    inputFocus: { action: 'inputFocus', table: { disable: true } },
    inputBlur: { action: 'inputBlur', table: { disable: true } },
  },
  args: { label: 'Label', placeholder: 'Placeholder', type: 'text', size: 'default', level: 'default' },
};

export default meta;
type Story = StoryObj<UiInput>;

const TEMPLATE = `<div style="width:260px"><ui-input
    [(ngModel)]="model"
    [label]="label" [helperText]="helperText" [errorText]="errorText" [placeholder]="placeholder"
    [type]="type" [size]="size" [level]="level" [unit]="unit"
    [iconLeft]="iconLeft" [iconRight]="iconRight"
    [required]="required" [disabled]="disabled" [readonly]="readonly" [invalid]="invalid"
    (valueChange)="valueChange($event)" /></div>`;

const story = (value = ''): Story['render'] => (args) => ({ props: { ...args, model: value }, template: TEMPLATE });

export const Default: Story = { render: story(), args: { label: 'Name', placeholder: 'Your name' } };
export const WithValue: Story = { render: story('Robin'), args: { label: 'Name' } };
export const WithHelper: Story = { render: story(), args: { label: 'Email', placeholder: 'nom@exemple.fr', helperText: 'We will never share your email.' } };
export const Required: Story = { render: story(), args: { label: 'Name', required: true } };
export const Success: Story = { render: story('robin'), args: { label: "Username", level: 'success', helperText: 'Available.' } };
export const Error: Story = { render: story('robin@'), args: { label: 'Email', level: 'error', helperText: 'Invalid email address.' } };
export const ErrorText: Story = { render: story('robin@'), args: { label: 'Email', invalid: true, helperText: 'Neutral helper.', errorText: 'Invalid email address.' } };
export const Small: Story = { render: story(), args: { label: 'Compact', size: 'small', placeholder: 'Placeholder' } };
export const WithUnit: Story = { render: story('50'), args: { label: 'Remise', unit: '%' } };
export const Disabled: Story = { render: story('Non modifiable'), args: { label: 'Champ', disabled: true } };
export const Readonly: Story = { render: story('Read-only'), args: { label: 'Champ', readonly: true } };

// Zone d'action droite : recherche → icône « effacer » visible seulement avec du texte, clic vide.
export const Search: Story = {
  render: () => ({
    props: { model: 'uiyuiyuiuyi' },
    template: `<div style="width:260px"><ui-input
      [(ngModel)]="model"
      label="Recherche"
      placeholder="Search…"
      iconLeft="magnifying-glass"
      [iconRight]="model ? 'xmark' : undefined"
      iconRightAriaLabel="Clear search"
      (iconRightClick)="model = ''" /></div>`,
  }),
};

// Zone d'action droite : mot de passe → l'œil bascule l'affichage.
export const Password: Story = {
  render: () => ({
    props: { model: 'motdepasse', revealed: false },
    template: `<div style="width:260px"><ui-input
      [(ngModel)]="model"
      label="Mot de passe"
      [type]="revealed ? 'text' : 'password'"
      [iconRight]="revealed ? 'eye-slash' : 'eye'"
      [iconRightAriaLabel]="revealed ? 'Hide password' : 'Show password'"
      (iconRightClick)="revealed = !revealed" /></div>`,
  }),
};

// --- Signal Forms (@angular/forms/signals) ------------------------------
@Component({
  selector: 'demo-input-signal-forms',
  standalone: true,
  imports: [UiInput, FormField],
  template: `
    <div style="width:260px; display:grid; gap:12px; justify-items:start;">
      <ui-input [formField]="field" label="Name" placeholder="Your name"
                helperText="3 characters minimum." errorText="3 characters minimum." />
      <code>value = {{ field().value() }} · valid = {{ field().valid() }}</code>
    </div>
  `,
})
class SignalFormsDemo {
  protected readonly model = signal('');
  protected readonly field = form(this.model, (path) => {
    required(path);
    minLength(path, 3);
  });
}

export const SignalForms: Story = {
  name: 'Signal Forms',
  render: () => ({ template: `<demo-input-signal-forms />` }),
  decorators: [moduleMetadata({ imports: [SignalFormsDemo] })],
};
