import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { UiInput } from './ui-input';

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
    helperText: { control: 'text', description: "Texte d'aide (via ui-helper).", table: { type: { summary: 'string' } } },
    errorText: { control: 'text', description: "Message affiché à la place de l'aide quand en erreur.", table: { type: { summary: 'string' } } },
    placeholder: { control: 'text', table: { type: { summary: 'string' } } },
    type: {
      control: 'select',
      options: ['text', 'password', 'email', 'tel', 'url', 'search'],
      table: { type: { summary: 'InputType' }, defaultValue: { summary: '"text"' } },
    },
    size: { control: 'inline-radio', options: ['default', 'small'], table: { type: { summary: 'FieldSize' }, defaultValue: { summary: '"default"' } } },
    level: { control: 'inline-radio', options: ['default', 'success', 'error'], table: { type: { summary: 'FieldLevel' }, defaultValue: { summary: '"default"' } } },
    unit: { control: 'text', description: 'Unité suffixe.', table: { type: { summary: 'string' } } },
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

export const Default: Story = { render: story(), args: { label: 'Nom', placeholder: 'Votre nom' } };
export const WithValue: Story = { render: story('Robin'), args: { label: 'Nom' } };
export const WithHelper: Story = { render: story(), args: { label: 'Email', placeholder: 'nom@exemple.fr', helperText: 'Nous ne partagerons jamais votre email.' } };
export const Required: Story = { render: story(), args: { label: 'Nom', required: true } };
export const Success: Story = { render: story('robin'), args: { label: "Nom d'utilisateur", level: 'success', helperText: 'Disponible.' } };
export const Error: Story = { render: story('robin@'), args: { label: 'Email', level: 'error', helperText: 'Adresse e-mail invalide.' } };
export const ErrorText: Story = { render: story('robin@'), args: { label: 'Email', invalid: true, helperText: 'Aide neutre.', errorText: 'Adresse e-mail invalide.' } };
export const Small: Story = { render: story(), args: { label: 'Compact', size: 'small', placeholder: 'Placeholder' } };
export const WithUnit: Story = { render: story('50'), args: { label: 'Remise', unit: '%' } };
export const Disabled: Story = { render: story('Non modifiable'), args: { label: 'Champ', disabled: true } };
export const Readonly: Story = { render: story('Lecture seule'), args: { label: 'Champ', readonly: true } };

// Zone d'action droite : recherche → icône « effacer » visible seulement avec du texte, clic vide.
export const Search: Story = {
  render: () => ({
    props: { model: 'uiyuiyuiuyi' },
    template: `<div style="width:260px"><ui-input
      [(ngModel)]="model"
      label="Recherche"
      placeholder="Rechercher…"
      iconLeft="magnifying-glass"
      [iconRight]="model ? 'xmark' : undefined"
      iconRightAriaLabel="Effacer la recherche"
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
      [iconRightAriaLabel]="revealed ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
      (iconRightClick)="revealed = !revealed" /></div>`,
  }),
};
