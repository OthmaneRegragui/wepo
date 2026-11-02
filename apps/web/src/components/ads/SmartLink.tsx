import { ExternalLink, Gift } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import {
  SMARTLINK,
  isAdFormatEnabled,
  isAdPlacementEnabled,
  isAdSurfaceAllowed,
  type AdPlacementId,
} from './ad-config';
import { cn } from '../../lib/utils';

export interface SponsoredOffersProps {
  placement?: AdPlacementId;
  className?: string;
}

/**
 * The Adsterra smartlink is a normal, clearly labelled sponsored link. It is
 * never used for an essential action and always opens in a new tab.
 */
export function SponsoredOffers({ placement = 'home-smartlink', className }: SponsoredOffersProps) {
  const { pathname } = useLocation();
  const enabled =
    isAdFormatEnabled('smartlink') &&
    isAdPlacementEnabled(placement) &&
    isAdSurfaceAllowed(pathname);

  if (!enabled) return null;

  return (
    <aside
      className={cn(
        'wepo-ad-slot rounded-2xl border border-slate-200 bg-white p-5 shadow-card',
        className,
      )}
      data-wepo-ad-slot="Sponsored offers"
      aria-label="Sponsored offers"
    >
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-50 text-amber-700 ring-1 ring-amber-100">
            <Gift size={19} aria-hidden />
          </span>
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-slate-400">Sponsored</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">Offers from our advertising partner</p>
            <p className="mt-1 text-sm leading-6 text-slate-600">
              A paid link supplied by Adsterra. It opens in a new tab and is not required to use Wepo.
            </p>
          </div>
        </div>
        <a
          href={SMARTLINK.url}
          target="_blank"
          rel="nofollow sponsored noopener noreferrer"
          className="inline-flex shrink-0 items-center justify-center gap-1.5 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
          data-wepo-smartlink
        >
          View sponsored offers <ExternalLink size={14} aria-hidden />
        </a>
      </div>
    </aside>
  );
}

export const SmartLink = SponsoredOffers;
