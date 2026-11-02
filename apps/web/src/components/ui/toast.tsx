import { Button } from '../ui/button';
import { useToastStore } from '../../stores/toast-store';
import { cn } from '../../lib/utils';
import { CheckCircle2, Info, X, XCircle } from 'lucide-react';

export function ToastViewport() {
  const items = useToastStore((s) => s.items);
  const dismiss = useToastStore((s) => s.dismiss);
  return (
    <div
      className="pointer-events-none fixed inset-x-0 bottom-0 z-[100] flex flex-col items-center gap-2 p-4 sm:items-end"
      role="region"
      aria-live="polite"
      aria-label="Notifications"
    >
      {items.map((item) => (
        <div
          key={item.id}
          className={cn(
            'pointer-events-auto flex w-full max-w-sm animate-slide-up items-start gap-3 rounded-xl border bg-white p-4 shadow-float',
            item.tone === 'error' && 'border-red-200',
            item.tone === 'success' && 'border-emerald-200',
          )}
        >
          <span
            className={cn(
              'mt-0.5 shrink-0',
              item.tone === 'error' && 'text-red-600',
              item.tone === 'success' && 'text-emerald-600',
              item.tone === 'info' && 'text-blue-600',
            )}
            aria-hidden
          >
            {item.tone === 'error' ? <XCircle size={18} /> : item.tone === 'success' ? <CheckCircle2 size={18} /> : <Info size={18} />}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-slate-900">{item.title}</p>
            {item.description && <p className="mt-1 text-sm leading-5 text-slate-600">{item.description}</p>}
          </div>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => dismiss(item.id)} aria-label="Dismiss notification">
            <X size={16} />
          </Button>
        </div>
      ))}
    </div>
  );
}
