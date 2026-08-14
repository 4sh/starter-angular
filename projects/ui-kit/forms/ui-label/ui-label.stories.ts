import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiLabel } from '@4sh/ui-kit/forms/ui-label';

const meta: Meta<UiLabel> = {
  title: 'Components/ui/forms/ui-label',
  component: UiLabel,
  decorators: [moduleMetadata({ imports: [UiLabel] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=113-2128',
    },
  },
  argTypes: {
    label: {
      control: { type: 'text' },
      description: 'Label text (or content projected via <ng-content>).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    required: {
      control: { type: 'boolean' },
      description: 'Shows the required marker (*).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'small'],
      description: 'Text size.',
      table: { type: { summary: 'LabelSize' }, defaultValue: { summary: '"default"' } },
    },
    for: {
      control: { type: 'text' },
      description: 'for attribute — id of the labeled form element.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Disabled style (cascaded by the parent form component).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
  },
};

export default meta;
type Story = StoryObj<UiLabel>;

export const Default: Story = { args: { label: 'Label' } };
export const Required: Story = { args: { label: 'Label', required: true } };
export const Small: Story = { args: { label: 'Label', size: 'small' } };
export const Disabled: Story = { args: { label: 'Label', disabled: true } };
