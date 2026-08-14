import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import {UiHelper} from "@4sh/ui-kit/informative/ui-helper";

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
      description: "Displayed helper message.",
      table: { type: { summary: 'string' }, defaultValue: { summary: '—' } },
    },
    level: {
      control: { type: 'select' },
      options: ['default', 'highlight', 'success', 'warning', 'error'],
      description: 'Feedback level: drives the default color and icon.',
      table: { type: { summary: 'UiFeedbackLevel' }, defaultValue: { summary: '"default"' } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'small'],
      description: 'Size of the text and icon.',
      table: { type: { summary: 'HelperSize' }, defaultValue: { summary: '"default"' } },
    },
    showIcon: {
      control: { type: 'boolean' },
      description: 'Shows the level icon.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    icon: {
      control: { type: 'text' },
      description: 'Overrides the FontAwesome icon name inferred from level.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    ariaLive: {
      control: { type: 'inline-radio' },
      options: ['off', 'polite', 'assertive'],
      description: 'Live region to announce dynamic feedback to screen readers.',
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
export const Success: Story = { args: { level: 'success', message: 'Valid field.' } };
export const Warning: Story = { args: { level: 'warning', message: 'Check this information.' } };
export const Error: Story = { args: { level: 'error', message: 'This field is required.' } };

// Taille
export const Small: Story = { args: { level: 'error', size: 'small', message: 'This field is required.' } };

// Sans icône
export const NoIcon: Story = { args: { level: 'highlight', showIcon: false } };

// Icône personnalisée
export const CustomIcon: Story = { args: { level: 'highlight', icon: 'lightbulb', message: 'Tip: use a strong password.' } };

// Feedback dynamique (annoncé aux lecteurs d'écran)
export const LiveError: Story = {
  args: { level: 'error', ariaLive: 'assertive', message: 'Invalid email address.' },
};
