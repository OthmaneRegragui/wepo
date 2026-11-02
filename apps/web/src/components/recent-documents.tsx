import { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Clock3, FileWarning, Trash2 } from 'lucide-react';
import type { RecentDocument } from '@wepo/core';
import { formatBytes } from '@wepo/core';
import { useRecentDocuments } from '../hooks/use-recent-documents';
import { useDocumentLauncher } from '../hooks/use-document-launcher';
import { APPS } from '../lib/apps';
import { AppIconTile } from './app-icon';
import { Button } from './ui/button';
import { Modal } from './ui/modal';
import { cn } from '../lib/utils';

function relativeTime(timestamp: number): string {
  const delta = Date.now() - timestamp;
  const minutes = Math.round(delta / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes} min ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours} hr ago`;
  const days = Math.round(hours / 24);
  if (days < 30) return `${days} day${days === 1 ? '' : 's'} ago`;
  return new Date(timestamp).toLocaleDateString();
}

export function RecentDocuments({ compact = false }: { compact?: boolean }) {
  const { documents, loading, error, remove } = useRecentDocuments(compact ? 4 : 8);
  const { openRecent } = useDocumentLauncher();
  const [pendingDelete, setPendingDelete] = useState<RecentDocument | null>(null);
  const shown = useMemo(() => documents.slice(0, compact ? 4 : 8), [compact, documents]);

  return (
    <section id="recent" className="scroll-mt-24">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold tracking-tight text-slate-900">Recent documents</h2>
          <p className="mt-1 text-sm text-slate-600">Recovery copies stored only in this browser. Clear them whenever you like.</p>
        </div>
        {documents.length > 0 && (
          <span className="hidden text-xs text-slate-500 sm:block">
            {documents.length} stored ·{' '}
            <Link to="/privacy" className="underline decoration-slate-300 underline-offset-2 hover:text-slate-700">
              how this works
            </Link>
          </span>
        )}
      </div>

      <div className="mt-4 overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-card">
        {loading ? (
          <div className="space-y-3 p-4">
            {[0, 1, 2].map((key) => (
              <div key={key} className="h-14 animate-pulse rounded-xl bg-slate-100" />
            ))}
          </div>
        ) : error ? (
          <p className="p-6 text-sm text-slate-600">{error}</p>
        ) : shown.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-12 text-center">
            <Clock3 size={22} className="text-slate-400" />
            <p className="text-sm font-medium text-slate-700">No documents yet</p>
            <p className="max-w-sm text-xs leading-5 text-slate-500">
              Open a file above. Wepo keeps a local recovery copy so a refresh does not lose your work.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-slate-100">
            {shown.map((document) => {
              const app = APPS[document.kind];
              return (
                <li key={document.id} className="flex items-center gap-2 px-2 py-1.5 sm:px-3">
                  <button
                    type="button"
                    className="flex min-w-0 flex-1 items-center gap-3 rounded-xl px-2 py-2 text-left transition-colors hover:bg-slate-50"
                    onClick={() => void openRecent(document)}
                  >
                    <AppIconTile kind={document.kind} size="sm" />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium text-slate-900">{document.name}</span>
                      <span className={cn('mt-0.5 flex flex-wrap items-center gap-x-1.5 text-xs', document.hasBytes ? 'text-slate-500' : 'text-amber-700')}>
                        <span>{app.name}</span>
                        <span aria-hidden>·</span>
                        <span>{document.format.toUpperCase()}</span>
                        <span aria-hidden>·</span>
                        <span>{formatBytes(document.size)}</span>
                        <span aria-hidden>·</span>
                        <span>{relativeTime(document.updatedAt)}</span>
                        {!document.hasBytes && (
                          <span className="inline-flex items-center gap-1 font-medium">
                            <FileWarning size={11} /> data not stored
                          </span>
                        )}
                      </span>
                    </span>
                  </button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0 text-slate-400 hover:text-red-600"
                    aria-label={`Delete local copy of ${document.name}`}
                    onClick={() => setPendingDelete(document)}
                  >
                    <Trash2 size={15} />
                  </Button>
                </li>
              );
            })}
          </ul>
        )}
      </div>

      <Modal
        open={pendingDelete !== null}
        onOpenChange={(open) => {
          if (!open) setPendingDelete(null);
        }}
        title="Delete this local copy?"
        description={
          pendingDelete
            ? `${pendingDelete.name} will be removed from this browser. Any exported file on your disk is unaffected.`
            : undefined
        }
        footer={
          <>
            <Button variant="outline" onClick={() => setPendingDelete(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => {
                if (!pendingDelete) return;
                void remove(pendingDelete.id);
                setPendingDelete(null);
              }}
            >
              Delete local copy
            </Button>
          </>
        }
      >
        <p className="text-sm leading-6 text-slate-600">
          This cannot be undone. To work on the document again, open the original file from your device.
        </p>
      </Modal>
    </section>
  );
}
