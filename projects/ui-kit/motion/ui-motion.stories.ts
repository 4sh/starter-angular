import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiMotionDemo } from './ui-motion.demo';
import { UI_MOTION_PRESETS } from '@4sh/ui-kit/motion';

const meta: Meta<UiMotionDemo> = {
  title: 'Foundations/Motion',
  component: UiMotionDemo,
  decorators: [moduleMetadata({ imports: [UiMotionDemo] })],
  parameters: { layout: 'padded' },
  argTypes: {
    preset: {
      control: { type: 'select' },
      options: UI_MOTION_PRESETS,
      description: "Enter/exit preset (`ui-motion-<preset>-enter|leave` classes).",
      table: { type: { summary: 'UiMotionPreset' }, defaultValue: { summary: '"fade"' } },
    },
    duration: {
      control: { type: 'text' },
      description: 'Local duration override (e.g. `400ms`). Empty = the token\'s default duration.',
      table: { type: { summary: 'string' } },
    },
    disabled: {
      control: { type: 'boolean' },
      description: "Disables the animation for this element (instant appearance).",
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
