import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiPaginator } from '@app/shared/components/ui/table/ui-paginator/ui-paginator';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';

const meta: Meta<UiPaginator> = {
  title: 'Components/ui/table/ui-paginator',
  component: UiPaginator,
  decorators: [moduleMetadata({ imports: [UiPaginator, UiIcon] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=252-4636&t=PXOwFotKvf72dn1c-1',
    },
  },
  argTypes: {
    totalRecords: {
      control: { type: 'number' },
      description: 'Nombre total de lignes, toutes pages confondues.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' } },
    },
    rows: {
      control: { type: 'number' },
      description: 'Nombre de lignes par page. Two-way (mis à jour par le sélecteur).',
      table: { type: { summary: 'number' }, defaultValue: { summary: '10' } },
    },
    first: {
      control: { type: 'number' },
      description: 'Index de la première ligne affichée. Two-way (pagination programmatique).',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' } },
    },
    pageLinks: {
      control: { type: 'number' },
      description: 'Nombre maximal de boutons de page affichés (mode fenêtré, sans `ellipsis`).',
      table: { type: { summary: 'number' }, defaultValue: { summary: '5' } },
    },
    ellipsis: {
      control: { type: 'boolean' },
      description: 'Mode compact : `1 2 3 … 30 31 32` — bords + voisinage de la page courante, `…` dans les trous.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    boundaryCount: {
      control: { type: 'number' },
      description: 'Nombre de pages toujours affichées à chaque bord (mode `ellipsis`).',
      table: { type: { summary: 'number' }, defaultValue: { summary: '3' } },
    },
    rowsPerPageOptions: {
      control: false,
      description: 'Choix du sélecteur « lignes par page » (masqué si omis — booléen Figma `selectPage`).',
      table: { type: { summary: 'number[]' }, defaultValue: { summary: 'undefined' } },
    },
    showFirstLastIcon: {
      control: { type: 'boolean' },
      description: 'Affiche les contrôles « première / dernière page ».',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    showPageLinks: {
      control: { type: 'boolean' },
      description: 'Affiche les numéros de page (désactiver pour une barre compacte précédent/suivant).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    showCurrentPageReport: {
      control: { type: 'boolean' },
      description: 'Affiche le rapport de page courante (ex. `1 - 10 sur 120`).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    currentPageReportTemplate: {
      control: { type: 'text' },
      description: 'Motif du rapport — placeholders `{first}` `{last}` `{rows}` `{page}` `{pageCount}` `{totalRecords}`.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '{first} - {last} sur {totalRecords}' } },
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Désactive tous les contrôles.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    ariaLabel: {
      control: false,
      description: 'Nom accessible du landmark de navigation.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'Pagination' } },
    },
    pageChange: {
      control: false,
      description: 'Émis à chaque changement de pagination (navigation ou lignes par page).',
      table: { category: 'outputs' },
    },
  },
  args: {
    totalRecords: 120,
    rows: 10,
    first: 0,
    pageLinks: 5,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<UiPaginator>;

/** Barre autonome : contrôles circulaires + numéros de page fenêtrés. */
export const Basic: Story = {};

/** Sélecteur « lignes par page » (`rowsPerPageOptions`). */
export const WithRowsPerPage: Story = {
  render: (args) => ({
    props: { ...args, options: [5, 10, 20] },
    template: `
      <ui-paginator
        [totalRecords]="totalRecords"
        [rows]="rows"
        [pageLinks]="pageLinks"
        [rowsPerPageOptions]="options"
      />
    `,
  }),
};

/** Beaucoup de pages : la fenêtre de numéros suit la page courante. */
export const ManyPages: Story = {
  args: { totalRecords: 1000, first: 500 },
};

/** Mode compact `ellipsis` : bords + voisinage de la page courante, `…` dans les trous. */
export const Ellipsis: Story = {
  args: { totalRecords: 320, ellipsis: true, first: 0 },
};

/** Mode compact, page courante au milieu : `1 2 3 … 15 16 17 … 30 31 32`. */
export const EllipsisMiddle: Story = {
  args: { totalRecords: 320, ellipsis: true, first: 150 },
};

/** Rapport de page courante (`1 - 10 sur 120`) devant les contrôles, sans boutons de butée. */
export const CurrentPageReport: Story = {
  args: { showCurrentPageReport: true, showFirstLastIcon: false },
};

/**
 * Templates : contenus **embarqués** dans la barre — libellé projeté `#start`
 * (contexte = état de pagination), rapport de page, barre réduite à
 * précédent/suivant + sélecteur de lignes.
 */
export const Template: Story = {
  render: (args) => ({
    props: { ...args, options: [10, 30, 120] },
    template: `
      <ui-paginator
        [totalRecords]="totalRecords"
        [rows]="rows"
        [rowsPerPageOptions]="options"
        showCurrentPageReport
        [showFirstLastIcon]="false"
        [showPageLinks]="false"
      >
        <ng-template #start let-state>Lignes par page :</ng-template>
        <ng-template #end let-state>page {{ state.page + 1 }} / {{ state.pageCount }}</ng-template>
      </ui-paginator>
    `,
  }),
};

/** Templates : surcharge des icônes de contrôle et du contenu des numéros. */
export const TemplateIcons: Story = {
  render: (args) => ({
    props: { ...args },
    template: `
      <ui-paginator [totalRecords]="totalRecords" [rows]="rows" [pageLinks]="pageLinks">
        <ng-template #firsticon><ui-icon name="backward-fast" size="default" /></ng-template>
        <ng-template #previcon><ui-icon name="arrow-left" size="default" /></ng-template>
        <ng-template #nexticon><ui-icon name="arrow-right" size="default" /></ng-template>
        <ng-template #lasticon><ui-icon name="forward-fast" size="default" /></ng-template>
        <ng-template #pagelink let-number let-active="active">
          {{ active ? '• ' + number + ' •' : number }}
        </ng-template>
      </ui-paginator>
    `,
  }),
};

/** Contrôles désactivés. */
export const Disabled: Story = {
  args: { disabled: true },
};
