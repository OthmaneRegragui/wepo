import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  NATIVE_BANNER,
  isAdFormatEnabled,
  isAdPlacementEnabled,
  isAdSurfaceAllowed,
  type AdPlacementId,
} from './ad-config';
import { mountNativeBanner, type AdStatus } from './ad-loader';
import { AdSlot } from './ad-slot';

export interface NativeBannerProps {
  placement?: AdPlacementId;
  className?: string;
  label?: string;
}

/**
 * Adsterra native banner. The script is appended only after the dedicated
 * container with the publisher-provided id is mounted.
 */
export function NativeBanner({ placement = 'home-native', className, label }: NativeBannerProps) {
  const { pathname } = useLocation();
  const enabled =
    isAdFormatEnabled('native-banner') &&
    isAdPlacementEnabled(placement) &&
    isAdSurfaceAllowed(pathname);
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<AdStatus>('idle');

  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;
    return mountNativeBanner(container, setStatus);
  }, [enabled]);

  if (!enabled) return null;

  return (
    <AdSlot className={className} label={label ?? 'Advertisement · Native'} status={status}>
      <div
        ref={containerRef}
        id={NATIVE_BANNER.containerId}
        className="wepo-native-container w-full"
        data-wepo-native-container={NATIVE_BANNER.key}
        style={{ minHeight: 250 }}
      />
    </AdSlot>
  );
}
