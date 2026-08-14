import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { provideRouter } from '@angular/router';
import { UiButton } from '@4sh/ui-kit/actions/ui-button';

const meta: Meta<UiButton> = {
  title: 'Components/ui/actions/ui-button',
  component: UiButton,
  decorators: [moduleMetadata({ imports: [UiButton] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=17-320&t=7j6veJQXz8JBfHmr-1',
    },
  },
  argTypes: {
    label: {
      control: { type: 'text' },
      description: 'Button text (absent = icon-only button, or content projected via <ng-content>).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    ariaLabel: {
      control: { type: 'text' },
      description: 'Aria-label (required if icon-only; falls back to label otherwise).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    type: {
      control: { type: 'inline-radio' },
      options: ['button', 'submit', 'reset'],
      description: 'Native HTML button type.',
      table: { type: { summary: 'ButtonType' }, defaultValue: { summary: '"button"' } },
    },
    level: {
      control: { type: 'select' },
      options: ['high', 'low', 'success', 'warning', 'error'],
      description: "Semantic level: high/low for importance, success/warning/error for contextual feedback.",
      table: { type: { summary: 'UiLevel' }, defaultValue: { summary: '"high"' } },
    },
    variant: {
      control: { type: 'select' },
      options: ['filled', 'outlined', 'ghost'],
      description: 'Appearance: filled (default, solid) · outlined (border) · ghost (text only). Composes with level and onColor.',
      table: { type: { summary: 'ButtonVariant' }, defaultValue: { summary: '"filled"' } },
    },
    onColor: {
      control: { type: 'inline-radio' },
      options: [null, 'dark', 'light'],
      description:
        "Set only when the button sits on a colored background: the brightness of that background. 'dark' ⇒ white chrome, 'light' ⇒ dark chrome. Theme-insensitive. Orthogonal to level and variant.",
      table: { type: { summary: "'dark' | 'light' | null" }, defaultValue: { summary: 'null' } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'small'],
      description: 'Button size.',
      table: { type: { summary: 'ButtonSize' }, defaultValue: { summary: '"default"' } },
    },
    icon: {
      control: { type: 'text' },
      description: "FontAwesome icon name (e.g. check, arrow-right).",
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    iconPos: {
      control: { type: 'inline-radio' },
      options: ['left', 'right', 'top', 'bottom'],
      description: "Icon position relative to the content.",
      table: { type: { summary: 'ButtonIconPos' }, defaultValue: { summary: '"left"' } },
    },
    iconOnly: {
      control: { type: 'boolean' },
      description: 'Forces the icon-only (square) style even with content present.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    loading: {
      control: { type: 'boolean' },
      description: 'Loading state: shows a spinner and disables the button.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    loadingIcon: {
      control: { type: 'text' },
      description: 'FontAwesome icon for the loading spinner (animated via fa-spin).',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"circle-notch"' } },
    },
    expanded: {
      control: { type: 'boolean' },
      description: 'Pleine largeur (100%).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    rounded: {
      control: { type: 'boolean' },
      description: 'Pill shape (fully rounded corners).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Disables the button (native attribute).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    tabindex: {
      control: { type: 'number' },
      description: 'Native tabindex of the button.',
      table: { type: { summary: 'number' }, defaultValue: { summary: 'undefined' } },
    },
    href: {
      control: { type: 'text' },
      description: "External URL: switches the host to an <a> styled as a button (native behavior preserved).",
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    routerLink: {
      control: { type: 'text' },
      description: "Internal navigation target: switches the host to an <a> (Angular RouterLink).",
      table: { type: { summary: 'string | unknown[]' }, defaultValue: { summary: 'undefined' } },
    },
    target: {
      control: { type: 'text' },
      description: 'Link target in link mode (e.g. _blank).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    rel: {
      control: { type: 'text' },
      description: 'rel attribute in link mode (defaults to "noopener noreferrer" if target="_blank").',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    buttonProps: {
      control: false,
      description: 'Additional native attributes forwarded to the <button>Button</button> (e.g. { form: "login", value: "1" }).',
      table: { type: { summary: 'ButtonNativeProps' }, defaultValue: { summary: 'undefined' } },
    },
    iconTemplate: {
      control: false,
      description: "Custom template for the icon (replaces `icon`).",
      table: { type: { summary: 'TemplateRef<unknown>' }, defaultValue: { summary: 'undefined' } },
    },
    loadingIconTemplate: {
      control: false,
      description: "Custom template for the loading icon (replaces `loadingIcon`).",
      table: { type: { summary: 'TemplateRef<unknown>' }, defaultValue: { summary: 'undefined' } },
    },
    buttonClick: {
      action: 'clicked',
      description: 'Emitted on click (never if disabled or loading).',
      table: { type: { summary: 'EventEmitter<MouseEvent>' }, defaultValue: { summary: '—' } },
    },
    buttonFocus: {
      action: 'focused',
      description: 'Emitted when the button receives focus.',
      table: { type: { summary: 'EventEmitter<FocusEvent>' }, defaultValue: { summary: '—' } },
    },
    buttonBlur: {
      action: 'blurred',
      description: 'Emitted when the button loses focus.',
      table: { type: { summary: 'EventEmitter<FocusEvent>' }, defaultValue: { summary: '—' } },
    },
  },
};

export default meta;
type Story = StoryObj<UiButton>;

// Niveaux sémantiques
export const High: Story = { args: { label: 'High', level: 'high' } };
export const Low: Story = { args: { label: 'Low', level: 'low' } };
export const Success: Story = { args: { label: 'Success', level: 'success' } };
export const Warning: Story = { args: { label: 'Warning', level: 'warning' } };
export const Error: Story = { args: { label: 'Error', level: 'error' } };

// Variantes
export const Outlined: Story = { args: { label: 'Outlined', level: 'high', variant: 'outlined' } };
export const Ghost: Story = { args: { label: 'Ghost', level: 'high', variant: 'ghost' } };

// Une variante = un jeu de tokens par niveau (`--actions-<level><variant>-*`) :
// ces deux planches donnent à voir les 10 jeux d'un coup, `disabled` compris.
const variantRow = (variant: 'outlined' | 'ghost'): Story => ({
  render: () => ({
    template: `
      <div style="display:flex; gap:12px; flex-wrap:wrap; align-items:center">
        <ui-button label="High" level="high" variant="${variant}" />
        <ui-button label="Low" level="low" variant="${variant}" />
        <ui-button label="Success" level="success" variant="${variant}" />
        <ui-button label="Warning" level="warning" variant="${variant}" />
        <ui-button label="Error" level="error" variant="${variant}" />
        <ui-button label="Disabled" level="high" variant="${variant}" disabled />
      </div>
    `,
  }),
  parameters: { layout: 'padded' },
});

export const OutlinedLevels: Story = variantRow('outlined');
export const GhostLevels: Story = variantRow('ghost');

// `onColor` n'a de sens que POSÉ sur un fond de couleur : ces planches
// reproduisent le bandeau, sinon il n'y a rien à démontrer. Fonds pris sur des
// tokens (jamais une couleur en dur) et choisis dans le domaine de validité de
// chaque polarité : primary.500 pour `dark`, warning/orange.500 pour `light`.
const onColorBanner = (polarity: 'dark' | 'light', surface: string): Story => ({
  render: () => ({
    template: `
      <div style="background: var(${surface}); padding: 24px; border-radius: 8px;
                  display:flex; gap:12px; flex-wrap:wrap; align-items:center">
        <ui-button label="Filled" level="high" onColor="${polarity}" />
        <ui-button label="Outlined" level="high" variant="outlined" onColor="${polarity}" />
        <ui-button label="Ghost" level="high" variant="ghost" onColor="${polarity}" />
        <ui-button label="Error" level="error" onColor="${polarity}" />
        <ui-button label="Disabled" level="high" variant="outlined" onColor="${polarity}" disabled />
      </div>
    `,
  }),
  parameters: { layout: 'padded' },
});

export const OnColorDark: Story = onColorBanner('dark', '--actions-high-surface-default');
export const OnColorLight: Story = onColorBanner('light', '--actions-warning-surface-default');

// Sans `onColor`, le même bandeau met le bouton en échec : c'est le problème
// que l'axe résout, et la comparaison vaut mieux qu'un paragraphe.
export const OnColorOmitted: Story = {
  render: () => ({
    template: `
      <div style="background: var(--actions-high-surface-default); padding: 24px; border-radius: 8px;
                  display:flex; gap:12px; flex-wrap:wrap; align-items:center">
        <ui-button label="Filled" level="high" />
        <ui-button label="Outlined" level="high" variant="outlined" />
        <ui-button label="Ghost" level="high" variant="ghost" />
      </div>
    `,
  }),
  parameters: { layout: 'padded' },
};

// Tailles
export const Small: Story = { args: { label: 'Small', level: 'high', size: 'small' } };

// Icônes
export const IconLeft: Story = { args: { label: 'Submit', level: 'success', icon: 'check', iconPos: 'left' } };
export const IconRight: Story = { args: { label: 'Next', level: 'high', icon: 'arrow-right', iconPos: 'right' } };
export const IconTop: Story = { args: { label: 'Add', level: 'high', icon: 'plus', iconPos: 'top' } };
export const IconBottom: Story = { args: { label: 'Download', level: 'low', icon: 'download', iconPos: 'bottom' } };
export const IconOnly: Story = { args: { level: 'high', icon: 'plus', ariaLabel: 'Add' } };
export const IconOnlyForced: Story = {
  args: { label: 'Skipped', level: 'low', icon: 'gear', iconOnly: true, ariaLabel: 'Settings' },
};

// Chargement
export const Loading: Story = { args: { label: 'Saving…', level: 'high', loading: true } };
export const LoadingCustomIcon: Story = {
  args: { label: 'Sending…', level: 'success', loading: true, loadingIcon: 'spinner' },
};

// Layout
export const Expanded: Story = {
  args: { label: 'Full width', level: 'high', expanded: true },
  parameters: { layout: 'padded' },
};
export const Rounded: Story = { args: { label: 'Rounded', level: 'high', rounded: true } };
export const RoundedIconOnly: Story = { args: { level: 'high', icon: 'plus', ariaLabel: 'Add', rounded: true } };

// États
export const Disabled: Story = { args: { label: 'Disabled', level: 'high', disabled: true } };

// Mode lien (rend un <a> stylé bouton)
export const AsLink: Story = { args: { label: 'View the page', level: 'high', href: '#', icon: 'arrow-right', iconPos: 'right' } };
export const AsExternalLink: Story = {
  args: { label: 'Site externe', level: 'low', href: 'https://angular.dev', target: '_blank', icon: 'arrow-up-right-from-square', iconPos: 'right' },
};
export const AsRouterLink: Story = {
  decorators: [applicationConfig({ providers: [provideRouter([{ path: '**', children: [] }])] })],
  args: { label: 'My profile', level: 'high', routerLink: '/profil' },
};
export const AsLinkDisabled: Story = { args: { label: 'Disabled link', level: 'high', href: '#', disabled: true } };

// Contenu projeté (<ng-content>)
export const ProjectedContent: Story = {
  render: (args) => ({
    props: args,
    template: `
      <ui-button [level]="level" [icon]="icon" [iconPos]="iconPos">
        Projected <strong>content</strong>
      </ui-button>
    `,
  }),
  args: { level: 'high', icon: 'star', iconPos: 'left' },
};
