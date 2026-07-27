import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator, moduleMetadata } from '@storybook/angular';
import { Component, signal } from '@angular/core';
import { UiProgressBar } from '@app/shared/components/ui/informative/ui-progress-bar/ui-progress-bar';
import { UiButton } from '@app/shared/components/ui/actions/ui-button/ui-button';

const meta: Meta<UiProgressBar> = {
  title: 'Components/ui/informative/ui-progress-bar',
  component: UiProgressBar,
  decorators: [
    moduleMetadata({ imports: [UiProgressBar] }),
    // ui-progress-bar is fill-width: bound the width so the bar stays visible
    // in shrink-wrap contexts (e.g. the centered Overview card) instead of the
    // track collapsing to 0 and leaving only the value label.
    componentWrapperDecorator((story) => `<div style="width:320px; max-width:100%;">${story}</div>`),
  ],
  parameters: {
    layout: 'padded',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=177-2485&t=qZon0ThOudDbZZjf-1',
    },
  },
  argTypes: {
    value: {
      control: { type: 'range', min: 0, max: 100, step: 1 },
      description: 'Progression courante (0–100, bornée). Ignorée en mode `indeterminate`.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' } },
    },
    mode: {
      control: { type: 'inline-radio' },
      options: ['determinate', 'indeterminate'],
      description: '`determinate` suit une valeur ; `indeterminate` boucle sans valeur.',
      table: { type: { summary: 'UiProgressBarMode' }, defaultValue: { summary: '"determinate"' } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'small'],
      description: 'Taille (hauteur de la piste).',
      table: { type: { summary: 'UiProgressBarSize' }, defaultValue: { summary: '"default"' } },
    },
    valuePosition: {
      control: { type: 'inline-radio' },
      options: ['right', 'bottom', 'inside'],
      description: 'Emplacement du libellé : à droite, sous la barre, ou dans le remplissage (`inside`).',
      table: { type: { summary: 'UiProgressBarValuePosition' }, defaultValue: { summary: '"right"' } },
    },
    showValue: {
      control: { type: 'boolean' },
      description: 'Afficher le libellé de valeur (déterminé, hors mode steps).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    unit: {
      control: { type: 'text' },
      description: 'Unité concaténée à la valeur numérique.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"%"' } },
    },
    steps: {
      control: { type: 'number' },
      description: 'Si > 0, découpe la barre en N segments discrets (masque le libellé).',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' } },
    },
    color: {
      control: { type: 'color' },
      description: 'Couleur de remplissage (surcharge `--ui-progress-bar-color`).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    ariaLabel: {
      control: { type: 'text' },
      description: 'Nom accessible de la barre de progression.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
  },
  args: {
    value: 60,
    mode: 'determinate',
    size: 'default',
    valuePosition: 'right',
    showValue: true,
    unit: '%',
    steps: 0,
    ariaLabel: "Progression du téléchargement",
  },
};

export default meta;
type Story = StoryObj<UiProgressBar>;

// --- Basic -----------------------------------------------------------
export const Basic: Story = {};

// --- Positions & sizes ----------------------------------------------
export const ValueBottom: Story = { args: { valuePosition: 'bottom' } };
export const ValueInside: Story = { args: { valuePosition: 'inside', value: 50 } };
export const NoValue: Story = { args: { showValue: false } };
export const Small: Story = { args: { size: 'small' } };

// --- Dynamic (value réactif : la barre suit l'état) ------------------
@Component({
  selector: 'sb-progress-dynamic',
  imports: [UiProgressBar, UiButton],
  template: `
    <div style="display:flex; flex-direction:column; gap:16px; max-width:420px;">
      <ui-progress-bar [value]="value()" ariaLabel="Progression du transfert" />
      <div style="display:flex; gap:8px;">
        <ui-button label="-10" level="low" size="small" (buttonClick)="bump(-10)" />
        <ui-button label="+10" level="high" size="small" (buttonClick)="bump(10)" />
        <ui-button label="Reset" level="low" size="small" (buttonClick)="value.set(0)" />
      </div>
    </div>
  `,
})
class ProgressDynamicDemo {
  protected readonly value = signal(40);
  protected bump(delta: number): void {
    this.value.update((v) => Math.min(100, Math.max(0, v + delta)));
  }
}

export const Dynamic: Story = {
  render: () => ({
    moduleMetadata: { imports: [ProgressDynamicDemo] },
    template: `<sb-progress-dynamic />`,
  }),
};

// --- Template (formateurs libres, même valeur partagée) --------------
// Several bars share the same value; each formats it differently via
// `valueTemplate` and is recoloured through the `color` input.
@Component({
  selector: 'sb-progress-template',
  imports: [UiProgressBar],
  template: `
    <div style="display:flex; flex-direction:column; gap:20px; max-width:420px;">
      <ui-progress-bar [value]="value" [valueTemplate]="pct" ariaLabel="Pourcentage" />
      <ui-progress-bar
        [value]="value"
        [valueTemplate]="frac"
        color="var(--informative-successhigh-surface-default)"
        ariaLabel="Fraction"
      />
      <ui-progress-bar
        [value]="value"
        [valueTemplate]="bytes"
        color="var(--informative-warninghigh-surface-default)"
        ariaLabel="Octets"
      />

      <ng-template #pct let-v>{{ v }} %</ng-template>
      <ng-template #frac let-v>{{ v / 10 }} / 10</ng-template>
      <ng-template #bytes let-v>{{ (v * 10.24).toFixed(0) }} Mo</ng-template>
    </div>
  `,
})
class ProgressTemplateDemo {
  protected readonly value = 70;
}

export const Template: Story = {
  render: () => ({
    moduleMetadata: { imports: [ProgressTemplateDemo] },
    template: `<sb-progress-template />`,
  }),
};

// --- Indeterminate ---------------------------------------------------
export const Indeterminate: Story = { args: { mode: 'indeterminate', ariaLabel: 'Chargement' } };

// --- As Steps --------------------------------------------------------
export const AsSteps: Story = { args: { value: 60, steps: 5, ariaLabel: 'Étape 3 sur 5' } };
