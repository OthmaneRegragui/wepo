import { baseNameOf, extensionFor, mimeTypeFor } from './format';
import type { DocumentFormat } from './types';

export function sanitizeFileName(name: string): string {
  const base = name
    .split(/[\\/]/)
    .pop()!
    .replace(/[\u0000-\u001f\u007f<>:"/\\|?*]/g, '-')
    .replace(/\s+/g, ' ')
    .replace(/^\.+/, '')
    .trim();
  return base.length > 0 ? base.slice(0, 180) : 'document';
}

export interface OutputNameOptions {
  suffix?: string;
  fallbackBase?: string;
}

/** Produces a new file name; never returns the original name unchanged. */
export function buildOutputName(originalName: string, format: DocumentFormat, options: OutputNameOptions = {}): string {
  const safe = sanitizeFileName(originalName || `document.${extensionFor(format)}`);
  const base = baseNameOf(safe) || options.fallbackBase || 'document';
  const suffix = options.suffix ?? 'edited';
  const ext = extensionFor(format);
  const lower = base.toLowerCase();
  const alreadySuffixed = suffix.length > 0 && lower.endsWith(`-${suffix.toLowerCase()}`);
  return sanitizeFileName(`${base}${alreadySuffixed ? '' : `-${suffix}`}.${ext}`);
}

export type SaveOutcome = 'saved' | 'downloaded' | 'cancelled';

interface FilePickerType {
  description: string;
  accept: Record<string, string[]>;
}

interface SaveFilePickerOptions {
  suggestedName?: string;
  types?: FilePickerType[];
  excludeAcceptAllOption?: boolean;
}

type SaveFilePicker = (options?: SaveFilePickerOptions) => Promise<{
  createWritable: () => Promise<{ write: (data: Blob) => Promise<void>; close: () => Promise<void> }>;
}>;

function getSaveFilePicker(): SaveFilePicker | null {
  const picker = (globalThis as unknown as { showSaveFilePicker?: SaveFilePicker }).showSaveFilePicker;
  return typeof picker === 'function' ? picker : null;
}

export function canUseFileSystemAccess(): boolean {
  return getSaveFilePicker() !== null;
}

export interface SaveBytesOptions {
  preferFileSystemAccess?: boolean;
}

/**
 * Save bytes to a user-chosen location. File System Access is used only after a
 * user gesture; otherwise the browser downloads a new copy. The original file
 * is never overwritten implicitly.
 */
export async function saveBytesAs(
  bytes: Uint8Array,
  fileName: string,
  format: DocumentFormat,
  options: SaveBytesOptions = {},
): Promise<SaveOutcome> {
  const safeName = sanitizeFileName(fileName);
  const blob = new Blob([bytes as BlobPart], { type: mimeTypeFor(format) });
  const picker = options.preferFileSystemAccess !== false ? getSaveFilePicker() : null;
  if (picker) {
    try {
      const handle = await picker({
        suggestedName: safeName,
        types: [
          {
            description: `${format.toUpperCase()} document`,
            accept: { [mimeTypeFor(format)]: [`.${extensionFor(format)}`] },
          },
        ],
      });
      const writable = await handle.createWritable();
      await writable.write(blob);
      await writable.close();
      return 'saved';
    } catch (error) {
      if (isAbortError(error)) return 'cancelled';
      // Fall through to a normal download when the picker is unavailable or fails.
    }
  }
  downloadBlob(blob, safeName);
  return 'downloaded';
}

export function downloadBlob(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = sanitizeFileName(fileName);
  anchor.rel = 'noopener';
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  // Give the browser time to start the download before releasing the URL.
  setTimeout(() => URL.revokeObjectURL(url), 30_000);
}

function isAbortError(error: unknown): boolean {
  return error instanceof DOMException && error.name === 'AbortError';
}
