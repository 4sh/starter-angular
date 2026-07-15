import {
  booleanAttribute,
  Component,
  computed,
  DestroyRef,
  effect,
  ElementRef,
  inject,
  input,
  isDevMode,
  numberAttribute,
  output,
  signal,
  TemplateRef,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { UiIcon } from '@app/shared/components/ui/ui-icon/ui-icon';
import { UiButton } from '@app/shared/components/ui/actions/ui-button/ui-button';
import { UiLink } from '@app/shared/components/ui/actions/ui-link/ui-link';
import { UiFileUploadList } from '@app/shared/components/ui/forms/ui-file-upload-list/ui-file-upload-list';
import {
  isFileTypeAccepted,
  isImageFile,
  UiUploadErrorEvent,
  UiUploadEvent,
  UiUploadFile,
  UiUploadHandlerEvent,
  UiUploadStatus,
} from '@app/shared/components/ui/forms/ui-file-upload/ui-file-upload.model';

export type UiFileUploadMode = 'field' | 'drag';
export type UiFileUploadSize = 'default' | 'small';

let nextUploadId = 0;
let nextInstanceId = 0;

/**
 * ui-file-upload — headless file uploader (field + drag-and-drop).
 *
 * A native `<input type="file">` (visually hidden) drives selection, so the OS
 * picker, keyboard and screen readers work natively; the whole component is also
 * a drop target. Selection is validated client-side (type / size / count) and
 * files can be uploaded automatically (`auto`), on demand, or via a custom
 * handler (`customUpload`). Progress is tracked with `XMLHttpRequest` so no
 * global HTTP provider is required.
 *
 * Security notes: client-side validation is a UX convenience — always re-validate
 * server-side. Image previews use object URLs that are revoked on removal/clear.
 */
@Component({
  selector: 'ui-file-upload',
  imports: [NgTemplateOutlet, UiIcon, UiButton, UiLink, UiFileUploadList],
  templateUrl: './ui-file-upload.html',
  styleUrl: './ui-file-upload.scss',
})
export class UiFileUpload {
  // --- Layout ----------------------------------------------------------
  /** `field` = compact input + Browse button; `drag` = full drop zone. */
  mode = input<UiFileUploadMode>('field');
  size = input<UiFileUploadSize>('default');

  // --- Selection -------------------------------------------------------
  /** Native input `name` (submitted with a surrounding form). */
  name = input<string>();
  /** Allow selecting more than one file. */
  multiple = input(false, { transform: booleanAttribute });
  /** Native `accept` filter, e.g. "image/*,.pdf". Also enforced on drop. */
  accept = input<string>();
  /** Max size per file, in bytes. */
  maxFileSize = input<number, unknown>(undefined, { transform: numberAttribute });
  /** Max number of files kept at once. */
  fileLimit = input<number, unknown>(undefined, { transform: numberAttribute });
  disabled = input(false, { transform: booleanAttribute });

  // --- Upload behaviour ------------------------------------------------
  /** Upload each file as soon as it is selected. */
  auto = input(false, { transform: booleanAttribute });
  /** Delegate uploading to the `uploadHandler` output instead of the built-in XHR. */
  customUpload = input(false, { transform: booleanAttribute });
  /** Endpoint for the built-in uploader. */
  url = input<string>();
  /** HTTP method for the built-in uploader. */
  method = input<'post' | 'put'>('post');
  /** Field name used for each file in the multipart body. */
  fieldName = input<string>('files');
  /** Send credentials (cookies) with the built-in upload request. */
  withCredentials = input(false, { transform: booleanAttribute });

  // --- Presentation / labels ------------------------------------------
  /** Show the file list under the control. */
  showFileList = input(true, { transform: booleanAttribute });
  /** Show the Upload/Cancel toolbar buttons (drag mode). */
  showControls = input(true, { transform: booleanAttribute });
  browseLabel = input<string>('Browse');
  /** Placeholder shown in field mode before any selection. */
  chooseLabel = input<string>('Choose file...');
  uploadLabel = input<string>('Upload');
  cancelLabel = input<string>('Clear');
  /** Drag-zone link + prompt. */
  dragLinkLabel = input<string>('Click to upload');
  dragPromptLabel = input<string>('or drag and drop files here');
  /** Small hint under the drag prompt (e.g. "JPG, PNG (max 5 MB)"). */
  hint = input<string>();
  /** Accessible name for the whole control. */
  ariaLabel = input<string>('File upload');

  // --- Templates (drag/advanced) --------------------------------------
  /** Overrides a single file row (context: `{ $implicit: UiUploadFile, remove }`). */
  fileTemplate = input<TemplateRef<unknown>>();
  /** Overrides the content section (context: `{ $implicit: UiUploadFile[], remove, clear }`). */
  contentTemplate = input<TemplateRef<unknown>>();
  /** Custom toolbar content (context: `{ $implicit: UiUploadFile[], choose, upload, clear }`). */
  toolbarTemplate = input<TemplateRef<unknown>>();

  // --- Outputs ---------------------------------------------------------
  /** Files added to the selection (validated). */
  onSelect = output<UiUploadFile[]>();
  /** The full current selection changed. */
  filesChange = output<UiUploadFile[]>();
  /** A custom upload was requested (customUpload = true). */
  uploadHandler = output<UiUploadHandlerEvent>();
  /** Built-in upload completed for a batch. */
  onUpload = output<UiUploadEvent>();
  /** A file failed validation or upload. */
  onError = output<UiUploadErrorEvent>();
  /** A file was removed. */
  onRemove = output<UiUploadFile>();
  /** The selection was cleared. */
  onClear = output<void>();

  /** @ignore Stable id linking the visible label(s) to the native input. */
  protected readonly inputId = `ui-file-upload-${nextInstanceId++}`;

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');

  /** In-flight requests, keyed by file id, so we can abort. */
  private readonly requests = new Map<string, XMLHttpRequest>();

  /** @ignore Current selection. */
  private readonly selection = signal<UiUploadFile[]>([]);
  /** Read-only view of the current files. */
  readonly files = this.selection.asReadonly();

  /** @ignore Drop-zone highlight while dragging over. */
  protected readonly dragging = signal(false);
  /** @ignore Transient validation messages (rendered in a live region). */
  protected readonly messages = signal<string[]>([]);

  constructor() {
    // Revoke every object URL when the component is destroyed (no leaks).
    this.destroyRef.onDestroy(() => {
      for (const f of this.selection()) this.revoke(f);
      for (const xhr of this.requests.values()) xhr.abort();
    });

    // A11y safeguard: the control needs an accessible name.
    if (isDevMode()) {
      effect(() => {
        if (!this.ariaLabel()) {
          console.warn('[ui-file-upload] Renseignez `ariaLabel` pour nommer le contrôle.');
        }
      });
    }
  }

  /** @ignore */
  protected readonly hasFiles = computed(() => this.selection().length > 0);
  /** @ignore */
  protected readonly pending = computed(() => this.selection().filter((f) => f.status === 'pending'));
  /** @ignore Single-file summary shown in field mode. */
  protected readonly fieldSummary = computed(() => {
    const files = this.selection();
    if (!files.length) return this.chooseLabel();
    if (files.length === 1) return files[0].name;
    return `${files.length} fichiers`;
  });
  /** @ignore */
  protected readonly canUpload = computed(
    () => !this.disabled() && this.pending().length > 0 && (this.customUpload() || !!this.url()),
  );

  /** @ignore */
  protected readonly classes = computed(() => {
    const c = ['ui-file-upload', `_${this.mode()}`];
    if (this.size() !== 'default') c.push(`_${this.size()}`);
    if (this.dragging()) c.push('_dragging');
    if (this.disabled()) c.push('_disabled');
    return c.join(' ');
  });

  // --- Bound refs for custom templates (stable identities) -------------
  /** @ignore */ protected readonly removeFn = (f: UiUploadFile): void => this.remove(f);
  /** @ignore */ protected readonly clearFn = (): void => this.clear();
  /** @ignore */ protected readonly chooseFn = (): void => this.choose();
  /** @ignore */ protected readonly uploadFn = (): void => this.upload();

  // --- Public API ------------------------------------------------------

  /** Opens the native file picker. */
  choose(): void {
    if (this.disabled()) return;
    this.fileInput().nativeElement.click();
  }

  /** Uploads all pending files (built-in XHR, or emits `uploadHandler`). */
  upload(): void {
    const pending = this.pending();
    if (!pending.length) return;

    if (this.customUpload()) {
      this.emitCustomUpload(pending);
      return;
    }
    const endpoint = this.url();
    if (!endpoint) return;
    for (const f of pending) this.xhrUpload(f, endpoint);
  }

  /** Removes a file (aborts its upload, revokes its preview). */
  remove(target: UiUploadFile): void {
    this.requests.get(target.id)?.abort();
    this.requests.delete(target.id);
    this.revoke(target);
    this.selection.update((files) => files.filter((f) => f.id !== target.id));
    this.onRemove.emit(target);
    this.filesChange.emit(this.selection());
  }

  /** Clears the whole selection. */
  clear(): void {
    for (const xhr of this.requests.values()) xhr.abort();
    this.requests.clear();
    for (const f of this.selection()) this.revoke(f);
    this.selection.set([]);
    this.messages.set([]);
    this.resetInput();
    this.onClear.emit();
    this.filesChange.emit([]);
  }

  // --- Native input / drop --------------------------------------------

  /** @ignore */
  protected onInputChange(event: Event): void {
    const input = event.target as HTMLInputElement;
    this.ingest(input.files);
    // Reset so selecting the same file again re-triggers `change`.
    this.resetInput();
  }

  /** @ignore */
  protected onDragOver(event: DragEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    event.stopPropagation();
    this.dragging.set(true);
  }

  /** @ignore */
  protected onDragLeave(event: DragEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    // Ignore leave events bubbling from children still inside the zone.
    if (this.host.nativeElement.contains(event.relatedTarget as Node)) return;
    this.dragging.set(false);
  }

  /** @ignore */
  protected onDrop(event: DragEvent): void {
    if (this.disabled()) return;
    event.preventDefault();
    event.stopPropagation();
    this.dragging.set(false);
    this.ingest(event.dataTransfer?.files ?? null);
  }

  // --- Internals -------------------------------------------------------

  /** Validate + add a FileList to the selection. */
  private ingest(list: FileList | null): void {
    if (!list || !list.length || this.disabled()) return;

    const incoming = Array.from(list);
    const added: UiUploadFile[] = [];
    const newMessages: string[] = [];
    const limit = this.fileLimit();
    const maxSize = this.maxFileSize();

    for (const file of incoming) {
      // Enforce single-file selection when `multiple` is off.
      if (!this.multiple() && (this.selection().length + added.length) >= 1) break;

      const item = this.toUploadFile(file);

      if (!isFileTypeAccepted(file, this.accept())) {
        this.fail(item, 'type', `Type de fichier non autorisé : ${file.name}`, newMessages);
        continue;
      }
      if (maxSize != null && file.size > maxSize) {
        this.fail(item, 'size', `Fichier trop volumineux : ${file.name}`, newMessages);
        continue;
      }
      if (limit != null && this.selection().length + added.length >= limit) {
        this.fail(item, 'limit', `Nombre maximum de fichiers atteint (${limit}).`, newMessages);
        continue;
      }
      added.push(item);
    }

    this.messages.set(newMessages);
    if (!added.length) return;

    this.selection.update((files) => (this.multiple() ? [...files, ...added] : added));
    this.onSelect.emit(added);
    this.filesChange.emit(this.selection());

    if (this.auto()) this.upload();
  }

  private toUploadFile(file: File): UiUploadFile {
    return {
      id: `uifu-${nextUploadId++}`,
      file,
      name: file.name,
      size: file.size,
      type: file.type,
      status: 'pending',
      progress: 0,
      objectUrl: isImageFile(file) ? URL.createObjectURL(file) : undefined,
    };
  }

  private fail(item: UiUploadFile, reason: UiUploadErrorEvent['reason'], message: string, sink: string[]): void {
    this.revoke(item);
    sink.push(message);
    this.onError.emit({ file: { ...item, status: 'error', error: message }, reason, message });
  }

  /** Mutates one file in place (immutably) and pushes a new array reference. */
  private patch(id: string, changes: Partial<UiUploadFile>): void {
    this.selection.update((files) => files.map((f) => (f.id === id ? { ...f, ...changes } : f)));
  }

  private emitCustomUpload(pending: UiUploadFile[]): void {
    for (const f of pending) this.patch(f.id, { status: 'uploading', progress: 0 });
    this.uploadHandler.emit({
      files: pending,
      setProgress: (file, progress) =>
        this.patch(file.id, { status: 'uploading', progress: Math.max(0, Math.min(100, progress)) }),
      markUploaded: (file) => {
        this.patch(file.id, { status: 'completed', progress: 100 });
        this.filesChange.emit(this.selection());
      },
      markError: (file, msg) => {
        this.patch(file.id, { status: 'error', error: msg ?? 'Échec du téléversement' });
        this.onError.emit({
          file,
          reason: 'upload',
          message: msg ?? 'Échec du téléversement',
        });
      },
    });
  }

  private xhrUpload(item: UiUploadFile, endpoint: string): void {
    const xhr = new XMLHttpRequest();
    this.requests.set(item.id, xhr);
    this.patch(item.id, { status: 'uploading', progress: 0 });

    const body = new FormData();
    body.append(this.fieldName(), item.file, item.name);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) this.patch(item.id, { progress: Math.round((e.loaded / e.total) * 100) });
    });
    xhr.addEventListener('load', () => {
      this.requests.delete(item.id);
      if (xhr.status >= 200 && xhr.status < 300) {
        this.patch(item.id, { status: 'completed', progress: 100 });
        this.onUpload.emit({ files: [item], xhr });
        this.filesChange.emit(this.selection());
      } else {
        this.uploadFailed(item, `Erreur ${xhr.status}`);
      }
    });
    xhr.addEventListener('error', () => this.uploadFailed(item, 'Erreur réseau'));
    xhr.addEventListener('abort', () => this.requests.delete(item.id));

    xhr.open(this.method().toUpperCase(), endpoint, true);
    xhr.withCredentials = this.withCredentials();
    xhr.send(body);
  }

  private uploadFailed(item: UiUploadFile, message: string): void {
    this.requests.delete(item.id);
    this.patch(item.id, { status: 'error', error: message });
    this.onError.emit({ file: item, reason: 'upload', message });
  }

  private revoke(file: UiUploadFile): void {
    if (file.objectUrl) URL.revokeObjectURL(file.objectUrl);
  }

  private resetInput(): void {
    const el = this.fileInput().nativeElement;
    if (el) el.value = '';
  }
}
