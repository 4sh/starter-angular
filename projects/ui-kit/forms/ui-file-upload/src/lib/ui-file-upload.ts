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
  untracked,
  viewChild,
} from '@angular/core';
import { NgTemplateOutlet } from '@angular/common';
import { UiIcon } from '@4sh/ui-kit/base/ui-icon';
import { UiButton } from '@4sh/ui-kit/actions/ui-button';
import { UiFileUploadList } from './ui-file-upload-list';
import { formatLabel } from '@4sh/ui-kit/forms';
import {
  formatFileSize,
  isFileTypeAccepted,
  isImageFile,
  isLocalUploadFile,
  UiLocalUploadFile,
  UiStoredFile,
  UiUploadErrorEvent,
  UiUploadEvent,
  UiUploadFile,
  UiUploadHandlerEvent,
} from './ui-file-upload.model';

export type UiFileUploadMode = 'field' | 'drag';
export type UiFileUploadSize = 'default' | 'small';

let nextUploadId = 0;
let nextInstanceId = 0;

function toStoredUploadFile(stored: UiStoredFile): UiUploadFile {
  return {
    id: stored.id,
    name: stored.name,
    size: stored.size,
    type: stored.type ?? '',
    status: 'completed',
    progress: 100,
  };
}

function sameStoredFiles(a: readonly UiStoredFile[], b: readonly UiStoredFile[]): boolean {
  return (
    a.length === b.length &&
    a.every(
      (f, i) =>
        f.id === b[i].id && f.name === b[i].name && f.size === b[i].size && f.type === b[i].type,
    )
  );
}

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
 * Files already stored server-side (`initialFiles`) are listed with the new ones, without a
 * browser `File`; `add()` feeds files obtained outside the picker (e.g. a camera capture)
 * through the same validation and upload as a selection.
 *
 * Security notes: client-side validation is a UX convenience — always re-validate
 * server-side. Image previews use object URLs that are revoked on removal/clear.
 */
@Component({
  selector: 'ui-file-upload',
  imports: [NgTemplateOutlet, UiIcon, UiButton, UiFileUploadList],
  templateUrl: './ui-file-upload.html',
  styleUrl: './ui-file-upload.scss',
})
export class UiFileUpload {
  // --- Layout ----------------------------------------------------------
  /** `field` = compact input + Browse button; `drag` = full drop zone. */
  mode = input<UiFileUploadMode>('field');
  /** Size of the control, its buttons and its file list. */
  size = input<UiFileUploadSize>('default');

  // --- Selection -------------------------------------------------------
  /** Native `name`: a surrounding `<form>` submits the current selection under it. */
  name = input<string>();
  /** Allow selecting more than one file. */
  multiple = input(false, { transform: booleanAttribute });
  /** Ripple Effect */
  ripple = input(true, { transform: booleanAttribute });
  /** Native `accept` filter, e.g. "image/*,.pdf". Also enforced on drop. */
  accept = input<string>();
  /** Max size per file, in bytes. */
  maxFileSize = input<number, unknown>(undefined, { transform: numberAttribute });
  /** Max size of the whole selection, stored files included, in bytes. */
  maxTotalSize = input<number, unknown>(undefined, { transform: numberAttribute });
  /** Max number of files kept at once. */
  fileLimit = input<number, unknown>(undefined, { transform: numberAttribute });
  /** Disables selection, drop and upload. */
  disabled = input(false, { transform: booleanAttribute });
  /**
   * Files already stored server-side, listed with the new ones (status `completed`, no `File`).
   * Setting it resets the selection to these files, without emitting `filesChange`; files picked
   * in the browser and not uploaded yet (pending, uploading, failed) are kept.
   */
  initialFiles = input<UiStoredFile[]>([]);

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
  /** Show the file count and total size under the list. */
  showTotal = input(false, { transform: booleanAttribute });
  /** Makes each file name a button emitting `fileOpen` (e.g. to preview the file). */
  openable = input(false, { transform: booleanAttribute });
  /** Label of the Browse button. */
  browseLabel = input<string>('Parcourir');
  /** Placeholder shown in field mode before any selection. */
  chooseLabel = input<string>('Choisir un fichier…');
  /** Label of the Upload toolbar button (drag mode). */
  uploadLabel = input<string>('Téléverser');
  /** Label of the toolbar button that clears the selection (drag mode). */
  cancelLabel = input<string>('Effacer');
  /** Drag-zone link + prompt. */
  dragLinkLabel = input<string>('Cliquer pour téléverser');
  /** Text after the drag-zone link (drag mode). */
  dragPromptLabel = input<string>('ou glisser-déposer les fichiers ici');
  /** Small hint under the drag prompt (e.g. "JPG, PNG (max 5 MB)"). */
  hint = input<string>();
  /** Accessible name for the whole control. */
  // Composite widget (dropzone + file list), not a single-value CVA control: unlike the other
  // form components it doesn't extend BaseFieldControl, so it redeclares its own `ariaLabel`
  // here — with a non-undefined default, since the dropzone always needs an accessible name.
  ariaLabel = input<string>('Téléversement de fichiers');
  /** Multi-file summary in field mode — `{0}` is replaced by the file count. */
  filesSummaryLabel = input<string>('{0} fichiers');
  /** Rejection message: file type not accepted — `{0}` is the file name. */
  invalidTypeMessage = input<string>('Type de fichier non autorisé : {0}');
  /** Rejection message: file too large — `{0}` is the file name. */
  invalidSizeMessage = input<string>('Fichier trop volumineux : {0}');
  /** Total under the list (`showTotal`) — `{0}` is the file count, `{1}` the total size. */
  totalLabel = input<string>('{0} fichiers · {1}');
  /** Rejection message: `maxTotalSize` exceeded — `{0}` is the file name, `{1}` the limit. */
  totalSizeExceededMessage = input<string>('Taille totale dépassée ({1} max) : {0}');
  /** Rejection message: `fileLimit` reached — `{0}` is the limit. */
  limitReachedMessage = input<string>('Nombre maximum de fichiers atteint ({0}).');
  /** Error shown when an upload fails without a server message. */
  uploadErrorMessage = input<string>('Échec du téléversement');
  /** Error shown when the upload request fails at the network level. */
  networkErrorMessage = input<string>('Erreur réseau');
  /** Error shown on a non-2xx response — `{0}` is the HTTP status. */
  httpErrorMessage = input<string>('Erreur {0}');

