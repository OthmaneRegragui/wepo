import { useEffect, useRef } from 'react';
import { cn } from '../../lib/utils';

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

export interface AdSlotProps {
  slot?: string;
  format?: 'auto' | 'rectangle' | 'horizontal';
  className?: string;
  label?: string;
}

/**
 * Advertisement placement used only on informational pages. The editor routes
 * never render this component. Without a configured publisher and slot, the
 * space stays an honest placeholder instead of loading a third-party script.
 */
export function AdSlot({ slot, format = 'auto', className, label = 'Advertisement' }: AdSlotProps) {
  const client = import.meta.env.VITE_ADSENSE_CLIENT as string | undefined;
  const configuredSlot = slot ?? (import.meta.env.VITE_ADSENSE_SLOT as string | undefined);
  const insRef = useRef<HTMLModElement>(null);
  const enabled = Boolean(client && configuredSlot);

  useEffect(() => {
    if (!enabled) return;
    const scriptId = 'wepo-adsense';
    if (!document.getElementById(scriptId)) {
      const script = document.createElement('script');
      script.id = scriptId;
      script.async = true;
      script.src = `https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${encodeURIComponent(client!)}`;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }
    try {
      window.adsbygoogle = window.adsbygoogle ?? [];
      window.adsbygoogle.push({});
    } catch {
      // The slot stays empty if an ad blocker prevents the script.
    }
  }, [enabled, client]);

  return (
    <aside
      className={cn('overflow-hidden rounded-2xl border border-dashed border-slate-200 bg-slate-50/60', className)}
      aria-label="Advertisement"
      data-ad-slot={enabled ? configuredSlot : 'placeholder'}
    >
      <div className="flex items-center justify-between border-b border-slate-200/70 px-4 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">{label}</span>
        <span className="text-[10px] text-slate-400">Does not run in editors</span>
      </div>
      {enabled ? (
        <ins
          ref={insRef}
          className="adsbygoogle block"
          style={{ display: 'block' }}
          data-ad-client={client}
          data-ad-slot={configuredSlot}
          data-ad-format={format}
          data-full-width-responsive="true"
        />
      ) : (
        <div className="flex min-h-[90px] items-center justify-center p-6 text-center text-xs leading-5 text-slate-400">
          Reserved sponsor space. No advertising script is loaded unless the deployment configures one.
        </div>
      )}
    </aside>
  );
}
