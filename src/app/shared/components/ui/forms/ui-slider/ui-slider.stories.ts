import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { Field, form, required } from '@angular/forms/signals';
import { UiSlider } from './ui-slider';
import { UiInputNumber } from '@app/shared/components/ui/forms/ui-input-number/ui-input-number';

const meta: Meta<UiSlider> = {
  title: 'Components/ui/forms/ui-slider',
  component: UiSlider,
  decorators: [
    moduleMetadata({ imports: [UiSlider, CommonModule, FormsModule, ReactiveFormsModule, Field] }),
  ],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=242-1901&t=JpioUOVrrtFq1B4u-1',
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
      description: 'Granularité d’incrément (drag + clavier).',
      table: { type: { summary: 'number' }, defaultValue: { summary: '1' } },
    },
    range: {
      control: 'boolean',
      description: 'Deux poignées définissant un intervalle (le modèle devient un tableau).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    minStepsBetweenHandles: {
      control: 'number',
      description: 'Nombre minimal de pas conservés entre les deux poignées (mode range).',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' } },
    },
    marks: {
      control: 'boolean',
      description: 'Affiche un repère par pas le long de la piste.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
      description: 'Orientation du curseur (pilote aussi les flèches clavier).',
      table: { type: { summary: 'SliderOrientation' }, defaultValue: { summary: "'horizontal'" } },
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
      description: 'Marque le champ comme requis (validation native).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    invalid: {
      control: 'boolean',
      description: 'Force le style erreur (automatique quand le contrôle attaché est invalide et touched/dirty).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    ariaLabel: {
      control: 'text',
      description: 'Nom accessible appliqué aux poignées.',
      table: { type: { summary: 'string' } },
    },
    ariaLabelledBy: {
      control: false,
      description: 'id d’un élément externe qui labellise les poignées.',
      table: { type: { summary: 'string' } },
    },
    sliderChange: {
      action: 'sliderChange',
      description: 'Émis en continu pendant le déplacement (drag, clavier, clic piste).',
      table: { category: 'Events', type: { summary: 'number | number[]' } },
    },
    slideEnd: {
      action: 'slideEnd',
      description: 'Émis une fois le glissement terminé.',
      table: { category: 'Events', type: { summary: 'number | number[]' } },
    },
  },
  args: {
    min: 0,
    max: 100,
    step: 1,
    range: false,
    minStepsBetweenHandles: 0,
    marks: false,
    orientation: 'horizontal',
    disabled: false,
    readonly: false,
    required: false,
    invalid: false,
    ariaLabel: 'Valeur',
  },
};

export default meta;
type Story = StoryObj<UiSlider>;

// --- Basic : valeur unique ([(ngModel)]) --------------------------------
export const Basic: Story = {
  render: (args) => ({
    props: { ...args, model: 40 },
    template: `
      <div style="width:280px; display:grid; gap:12px; justify-items:start;">
        <ui-slider [(ngModel)]="model"
          [min]="min" [max]="max" [step]="step" [range]="range"
          [minStepsBetweenHandles]="minStepsBetweenHandles" [marks]="marks"
          [orientation]="orientation" [disabled]="disabled" [readonly]="readonly"
          [required]="required" [invalid]="invalid" [ariaLabel]="ariaLabel"
          (sliderChange)="sliderChange($event)" (slideEnd)="slideEnd($event)" />
        <code>model = {{ model }}</code>
      </div>
    `,
  }),
};

// --- Step : pas de 10 ---------------------------------------------------
export const Step: Story = {
  render: () => ({
    props: { model: 20 },
    template: `
      <div style="width:280px; display:grid; gap:12px; justify-items:start;">
        <ui-slider [(ngModel)]="model" [step]="10" ariaLabel="Valeur (pas de 10)" />
        <code>model = {{ model }}</code>
      </div>
    `,
  }),
};

// --- Range : deux poignées (le modèle est un tableau) -------------------
export const Range: Story = {
  render: () => ({
    props: { model: [20, 80] },
    template: `
      <div style="width:280px; display:grid; gap:12px; justify-items:start;">
        <ui-slider [(ngModel)]="model" [range]="true" ariaLabel="Intervalle" />
        <code>model = {{ model | json }}</code>
      </div>
    `,
  }),
};

// --- Handles Distance : écart minimal entre poignées --------------------
export const HandlesDistance: Story = {
  name: 'Handles Distance',
  render: () => ({
    props: { model: [30, 70] },
    template: `
      <div style="width:280px; display:grid; gap:12px; justify-items:start;">
        <ui-slider [(ngModel)]="model" [range]="true" [step]="1" [minStepsBetweenHandles]="20"
                   ariaLabel="Intervalle (écart min. 20)" />
        <code>model = {{ model | json }}</code>
      </div>
    `,
  }),
};

