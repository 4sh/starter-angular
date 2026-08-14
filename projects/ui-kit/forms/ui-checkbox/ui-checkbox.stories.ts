import { Component, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import { UiCheckbox } from '@4sh/ui-kit/forms/ui-checkbox';

const meta: Meta<UiCheckbox> = {
  title: 'Components/ui/forms/ui-checkbox',
  component: UiCheckbox,
  decorators: [moduleMetadata({ imports: [UiCheckbox, FormsModule] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=49-431&t=8kHQCXijPPS2sXoC-1',
    },
  },
  argTypes: {
    label: {
      control: { type: 'text' },
      description: 'Label affiché à côté de la case (cliquable).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    ariaLabel: {
      control: { type: 'text' },
      description: 'Nom accessible quand aucun label visible n’est fourni.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    ariaLabelledBy: {
      control: false,
      description: 'id d’un élément externe qui labellise la case.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    inputId: {
      control: { type: 'text' },
      description: 'id de l’input natif (généré automatiquement sinon).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'auto' } },
    },
    name: {
      control: { type: 'text' },
      description: 'name de l’input natif.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    trueValue: {
      control: false,
      description: 'Valeur du modèle quand la case est cochée (défaut : true).',
      table: { type: { summary: 'T' }, defaultValue: { summary: 'true' } },
    },
    falseValue: {
      control: false,
      description: 'Valeur du modèle quand la case est décochée (défaut : false).',
      table: { type: { summary: 'T' }, defaultValue: { summary: 'false' } },
    },
    indeterminate: {
      control: { type: 'boolean' },
      description: 'État visuel indéterminé (« certains mais pas tous »). N’affecte pas le modèle.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    required: {
      control: { type: 'boolean' },
      description: 'Marqueur requis (*) sur le label + attribut natif required.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Désactive la case (attribut natif).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    readonly: {
      control: { type: 'boolean' },
      description: 'Focusable mais non modifiable.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    invalid: {
      control: { type: 'boolean' },
      description: 'Force le style erreur (automatique quand le contrôle attaché est invalide et touched/dirty).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    tabindex: {
      control: { type: 'number' },
      description: 'tabindex de l’input natif.',
      table: { type: { summary: 'number' }, defaultValue: { summary: 'undefined' } },
    },
    checkIcon: {
      control: { type: 'text' },
      description: 'Icône FontAwesome affichée quand cochée.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"check"' } },
    },
    indeterminateIcon: {
      control: { type: 'text' },
      description: 'Icône FontAwesome affichée en état indéterminé.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"minus"' } },
    },
    checkboxChange: {
      action: 'changed',
      description: 'Émis au toggle utilisateur avec la nouvelle valeur du modèle.',
      table: { type: { summary: 'EventEmitter<T>' }, defaultValue: { summary: '—' } },
    },
    checkboxFocus: {
      action: 'focused',
      description: 'Émis quand l’input natif reçoit le focus.',
      table: { type: { summary: 'EventEmitter<FocusEvent>' }, defaultValue: { summary: '—' } },
    },
    checkboxBlur: {
      action: 'blurred',
      description: 'Émis quand l’input natif perd le focus.',
      table: { type: { summary: 'EventEmitter<FocusEvent>' }, defaultValue: { summary: '—' } },
    },
  },
};

export default meta;
type Story = StoryObj<UiCheckbox>;

// Base
export const Default: Story = { args: { label: 'Label' } };
export const Checked: Story = {
  render: (args) => ({
    props: { ...args, model: true },
    template: `<ui-checkbox [(ngModel)]="model" [label]="label" />`,
  }),
  args: { label: 'Checked' },
};

// États
export const Indeterminate: Story = { args: { label: 'Indeterminate', indeterminate: true } };
export const Required: Story = { args: { label: 'Required', required: true } };
export const Disabled: Story = { args: { label: 'Disabled', disabled: true } };
export const DisabledChecked: Story = {
  render: (args) => ({
    props: { ...args, model: true },
    template: `<ui-checkbox [(ngModel)]="model" [label]="label" [disabled]="true" />`,
  }),
  args: { label: 'Disabled checked' },
};
export const Readonly: Story = { args: { label: 'Read-only', readonly: true } };
export const Invalid: Story = { args: { label: 'In error', invalid: true } };

// Sans label visible (aria-label obligatoire)
export const NoLabel: Story = { args: { ariaLabel: 'Select row' } };

// trueValue / falseValue personnalisés
export const CustomValues: Story = {
  render: () => ({
    props: { model: 'yes' },
    template: `
      <div style="display: grid; gap: 8px; justify-items: start;">
        <ui-checkbox [(ngModel)]="model" label="Accepter" trueValue="yes" falseValue="no" />
        <code>model = {{ model }}</code>
      </div>
    `,
  }),
};

// --- Signal Forms (@angular/forms/signals) ------------------------------
@Component({
  selector: 'demo-checkbox-signal-forms',
  standalone: true,
  imports: [UiCheckbox, FormField],
  template: `
    <div style="display: grid; gap: 8px; justify-items: start;">
      <ui-checkbox [formField]="accepted" label="Accept the terms" />
      <code>value = {{ accepted().value() }} · valid = {{ accepted().valid() }}</code>
    </div>
  `,
})
class SignalFormsDemo {
  protected readonly model = signal(false);
  protected readonly accepted = form(this.model, (path) => {
    required(path);
  });
}

export const SignalForms: Story = {
  name: 'Signal Forms',
  render: () => ({ template: `<demo-checkbox-signal-forms />` }),
  decorators: [moduleMetadata({ imports: [SignalFormsDemo] })],
};

// Groupe (indeterminate piloté par un parent)
export const Group: Story = {
  render: () => ({
    props: { child1: true, child2: false },
    template: `
      <div style="display: grid; gap: 8px; justify-items: start;">
        <ui-checkbox
          label="Select all"
          [indeterminate]="child1 !== child2"
          [ngModel]="child1 && child2"
          (checkboxChange)="child1 = $event; child2 = $event"
        />
        <div style="display: grid; gap: 8px; padding-left: 32px;">
          <ui-checkbox [(ngModel)]="child1" label="Item 1" />
          <ui-checkbox [(ngModel)]="child2" label="Item 2" />
        </div>
      </div>
    `,
  }),
};
