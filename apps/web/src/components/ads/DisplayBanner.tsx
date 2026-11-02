import { useEffect, useRef, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { useMediaQuery } from '../../hooks/use-media-query';
import {
  DISPLAY_BANNERS,
  isAdFormatEnabled,
  isAdPlacementEnabled,
  isAdRoute,
  isEditorRoute,
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
  /** Opt a dedicated placement into `/:kind/edit` routes (editor side rail). */
  allowEditor?: boolean;
}

/**
 * Classic Adsterra display banner. It renders a dedicated container at the
 * exact publisher dimensions and delegates script sequencing to ad-loader.
 */
export function DisplayBanner({ placement, size, className, label, allowEditor = false }: DisplayBannerProps) {
  const { pathname } = useLocation();
  const config = DISPLAY_BANNERS[size];
  const routeEligible = isAdRoute(pathname) || (allowEditor && isEditorRoute(pathname));
  const enabled =
    isAdFormatEnabled('display-banner') &&
    isAdPlacementEnabled(placement) &&
    routeEligible;
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

export interface ResponsiveDisplayBannerProps {
  desktopPlacement: AdPlacementId;
  desktopSize: DisplayBannerSize;
  mobilePlacement: AdPlacementId;
  mobileSize: DisplayBannerSize;
  /** CSS media query that selects the desktop size. */
  breakpoint?: string;
  className?: string;
  label?: string;
}

/**
 * Route-level responsive placement. The media query is resolved before the
 * banner mounts, so only one publisher script and one size ever exist.
 */
export function ResponsiveDisplayBanner({
  desktopPlacement,
  desktopSize,
  mobilePlacement,
  mobileSize,
  breakpoint = '(min-width: 768px)',
  className,
  label,
}: ResponsiveDisplayBannerProps) {
  const desktop = useMediaQuery(breakpoint);

  return desktop ? (
    <DisplayBanner placement={desktopPlacement} size={desktopSize} className={className} label={label} />
  ) : (
    <DisplayBanner placement={mobilePlacement} size={mobileSize} className={className} label={label} />
  );
}
