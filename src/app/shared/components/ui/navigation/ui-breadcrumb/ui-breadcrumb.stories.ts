import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { provideRouter } from '@angular/router';
import { UiBreadcrumb } from '@app/shared/components/ui/navigation/ui-breadcrumb/ui-breadcrumb';
import { UiLink } from '@app/shared/components/ui/actions/ui-link/ui-link';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';

const ITEMS = [
  { icon: 'house', ariaLabel: 'Accueil', url: '#' },
  { label: 'Électronique', url: '#' },
  { label: 'Ordinateurs', url: '#' },
  { label: 'Accessoires', url: '#' },
  { label: 'Clavier sans fil' },
];

const meta: Meta<UiBreadcrumb> = {
  title: 'Components/ui/navigation/ui-breadcrumb',
  component: UiBreadcrumb,
  decorators: [moduleMetadata({ imports: [UiBreadcrumb, UiLink, UiIcon] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=2088-2784&t=KysK7p9ezZJzoSZh-1',
    },
  },
  args: {
    items: ITEMS,
    size: 'default',
    separator: '/',
    maxItems: undefined,
    ariaLabel: "Fil d'Ariane",
    ellipsisAriaLabel: 'Afficher les éléments masqués',
    styleClass: undefined,
  },
  argTypes: {
    items: {
      control: { type: 'object' },
      description:
        "Entrées du fil d'Ariane (UiBreadcrumbItem[]) : label, icon, ariaLabel, url, routerLink, target, command, disabled, visible, styleClass.",
      table: { type: { summary: 'UiBreadcrumbItem[]' }, defaultValue: { summary: '[]' } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'small'],
      description: 'Densité du fil (taille des liens et du séparateur).',
      table: { type: { summary: 'BreadcrumbSize' }, defaultValue: { summary: '"default"' } },
    },
    separator: {
      control: { type: 'text' },
      description: 'Caractère(s) de séparation entre les éléments (le template #separator prend la main).',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"/"' } },
    },
    maxItems: {
      control: { type: 'number' },
      description:
        "Nombre maximum d'éléments affichés (minimum 2). Au-delà, le milieu se replie derrière un bouton ellipsis : premier élément + « … » + éléments de fin. Non défini = jamais de repli.",
      table: { type: { summary: 'number' }, defaultValue: { summary: 'undefined' } },
    },
    ariaLabel: {
      control: { type: 'text' },
      description: 'Nom accessible du landmark <nav>.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"Fil d\'Ariane"' } },
    },
    ellipsisAriaLabel: {
      control: { type: 'text' },
      description: "Nom accessible du bouton ellipsis qui révèle les éléments masqués.",
      table: { type: { summary: 'string' }, defaultValue: { summary: '"Afficher les éléments masqués"' } },
    },
    styleClass: {
      control: { type: 'text' },
      description: 'Classe(s) additionnelle(s) sur le <nav> racine.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    itemClick: {
      action: 'itemClick',
      description: 'Émis au clic sur un élément ({ originalEvent, item }, jamais si disabled).',
      table: { type: { summary: 'EventEmitter<UiBreadcrumbItemCommandEvent>' }, defaultValue: { summary: '—' } },
    },
  },
};

export default meta;
type Story = StoryObj<UiBreadcrumb>;

// Cas de base : hiérarchie de navigation, dernier élément = page courante.
export const Basic: Story = {};

// Densité compacte.
export const Small: Story = { args: { size: 'small' } };

// Navigation interne (RouterLink) — router fourni au niveau de la story.
export const Route: Story = {
  decorators: [applicationConfig({ providers: [provideRouter([{ path: '**', children: [] }])] })],
  args: {
    items: [
      { icon: 'house', ariaLabel: 'Accueil', routerLink: '/' },
      { label: 'Catalogue', routerLink: '/catalogue' },
      { label: 'Ordinateurs', routerLink: ['/catalogue', 'ordinateurs'] },
      { label: 'Clavier sans fil' },
    ],
  },
};

// Séparateur personnalisé via le template #separator.
export const CustomSeparator: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ui-breadcrumb [items]="items" [size]="size">
        <ng-template #separator>
          <ui-icon name="chevron-right" size="sm" />
        </ng-template>
      </ui-breadcrumb>
    `,
  }),
};

// Repli du milieu derrière un bouton ellipsis (maxItems).
export const Ellipsis: Story = { args: { maxItems: 3 } };

// Contenu d'élément personnalisé via le template #item.
export const CustomItem: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ui-breadcrumb [items]="items" [size]="size">
        <ng-template #item let-item let-last="last">
          @if (!last) {
            <ui-link [label]="item.label" [ariaLabel]="item.ariaLabel" [iconLeft]="item.icon" [href]="item.url" size="small" />
          } @else {
            <span style="font-weight: var(--weight-bold); color: var(--global-high-content-default);">
              {{ item.label }}
            </span>
          }
        </ng-template>
      </ui-breadcrumb>
    `,
  }),
};
