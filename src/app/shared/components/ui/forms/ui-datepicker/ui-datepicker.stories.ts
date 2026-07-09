import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { UiDatepicker } from './ui-datepicker';
import { UiButton } from '@app/shared/components/ui/actions/ui-button/ui-button';

const meta: Meta<UiDatepicker> = {
  title: 'Components/ui/forms/ui-datepicker',
  component: UiDatepicker,
  decorators: [moduleMetadata({ imports: [UiDatepicker, FormsModule, UiButton] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=2022-2453&t=PXOwFotKvf72dn1c-1',
    },
  },
  argTypes: {
    label: { control: 'text', table: { type: { summary: 'string' } } },
    placeholder: { control: 'text', table: { type: { summary: 'string' } } },
    helperText: { control: 'text', description: "Texte d'aide (via ui-helper).", table: { type: { summary: 'string' } } },
    errorText: { control: 'text', description: "Message affiché à la place de l'aide quand en erreur.", table: { type: { summary: 'string' } } },
    size: { control: 'inline-radio', options: ['default', 'small'], table: { type: { summary: 'FieldSize' }, defaultValue: { summary: '"default"' } } },
    level: { control: 'inline-radio', options: ['default', 'success', 'error'], table: { type: { summary: 'FieldLevel' }, defaultValue: { summary: '"default"' } } },
    selectionMode: { control: 'inline-radio', options: ['single', 'multiple', 'range'], table: { type: { summary: 'DatepickerSelectionMode' }, defaultValue: { summary: '"single"' } } },
    view: { control: 'inline-radio', options: ['date', 'month', 'year'], description: 'Granularité de base (aussi MonthPicker/YearPicker).', table: { type: { summary: 'DatepickerView' }, defaultValue: { summary: '"date"' } } },
    numberOfMonths: { control: { type: 'number', min: 1, max: 3 }, table: { type: { summary: 'number' }, defaultValue: { summary: '1' } } },
    icon: { control: 'text', table: { type: { summary: 'string' }, defaultValue: { summary: '"calendar"' } } },
    firstDayOfWeek: { control: { type: 'number', min: 0, max: 6 }, table: { type: { summary: 'number' }, defaultValue: { summary: '1' } } },
    locale: { control: 'text', table: { type: { summary: 'string' } } },
    showTime: { control: 'boolean', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    timeOnly: { control: 'boolean', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    hourFormat: { control: 'inline-radio', options: ['24', '12'], table: { type: { summary: "'12' | '24'" }, defaultValue: { summary: '"24"' } } },
    showButtonBar: { control: 'boolean', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    inline: { control: 'boolean', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    showClear: { control: 'boolean', description: 'Affiche une croix pour effacer la valeur quand elle est renseignée.', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    autoFlip: { control: 'boolean', description: "Retourne le panneau vers le haut si l'espace manque en bas.", table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } } },
    closeOnSelect: { control: 'boolean', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } } },
    required: { control: 'boolean', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    disabled: { control: 'boolean', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    readonly: { control: 'boolean', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    invalid: { control: 'boolean', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    valueChange: { action: 'valueChange', table: { disable: true } },
    dateSelect: { action: 'dateSelect', table: { disable: true } },
    monthChange: { action: 'monthChange', table: { disable: true } },
    opened: { action: 'opened', table: { disable: true } },
    closed: { action: 'closed', table: { disable: true } },
    cleared: { action: 'cleared', table: { disable: true } },
  },
  args: {
    label: 'Date',
    placeholder: 'jj/mm/aaaa',
    size: 'default',
    level: 'default',
    hourFormat: '24',
    firstDayOfWeek: 1,
    icon: 'calendar',
    // Concrete defaults so template bindings never pass `undefined` (which would
    // override the component's own input defaults).
    selectionMode: 'single',
    view: 'date',
    numberOfMonths: 1,
    showTime: false,
    timeOnly: false,
    showButtonBar: false,
    inline: false,
    showClear: false,
    autoFlip: true,
    closeOnSelect: true,
    required: false,
    disabled: false,
    readonly: false,
    invalid: false,
    disabledDays: [],
  },
};

export default meta;
type Story = StoryObj<UiDatepicker>;

const TEMPLATE = `<div style="width:260px"><ui-datepicker
    [(ngModel)]="model"
    [label]="label" [placeholder]="placeholder" [helperText]="helperText" [errorText]="errorText"
    [size]="size" [level]="level" [icon]="icon" [firstDayOfWeek]="firstDayOfWeek" [locale]="locale"
    [selectionMode]="selectionMode" [view]="view" [numberOfMonths]="numberOfMonths"
    [showTime]="showTime" [timeOnly]="timeOnly" [hourFormat]="hourFormat"
    [showButtonBar]="showButtonBar" [inline]="inline" [showClear]="showClear" [autoFlip]="autoFlip" [closeOnSelect]="closeOnSelect"
    [minDate]="minDate" [maxDate]="maxDate" [disabledDays]="disabledDays"
    [required]="required" [disabled]="disabled" [readonly]="readonly" [invalid]="invalid"
    (valueChange)="valueChange($event)" (dateSelect)="dateSelect($event)" (monthChange)="monthChange($event)"
    (opened)="opened()" (closed)="closed()" (cleared)="cleared()" /></div>`;

const story =
  (value: Date | null = null): Story['render'] =>
  (args) => ({ props: { ...args, model: value }, template: TEMPLATE });

const sample = new Date(2026, 6, 8); // 8 July 2026

export const Default: Story = { render: story() };
export const WithValue: Story = { render: story(sample), args: { helperText: 'Sélectionnez une date.' } };
export const Small: Story = { render: story(sample), args: { size: 'small' } };
export const Required: Story = { render: story(), args: { required: true, helperText: 'Champ obligatoire.' } };

export const Error: Story = {
  render: story(),
  args: { level: 'error', invalid: true, errorText: 'Date invalide.' },
};

export const WithTime: Story = {
  render: story(new Date(2026, 6, 8, 14, 30)),
  args: { showTime: true, label: 'Rendez-vous', helperText: 'Date et heure.' },
};

export const Time12h: Story = {
  render: story(new Date(2026, 6, 8, 14, 30)),
  args: { showTime: true, hourFormat: '12', label: 'Rendez-vous' },
};

export const TimeOnly: Story = {
  render: story(new Date(2026, 6, 8, 9, 15)),
  args: { timeOnly: true, showTime: true, label: 'Heure', placeholder: 'hh:mm' },
};

export const ButtonBar: Story = {
  render: story(),
  args: { showButtonBar: true, helperText: '« Aujourd\'hui » et « Effacer ».' },
};

// Plage restreinte : ±10 jours autour du 8 juillet 2026.
export const MinMax: Story = {
  render: (args) => ({
    props: { ...args, model: sample, minDate: new Date(2026, 5, 28), maxDate: new Date(2026, 6, 18) },
    template: TEMPLATE,
  }),
  args: { label: 'Date (plage limitée)', helperText: 'Du 28 juin au 18 juillet 2026.' },
};

// Week-ends (dimanche = 0, samedi = 6) désactivés.
export const DisabledWeekends: Story = {
  render: (args) => ({ props: { ...args, model: null, disabledDays: [0, 6] }, template: TEMPLATE }),
  args: { label: 'Jour ouvré', helperText: 'Week-ends indisponibles.' },
};

export const Disabled: Story = { render: story(sample), args: { disabled: true } };

// Effaçable : une croix apparaît dans le champ dès qu'une valeur est présente.
export const Clearable: Story = { render: story(sample), args: { label: 'Date', showClear: true } };

// Calendrier affiché en permanence (pas de champ déclencheur ni d'overlay).
export const Inline: Story = { render: story(sample), args: { inline: true } };

// Inline + heure + barre de boutons.
export const InlineWithTime: Story = {
  render: story(new Date(2026, 6, 8, 14, 30)),
  args: { inline: true, showTime: true, showButtonBar: true },
};

// Sélection multiple : clic pour (dé)sélectionner, le panneau reste ouvert.
export const Multiple: Story = {
  render: (args) => ({
    props: { ...args, model: [new Date(2026, 6, 8), new Date(2026, 6, 15), new Date(2026, 6, 23)] },
    template: TEMPLATE,
  }),
  args: { inline: true, selectionMode: 'multiple', label: 'Dates' },
};

// Sélection de plage : premier clic = début, second = fin, surbrillance entre les deux.
export const Range: Story = {
  render: (args) => ({
    props: { ...args, model: [new Date(2026, 6, 8), new Date(2026, 6, 18)] },
    template: TEMPLATE,
  }),
  args: { inline: true, selectionMode: 'range', label: 'Période' },
};

// MonthPicker : le clic sur un mois sélectionne le mois (valeur = 1er du mois).
export const MonthPicker: Story = {
  render: story(new Date(2027, 1, 1)),
  args: { inline: true, view: 'month', label: 'Mois' },
};

// YearPicker : le clic sur une année sélectionne l'année.
export const YearPicker: Story = {
  render: story(new Date(2026, 0, 1)),
  args: { inline: true, view: 'year', label: 'Année' },
};

// Plusieurs mois côte à côte (numberOfMonths).
export const TwoMonths: Story = {
  render: story(new Date(2026, 6, 8)),
  args: { inline: true, numberOfMonths: 2, label: 'Deux mois' },
};

// Barre de boutons personnalisée via le template #buttonbar (contexte todayCallback / clearCallback).
export const CustomButtonBar: Story = {
  render: () => ({
    props: { model: null },
    template: `<div style="width:260px"><ui-datepicker [(ngModel)]="model" inline selectionMode="range" label="Période">
      <ng-template #buttonbar let-todayCallback="todayCallback" let-clearCallback="clearCallback">
        <div style="display:flex;justify-content:space-between;width:100%;gap:8px">
          <div style="display:flex;gap:8px">
            <ui-button size="small" level="low" label="Exact" />
            <ui-button size="small" level="low" label="Flexible" />
          </div>
          <div style="display:flex;gap:8px">
            <ui-button size="small" level="high" label="Aujourd'hui" (buttonClick)="todayCallback($event)" />
            <ui-button size="small" level="error" icon="xmark" iconOnly ariaLabel="Effacer" (buttonClick)="clearCallback($event)" />
          </div>
        </div>
      </ng-template>
    </ui-datepicker></div>`,
  }),
};

// Ouverture intelligente : champ ancré en bas → le panneau se retourne vers le haut.
// Basculer le contrôle `autoFlip` (false) pour verrouiller l'ouverture vers le bas.
export const SmartPosition: Story = {
  render: (args) => ({
    props: { ...args, model: null },
    template: `<div style="height:520px;display:flex;align-items:flex-end;justify-content:center">
      <div style="width:260px"><ui-datepicker
        [(ngModel)]="model" label="Ouverture intelligente" [autoFlip]="autoFlip"
        helperText="Ancré en bas : le panneau s'ouvre vers le haut si la place manque." /></div>
    </div>`,
  }),
  args: { autoFlip: true },
};

// Cellule de jour personnalisée via le template #date (pastilles d'évènements).
export const DateTemplate: Story = {
  render: () => ({
    props: {
      model: new Date(2026, 6, 8),
      hasEvent: (d: { day: number; otherMonth: boolean }) => !d.otherMonth && [3, 8, 12, 19, 24].includes(d.day),
    },
    template: `<div style="width:320px"><ui-datepicker [(ngModel)]="model" inline label="Agenda">
      <ng-template #date let-d let-selected="selected">
        <span style="display:flex;flex-direction:column;align-items:center;gap:2px;line-height:1">
          <span>{{ d.day }}</span>
          @if (hasEvent(d)) {
            <span [style.background]="selected ? 'currentColor' : 'var(--informative-highlightlow-content-default)'"
                  style="width:5px;height:5px;border-radius:999px"></span>
          }
        </span>
      </ng-template>
    </ui-datepicker></div>`,
  }),
};
