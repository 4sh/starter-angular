import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import { UiDatepicker } from '@4sh/ui-kit/forms/ui-datepicker';
import { UiButton } from '@4sh/ui-kit/actions/ui-button';
import { UiIcon, UiIconFamilyScope, provideUiIconFamilies } from '@4sh/ui-kit/base/ui-icon';

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
    helperText: {
      control: 'text',
      description: "Texte d'aide (via ui-helper).",
      table: { type: { summary: 'string' } },
    },
    errorText: {
      control: 'text',
      description: "Message affiché à la place de l'aide quand en erreur.",
      table: { type: { summary: 'string' } },
    },
    valueType: {
      control: 'inline-radio',
      options: ['date', 'iso'],
      description:
        "**Obligatoire, aucun défaut** — force un choix explicite plutôt qu'un défaut silencieux qui ne correspondrait pas au type réel du modèle. `writeValue` accepte toujours `Date` **ou** string ISO (auto-détecté). `valueType` pilote uniquement ce qui est **émis** (`valueChange`/`dateSelect`, donc ce qui atterrit dans le `FormControl`) : `'date'` — un `Date`, calé sur un DTO `class-transformer` ; `'iso'` — une string `\"yyyy-MM-dd\"`, pour une valeur lue/écrite directement contre un `LocalDate` backend.",
      table: { type: { summary: "'date' | 'iso'" } },
    },
    size: {
      control: 'inline-radio',
      options: ['default', 'small'],
      table: { type: { summary: 'FieldSize' }, defaultValue: { summary: '"default"' } },
    },
    floatLabel: {
      control: 'select',
      options: [undefined, 'over', 'in', 'on'],
      labels: { undefined: 'aucun (libellé classique)' },
      description:
        'Libellé flottant : le libellé descend dans le champ, où il tient le rôle du placeholder, et remonte au focus ou dès que le champ porte une valeur. Le `placeholder` est alors neutralisé.',
      table: { type: { summary: 'FieldFloatLabel' }, defaultValue: { summary: 'undefined' } },
    },
    level: {
      control: 'inline-radio',
      options: ['default', 'success', 'error'],
      table: { type: { summary: 'FieldLevel' }, defaultValue: { summary: '"default"' } },
    },
    selectionMode: {
      control: 'inline-radio',
      options: ['single', 'multiple', 'range'],
      table: {
        type: { summary: 'DatepickerSelectionMode' },
        defaultValue: { summary: '"single"' },
      },
    },
    view: {
      control: 'inline-radio',
      options: ['date', 'month', 'year'],
      description: 'Granularité de base (aussi MonthPicker/YearPicker).',
      table: { type: { summary: 'DatepickerView' }, defaultValue: { summary: '"date"' } },
    },
    numberOfMonths: {
      control: { type: 'number', min: 1, max: 3 },
      table: { type: { summary: 'number' }, defaultValue: { summary: '1' } },
    },
    icon: {
      control: 'text',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"calendar"' } },
    },
    showIcon: {
      control: 'boolean',
      description: 'Affiche le bouton bascule (calendrier/horloge) du déclencheur.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    firstDayOfWeek: {
      control: { type: 'number', min: 0, max: 6 },
      table: { type: { summary: 'number' }, defaultValue: { summary: '1' } },
    },
    locale: { control: 'text', table: { type: { summary: 'string' } } },
    minDate: {
      control: 'text',
      description: 'Date minimale sélectionnable. `Date` ou ISO `"yyyy-MM-dd"`.',
      table: { type: { summary: 'Date | string | null' } },
    },
    maxDate: {
      control: 'text',
      description: 'Date maximale sélectionnable. `Date` ou ISO `"yyyy-MM-dd"`.',
      table: { type: { summary: 'Date | string | null' } },
    },
    disabledDates: {
      control: false,
      description: 'Dates ponctuelles désactivées. `Date` ou ISO `"yyyy-MM-dd"`, mixables.',
      table: { type: { summary: '(Date | string)[]' } },
    },
    disabledDays: {
      control: false,
      description: 'Jours de la semaine désactivés (0 = dimanche … 6 = samedi).',
      table: { type: { summary: 'number[]' } },
    },
    dateFormat: {
      control: false,
      description: "Formatteur d'affichage custom (symétrique de `parseDate`).",
      table: { type: { summary: '(date: Date) => string' } },
    },
    parseDate: {
      control: false,
      description: 'Parseur custom de la saisie clavier (symétrique de `dateFormat`).',
      table: { type: { summary: '(value: string) => Date | null' } },
    },
    showTime: {
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    timeOnly: {
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    hourFormat: {
      control: 'inline-radio',
      options: ['24', '12'],
      table: { type: { summary: "'12' | '24'" }, defaultValue: { summary: '"24"' } },
    },
    stepMinute: {
      control: { type: 'number', min: 1, max: 30 },
      description: 'Incrément des minutes aux chevrons / flèches clavier (la frappe reste exacte).',
      table: { type: { summary: 'number' }, defaultValue: { summary: '1' } },
    },
    editableTime: {
      control: 'boolean',
      description: 'Autorise la frappe des heures / minutes (AM/PM reste une bascule).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    showButtonBar: {
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    todayLabel: {
      control: 'text',
      description: "Libellé du bouton « Aujourd'hui » par défaut.",
      table: { type: { summary: 'string' }, defaultValue: { summary: '"Aujourd\'hui"' } },
    },
    clearLabel: {
      control: 'text',
      description: 'Libellé du bouton « Effacer » par défaut (et de la croix `showClear`).',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"Effacer"' } },
    },
    inline: {
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    showClear: {
      control: 'boolean',
      description:
        "Affiche une croix pour effacer la valeur quand elle est renseignée — seulement quand `showIcon` est à `false` (sinon le calendrier garde l'icône, voir `Clearable`).",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    autoFlip: {
      control: 'boolean',
      description: "Retourne le panneau vers le haut si l'espace manque en bas.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    closeOnSelect: {
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    allowInput: {
      control: 'boolean',
      description:
        'Autorise la saisie clavier de la date dans le champ (mode single, hors timeOnly). Parsée au blur / Entrée.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    showOnFocus: {
      control: 'boolean',
      description:
        "Ouvre le panneau dès que le champ prend le focus (pointeur ou clavier, jamais un focus programmatique). L'option rend le panneau non modal : le focus reste dans le champ, sans backdrop ni piège de focus.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    formatHintLabel: {
      control: 'text',
      description:
        'Hint accessible (aria-describedby) annonçant le format attendu quand le champ est saisissable. Vide (`""`) pour le désactiver. `undefined` (défaut) dérive « Format attendu : jj/mm/aaaa ».',
      table: { type: { summary: 'string' } },
    },
    panelStyleClass: {
      control: 'text',
      description: 'Classe(s) supplémentaire(s) appliquée(s) au panneau (personnalisation scoped).',
      table: { type: { summary: 'string' } },
    },
    required: {
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    readonly: {
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    invalid: {
      control: 'boolean',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    valueChange: { action: 'valueChange', table: { disable: true } },
    dateSelect: { action: 'dateSelect', table: { disable: true } },
    monthChange: { action: 'monthChange', table: { disable: true } },
    opened: { action: 'opened', table: { disable: true } },
    closed: { action: 'closed', table: { disable: true } },
    cleared: { action: 'cleared', table: { disable: true } },
    inputFocus: { action: 'inputFocus', table: { disable: true } },
    inputBlur: { action: 'inputBlur', table: { disable: true } },
    ripple: {
      control: false,
      description:
        "Onde de pression sur les cellules du calendrier et sa navigation quand l'effet ripple est activé (`provideUiRipple()` ou `[uiRippleScope]`). `false` la coupe sur ce composant, même en activation globale.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
  },
  args: {
    label: 'Date',
    placeholder: 'jj/mm/aaaa',
    // Les démos sont en français (libellés, formats, textes d'aide) : sans `locale`, la locale
    // résolue retombe sur le `LOCALE_ID` d'Angular — `en-US` ici, faute de configuration — et le
    // panneau affichait des noms de mois anglais sous des dates écrites en jj/mm/aaaa.
    // `CustomFormat` est la seule story à repasser volontairement en `en-US`.
    locale: 'fr-FR',
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
    todayLabel: "Aujourd'hui",
    clearLabel: 'Effacer',
    inline: false,
    showClear: true,
    autoFlip: true,
    closeOnSelect: true,
    allowInput: true,
    showOnFocus: false,
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
    [size]="size" [level]="level" [floatLabel]="floatLabel" [icon]="icon" [showIcon]="showIcon" [firstDayOfWeek]="firstDayOfWeek" [locale]="locale"
    [selectionMode]="selectionMode" [view]="view" [numberOfMonths]="numberOfMonths"
    [showTime]="showTime" [timeOnly]="timeOnly" [hourFormat]="hourFormat" [stepMinute]="stepMinute" [editableTime]="editableTime"
    [showButtonBar]="showButtonBar" [todayLabel]="todayLabel" [clearLabel]="clearLabel"
    [inline]="inline" [showClear]="showClear" [autoFlip]="autoFlip" [closeOnSelect]="closeOnSelect" [allowInput]="allowInput" [showOnFocus]="showOnFocus"
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

// Formatteur numérique partagé par la plupart des démos ci-dessous : "08/07/2026". Sans lui,
// l'affichage par défaut (hors `allowInput`) suit `Intl` en `dateStyle: 'medium'` sur la locale
// résolue (`fr-FR`, voir `meta.args`) et afficherait "8 juil. 2026". `CustomFormat`, plus bas,
// reste le seul exemple qui s'en écarte volontairement pour montrer qu'un tout autre format est
// possible.
const demoDateFormat = (d: Date): string =>
  new Intl.DateTimeFormat('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(d);
// Variante avec heure, pour les démos `showTime` : "08/07/2026 14:30".
const demoDateTimeFormat = (d: Date): string =>
  `${demoDateFormat(d)} ${new Intl.DateTimeFormat('fr-FR', { hour: '2-digit', minute: '2-digit' }).format(d)}`;

export const Default: Story = { render: story(), args: { dateFormat: demoDateFormat } };
export const WithValue: Story = {
  render: story(sample),
  args: { helperText: 'Sélectionnez une date.', dateFormat: demoDateFormat },
};
export const Small: Story = {
  render: story(sample),
  args: { size: 'small', dateFormat: demoDateFormat },
};
export const Required: Story = {
  render: story(),
  args: { required: true, helperText: 'Champ obligatoire.', dateFormat: demoDateFormat },
};

export const Error: Story = {
  render: story(),
  args: {
    level: 'error',
    invalid: true,
    errorText: 'Date invalide.',
    dateFormat: demoDateFormat,
  },
};

// Contrat en mode `'iso'` : la valeur (entrée ET sortie) est une string "yyyy-MM-dd" — pour un
// champ qui lit/écrit directement contre un LocalDate backend, sans DTO class-transformer entre
// les deux. Ouvrir le panneau Actions pour voir `valueChange` émettre une string après sélection.
export const IsoValueType: Story = {
  render: story('2026-07-08'),
  args: {
    valueType: 'iso',
    label: 'Date (mode ISO)',
    helperText: 'Valeur : string "yyyy-MM-dd" (au lieu de Date).',
    dateFormat: demoDateFormat,
  },
};

export const WithTime: Story = {
  render: story(new Date(2026, 6, 8, 14, 30)),
  args: {
    showTime: true,
    label: 'Rendez-vous',
    helperText: 'Heures et minutes saisissables au clavier.',
    dateFormat: demoDateTimeFormat,
  },
};

export const StepperOnlyTime: Story = {
  render: story(new Date(2026, 6, 8, 14, 30)),
  args: {
    showTime: true,
    editableTime: false,
    label: 'Rendez-vous',
    helperText: 'Réglage aux chevrons / flèches uniquement.',
    dateFormat: demoDateTimeFormat,
  },
};

export const Time12h: Story = {
  render: story(new Date(2026, 6, 8, 14, 30)),
  args: {
    showTime: true,
    hourFormat: '12',
    label: 'Rendez-vous',
    dateFormat: demoDateTimeFormat,
  },
};

export const TimeOnly: Story = {
  render: story(new Date(2026, 6, 8, 9, 15)),
  args: { timeOnly: true, showTime: true, label: 'Heure', placeholder: 'hh:mm' },
};

export const ButtonBar: Story = {
  render: story(),
  args: {
    showButtonBar: true,
    helperText: "« Aujourd'hui » et « Effacer ».",
    dateFormat: demoDateFormat,
  },
};

// Plage restreinte : ±10 jours autour du 8 juillet 2026. `minDate`/`maxDate` en `Date`
// (voir `MinMaxIso` pour la forme string, tout aussi valide — ces deux inputs de config
// acceptent l'un ou l'autre indépendamment de `valueType`, qui ne pilote que la valeur du champ).
export const MinMax: Story = {
  render: (args) => ({
    props: {
      ...args,
      model: sample,
      minDate: new Date(2026, 5, 28),
      maxDate: new Date(2026, 6, 18),
    },
    template: TEMPLATE,
  }),
  args: {
    label: 'Date (plage limitée)',
    helperText: 'Du 28 juin au 18 juillet 2026.',
    dateFormat: demoDateFormat,
  },
};

// Même contrainte que `MinMax`, bornes passées en ISO plutôt qu'en `Date` — pratique
// quand elles viennent déjà d'un backend au même format que la valeur.
export const MinMaxIso: Story = {
  render: (args) => ({
    props: { ...args, model: sample, minDate: '2026-06-28', maxDate: '2026-07-18' },
    template: TEMPLATE,
  }),
  args: {
    label: 'Date (bornes ISO)',
    helperText: 'minDate/maxDate passées en string "yyyy-MM-dd".',
    dateFormat: demoDateFormat,
  },
};

// Week-ends (dimanche = 0, samedi = 6) désactivés.
export const DisabledWeekends: Story = {
  render: (args) => ({ props: { ...args, model: null, disabledDays: [0, 6] }, template: TEMPLATE }),
  args: {
    label: 'Jour ouvré',
    helperText: 'Week-ends indisponibles.',
    dateFormat: demoDateFormat,
  },
};

// Dates ponctuelles désactivées, mixant `Date` et ISO pour montrer que les deux formes coexistent.
export const DisabledDates: Story = {
  render: (args) => ({
    props: {
      ...args,
      model: null,
      disabledDates: ['2026-07-08', new Date(2026, 6, 15), '2026-07-22'],
    },
    template: TEMPLATE,
  }),
  args: {
    label: 'Jours indisponibles',
    helperText: '8, 15 et 22 juillet 2026 désactivés.',
    dateFormat: demoDateFormat,
  },
};

export const Disabled: Story = {
  render: story(sample),
  args: { disabled: true, dateFormat: demoDateFormat },
};

// `showClear` est vrai par défaut, mais ne prend effet que si `showIcon` est à `false` : sinon
// le calendrier garde l'icône, pour rester cliquable et rouvrir le panneau même une fois une
// valeur choisie (voir la doc de `showClear`). Ici `showIcon` est explicitement coupé pour
// montrer la croix — la valeur reste sinon effaçable au clavier (`allowInput`, sélectionner +
// supprimer le texte).
export const Clearable: Story = {
  render: story(sample),
  args: { label: 'Date', showIcon: false, dateFormat: demoDateFormat },
};

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
    placeholder: '', // vide → placeholder auto dérivé de la locale (jj/mm/aaaa)
    helperText: 'Tapez "08072026" au clavier : les "/" apparaissent seuls (jj/mm/aaaa).',
  },
};

// Ouverture au focus (showOnFocus) : cliquer ou tabuler dans le champ ouvre le calendrier, sans
// attendre l'icône ni la flèche du bas. Le focus RESTE dans le champ (une ouverture qui le
// déplacerait serait un changement de contexte au sens WCAG 3.2.1) : on continue de taper la date,
// `↓` entre dans la grille, `Échap` ferme, `Tab` ferme et passe au champ suivant. Le panneau est
// non modal : sans backdrop, le champ reste cliquable dessous pour corriger un segment à la
// souris, ce que l'ouverture au clic « classique » interdisait.
export const ShowOnFocus: Story = {
  render: story(),
  args: {
    label: 'Date',
    showOnFocus: true,
    placeholder: '',
    helperText: "Cliquez ou tabulez dans le champ : le calendrier s'ouvre, le curseur y reste.",
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
    placeholder: '',
    helperText: 'Tapez "072026" : auto-formaté en "07/2026" (mm/aaaa).',
  },
};

// Saisie assistée avec heure (allowInput + showTime) : le masque couvre aussi HH:MM, sans
// tronquer les chiffres d'heure/minute tapés à la suite de la date (typingSlots).
export const EditableInputWithTime: Story = {
  render: story(sample),
  args: {
    label: 'Rendez-vous',
    allowInput: true,
    showTime: true,
    showClear: true,
    placeholder: '',
    helperText: 'Tapez "080720261430" pour "08/07/2026 14:30" (jj/mm/aaaa hh:mm).',
  },
};

// Même cas en 12h : le masque ajoute un segment lettres pour AM/PM ("aa").
export const EditableInputWithTime12h: Story = {
  render: story(sample),
  args: {
    label: 'Rendez-vous',
    allowInput: true,
    showTime: true,
    hourFormat: '12',
    showClear: true,
    placeholder: '',
    helperText: 'Tapez "080720260200PM" pour "08/07/2026 02:00 PM" (jj/mm/aaaa hh:mm aa).',
  },
};

// Formatteur/parseur custom (symétriques) : seul exemple qui s'écarte du format classique
// jj/mm/aaaa utilisé partout ailleurs, pour montrer que `dateFormat`/`parseDate` permettent
// d'accueillir n'importe quel format d'affichage (ici « Jul 8, 2026 », à l'anglo-saxonne).
export const CustomFormat: Story = {
  render: (args) => ({
    props: {
      ...args,
      model: sample,
      dateFormat: (d: Date) =>
        new Intl.DateTimeFormat('en-US', {
          day: 'numeric',
          month: 'short',
          year: 'numeric',
        }).format(d),
      parseDate: (text: string): Date | null => {
        const m = /^([a-z]+)\s+(\d{1,2}),\s*(\d{4})$/i.exec(text.trim());
        if (!m) return null;
        const months = [
          'jan',
          'feb',
          'mar',
          'apr',
          'may',
          'jun',
          'jul',
          'aug',
          'sep',
          'oct',
          'nov',
          'dec',
        ];
        const idx = months.findIndex((mo) => m[1].toLowerCase().startsWith(mo));
        if (idx < 0) return null;
        return new Date(Number(m[3]), idx, Number(m[2]));
      },
    },
    template: TEMPLATE,
  }),
  args: {
    label: 'Format personnalisé',
    allowInput: true,
    showClear: true,
    locale: 'en-US',
    placeholder: '', // vide → placeholder auto dérivé du dateFormat custom lui-même (« Nov 22, 2023 »)
    helperText: 'Affichage « Jul 8, 2026 », parseDate symétrique.',
  },
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
  args: { inline: true, selectionMode: 'range', label: 'Période' },
};

// Saisie clavier en mode range (FSHSP-118) : les deux dates dans le même champ, séparées par
// " - ". Le clic dans la grille continue de fonctionner exactement comme avant (voir `Range`) —
// la saisie clavier ne fait que s'y ajouter. Pas de masque auto-"/" ici (voir doc `allowInput`) :
// texte libre, parsé au blur/Entrée uniquement.
export const RangeTypedInput: Story = {
  render: (args) => ({
    props: {
      ...args,
      model: [new Date(2026, 6, 8), new Date(2026, 6, 18)],
      dateFormat: demoDateFormat,
    },
    template: TEMPLATE,
  }),
  args: {
    selectionMode: 'range',
    label: 'Période',
    placeholder: '', // vide → placeholder auto dérivé pour range ("jj/mm/aaaa - jj/mm/aaaa")
    helperText: 'Tapez "08/07/2026 - 18/07/2026" (jj/mm/aaaa - jj/mm/aaaa).',
  },
};

// Saisie clavier en mode multiple (FSHSP-118) : une liste de dates séparées par ", " dans le
// même champ. Même principe que `RangeTypedInput` — texte libre, parsé au blur/Entrée, la grille
// reste utilisable en parallèle (clic = bascule).
export const MultipleTypedInput: Story = {
  render: (args) => ({
    props: {
      ...args,
      model: [new Date(2026, 6, 8), new Date(2026, 6, 15), new Date(2026, 6, 23)],
      dateFormat: demoDateFormat,
    },
    template: TEMPLATE,
  }),
  args: {
    selectionMode: 'multiple',
    label: 'Dates',
    placeholder: '', // vide → placeholder auto dérivé pour multiple ("jj/mm/aaaa, ...")
    helperText: 'Tapez "08/07/2026, 15/07/2026, 23/07/2026" (jj/mm/aaaa, ...).',
  },
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
  render: () => ({
    props: {
      model: new Date(2026, 6, 8),
      inline: true,
      numberOfMonths: 2,
      label: 'Deux mois',
      valueType: 'date',
      dateFormat: demoDateFormat,
    },
    template: `<ui-datepicker
    [(ngModel)]="model"
    [valueType]="valueType"
    [label]="label"
    [inline]="inline"
    [numberOfMonths]="numberOfMonths"
    locale="fr-FR"
    [dateFormat]="dateFormat" />`,
  }),
  parameters: { layout: 'centered' },
};

// Barre de boutons personnalisée via le template #buttonbar (contexte todayCallback / clearCallback).
export const CustomButtonBar: Story = {
  render: () => ({
    props: { model: null },
    template: `<div style="width:260px"><ui-datepicker [(ngModel)]="model" valueType="date" inline selectionMode="range" label="Période" locale="fr-FR">
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
    props: { ...args, model: null, dateFormat: demoDateFormat },
    template: `<div style="height:520px;display:flex;align-items:flex-end;justify-content:center">
      <div style="width:260px"><ui-datepicker
        [(ngModel)]="model" valueType="date" label="Ouverture intelligente" [autoFlip]="autoFlip"
        locale="fr-FR"
        [dateFormat]="dateFormat"
        helperText="Ancré en bas : le panneau s'ouvre vers le haut si la place manque." /></div>
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
      <ui-datepicker
        [formField]="birth"
        valueType="date"
        label="Date de naissance"
        locale="fr-FR"
        placeholder="jj/mm/aaaa"
      />
      <code
        >value = {{ (birth().value() | date: 'dd/MM/yyyy') ?? 'null' }} · valid =
        {{ birth().valid() }}</code
      >
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
      hasEvent: (d: { day: number; otherMonth: boolean }) =>
        !d.otherMonth && [3, 8, 12, 19, 24].includes(d.day),
    },
    template: `<div style="width:320px"><ui-datepicker [(ngModel)]="model" valueType="date" inline label="Agenda" locale="fr-FR">
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

// --- Icônes : template ponctuel vs famille de sous-arbre ----------------
/** Famille de démonstration : remappe les noms utilisés par le composant sur d'autres glyphes
 *  FontAwesome, pour rendre la bascule visible sans charger une seconde police d'icônes. */
const DEMO_GLYPHS: Record<string, string> = {
  'chevron-left': 'circle-arrow-left',
  'chevron-right': 'circle-arrow-right',
  'chevron-up': 'circle-arrow-up',
  'chevron-down': 'circle-arrow-down',
  calendar: 'calendar-days',
  clock: 'stopwatch',
  xmark: 'circle-xmark',
};
const demoFamily = { classes: (name: string) => `fa-solid fa-${DEMO_GLYPHS[name] ?? name}` };

/**
 * `#icon` remplace le markup de l'icône du **déclencheur** — et rien d'autre : les dix chevrons du
 * panneau restent sur la famille par défaut. Contexte reçu : `$implicit` = le nom que le composant
 * a résolu (`calendar`, `clock` en `timeOnly`, ou `xmark` — cette dernière seulement si `showIcon`
 * est à `false`, voir la doc de `showClear`), `size` = la taille calée sur le champ, `disabled` =
 * l'état du champ. Deux instances ci-dessous pour voir les deux : la première résout `calendar`
 * (config par défaut), la seconde `xmark` (`showIcon` coupé + valeur déjà présente).
 */
export const IconTemplate: Story = {
  decorators: [
    applicationConfig({ providers: [provideUiIconFamilies({ demo: demoFamily })] }),
    moduleMetadata({ imports: [UiDatepicker, UiIcon, FormsModule] }),
  ],
  render: () => ({
    props: { a: null, b: sample, dateFormat: demoDateFormat },
    template: `<div style="display:flex;gap:20px">
      <div style="width:280px"><ui-datepicker [(ngModel)]="a" valueType="date" label="Date" locale="fr-FR" [dateFormat]="dateFormat">
        <ng-template #icon let-name let-size="size">
          <ui-icon [name]="name" family="demo" [size]="size" />
        </ng-template>
      </ui-datepicker></div>
      <div style="width:280px"><ui-datepicker [(ngModel)]="b" valueType="date" label="Date (sans icône calendrier)" [showIcon]="false" locale="fr-FR" [dateFormat]="dateFormat">
        <ng-template #icon let-name let-size="size">
          <ui-icon [name]="name" family="demo" [size]="size" />
        </ng-template>
      </ui-datepicker></div>
    </div>`,
  }),
};

/**
 * La directive `uiIconFamily` couvre l'autre échelle : **toutes** les icônes descendantes basculent,
 * y compris celles qu'aucun input n'expose — les chevrons de navigation et des steppers d'heure,
 * rendus dans le panneau **monté en overlay CDK**. Ouvrez le champ pour les voir.
 */
export const ScopedIconFamily: Story = {
  decorators: [
    applicationConfig({ providers: [provideUiIconFamilies({ demo: demoFamily })] }),
    moduleMetadata({ imports: [UiDatepicker, UiIconFamilyScope, FormsModule] }),
  ],
  render: () => ({
    props: { model: new Date(2026, 6, 8), dateFormat: demoDateTimeFormat },
    template: `<div style="width:280px"><ui-datepicker uiIconFamily="demo"
      [(ngModel)]="model" valueType="date" label="Rendez-vous" showTime locale="fr-FR" [dateFormat]="dateFormat" /></div>`,
  }),
};

// --- Libellé flottant ---------------------------------------------------
/**
 * `floatLabel` fait descendre le libellé **dans** le champ, où il tient le rôle du
 * placeholder, puis le fait remonter au focus ou dès qu'une valeur est présente. Trois
 * positions hautes : `over` (au-dessus de la boîte), `in` (dans une bande réservée en haut
 * de la boîte, qui grandit d'autant) et `on` (à cheval sur le trait, qu'il entaille).
 */
export const FloatLabel: Story = {
  render: () => ({
    props: { a: null, b: null, c: sample, dateFormat: demoDateFormat },
    template: `
      <div style="display:grid; grid-template-columns:repeat(3, 200px); gap:28px 20px; align-items:start;">
        <ui-datepicker floatLabel="over" label="Over label" valueType="date" locale="fr-FR" [(ngModel)]="a" [dateFormat]="dateFormat" />
        <ui-datepicker floatLabel="in" label="In label" valueType="date" locale="fr-FR" [(ngModel)]="b" [dateFormat]="dateFormat" />
        <ui-datepicker floatLabel="on" label="On label" valueType="date" locale="fr-FR" [(ngModel)]="c" [dateFormat]="dateFormat" />
      </div>
    `,
  }),
};
