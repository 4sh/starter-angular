import { applicationConfig, moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { UiRating } from './ui-rating';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';
import { provideUiIconFamilies } from '@app/shared/components/ui/ui-icon/ui-icon-families';
import { FormsModule } from '@angular/forms';

const meta: Meta<UiRating> = {
  title: 'Components/ui/forms/ui-rating',
  component: UiRating,
  decorators: [
    moduleMetadata({
      imports: [UiRating, UiIcon, FormsModule],
    }),
  ],
  parameters: {
    design: {
      type: 'figma',
      url: 'https://www.figma.com/file/XgSemnGLFrAq75CxcjPVf1?node-id=2026:36186',
    },
  },
  args: {
    stars: 5,
    cancel: true,
    disabled: false,
    readonly: false,
    required: false,
    invalid: false,
    autofocus: false,
    orientation: 'horizontal',
    size: 'default',
  },
  argTypes: {
    stars: {
      control: 'number',
      description: 'Nombre de valeurs possibles (étoiles).',
      table: { type: { summary: 'number' }, defaultValue: { summary: '5' } },
    },
    cancel: {
      control: 'boolean',
      description: 'Permet de désélectionner la note en cliquant sur la valeur actuelle.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Désactive le contrôle.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    readonly: {
      control: 'boolean',
      description: 'Rend le contrôle en lecture seule (navigable mais non modifiable).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    required: {
      control: 'boolean',
      description: 'Marque le champ comme requis.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    invalid: {
      control: 'boolean',
      description: 'Force l’état d’erreur.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    autofocus: {
      control: 'boolean',
      description: 'Place le focus automatiquement au chargement.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    orientation: {
      control: 'radio',
      options: ['horizontal', 'vertical'],
      description: 'Orientation du contrôle.',
      table: { type: { summary: "'horizontal' | 'vertical'" }, defaultValue: { summary: "'horizontal'" } },
    },
    size: {
      control: 'radio',
      options: ['sm', 'md', 'default', 'lg', 'xl'],
      description: 'Taille des icônes étoiles.',
      table: { type: { summary: "'sm' | 'md' | 'default' | 'lg' | 'xl'" }, defaultValue: { summary: "'default'" } },
    },
    ariaLabel: {
      control: 'text',
      description: 'Nom accessible pour le lecteur d’écran.',
      table: { type: { summary: 'string' } },
    },
    rateChange: {
      action: 'rateChange',
      description: 'Émis lorsque la valeur de la note change.',
      table: { category: 'Events', type: { summary: 'number' } },
    },
    ratingFocus: {
      action: 'ratingFocus',
      description: 'Émis lorsque le contrôle reçoit le focus.',
      table: { category: 'Events', type: { summary: 'FocusEvent' } },
    },
    ratingBlur: {
      action: 'ratingBlur',
      description: 'Émis lorsque le contrôle perd le focus.',
      table: { category: 'Events', type: { summary: 'FocusEvent' } },
    },
  },
};

export default meta;
type Story = StoryObj<UiRating>;

export const Default: Story = {
  render: (args) => ({
    props: { ...args, model: 3 },
    template: `<ui-rating [(ngModel)]="model" [stars]="stars" [cancel]="cancel" [disabled]="disabled" [readonly]="readonly" [required]="required" [invalid]="invalid" [autofocus]="autofocus" [orientation]="orientation" [size]="size" ariaLabel="Note"></ui-rating>`,
  }),
};

export const Disabled: Story = {
  render: (args) => ({
    props: { ...args, model: 2 },
    template: `<ui-rating [(ngModel)]="model" [disabled]="true" ariaLabel="Note"></ui-rating>`,
  }),
};

export const Invalid: Story = {
  render: (args) => ({
    props: { ...args, model: 0 },
    template: `<ui-rating [(ngModel)]="model" [invalid]="true" ariaLabel="Note"></ui-rating>`,
  }),
};

export const SizeXL: Story = {
  render: (args) => ({
    props: { ...args, model: 4 },
    template: `<ui-rating [(ngModel)]="model" size="xl" ariaLabel="Note"></ui-rating>`,
  }),
};

export const CustomTemplates: Story = {
  render: (args) => ({
    props: { ...args, model: 3 },
    template: `
      <ui-rating [(ngModel)]="model" ariaLabel="Note de satisfaction">
        <ng-template #onIcon let-star let-active="active">
          <span style="font-size: 24px; display: inline-block; width: 24px; height: 24px; text-align: center;">😊</span>
        </ng-template>
        <ng-template #offIcon let-star let-active="active">
          <span style="font-size: 24px; display: inline-block; width: 24px; height: 24px; text-align: center; opacity: 0.3;">😊</span>
        </ng-template>
      </ui-rating>
    `,
  }),
};