// --- Controlled : couplé à un ui-input-number ---------------------------
export const Controlled: Story = {
  render: () => ({
    props: { model: 50 },
    template: `
      <div style="width:280px; display:grid; gap:16px;">
        <ui-input-number [(ngModel)]="model" [min]="0" [max]="100" ariaLabel="Valeur" />
        <ui-slider [(ngModel)]="model" [min]="0" [max]="100" ariaLabel="Valeur" />
      </div>
    `,
  }),
  decorators: [moduleMetadata({ imports: [UiInputNumber] })],
};

// --- Value Change : sliderChange (continu) vs slideEnd (fin) ------------
export const ValueChange: Story = {
  name: 'Value Change',
  render: () => ({
    props: { model: 35, live: 35, committed: 35 },
    template: `
      <div style="width:280px; display:grid; gap:12px; justify-items:start;">
        <ui-slider [(ngModel)]="model"
                   (sliderChange)="live = $event" (slideEnd)="committed = $event"
                   ariaLabel="Valeur" />
        <code>sliderChange (continu) = {{ live }}</code>
        <code>slideEnd (au relâcher) = {{ committed }}</code>
      </div>
    `,
  }),
};

// --- Custom : surcharge des hooks structurels (CSS custom properties) ---
export const Custom: Story = {
  render: () => ({
    props: { model: 60 },
    template: `
      <div style="width:280px; display:grid; gap:12px; justify-items:start;">
        <ui-slider [(ngModel)]="model" ariaLabel="Valeur épaisse"
                   style="--ui-slider-thickness: 4px; --ui-slider-handle-size: 28px;" />
        <code>model = {{ model }}</code>
      </div>
    `,
  }),
};

// --- Marks : repères par pas -------------------------------------------
export const Marks: Story = {
  render: () => ({
    props: { model: 60 },
    template: `
      <div style="width:280px; display:grid; gap:12px; justify-items:start;">
        <ui-slider [(ngModel)]="model" [step]="10" [marks]="true" ariaLabel="Valeur" />
        <code>model = {{ model }}</code>
      </div>
    `,
  }),
};

// --- Orientation verticale ---------------------------------------------
export const Vertical: Story = {
  render: () => ({
    props: { single: 40, range: [20, 80] },
    template: `
      <div style="display:flex; gap:48px; height:200px; align-items:stretch;">
        <ui-slider [(ngModel)]="single" orientation="vertical" ariaLabel="Volume" />
        <ui-slider [(ngModel)]="range" [range]="true" orientation="vertical" ariaLabel="Plage" />
      </div>
    `,
  }),
};

// --- États : disabled / invalid ----------------------------------------
export const States: Story = {
  render: () => ({
    props: { a: 30, b: 70 },
    template: `
      <div style="width:280px; display:grid; gap:24px;">
        <ui-slider [(ngModel)]="a" [disabled]="true" ariaLabel="Désactivé" />
        <ui-slider [(ngModel)]="b" [invalid]="true" ariaLabel="Erreur" />
      </div>
    `,
  }),
};

// --- Signal Forms (@angular/forms/signals) ------------------------------
@Component({
  selector: 'demo-slider-signal-forms',
  standalone: true,
  imports: [UiSlider, Field, CommonModule],
  template: `
    <div style="width:280px; display:grid; gap:12px; justify-items:start;">
      <ui-slider [field]="volume" ariaLabel="Volume" />
      <code>value = {{ volume().value() }} · valid = {{ volume().valid() }}</code>
    </div>
  `,
})
class SignalFormsDemo {
  protected readonly model = signal(30);
  protected readonly volume = form(this.model, (path) => {
    required(path);
  });
}

export const SignalForms: Story = {
  name: 'Signal Forms',
  render: () => ({ template: `<demo-slider-signal-forms />` }),
  decorators: [moduleMetadata({ imports: [SignalFormsDemo] })],
};

// --- Template Driven ([(ngModel)] + validation native) ------------------
export const TemplateDriven: Story = {
  name: 'Template Driven',
  render: () => ({
    props: { model: 45 },
    template: `
      <form #f="ngForm" style="width:280px; display:grid; gap:12px; justify-items:start;">
        <ui-slider [(ngModel)]="model" name="level" required ariaLabel="Niveau" />
        <code>model = {{ model }} · form.valid = {{ f.valid }}</code>
      </form>
    `,
  }),
};

// --- Reactive Forms (FormControl) ---------------------------------------
export const ReactiveForms: Story = {
  name: 'Reactive Forms',
  render: () => ({
    props: { control: new FormControl<number>(60, Validators.required) },
    template: `
      <div style="width:280px; display:grid; gap:12px; justify-items:start;">
        <ui-slider [formControl]="control" ariaLabel="Niveau" />
        <code>value = {{ control.value }} · valid = {{ control.valid }}</code>
        <button type="button" (click)="control.disabled ? control.enable() : control.disable()">
          Activer / désactiver
        </button>
      </div>
    `,
  }),
};
