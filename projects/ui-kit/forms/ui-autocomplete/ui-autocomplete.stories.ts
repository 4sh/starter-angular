import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import { UiAutocomplete, AutocompleteCompleteEvent } from '@4sh/ui-kit/forms/ui-autocomplete';
import { UiIcon } from '@4sh/ui-kit/base/ui-icon';
import { UiChip } from '@4sh/ui-kit/informative/ui-chip';

interface Country {
  name: string;
  code: string;
}

const COUNTRIES: Country[] = [
  { name: 'France', code: 'FR' },
  { name: 'Germany', code: 'DE' },
  { name: 'Spain', code: 'ES' },
  { name: 'Italy', code: 'IT' },
  { name: 'Portugal', code: 'PT' },
  { name: 'Belgium', code: 'BE' },
  { name: 'Switzerland', code: 'CH' },
  { name: 'United Kingdom', code: 'GB' },
  { name: 'Ireland', code: 'IE' },
  { name: 'Netherlands', code: 'NL' },
  { name: 'Austria', code: 'AT' },
  { name: 'Greece', code: 'GR' },
];

const COUNTRY_NAMES = COUNTRIES.map((c) => c.name);

interface CountryGroup {
  label: string;
  items: Country[];
}

const GROUPED_COUNTRIES: CountryGroup[] = [
  {
    label: 'Europe',
    items: [
      { name: 'France', code: 'FR' },
      { name: 'Germany', code: 'DE' },
      { name: 'Spain', code: 'ES' },
      { name: 'Italy', code: 'IT' },
    ],
  },
  {
    label: 'America',
    items: [
      { name: 'Canada', code: 'CA' },
      { name: 'United States', code: 'US' },
      { name: 'Brazil', code: 'BR' },
    ],
  },
  {
    label: 'Asia',
    items: [
      { name: 'Japan', code: 'JP' },
      { name: 'Chine', code: 'CN' },
      { name: 'Inde', code: 'IN' },
    ],
  },
];

const MANY_ITEMS = Array.from({ length: 10000 }, (_, i) => `Item ${i + 1}`);

const norm = (text: string): string =>
  text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');

/** Interactive completer: filters `data` into `results` on each `completeMethod`. */
function completer<T>(data: readonly T[], toText: (item: T) => string) {
  return {
    results: [] as T[],
    complete(event: AutocompleteCompleteEvent): void {
      const q = norm(event.query);
      this.results = data.filter((d) => norm(toText(d)).includes(q));
    },
  };
}

/** Completer simulating an async fetch: toggles `loading` around a delayed filter. */
function asyncCompleter<T>(data: readonly T[], toText: (item: T) => string) {
  return {
    results: [] as T[],
    loading: false,
    complete(event: AutocompleteCompleteEvent): void {
      this.loading = true;
      this.results = [];
      setTimeout(() => {
        const q = norm(event.query);
        this.results = data.filter((d) => norm(toText(d)).includes(q));
        this.loading = false;
      }, 900);
    },
  };
}

/** Completer that filters inside each group and drops the empty ones. */
function groupCompleter(groups: readonly CountryGroup[]) {
  return {
    results: [] as CountryGroup[],
    complete(event: AutocompleteCompleteEvent): void {
      const q = norm(event.query);
      this.results = groups
        .map((g) => ({ ...g, items: g.items.filter((c) => norm(c.name).includes(q)) }))
        .filter((g) => g.items.length > 0);
    },
  };
}

