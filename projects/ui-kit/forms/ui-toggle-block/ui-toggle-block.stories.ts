import { Component, signal } from '@angular/core';
import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import { FormField, form, required } from '@angular/forms/signals';
import { UiToggleBlock } from '@4sh/ui-kit/forms/ui-toggle-block';
import { UiIcon } from '@4sh/ui-kit/base/ui-icon';
import { UiTag } from '@4sh/ui-kit/informative/ui-tag';

const meta: Meta<UiToggleBlock> = {
  title: 'Components/ui/forms/ui-toggle-block',
  component: UiToggleBlock,
  decorators: [moduleMetadata({ imports: [UiToggleBlock, UiIcon, UiTag, FormsModule] })],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    indicator: {
      control: { type: 'inline-radio' },
      options: ['checkbox', 'radio', 'toggle'],
      description: 'Contrôle de sélection embarqué dans le bloc.',
      table: { type: { summary: 'ToggleBlockIndicator' }, defaultValue: { summary: '"checkbox"' } },
    },
    indicatorPosition: {
      control: { type: 'inline-radio' },
      options: ['start', 'end'],
      description: 'Côté du bloc où se place l’indicateur.',
      table: {
        type: { summary: 'ToggleBlockIndicatorPosition' },
        defaultValue: { summary: '"start"' },
      },
    },
    align: {
      control: { type: 'inline-radio' },
      options: ['center', 'start'],
      description: 'Alignement vertical de l’indicateur face au contenu.',
      table: { type: { summary: 'ToggleBlockAlign' }, defaultValue: { summary: '"center"' } },
    },
    hideIndicator: {
      control: { type: 'boolean' },
      description: 'Masque l’indicateur sans le retirer (carte de sélection) : il reste focusable.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['small', 'default', 'large'],
      description: 'Taille (inset, écart et échelle typographique).',
      table: { type: { summary: 'ToggleBlockSize' }, defaultValue: { summary: '"default"' } },
    },
    label: {
      control: { type: 'text' },
      description: 'Ligne principale du bloc.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    description: {
      control: { type: 'text' },
      description: 'Ligne secondaire sous le libellé.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    value: {
      control: false,
      description: 'Valeur portée par ce bloc en mode `radio` (le modèle la prend à la sélection).',
      table: { type: { summary: 'T' }, defaultValue: { summary: 'undefined' } },
    },
    trueValue: {
      control: false,
      description: 'Valeur du modèle à la sélection, en mode `checkbox` / `toggle`.',
      table: { type: { summary: 'T' }, defaultValue: { summary: 'true' } },
    },
    falseValue: {
      control: false,
      description: 'Valeur du modèle à la désélection, en mode `checkbox` / `toggle`.',
      table: { type: { summary: 'T' }, defaultValue: { summary: 'false' } },
    },
    fluid: {
      control: { type: 'boolean' },
      description: 'Occupe toute la largeur du parent.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    ripple: {
      control: { type: 'boolean' },
      description:
        'Onde au clic sur le bloc (visible seulement si l’effet est activé, globalement ou par un scope).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    ariaLabel: {
      control: { type: 'text' },
      description: 'Nom accessible explicite (remplace celui déduit du contenu du bloc).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    required: {
      control: { type: 'boolean' },
      description: 'Marqueur requis (*) + attribut natif required.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Désactive le bloc (attribut natif sur le contrôle).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    readonly: {
      control: { type: 'boolean' },
      description: 'Focusable mais non modifiable (souris et clavier).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    invalid: {
      control: { type: 'boolean' },
      description: 'Force le style erreur (auto si le contrôle est invalide et touché/modifié).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    tabindex: {
      control: { type: 'number' },
      description: 'tabindex forwardé sur l’input natif.',
      table: { type: { summary: 'number' }, defaultValue: { summary: 'undefined' } },
    },
    blockChange: { action: 'blockChange', table: { disable: true } },
    blockFocus: { action: 'blockFocus', table: { disable: true } },
    blockBlur: { action: 'blockBlur', table: { disable: true } },
  },
  args: {
    indicator: 'checkbox',
    indicatorPosition: 'start',
    align: 'center',
    hideIndicator: false,
    size: 'default',
    fluid: true,
    ripple: true,
    label: 'Notifications par e-mail',
    description: 'Un récapitulatif quotidien de votre activité.',
  },
};

export default meta;
type Story = StoryObj<UiToggleBlock>;

