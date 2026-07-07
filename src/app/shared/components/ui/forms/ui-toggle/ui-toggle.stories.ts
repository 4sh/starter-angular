import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { UiToggle } from '@app/shared/components/ui/forms/ui-toggle/ui-toggle';

const meta: Meta<UiToggle> = {
  title: 'Components/ui/forms/ui-toggle',
  component: UiToggle,
  decorators: [moduleMetadata({ imports: [UiToggle, FormsModule] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=120-1988&t=0SWBsuymjEi87t6k-1',
    },
  },
  argTypes: {
    label: {
      control: { type: 'text' },
      description: 'Texte du label (clic dessus = bascule).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    ariaLabel: {
      control: { type: 'text' },
      description: 'Nom accessible si aucun label visible.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'small'],
      description: 'Taille.',
      table: { type: { summary: 'ToggleSize' }, defaultValue: { summary: '"default"' } },
    },
    required: {
      control: { type: 'boolean' },
      description: 'Marqueur requis (*) + attribut natif required.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Désactive le switch (attribut natif).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    readonly: {
      control: { type: 'boolean' },
      description: 'Focusable mais non modifiable.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    invalid: {
      control: { type: 'boolean' },
      description: 'Force le style erreur (auto si le contrôle est invalide et touché/modifié).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    tabindex: {
      control: { type: 'number' },
      description: 'tabindex forwardé sur l’input natif.',
      table: { type: { summary: 'number' }, defaultValue: { summary: 'undefined' } },
    },
    toggleChange: { action: 'toggleChange', table: { disable: true } },
    toggleFocus: { action: 'toggleFocus', table: { disable: true } },
    toggleBlur: { action: 'toggleBlur', table: { disable: true } },
  },
  args: {
    label: 'Label',
    size: 'default',
  },
};

export default meta;
type Story = StoryObj<UiToggle>;

// Piloté par ngModel pour une bascule réellement interactive dans Storybook.
const TEMPLATE = `<ui-toggle
    [(ngModel)]="model"
    [label]="label" [ariaLabel]="ariaLabel" [size]="size"
    [required]="required" [disabled]="disabled" [readonly]="readonly"
    [invalid]="invalid" [tabindex]="tabindex"
    (toggleChange)="toggleChange($event)" />`;

/** Story factory: `on` seeds the initial ngModel value. */
const story = (on = false): Story['render'] => (args) => ({ props: { ...args, model: on }, template: TEMPLATE });

export const Default: Story = { render: story(), args: { label: 'Notifications' } };
export const Checked: Story = { render: story(true), args: { label: 'Notifications' } };
export const Small: Story = { render: story(), args: { label: 'Compact', size: 'small' } };
export const Required: Story = { render: story(), args: { label: 'Accepter les CGU', required: true } };
export const Disabled: Story = { render: story(), args: { label: 'Indisponible', disabled: true } };
export const DisabledChecked: Story = { render: story(true), args: { label: 'Verrouillé activé', disabled: true } };
export const Readonly: Story = { render: story(), args: { label: 'Lecture seule', readonly: true } };
export const Invalid: Story = { render: story(), args: { label: 'Champ obligatoire', invalid: true } };

// Sans label visible : nom accessible obligatoire
export const NoLabel: Story = { render: story(), args: { label: undefined, ariaLabel: 'Mode sombre' } };
