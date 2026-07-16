import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiButton } from '@app/shared/components/ui/actions/ui-button/ui-button';
import {
  UiEmptyState,
  UiEmptyStateActions,
  UiEmptyStateMedia,
} from '@app/shared/components/ui/informative/ui-empty-state/ui-empty-state';

const meta: Meta<UiEmptyState> = {
  title: 'Components/ui/informative/ui-empty-state',
  component: UiEmptyState,
  decorators: [
    moduleMetadata({ imports: [UiEmptyState, UiEmptyStateActions, UiEmptyStateMedia, UiButton] }),
  ],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=155-5961&t=inUHXSiILDu9zvad-1',
    },
  },
  argTypes: {
    title: {
      control: { type: 'text' },
      description: 'Ligne principale : ce qui est vide / pourquoi.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    description: {
      control: { type: 'text' },
      description: 'Ligne de soutien (guidance, prochaine étape).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    icon: {
      control: { type: 'text' },
      description: "Nom FontAwesome du visuel (raccourci ; ignoré si un slot média est projeté).",
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    iconType: {
      control: { type: 'inline-radio' },
      options: ['solid', 'outline'],
      description: "Variante de l'icône, transmise à ui-icon.",
      table: { type: { summary: 'UiIconType' }, defaultValue: { summary: '"solid"' } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'small'],
      description: 'Densité.',
      table: { type: { summary: 'EmptyStateSize' }, defaultValue: { summary: '"default"' } },
    },
    showMedia: {
      control: { type: 'boolean' },
      description: 'Affiche la zone visuelle (true par défaut). false = état vide texte seul.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    ariaLabel: {
      control: { type: 'text' },
      description: 'Nom accessible de la région (ajoute role="region").',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
  },
  args: {
    title: 'Aucun résultat',
    description: 'Aucun élément ne correspond à votre recherche. Essayez d’élargir vos filtres.',
    icon: 'folder-open',
    iconType: 'solid',
    size: 'default',
    showMedia: true,
  },
};

export default meta;
type Story = StoryObj<UiEmptyState>;

// Cas nominal : icône + titre + description + action.
export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ui-empty-state
        [title]="title"
        [description]="description"
        [icon]="icon"
        [iconType]="iconType"
        [size]="size"
        [showMedia]="showMedia"
        [ariaLabel]="ariaLabel"
      >
        <div uiEmptyStateActions>
          <ui-button label="Créer un élément" level="high" icon="plus" />
        </div>
      </ui-empty-state>
    `,
  }),
};

// Densité compacte.
export const Small: Story = {
  ...Default,
  args: { size: 'small' },
};

// Sans action (titre + description + visuel uniquement).
export const WithoutAction: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ui-empty-state
        [title]="title"
        [description]="description"
        [icon]="icon"
        [size]="size"
      />
    `,
  }),
  args: { icon: 'inbox' },
};

// Plusieurs actions (primaire + secondaire).
export const MultipleActions: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ui-empty-state
        [title]="title"
        [description]="description"
        [icon]="icon"
        [size]="size"
      >
        <ng-container uiEmptyStateActions>
          <ui-button label="Réessayer" level="high" icon="rotate-right" />
          <ui-button label="Annuler" level="low" />
        </ng-container>
      </ui-empty-state>
    `,
  }),
  args: {
    title: 'Impossible de charger les données',
    description: 'Une erreur est survenue. Vérifiez votre connexion puis réessayez.',
    icon: 'triangle-exclamation',
  },
};

// Illustration projetée (remplace le raccourci `icon`).
export const WithIllustration: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ui-empty-state
        [title]="title"
        [description]="description"
        [size]="size"
      >
        <svg uiEmptyStateMedia width="160" height="120" viewBox="0 0 160 120" role="img" aria-label="Boîte vide">
          <rect x="20" y="40" width="120" height="70" rx="8"
                fill="var(--global-low-surface-default)"
                stroke="var(--global-high-stroke-default)" stroke-width="2" />
          <path d="M20 48 L80 84 L140 48" fill="none"
                stroke="var(--global-high-stroke-default)" stroke-width="2" />
        </svg>
        <div uiEmptyStateActions>
          <ui-button label="Nouveau message" level="high" icon="pen" />
        </div>
      </ui-empty-state>
    `,
  }),
  args: {
    title: 'Boîte de réception vide',
    description: 'Vous êtes à jour. Aucun nouveau message pour le moment.',
  },
};

// Texte seul : la zone visuelle est masquée (showMedia = false).
export const TextOnly: Story = {
  ...Default,
  args: { showMedia: false },
};

// Région nommée (landmark) : role="region" + aria-label.
export const AsRegion: Story = {
  ...Default,
  args: { ariaLabel: 'Résultats de recherche' },
};
