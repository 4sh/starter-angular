import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiMotionDemo } from './ui-motion.demo';
import { UI_MOTION_PRESETS } from './ui-motion';

const meta: Meta<UiMotionDemo> = {
  title: 'Foundations/Motion',
  component: UiMotionDemo,
  decorators: [moduleMetadata({ imports: [UiMotionDemo] })],
  parameters: { layout: 'padded' },
  argTypes: {
    preset: {
      control: { type: 'select' },
      options: UI_MOTION_PRESETS,
      description: "Préréglage d'entrée/sortie (classes `ui-motion-<preset>-enter|leave`).",
      table: { type: { summary: 'UiMotionPreset' }, defaultValue: { summary: '"fade"' } },
    },
    duration: {
      control: { type: 'text' },
      description: 'Surcharge locale de la durée (ex. `400ms`). Vide = durée par défaut du token.',
      table: { type: { summary: 'string' } },
    },
    disabled: {
      control: { type: 'boolean' },
      description: "Désactive l'animation pour cet élément (apparition instantanée).",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
  },
  args: { preset: 'fade', duration: '', disabled: false },
};

export default meta;
type Story = StoryObj<UiMotionDemo>;

// Terrain de jeu : choisissez le préréglage, la durée, l'activation via les contrôles.
export const Playground: Story = {};

export const Fade: Story = { args: { preset: 'fade' } };
export const SlideDown: Story = { args: { preset: 'slide-down' } };
export const SlideUp: Story = { args: { preset: 'slide-up' } };
export const SlideLeft: Story = { args: { preset: 'slide-left' } };
export const SlideRight: Story = { args: { preset: 'slide-right' } };
export const Zoom: Story = { args: { preset: 'zoom' } };
export const Collapse: Story = { args: { preset: 'collapse' } };
