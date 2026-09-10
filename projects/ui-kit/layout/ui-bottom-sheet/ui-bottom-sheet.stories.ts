import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import {
  UiBottomSheet,
  UiBottomSheetContent,
  UiBottomSheetFooter,
  UiBottomSheetHeader,
} from '@4sh/ui-kit/layout/ui-bottom-sheet';
import { UiButton } from '@4sh/ui-kit/actions/ui-button';
import { UiIcon } from '@4sh/ui-kit/base/ui-icon';
import { UiInput } from '@4sh/ui-kit/forms/ui-input';
import { UiSeparator } from '@4sh/ui-kit/informative/ui-separator';

const meta: Meta<UiBottomSheet> = {
  title: 'Components/ui/layout/ui-bottom-sheet',
  component: UiBottomSheet,
  decorators: [
    moduleMetadata({
      imports: [
        UiBottomSheet,
        UiBottomSheetHeader,
        UiBottomSheetContent,
        UiBottomSheetFooter,
        UiButton,
        UiIcon,
        UiInput,
        UiSeparator,
      ],
    }),
  ],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=269-2273&t=qGEOGikdGreL1EVz-1',
    },
  },
  args: {
    height: 'auto',
    hasBackdrop: true,
    closeOnOverlayClick: true,
    closeOnEscape: true,
    blockScroll: true,
    enableDragToClose: true,
    dragThreshold: 96,
    enableSnapping: false,
    showHandle: true,
    trapFocus: true,
    focusOnShow: true,
    closable: true,
    header: 'Partager le document',
    safeArea: true,
    contained: false,
    motionDisabled: false,
  },
  argTypes: {
    visible: {
      control: { type: 'boolean' },
      description: "État d'ouverture (two-way `[(visible)]`). Pilote l'animation entrée/sortie.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    height: {
      control: { type: 'select' },
      options: ['auto', 'half', 'full', '70vh', '400px'],
      description:
        "Hauteur d'ouverture : `'auto'` (s'adapte au contenu, plafonnée), `'half'` (moitié d'écran), `'full'` (plein écran) ou toute longueur CSS.",
      table: { type: { summary: 'BottomSheetHeight' }, defaultValue: { summary: '"auto"' } },
    },
    hasBackdrop: {
      control: { type: 'boolean' },
      description:
        'Affiche le fond sombre (assombrit + capture les clics) : rend le panneau modal.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    closeOnOverlayClick: {
      control: { type: 'boolean' },
      description: 'Ferme le panneau au clic sur le fond grisé.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    closeOnEscape: {
      control: { type: 'boolean' },
      description: 'Ferme le panneau à la touche Échap.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    blockScroll: {
      control: { type: 'boolean' },
      description: 'Bloque le défilement du `body` tant que le panneau est ouvert.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    enableDragToClose: {
      control: { type: 'boolean' },
      description:
        'Autorise la fermeture en glissant le panneau vers le bas (tactile/souris/stylet).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    dragThreshold: {
      control: { type: 'number' },
      description:
        'Distance de glissement (px) au-delà de laquelle le relâchement ferme le panneau.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '96' } },
    },
    enableSnapping: {
      control: { type: 'boolean' },
      description:
        'Sur `height="half"`, permet de glisser le panneau vers le haut pour passer en plein écran (et de revenir).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    showHandle: {
      control: { type: 'boolean' },
      description: 'Affiche la barre de préhension en haut du panneau.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    trapFocus: {
      control: { type: 'boolean' },
      description: 'Maintient la navigation `Tab` à l’intérieur du panneau tant qu’il est ouvert.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    focusOnShow: {
      control: { type: 'boolean' },
      description: "Déplace le focus dans le panneau à l'ouverture (restauré à la fermeture).",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    autoFocusElement: {
      control: { type: 'text' },
      description:
        "Sélecteur CSS de l'élément à focaliser à l'ouverture (ex : `#searchInput`), cherché dans le panneau.",
      table: { type: { summary: 'string | null' }, defaultValue: { summary: 'null' } },
    },
    header: {
      control: { type: 'text' },
      description: 'Titre simple (ignoré si un slot `[ui-bottom-sheet-header]` est projeté).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    closable: {
      control: { type: 'boolean' },
      description: "Affiche le bouton de fermeture (×) dans l'en-tête.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    closeIcon: {
      control: { type: 'text' },
      description: 'Nom FontAwesome de l’icône de fermeture.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"xmark"' } },
    },
    safeArea: {
      control: { type: 'boolean' },
      description:
        "Réserve l'incrustation système en bas d'écran (indicateur d'accueil iOS, barre de gestes Android).",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    contained: {
      control: { type: 'boolean' },
      description:
        "Scope le panneau à l'ancêtre positionné (`position: absolute`), sans blocage du scroll : pour l'embarquer dans un conteneur borné.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    motionDisabled: {
      control: { type: 'boolean' },
      description: "Désactive l'animation d'ouverture/fermeture.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    role: {
      control: false,
      description: 'Rôle ARIA de la surface.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"dialog"' } },
    },
    opened: { action: 'opened', description: "Émis à la fin de l'animation d'ouverture." },
    closed: { action: 'closed', description: "Émis à la fin de l'animation de fermeture." },
  },
};

