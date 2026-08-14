import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import { UiDatepicker } from '@4sh/ui-kit/forms/ui-datepicker';
import { UiButton } from '@4sh/ui-kit/actions/ui-button';

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
    valueType: {
      control: 'inline-radio',
      options: ['date', 'iso'],
      description: '**Obligatoire, aucun défaut** — force un choix explicite plutôt qu\'un défaut silencieux qui ne correspondrait pas au type réel du modèle. `writeValue` accepte toujours `Date` **ou** string ISO (auto-détecté). `valueType` pilote uniquement ce qui est **émis** (`valueChange`/`dateSelect`, donc ce qui atterrit dans le `FormControl`) : `\'date\'` — un `Date`, calé sur un DTO `class-transformer` ; `\'iso\'` — une string `"yyyy-MM-dd"`, pour une valeur lue/écrite directement contre un `LocalDate` backend.',
      table: { type: { summary: "'date' | 'iso'" } },
    },
    size: { control: 'inline-radio', options: ['default', 'small'], table: { type: { summary: 'FieldSize' }, defaultValue: { summary: '"default"' } } },
    level: { control: 'inline-radio', options: ['default', 'success', 'error'], table: { type: { summary: 'FieldLevel' }, defaultValue: { summary: '"default"' } } },
    selectionMode: { control: 'inline-radio', options: ['single', 'multiple', 'range'], table: { type: { summary: 'DatepickerSelectionMode' }, defaultValue: { summary: '"single"' } } },
    view: { control: 'inline-radio', options: ['date', 'month', 'year'], description: 'Granularité de base (aussi MonthPicker/YearPicker).', table: { type: { summary: 'DatepickerView' }, defaultValue: { summary: '"date"' } } },
    numberOfMonths: { control: { type: 'number', min: 1, max: 3 }, table: { type: { summary: 'number' }, defaultValue: { summary: '1' } } },
    icon: { control: 'text', table: { type: { summary: 'string' }, defaultValue: { summary: '"calendar"' } } },
    showIcon: { control: 'boolean', description: "Affiche le bouton bascule (calendrier/horloge) du déclencheur.", table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } } },
    firstDayOfWeek: { control: { type: 'number', min: 0, max: 6 }, table: { type: { summary: 'number' }, defaultValue: { summary: '1' } } },
    locale: { control: 'text', table: { type: { summary: 'string' } } },
    minDate: { control: 'text', description: 'Date minimale sélectionnable. `Date` ou ISO `"yyyy-MM-dd"`.', table: { type: { summary: 'Date | string | null' } } },
    maxDate: { control: 'text', description: 'Date maximale sélectionnable. `Date` ou ISO `"yyyy-MM-dd"`.', table: { type: { summary: 'Date | string | null' } } },
    disabledDates: { control: false, description: 'Dates ponctuelles désactivées. `Date` ou ISO `"yyyy-MM-dd"`, mixables.', table: { type: { summary: '(Date | string)[]' } } },
    disabledDays: { control: false, description: 'Jours de la semaine désactivés (0 = dimanche … 6 = samedi).', table: { type: { summary: 'number[]' } } },
    dateFormat: { control: false, description: "Formatteur d'affichage custom (symétrique de `parseDate`).", table: { type: { summary: '(date: Date) => string' } } },
    parseDate: { control: false, description: 'Parseur custom de la saisie clavier (symétrique de `dateFormat`).', table: { type: { summary: '(value: string) => Date | null' } } },
    showTime: { control: 'boolean', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    timeOnly: { control: 'boolean', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    hourFormat: { control: 'inline-radio', options: ['24', '12'], table: { type: { summary: "'12' | '24'" }, defaultValue: { summary: '"24"' } } },
    stepMinute: { control: { type: 'number', min: 1, max: 30 }, description: "Incrément des minutes aux chevrons / flèches clavier (la frappe reste exacte).", table: { type: { summary: 'number' }, defaultValue: { summary: '1' } } },
    editableTime: { control: 'boolean', description: 'Autorise la frappe des heures / minutes (AM/PM reste une bascule).', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } } },
    showButtonBar: { control: 'boolean', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    todayLabel: { control: 'text', description: 'Libellé du bouton de saisie du jour courant.', table: { type: { summary: 'string' }, defaultValue: { summary: '"Today"' } } },
    clearLabel: { control: 'text', description: 'Libellé du bouton d’effacement (et de la croix `showClear`).', table: { type: { summary: 'string' }, defaultValue: { summary: '"Clear"' } } },
    inline: { control: 'boolean', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    showClear: { control: 'boolean', description: 'Affiche une croix pour effacer la valeur quand elle est renseignée.', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    autoFlip: { control: 'boolean', description: "Retourne le panneau vers le haut si l'espace manque en bas.", table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } } },
    closeOnSelect: { control: 'boolean', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } } },
    allowInput: { control: 'boolean', description: 'Autorise la saisie clavier de la date dans le champ (mode single, hors timeOnly). Parsée au blur / Entrée.', table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } } },
    panelStyleClass: { control: 'text', description: 'Classe(s) supplémentaire(s) appliquée(s) au panneau (personnalisation scoped).', table: { type: { summary: 'string' } } },
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
    inputFocus: { action: 'inputFocus', table: { disable: true } },
    inputBlur: { action: 'inputBlur', table: { disable: true } },
  },
  args: {
    label: 'Date',
    placeholder: 'dd/mm/yyyy',
    size: 'default',
    level: 'default',
    hourFormat: '24',
    firstDayOfWeek: 1,
    icon: 'calendar',
    // Concrete defaults so template bindings never pass `undefined` (which would
    // override the component's own input defaults). `valueType` has no component default
    // (required input) — this is Storybook's own initial control value, not a fallback.
    valueType: 'date',
    selectionMode: 'single',
    view: 'date',
    numberOfMonths: 1,
    showIcon: true,
    showTime: false,
    timeOnly: false,
    stepMinute: 1,
    editableTime: true,
    showButtonBar: false,
    todayLabel: 'Today',
    clearLabel: 'Effacer',
    inline: false,
    showClear: false,
    autoFlip: true,
    closeOnSelect: true,
    allowInput: false,
    required: false,
    disabled: false,
    readonly: false,
    invalid: false,
    disabledDays: [],
    disabledDates: [],
  },
};

