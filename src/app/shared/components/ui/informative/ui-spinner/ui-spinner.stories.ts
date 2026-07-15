import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiSpinner } from '@app/shared/components/ui/informative/ui-spinner/ui-spinner';

const meta: Meta<UiSpinner> = {
  title: 'Components/ui/informative/ui-spinner',
  component: UiSpinner,
  decorators: [moduleMetadata({ imports: [UiSpinner] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=2171-3339&t=inUHXSiILDu9zvad-1',
    },
  },
  argTypes: {
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'small'],
      description: 'Taille du marqueur (surchargeable finement via `--ui-spinner-size`).',
      table: { type: { summary: 'UiSpinnerSize' }, defaultValue: { summary: '"default"' } },
    },
    orientation: {
      control: { type: 'inline-radio' },
      options: ['vertical', 'horizontal'],
      description: 'Disposition du marqueur par rapport au libellé (pertinent avec `label`).',
      table: { type: { summary: 'UiSpinnerOrientation' }, defaultValue: { summary: '"vertical"' } },
    },
    label: {
      control: { type: 'text' },
      description: 'Texte de chargement visible, lu dans la région live.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    ariaLabel: {
      control: { type: 'text' },
      description: 'Nom accessible. Repli sur `label` visible, puis sur « Chargement ».',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    icon: {
      control: { type: 'text' },
      description: 'Nom FontAwesome utilisé comme marqueur (mis en rotation par le composant).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    image: {
      control: { type: 'text' },
      description: "URL d'image utilisée comme marqueur (affichée telle quelle, motion propre).",
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    imageAlt: {
      control: { type: 'text' },
      description: "Texte alternatif de l'image (vide = décorative).",
      table: { type: { summary: 'string' }, defaultValue: { summary: '""' } },
    },
    strokeWidth: {
      control: { type: 'number' },
      description: "Épaisseur du trait du cercle par défaut (échelle du viewBox 0–50).",
      table: { type: { summary: 'string | number' }, defaultValue: { summary: '4' } },
    },
    fill: {
      control: { type: 'text' },
      description: 'Remplissage du cercle par défaut (`none` = anneau seul).',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"none"' } },
    },
    animationDuration: {
      control: { type: 'text' },
      description: "Durée d'une rotation (temps CSS), partagée avec le marqueur icône.",
      table: { type: { summary: 'string' }, defaultValue: { summary: '"1.2s"' } },
    },
    delay: {
      control: { type: 'number' },
      description: "Délai de grâce (ms) avant l'apparition — évite le flash sur les attentes très courtes.",
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' } },
    },
  },
  args: {
    size: 'default',
    orientation: 'vertical',
  },
};

export default meta;
type Story = StoryObj<UiSpinner>;

// Marqueur SVG par défaut (indéterminé).
export const Default: Story = {};

// Avec libellé visible.
export const WithLabel: Story = { args: { label: 'Chargement' } };

// Libellé à côté du marqueur.
export const Horizontal: Story = { args: { label: 'Chargement', orientation: 'horizontal' } };

// Taille compacte.
export const Small: Story = { args: { size: 'small', label: 'Chargement' } };

// Trait plus fin + rotation plus lente.
export const Tuned: Story = { args: { strokeWidth: 2, animationDuration: '2s' } };

// Marqueur remplacé par une icône FontAwesome (mise en rotation).
export const IconMark: Story = { args: { icon: 'spinner', label: 'Chargement' } };

// Marqueur libre via template custom (ici trois points animés).
export const CustomTemplate: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ui-spinner [label]="label" [spinnerTemplate]="dots">
        <ng-template #dots>
          <span style="display:inline-flex;gap:6px">
            <span class="dot" style="width:8px;height:8px;border-radius:50%;background:currentColor;animation:sb-bounce 1.2s infinite ease-in-out"></span>
            <span class="dot" style="width:8px;height:8px;border-radius:50%;background:currentColor;animation:sb-bounce 1.2s infinite ease-in-out .2s"></span>
            <span class="dot" style="width:8px;height:8px;border-radius:50%;background:currentColor;animation:sb-bounce 1.2s infinite ease-in-out .4s"></span>
          </span>
        </ng-template>
      </ui-spinner>
      <style>
        @keyframes sb-bounce { 0%,80%,100%{transform:scale(.4);opacity:.4} 40%{transform:scale(1);opacity:1} }
      </style>
    `,
  }),
  args: { label: 'Chargement' },
};

// Sur fond sombre (le marqueur adopte la couleur de contenu du thème).
export const OnDark: Story = {
  args: { label: 'Chargement' },
  parameters: { backgrounds: { default: 'dark' } },
};
