import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiTooltip } from './ui-tooltip';
import { UiButton } from '@app/shared/components/ui/actions/ui-button/ui-button';

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
type TooltipArgs = {
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
};

const meta: Meta<TooltipArgs> = {
  title: 'Components/ui/informative/ui-tooltip',
  component: UiTooltip,
  decorators: [moduleMetadata({ imports: [UiTooltip, UiButton] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=0-1&t=PXOwFotKvf72dn1c-1',
    },
    docs: {
      description: {
        component:
          'Directive `[uiTooltip]` : infobulle headless (CDK Overlay) attachée à un élément déclencheur. ' +
          'Placement, retournement dans le viewport et repositionnement au scroll délégués au CDK. ' +
          'Inspirée de l’API PrimeNG `pTooltip`, adaptée aux signals de ce design system.',
      },
    },
  },
  argTypes: {
    uiTooltip: {
      control: { type: 'text' },
      description: 'Contenu de l’infobulle (texte, HTML si `escape=false`, ou `TemplateRef`).',
      table: { type: { summary: 'string | TemplateRef' }, defaultValue: { summary: 'undefined' } },
    },
    tooltipPosition: {
      control: { type: 'inline-radio' },
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Côté préféré. Le CDK retourne automatiquement si l’espace manque.',
      table: { type: { summary: 'TooltipPosition' }, defaultValue: { summary: '"top"' } },
    },
    fitContent: {
      control: { type: 'boolean' },
      description: 'Retourne vers un autre côté si l’espace manque (défaut). false : verrouille le côté choisi.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    tooltipEvent: {
      control: { type: 'inline-radio' },
      options: ['hover', 'focus', 'both'],
      description: 'Interaction déclenchant l’affichage. `both` couvre aussi le focus clavier (a11y).',
      table: { type: { summary: 'TooltipEvent' }, defaultValue: { summary: '"both"' } },
    },
    tooltipDisabled: {
      control: { type: 'boolean' },
      description: 'Désactive complètement l’infobulle.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    showDelay: {
      control: { type: 'number' },
      description: 'Délai avant affichage (ms).',
      table: { type: { summary: 'number' }, defaultValue: { summary: '150' } },
    },
    hideDelay: {
      control: { type: 'number' },
      description: 'Délai avant masquage (ms).',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' } },
    },
    escape: {
      control: { type: 'boolean' },
      description: 'true : contenu texte. false : `content` interprété comme HTML (assaini).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    autoHide: {
      control: { type: 'boolean' },
      description: 'Masque quand le pointeur quitte le déclencheur. false : reste ouvert au survol de l’infobulle.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    hideOnEscape: {
      control: { type: 'boolean' },
      description: 'Masque à l’appui sur Échap (WCAG « dismissible »).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    life: {
      control: { type: 'number' },
      description: 'Auto-masquage après N ms même si actif. 0 = désactivé.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' } },
    },
    tooltipStyleClass: {
      control: { type: 'text' },
      description: 'Classe(s) supplémentaire(s) appliquée(s) au panneau (personnalisation ponctuelle).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
  },
  args: {
    uiTooltip: 'Enregistrer le document',
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
        label="Survolez-moi"
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
        <ui-button label="Top" uiTooltip="Infobulle en haut" tooltipPosition="top" />
        <ui-button label="Bottom" uiTooltip="Infobulle en bas" tooltipPosition="bottom" />
        <ui-button label="Left" uiTooltip="Infobulle à gauche" tooltipPosition="left" />
        <ui-button label="Right" uiTooltip="Infobulle à droite" tooltipPosition="right" />
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
      <ui-button label="Profil" [uiTooltip]="tpl" [tooltipContext]="{ $implicit: 'Jane Doe' }"
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
      <ui-button label="Style custom" uiTooltip="Infobulle mise en avant"
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
      <ui-button label="Interactive" uiTooltip="Vous pouvez survoler cette infobulle"
        autoHide="false" [tooltipPosition]="tooltipPosition" />
    `,
  }),
};
