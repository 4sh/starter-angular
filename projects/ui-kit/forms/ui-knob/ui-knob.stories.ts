import { Component, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import { UiKnob } from '@4sh/ui-kit/forms/ui-knob';
import { UiButton } from '@4sh/ui-kit/actions/ui-button';

const meta: Meta<UiKnob> = {
  title: 'Components/ui/forms/ui-knob',
  component: UiKnob,
  decorators: [
    moduleMetadata({
      imports: [UiKnob, FormsModule, ReactiveFormsModule, FormField],
    }),
  ],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=3795-39721',
    },
  },
  argTypes: {
    min: {
      control: 'number',
      description: 'Valeur minimale.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' } },
    },
    max: {
      control: 'number',
      description: 'Valeur maximale.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '100' } },
    },
    step: {
      control: 'number',
      description: 'Granularité d’incrément (rotation + clavier).',
      table: { type: { summary: 'number' }, defaultValue: { summary: '1' } },
    },
    size: {
      control: 'inline-radio',
      options: ['small', 'default', 'large'],
      description: 'Diamètre du cadran (tout autre diamètre via le hook `--ui-knob-size`).',
      table: { type: { summary: 'UiKnobSize' }, defaultValue: { summary: "'default'" } },
    },
    strokeWidth: {
      control: { type: 'range', min: 2, max: 40, step: 1 },
      description:
        'Épaisseur de l’arc, exprimée dans le repère du tracé (100 = le diamètre) : elle suit donc la taille du cadran.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '14' } },
    },
    showValue: {
      control: 'boolean',
      description: 'Affiche la valeur au centre du cadran.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    valueTemplate: {
      control: 'text',
      description: 'Gabarit du libellé central, `{value}` servant d’emplacement.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'{value}'" } },
    },
    valueColor: {
      control: 'text',
      description: 'Couleur de l’arc rempli (toute couleur CSS). Alimente `--ui-knob-value-color`.',
      table: { type: { summary: 'string' } },
    },
    rangeColor: {
      control: 'text',
      description: 'Couleur de la piste. Alimente `--ui-knob-range-color`.',
      table: { type: { summary: 'string' } },
    },
    textColor: {
      control: 'text',
      description: 'Couleur du libellé central. Alimente `--ui-knob-text-color`.',
      table: { type: { summary: 'string' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Désactive le contrôle.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    readonly: {
      control: 'boolean',
      description: 'Focusable mais non modifiable.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    required: {
      control: 'boolean',
      description: 'Marque le champ comme requis.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    invalid: {
      control: 'boolean',
      description:
        'Force le style erreur (automatique quand le contrôle attaché est invalide et touched/dirty).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    ariaLabel: {
      control: 'text',
      description: 'Nom accessible du cadran.',
      table: { type: { summary: 'string' } },
    },
    ariaLabelledBy: {
      control: false,
      description: 'id d’un élément externe qui labellise le cadran.',
      table: { type: { summary: 'string' } },
    },
    knobChange: {
      action: 'knobChange',
      description: 'Émis à chaque changement de valeur (rotation, clavier, clic sur le cadran).',
      table: { category: 'Events', type: { summary: 'number' } },
    },
  },
  args: {
    min: 0,
    max: 100,
    step: 1,
    size: 'default',
    strokeWidth: 14,
    showValue: true,
    valueTemplate: '{value}',
    disabled: false,
    readonly: false,
    required: false,
    invalid: false,
    ariaLabel: 'Valeur',
  },
};

export default meta;
type Story = StoryObj<UiKnob>;

// --- Basic : [(ngModel)] ------------------------------------------------
export const Basic: Story = {
  render: (args) => ({
    props: { ...args, model: 60 },
    template: `
      <div style="display:grid; gap:12px; justify-items:center;">
        <ui-knob [(ngModel)]="model"
          [min]="min" [max]="max" [step]="step" [size]="size"
          [strokeWidth]="strokeWidth" [showValue]="showValue" [valueTemplate]="valueTemplate"
          [valueColor]="valueColor" [rangeColor]="rangeColor" [textColor]="textColor"
          [disabled]="disabled" [readonly]="readonly" [required]="required" [invalid]="invalid"
          [ariaLabel]="ariaLabel" (knobChange)="knobChange($event)" />
        <code>model = {{ model }}</code>
      </div>
    `,
  }),
};

// --- Min / Max : bornes personnalisées ----------------------------------
export const MinMax: Story = {
  name: 'Min / Max',
  render: () => ({
    props: { model: 10 },
    template: `
      <div style="display:grid; gap:12px; justify-items:center;">
        <ui-knob [(ngModel)]="model" [min]="-50" [max]="50" ariaLabel="Température" />
        <code>min = -50 · max = 50 · model = {{ model }}</code>
      </div>
    `,
  }),
};

// --- Step : pas de 10 ---------------------------------------------------
export const Step: Story = {
  render: () => ({
    props: { model: 40 },
    template: `
      <div style="display:grid; gap:12px; justify-items:center;">
        <ui-knob [(ngModel)]="model" [step]="10" ariaLabel="Valeur (pas de 10)" />
        <code>model = {{ model }}</code>
      </div>
    `,
  }),
};

// --- Template : gabarit du libellé central ------------------------------
export const Template: Story = {
  render: () => ({
    props: { percent: 60, amount: 40 },
    template: `
      <div style="display:flex; gap:32px; align-items:center;">
        <ui-knob [(ngModel)]="percent" valueTemplate="{value}%" ariaLabel="Progression" />
        <ui-knob [(ngModel)]="amount" valueTemplate="{value} €" ariaLabel="Montant" />
      </div>
    `,
  }),
};

// --- Stroke : épaisseur de l'arc ----------------------------------------
export const Stroke: Story = {
  render: () => ({
    props: { thin: 40, thick: 60 },
    template: `
      <div style="display:flex; gap:32px; align-items:center;">
        <ui-knob [(ngModel)]="thin" [strokeWidth]="5" ariaLabel="Arc fin" />
        <ui-knob [(ngModel)]="thick" [strokeWidth]="24" ariaLabel="Arc épais" />
      </div>
    `,
  }),
};

// --- Size : tailles nommées + diamètre libre ----------------------------
export const Size: Story = {
  render: () => ({
    props: { a: 30, b: 50, c: 70, d: 90 },
    template: `
      <div style="display:flex; gap:32px; align-items:center;">
        <ui-knob [(ngModel)]="a" size="small" ariaLabel="Petit" />
        <ui-knob [(ngModel)]="b" ariaLabel="Par défaut" />
        <ui-knob [(ngModel)]="c" size="large" ariaLabel="Grand" />
        <ui-knob [(ngModel)]="d" ariaLabel="Diamètre libre"
                 style="--ui-knob-size: 180px; --ui-knob-font-size: 32px;" />
      </div>
    `,
  }),
};

// --- Color : recoloration par instance ----------------------------------
export const Color: Story = {
  render: () => ({
    props: { a: 70, b: 45, c: 85 },
    template: `
      <div style="display:flex; gap:32px; align-items:center;">
        <ui-knob [(ngModel)]="a" ariaLabel="Succès"
                 valueColor="var(--informative-successhigh-surface-default)"
                 textColor="var(--informative-successhigh-surface-default)" />
        <ui-knob [(ngModel)]="b" ariaLabel="Alerte"
                 valueColor="var(--informative-warninghigh-surface-default)"
                 rangeColor="var(--informative-warninglow-surface-default)" />
        <ui-knob [(ngModel)]="c" ariaLabel="Erreur"
                 style="--ui-knob-value-color: var(--informative-errorhigh-surface-default);" />
      </div>
    `,
  }),
};

// --- Contrôles personnalisés --------------------------------------------
export const CustomControls: Story = {
  name: 'Custom Controls',
  render: () => ({
    props: { model: 50 },
    template: `
      <div style="display:grid; gap:16px; justify-items:center;">
        <ui-knob [(ngModel)]="model" [readonly]="true" ariaLabel="Valeur" />
        <div style="display:flex; gap:8px;">
          <ui-button label="−10" level="low" (buttonClick)="model = model - 10 < 0 ? 0 : model - 10" />
          <ui-button label="+10" level="low" (buttonClick)="model = model + 10 > 100 ? 100 : model + 10" />
        </div>
        <code>model = {{ model }}</code>
      </div>
    `,
  }),
  decorators: [moduleMetadata({ imports: [UiButton] })],
};

// --- ReadOnly -----------------------------------------------------------
export const ReadOnly: Story = {
  render: () => ({
    props: { model: 75 },
    template: `
      <div style="display:grid; gap:12px; justify-items:center;">
        <ui-knob [(ngModel)]="model" [readonly]="true" ariaLabel="Valeur en lecture seule" />
        <code>model = {{ model }}</code>
      </div>
    `,
  }),
};

// --- Disabled -----------------------------------------------------------
export const Disabled: Story = {
  render: () => ({
    props: { model: 55 },
    template: `
      <div style="display:grid; gap:12px; justify-items:center;">
        <ui-knob [(ngModel)]="model" [disabled]="true" ariaLabel="Valeur désactivée" />
        <code>model = {{ model }}</code>
      </div>
    `,
  }),
};

// --- États : erreur -----------------------------------------------------
export const States: Story = {
  render: () => ({
    props: { a: 55, b: 30 },
    template: `
      <div style="display:flex; gap:32px; align-items:center;">
        <ui-knob [(ngModel)]="a" [disabled]="true" ariaLabel="Désactivé" />
        <ui-knob [(ngModel)]="b" [invalid]="true" ariaLabel="Erreur" />
      </div>
    `,
  }),
};

// --- Signal Forms (@angular/forms/signals) ------------------------------
@Component({
  selector: 'demo-knob-signal-forms',
  standalone: true,
  imports: [UiKnob, FormField],
  template: `
    <div style="display:grid; gap:12px; justify-items:center;">
      <ui-knob [formField]="level" valueTemplate="{value}%" ariaLabel="Niveau" />
      <code>value = {{ level().value() }} · valid = {{ level().valid() }}</code>
    </div>
  `,
})
class SignalFormsDemo {
  protected readonly model = signal(35);
  protected readonly level = form(this.model, (path) => {
    required(path);
  });
}

export const SignalForms: Story = {
  name: 'Signal Forms',
  render: () => ({ template: `<demo-knob-signal-forms />` }),
  decorators: [moduleMetadata({ imports: [SignalFormsDemo] })],
};

// --- Template Driven ([(ngModel)] + validation native) ------------------
export const TemplateDriven: Story = {
  name: 'Template Driven',
  render: () => ({
    props: { model: 25 },
    template: `
      <form #f="ngForm" style="display:grid; gap:12px; justify-items:center;">
        <ui-knob [(ngModel)]="model" name="level" required ariaLabel="Niveau" />
        <code>model = {{ model }} · form.valid = {{ f.valid }}</code>
      </form>
    `,
  }),
};

// --- Reactive Forms (FormControl) ---------------------------------------
export const ReactiveForms: Story = {
  name: 'Reactive Forms',
  render: () => ({
    props: { control: new FormControl<number>(65, Validators.required) },
    template: `
      <div style="display:grid; gap:12px; justify-items:center;">
        <ui-knob [formControl]="control" ariaLabel="Niveau" />
        <code>value = {{ control.value }} · valid = {{ control.valid }}</code>
        <button type="button" (click)="control.disabled ? control.enable() : control.disable()">
          Activer / désactiver
        </button>
      </div>
    `,
  }),
};
