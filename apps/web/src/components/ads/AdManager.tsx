import { useEffect } from 'react';
import { adConfig } from './ad-config';
import { installCredentiallessIframePatch } from './ad-loader';
import { SocialBar } from './SocialBar';

/**
 * Global advertising lifecycle. The Social Bar is mounted here, outside the
 * routed layouts, so direct URL access and SPA transitions share one instance.
 * Page layouts own their native/display containers.
 */
export function AdManager() {
  useEffect(() => {
    if (!adConfig.enabled) return;
    return installCredentiallessIframePatch();
  }, []);

  return <SocialBar />;
}
