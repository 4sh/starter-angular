import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { UiFieldSign, type FieldSignValue } from '@4sh/ui-kit/forms/ui-field-sign';

/** A short signature, as the field itself exports it (SVG, transparent background). */
const SAMPLE_SIGNATURE =
  'data:image/svg+xml;charset=utf-8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 320 160" width="320" height="160">' +
      '<g fill="none" stroke="black" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M40 110Q55 40 70 95Q80 130 95 80Q105 50 112 98Q120 120 135 90Q150 60 160 100Q170 125 190 85"/>' +
      '<path d="M200 92Q215 70 230 95Q240 112 255 88Q268 70 280 96"/>' +
      '<path d="M45 128L270 122"/>' +
      '</g></svg>',
  );

const meta: Meta<UiFieldSign> = {
  title: 'Components/ui/forms/ui-field-sign',
  component: UiFieldSign,
  decorators: [moduleMetadata({ imports: [UiFieldSign, FormsModule] })],
  parameters: { layout: 'centered' },
  argTypes: {
    label: { control: 'text', table: { type: { summary: 'string' } } },
    format: {
      control: 'inline-radio',
      options: ['png', 'svg'],
      description: 'Format de la data URL émise.',
      table: { type: { summary: 'FieldSignFormat' }, defaultValue: { summary: '"png"' } },
    },
    exportColor: {
      control: 'color',
      description:
        "Couleur de l'encre **à l'export** (toute couleur CSS). L'encre à l'écran suit les jetons.",
      table: { type: { summary: 'string' }, defaultValue: { summary: '"black"' } },
    },
    placeholder: {
      control: 'text',
      description: 'Invite affichée dans la zone vide.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"Signez ici"' } },
    },
    clearable: {
      control: 'boolean',
      description: "Rend le bouton d'effacement.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    clearAriaLabel: {
      control: 'text',
      description: "Nom accessible du bouton d'effacement.",
      table: { type: { summary: 'string' }, defaultValue: { summary: '"Effacer la signature"' } },
    },
    signedLabel: {
      control: 'text',
      description:
        "État annoncé une fois la zone signée (l'invite est annoncée tant qu'elle est vide).",
      table: { type: { summary: 'string' }, defaultValue: { summary: '"Signature saisie"' } },
    },
    helperText: { control: 'text', table: { type: { summary: 'string' } } },
    errorText: { control: 'text', table: { type: { summary: 'string' } } },
    showMessageIcon: {
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    size: {
      control: 'inline-radio',
      options: ['default', 'small'],
      table: { type: { summary: 'FieldSize' }, defaultValue: { summary: '"default"' } },
    },
    level: {
      control: 'inline-radio',
      options: ['default', 'success', 'error'],
      table: { type: { summary: 'FieldLevel' }, defaultValue: { summary: '"default"' } },
    },
    required: {
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    readonly: {
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    invalid: {
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    valueChange: { action: 'valueChange', table: { disable: true } },
    padFocus: { action: 'padFocus', table: { disable: true } },
    padBlur: { action: 'padBlur', table: { disable: true } },
    messageIcon: {
      control: false,
      description: 'Remplace le glyphe affiché par `showMessageIcon`.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    ariaLabel: {
      control: false,
      description: "Nom accessible quand aucun libellé visible n'est fourni.",
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    ariaLabelledBy: {
      control: false,
      description: "Id d'un élément externe qui étiquette ce contrôle.",
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    inputId: {
      control: false,
      description: 'Id transmis à la zone de tracé (généré automatiquement si omis).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    name: {
      control: false,
      description:
        'Sans rendu : la valeur ne passe pas par un champ natif, elle vit dans le formulaire Angular.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    tabindex: {
      control: false,
      description: 'Valeur de `tabindex` de la zone de tracé (`0` par défaut).',
      table: { type: { summary: 'number' }, defaultValue: { summary: 'undefined' } },
    },
  },
  args: {
    label: 'Signature du client',
    format: 'png',
    exportColor: 'black',
    placeholder: 'Signez ici',
    clearable: true,
    clearAriaLabel: 'Effacer la signature',
    signedLabel: 'Signature saisie',
    size: 'default',
    level: 'default',
    showMessageIcon: false,
  },
};

export default meta;
type Story = StoryObj<UiFieldSign>;

const TEMPLATE = `<div style="width:360px"><ui-field-sign
    [(ngModel)]="model"
    [label]="label" [format]="format" [exportColor]="exportColor" [placeholder]="placeholder"
    [clearable]="clearable" [clearAriaLabel]="clearAriaLabel" [signedLabel]="signedLabel"
    [helperText]="helperText" [errorText]="errorText" [size]="size" [level]="level"
    [showMessageIcon]="showMessageIcon" [messageIcon]="messageIcon"
    [required]="required" [disabled]="disabled" [readonly]="readonly" [invalid]="invalid"
    (valueChange)="valueChange($event)" /></div>`;

const story =
  (value: FieldSignValue = null): Story['render'] =>
  (args) => ({ props: { ...args, model: value }, template: TEMPLATE });

export const Default: Story = { render: story() };
export const WithHelper: Story = {
  render: story(),
  args: { helperText: 'Au doigt, au stylet ou à la souris.' },
};
export const WithValue: Story = {
  render: story(SAMPLE_SIGNATURE),
  args: { helperText: 'Une valeur reçue du formulaire reste sous les nouveaux traits.' },
};
export const Svg: Story = {
  render: story(),
  args: {
    label: 'Signature (SVG)',
    format: 'svg',
    helperText: 'Émet une data URL `image/svg+xml`.',
  },
};
export const Required: Story = {
  render: story(),
  args: { required: true, helperText: 'Obligatoire pour valider le bon de livraison.' },
};
export const Error: Story = {
  render: story(),
  args: { level: 'error', helperText: 'La signature est obligatoire.' },
};
export const Small: Story = { render: story(), args: { label: 'Paraphe', size: 'small' } };
export const ReadOnly: Story = { render: story(SAMPLE_SIGNATURE), args: { readonly: true } };
export const Disabled: Story = { render: story(SAMPLE_SIGNATURE), args: { disabled: true } };