export default meta;
type Story = StoryObj<UiDatepicker>;

const TEMPLATE = `<div style="width:260px"><ui-datepicker
    [(ngModel)]="model"
    [valueType]="valueType"
    [label]="label" [placeholder]="placeholder" [helperText]="helperText" [errorText]="errorText"
    [size]="size" [level]="level" [icon]="icon" [showIcon]="showIcon" [firstDayOfWeek]="firstDayOfWeek" [locale]="locale"
    [selectionMode]="selectionMode" [view]="view" [numberOfMonths]="numberOfMonths"
    [showTime]="showTime" [timeOnly]="timeOnly" [hourFormat]="hourFormat" [stepMinute]="stepMinute" [editableTime]="editableTime"
    [showButtonBar]="showButtonBar" [todayLabel]="todayLabel" [clearLabel]="clearLabel"
    [inline]="inline" [showClear]="showClear" [autoFlip]="autoFlip" [closeOnSelect]="closeOnSelect" [allowInput]="allowInput"
    [minDate]="minDate" [maxDate]="maxDate" [disabledDays]="disabledDays" [disabledDates]="disabledDates"
    [dateFormat]="dateFormat" [parseDate]="parseDate" [panelStyleClass]="panelStyleClass"
    [required]="required" [disabled]="disabled" [readonly]="readonly" [invalid]="invalid"
    (valueChange)="valueChange($event)" (dateSelect)="dateSelect($event)" (monthChange)="monthChange($event)"
    (opened)="opened()" (closed)="closed()" (cleared)="cleared()"
    (inputFocus)="inputFocus($event)" (inputBlur)="inputBlur($event)" /></div>`;

