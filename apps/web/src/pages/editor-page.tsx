import { Component, lazy, Suspense, useCallback, useEffect, useRef, useState, type ErrorInfo, type ReactNode } from 'react';
import { Link, useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { AlertTriangle, ArrowLeft, FileDown, FileWarning, Printer, Save, ShieldCheck } from 'lucide-react';
import {
  FileValidationError,
  buildOutputName,
  formatBytes,
  getDocument,
  saveBytesAs,
  saveDocument,
  touchDocument,
  type AppKind,
  type DocumentFormat,
} from '@wepo/core';
import { useDocumentStore } from '../stores/document-store';
import { toastError, toastInfo, toastSuccess } from '../stores/toast-store';
import { Button } from '../components/ui/button';
import { Spinner } from '../components/ui/spinner';
import { LogoMark } from '../components/logo';
import { AppIcon } from '../components/app-icon';
import { OpenFileButton } from '../components/open-file-button';
import { EditorLoading } from '../components/ui/spinner';
import { DisplayBanner } from '../components/ads/DisplayBanner';
import type { EditorBridge } from '../editors/types';
import { APPS, appPath } from '../lib/apps';
import { cn } from '../lib/utils';

const WordEditor = lazy(() => import('../editors/word/word-editor').then((module) => ({ default: module.WordEditor })));
const SheetsEditor = lazy(() => import('../editors/sheets/sheets-editor').then((module) => ({ default: module.SheetsEditor })));
const SlidesEditor = lazy(() => import('../editors/slides/slides-editor').then((module) => ({ default: module.SlidesEditor })));

interface LoadedEditorDocument {
  id: string;
  name: string;
  kind: AppKind;
  format: DocumentFormat;
  bytes: Uint8Array;
}

type LoadState =
  | { status: 'loading' }
  | { status: 'missing'; name?: string }
  | { status: 'error'; message: string }
  | { status: 'ready'; document: LoadedEditorDocument };

function isAppKind(value: string | undefined): value is AppKind {
  return value === 'word' || value === 'sheets' || value === 'slides';
}

export function EditorPage() {
  const params = useParams<{ kind: string }>();
  const [search] = useSearchParams();
  const navigate = useNavigate();
  const clearPending = useDocumentStore((state) => state.clearPending);
  const kind = isAppKind(params.kind) ? params.kind : null;
  const docId = search.get('doc');
  const [state, setState] = useState<LoadState>({ status: 'loading' });
  const [bridge, setBridge] = useState<EditorBridge | null>(null);
  const [saving, setSaving] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [recoveryTick, setRecoveryTick] = useState(0);
  const [lastRecovery, setLastRecovery] = useState<number | null>(null);
  const [editorError, setEditorError] = useState<string | null>(null);
  const [retryKey, setRetryKey] = useState(0);
  const dirtyRef = useRef(false);
  const bridgeRef = useRef<EditorBridge | null>(null);
  const docRef = useRef<LoadedEditorDocument | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      if (!kind || !docId) {
        setState({ status: 'missing' });
        return;
      }
      setState({ status: 'loading' });
      const handoff = useDocumentStore.getState().pending;
      if (handoff && handoff.id === docId) {
        setState({
          status: 'ready',
          document: { id: handoff.id, name: handoff.fileName, kind: handoff.kind, format: handoff.format, bytes: handoff.bytes },
        });
        clearPending();
        void touchDocument(handoff.id).catch(() => undefined);
        return;
      }
      try {
        const record = await getDocument(docId);
        if (cancelled) return;
        if (!record || !record.bytes) {
          setState({ status: 'missing', name: record?.name });
          return;
        }
        if (record.kind !== kind) {
          setState({ status: 'error', message: `This file belongs to the ${APPS[record.kind].name} editor, not ${APPS[kind].name}.` });
          return;
        }
        setState({
          status: 'ready',
          document: { id: record.id, name: record.name, kind: record.kind, format: record.format, bytes: new Uint8Array(record.bytes) },
        });
        void touchDocument(docId).catch(() => undefined);
      } catch (error) {
        if (cancelled) return;
        setState({
          status: 'error',
          message:
            error instanceof FileValidationError
              ? error.userMessage
              : 'The recovery copy could not be read. Open the original file again.',
        });
      }
    }
    void load();
    return () => {
      cancelled = true;
    };
  }, [clearPending, docId, kind, retryKey]);

  useEffect(() => {
    if (state.status !== 'ready') return;
    docRef.current = state.document;
    dirtyRef.current = false;
    setDirty(false);
    setBridge(null);
    setEditorError(null);
  }, [state]);

  useEffect(() => {
    bridgeRef.current = bridge;
  }, [bridge]);

  const markDirty = useCallback(() => {
    dirtyRef.current = true;
    setDirty(true);
    setRecoveryTick((tick) => tick + 1);
  }, []);

  const handleReady = useCallback((next: EditorBridge) => {
    setBridge(next);
    bridgeRef.current = next;
  }, []);

  const handleEditorError = useCallback((error: Error) => {
    setEditorError(error.message);
    toastError('The editor reported a problem', error.message);
  }, []);

  // Periodic recovery snapshot. Manual Save is the only action that writes an
  // external file; this keeps the local recovery copy fresh after edits.
  useEffect(() => {
    if (!dirty || !bridge || state.status !== 'ready') return;
    const document = state.document;
    const timer = window.setTimeout(() => {
      void (async () => {
        try {
          const bytes = await bridge.save();
          await saveDocument({
            id: document.id,
            name: document.name,
            kind: document.kind,
            format: document.format,
            size: bytes.byteLength,
            lastOpenedAt: Date.now(),
            updatedAt: Date.now(),
            source: 'recovery',
            bytes,
          });
          setLastRecovery(Date.now());
        } catch {
          // Recovery is best-effort; the next edit or manual Save retries.
        }
      })();
    }, 30_000);
    return () => window.clearTimeout(timer);
  }, [bridge, dirty, recoveryTick, state]);

  useEffect(() => {
    const onBeforeUnload = (event: BeforeUnloadEvent) => {
      if (!dirtyRef.current) return;
      event.preventDefault();
      event.returnValue = '';
    };
    const onPageHide = () => {
      if (!dirtyRef.current || !bridgeRef.current || !docRef.current) return;
      const bridgeNow = bridgeRef.current;
      const document = docRef.current;
      void bridgeNow
        .save()
        .then((bytes) =>
          saveDocument({
            id: document.id,
            name: document.name,
            kind: document.kind,
            format: document.format,
            size: bytes.byteLength,
            lastOpenedAt: Date.now(),
            updatedAt: Date.now(),
            source: 'recovery',
            bytes,
          }),
        )
        .catch(() => undefined);
    };
    window.addEventListener('beforeunload', onBeforeUnload);
    window.addEventListener('pagehide', onPageHide);
    return () => {
      window.removeEventListener('beforeunload', onBeforeUnload);
      window.removeEventListener('pagehide', onPageHide);
    };
  }, []);

  const save = useCallback(async () => {
    if (!bridge || state.status !== 'ready') return;
    const document = state.document;
    setSaving(true);
    try {
      const bytes = await bridge.save();
      const outputName = buildOutputName(document.name, document.format, { suffix: 'edited' });
      const outcome = await saveBytesAs(bytes, outputName, document.format);
      if (outcome === 'cancelled') {
        toastInfo('Save cancelled', 'No file was written. Your local recovery copy is still here.');
        return;
      }
      await saveDocument({
        id: document.id,
        name: document.name,
        kind: document.kind,
        format: document.format,
        size: bytes.byteLength,
        lastOpenedAt: Date.now(),
        updatedAt: Date.now(),
        source: 'recovery',
        bytes,
      });
      dirtyRef.current = false;
      setDirty(false);
      toastSuccess(
        outcome === 'saved' ? 'Document saved' : 'Download started',
        `${outputName} · ${formatBytes(bytes.byteLength)}. The original file was not changed.`,
      );
    } catch (error) {
      console.error(error);
      toastError('Could not save the document', error instanceof Error ? error.message : 'The editor could not serialize the document.');
    } finally {
      setSaving(false);
    }
  }, [bridge, state]);

  const print = useCallback(async () => {
    if (!bridge || state.status !== 'ready') return;
    setPrinting(true);
    try {
      await bridge.print();
      toastInfo('Print dialog opened', 'Choose “Save as PDF” to create a PDF without uploading the file.');
    } catch (error) {
      console.error(error);
      toastError('Could not prepare printing', error instanceof Error ? error.message : 'The print view could not be created.');
    } finally {
      setPrinting(false);
    }
  }, [bridge, state]);

  const exportCsv = useCallback(async () => {
    if (!bridge?.exportCsv || state.status !== 'ready') return;
    const document = state.document;
    setExportingCsv(true);
    try {
      const text = await bridge.exportCsv();
      const outputName = buildOutputName(document.name, 'csv', { suffix: 'export' });
      const outcome = await saveBytesAs(new TextEncoder().encode(text), outputName, 'csv');
      if (outcome === 'cancelled') {
        toastInfo('CSV export cancelled', 'No file was written.');
        return;
      }
      toastSuccess(
        outcome === 'saved' ? 'CSV exported' : 'CSV download started',
        `${outputName}. The first visible worksheet was exported; formatting and formulas are not part of CSV.`,
      );
    } catch (error) {
      console.error(error);
      toastError('Could not export CSV', error instanceof Error ? error.message : 'The workbook could not be read.');
    } finally {
      setExportingCsv(false);
    }
  }, [bridge, state]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 's') {
        event.preventDefault();
        if (!saving) void save();
      }
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'p') {
        event.preventDefault();
        if (!printing) void print();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [print, printing, save, saving]);

  if (!kind) return <EditorMissing title="That editor does not exist.">Choose Word, Sheets or Slides from the home page.</EditorMissing>;

  if (state.status === 'loading') {
    return (
      <div className="grid min-h-dvh place-items-center bg-slate-100">
        <EditorLoading label="Opening your document" />
      </div>
    );
  }

  if (state.status === 'missing') {
    return (
      <EditorMissing title="This document is not stored in this browser">
        {state.name ? `${state.name} was not kept locally, or the recovery copy was cleared. ` : ''}
        Open the original file again to continue. Wepo never uploads or recovers documents from a server.
        <div className="mt-5 flex flex-wrap gap-2">
          <OpenFileButton app={kind} variant={kind === 'word' ? 'word' : kind === 'sheets' ? 'sheets' : 'slides'}>
            Open a file
          </OpenFileButton>
          <Button variant="outline" onClick={() => navigate(appPath(kind))}>
            Back to {APPS[kind].name}
          </Button>
        </div>
      </EditorMissing>
    );
  }

  if (state.status === 'error') {
    return (
      <EditorMissing title="The document could not be opened" tone="error">
        {state.message}
        <div className="mt-5 flex flex-wrap gap-2">
          <Button variant="outline" onClick={() => setRetryKey((key) => key + 1)}>
            Try again
          </Button>
          <OpenFileButton app={kind} variant="outline">
            Open another file
          </OpenFileButton>
        </div>
      </EditorMissing>
    );
  }

  const document = state.document;

  return (
    <div className="flex h-dvh flex-col overflow-hidden bg-slate-100">
      <header className="z-20 flex h-14 shrink-0 items-center gap-3 border-b border-slate-200 bg-white px-3 sm:px-4 no-print">
        <Link to="/" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg hover:bg-slate-100" aria-label="Wepo home">
          <LogoMark size={28} />
        </Link>
        <Link
          to={appPath(kind)}
          className="hidden items-center gap-1.5 rounded-lg px-2 py-1.5 text-sm font-medium text-slate-500 hover:bg-slate-100 hover:text-slate-900 sm:flex"
        >
          <ArrowLeft size={15} /> {APPS[kind].name}
        </Link>
        <div className="flex min-w-0 flex-1 items-center gap-2.5">
          <span
            className={cn(
              'hidden h-8 w-8 shrink-0 items-center justify-center rounded-lg sm:flex',
              kind === 'word' && 'bg-blue-50 text-blue-700',
              kind === 'sheets' && 'bg-emerald-50 text-emerald-700',
              kind === 'slides' && 'bg-orange-50 text-orange-700',
            )}
          >
            <AppIcon kind={kind} size={17} />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-slate-900">{document.name}</p>
            <p className="flex items-center gap-1.5 text-[11px] text-slate-500">
              {dirty ? (
                <>
                  <span className="h-1.5 w-1.5 rounded-full bg-amber-500" /> Unsaved changes
                </>
              ) : lastRecovery ? (
                <>
                  <ShieldCheck size={11} className="text-emerald-600" /> Recovery updated
                </>
              ) : (
                <>Stored in this browser</>
              )}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <Button variant="ghost" size="sm" onClick={() => void print()} loading={printing} className="hidden sm:inline-flex">
            <Printer size={15} /> <span className="hidden lg:inline">Print / PDF</span>
          </Button>
          {kind === 'sheets' && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => void exportCsv()}
              loading={exportingCsv}
              disabled={!bridge?.exportCsv}
              className="hidden sm:inline-flex"
            >
              <FileDown size={15} /> <span className="hidden lg:inline">CSV</span>
            </Button>
          )}
          <Button
            variant={kind === 'word' ? 'word' : kind === 'sheets' ? 'sheets' : 'slides'}
            size="sm"
            onClick={() => void save()}
            loading={saving}
            disabled={!bridge}
          >
            <Save size={15} /> Save a copy
          </Button>
        </div>
      </header>

      {editorError && (
        <div className="flex items-start gap-2 border-b border-amber-200 bg-amber-50 px-4 py-2 text-xs text-amber-900 no-print">
          <AlertTriangle size={14} className="mt-0.5 shrink-0" />
          <span className="flex-1">
            The editor reported: {editorError}. Save a copy before leaving if the document still looks correct.
          </span>
          <button type="button" className="font-semibold underline" onClick={() => setRetryKey((key) => key + 1)}>
            Reload editor
          </button>
        </div>
      )}

      <main className="relative flex min-h-0 flex-1">
        <div className="relative min-h-0 min-w-0 flex-1">
          <EditorErrorBoundary key={`${document.id}-${retryKey}`} onReset={() => setRetryKey((key) => key + 1)}>
            <Suspense fallback={<EditorLoading label={`Loading the ${APPS[kind].name} engine`} />}>
              {kind === 'word' && (
                <WordEditor
                  bytes={document.bytes}
                  fileName={document.name}
                  onReady={handleReady}
                  onDirty={markDirty}
                  onError={handleEditorError}
                />
              )}
              {kind === 'sheets' && (
                <SheetsEditor
                  bytes={document.bytes}
                  fileName={document.name}
                  onReady={handleReady}
                  onDirty={markDirty}
                  onError={handleEditorError}
                />
              )}
              {kind === 'slides' && (
                <SlidesEditor
                  bytes={document.bytes}
                  fileName={document.name}
                  onReady={handleReady}
                  onDirty={markDirty}
                  onError={handleEditorError}
                />
              )}
            </Suspense>
          </EditorErrorBoundary>
          {!bridge && !editorError && (
            <div className="pointer-events-none absolute inset-x-0 bottom-4 flex justify-center">
              <span className="rounded-full border border-slate-200 bg-white/95 px-3 py-1.5 text-xs text-slate-500 shadow-sm">
                <Spinner label="Starting the local engine" />
              </span>
            </div>
          )}
        </div>

        {/*
          Desktop-only sponsor rail. Reserving the column before the engine is
          ready avoids resizing the canvas; the publisher script itself waits
          for the document bridge so WASM startup gets the bandwidth first.
        */}
        <aside
          className="hidden w-[340px] shrink-0 border-l border-slate-200 bg-white px-5 py-4 no-print xl:block"
          aria-label="Sponsored placement"
          data-wepo-editor-rail
        >
          {bridge ? (
            <>
              <DisplayBanner placement="editor-rectangle" size="300x250" allowEditor />
              <p className="mt-3 text-center text-[11px] leading-5 text-slate-500">
                Sponsored placement keeps Wepo free. Your document stays in this tab.
              </p>
            </>
          ) : (
            <div className="h-[250px] w-[300px] rounded-2xl border border-dashed border-slate-200 bg-slate-50/70" aria-hidden />
          )}
        </aside>
      </main>
    </div>
  );
}

