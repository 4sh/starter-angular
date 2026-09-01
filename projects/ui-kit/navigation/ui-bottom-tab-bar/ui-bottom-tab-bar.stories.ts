import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import {
  UiBottomTab,
  UiBottomTabAction,
  UiBottomTabBar,
} from '@4sh/ui-kit/navigation/ui-bottom-tab-bar';
import { UiBadge } from '@4sh/ui-kit/informative/ui-badge';

const meta: Meta<UiBottomTabBar> = {
  title: 'Components/ui/navigation/ui-bottom-tab-bar',
  component: UiBottomTabBar,
  decorators: [
    moduleMetadata({
      imports: [UiBottomTabBar, UiBottomTab, UiBottomTabAction, UiBadge],
    }),
  ],
  parameters: {
    layout: 'padded',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=3767-4454&t=yuxWChyUu5xJ3whc-1',
    },
  },
  argTypes: {
    ariaLabel: {
      control: { type: 'text' },
      description:
        'Nom accessible du landmark de navigation (`aria-label` sur le `<nav>`), à traduire côté application.',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'Navigation principale'" } },
    },
    showLabels: {
      control: { type: 'boolean' },
      description:
        'Affiche les libellés sous les icônes. `false` rend une barre en icônes seules : le nom accessible de chaque item retombe sur son `label`.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    safeArea: {
      control: { type: 'boolean' },
      description:
        "Réserve l'incrustation système sous la barre (`env(safe-area-inset-bottom)`) : indicateur d'accueil iOS, barre de gestes Android. Sans effet sur un écran qui n'en déclare pas.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    contained: {
      control: { type: 'boolean' },
      description:
        "Place la barre dans son ancêtre positionné (`position: absolute`) au lieu de la fixer au viewport. C'est ce que font toutes les démos ci-dessous, chacune dans sa maquette de téléphone.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    ripple: {
      control: { type: 'boolean' },
      description:
        "Onde de pression sur les items quand l'effet ripple est activé (`provideUiRipple()` ou `[uiRippleScope]`). `false` la coupe sur cette barre, même en activation globale.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
  },
  args: {
    ariaLabel: 'Navigation principale',
    showLabels: true,
    safeArea: true,
    contained: true,
    ripple: true,
  },
};

export default meta;
type Story = StoryObj<UiBottomTabBar>;

/**
 * Maquette de téléphone : un ancêtre positionné qui donne à la barre `contained`
 * un bas d'écran où se poser, et au contenu de quoi passer dessous.
 */
const phone = (inner: string, height = 260) => `
  <div style="position:relative; width:340px; height:${height}px; overflow:hidden;
              border:1px solid var(--global-border-default); border-radius:var(--radius-lg);
              background:var(--global-background-muted)">
    <div style="padding:var(--units-lg); font-size:var(--size-typography-text-sm);
                color:var(--global-text-muted)">
      Contenu de l'écran. La barre se pose au bas de ce cadre.
    </div>
    ${inner}
  </div>`;

// --- Basic -----------------------------------------------------------------
// Quatre destinations, icône + libellé, la première active.
export const Basic: Story = {
  render: (args) => ({
    props: { ...args, active: 'home' },
    template: phone(`
      <ui-bottom-tab-bar
        [(value)]="active"
        [ariaLabel]="ariaLabel"
        [showLabels]="showLabels"
        [safeArea]="safeArea"
        [contained]="contained"
        [ripple]="ripple"
      >
        <ui-bottom-tab value="home" icon="house" label="Accueil" />
        <ui-bottom-tab value="search" icon="magnifying-glass" label="Recherche" />
        <ui-bottom-tab value="library" icon="bookmark" label="Bibliothèque" />
        <ui-bottom-tab value="settings" icon="gear" label="Réglages" />
      </ui-bottom-tab-bar>`),
  }),
};

// --- NoLabel ---------------------------------------------------------------
// Barre en icônes seules : `showLabels=false` masque tous les libellés, et
// chaque item garde son `label` comme nom accessible. Un item peut aussi
// simplement omettre `label` et porter un `ariaLabel` (dernier item ici).
export const NoLabel: Story = {
  args: { showLabels: false },
  render: (args) => ({
    props: { ...args, active: 'search' },
    template: phone(`
      <ui-bottom-tab-bar
        [(value)]="active"
        [ariaLabel]="ariaLabel"
        [showLabels]="showLabels"
        [safeArea]="safeArea"
        [contained]="contained"
        [ripple]="ripple"
      >
        <ui-bottom-tab value="home" icon="house" label="Accueil" />
        <ui-bottom-tab value="search" icon="magnifying-glass" label="Recherche" />
        <ui-bottom-tab value="library" icon="bookmark" label="Bibliothèque" />
        <ui-bottom-tab value="profile" icon="user" ariaLabel="Mon profil" />
      </ui-bottom-tab-bar>`),
  }),
};

