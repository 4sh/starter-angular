import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiLabel } from '@app/shared/components/ui/forms/ui-label/ui-label';

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
      description: 'Texte du label (ou contenu projeté via <ng-content>).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    required: {
      control: { type: 'boolean' },
      description: 'Affiche le marqueur requis (*).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'small'],
      description: 'Taille du texte.',
      table: { type: { summary: 'LabelSize' }, defaultValue: { summary: '"default"' } },
    },
    for: {
      control: { type: 'text' },
      description: 'Attribut for — id de l’élément de formulaire labellisé.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Style désactivé (cascadé par le composant de formulaire parent).',
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