function EditorMissing({
  title,
  children,
  tone = 'neutral',
}: {
  title: string;
  children: ReactNode;
  tone?: 'neutral' | 'error';
}) {
  return (
    <div className="grid min-h-dvh place-items-center bg-slate-100 px-4">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-8 shadow-card">
        <span
          className={cn(
            'flex h-11 w-11 items-center justify-center rounded-xl',
            tone === 'error' ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500',
          )}
        >
          <FileWarning size={21} />
        </span>
        <h1 className="mt-4 text-xl font-semibold tracking-tight text-slate-900">{title}</h1>
        <div className="mt-2 text-sm leading-6 text-slate-600">{children}</div>
        <div className="mt-6">
          <Link to="/" className="text-sm font-medium text-blue-700 hover:underline">
            Return to Wepo Office
          </Link>
        </div>
      </div>
    </div>
  );
}

class EditorErrorBoundary extends Component<{ children: ReactNode; onReset: () => void }, { error: Error | null }> {
  state = { error: null as Error | null };

  static getDerivedStateFromError(error: Error) {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('Editor crashed', error, info);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="grid h-full place-items-center p-6">
          <div className="max-w-md rounded-2xl border border-red-200 bg-white p-6 text-center shadow-card">
            <AlertTriangle className="mx-auto text-red-600" size={26} />
            <h2 className="mt-3 text-base font-semibold text-slate-900">The editor engine stopped</h2>
            <p className="mt-1.5 text-sm leading-6 text-slate-600">
              {this.state.error.message || 'An unexpected error occurred while loading the editor.'}
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <Button
                variant="outline"
                onClick={() => {
                  this.setState({ error: null });
                  this.props.onReset();
                }}
              >
                Reload editor
              </Button>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Reload page
              </Button>
            </div>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