// Piloté par ngModel pour une sélection réellement interactive dans Storybook.
const TEMPLATE = `<div style="width: 360px">
  <ui-toggle-block
    [(ngModel)]="model"
    [indicator]="indicator" [indicatorPosition]="indicatorPosition" [align]="align"
    [hideIndicator]="hideIndicator" [size]="size" [fluid]="fluid" [ripple]="ripple"
    [label]="label" [description]="description" [ariaLabel]="ariaLabel"
    [required]="required" [disabled]="disabled" [readonly]="readonly"
    [invalid]="invalid" [tabindex]="tabindex"
    (blockChange)="blockChange($event)" />
</div>`;

/** Story factory: `on` seeds the initial ngModel value. */
const story =
  (on = false): Story['render'] =>
  (args) => ({ props: { ...args, model: on }, template: TEMPLATE });

export const Default: Story = { render: story() };
export const Checked: Story = { render: story(true) };

export const Switch: Story = {
  render: story(true),
  args: {
    indicator: 'toggle',
    indicatorPosition: 'end',
    label: 'Mode sombre',
    description: 'Suit le réglage du système au prochain démarrage.',
  },
};

export const Required: Story = {
  render: story(),
  args: {
    required: true,
    label: 'Conditions générales',
    description: 'Obligatoire pour créer un compte.',
  },
};
export const Disabled: Story = {
  render: story(),
  args: { disabled: true, label: 'Option indisponible', description: 'Réservée aux comptes pro.' },
};
export const Readonly: Story = {
  render: story(true),
  args: {
    readonly: true,
    label: 'Sauvegarde quotidienne',
    description: 'Imposée par votre offre.',
  },
};
export const Invalid: Story = {
  render: story(),
  args: { invalid: true, label: 'Conditions générales', description: 'À accepter pour continuer.' },
};

// Sans libellé visible : le nom accessible vient du contenu, sinon d'ariaLabel
export const NoLabel: Story = {
  render: story(),
  args: { label: undefined, description: undefined, ariaLabel: 'Notifications par e-mail' },
};

// --- Sizes ---------------------------------------------------------------
export const Sizes: Story = {
  name: 'Sizes',
  render: (args) => ({
    props: { ...args, small: false, medium: true, large: false },
    template: `<div style="display: grid; gap: 12px; width: 380px">
      <ui-toggle-block fluid size="small" [(ngModel)]="small"
        label="Small" description="Inset et typographie resserrés." />
      <ui-toggle-block fluid [(ngModel)]="medium"
        label="Default" description="Densité de référence des formulaires." />
      <ui-toggle-block fluid size="large" [(ngModel)]="large"
        label="Large" description="Pour une liste de choix qui porte le contenu." />
    </div>`,
  }),
};

// --- Groups --------------------------------------------------------------
// Choix exclusif : même `name`, même modèle, un `value` par bloc.
@Component({
  selector: 'demo-toggle-block-radio-group',
  imports: [UiToggleBlock, FormsModule],
  template: `
    <fieldset
      style="display: grid; gap: 12px; width: 380px; border: 0; padding: 0; margin: 0"
      role="radiogroup"
      aria-labelledby="demo-plan-legend"
    >
      <legend id="demo-plan-legend" style="padding: 0 0 8px; font-weight: 700">
        Formule d'hébergement
      </legend>

      @for (plan of plans; track plan.id) {
        <ui-toggle-block
          fluid
          indicator="radio"
          name="demo-plan"
          [value]="plan.id"
          [ngModel]="selected()"
          [label]="plan.name"
          [description]="plan.description"
          (blockChange)="selected.set($event)"
        />
      }
      <code>selected = {{ selected() }}</code>
    </fieldset>
  `,
})
class RadioGroupDemo {
  protected readonly selected = signal<string>('eu-west');
  protected readonly plans = [
    { id: 'us-east', name: 'US East', description: 'Latence basse, montée en charge auto.' },
    { id: 'eu-west', name: 'EU West', description: 'Pipeline CI/CD, sauvegardes quotidiennes.' },
    { id: 'eu-east', name: 'EU East', description: 'Conforme RGPD, chiffrement au repos.' },
  ];
}

