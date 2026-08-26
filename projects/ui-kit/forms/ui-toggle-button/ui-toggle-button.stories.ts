import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule, ReactiveFormsModule, FormControl, Validators } from '@angular/forms';
import { FormField, form, minLength, required } from '@angular/forms/signals';
import { UiIcon } from '@4sh/ui-kit/base/ui-icon';
import { UiToggleButton, ToggleButtonOption } from '@4sh/ui-kit/forms/ui-toggle-button';

const DAY_OPTIONS: ToggleButtonOption<string>[] = [
  { value: 'mon', label: 'Lun' },
  { value: 'tue', label: 'Mar' },
  { value: 'wed', label: 'Mer' },
  { value: 'thu', label: 'Jeu' },
  { value: 'fri', label: 'Ven' },
];

const FORMAT_OPTIONS: ToggleButtonOption<string>[] = [
  { value: 'bold', icon: 'bold', ariaLabel: 'Gras' },
  { value: 'italic', icon: 'italic', ariaLabel: 'Italique' },
  { value: 'underline', icon: 'underline', ariaLabel: 'Souligné' },
];

const CHANNEL_OPTIONS: ToggleButtonOption<string>[] = [
  { value: 'email', label: 'E-mail', icon: 'envelope' },
  { value: 'sms', label: 'SMS', icon: 'comment-sms' },
  { value: 'push', label: 'Push', icon: 'bell' },
];

const meta: Meta<UiToggleButton> = {
  title: 'Components/ui/forms/ui-toggle-button',
  component: UiToggleButton,
  decorators: [
    moduleMetadata({
      imports: [UiToggleButton, UiIcon, CommonModule, FormsModule, ReactiveFormsModule, FormField],
    }),
  ],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=3653-33842',
    },
  },
  argTypes: {
    label: {
      control: 'text',
      description: 'Libellé affiché dans les deux états (repli de `onLabel` / `offLabel`).',
      table: { type: { summary: 'string' } },
    },
    onLabel: {
      control: 'text',
      description: 'Libellé affiché à l’état pressé.',
      table: { type: { summary: 'string' } },
    },
    offLabel: {
      control: 'text',
      description: 'Libellé affiché à l’état relâché.',
      table: { type: { summary: 'string' } },
    },
    icon: {
      control: 'text',
      description: 'Icône affichée dans les deux états (repli de `onIcon` / `offIcon`).',
      table: { type: { summary: 'string' } },
    },
    onIcon: {
      control: 'text',
      description: 'Icône affichée à l’état pressé.',
      table: { type: { summary: 'string' } },
    },
    offIcon: {
      control: 'text',
      description: 'Icône affichée à l’état relâché.',
      table: { type: { summary: 'string' } },
    },
    iconPos: {
      control: 'inline-radio',
      options: ['left', 'right'],
      description: 'Côté du libellé où se place l’icône.',
      table: { type: { summary: 'ToggleButtonIconPos' }, defaultValue: { summary: "'left'" } },
    },
    trueValue: {
      control: false,
      description: 'Valeur du modèle à l’état pressé.',
      table: { type: { summary: 'T' }, defaultValue: { summary: 'true' } },
    },
    falseValue: {
      control: false,
      description: 'Valeur du modèle à l’état relâché.',
      table: { type: { summary: 'T' }, defaultValue: { summary: 'false' } },
    },
    options: {
      control: 'object',
      description:
        'Options du mode groupe, un bouton chacune (primitives, objets, ou `ToggleButtonOption`). Sa présence bascule le composant en groupe, dont le modèle est le tableau des valeurs pressées.',
      table: { type: { summary: '(T | ToggleButtonOption<T>)[]' } },
    },
    optionLabel: {
      control: 'text',
      description: 'Nom du champ libellé quand les options sont des objets.',
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
      description: 'Propriété comparée pour l’égalité des valeurs objet.',
      table: { type: { summary: 'string' } },
    },
    orientation: {
      control: 'inline-radio',
      options: ['horizontal', 'vertical'],
      description: 'Axe de disposition du groupe.',
      table: {
        type: { summary: 'ToggleButtonOrientation' },
        defaultValue: { summary: "'horizontal'" },
      },
    },
    level: {
      control: 'inline-radio',
      options: ['high', 'low', 'success', 'warning', 'error'],
      description: 'Famille de couleur de l’état pressé.',
      table: { type: { summary: 'UiLevel' }, defaultValue: { summary: "'high'" } },
    },
    variant: {
      control: 'inline-radio',
      options: ['outlined', 'filled', 'ghost'],
      description: 'Habillage de l’état relâché (l’état pressé est toujours plein).',
      table: { type: { summary: 'ToggleButtonVariant' }, defaultValue: { summary: "'outlined'" } },
    },
    size: {
      control: 'inline-radio',
      options: ['default', 'small', 'large'],
      table: { type: { summary: 'ToggleButtonSize' }, defaultValue: { summary: "'default'" } },
    },
    fluid: {
      control: 'boolean',
      description:
        'Occupe toute la largeur du parent (en mode groupe, les boutons se répartissent à parts égales).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    rounded: {
      control: 'boolean',
      description: 'Forme pilule.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    allowEmpty: {
      control: 'boolean',
      description: 'Le dernier bouton pressé peut être relâché (simple) / le groupe vidé.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    ariaLabel: {
      control: 'text',
      description:
        'Nom accessible stable, indépendant de l’état. Obligatoire en icône seule, en groupe, et dès que `onLabel`/`offLabel` diffèrent.',
      table: { type: { summary: 'string' } },
    },
    ariaLabelledBy: {
      control: false,
      description: 'id d’un élément externe qui labellise le contrôle.',
      table: { type: { summary: 'string' } },
    },
    required: {
      control: 'boolean',
      description:
        'Hérité de `BaseFieldControl`, sans effet ARIA ici : `aria-required` n’est pas autorisé sur `role="button"`. Porter l’obligation dans le libellé.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: 'boolean',
      description: 'Désactive le contrôle (attribut natif).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    readonly: {
      control: 'boolean',
      description: 'Focusable mais non modifiable.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    invalid: {
      control: 'boolean',
      description:
        'Force le style erreur (automatique quand le contrôle attaché est invalide et touched/dirty).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    iconTemplate: { control: false, table: { type: { summary: 'TemplateRef' } } },
    contentTemplate: { control: false, table: { type: { summary: 'TemplateRef' } } },
    itemTemplate: { control: false, table: { type: { summary: 'TemplateRef' } } },
    toggleChange: {
      action: 'toggleChange',
      description: 'Émis à l’interaction avec la nouvelle valeur du modèle.',
      table: { disable: true },
    },
    optionClick: {
      action: 'optionClick',
      description: 'Émis au clic sur un bouton du groupe (même sans changement de valeur).',
      table: { disable: true },
    },
  },
  args: {
    label: 'Notifications',
    iconPos: 'left',
    level: 'high',
    variant: 'outlined',
    size: 'default',
    orientation: 'horizontal',
    fluid: false,
    rounded: false,
    allowEmpty: true,
    required: false,
    disabled: false,
    readonly: false,
    invalid: false,
  },
};

