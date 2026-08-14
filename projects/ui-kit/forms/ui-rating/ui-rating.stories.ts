import { Component, signal } from '@angular/core';
import { moduleMetadata, type Meta, type StoryObj } from '@storybook/angular';
import { UiRating } from '@4sh/ui-kit/forms/ui-rating';
import { UiIcon } from '@4sh/ui-kit/base/ui-icon';
import { FormsModule } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';

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
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=2026-11880&t=CJr5MNxWDimstGn6-1',
    },
  },
  args: {
    stars: 5,
    allowHalf: false,
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
    allowHalf: {
      control: 'boolean',
      description:
        'Active la demi-notation : la valeur avance par pas de 0,5 (clic sur une moitié d’étoile, flèches du clavier).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
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
    template: `<ui-rating [(ngModel)]="model" [stars]="stars" [allowHalf]="allowHalf" [cancel]="cancel" [disabled]="disabled" [readonly]="readonly" [required]="required" [invalid]="invalid" [autofocus]="autofocus" [orientation]="orientation" [size]="size" ariaLabel="Note"></ui-rating>`,
  }),
};

export const AllowHalf: Story = {
  name: 'Half stars',
  args: { allowHalf: true },
  render: (args) => ({
    props: { ...args, model: 3.5 },
    template: `
      <div style="display:grid; gap:12px; justify-items:start;">
        <ui-rating [(ngModel)]="model" [allowHalf]="allowHalf" [stars]="stars" [size]="size" ariaLabel="Note"></ui-rating>
        <code>value = {{ model === null ? 'null' : model }}</code>
      </div>
    `,
  }),
};

// Read-only display of an average: no interaction, the value carries the halves.
export const HalfReadonly: Story = {
  name: 'Half stars (read-only)',
  args: { allowHalf: true, readonly: true },
  render: (args) => ({
    props: { ...args, model: 4.5 },
    template: `<ui-rating [(ngModel)]="model" [allowHalf]="allowHalf" [readonly]="readonly" size="lg" ariaLabel="Note moyenne"></ui-rating>`,
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
    props: { ...args, model: null },
    template: `<ui-rating [(ngModel)]="model" [invalid]="true" ariaLabel="Note"></ui-rating>`,
  }),
};

export const SizeXL: Story = {
  render: (args) => ({
    props: { ...args, model: 4 },
    template: `<ui-rating [(ngModel)]="model" size="xl" ariaLabel="Note"></ui-rating>`,
  }),
};

// --- Signal Forms (@angular/forms/signals) ------------------------------
@Component({
  selector: 'demo-rating-signal-forms',
  standalone: true,
  imports: [UiRating, FormField],
  template: `
    <div style="display:grid; gap:12px; justify-items:start;">
      <ui-rating [formField]="rating" ariaLabel="Note" />
      <code>value = {{ rating().value() }} · valid = {{ rating().valid() }}</code>
    </div>
  `,
})
class SignalFormsDemo {
  // `null` = not rated — rejected natively by `required` (no `min(1)` workaround needed).
  protected readonly model = signal<number | null>(null);
  protected readonly rating = form(this.model, (path) => {
    required(path);
  });
}

export const SignalForms: Story = {
  name: 'Signal Forms',
  render: () => ({ template: `<demo-rating-signal-forms />` }),
  decorators: [moduleMetadata({ imports: [SignalFormsDemo] })],
};

export const CustomTemplates: Story = {
  render: (args) => ({
    props: { ...args, model: 3 },
    template: `
      <!-- Intrinsic size only: the component centers the projected content itself. -->
      <ui-rating [(ngModel)]="model" [allowHalf]="allowHalf" ariaLabel="Note de satisfaction">
        <ng-template #onIcon let-star let-active="active">
          <span style="font-size: 22px;">😊</span>
        </ng-template>
        <ng-template #offIcon let-star let-active="active">
          <span style="font-size: 22px; opacity: 0.3;">😊</span>
        </ng-template>
      </ui-rating>
    `,
  }),
};
