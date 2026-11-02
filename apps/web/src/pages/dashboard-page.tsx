import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, FilePlus2, Gauge, HardDrive, LockKeyhole, Sparkles } from 'lucide-react';
import { useSeo, softwareApplicationJsonLd } from '../lib/seo';
import { APP_LIST, SITE } from '../lib/apps';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { OpenFileButton } from '../components/open-file-button';
import { FileDropZone } from '../components/file-drop-zone';
import { AppIconTile } from '../components/app-icon';
import { PrivacyNotice } from '../components/privacy-notice';
import { RecentDocuments } from '../components/recent-documents';
import { DisplayBanner } from '../components/ads/DisplayBanner';
import { NativeBanner } from '../components/ads/NativeBanner';
import { SponsoredOffers } from '../components/ads/SmartLink';
import { useDocumentLauncher } from '../hooks/use-document-launcher';
import { useMediaQuery } from '../hooks/use-media-query';
import { cn } from '../lib/utils';

export function DashboardPage() {
  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@graph': [
        softwareApplicationJsonLd(SITE.name, SITE.description),
        {
          '@type': 'WebSite',
          name: SITE.name,
          url: SITE.url,
          description: SITE.description,
        },
      ],
    }),
    [],
  );
  useSeo({
    title: 'Wepo Office — Edit Word, Excel and PowerPoint files in your browser',
    description:
      'A private browser office suite for DOCX, XLSX, CSV and PPTX files. Edit with WebAssembly, keep files on your device, and export new copies. No account, no uploads.',
    path: '/',
    jsonLd,
  });

  const { createBlank, busy } = useDocumentLauncher();
  const desktop = useMediaQuery('(min-width: 1024px)');
  const wideDesktop = useMediaQuery('(min-width: 1280px)');
  const tabletUp = useMediaQuery('(min-width: 640px)');

  return (
    <>
      <section className="relative overflow-hidden border-b border-slate-200/70 bg-gradient-to-b from-white via-slate-50 to-slate-100/70">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.35]"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 10%, #bfdbfe 0, transparent 28%), radial-gradient(circle at 85% 0%, #bbf7d0 0, transparent 24%), radial-gradient(circle at 70% 55%, #fed7aa 0, transparent 22%)',
          }}
          aria-hidden
        />
        <div className="container-page relative py-16 sm:py-20 lg:py-24">
          <div className="mx-auto max-w-3xl text-center">
            <Badge tone="green" className="gap-1.5 bg-white/80 px-3 py-1">
              <LockKeyhole size={13} aria-hidden /> No uploads. No account. No server-side documents.
            </Badge>
            <h1 className="mt-5 text-4xl font-semibold tracking-tight text-slate-900 sm:text-5xl lg:text-6xl">
              Your office suite,
              <span className="block bg-gradient-to-r from-blue-600 via-emerald-600 to-orange-500 bg-clip-text text-transparent">
                right here in the browser.
              </span>
            </h1>
            <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-slate-600 sm:text-lg">
              Open real Word, Excel and PowerPoint files, edit them locally with WebAssembly, and save a new
              copy. Wepo has no document-processing backend, so your files never leave this device.
            </p>
            <div className="mt-7 flex flex-col items-center justify-center gap-2 sm:flex-row">
              <OpenFileButton size="lg" className="w-full sm:w-auto">
                Open a document
              </OpenFileButton>
              <Button variant="outline" size="lg" className="w-full sm:w-auto" onClick={() => void createBlank('word')} loading={busy}>
                <FilePlus2 size={17} /> Create a blank document
              </Button>
            </div>
            <p className="mt-3 text-xs text-slate-500">DOCX · XLSX · CSV · PPTX — up to 100 MB per file</p>
          </div>

          <div className="mx-auto mt-10 max-w-3xl">
            <FileDropZone />
          </div>
        </div>
      </section>

      <section className="border-b border-slate-200/70 bg-white/60 py-6" aria-label="Sponsored placement">
        <div className="container-page flex justify-center">
          {desktop ? (
            <DisplayBanner placement="home-leaderboard" size="728x90" />
          ) : (
            <DisplayBanner placement="home-mobile-banner" size="320x50" />
          )}
        </div>
      </section>

      <section className="container-page py-14 sm:py-16">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">Three editors. One private workspace.</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              Each engine is loaded only when you open that kind of file, so the home page stays fast and memory
              stays under your control.
            </p>
          </div>
          <p className="text-xs font-medium uppercase tracking-wider text-slate-400">Word · Sheets · Slides</p>
        </div>

        <div className="mt-7 grid gap-5 lg:grid-cols-3">
          {APP_LIST.map((app) => (
            <article
              key={app.kind}
              className="group flex flex-col rounded-2xl border border-slate-200/80 bg-white p-6 shadow-card transition-shadow hover:shadow-float"
            >
              <div className="flex items-start justify-between">
                <AppIconTile kind={app.kind} size="lg" />
                <Badge
                  tone={app.kind === 'word' ? 'blue' : app.kind === 'sheets' ? 'green' : 'orange'}
                  className="bg-white"
                >
                  {app.formats.join(' · ')}
                </Badge>
              </div>
              <h3 className="mt-5 text-lg font-semibold tracking-tight text-slate-900">{app.name}</h3>
              <p className="mt-1 text-sm font-medium text-slate-700">{app.tagline}</p>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-600">{app.description}</p>
              <div className="mt-6 flex flex-wrap gap-2">
                <OpenFileButton
                  app={app.kind}
                  variant={app.kind === 'word' ? 'word' : app.kind === 'sheets' ? 'sheets' : 'slides'}
                  size="sm"
                >
                  Open {app.name === 'Sheets' ? 'a sheet' : app.name === 'Slides' ? 'a deck' : 'a document'}
                </OpenFileButton>
                <Button variant="outline" size="sm" onClick={() => void createBlank(app.kind)} loading={busy}>
                  <FilePlus2 size={14} /> New blank
                </Button>
                <Link
                  to={`/${app.slug}`}
                  className={cn(
                    'ml-auto inline-flex items-center gap-1 self-center text-xs font-semibold',
                    app.kind === 'word' ? 'text-blue-700' : app.kind === 'sheets' ? 'text-emerald-700' : 'text-orange-700',
                  )}
                >
                  Learn more <ArrowRight size={13} />
                </Link>
              </div>
            </article>
          ))}
        </div>

        {tabletUp ? (
          <div className="mt-9 flex justify-center">
            <DisplayBanner placement="dashboard-banner" size="468x60" />
          </div>
        ) : null}
      </section>

      <section className="border-y border-slate-200/70 bg-slate-50/60 py-8" aria-label="Sponsored native placement">
        <div className="container-page">
          <NativeBanner />
        </div>
      </section>

      <section className="border-y border-slate-200/70 bg-white/70 py-14">
        <div className="container-page grid gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:items-start">
          <div className="space-y-8">
            <RecentDocuments />
            <PrivacyNotice />
            <div className="flex justify-center">
              <DisplayBanner placement="home-rectangle" size="300x250" />
            </div>
          </div>
          <div className="space-y-4">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Built for files that matter</h2>
            <ul className="space-y-4">
              {[
                {
                  icon: HardDrive,
                  title: 'Local by construction',
                  body: 'Files are read with the File API and edited by WebAssembly in this tab. There is no upload endpoint to call.',
                },
                {
                  icon: Gauge,
                  title: 'Engines on demand',
                  body: 'The Word, Sheets and Slides engines are separate lazy chunks. Opening a spreadsheet does not download the presentation engine.',
                },
                {
                  icon: Sparkles,
                  title: 'Format-aware save',
                  body: 'Saving writes a new file name and never replaces the original. Use the File System Access picker or a normal download.',
                },
              ].map((item) => (
                <li key={item.title} className="flex gap-3">
                  <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-slate-100 text-slate-600">
                    <item.icon size={17} aria-hidden />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                    <p className="mt-1 text-sm leading-6 text-slate-600">{item.body}</p>
                  </div>
                </li>
              ))}
            </ul>
            {desktop ? (
              <div className="flex justify-center pt-2">
                <DisplayBanner
                  key={wideDesktop ? 'sidebar-160x600' : 'sidebar-160x300'}
                  placement="home-sidebar"
                  size={wideDesktop ? '160x600' : '160x300'}
                />
              </div>
            ) : null}
          </div>
        </div>
      </section>

      <section className="container-page py-8">
        <SponsoredOffers />
      </section>

      <section className="container-page py-14">
        <div className="rounded-3xl border border-slate-200 bg-slate-900 p-8 text-white sm:p-10">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-400">Ready when you are</p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight sm:text-3xl">No sign-up. No trial. No “upgrade to export”.</h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Wepo is an open-source browser office suite. The only limits are your device and the formats the
                engines can faithfully round-trip; the compatibility page explains exactly where those lines are.
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2 sm:flex-row">
              <OpenFileButton size="lg" className="bg-white text-slate-900 hover:bg-slate-100">
                Open a file
              </OpenFileButton>
              <Link
                to="/compatibility"
                className="inline-flex h-11 items-center justify-center rounded-lg border border-slate-700 px-5 text-sm font-medium text-slate-200 hover:bg-slate-800"
              >
                Compatibility details
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}
