import { Component, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { FormField, form, minLength, required } from '@angular/forms/signals';
import { UiInput } from '@4sh/ui-kit/forms/ui-input';
import { UiIcon, UiIconFamilyScope, provideUiIconFamilies } from '@4sh/ui-kit/base/ui-icon';

const meta: Meta<UiInput> = {
  title: 'Components/ui/forms/ui-input',
  component: UiInput,
  decorators: [moduleMetadata({ imports: [UiInput, FormsModule] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=113-2996&t=0SWBsuymjEi87t6k-1',
    },
  },
  argTypes: {
    label: { control: 'text', table: { type: { summary: 'string' } } },
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
    showMessageIcon: {
      control: 'boolean',
      description:
        "Préfixe le message (aide ou erreur) d'une icône décorative. Éteinte par défaut.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    messageIcon: {
      control: 'text',
      description:
        "Glyphe du message. Vide = l'icône déduite du `level` (`question-circle` / `check-circle` / `times-circle`). N'allume pas l'icône à lui seul.",
      table: { type: { summary: 'string' } },
    },
    placeholder: { control: 'text', table: { type: { summary: 'string' } } },
    type: {
      control: 'select',
      options: ['text', 'password', 'email', 'tel', 'url', 'search'],
      table: { type: { summary: 'InputType' }, defaultValue: { summary: '"text"' } },
    },
    size: {
      control: 'inline-radio',
      options: ['default', 'small'],
      table: { type: { summary: 'FieldSize' }, defaultValue: { summary: '"default"' } },
    },
    level: {
      control: 'inline-radio',
      options: ['default', 'success', 'error'],
      table: { type: { summary: 'FieldLevel' }, defaultValue: { summary: '"default"' } },
    },
    floatLabel: {
      control: 'select',
      options: [undefined, 'over', 'in', 'on'],
      labels: { undefined: 'aucun (libellé classique)' },
      description:
        'Libellé flottant : le libellé descend dans le champ, où il tient le rôle du placeholder, et remonte au focus ou dès que le champ porte une valeur. Le `placeholder` natif est alors neutralisé.',
      table: { type: { summary: 'FieldFloatLabel' }, defaultValue: { summary: 'undefined' } },
    },
    unit: {
      control: 'text',
      description: 'Unité suffixe.',
      table: { type: { summary: 'string' } },
    },
    iconLeft: { control: 'text', table: { type: { summary: 'string' } } },
    iconRight: { control: 'text', table: { type: { summary: 'string' } } },
    iconLeftTemplate: {
      control: false,
      description:
        "Template d'icône gauche fourni par code (équivalent du `<ng-template #iconLeft>` projeté, qui reste prioritairement lisible côté app).",
      table: { type: { summary: 'TemplateRef<UiInputIconContext>' } },
    },
    iconRightTemplate: {
      control: false,
      description:
        "Template d'icône droite fourni par code — c'est ce que `ui-datepicker` utilise pour forwarder son `#icon` vers le déclencheur.",
      table: { type: { summary: 'TemplateRef<UiInputIconContext>' } },
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
    iconRightClick: { action: 'iconRightClick', table: { disable: true } },
    inputFocus: { action: 'inputFocus', table: { disable: true } },
    inputBlur: { action: 'inputBlur', table: { disable: true } },
  },
  args: {
    label: 'Label',
    placeholder: 'Placeholder',
    type: 'text',
    size: 'default',
    level: 'default',
    showMessageIcon: false,
  },
};

export default meta;
type Story = StoryObj<UiInput>;

const TEMPLATE = `<div style="width:260px"><ui-input
    [(ngModel)]="model"
    [label]="label" [helperText]="helperText" [errorText]="errorText" [placeholder]="placeholder"
    [type]="type" [size]="size" [level]="level" [unit]="unit" [floatLabel]="floatLabel"
    [iconLeft]="iconLeft" [iconRight]="iconRight"
    [showMessageIcon]="showMessageIcon" [messageIcon]="messageIcon"
    [required]="required" [disabled]="disabled" [readonly]="readonly" [invalid]="invalid"
    (valueChange)="valueChange($event)" /></div>`;

const story =
  (value = ''): Story['render'] =>
  (args) => ({ props: { ...args, model: value }, template: TEMPLATE });

export const Default: Story = { render: story(), args: { label: 'Nom', placeholder: 'Votre nom' } };
export const WithValue: Story = { render: story('Robin'), args: { label: 'Nom' } };
export const WithHelper: Story = {
  render: story(),
  args: {
    label: 'Email',
    placeholder: 'nom@exemple.fr',
    helperText: 'Nous ne partagerons jamais votre email.',
  },
};
export const MessageIcon: Story = {
  render: story(),
  args: {
    label: 'Email',
    placeholder: 'nom@exemple.fr',
    helperText: 'Nous ne le partagerons jamais.',
    showMessageIcon: true,
  },
};
export const MessageIconCustom: Story = {
  render: story(),
  args: {
    label: 'Mot de passe',
    type: 'password',
    helperText: '12 caractères minimum.',
    showMessageIcon: true,
    messageIcon: 'lightbulb',
  },
};
export const Required: Story = { render: story(), args: { label: 'Nom', required: true } };
export const Success: Story = {
  render: story('robin'),
  args: { label: "Nom d'utilisateur", level: 'success', helperText: 'Disponible.' },
};
export const Error: Story = {
  render: story('robin@'),
  args: { label: 'Email', level: 'error', helperText: 'Adresse e-mail invalide.' },
};
export const ErrorText: Story = {
  render: story('robin@'),
  args: {
    label: 'Email',
    invalid: true,
    helperText: 'Aide neutre.',
    errorText: 'Adresse e-mail invalide.',
  },
};
export const Small: Story = {
  render: story(),
  args: { label: 'Compact', size: 'small', placeholder: 'Placeholder' },
};
export const WithUnit: Story = { render: story('50'), args: { label: 'Remise', unit: '%' } };
export const Disabled: Story = {
  render: story('Non modifiable'),
  args: { label: 'Champ', disabled: true },
};
export const Readonly: Story = {
  render: story('Lecture seule'),
  args: { label: 'Champ', readonly: true },
};

// --- Libellé flottant ---------------------------------------------------
/**
 * `floatLabel` fait descendre le libellé **dans** le champ, où il tient le rôle du
 * placeholder, puis le fait remonter au focus ou dès qu'une valeur est présente. Trois
 * positions hautes : `over` (au-dessus de la boîte, là où se place un libellé classique),
 * `in` (dans une bande réservée en haut de la boîte, qui grandit d'autant) et `on` (à
 * cheval sur le trait, qu'il entaille).
 *
 * Ligne du haut au repos, ligne du bas avec une valeur : c'est le même champ dans ses deux
 * états. Cliquer dans un champ vide fait la transition.
 */
export const FloatLabel: Story = {
  render: () => ({
    props: { a: '', b: '', c: '', d: 'Robin', e: 'Robin', f: 'Robin' },
    template: `<div style="display:grid; grid-template-columns:repeat(3, 200px); gap:28px 20px; align-items:end">
      <ui-input [(ngModel)]="a" floatLabel="over" label="Over label" />
      <ui-input [(ngModel)]="b" floatLabel="in" label="In label" />
      <ui-input [(ngModel)]="c" floatLabel="on" label="On label" />
      <ui-input [(ngModel)]="d" floatLabel="over" label="Over label" />
      <ui-input [(ngModel)]="e" floatLabel="in" label="In label" />
      <ui-input [(ngModel)]="f" floatLabel="on" label="On label" />
    </div>`,
  }),
};

/**
 * Le mode flottant ne retire rien : marqueur `required`, niveaux, message d'aide ou
 * d'erreur, `small`, icônes et zone d'action se composent comme sur un libellé classique.
 */
export const FloatLabelStates: Story = {
  render: () => ({
    props: { a: '', b: 'robin@', c: 'Non modifiable', d: '' },
    template: `<div style="display:grid; grid-template-columns:repeat(2, 220px); gap:28px 20px; align-items:start">
      <ui-input [(ngModel)]="a" floatLabel="on" label="Nom" required helperText="Tel qu'il figure sur la pièce d'identité." />
      <ui-input [(ngModel)]="b" floatLabel="on" label="Email" invalid errorText="Adresse e-mail invalide." />
      <ui-input [(ngModel)]="c" floatLabel="in" label="Champ" disabled />
      <ui-input [(ngModel)]="d" floatLabel="in" label="Recherche" size="small" iconLeft="magnifying-glass" />
    </div>`,
  }),
};

// Zone d'action droite : recherche → icône « effacer » visible seulement avec du texte, clic vide.
export const Search: Story = {
  render: () => ({
    props: { model: 'uiyuiyuiuyi' },
    template: `<div style="width:260px"><ui-input
      [(ngModel)]="model"
      label="Recherche"
      placeholder="Rechercher…"
      iconLeft="magnifying-glass"
      [iconRight]="model ? 'xmark' : undefined"
      iconRightAriaLabel="Effacer la recherche"
      (iconRightClick)="model = ''" /></div>`,
  }),
};

// Zone d'action droite : mot de passe → l'œil bascule l'affichage.
export const Password: Story = {
  render: () => ({
    props: { model: 'motdepasse', revealed: false },
    template: `<div style="width:260px"><ui-input
      [(ngModel)]="model"
      label="Mot de passe"
      [type]="revealed ? 'text' : 'password'"
      [iconRight]="revealed ? 'eye-slash' : 'eye'"
      [iconRightAriaLabel]="revealed ? 'Masquer le mot de passe' : 'Afficher le mot de passe'"
      (iconRightClick)="revealed = !revealed" /></div>`,
  }),
};

// --- Signal Forms (@angular/forms/signals) ------------------------------
@Component({
  selector: 'demo-input-signal-forms',
  standalone: true,
  imports: [UiInput, FormField],
  template: `
    <div style="width:260px; display:grid; gap:12px; justify-items:start;">
      <ui-input
        [formField]="field"
        label="Nom"
        placeholder="Votre nom"
        helperText="3 caractères minimum."
        errorText="3 caractères minimum."
      />
      <code>value = {{ field().value() }} · valid = {{ field().valid() }}</code>
    </div>
  `,
})
class SignalFormsDemo {
  protected readonly model = signal('');
  protected readonly field = form(this.model, (path) => {
    required(path);
    minLength(path, 3);
  });
}

export const SignalForms: Story = {
  name: 'Signal Forms',
  render: () => ({ template: `<demo-input-signal-forms />` }),
  decorators: [moduleMetadata({ imports: [SignalFormsDemo] })],
};

// --- Templates d'icône (#iconLeft / #iconRight) -------------------------
/** Famille de démonstration : remappe quelques noms sur d'autres glyphes FontAwesome, pour rendre
 *  la bascule visible sans charger une seconde police d'icônes. */
const DEMO_GLYPHS: Record<string, string> = {
  'magnifying-glass': 'binoculars',
  xmark: 'circle-xmark',
  sun: 'circle-half-stroke',
};
const demoFamily = { classes: (name: string) => `fa-solid fa-${DEMO_GLYPHS[name] ?? name}` };

/**
 * Chaque zone d'icône accepte un `<ng-template>` qui remplace le markup rendu : icône d'une autre
 * famille, SVG de marque, n'importe quel contenu. Contexte reçu : `$implicit` = le nom configuré
 * sur cette zone, `size` = la taille calée sur le champ, `disabled` = l'état du champ.
 *
 * À gauche, un SVG de marque ; à droite, la zone d'action garde son `<button>` accessible
 * (`iconRightAriaLabel` + `iconRightClick`), seul son contenu est remplacé — ici par une icône
 * d'une autre famille.
 */
export const IconTemplate: Story = {
  decorators: [
    applicationConfig({ providers: [provideUiIconFamilies({ demo: demoFamily })] }),
    moduleMetadata({ imports: [UiInput, UiIcon, FormsModule] }),
  ],
  render: () => ({
    props: { model: '' },
    template: `<div style="width:280px; display:grid; gap:16px">
      <ui-input [(ngModel)]="model" label="Espace de travail" placeholder="Nom de l'espace">
        <ng-template #iconLeft>
          <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
            <rect width="16" height="16" rx="4" fill="var(--actions-high-surface-default)" />
            <path d="M4.5 8.5l2.5 2.5 4.5-5" fill="none" stroke="var(--actions-high-content-default)" stroke-width="1.8" stroke-linecap="round" />
          </svg>
        </ng-template>
      </ui-input>

      <ui-input [(ngModel)]="model" label="Thème" placeholder="Clair / sombre"
                iconRight="sun" iconRightAriaLabel="Inverser le thème">
        <ng-template #iconRight let-name let-size="size">
          <ui-icon [name]="name" family="demo" [size]="size" />
        </ng-template>
      </ui-input>
    </div>`,
  }),
};

/**
 * Autre échelle, autre levier : la directive `uiIconFamily` bascule **toutes** les icônes
 * descendantes d'un coup (ici les deux champs), sans viser une icône en particulier ni toucher au
 * reste de l'application. Un template vise une icône ; la directive vise une zone.
 */
export const ScopedIconFamily: Story = {
  decorators: [
    applicationConfig({ providers: [provideUiIconFamilies({ demo: demoFamily })] }),
    moduleMetadata({ imports: [UiInput, UiIconFamilyScope, FormsModule] }),
  ],
  render: () => ({
    props: { a: 'Rapport annuel', b: '' },
    template: `<div uiIconFamily="demo" style="width:280px; display:grid; gap:16px">
      <ui-input [(ngModel)]="a" label="Recherche" iconLeft="magnifying-glass"
                [iconRight]="a ? 'xmark' : undefined" iconRightAriaLabel="Effacer" (iconRightClick)="a = ''" />
      <ui-input [(ngModel)]="b" label="Filtre" iconLeft="magnifying-glass" placeholder="Filtrer…" />
    </div>`,
  }),
};
