import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiAvatar } from '@4sh/ui-kit/informative/ui-avatar';
import { UiBadge } from '@4sh/ui-kit/informative/ui-badge';

// A small remote placeholder used by the image stories.
const SAMPLE_IMAGE = 'https://i.pravatar.cc/128?img=13';

const meta: Meta<UiAvatar> = {
  title: 'Components/ui/informative/ui-avatar',
  component: UiAvatar,
  decorators: [moduleMetadata({ imports: [UiAvatar, UiBadge] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=0-1&t=PXOwFotKvf72dn1c-1',
    },
  },
  argTypes: {
    image: {
      control: { type: 'text' },
      description: 'Image source (Image mode, highest priority).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    alt: {
      control: { type: 'text' },
      description: 'Alt text of the image (accessible name in Image mode).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    label: {
      control: { type: 'text' },
      description: 'Initials / short text (Label mode, if no image).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    icon: {
      control: { type: 'text' },
      description: 'FontAwesome name (Icon mode, default fallback).',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"user"' } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['tiny', 'small', 'default', 'large'],
      description: 'Taille.',
      table: { type: { summary: 'AvatarSize' }, defaultValue: { summary: '"default"' } },
    },
    shape: {
      control: { type: 'inline-radio' },
      options: ['circle', 'square'],
      description: 'Forme.',
      table: { type: { summary: 'AvatarShape' }, defaultValue: { summary: '"circle"' } },
    },
    ariaLabel: {
      control: { type: 'text' },
      description: 'Explicit accessible name (recommended in Image and Icon modes).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
  },
  args: {
    icon: 'user',
    size: 'default',
    shape: 'circle',
  },
};

export default meta;
type Story = StoryObj<UiAvatar>;

// Modes
export const Icon: Story = { args: { icon: 'user', ariaLabel: 'User' } };
export const Label: Story = { args: { label: 'UI' } };
export const Image: Story = {
  args: { image: SAMPLE_IMAGE, alt: 'Profile picture' },
};

// Tailles
export const Small: Story = { args: { label: 'UI', size: 'small' } };
export const Large: Story = { args: { label: 'UI', size: 'large' } };

// Forme
export const Square: Story = { args: { image: SAMPLE_IMAGE, alt: 'Profile picture', shape: 'square' } };

// Avec badge de statut (contenu projeté)
export const WithBadge: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ui-avatar [image]="image" [label]="label" [icon]="icon" [size]="size"
                 [shape]="shape" [alt]="alt" [ariaLabel]="ariaLabel">
        <ui-badge avatarBadge level="highlight" [value]="3" ariaLabel="3 notifications" />
      </ui-avatar>`,
  }),
  args: { image: SAMPLE_IMAGE, alt: 'Profile picture' },
};

// Point de présence (badge « dot » vert)
export const PresenceDot: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ui-avatar [label]="label" [size]="size" [ariaLabel]="ariaLabel">
        <ui-badge avatarBadge level="success" size="small" ariaLabel="En ligne" />
      </ui-avatar>`,
  }),
  args: { label: 'UI', ariaLabel: 'User — online' },
};

// Fallback : image cassée → repli sur les initiales
export const BrokenImageFallback: Story = {
  args: { image: './nope-missing.png', label: 'UI', ariaLabel: 'User' },
};
