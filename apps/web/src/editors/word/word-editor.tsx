import { useEffect, useRef, useState } from 'react';
import { DocxEditor, type DocxEditorRef } from '@betteroffice/docx-react';
import '@betteroffice/docx-react/styles.css';
import type { EditorComponentProps } from '../types';
import { asError } from '../types';
import { officeFontProvider } from '../../lib/fonts';
import { EditorLoading } from '../../components/ui/spinner';

export function WordEditor({ bytes, onReady, onDirty, onError }: EditorComponentProps) {
  const ref = useRef<DocxEditorRef>(null);
  const [ready, setReady] = useState(false);
  const [engineReady, setEngineReady] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setReady(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // `DocxEditor` has no explicit "engine is ready" callback. The ref is only
  // safe to use once the worker has laid out the document, so poll the page
  // count before exposing save/print to the shell.
  useEffect(() => {
    if (!ready) return;
    let cancelled = false;
    let timer = 0;
    const check = () => {
      if (cancelled) return;
      let pages = 0;
      try {
        pages = ref.current?.getTotalPages() ?? 0;
      } catch {
        pages = 0;
      }
      if (pages > 0) {
        setEngineReady(true);
        return;
      }
      timer = window.setTimeout(check, 100);
    };
    check();
    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [ready]);

  useEffect(() => {
    if (!ready || !engineReady) return;
    onReady({
      save: async () => {
        const buf = await ref.current?.save();
        if (!buf) throw new Error('The Word engine returned no data to save.');
        return new Uint8Array(buf);
      },
      print: async () => {
        if (ref.current?.print) {
          ref.current.print();
          return;
        }
        if (ref.current?.openPrintPreview) {
          ref.current.openPrintPreview();
          return;
        }
        window.print();
      },
    });
  }, [engineReady, onReady, ready]);

  return (
    <div className="editor-host relative">
      <div className={ready ? 'h-full' : 'hidden'} aria-hidden={!ready}>
        <DocxEditor
          ref={ref}
          file={bytes}
          downloadOnSave={false}
          measurementFontProvider={officeFontProvider}
          onDocumentChange={() => {
            onDirty();
          }}
          onError={(error) => onError(asError(error))}
          style={{ height: '100%' }}
        />
      </div>
      {!engineReady && (
        <div className="absolute inset-0 z-10 bg-slate-50/80">
          <EditorLoading label="Preparing the Word editor" />
        </div>
      )}
    </div>
  );
}
