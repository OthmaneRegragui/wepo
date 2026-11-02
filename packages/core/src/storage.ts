import type { AppKind, DocumentFormat } from './types';

export interface StoredDocumentRecord {
  id: string;
  name: string;
  kind: AppKind;
  format: DocumentFormat;
  size: number;
  lastOpenedAt: number;
  updatedAt: number;
  hasBytes: boolean;
  source: 'import' | 'new' | 'recovery';
  bytes?: ArrayBuffer;
}

export type RecentDocument = Omit<StoredDocumentRecord, 'bytes'>;

const DB_NAME = 'wepo-office';
const DB_VERSION = 1;
const STORE = 'documents';
const INDEX = 'lastOpenedAt';
export const MAX_STORED_DOCUMENTS = 25;
export const MAX_STORED_BYTES_PER_DOCUMENT = 50 * 1024 * 1024;
const MAX_TOTAL_STORED_BYTES = 300 * 1024 * 1024;

export class StorageUnavailableError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message, options);
    this.name = 'StorageUnavailableError';
  }
}

function factory(): IDBFactory {
  if (typeof indexedDB === 'undefined') {
    throw new StorageUnavailableError('This browser does not expose IndexedDB.');
  }
  return indexedDB;
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    let request: IDBOpenDBRequest;
    try {
      request = factory().open(DB_NAME, DB_VERSION);
    } catch (cause) {
      reject(new StorageUnavailableError('IndexedDB could not be opened.', { cause }));
      return;
    }
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(STORE)) {
        const store = db.createObjectStore(STORE, { keyPath: 'id' });
        store.createIndex(INDEX, 'lastOpenedAt');
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(new StorageUnavailableError('IndexedDB could not be opened.', { cause: request.error }));
    request.onblocked = () => reject(new StorageUnavailableError('IndexedDB is blocked by another tab.'));
  });
}

function requestResult<T>(request: IDBRequest<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error ?? new Error('IndexedDB request failed.'));
  });
}

function transactionDone(tx: IDBTransaction): Promise<void> {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error ?? new Error('IndexedDB transaction failed.'));
    tx.onabort = () => reject(tx.error ?? new Error('IndexedDB transaction was aborted.'));
  });
}

export function createDocumentId(): string {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) return crypto.randomUUID();
  return `doc-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export async function saveDocument(record: Omit<StoredDocumentRecord, 'hasBytes' | 'bytes'> & { bytes?: Uint8Array }): Promise<StoredDocumentRecord> {
  const db = await openDatabase();
  try {
    const copy = record.bytes ? copyBytes(record.bytes) : undefined;
    const stored: StoredDocumentRecord = {
      id: record.id,
      name: record.name,
      kind: record.kind,
      format: record.format,
      size: record.size,
      lastOpenedAt: record.lastOpenedAt,
      updatedAt: record.updatedAt,
      source: record.source,
      hasBytes: Boolean(copy && copy.byteLength <= MAX_STORED_BYTES_PER_DOCUMENT),
      ...(copy && copy.byteLength <= MAX_STORED_BYTES_PER_DOCUMENT ? { bytes: toArrayBuffer(copy) } : {}),
    };
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).put(stored);
    await transactionDone(tx);
    await prune(db);
    return stored;
  } finally {
    db.close();
  }
}

export async function getDocument(id: string): Promise<StoredDocumentRecord | null> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(STORE, 'readonly');
    const value = await requestResult<StoredDocumentRecord | undefined>(tx.objectStore(STORE).get(id));
    return value ?? null;
  } finally {
    db.close();
  }
}

export async function listRecent(limit = 12): Promise<RecentDocument[]> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(STORE, 'readonly');
    const index = tx.objectStore(STORE).index(INDEX);
    const values = await requestResult<StoredDocumentRecord[]>(index.getAll());
    return values
      .sort((a, b) => b.lastOpenedAt - a.lastOpenedAt)
      .slice(0, limit)
      .map(({ bytes: _bytes, ...meta }) => meta);
  } finally {
    db.close();
  }
}

export async function touchDocument(id: string): Promise<void> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const value = await requestResult<StoredDocumentRecord | undefined>(store.get(id));
    if (value) {
      value.lastOpenedAt = Date.now();
      store.put(value);
    }
    await transactionDone(tx);
  } finally {
    db.close();
  }
}

export async function deleteDocument(id: string): Promise<void> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).delete(id);
    await transactionDone(tx);
  } finally {
    db.close();
  }
}

export async function clearDocuments(): Promise<void> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(STORE, 'readwrite');
    tx.objectStore(STORE).clear();
    await transactionDone(tx);
  } finally {
    db.close();
  }
}

export async function deleteDocumentsForApp(kind: AppKind): Promise<void> {
  const db = await openDatabase();
  try {
    const tx = db.transaction(STORE, 'readwrite');
    const store = tx.objectStore(STORE);
    const all = await requestResult<StoredDocumentRecord[]>(store.getAll());
    for (const doc of all) {
      if (doc.kind === kind) store.delete(doc.id);
    }
    await transactionDone(tx);
  } finally {
    db.close();
  }
}

async function prune(db: IDBDatabase): Promise<void> {
  const tx = db.transaction(STORE, 'readwrite');
  const store = tx.objectStore(STORE);
  const all = await requestResult<StoredDocumentRecord[]>(store.getAll());
  all.sort((a, b) => b.lastOpenedAt - a.lastOpenedAt);
  let total = all.reduce((sum, doc) => sum + (doc.bytes?.byteLength ?? 0), 0);
  for (let i = 0; i < all.length; i += 1) {
    const doc = all[i]!;
    if (i >= MAX_STORED_DOCUMENTS || total > MAX_TOTAL_STORED_BYTES) {
      store.delete(doc.id);
      total -= doc.bytes?.byteLength ?? 0;
    }
  }
  await transactionDone(tx);
}

function copyBytes(bytes: Uint8Array): Uint8Array {
  return bytes.slice();
}

function toArrayBuffer(bytes: Uint8Array): ArrayBuffer {
  return bytes.buffer.slice(bytes.byteOffset, bytes.byteOffset + bytes.byteLength) as ArrayBuffer;
}

export async function storageSummary(): Promise<{ documents: number; bytes: number; available: boolean }> {
  try {
    const db = await openDatabase();
    try {
      const tx = db.transaction(STORE, 'readonly');
      const all = await requestResult<StoredDocumentRecord[]>(tx.objectStore(STORE).getAll());
      return {
        documents: all.length,
        bytes: all.reduce((sum, doc) => sum + (doc.bytes?.byteLength ?? 0), 0),
        available: true,
      };
    } finally {
      db.close();
    }
  } catch {
    return { documents: 0, bytes: 0, available: false };
  }
}
