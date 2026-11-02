import { useCallback, useState } from 'react';
import { XlsxEditor, type XlsxAsyncEditorApi } from '@betteroffice/xlsx-react';
import type { EditorComponentProps } from '../types';
import { asError } from '../types';
import { printSheets } from '../../lib/print';
import { sheetToCsv } from '../../lib/csv';
import { EditorLoading, Spinner } from '../../components/ui/spinner';

export function SheetsEditor({ bytes, fileName, onReady, onDirty, onError }: EditorComponentProps) {
  const [loaded, setLoaded] = useState(false);

  const handleReady = useCallback(
    (api: XlsxAsyncEditorApi) => {
      setLoaded(true);
      onReady({
        save: async () => api.save(),
        print: () => printSheets(api, fileName),
        exportCsv: async () => {
          const result = await api.exportStructured({ includeHiddenSheets: false, maxCells: 200_000 });
          if (!result.ok) throw new Error(result.failure.message);
          const sheet = result.content.sheets.find(
            (candidate) => candidate.kind === 'worksheet' && candidate.visibility === 'visible',
          );
          if (!sheet) throw new Error('This workbook has no visible worksheet to export as CSV.');
          return sheetToCsv(sheet);
        },
      });
    },
    [fileName, onReady],
  );

  return (
    <div className="editor-host relative">
      <div className="h-full">
        <XlsxEditor
          file={bytes}
          fileName={fileName}
          downloadOnSave={false}
          onReady={handleReady}
          onDocumentChange={() => onDirty()}
          onError={(error) => onError(asError(error))}
          loadingIndicator={<Spinner className="p-6" label="Opening the workbook" />}
          style={{ height: '100%' }}
        />
      </div>
      {!loaded && (
        <div className="absolute inset-0 z-10 bg-white">
          <EditorLoading label="Preparing the Sheets editor" />
        </div>
      )}
    </div>
  );
}