export default meta;
type Story = StoryObj<UiToggleButton>;

// --- Basic : liaison bidirectionnelle sur un booléen -------------------
export const Basic: Story = {
  render: (args) => ({
    props: { ...args, model: false },
    template: `
      <div style="display:grid; gap:12px; justify-items:start;">
        <ui-toggle-button
          [(ngModel)]="model"
          [label]="label" [icon]="icon" [iconPos]="iconPos"
          [level]="level" [variant]="variant" [size]="size"
          [fluid]="fluid" [rounded]="rounded" [allowEmpty]="allowEmpty"
          [required]="required" [disabled]="disabled" [readonly]="readonly" [invalid]="invalid"
          [ariaLabel]="ariaLabel"
          (toggleChange)="toggleChange($event)" />
        <code>model = {{ model }}</code>
      </div>
    `,
  }),
};

// --- Libellés et icônes par état ---------------------------------------
export const States: Story = {
  render: () => ({
    props: { a: false, b: true },
    template: `
      <div style="display:grid; gap:16px; justify-items:start;">
        <ui-toggle-button [(ngModel)]="a"
          onLabel="Abonné" offLabel="S’abonner"
          onIcon="bell" offIcon="bell-slash"
          ariaLabel="Abonnement à la lettre d’information" />
        <ui-toggle-button [(ngModel)]="b"
          onLabel="Visible" offLabel="Masqué"
          onIcon="eye" offIcon="eye-slash" iconPos="right"
          ariaLabel="Visibilité du bloc" />
      </div>
    `,
  }),
};

