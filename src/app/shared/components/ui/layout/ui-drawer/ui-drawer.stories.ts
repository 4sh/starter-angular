import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiDrawer } from '@app/shared/components/ui/layout/ui-drawer/ui-drawer';
import { UiButton } from '@app/shared/components/ui/actions/ui-button/ui-button';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';

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
      description: "État d'ouverture (two-way `[(visible)]`). Pilote l'animation entrée/sortie.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    position: {
      control: { type: 'inline-radio' },
      options: ['left', 'right', 'top', 'bottom'],
      description: "Bord d'ancrage — le panneau glisse depuis ce bord.",
      table: { type: { summary: 'DrawerPosition' }, defaultValue: { summary: '"left"' } },
    },
    fullScreen: {
      control: { type: 'boolean' },
      description: 'Occupe tout le viewport (le panneau apparaît en fondu, sans glissement).',
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
      description: 'Ferme au clic sur le masque (hors panneau) — nécessite `modal`.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    closable: {
      control: { type: 'boolean' },
      description: 'Affiche le bouton de fermeture (×).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    closeOnEscape: {
      control: { type: 'boolean' },
      description: 'Ferme le panneau à la touche Échap.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    blockScroll: {
      control: { type: 'boolean' },
      description: 'Bloque le scroll de fond même pour un panneau non-modal.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    showHeader: {
      control: { type: 'boolean' },
      description: "Rend la zone d'en-tête (titre + fermeture).",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    focusOnShow: {
      control: { type: 'boolean' },
      description: "Capture le focus dans le panneau à l'ouverture (restauré à la fermeture).",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    focusTrap: {
      control: { type: 'boolean' },
      description: 'Piège le focus Tab à l’intérieur du panneau tant qu’il est ouvert.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    contained: {
      control: { type: 'boolean' },
      description:
        "Scope le panneau à l'ancêtre positionné (`position: absolute`) et n'affecte pas le scroll du body — pour embarquer un drawer dans un conteneur.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    motionDisabled: {
      control: { type: 'boolean' },
      description: "Désactive l'animation d'ouverture/fermeture.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    closeIcon: {
      control: { type: 'text' },
      description: 'Nom FontAwesome de l’icône de fermeture.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"xmark"' } },
    },
    drawerStyle: {
      control: false,
      description: 'Styles inline appliqués au panneau (ex : `{ width: "30rem" }`).',
      table: { type: { summary: 'Record<string, string>' }, defaultValue: { summary: 'undefined' } },
    },
    onShow: { action: 'onShow', description: 'Émis après ouverture.' },
    onHide: { action: 'onHide', description: 'Émis après fermeture.' },
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
      <ui-button label="Ouvrir le drawer" (buttonClick)="visible = true" />
      <ui-drawer [(visible)]="visible" header="Titre du panneau">
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
        <ui-button label="Droite" level="low" (buttonClick)="pos = 'right'; visible = true" />
        <ui-button label="Haut" level="low" (buttonClick)="pos = 'top'; visible = true" />
        <ui-button label="Bas" level="low" (buttonClick)="pos = 'bottom'; visible = true" />
      </div>

      <ui-drawer [(visible)]="visible" [position]="pos" [header]="'Position : ' + pos">
        <p style="margin: 0;">Le panneau glisse depuis le bord « {{ pos }} ».</p>
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
      <ui-button label="Ouvrir en plein écran" (buttonClick)="visible = true" />
      <ui-drawer [(visible)]="visible" [fullScreen]="true" header="Plein écran">
        <p style="margin: 0;">
          En mode plein écran, le panneau occupe tout le viewport et apparaît en fondu.
        </p>
      </ui-drawer>
    `,
  }),
};

// --- Responsive -------------------------------------------------------
// Largeur responsive : `min(90vw, …)` garde le panneau dans l'écran sur mobile
// tout en gardant une largeur confortable sur grand écran (via `drawerStyle`).
export const Responsive: Story = {
  render: (args) => ({
    props: { ...args, visible: false },
    template: `
      <ui-button label="Ouvrir le drawer responsive" (buttonClick)="visible = true" />
      <ui-drawer
        [(visible)]="visible"
        position="right"
        header="Largeur responsive"
        [drawerStyle]="{ width: 'min(90vw, 28rem)' }"
      >
        <p style="margin: 0;">
          La largeur s'adapte : plein écran moins une gouttière sur mobile, plafonnée à
          28rem sur grand écran. Redimensionnez la fenêtre pour observer l'adaptation.
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
      <ui-button label="Ouvrir le profil" (buttonClick)="visible = true" />
      <ui-drawer [(visible)]="visible" position="right" ariaLabel="Profil utilisateur">
        <ng-template #header>
          <span style="display: inline-flex; align-items: center; gap: 8px;">
            <ui-icon name="circle-user" size="default" />
            Amelia Stone
          </span>
        </ng-template>

        <p style="margin: 0;">
          En-tête, contenu et pied sont fournis via des templates projetés
          (<code>#header</code>, <code>#footer</code>) pour un contenu riche.
        </p>

        <ng-template #footer>
          <ui-button label="Message" level="low" icon="envelope" (buttonClick)="visible = false" />
          <ui-button label="Suivre" level="high" icon="user-plus" (buttonClick)="visible = false" />
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
      <ui-button label="Ouvrir (headless)" (buttonClick)="visible = true" />
      <ui-drawer [(visible)]="visible" position="left" ariaLabel="Navigation" [drawerStyle]="{ width: '18rem' }">
        <ng-template #headless>
          <nav style="display: flex; flex-direction: column; gap: 4px; padding: 16px;">
            <div style="display: flex; align-items: center; gap: 8px; padding: 8px 12px; font-weight: 700;">
              <ui-icon name="bars" size="sm" /> Menu
            </div>
            @for (item of ['Accueil', 'Projets', 'Équipe', 'Réglages']; track item) {
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

// --- Contained (embarqué + déjà ouvert) -------------------------------
// Panneau scopé à un conteneur positionné (`contained`) et ouvert d'emblée :
// pas de blocage du scroll, pas de capture de focus — pensé pour l'aperçu.
export const Contained: Story = {
  render: (args) => ({
    props: { ...args },
    template: `
      <div style="position: relative; width: 360px; height: 240px; border-radius: 12px; overflow: hidden; border: 1px solid var(--global-default-stroke-default);">
        <ui-drawer
          [visible]="true"
          [contained]="true"
          [focusOnShow]="false"
          [focusTrap]="false"
          [motionDisabled]="true"
          position="left"
          header="Panneau"
          [drawerStyle]="{ width: '200px' }"
        >
          <p style="margin: 0;">Aperçu d'un drawer embarqué dans un conteneur.</p>
        </ui-drawer>
      </div>
    `,
  }),
};
