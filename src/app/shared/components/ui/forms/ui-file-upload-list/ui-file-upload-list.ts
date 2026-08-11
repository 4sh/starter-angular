import { booleanAttribute, Component, computed, input, output } from '@angular/core';
import { UiIcon, UiIconSize } from '@4sh/ui-kit/ui-icon';
import { UiSpinner } from '@app/shared/components/ui/informative/ui-spinner/ui-spinner';
import { formatFileSize, UiUploadFile } from '@app/shared/components/ui/forms/ui-file-upload/ui-file-upload.model';
import { formatLabel } from '@app/shared/components/ui/forms/format-label';

export type UiFileUploadListSize = 'default' | 'small';

/**
 * ui-file-upload-list — a single file row (the repeatable unit of an upload list).
 *
 * Presentational: shows a leading thumbnail (for images) or file icon, the file
 * name + size/status, and a remove button. While the file is uploading it swaps
 * the leading icon for a `ui-spinner` and reveals a slim progress bar.
 *
 * Named to mirror the Figma component; the uploader stacks one row per file.
 */
@Component({
  selector: 'ui-file-upload-list',
  imports: [UiIcon, UiSpinner],
  templateUrl: './ui-file-upload-list.html',
  styleUrl: './ui-file-upload-list.scss',
})
export class UiFileUploadList {
  /** The file to display (name/size/status/progress/preview). */
  file = input.required<UiUploadFile>();
  size = input<UiFileUploadListSize>('default');
  /** FontAwesome icon for non-image files. */
  icon = input<string>('file');
  /** Whether the remove button is shown. */
  removable = input(true, { transform: booleanAttribute });
  /** Accessible name of the remove button (raw text — the file name is appended in the template). */
  removeAriaLabel = input<string>('Supprimer le fichier');
  /** Fallback error text when the file carries no message. */
  failedLabel = input<string>('Échec');
  /** Accessible name of the upload spinner — `{0}` is the file name. */
  uploadingLabel = input<string>('Téléversement de {0}');
  /** Accessible name of the progress bar — `{0}` is the file name. */
  progressLabel = input<string>('Progression du téléversement de {0}');

  /** Emitted when the remove button is activated. */
  remove = output<UiUploadFile>();

  /** @ignore Formatted size (e.g. "2.5 MB"). */
  protected readonly sizeLabel = computed(() => formatFileSize(this.file().size));

  /** @ignore Accessible name of the upload spinner (`{0}` filled with the file name). */
  protected readonly uploadingAriaLabel = computed(() => formatLabel(this.uploadingLabel(), this.file().name));

  /** @ignore Accessible name of the progress bar (`{0}` filled with the file name). */
  protected readonly progressAriaLabel = computed(() => formatLabel(this.progressLabel(), this.file().name));

  /** @ignore Uploading in progress → show the spinner + progress bar. */
  protected readonly isUploading = computed(() => this.file().status === 'uploading');

  /** @ignore Error state → surface the message + error styling. */
  protected readonly isError = computed(() => this.file().status === 'error');

  /** @ignore Image with a usable preview URL → render a thumbnail. */
  protected readonly thumbnail = computed(() => this.file().objectUrl ?? null);

  /** @ignore Secondary line: error message, else size (+ status hint). */
  protected readonly infoLabel = computed(() => {
    const f = this.file();
    if (f.status === 'error') return f.error ?? this.failedLabel();
    if (f.status === 'uploading') return `${this.sizeLabel()} · ${Math.round(f.progress)} %`;
    return this.sizeLabel();
  });

  /** @ignore */
  protected readonly iconSize = computed<UiIconSize>(() => (this.size() === 'small' ? 'sm' : 'md'));

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-file-upload-list'];
    if (this.size() !== 'default') c.push(`_${this.size()}`);
    if (this.isError()) c.push('_error');
    if (this.thumbnail()) c.push('_has-thumb');
    return c.join(' ');
  });

  /** @ignore */
  protected onRemove(): void {
    this.remove.emit(this.file());
  }
}
