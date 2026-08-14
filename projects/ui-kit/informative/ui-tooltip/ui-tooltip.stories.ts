import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiTooltip } from '@4sh/ui-kit/informative/ui-tooltip';
import { UiButton } from '@4sh/ui-kit/actions/ui-button';

// Global demo stylesheet for the "Custom style" story. In a real app this lives in a
// global .scss (styles injected in a component template are view-scoped and would NOT
// reach the body-level overlay panel). Remapping the semantic tokens on the class is
// specificity-proof and the arrow follows automatically.
if (typeof document !== 'undefined' && !document.getElementById('ui-tooltip-demo-style')) {
  const style = document.createElement('style');
  style.id = 'ui-tooltip-demo-style';
  style.textContent = `.tip-highlight {
    --informative-defaulthigh-surface-default: var(--informative-highlighthigh-surface-default);
    --informative-defaulthigh-content-default: var(--informative-highlighthigh-content-default);
    --informative-defaulthigh-stroke-default: var(--informative-highlighthigh-stroke-default);
  }`;
  document.head.appendChild(style);
}

/**
 * Args of the demo host (the directive is applied on a `ui-button` trigger).
 * Keys mirror the directive inputs; `uiTooltip` is the content alias.
 */
interface TooltipArgs {
  uiTooltip: string;
  tooltipPosition: 'top' | 'bottom' | 'left' | 'right';
  fitContent: boolean;
  tooltipEvent: 'hover' | 'focus' | 'both';
  tooltipDisabled: boolean;
  showDelay: number;
  hideDelay: number;
  escape: boolean;
  autoHide: boolean;
  hideOnEscape: boolean;
  life: number;
  tooltipStyleClass: string;
}

const meta: Meta<TooltipArgs> = {
  title: 'Components/ui/informative/ui-tooltip',
  component: UiTooltip,
  decorators: [moduleMetadata({ imports: [UiTooltip, UiButton] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=243-7110&t=eYboBh39bz05TnEg-1',
    },
    docs: {
      description: {
        component:
          '`[uiTooltip]` directive: headless tooltip (CDK Overlay) attached to a trigger element. ' +
          'Placement, viewport flip and repositioning on scroll are delegated to the CDK. ' +
          'Adapted to this design system\'s signals.',
      },
    },
  },
  argTypes: {
    uiTooltip: {
      control: { type: 'text' },
      description: 'Tooltip content (text, HTML if `escape=false`, or `TemplateRef`).',
      table: { type: { summary: 'string | TemplateRef' }, defaultValue: { summary: 'undefined' } },
    },
    tooltipPosition: {
      control: { type: 'inline-radio' },
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Preferred side. The CDK flips automatically if there\'s no room.',
      table: { type: { summary: 'TooltipPosition' }, defaultValue: { summary: '"top"' } },
    },
    fitContent: {
      control: { type: 'boolean' },
      description: 'Flips to another side if there\'s no room (default). false: locks the chosen side.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    tooltipEvent: {
      control: { type: 'inline-radio' },
      options: ['hover', 'focus', 'both'],
      description: 'Interaction that triggers the display. `both` also covers keyboard focus (a11y).',
      table: { type: { summary: 'TooltipEvent' }, defaultValue: { summary: '"both"' } },
    },
    tooltipDisabled: {
      control: { type: 'boolean' },
      description: 'Completely disables the tooltip.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    showDelay: {
      control: { type: 'number' },
      description: 'Delay before showing (ms).',
      table: { type: { summary: 'number' }, defaultValue: { summary: '150' } },
    },
    hideDelay: {
      control: { type: 'number' },
      description: 'Delay before hiding (ms).',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' } },
    },
    escape: {
      control: { type: 'boolean' },
      description: 'true: text content. false: `content` interpreted as HTML (sanitized).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    autoHide: {
      control: { type: 'boolean' },
      description: 'Hides when the pointer leaves the trigger. false: stays open while hovering the tooltip.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    hideOnEscape: {
      control: { type: 'boolean' },
      description: 'Hides on pressing Escape (WCAG « dismissible »).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    life: {
      control: { type: 'number' },
      description: 'Auto-hides after N ms even if active. 0 = disabled.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' } },
    },
    tooltipStyleClass: {
      control: { type: 'text' },
      description: 'Additional class(es) applied to the panel (one-off customization).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
  },
  args: {
    uiTooltip: 'Save the document',
    tooltipPosition: 'top',
    fitContent: true,
    tooltipEvent: 'both',
    tooltipDisabled: false,
    showDelay: 150,
    hideDelay: 0,
    escape: true,
    autoHide: true,
    hideOnEscape: true,
    life: 0,
    tooltipStyleClass: '',
  },
};