  // --- Templates (drag/advanced) --------------------------------------
  /** Overrides a single file row (context: `{ $implicit: UiUploadFile, remove, open }`). */
  fileTemplate = input<TemplateRef<unknown>>();
  /** Extra actions on a default file row, next to its remove button (context: `{ $implicit: UiUploadFile, remove, open }`). */
  fileActionsTemplate = input<TemplateRef<unknown>>();
  /** Overrides the content section (context: `{ $implicit: UiUploadFile[], remove, clear }`). */
  contentTemplate = input<TemplateRef<unknown>>();
  /** Custom toolbar content (context: `{ $implicit: UiUploadFile[], choose, upload, clear }`). */
  toolbarTemplate = input<TemplateRef<unknown>>();

  // --- Outputs ---------------------------------------------------------
  /** Files added to the selection (validated). */
  selected = output<UiLocalUploadFile[]>();
  /** The full current selection changed. */
  filesChange = output<UiUploadFile[]>();
  /** A custom upload was requested (customUpload = true). */
  uploadHandler = output<UiUploadHandlerEvent>();
  /** Built-in upload completed for a batch. */
  uploaded = output<UiUploadEvent>();
  /** A file failed validation or upload. */
  uploadError = output<UiUploadErrorEvent>();
  /** A file was removed. */
  removed = output<UiUploadFile>();
  /** The selection was cleared. */
  cleared = output<void>();
  /** A file name was activated (`openable`). */
  fileOpen = output<UiUploadFile>();

  /** @ignore Stable id linking the visible label(s) to the native input. */
  protected readonly inputId = `ui-file-upload-${nextInstanceId++}`;

  private readonly host = inject(ElementRef<HTMLElement>);
  private readonly destroyRef = inject(DestroyRef);
  private readonly fileInput = viewChild.required<ElementRef<HTMLInputElement>>('fileInput');
  private readonly formValueInput = viewChild<ElementRef<HTMLInputElement>>('formValue');

  /** In-flight requests, keyed by file id, so we can abort. */
  private readonly requests = new Map<string, XMLHttpRequest>();

  /** @ignore Current selection. */
  private readonly selection = signal<UiUploadFile[]>([]);
  /** Read-only view of the current files. */
  readonly files = this.selection.asReadonly();

  /** @ignore `initialFiles` compared by content, so a list rebuilt on every check (same files)
   *  does not wipe the files the user has just added. */
  private readonly storedFiles = computed(() => this.initialFiles() ?? [], {
    equal: sameStoredFiles,
  });

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

