import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiTag } from '@4sh/ui-kit/informative/ui-tag';

const meta: Meta<UiTag> = {
  title: 'Components/ui/informative/ui-tag',
  component: UiTag,
  decorators: [moduleMetadata({ imports: [UiTag] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=125-1740&t=eYboBh39bz05TnEg-1',
    },
  },
  argTypes: {
    label: {
      control: { type: 'text' },
      description: 'Tag text.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    level: {
      control: { type: 'select' },
      options: ['default', 'highlight', 'success', 'warning', 'error'],
      description: 'Niveau de feedback (famille de couleur).',
      table: { type: { summary: 'UiFeedbackLevel' }, defaultValue: { summary: '"default"' } },
    },
    subLevel: {
      control: { type: 'inline-radio' },
      options: ['high', 'low'],
      description: 'Intensity: high (strong) or low (subtle).',
      table: { type: { summary: 'UiSubLevel' }, defaultValue: { summary: '"high"' } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'small'],
      description: 'Taille.',
      table: { type: { summary: 'TagSize' }, defaultValue: { summary: '"default"' } },
    },
    iconLeft: {
      control: { type: 'text' },
      description: "FontAwesome name of the left icon (optional).",
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    iconRight: {
      control: { type: 'text' },
      description: "FontAwesome name of the right icon (optional).",
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    rounded: {
      control: { type: 'boolean' },
      description: 'Pill shape (default); rounded rectangle if false.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    ariaLabel: {
      control: { type: 'text' },
      description: 'Accessible name (recommended if the tag has no text).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
  },
  args: {
    label: 'Label',
    level: 'default',
    subLevel: 'high',
    size: 'default',
    rounded: true,
  },
};

export default meta;
type Story = StoryObj<UiTag>;

// Niveaux (sub-level high)
export const Default: Story = { args: { level: 'default' } };
export const Highlight: Story = { args: { level: 'highlight' } };
export const Success: Story = { args: { level: 'success' } };
export const Warning: Story = { args: { level: 'warning' } };
export const Error: Story = { args: { level: 'error' } };

// Sub-level low (discret)
export const SubLevelLow: Story = { args: { level: 'highlight', subLevel: 'low' } };

// Tailles
export const Small: Story = { args: { level: 'success', size: 'small' } };

// Icônes
export const WithIconLeft: Story = { args: { level: 'success', iconLeft: 'circle-check' } };
export const WithIconRight: Story = { args: { level: 'error', iconRight: 'times-circle' } };
export const WithBothIcons: Story = {
  args: { level: 'highlight', iconLeft: 'circle-user', iconRight: 'times-circle' },
};
export const IconOnly: Story = { args: { level: 'warning', label: undefined, iconLeft: 'star', ariaLabel: 'Favorite' } };

// Forme
export const Square: Story = { args: { level: 'highlight', rounded: false } };
