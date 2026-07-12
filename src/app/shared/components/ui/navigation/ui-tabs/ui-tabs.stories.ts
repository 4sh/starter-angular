import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiTab, UiTabList, UiTabPanel, UiTabPanels, UiTabs } from './ui-tabs';
import { UiButton } from '@app/shared/components/ui/actions/ui-button/ui-button';
import { UiTag } from '@app/shared/components/ui/informative/ui-tag/ui-tag';

const meta: Meta<UiTabs> = {
  title: 'Components/ui/navigation/ui-tabs',
  component: UiTabs,
  decorators: [
    moduleMetadata({
      imports: [UiTabs, UiTabList, UiTab, UiTabPanels, UiTabPanel, UiButton, UiTag],
    }),
  ],
  parameters: {
    layout: 'padded',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=0-1&t=PXOwFotKvf72dn1c-1',
    },
  },
  argTypes: {
    orientation: {
      control: { type: 'inline-radio' },
      options: ['horizontal', 'vertical'],
      description: 'Axe de la liste : onglets en haut (horizontal) ou sur le côté (vertical).',
      table: { type: { summary: "'horizontal' | 'vertical'" }, defaultValue: { summary: "'horizontal'" } },
    },
    scrollable: {
      control: { type: 'boolean' },
      description: 'Active le défilement de la liste avec des boutons précédent / suivant.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    lazy: {
      control: { type: 'boolean' },
      description: "Défaut de groupe : ne rend le contenu d'un onglet qu'à sa première activation.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    selectOnFocus: {
      control: { type: 'boolean' },
      description: 'Active un onglet dès que son bouton reçoit le focus (activation automatique).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    showNavigators: {
      control: { type: 'boolean' },
      description: 'Affiche les navigateurs précédent / suivant en mode scrollable.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    motion: {
      control: { type: 'boolean' },
      description: "Anime l'indicateur actif et l'apparition des panneaux (reduced-motion respecté).",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
  },
  args: {
    orientation: 'horizontal',
    scrollable: false,
    lazy: false,
    selectOnFocus: false,
    showNavigators: true,
    motion: true,
  },
};

export default meta;
type Story = StoryObj<UiTabs>;

const LOREM =
  'Viennese et half to cortado viennese. Americano steamed caffeine filter luwak skinny half and id spoon. Redeye extraction variety shot instant qui cream roast lungo body shot mazagran.';

// Fixed-width shell so the tabs read like the Figma frame.
const box = (inner: string, width = 645) => `<div style="max-width:${width}px">${inner}</div>`;

// --- Basic -----------------------------------------------------------------
export const Basic: Story = {
  render: (args) => ({
    props: args,
    template: box(`
      <ui-tabs [value]="'0'" [orientation]="orientation" [selectOnFocus]="selectOnFocus" [motion]="motion">
        <ui-tab-list ariaLabel="Sections">
          <ui-tab [value]="'0'">Aperçu</ui-tab>
          <ui-tab [value]="'1'">Activité</ui-tab>
          <ui-tab [value]="'2'">Paramètres</ui-tab>
        </ui-tab-list>
        <ui-tab-panels>
          <ui-tab-panel [value]="'0'">Aperçu , ${LOREM}</ui-tab-panel>
          <ui-tab-panel [value]="'1'">Activité , ${LOREM}</ui-tab-panel>
          <ui-tab-panel [value]="'2'">Paramètres , ${LOREM}</ui-tab-panel>
        </ui-tab-panels>
      </ui-tabs>`),
  }),
};

// --- Dynamic ---------------------------------------------------------------
// Onglets construits depuis un tableau : les libellés et le contenu des
// panneaux restent synchronisés par leur `value`.
export const Dynamic: Story = {
  render: (args) => ({
    props: {
      ...args,
      items: [
        { value: 'inbox', label: 'Boîte de réception', body: 'Vos messages entrants.' },
        { value: 'sent', label: 'Envoyés', body: 'Les messages que vous avez envoyés.' },
        { value: 'drafts', label: 'Brouillons', body: 'Vos brouillons non finalisés.' },
        { value: 'trash', label: 'Corbeille', body: 'Éléments supprimés.' },
      ],
    },
    template: box(`
      <ui-tabs [value]="'inbox'" [motion]="motion">
        <ui-tab-list ariaLabel="Dossiers">
          @for (item of items; track item.value) {
            <ui-tab [value]="item.value">{{ item.label }}</ui-tab>
          }
        </ui-tab-list>
        <ui-tab-panels>
          @for (item of items; track item.value) {
            <ui-tab-panel [value]="item.value">{{ item.body }}</ui-tab-panel>
          }
        </ui-tab-panels>
      </ui-tabs>`),
  }),
};

