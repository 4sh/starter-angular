import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import {
  UiAccordion,
  UiAccordionContent,
  UiAccordionHeader,
  UiAccordionPanel,
} from '@4sh/ui-kit/informative/ui-accordion';
import { UiTag } from '@4sh/ui-kit/informative/ui-tag';

const meta: Meta<UiAccordion> = {
  title: 'Components/ui/informative/ui-accordion',
  component: UiAccordion,
  decorators: [
    moduleMetadata({
      imports: [UiAccordion, UiAccordionPanel, UiAccordionHeader, UiAccordionContent, UiTag],
    }),
  ],
  parameters: {
    layout: 'padded',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=2037-3151&t=XliPzQUJIaNqd8YD-1',
    },
  },
  argTypes: {
    multiple: {
      control: { type: 'boolean' },
      description: 'Allows several panels open at once (the value becomes an array).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    selectOnFocus: {
      control: { type: 'boolean' },
      description: 'Opens a panel as soon as its header receives focus.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    separator: {
      control: { type: 'boolean' },
      description: 'Group default: shows the rule under each header (overridable per panel).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    control: {
      control: { type: 'boolean' },
      description: 'Group default: shows the chevron on each header (overridable per panel).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    motion: {
      control: { type: 'boolean' },
      description: "Animates the open/close (the reduced-motion preference is always respected).",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    expandIcon: {
      control: { type: 'text' },
      description: 'FontAwesome icon shown on a collapsed panel.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"chevron-down"' } },
    },
    collapseIcon: {
      control: { type: 'text' },
      description: 'FontAwesome icon shown on an expanded panel.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"chevron-up"' } },
    },
  },
  args: {
    multiple: false,
    selectOnFocus: false,
    separator: true,
    control: true,
    motion: true,
    expandIcon: 'chevron-down',
    collapseIcon: 'chevron-up',
  },
};

export default meta;
type Story = StoryObj<UiAccordion>;

const LOREM =
  'Viennese and half to cortado viennese. Americano steamed caffeine filter luwak skinny half and id spoon. Redeye extraction variety shot instant qui cream roast lungo body shot mazagran.';

// Fixed-width shell so the accordion reads like the Figma frame.
const box = (inner: string) => `<div style="max-width: 640px">${inner}</div>`;

// Three plain panels sharing the group args.
const panels = `
  <ui-accordion-panel value="0" header="Section I">${LOREM}</ui-accordion-panel>
  <ui-accordion-panel value="1" header="Section II">${LOREM}</ui-accordion-panel>
  <ui-accordion-panel value="2" header="Section III">${LOREM}</ui-accordion-panel>`;

export const Default: Story = {
  render: (args) => ({
    props: args,
    template: box(`
      <ui-accordion
        [value]="'0'"
        [multiple]="multiple" [separator]="separator" [control]="control"
        [selectOnFocus]="selectOnFocus" [motion]="motion"
        [expandIcon]="expandIcon" [collapseIcon]="collapseIcon"
      >${panels}</ui-accordion>`),
  }),
};

export const Multiple: Story = {
  args: { multiple: true },
  render: (args) => ({
    props: args,
    template: box(`
      <ui-accordion
        [value]="['0','2']"
        [multiple]="multiple" [separator]="separator" [control]="control" [motion]="motion"
      >${panels}</ui-accordion>`),
  }),
};

export const SelectOnFocus: Story = {
  args: { selectOnFocus: true },
  render: (args) => ({
    props: args,
    template: box(`
      <ui-accordion [value]="'0'" [selectOnFocus]="selectOnFocus" [motion]="motion">${panels}</ui-accordion>`),
  }),
};

// Un panneau désactivé (non repliable, ignoré au clavier).
export const DisabledPanel: Story = {
  render: (args) => ({
    props: args,
    template: box(`
      <ui-accordion [value]="'0'" [multiple]="multiple" [motion]="motion">
        <ui-accordion-panel value="0" header="Active">${LOREM}</ui-accordion-panel>
        <ui-accordion-panel value="1" header="Disabled" [disabled]="true">${LOREM}</ui-accordion-panel>
        <ui-accordion-panel value="2" header="Active">${LOREM}</ui-accordion-panel>
      </ui-accordion>`),
  }),
};

// En-tête riche via le slot `uiAccordionHeader` (titre + tag de statut).
export const RichHeader: Story = {
  render: (args) => ({
    props: args,
    template: box(`
      <ui-accordion [value]="'0'" [multiple]="multiple" [motion]="motion">
        <ui-accordion-panel value="0">
          <span uiAccordionHeader style="display:inline-flex; align-items:center; gap:8px">
            Facturation <ui-tag label="Up to date" level="success" size="small" />
          </span>
          ${LOREM}
        </ui-accordion-panel>
        <ui-accordion-panel value="1">
          <span uiAccordionHeader style="display:inline-flex; align-items:center; gap:8px">
            Security <ui-tag label="Action required" level="warning" size="small" />
          </span>
          ${LOREM}
        </ui-accordion-panel>
      </ui-accordion>`),
  }),
};

// Sans trait ni chevron (surface épurée).
export const Minimal: Story = {
  args: { separator: false, control: false },
  render: (args) => ({
    props: args,
    template: box(`
      <ui-accordion [value]="'0'" [separator]="separator" [control]="control" [motion]="motion">${panels}</ui-accordion>`),
  }),
};

// Animation désactivée (bascule instantanée).
export const MotionOff: Story = {
  args: { motion: false },
  render: (args) => ({
    props: args,
    template: box(`<ui-accordion [value]="'0'" [motion]="motion">${panels}</ui-accordion>`),
  }),
};
