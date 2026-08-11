import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiReadOnly } from '@app/shared/components/ui/informative/ui-read-only/ui-read-only';
import { UiBadge } from '@app/shared/components/ui/informative/ui-badge/ui-badge';
import { UiInput } from '@4sh/ui-kit/ui-input';

const meta: Meta<UiReadOnly> = {
  title: 'Components/ui/informative/ui-read-only',
  component: UiReadOnly,
  decorators: [moduleMetadata({ imports: [UiReadOnly, UiBadge, UiInput] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=3205-2882&t=QwmSe7YP798RcocA-1',
    },
  },
  argTypes: {
    label: {
      control: { type: 'text' },
      description: 'Libellé du champ (chaîne brute - l’i18n est à la charge de l’appelant).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    value: {
      control: { type: 'text' },
      description: 'Valeur affichée. Ignorée si du contenu est projeté via `<ng-content>`.',
      table: { type: { summary: 'string | number | null | undefined' }, defaultValue: { summary: 'undefined' } },
    },
    required: {
      control: { type: 'boolean' },
      description: 'Affiche le marqueur requis (*) sur le label (parité visuelle avec un champ requis).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    labelTemplate: {
      control: false,
      description: 'Markup de label entièrement personnalisé (`TemplateRef`), remplace le `ui-label` par défaut.',
      table: { type: { summary: 'TemplateRef' }, defaultValue: { summary: 'undefined' } },
    },
    fallback: {
      control: { type: 'text' },
      description: 'Texte (atténué) affiché quand la valeur est vide/nulle.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"-"' } },
    },
    emptyLabel: {
      control: { type: 'text' },
      description: 'Texte accessible annoncé à la place du symbole `fallback` quand la valeur est vide (ex. « Non renseigné »). Le `fallback` reste décoratif.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    layout: {
      control: { type: 'inline-radio' },
      options: ['vertical', 'horizontal', 'grid'],
      description: 'Disposition : label au-dessus (`vertical`), à côté (`horizontal`), ou pilotée par un système de grille (`grid` + `rowClass`/`labelClass`/`valueClass`).',
      table: { type: { summary: 'ReadOnlyLayout' }, defaultValue: { summary: '"vertical"' } },
    },
    matchField: {
      control: { type: 'boolean' },
      description: 'Adapte la mise en page pour cohabiter avec des champs : reprend l’écart label→valeur ET la hauteur d’un `ui-field` (valeur centrée, sans padding horizontal). Désactivé par défaut → un read-only autonome reste compact.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    rowClass: {
      control: { type: 'text' },
      description: 'Classes ajoutées sur la rangée (`<dl>`), ex. une classe de rangée de grille comme `flex-x`.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    labelClass: {
      control: { type: 'text' },
      description: 'Classes ajoutées sur la cellule de label (`<dt>`), ex. `cell phone-24 desktop-auto`.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    valueClass: {
      control: { type: 'text' },
      description: 'Classes ajoutées sur la cellule de valeur (`<dd>`), ex. `cell phone-24 desktop-auto`.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'small'],
      description: 'Taille du texte.',
      table: { type: { summary: 'ReadOnlySize' }, defaultValue: { summary: '"default"' } },
    },
    labelAlign: {
      control: { type: 'inline-radio' },
      options: ['left', 'right'],
      description: 'Alignement du libellé (disposition horizontale uniquement).',
      table: { type: { summary: 'ReadOnlyAlign' }, defaultValue: { summary: '"left"' } },
    },
    labelWidth: {
      control: { type: 'text' },
      description: 'Largeur de la colonne label en horizontal (longueur CSS, ex. `160px`). Vide = ajusté au contenu.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    multiline: {
      control: { type: 'boolean' },
      description: 'Préserve les retours à la ligne de la valeur (`white-space: pre-line`).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    inline: {
      control: { type: 'boolean' },
      description: 'Ajuste au contenu et s’insère dans le flux au lieu de remplir le conteneur.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
  },
  args: {
    label: 'Adresse e-mail',
    value: 'jean.dupont@4sh.fr',
    fallback: '-',
    layout: 'vertical',
    size: 'default',
    labelAlign: 'left',
    multiline: false,
    inline: false,
  },
};

