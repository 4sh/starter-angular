import type { Meta, StoryObj } from '@storybook/angular';
import { componentWrapperDecorator, moduleMetadata } from '@storybook/angular';
import { UiFileUploadList } from '@app/shared/components/ui/forms/ui-file-upload-list/ui-file-upload-list';
import { UiUploadFile, UiUploadStatus } from '@app/shared/components/ui/forms/ui-file-upload/ui-file-upload.model';

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

/** Image avec vignette (object URL). */
export const ImageThumbnail: Story = {
  args: { file: sample('photo.jpg', 843_776, 'completed', { objectUrl: THUMB }) },
};