// --- Customized : template d’icône piloté par l’état interne -----------
export const Customized: Story = {
  render: () => ({
    props: { model: true },
    template: `
      <div style="display:grid; gap:12px; justify-items:start;">
        <ui-toggle-button [(ngModel)]="model" label="Favori"
          [iconTemplate]="star" ariaLabel="Ajouter aux favoris" />
        <ng-template #star let-checked>
          <ui-icon name="star" [type]="checked ? 'solid' : 'outline'" />
        </ng-template>
        <code>model = {{ model }}</code>
      </div>
    `,
  }),
};

// --- Sizes --------------------------------------------------------------
export const Sizes: Story = {
  render: () => ({
    props: { a: true, b: true, c: true },
    template: `
      <div style="display:flex; gap:16px; align-items:center;">
        <ui-toggle-button [(ngModel)]="a" label="Small" size="small" ariaLabel="Petit" />
        <ui-toggle-button [(ngModel)]="b" label="Default" ariaLabel="Défaut" />
        <ui-toggle-button [(ngModel)]="c" label="Large" size="large" ariaLabel="Grand" />
      </div>
    `,
  }),
};

// --- Levels : couleur de l’état pressé ---------------------------------
export const Levels: Story = {
  render: () => ({
    props: { levels: ['high', 'low', 'success', 'warning', 'error'] },
    template: `
      <div style="display:flex; gap:12px; flex-wrap:wrap;">
        @for (lvl of levels; track lvl) {
          <ui-toggle-button [ngModel]="true" [level]="lvl" [label]="lvl" [ariaLabel]="lvl" />
        }
      </div>
    `,
  }),
};

// --- Variants : habillage de l’état relâché ----------------------------
export const Variants: Story = {
  render: () => ({
    props: { variants: ['outlined', 'filled', 'ghost'] },
    template: `
      <div style="display:grid; gap:12px;">
        @for (v of variants; track v) {
          <div style="display:flex; gap:12px; align-items:center;">
            <ui-toggle-button [ngModel]="false" [variant]="v" [label]="v" [ariaLabel]="v" />
            <ui-toggle-button [ngModel]="true" [variant]="v" [label]="v" [ariaLabel]="v" />
          </div>
        }
      </div>
    `,
  }),
};

// --- Icon only ----------------------------------------------------------
export const IconOnly: Story = {
  name: 'Icon Only',
  render: () => ({
    props: { model: true },
    template: `
      <div style="display:flex; gap:12px;">
        <ui-toggle-button [(ngModel)]="model" icon="bold" ariaLabel="Gras" />
        <ui-toggle-button [ngModel]="false" icon="italic" ariaLabel="Italique" [rounded]="true" />
      </div>
    `,
  }),
};

// --- Group : le modèle est le tableau des valeurs pressées -------------
export const Group: Story = {
  render: () => ({
    props: { model: ['mon', 'wed'], opts: DAY_OPTIONS },
    template: `
      <div style="display:grid; gap:12px; justify-items:start;">
        <ui-toggle-button [(ngModel)]="model" [options]="opts" ariaLabel="Jours travaillés" />
        <code>model = {{ model | json }}</code>
      </div>
    `,
  }),
};

// --- Group : boutons carrés en icône seule -----------------------------
export const GroupIconOnly: Story = {
  name: 'Group Icon Only',
  render: () => ({
    props: { model: ['bold'], opts: FORMAT_OPTIONS },
    template: `
      <div style="display:grid; gap:12px; justify-items:start;">
        <ui-toggle-button [(ngModel)]="model" [options]="opts" ariaLabel="Mise en forme" />
        <code>model = {{ model | json }}</code>
      </div>
    `,
  }),
};

// --- Group vertical -----------------------------------------------------
export const GroupVertical: Story = {
  name: 'Group Vertical',
  render: () => ({
    props: { model: ['email'], opts: CHANNEL_OPTIONS },
    template: `
      <ui-toggle-button [(ngModel)]="model" [options]="opts"
        orientation="vertical" ariaLabel="Canaux de notification" />
    `,
  }),
};

// --- Fluid : pleine largeur --------------------------------------------
export const Fluid: Story = {
  render: () => ({
    props: { single: true, group: ['email'], opts: CHANNEL_OPTIONS },
    template: `
      <div style="width:420px; display:grid; gap:16px;">
        <ui-toggle-button [(ngModel)]="single" label="Pleine largeur" [fluid]="true" ariaLabel="Pleine largeur" />
        <ui-toggle-button [(ngModel)]="group" [options]="opts" [fluid]="true" ariaLabel="Canaux de notification" />
      </div>
    `,
  }),
};

