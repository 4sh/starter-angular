import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiDrawer } from '@4sh/ui-kit/layout/ui-drawer';
import { UiButton } from '@4sh/ui-kit/actions/ui-button';
import { UiIcon } from '@4sh/ui-kit/base/ui-icon';

const meta: Meta<UiDrawer> = {
  title: 'Components/ui/layout/ui-drawer',
  component: UiDrawer,
  decorators: [moduleMetadata({ imports: [UiDrawer, UiButton, UiIcon] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=672-219&t=S0pI5M2VHElcd1Ib-1',
    },
  },
  argTypes: {
    visible: {
      control: { type: 'boolean' },
      description: "Open state (two-way `[(visible)]`). Drives the enter/exit animation.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    position: {
      control: { type: 'inline-radio' },
      options: ['left', 'right', 'top', 'bottom'],
      description: "Anchor edge — the panel slides in from this edge.",
      table: { type: { summary: 'DrawerPosition' }, defaultValue: { summary: '"left"' } },
    },
    fullScreen: {
      control: { type: 'boolean' },
      description: 'Takes up the whole viewport (the panel fades in, no slide).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    header: {
      control: { type: 'text' },
      description: 'Plain title (ignored if a `#header` template is projected).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    modal: {
      control: { type: 'boolean' },
      description: 'Shows the mask (dims + captures clicks) and locks background scroll.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    dismissableMask: {
      control: { type: 'boolean' },
      description: 'Closes on clicking the mask (outside the panel) — requires `modal`.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    closable: {
      control: { type: 'boolean' },
      description: 'Shows the close button (×).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    closeOnEscape: {
      control: { type: 'boolean' },
      description: 'Closes the panel on the Escape key.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    blockScroll: {
      control: { type: 'boolean' },
      description: 'Locks background scroll even for a non-modal panel.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    showHeader: {
      control: { type: 'boolean' },
      description: "Renders the header area (title + close).",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    focusOnShow: {
      control: { type: 'boolean' },
      description: "Captures focus in the panel on open (restored on close).",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    focusTrap: {
      control: { type: 'boolean' },
      description: 'Traps Tab focus inside the panel while it\'s open.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    contained: {
      control: { type: 'boolean' },
      description:
        "Scopes the panel to the positioned ancestor (`position: absolute`) and doesn't affect the body's scroll — for embedding a drawer in a container.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    motionDisabled: {
      control: { type: 'boolean' },
      description: "Disables the open/close animation.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    closeIcon: {
      control: { type: 'text' },
      description: 'FontAwesome name of the close icon.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"xmark"' } },
    },
    drawerStyle: {
      control: false,
      description: 'Inline styles applied to the panel (e.g. `{ width: "30rem" }`).',
      table: { type: { summary: 'Record<string, string>' }, defaultValue: { summary: 'undefined' } },
    },
    shown: { action: 'shown', description: 'Emitted after opening.' },
    hidden: { action: 'hidden', description: 'Emitted after closing.' },
  },
};

export default meta;
type Story = StoryObj<UiDrawer>;

// --- Basic ------------------------------------------------------------
// A slide-in panel from the edge of the screen for contextual content.
export const Basic: Story = {
  render: (args) => ({
    props: { ...args, visible: false },
    template: `
      <ui-button label="Open the drawer" (buttonClick)="visible = true" />
      <ui-drawer [(visible)]="visible" header="Panel title">
        <p style="margin: 0;">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla congue
          sit amet quam ut vestibulum.
        </p>
      </ui-drawer>
    `,
  }),
};

// --- Position ---------------------------------------------------------
// The position of the drawer can be customized with the `position` property:
// left, right, top and bottom.
export const Position: Story = {
  render: (args) => ({
    props: { ...args, visible: false, pos: 'left' },
    template: `
      <div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center;">
        <ui-button label="Gauche" level="low" (buttonClick)="pos = 'left'; visible = true" />
        <ui-button label="Right" level="low" (buttonClick)="pos = 'right'; visible = true" />
        <ui-button label="Top" level="low" (buttonClick)="pos = 'top'; visible = true" />
        <ui-button label="Bas" level="low" (buttonClick)="pos = 'bottom'; visible = true" />
      </div>

      <ui-drawer [(visible)]="visible" [position]="pos" [header]="'Position: ' + pos">
        <p style="margin: 0;">The panel slides in from the « {{ pos }} » edge.</p>
      </ui-drawer>
    `,
  }),
};

// --- Full Screen ------------------------------------------------------
// The full screen mode is enabled when the `fullScreen` property is set to true.
export const FullScreen: Story = {
  render: (args) => ({
    props: { ...args, visible: false },
    template: `
      <ui-button label="Open fullscreen" (buttonClick)="visible = true" />
      <ui-drawer [(visible)]="visible" [fullScreen]="true" header="Fullscreen">
        <p style="margin: 0;">
          In fullscreen mode, the panel takes up the whole viewport and fades in.
        </p>
      </ui-drawer>
    `,
  }),
};

// --- Responsive -------------------------------------------------------
// Responsive width: `min(90vw, …)` keeps the panel on screen on mobile
// while keeping a comfortable width on large screens (via `drawerStyle`).
export const Responsive: Story = {
  render: (args) => ({
    props: { ...args, visible: false },
    template: `
      <ui-button label="Open the responsive drawer" (buttonClick)="visible = true" />
      <ui-drawer
        [(visible)]="visible"
        position="right"
        header="Responsive width"
        [drawerStyle]="{ width: 'min(90vw, 28rem)' }"
      >
        <p style="margin: 0;">
          The width adapts: fullscreen minus a gutter on mobile, capped at 28rem on
          large screens. Resize the window to see the adaptation.
        </p>
      </ui-drawer>
    `,
  }),
};

// --- Template (en-tête + contenu + pied personnalisés) ----------------
// Drawer is customizable by header, content and footer templates.
export const Template: Story = {
  render: (args) => ({
    props: { ...args, visible: false },
    template: `
      <ui-button label="Open the profile" (buttonClick)="visible = true" />
      <ui-drawer [(visible)]="visible" position="right" ariaLabel="User profile">
        <ng-template #header>
          <span style="display: inline-flex; align-items: center; gap: 8px;">
            <ui-icon name="circle-user" size="default" />
            Amelia Stone
          </span>
        </ng-template>

        <p style="margin: 0;">
          Header, content and footer are provided via projected templates
          (<code>#header</code>, <code>#footer</code>) for rich content.
        </p>

        <ng-template #footer>
          <ui-button label="Message" level="low" icon="envelope" (buttonClick)="visible = false" />
          <ui-button label="Follow" level="high" icon="user-plus" (buttonClick)="visible = false" />
        </ng-template>
      </ui-drawer>
    `,
  }),
};

// --- Headless ---------------------------------------------------------
// Headless mode lets you replace the entire panel interior; the drawer still
// owns the overlay mechanics (mask, motion, focus trap, Escape).
export const Headless: Story = {
  render: (args) => ({
    props: { ...args, visible: false },
    template: `
      <ui-button label="Open (headless)" (buttonClick)="visible = true" />
      <ui-drawer [(visible)]="visible" position="left" ariaLabel="Navigation" [drawerStyle]="{ width: '18rem' }">
        <ng-template #headless>
          <nav style="display: flex; flex-direction: column; gap: 4px; padding: 16px;">
            <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; font-weight: 700;">
              <ui-icon name="bars" size="sm" /> Menu
            </div>
            @for (item of ['Home', 'Projects', 'Team', 'Settings']; track item) {
              <a
                href="#"
                (click)="$event.preventDefault(); visible = false"
                style="padding: 10px 12px; border-radius: 8px; color: inherit; text-decoration: none;"
              >{{ item }}</a>
            }
          </nav>
        </ng-template>
      </ui-drawer>
    `,
  }),
};

// --- Contained (embedded + already open) ------------------------------
// Panel scoped to a positioned container (`contained`) and open by default:
// no scroll lock, no focus capture — meant for embedding a preview.
export const Contained: Story = {
  render: (args) => ({
    props: { ...args },
    template: `
      <div style="position: relative; width: 360px; height: 240px; border-radius: 12px; overflow: hidden; border: 1px solid var(--global-border-subtle);">
        <ui-drawer
          [visible]="true"
          [contained]="true"
          [focusOnShow]="false"
          [focusTrap]="false"
          [motionDisabled]="true"
          position="left"
          header="Panel"
          [drawerStyle]="{ width: '200px' }"
        >
          <p style="margin: 0;">Preview of a drawer embedded in a container.</p>
        </ui-drawer>
      </div>
    `,
  }),
};
