import { describe, expect, it } from 'vitest';
import * as XLSX from 'xlsx';
import {
  FileValidationError,
  formatBytes,
  loadLocalFile,
  DEFAULT_LIMITS,
  type FileValidationLimits,
} from '@wepo/core';

function realXlsx(): Uint8Array {
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, XLSX.utils.aoa_to_sheet([['Item', 'Qty'], ['Pen', 2]]), 'Sheet1');
  return new Uint8Array(XLSX.write(workbook, { type: 'array', bookType: 'xlsx' }) as ArrayBuffer);
}

function file(parts: BlobPart[], name: string, type = ''): File {
  return new File(parts, name, { type });
}

async function rejection(promise: Promise<unknown>): Promise<FileValidationError> {
  try {
    await promise;
  } catch (error) {
    if (error instanceof FileValidationError) return error;
    throw error;
  }
  throw new Error('Expected the promise to reject with a FileValidationError.');
}

function limits(overrides: Partial<FileValidationLimits> = {}): FileValidationLimits {
  return { ...DEFAULT_LIMITS, ...overrides };
}

describe('loadLocalFile', () => {
  it('reads a valid XLSX into memory without uploading it', async () => {
    const loaded = await loadLocalFile(file([realXlsx()], 'budget.xlsx'), { app: 'sheets' });
    expect(loaded.fileName).toBe('budget.xlsx');
    expect(loaded.size).toBeGreaterThan(0);
    expect(loaded.detected).toMatchObject({ format: 'xlsx', kind: 'sheets' });
    expect(loaded.detected.mimeType).toContain('spreadsheetml');
    expect(loaded.bytes.byteLength).toBe(loaded.size);
  });

  it('reads a UTF-8 CSV for the Sheets app', async () => {
    const loaded = await loadLocalFile(file([new TextEncoder().encode('Item,Qty\nPen,2\n')], 'small.csv'), {
      app: 'sheets',
    });
    expect(loaded.detected.format).toBe('csv');
    expect(loaded.detected.kind).toBe('sheets');
  });

  it('rejects an empty file', async () => {
    const error = await rejection(loadLocalFile(file([], 'empty.docx')));
    expect(error.code).toBe('empty-file');
  });

  it('rejects files above the configured byte limit', async () => {
    const error = await rejection(
      loadLocalFile(file([new Uint8Array(64)], 'big.csv'), { limits: limits({ maxBytes: 32 }) }),
    );
    expect(error.code).toBe('too-large');
    expect(error.userMessage).toContain('local limit');
  });

  it('rejects unknown extensions with a clear message', async () => {
    const error = await rejection(loadLocalFile(file(['hello'], 'notes.zip')));
    expect(error.code).toBe('unsupported-extension');
  });

  it('rejects legacy and OpenDocument formats instead of guessing', async () => {
    const legacy = await rejection(loadLocalFile(file([new Uint8Array([1, 2, 3, 4])], 'old.doc')));
    expect(legacy.code).toBe('unsupported-format');
    expect(legacy.userMessage).toContain('Re-save the file as DOCX');

    const openDocument = await rejection(loadLocalFile(file([new Uint8Array([1, 2, 3, 4])], 'old.odt')));
    expect(openDocument.code).toBe('unsupported-format');
    expect(openDocument.userMessage).toContain('Re-save the file as DOCX');
  });

  it('rejects a renamed file whose bytes do not match the extension', async () => {
    const error = await rejection(loadLocalFile(file(['this is not a word file'], 'letter.docx')));
    expect(error.code).toBe('extension-signature-mismatch');
  });

  it('rejects a corrupt ZIP container', async () => {
    const corrupt = new Uint8Array(64);
    corrupt.set([0x50, 0x4b, 0x03, 0x04]);
    const error = await rejection(loadLocalFile(file([corrupt], 'broken.docx')));
    expect(error.code).toBe('invalid-zip');
  });

  it('rejects a CSV containing binary NUL bytes', async () => {
    const error = await rejection(loadLocalFile(file([new Uint8Array([65, 0, 66])], 'binary.csv')));
    expect(error.code).toBe('wrong-format');
  });

  it('rejects a CSV with no text', async () => {
    const error = await rejection(loadLocalFile(file([new TextEncoder().encode(' \n\t ')], 'blank.csv')));
    expect(error.code).toBe('empty-file');
  });

  it('rejects a document opened in the wrong app', async () => {
    const error = await rejection(loadLocalFile(file([realXlsx()], 'budget.xlsx'), { app: 'word' }));
    expect(error.code).toBe('unsupported-format');
    expect(error.userMessage).toContain('Word');
  });
});

describe('formatBytes', () => {
  it('formats each unit without lying about precision', () => {
    expect(formatBytes(0)).toBe('0 B');
    expect(formatBytes(1023)).toBe('1023 B');
    expect(formatBytes(1024)).toBe('1.0 KB');
    expect(formatBytes(1024 * 1024)).toBe('1.0 MB');
    expect(formatBytes(1024 * 1024 * 1024)).toBe('1.00 GB');
  });
});
