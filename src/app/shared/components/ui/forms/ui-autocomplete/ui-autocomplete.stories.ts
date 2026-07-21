import { CommonModule } from '@angular/common';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { UiAutocomplete, AutocompleteCompleteEvent } from './ui-autocomplete';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';

interface Country {
  name: string;
  code: string;
}

const COUNTRIES: Country[] = [
  { name: 'France', code: 'FR' },
  { name: 'Allemagne', code: 'DE' },
  { name: 'Espagne', code: 'ES' },
  { name: 'Italie', code: 'IT' },
  { name: 'Portugal', code: 'PT' },
  { name: 'Belgique', code: 'BE' },
  { name: 'Suisse', code: 'CH' },
  { name: 'Royaume-Uni', code: 'GB' },
  { name: 'Irlande', code: 'IE' },
  { name: 'Pays-Bas', code: 'NL' },
  { name: 'Autriche', code: 'AT' },
  { name: 'Grèce', code: 'GR' },
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
      { name: 'Allemagne', code: 'DE' },
      { name: 'Espagne', code: 'ES' },
      { name: 'Italie', code: 'IT' },
    ],
  },
  {
    label: 'Amérique',
    items: [
      { name: 'Canada', code: 'CA' },
      { name: 'États-Unis', code: 'US' },
      { name: 'Brésil', code: 'BR' },
    ],
  },
  {
    label: 'Asie',
    items: [
      { name: 'Japon', code: 'JP' },
      { name: 'Chine', code: 'CN' },
      { name: 'Inde', code: 'IN' },
    ],
  },
];

