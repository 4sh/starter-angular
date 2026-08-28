import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiRippleDemo } from './ui-ripple.demo';

const meta: Meta<UiRippleDemo> = {
  title: 'Foundations/Ripple',
  component: UiRippleDemo,
  decorators: [moduleMetadata({ imports: [UiRippleDemo] })],
  parameters: {
    layout: 'padded',
    // Ces stories portent leur propre activation (`[uiRippleScope]`, `[uiRipple]`) :
    // elles ignorent l'interrupteur de la barre d'outils, qui poserait sinon
    // `data-ripple="off"` sur <html> et les muselerait.
    ripple: 'always',
  },
  argTypes: {
    custom: {
      control: { type: 'boolean' },
      description:
        "Retaille l'onde par les seuls hooks CSS (`--ui-ripple-color`, `--ui-ripple-opacity`, `--ui-ripple-duration`, `--ui-ripple-scale`).",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    centered: {
      control: { type: 'boolean' },
      description: "Démarre l'onde au centre plutôt qu'au point de contact (`rippleCentered`).",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Coupe l\'effet (`[uiRipple]="false"` / `[uiRippleScope]="false"`).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
  },
  args: { custom: false, centered: false, disabled: false },
};

export default meta;
type Story = StoryObj<UiRippleDemo>;

// Réglage par défaut : onde `currentColor`, au point de contact.
export const Default: Story = {};

// Même effet, retaillé par les hooks CSS uniquement (aucune API TypeScript).
export const Custom: Story = { args: { custom: true } };
