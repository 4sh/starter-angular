import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiBadge } from '@app/shared/components/ui/informative/ui-badge/ui-badge';

const meta: Meta<UiBadge> = {
  title: 'Components/ui/informative/ui-badge',
  component: UiBadge,
  decorators: [moduleMetadata({ imports: [UiBadge] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=139-6769&t=0SWBsuymjEi87t6k-1',
    },
  },
  argTypes: {
    value: {
      control: { type: 'text' },
      description: 'Contenu textuel (compteur ou court label). Absent + sans icône = point.',
      table: { type: { summary: 'string | number' }, defaultValue: { summary: 'undefined' } },
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
      description: 'Intensité : high (soutenu) ou low (discret).',
      table: { type: { summary: 'UiSubLevel' }, defaultValue: { summary: '"high"' } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'small', 'large'],
      description: 'Taille.',
      table: { type: { summary: 'BadgeSize' }, defaultValue: { summary: '"default"' } },
    },
    icon: {
      control: { type: 'text' },
      description: "Nom FontAwesome de l'icône (optionnel, précède le texte).",
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    ariaLabel: {
      control: { type: 'text' },
      description: 'Nom accessible (recommandé si icon-only ou compteur ambigu).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
  },
  args: {
    value: '1',
    level: 'default',
    subLevel: 'high',
    size: 'default',
  },
};

export default meta;
type Story = StoryObj<UiBadge>;

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
export const Large: Story = { args: { level: 'success', size: 'large' } };

// Pastille pilule (contenu multi-caractères → expansion)
export const LongValue: Story = { args: { level: 'error', value: '99+' } };

// Avec icône
export const WithIcon: Story = { args: { level: 'success', value: 'OK', icon: 'circle-check' } };

// Icône seule (nom accessible requis)
export const IconOnly: Story = { args: { level: 'warning', icon: 'circle-exclamation', ariaLabel: 'Attention' } };

// Point (ni texte ni icône) — indicateur de notification
export const Dot: Story = { args: { level: 'error', value: undefined } };