// Default demos use `Date` (valueType="date", set via meta.args below — matches a DTO
// round-tripped through class-transformer). `writeValue` also accepts an ISO string transparently
// regardless of mode — see `IsoValueType` below for the dedicated `valueType="iso"` mode.
// `valueType` is a required input on the component itself (no default) — every story must set it.
const story =
  (value: Date | string | null = null): Story['render'] =>
  (args) => ({ props: { ...args, model: value }, template: TEMPLATE });

const sample = new Date(2026, 6, 8); // 8 July 2026

export const Default: Story = { render: story() };
export const WithValue: Story = { render: story(sample), args: { helperText: 'Pick a date.' } };
export const Small: Story = { render: story(sample), args: { size: 'small' } };
export const Required: Story = { render: story(), args: { required: true, helperText: 'Champ obligatoire.' } };

export const Error: Story = {
  render: story(),
  args: { level: 'error', invalid: true, errorText: 'Date invalide.' },
};

// Contrat en mode `'iso'` : la valeur (entrée ET sortie) est une string "yyyy-MM-dd" — pour un
// champ qui lit/écrit directement contre un LocalDate backend, sans DTO class-transformer entre
// les deux. Ouvrir le panneau Actions pour voir `valueChange` émettre une string après sélection.
export const IsoValueType: Story = {
  render: story('2026-07-08'),
  args: { valueType: 'iso', label: 'Date (mode ISO)', helperText: 'Valeur : string "yyyy-MM-dd" (au lieu de Date).' },
};

export const WithTime: Story = {
  render: story(new Date(2026, 6, 8, 14, 30)),
  args: { showTime: true, label: 'Appointment', helperText: 'Heures et minutes saisissables au clavier.' },
};

export const StepperOnlyTime: Story = {
  render: story(new Date(2026, 6, 8, 14, 30)),
  args: { showTime: true, editableTime: false, label: 'Appointment', helperText: 'Adjust with the chevrons / arrow keys only.' },
};

export const Time12h: Story = {
  render: story(new Date(2026, 6, 8, 14, 30)),
  args: { showTime: true, hourFormat: '12', label: 'Appointment' },
};

export const TimeOnly: Story = {
  render: story(new Date(2026, 6, 8, 9, 15)),
  args: { timeOnly: true, showTime: true, label: 'Time', placeholder: 'hh:mm' },
};

export const ButtonBar: Story = {
  render: story(),
  args: { showButtonBar: true, helperText: 'The “Today” and “Clear” buttons.' },
};

// Plage restreinte : ±10 jours autour du 8 juillet 2026. `minDate`/`maxDate` en `Date`
// (voir `MinMaxIso` pour la forme string, tout aussi valide — ces deux inputs de config
// acceptent l'un ou l'autre indépendamment de `valueType`, qui ne pilote que la valeur du champ).
export const MinMax: Story = {
  render: (args) => ({
    props: { ...args, model: sample, minDate: new Date(2026, 5, 28), maxDate: new Date(2026, 6, 18) },
    template: TEMPLATE,
  }),
  args: { label: 'Date (limited range)', helperText: 'From 28 June to 18 July 2026.' },
};

// Même contrainte que `MinMax`, bornes passées en ISO plutôt qu'en `Date` — pratique
// quand elles viennent déjà d'un backend au même format que la valeur.
export const MinMaxIso: Story = {
  render: (args) => ({
    props: { ...args, model: sample, minDate: '2026-06-28', maxDate: '2026-07-18' },
    template: TEMPLATE,
  }),
  args: { label: 'Date (ISO bounds)', helperText: 'minDate/maxDate passed as "yyyy-MM-dd" strings.' },
};

// Week-ends (dimanche = 0, samedi = 6) désactivés.
export const DisabledWeekends: Story = {
  render: (args) => ({ props: { ...args, model: null, disabledDays: [0, 6] }, template: TEMPLATE }),
  args: { label: 'Business day', helperText: 'Weekends unavailable.' },
};

