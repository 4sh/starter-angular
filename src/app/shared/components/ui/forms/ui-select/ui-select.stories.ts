import { CommonModule } from '@angular/common';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { UiSelect } from './ui-select';
import { UiChip } from '@app/shared/components/ui/informative/ui-chip/ui-chip';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';

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
    label: 'Allemagne',
    code: 'DE',
    items: [
      { name: 'Berlin', code: 'BER' },
      { name: 'Munich', code: 'MUC' },
      { name: 'Hambourg', code: 'HAM' },
    ],
  },
  {
    label: 'Espagne',
    code: 'ES',
    items: [
      { name: 'Madrid', code: 'MAD' },
      { name: 'Barcelone', code: 'BCN' },
    ],
  },
];

const MANY_ITEMS = Array.from({ length: 10000 }, (_, i) => `Élément ${i + 1}`);

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
      description: 'Options à afficher (primitives, objets, ou groupes avec `group`).',
      table: { type: { summary: 'unknown[]' }, defaultValue: { summary: '[]' } },
    },
    optionLabel: {
      control: 'text',
      description: 'Nom du champ (chemin pointé) lu comme label quand les options sont des objets.',
      table: { type: { summary: 'string' } },
    },
    optionValue: {
      control: 'text',
      description: 'Nom du champ (chemin pointé) lu comme valeur quand les options sont des objets.',
      table: { type: { summary: 'string' } },
    },
    optionDisabled: {
      control: 'text',
      description: 'Nom du champ lu comme drapeau de désactivation d’une option.',
      table: { type: { summary: 'string' } },
    },
    group: {
      control: 'boolean',
      description: 'Traite `options` comme des groupes (`optionGroupLabel` + `optionGroupChildren`).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    optionGroupLabel: {
      control: 'text',
      description: 'Nom du champ label d’un groupe.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'label'" } },
    },
    optionGroupChildren: {
      control: 'text',
      description: 'Nom du champ contenant les options d’un groupe.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'items'" } },
    },
    dataKey: {
      control: 'text',
      description: 'Propriété comparée pour l’égalité des valeurs objet (sélection).',
      table: { type: { summary: 'string' } },
    },
    multiple: {
      control: 'boolean',
      description: 'Sélection multiple : le modèle devient un tableau, le panneau reste ouvert.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    checkmark: {
      control: 'boolean',
      description: 'Affiche une coche sur la ou les options sélectionnées.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    checkbox: {
      control: 'boolean',
      description: 'Affiche une case à cocher devant chaque option (mode `multiple`).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    maxSelectedLabels: {
      control: 'number',
      description: 'Nombre max d’éléments sélectionnés affichés dans le champ (`multiple`) ; le reste est replié dans `overflowLabel`.',
      table: { type: { summary: 'number' } },
    },
    overflowLabel: {
      control: 'text',
      description: 'Indicateur de repli — `{0}` est remplacé par le nombre d’éléments masqués.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'(+{0} autres)'" } },
    },
    placeholder: {
      control: 'text',
      description: 'Texte affiché quand aucune valeur n’est sélectionnée.',
      table: { type: { summary: 'string' } },
    },
    showClear: {
      control: 'boolean',
      description: 'Affiche une action d’effacement (×) quand une valeur est définie.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    filter: {
      control: 'boolean',
      description: 'Affiche le champ de filtrage intégré dans le panneau.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    filterPlaceholder: {
      control: 'text',
      description: 'Placeholder du champ de filtrage.',
      table: { type: { summary: 'string' } },
    },
    filterBy: {
      control: 'text',
      description: 'Champs (chemins pointés, séparés par des virgules) comparés par le filtre — label par défaut.',
      table: { type: { summary: 'string' } },
    },
    editable: {
      control: 'boolean',
      description: 'Saisie libre : le déclencheur devient un `<input>`, la frappe fixe directement la valeur.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    loading: {
      control: 'boolean',
      description: 'État de chargement : un spinner remplace le chevron.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    autoOptionFocus: {
      control: 'boolean',
      description: 'Focalise visuellement la première option à l’ouverture du panneau.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    selectOnFocus: {
      control: 'boolean',
      description: 'Sélectionne l’option dès qu’elle est focalisée au clavier (mode simple).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    focusOnHover: {
      control: 'boolean',
      description: 'Focalise visuellement l’option survolée à la souris.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    virtualScroll: {
      control: 'boolean',
      description: 'Rend les options dans un viewport de défilement virtuel (listes volumineuses).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    virtualScrollItemSize: {
      control: 'number',
      description: 'Hauteur fixe (px) d’une ligne — requise par le défilement virtuel.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '40' } },
    },
    lazy: {
      control: 'boolean',
      description: 'Avec `virtualScroll` : émet `lazyLoad` avec la plage rendue (chargement paresseux).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    scrollHeight: {
      control: 'text',
      description: 'Hauteur max de la liste d’options (taille CSS, ex. `320px`).',
      table: { type: { summary: 'string' } },
    },
    label: { control: 'text', description: 'Label du champ (rendu via `ui-label`).', table: { type: { summary: 'string' } } },
    helperText: { control: 'text', description: 'Texte d’aide sous le champ.', table: { type: { summary: 'string' } } },
    errorText: { control: 'text', description: 'Message affiché à la place de l’aide en erreur.', table: { type: { summary: 'string' } } },
    size: {
      control: 'inline-radio',
      options: ['default', 'small'],
      description: 'Taille du champ.',
      table: { type: { summary: 'FieldSize' }, defaultValue: { summary: "'default'" } },
    },
    required: { control: 'boolean', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    disabled: { control: 'boolean', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    readonly: { control: 'boolean', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    invalid: {
      control: 'boolean',
      description: 'Force le style erreur (automatique quand le contrôle attaché est invalide et touched/dirty).',
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
    label: 'Ville',
    placeholder: 'Sélectionner une ville',
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
    props: { ...args, cities: CITIES, city: null, fruit: null, fruits: ['Pomme', 'Poire', 'Cerise'] },
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
        <ui-select label="Fruit (primitives)" placeholder="Sélectionner un fruit" [(ngModel)]="fruit" [options]="fruits" />
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
          label="Villes" placeholder="Sélectionner des villes"
          [(ngModel)]="model" [options]="cities" optionLabel="name" optionValue="code"
          [multiple]="true" [checkmark]="true" />
        <ui-select
          label="Repli au-delà de 2 (maxSelectedLabels)" placeholder="Sélectionner des villes"
          [(ngModel)]="limited" [options]="cities" optionLabel="name" optionValue="code"
          [multiple]="true" [checkmark]="true" [maxSelectedLabels]="2" />
        <code>model = {{ model | json }} · limited = {{ limited | json }}</code>
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
        <ui-select label="Ville" [(ngModel)]="model" [options]="cities" optionLabel="name" optionValue="code" [checkmark]="true" />
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
          label="Villes" placeholder="Sélectionner des villes"
          [(ngModel)]="model" [options]="cities" optionLabel="name" optionValue="code"
          [multiple]="true" [checkbox]="true">
          <ng-template #header>Villes disponibles</ng-template>
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
          label="Villes" placeholder="Sélectionner des villes"
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
        <ui-select label="Ville" [(ngModel)]="model" [options]="cities" optionLabel="name" optionValue="code" [showClear]="true" />
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
          label="Ville" placeholder="Sélectionner une ville"
          [(ngModel)]="model" [options]="cities" optionLabel="name" optionValue="code"
          [filter]="true" filterPlaceholder="Rechercher une ville" />
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
        <ui-select label="Ville" placeholder="Sélectionner une ville" [(ngModel)]="model" [options]="cities" optionLabel="name" optionValue="code">
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

// --- Group : options groupées (+ template #group custom) --------------------
export const Group: Story = {
  render: () => ({
    props: { groups: GROUPED_CITIES, simple: null, custom: null },
    template: `
      <div style="display:grid; gap:16px; width:280px;">
        <ui-select
          label="Ville (groupes simples)" placeholder="Sélectionner une ville"
          [(ngModel)]="simple" [options]="groups" [group]="true" optionLabel="name" optionValue="code" />
        <ui-select
          label="Ville (en-tête custom)" placeholder="Sélectionner une ville"
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
          label="Villes" placeholder="Sélectionner des villes"
          [(ngModel)]="model" [options]="groups" [group]="true" optionLabel="name" optionValue="code"
          [multiple]="true" [checkbox]="true" [filter]="true" filterPlaceholder="Rechercher une ville" />
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
        <ui-select label="Champ désactivé" [(ngModel)]="whole" [options]="cities" optionLabel="name" optionValue="code" [disabled]="true" />
        <ui-select label="Option désactivée" placeholder="Lyon est désactivée" [(ngModel)]="partial" [options]="mixed" optionLabel="name" optionValue="code" optionDisabled="inactive" />
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
          label="Ville" placeholder="Sélection obligatoire"
          [formControl]="control" [options]="cities" optionLabel="name" optionValue="code"
          [required]="true" errorText="Veuillez sélectionner une ville." helperText="Choisissez votre ville de rattachement." />
        <button type="button" (click)="control.markAsTouched()">Marquer touched</button>
        <code>valid = {{ control.valid }}</code>
      </div>
    `,
  }),
};

// --- Focus Behavior : autoOptionFocus / selectOnFocus / focusOnHover -----------------
export const FocusBehavior: Story = {
  name: 'Focus Behavior',
  render: () => ({
    props: { cities: CITIES, a: null, b: 'LYO', c: null },
    template: `
      <div style="display:grid; gap:16px; width:320px;">
        <ui-select label="autoOptionFocus" helperText="La 1re option est focalisée à l'ouverture."
          [(ngModel)]="a" [options]="cities" optionLabel="name" optionValue="code" [autoOptionFocus]="true" />
        <ui-select label="selectOnFocus" helperText="Les flèches sélectionnent en naviguant."
          [(ngModel)]="b" [options]="cities" optionLabel="name" optionValue="code" [selectOnFocus]="true" />
        <ui-select label="focusOnHover désactivé" helperText="Le survol ne déplace plus le focus visuel."
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
        <ui-select label="Technologie" placeholder="Saisir ou sélectionner" [(ngModel)]="model" [options]="suggestions" [editable]="true" />
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
        <ui-select label="Ville" placeholder="Chargement…" [(ngModel)]="model" [options]="[]" [loading]="true" emptyMessage="Chargement des villes…" />
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
          label="Élément" placeholder="10 000 options"
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
    const items: string[] = Array.from({ length: total }, () => 'Chargement…');
    return {
      props: {
        items,
        model: null,
        loadedCount: 0,
        onLazyLoad(this: { items: string[]; loadedCount: number }, range: { first: number; last: number }) {
          for (let i = range.first; i < Math.min(range.last + 10, total); i++) {
            if (this.items[i] === 'Chargement…') {
              this.items[i] = `Élément ${i + 1}`;
              this.loadedCount++;
            }
          }
          this.items = [...this.items];
        },
      },
      template: `
        <div style="display:grid; gap:12px; width:280px;">
          <ui-select
            label="Élément" placeholder="Chargement paresseux"
            [(ngModel)]="model" [options]="items"
            [virtualScroll]="true" [virtualScrollItemSize]="40" [lazy]="true"
            (lazyLoad)="onLazyLoad($event)" />
          <code>lignes chargées : {{ loadedCount }}</code>
        </div>
      `,
    };
  },
};
