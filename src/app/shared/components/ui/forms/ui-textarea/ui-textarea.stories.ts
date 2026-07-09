import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormControl, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { UiTextarea } from './ui-textarea';

const meta: Meta<UiTextarea> = {
  title: 'Components/ui/forms/ui-textarea',
  component: UiTextarea,
  decorators: [moduleMetadata({ imports: [UiTextarea, FormsModule, ReactiveFormsModule] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=0-1&t=PXOwFotKvf72dn1c-1',
    },
  },
  argTypes: {
    label: { control: 'text', table: { type: { summary: 'string' } } },
    helperText: { control: 'text', description: "Texte d'aide (via ui-helper).", table: { type: { summary: 'string' } } },
    errorText: { control: 'text', description: "Message affiché à la place de l'aide quand en erreur.", table: { type: { summary: 'string' } } },
    placeholder: { control: 'text', table: { type: { summary: 'string' } } },
    rows: { control: { type: 'number', min: 1 }, description: 'Nombre de lignes visibles initial.', table: { type: { summary: 'number' }, defaultValue: { summary: '3' } } },
    maxlength: { control: 'number', description: 'Nombre maximum de caractères (natif + borne du compteur).', table: { type: { summary: 'number' } } },
    autoResize: { control: 'boolean', description: 'La hauteur suit le contenu (désactive la poignée).', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    resize: { control: 'inline-radio', options: ['none', 'vertical', 'horizontal', 'both'], description: 'Axe de redimensionnement manuel.', table: { type: { summary: 'TextareaResize' }, defaultValue: { summary: "'vertical'" } } },
    showCount: { control: 'boolean', description: 'Affiche un compteur de caractères.', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    size: { control: 'inline-radio', options: ['default', 'small'], table: { type: { summary: 'FieldSize' }, defaultValue: { summary: '"default"' } } },
    level: { control: 'inline-radio', options: ['default', 'success', 'error'], table: { type: { summary: 'FieldLevel' }, defaultValue: { summary: '"default"' } } },
    required: { control: 'boolean', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    disabled: { control: 'boolean', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    readonly: { control: 'boolean', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    invalid: { control: 'boolean', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    valueChange: { action: 'valueChange', table: { disable: true } },
    textareaFocus: { action: 'textareaFocus', table: { disable: true } },
    textareaBlur: { action: 'textareaBlur', table: { disable: true } },
  },
  args: { label: 'Label', placeholder: 'Placeholder', rows: 3, autoResize: false, resize: 'vertical', showCount: false, size: 'default', level: 'default' },
};

export default meta;
type Story = StoryObj<UiTextarea>;

// --- Template-driven ([(ngModel)]) --------------------------------------
const TEMPLATE = `<div style="width:280px"><ui-textarea
    [(ngModel)]="model"
    [label]="label" [helperText]="helperText" [errorText]="errorText" [placeholder]="placeholder"
    [rows]="rows" [maxlength]="maxlength" [autoResize]="autoResize" [resize]="resize" [showCount]="showCount"
    [size]="size" [level]="level"
    [required]="required" [disabled]="disabled" [readonly]="readonly" [invalid]="invalid"
    (valueChange)="valueChange($event)" /></div>`;

const story = (value = ''): Story['render'] => (args) => ({ props: { ...args, model: value }, template: TEMPLATE });

export const Default: Story = { render: story(), args: { label: 'Message', placeholder: 'Votre message…' } };
export const WithValue: Story = { render: story('Bonjour,\nvoici un message multiligne.'), args: { label: 'Message' } };
export const WithHelper: Story = { render: story(), args: { label: 'Commentaire', placeholder: 'Votre avis…', helperText: 'Restez courtois et concis.' } };
export const Success: Story = { render: story('Contenu validé'), args: { label: 'Bio', level: 'success', helperText: 'Parfait.' } };
export const Small: Story = { render: story(), args: { label: 'Compact', size: 'small', placeholder: 'Placeholder' } };
export const AutoResize: Story = { render: story('Cette zone grandit automatiquement\nà mesure que vous écrivez.'), args: { label: 'Auto-resize', autoResize: true } };
export const ResizeBoth: Story = { render: story('Poignée sur les deux axes.'), args: { label: 'Resize libre', resize: 'both' } };
export const Disabled: Story = { render: story('Non modifiable'), args: { label: 'Message', disabled: true } };
export const Readonly: Story = { render: story('Lecture seule'), args: { label: 'Message', readonly: true } };

// --- Character counter ---------------------------------------------------
export const CharacterCount: Story = {
  render: () => ({
    props: { model: 'Un court message.' },
    template: `<div style="width:280px"><ui-textarea
      [(ngModel)]="model" label="Commentaire" placeholder="280 caractères max"
      [maxlength]="280" [showCount]="true" /></div>`,
  }),
};

// --- Validation (reactive forms) : l'erreur apparaît / disparaît selon la saisie ---
// L'état d'erreur est piloté par le contrôle (invalide + touché/modifié), pas par un `level` figé.
export const Required: Story = {
  render: () => ({
    props: { control: new FormControl('', Validators.required) },
    template: `<div style="width:280px"><ui-textarea
      [formControl]="control" label="Message" [required]="true"
      helperText="Champ obligatoire." errorText="Ce champ est requis." /></div>`,
  }),
};

export const Validation: Story = {
  render: () => ({
    props: { control: new FormControl('', [Validators.required, Validators.minLength(20)]) },
    template: `<div style="width:280px"><ui-textarea
      [formControl]="control" label="Bio" [required]="true"
      [showCount]="true" [maxlength]="160"
      helperText="Entre 20 et 160 caractères."
      errorText="Minimum 20 caractères." /></div>`,
  }),
};
