import {
  appName,
  describeUnsupported,
  detectFile,
  isOpenableForApp,
  mimeTypeFor,
} from './format';
import {
  DEFAULT_LIMITS,
  FileValidationError,
  type AppKind,
  type FileValidationLimits,
  type LoadedDocument,
} from './types';
import { isZipContainer, auditZip } from './zip-audit';

const SUPPORTED_OPEN_FORMATS = new Set(['docx', 'xlsx', 'csv', 'pptx']);

function suggestedOpenExtension(format: string): string {
  switch (format) {
    case 'doc':
    case 'odt':
    case 'rtf':
    case 'txt':
      return 'DOCX';
    case 'xls':
    case 'ods':
      return 'XLSX';
    case 'ppt':
    case 'odp':
      return 'PPTX';
    default:
      return 'DOCX/XLSX/PPTX';
  }
}

export interface LoadOptions {
  app?: AppKind;
  limits?: FileValidationLimits;
}

/**
 * Read and validate a browser File without uploading it. The returned bytes are
 * the only copy the application keeps; callers should release references after
 * loading them into an editor.
 */
export async function loadLocalFile(file: File, options: LoadOptions = {}): Promise<LoadedDocument> {
  const limits = options.limits ?? DEFAULT_LIMITS;
  if (file.size === 0) {
    throw new FileValidationError('empty-file', 'The selected file is empty.');
  }
  if (file.size > limits.maxBytes) {
    throw new FileValidationError(
      'too-large',
      `This file is ${formatBytes(file.size)}. The local limit is ${formatBytes(limits.maxBytes)}.`,
    );
  }

  let buffer: ArrayBuffer;
  try {
    buffer = await file.arrayBuffer();
  } catch (cause) {
    throw new FileValidationError('read-failed', 'The browser could not read this file.', { cause });
  }
  const bytes = new Uint8Array(buffer);
  const detected = detectFile(file.name, { mimeType: file.type, head: bytes });

  if (detected.kind === null) {
    throw new FileValidationError('unsupported-extension', describeUnsupported(detected, options.app ?? 'word'));
  }
  if (!SUPPORTED_OPEN_FORMATS.has(detected.format)) {
    throw new FileValidationError(
      'unsupported-format',
      `${detected.format.toUpperCase()} files are not supported. Re-save the file as ${suggestedOpenExtension(detected.format)} in your current office app, then open the new copy here.`,
    );
  }
  if (!detected.signatureMatches) {
    throw new FileValidationError(
      'extension-signature-mismatch',
      `The file extension says ${detected.format.toUpperCase()}, but its contents do not match. The file may be corrupt or renamed.`,
    );
  }
  if (detected.zipBased) {
    if (!isZipContainer(bytes)) {
      throw new FileValidationError('invalid-zip', 'The file is not a valid Office ZIP container.');
    }
    auditZip(bytes, limits);
  }
  if (detected.format === 'csv') {
    if (bytes.includes(0)) {
      throw new FileValidationError('wrong-format', 'This file contains binary data and is not a valid CSV.');
    }
    const text = new TextDecoder('utf-8', { fatal: false }).decode(bytes);
    if (text.trim().length === 0) {
      throw new FileValidationError('empty-file', 'The CSV file contains no data.');
    }
  }
  if (options.app && !isOpenableForApp(detected, options.app)) {
    throw new FileValidationError(
      'unsupported-format',
      detected.kind === options.app
        ? `${detected.format.toUpperCase()} files cannot be edited here. Save a copy as ${options.app === 'word' ? 'DOCX' : options.app === 'sheets' ? 'XLSX' : 'PPTX'} and try again.`
        : describeUnsupported(detected, options.app),
    );
  }

  return {
    fileName: file.name,
    size: file.size,
    bytes,
    detected: { ...detected, mimeType: file.type || mimeTypeFor(detected.format) },
  };
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}

export function assertUsableForApp(detectedKind: string | null, app: AppKind): void {
  if (detectedKind !== app) {
    throw new FileValidationError('wrong-format', `This file does not belong to the ${appName(app)} editor.`);
  }
}
