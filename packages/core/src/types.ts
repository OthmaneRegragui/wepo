export type AppKind = 'word' | 'sheets' | 'slides';

export type DocumentFormat =
  | 'docx'
  | 'xlsx'
  | 'csv'
  | 'pptx'
  | 'doc'
  | 'xls'
  | 'ppt'
  | 'odt'
  | 'ods'
  | 'odp'
  | 'rtf'
  | 'txt'
  | 'pdf'
  | 'unknown';

export interface DetectedFile {
  /** Lowercase extension without the dot, or 'unknown'. */
  extension: string;
  format: DocumentFormat;
  kind: AppKind | null;
  mimeType: string;
  /** True when the extension and the file signature agree, or when there is no signature to check. */
  signatureMatches: boolean;
  /** Formats with a ZIP container that must pass the zip safety audit. */
  zipBased: boolean;
}

export interface FileValidationLimits {
  maxBytes: number;
  maxZipEntries: number;
  maxUncompressedBytes: number;
  maxEntryBytes: number;
  maxCompressionRatio: number;
}

export const DEFAULT_LIMITS: FileValidationLimits = {
  maxBytes: 100 * 1024 * 1024,
  maxZipEntries: 5_000,
  maxUncompressedBytes: 500 * 1024 * 1024,
  maxEntryBytes: 150 * 1024 * 1024,
  maxCompressionRatio: 200,
};

export type ValidationCode =
  | 'empty-file'
  | 'too-large'
  | 'unsupported-extension'
  | 'unsupported-format'
  | 'extension-signature-mismatch'
  | 'invalid-zip'
  | 'zip64-unsupported'
  | 'too-many-zip-entries'
  | 'zip-uncompressed-limit'
  | 'zip-entry-too-large'
  | 'zip-compression-ratio'
  | 'zip-encrypted'
  | 'zip-unsupported-compression'
  | 'read-failed'
  | 'wrong-format';

export class FileValidationError extends Error {
  readonly code: ValidationCode;
  readonly userMessage: string;

  constructor(code: ValidationCode, userMessage: string, options?: { cause?: unknown }) {
    super(userMessage, options);
    this.name = 'FileValidationError';
    this.code = code;
    this.userMessage = userMessage;
  }
}

export interface LoadedDocument {
  fileName: string;
  size: number;
  bytes: Uint8Array;
  detected: DetectedFile;
}
