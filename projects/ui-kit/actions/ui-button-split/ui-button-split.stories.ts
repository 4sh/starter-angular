import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { provideRouter } from '@angular/router';
import { UiButtonSplit } from '@4sh/ui-kit/actions/ui-button-split';
import { UiMenuItem } from '@4sh/ui-kit/navigation/ui-menu';

// A basic set of options driving the dropdown (activation logged via itemClick).
const BASIC_MODEL: UiMenuItem[] = [
  { label: 'Update' },
  { label: 'Remove' },
  { separator: true },
  { label: 'Angular', url: 'https://angular.dev', target: '_blank' },
  { label: 'View profile', routerLink: '/profil' },
];

// Same options, each carrying an icon.
const ICON_MODEL: UiMenuItem[] = [
  { label: 'Update', icon: 'refresh' },
  { label: 'Remove', icon: 'trash' },
  { separator: true },
  { label: 'Angular', icon: 'arrow-up-right-from-square', url: 'https://angular.dev', target: '_blank' },
  { label: 'View profile', icon: 'user' },
];

// Options with nested submenus (collapsible groups inside the panel).
// Top-level groups are plain headers by default (see UiMenuItem.toggleable) —
// force `toggleable: true` so this story actually demonstrates the collapse.
const NESTED_MODEL: UiMenuItem[] = [
  {
    label: 'File',
    icon: 'folder',
    toggleable: true,
    items: [
      { label: 'New', icon: 'plus' },
      { label: 'Open', icon: 'folder-open' },
      { label: 'Print', icon: 'print' },
    ],
  },
  {
    label: 'Share',
    icon: 'share-nodes',
    toggleable: true,
    items: [
      { label: 'Copy link', icon: 'link' },
      { label: 'Par e-mail', icon: 'envelope' },
    ],
  },
  { separator: true },
  { label: 'Exporter', icon: 'file-export' },
];

