import { useCallback, useRef, useState } from 'react';
import { UploadCloud } from 'lucide-react';
import { EDITOR_ACCEPT, type AppKind } from '@wepo/core';
import { useDocumentLauncher } from '../hooks/use-document-launcher';
import { cn } from '../lib/utils';

export function FileDropZone({ app, compact = false }: { app?: AppKind; compact?: boolean }) {
  const inputRef = useRef<HTMLInputElement>(null);
  const { openFile, busy } = useDocumentLauncher();
  const [dragging, setDragging] = useState(false);

  const onDrop = useCallback(
    async (event: React.DragEvent) => {
      event.preventDefault();
      setDragging(false);
      const file = event.dataTransfer.files?.[0];
      if (file) await openFile(file, app);
    },
    [app, openFile],
  );

  return (
    <div
      className={cn(
        'relative flex flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed text-center transition-colors',
        compact ? 'p-5' : 'p-8 sm:p-12',
        dragging ? 'border-blue-400 bg-blue-50/70' : 'border-slate-300 bg-white/60 hover:border-slate-400',
      )}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
    >
      <input
        ref={inputRef}
        type="file"
        accept={app ? EDITOR_ACCEPT[app] : undefined}
        className="sr-only"
        tabIndex={-1}
        aria-hidden="true"
        onChange={async (event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          if (file) await openFile(file, app);
        }}
      />
      <span className="flex h-11 w-11 items-center justify-center rounded-full bg-slate-100 text-slate-500">
        <UploadCloud size={22} aria-hidden />
      </span>
      <div>
        <p className="text-sm font-medium text-slate-900">
          {busy ? 'Reading your file…' : 'Drop a file here, or choose one'}
        </p>
        <p className="mt-1 text-xs leading-5 text-slate-500">
          {app ? `Supported: ${app === 'word' ? 'DOCX' : app === 'sheets' ? 'XLSX, CSV' : 'PPTX'}` : 'DOCX, XLSX, CSV or PPTX'} · up to 100 MB · never uploaded
        </p>
      </div>
      <button
        type="button"
        className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 shadow-sm hover:bg-slate-50 disabled:opacity-50"
        onClick={() => inputRef.current?.click()}
        disabled={busy}
      >
        Browse files
      </button>
    </div>
  );
}
