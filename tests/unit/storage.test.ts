import { describe, expect, it } from 'vitest';
import {
  StorageUnavailableError,
  createDocumentId,
  deleteDocument,
  getDocument,
  listRecent,
  saveDocument,
  storageSummary,
} from '@wepo/core';

// Unit tests run in Node, which has no IndexedDB. This is the same situation as
// a privacy-hardened or unsupported browser, so it exercises the fallback path.
describe('IndexedDB fallback', () => {
  it('reports storage as unavailable instead of throwing', async () => {
    await expect(storageSummary()).resolves.toEqual({ documents: 0, bytes: 0, available: false });
  });

  it('rejects save requests with a typed error', async () => {
    await expect(
      saveDocument({
        id: 'doc-1',
        name: 'Test.docx',
        kind: 'word',
        format: 'docx',
        size: 3,
        lastOpenedAt: Date.now(),
        updatedAt: Date.now(),
        source: 'import',
        bytes: new Uint8Array([1, 2, 3]),
      }),
    ).rejects.toBeInstanceOf(StorageUnavailableError);
  });

  it('keeps read and delete helpers honest when storage is missing', async () => {
    await expect(getDocument('doc-1')).rejects.toBeInstanceOf(StorageUnavailableError);
    await expect(listRecent()).rejects.toBeInstanceOf(StorageUnavailableError);
    await expect(deleteDocument('doc-1')).rejects.toBeInstanceOf(StorageUnavailableError);
  });

  it('creates unique, URL-safe document identifiers without file names', () => {
    const first = createDocumentId();
    const second = createDocumentId();
    expect(first).not.toBe(second);
    expect(first).toMatch(/^[a-zA-Z0-9-]+$/);
    expect(first).not.toContain(' ');
  });
});
