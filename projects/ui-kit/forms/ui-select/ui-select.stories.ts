import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import { UiSelect } from '@4sh/ui-kit/forms/ui-select';
import { UiChip } from '@4sh/ui-kit/informative/ui-chip';
import { UiIcon } from '@4sh/ui-kit/base/ui-icon';

interface City {
  name: string;
  code: string;
}

const CITIES: City[] = [
  { name: 'Paris', code: 'PAR' },
  { name: 'Lyon', code: 'LYO' },
  { name: 'Marseille', code: 'MRS' },
  { name: 'Bordeaux', code: 'BOD' },
  { name: 'Lille', code: 'LIL' },
];

// Libellés volontairement longs : ils ne tiennent pas dans un champ étroit.
const LONG_CITIES: City[] = [
  { name: 'Saint-Étienne-du-Rouvray', code: 'SER' },
  { name: 'Villeneuve-d’Ascq', code: 'VDA' },
  { name: 'Boulogne-Billancourt', code: 'BLB' },
  { name: 'Clermont-Ferrand', code: 'CFE' },
];

const GROUPED_CITIES = [
  {
    label: 'France',
    code: 'FR',
    items: [
      { name: 'Paris', code: 'PAR' },
      { name: 'Lyon', code: 'LYO' },
      { name: 'Marseille', code: 'MRS' },
    ],
  },
  {
    label: 'Germany',
    code: 'DE',
    items: [
      { name: 'Berlin', code: 'BER' },
      { name: 'Munich', code: 'MUC' },
      { name: 'Hamburg', code: 'HAM' },
    ],
  },
  {
    label: 'Spain',
    code: 'ES',
    items: [
      { name: 'Madrid', code: 'MAD' },
      { name: 'Barcelona', code: 'BCN' },
    ],
  },
];

interface Language {
  label: string;
  value: string;
  icon: string;
}

const LANGUAGES: Language[] = [
  { label: 'French', value: 'fr', icon: 'earth-europe' },
  { label: 'English', value: 'en', icon: 'earth-americas' },
  { label: 'Español', value: 'es', icon: 'earth-europe' },
  { label: 'Deutsch', value: 'de', icon: 'earth-europe' },
  { label: '日本語', value: 'ja', icon: 'earth-asia' },
  { label: '中文', value: 'zh', icon: 'earth-asia' },
];

const MANY_ITEMS = Array.from({ length: 10000 }, (_, i) => `Item ${i + 1}`);

