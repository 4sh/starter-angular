import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiPopover } from '@4sh/ui-kit/layout/ui-popover';
import { UiButton } from '@4sh/ui-kit/actions/ui-button';
import { UiIcon } from '@4sh/ui-kit/base/ui-icon';

const meta: Meta<UiPopover> = {
  title: 'Components/ui/layout/ui-popover',
  component: UiPopover,
  decorators: [moduleMetadata({ imports: [UiPopover, UiButton, UiIcon] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=0-1&t=PXOwFotKvf72dn1c-1',
    },
  },
  argTypes: {
    dismissable: {
      control: { type: 'boolean' },
      description: 'Ferme le panneau au clic en dehors (et hors du déclencheur).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    position: {
      control: { type: 'select' },
      options: ['top', 'bottom', 'left', 'right'],
      description: 'Côté préféré du déclencheur ; retournement automatique si la place manque.',
      table: { type: { summary: "'top' | 'bottom' | 'left' | 'right'" }, defaultValue: { summary: "'bottom'" } },
    },
    showArrow: {
      control: { type: 'boolean' },
      description: 'Affiche la flèche pointant vers le déclencheur.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    modal: {
      control: { type: 'boolean' },
      description: 'Rend le panneau modal : `aria-modal` et piège de focus permanent.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    role: {
      control: { type: 'text' },
      description: 'Rôle ARIA du panneau.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'dialog'" } },
    },
    ariaLabel: {
      control: { type: 'text' },
      description: 'Nom accessible du panneau (recommandé).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    ariaLabelledBy: {
      control: { type: 'text' },
      description: "Id d'un élément externe nommant le panneau.",
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    focusOnShow: {
      control: { type: 'boolean' },
      description: "Déplace le focus dans le panneau à l'ouverture (premier focusable ou `[autofocus]`).",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    closeOnEscape: {
      control: { type: 'boolean' },
      description: 'Ferme le panneau à la touche Échap (retour du focus au déclencheur).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    motion: {
      control: { type: 'boolean' },
      description: "Anime l'entrée du panneau (reduced-motion / `data-motion=off` priment).",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    styleClass: {
      control: { type: 'text' },
      description: 'Classe(s) additionnelle(s) appliquée(s) au panneau.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    shown: { action: 'shown', table: { category: 'Events' } },
    hidden: { action: 'hidden', table: { category: 'Events' } },
  },
  // Explicit defaults: bound inputs (`[showArrow]="showArrow"`…) would otherwise
  // be clobbered to `undefined` when a story provides no args.
  args: {
    dismissable: true,
    position: 'bottom',
    showArrow: true,
    modal: false,
    focusOnShow: true,
    closeOnEscape: true,
    motion: true,
  },
};
export default meta;

type Story = StoryObj<UiPopover>;

// --- Basic ------------------------------------------------------------
// Accessed via its reference: the trigger's click event carries the anchor,
// visibility is driven by `toggle` / `show` / `hide`.
export const Basic: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ui-button label="Details" icon="circle-info" (buttonClick)="op.toggle($event)" />
      <ui-popover
        #op
        [dismissable]="dismissable"
        [position]="position"
        [showArrow]="showArrow"
        [modal]="modal"
        [focusOnShow]="focusOnShow"
        [closeOnEscape]="closeOnEscape"
        [motion]="motion"
        ariaLabel="Product details"
        (shown)="shown()"
        (hidden)="hidden()"
      >
        <div style="display: flex; flex-direction: column; gap: 8px; max-width: 16rem;">
          <strong>Code name: Atlas</strong>
          <p style="margin: 0; font-size: .875rem; line-height: 1.4;">
            A floating panel anchored to the trigger, closed by a click outside,
            the Escape key, or another call to <code>toggle</code>.
          </p>
        </div>
      </ui-popover>
    `,
  }),
};

// --- Controlled -------------------------------------------------------
// Visibility controlled from outside via a template reference variable.
// The trigger element is passed as the second argument to keep the overlay
// anchored to it, whatever button drives the state.
export const Controlled: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="display: flex; align-items: center; gap: 12px;">
        <span
          #anchor
          style="display: inline-flex; align-items: center; gap: 6px; padding: 6px 12px;
                 border: 1px solid var(--global-border-default); border-radius: var(--radius-sm);">
          <ui-icon name="location-dot" size="sm" />
          Ancre
        </span>

        <ui-button size="small" label="Show" (buttonClick)="op.show($event, anchor)" />
        <ui-button size="small" level="low" label="Masquer" (buttonClick)="op.hide()" />
        <ui-button size="small" level="low" label="Toggle" (buttonClick)="op.toggle($event, anchor)" />
      </div>

      <ui-popover
        #op
        [dismissable]="dismissable"
        [position]="position"
        [showArrow]="showArrow"
        [modal]="modal"
        [focusOnShow]="focusOnShow"
        [closeOnEscape]="closeOnEscape"
        [motion]="motion"
        ariaLabel="Controlled panel"
        (shown)="shown()"
        (hidden)="hidden()"
      >
        <p style="margin: 0; max-width: 15rem; font-size: .875rem; line-height: 1.4;">
          The panel stays anchored to the element passed as the second argument,
          whichever button drives its state.
        </p>
      </ui-popover>
    `,
  }),
};

// --- Positions --------------------------------------------------------
export const Positions: Story = {
  render: () => ({
    template: `
      <div style="display: grid; grid-template-columns: repeat(2, auto); gap: 12px;">
        <ui-button size="small" level="low" label="Top" (buttonClick)="top.toggle($event)" />
        <ui-button size="small" level="low" label="Bottom" (buttonClick)="bottom.toggle($event)" />
        <ui-button size="small" level="low" label="Left" (buttonClick)="left.toggle($event)" />
        <ui-button size="small" level="low" label="Right" (buttonClick)="right.toggle($event)" />
      </div>

      <ui-popover #top position="top" ariaLabel="Top">
        <span style="font-size: .875rem;">Panel above the trigger.</span>
      </ui-popover>
      <ui-popover #bottom position="bottom" ariaLabel="En bas">
        <span style="font-size: .875rem;">Panel below the trigger.</span>
      </ui-popover>
      <ui-popover #left position="left" ariaLabel="Left">
        <span style="font-size: .875rem;">Panel to the left of the trigger.</span>
      </ui-popover>
      <ui-popover #right position="right" ariaLabel="Right">
        <span style="font-size: .875rem;">Panel to the right of the trigger.</span>
      </ui-popover>
    `,
  }),
};

// --- Rich content -----------------------------------------------------
// Arbitrary interactive content with a dedicated close control that calls
// `hide()` — its Enter / Space activation is native <button> behavior.
export const RichContent: Story = {
  render: () => ({
    template: `
      <ui-button label="Profile" icon="user" (buttonClick)="op.toggle($event)" />
      <ui-popover #op position="bottom" ariaLabel="Profile card">
        <div style="display: flex; flex-direction: column; gap: 12px; max-width: 18rem;">
          <div style="display: flex; align-items: center; gap: 10px;">
            <ui-icon name="circle-user" size="lg" />
            <div>
              <strong style="display: block;">Amelia Stone</strong>
              <span style="font-size: .8125rem; color: var(--global-text-default-hover);">Product designer</span>
            </div>
          </div>
          <p style="margin: 0; font-size: .875rem; line-height: 1.4;">
            The first focusable element receives focus on open.
          </p>
          <div style="display: flex; justify-content: flex-end; gap: 8px;">
            <ui-button size="small" level="low" label="Close" (buttonClick)="op.hide()" />
            <ui-button size="small" label="Follow" icon="user-plus" />
          </div>
        </div>
      </ui-popover>
    `,
  }),
};
