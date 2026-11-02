import { cn } from '../../lib/utils';
import { Loader2 } from 'lucide-react';

export function Spinner({ className, label = 'Loading' }: { className?: string; label?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-2 text-sm text-slate-500', className)} role="status">
      <Loader2 className="animate-spin" size={16} aria-hidden />
      <span>{label}</span>
    </span>
  );
}

export function EditorLoading({ label }: { label: string }) {
  return (
    <div className="editor-loading" role="status" aria-live="polite">
      <div className="flex max-w-sm flex-col items-center gap-3 text-center">
        <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-slate-100">
          <Loader2 className="animate-spin text-slate-500" size={22} aria-hidden />
        </div>
        <p className="text-sm font-medium text-slate-700">{label}</p>
        <p className="text-xs leading-5 text-slate-500">
          The editor engine is loaded on demand and runs only in this browser tab.
        </p>
      </div>
    </div>
  );
}