// --- Controlled ------------------------------------------------------------
// La valeur active est pilotée de l'extérieur via `[(value)]`.
export const Controlled: Story = {
  render: (args) => ({
    props: { ...args, active: 'b' },
    template: box(`
      <div style="display:flex; gap:8px; margin-bottom:16px">
        <ui-button size="small" level="low" (buttonClick)="active='a'">Aller à A</ui-button>
        <ui-button size="small" level="low" (buttonClick)="active='b'">Aller à B</ui-button>
        <ui-button size="small" level="low" (buttonClick)="active='c'">Aller à C</ui-button>
      </div>
      <ui-tabs [(value)]="active" [motion]="motion">
        <ui-tab-list ariaLabel="Sections contrôlées">
          <ui-tab [value]="'a'">Section A</ui-tab>
          <ui-tab [value]="'b'">Section B</ui-tab>
          <ui-tab [value]="'c'">Section C</ui-tab>
        </ui-tab-list>
        <ui-tab-panels>
          <ui-tab-panel [value]="'a'">Contenu A</ui-tab-panel>
          <ui-tab-panel [value]="'b'">Contenu B</ui-tab-panel>
          <ui-tab-panel [value]="'c'">Contenu C</ui-tab-panel>
        </ui-tab-panels>
      </ui-tabs>
      <p style="margin-top:16px; font-size:13px">Onglet actif : <strong>{{ active }}</strong></p>`),
  }),
};

// --- Scrollable ------------------------------------------------------------
// Liste longue : le défilement et les boutons précédent / suivant apparaissent.
export const Scrollable: Story = {
  args: { scrollable: true },
  render: (args) => ({
    props: {
      ...args,
      items: Array.from({ length: 12 }, (_, i) => `${i + 1}`),
    },
    template: box(`
      <ui-tabs [value]="'1'" [scrollable]="scrollable" [showNavigators]="showNavigators" [motion]="motion">
        <ui-tab-list ariaLabel="Nombreux onglets">
          @for (n of items; track n) {
            <ui-tab [value]="n">Onglet {{ n }}</ui-tab>
          }
        </ui-tab-list>
        <ui-tab-panels>
          @for (n of items; track n) {
            <ui-tab-panel [value]="n">Contenu de l'onglet {{ n }}.</ui-tab-panel>
          }
        </ui-tab-panels>
      </ui-tabs>`, 420),
  }),
};

// --- Select on Focus -------------------------------------------------------
// Avec `selectOnFocus`, déplacer le focus au clavier active l'onglet.
export const SelectOnFocus: Story = {
  args: { selectOnFocus: true },
  render: (args) => ({
    props: args,
    template: box(`
      <ui-tabs [value]="'0'" [selectOnFocus]="selectOnFocus" [motion]="motion">
        <ui-tab-list ariaLabel="Activation au focus">
          <ui-tab [value]="'0'">Premier</ui-tab>
          <ui-tab [value]="'1'">Deuxième</ui-tab>
          <ui-tab [value]="'2'">Troisième</ui-tab>
        </ui-tab-list>
        <ui-tab-panels>
          <ui-tab-panel [value]="'0'">Donnez le focus à la liste puis utilisez ←/→ : l'onglet s'active automatiquement.</ui-tab-panel>
          <ui-tab-panel [value]="'1'">Deuxième panneau.</ui-tab-panel>
          <ui-tab-panel [value]="'2'">Troisième panneau.</ui-tab-panel>
        </ui-tab-panels>
      </ui-tabs>`),
  }),
};

// --- Lazy ------------------------------------------------------------------
// Le contenu paresseux n'est rendu qu'à la première activation de l'onglet.
// Enveloppez-le dans <ng-template #content> pour n'initialiser qu'alors.
export const Lazy: Story = {
  args: { lazy: true },
  render: (args) => ({
    props: args,
    template: box(`
      <ui-tabs [value]="'0'" [lazy]="lazy" [motion]="motion">
        <ui-tab-list ariaLabel="Chargement paresseux">
          <ui-tab [value]="'0'">Immédiat</ui-tab>
          <ui-tab [value]="'1'">Paresseux</ui-tab>
        </ui-tab-list>
        <ui-tab-panels>
          <ui-tab-panel [value]="'0'">Rendu dès l'affichage initial.</ui-tab-panel>
          <ui-tab-panel [value]="'1'">
            <ng-template #content>
              <div>Ce contenu n'est construit qu'à l'activation de l'onglet.</div>
            </ng-template>
          </ui-tab-panel>
        </ui-tab-panels>
      </ui-tabs>`),
  }),
};