const meta: Meta<UiAutocomplete> = {
  title: 'Components/ui/forms/ui-autocomplete',
  component: UiAutocomplete,
  decorators: [
    moduleMetadata({ imports: [UiAutocomplete, UiIcon, UiChip, CommonModule, FormsModule, ReactiveFormsModule] }),
  ],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=125-2969&t=FXxnMXepNWu6yGqA-1',
    },
  },
  argTypes: {
    suggestions: {
      control: false,
      description: 'Displayed suggestions — filled by the parent in response to `completeMethod`.',
      table: { type: { summary: 'unknown[]' }, defaultValue: { summary: '[]' } },
    },
    optionLabel: {
      control: 'text',
      description: 'Field (dotted path) read as the label when suggestions are objects.',
      table: { type: { summary: 'string' } },
    },
    optionValue: {
      control: 'text',
      description: 'Field (dotted path) carried in the model when suggestions are objects.',
      table: { type: { summary: 'string' } },
    },
    optionDisabled: {
      control: 'text',
      description: 'Field read as a suggestion\'s disabled flag.',
      table: { type: { summary: 'string' } },
    },
    group: {
      control: 'boolean',
      description: 'Treats `suggestions` as groups (`optionGroupLabel` + `optionGroupChildren`).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    optionGroupLabel: {
      control: 'text',
      description: 'Field for a group\'s label.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'label'" } },
    },
    optionGroupChildren: {
      control: 'text',
      description: 'Field containing a group\'s suggestions.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'items'" } },
    },
    placeholder: {
      control: 'text',
      description: 'Native placeholder shown when the field is empty.',
      table: { type: { summary: 'string' } },
    },
    minLength: {
      control: 'number',
      description: 'Minimum number of characters before emitting `completeMethod`.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '1' } },
    },
    delay: {
      control: 'number',
      description: 'Debounce (ms) between the last keystroke and `completeMethod`.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '300' } },
    },
    completeOnFocus: {
      control: 'boolean',
      description: 'Emits a request as soon as focus is gained (before any typing).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    dropdown: {
      control: 'boolean',
      description: 'Shows a trigger button that queries suggestions on click.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    dropdownMode: {
      control: 'inline-radio',
      options: ['blank', 'current'],
      description: '`blank` queries with an empty string, `current` with the current text.',
      table: { type: { summary: "'blank' | 'current'" }, defaultValue: { summary: "'blank'" } },
    },
    forceSelection: {
      control: 'boolean',
      description: 'Clears the input on blur if it matches no suggestion.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    multiple: {
      control: 'boolean',
      description: 'Multiple selection: the model is an array, each pick becomes a removable chip.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    unique: {
      control: 'boolean',
      description: 'With `multiple`: ignores already-selected choices (no duplicates).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    maxSelectedLabels: {
      control: 'number',
      description: 'With `multiple`: max number of chips shown, the rest collapses behind `overflowLabel`.',
      table: { type: { summary: 'number' }, defaultValue: { summary: 'undefined' } },
    },
    overflowLabel: {
      control: 'text',
      description: 'With `multiple`: format of the overflow chip (`{0}` = hidden count).',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'(+{0} more)'" } },
    },
    showClear: {
      control: 'boolean',
      description: 'Shows a clear action when the field contains text.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    loading: {
      control: 'boolean',
      description: 'Loading state: a spinner replaces the trigger during the request.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    emptyMessage: {
      control: 'text',
      description: 'Message shown when a request returns no suggestion.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'No results'" } },
    },
    autoOptionFocus: {
      control: 'boolean',
      description: 'Visual focus on the first suggestion when the panel opens.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    selectOnFocus: {
      control: 'boolean',
      description: 'Applies the value as soon as a suggestion receives visual focus (keyboard).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    focusOnHover: {
      control: 'boolean',
      description: 'Visual focus on the suggestion hovered by the mouse.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    virtualScroll: {
      control: 'boolean',
      description: 'Renders suggestions in a CDK virtual scroll viewport.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    virtualScrollItemSize: {
      control: 'number',
      description: 'Fixed row height (px) — required by the virtual scroller.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '40' } },
    },
    size: {
      control: 'inline-radio',
      options: ['default', 'small'],
      description: 'Field size.',
      table: { type: { summary: "'default' | 'small'" }, defaultValue: { summary: "'default'" } },
    },
    disabled: {
      control: 'boolean',
      description: 'Disables the field (native attribute).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    invalid: {
      control: 'boolean',
      description: 'Forces the error style (automatic when the attached control is invalid + touched).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    label: { control: 'text', description: 'Field label.', table: { type: { summary: 'string' } } },
    helperText: { control: 'text', description: 'Helper text under the field.', table: { type: { summary: 'string' } } },
    completeMethod: { action: 'completeMethod', table: { category: 'Outputs' } },
    optionSelect: { action: 'optionSelect', table: { category: 'Outputs' } },
    optionUnselect: { action: 'optionUnselect', table: { category: 'Outputs' } },
    valueChange: { action: 'valueChange', table: { category: 'Outputs' } },
    cleared: { action: 'cleared', table: { category: 'Outputs' } },
  },
};

export default meta;
type Story = StoryObj<UiAutocomplete>;

/**
 * Contrôle piloté par `ngModel`. La frappe émet `completeMethod` (anti-rebond `delay`,
 * seuil `minLength`) ; le parent renseigne `suggestions`.
 */
export const Basic: Story = {
  render: () => ({
    props: { ...completer(COUNTRY_NAMES, (x) => x), model: null },
    template: `
      <ui-autocomplete
        label="Country"
        placeholder="Type a country…"
        [(ngModel)]="model"
        [suggestions]="results"
        (completeMethod)="complete($event)"
        style="width: 18rem"
      />
    `,
  }),
};

