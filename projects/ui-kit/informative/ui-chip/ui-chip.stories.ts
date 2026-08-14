import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiChip } from '@4sh/ui-kit/informative/ui-chip';

const meta: Meta<UiChip> = {
  title: 'Components/ui/informative/ui-chip',
  component: UiChip,
  decorators: [moduleMetadata({ imports: [UiChip] })],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    label: {
      control: { type: 'text' },
      description: 'Chip text.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    level: {
      control: { type: 'select' },
      options: ['default', 'highlight', 'success', 'warning', 'error'],
      description: 'Niveau de feedback (famille de couleur).',
      table: { type: { summary: 'UiFeedbackLevel' }, defaultValue: { summary: '"default"' } },
    },
    subLevel: {
      control: { type: 'inline-radio' },
      options: ['high', 'low'],
      description: 'Intensity: high (strong) or low (subtle).',
      table: { type: { summary: 'UiSubLevel' }, defaultValue: { summary: '"low"' } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'small'],
      description: 'Taille.',
      table: { type: { summary: 'ChipSize' }, defaultValue: { summary: '"default"' } },
    },
    icon: {
      control: { type: 'text' },
      description: "FontAwesome name of the leading icon (ignored if `image` is set).",
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    image: {
      control: { type: 'text' },
      description: "URL of a leading image (avatar-style). Takes priority over `icon`.",
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    alt: {
      control: { type: 'text' },
      description: "Alt text of the image (empty if decorative next to a label).",
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    rounded: {
      control: { type: 'boolean' },
      description: 'Pill shape (default); rounded rectangle if false.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    removable: {
      control: { type: 'boolean' },
      description: 'Shows a remove action at the end of the chip.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    removeIcon: {
      control: { type: 'text' },
      description: "FontAwesome name of the remove icon.",
      table: { type: { summary: 'string' }, defaultValue: { summary: '"xmark"' } },
    },
    disabled: {
      control: { type: 'boolean' },
      description: "Disables the chip (the remove action becomes inert).",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    selectable: {
      control: { type: 'boolean' },
      description: 'Turns the chip into a selectable toggle (rendered as `<button aria-pressed>`).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    selected: {
      control: { type: 'boolean' },
      description: 'Selection state (`selectable` mode, two-way).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    selectedIcon: {
      control: { type: 'text' },
      description: "FontAwesome icon shown leading when selected.",
      table: { type: { summary: 'string' }, defaultValue: { summary: '"check"' } },
    },
    ariaLabel: {
      control: { type: 'text' },
      description: 'Accessible name (replaces the default `label`).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    removeAriaLabel: {
      control: { type: 'text' },
      description: "Accessible name of the remove action.",
      table: { type: { summary: 'string' }, defaultValue: { summary: '"Remove"' } },
    },
    remove: { action: 'remove', table: { category: 'Events' } },
    chipClick: { action: 'chipClick', table: { category: 'Events' } },
    imageError: { action: 'imageError', table: { category: 'Events' } },
  },
  args: {
    label: 'Label',
    level: 'default',
    subLevel: 'low',
    size: 'default',
    rounded: true,
    removable: false,
    disabled: false,
  },
};

export default meta;
type Story = StoryObj<UiChip>;

// Basic
export const Basic: Story = { args: { label: 'Angular' } };

// Removable
export const Removable: Story = { args: { label: 'Angular', removable: true } };

// Niveaux
export const Highlight: Story = { args: { label: 'Highlight', level: 'highlight' } };
export const Success: Story = { args: { label: 'Active', level: 'success', removable: true } };
export const Warning: Story = { args: { label: 'Pending', level: 'warning', removable: true } };
export const Error: Story = { args: { label: 'Rejected', level: 'error', removable: true } };

// Intensité soutenue
export const SubLevelHigh: Story = { args: { label: 'Strong', level: 'highlight', subLevel: 'high' } };

// Tailles
export const Small: Story = { args: { label: 'Compact', level: 'highlight', size: 'small', removable: true } };

// Icon
export const Icon: Story = { args: { label: 'Favorite', level: 'highlight', icon: 'star' } };
export const IconRemovable: Story = {
  args: { label: 'Filter', level: 'highlight', icon: 'filter', removable: true },
};

// Image (avatar-like)
export const Image: Story = {
  args: {
    label: 'Jane Doe',
    image: 'https://i.pravatar.cc/128?img=11',
    alt: '',
    removable: true,
  },
};

// Icon-only (accessible name required)
export const IconOnly: Story = {
  args: { label: undefined, icon: 'user', ariaLabel: 'User', level: 'highlight' },
};

// Disabled
export const Disabled: Story = {
  args: { label: 'Locked', level: 'highlight', removable: true, disabled: true },
};

// Template (custom projected content)
export const Template: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ui-chip [level]="level" [subLevel]="subLevel" [removable]="removable" ariaLabel="Jane Doe en ligne">
        <span style="display:inline-flex;align-items:center;gap:.375rem;">
          <span style="width:.5rem;height:.5rem;border-radius:50%;background:var(--informative-successhigh-surface-default);"></span>
          Jane Doe
        </span>
      </ui-chip>
    `,
  }),
  args: { level: 'highlight', subLevel: 'low', removable: true },
};

// Selectable (bascule unique) — le chip possède son état via `[(selected)]`.
export const Selectable: Story = {
  render: () => ({
    props: { state: { on: false } },
    template: `
      <ui-chip [selectable]="true" [(selected)]="state.on" label="Photography" icon="camera" />
    `,
  }),
};

// Selectable list (liste de sélection multiple — cf. capture). Chaque chip pilote
// son propre état via `[(selected)]` (le composant est la source de vérité visuelle).
export const SelectableList: Story = {
  render: () => ({
    props: {
      interests: [
        { label: 'Music', icon: 'music', selected: false },
        { label: 'Movies', icon: 'film', selected: false },
        { label: 'Travel', icon: 'plane', selected: false },
        { label: 'Food', icon: 'burger', selected: false },
        { label: 'Sports', icon: 'futbol', selected: false },
        { label: 'Gaming', icon: 'gamepad', selected: false },
        { label: 'Reading', icon: 'book', selected: true },
        { label: 'Photography', icon: 'camera', selected: true },
        { label: 'Fitness', icon: 'dumbbell', selected: true },
        { label: 'Technology', icon: 'laptop', selected: false },
        { label: 'Art', icon: 'palette', selected: false },
        { label: 'Nature', icon: 'leaf', selected: false },
        { label: 'Shopping', icon: 'bag-shopping', selected: false },
        { label: 'Cooking', icon: 'utensils', selected: false },
        { label: 'Pets', icon: 'paw', selected: false },
        { label: 'Cars', icon: 'car', selected: false },
        { label: 'Fashion', icon: 'shirt', selected: false },
        { label: 'Science', icon: 'microscope', selected: false },
      ],
    },
    template: `
      <div style="max-width:22rem;padding:1.5rem 2rem;border:1px solid var(--global-border-subtle);border-radius:var(--radius-lg);background:var(--global-background-default);">
        <h3 style="margin:0 0 .25rem;font-family:var(--fontfamily-title);font-weight:var(--weight-bold);color:var(--global-text-default);">What are you interested in?</h3>
        <p style="margin:0 0 1.25rem;color:var(--global-text-muted);">You can select multiple answers.</p>
        <div style="display:flex;flex-wrap:wrap;gap:.5rem;">
          @for (item of interests; track item.label) {
            <ui-chip
              [selectable]="true"
              [(selected)]="item.selected"
              [label]="item.label"
              [icon]="item.icon"
              [ariaLabel]="item.label"
            />
          }
        </div>
      </div>
    `,
  }),
};

// Liste (multi-select rendu)
export const List: Story = {
  render: (args) => ({
    props: args,
    template: `
      <div style="display:flex;flex-wrap:wrap;gap:.5rem;max-width:24rem;">
        <ui-chip label="Angular" level="highlight" removable="true" />
        <ui-chip label="TypeScript" level="highlight" removable="true" />
        <ui-chip label="RxJS" level="highlight" removable="true" />
        <ui-chip label="Signals" level="highlight" removable="true" />
        <ui-chip label="CDK" level="highlight" removable="true" />
      </div>
    `,
  }),
};
