import { useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  CheckCircle2,
  Download,
  FilePlus2,
  Info,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import type { AppKind } from '@wepo/core';
import { useSeo } from '../lib/seo';
import { APPS } from '../lib/apps';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { OpenFileButton } from '../components/open-file-button';
import { FileDropZone } from '../components/file-drop-zone';
import { AppIconTile } from '../components/app-icon';
import { PrivacyNotice } from '../components/privacy-notice';
import { AdSlot } from '../components/ads/ad-slot';
import { useDocumentLauncher } from '../hooks/use-document-launcher';
import { cn } from '../lib/utils';

const accentByKind: Record<AppKind, { text: string; soft: string; border: string; button: 'word' | 'sheets' | 'slides' }> = {
  word: { text: 'text-blue-700', soft: 'bg-blue-50', border: 'border-blue-200', button: 'word' },
  sheets: { text: 'text-emerald-700', soft: 'bg-emerald-50', border: 'border-emerald-200', button: 'sheets' },
  slides: { text: 'text-orange-700', soft: 'bg-orange-50', border: 'border-orange-200', button: 'slides' },
};

export function AppLandingPage({ kind }: { kind: AppKind }) {
  const app = APPS[kind];
  const accent = accentByKind[kind];
  const { createBlank, busy } = useDocumentLauncher();
  const jsonLd = useMemo(
    () => ({
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: `${app.name} — Wepo Office`,
      description: app.seoDescription,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Any',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      featureList: app.features,
    }),
    [app],
  );

  useSeo({
    title: app.seoTitle,
    description: app.seoDescription,
    path: `/${app.slug}`,
    jsonLd,
  });

  const sample = `/samples/sample.${kind === 'word' ? 'docx' : kind === 'sheets' ? 'xlsx' : 'pptx'}`;
  const template = `/templates/blank.${kind === 'word' ? 'docx' : kind === 'sheets' ? 'xlsx' : 'pptx'}`;

  return (
    <>
      <section className="border-b border-slate-200/70 bg-gradient-to-b from-white to-slate-50">
        <div className="container-page grid gap-10 py-14 lg:grid-cols-[1.1fr_0.9fr] lg:items-center lg:py-20">
          <div>
            <div className="flex items-center gap-3">
              <AppIconTile kind={kind} size="lg" />
              <Badge tone={kind === 'word' ? 'blue' : kind === 'sheets' ? 'green' : 'orange'} className="bg-white">
                {app.formats.join(' · ')}
              </Badge>
            </div>
            <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl lg:text-5xl">
              {app.name} in your browser.
              <span className={cn('block', accent.text)}>Your file never leaves it.</span>
            </h1>
            <p className="mt-4 max-w-xl text-base leading-7 text-slate-600">{app.description}</p>
            <div className="mt-7 flex flex-col gap-2 sm:flex-row">
              <OpenFileButton app={kind} variant={accent.button} size="lg">
                Open {kind === 'word' ? 'a DOCX' : kind === 'sheets' ? 'a spreadsheet' : 'a PPTX'}
              </OpenFileButton>
              <Button variant="outline" size="lg" onClick={() => void createBlank(kind)} loading={busy}>
                <FilePlus2 size={16} /> Create a blank {app.name.toLowerCase()} file
              </Button>
            </div>
            <p className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-slate-500">
              <span className="inline-flex items-center gap-1">
                <ShieldCheck size={13} className="text-emerald-600" /> No uploads
              </span>
              <span className="inline-flex items-center gap-1">
                <CheckCircle2 size={13} className="text-emerald-600" /> No account
              </span>
              <span className="inline-flex items-center gap-1">
                <Sparkles size={13} className="text-emerald-600" /> No document-processing server
              </span>
            </p>
          </div>
          <div>
            <FileDropZone app={kind} />
            <p className="mt-3 text-center text-xs leading-5 text-slate-500">
              Prefer to look first?{' '}
              <a className="font-medium text-slate-700 underline decoration-slate-300 underline-offset-2" href={sample} download>
                Download the sample {app.formats[0]} file
              </a>{' '}
              and open it here.
            </p>
          </div>
        </div>
      </section>

      <section className="container-page py-14">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.85fr]">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight text-slate-900">What you can do</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
              The {app.name} engine runs as WebAssembly in a worker. The list below is the tested surface, not a
              claim of full Microsoft Office compatibility.
            </p>
            <ul className="mt-6 grid gap-3 sm:grid-cols-2">
              {app.features.map((feature) => (
                <li key={feature} className="flex items-start gap-2.5 rounded-xl border border-slate-200 bg-white p-3.5">
                  <CheckCircle2 size={16} className={cn('mt-0.5 shrink-0', accent.text)} aria-hidden />
                  <span className="text-sm text-slate-700">{feature}</span>
                </li>
              ))}
            </ul>

            <div className={cn('mt-8 rounded-2xl border p-5', accent.border, accent.soft)}>
              <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Info size={16} aria-hidden /> Where this editor stops
              </h3>
              <p className="mt-2 text-sm leading-6 text-slate-700">
                {kind === 'word' &&
                  'Complex fields, tracked-change accept/reject workflows, embedded OLE objects and some floating shapes are approximations. Always keep the original file and inspect the exported copy before relying on it.'}
                {kind === 'sheets' &&
                  'Pivot tables, macros, external data connections and cached formula results are not fully represented. The engine recalculates formulas locally; a formula may show a value in one app and be recalculated when opened in another.'}
                {kind === 'slides' &&
                  'SmartArt, charts, transitions and animations are not fully editable. The print/PDF path omits pictures; export PPTX to keep them. Inspect the exported deck before presenting.'}
                {' '}
                Read the{' '}
                <Link to="/compatibility" className="font-medium underline underline-offset-2">
                  compatibility notes
                </Link>
                .
              </p>
            </div>
          </div>

          <aside className="space-y-5">
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <h2 className="text-base font-semibold text-slate-900">How it stays local</h2>
              <ol className="mt-3 space-y-3 text-sm leading-6 text-slate-600">
                <li>
                  <span className="font-semibold text-slate-900">1. Read locally.</span> The browser File API
                  loads the file into this tab.
                </li>
                <li>
                  <span className="font-semibold text-slate-900">2. Validate locally.</span> Wepo checks the
                  signature, size and ZIP structure before opening it.
                </li>
                <li>
                  <span className="font-semibold text-slate-900">3. Edit locally.</span> A WebAssembly engine
                  opens the document in a worker.
                </li>
                <li>
                  <span className="font-semibold text-slate-900">4. Save a new copy.</span> Your original file
                  is never overwritten. Use the file picker or a download.
                </li>
              </ol>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-card">
              <h2 className="text-base font-semibold text-slate-900">Downloads</h2>
              <div className="mt-3 flex flex-col gap-2">
                <a
                  href={template}
                  download
                  className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  <Download size={15} /> Blank {app.formats[0]} template
                </a>
                <a
                  href={sample}
                  download
                  className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  <Download size={15} /> Sample {app.formats[0]} file
                </a>
                <Link
                  to="/compatibility"
                  className="inline-flex items-center gap-2 text-sm font-medium text-slate-700 hover:text-slate-900"
                >
                  <ArrowRight size={15} /> Tested compatibility
                </Link>
              </div>
            </div>
            <AdSlot />
          </aside>
        </div>
      </section>

      <section className="border-t border-slate-200/70 bg-white py-14">
        <div className="container-page">
          <PrivacyNotice />
          <div className="mt-8 flex flex-col items-start justify-between gap-4 rounded-2xl bg-slate-900 p-6 text-white sm:flex-row sm:items-center sm:p-8">
            <div>
              <h2 className="text-lg font-semibold tracking-tight">Try it with your own file</h2>
              <p className="mt-1 text-sm text-slate-300">
                Nothing is uploaded. Save a new copy when you are done, and keep the original as a backup.
              </p>
            </div>
            <OpenFileButton app={kind} variant={accent.button} size="lg" className="shrink-0">
              Open a file
            </OpenFileButton>
          </div>
        </div>
      </section>
    </>
  );
}