const MANY_ITEMS = Array.from({ length: 10000 }, (_, i) => `Élément ${i + 1}`);

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
  decorators: [moduleMetadata({ imports: [UiAutocomplete, UiIcon, CommonModule, FormsModule, ReactiveFormsModule] })],
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
      description: 'Suggestions affichées — remplies par le parent en réponse à `completeMethod`.',
      table: { type: { summary: 'unknown[]' }, defaultValue: { summary: '[]' } },
    },
    optionLabel: {
      control: 'text',
      description: 'Champ (chemin pointé) lu comme label quand les suggestions sont des objets.',
      table: { type: { summary: 'string' } },
    },
    optionValue: {
      control: 'text',
      description: 'Champ (chemin pointé) porté dans le modèle quand les suggestions sont des objets.',
      table: { type: { summary: 'string' } },
    },
    optionDisabled: {
      control: 'text',
      description: 'Champ lu comme drapeau de désactivation d’une suggestion.',
      table: { type: { summary: 'string' } },
    },
    group: {
      control: 'boolean',
      description: 'Traite `suggestions` comme des groupes (`optionGroupLabel` + `optionGroupChildren`).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    optionGroupLabel: {
      control: 'text',
      description: 'Champ label d’un groupe.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'label'" } },
    },
    optionGroupChildren: {
      control: 'text',
      description: 'Champ contenant les suggestions d’un groupe.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'items'" } },
    },
    placeholder: {
      control: 'text',
      description: 'Placeholder natif affiché quand le champ est vide.',
      table: { type: { summary: 'string' } },
    },
    minLength: {
      control: 'number',
      description: 'Nombre minimal de caractères avant d’émettre `completeMethod`.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '1' } },
    },
    delay: {
      control: 'number',
      description: 'Anti-rebond (ms) entre la dernière frappe et `completeMethod`.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '300' } },
    },
    completeOnFocus: {
      control: 'boolean',
      description: 'Émet une requête dès la prise de focus (avant toute frappe).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    dropdown: {
      control: 'boolean',
      description: 'Affiche un bouton déclencheur qui interroge les suggestions au clic.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    dropdownMode: {
      control: 'inline-radio',
      options: ['blank', 'current'],
      description: '`blank` interroge avec une chaîne vide, `current` avec le texte courant.',
      table: { type: { summary: "'blank' | 'current'" }, defaultValue: { summary: "'blank'" } },
    },
    forceSelection: {
      control: 'boolean',
      description: 'Vide la saisie au blur si elle ne correspond à aucune suggestion.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    showClear: {
      control: 'boolean',
      description: 'Affiche une action d’effacement quand le champ contient du texte.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    loading: {
      control: 'boolean',
      description: 'État de chargement : un spinner remplace le déclencheur pendant la requête.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    emptyMessage: {
      control: 'text',
      description: 'Message affiché quand une requête ne renvoie aucune suggestion.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'Aucun résultat'" } },
    },
    autoOptionFocus: {
      control: 'boolean',
      description: 'Focus visuel sur la première suggestion à l’ouverture du panneau.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    selectOnFocus: {
      control: 'boolean',
      description: 'Applique la valeur dès qu’une suggestion reçoit le focus visuel (clavier).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    focusOnHover: {
      control: 'boolean',
      description: 'Focus visuel sur la suggestion survolée par la souris.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    virtualScroll: {
      control: 'boolean',
      description: 'Rend les suggestions dans un viewport de défilement virtuel CDK.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    virtualScrollItemSize: {
      control: 'number',
      description: 'Hauteur fixe (px) d’une ligne — requise par le scroller virtuel.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '40' } },
    },
    size: {
      control: 'inline-radio',
      options: ['default', 'small'],
      description: 'Taille du champ.',
      table: { type: { summary: "'default' | 'small'" }, defaultValue: { summary: "'default'" } },
    },
    disabled: {
      control: 'boolean',
      description: 'Désactive le champ (attribut natif).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    invalid: {
      control: 'boolean',
      description: 'Force le style d’erreur (auto quand le contrôle attaché est invalide + touché).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    label: { control: 'text', description: 'Libellé du champ.', table: { type: { summary: 'string' } } },
    helperText: { control: 'text', description: 'Texte d’aide sous le champ.', table: { type: { summary: 'string' } } },
    completeMethod: { action: 'completeMethod', table: { category: 'Outputs' } },
    optionSelect: { action: 'optionSelect', table: { category: 'Outputs' } },
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
        label="Pays"
        placeholder="Tapez un pays…"
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
          placeholder="Cliquez la flèche…"
          [dropdown]="true"
          dropdownMode="blank"
          [(ngModel)]="a"
          [suggestions]="blank.results"
          (completeMethod)="blank.complete($event)"
        />
        <ui-autocomplete
          label="Mode current"
          placeholder="Tapez puis cliquez…"
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
        label="Pays"
        placeholder="Tapez un pays…"
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
          placeholder="Tapez un pays…"
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
          placeholder="Tapez un pays…"
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
 * `forceSelection` : au blur, une saisie qui ne correspond à aucune suggestion est
 * effacée — le modèle ne porte jamais que l’une des suggestions.
 */
export const ForceSelection: Story = {
  name: 'Force Selection',
  render: () => ({
    props: { ...completer(COUNTRY_NAMES, (x) => x), model: null },
    template: `
      <ui-autocomplete
        label="Pays (sélection forcée)"
        placeholder="Tapez puis quittez le champ…"
        helperText="Une saisie non reconnue est effacée."
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
        label="Pays"
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
        label="Pays (recherche asynchrone)"
        placeholder="Tapez un pays…"
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
        label="Pays"
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
        label="Pays"
        placeholder="Champ requis"
        errorText="Sélectionnez un pays."
        [dropdown]="true"
        [formControl]="control"
        [suggestions]="results"
        (completeMethod)="complete($event)"
        style="width: 18rem"
      />
    `,
  }),
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
        label="Pays"
        placeholder="Tapez un pays…"
        optionLabel="name"
        [dropdown]="true"
        [(ngModel)]="model"
        [suggestions]="results"
        (completeMethod)="complete($event)"
        style="width: 20rem"
      />
      <p style="margin-top: 1rem; font-size: .85rem; color: var(--form-low-content-default)">
        Modèle : {{ model | json }}
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
        label="Grande liste"
        placeholder="Tapez « Élément »…"
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
