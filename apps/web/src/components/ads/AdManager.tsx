import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { isAdSurfaceAllowed } from './ad-config';
import { installCredentiallessIframePatch } from './ad-loader';
import { SocialBar } from './SocialBar';

/**
 * Route orchestration for persistent ad behaviour. Display/native slots are
 * page components; this manager owns the Social Bar, the COEP iframe bridge,
 * and the global suppression flag that hides third-party overlays on editor,
 * import/export and informational routes.
 */
export function AdManager() {
  const { pathname } = useLocation();
  const allowed = isAdSurfaceAllowed(pathname);

  useEffect(() => {
    const root = document.documentElement;
    if (allowed) {
      root.removeAttribute('data-wepo-ads-suppressed');
    } else {
      root.setAttribute('data-wepo-ads-suppressed', 'true');
    }
  }, [allowed]);

  useEffect(() => {
    if (!allowed) return;
    return installCredentiallessIframePatch();
  }, [allowed]);

  useEffect(
    () => () => {
      document.documentElement.removeAttribute('data-wepo-ads-suppressed');
    },
    [],
  );

  return <SocialBar />;
}
