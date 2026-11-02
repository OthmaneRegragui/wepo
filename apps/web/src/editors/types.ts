export interface EditorBridge {
  /** Serialize the edited document; resolves to a fresh file copy. */
  save: () => Promise<Uint8Array>;
  /** Open the browser print flow for this document. */
  print: () => Promise<void>;
  /** Sheets only: render the first visible worksheet as CSV text. */
  exportCsv?: () => Promise<string>;
}

export interface EditorComponentProps {
  bytes: Uint8Array;
  fileName: string;
  onReady: (bridge: EditorBridge) => void;
  onDirty: () => void;
  onError: (error: Error) => void;
}

export function asError(value: unknown): Error {
  if (value instanceof Error) return value;
  if (typeof value === 'string') return new Error(value);
  return new Error('The editor reported an unknown error.');
}
