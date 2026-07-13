import type { Meta, StoryObj } from '@storybook/angular';
import { applicationConfig, moduleMetadata } from '@storybook/angular';
import { provideRouter } from '@angular/router';
import { UiLink } from '@app/shared/components/ui/actions/ui-link/ui-link';

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
      description: 'Texte du lien (absent = lien icon-only, ou contenu projeté via <ng-content>).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    ariaLabel: {
      control: { type: 'text' },
      description: 'Aria-label (obligatoire si icon-only ; fallback sur label sinon).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'small'],
      description: 'Taille du lien.',
      table: { type: { summary: 'LinkSize' }, defaultValue: { summary: '"default"' } },
    },
    href: {
      control: { type: 'text' },
      description: 'URL externe / classique (rend un <a href>).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    routerLink: {
      control: { type: 'text' },
      description: 'Cible de navigation interne (directive RouterLink Angular).',
      table: { type: { summary: 'string | unknown[]' }, defaultValue: { summary: 'undefined' } },
    },
    target: {
      control: { type: 'text' },
      description: 'Cible du lien (ex : _blank).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    rel: {
      control: { type: 'text' },
      description: 'Attribut rel (défaut sûr "noopener noreferrer" pour un lien externe).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    external: {
      control: { type: 'boolean' },
      description: 'Lien externe : force target="_blank" + rel sécurisé.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    iconLeft: {
      control: { type: 'text' },
      description: "Nom FontAwesome de l'icône affichée avant le texte.",
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    iconRight: {
      control: { type: 'text' },
      description: "Nom FontAwesome de l'icône affichée après le texte.",
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    disabled: {
      control: { type: 'boolean' },
      description: 'Désactive le lien (retire href/routerLink, aria-disabled, hors tabulation).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    tabindex: {
      control: { type: 'number' },
      description: 'tabindex du lien.',
      table: { type: { summary: 'number' }, defaultValue: { summary: 'undefined' } },
    },
    ariaCurrent: {
      control: { type: 'text' },
      description: 'aria-current posé sur l\'ancre (ex : "page" pour l\'élément courant d\'un fil d\'Ariane).',
      table: { type: { summary: 'string' }, defaultValue: { summary: 'undefined' } },
    },
    linkClick: {
      action: 'clicked',
      description: 'Émis au clic (jamais si disabled). La navigation reste native.',
      table: { type: { summary: 'EventEmitter<MouseEvent>' }, defaultValue: { summary: '—' } },
    },
    linkFocus: {
      action: 'focused',
      description: 'Émis quand le lien reçoit le focus.',
      table: { type: { summary: 'EventEmitter<FocusEvent>' }, defaultValue: { summary: '—' } },
    },
    linkBlur: {
      action: 'blurred',
      description: 'Émis quand le lien perd le focus.',
      table: { type: { summary: 'EventEmitter<FocusEvent>' }, defaultValue: { summary: '—' } },
    },
  },
};

export default meta;
type Story = StoryObj<UiLink>;

// Cas de base
export const Default: Story = { args: { label: 'Link', href: '#' } };
export const Small: Story = { args: { label: 'En savoir plus', href: '#', size: 'small' } };

// Icônes
export const IconLeft: Story = { args: { label: 'Retour', href: '#', iconLeft: 'arrow-left' } };
export const IconRight: Story = { args: { label: 'Continuer', href: '#', iconRight: 'arrow-right' } };
export const External: Story = {
  args: { label: 'Ouvrir le site', href: 'https://angular.dev', external: true, iconRight: 'arrow-up-right-from-square' },
};
export const IconOnly: Story = { args: { href: '#', iconLeft: 'link', ariaLabel: 'Copier le lien' } };

// Navigation interne (RouterLink) — router fourni au niveau de la story.
export const RouterInternal: Story = {
  decorators: [applicationConfig({ providers: [provideRouter([{ path: '**', children: [] }])] })],
  args: { label: 'Mon profil', routerLink: '/profil', iconRight: 'chevron-right' },
};

// États
export const Disabled: Story = { args: { label: 'Lien désactivé', href: '#', disabled: true } };

// Lien inline dans un paragraphe
export const InlineInProse: Story = {
  render: (args) => ({
    props: args,
    template: `
      <p style="max-width: 42ch; line-height: 1.6;">
        Ce composant est fait pour poser un
        <ui-link [label]="label" [href]="href" [size]="size" />
        au fil du texte, exactement comme un lien classique.
      </p>
    `,
  }),
  args: { label: 'lien inline', href: '#', size: 'default' },
  parameters: { layout: 'padded' },
};
