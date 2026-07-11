import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiModal } from '@app/shared/components/ui/layout/ui-modal/ui-modal';
import { UiButton } from '@app/shared/components/ui/actions/ui-button/ui-button';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';

const meta: Meta<UiModal> = {
  title: 'Components/ui/layout/ui-modal',
  component: UiModal,
  decorators: [moduleMetadata({ imports: [UiModal, UiButton, UiIcon] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=134-9609&t=UVjo39F2me7Bsklt-1',
    },
  },
  argTypes: {
    visible: {
      control: { type: 'boolean' },
      description: "État d'ouverture (two-way `[(visible)]`). Pilote l'animation entrée/sortie.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    header: {
      control: { type: 'text' },
      description: 'Titre simple (ignoré si un template `#header` est projeté).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    modal: {
      control: { type: 'boolean' },
      description: 'Affiche le masque (assombrit + capture les clics) et bloque le scroll de fond.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    dismissableMask: {
      control: { type: 'boolean' },
      description: "Ferme au clic sur le masque (hors dialogue) — nécessite `modal`.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    closable: {
      control: { type: 'boolean' },
      description: 'Affiche le bouton de fermeture (×) et autorise la fermeture par Échap.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    closeOnEscape: {
      control: { type: 'boolean' },
      description: 'Ferme le dialogue à la touche Échap.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    blockScroll: {
      control: { type: 'boolean' },
      description: 'Bloque le scroll de fond même pour un dialogue non-modal.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    showHeader: {
      control: { type: 'boolean' },
      description: "Rend la zone d'en-tête (titre + actions).",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    draggable: {
      control: { type: 'boolean' },
      description: "Autorise le déplacement du dialogue par son en-tête.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    maximizable: {
      control: { type: 'boolean' },
      description: "Affiche le bouton d'agrandissement / restauration dans l'en-tête.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    resizable: {
      control: { type: 'boolean' },
      description: 'Poignée de redimensionnement au coin bas-droit (pointeur uniquement).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    contained: {
      control: { type: 'boolean' },
      description:
        "Scope le dialogue à l'ancêtre positionné (`position: absolute`) et n'affecte pas le scroll du body — pour embarquer une modale dans un conteneur.",
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
      description: 'Position du dialogue dans le viewport.',
      table: { type: { summary: 'ModalPosition' }, defaultValue: { summary: '"center"' } },
    },
    focusOnShow: {
      control: { type: 'boolean' },
      description: "Capture le focus dans le dialogue à l'ouverture (restauré à la fermeture).",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    focusTrap: {
      control: { type: 'boolean' },
      description: 'Piège le focus Tab à l’intérieur du dialogue tant qu’il est ouvert.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    motion: {
      control: { type: 'select' },
      options: ['zoom', 'fade', 'slide-up', 'slide-down', 'slide-left', 'slide-right'],
      description: "Preset d'animation du dialogue (le masque fait toujours un fondu).",
      table: { type: { summary: 'UiMotionPreset' }, defaultValue: { summary: '"zoom"' } },
    },
    motionDisabled: {
      control: { type: 'boolean' },
      description: "Désactive l'animation d'ouverture/fermeture.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    dialogStyle: {
      control: false,
      description: 'Styles inline appliqués au dialogue (ex : `{ width: "32rem" }`).',
      table: { type: { summary: 'Record<string, string>' }, defaultValue: { summary: 'undefined' } },
    },
    breakpoints: {
      control: false,
      description: 'Largeurs par palier, clé = `max-width` (ex : `{ "960px": "75vw" }`).',
      table: { type: { summary: 'Record<string, string>' }, defaultValue: { summary: 'undefined' } },
    },
    onShow: { action: 'onShow', description: 'Émis après ouverture.' },
    onHide: { action: 'onHide', description: 'Émis après fermeture.' },
    onMaximize: { action: 'onMaximize', description: 'Émis au basculement agrandi / restauré.' },
    onDragEnd: { action: 'onDragEnd', description: "Émis à la fin d'un déplacement." },
    onResizeEnd: { action: 'onResizeEnd', description: "Émis à la fin d'un redimensionnement." },
  },
};

export default meta;
type Story = StoryObj<UiModal>;

// --- Basic ------------------------------------------------------------
export const Basic: Story = {
  render: (args) => ({
    props: { ...args, visible: false },
    template: `
      <ui-button label="Afficher le dialogue" (buttonClick)="visible = true" />
      <ui-modal [(visible)]="visible" header="Titre du dialogue" [dialogStyle]="{ width: '30rem' }">
        <p style="margin: 0;">
          Lorem ipsum dolor sit amet, consectetur adipiscing elit. Nulla congue
          sit amet quam ut vestibulum.
        </p>
        <ng-template #footer>
          <ui-button label="Fermer" level="low" (buttonClick)="visible = false" />
          <ui-button label="Valider" level="high" (buttonClick)="visible = false" />
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
      <ui-button label="Afficher le dialogue" (buttonClick)="visible = true" />
      <ui-modal [(visible)]="visible" [dialogStyle]="{ width: '30rem' }" ariaLabel="Profil utilisateur">
        <ng-template #header>
          <span style="display: inline-flex; align-items: center; gap: 8px;">
            <ui-icon name="circle-user" size="default" />
            Amelia Stone
          </span>
        </ng-template>

        <p style="margin: 0;">
          En-tête et pied sont fournis via des templates projetés (<code>#header</code>,
          <code>#footer</code>), pour un contenu riche.
        </p>

        <ng-template #footer>
          <ui-button label="Message" level="low" icon="envelope" (buttonClick)="visible = false" />
          <ui-button label="Suivre" level="high" icon="user-plus" (buttonClick)="visible = false" />
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
      <ui-button label="Afficher le dialogue" (buttonClick)="visible = true" />
      <ui-modal
        [(visible)]="visible"
        header="Déplaçable"
        [draggable]="true"
        [dialogStyle]="{ width: '30rem' }"
      >
        <p style="margin: 0;">
          Saisissez l'en-tête et faites glisser pour déplacer le dialogue. Il reste
          maintenu dans les limites du viewport.
        </p>
        <ng-template #footer>
          <ui-button label="Fermer" level="low" (buttonClick)="visible = false" />
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
        <ui-button label="Haut gauche" size="small" level="low" (buttonClick)="pos = 'topleft'; visible = true" />
        <ui-button label="Haut" size="small" level="low" (buttonClick)="pos = 'top'; visible = true" />
        <ui-button label="Haut droite" size="small" level="low" (buttonClick)="pos = 'topright'; visible = true" />
        <ui-button label="Gauche" size="small" level="low" (buttonClick)="pos = 'left'; visible = true" />
        <ui-button label="Centre" size="small" level="high" (buttonClick)="pos = 'center'; visible = true" />
        <ui-button label="Droite" size="small" level="low" (buttonClick)="pos = 'right'; visible = true" />
        <ui-button label="Bas gauche" size="small" level="low" (buttonClick)="pos = 'bottomleft'; visible = true" />
        <ui-button label="Bas" size="small" level="low" (buttonClick)="pos = 'bottom'; visible = true" />
        <ui-button label="Bas droite" size="small" level="low" (buttonClick)="pos = 'bottomright'; visible = true" />
      </div>

      <ui-modal [(visible)]="visible" [position]="pos" [header]="'Position : ' + pos" [dialogStyle]="{ width: '26rem' }">
        <p style="margin: 0;">Le dialogue s'ancre selon la position choisie.</p>
        <ng-template #footer>
          <ui-button label="Fermer" level="low" (buttonClick)="visible = false" />
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
      <ui-button label="Afficher le dialogue" (buttonClick)="visible = true" />
      <ui-modal
        [(visible)]="visible"
        header="Agrandissable"
        [maximizable]="true"
        [dialogStyle]="{ width: '32rem' }"
      >
        <p style="margin: 0;">
          Utilisez le bouton d'agrandissement de l'en-tête pour occuper tout le
          viewport, puis restaurer la taille initiale.
        </p>
        <ng-template #footer>
          <ui-button label="Fermer" level="low" (buttonClick)="visible = false" />
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
      <ui-button label="Afficher le dialogue" (buttonClick)="visible = true" />
      <ui-modal
        [(visible)]="visible"
        header="Redimensionnable"
        [resizable]="true"
        [draggable]="true"
        [dialogStyle]="{ width: '32rem', height: '18rem' }"
      >
        <p style="margin: 0;">
          Saisissez la poignée du coin bas-droit pour redimensionner le dialogue
          (tailles minimales respectées). L'en-tête permet aussi de le déplacer.
        </p>
        <ng-template #footer>
          <ui-button label="Fermer" level="low" (buttonClick)="visible = false" />
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
      <ui-button label="Afficher le dialogue" (buttonClick)="visible = true" />
      <ui-modal
        [(visible)]="visible"
        header="Modal"
        [modal]="true"
        [dismissableMask]="true"
        [dialogStyle]="{ width: '30rem' }"
      >
        <p style="margin: 0;">
          Le masque assombrit et bloque l'arrière-plan (scroll figé). Avec
          <code>dismissableMask</code>, un clic à l'extérieur ferme le dialogue.
        </p>
        <ng-template #footer>
          <ui-button label="Fermer" level="low" (buttonClick)="visible = false" />
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
      <ui-button label="Afficher le dialogue" (buttonClick)="visible = true" />
      <ui-modal
        [(visible)]="visible"
        header="Sans masque"
        [modal]="false"
        [draggable]="true"
        position="topright"
        [dialogStyle]="{ width: '26rem' }"
      >
        <p style="margin: 0;">
          Sans masque, l'arrière-plan reste interactif et scrollable. Idéal pour un
          panneau non bloquant (déplaçable ici).
        </p>
        <ng-template #footer>
          <ui-button label="Fermer" level="low" (buttonClick)="visible = false" />
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
      <ui-button label="Supprimer" level="error" icon="trash" (buttonClick)="visible = true" />
      <ui-modal
        [(visible)]="visible"
        header="Confirmer la suppression"
        [dismissableMask]="true"
        [dialogStyle]="{ width: '26rem' }"
      >
        <div style="display: flex; gap: 12px; align-items: flex-start;">
          <ui-icon name="triangle-exclamation" size="lg" />
          <p style="margin: 0;">
            Cette action est irréversible. Voulez-vous vraiment supprimer cet élément ?
          </p>
        </div>
        <ng-template #footer>
          <ui-button label="Annuler" level="low" (buttonClick)="visible = false" />
          <ui-button label="Supprimer" level="error" icon="trash" (buttonClick)="visible = false" />
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
      <ui-button label="Afficher le dialogue" (buttonClick)="visible = true" />
      <ui-modal [(visible)]="visible" header="Conditions d'utilisation" [dialogStyle]="{ width: '32rem' }">
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
      <ui-button label="Afficher le dialogue" (buttonClick)="visible = true" />
      <ui-modal
        [(visible)]="visible"
        header="Largeur responsive"
        [breakpoints]="bps"
        [dialogStyle]="{ width: '50vw' }"
      >
        <p style="margin: 0;">
          Largeur fluide par palier via <code>breakpoints</code> : 50vw par défaut,
          75vw sous 960px, 90vw sous 640px. Redimensionnez la fenêtre pour observer
          l'adaptation.
        </p>
        <ng-template #footer>
          <ui-button label="Fermer" level="low" (buttonClick)="visible = false" />
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
          header="Titre du dialogue"
          [dialogStyle]="{ width: '250px' }"
        >
          <p style="margin: 0;">Aperçu d'une modale embarquée dans un conteneur.</p>
          <ng-template #footer>
            <ui-button label="Fermer" level="low" size="small" />
            <ui-button label="Valider" level="high" size="small" />
          </ng-template>
        </ui-modal>
      </div>
    `,
  }),
};
