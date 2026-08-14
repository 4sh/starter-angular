import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiPaginator } from '@4sh/ui-kit/table/ui-paginator';
import { UiIcon } from '@4sh/ui-kit/base/ui-icon';

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
      description: 'Total number of rows, across all pages.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' } },
    },
    rows: {
      control: { type: 'number' },
      description: 'Number of rows per page. Two-way (updated by the selector).',
      table: { type: { summary: 'number' }, defaultValue: { summary: '10' } },
    },
    first: {
      control: { type: 'number' },
      description: 'Index of the first displayed row. Two-way (programmatic pagination).',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' } },
    },
    pageLinks: {
      control: { type: 'number' },
      description: 'Maximum number of page buttons displayed (windowed mode, without `ellipsis`).',
      table: { type: { summary: 'number' }, defaultValue: { summary: '5' } },
    },
    ellipsis: {
      control: { type: 'boolean' },
      description: 'Compact mode: `1 2 3 … 30 31 32` — edges + neighborhood of the current page, `…` in the gaps.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    boundaryCount: {
      control: { type: 'number' },
      description: 'Number of pages always shown at each edge (`ellipsis` mode).',
      table: { type: { summary: 'number' }, defaultValue: { summary: '3' } },
    },
    rowsPerPageOptions: {
      control: false,
      description: 'Choices for the « rows per page » selector (hidden if omitted — Figma boolean `selectPage`).',
      table: { type: { summary: 'number[]' }, defaultValue: { summary: 'undefined' } },
    },
    showFirstLastIcon: {
      control: { type: 'boolean' },
      description: 'Shows the « first / last page » controls.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    showPageLinks: {
      control: { type: 'boolean' },
      description: 'Shows page numbers (disable for a compact previous/next bar).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    showCurrentPageReport: {
      control: { type: 'boolean' },
      description: 'Shows the current page report (e.g. `1 - 10 of 120`).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    currentPageReportTemplate: {
      control: { type: 'text' },
      description: 'Report pattern — placeholders `{first}` `{last}` `{rows}` `{page}` `{pageCount}` `{totalRecords}`.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '{first} - {last} of {totalRecords}' } },
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Disables all controls.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    ariaLabel: {
      control: false,
      description: 'Accessible name of the navigation landmark.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'Pagination' } },
    },
    pageChange: {
      control: false,
      description: 'Emitted on every pagination change (navigation or rows per page).',
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
        <ng-template #start let-state>Rows per page:</ng-template>
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
