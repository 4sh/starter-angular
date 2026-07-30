import type { Meta, StoryObj } from '@storybook/angular';
import { moduleMetadata } from '@storybook/angular';
import { UiLightbox } from '@app/shared/components/ui/layout/ui-lightbox/ui-lightbox';
import { UiButton } from '@app/shared/components/ui/actions/ui-button/ui-button';

const meta: Meta<UiLightbox> = {
  title: 'Components/ui/layout/ui-lightbox',
  component: UiLightbox,
  decorators: [moduleMetadata({ imports: [UiLightbox, UiButton] })],
  parameters: {
    layout: 'centered',
  },
  argTypes: {
    visible: {
      control: { type: 'boolean' },
      description: "État d'ouverture (two-way `[(visible)]`). Pilote l'animation entrée/sortie.",
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    ariaLabel: {
      control: { type: 'text' },
      description: 'Nom accessible du dialogue (il n’y a pas de titre visible à référencer).',
      table: { type: { summary: 'string' }, defaultValue: { summary: "'Aperçu'" } },
    },
    closable: {
      control: { type: 'boolean' },
      description: 'Affiche le bouton de fermeture et active `Escape`.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    closeOnEscape: {
      control: { type: 'boolean' },
      description: 'Ferme sur `Escape` (ignoré si `closable` est `false`).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    dismissableMask: {
      control: { type: 'boolean' },
      description: 'Ferme au clic sur le fond (hors du panneau).',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
  },
  args: {
    ariaLabel: 'Aperçu',
    closable: true,
    closeOnEscape: true,
    dismissableMask: true,
  },
};

export default meta;
type Story = StoryObj<UiLightbox>;

export const Default: Story = {
  render: (args) => ({
    props: { ...args, visible: false },
    template: `
      <ui-button label="Ouvrir la lightbox" (buttonClick)="visible = true" />
      <ui-lightbox [(visible)]="visible" [ariaLabel]="ariaLabel" [closable]="closable"
                   [closeOnEscape]="closeOnEscape" [dismissableMask]="dismissableMask">
        <img src="assets/img/common/jpg/test-jpg.jpg" alt="Exemple"
             style="max-width: 90vw; max-height: 90vh;" />
      </ui-lightbox>
    `,
  }),
};

export const WithToolbar: Story = {
  render: () => ({
    props: { visible: false },
    template: `
      <ui-button label="Ouvrir avec une barre d'outils" (buttonClick)="visible = true" />
      <ui-lightbox [(visible)]="visible" ariaLabel="Aperçu avec outils">
        <ng-template #toolbar>
          <button type="button" class="ui-lightbox-action" aria-label="Action 1">1</button>
          <button type="button" class="ui-lightbox-action" aria-label="Action 2">2</button>
        </ng-template>
        <img src="assets/img/common/jpg/test-jpg.jpg" alt="Exemple"
             style="max-width: 90vw; max-height: 90vh;" />
      </ui-lightbox>
    `,
  }),
};

export const NonDismissable: Story = {
  render: () => ({
    props: { visible: false },
    template: `
      <ui-button label="Ouvrir (fermeture par bouton uniquement)" (buttonClick)="visible = true" />
      <ui-lightbox [(visible)]="visible" [dismissableMask]="false"
                   ariaLabel="Aperçu non fermable au clic externe">
        <img src="assets/img/common/jpg/test-jpg.jpg" alt="Exemple"
             style="max-width: 90vw; max-height: 90vh;" />
      </ui-lightbox>
    `,
  }),
};
