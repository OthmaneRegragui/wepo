import { Link } from 'react-router-dom';
import { Database, EyeOff, FileWarning, LockKeyhole, ServerOff, Trash2 } from 'lucide-react';
import { useSeo } from '../lib/seo';
import { SITE } from '../lib/apps';
import { Badge } from '../components/ui/badge';
import { PrivacyNotice } from '../components/privacy-notice';

const sections = [
  {
    title: 'The short version',
    body: [
      'Wepo is a static website. There is no document-processing backend, no account system and no database of user files. Documents you open are read and edited inside your browser tab. They are never uploaded to Wepo or to a document API.',
      'The application does make ordinary web requests for the page, JavaScript, WebAssembly, fonts and blank templates. Those requests do not contain your document contents or file names.',
    ],
  },
  {
    title: 'What is stored on your device',
    body: [
      'Wepo uses IndexedDB to keep local recovery copies of documents you open or create. A recovery record contains the file name, format, kind, size, timestamps and the document bytes. This lets a refresh reopen your work and powers the Recent documents list.',
      'Up to 25 documents are kept, with a 50 MB per-document cap and a 300 MB total budget. Older entries are evicted first. You can delete any recovery copy from the Recent documents list. Clearing site data in your browser removes all of it.',
      'Wepo does not use localStorage or cookies for document data. The only localStorage use is browser-level behaviour such as remembering a dismissed notice; document bytes are never placed there.',
    ],
  },
  {
    title: 'What is never collected',
    body: [
      'Wepo does not send document contents, file names, document metadata or extracted text to any analytics service. There is no product analytics script in the application, no session recording, and no advertising script on editor routes.',
      'The application does not put document names in URLs. Editor URLs use a random local identifier, for example /word/edit?doc=<uuid>, which is not derived from the file name.',
    ],
  },
  {
    title: 'Hosting logs',
    body: [
      'Like any static website, the hosting provider may keep standard request logs (IP address, user agent, requested path, timestamp) for security and operations. Those logs describe page and asset requests, not the contents of documents you open. Wepo does not configure any document upload endpoint that could appear in those logs.',
    ],
  },
  {
    title: 'Advertising and third parties',
    body: [
      'Every content page (including the homepage, Word, Sheets and Slides landing pages, and informational pages) displays a responsive banner supplied by Adsterra. A native banner is shown in the shared page layout, and the homepage adds extra dashboard, rectangle and sidebar placements plus a clearly labelled sponsored smartlink. The app landing pages also include a content rectangle. A social bar is initialised once per page load across the site. These placements are part of this build and can be disabled at build time with the VITE_ADS_* flags documented in the README.',
      'Adsterra and its advertising partners are third parties. Their scripts may set cookies, local storage or device identifiers and may request creatives and tracking pixels from their own domains under their own policies. Wepo does not pass document contents, file names or extracted text to those scripts; the ad system has no access to the document store.',
      'Display and native advertising slots are never rendered inside the Word, Sheets or Slides editors, print/PDF flows, file import/export flows, toolbars, dialogs or document canvases. The Social Bar is a separate global publisher format and may remain visible while an editor is open, but it does not cover the editing surface and has no access to document data. You can block or limit advertising with your browser or an extension; Wepo does not bypass those controls.',
    ],
  },
  {
    title: 'Printing and PDF export',
    body: [
      'Print and PDF export use the browser print dialog. The rendered pages are produced locally in the tab. Nothing is sent to a PDF conversion service. Whether the browser stores a temporary print preview is controlled by your browser, not by Wepo.',
    ],
  },
  {
    title: 'Children and personal data',
    body: [
      'Wepo is a general-purpose document editor and is not directed at children under 13. Because documents stay on the device, Wepo does not knowingly collect personal data from anyone. If you use Wepo on a shared device, remove local recovery copies before handing the device to someone else.',
    ],
  },
] as const;

export function PrivacyPage() {
  useSeo({
    title: 'Privacy — Wepo Office',
    description:
      'How Wepo keeps documents on your device: local IndexedDB recovery, no uploads, no document analytics and no display or native ads inside the editor.',
    path: '/privacy',
  });

  return (
    <div className="container-page py-12 sm:py-16">
      <header className="max-w-3xl">
        <Badge tone="green" className="gap-1.5">
          <LockKeyhole size={13} aria-hidden /> Local-first by architecture
        </Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Privacy at Wepo</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          This page explains exactly what the application stores, what leaves your device and what does not. It
          describes the open-source build in this repository; a deployment may add its own hosting or advertising
          configuration, which should be disclosed by that deployment.
        </p>
        <p className="mt-2 text-xs text-slate-500">Last updated: 2 November 2026</p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.2fr_0.8fr] lg:items-start">
        <div className="prose-page max-w-none">
          {sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              {section.body.map((paragraph) => (
                <p key={paragraph}>{paragraph}</p>
              ))}
            </section>
          ))}

          <h2>Your controls</h2>
          <ul>
            <li>Delete an individual recovery copy from the Recent documents list on the home page.</li>
            <li>Clear all Wepo data with your browser's “clear site data” control for this origin.</li>
            <li>Use a private/incognito window if you do not want any recovery copy to outlive the session.</li>
            <li>Keep the original file. Wepo always writes a new exported copy and never overwrites the source.</li>
          </ul>

          <h2>Contact</h2>
          <p>
            For privacy questions about this build, contact <a href={`mailto:${SITE.email}`}>{SITE.email}</a>. For
            security reports, please describe the affected route and browser version; do not attach a confidential
            document.
          </p>
        </div>

        <aside className="space-y-5">
          <PrivacyNotice />
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Database size={16} aria-hidden /> Local storage, in numbers
            </h2>
            <dl className="mt-3 space-y-2 text-sm">
              {[
                ['Database', 'IndexedDB “wepo-office”'],
                ['Maximum documents', '25'],
                ['Per-document cap', '50 MB'],
                ['Total budget', '300 MB'],
                ['Cookies for documents', 'None'],
              ].map(([label, value]) => (
                <div key={label} className="flex justify-between gap-4 border-b border-slate-100 pb-2 last:border-0">
                  <dt className="text-slate-500">{label}</dt>
                  <dd className="text-right font-medium text-slate-800">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-900">
              <Trash2 size={16} aria-hidden /> How to remove local copies
            </h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Open the home page, find Recent documents, and choose the bin icon next to a file. The confirmation
              dialog removes the IndexedDB record; your exported file on disk is not touched.
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              To remove everything at once, use your browser's site-data settings for this origin.
            </p>
          </div>
        </aside>
      </div>

      <div className="mt-12 rounded-2xl border border-slate-200 bg-slate-50 p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-start">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-white text-slate-600 shadow-sm">
            <ServerOff size={19} aria-hidden />
          </span>
          <div className="text-sm leading-6 text-slate-600">
            <p className="font-semibold text-slate-900">No document server exists to query.</p>
            <p className="mt-1">
              The production deployment is a set of static files. There is no upload route, no conversion API and no
              database of documents. If a deployment adds one, it is no longer this privacy model and should say so.
            </p>
          </div>
        </div>
      </div>

      <p className="mt-8 flex items-start gap-2 text-xs leading-5 text-slate-500">
        <FileWarning size={14} className="mt-0.5 shrink-0" aria-hidden />
        Wepo cannot recover a document after you clear browser data. Keep your original files and exported copies.
        <EyeOff size={14} className="mt-0.5 shrink-0" aria-hidden />
        <Link to="/licenses" className="font-medium underline underline-offset-2">
          Licenses and attribution
        </Link>
      </p>
    </div>
  );
}
