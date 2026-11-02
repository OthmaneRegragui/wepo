import { useEffect } from 'react';
import { isAdFormatEnabled, isAdPlacementEnabled } from './ad-config';
import { ensureSocialBar } from './ad-loader';

/**
 * The Social Bar has no React-rendered UI. AdManager mounts this component once
 * for the whole application shell, so it is available on every route, including
 * direct links into an editor. The module-level loader guarantees a single
 * script for the lifetime of the document.
 */
export function SocialBar() {
  const enabled = isAdFormatEnabled('social-bar') && isAdPlacementEnabled('site-social-bar');

  useEffect(() => {
    if (!enabled) return;
    return ensureSocialBar();
  }, [enabled]);

  return null;
}
