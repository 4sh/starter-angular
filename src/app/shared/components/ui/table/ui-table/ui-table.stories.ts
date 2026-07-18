import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { FormsModule } from '@angular/forms';
import {
  UiTable,
  UiTableCheckbox,
  UiTableFrozenColumn,
  UiTableHeaderCheckbox,
  UiTableRadio,
  UiTableReorderableRow,
  UiTableResizableColumn,
  UiTableRowToggler,
  UiTableSelectableRow,
  UiTableSortableColumn,
  UiTableSortIcon,
} from '@app/shared/components/ui/table/ui-table/ui-table';
import { UiButton } from '@app/shared/components/ui/actions/ui-button/ui-button';
import { UiSelect } from '@app/shared/components/ui/forms/ui-select/ui-select';

interface Product {
  id: number;
  code: string;
  name: string;
  category: string;
  quantity: number;
  price: number;
}

const products: Product[] = [
  { id: 1, code: 'f230fh0g3', name: 'Bracelet bambou', category: 'Accessoires', quantity: 24, price: 65 },
  { id: 2, code: 'nvklal433', name: 'Montre noire', category: 'Accessoires', quantity: 61, price: 72 },
  { id: 3, code: 'zz21cz3c1', name: 'Ceinture bleue', category: 'Accessoires', quantity: 2, price: 79 },
  { id: 4, code: '244wgerg2', name: 'T-shirt bleu', category: 'Vêtements', quantity: 25, price: 29 },
  { id: 5, code: 'h456wer53', name: 'Bracelet cuir', category: 'Accessoires', quantity: 73, price: 15 },
  { id: 6, code: 'av2231fwg', name: 'Chaussures marine', category: 'Chaussures', quantity: 0, price: 109 },
];

/** Dataset étendu pour les démonstrations de scroll / pagination. */
const manyProducts: Product[] = Array.from({ length: 40 }, (_, i) => ({
  id: i + 1,
  code: `sku-${String(i + 1).padStart(4, '0')}`,
  name: `Produit ${i + 1}`,
  category: ['Accessoires', 'Vêtements', 'Chaussures', 'Fitness'][i % 4],
  quantity: (i * 7) % 90,
  price: 10 + ((i * 13) % 120),
}));

const basicColumns = `
  <ng-template #header>
    <tr>
      <th>Code</th>
      <th>Nom</th>
      <th>Catégorie</th>
      <th>Quantité</th>
    </tr>
  </ng-template>
  <ng-template #body let-product>
    <tr>
      <td>{{ product.code }}</td>
      <td>{{ product.name }}</td>
      <td>{{ product.category }}</td>
      <td>{{ product.quantity }}</td>
    </tr>
  </ng-template>
`;