export default meta;
type Story = StoryObj<TooltipArgs>;

/** Survol ou focus clavier du bouton pour révéler l’infobulle. */
export const Default: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ui-button
        label="Hover me"
        [uiTooltip]="uiTooltip"
        [tooltipPosition]="tooltipPosition"
        [fitContent]="fitContent"
        [tooltipEvent]="tooltipEvent"
        [tooltipDisabled]="tooltipDisabled"
        [showDelay]="showDelay"
        [hideDelay]="hideDelay"
        [escape]="escape"
        [autoHide]="autoHide"
        [hideOnEscape]="hideOnEscape"
        [life]="life"
        [tooltipStyleClass]="tooltipStyleClass" />
    `,
  }),
};

/** Les quatre côtés d’ancrage (le CDK retourne si le viewport est trop étroit). */
export const Positions: Story = {
  parameters: { controls: { include: [] } },
  render: (args) => ({
    props: args,
    template: `
      <div style="display:grid;grid-template-columns:repeat(2,auto);gap:48px;padding:64px;place-items:center;">
        <ui-button label="Top" uiTooltip="Tooltip at the top" tooltipPosition="top" />
        <ui-button label="Bottom" uiTooltip="Tooltip at the bottom" tooltipPosition="bottom" />
        <ui-button label="Left" uiTooltip="Tooltip on the left" tooltipPosition="left" />
        <ui-button label="Right" uiTooltip="Tooltip on the right" tooltipPosition="right" />
      </div>
    `,
  }),
};

/** Contenu riche via `TemplateRef` (icône + texte), avec `[tooltipContext]`. */
export const RichContent: Story = {
  parameters: { controls: { include: ['tooltipPosition'] } },
  render: (args) => ({
    props: args,
    template: `
      <ui-button label="Profile" [uiTooltip]="tpl" [tooltipContext]="{ $implicit: 'Jane Doe' }"
        [tooltipPosition]="tooltipPosition" autoHide="false" />
      <ng-template #tpl let-name>
        <strong>{{ name }}</strong><br />Administratrice · en ligne
      </ng-template>
    `,
  }),
};

/**
 * Personnalisation ponctuelle via `tooltipStyleClass` : une classe posée sur le panneau,
 * ciblée depuis une feuille de style globale (ici en `highlight`).
 */
export const CustomStyle: Story = {
  parameters: { controls: { include: ['tooltipPosition'] } },
  render: (args) => ({
    props: args,
    template: `
      <ui-button label="Style custom" uiTooltip="Highlighted tooltip"
        tooltipStyleClass="tip-highlight" [tooltipPosition]="tooltipPosition" />
    `,
  }),
};

/** Infobulle interactive (`autoHide=false`) : reste ouverte au survol du panneau. */
export const Interactive: Story = {
  parameters: { controls: { include: ['tooltipPosition'] } },
  render: (args) => ({
    props: args,
    template: `
      <ui-button label="Interactive" uiTooltip="You can hover this tooltip"
        autoHide="false" [tooltipPosition]="tooltipPosition" />
    `,
  }),
};
