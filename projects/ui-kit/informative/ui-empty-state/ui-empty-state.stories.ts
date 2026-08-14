import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiButton } from '@4sh/ui-kit/actions/ui-button';
import {
  UiEmptyState,
  UiEmptyStateActions,
  UiEmptyStateMedia,
} from '@4sh/ui-kit/informative/ui-empty-state';

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
      description: 'Main line: what\'s empty / why.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    description: {
      control: { type: 'text' },
      description: 'Supporting line (guidance, next step).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    icon: {
      control: { type: 'text' },
      description: "FontAwesome name of the visual (shorthand; ignored if a media slot is projected).",
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    iconType: {
      control: { type: 'inline-radio' },
      options: ['solid', 'outline'],
      description: "Icon variant, forwarded to ui-icon.",
      table: { type: { summary: 'UiIconType' }, defaultValue: { summary: '"solid"' } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'small'],
      description: 'Density.',
      table: { type: { summary: 'EmptyStateSize' }, defaultValue: { summary: '"default"' } },
    },
    showMedia: {
      control: { type: 'boolean' },
      description: 'Shows the visual area (true by default). false = text-only empty state.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    ariaLabel: {
      control: { type: 'text' },
      description: 'Accessible name of the region (adds role="region").',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
  },
  args: {
    title: 'No results',
    description: 'No item matches your search. Try widening your filters.',
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
          <ui-button label="Create an item" level="high" icon="plus" />
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
          <ui-button label="Retry" level="high" icon="rotate-right" />
          <ui-button label="Cancel" level="low" />
        </ng-container>
      </ui-empty-state>
    `,
  }),
  args: {
    title: 'Could not load the data',
    description: 'An error occurred. Check your connection then try again.',
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
        <svg uiEmptyStateMedia width="160" height="120" viewBox="0 0 160 120" role="img" aria-label="Empty box">
          <rect x="20" y="40" width="120" height="70" rx="8"
                fill="var(--global-background-muted)"
                stroke="var(--global-border-default)" stroke-width="2" />
          <path d="M20 48 L80 84 L140 48" fill="none"
                stroke="var(--global-border-default)" stroke-width="2" />
        </svg>
        <div uiEmptyStateActions>
          <ui-button label="New message" level="high" icon="pen" />
        </div>
      </ui-empty-state>
    `,
  }),
  args: {
    title: 'Empty inbox',
    description: 'You\'re all caught up. No new messages for now.',
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
  args: { ariaLabel: 'Search results' },
};
