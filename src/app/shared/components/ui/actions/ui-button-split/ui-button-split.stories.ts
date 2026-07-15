import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { provideRouter } from '@angular/router';
import { UiButtonSplit } from '@app/shared/components/ui/actions/ui-button-split/ui-button-split';
import { UiMenuItem } from '@app/shared/components/ui/navigation/ui-menu/ui-menu';

// A basic set of options driving the dropdown (activation logged via itemClick).
const BASIC_MODEL: UiMenuItem[] = [
  { label: 'Mettre à jour' },
  { label: 'Supprimer' },
  { separator: true },
  { label: 'Angular', url: 'https://angular.dev', target: '_blank' },
  { label: 'Voir le profil', routerLink: '/profil' },
];

// Same options, each carrying an icon.
const ICON_MODEL: UiMenuItem[] = [
  { label: 'Mettre à jour', icon: 'refresh' },
  { label: 'Supprimer', icon: 'trash' },
  { separator: true },
  { label: 'Angular', icon: 'arrow-up-right-from-square', url: 'https://angular.dev', target: '_blank' },
  { label: 'Voir le profil', icon: 'user' },
];

// Options with nested submenus (collapsible groups inside the panel).
const NESTED_MODEL: UiMenuItem[] = [
  {
    label: 'Fichier',
    icon: 'folder',
    items: [
      { label: 'Nouveau', icon: 'plus' },
      { label: 'Ouvrir', icon: 'folder-open' },
      { label: 'Imprimer', icon: 'print' },
    ],
  },
  {
    label: 'Partager',
    icon: 'share-nodes',
    items: [
      { label: 'Copier le lien', icon: 'link' },
      { label: 'Par e-mail', icon: 'envelope' },
    ],
  },
  { separator: true },
  { label: 'Exporter', icon: 'file-export' },
];

