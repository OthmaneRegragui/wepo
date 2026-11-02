import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { isAdFormatEnabled, isAdPlacementEnabled, isAdSurfaceAllowed } from './ad-config';
import { ensureSocialBar } from './ad-loader';

/**
 * The Social Bar has no React-rendered UI. This component only loads it on an
 * allowed route (home/dashboard) and relies on the module-level loader to keep
 * initialization to once per page session.
 */
export function SocialBar() {
  const { pathname } = useLocation();
  const enabled =
    isAdFormatEnabled('social-bar') &&
    isAdPlacementEnabled('site-social-bar') &&
    isAdSurfaceAllowed(pathname);

  useEffect(() => {
    if (!enabled) return;
    return ensureSocialBar();
  }, [enabled]);

  return null;
}
