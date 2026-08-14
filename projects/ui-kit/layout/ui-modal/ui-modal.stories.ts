import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiModal } from '@4sh/ui-kit/layout/ui-modal';
import { UiButton } from '@4sh/ui-kit/actions/ui-button';
import { UiIcon } from '@4sh/ui-kit/base/ui-icon';

const meta: Meta<UiModal> = {
  title: 'Components/ui/layout/ui-modal',
  component: UiModal,
  decorators: [moduleMetadata({ imports: [UiModal, UiButton, UiIcon] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=278-2826&t=inUHXSiILDu9zvad-1',
    },
  },
  argTypes: {
    visible: {
      control: { type: 'boolean' },
      description: "Open state (two-way `[(visible)]`). Drives the enter/exit animation.",
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
      description: "Closes on clicking the mask (outside the dialog) — requires `modal`.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    closable: {
      control: { type: 'boolean' },
      description: 'Shows the close button (×) and allows closing with Escape.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    closeOnEscape: {
      control: { type: 'boolean' },
      description: 'Closes the dialog on the Escape key.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    blockScroll: {
      control: { type: 'boolean' },
      description: 'Locks background scroll even for a non-modal dialog.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    showHeader: {
      control: { type: 'boolean' },
      description: "Renders the header area (title + actions).",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    draggable: {
      control: { type: 'boolean' },
      description: "Allows dragging the dialog by its header.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    maximizable: {
      control: { type: 'boolean' },
      description: "Shows the maximize / restore button in the header.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    resizable: {
      control: { type: 'boolean' },
      description: 'Resize handle at the bottom-right corner (pointer only).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    contained: {
      control: { type: 'boolean' },
      description:
        "Scopes the dialog to the positioned ancestor (`position: absolute`) and doesn't affect the body's scroll — for embedding a modal in a container.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    position: {
      control: { type: 'select' },
      options: [
        'center',
        'top',
        'bottom',
        'left',
        'right',
        'topleft',
        'topright',
        'bottomleft',
        'bottomright',
      ],
      description: 'Dialog position in the viewport.',
      table: { type: { summary: 'ModalPosition' }, defaultValue: { summary: '"center"' } },
    },
    focusOnShow: {
      control: { type: 'boolean' },
      description: "Captures focus in the dialog on open (restored on close).",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    focusTrap: {
      control: { type: 'boolean' },
      description: 'Traps Tab focus inside the dialog while it\'s open.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    motion: {
      control: { type: 'select' },
      options: ['zoom', 'fade', 'slide-up', 'slide-down', 'slide-left', 'slide-right'],
      description: "Dialog animation preset (the mask always fades).",
      table: { type: { summary: 'UiMotionPreset' }, defaultValue: { summary: '"zoom"' } },
    },
    motionDisabled: {
      control: { type: 'boolean' },
      description: "Disables the open/close animation.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    dialogStyle: {
      control: false,
      description: 'Inline styles applied to the dialog (e.g. `{ width: "32rem" }`).',
      table: { type: { summary: 'Record<string, string>' }, defaultValue: { summary: 'undefined' } },
    },
    breakpoints: {
      control: false,
      description: 'Tiered widths, key = `max-width` (e.g. `{ "960px": "75vw" }`).',
      table: { type: { summary: 'Record<string, string>' }, defaultValue: { summary: 'undefined' } },
    },
    shown: { action: 'shown', description: 'Emitted after opening.' },
    hidden: { action: 'hidden', description: 'Emitted after closing.' },
    maximizedChange: { action: 'maximizedChange', description: 'Emitted on toggling maximized / restored.' },
    dragEnd: { action: 'dragEnd', description: "Emitted at the end of a drag." },
    resizeEnd: { action: 'resizeEnd', description: "Emitted at the end of a resize." },
  },
};

export default meta;
type Story = StoryObj<UiModal>;

// --- Basic ------------------------------------------------------------
export const Basic: Story = {
  render: (args) => ({
    props: { ...args, visible: false },
    template: `
      <ui-button label="Show the dialog" (buttonClick)="visible = true" />
      <ui-modal [(visible)]="visible" header="Dialog title" [dialogStyle]="{ width: '30rem' }">
        <p style="margin: 0;">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla congue
          sit amet quam ut vestibulum.
        </p>
        <ng-template #footer>
          <ui-button label="Close" level="low" (buttonClick)="visible = false" />
          <ui-button label="Submit" level="high" (buttonClick)="visible = false" />
        </ng-template>
      </ui-modal>
    `,
  }),
};

// --- Template (en-tête + pied personnalisés) --------------------------
export const Template: Story = {
  render: (args) => ({
    props: { ...args, visible: false },
    template: `
      <ui-button label="Show the dialog" (buttonClick)="visible = true" />
      <ui-modal [(visible)]="visible" [dialogStyle]="{ width: '30rem' }" ariaLabel="User profile">
        <ng-template #header>
          <span style="display: inline-flex; align-items: center; gap: 8px;">
            <ui-icon name="circle-user" size="default" />
            Amelia Stone
          </span>
        </ng-template>

        <p style="margin: 0;">
          Header and footer are provided via projected templates (<code>#header</code>,
          <code>#footer</code>), for rich content.
        </p>

        <ng-template #footer>
          <ui-button label="Message" level="low" icon="envelope" (buttonClick)="visible = false" />
          <ui-button label="Follow" level="high" icon="user-plus" (buttonClick)="visible = false" />
        </ng-template>
      </ui-modal>
    `,
  }),
};

// --- Draggable --------------------------------------------------------
export const Draggable: Story = {
  render: (args) => ({
    props: { ...args, visible: false },
    template: `
      <ui-button label="Show the dialog" (buttonClick)="visible = true" />
      <ui-modal
        [(visible)]="visible"
        header="Draggable"
        [draggable]="true"
        [dialogStyle]="{ width: '30rem' }"
      >
        <p style="margin: 0;">
          Grab the header and drag to move the dialog. It stays
          within the viewport's bounds.
        </p>
        <ng-template #footer>
          <ui-button label="Close" level="low" (buttonClick)="visible = false" />
        </ng-template>
      </ui-modal>
    `,
  }),
};

// --- Position ---------------------------------------------------------
export const Position: Story = {
  render: (args) => ({
    props: { ...args, visible: false, pos: 'center' },
    template: `
      <div style="display: grid; grid-template-columns: repeat(3, auto); gap: 8px;">
        <ui-button label="Top left" size="small" level="low" (buttonClick)="pos = 'topleft'; visible = true" />
        <ui-button label="Top" size="small" level="low" (buttonClick)="pos = 'top'; visible = true" />
        <ui-button label="Top right" size="small" level="low" (buttonClick)="pos = 'topright'; visible = true" />
        <ui-button label="Gauche" size="small" level="low" (buttonClick)="pos = 'left'; visible = true" />
        <ui-button label="Center" size="small" level="high" (buttonClick)="pos = 'center'; visible = true" />
        <ui-button label="Right" size="small" level="low" (buttonClick)="pos = 'right'; visible = true" />
        <ui-button label="Bas gauche" size="small" level="low" (buttonClick)="pos = 'bottomleft'; visible = true" />
        <ui-button label="Bas" size="small" level="low" (buttonClick)="pos = 'bottom'; visible = true" />
        <ui-button label="Bottom right" size="small" level="low" (buttonClick)="pos = 'bottomright'; visible = true" />
      </div>

      <ui-modal [(visible)]="visible" [position]="pos" [header]="'Position : ' + pos" [dialogStyle]="{ width: '26rem' }">
        <p style="margin: 0;">The dialog anchors to the chosen position.</p>
        <ng-template #footer>
          <ui-button label="Close" level="low" (buttonClick)="visible = false" />
        </ng-template>
      </ui-modal>
    `,
  }),
};

// --- Maximizable ------------------------------------------------------
export const Maximizable: Story = {
  render: (args) => ({
    props: { ...args, visible: false },
    template: `
      <ui-button label="Show the dialog" (buttonClick)="visible = true" />
      <ui-modal
        [(visible)]="visible"
        header="Expandable"
        [maximizable]="true"
        [dialogStyle]="{ width: '32rem' }"
      >
        <p style="margin: 0;">
          Use the header's maximize button to take up the whole
          viewport, then restore the initial size.
        </p>
        <ng-template #footer>
          <ui-button label="Close" level="low" (buttonClick)="visible = false" />
        </ng-template>
      </ui-modal>
    `,
  }),
};

// --- Resizable --------------------------------------------------------
export const Resizable: Story = {
  render: (args) => ({
    props: { ...args, visible: false },
    template: `
      <ui-button label="Show the dialog" (buttonClick)="visible = true" />
      <ui-modal
        [(visible)]="visible"
        header="Resizable"
        [resizable]="true"
        [draggable]="true"
        [dialogStyle]="{ width: '32rem', height: '18rem' }"
      >
        <p style="margin: 0;">
          Grab the bottom-right corner handle to resize the dialog
          (minimum sizes respected). The header can also move it.
        </p>
        <ng-template #footer>
          <ui-button label="Close" level="low" (buttonClick)="visible = false" />
        </ng-template>
      </ui-modal>
    `,
  }),
};

// --- Modal (masque + fermeture au clic extérieur) ---------------------
export const Modal: Story = {
  render: (args) => ({
    props: { ...args, visible: false },
    template: `
      <ui-button label="Show the dialog" (buttonClick)="visible = true" />
      <ui-modal
        [(visible)]="visible"
        header="Modal"
        [modal]="true"
        [dismissableMask]="true"
        [dialogStyle]="{ width: '30rem' }"
      >
        <p style="margin: 0;">
          The mask dims and blocks the background (scroll locked). With
          <code>dismissableMask</code>, a click outside closes the dialog.
        </p>
        <ng-template #footer>
          <ui-button label="Close" level="low" (buttonClick)="visible = false" />
        </ng-template>
      </ui-modal>
    `,
  }),
};

// --- Without Modal ----------------------------------------------------
export const WithoutModal: Story = {
  render: (args) => ({
    props: { ...args, visible: false },
    template: `
      <ui-button label="Show the dialog" (buttonClick)="visible = true" />
      <ui-modal
        [(visible)]="visible"
        header="Without mask"
        [modal]="false"
        [draggable]="true"
        position="topright"
        [dialogStyle]="{ width: '26rem' }"
      >
        <p style="margin: 0;">
          Without a mask, the background stays interactive and scrollable. Ideal for a
          non-blocking panel (draggable here).
        </p>
        <ng-template #footer>
          <ui-button label="Close" level="low" (buttonClick)="visible = false" />
        </ng-template>
      </ui-modal>
    `,
  }),
};

// --- Confirmation -----------------------------------------------------
export const Confirmation: Story = {
  render: (args) => ({
    props: { ...args, visible: false },
    template: `
      <ui-button label="Remove" level="error" icon="trash" (buttonClick)="visible = true" />
      <ui-modal
        [(visible)]="visible"
        header="Confirm deletion"
        [dismissableMask]="true"
        [dialogStyle]="{ width: '26rem' }"
      >
        <div style="display: flex; gap: 12px; align-items: flex-start;">
          <ui-icon name="triangle-exclamation" size="lg" />
          <p style="margin: 0;">
            This action is irreversible. Do you really want to remove this item?
          </p>
        </div>
        <ng-template #footer>
          <ui-button label="Cancel" level="low" (buttonClick)="visible = false" />
          <ui-button label="Remove" level="error" icon="trash" (buttonClick)="visible = false" />
        </ng-template>
      </ui-modal>
    `,
  }),
};

// --- Long Content -----------------------------------------------------
export const LongContent: Story = {
  render: (args) => ({
    props: {
      ...args,
      visible: false,
      paras: Array.from({ length: 12 }),
    },
    template: `
      <ui-button label="Show the dialog" (buttonClick)="visible = true" />
      <ui-modal [(visible)]="visible" header="Terms of use" [dialogStyle]="{ width: '32rem' }">
        @for (p of paras; track $index) {
          <p style="margin: 0 0 12px;">
            {{ $index + 1 }}. Lorem ipsum dolor sit amet, consectetur adipiscing elit.
            Nulla congue sit amet quam ut vestibulum. Integer eget accumsan sapien,
            vitae iaculis massa. Praesent egestas, purus vel dignissim consequat.
          </p>
        }
        <ng-template #footer>
          <ui-button label="Refuser" level="low" (buttonClick)="visible = false" />
          <ui-button label="Accepter" level="high" (buttonClick)="visible = false" />
        </ng-template>
      </ui-modal>
    `,
  }),
};

// --- Responsive -------------------------------------------------------
export const Responsive: Story = {
  render: (args) => ({
    props: {
      ...args,
      visible: false,
      bps: { '960px': '75vw', '640px': '90vw' },
    },
    template: `
      <ui-button label="Show the dialog" (buttonClick)="visible = true" />
      <ui-modal
        [(visible)]="visible"
        header="Responsive width"
        [breakpoints]="bps"
        [dialogStyle]="{ width: '50vw' }"
      >
        <p style="margin: 0;">
          Fluid width by tier via <code>breakpoints</code>: 50vw by default,
          75vw under 960px, 90vw under 640px. Resize the window to see
          the adaptation.
        </p>
        <ng-template #footer>
          <ui-button label="Close" level="low" (buttonClick)="visible = false" />
        </ng-template>
      </ui-modal>
    `,
  }),
};

// --- Contained (embarqué + déjà ouvert) -------------------------------
// Dialogue scopé à un conteneur positionné (`contained`) et ouvert d'emblée :
// pas de blocage du scroll, pas de capture de focus — pensé pour l'aperçu.
export const Contained: Story = {
  parameters: { layout: 'centered' },
  render: (args) => ({
    props: { ...args },
    template: `
      <div style="position: relative; width: 340px; height: 230px; border-radius: 12px; overflow: hidden;">
        <ui-modal
          [visible]="true"
          [contained]="true"
          [focusOnShow]="false"
          [focusTrap]="false"
          [motionDisabled]="true"
          [closable]="false"
          header="Dialog title"
          [dialogStyle]="{ width: '250px' }"
        >
          <p style="margin: 0;">Preview of a modal embedded in a container.</p>
          <ng-template #footer>
            <ui-button label="Close" level="low" size="small" />
            <ui-button label="Submit" level="high" size="small" />
          </ng-template>
        </ui-modal>
      </div>
    `,
  }),
};