// Dates ponctuelles désactivées, mixant `Date` et ISO pour montrer que les deux formes coexistent.
export const DisabledDates: Story = {
  render: (args) => ({
    props: { ...args, model: null, disabledDates: ['2026-07-08', new Date(2026, 6, 15), '2026-07-22'] },
    template: TEMPLATE,
  }),
  args: { label: 'Unavailable days', helperText: '8, 15 and 22 July 2026 disabled.' },
};

export const Disabled: Story = { render: story(sample), args: { disabled: true } };

// Effaçable : une croix apparaît dans le champ dès qu'une valeur est présente.
export const Clearable: Story = { render: story(sample), args: { label: 'Date', showClear: true } };

// Saisie manuelle : tapez la date au clavier (parsée au blur / Entrée). Les "/" s'insèrent
// automatiquement au fil de la frappe (dès qu'un segment jour/mois est complet, comme une date
// d'expiration de carte). L'ordre des champs suit la locale (`fr-FR` → jj/mm/aaaa) ; le
// placeholder est dérivé automatiquement de cet ordre quand il n'est pas fourni. Une saisie
// invalide revient à la dernière valeur.
export const EditableInput: Story = {
  render: story(sample),
  args: {
    label: 'Date',
    allowInput: true,
    showClear: true,
    locale: 'en-US',
    placeholder: '', // empty → placeholder auto-derived from the locale (dd/mm/yyyy)
    helperText: 'Type "08072026": the "/" appear on their own (dd/mm/yyyy).',
  },
};

// Même saisie assistée, en locale `en-US` : l'ordre mois/jour/année piloté par `dateFieldOrder`
// s'applique aussi à l'auto-formatage (mm/dd/yyyy plutôt que jj/mm/aaaa).
export const AutoFormattedInputEnUs: Story = {
  render: story(sample),
  args: {
    label: 'Date',
    allowInput: true,
    showClear: true,
    locale: 'en-US',
    placeholder: '',
    helperText: 'Type "08072026": the "/" appear on their own (mm/dd/yyyy).',
  },
};

// Saisie assistée en MonthPicker (view="month") : le masque n'a que 2 segments (mois/année,
// le jour étant hors sujet dans cette vue) — exerce le chemin "99/9999" de typingSlots.
export const AutoFormattedInputMonthPicker: Story = {
  render: story(),
  args: {
    label: 'Mois',
    view: 'month',
    allowInput: true,
    showClear: true,
    locale: 'en-US',
    placeholder: '',
    helperText: 'Type "072026": auto-formatted to "07/2026" (mm/yyyy).',
  },
};

// Saisie assistée avec heure (allowInput + showTime) : le masque couvre aussi HH:MM, sans
// tronquer les chiffres d'heure/minute tapés à la suite de la date (typingSlots).
export const EditableInputWithTime: Story = {
  render: story(sample),
  args: {
    label: 'Appointment',
    allowInput: true,
    showTime: true,
    showClear: true,
    locale: 'en-US',
    placeholder: '',
    helperText: 'Type "080720261430" for "08/07/2026 14:30" (dd/mm/yyyy hh:mm).',
  },
};

// Même cas en 12h : le masque ajoute un segment lettres pour AM/PM ("aa").
export const EditableInputWithTime12h: Story = {
  render: story(sample),
  args: {
    label: 'Appointment',
    allowInput: true,
    showTime: true,
    hourFormat: '12',
    showClear: true,
    locale: 'en-US',
    placeholder: '',
    helperText: 'Type "080720260200PM" for "08/07/2026 02:00 PM" (dd/mm/yyyy hh:mm aa).',
  },
};

