import { FileValidationError, type FileValidationLimits } from './types';

export interface ZipAuditResult {
  entryCount: number;
  uncompressedBytes: number;
  compressedBytes: number;
  centralDirectoryOffset: number;
}

const EOCD_SIGNATURE = 0x06054b50;
const CENTRAL_SIGNATURE = 0x02014b50;
const EOCD_MIN_SIZE = 22;
const MAX_COMMENT_SIZE = 0xffff;

/**
 * Audit a ZIP central directory without decompressing anything. Office files
 * are ZIP containers carrying untrusted input, so size, entry count, encryption
 * and compression-ratio checks happen before an editor engine receives the
 * bytes. The check is intentionally conservative and rejects ZIP64 archives.
 */
export function auditZip(bytes: Uint8Array, limits: FileValidationLimits): ZipAuditResult {
  if (bytes.byteLength < EOCD_MIN_SIZE) {
    throw new FileValidationError('invalid-zip', 'The file is too small to be a valid Office document.');
  }

  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  const searchStart = Math.max(0, bytes.byteLength - EOCD_MIN_SIZE - MAX_COMMENT_SIZE);
  let eocd = -1;
  for (let i = bytes.byteLength - EOCD_MIN_SIZE; i >= searchStart; i -= 1) {
    if (view.getUint32(i, true) === EOCD_SIGNATURE) {
      eocd = i;
      break;
    }
  }
  if (eocd < 0) {
    throw new FileValidationError('invalid-zip', 'The Office file is not a valid ZIP container.');
  }

  const entryCount = view.getUint16(eocd + 10, true);
  const cdSize = view.getUint32(eocd + 12, true);
  const cdOffset = view.getUint32(eocd + 16, true);
  const commentLength = view.getUint16(eocd + 20, true);

  if (cdOffset === 0xffffffff || cdSize === 0xffffffff || entryCount === 0xffff) {
    throw new FileValidationError(
      'zip64-unsupported',
      'This archive uses ZIP64. Re-save it in a desktop Office application and try again.',
    );
  }
  if (eocd + EOCD_MIN_SIZE + commentLength > bytes.byteLength) {
    throw new FileValidationError('invalid-zip', 'The Office file has a corrupt ZIP footer.');
  }
  if (cdOffset + cdSize > bytes.byteLength || cdOffset > bytes.byteLength) {
    throw new FileValidationError('invalid-zip', 'The Office file has a corrupt central directory.');
  }
  if (entryCount > limits.maxZipEntries) {
    throw new FileValidationError(
      'too-many-zip-entries',
      `The archive contains more than ${limits.maxZipEntries.toLocaleString()} entries and was blocked as a safety precaution.`,
    );
  }

  let offset = cdOffset;
  let uncompressedTotal = 0;
  let compressedTotal = 0;

  for (let entry = 0; entry < entryCount; entry += 1) {
    if (offset + 46 > bytes.byteLength || view.getUint32(offset, true) !== CENTRAL_SIGNATURE) {
      throw new FileValidationError('invalid-zip', 'The Office file has a corrupt ZIP entry.');
    }

    const flags = view.getUint16(offset + 8, true);
    const method = view.getUint16(offset + 10, true);
    const compressed = view.getUint32(offset + 20, true);
    const uncompressed = view.getUint32(offset + 24, true);
    const nameLength = view.getUint16(offset + 28, true);
    const extraLength = view.getUint16(offset + 30, true);
    const entryCommentLength = view.getUint16(offset + 32, true);
    const next = offset + 46 + nameLength + extraLength + entryCommentLength;

    if (next > bytes.byteLength) {
      throw new FileValidationError('invalid-zip', 'The Office file has a truncated ZIP entry.');
    }
    if (compressed === 0xffffffff || uncompressed === 0xffffffff) {
      throw new FileValidationError('zip64-unsupported', 'This archive uses ZIP64 and cannot be opened safely.');
    }
    if ((flags & 0x1) !== 0) {
      throw new FileValidationError('zip-encrypted', 'Password-protected Office files are not supported.');
    }
    if (method !== 0 && method !== 8) {
      throw new FileValidationError(
        'zip-unsupported-compression',
        'The archive uses an unsupported compression method.',
      );
    }
    if (uncompressed > limits.maxEntryBytes) {
      throw new FileValidationError(
        'zip-entry-too-large',
        'A file inside the archive is too large to open safely.',
      );
    }
    if (uncompressed >= 1024 * 1024 && compressed > 0 && uncompressed / compressed > limits.maxCompressionRatio) {
      throw new FileValidationError(
        'zip-compression-ratio',
        'The archive has an abnormally high compression ratio and was blocked as a decompression-bomb precaution.',
      );
    }

    uncompressedTotal += uncompressed;
    compressedTotal += compressed;
    if (uncompressedTotal > limits.maxUncompressedBytes) {
      throw new FileValidationError(
        'zip-uncompressed-limit',
        'The archive expands beyond the safe size limit and was blocked.',
      );
    }

    offset = next;
  }

  return { entryCount, uncompressedBytes: uncompressedTotal, compressedBytes: compressedTotal, centralDirectoryOffset: cdOffset };
}

export function isZipContainer(bytes: Uint8Array): boolean {
  return (
    bytes.byteLength >= 4 &&
    bytes[0] === 0x50 &&
    bytes[1] === 0x4b &&
    (bytes[2] === 0x03 || bytes[2] === 0x05 || bytes[2] === 0x07)
  );
}
