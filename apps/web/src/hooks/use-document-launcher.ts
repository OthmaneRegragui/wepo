import { useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  FileValidationError,
  createDocumentId,
  formatBytes,
  loadLocalFile,
  saveDocument,
  type AppKind,
  type DocumentFormat,
} from '@wepo/core';
import { useDocumentStore } from '../stores/document-store';
import { toastError, toastInfo } from '../stores/toast-store';
import { editorPath } from '../lib/apps';
import { csvBytesToXlsx } from '../lib/csv';

const BLANK_TEMPLATES: Record<AppKind, { path: string; fileName: string; format: DocumentFormat }> = {
  word: { path: '/templates/blank.docx', fileName: 'Untitled document.docx', format: 'docx' },
  sheets: { path: '/templates/blank.xlsx', fileName: 'Untitled spreadsheet.xlsx', format: 'xlsx' },
  slides: { path: '/templates/blank.pptx', fileName: 'Untitled presentation.pptx', format: 'pptx' },
};

export function useDocumentLauncher() {
  const navigate = useNavigate();
  const setPending = useDocumentStore((s) => s.setPending);
  const [busy, setBusy] = useState(false);

  const handoff = useCallback(
    async (input: {
      fileName: string;
      bytes: Uint8Array;
      kind: AppKind;
      format: DocumentFormat;
      source: 'import' | 'new' | 'recovery';
    }) => {
      const id = createDocumentId();
      const now = Date.now();
      setPending({ id, ...input, size: input.bytes.byteLength });
      try {
        await saveDocument({
          id,
          name: input.fileName,
          kind: input.kind,
          format: input.format,
          size: input.bytes.byteLength,
          lastOpenedAt: now,
          updatedAt: now,
          source: input.source,
          bytes: input.bytes,
        });
      } catch {
        // The in-memory handoff still lets the user work; recovery will be unavailable.
        toastInfo('Local recovery unavailable', 'The document is open, but this browser could not store a recovery copy.');
      }
      navigate(editorPath(input.kind, id));
    },
    [navigate, setPending],
  );

  const openFile = useCallback(
    async (file: File, expectedApp?: AppKind) => {
      setBusy(true);
      try {
        const loaded = await loadLocalFile(file, expectedApp ? { app: expectedApp } : {});
        if (!loaded.detected.kind) throw new FileValidationError('unsupported-format', 'This file type has no editor in Wepo.');

        let bytes = loaded.bytes;
        let fileName = loaded.fileName;
        let format = loaded.detected.format;
        let kind = loaded.detected.kind;

        if (format === 'csv') {
          try {
            bytes = await csvBytesToXlsx(loaded.bytes);
          } catch (error) {
            throw new FileValidationError(
              'wrong-format',
              'The CSV file could not be converted into a workbook. Check that it uses a standard delimiter and UTF-8 text.',
              { cause: error },
            );
          }
          format = 'xlsx';
          kind = 'sheets';
          fileName = loaded.fileName.replace(/\.csv$/i, '.xlsx') || 'spreadsheet.xlsx';
          toastInfo(
            'CSV converted locally',
            'The CSV became an XLSX workbook so it can be edited. Save a new XLSX copy; the original CSV is unchanged.',
          );
        }

        await handoff({ fileName, bytes, kind, format, source: 'import' });
      } catch (error) {
        if (error instanceof FileValidationError) {
          toastError('Could not open the file', error.userMessage);
        } else {
          toastError('Could not open the file', 'An unexpected error occurred while reading the file.');
          console.error(error);
        }
      } finally {
        setBusy(false);
      }
    },
    [handoff],
  );

  const createBlank = useCallback(
    async (kind: AppKind) => {
      setBusy(true);
      const template = BLANK_TEMPLATES[kind];
      try {
        const response = await fetch(template.path, { cache: 'force-cache' });
        if (!response.ok) throw new Error(`Template request failed (${response.status})`);
        const bytes = new Uint8Array(await response.arrayBuffer());
        await handoff({ fileName: template.fileName, bytes, kind, format: template.format, source: 'new' });
      } catch (error) {
        console.error(error);
        toastError('Could not create a document', 'The blank template could not be loaded. Check your connection and try again.');
      } finally {
        setBusy(false);
      }
    },
    [handoff],
  );

  const openRecent = useCallback(
    async (document: { id: string; kind: AppKind; name: string; size: number; hasBytes: boolean }) => {
      if (!document.hasBytes) {
        toastError(
          'Document data is not stored',
          `${document.name} was too large to keep a recovery copy, or storage was cleared. Open the original file again (${formatBytes(document.size)}).`,
        );
        return;
      }
      navigate(editorPath(document.kind, document.id));
    },
    [navigate],
  );

  return { openFile, createBlank, openRecent, busy };
}