const meta: Meta<UiTable<Product>> = {
  title: 'Components/ui/table/ui-table',
  component: UiTable,
  decorators: [
    moduleMetadata({
      imports: [
        UiTable,
        UiTableSortableColumn,
        UiTableSortIcon,
        UiTableSelectableRow,
        UiTableCheckbox,
        UiTableHeaderCheckbox,
        UiTableRadio,
        UiTableRowToggler,
        UiTableFrozenColumn,
        UiTableResizableColumn,
        UiTableReorderableRow,
        UiButton,
        UiSelect,
        FormsModule,
      ],
    }),
  ],
  parameters: {
    layout: 'padded',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=254-1203&t=Ymo8402f9viL1pzq-1',
    },
  },
  argTypes: {
    value: {
      control: false,
      description: 'Lignes à afficher.',
      table: { type: { summary: 'T[]' }, defaultValue: { summary: '[]' } },
    },
    dataKey: {
      control: false,
      description:
        'Propriété identifiant une ligne de façon unique (chemin pointé accepté) — requis pour l’expansion, recommandé pour la sélection.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'small', 'large'],
      description: 'Densité du padding des cellules.',
      table: { type: { summary: "'default' | 'small' | 'large'" }, defaultValue: { summary: 'default' } },
    },
    showGridlines: {
      control: { type: 'boolean' },
      description: 'Affiche les bordures entre cellules.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    stripedRows: {
      control: { type: 'boolean' },
      description: 'Alterne le fond des lignes paires.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    rowHover: {
      control: { type: 'boolean' },
      description: 'Surbrillance de la ligne survolée (implicite dès qu’un mode de sélection est actif).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    tableStyle: {
      control: false,
      description: 'Styles inline du `<table>` interne (ex. `{\'min-width\': \'60rem\'}` pour le scroll horizontal).',
      table: { type: { summary: 'Record<string, string>' }, defaultValue: { summary: 'undefined' } },
    },
    selectionMode: {
      control: { type: 'inline-radio' },
      options: ['single', 'multiple'],
      description: 'Comportement de sélection des lignes.',
      table: { type: { summary: "'single' | 'multiple' | null" }, defaultValue: { summary: 'null' } },
    },
    selection: {
      control: false,
      description: 'Ligne (single) ou lignes (multiple) sélectionnée(s). Two-way.',
      table: { type: { summary: 'T | T[] | null' }, defaultValue: { summary: 'null' } },
    },
    metaKeySelection: {
      control: { type: 'boolean' },
      description:
        'Sélection façon bureau : clic simple remplace, Ctrl/Cmd+clic bascule, Maj+clic étend la plage.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    sortMode: {
      control: { type: 'inline-radio' },
      options: ['single', 'multiple'],
      description: 'Tri par une colonne, ou plusieurs (Ctrl/Cmd + clic).',
      table: { type: { summary: "'single' | 'multiple'" }, defaultValue: { summary: 'single' } },
    },
    sortField: {
      control: false,
      description: 'Champ trié au montage (presort).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    sortOrder: {
      control: false,
      description: 'Direction initiale du tri (1 asc, -1 desc).',
      table: { type: { summary: 'number' }, defaultValue: { summary: '1' } },
    },
    multiSortMeta: {
      control: false,
      description: 'État initial du tri multiple (presort, avec `sortMode="multiple"`).',
      table: { type: { summary: 'UiTableSortMeta[]' }, defaultValue: { summary: 'undefined' } },
    },
    defaultSortOrder: {
      control: false,
      description: 'Direction appliquée quand une colonne devient triée.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '1' } },
    },
    customSort: {
      control: false,
      description: 'Délègue le tri : la table n’ordonne plus elle-même et émet `sortFunction`.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    paginator: {
      control: { type: 'boolean' },
      description: 'Découpe les lignes en pages et affiche la barre de pagination.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    rows: {
      control: { type: 'number' },
      description: 'Nombre de lignes par page.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '10' } },
    },
    first: {
      control: false,
      description: 'Index de la première ligne affichée. Two-way (pagination programmatique).',
      table: { type: { summary: 'number' }, defaultValue: { summary: '0' } },
    },
    rowsPerPageOptions: {
      control: false,
      description: 'Choix proposés dans le sélecteur « lignes par page » (masqué si omis).',
      table: { type: { summary: 'number[]' }, defaultValue: { summary: 'undefined' } },
    },
    pageLinks: {
      control: { type: 'number' },
      description: 'Nombre maximal de boutons de page affichés.',
      table: { type: { summary: 'number' }, defaultValue: { summary: '5' } },
    },
    scrollable: {
      control: { type: 'boolean' },
      description: 'Active la coque de scroll (en-tête sticky dans le viewport défilant).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    scrollHeight: {
      control: false,
      description: 'Hauteur du viewport : taille CSS (`\'400px\'`) ou `\'flex\'` pour remplir le parent flex.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    frozenValue: {
      control: false,
      description: 'Lignes épinglées au-dessus du corps pendant le scroll.',
      table: { type: { summary: 'T[]' }, defaultValue: { summary: 'undefined' } },
    },
    expandedRowKeys: {
      control: false,
      description: 'Lignes dépliées, indexées par la valeur de `dataKey`. Two-way.',
      table: { type: { summary: 'Record<string, boolean>' }, defaultValue: { summary: '{}' } },
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Affiche un masque + spinner au-dessus du tableau pendant le chargement.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    loadingAriaLabel: {
      control: false,
      description: 'Nom accessible de l’indicateur de chargement.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'Chargement des données' } },
    },
    emptyMessage: {
      control: { type: 'text' },
      description: 'Titre de l’état vide par défaut (rendu avec `ui-empty-state`).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'Aucune donnée à afficher' } },
    },
    emptyIcon: {
      control: false,
      description: 'Icône de l’état vide par défaut.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'inbox' } },
    },
    virtualScroll: {
      control: false,
      description: 'Fenêtre le rendu des lignes sur le viewport visible (requiert `scrollable` + `scrollHeight` fixe).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    virtualScrollItemSize: {
      control: false,
      description: 'Hauteur fixe d’une ligne en px (à appliquer aussi au `<tr>` du template body).',
      table: { type: { summary: 'number' }, defaultValue: { summary: '50' } },
    },
    lazy: {
      control: false,
      description: 'Mode lazy du virtual scroll : `lazyLoad` émet la plage rendue.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    resizableColumns: {
      control: { type: 'boolean' },
      description: 'Active le redimensionnement des colonnes (mode fit : la colonne voisine absorbe le delta).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    rowSelect: { control: false, description: 'Émis quand une ligne devient sélectionnée.', table: { category: 'outputs' } },
    rowUnselect: { control: false, description: 'Émis quand une ligne est désélectionnée.', table: { category: 'outputs' } },
    headerCheckboxToggle: {
      control: false,
      description: 'Émis quand la case « tout sélectionner » de l’en-tête bascule.',
      table: { category: 'outputs' },
    },
    sortFunction: {
      control: false,
      description: 'Émis à la place du tri interne quand `customSort` est actif.',
      table: { category: 'outputs' },
    },
    pageChange: { control: false, description: 'Émis à chaque changement de pagination.', table: { category: 'outputs' } },
    rowExpand: { control: false, description: 'Émis quand une ligne se déplie.', table: { category: 'outputs' } },
    rowCollapse: { control: false, description: 'Émis quand une ligne se replie.', table: { category: 'outputs' } },
    colResize: { control: false, description: 'Émis après un redimensionnement de colonne.', table: { category: 'outputs' } },
    rowReorder: {
      control: false,
      description: 'Émis après un glisser-déposer de ligne, avec la copie réordonnée de `value`.',
      table: { category: 'outputs' },
    },
    lazyLoad: {
      control: false,
      description: 'Émis quand la fenêtre du virtual scroll change (mode lazy).',
      table: { category: 'outputs' },
    },
  },
  args: {
    size: 'default',
    showGridlines: false,
    stripedRows: false,
  },
};

export default meta;
type Story = StoryObj<UiTable<Product>>;

/** Une collection + un template de colonnes suffisent. */
export const Basic: Story = {
  render: (args) => ({
    props: { ...args, products },
    template: `
      <ui-table [value]="products" [size]="size" [showGridlines]="showGridlines" [stripedRows]="stripedRows">
        ${basicColumns}
      </ui-table>
    `,
  }),
};

/** Densité `small` : padding réduit. */
export const Small: Story = {
  args: { size: 'small' },
  render: Basic.render,
};

/** Densité `large` : padding augmenté. */
export const Large: Story = {
  args: { size: 'large' },
  render: Basic.render,
};

/** `showGridlines` affiche les bordures entre cellules. */
export const GridLines: Story = {
  args: { showGridlines: true },
  render: Basic.render,
};

/** `stripedRows` alterne le fond des lignes. */
export const StripedRows: Story = {
  args: { stripedRows: true },
  render: Basic.render,
};

/** Sélection simple : cliquer une autre ligne remplace la précédente. */
export const SelectionSingle: Story = {
  render: () => ({
    props: { products },
    template: `
      <ui-table [value]="products" dataKey="id" selectionMode="single">
        ${basicColumns.replace(
          '<ng-template #body let-product>\n    <tr>',
          '<ng-template #body let-product let-rowIndex="rowIndex">\n    <tr [uiSelectableRow]="product" [uiSelectableRowIndex]="rowIndex">',
        )}
      </ui-table>
    `,
  }),
};

/**
 * Sélection multiple avec `metaKeySelection` : clic simple remplace,
 * Ctrl/Cmd+clic bascule, Maj+clic sélectionne une plage. Le clavier suit le
 * même modèle (flèches, Espace/Entrée, Maj+flèche).
 */
export const SelectionMultiple: Story = {
  render: () => ({
    props: { products },
    template: `
      <ui-table [value]="products" dataKey="id" selectionMode="multiple" metaKeySelection>
        ${basicColumns.replace(
          '<ng-template #body let-product>\n    <tr>',
          '<ng-template #body let-product let-rowIndex="rowIndex">\n    <tr [uiSelectableRow]="product" [uiSelectableRowIndex]="rowIndex">',
        )}
      </ui-table>
    `,
  }),
};

/** Sélection par cases à cocher + case « tout sélectionner » en en-tête. */
export const SelectionCheckbox: Story = {
  render: () => ({
    props: { products },
    template: `
      <ui-table [value]="products" dataKey="id" selectionMode="multiple">
        <ng-template #header>
          <tr>
            <th style="width: 3rem"><ui-table-header-checkbox /></th>
            <th>Code</th>
            <th>Nom</th>
            <th>Catégorie</th>
          </tr>
        </ng-template>
        <ng-template #body let-product let-rowIndex="rowIndex">
          <tr>
            <td><ui-table-checkbox [value]="product" [index]="rowIndex" /></td>
            <td>{{ product.code }}</td>
            <td>{{ product.name }}</td>
            <td>{{ product.category }}</td>
          </tr>
        </ng-template>
      </ui-table>
    `,
  }),
};

/** Sélection simple par boutons radio. */
export const SelectionRadio: Story = {
  render: () => ({
    props: { products },
    template: `
      <ui-table [value]="products" dataKey="id" selectionMode="single">
        <ng-template #header>
          <tr>
            <th style="width: 3rem"></th>
            <th>Code</th>
            <th>Nom</th>
            <th>Catégorie</th>
          </tr>
        </ng-template>
        <ng-template #body let-product let-rowIndex="rowIndex">
          <tr>
            <td><ui-table-radio [value]="product" [index]="rowIndex" name="story-radio" /></td>
            <td>{{ product.code }}</td>
            <td>{{ product.name }}</td>
            <td>{{ product.category }}</td>
          </tr>
        </ng-template>
      </ui-table>
    `,
  }),
};

/** `rowSelect` / `rowUnselect` notifient chaque (dé)sélection. */
export const SelectionEvents: Story = {
  render: () => ({
    props: {
      products,
      lastEvent: '',
      onSelect(event: { data: Product }) {
        (this as { lastEvent: string }).lastEvent = `rowSelect : ${event.data.name}`;
      },
      onUnselect(event: { data: Product }) {
        (this as { lastEvent: string }).lastEvent = `rowUnselect : ${event.data.name}`;
      },
    },
    template: `
      <p style="min-height: 1.5rem">{{ lastEvent || 'Sélectionnez une ligne…' }}</p>
      <ui-table
        [value]="products"
        dataKey="id"
        selectionMode="single"
        (rowSelect)="onSelect($event)"
        (rowUnselect)="onUnselect($event)"
      >
        ${basicColumns.replace(
          '<ng-template #body let-product>\n    <tr>',
          '<ng-template #body let-product let-rowIndex="rowIndex">\n    <tr [uiSelectableRow]="product" [uiSelectableRowIndex]="rowIndex">',
        )}
      </ui-table>
    `,
  }),
};

const sortableColumns = `
  <ng-template #header>
    <tr>
      <th uiSortableColumn="code">Code <ui-table-sort-icon field="code" /></th>
      <th uiSortableColumn="name">Nom <ui-table-sort-icon field="name" /></th>
      <th uiSortableColumn="category">Catégorie <ui-table-sort-icon field="category" /></th>
      <th uiSortableColumn="quantity">Quantité <ui-table-sort-icon field="quantity" /></th>
    </tr>
  </ng-template>
  <ng-template #body let-product>
    <tr>
      <td>{{ product.code }}</td>
      <td>{{ product.name }}</td>
      <td>{{ product.category }}</td>
      <td>{{ product.quantity }}</td>
    </tr>
  </ng-template>
`;

/** Tri simple : chaque clic d’en-tête cycle croissant → décroissant → non trié. */
export const SortSingle: Story = {
  render: () => ({
    props: { products },
    template: `<ui-table [value]="products">${sortableColumns}</ui-table>`,
  }),
};

/** Tri multiple : Ctrl/Cmd + clic compose plusieurs colonnes. */
export const SortMultiple: Story = {
  render: () => ({
    props: { products },
    template: `<ui-table [value]="products" sortMode="multiple">${sortableColumns}</ui-table>`,
  }),
};

/** Presort : tri initial via `sortField` / `sortOrder`, en-têtes toujours interactifs. */
export const SortPresort: Story = {
  render: () => ({
    props: { products },
    template: `<ui-table [value]="products" sortField="quantity" [sortOrder]="-1">${sortableColumns}</ui-table>`,
  }),
};

/** Pagination basique : `paginator` + `rows` (+ sélecteur `rowsPerPageOptions`). */
export const PaginationBasic: Story = {
  render: () => ({
    props: { products: manyProducts, rowsPerPage: [5, 10, 20] },
    template: `
      <ui-table [value]="products" paginator [rows]="5" [rowsPerPageOptions]="rowsPerPage">
        ${basicColumns}
      </ui-table>
    `,
  }),
};

/** Pagination programmatique : pilotage externe du modèle `first`. */
export const PaginationProgrammatic: Story = {
  render: () => ({
    props: { products: manyProducts },
    template: `
      <div style="display: flex; gap: 8px; margin-bottom: 8px">
        <ui-button label="Reculer" level="low" size="small" (buttonClick)="t.first.set(t.first() > 5 ? t.first() - 5 : 0)" />
        <ui-button label="Avancer" level="low" size="small" (buttonClick)="t.first.set(t.first() + 5)" />
      </div>
      <ui-table #t [value]="products" paginator [rows]="5">
        ${basicColumns}
      </ui-table>
    `,
  }),
};

/** Scroll vertical : `scrollHeight` fixe + en-tête sticky. */
export const ScrollVertical: Story = {
  render: () => ({
    props: { products: manyProducts },
    template: `
      <ui-table [value]="products" scrollable scrollHeight="320px">
        ${basicColumns}
      </ui-table>
    `,
  }),
};

/** Scroll horizontal : min-width sur la table, les colonnes ne s’écrasent pas. */
export const ScrollHorizontal: Story = {
  render: () => ({
    props: { products, tableStyle: { 'min-width': '80rem' } },
    template: `
      <ui-table [value]="products" scrollable [tableStyle]="tableStyle">
        <ng-template #header>
          <tr>
            <th style="min-width: 16rem">Code</th>
            <th style="min-width: 16rem">Nom</th>
            <th style="min-width: 16rem">Catégorie</th>
            <th style="min-width: 16rem">Quantité</th>
            <th style="min-width: 16rem">Prix</th>
          </tr>
        </ng-template>
        <ng-template #body let-product>
          <tr>
            <td>{{ product.code }}</td>
            <td>{{ product.name }}</td>
            <td>{{ product.category }}</td>
            <td>{{ product.quantity }}</td>
            <td>{{ product.price }} €</td>
          </tr>
        </ng-template>
      </ui-table>
    `,
  }),
};

/** `scrollHeight="flex"` : le viewport suit la taille du parent flex. */
export const ScrollFlexible: Story = {
  render: () => ({
    props: { products: manyProducts },
    template: `
      <div style="display: flex; flex-direction: column; height: 360px; resize: vertical; overflow: auto; border: 1px dashed var(--global-low-stroke-default); padding: 8px">
        <ui-table [value]="products" scrollable scrollHeight="flex">
          ${basicColumns}
        </ui-table>
      </div>
    `,
  }),
};

/** Colonnes figées à gauche et à droite pendant le scroll horizontal. */
export const FrozenColumns: Story = {
  render: () => ({
    props: { products, tableStyle: { 'min-width': '90rem' } },
    template: `
      <ui-table [value]="products" scrollable [tableStyle]="tableStyle">
        <ng-template #header>
          <tr>
            <th uiFrozenColumn style="min-width: 12rem">Code</th>
            <th uiFrozenColumn style="min-width: 14rem">Nom</th>
            <th style="min-width: 16rem">Catégorie</th>
            <th style="min-width: 16rem">Quantité</th>
            <th style="min-width: 16rem">Stock</th>
            <th uiFrozenColumn alignFrozen="right" style="min-width: 10rem">Prix</th>
          </tr>
        </ng-template>
        <ng-template #body let-product>
          <tr>
            <td uiFrozenColumn>{{ product.code }}</td>
            <td uiFrozenColumn>{{ product.name }}</td>
            <td>{{ product.category }}</td>
            <td>{{ product.quantity }}</td>
            <td>{{ product.quantity > 0 ? 'En stock' : 'Épuisé' }}</td>
            <td uiFrozenColumn alignFrozen="right">{{ product.price }} €</td>
          </tr>
        </ng-template>
      </ui-table>
    `,
  }),
};

/** Lignes figées (`frozenValue`) : épinglées sous l’en-tête pendant le scroll. */
export const FrozenRows: Story = {
  render: () => ({
    props: { products: manyProducts.slice(2), frozen: manyProducts.slice(0, 2) },
    template: `
      <ui-table [value]="products" [frozenValue]="frozen" scrollable scrollHeight="320px" dataKey="id">
        ${basicColumns}
      </ui-table>
    `,
  }),
};

/** Expansion de lignes : `uiRowToggler` + template `#expandedrow`. */
export const RowExpansion: Story = {
  render: () => ({
    props: { products },
    template: `
      <ui-table [value]="products" dataKey="id">
        <ng-template #header>
          <tr>
            <th style="width: 4rem"></th>
            <th>Code</th>
            <th>Nom</th>
            <th>Catégorie</th>
          </tr>
        </ng-template>
        <ng-template #body let-product let-expanded="expanded">
          <tr>
            <td>
              <ui-button
                [uiRowToggler]="product"
                [icon]="expanded ? 'chevron-down' : 'chevron-right'"
                level="low"
                size="small"
                iconOnly
                [ariaLabel]="expanded ? 'Replier la ligne' : 'Déplier la ligne'"
              />
            </td>
            <td>{{ product.code }}</td>
            <td>{{ product.name }}</td>
            <td>{{ product.category }}</td>
          </tr>
        </ng-template>
        <ng-template #expandedrow let-product>
          <tr>
            <td colspan="4">
              <strong>{{ product.name }}</strong> — quantité {{ product.quantity }},
              prix {{ product.price }} €, référence {{ product.code }}.
            </td>
          </tr>
        </ng-template>
      </ui-table>
    `,
  }),
};

/** Redimensionnement de colonnes (mode fit) — gridlines pour visualiser l’effet. */
export const ColumnResizeFit: Story = {
  render: () => ({
    props: { products },
    template: `
      <ui-table [value]="products" resizableColumns showGridlines>
        <ng-template #header>
          <tr>
            <th uiResizableColumn>Code</th>
            <th uiResizableColumn>Nom</th>
            <th uiResizableColumn>Catégorie</th>
            <th>Quantité</th>
          </tr>
        </ng-template>
        <ng-template #body let-product>
          <tr>
            <td>{{ product.code }}</td>
            <td>{{ product.name }}</td>
            <td>{{ product.category }}</td>
            <td>{{ product.quantity }}</td>
          </tr>
        </ng-template>
      </ui-table>
    `,
  }),
};

/** Templates libres : caption, en-tête, pied et message vide. */
export const Templates: Story = {
  render: () => ({
    props: { products },
    template: `
      <ui-table [value]="products" showGridlines>
        <ng-template #caption>Produits ({{ products.length }})</ng-template>
        <ng-template #header>
          <tr>
            <th>Nom</th>
            <th>Catégorie</th>
            <th>Prix</th>
          </tr>
        </ng-template>
        <ng-template #body let-product>
          <tr>
            <td>{{ product.name }}</td>
            <td>{{ product.category }}</td>
            <td>{{ product.price }} €</td>
          </tr>
        </ng-template>
        <ng-template #footer>
          <tr>
            <td colspan="3">{{ products.length }} produits au total</td>
          </tr>
        </ng-template>
      </ui-table>
    `,
  }),
};

/** État vide par défaut : instance `ui-empty-state` (personnalisable via `emptyMessage`/`emptyIcon` ou le template `#emptymessage`). */
export const EmptyState: Story = {
  render: () => ({
    props: { products: [] },
    template: `
      <ui-table [value]="products" emptyMessage="Aucun produit ne correspond à votre recherche" emptyIcon="magnifying-glass">
        ${basicColumns}
      </ui-table>
    `,
  }),
};

/** Réordonnancement de lignes par glisser-déposer (`uiReorderableRow`). */
export const RowReorder: Story = {
  render: () => ({
    props: {
      products: [...products],
      onReorder(event: { value: Product[] }) {
        (this as { products: Product[] }).products = event.value;
      },
    },
    template: `
      <ui-table [value]="products" (rowReorder)="onReorder($event)">
        <ng-template #header>
          <tr>
            <th>Code</th>
            <th>Nom</th>
            <th>Catégorie</th>
            <th>Quantité</th>
          </tr>
        </ng-template>
        <ng-template #body let-product let-rowIndex="rowIndex">
          <tr [uiReorderableRow]="rowIndex">
            <td>{{ product.code }}</td>
            <td>{{ product.name }}</td>
            <td>{{ product.category }}</td>
            <td>{{ product.quantity }}</td>
          </tr>
        </ng-template>
      </ui-table>
    `,
  }),
};

/** Affichage dynamique des colonnes (templating + ui-select multiple). */
export const ColumnToggle: Story = {
  render: () => ({
    props: {
      products,
      allColumns: [
        { field: 'code', header: 'Code' },
        { field: 'name', header: 'Nom' },
        { field: 'category', header: 'Catégorie' },
        { field: 'quantity', header: 'Quantité' },
        { field: 'price', header: 'Prix' },
      ],
      visibleColumns: [
        { field: 'code', header: 'Code' },
        { field: 'name', header: 'Nom' },
        { field: 'category', header: 'Catégorie' },
      ],
    },
    template: `
      <div style="display: flex; justify-content: flex-end; margin-bottom: 8px">
        <div style="width: 320px">
          <ui-select
            multiple
            checkbox
            dataKey="field"
            [options]="allColumns"
            optionLabel="header"
            [(ngModel)]="visibleColumns"
            ariaLabel="Colonnes affichées"
            placeholder="Colonnes"
          />
        </div>
      </div>
      <ui-table [value]="products" showGridlines>
        <ng-template #header>
          <tr>
            @for (col of visibleColumns; track col.field) {
              <th>{{ col.header }}</th>
            }
          </tr>
        </ng-template>
        <ng-template #body let-product>
          <tr>
            @for (col of visibleColumns; track col.field) {
              <td>{{ product[col.field] }}</td>
            }
          </tr>
        </ng-template>
      </ui-table>
    `,
  }),
};

/** Masque de chargement (`loading`) recouvrant le tableau. */
export const Loading: Story = {
  render: () => ({
    props: { products, loading: true },
    template: `
      <div style="margin-bottom: 8px">
        <ui-button [label]="loading ? 'Arrêter le chargement' : 'Charger'" level="low" size="small" (buttonClick)="loading = !loading" />
      </div>
      <ui-table [value]="products" [loading]="loading">
        ${basicColumns}
      </ui-table>
    `,
  }),
};

/** Dataset volumineux pour le virtual scroll. */
const hugeProducts: Product[] = Array.from({ length: 10000 }, (_, i) => ({
  id: i + 1,
  code: `sku-${String(i + 1).padStart(5, '0')}`,
  name: `Produit ${i + 1}`,
  category: ['Accessoires', 'Vêtements', 'Chaussures', 'Fitness'][i % 4],
  quantity: (i * 7) % 90,
  price: 10 + ((i * 13) % 120),
}));

/** Virtual scroll (préchargé) : 10 000 lignes rendues par fenêtre. */
export const VirtualScrollPreload: Story = {
  render: () => ({
    props: { products: hugeProducts },
    template: `
      <ui-table [value]="products" scrollable scrollHeight="400px" virtualScroll [virtualScrollItemSize]="52">
        <ng-template #header>
          <tr>
            <th>Code</th>
            <th>Nom</th>
            <th>Catégorie</th>
            <th>Quantité</th>
          </tr>
        </ng-template>
        <ng-template #body let-product>
          <tr style="height: 52px">
            <td>{{ product.code }}</td>
            <td>{{ product.name }}</td>
            <td>{{ product.category }}</td>
            <td>{{ product.quantity }}</td>
          </tr>
        </ng-template>
      </ui-table>
    `,
  }),
};

/** Virtual scroll lazy : les lignes de la fenêtre sont chargées à la demande (`lazyLoad`). */
export const VirtualScrollLazy: Story = {
  render: () => ({
    props: {
      rows: Array.from({ length: 10000 }, () => null) as (Product | null)[],
      onLazyLoad(event: { first: number; last: number }) {
        const self = this as { rows: (Product | null)[] };
        // Simulated remote fetch of the visible window.
        setTimeout(() => {
          const next = [...self.rows];
          for (let i = event.first; i < event.last; i++) next[i] = hugeProducts[i];
          self.rows = next;
        }, 250);
      },
    },
    template: `
      <ui-table
        [value]="rows"
        scrollable
        scrollHeight="400px"
        virtualScroll
        [virtualScrollItemSize]="52"
        lazy
        (lazyLoad)="onLazyLoad($event)"
      >
        <ng-template #header>
          <tr>
            <th>Code</th>
            <th>Nom</th>
            <th>Catégorie</th>
            <th>Quantité</th>
          </tr>
        </ng-template>
        <ng-template #body let-product>
          <tr style="height: 52px">
            <td>{{ product?.code ?? '…' }}</td>
            <td>{{ product?.name ?? '…' }}</td>
            <td>{{ product?.category ?? '…' }}</td>
            <td>{{ product?.quantity ?? '…' }}</td>
          </tr>
        </ng-template>
      </ui-table>
    `,
  }),
};
