import type { AppKind, DetectedFile, DocumentFormat } from './types';

const MIME_BY_FORMAT: Record<string, string> = {
  docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx: 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  csv: 'text/csv',
  doc: 'application/msword',
  xls: 'application/vnd.ms-excel',
  ppt: 'application/vnd.ms-powerpoint',
  odt: 'application/vnd.oasis.opendocument.text',
  ods: 'application/vnd.oasis.opendocument.spreadsheet',
  odp: 'application/vnd.oasis.opendocument.presentation',
  rtf: 'application/rtf',
  txt: 'text/plain',
  pdf: 'application/pdf',
  unknown: 'application/octet-stream',
};

const KIND_BY_FORMAT: Record<string, AppKind | null> = {
  docx: 'word',
  doc: 'word',
  odt: 'word',
  rtf: 'word',
  txt: 'word',
  xlsx: 'sheets',
  xls: 'sheets',
  ods: 'sheets',
  csv: 'sheets',
  pptx: 'slides',
  ppt: 'slides',
  odp: 'slides',
};

const EXTENSION_ALIASES: Record<string, string> = {
  jpeg: 'jpg',
};

export function extensionOf(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? '';
  const dot = base.lastIndexOf('.');
  if (dot <= 0 || dot === base.length - 1) return '';
  const ext = base.slice(dot + 1).toLowerCase();
  return EXTENSION_ALIASES[ext] ?? ext;
}

export function baseNameOf(fileName: string): string {
  const base = fileName.split(/[\\/]/).pop() ?? 'document';
  const dot = base.lastIndexOf('.');
  return dot > 0 ? base.slice(0, dot) : base;
}

export function mimeTypeFor(format: string): string {
  return MIME_BY_FORMAT[format] ?? MIME_BY_FORMAT.unknown!;
}

export function extensionFor(format: DocumentFormat): string {
  return format === 'unknown' ? 'bin' : format;
}

/** Formats that support a meaningful PDF export in this application. */
export function supportsPdfExport(kind: AppKind): boolean {
  return kind === 'word' || kind === 'sheets' || kind === 'slides';
}

export interface DetectOptions {
  /** MIME type reported by the browser, if any. */
  mimeType?: string;
  /** First bytes of the file, used to verify the declared container. */
  head?: Uint8Array | ArrayBuffer;
}

/**
 * Detect the document type from its name and magic bytes. The file extension is
 * authoritative for the editor choice; the signature only verifies that the
 * bytes are a plausible container. This avoids trusting a spoofed MIME type.
 */
export function detectFile(fileName: string, options: DetectOptions = {}): DetectedFile {
  const extension = extensionOf(fileName);
  const format = normaliseFormat(extension);
  const kind = KIND_BY_FORMAT[format] ?? null;
  const head = options.head
    ? options.head instanceof Uint8Array
      ? options.head
      : new Uint8Array(options.head)
    : undefined;
  const signature = signatureKind(head);
  const zipBased = format === 'docx' || format === 'xlsx' || format === 'pptx' || format === 'odt' || format === 'ods' || format === 'odp';

  let signatureMatches = true;
  if (head && head.byteLength >= 4) {
    if (zipBased) signatureMatches = signature === 'zip';
    else if (format === 'pdf') signatureMatches = signature === 'pdf';
    else if (format === 'doc' || format === 'xls' || format === 'ppt') {
      signatureMatches = signature === 'ole';
    }
  }

  return {
    extension,
    format,
    kind,
    mimeType: mimeTypeFor(format),
    signatureMatches,
    zipBased,
  };
}

function normaliseFormat(extension: string): DocumentFormat {
  switch (extension) {
    case 'docx':
    case 'xlsx':
    case 'csv':
    case 'pptx':
    case 'doc':
    case 'xls':
    case 'ppt':
    case 'odt':
    case 'ods':
    case 'odp':
    case 'rtf':
    case 'txt':
    case 'pdf':
      return extension;
    default:
      return 'unknown';
  }
}

type SignatureKind = 'zip' | 'pdf' | 'ole' | 'png' | 'jpeg' | 'gif' | 'webp' | 'unknown';

function signatureKind(head: Uint8Array | undefined): SignatureKind {
  if (!head || head.byteLength < 4) return 'unknown';
  const b = head;
  if (b[0] === 0x50 && b[1] === 0x4b && (b[2] === 0x03 || b[2] === 0x05 || b[2] === 0x07)) return 'zip';
  if (b[0] === 0x25 && b[1] === 0x50 && b[2] === 0x44 && b[3] === 0x46) return 'pdf';
  if (b[0] === 0xd0 && b[1] === 0xcf && b[2] === 0x11 && b[3] === 0xe0) return 'ole';
  if (b[0] === 0x89 && b[1] === 0x50 && b[2] === 0x4e && b[3] === 0x47) return 'png';
  if (b[0] === 0xff && b[1] === 0xd8) return 'jpeg';
  if (b[0] === 0x47 && b[1] === 0x49 && b[2] === 0x46) return 'gif';
  if (b[0] === 0x52 && b[1] === 0x49 && b[2] === 0x46 && b[3] === 0x46) return 'webp';
  return 'unknown';
}

export function isSupportedForApp(detected: DetectedFile, app: AppKind): boolean {
  return detected.kind === app;
}

export const SUPPORTED_EXTENSIONS: Record<AppKind, readonly string[]> = {
  word: ['docx'],
  sheets: ['xlsx', 'csv'],
  slides: ['pptx'],
};

export const EDITOR_ACCEPT: Record<AppKind, string> = {
  word: '.docx,application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  sheets: '.xlsx,.csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,text/csv',
  slides: '.pptx,application/vnd.openxmlformats-officedocument.presentationml.presentation',
};

export const OPENABLE_EXTENSIONS: Record<AppKind, readonly string[]> = {
  word: ['docx'],
  sheets: ['xlsx', 'csv'],
  slides: ['pptx'],
};

export function isOpenableForApp(detected: DetectedFile, app: AppKind): boolean {
  return OPENABLE_EXTENSIONS[app].includes(detected.format);
}

export function describeUnsupported(detected: DetectedFile, app: AppKind): string {
  if (detected.format === 'unknown') {
    return 'This file type is not recognised. Open a .docx, .xlsx, .csv, or .pptx file.';
  }
  return `${detected.format.toUpperCase()} files are not supported in the ${appName(app)} editor.`;
}

export function appName(kind: AppKind): string {
  switch (kind) {
    case 'word':
      return 'Word';
    case 'sheets':
      return 'Sheets';
    case 'slides':
      return 'Slides';
  }
}
