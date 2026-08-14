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
      description: 'Number of possible values (stars).',
      table: { type: { summary: 'number' }, defaultValue: { summary: '5' } },
    },
    allowHalf: {
      control: 'boolean',
      description:
        'Enables half ratings: the value advances in steps of 0.5 (click on half a star, arrow keys).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    cancel: {
      control: 'boolean',
      description: 'Allows clearing the rating by clicking the current value.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the control.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    readonly: {
      control: 'boolean',
      description: 'Makes the control read-only (navigable but not editable).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    required: {
      control: 'boolean',
      description: 'Marks the field as required.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    invalid: {
      control: 'boolean',
      description: 'Forces the error state.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    autofocus: {
      control: 'boolean',
      description: 'Automatically places focus on load.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    orientation: {
      control: 'radio',
      options: ['horizontal', 'vertical'],
      description: 'Control orientation.',
      table: { type: { summary: "'horizontal' | 'vertical'" }, defaultValue: { summary: "'horizontal'" } },
    },
    size: {
      control: 'radio',
      options: ['sm', 'md', 'default', 'lg', 'xl'],
      description: 'Star icon size.',
      table: { type: { summary: "'sm' | 'md' | 'default' | 'lg' | 'xl'" }, defaultValue: { summary: "'default'" } },
    },
    ariaLabel: {
      control: 'text',
      description: 'Accessible name for the screen reader.',
      table: { type: { summary: 'string' } },
    },
    rateChange: {
      action: 'rateChange',
      description: 'Emitted when the rating value changes.',
      table: { category: 'Events', type: { summary: 'number' } },
    },
    ratingFocus: {
      action: 'ratingFocus',
      description: 'Emitted when the control receives focus.',
      table: { category: 'Events', type: { summary: 'FocusEvent' } },
    },
    ratingBlur: {
      action: 'ratingBlur',
      description: 'Emitted when the control loses focus.',
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