const meta: Meta<UiButtonSplit> = {
  title: 'Components/ui/actions/ui-button-split',
  component: UiButtonSplit,
  decorators: [
    moduleMetadata({ imports: [UiButtonSplit] }),
    applicationConfig({ providers: [provideRouter([{ path: '**', children: [] }])] }),
  ],
  parameters: {
    // Extra height so the open popup is visible inside the docs canvas.
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=0-1&t=PXOwFotKvf72dn1c-1',
    },
  },
  argTypes: {
    model: {
      control: false,
      description: 'Additional options revealed by the dropdown (declarative UiMenuItem[] model).',
      table: { type: { summary: 'UiMenuItem[]' }, defaultValue: { summary: '[]' } },
    },
    label: {
      control: { type: 'text' },
      description: "Label of the main action button.",
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    icon: {
      control: { type: 'text' },
      description: "FontAwesome icon of the action button.",
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    iconPos: {
      control: { type: 'inline-radio' },
      options: ['left', 'right', 'top', 'bottom'],
      description: "Icon position of the action button.",
      table: { type: { summary: 'ButtonIconPos' }, defaultValue: { summary: '"left"' } },
    },
    dropdownIcon: {
      control: { type: 'text' },
      description: 'Trigger icon (the chevron).',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"chevron-down"' } },
    },
    level: {
      control: { type: 'select' },
      options: ['high', 'low', 'success', 'warning', 'error'],
      description: 'Semantic level applied to both buttons.',
      table: { type: { summary: 'UiLevel' }, defaultValue: { summary: '"high"' } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'small'],
      description: 'Control size (buttons + menu density).',
      table: { type: { summary: 'ButtonSplitSize' }, defaultValue: { summary: '"default"' } },
    },
    variant: {
      control: { type: 'select' },
      options: ['filled', 'outlined', 'ghost'],
      description: 'Appearance: filled (default, solid) · outlined (border) · ghost (text only), applied to both buttons.',
      table: { type: { summary: 'ButtonVariant' }, defaultValue: { summary: '"filled"' } },
    },
    onColor: {
      control: { type: 'inline-radio' },
      options: [null, 'dark', 'light'],
      description:
        'Brightness of the background color the control sits on, forwarded to both buttons (see ui-button.onColor).',
      table: { type: { summary: "'dark' | 'light' | null" }, defaultValue: { summary: 'null' } },
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Disables both buttons.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    buttonDisabled: {
      control: { type: 'boolean' },
      description: "Disables only the action button.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    menuButtonDisabled: {
      control: { type: 'boolean' },
      description: 'Disables only the menu trigger.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    ariaLabel: {
      control: { type: 'text' },
      description: "Accessible name of the action button (required in icon-only).",
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    menuButtonAriaLabel: {
      control: { type: 'text' },
      description: 'Accessible name of the trigger (icon-only button).',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"Plus d\'options"' } },
    },
    menuAriaLabel: {
      control: { type: 'text' },
      description: 'Accessible name of the options list.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    menuLevel: {
      control: { type: 'inline-radio' },
      options: ['high', 'low'],
      description: 'Color family of the menu panel.',
      table: { type: { summary: "'high' | 'low'" }, defaultValue: { summary: '"high"' } },
    },
    menuStyleClass: {
      control: { type: 'text' },
      description: 'Additional class(es) on the menu panel.',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    autoFlip: {
      control: { type: 'boolean' },
      description: 'Flips the popup above the trigger when space runs out.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    motion: {
      control: { type: 'boolean' },
      description: "Animates the popup opening (reduced-motion takes priority).",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    tabindex: {
      control: { type: 'number' },
      description: "Native tabindex of the action button.",
      table: { type: { summary: 'number' }, defaultValue: { summary: 'undefined' } },
    },
    buttonProps: {
      control: false,
      description: "Additional native attributes forwarded to the action's <button>.",
      table: { type: { summary: 'ButtonNativeProps' }, defaultValue: { summary: 'undefined' } },
    },
    buttonClick: {
      action: 'buttonClick',
      description: "Emitted on clicking the action button (never if disabled).",
      table: { type: { summary: 'EventEmitter<MouseEvent>' }, defaultValue: { summary: '—' } },
    },
    dropdownClick: {
      action: 'dropdownClick',
      description: 'Emitted on clicking the trigger (never if disabled).',
      table: { type: { summary: 'EventEmitter<MouseEvent>' }, defaultValue: { summary: '—' } },
    },
    menuShow: {
      action: 'menuShow',
      description: "Emitted when the popup opens.",
      table: { type: { summary: 'EventEmitter<void>' }, defaultValue: { summary: '—' } },
    },
    menuHide: {
      action: 'menuHide',
      description: 'Emitted when the popup closes.',
      table: { type: { summary: 'EventEmitter<void>' }, defaultValue: { summary: '—' } },
    },
    itemClick: {
      action: 'itemClick',
      description: "Emitted when an option is activated (click / keyboard).",
      table: { type: { summary: 'EventEmitter<UiMenuItemCommandEvent>' }, defaultValue: { summary: '—' } },
    },
  },
  args: {
    label: 'Save',
    level: 'high',
    size: 'default',
    model: BASIC_MODEL,
  },
};

export default meta;
type Story = StoryObj<UiButtonSplit>;

// --- Basic -----------------------------------------------------------------
// A default action button + a collection of options driven by `model`.
export const Basic: Story = {};

// --- Icons -----------------------------------------------------------------
// Both the action button and the options support icons.
export const Icons: Story = {
  args: {
    label: 'Save',
    icon: 'floppy-disk',
    model: ICON_MODEL,
  },
};

// --- Nested ----------------------------------------------------------------
// Options can nest into collapsible submenus.
export const Nested: Story = {
  args: {
    label: 'File',
    icon: 'folder',
    model: NESTED_MODEL,
  },
};

// --- Level -----------------------------------------------------------------
// `level` defines the type of button.
export const Level: Story = {
  render: (args) => ({
    props: { ...args },
    template: `
      <div style="display:flex; gap:16px; flex-wrap:wrap; align-items:flex-start">
        <ui-button-split label="High" level="high" [model]="model" menuAriaLabel="Options High" />
        <ui-button-split label="Low" level="low" [model]="model" menuAriaLabel="Options Low" />
        <ui-button-split label="Success" level="success" [model]="model" menuAriaLabel="Options Success" />
        <ui-button-split label="Warning" level="warning" [model]="model" menuAriaLabel="Options Warning" />
        <ui-button-split label="Error" level="error" [model]="model" menuAriaLabel="Options Error" />
      </div>
    `,
  }),
  args: { model: BASIC_MODEL },
};

// --- Disabled --------------------------------------------------------------
// `disabled` disables everything; the action (`buttonDisabled`) and the trigger
// (`menuButtonDisabled`) can also be disabled independently.
export const Disabled: Story = {
  render: (args) => ({
    props: { ...args },
    template: `
      <div style="display:flex; gap:16px; flex-wrap:wrap; align-items:flex-start">
        <ui-button-split label="All disabled" disabled [model]="model" menuAriaLabel="Options" />
        <ui-button-split label="Disabled action" buttonDisabled [model]="model" menuAriaLabel="Options" />
        <ui-button-split label="Disabled menu" menuButtonDisabled [model]="model" menuAriaLabel="Options" />
      </div>
    `,
  }),
  args: { model: BASIC_MODEL },
};

// --- Sizes -----------------------------------------------------------------
// `size` scales the buttons and the menu density.
export const Sizes: Story = {
  render: (args) => ({
    props: { ...args },
    template: `
      <div style="display:flex; gap:16px; flex-wrap:wrap; align-items:flex-start">
        <ui-button-split label="Default" size="default" [model]="model" menuAriaLabel="Options Default" />
        <ui-button-split label="Small" size="small" [model]="model" menuAriaLabel="Options Small" />
      </div>
    `,
  }),
  args: { model: BASIC_MODEL },
};

// --- Outlined ----------------------------------------------------------------
// `variant` is forwarded to both the action button and the dropdown trigger.
export const Outlined: Story = {
  args: { label: 'Save', level: 'high', variant: 'outlined', model: BASIC_MODEL },
};