// Choix multiple : un modèle booléen par bloc, regroupés dans un role="group".
@Component({
  selector: 'demo-toggle-block-checkbox-group',
  imports: [UiToggleBlock, FormsModule],
  template: `
    <div
      style="display: grid; gap: 12px; width: 380px"
      role="group"
      aria-labelledby="demo-alerts-legend"
    >
      <span id="demo-alerts-legend" style="font-weight: 700">Alertes</span>

      @for (option of options; track option.id) {
        <ui-toggle-block
          fluid
          size="small"
          [name]="'demo-alert-' + option.id"
          [(ngModel)]="option.on"
          [label]="option.name"
          [description]="option.description"
        />
      }
    </div>
  `,
})
class CheckboxGroupDemo {
  protected readonly options = [
    {
      id: 'deploy',
      name: 'Déploiements',
      description: 'Succès et échecs de mise en production.',
      on: true,
    },
    { id: 'quota', name: 'Quotas', description: 'Seuil de consommation atteint.', on: false },
    {
      id: 'security',
      name: 'Sécurité',
      description: 'Connexion depuis un appareil inconnu.',
      on: true,
    },
  ];
}

export const Groups: Story = {
  name: 'Groups',
  render: () => ({
    template: `<div style="display: grid; gap: 32px">
      <demo-toggle-block-radio-group />
      <demo-toggle-block-checkbox-group />
    </div>`,
  }),
  decorators: [moduleMetadata({ imports: [RadioGroupDemo, CheckboxGroupDemo] })],
};

// --- Custom template -----------------------------------------------------
// Le contenu projeté remplace / complète `label` + `description`.
export const CustomTemplate: Story = {
  name: 'Custom Template',
  render: () => ({
    props: { plan: 'team' },
    template: `<div style="display: grid; gap: 12px; width: 420px" role="radiogroup" aria-label="Formule">
      <ui-toggle-block fluid indicator="radio" name="demo-tpl" value="solo" align="start"
        indicatorPosition="end" [ngModel]="plan" (blockChange)="plan = $event">
        <span style="display: flex; align-items: center; gap: 8px; font-weight: 700">
          <ui-icon name="user" size="md" />
          Solo
          <ui-tag label="9 €/mois" level="highlight" />
        </span>
        <span style="color: var(--form-low-content-default)">1 projet, 1 utilisateur.</span>
      </ui-toggle-block>

      <ui-toggle-block fluid indicator="radio" name="demo-tpl" value="team" align="start"
        indicatorPosition="end" [ngModel]="plan" (blockChange)="plan = $event">
        <span style="display: flex; align-items: center; gap: 8px; font-weight: 700">
          <ui-icon name="users" size="md" />
          Team
          <ui-tag label="Populaire" level="success" />
        </span>
        <span style="color: var(--form-low-content-default)">Projets illimités, 10 utilisateurs.</span>
        <a href="#custom-template" style="width: fit-content">Comparer les formules</a>
      </ui-toggle-block>
    </div>`,
  }),
};

// --- Selection card (indicateur masqué) ----------------------------------
export const HiddenIndicator: Story = {
  name: 'Hidden Indicator',
  render: () => ({
    props: { theme: 'auto' },
    template: `<div style="display: flex; gap: 12px" role="radiogroup" aria-label="Thème">
      @for (option of ['clair', 'sombre', 'auto']; track option) {
        <ui-toggle-block hideIndicator indicator="radio" name="demo-theme" [value]="option"
          [ngModel]="theme" (blockChange)="theme = $event" [label]="option" />
      }
    </div>`,
  }),
};

// --- Signal Forms (@angular/forms/signals) -------------------------------
@Component({
  selector: 'demo-toggle-block-signal-forms',
  imports: [UiToggleBlock, FormField],
  template: `
    <div style="display: grid; gap: 8px; width: 380px">
      <ui-toggle-block
        fluid
        [formField]="terms"
        label="Conditions générales"
        description="Je les ai lues et je les accepte."
      />
      <code>value = {{ terms().value() }} · valid = {{ terms().valid() }}</code>
    </div>
  `,
})
class SignalFormsDemo {
  protected readonly model = signal(false);
  // `required(path)` pilote le marqueur *, l'attribut natif et l'état d'erreur du bloc.
  protected readonly terms = form(this.model, (path) => {
    required(path);
  });
}

export const SignalForms: Story = {
  name: 'Signal Forms',
  render: () => ({ template: `<demo-toggle-block-signal-forms />` }),
  decorators: [moduleMetadata({ imports: [SignalFormsDemo] })],
};
