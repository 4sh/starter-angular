import { Component, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import { UiRadio } from '@4sh/ui-kit/forms/ui-radio';

const meta: Meta<UiRadio> = {
  title: 'Components/ui/forms/ui-radio',
  component: UiRadio,
  decorators: [moduleMetadata({ imports: [UiRadio, FormsModule] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=120-1412&t=8kHQCXijPPS2sXoC-1',
    },
  },
  argTypes: {
    value: {
      control: { type: 'text' },
      description: 'Value carried by this radio (the model takes it when selected).',
      table: { type: { summary: 'T' }, defaultValue: { summary: '—' } },
    },
    name: {
      control: { type: 'text' },
      description: 'Native group name — same name for every radio in the group (native arrow-key navigation).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    label: {
      control: { type: 'text' },
      description: 'Label shown next to the radio (clickable).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    ariaLabel: {
      control: { type: 'text' },
      description: 'Accessible name when no visible label is provided.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    ariaLabelledBy: {
      control: false,
      description: 'id of an external element that labels the radio.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    inputId: {
      control: { type: 'text' },
      description: 'id of the native input (auto-generated otherwise).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'auto' } },
    },
    required: {
      control: { type: 'boolean' },
      description: 'Required marker (*) on the label + native required attribute.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Disables this radio (native attribute).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    invalid: {
      control: { type: 'boolean' },
      description: 'Forces the error style (automatic when the attached control is invalid and touched/dirty).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    tabindex: {
      control: { type: 'number' },
      description: 'tabindex of the native input.',
      table: { type: { summary: 'number' }, defaultValue: { summary: 'undefined' } },
    },
    radioChange: {
      action: 'changed',
      description: 'Emitted when this radio is selected by the user, with its value.',
      table: { type: { summary: 'EventEmitter<T>' }, defaultValue: { summary: '—' } },
    },
    radioFocus: {
      action: 'focused',
      description: 'Emitted when the native input receives focus.',
      table: { type: { summary: 'EventEmitter<FocusEvent>' }, defaultValue: { summary: '—' } },
    },
    radioBlur: {
      action: 'blurred',
      description: 'Emitted when the native input loses focus.',
      table: { type: { summary: 'EventEmitter<FocusEvent>' }, defaultValue: { summary: '—' } },
    },
  },
};

export default meta;
type Story = StoryObj<UiRadio>;

// Radio isolé (playground)
export const Default: Story = { args: { value: 'a', label: 'Label', name: 'demo' } };
export const Checked: Story = {
  render: (args) => ({
    props: { ...args, model: 'a' },
    template: `<ui-radio [(ngModel)]="model" value="a" [label]="label" name="checked-demo" />`,
  }),
  args: { label: 'Selected' },
};
export const Disabled: Story = { args: { value: 'a', label: 'Disabled', disabled: true, name: 'disabled-demo' } };
export const Invalid: Story = { args: { value: 'a', label: 'In error', invalid: true, name: 'invalid-demo' } };

// Groupe — le vrai usage : même name + même modèle
export const Groupe: Story = {
  render: () => ({
    props: { flavor: 'vanilla' },
    template: `
      <div role="radiogroup" aria-label="Flavor" style="display: grid; gap: 8px; justify-items: start;">
        <ui-radio [(ngModel)]="flavor" name="flavor" value="vanilla" label="Vanille" />
        <ui-radio [(ngModel)]="flavor" name="flavor" value="chocolate" label="Chocolate" />
        <ui-radio [(ngModel)]="flavor" name="flavor" value="strawberry" label="Fraise" />
        <code>model = {{ flavor }}</code>
      </div>
    `,
  }),
};

// --- Signal Forms (@angular/forms/signals) ------------------------------
// Même principe qu'en template-driven : tous les membres liés au même [formField]
// + même name (groupement natif). Modèle '' initial → required invalide tant
// qu'aucune option n'est sélectionnée.
@Component({
  selector: 'demo-radio-signal-forms',
  standalone: true,
  imports: [UiRadio, FormField],
  template: `
    <div role="radiogroup" aria-label="Flavor" style="display: grid; gap: 8px; justify-items: start;">
      <ui-radio [formField]="flavor" name="sf-flavor" value="vanilla" label="Vanille" />
      <ui-radio [formField]="flavor" name="sf-flavor" value="chocolate" label="Chocolate" />
      <ui-radio [formField]="flavor" name="sf-flavor" value="strawberry" label="Fraise" />
      <code>value = {{ flavor().value() }} · valid = {{ flavor().valid() }}</code>
    </div>
  `,
})
class SignalFormsDemo {
  protected readonly model = signal('');
  protected readonly flavor = form(this.model, (path) => {
    required(path);
  });
}

export const SignalForms: Story = {
  name: 'Signal Forms',
  render: () => ({ template: `<demo-radio-signal-forms />` }),
  decorators: [moduleMetadata({ imports: [SignalFormsDemo] })],
};

// Groupe avec option désactivée
export const GroupeAvecDisabled: Story = {
  render: () => ({
    props: { plan: 'free' },
    template: `
      <div role="radiogroup" aria-label="Formule" style="display: grid; gap: 8px; justify-items: start;">
        <ui-radio [(ngModel)]="plan" name="plan" value="free" label="Free" />
        <ui-radio [(ngModel)]="plan" name="plan" value="pro" label="Pro" />
        <ui-radio [(ngModel)]="plan" name="plan" value="enterprise" label="Enterprise (coming soon)" [disabled]="true" />
      </div>
    `,
  }),
};