// --- Disabled -----------------------------------------------------------
export const Disabled: Story = {
  render: () => ({
    props: {
      off: false,
      on: true,
      mixed: [
        { value: 'email', label: 'E-mail' },
        { value: 'sms', label: 'SMS' },
        { value: 'push', label: 'Push', disabled: true },
      ],
      partial: ['sms'],
    },
    template: `
      <div style="display:grid; gap:16px; justify-items:start;">
        <div style="display:flex; gap:12px;">
          <ui-toggle-button [(ngModel)]="off" label="Relâché" [disabled]="true" ariaLabel="Relâché désactivé" />
          <ui-toggle-button [(ngModel)]="on" label="Pressé" [disabled]="true" ariaLabel="Pressé désactivé" />
        </div>
        <ui-toggle-button [(ngModel)]="partial" [options]="mixed" ariaLabel="Option désactivée" />
      </div>
    `,
  }),
};

// --- Invalid ------------------------------------------------------------
export const Invalid: Story = {
  render: () => ({
    props: { model: false, group: [], opts: CHANNEL_OPTIONS },
    template: `
      <div style="display:grid; gap:16px; justify-items:start;">
        <ui-toggle-button [(ngModel)]="model" label="Conditions acceptées" [invalid]="true"
          [required]="true" ariaLabel="Conditions acceptées" />
        <ui-toggle-button [(ngModel)]="group" [options]="opts" [invalid]="true" ariaLabel="Canaux de notification" />
      </div>
    `,
  }),
};

// --- Readonly -----------------------------------------------------------
export const Readonly: Story = {
  render: () => ({
    props: { model: true },
    template: `
      <ui-toggle-button [(ngModel)]="model" label="Lecture seule" [readonly]="true" ariaLabel="Lecture seule" />
    `,
  }),
};

// --- Signal Forms (@angular/forms/signals) ------------------------------
@Component({
  selector: 'demo-toggle-button-signal-forms',
  standalone: true,
  imports: [UiToggleButton, FormField, CommonModule],
  template: `
    <div style="display: grid; gap: 12px; justify-items: start">
      <ui-toggle-button
        [formField]="terms"
        label="J’accepte les conditions"
        ariaLabel="Conditions"
      />
      <ui-toggle-button [formField]="channels" [options]="options" ariaLabel="Canaux" />
      <code>
        terms = {{ terms().value() }} · channels = {{ channels().value() | json }} · valid =
        {{ model().valid() }}
      </code>
    </div>
  `,
})
class SignalFormsDemo {
  protected readonly options = CHANNEL_OPTIONS;
  protected readonly state = signal<{ terms: boolean; channels: string[] }>({
    terms: false,
    channels: [],
  });
  protected readonly model = form(this.state, (path) => {
    required(path.terms);
    minLength(path.channels, 1);
  });
  protected readonly terms = this.model.terms;
  protected readonly channels = this.model.channels;
}

export const SignalForms: Story = {
  name: 'Signal Forms',
  render: () => ({ template: `<demo-toggle-button-signal-forms />` }),
  decorators: [moduleMetadata({ imports: [SignalFormsDemo] })],
};

// --- Template Driven ([(ngModel)] + validation native) ------------------
export const TemplateDriven: Story = {
  name: 'Template Driven',
  render: () => ({
    props: { model: false },
    template: `
      <form #f="ngForm" style="display:grid; gap:12px; justify-items:start;">
        <ui-toggle-button [(ngModel)]="model" name="notify" label="Notifications" ariaLabel="Notifications" />
        <code>model = {{ model }} · form.valid = {{ f.valid }}</code>
      </form>
    `,
  }),
};

// --- Reactive Forms (FormControl) ---------------------------------------
export const ReactiveForms: Story = {
  name: 'Reactive Forms',
  render: () => ({
    props: {
      control: new FormControl<string[]>([], Validators.required),
      opts: CHANNEL_OPTIONS,
    },
    template: `
      <div style="display:grid; gap:12px; justify-items:start;">
        <ui-toggle-button [formControl]="control" [options]="opts" ariaLabel="Canaux de notification" />
        <code>value = {{ control.value | json }} · valid = {{ control.valid }}</code>
        <button type="button" (click)="control.disabled ? control.enable() : control.disable()">
          Activer / désactiver
        </button>
      </div>
    `,
  }),
};
