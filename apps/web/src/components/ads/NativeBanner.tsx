import { useEffect, useRef, useState } from 'react';
import { isAdFormatEnabled, isAdPlacementEnabled, type AdPlacementId } from './ad-config';
import { attachNativeBanner, type AdStatus } from './ad-loader';
import { AdSlot } from './ad-slot';

export interface NativeBannerProps {
  placement?: AdPlacementId;
  className?: string;
  label?: string;
}

/**
 * Adsterra native banner. The loader owns a single publisher container and
 * moves that live container into whichever page slot is active. Moving the
 * existing DOM (instead of re-running the script) is what keeps a filled banner
 * alive across SPA route changes without duplicate scripts.
 */
export function NativeBanner({ placement = 'site-native', className, label }: NativeBannerProps) {
  const enabled = isAdFormatEnabled('native-banner') && isAdPlacementEnabled(placement);
  const slotRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<AdStatus>('idle');

  useEffect(() => {
    if (!enabled) return;
    const slot = slotRef.current;
    if (!slot) return;
    return attachNativeBanner(slot, setStatus);
  }, [enabled, placement]);

  if (!enabled) return null;

  return (
    <AdSlot className={className} label={label ?? 'Advertisement · Native'} status={status}>
      <div
        ref={slotRef}
        className="wepo-native-slot w-full"
        data-wepo-native-slot={placement}
        style={{ minHeight: 250 }}
      />
    </AdSlot>
  );
}
