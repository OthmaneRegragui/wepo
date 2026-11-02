import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { NativeBanner } from '../ads/NativeBanner';
import { ResponsiveDisplayBanner } from '../ads/DisplayBanner';
import { SiteHeader } from './site-header';
import { SiteFooter } from './site-footer';

function ScrollToTop() {
  const { pathname } = useLocation();
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, [pathname]);
  return null;
}

export function SiteLayout() {
  return (
    <div className="flex min-h-dvh flex-col">
      <ScrollToTop />
      <SiteHeader />
      <section className="border-b border-slate-200/70 bg-white/60 no-print" aria-label="Sponsored placement">
        <div className="container-page flex justify-center py-4">
          <ResponsiveDisplayBanner
            desktopPlacement="site-leaderboard"
            desktopSize="728x90"
            mobilePlacement="site-mobile-banner"
            mobileSize="320x50"
          />
        </div>
      </section>
      <main className="flex-1">
        <Outlet />
      </main>
      <div className="container-page py-8 no-print">
        <div className="mx-auto max-w-3xl">
          <NativeBanner placement="site-native" />
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
