import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiAvatar } from '@app/shared/components/ui/informative/ui-avatar/ui-avatar';
import { UiBadge } from '@app/shared/components/ui/informative/ui-badge/ui-badge';

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
      url: 'https://www.figma.com/design/XgSemnGLFrAq75CxcjPVf1/-Projet----UI-Kit',
    },
  },
  argTypes: {
    image: {
      control: { type: 'text' },
      description: 'Source de l’image (mode Image, priorité la plus haute).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    alt: {
      control: { type: 'text' },
      description: 'Texte alternatif de l’image (nom accessible en mode Image).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    label: {
      control: { type: 'text' },
      description: 'Initiales / court texte (mode Label, si pas d’image).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    icon: {
      control: { type: 'text' },
      description: 'Nom FontAwesome (mode Icon, fallback par défaut).',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"user"' } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['small', 'default', 'large'],
      description: 'Taille (42 / 56 / 64 px).',
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
      description: 'Nom accessible explicite (recommandé en mode Image et Icon).',
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
export const Icon: Story = { args: { icon: 'user', ariaLabel: 'Utilisateur' } };
export const Label: Story = { args: { label: 'UI' } };
export const Image: Story = {
  args: { image: SAMPLE_IMAGE, alt: 'Photo de profil' },
};

// Tailles
export const Small: Story = { args: { label: 'UI', size: 'small' } };
export const Large: Story = { args: { label: 'UI', size: 'large' } };

// Forme
export const Square: Story = { args: { image: SAMPLE_IMAGE, alt: 'Photo de profil', shape: 'square' } };

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
  args: { image: SAMPLE_IMAGE, alt: 'Photo de profil' },
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
  args: { label: 'UI', ariaLabel: 'Utilisateur — en ligne' },
};

// Fallback : image cassée → repli sur les initiales
export const BrokenImageFallback: Story = {
  args: { image: 'https://example.invalid/missing.png', label: 'UI', ariaLabel: 'Utilisateur' },
};