export default meta;
type Story = StoryObj<UiReadOnly>;

// Disposition verticale (label au-dessus de la valeur)
export const Vertical: Story = {};

// Disposition horizontale (label à côté de la valeur)
export const Horizontal: Story = {
  args: { layout: 'horizontal' },
};

// Colonne de label fixe (alignement de plusieurs lignes)
export const HorizontalFixedLabel: Story = {
  name: 'Horizontal - colonne fixe',
  render: (args) => ({
    props: args,
    template: `
      <div style="display:flex; flex-direction:column; gap:12px; min-width:320px;">
        <ui-read-only layout="horizontal" labelWidth="140px" labelAlign="right" label="Nom" value="Jean Dupont" />
        <ui-read-only layout="horizontal" labelWidth="140px" labelAlign="right" label="E-mail" value="jean.dupont@4sh.fr" />
        <ui-read-only layout="horizontal" labelWidth="140px" labelAlign="right" label="Rôle" value="Design System Engineer" />
      </div>
    `,
  }),
};

// Valeur vide → repli atténué
export const Fallback: Story = {
  args: { label: 'Téléphone', value: null },
};

// Valeur vide annoncée aux lecteurs d'écran (« - » reste décoratif)
export const EmptyAccessible: Story = {
  name: 'Repli accessible',
  args: { label: 'Téléphone', value: null, emptyLabel: 'Non renseigné' },
};

// Contrôle total du layout via un système de grille (Gridaflex)
export const GridLayout: Story = {
  name: 'Grille (contrôle total)',
  render: (args) => ({
    props: args,
    template: `
      <div style="min-width:520px;">
        <ui-read-only
          layout="grid"
          rowClass="flex-x flex-gap-x"
          labelClass="cell phone-24 desktop-6"
          valueClass="cell phone-24 desktop-18"
          label="Libellé"
          value="Colonne label 6/24, valeur 18/24 sur desktop - pleine largeur sur mobile" />
      </div>
    `,
  }),
};

// Alignement avec un champ de formulaire voisin (matchField, opt-in)
export const NextToField: Story = {
  name: 'À côté d’un champ',
  render: (args) => ({
    props: args,
    template: `
      <div class="flex-x flex-gap-x" style="min-width:560px;">
        <div class="cell phone-24 desktop-12">
          <ui-read-only matchField label="Référence" value="REF-2026-0042" />
        </div>
        <div class="cell phone-24 desktop-12">
          <ui-input label="Commentaire" placeholder="Saisir…" />
        </div>
      </div>
    `,
  }),
};

// Taille réduite
export const Small: Story = {
  args: { size: 'small' },
};

// Valeur multiligne
export const Multiline: Story = {
  args: {
    label: 'Adresse',
    value: '12 rue de la Paix\n75002 Paris\nFrance',
    multiline: true,
  },
};

// Contenu projeté (valeur riche : badge, lien…)
export const ProjectedContent: Story = {
  name: 'Contenu projeté',
  render: (args) => ({
    props: args,
    template: `
      <ui-read-only label="Statut">
        <ui-badge level="success" value="Actif" icon="check" />
      </ui-read-only>
    `,
  }),
};

// Mode inline (s'insère dans le flux de texte)
export const Inline: Story = {
  render: (args) => ({
    props: args,
    template: `
      <p style="max-width:420px; line-height:1.6;">
        Dernière connexion&nbsp;:
        <ui-read-only inline layout="horizontal" label="le" value="24 juillet 2026" />
        depuis Paris.
      </p>
    `,
  }),
};

// Exemple composé : fiche récapitulative
export const Summary: Story = {
  name: 'Exemple - fiche récap',
  render: (args) => ({
    props: args,
    template: `
      <div style="display:flex; flex-direction:column; gap:16px; min-width:360px;">
        <ui-read-only label="Nom complet" value="Jean Dupont" />
        <ui-read-only label="E-mail" value="jean.dupont@4sh.fr" />
        <ui-read-only label="Téléphone" value="" />
        <ui-read-only label="Statut">
          <ui-badge level="success" value="Actif" icon="check" />
        </ui-read-only>
      </div>
    `,
  }),
};