export default meta;
type Story = StoryObj<UiBottomSheet>;

// --- Basic ------------------------------------------------------------
// Le cas nominal : trois zones projetées, hauteur `auto`. Les contrôles de la
// barre latérale pilotent le panneau.
export const Basic: Story = {
  render: (args) => ({
    props: { ...args, visible: false },
    template: `
      <ui-button label="Ouvrir le panneau" (buttonClick)="visible = true" />

      <ui-bottom-sheet
        [(visible)]="visible"
        [height]="height"
        [hasBackdrop]="hasBackdrop"
        [closeOnOverlayClick]="closeOnOverlayClick"
        [closeOnEscape]="closeOnEscape"
        [blockScroll]="blockScroll"
        [enableDragToClose]="enableDragToClose"
        [dragThreshold]="dragThreshold"
        [enableSnapping]="enableSnapping"
        [showHandle]="showHandle"
        [trapFocus]="trapFocus"
        [focusOnShow]="focusOnShow"
        [closable]="closable"
        [header]="header"
        [safeArea]="safeArea"
        [motionDisabled]="motionDisabled"
        (opened)="opened()"
        (closed)="closed()"
      >
        <div ui-bottom-sheet-content>
          <p style="margin: 0;">
            Choisissez le mode de partage. Le panneau se ferme au clic sur le fond,
            à la touche Échap, ou en le glissant vers le bas depuis la poignée.
          </p>
        </div>

        <div ui-bottom-sheet-footer>
          <ui-button label="Annuler" level="low" (buttonClick)="visible = false" />
          <ui-button label="Partager" icon="paper-plane" (buttonClick)="visible = false" />
        </div>
      </ui-bottom-sheet>
    `,
  }),
};

// --- Heights ----------------------------------------------------------
// `height` accepte les paliers `auto` / `half` / `full`, ou n'importe quelle
// longueur CSS.
export const Heights: Story = {
  render: () => ({
    props: { visible: false, h: 'auto' },
    template: `
      <div style="display: flex; gap: 8px; flex-wrap: wrap; justify-content: center;">
        <ui-button label="auto" level="low" (buttonClick)="h = 'auto'; visible = true" />
        <ui-button label="half" level="low" (buttonClick)="h = 'half'; visible = true" />
        <ui-button label="full" level="low" (buttonClick)="h = 'full'; visible = true" />
        <ui-button label="400px" level="low" (buttonClick)="h = '400px'; visible = true" />
      </div>

      <ui-bottom-sheet [(visible)]="visible" [height]="h" [header]="'height = ' + h" [closable]="true">
        <div ui-bottom-sheet-content>
          <p style="margin: 0;">
            Le palier <code>full</code> vaut <code>100dvh</code> : la hauteur du viewport
            <em>dynamique</em>, donc jamais rognée par la barre d'adresse d'un navigateur mobile.
          </p>
        </div>
      </ui-bottom-sheet>
    `,
  }),
};

// --- Search (autoFocusElement) ----------------------------------------
// Le cas d'usage phare : un champ prêt à taper dès l'ouverture, ciblé par
// `autoFocusElement`.
export const Search: Story = {
  render: () => ({
    props: { visible: false },
    template: `
      <ui-button label="Rechercher" icon="magnifying-glass" (buttonClick)="visible = true" />

      <ui-bottom-sheet
        [(visible)]="visible"
        height="half"
        autoFocusElement="#sheet-search"
        header="Rechercher"
        [closable]="true"
      >
        <div ui-bottom-sheet-content>
          <ui-input
            inputId="sheet-search"
            label="Mot-clé"
            placeholder="Nom, référence, client…"
            iconLeft="magnifying-glass"
          />
        </div>

        <div ui-bottom-sheet-footer>
          <ui-button label="Effacer" level="low" variant="ghost" />
          <ui-button label="Lancer la recherche" (buttonClick)="visible = false" />
        </div>
      </ui-bottom-sheet>
    `,
  }),
};