const meta: Meta<UiSelect> = {
  title: 'Components/ui/forms/ui-select',
  component: UiSelect,
  decorators: [moduleMetadata({ imports: [UiSelect, UiChip, UiIcon, CommonModule, FormsModule, ReactiveFormsModule] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=125-2969&t=Ymo8402f9viL1pzq-1',
    },
  },
  argTypes: {
    options: {
      control: 'object',
      description: 'Options to display (primitives, objects, or groups with `group`).',
      table: { type: { summary: 'unknown[]' }, defaultValue: { summary: '[]' } },
    },
    optionLabel: {
      control: 'text',
      description: 'Field name (dotted path) read as the label when options are objects.',
      table: { type: { summary: 'string' } },
    },
    optionValue: {
      control: 'text',
      description: 'Field name (dotted path) read as the value when options are objects.',
      table: { type: { summary: 'string' } },
    },
    optionDisabled: {
      control: 'text',
      description: 'Field name read as an option\'s disabled flag.',
      table: { type: { summary: 'string' } },
    },
    group: {
      control: 'boolean',
      description: 'Treats `options` as groups (`optionGroupLabel` + `optionGroupChildren`).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    optionGroupLabel: {
      control: 'text',
      description: 'Field name for a group\'s label.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'label'" } },
    },
    optionGroupChildren: {
      control: 'text',
      description: 'Field name containing a group\'s options.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'items'" } },
    },
    dataKey: {
      control: 'text',
      description: 'Property compared for object value equality (selection).',
      table: { type: { summary: 'string' } },
    },
    multiple: {
      control: 'boolean',
      description: 'Multiple selection: the model becomes an array, the panel stays open.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    checkmark: {
      control: 'boolean',
      description: 'Shows a checkmark on the selected option(s).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    checkbox: {
      control: 'boolean',
      description: 'Shows a checkbox before each option (`multiple` mode).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    maxSelectedLabels: {
      control: 'number',
      description: 'Max number of selected items shown in the field (`multiple`); the rest collapses into `overflowLabel`.',
      table: { type: { summary: 'number' } },
    },
    overflowLabel: {
      control: 'text',
      description: 'Collapse indicator — `{0}` is replaced by the number of hidden items.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'(+{0} more)'" } },
    },
    placeholder: {
      control: 'text',
      description: 'Text shown when no value is selected.',
      table: { type: { summary: 'string' } },
    },
    showClear: {
      control: 'boolean',
      description: 'Shows a clear action (×) when a value is set.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    filter: {
      control: 'boolean',
      description: 'Shows the filter field built into the panel.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    filterPlaceholder: {
      control: 'text',
      description: 'Filter field placeholder.',
      table: { type: { summary: 'string' } },
    },
    filterBy: {
      control: 'text',
      description: 'Fields (dotted paths, comma-separated) compared by the filter — label by default.',
      table: { type: { summary: 'string' } },
    },
    editable: {
      control: 'boolean',
      description: 'Free typing: the trigger becomes an `<input>`, typing sets the value directly.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    loading: {
      control: 'boolean',
      description: 'Loading state: a spinner replaces the chevron.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    autoOptionFocus: {
      control: 'boolean',
      description: 'Visually focuses the first option when the panel opens.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    selectOnFocus: {
      control: 'boolean',
      description: 'Selects the option as soon as it\'s keyboard-focused (single mode).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    focusOnHover: {
      control: 'boolean',
      description: 'Visually focuses the option hovered by the mouse.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    virtualScroll: {
      control: 'boolean',
      description: 'Renders options in a virtual scroll viewport (large lists).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    virtualScrollItemSize: {
      control: 'number',
      description: 'Fixed row height (px) — required by virtual scrolling.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '40' } },
    },
    lazy: {
      control: 'boolean',
      description: 'With `virtualScroll`: emits `lazyLoad` with the rendered range (lazy loading).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    scrollHeight: {
      control: 'text',
      description: 'Max height of the options list (CSS size, e.g. `320px`).',
      table: { type: { summary: 'string' } },
    },
    panelWidth: {
      control: 'text',
      description:
        'Panel width. By default it matches the field\'s; `auto` sizes it to its content (never below the field\'s width); a CSS size (e.g. `260px`) fixes it.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'field width' } },
    },
    label: { control: 'text', description: 'Field label (rendered via `ui-label`).', table: { type: { summary: 'string' } } },
    helperText: { control: 'text', description: 'Helper text under the field.', table: { type: { summary: 'string' } } },
    errorText: { control: 'text', description: 'Message shown instead of the helper text when in error.', table: { type: { summary: 'string' } } },
    size: {
      control: 'inline-radio',
      options: ['default', 'small'],
      description: 'Field size.',
      table: { type: { summary: 'FieldSize' }, defaultValue: { summary: "'default'" } },
    },
    required: { control: 'boolean', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    disabled: { control: 'boolean', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    readonly: { control: 'boolean', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    invalid: {
      control: 'boolean',
      description: 'Forces the error style (automatic when the attached control is invalid and touched/dirty).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    valueChange: { action: 'valueChange', table: { disable: true } },
    opened: { action: 'opened', table: { disable: true } },
    closed: { action: 'closed', table: { disable: true } },
    cleared: { action: 'cleared', table: { disable: true } },
    filterChange: { action: 'filterChange', table: { disable: true } },
    lazyLoad: { action: 'lazyLoad', table: { disable: true } },
  },
  args: {
    label: 'City',
    placeholder: 'Select a city',
    size: 'default',
    multiple: false,
    checkmark: false,
    checkbox: false,
    showClear: false,
    filter: false,
    editable: false,
    loading: false,
    autoOptionFocus: false,
    selectOnFocus: false,
    focusOnHover: true,
    virtualScroll: false,
    lazy: false,
    required: false,
    disabled: false,
    readonly: false,
    invalid: false,
  },
};

export default meta;
type Story = StoryObj<UiSelect>;

// --- Basic : ngModel + options objets (optionLabel / optionValue) --------
export const Basic: Story = {
  render: (args) => ({
    props: { ...args, cities: CITIES, city: null, fruit: null, fruits: ['Apple', 'Pear', 'Cherry'] },
    template: `
      <div style="display:grid; gap:16px; width:280px;">
        <ui-select
          [(ngModel)]="city"
          [options]="cities" optionLabel="name" optionValue="code"
          [label]="label" [placeholder]="placeholder" [size]="size"
          [helperText]="helperText" [errorText]="errorText"
          [multiple]="multiple" [checkmark]="checkmark" [checkbox]="checkbox"
          [showClear]="showClear" [filter]="filter" [editable]="editable" [loading]="loading"
          [autoOptionFocus]="autoOptionFocus" [selectOnFocus]="selectOnFocus" [focusOnHover]="focusOnHover"
          [required]="required" [disabled]="disabled" [readonly]="readonly" [invalid]="invalid"
          (valueChange)="valueChange($event)" (opened)="opened($event)" (closed)="closed($event)" (cleared)="cleared($event)" />
        <ui-select label="Fruit (primitives)" placeholder="Select a fruit" [(ngModel)]="fruit" [options]="fruits" />
        <code>city = {{ city | json }} · fruit = {{ fruit | json }}</code>
      </div>
    `,
  }),
};

// --- Multiple : coche + libellés joints (+ repli maxSelectedLabels) -------
export const Multiple: Story = {
  render: () => ({
    props: { cities: CITIES, model: ['PAR', 'LYO'], limited: ['PAR', 'LYO', 'MRS', 'BOD'] },
    template: `
      <div style="display:grid; gap:16px; width:280px;">
        <ui-select
          label="Cities" placeholder="Select cities"
          [(ngModel)]="model" [options]="cities" optionLabel="name" optionValue="code"
          [multiple]="true" [checkmark]="true" />
        <code>model = {{ model | json }}</code>
        <ui-select
          label="Collapses beyond 2 (maxSelectedLabels)" placeholder="Select cities"
          [(ngModel)]="limited" [options]="cities" optionLabel="name" optionValue="code"
          [multiple]="true" [checkmark]="true" [maxSelectedLabels]="2" />
        <code>limited = {{ limited | json }}</code>
      </div>
    `,
  }),
};

// --- Checkmark : coche sur l'option sélectionnée (mode simple) ------------
export const Checkmark: Story = {
  render: () => ({
    props: { cities: CITIES, model: 'LYO' },
    template: `
      <div style="width:280px;">
        <ui-select label="City" [(ngModel)]="model" [options]="cities" optionLabel="name" optionValue="code" [checkmark]="true" />
      </div>
    `,
  }),
};

// --- Checkbox Selection : multiple + cases + templates #item / #header ----
export const CheckboxSelection: Story = {
  name: 'Checkbox Selection',
  render: () => ({
    props: { cities: CITIES, model: ['PAR'] },
    template: `
      <div style="display:grid; gap:12px; width:280px;">
        <ui-select
          label="Cities" placeholder="Select cities"
          [(ngModel)]="model" [options]="cities" optionLabel="name" optionValue="code"
          [multiple]="true" [checkbox]="true">
          <ng-template #header>Available cities</ng-template>
          <ng-template #item let-city>
            <span style="display:flex; align-items:center; gap:8px;">
              <ui-icon name="location-dot" size="sm" />{{ city.name }}
            </span>
          </ng-template>
        </ui-select>
        <code>model = {{ model | json }}</code>
      </div>
    `,
  }),
};

// --- Chips : ui-chip retirables via #selectedItem (contexte remove) --------
// Largeur volontairement restreinte : les chips passent à la ligne (boîte auto-height).
export const Chips: Story = {
  render: () => ({
    props: { cities: CITIES, model: ['PAR', 'MRS', 'BOD'] },
    template: `
      <div style="display:grid; gap:12px; width:240px;">
        <ui-select
          label="Cities" placeholder="Select cities"
          [(ngModel)]="model" [options]="cities" optionLabel="name" optionValue="code"
          [multiple]="true" [checkmark]="true">
          <ng-template #selectedItem let-city let-remove="remove">
            <ui-chip [label]="city.name" size="small" [removable]="true" (remove)="remove()" />
          </ng-template>
        </ui-select>
        <code>model = {{ model | json }}</code>
      </div>
    `,
  }),
};

// --- Clear : action d'effacement -------------------------------------------
export const Clear: Story = {
  render: () => ({
    props: { cities: CITIES, model: 'PAR' },
    template: `
      <div style="width:280px;">
        <ui-select label="City" [(ngModel)]="model" [options]="cities" optionLabel="name" optionValue="code" [showClear]="true" />
      </div>
    `,
  }),
};

// --- Filter : filtrage intégré ---------------------------------------------
export const Filter: Story = {
  render: () => ({
    props: { cities: CITIES, model: null },
    template: `
      <div style="width:280px;">
        <ui-select
          label="City" placeholder="Select a city"
          [(ngModel)]="model" [options]="cities" optionLabel="name" optionValue="code"
          [filter]="true" filterPlaceholder="Search for a city" />
      </div>
    `,
  }),
};

// --- Custom Option : template #item ----------------------------------------
export const CustomOption: Story = {
  name: 'Custom Option',
  render: () => ({
    props: { cities: CITIES, model: null },
    template: `
      <div style="width:280px;">
        <ui-select label="City" placeholder="Select a city" [(ngModel)]="model" [options]="cities" optionLabel="name" optionValue="code">
          <ng-template #item let-city let-selected="selected">
            <span style="display:flex; align-items:center; gap:8px; min-width:0;">
              <ui-icon [name]="selected ? 'city' : 'location-dot'" size="sm" />
              <span style="overflow:hidden; text-overflow:ellipsis; white-space:nowrap;">{{ city.name }}</span>
              <small style="opacity:.6;">({{ city.code }})</small>
            </span>
          </ng-template>
        </ui-select>
      </div>
    `,
  }),
};

// --- Selected Value : valeur affichée custom (#selectedItem, mode simple) ---
// Le même rendu riche pour l'option (#item) et pour la valeur du champ (#selectedItem).
export const SelectedValue: Story = {
  name: 'Selected Value',
  render: () => ({
    props: { languages: LANGUAGES, model: 'fr' },
    template: `
      <div style="display:grid; gap:12px; width:280px;">
        <ui-select
          label="Language" placeholder="Choose a language"
          [(ngModel)]="model" [options]="languages" optionLabel="label" optionValue="value"
          [filter]="true" filterBy="label" [checkmark]="true">
          <ng-template #selectedItem let-lang>
            <span style="display:flex; align-items:center; gap:8px;">
              <ui-icon [name]="lang.icon" size="sm" />
              <span>{{ lang.label }}</span>
            </span>
          </ng-template>
          <ng-template #item let-lang>
            <span style="display:flex; align-items:center; gap:8px;">
              <ui-icon [name]="lang.icon" size="sm" />
              <span>{{ lang.label }}</span>
            </span>
          </ng-template>
        </ui-select>
        <code>model = {{ model | json }}</code>
      </div>
    `,
  }),
};

// --- Group : options groupées (+ template #group custom) --------------------
export const Group: Story = {
  render: () => ({
    props: { groups: GROUPED_CITIES, simple: null, custom: null },
    template: `
      <div style="display:grid; gap:16px; width:280px;">
        <ui-select
          label="City (simple groups)" placeholder="Select a city"
          [(ngModel)]="simple" [options]="groups" [group]="true" optionLabel="name" optionValue="code" />
        <ui-select
          label="City (custom header)" placeholder="Select a city"
          [(ngModel)]="custom" [options]="groups" [group]="true" optionLabel="name" optionValue="code">
          <ng-template #group let-g>
            <span style="display:flex; align-items:center; gap:8px;">
              <ui-icon name="flag" size="sm" />{{ g.label }} · {{ g.items.length }}
            </span>
          </ng-template>
        </ui-select>
      </div>
    `,
  }),
};

// --- Checkbox and Filter : groupes + cases + filtre --------------------------
export const CheckboxAndFilter: Story = {
  name: 'Checkbox and Filter',
  render: () => ({
    props: { groups: GROUPED_CITIES, model: ['PAR', 'BER'] },
    template: `
      <div style="display:grid; gap:12px; width:320px;">
        <ui-select
          label="Cities" placeholder="Select cities"
          [(ngModel)]="model" [options]="groups" [group]="true" optionLabel="name" optionValue="code"
          [multiple]="true" [checkbox]="true" [filter]="true" filterPlaceholder="Search for a city" />
        <code>model = {{ model | json }}</code>
      </div>
    `,
  }),
};

// --- Sizes --------------------------------------------------------------------
export const Sizes: Story = {
  render: () => ({
    props: { cities: CITIES, a: 'PAR', b: 'PAR' },
    template: `
      <div style="display:grid; gap:16px; width:280px;">
        <ui-select label="Default" [(ngModel)]="a" [options]="cities" optionLabel="name" optionValue="code" />
        <ui-select label="Small" size="small" [(ngModel)]="b" [options]="cities" optionLabel="name" optionValue="code" />
      </div>
    `,
  }),
};

// --- Panel Width : liste décorrélée de la largeur du champ ----------------------
export const PanelWidth: Story = {
  name: 'Panel Width',
  render: () => ({
    props: { cities: LONG_CITIES, a: undefined, b: undefined, c: undefined },
    template: `
      <div style="display:grid; gap:16px; width:180px;">
        <ui-select label="Default" placeholder="City" [(ngModel)]="a" [options]="cities" optionLabel="name" optionValue="code" />
        <ui-select label="auto" placeholder="City" panelWidth="auto" [(ngModel)]="b" [options]="cities" optionLabel="name" optionValue="code" />
        <ui-select label="320px" placeholder="City" panelWidth="320px" [(ngModel)]="c" [options]="cities" optionLabel="name" optionValue="code" />
      </div>
    `,
  }),
};

// --- Disabled (champ entier + option seule) --------------------------------------
export const Disabled: Story = {
  render: () => ({
    props: {
      cities: CITIES,
      whole: 'PAR',
      partial: null,
      mixed: [
        { name: 'Paris', code: 'PAR' },
        { name: 'Lyon', code: 'LYO', inactive: true },
        { name: 'Marseille', code: 'MRS' },
      ],
    },
    template: `
      <div style="display:grid; gap:16px; width:280px;">
        <ui-select label="Disabled field" [(ngModel)]="whole" [options]="cities" optionLabel="name" optionValue="code" [disabled]="true" />
        <ui-select label="Disabled option" placeholder="Lyon is disabled" [(ngModel)]="partial" [options]="mixed" optionLabel="name" optionValue="code" optionDisabled="inactive" />
      </div>
    `,
  }),
};

// --- Invalid : intégration Reactive Forms ------------------------------------------
export const Invalid: Story = {
  render: () => ({
    props: { cities: CITIES, control: new FormControl<string | null>(null, Validators.required) },
    template: `
      <div style="display:grid; gap:12px; width:280px;">
        <ui-select
          label="City" placeholder="Selection required"
          [formControl]="control" [options]="cities" optionLabel="name" optionValue="code"
          [required]="true" errorText="Please select a city." helperText="Choose your home city." />
        <button type="button" (click)="control.markAsTouched()">Mark as touched</button>
        <code>valid = {{ control.valid }}</code>
      </div>
    `,
  }),
};

// --- Signal Forms (@angular/forms/signals) ------------------------------------------
@Component({
  selector: 'demo-select-signal-forms',
  standalone: true,
  imports: [UiSelect, FormField],
  template: `
    <div style="display:grid; gap:12px; width:280px;">
      <ui-select
        label="City" placeholder="Select a city"
        [formField]="city" [options]="cities" optionLabel="name" optionValue="code" />
      <code>value = {{ city().value() }} · valid = {{ city().valid() }}</code>
    </div>
  `,
})
class SignalFormsDemo {
  protected readonly cities = CITIES;
  protected readonly model = signal<string | null>(null);
  protected readonly city = form(this.model, (path) => {
    required(path);
  });
}

export const SignalForms: Story = {
  name: 'Signal Forms',
  render: () => ({ template: `<demo-select-signal-forms />` }),
  decorators: [moduleMetadata({ imports: [SignalFormsDemo] })],
};

// --- Focus Behavior : autoOptionFocus / selectOnFocus / focusOnHover -----------------
export const FocusBehavior: Story = {
  name: 'Focus Behavior',
  render: () => ({
    props: { cities: CITIES, a: null, b: 'LYO', c: null },
    template: `
      <div style="display:grid; gap:16px; width:320px;">
        <ui-select label="autoOptionFocus" helperText="The first option is focused on open."
          [(ngModel)]="a" [options]="cities" optionLabel="name" optionValue="code" [autoOptionFocus]="true" />
        <ui-select label="selectOnFocus" helperText="Arrow keys select while navigating."
          [(ngModel)]="b" [options]="cities" optionLabel="name" optionValue="code" [selectOnFocus]="true" />
        <ui-select label="focusOnHover disabled" helperText="Hovering no longer moves the visual focus."
          [(ngModel)]="c" [options]="cities" optionLabel="name" optionValue="code" [focusOnHover]="false" />
      </div>
    `,
  }),
};

// --- Editable : saisie libre ------------------------------------------------------
export const Editable: Story = {
  render: () => ({
    props: { model: null, suggestions: ['Angular', 'TypeScript', 'RxJS', 'Signals'] },
    template: `
      <div style="display:grid; gap:12px; width:280px;">
        <ui-select label="Technology" placeholder="Type or select" [(ngModel)]="model" [options]="suggestions" [editable]="true" />
        <code>model = {{ model | json }}</code>
      </div>
    `,
  }),
};

// --- Loading ------------------------------------------------------------------------
export const Loading: Story = {
  render: () => ({
    props: { model: null },
    template: `
      <div style="width:280px;">
        <ui-select label="City" placeholder="Loading…" [(ngModel)]="model" [options]="[]" [loading]="true" emptyMessage="Loading cities…" />
      </div>
    `,
  }),
};

// --- Virtual Scroll : 10 000 options --------------------------------------------------
export const VirtualScroll: Story = {
  name: 'Virtual Scroll',
  render: () => ({
    props: { items: MANY_ITEMS, model: null },
    template: `
      <div style="width:280px;">
        <ui-select
          label="Item" placeholder="10,000 options"
          [(ngModel)]="model" [options]="items"
          [virtualScroll]="true" [virtualScrollItemSize]="40" [filter]="true" />
      </div>
    `,
  }),
};

// --- Lazy Virtual Scroll : chargement à la demande -------------------------------------
export const LazyVirtualScroll: Story = {
  name: 'Lazy Virtual Scroll',
  render: () => {
    // Rows materialise as ranges render: unloaded rows show a placeholder label.
    const total = 10000;
    const items: string[] = Array.from({ length: total }, () => 'Loading…');
    return {
      props: {
        items,
        model: null,
        loadedCount: 0,
        onLazyLoad(this: { items: string[]; loadedCount: number }, range: { first: number; last: number }) {
          for (let i = range.first; i < Math.min(range.last + 10, total); i++) {
            if (this.items[i] === 'Loading…') {
              this.items[i] = `Item ${i + 1}`;
              this.loadedCount++;
            }
          }
          this.items = [...this.items];
        },
      },
      template: `
        <div style="display:grid; gap:12px; width:280px;">
          <ui-select
            label="Item" placeholder="Lazy loading"
            [(ngModel)]="model" [options]="items"
            [virtualScroll]="true" [virtualScrollItemSize]="40" [lazy]="true"
            (lazyLoad)="onLazyLoad($event)" />
          <code>rows loaded: {{ loadedCount }}</code>
        </div>
      `,
    };
  },
};
