import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import {UiHelper} from "@app/shared/components/ui/informative/ui-helper/ui-helper";

const meta: Meta<UiHelper> = {
  title: 'Components/ui/informative/ui-helper',
  component: UiHelper,
  decorators: [moduleMetadata({ imports: [UiHelper] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=139-4285&t=fJutKQL1M6F3La4r-1',
    },
  },
  argTypes: {
    message: {
      control: { type: 'text' },
      description: "Message d'aide affiché.",
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    level: {
      control: { type: 'select' },
      options: ['default', 'highlight', 'success', 'warning', 'error'],
      description: 'Niveau de feedback : pilote la couleur et l’icône par défaut.',
      table: { type: { summary: 'UiFeedbackLevel' }, defaultValue: { summary: '"default"' } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'small'],
      description: 'Taille du texte et de l’icône.',
      table: { type: { summary: 'HelperSize' }, defaultValue: { summary: '"default"' } },
    },
    showIcon: {
      control: { type: 'boolean' },
      description: 'Affiche l’icône de niveau.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    icon: {
      control: { type: 'text' },
      description: 'Surcharge le nom d’icône FontAwesome déduit du level.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    ariaLive: {
      control: { type: 'inline-radio' },
      options: ['off', 'polite', 'assertive'],
      description: 'Région live pour annoncer un feedback dynamique aux lecteurs d’écran.',
      table: { type: { summary: 'HelperAriaLive' }, defaultValue: { summary: '"off"' } },
    },
  },
  args: {
    message: 'This is a lorem text to help user.',
    level: 'default',
    size: 'default',
    showIcon: true,
  },
};

export default meta;
type Story = StoryObj<UiHelper>;

// Niveaux de feedback
export const Default: Story = { args: { level: 'default' } };
export const Highlight: Story = { args: { level: 'highlight' } };
export const Success: Story = { args: { level: 'success', message: 'Champ valide.' } };
export const Warning: Story = { args: { level: 'warning', message: 'Vérifiez cette information.' } };
export const Error: Story = { args: { level: 'error', message: 'Ce champ est obligatoire.' } };

// Taille
export const Small: Story = { args: { level: 'error', size: 'small', message: 'Ce champ est obligatoire.' } };

// Sans icône
export const NoIcon: Story = { args: { level: 'highlight', showIcon: false } };

// Icône personnalisée
export const CustomIcon: Story = { args: { level: 'highlight', icon: 'lightbulb', message: 'Astuce : utilisez un mot de passe fort.' } };

// Feedback dynamique (annoncé aux lecteurs d'écran)
export const LiveError: Story = {
  args: { level: 'error', ariaLive: 'assertive', message: 'Adresse e-mail invalide.' },
};
