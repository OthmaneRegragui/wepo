import { lazy, Suspense } from 'react';
import { Navigate, Route, Routes } from 'react-router-dom';
import { SiteLayout } from './components/layout/site-layout';
import { EditorLoading } from './components/ui/spinner';
import { DashboardPage } from './pages/dashboard-page';
import { EditorPage } from './pages/editor-page';

const AppLandingPage = lazy(() => import('./pages/app-landing-page').then((m) => ({ default: m.AppLandingPage })));
const PrivacyPage = lazy(() => import('./pages/privacy-page').then((m) => ({ default: m.PrivacyPage })));
const LicensesPage = lazy(() => import('./pages/licenses-page').then((m) => ({ default: m.LicensesPage })));
const CompatibilityPage = lazy(() => import('./pages/compatibility-page').then((m) => ({ default: m.CompatibilityPage })));
const NotFoundPage = lazy(() => import('./pages/not-found-page').then((m) => ({ default: m.NotFoundPage })));

function PageFallback() {
  return (
    <div className="grid min-h-[60vh] place-items-center">
      <EditorLoading label="Loading page" />
    </div>
  );
}

function lazyPage(page: React.ReactNode) {
  return <Suspense fallback={<PageFallback />}>{page}</Suspense>;
}

export default function App() {
  return (
    <Routes>
      <Route element={<SiteLayout />}>
        <Route index element={<DashboardPage />} />
        <Route path="/word" element={lazyPage(<AppLandingPage kind="word" />)} />
        <Route path="/sheets" element={lazyPage(<AppLandingPage kind="sheets" />)} />
        <Route path="/slides" element={lazyPage(<AppLandingPage kind="slides" />)} />
        <Route path="/privacy" element={lazyPage(<PrivacyPage />)} />
        <Route path="/licenses" element={lazyPage(<LicensesPage />)} />
        <Route path="/compatibility" element={lazyPage(<CompatibilityPage />)} />
        <Route path="/404" element={lazyPage(<NotFoundPage />)} />
        <Route path="*" element={<Navigate to="/404" replace />} />
      </Route>
      <Route path="/:kind/edit" element={<EditorPage />} />
    </Routes>
  );
}
