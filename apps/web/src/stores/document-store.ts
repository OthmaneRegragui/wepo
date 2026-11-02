import { create } from 'zustand';
import type { AppKind, DocumentFormat } from '@wepo/core';

export interface PendingDocument {
  id: string;
  fileName: string;
  kind: AppKind;
  format: DocumentFormat;
  size: number;
  bytes: Uint8Array;
  source: 'import' | 'new' | 'recovery';
}

interface DocumentState {
  pending: PendingDocument | null;
  setPending: (document: PendingDocument) => void;
  clearPending: () => void;
}

/**
 * A one-shot handoff between the file picker and the editor route. Document
 * bytes are also persisted in IndexedDB so a refresh can recover the session;
 * this in-memory copy covers quota failures and avoids an immediate re-read.
 */
export const useDocumentStore = create<DocumentState>((set) => ({
  pending: null,
  setPending: (document) => set({ pending: document }),
  clearPending: () => set({ pending: null }),
}));
