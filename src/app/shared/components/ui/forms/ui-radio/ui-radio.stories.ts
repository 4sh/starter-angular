import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { UiRadio } from '@app/shared/components/ui/forms/ui-radio/ui-radio';

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
      description: 'Valeur portée par ce radio (le modèle la prend quand il est sélectionné).',
      table: { type: { summary: 'T' }, defaultValue: { summary: '—' } },
    },
    name: {
      control: { type: 'text' },
      description: 'Nom natif du groupe — même name pour tous les radios du groupe (navigation flèches native).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    label: {
      control: { type: 'text' },
      description: 'Label affiché à côté du radio (cliquable).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    ariaLabel: {
      control: { type: 'text' },
      description: 'Nom accessible quand aucun label visible n’est fourni.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    ariaLabelledBy: {
      control: false,
      description: 'id d’un élément externe qui labellise le radio.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    inputId: {
      control: { type: 'text' },
      description: 'id de l’input natif (généré automatiquement sinon).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'auto' } },
    },
    required: {
      control: { type: 'boolean' },
      description: 'Marqueur requis (*) sur le label + attribut natif required.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Désactive ce radio (attribut natif).',
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
    radioChange: {
      action: 'changed',
      description: 'Émis quand ce radio est sélectionné par l’utilisateur, avec sa valeur.',
      table: { type: { summary: 'EventEmitter<T>' }, defaultValue: { summary: '—' } },
    },
    radioFocus: {
      action: 'focused',
      description: 'Émis quand l’input natif reçoit le focus.',
      table: { type: { summary: 'EventEmitter<FocusEvent>' }, defaultValue: { summary: '—' } },
    },
    radioBlur: {
      action: 'blurred',
      description: 'Émis quand l’input natif perd le focus.',
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
  args: { label: 'Sélectionné' },
};
export const Disabled: Story = { args: { value: 'a', label: 'Désactivé', disabled: true, name: 'disabled-demo' } };
export const Invalid: Story = { args: { value: 'a', label: 'En erreur', invalid: true, name: 'invalid-demo' } };

// Groupe — le vrai usage : même name + même modèle
export const Groupe: Story = {
  render: () => ({
    props: { flavor: 'vanilla' },
    template: `
      <div role="radiogroup" aria-label="Parfum" style="display: grid; gap: 8px; justify-items: start;">
        <ui-radio [(ngModel)]="flavor" name="flavor" value="vanilla" label="Vanille" />
        <ui-radio [(ngModel)]="flavor" name="flavor" value="chocolate" label="Chocolat" />
        <ui-radio [(ngModel)]="flavor" name="flavor" value="strawberry" label="Fraise" />
        <code>model = {{ flavor }}</code>
      </div>
    `,
  }),
};

// Groupe avec option désactivée
export const GroupeAvecDisabled: Story = {
  render: () => ({
    props: { plan: 'free' },
    template: `
      <div role="radiogroup" aria-label="Formule" style="display: grid; gap: 8px; justify-items: start;">
        <ui-radio [(ngModel)]="plan" name="plan" value="free" label="Gratuit" />
        <ui-radio [(ngModel)]="plan" name="plan" value="pro" label="Pro" />
        <ui-radio [(ngModel)]="plan" name="plan" value="enterprise" label="Enterprise (bientôt)" [disabled]="true" />
      </div>
    `,
  }),
};