// Formatteur/parseur custom (symétriques) : affichage "Jul 8, 2026", saisie au même format.
export const CustomFormat: Story = {
  render: (args) => ({
    props: {
      ...args,
      model: sample,
      dateFormat: (d: Date) => new Intl.DateTimeFormat('en-US', { day: 'numeric', month: 'short', year: 'numeric' }).format(d),
      parseDate: (text: string): Date | null => {
        // "Jul 8, 2026" : mois d'abord, comme ce qu'émet le formateur en-US ci-dessus.
        const m = /^([a-z.]+)\.?\s+(\d{1,2}),?\s+(\d{4})$/i.exec(text.trim());
        if (!m) return null;
        const months = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec'];
        const idx = months.findIndex((mo) => m[1].toLowerCase().startsWith(mo));
        if (idx < 0) return null;
        return new Date(Number(m[3]), idx, Number(m[2]));
      },
    },
    template: TEMPLATE,
  }),
  args: { label: 'Custom format', allowInput: true, showClear: true, locale: 'en-US', helperText: 'Displays “Jul 8, 2026”, symmetric parseDate.' },
};

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
  args: { inline: true, selectionMode: 'range', label: 'Period' },
};

// MonthPicker : le clic sur un mois sélectionne le mois (valeur = 1er du mois).
export const MonthPicker: Story = {
  render: story(new Date(2027, 1, 1)),
  args: { inline: true, view: 'month', label: 'Mois' },
};

// YearPicker : le clic sur une année sélectionne l'année.
export const YearPicker: Story = {
  render: story(new Date(2026, 0, 1)),
  args: { inline: true, view: 'year', label: 'Year' },
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
    template: `<div style="width:260px"><ui-datepicker [(ngModel)]="model" valueType="date" inline selectionMode="range" label="Period">
      <ng-template #buttonbar let-todayCallback="todayCallback" let-clearCallback="clearCallback">
        <div style="display:flex;justify-content:space-between;width:100%;gap:8px">
          <div style="display:flex;gap:8px">
            <ui-button size="small" level="low" label="Exact" />
            <ui-button size="small" level="low" label="Flexible" />
          </div>
          <div style="display:flex;gap:8px">
            <ui-button size="small" level="high" label="Today" (buttonClick)="todayCallback($event)" />
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
        [(ngModel)]="model" valueType="date" label="Ouverture intelligente" [autoFlip]="autoFlip"
        helperText="Anchored at the bottom: the panel opens upwards when space is tight." /></div>
    </div>`,
  }),
  args: { autoFlip: true },
};

// --- Signal Forms (@angular/forms/signals) ------------------------------
@Component({
  selector: 'demo-datepicker-signal-forms',
  standalone: true,
  imports: [UiDatepicker, FormField, CommonModule],
  template: `
    <div style="width:260px; display:grid; gap:12px; justify-items:start;">
      <ui-datepicker [formField]="birth" valueType="date" label="Birth date" placeholder="dd/mm/yyyy" />
      <code>value = {{ (birth().value() | date: 'dd/MM/yyyy') ?? 'null' }} · valid = {{ birth().valid() }}</code>
    </div>
  `,
})
class SignalFormsDemo {
  // valueType="date" (défaut) : le champ écrit/attend un Date, comme un DTO class-transformer.
  protected readonly model = signal<Date | null>(null);
  protected readonly birth = form(this.model, (path) => {
    required(path);
  });
}

export const SignalForms: Story = {
  name: 'Signal Forms',
  render: () => ({ template: `<demo-datepicker-signal-forms />` }),
  decorators: [moduleMetadata({ imports: [SignalFormsDemo] })],
};

// Cellule de jour personnalisée via le template #date (pastilles d'évènements).
export const DateTemplate: Story = {
  render: () => ({
    props: {
      model: new Date(2026, 6, 8),
      hasEvent: (d: { day: number; otherMonth: boolean }) => !d.otherMonth && [3, 8, 12, 19, 24].includes(d.day),
    },
    template: `<div style="width:320px"><ui-datepicker [(ngModel)]="model" valueType="date" inline label="Agenda">
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