// --- ActiveIcon ----------------------------------------------------------------
// Bascule outline → solid sur l'item actif : `iconType="outline"` habille l'état
// au repos, `activeIconType` (déjà `solid` par défaut) l'état sélectionné. Une
// seule entrée à poser, donc. Les quatre glyphes retenus existent dans les deux
// jeux de FontAwesome Free ; `activeIcon` sert quand on veut changer carrément
// de glyphe plutôt que d'habillage.
export const ActiveIcon: Story = {
  render: (args) => ({
    props: { ...args, active: 'favorites' },
    template: phone(`
      <ui-bottom-tab-bar
        [(value)]="active"
        [ariaLabel]="ariaLabel"
        [showLabels]="showLabels"
        [safeArea]="safeArea"
        [contained]="contained"
        [ripple]="ripple"
      >
        <ui-bottom-tab value="favorites" icon="heart" iconType="outline" label="Favoris" />
        <ui-bottom-tab value="alerts" icon="bell" iconType="outline" label="Alertes" />
        <ui-bottom-tab value="inbox" icon="envelope" iconType="outline" label="Messages" />
        <ui-bottom-tab value="profile" icon="user" iconType="outline" label="Profil" />
      </ui-bottom-tab-bar>`),
  }),
};

// --- FloatAction -----------------------------------------------------------
// L'action flottante se glisse entre les items, à l'endroit voulu : deux
// destinations, l'action, deux destinations. Elle ne porte jamais l'état actif.
export const FloatAction: Story = {
  render: (args) => ({
    props: { ...args, active: 'home', log: '' },
    template: phone(`
      <ui-bottom-tab-bar
        [(value)]="active"
        [ariaLabel]="ariaLabel"
        [showLabels]="showLabels"
        [safeArea]="safeArea"
        [contained]="contained"
        [ripple]="ripple"
      >
        <ui-bottom-tab value="home" icon="house" label="Accueil" />
        <ui-bottom-tab value="search" icon="magnifying-glass" label="Recherche" />
        <ui-bottom-tab-action
          icon="plus"
          ariaLabel="Créer une publication"
          (actionClick)="log = 'Action déclenchée'"
        />
        <ui-bottom-tab value="inbox" icon="envelope" label="Messages" />
        <ui-bottom-tab value="profile" icon="user" label="Profil" />
      </ui-bottom-tab-bar>`),
  }),
};

// --- BadgeTemplate ---------------------------------------------------------
// Le contenu projeté dans un item se pose en couche d'ornement sur son icône,
// sans jamais intercepter le tap : n'importe quel gabarit y passe, ici une
// instance `ui-badge`. Le compteur doit être annoncé, d'où l'`ariaLabel` de
// l'item qui reprend l'information.
export const BadgeTemplate: Story = {
  render: (args) => ({
    props: { ...args, active: 'home', unread: 3 },
    template: phone(`
      <ui-bottom-tab-bar
        [(value)]="active"
        [ariaLabel]="ariaLabel"
        [showLabels]="showLabels"
        [safeArea]="safeArea"
        [contained]="contained"
        [ripple]="ripple"
      >
        <ui-bottom-tab value="home" icon="house" label="Accueil" />
        <ui-bottom-tab
          value="inbox"
          icon="envelope"
          label="Messages"
          [ariaLabel]="'Messages, ' + unread + ' non lus'"
        >
          <ui-badge [value]="unread" level="error" size="small" />
        </ui-bottom-tab>
        <ui-bottom-tab value="alerts" icon="bell" label="Alertes">
          <ui-badge level="highlight" size="small" ariaLabel="Nouveautés" />
        </ui-bottom-tab>
        <ui-bottom-tab value="settings" icon="gear" label="Réglages" />
      </ui-bottom-tab-bar>`),
  }),
};

// --- States ----------------------------------------------------------------
// Item désactivé (ignoré par les flèches) et lien natif : `href`/`routerLink`
// basculent l'item sur un `<a>`, qui conserve Cmd/Ctrl+clic et « ouvrir dans un
// nouvel onglet ».
export const States: Story = {
  render: (args) => ({
    props: { ...args, active: 'home' },
    template: phone(`
      <ui-bottom-tab-bar
        [(value)]="active"
        [ariaLabel]="ariaLabel"
        [showLabels]="showLabels"
        [safeArea]="safeArea"
        [contained]="contained"
        [ripple]="ripple"
      >
        <ui-bottom-tab value="home" icon="house" label="Accueil" />
        <ui-bottom-tab value="docs" icon="book" label="Docs" href="#docs" />
        <ui-bottom-tab value="team" icon="users" label="Équipe" [disabled]="true" />
        <ui-bottom-tab value="settings" icon="gear" label="Réglages" />
      </ui-bottom-tab-bar>`),
  }),
};
