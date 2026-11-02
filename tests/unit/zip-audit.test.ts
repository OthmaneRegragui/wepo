import { describe, expect, it } from 'vitest';
import { FileValidationError, auditZip, DEFAULT_LIMITS, type FileValidationLimits } from '@wepo/core';
import { makeZip } from './helpers/zip-fixture';

function limits(overrides: Partial<FileValidationLimits> = {}): FileValidationLimits {
  return { ...DEFAULT_LIMITS, ...overrides };
}

function codeOf(fn: () => unknown): string | null {
  try {
    fn();
    return null;
  } catch (error) {
    return error instanceof FileValidationError ? error.code : 'not-a-validation-error';
  }
}

describe('auditZip', () => {
  it('accepts a normal central directory', () => {
    const zip = makeZip([
      { name: '[Content_Types].xml', uncompressedSize: 200, compressedSize: 120, method: 8 },
      { name: 'word/document.xml', uncompressedSize: 400, compressedSize: 180, method: 8 },
    ]);
    const result = auditZip(zip, limits());
    expect(result.entryCount).toBe(2);
    expect(result.uncompressedBytes).toBe(600);
    expect(result.compressedBytes).toBe(300);
  });

  it('rejects data that is too small to contain an EOCD record', () => {
    expect(codeOf(() => auditZip(new Uint8Array(10), limits()))).toBe('invalid-zip');
  });

  it('rejects a file with no EOCD signature', () => {
    expect(codeOf(() => auditZip(new Uint8Array(64).fill(0x41), limits()))).toBe('invalid-zip');
  });

  it('rejects ZIP64 archives', () => {
    const zip = makeZip([{ name: 'a.xml' }], { entryCountOverride: 0xffff });
    expect(codeOf(() => auditZip(zip, limits()))).toBe('zip64-unsupported');
  });

  it('rejects too many entries', () => {
    const zip = makeZip([{ name: 'a.xml' }, { name: 'b.xml' }, { name: 'c.xml' }]);
    expect(codeOf(() => auditZip(zip, limits({ maxZipEntries: 2 })))).toBe('too-many-zip-entries');
  });

  it('rejects encrypted entries', () => {
    const zip = makeZip([{ name: 'a.xml', flags: 0x1, uncompressedSize: 10, compressedSize: 10 }]);
    expect(codeOf(() => auditZip(zip, limits()))).toBe('zip-encrypted');
  });

  it('rejects unsupported compression methods', () => {
    const zip = makeZip([{ name: 'a.xml', method: 12, uncompressedSize: 10, compressedSize: 10 }]);
    expect(codeOf(() => auditZip(zip, limits()))).toBe('zip-unsupported-compression');
  });

  it('rejects a single entry beyond the per-entry limit', () => {
    const zip = makeZip([{ name: 'a.xml', uncompressedSize: 2048, compressedSize: 1024 }]);
    expect(codeOf(() => auditZip(zip, limits({ maxEntryBytes: 1024 })))).toBe('zip-entry-too-large');
  });

  it('rejects a decompression-bomb compression ratio', () => {
    const zip = makeZip([{ name: 'a.xml', method: 8, uncompressedSize: 2 * 1024 * 1024, compressedSize: 1024 }]);
    expect(codeOf(() => auditZip(zip, limits({ maxCompressionRatio: 200, maxEntryBytes: 10 * 1024 * 1024 })))).toBe(
      'zip-compression-ratio',
    );
  });

  it('rejects archives that expand beyond the total budget', () => {
    const zip = makeZip([
      { name: 'a.xml', uncompressedSize: 400, compressedSize: 400 },
      { name: 'b.xml', uncompressedSize: 400, compressedSize: 400 },
    ]);
    expect(codeOf(() => auditZip(zip, limits({ maxUncompressedBytes: 500 })))).toBe('zip-uncompressed-limit');
  });
});