const meta: Meta<UiButtonSplit> = {
  title: 'Components/ui/actions/ui-button-split',
  component: UiButtonSplit,
  decorators: [
    moduleMetadata({ imports: [UiButtonSplit] }),
    applicationConfig({ providers: [provideRouter([{ path: '**', children: [] }])] }),
  ],
  parameters: {
    // Extra height so the open popup is visible inside the docs canvas.
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=0-1&t=PXOwFotKvf72dn1c-1',
    },
  },
  argTypes: {
    model: {
      control: false,
      description: 'Options additionnelles révélées par le déroulant (modèle déclaratif UiMenuItem[]).',
      table: { type: { summary: 'UiMenuItem[]' }, defaultValue: { summary: '[]' } },
    },
    label: {
      control: { type: 'text' },
      description: "Libellé du bouton d'action principal.",
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    icon: {
      control: { type: 'text' },
      description: "Icône FontAwesome du bouton d'action.",
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    iconPos: {
      control: { type: 'inline-radio' },
      options: ['left', 'right', 'top', 'bottom'],
      description: "Position de l'icône du bouton d'action.",
      table: { type: { summary: 'ButtonIconPos' }, defaultValue: { summary: '"left"' } },
    },
    dropdownIcon: {
      control: { type: 'text' },
      description: 'Icône du déclencheur (le chevron).',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"chevron-down"' } },
    },
    level: {
      control: { type: 'select' },
      options: ['high', 'low', 'success', 'warning', 'error'],
      description: 'Niveau sémantique appliqué aux deux boutons.',
      table: { type: { summary: 'UiLevel' }, defaultValue: { summary: '"high"' } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'small'],
      description: 'Taille du contrôle (boutons + densité du menu).',
      table: { type: { summary: 'ButtonSplitSize' }, defaultValue: { summary: '"default"' } },
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Désactive les deux boutons.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    buttonDisabled: {
      control: { type: 'boolean' },
      description: "Désactive uniquement le bouton d'action.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    menuButtonDisabled: {
      control: { type: 'boolean' },
      description: 'Désactive uniquement le déclencheur du menu.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    ariaLabel: {
      control: { type: 'text' },
      description: "Nom accessible du bouton d'action (requis en icon-only).",
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    menuButtonAriaLabel: {
      control: { type: 'text' },
      description: 'Nom accessible du déclencheur (bouton icon-only).',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"Plus d\'options"' } },
    },
    menuAriaLabel: {
      control: { type: 'text' },
      description: 'Nom accessible de la liste des options.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    menuLevel: {
      control: { type: 'inline-radio' },
      options: ['high', 'low'],
      description: 'Famille de couleur du panneau du menu.',
      table: { type: { summary: "'high' | 'low'" }, defaultValue: { summary: '"high"' } },
    },
    menuStyleClass: {
      control: { type: 'text' },
      description: 'Classe(s) additionnelle(s) sur le panneau du menu.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    autoFlip: {
      control: { type: 'boolean' },
      description: 'Retourne le popup au-dessus du déclencheur quand la place manque.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    motion: {
      control: { type: 'boolean' },
      description: "Anime l'ouverture du popup (reduced-motion prioritaire).",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    tabindex: {
      control: { type: 'number' },
      description: "tabindex natif du bouton d'action.",
      table: { type: { summary: 'number' }, defaultValue: { summary: 'undefined' } },
    },
    buttonProps: {
      control: false,
      description: "Attributs natifs additionnels forwardés sur le <button> d'action.",
      table: { type: { summary: 'ButtonNativeProps' }, defaultValue: { summary: 'undefined' } },
    },
    buttonClick: {
      action: 'buttonClick',
      description: "Émis au clic sur le bouton d'action (jamais si désactivé).",
      table: { type: { summary: 'EventEmitter<MouseEvent>' }, defaultValue: { summary: '—' } },
    },
    dropdownClick: {
      action: 'dropdownClick',
      description: 'Émis au clic sur le déclencheur (jamais si désactivé).',
      table: { type: { summary: 'EventEmitter<MouseEvent>' }, defaultValue: { summary: '—' } },
    },
    menuShow: {
      action: 'menuShow',
      description: "Émis à l'ouverture du popup.",
      table: { type: { summary: 'EventEmitter<void>' }, defaultValue: { summary: '—' } },
    },
    menuHide: {
      action: 'menuHide',
      description: 'Émis à la fermeture du popup.',
      table: { type: { summary: 'EventEmitter<void>' }, defaultValue: { summary: '—' } },
    },
    itemClick: {
      action: 'itemClick',
      description: "Émis à l'activation d'une option (clic / clavier).",
      table: { type: { summary: 'EventEmitter<UiMenuItemCommandEvent>' }, defaultValue: { summary: '—' } },
    },
  },
  args: {
    label: 'Enregistrer',
    level: 'high',
    size: 'default',
    model: BASIC_MODEL,
  },
};

export default meta;
type Story = StoryObj<UiButtonSplit>;

// --- Basic -----------------------------------------------------------------
// A default action button + a collection of options driven by `model`.
export const Basic: Story = {};

// --- Icons -----------------------------------------------------------------
// Both the action button and the options support icons.
export const Icons: Story = {
  args: {
    label: 'Enregistrer',
    icon: 'floppy-disk',
    model: ICON_MODEL,
  },
};

// --- Nested ----------------------------------------------------------------
// Options can nest into collapsible submenus.
export const Nested: Story = {
  args: {
    label: 'Fichier',
    icon: 'folder',
    model: NESTED_MODEL,
  },
};

// --- Level -----------------------------------------------------------------
// `level` defines the type of button.
export const Level: Story = {
  render: (args) => ({
    props: { ...args },
    template: `
      <div style="display:flex; gap:16px; flex-wrap:wrap; align-items:flex-start">
        <ui-button-split label="High" level="high" [model]="model" menuAriaLabel="Options High" />
        <ui-button-split label="Low" level="low" [model]="model" menuAriaLabel="Options Low" />
        <ui-button-split label="Success" level="success" [model]="model" menuAriaLabel="Options Success" />
        <ui-button-split label="Warning" level="warning" [model]="model" menuAriaLabel="Options Warning" />
        <ui-button-split label="Error" level="error" [model]="model" menuAriaLabel="Options Error" />
      </div>
    `,
  }),
  args: { model: BASIC_MODEL },
};

// --- Disabled --------------------------------------------------------------
// `disabled` disables everything; the action (`buttonDisabled`) and the trigger
// (`menuButtonDisabled`) can also be disabled independently.
export const Disabled: Story = {
  render: (args) => ({
    props: { ...args },
    template: `
      <div style="display:flex; gap:16px; flex-wrap:wrap; align-items:flex-start">
        <ui-button-split label="Tout désactivé" disabled [model]="model" menuAriaLabel="Options" />
        <ui-button-split label="Action désactivée" buttonDisabled [model]="model" menuAriaLabel="Options" />
        <ui-button-split label="Menu désactivé" menuButtonDisabled [model]="model" menuAriaLabel="Options" />
      </div>
    `,
  }),
  args: { model: BASIC_MODEL },
};

// --- Sizes -----------------------------------------------------------------
// `size` scales the buttons and the menu density.
export const Sizes: Story = {
  render: (args) => ({
    props: { ...args },
    template: `
      <div style="display:flex; gap:16px; flex-wrap:wrap; align-items:flex-start">
        <ui-button-split label="Default" size="default" [model]="model" menuAriaLabel="Options Default" />
        <ui-button-split label="Small" size="small" [model]="model" menuAriaLabel="Options Small" />
      </div>
    `,
  }),
  args: { model: BASIC_MODEL },
};
