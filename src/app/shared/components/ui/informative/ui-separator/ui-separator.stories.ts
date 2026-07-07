import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiSeparator } from '@app/shared/components/ui/informative/ui-separator/ui-separator';

const meta: Meta<UiSeparator> = {
  title: 'Components/ui/informative/ui-separator',
  component: UiSeparator,
  decorators: [moduleMetadata({ imports: [UiSeparator] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=159-4394&t=cL7IQLOTuzvr4pVP-1',
    },
  },
  argTypes: {
    label: {
      control: { type: 'text' },
      description: 'Texte optionnel : transforme la règle en séparateur avec libellé.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    orientation: {
      control: { type: 'inline-radio' },
      options: ['horizontal', 'vertical'],
      description: 'Orientation de la règle (Figma : Axe).',
      table: { type: { summary: 'SeparatorOrientation' }, defaultValue: { summary: '"horizontal"' } },
    },
    variant: {
      control: { type: 'inline-radio' },
      options: ['solid', 'dashed'],
      description: 'Style de trait (Figma : Type — Default → solid).',
      table: { type: { summary: 'SeparatorVariant' }, defaultValue: { summary: '"solid"' } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'small'],
      description: 'Épaisseur du trait (default 2px, small 1px).',
      table: { type: { summary: 'SeparatorSize' }, defaultValue: { summary: '"default"' } },
    },
    labelAlign: {
      control: { type: 'inline-radio' },
      options: ['start', 'center', 'end'],
      description: 'Position du libellé (Figma : Label Align — Default/Middle/End).',
      table: { type: { summary: 'SeparatorLabelAlign' }, defaultValue: { summary: '"start"' } },
    },
    ariaLabel: {
      control: { type: 'text' },
      description: 'Nom accessible explicite (défaut : le label).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
  },
  args: {
    orientation: 'horizontal',
    variant: 'solid',
    size: 'default',
    labelAlign: 'start',
  },
};

export default meta;
type Story = StoryObj<UiSeparator>;

// Wraps a horizontal separator in a fixed-width block so the rule is visible.
const hBox = (inner: string) => `<div style="width: 320px">${inner}</div>`;
// Wraps a vertical separator in a fixed-height flex row.
const vBox = (inner: string) =>
  `<div style="display:flex; align-items:stretch; height: 96px">${inner}</div>`;

export const Default: Story = {
  render: (args) => ({ props: args, template: hBox(`<ui-separator [variant]="variant" [size]="size" />`) }),
};

export const Dashed: Story = {
  render: (args) => ({ props: args, template: hBox(`<ui-separator variant="dashed" [size]="size" />`) }),
};

export const Small: Story = {
  render: (args) => ({ props: args, template: hBox(`<ui-separator [variant]="variant" size="small" />`) }),
};

// Libellé — start / center / end
export const LabelStart: Story = {
  render: (args) => ({ props: args, template: hBox(`<ui-separator label="Section" labelAlign="start" [variant]="variant" />`) }),
};

export const LabelCenter: Story = {
  render: (args) => ({ props: args, template: hBox(`<ui-separator label="OU" labelAlign="center" [variant]="variant" />`) }),
};

export const LabelEnd: Story = {
  render: (args) => ({ props: args, template: hBox(`<ui-separator label="Fin" labelAlign="end" [variant]="variant" />`) }),
};

// Vertical (entre deux éléments d'une rangée)
export const Vertical: Story = {
  render: (args) => ({
    props: args,
    template: vBox(`
      <span>Gauche</span>
      <ui-separator orientation="vertical" [variant]="variant" [size]="size" />
      <span>Droite</span>`),
  }),
};

export const VerticalDashed: Story = {
  render: (args) => ({
    props: args,
    template: vBox(`
      <span>Gauche</span>
      <ui-separator orientation="vertical" variant="dashed" [size]="size" />
      <span>Droite</span>`),
  }),
};
