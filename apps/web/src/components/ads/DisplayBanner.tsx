import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import {
  DISPLAY_BANNERS,
  isAdFormatEnabled,
  isAdPlacementEnabled,
  isAdRoute,
  type AdPlacementId,
  type DisplayBannerSize,
} from './ad-config';
import { mountDisplayBanner, type AdStatus } from './ad-loader';
import { AdSlot } from './ad-slot';

export interface DisplayBannerProps {
  placement: AdPlacementId;
  size: DisplayBannerSize;
  className?: string;
  label?: string;
}

/**
 * Classic Adsterra display banner. It renders a dedicated container at the
 * exact publisher dimensions and delegates script sequencing to ad-loader.
 */
export function DisplayBanner({ placement, size, className, label }: DisplayBannerProps) {
  const { pathname } = useLocation();
  const config = DISPLAY_BANNERS[size];
  const enabled =
    isAdFormatEnabled('display-banner') &&
    isAdPlacementEnabled(placement) &&
    isAdRoute(pathname);
  const containerRef = useRef<HTMLDivElement>(null);
  const [status, setStatus] = useState<AdStatus>('idle');

  useEffect(() => {
    if (!enabled) return;
    const container = containerRef.current;
    if (!container) return;
    return mountDisplayBanner(config, container, setStatus);
  }, [config, enabled]);

  if (!enabled) return null;

  return (
    <AdSlot
      className={className}
      label={label ?? `Advertisement · ${config.width} × ${config.height}`}
      status={status}
    >
      <div
        ref={containerRef}
        className="wepo-ad-container"
        data-wepo-ad-size={config.size}
        style={{ width: config.width, height: config.height, maxWidth: '100%' }}
      />
    </AdSlot>
  );
}
