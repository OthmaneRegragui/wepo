import type { ReactNode } from 'react';
import { cn } from '../../lib/utils';
import type { AdStatus } from './ad-loader';

export interface AdSlotProps {
  className?: string;
  label?: string;
  status?: AdStatus;
  children?: ReactNode;
}

/**
 * Shared chrome for an ad placement. The slot itself never loads a script;
 * DisplayBanner/NativeBanner own the loader and report status here.
 */
export function AdSlot({ className, label = 'Advertisement', status = 'idle', children }: AdSlotProps) {
  return (
    <aside
      className={cn(
        'wepo-ad-slot w-full overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-slate-50/70',
        className,
      )}
      aria-label="Advertisement"
      data-wepo-ad-slot={label}
      data-ad-status={status}
    >
      <div className="flex items-center justify-between gap-3 border-b border-slate-200/70 px-4 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</span>
        <span className="text-[10px] text-slate-400">Sponsored</span>
      </div>
      <div className="flex w-full justify-center overflow-hidden">{children}</div>
      {status === 'failed' ? (
        <p className="border-t border-slate-200/70 px-4 py-2 text-center text-[11px] leading-5 text-slate-400">
          Sponsored content could not be loaded. The rest of Wepo works normally.
        </p>
      ) : null}
    </aside>
  );
}
