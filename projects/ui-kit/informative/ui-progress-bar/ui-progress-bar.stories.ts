import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator, moduleMetadata } from '@storybook/angular';
import { Component, signal } from '@angular/core';
import { UiProgressBar } from '@4sh/ui-kit/informative/ui-progress-bar';
import { UiButton } from '@4sh/ui-kit/actions/ui-button';

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
      description: 'Current progress (0–100, clamped). Ignored in `indeterminate` mode.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' } },
    },
    mode: {
      control: { type: 'inline-radio' },
      options: ['determinate', 'indeterminate'],
      description: '`determinate` follows a value; `indeterminate` loops without one.',
      table: { type: { summary: 'UiProgressBarMode' }, defaultValue: { summary: '"determinate"' } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'small'],
      description: 'Size (track height).',
      table: { type: { summary: 'UiProgressBarSize' }, defaultValue: { summary: '"default"' } },
    },
    valuePosition: {
      control: { type: 'inline-radio' },
      options: ['right', 'bottom', 'inside'],
      description: 'Label placement: to the right, below the bar, or inside the fill (`inside`).',
      table: { type: { summary: 'UiProgressBarValuePosition' }, defaultValue: { summary: '"right"' } },
    },
    showValue: {
      control: { type: 'boolean' },
      description: 'Show the value label (determinate, outside steps mode).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    unit: {
      control: { type: 'text' },
      description: 'Unit concatenated to the numeric value.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"%"' } },
    },
    steps: {
      control: { type: 'number' },
      description: 'If > 0, splits the bar into N discrete segments (hides the label).',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' } },
    },
    color: {
      control: { type: 'color' },
      description: 'Couleur de remplissage (surcharge `--ui-progress-bar-color`).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    ariaLabel: {
      control: { type: 'text' },
      description: 'Accessible name of the progress bar.',
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
    ariaLabel: "Download progress",
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
  selector: 'demo-progress-dynamic',
  imports: [UiProgressBar, UiButton],
  template: `
    <div style="display:flex; flex-direction:column; gap:16px; max-width:420px;">
      <ui-progress-bar [value]="value()" ariaLabel="Transfer progress" />
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
    template: `<demo-progress-dynamic />`,
  }),
};

// --- Template (formateurs libres, même valeur partagée) --------------
// Several bars share the same value; each formats it differently via
// `valueTemplate` and is recoloured through the `color` input.
@Component({
  selector: 'demo-progress-template',
  imports: [UiProgressBar],
  template: `
    <div style="display:flex; flex-direction:column; gap:20px; max-width:420px;">
      <ui-progress-bar [value]="value" [valueTemplate]="pct" ariaLabel="Percentage" />
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
        ariaLabel="Bytes"
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
    template: `<demo-progress-template />`,
  }),
};

// --- Indeterminate ---------------------------------------------------
export const Indeterminate: Story = { args: { mode: 'indeterminate', ariaLabel: 'Loading' } };

// --- As Steps --------------------------------------------------------
export const AsSteps: Story = { args: { value: 60, steps: 5, ariaLabel: 'Step 3 of 5' } };