/**
 * `dropdown` ajoute un bouton déclencheur. `dropdownMode` définit sa requête :
 * `blank` (chaîne vide → toutes les suggestions) ou `current` (texte courant).
 */
export const Dropdown: Story = {
  render: () => ({
    props: {
      blank: completer(COUNTRY_NAMES, (x) => x),
      current: completer(COUNTRY_NAMES, (x) => x),
      a: null,
      b: null,
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; width: 18rem">
        <ui-autocomplete
          label="Mode blank"
          placeholder="Click the arrow…"
          [dropdown]="true"
          dropdownMode="blank"
          [(ngModel)]="a"
          [suggestions]="blank.results"
          (completeMethod)="blank.complete($event)"
        />
        <ui-autocomplete
          label="Mode current"
          placeholder="Type then click…"
          [dropdown]="true"
          dropdownMode="current"
          [(ngModel)]="b"
          [suggestions]="current.results"
          (completeMethod)="current.complete($event)"
        />
      </div>
    `,
  }),
};

/** Le template `#item` personnalise le contenu d’une suggestion. */
export const CustomOption: Story = {
  name: 'Custom Option',
  render: () => ({
    props: { ...completer(COUNTRIES, (c) => c.name), model: null },
    template: `
      <ui-autocomplete
        label="Country"
        placeholder="Type a country…"
        optionLabel="name"
        [dropdown]="true"
        [(ngModel)]="model"
        [suggestions]="results"
        (completeMethod)="complete($event)"
        style="width: 20rem"
      >
        <ng-template #item let-country>
          <span style="display: inline-flex; align-items: center; gap: .5rem">
            <ui-icon name="location-dot" size="sm" />
            <strong>{{ country.name }}</strong>
            <span style="color: var(--form-low-content-default)">{{ country.code }}</span>
          </span>
        </ng-template>
      </ui-autocomplete>
    `,
  }),
};

/**
 * `group` regroupe les suggestions par catégorie (`optionGroupLabel` +
 * `optionGroupChildren`). Le template `#group` personnalise l’en-tête de groupe.
 */
export const Group: Story = {
  render: () => ({
    props: {
      simple: groupCompleter(GROUPED_COUNTRIES),
      custom: groupCompleter(GROUPED_COUNTRIES),
      a: null,
      b: null,
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; width: 20rem">
        <ui-autocomplete
          label="Simple"
          placeholder="Type a country…"
          [group]="true"
          optionLabel="name"
          optionGroupLabel="label"
          optionGroupChildren="items"
          [dropdown]="true"
          [(ngModel)]="a"
          [suggestions]="simple.results"
          (completeMethod)="simple.complete($event)"
        />
        <ui-autocomplete
          label="Custom"
          placeholder="Type a country…"
          [group]="true"
          optionLabel="name"
          optionGroupLabel="label"
          optionGroupChildren="items"
          [dropdown]="true"
          [(ngModel)]="b"
          [suggestions]="custom.results"
          (completeMethod)="custom.complete($event)"
        >
          <ng-template #group let-group>
            <span style="display: inline-flex; align-items: center; gap: .5rem">
              <ui-icon name="earth-europe" size="sm" />
              {{ group.label }}
            </span>
          </ng-template>
        </ui-autocomplete>
      </div>
    `,
  }),
};

/**
 * `multiple` : le modèle est un tableau, chaque choix devient une chip supprimable
 * (× ou Backspace input vide) ; `unique` (défaut) ignore les doublons.
 * `maxSelectedLabels` replie le surplus derrière une chip `overflowLabel`, et
 * `forceSelection` efface au blur toute saisie non reconnue sans toucher à la sélection.
 */
export const Multiple: Story = {
  render: () => ({
    props: {
      a: completer(COUNTRIES, (c) => c.name),
      b: completer(COUNTRIES, (c) => c.name),
      c: completer(COUNTRIES, (c) => c.name),
      model: [COUNTRIES[0]],
      limited: [COUNTRIES[0], COUNTRIES[1], COUNTRIES[2]],
      forced: [],
    },
    template: `
      <div style="display: grid; gap: 1rem; width: 20rem">
        <ui-autocomplete
          label="Country"
          placeholder="Type a country…"
          [multiple]="true"
          optionLabel="name"
          dataKey="code"
          [dropdown]="true"
          [(ngModel)]="model"
          [suggestions]="a.results"
          (completeMethod)="a.complete($event)"
        />
        <code>model = {{ model | json }}</code>
        <ui-autocomplete
          label="Collapses beyond 2 (maxSelectedLabels)"
          placeholder="Type a country…"
          [multiple]="true"
          [maxSelectedLabels]="2"
          optionLabel="name"
          dataKey="code"
          [dropdown]="true"
          [(ngModel)]="limited"
          [suggestions]="b.results"
          (completeMethod)="b.complete($event)"
        />
        <code>limited = {{ limited | json }}</code>
        <ui-autocomplete
          label="Forced selection"
          placeholder="Type then leave the field…"
          helperText="Unrecognized input is cleared, the selection stays."
          [multiple]="true"
          [forceSelection]="true"
          optionLabel="name"
          dataKey="code"
          [dropdown]="true"
          [(ngModel)]="forced"
          [suggestions]="c.results"
          (completeMethod)="c.complete($event)"
        />
        <code>forced = {{ forced | json }}</code>
      </div>
    `,
  }),
};

/**
 * En mode `multiple`, le template `#selectedItem` remplace entièrement le rendu par défaut
 * des valeurs sélectionnées : ici des `ui-chip` personnalisées, retirables via le callback
 * `remove` du contexte.
 */
export const CustomSelectedItem: Story = {
  render: () => ({
    props: { ...completer(COUNTRIES, (c) => c.name), model: [COUNTRIES[0], COUNTRIES[1]] },
    template: `
      <div style="display: grid; gap: 1rem; width: 20rem">
        <ui-autocomplete
          label="Country"
          placeholder="Type a country…"
          [multiple]="true"
          optionLabel="name"
          dataKey="code"
          [dropdown]="true"
          [(ngModel)]="model"
          [suggestions]="results"
          (completeMethod)="complete($event)"
        >
          <ng-template #selectedItem let-country let-remove="remove">
            <ui-chip [label]="country.name" level="highlight" size="small" [removable]="true" (remove)="remove()" />
          </ng-template>
        </ui-autocomplete>
        <code>model = {{ model | json }}</code>
      </div>
    `,
  }),
};

/**
 * `forceSelection` : au blur, une saisie qui ne correspond à aucune suggestion est
 * effacée — le modèle ne porte jamais que l’une des suggestions.
 */
export const ForceSelection: Story = {
  name: 'Force Selection',
  render: () => ({
    props: { ...completer(COUNTRY_NAMES, (x) => x), model: null },
    template: `
      <ui-autocomplete
        label="Country (forced selection)"
        placeholder="Type then leave the field…"
        helperText="Unrecognized input is cleared."
        [forceSelection]="true"
        [dropdown]="true"
        [(ngModel)]="model"
        [suggestions]="results"
        (completeMethod)="complete($event)"
        style="width: 20rem"
      />
    `,
  }),
};

/** `showClear` affiche une icône d’effacement qui réinitialise la valeur. */
export const ClearIcon: Story = {
  name: 'Clear Icon',
  render: () => ({
    props: { ...completer(COUNTRY_NAMES, (x) => x), model: 'France' },
    template: `
      <ui-autocomplete
        label="Country"
        [showClear]="true"
        [dropdown]="true"
        [(ngModel)]="model"
        [suggestions]="results"
        (completeMethod)="complete($event)"
        style="width: 18rem"
      />
    `,
  }),
};

/**
 * `loading` compose un indicateur de chargement à la place du déclencheur pendant
 * qu’une requête asynchrone est en cours.
 */
export const Loading: Story = {
  render: () => ({
    props: { ...asyncCompleter(COUNTRY_NAMES, (x) => x), model: null },
    template: `
      <ui-autocomplete
        label="Country (async search)"
        placeholder="Type a country…"
        [loading]="loading"
        [(ngModel)]="model"
        [suggestions]="results"
        (completeMethod)="complete($event)"
        style="width: 20rem"
      />
    `,
  }),
};

/** Tailles `default` et `small`. */
export const Sizes: Story = {
  render: () => ({
    props: {
      d: completer(COUNTRY_NAMES, (x) => x),
      s: completer(COUNTRY_NAMES, (x) => x),
      a: null,
      b: null,
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; width: 18rem">
        <ui-autocomplete label="Default" size="default" [dropdown]="true"
          [(ngModel)]="a" [suggestions]="d.results" (completeMethod)="d.complete($event)" />
        <ui-autocomplete label="Small" size="small" [dropdown]="true"
          [(ngModel)]="b" [suggestions]="s.results" (completeMethod)="s.complete($event)" />
      </div>
    `,
  }),
};

/** `disabled` : le champ ne peut être ni édité ni focalisé. */
export const Disabled: Story = {
  render: () => ({
    props: { ...completer(COUNTRY_NAMES, (x) => x), model: 'France' },
    template: `
      <ui-autocomplete
        label="Country"
        [disabled]="true"
        [dropdown]="true"
        [(ngModel)]="model"
        [suggestions]="results"
        (completeMethod)="complete($event)"
        style="width: 18rem"
      />
    `,
  }),
};

/**
 * L’état d’erreur s’applique via `invalid`, intégrable aux formulaires Angular
 * (ici un `FormControl` requis, marqué invalide une fois touché).
 */
export const Invalid: Story = {
  render: () => ({
    props: {
      ...completer(COUNTRY_NAMES, (x) => x),
      control: new FormControl<string | null>(null, Validators.required),
    },
    template: `
      <ui-autocomplete
        label="Country"
        placeholder="Required field"
        errorText="Select a country."
        [dropdown]="true"
        [formControl]="control"
        [suggestions]="results"
        (completeMethod)="complete($event)"
        style="width: 18rem"
      />
    `,
  }),
};

// --- Signal Forms (@angular/forms/signals) ------------------------------
@Component({
  selector: 'demo-autocomplete-signal-forms',
  standalone: true,
  imports: [UiAutocomplete, FormField],
  template: `
    <div style="width: 18rem; display: grid; gap: 12px; justify-items: start;">
      <ui-autocomplete
        label="Country"
        placeholder="Type a country…"
        [dropdown]="true"
        [formField]="country"
        [suggestions]="results()"
        (completeMethod)="complete($event)"
      />
      <code>value = {{ country().value() ?? 'null' }} · valid = {{ country().valid() }}</code>
    </div>
  `,
})
class SignalFormsDemo {
  protected readonly results = signal<string[]>([]);
  protected readonly model = signal<string | null>(null);
  protected readonly country = form(this.model, (path) => {
    required(path);
  });

  protected complete(event: AutocompleteCompleteEvent): void {
    const q = norm(event.query);
    this.results.set(COUNTRY_NAMES.filter((name) => norm(name).includes(q)));
  }
}

export const SignalForms: Story = {
  name: 'Signal Forms',
  render: () => ({ template: `<demo-autocomplete-signal-forms />` }),
  decorators: [moduleMetadata({ imports: [SignalFormsDemo] })],
};

/**
 * Comportement de focus configurable : `autoOptionFocus` (focus initial),
 * `selectOnFocus` (sélection au focus clavier), `focusOnHover` (focus au survol).
 */
export const FocusBehavior: Story = {
  name: 'Focus Behavior',
  render: () => ({
    props: {
      a: completer(COUNTRY_NAMES, (x) => x),
      b: completer(COUNTRY_NAMES, (x) => x),
      m1: null,
      m2: null,
    },
    template: `
      <div style="display: flex; flex-direction: column; gap: 1.5rem; width: 20rem">
        <ui-autocomplete label="autoOptionFocus + selectOnFocus"
          [autoOptionFocus]="true" [selectOnFocus]="true" [dropdown]="true"
          [(ngModel)]="m1" [suggestions]="a.results" (completeMethod)="a.complete($event)" />
        <ui-autocomplete label="focusOnHover = false"
          [focusOnHover]="false" [dropdown]="true"
          [(ngModel)]="m2" [suggestions]="b.results" (completeMethod)="b.complete($event)" />
      </div>
    `,
  }),
};

/**
 * Suggestions objet : `optionLabel` définit le label affiché ; la valeur portée dans
 * le modèle reste l’instance de l’objet (ici `{ name, code }`).
 */
export const Objects: Story = {
  render: () => ({
    props: { ...completer(COUNTRIES, (c) => c.name), model: null },
    template: `
      <ui-autocomplete
        label="Country"
        placeholder="Type a country…"
        optionLabel="name"
        [dropdown]="true"
        [(ngModel)]="model"
        [suggestions]="results"
        (completeMethod)="complete($event)"
        style="width: 20rem"
      />
      <p style="margin-top: 1rem; font-size: .85rem; color: var(--form-low-content-default)">
        Model: {{ model | json }}
      </p>
    `,
  }),
};

/** Défilement virtuel : jusqu’à 10 000 suggestions rendues par fenêtre. */
export const VirtualScroll: Story = {
  name: 'Virtual Scroll',
  render: () => ({
    props: { ...completer(MANY_ITEMS, (x) => x), model: null },
    template: `
      <ui-autocomplete
        label="Large list"
        placeholder="Type “Item”…"
        [dropdown]="true"
        [virtualScroll]="true"
        [virtualScrollItemSize]="40"
        [(ngModel)]="model"
        [suggestions]="results"
        (completeMethod)="complete($event)"
        style="width: 20rem"
      />
    `,
  }),
};