// --- Actions ----------------------------------------------------------
// Feuille d'actions : pas d'en-tête, une liste de boutons pleine largeur.
export const Actions: Story = {
  render: () => ({
    props: {
      visible: false,
      items: [
        { label: 'Modifier', icon: 'pen' },
        { label: 'Dupliquer', icon: 'copy' },
        { label: 'Déplacer', icon: 'folder-open' },
      ],
    },
    template: `
      <ui-button label="Actions" level="low" icon="ellipsis" (buttonClick)="visible = true" />

      <ui-bottom-sheet [(visible)]="visible" [closable]="false" ariaLabel="Actions du document">
        <div ui-bottom-sheet-content style="display: flex; flex-direction: column; gap: 4px;">
          @for (item of items; track item.label) {
            <ui-button
              [label]="item.label"
              [icon]="item.icon"
              level="low"
              variant="ghost"
              style="justify-content: flex-start;"
              (buttonClick)="visible = false"
            />
          }
          <ui-separator />
          <ui-button
            label="Supprimer"
            icon="trash"
            level="error"
            variant="ghost"
            style="justify-content: flex-start;"
            (buttonClick)="visible = false"
          />
        </div>
      </ui-bottom-sheet>
    `,
  }),
};

// --- Scrolling content ------------------------------------------------
// En-tête et pied restent en place pendant que le corps défile : le panneau est
// une colonne flex, pas un bloc qui déborde.
export const ScrollingContent: Story = {
  render: () => ({
    props: { visible: false, rows: Array.from({ length: 24 }, (_, i) => i + 1) },
    template: `
      <ui-button label="Ouvrir la liste" (buttonClick)="visible = true" />

      <ui-bottom-sheet [(visible)]="visible" height="half" header="Historique" [closable]="true">
        <div ui-bottom-sheet-content>
          @for (row of rows; track row) {
            <p style="margin: 0 0 12px;">Ligne {{ row }} : contenu défilant dans le panneau.</p>
          }
        </div>

        <div ui-bottom-sheet-footer>
          <ui-button label="Fermer" level="low" (buttonClick)="visible = false" />
        </div>
      </ui-bottom-sheet>
    `,
  }),
};

// --- Snapping ---------------------------------------------------------
// `enableSnapping` sur un panneau `half` : la poignée devient un vrai bouton,
// glissable vers le haut et pilotable au clavier (`↑` / `↓`).
export const Snapping: Story = {
  render: () => ({
    props: { visible: false, rows: Array.from({ length: 20 }, (_, i) => i + 1) },
    template: `
      <ui-button label="Ouvrir (paliers)" (buttonClick)="visible = true" />

      <ui-bottom-sheet
        [(visible)]="visible"
        height="half"
        [enableSnapping]="true"
        header="Deux paliers"
        [closable]="true"
      >
        <div ui-bottom-sheet-content>
          <p style="margin: 0 0 12px;">
            Glissez la poignée vers le haut pour passer en plein écran, vers le bas pour
            revenir au demi-écran puis fermer. Au clavier : <kbd>↑</kbd> / <kbd>↓</kbd> sur
            la poignée.
          </p>
          @for (row of rows; track row) {
            <p style="margin: 0 0 12px;">Ligne {{ row }}.</p>
          }
        </div>
      </ui-bottom-sheet>
    `,
  }),
};

// --- No backdrop ------------------------------------------------------
// Sans fond sombre, le panneau n'est plus modal (`aria-modal` retiré) et la page
// derrière reste visible.
export const NoBackdrop: Story = {
  render: () => ({
    props: { visible: false },
    template: `
      <ui-button label="Ouvrir sans fond" level="low" (buttonClick)="visible = true" />

      <ui-bottom-sheet
        [(visible)]="visible"
        [hasBackdrop]="false"
        [blockScroll]="false"
        header="Panneau non modal"
        [closable]="true"
      >
        <div ui-bottom-sheet-content>
          <p style="margin: 0;">
            Pas de masque, pas de blocage du défilement : le panneau se superpose sans
            capturer les clics de la page.
          </p>
        </div>
      </ui-bottom-sheet>
    `,
  }),
};

// --- Contained (embarqué + déjà ouvert) -------------------------------
// Panneau scopé à un conteneur positionné (`contained`) et ouvert d'emblée :
// pas de blocage du scroll, pas de capture de focus : pensé pour l'aperçu.
export const Contained: Story = {
  render: () => ({
    props: {},
    template: `
      <div style="position: relative; width: 360px; height: 260px; border-radius: 12px; overflow: hidden; border: 1px solid var(--global-border-subtle);">
        <ui-bottom-sheet
          [visible]="true"
          [contained]="true"
          [focusOnShow]="false"
          [trapFocus]="false"
          [motionDisabled]="true"
          header="Panneau"
          [closable]="true"
        >
          <div ui-bottom-sheet-content>
            <p style="margin: 0;">Aperçu d'un bottom sheet embarqué dans un conteneur.</p>
          </div>
          <div ui-bottom-sheet-footer>
            <ui-button label="Valider" size="small" />
          </div>
        </ui-bottom-sheet>
      </div>
    `,
  }),
};
