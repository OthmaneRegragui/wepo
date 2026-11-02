import { LockKeyhole, ShieldCheck, WifiOff } from 'lucide-react';
import { Badge } from './ui/badge';

export function PrivacyNotice({ compact = false }: { compact?: boolean }) {
  if (compact) {
    return (
      <Badge tone="green" className="gap-1.5">
        <ShieldCheck size={13} aria-hidden />
        Files stay on this device
      </Badge>
    );
  }
  return (
    <div className="rounded-2xl border border-emerald-200/80 bg-emerald-50/60 p-5 sm:p-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start">
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-emerald-700 shadow-sm ring-1 ring-emerald-100">
          <LockKeyhole size={20} aria-hidden />
        </span>
        <div>
          <h2 className="text-sm font-semibold text-slate-900">Private by architecture, not by promise</h2>
          <p className="mt-1.5 text-sm leading-6 text-slate-600">
            Wepo has no document-processing server. Files you open are read with the browser File API and
            edited with WebAssembly inside this tab. They are never uploaded, and document contents are never
            sent to analytics or placed in a URL.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            <Badge tone="green" className="gap-1.5 bg-white/80">
              <WifiOff size={12} aria-hidden /> Works offline after loading
            </Badge>
            <Badge tone="green" className="gap-1.5 bg-white/80">
              <ShieldCheck size={12} aria-hidden /> No account required
            </Badge>
          </div>
        </div>
      </div>
    </div>
  );
}
