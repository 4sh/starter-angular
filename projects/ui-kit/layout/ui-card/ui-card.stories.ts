import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import {
  UiCard,
  UiCardFooter,
  UiCardMedia,
  UiCardSubtitle,
  UiCardTitle,
} from '@4sh/ui-kit/layout/ui-card';
import { UiButton } from '@4sh/ui-kit/actions/ui-button';
import { UiTag } from '@4sh/ui-kit/informative/ui-tag';

const cardImports = [UiCard, UiCardMedia, UiCardTitle, UiCardSubtitle, UiCardFooter];

// A self-contained, offline media block (no external asset dependency).
const MEDIA = `
  <div uiCardMedia
       style="height:180px;width:100%;background:linear-gradient(135deg,var(--primitives-primary-300),var(--primitives-primary-500));"></div>`;

const LOREM =
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Vestibulum id praesent platea posuere purus scelerisque.';

const meta: Meta<UiCard> = {
  title: 'Components/ui/layout/ui-card',
  component: UiCard,
  decorators: [moduleMetadata({ imports: [...cardImports, UiButton, UiTag] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=2033-36690&t=8l5IOhUpR9KL0Hg6-1',
    },
  },
  argTypes: {
    header: {
      control: { type: 'text' },
      description: 'Title (shorthand for the `uiCardTitle` slot).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    subheader: {
      control: { type: 'text' },
      description: 'Subtitle (shorthand for the `uiCardSubtitle` slot).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    variant: {
      control: { type: 'inline-radio' },
      options: ['outlined', 'elevated', 'flat'],
      description: 'Surface treatment: border, shadow, or none.',
      table: { type: { summary: 'CardVariant' }, defaultValue: { summary: '"outlined"' } },
    },
    contentFlush: {
      control: { type: 'boolean' },
      description:
        'Removes the content\'s horizontal gutter (full width): the consumer manages the internal layout. Re-add it with `padding-inline: var(--ui-card-padding)`.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    ariaLabel: {
      control: { type: 'text' },
      description: 'Accessible name (turns the card into a `role="region"`).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    ariaLabelledBy: {
      control: { type: 'text' },
      description: 'Id of the element that names the card (region).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
  },
};

export default meta;
type Story = StoryObj<UiCard>;

// Carte simple : titre + sous-titre + contenu (via inputs string).
export const Default: Story = {
  args: { header: 'Card Title', subheader: 'A descriptive subtitle' },
  render: (args) => ({
    props: { ...args, lorem: LOREM },
    template: `
      <ui-card [header]="header" [subheader]="subheader" [variant]="variant"
               style="width:340px">
        {{ lorem }}
      </ui-card>`,
  }),
};

// Contenu seul (sans en-tête).
export const ContentOnly: Story = {
  render: (args) => ({
    props: { ...args, lorem: LOREM },
    template: `
      <ui-card [variant]="variant" style="width:340px">{{ lorem }}</ui-card>`,
  }),
};

// Carte complète : média + en-tête + contenu + pied (tags à gauche, action à droite).
// Le pied s'appuie sur la grille Gridaflex : groupe `flex-x align-justify` en pleine
// largeur (tags ↔ bouton), gouttière entre tags via `flex-gap-x`.
export const Complete: Story = {
  render: (args) => ({
    props: { ...args, lorem: LOREM },
    template: `
      <ui-card [variant]="variant" style="width:340px">
        ${MEDIA}
        <span uiCardTitle>Card Title</span>
        <span uiCardSubtitle>Card subtitle</span>
        {{ lorem }}
        <div uiCardFooter class="flex-x align-justify" style="flex:1;align-items:center">
          <div class="flex-x flex-gap-x" style="--flex-gap-x: var(--units-sm)">
            <ui-tag label="Design" level="highlight" subLevel="low" iconLeft="tag" size="small" />
            <ui-tag label="UI" level="success" subLevel="low" size="small" />
          </div>
          <ui-button label="Action" size="small" />
        </div>
      </ui-card>`,
  }),
  args: { variant: 'outlined' },
};

// Média en pleine largeur (edge-to-edge, coins arrondis clippés).
export const WithMedia: Story = {
  render: (args) => ({
    props: { ...args, lorem: LOREM },
    template: `
      <ui-card [header]="header" [variant]="variant" style="width:340px">
        ${MEDIA}
        {{ lorem }}
      </ui-card>`,
  }),
  args: { header: 'Leading media' },
};

// Pied de carte : actions alignées à droite, gouttière gérée par la grille
// Gridaflex (`flex-x flex-gap-x`) plutôt que par le gap intrinsèque du pied.
export const WithFooter: Story = {
  render: (args) => ({
    props: { ...args, lorem: LOREM },
    template: `
      <ui-card [header]="header" [variant]="variant" style="width:340px">
        {{ lorem }}
        <div uiCardFooter class="flex-x flex-gap-x align-right" style="--flex-gap-x: var(--units-sm)">
          <ui-button label="Cancel" level="low" size="small" />
          <ui-button label="Submit" level="high" size="small" />
        </div>
      </ui-card>`,
  }),
  args: { header: 'Confirmation' },
};

// Variantes de surface.
export const Outlined: Story = {
  ...Default,
  args: { header: 'Outlined', subheader: 'Bordure', variant: 'outlined' },
};
export const Elevated: Story = {
  ...Default,
  args: { header: 'Elevated', subheader: 'Drop shadow', variant: 'elevated' },
};
export const Flat: Story = {
  ...Default,
  args: { header: 'Flat', subheader: 'No border, no shadow', variant: 'flat' },
};

// Slots riches : le titre accepte du contenu projeté (tag + texte). Le slot titre
// centre nativement ses adornments sur la ligne de texte (pas de style à ajouter).
export const RichTitle: Story = {
  render: (args) => ({
    props: { ...args, lorem: LOREM },
    template: `
      <ui-card [variant]="variant" style="width:340px">
        <span uiCardTitle>
          <ui-tag label="New" level="success" subLevel="low" size="small" />
          Titre enrichi
        </span>
        {{ lorem }}
      </ui-card>`,
  }),
  args: { variant: 'elevated' },
};

// Contenu « full » : le slot par défaut est mis en pleine largeur via `contentFlush`,
// le consommateur gère alors ses propres gouttières. Ici : une bande de couleur
// edge-to-edge suivie d'un paragraphe regouttiéré via `--ui-card-padding`.
export const ContentFlush: Story = {
  render: (args) => ({
    props: { ...args, lorem: LOREM },
    template: `
      <ui-card [header]="header" [variant]="variant" [contentFlush]="true" style="width:340px">
        <div class="flex-y" style="--flex-gap-y: var(--units-md)">
          <div style="height:120px;background:linear-gradient(135deg,var(--primitives-secondary-300),var(--primitives-secondary-500))"></div>
          <p style="margin:0;padding-inline:var(--ui-card-padding)">{{ lorem }}</p>
        </div>
      </ui-card>`,
  }),
  args: { header: 'Full-bleed content', variant: 'outlined' },
};
