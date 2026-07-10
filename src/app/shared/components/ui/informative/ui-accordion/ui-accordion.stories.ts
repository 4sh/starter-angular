import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import {
  UiAccordion,
  UiAccordionContent,
  UiAccordionHeader,
  UiAccordionPanel,
} from './ui-accordion';
import { UiTag } from '@app/shared/components/ui/informative/ui-tag/ui-tag';

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
      description: 'Autorise plusieurs panneaux ouverts simultanément (la valeur devient un tableau).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    selectOnFocus: {
      control: { type: 'boolean' },
      description: 'Ouvre un panneau dès que son en-tête reçoit le focus.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    separator: {
      control: { type: 'boolean' },
      description: 'Défaut de groupe : affiche le trait sous chaque en-tête (surchargeable par panneau).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    control: {
      control: { type: 'boolean' },
      description: 'Défaut de groupe : affiche le chevron sur chaque en-tête (surchargeable par panneau).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    motion: {
      control: { type: 'boolean' },
      description: "Anime l'ouverture/fermeture (le préférence reduced-motion est toujours respectée).",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    expandIcon: {
      control: { type: 'text' },
      description: 'Icône (FontAwesome) affichée sur un panneau replié.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"chevron-down"' } },
    },
    collapseIcon: {
      control: { type: 'text' },
      description: 'Icône (FontAwesome) affichée sur un panneau déplié.',
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
  'Viennese et half to cortado viennese. Americano steamed caffeine filter luwak skinny half and id spoon. Redeye extraction variety shot instant qui cream roast lungo body shot mazagran.';

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
        <ui-accordion-panel value="0" header="Actif">${LOREM}</ui-accordion-panel>
        <ui-accordion-panel value="1" header="Désactivé" [disabled]="true">${LOREM}</ui-accordion-panel>
        <ui-accordion-panel value="2" header="Actif">${LOREM}</ui-accordion-panel>
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
            Facturation <ui-tag label="À jour" level="success" size="small" />
          </span>
          ${LOREM}
        </ui-accordion-panel>
        <ui-accordion-panel value="1">
          <span uiAccordionHeader style="display:inline-flex; align-items:center; gap:8px">
            Sécurité <ui-tag label="Action requise" level="warning" size="small" />
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
