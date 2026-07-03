import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiButton } from '@app/shared/components/ui/actions/ui-button/ui-button';

const meta: Meta<UiButton> = {
  title: 'Components/ui/actions/ui-button',
  component: UiButton,
  decorators: [moduleMetadata({ imports: [UiButton] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=17-320&t=7j6veJQXz8JBfHmr-1',
    },
  },
  argTypes: {
    label: {
      control: { type: 'text' },
      description: 'Texte du bouton (absent = bouton icon-only, ou contenu projeté via <ng-content>).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    ariaLabel: {
      control: { type: 'text' },
      description: 'Aria-label (obligatoire si icon-only ; fallback sur label sinon).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    type: {
      control: { type: 'inline-radio' },
      options: ['button', 'submit', 'reset'],
      description: 'Type natif du bouton HTML.',
      table: { type: { summary: 'ButtonType' }, defaultValue: { summary: '"button"' } },
    },
    level: {
      control: { type: 'select' },
      options: ['high', 'low', 'success', 'warning', 'error'],
      description: "Niveau sémantique : high/low pour l'importance, success/warning/error pour un retour contextuel.",
      table: { type: { summary: 'UiLevel' }, defaultValue: { summary: '"high"' } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'small'],
      description: 'Taille du bouton.',
      table: { type: { summary: 'ButtonSize' }, defaultValue: { summary: '"default"' } },
    },
    icon: {
      control: { type: 'text' },
      description: "Nom FontAwesome de l'icône (ex : check, arrow-right).",
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    iconPos: {
      control: { type: 'inline-radio' },
      options: ['left', 'right', 'top', 'bottom'],
      description: "Position de l'icône par rapport au contenu.",
      table: { type: { summary: 'ButtonIconPos' }, defaultValue: { summary: '"left"' } },
    },
    iconOnly: {
      control: { type: 'boolean' },
      description: 'Force le style icon-only (carré) même en présence de contenu.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    loading: {
      control: { type: 'boolean' },
      description: 'État de chargement : affiche un spinner et désactive le bouton.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    loadingIcon: {
      control: { type: 'text' },
      description: 'Icône FontAwesome du spinner de chargement (animée via fa-spin).',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"circle-notch"' } },
    },
    expanded: {
      control: { type: 'boolean' },
      description: 'Pleine largeur (100%).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Désactive le bouton (attribut natif).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    tabindex: {
      control: { type: 'number' },
      description: 'tabindex natif du bouton.',
      table: { type: { summary: 'number' }, defaultValue: { summary: 'undefined' } },
    },
    buttonProps: {
      control: false,
      description: 'Attributs natifs additionnels forwardés sur le <button>Button</button> (ex : { form: "login", value: "1" }).',
      table: { type: { summary: 'ButtonNativeProps' }, defaultValue: { summary: 'undefined' } },
    },
    iconTemplate: {
      control: false,
      description: "Template custom pour l'icône (remplace `icon`).",
      table: { type: { summary: 'TemplateRef<unknown>' }, defaultValue: { summary: 'undefined' } },
    },
    loadingIconTemplate: {
      control: false,
      description: "Template custom pour l'icône de chargement (remplace `loadingIcon`).",
      table: { type: { summary: 'TemplateRef<unknown>' }, defaultValue: { summary: 'undefined' } },
    },
    buttonClick: {
      action: 'clicked',
      description: 'Émis au clic (jamais si disabled ou loading).',
      table: { type: { summary: 'EventEmitter<MouseEvent>' }, defaultValue: { summary: '—' } },
    },
    buttonFocus: {
      action: 'focused',
      description: 'Émis quand le bouton reçoit le focus.',
      table: { type: { summary: 'EventEmitter<FocusEvent>' }, defaultValue: { summary: '—' } },
    },
    buttonBlur: {
      action: 'blurred',
      description: 'Émis quand le bouton perd le focus.',
      table: { type: { summary: 'EventEmitter<FocusEvent>' }, defaultValue: { summary: '—' } },
    },
  },
};

export default meta;
type Story = StoryObj<UiButton>;

// Niveaux sémantiques
export const High: Story = { args: { label: 'High', level: 'high' } };
export const Low: Story = { args: { label: 'Low', level: 'low' } };
export const Success: Story = { args: { label: 'Success', level: 'success' } };
export const Warning: Story = { args: { label: 'Warning', level: 'warning' } };
export const Error: Story = { args: { label: 'Error', level: 'error' } };

// Tailles
export const Small: Story = { args: { label: 'Small', level: 'high', size: 'small' } };

// Icônes
export const IconLeft: Story = { args: { label: 'Valider', level: 'success', icon: 'check', iconPos: 'left' } };
export const IconRight: Story = { args: { label: 'Suivant', level: 'high', icon: 'arrow-right', iconPos: 'right' } };
export const IconTop: Story = { args: { label: 'Ajouter', level: 'high', icon: 'plus', iconPos: 'top' } };
export const IconBottom: Story = { args: { label: 'Télécharger', level: 'low', icon: 'download', iconPos: 'bottom' } };
export const IconOnly: Story = { args: { level: 'high', icon: 'plus', ariaLabel: 'Ajouter' } };
export const IconOnlyForced: Story = {
  args: { label: 'Ignoré', level: 'low', icon: 'gear', iconOnly: true, ariaLabel: 'Paramètres' },
};

// Chargement
export const Loading: Story = { args: { label: 'Enregistrement…', level: 'high', loading: true } };
export const LoadingCustomIcon: Story = {
  args: { label: 'Envoi…', level: 'success', loading: true, loadingIcon: 'spinner' },
};

// Layout
export const Expanded: Story = {
  args: { label: 'Pleine largeur', level: 'high', expanded: true },
  parameters: { layout: 'padded' },
};

// États
export const Disabled: Story = { args: { label: 'Disabled', level: 'high', disabled: true } };

// Contenu projeté (<ng-content>)
export const ProjectedContent: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ui-button [level]="level" [icon]="icon" [iconPos]="iconPos">
        Contenu <strong>projeté</strong>
      </ui-button>
    `,
  }),
  args: { level: 'high', icon: 'star', iconPos: 'left' },
};