// --- Disabled --------------------------------------------------------------
// Un onglet `disabled` n'est pas sélectionnable et est ignoré au clavier.
export const Disabled: Story = {
  render: (args) => ({
    props: args,
    template: box(`
      <ui-tabs [value]="'0'" [motion]="motion">
        <ui-tab-list ariaLabel="Onglets avec état désactivé">
          <ui-tab [value]="'0'">Actif</ui-tab>
          <ui-tab [value]="'1'" [disabled]="true">Désactivé</ui-tab>
          <ui-tab [value]="'2'">Disponible</ui-tab>
        </ui-tab-list>
        <ui-tab-panels>
          <ui-tab-panel [value]="'0'">Premier panneau.</ui-tab-panel>
          <ui-tab-panel [value]="'1'">Panneau inaccessible.</ui-tab-panel>
          <ui-tab-panel [value]="'2'">Troisième panneau.</ui-tab-panel>
        </ui-tab-panels>
      </ui-tabs>`),
  }),
};

// --- Custom Indicator ------------------------------------------------------
// Personnalisation de l'indicateur actif via les variables CSS exposées
// `--ui-tabs-active-bar-color` et `--ui-tabs-active-bar-size`.
export const CustomIndicator: Story = {
  render: (args) => ({
    props: args,
    template: box(`
      <ui-tabs
        [value]="'0'" [motion]="motion"
        style="--ui-tabs-active-bar-color: var(--actions-success-surface-default); --ui-tabs-active-bar-size: 4px"
      >
        <ui-tab-list ariaLabel="Indicateur personnalisé">
          <ui-tab [value]="'0'">Design</ui-tab>
          <ui-tab [value]="'1'">Développement</ui-tab>
          <ui-tab [value]="'2'">Livraison</ui-tab>
        </ui-tab-list>
        <ui-tab-panels>
          <ui-tab-panel [value]="'0'">Barre active plus épaisse, teinte succès.</ui-tab-panel>
          <ui-tab-panel [value]="'1'">Deuxième panneau.</ui-tab-panel>
          <ui-tab-panel [value]="'2'">Troisième panneau.</ui-tab-panel>
        </ui-tab-panels>
      </ui-tabs>`),
  }),
};

// --- Template --------------------------------------------------------------
// Contenu riche dans les onglets (icône) et les panneaux.
export const Template: Story = {
  render: (args) => ({
    props: args,
    template: box(`
      <ui-tabs [value]="'profile'" [motion]="motion">
        <ui-tab-list ariaLabel="Compte">
          <ui-tab [value]="'profile'" icon="user">Profil</ui-tab>
          <ui-tab [value]="'notifications'" icon="bell">Notifications</ui-tab>
          <ui-tab [value]="'billing'" icon="credit-card">Facturation</ui-tab>
        </ui-tab-list>
        <ui-tab-panels>
          <ui-tab-panel [value]="'profile'">
            <div style="display:flex; align-items:center; gap:8px">
              <strong>Profil</strong> <ui-tag label="Vérifié" level="success" size="small" />
            </div>
            <p>${LOREM}</p>
          </ui-tab-panel>
          <ui-tab-panel [value]="'notifications'">
            <div style="display:flex; align-items:center; gap:8px">
              <strong>Notifications</strong> <ui-tag label="3 nouvelles" level="highlight" size="small" />
            </div>
            <p>${LOREM}</p>
          </ui-tab-panel>
          <ui-tab-panel [value]="'billing'">
            <div style="display:flex; align-items:center; gap:8px">
              <strong>Facturation</strong> <ui-tag label="Action requise" level="warning" size="small" />
            </div>
            <p>${LOREM}</p>
          </ui-tab-panel>
        </ui-tab-panels>
      </ui-tabs>`),
  }),
};

// --- Tab Menu --------------------------------------------------------------
// Menu de navigation : des onglets sans panneaux, le contenu étant fourni par
// un composant de route (un `router-outlet` , ici simulé pour la démo).
export const TabMenu: Story = {
  render: (args) => ({
    props: { ...args, route: 'dashboard' },
    template: box(`
      <ui-tabs [(value)]="route" [motion]="motion">
        <ui-tab-list ariaLabel="Navigation principale">
          <ui-tab [value]="'dashboard'" icon="gauge">Tableau de bord</ui-tab>
          <ui-tab [value]="'team'" icon="users">Équipe</ui-tab>
          <ui-tab [value]="'projects'" icon="folder">Projets</ui-tab>
          <ui-tab [value]="'reports'" icon="chart-line">Rapports</ui-tab>
        </ui-tab-list>
      </ui-tabs>

      <!-- Emplacement d'un <router-outlet /> , simulé ici. -->
      <div style="margin-top:16px; padding:16px; border:1px dashed var(--global-high-stroke-default); border-radius:8px; font-size:14px">
        Route active : <strong>/{{ route }}</strong>
      </div>`),
  }),
};
