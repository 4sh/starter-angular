import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator, moduleMetadata } from '@storybook/angular';
import { UiFileUploadList } from '@4sh/ui-kit/forms/ui-file-upload';
import { UiUploadFile, UiUploadStatus } from '@4sh/ui-kit/forms/ui-file-upload';

/** Builds a sample UiUploadFile for the isolated row stories. */
function sample(
  name: string,
  size: number,
  status: UiUploadStatus = 'pending',
  extra: Partial<UiUploadFile> = {},
): UiUploadFile {
  return {
    id: name,
    file: new File([], name),
    name,
    size,
    type: '',
    status,
    progress: 0,
    ...extra,
  };
}

// Tiny inline SVG used as a fake image thumbnail.
const THUMB =
  'data:image/svg+xml;utf8,' +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="80"><rect width="80" height="80" fill="%237c3aed"/><circle cx="40" cy="40" r="22" fill="%23fbbf24"/></svg>',
  );

const meta: Meta<UiFileUploadList> = {
  title: 'Components/ui/forms/ui-file-upload-list',
  component: UiFileUploadList,
  decorators: [
    moduleMetadata({ imports: [UiFileUploadList] }),
    componentWrapperDecorator((story) => `<div style="width: 340px">${story}</div>`),
  ],
  parameters: {
    layout: 'centered',
    design: {
      type: 'figma',
      url: 'https://www.figma.com/design/GZww5hdUA49LB8XWeWP6tl/-Projet----UI-Kit?node-id=155-2563&t=inUHXSiILDu9zvad-1',
    },
  },
  argTypes: {
    size: {
      control: { type: 'inline-radio' },
      options: ['default', 'small'],
      table: { type: { summary: 'UiFileUploadListSize' }, defaultValue: { summary: '"default"' } },
    },
    removable: {
      control: { type: 'boolean' },
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'true' } },
    },
    openable: {
      control: { type: 'boolean' },
      description: 'Rend le nom du fichier cliquable : il émet `open`.',
      table: { type: { summary: 'boolean' }, defaultValue: { summary: 'false' } },
    },
    openLabel: {
      control: false,
      description: 'Nom accessible du nom cliquable (`openable`), où `{0}` est le nom du fichier.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"Ouvrir {0}"' } },
    },
    file: {
      control: false,
      description: 'Fichier à afficher (nom, taille, statut, progression, aperçu). Requis.',
      table: { type: { summary: 'UiUploadFile' } },
    },
    icon: {
      control: false,
      description: 'Icône FontAwesome pour les fichiers qui ne sont pas des images.',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"file"' } },
    },
    removeAriaLabel: {
      control: false,
      description:
        'Nom accessible du bouton de suppression (texte brut : le nom du fichier est ajouté dans le template).',
      table: { type: { summary: 'string' }, defaultValue: { summary: '"Supprimer le fichier"' } },
    },
    failedLabel: {
      control: false,
      description: "Texte d'erreur de repli quand le fichier ne porte aucun message.",
      table: { type: { summary: 'string' }, defaultValue: { summary: '"Échec"' } },
    },
    uploadingLabel: {
      control: false,
      description: "Nom accessible du spinner d'envoi, où `{0}` est le nom du fichier.",
      table: { type: { summary: 'string' }, defaultValue: { summary: '"Téléversement de {0}"' } },
    },
    progressLabel: {
      control: false,
      description: 'Nom accessible de la barre de progression, où `{0}` est le nom du fichier.',
      table: {
        type: { summary: 'string' },
        defaultValue: { summary: '"Progression du téléversement de {0}"' },
      },
    },
  },
  args: { size: 'default', removable: true },
};

export default meta;
type Story = StoryObj<UiFileUploadList>;

export const Default: Story = { args: { file: sample('rapport-annuel.pdf', 2_621_440) } };

export const Small: Story = { args: { size: 'small', file: sample('note.txt', 4096) } };

/** Pendant le téléversement : le marqueur bascule sur `ui-spinner` + barre de progression. */
export const Uploading: Story = {
  args: { file: sample('video-demo.mp4', 18_400_000, 'uploading', { progress: 62 }) },
};

/** Échec : icône + message d'erreur, styles d'erreur via tokens. */
export const ErrorState: Story = {
  args: { file: sample('archive.zip', 52_000_000, 'error', { error: 'Fichier trop volumineux' }) },
};

/**
 * Nom cliquable (`openable` → `open`) et action projetée à côté de la corbeille.
 * Un fichier déjà enregistré n'a pas de `File` : seul son nom, sa taille et son id comptent.
 */
export const Openable: Story = {
  render: (args) => ({
    props: {
      ...args,
      file: { ...sample('contrat-signe.pdf', 1_258_291, 'completed'), file: undefined },
      lastOpened: '',
    },
    template: `
      <ui-file-upload-list [file]="file" [size]="size" [removable]="removable" [openable]="true"
        (open)="lastOpened = $event.name">
        <button type="button" class="sb-see" (click)="lastOpened = file.name">Voir</button>
      </ui-file-upload-list>
      <p style="margin-top: 8px; color: var(--global-text-muted)">Ouvert : {{ lastOpened || '—' }}</p>
      <style>
        .sb-see { padding:2px 8px; border:none; border-radius:6px; background:transparent;
          color:var(--actions-low-content-default); font-weight:700; cursor:pointer; }
      </style>
    `,
  }),
};

/** Image avec vignette (object URL). */
export const ImageThumbnail: Story = {
  args: { file: sample('photo.jpg', 843_776, 'completed', { objectUrl: THUMB }) },
};