    // The picker is emptied after each choice: the hidden field carries the selection. A stored
    // file has no `File` to submit: the server already has it.
    effect(() => {
      const el = this.formValueInput()?.nativeElement;
      const files = this.selection();
      if (!el || typeof DataTransfer === 'undefined') return;
      const data = new DataTransfer();
      for (const f of files) if (isLocalUploadFile(f)) data.items.add(f.file);
      el.files = data.files;
    });

    // `initialFiles` is the server state: (re)setting it resets the selection to it. No output,
    // like a form's `writeValue`: the consumer already knows these files. An unfinished local file
    // is not part of that state yet, so it stays (its upload may already be under way).
    effect(() => {
      const stored = this.storedFiles().map(toStoredUploadFile);
      untracked(() => this.reset(stored));
    });

    // A11y safeguard: the control needs an accessible name.
    if (isDevMode()) {
      effect(() => {
        if (!this.ariaLabel()) {
          console.warn('[ui-file-upload] Provide `ariaLabel` to name the control.');
        }
      });
    }
  }

  /** @ignore */
  protected readonly hasFiles = computed(() => this.selection().length > 0);
  /** @ignore Files picked in the browser: what the toolbar's clear acts on. */
  protected readonly hasLocalFiles = computed(() => this.selection().some(isLocalUploadFile));
  /** @ignore */
  protected readonly pending = computed(() =>
    this.selection().filter(
      (f): f is UiLocalUploadFile => f.status === 'pending' && isLocalUploadFile(f),
    ),
  );
  /** @ignore File count and total size under the list (`showTotal`). */
  protected readonly totalSummary = computed(() => {
    const files = this.selection();
    return formatLabel(this.totalLabel(), files.length, formatFileSize(totalSize(files)));
  });
  /** @ignore Single-file summary shown in field mode. */
  protected readonly fieldSummary = computed(() => {
    const files = this.selection();
    if (!files.length) return this.chooseLabel();
    if (files.length === 1) return files[0].name;
    return formatLabel(this.filesSummaryLabel(), files.length);
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
  /** @ignore */ protected readonly openFn = (f: UiUploadFile): void => this.fileOpen.emit(f);

  // --- Public API ------------------------------------------------------

  /** Opens the native file picker. */
  choose(): void {
    if (this.disabled()) return;
    this.fileInput().nativeElement.click();
  }

  /**
   * Adds files obtained outside the picker (e.g. a camera capture) exactly like a selection or a
   * drop: validation and its messages, selection, then upload when `auto`.
   */
  add(files: FileList | readonly File[]): void {
    this.ingest(files);
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
    this.removed.emit(target);
    this.filesChange.emit(this.selection());
  }

  /**
   * Clears the files picked in the browser. Stored files (`initialFiles`) stay: removing one is a
   * server deletion, done one at a time (`removed`).
   */
  clear(): void {
    for (const xhr of this.requests.values()) xhr.abort();
    this.requests.clear();
    for (const f of this.selection()) this.revoke(f);
    this.selection.update((files) => files.filter((f) => !isLocalUploadFile(f)));
    this.messages.set([]);
    this.resetInput();
    this.cleared.emit();
    this.filesChange.emit(this.selection());
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

  /** Validate + add files to the selection. */
  private ingest(list: FileList | readonly File[] | null): void {
    if (!list || !list.length || this.disabled()) return;

    const incoming = Array.from(list);
    const added: UiLocalUploadFile[] = [];
    const newMessages: string[] = [];
    const limit = this.fileLimit();
    const maxSize = this.maxFileSize();
    const maxTotal = this.maxTotalSize();
    // Single-file mode replaces the current file: only the incoming one counts. A failed upload
    // is not stored anywhere, so it takes no room.
    const keptSize = this.multiple()
      ? totalSize(this.selection().filter((f) => f.status !== 'error'))
      : 0;

    for (const file of incoming) {
      // Single-file mode: the new file replaces the current one, so only cap the incoming batch.
      if (!this.multiple() && added.length >= 1) break;

      const item = this.toUploadFile(file);

      if (!isFileTypeAccepted(file, this.accept())) {
        this.fail(item, 'type', formatLabel(this.invalidTypeMessage(), file.name), newMessages);
        continue;
      }
      if (maxSize != null && file.size > maxSize) {
        this.fail(item, 'size', formatLabel(this.invalidSizeMessage(), file.name), newMessages);
        continue;
      }
      if (maxTotal != null && keptSize + totalSize(added) + file.size > maxTotal) {
        const message = formatLabel(
          this.totalSizeExceededMessage(),
          file.name,
          formatFileSize(maxTotal),
        );
        this.fail(item, 'total-size', message, newMessages);
        continue;
      }
      if (
        limit != null &&
        (this.multiple() ? this.selection().length : 0) + added.length >= limit
      ) {
        this.fail(item, 'limit', formatLabel(this.limitReachedMessage(), limit), newMessages);
        continue;
      }
      added.push(item);
    }

    this.messages.set(newMessages);
    if (!added.length) return;

    // Single-file mode: the new file replaces the previous one, which is removed like any other
    // (a stored one must be deleted server-side).
    const replaced = this.multiple() ? [] : this.selection();
    for (const previous of replaced) {
      this.requests.get(previous.id)?.abort();
      this.requests.delete(previous.id);
      this.revoke(previous);
    }
    this.selection.update((files) => (this.multiple() ? [...files, ...added] : added));
    for (const previous of replaced) this.removed.emit(previous);
    this.selected.emit(added);
    this.filesChange.emit(this.selection());

    if (this.auto()) this.upload();
  }

  /** Resets the selection to the stored files, keeping the unfinished local ones, without outputs. */
  private reset(stored: UiUploadFile[]): void {
    const unfinished = (f: UiUploadFile) => isLocalUploadFile(f) && f.status !== 'completed';
    const kept = this.selection().filter(unfinished);
    for (const f of this.selection()) if (!unfinished(f)) this.revoke(f);
    // Single-file mode: a file the user just picked wins over the stored one.
    this.selection.set(this.multiple() || !kept.length ? [...stored, ...kept] : kept);
    this.messages.set([]);
  }

  private toUploadFile(file: File): UiLocalUploadFile {
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

  private fail(
    item: UiUploadFile,
    reason: UiUploadErrorEvent['reason'],
    message: string,
    sink: string[],
  ): void {
    this.revoke(item);
    sink.push(message);
    this.uploadError.emit({ file: { ...item, status: 'error', error: message }, reason, message });
  }

  /** Mutates one file in place (immutably) and pushes a new array reference. */
  private patch(id: string, changes: Partial<UiUploadFile>): void {
    this.selection.update((files) => files.map((f) => (f.id === id ? { ...f, ...changes } : f)));
  }

  private emitCustomUpload(pending: UiLocalUploadFile[]): void {
    for (const f of pending) this.patch(f.id, { status: 'uploading', progress: 0 });
    this.uploadHandler.emit({
      files: pending,
      setProgress: (file, progress) =>
        this.patch(file.id, {
          status: 'uploading',
          progress: Math.max(0, Math.min(100, progress)),
        }),
      markUploaded: (file) => {
        this.patch(file.id, { status: 'completed', progress: 100 });
        this.filesChange.emit(this.selection());
      },
      markError: (file, msg) => {
        this.patch(file.id, { status: 'error', error: msg ?? this.uploadErrorMessage() });
        this.uploadError.emit({
          file,
          reason: 'upload',
          message: msg ?? this.uploadErrorMessage(),
        });
      },
    });
  }

  private xhrUpload(item: UiLocalUploadFile, endpoint: string): void {
    const xhr = new XMLHttpRequest();
    this.requests.set(item.id, xhr);
    this.patch(item.id, { status: 'uploading', progress: 0 });

    const body = new FormData();
    body.append(this.fieldName(), item.file, item.name);

    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable)
        this.patch(item.id, { progress: Math.round((e.loaded / e.total) * 100) });
    });
    xhr.addEventListener('load', () => {
      this.requests.delete(item.id);
      if (xhr.status >= 200 && xhr.status < 300) {
        this.patch(item.id, { status: 'completed', progress: 100 });
        this.uploaded.emit({ files: [item], xhr });
        this.filesChange.emit(this.selection());
      } else {
        this.uploadFailed(item, formatLabel(this.httpErrorMessage(), xhr.status));
      }
    });
    xhr.addEventListener('error', () => this.uploadFailed(item, this.networkErrorMessage()));
    xhr.addEventListener('abort', () => this.requests.delete(item.id));

    xhr.open(this.method().toUpperCase(), endpoint, true);
    xhr.withCredentials = this.withCredentials();
    xhr.send(body);
  }

  private uploadFailed(item: UiUploadFile, message: string): void {
    this.requests.delete(item.id);
    this.patch(item.id, { status: 'error', error: message });
    this.uploadError.emit({ file: item, reason: 'upload', message });
  }

  private revoke(file: UiUploadFile): void {
    if (file.objectUrl) URL.revokeObjectURL(file.objectUrl);
  }

  private resetInput(): void {
    const el = this.fileInput().nativeElement;
    if (el) el.value = '';
  }
}

function totalSize(files: readonly UiUploadFile[]): number {
  return files.reduce((sum, f) => sum + f.size, 0);
}
