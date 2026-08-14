import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { provideRouter } from '@angular/router';
import { UiLink } from '@4sh/ui-kit/actions/ui-link';

const meta: Meta<UiLink> = {
  title: 'Components/ui/actions/ui-link',
  component: UiLink,
  decorators: [moduleMetadata({ imports: [UiLink] })],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=0-1&t=PXOwFotKvf72dn1c-1',
    },
  },
  argTypes: {
    label: {
      control: { type: 'text' },
      description: 'Link text (absent = icon-only link, or content projected via <ng-content>).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    ariaLabel: {
      control: { type: 'text' },
      description: 'Aria-label (required if icon-only; falls back to label otherwise).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'small'],
      description: 'Link size.',
      table: { type: { summary: 'LinkSize' }, defaultValue: { summary: '"default"' } },
    },
    href: {
      control: { type: 'text' },
      description: 'External / plain URL (renders an <a href>).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    routerLink: {
      control: { type: 'text' },
      description: 'Internal navigation target (Angular RouterLink directive).',
      table: { type: { summary: 'string | unknown[]' }, defaultValue: { summary: 'undefined' } },
    },
    target: {
      control: { type: 'text' },
      description: 'Link target (e.g. _blank).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    rel: {
      control: { type: 'text' },
      description: 'rel attribute (safe default "noopener noreferrer" for an external link).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    external: {
      control: { type: 'boolean' },
      description: 'External link: forces target="_blank" + a secure rel.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    iconLeft: {
      control: { type: 'text' },
      description: "FontAwesome icon name shown before the text.",
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    iconRight: {
      control: { type: 'text' },
      description: "FontAwesome icon name shown after the text.",
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Disables the link (removes href/routerLink, aria-disabled, out of tab order).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    tabindex: {
      control: { type: 'number' },
      description: 'tabindex of the link.',
      table: { type: { summary: 'number' }, defaultValue: { summary: 'undefined' } },
    },
    ariaCurrent: {
      control: { type: 'text' },
      description: 'aria-current set on the anchor (e.g. "page" for the current item of a breadcrumb).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    linkClick: {
      action: 'clicked',
      description: 'Emitted on click (never if disabled). Navigation stays native.',
      table: { type: { summary: 'EventEmitter<MouseEvent>' }, defaultValue: { summary: '—' } },
    },
    linkFocus: {
      action: 'focused',
      description: 'Emitted when the link receives focus.',
      table: { type: { summary: 'EventEmitter<FocusEvent>' }, defaultValue: { summary: '—' } },
    },
    linkBlur: {
      action: 'blurred',
      description: 'Emitted when the link loses focus.',
      table: { type: { summary: 'EventEmitter<FocusEvent>' }, defaultValue: { summary: '—' } },
    },
  },
};

export default meta;
type Story = StoryObj<UiLink>;

// Cas de base
export const Default: Story = { args: { label: 'Link', href: '#' } };
export const Small: Story = { args: { label: 'Learn more', href: '#', size: 'small' } };

// Icônes
export const IconLeft: Story = { args: { label: 'Retour', href: '#', iconLeft: 'arrow-left' } };
export const IconRight: Story = { args: { label: 'Continuer', href: '#', iconRight: 'arrow-right' } };
export const External: Story = {
  args: { label: 'Open the site', href: 'https://angular.dev', external: true, iconRight: 'arrow-up-right-from-square' },
};
export const IconOnly: Story = { args: { href: '#', iconLeft: 'link', ariaLabel: 'Copy link' } };

// Navigation interne (RouterLink) — router fourni au niveau de la story.
export const RouterInternal: Story = {
  decorators: [applicationConfig({ providers: [provideRouter([{ path: '**', children: [] }])] })],
  args: { label: 'My profile', routerLink: '/profil', iconRight: 'chevron-right' },
};

// États
export const Disabled: Story = { args: { label: 'Disabled link', href: '#', disabled: true } };

// Lien inline dans un paragraphe
export const InlineInProse: Story = {
  render: (args) => ({
    props: args,
    template: `
      <p style="max-width: 42ch; line-height: 1.6;">
        This component is made to drop a
        <ui-link [label]="label" [href]="href" [size]="size" />
        inline with text, exactly like a regular link.
      </p>
    `,
  }),
  args: { label: 'lien inline', href: '#', size: 'default' },
  parameters: { layout: 'padded' },
};
