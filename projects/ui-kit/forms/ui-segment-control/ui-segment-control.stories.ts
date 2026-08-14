import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import { UiSegmentControl, SegmentControlOption } from '@4sh/ui-kit/forms/ui-segment-control';

const VIEW_OPTIONS = ['List', 'Grille', 'Tableau'];

const ICON_OPTIONS: SegmentControlOption<string>[] = [
  { value: 'list', label: 'List', icon: 'list' },
  { value: 'grid', label: 'Grille', icon: 'table-cells' },
  { value: 'chart', label: 'Graph', icon: 'chart-simple' },
];

// Icon-only options: no label, so an `ariaLabel` is mandatory per segment.
const ICON_ONLY_OPTIONS: SegmentControlOption<string>[] = [
  { value: 'list', icon: 'list', ariaLabel: 'List' },
  { value: 'grid', icon: 'table-cells', ariaLabel: 'Grille' },
  { value: 'chart', icon: 'chart-simple', ariaLabel: 'Graph' },
];

const meta: Meta<UiSegmentControl> = {
  title: 'Components/ui/forms/ui-segment-control',
  component: UiSegmentControl,
  decorators: [
    moduleMetadata({ imports: [UiSegmentControl, CommonModule, FormsModule, ReactiveFormsModule, FormField] }),
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
      description: 'Displayed options (primitives, objects, or `SegmentControlOption`).',
      table: { type: { summary: '(T | SegmentControlOption<T>)[]' }, defaultValue: { summary: '[]' } },
    },
    optionLabel: {
      control: 'text',
      description: 'Field name for the label when options are objects.',
      table: { type: { summary: 'string' } },
    },
    optionValue: {
      control: 'text',
      description: 'Field name for the value when options are objects.',
      table: { type: { summary: 'string' } },
    },
    optionDisabled: {
      control: 'text',
      description: 'Field name for disabled when options are objects.',
      table: { type: { summary: 'string' } },
    },
    optionIcon: {
      control: 'text',
      description: 'Field name for the icon when options are objects.',
      table: { type: { summary: 'string' } },
    },
    dataKey: {
      control: 'text',
      description: 'Property compared for object value equality (selection).',
      table: { type: { summary: 'string' } },
    },
    multiple: {
      control: 'boolean',
      description: 'Allows selecting multiple values (the model becomes an array).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    allowEmpty: {
      control: 'boolean',
      description: 'The selection can be fully cleared.',
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
      description: 'Takes up the parent\'s full width (segments spread evenly).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    motion: {
      control: 'boolean',
      description: 'Animates the sliding indicator (respects reduced-motion regardless).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    ariaLabel: {
      control: 'text',
      description: 'Accessible name of the group (required without an external visible label).',
      table: { type: { summary: 'string' } },
    },
    ariaLabelledBy: {
      control: false,
      description: 'id of an external element that labels the group.',
      table: { type: { summary: 'string' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the whole control.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    readonly: {
      control: 'boolean',
      description: 'Focusable mais non modifiable.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    invalid: {
      control: 'boolean',
      description: 'Forces the error style (automatic when the attached control is invalid and touched/dirty).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    selectionChange: {
      action: 'selectionChange',
      description: 'Emitted on selection, with the new model value.',
      table: { disable: true },
    },
    optionClick: {
      action: 'optionClick',
      description: 'Emitted on clicking a segment (even without a value change).',
      table: { disable: true },
    },
  },
  args: {
    options: VIEW_OPTIONS,
    ariaLabel: 'Display mode',
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
    props: { ...args, model: 'List' },
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
        <ui-segment-control [(ngModel)]="model" [multiple]="true" [options]="opts" ariaLabel="Display filters" />
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
        <ui-segment-control [(ngModel)]="model" [options]="plans" [itemTemplate]="item" ariaLabel="Plan" />
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
      <ui-segment-control [(ngModel)]="model" [options]="opts" ariaLabel="Display mode" />
    `,
  }),
};

// --- Orientation verticale ---------------------------------------------
export const Vertical: Story = {
  render: () => ({
    props: { model: 'grid', opts: ICON_OPTIONS },
    template: `
      <ui-segment-control [(ngModel)]="model" [options]="opts" orientation="vertical" ariaLabel="Display mode" />
    `,
  }),
};

// --- Fluid : pleine largeur --------------------------------------------
export const Fluid: Story = {
  render: () => ({
    props: { model: 'List', opts: VIEW_OPTIONS },
    template: `
      <div style="width:420px;">
        <ui-segment-control [(ngModel)]="model" [options]="opts" [fluid]="true" ariaLabel="Display mode" />
      </div>
    `,
  }),
};

// --- Disabled -----------------------------------------------------------
export const Disabled: Story = {
  render: () => ({
    props: {
      whole: 'Grille',
      partial: 'List',
      opts: VIEW_OPTIONS,
      mixed: [
        { value: 'list', label: 'List' },
        { value: 'grid', label: 'Grille' },
        { value: 'chart', label: 'Graph', disabled: true },
      ],
    },
    template: `
      <div style="display:grid; gap:16px; justify-items:start;">
        <ui-segment-control [(ngModel)]="whole" [options]="opts" [disabled]="true" ariaLabel="Disabled group" />
        <ui-segment-control [(ngModel)]="partial" [options]="mixed" ariaLabel="Disabled option" />
      </div>
    `,
  }),
};

// --- Invalid ------------------------------------------------------------
export const Invalid: Story = {
  render: () => ({
    props: { model: null, opts: VIEW_OPTIONS },
    template: `
      <ui-segment-control [(ngModel)]="model" [options]="opts" [invalid]="true" ariaLabel="Selection required" />
    `,
  }),
};

// --- Signal Forms (@angular/forms/signals) ------------------------------
@Component({
  selector: 'demo-segment-signal-forms',
  standalone: true,
  imports: [UiSegmentControl, FormField, CommonModule],
  template: `
    <div style="display:grid; gap:12px; justify-items:start;">
      <ui-segment-control [formField]="color" [options]="options" ariaLabel="Color" />
      <code>value = {{ color().value() | json }} · valid = {{ color().valid() }}</code>
    </div>
  `,
})
class SignalFormsDemo {
  protected readonly options = ['Rouge', 'Vert', 'Blue'];
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
        <ui-segment-control [(ngModel)]="model" name="view" [options]="opts" ariaLabel="Display mode" />
        <code>model = {{ model }} · form.valid = {{ f.valid }}</code>
      </form>
    `,
  }),
};

// --- Reactive Forms (FormControl) ---------------------------------------
export const ReactiveForms: Story = {
  name: 'Reactive Forms',
  render: () => ({
    props: { control: new FormControl<string | null>('List', Validators.required), opts: VIEW_OPTIONS },
    template: `
      <div style="display:grid; gap:12px; justify-items:start;">
        <ui-segment-control [formControl]="control" [options]="opts" ariaLabel="Display mode" />
        <code>value = {{ control.value }} · valid = {{ control.valid }}</code>
        <button type="button" (click)="control.disabled ? control.enable() : control.disable()">
          Enable / disable
        </button>
      </div>
    `,
  }),
};
