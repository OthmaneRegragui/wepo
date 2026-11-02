import { useCallback, useEffect, useState } from 'react';
import { PptxEditor, type PptxAsyncEditorApi } from '@betteroffice/pptx-react';
import type { EditorComponentProps } from '../types';
import { asError } from '../types';
import { loadPptxFonts, type PptxFontFaceLike } from '../../lib/fonts';
import { printSlides } from '../../lib/print';
import { EditorLoading } from '../../components/ui/spinner';

export function SlidesEditor({ bytes, fileName, onReady, onDirty, onError }: EditorComponentProps) {
  const [fonts, setFonts] = useState<PptxFontFaceLike[] | null>(null);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    let cancelled = false;
    loadPptxFonts()
      .then((faces) => {
        if (!cancelled) setFonts(faces);
      })
      .catch((error: unknown) => {
        if (!cancelled) onError(asError(error));
      });
    return () => {
      cancelled = true;
    };
  }, [onError]);

  const handleReady = useCallback(
    (api: PptxAsyncEditorApi) => {
      setLoaded(true);
      onReady({
        save: async () => api.save(),
        print: () => printSlides(api, fileName),
      });
      return () => {};
    },
    [fileName, onReady],
  );

  if (!fonts) {
    return (
      <div className="editor-host">
        <EditorLoading label="Loading presentation fonts" />
      </div>
    );
  }

  return (
    <div className="editor-host relative">
      <div className="h-full">
        <PptxEditor
          file={bytes}
          fonts={fonts}
          fileName={fileName}
          downloadOnSave={false}
          onReady={handleReady}
          onDocumentChange={() => onDirty()}
          onError={(error) => onError(asError(error))}
          style={{ height: '100%' }}
        />
      </div>
      {!loaded && (
        <div className="absolute inset-0 z-10 bg-white">
          <EditorLoading label="Preparing the Slides editor" />
        </div>
      )}
    </div>
  );
}
