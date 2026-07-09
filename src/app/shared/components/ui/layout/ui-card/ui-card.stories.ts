import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import {
  UiCard,
  UiCardFooter,
  UiCardMedia,
  UiCardSubtitle,
  UiCardTitle,
} from '@app/shared/components/ui/layout/ui-card/ui-card';
import { UiButton } from '@app/shared/components/ui/actions/ui-button/ui-button';
import { UiTag } from '@app/shared/components/ui/informative/ui-tag/ui-tag';

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
      description: 'Titre (raccourci du slot `uiCardTitle`).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    subheader: {
      control: { type: 'text' },
      description: 'Sous-titre (raccourci du slot `uiCardSubtitle`).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    variant: {
      control: { type: 'inline-radio' },
      options: ['outlined', 'elevated', 'flat'],
      description: 'Traitement de la surface : bordure, ombre, ou aucun.',
      table: { type: { summary: 'CardVariant' }, defaultValue: { summary: '"outlined"' } },
    },
    contentFlush: {
      control: { type: 'boolean' },
      description:
        'Retire la gouttière horizontale du contenu (pleine largeur) : le consommateur gère la mise en page interne. Regouttiérer avec `padding-inline: var(--ui-card-padding)`.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    ariaLabel: {
      control: { type: 'text' },
      description: 'Nom accessible (transforme la carte en région `role="region"`).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    ariaLabelledBy: {
      control: { type: 'text' },
      description: 'Id de l’élément qui nomme la carte (région).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
  },
};

export default meta;
type Story = StoryObj<UiCard>;

// Carte simple : titre + sous-titre + contenu (via inputs string).
export const Default: Story = {
  args: { header: 'Card Title', subheader: 'Un sous-titre descriptif' },
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
        <span uiCardSubtitle>Sous-titre de la carte</span>
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
  args: { header: 'Média en tête' },
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
          <ui-button label="Annuler" level="low" size="small" />
          <ui-button label="Valider" level="high" size="small" />
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
  args: { header: 'Elevated', subheader: 'Ombre portée', variant: 'elevated' },
};
export const Flat: Story = {
  ...Default,
  args: { header: 'Flat', subheader: 'Sans bordure ni ombre', variant: 'flat' },
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
  args: { header: 'Contenu full-bleed', variant: 'outlined' },
};
