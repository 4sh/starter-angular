// =====================================================================
// Shared model for ui-file-upload and its file-row (ui-file-upload-list).
// =====================================================================

/** Lifecycle of a selected file. */
export type UiUploadStatus = 'pending' | 'uploading' | 'completed' | 'error';

/** A file selected in the uploader, plus its upload/validation state. */
export interface UiUploadFile {
  /** Stable id for tracking (kept across re-renders). */
  readonly id: string;
  /** The underlying browser File. */
  readonly file: File;
  /** File name (from the File, exposed for template convenience). */
  readonly name: string;
  /** Size in bytes. */
  readonly size: number;
  /** MIME type reported by the browser. */
  readonly type: string;
  /** Current lifecycle state. */
  status: UiUploadStatus;
  /** Upload progress, 0–100 (meaningful while `status === 'uploading'`). */
  progress: number;
  /** Object URL for image previews — MUST be revoked when the file is removed. */
  objectUrl?: string;
  /** Validation or upload error message, when `status === 'error'`. */
  error?: string;
}

/** Payload for the custom upload handler (customUpload = true). */
export interface UiUploadHandlerEvent {
  /** Files awaiting upload (status `pending`). */
  files: UiUploadFile[];
  /** Marks a file as uploaded (sets status `completed`, progress 100). */
  markUploaded: (file: UiUploadFile) => void;
  /** Marks a file as failed with an optional message. */
  markError: (file: UiUploadFile, message?: string) => void;
  /** Updates a file's progress (0–100). */
  setProgress: (file: UiUploadFile, progress: number) => void;
}

/** Emitted when files finish uploading (built-in uploader). */
export interface UiUploadEvent {
  files: UiUploadFile[];
  /** Raw XHR of the last request (built-in uploader only). */
  xhr?: XMLHttpRequest;
}

/** Emitted on a validation or upload error. */
export interface UiUploadErrorEvent {
  file: UiUploadFile;
  /** 'type' | 'size' | 'limit' | 'upload'. */
  reason: 'type' | 'size' | 'limit' | 'upload';
  message: string;
}

/** Human-readable file size (e.g. "2.5 MB"). Base-1024. */
export function formatFileSize(bytes: number): string {
  if (!bytes || bytes < 0) return '0 B';
  const k = 1024;
  const units = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.min(Math.floor(Math.log(bytes) / Math.log(k)), units.length - 1);
  const value = bytes / Math.pow(k, i);
  const rounded = Math.round(value * 10) / 10;
  return `${rounded} ${units[i]}`;
}

/**
 * Whether a File matches an `accept` string (e.g. "image/*,.pdf").
 * Empty/absent accept means everything is allowed.
 */
export function isFileTypeAccepted(file: File, accept: string | undefined): boolean {
  if (!accept) return true;
  const patterns = accept
    .split(',')
    .map((t) => t.trim().toLowerCase())
    .filter(Boolean);
  if (!patterns.length) return true;

  const name = file.name.toLowerCase();
  const mime = (file.type || '').toLowerCase();

  return patterns.some((pattern) => {
    if (pattern.startsWith('.')) return name.endsWith(pattern); // extension
    if (pattern.endsWith('/*')) return mime.startsWith(pattern.slice(0, -1)); // "image/"
    return mime === pattern; // exact mime
  });
}

/** Whether a File is a previewable image. */
export function isImageFile(file: File): boolean {
  return /^image\//.test(file.type);
}
