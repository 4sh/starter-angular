import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { Field, form, required } from '@angular/forms/signals';
import { UiSegmentControl, SegmentControlOption } from './ui-segment-control';

const VIEW_OPTIONS = ['Liste', 'Grille', 'Tableau'];

const ICON_OPTIONS: SegmentControlOption<string>[] = [
  { value: 'list', label: 'Liste', icon: 'list' },
  { value: 'grid', label: 'Grille', icon: 'table-cells' },
  { value: 'chart', label: 'Graphe', icon: 'chart-simple' },
];

// Icon-only options: no label, so an `ariaLabel` is mandatory per segment.
const ICON_ONLY_OPTIONS: SegmentControlOption<string>[] = [
  { value: 'list', icon: 'list', ariaLabel: 'Liste' },
  { value: 'grid', icon: 'table-cells', ariaLabel: 'Grille' },
  { value: 'chart', icon: 'chart-simple', ariaLabel: 'Graphe' },
];

const meta: Meta<UiSegmentControl> = {
  title: 'Components/ui/forms/ui-segment-control',
  component: UiSegmentControl,
  decorators: [
    moduleMetadata({ imports: [UiSegmentControl, CommonModule, FormsModule, ReactiveFormsModule, Field] }),
  ],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=159-5191&t=UVjo39F2me7Bsklt-1',
    },
  },
  argTypes: {
    options: {
      control: 'object',
      description: 'Options affichées (primitives, objets, ou `SegmentControlOption`).',
      table: { type: { summary: '(T | SegmentControlOption<T>)[]' }, defaultValue: { summary: '[]' } },
    },
    optionLabel: {
      control: 'text',
      description: 'Nom du champ label quand les options sont des objets.',
      table: { type: { summary: 'string' } },
    },
    optionValue: {
      control: 'text',
      description: 'Nom du champ valeur quand les options sont des objets.',
      table: { type: { summary: 'string' } },
    },
    optionDisabled: {
      control: 'text',
      description: 'Nom du champ désactivé quand les options sont des objets.',
      table: { type: { summary: 'string' } },
    },
    optionIcon: {
      control: 'text',
      description: 'Nom du champ icône quand les options sont des objets.',
      table: { type: { summary: 'string' } },
    },
    dataKey: {
      control: 'text',
      description: 'Propriété comparée pour l’égalité des valeurs objet (sélection).',
      table: { type: { summary: 'string' } },
    },
    multiple: {
      control: 'boolean',
      description: 'Autorise la sélection de plusieurs valeurs (le modèle devient un tableau).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    allowEmpty: {
      control: 'boolean',
      description: 'La sélection peut être entièrement vidée.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    size: {
      control: 'inline-radio',
      options: ['default', 'small'],
      table: { type: { summary: 'SegmentControlSize' }, defaultValue: { summary: "'default'" } },
    },
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
      table: { type: { summary: 'SegmentControlOrientation' }, defaultValue: { summary: "'horizontal'" } },
    },
    fluid: {
      control: 'boolean',
      description: 'Occupe toute la largeur du parent (segments répartis à parts égales).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    motion: {
      control: 'boolean',
      description: 'Anime l’indicateur glissant (respecte reduced-motion quoi qu’il arrive).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    ariaLabel: {
      control: 'text',
      description: 'Nom accessible du groupe (obligatoire sans label visible externe).',
      table: { type: { summary: 'string' } },
    },
    ariaLabelledBy: {
      control: false,
      description: 'id d’un élément externe qui labellise le groupe.',
      table: { type: { summary: 'string' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Désactive tout le contrôle.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    readonly: {
      control: 'boolean',
      description: 'Focusable mais non modifiable.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    invalid: {
      control: 'boolean',
      description: 'Force le style erreur (automatique quand le contrôle attaché est invalide et touched/dirty).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    selectionChange: {
      action: 'selectionChange',
      description: 'Émis à la sélection avec la nouvelle valeur du modèle.',
      table: { disable: true },
    },
    optionClick: {
      action: 'optionClick',
      description: 'Émis au clic sur un segment (même sans changement de valeur).',
      table: { disable: true },
    },
  },
  args: {
    options: VIEW_OPTIONS,
    ariaLabel: 'Mode d’affichage',
    size: 'default',
    orientation: 'horizontal',
    multiple: false,
    allowEmpty: true,
    fluid: false,
    motion: true,
    disabled: false,
    readonly: false,
    invalid: false,
  },
};

export default meta;
type Story = StoryObj<UiSegmentControl>;

// --- Basic : sélection simple ([(ngModel)]) -----------------------------
export const Basic: Story = {
  render: (args) => ({
    props: { ...args, model: 'Liste' },
    template: `
      <div style="display:grid; gap:12px; justify-items:start;">
        <ui-segment-control
          [(ngModel)]="model"
          [options]="options" [ariaLabel]="ariaLabel"
          [size]="size" [orientation]="orientation" [fluid]="fluid" [motion]="motion"
          [multiple]="multiple" [allowEmpty]="allowEmpty"
          [disabled]="disabled" [readonly]="readonly" [invalid]="invalid"
          (selectionChange)="selectionChange($event)" (optionClick)="optionClick($event)" />
        <code>model = {{ model | json }}</code>
      </div>
    `,
  }),
};

// --- Multiple : plusieurs valeurs (le modèle est un tableau) ------------
export const Multiple: Story = {
  render: () => ({
    props: { model: ['grid'], opts: ICON_OPTIONS },
    template: `
      <div style="display:grid; gap:12px; justify-items:start;">
        <ui-segment-control [(ngModel)]="model" [multiple]="true" [options]="opts" ariaLabel="Filtres d’affichage" />
        <code>model = {{ model | json }}</code>
      </div>
    `,
  }),
};

// --- Template : contenu de segment personnalisé (via [itemTemplate]) ----
export const Template: Story = {
  render: () => ({
    props: {
      model: 'off',
      plans: [
        { value: 'off', label: 'Off', hint: '0 €' },
        { value: 'pro', label: 'Pro', hint: '9 €' },
        { value: 'max', label: 'Max', hint: '19 €' },
      ],
    },
    template: `
      <div style="display:grid; gap:12px; justify-items:start;">
        <ui-segment-control [(ngModel)]="model" [options]="plans" [itemTemplate]="item" ariaLabel="Forfait" />
        <ng-template #item let-plan>
          <span style="display:flex; flex-direction:column; align-items:center; line-height:1.1;">
            <strong>{{ plan.label }}</strong>
            <small style="opacity:.75;">{{ plan.hint }}</small>
          </span>
        </ng-template>
        <code>model = {{ model }}</code>
      </div>
    `,
  }),
};

// --- Sizes --------------------------------------------------------------
export const Sizes: Story = {
  render: () => ({
    props: { a: 'Grille', b: 'Grille', opts: VIEW_OPTIONS },
    template: `
      <div style="display:grid; gap:16px; justify-items:start;">
        <ui-segment-control [(ngModel)]="a" [options]="opts" size="default" ariaLabel="Default" />
        <ui-segment-control [(ngModel)]="b" [options]="opts" size="small" ariaLabel="Small" />
      </div>
    `,
  }),
};

// --- Icons only (aria-label obligatoire par segment) --------------------
export const IconsOnly: Story = {
  name: 'Icons Only',
  render: () => ({
    props: { model: 'grid', opts: ICON_ONLY_OPTIONS },
    template: `
      <ui-segment-control [(ngModel)]="model" [options]="opts" ariaLabel="Mode d’affichage" />
    `,
  }),
};

// --- Orientation verticale ---------------------------------------------
export const Vertical: Story = {
  render: () => ({
    props: { model: 'grid', opts: ICON_OPTIONS },
    template: `
      <ui-segment-control [(ngModel)]="model" [options]="opts" orientation="vertical" ariaLabel="Mode d’affichage" />
    `,
  }),
};

// --- Fluid : pleine largeur --------------------------------------------
export const Fluid: Story = {
  render: () => ({
    props: { model: 'Liste', opts: VIEW_OPTIONS },
    template: `
      <div style="width:420px;">
        <ui-segment-control [(ngModel)]="model" [options]="opts" [fluid]="true" ariaLabel="Mode d’affichage" />
      </div>
    `,
  }),
};

// --- Disabled -----------------------------------------------------------
export const Disabled: Story = {
  render: () => ({
    props: {
      whole: 'Grille',
      partial: 'Liste',
      opts: VIEW_OPTIONS,
      mixed: [
        { value: 'list', label: 'Liste' },
        { value: 'grid', label: 'Grille' },
        { value: 'chart', label: 'Graphe', disabled: true },
      ],
    },
    template: `
      <div style="display:grid; gap:16px; justify-items:start;">
        <ui-segment-control [(ngModel)]="whole" [options]="opts" [disabled]="true" ariaLabel="Groupe désactivé" />
        <ui-segment-control [(ngModel)]="partial" [options]="mixed" ariaLabel="Option désactivée" />
      </div>
    `,
  }),
};

// --- Invalid ------------------------------------------------------------
export const Invalid: Story = {
  render: () => ({
    props: { model: null, opts: VIEW_OPTIONS },
    template: `
      <ui-segment-control [(ngModel)]="model" [options]="opts" [invalid]="true" ariaLabel="Sélection requise" />
    `,
  }),
};

// --- Signal Forms (@angular/forms/signals) ------------------------------
@Component({
  selector: 'demo-segment-signal-forms',
  standalone: true,
  imports: [UiSegmentControl, Field, CommonModule],
  template: `
    <div style="display:grid; gap:12px; justify-items:start;">
      <ui-segment-control [field]="color" [options]="options" ariaLabel="Couleur" />
      <code>value = {{ color().value() | json }} · valid = {{ color().valid() }}</code>
    </div>
  `,
})
class SignalFormsDemo {
  protected readonly options = ['Rouge', 'Vert', 'Bleu'];
  protected readonly model = signal<string | null>(null);
  protected readonly color = form(this.model, (path) => {
    required(path);
  });
}

export const SignalForms: Story = {
  name: 'Signal Forms',
  render: () => ({ template: `<demo-segment-signal-forms />` }),
  decorators: [moduleMetadata({ imports: [SignalFormsDemo] })],
};

// --- Template Driven ([(ngModel)] + validation native) ------------------
export const TemplateDriven: Story = {
  name: 'Template Driven',
  render: () => ({
    props: { model: 'Grille', opts: VIEW_OPTIONS },
    template: `
      <form #f="ngForm" style="display:grid; gap:12px; justify-items:start;">
        <ui-segment-control [(ngModel)]="model" name="view" [options]="opts" ariaLabel="Mode d’affichage" />
        <code>model = {{ model }} · form.valid = {{ f.valid }}</code>
      </form>
    `,
  }),
};

// --- Reactive Forms (FormControl) ---------------------------------------
export const ReactiveForms: Story = {
  name: 'Reactive Forms',
  render: () => ({
    props: { control: new FormControl<string | null>('Liste', Validators.required), opts: VIEW_OPTIONS },
    template: `
      <div style="display:grid; gap:12px; justify-items:start;">
        <ui-segment-control [formControl]="control" [options]="opts" ariaLabel="Mode d’affichage" />
        <code>value = {{ control.value }} · valid = {{ control.valid }}</code>
        <button type="button" (click)="control.disabled ? control.enable() : control.disable()">
          Activer / désactiver
        </button>
      </div>
    `,
  }),
};
