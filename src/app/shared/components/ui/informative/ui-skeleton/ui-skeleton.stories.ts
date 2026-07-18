import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiSkeleton } from '@app/shared/components/ui/informative/ui-skeleton/ui-skeleton';

const meta: Meta<UiSkeleton> = {
  title: 'Components/ui/informative/ui-skeleton',
  component: UiSkeleton,
  decorators: [moduleMetadata({ imports: [UiSkeleton] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=258-1585&t=Ymo8402f9viL1pzq-1',
    },
  },
  argTypes: {
    shape: {
      control: { type: 'inline-radio' },
      options: ['text', 'circle', 'rectangle'],
      description: 'Forme du placeholder (dimensions par défaut associées).',
      table: { type: { summary: 'UiSkeletonShape' }, defaultValue: { summary: '"text"' } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'small'],
      description: 'Préréglage de taille (dimensions par défaut selon la forme).',
      table: { type: { summary: 'UiSkeletonSize' }, defaultValue: { summary: '"default"' } },
    },
    width: {
      control: { type: 'text' },
      description: 'Largeur CSS brute, surcharge la valeur par défaut de la forme (ex. `100%`, `10rem`).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    height: {
      control: { type: 'text' },
      description: 'Hauteur CSS brute, surcharge la valeur par défaut de la forme (ex. `1rem`, `50px`).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    borderRadius: {
      control: { type: 'text' },
      description: 'Rayon CSS brut, surcharge la valeur par défaut de la forme.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    animation: {
      control: { type: 'inline-radio' },
      options: ['wave', 'pulse', 'none'],
      description: "Style d'animation de chargement (`wave` = reflet glissant, défaut).",
      table: { type: { summary: 'UiSkeletonAnimation' }, defaultValue: { summary: '"wave"' } },
    },
  },
  args: {
    shape: 'text',
    size: 'default',
    animation: 'wave',
  },
};

export default meta;
type Story = StoryObj<UiSkeleton>;

// Formes de base imitant la mise en page du contenu pendant le chargement.
export const Basic: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="display:flex;flex-direction:column;gap:16px;width:240px">
        <ui-skeleton [animation]="animation" />
        <ui-skeleton [animation]="animation" width="75%" />
        <ui-skeleton [animation]="animation" width="90%" />
      </div>
    `,
  }),
};

// Toutes les formes et leurs tailles.
export const Shapes: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="display:flex;align-items:center;gap:24px;flex-wrap:wrap">
        <ui-skeleton [animation]="animation" shape="text" />
        <ui-skeleton [animation]="animation" shape="rectangle" />
        <ui-skeleton [animation]="animation" shape="circle" />
        <ui-skeleton [animation]="animation" shape="rectangle" size="small" />
        <ui-skeleton [animation]="animation" shape="circle" size="small" />
        <ui-skeleton [animation]="animation" shape="rectangle" width="10rem" height="4rem" borderRadius="8px" />
      </div>
    `,
  }),
};

// Personnalisation de la couleur de fond via `--ui-skeleton-background`.
export const Color: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="display:flex;flex-direction:column;gap:16px;width:240px">
        <ui-skeleton [animation]="animation" width="100%" style="--ui-skeleton-background: var(--primitives-primary-200)" />
        <ui-skeleton [animation]="animation" width="100%" style="--ui-skeleton-background: var(--primitives-green-200)" />
        <ui-skeleton [animation]="animation" width="100%" style="--ui-skeleton-background: var(--primitives-orange-200)" />
      </div>
    `,
  }),
};

// Implémentation type d'une carte.
export const Card: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="width:280px;padding:16px;border:1px solid var(--global-low-stroke-default);border-radius:16px">
        <ui-skeleton [animation]="animation" width="100%" height="120px" borderRadius="12px" />
        <div style="display:flex;align-items:center;gap:12px;margin-top:16px">
          <ui-skeleton [animation]="animation" shape="circle" width="48px" height="48px" />
          <div style="display:flex;flex-direction:column;gap:8px;flex:1">
            <ui-skeleton [animation]="animation" width="70%" size="small" />
            <ui-skeleton [animation]="animation" width="45%" size="small" />
          </div>
        </div>
        <div style="display:flex;flex-direction:column;gap:8px;margin-top:16px">
          <ui-skeleton [animation]="animation" width="100%" size="small" />
          <ui-skeleton [animation]="animation" width="100%" size="small" />
          <ui-skeleton [animation]="animation" width="60%" size="small" />
        </div>
      </div>
    `,
  }),
};

// Implémentation type d'une grille.
export const Grid: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="display:grid;grid-template-columns:repeat(3,1fr);gap:16px;width:420px">
        @for (item of [1,2,3,4,5,6]; track item) {
          <div style="display:flex;flex-direction:column;gap:8px">
            <ui-skeleton [animation]="animation" width="100%" height="100px" borderRadius="12px" />
            <ui-skeleton [animation]="animation" width="80%" size="small" />
            <ui-skeleton [animation]="animation" width="55%" size="small" />
          </div>
        }
      </div>
    `,
  }),
};

// Implémentation type d'une liste.
export const List: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="display:flex;flex-direction:column;gap:16px;width:340px">
        @for (item of [1,2,3,4]; track item) {
          <div style="display:flex;align-items:center;gap:12px">
            <ui-skeleton [animation]="animation" shape="circle" width="40px" height="40px" />
            <div style="display:flex;flex-direction:column;gap:8px;flex:1">
              <ui-skeleton [animation]="animation" width="100%" size="small" />
              <ui-skeleton [animation]="animation" width="70%" size="small" />
            </div>
          </div>
        }
      </div>
    `,
  }),
};

// Implémentation type d'un tableau de données.
export const DataTable: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="width:520px;display:flex;flex-direction:column;gap:8px">
        <div style="display:flex;gap:12px;padding-bottom:8px;border-bottom:1px solid var(--global-low-stroke-default)">
          <ui-skeleton [animation]="animation" width="25%" size="small" />
          <ui-skeleton [animation]="animation" width="25%" size="small" />
          <ui-skeleton [animation]="animation" width="25%" size="small" />
          <ui-skeleton [animation]="animation" width="25%" size="small" />
        </div>
        @for (row of [1,2,3,4,5]; track row) {
          <div style="display:flex;gap:12px;padding:6px 0">
            <ui-skeleton [animation]="animation" width="25%" size="small" />
            <ui-skeleton [animation]="animation" width="25%" size="small" />
            <ui-skeleton [animation]="animation" width="25%" size="small" />
            <ui-skeleton [animation]="animation" width="25%" size="small" />
          </div>
        }
      </div>
    `,
  }),
};
