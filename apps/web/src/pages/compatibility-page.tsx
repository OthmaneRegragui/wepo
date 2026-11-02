import { AlertTriangle, CheckCircle2, CircleSlash, FlaskConical, HelpCircle } from 'lucide-react';
import { useSeo } from '../lib/seo';
import { Badge } from '../components/ui/badge';
import { cn } from '../lib/utils';

type Status = 'tested' | 'partial' | 'unsupported' | 'unverified';

const statusMeta: Record<Status, { label: string; tone: 'green' | 'amber' | 'neutral' | 'blue'; icon: typeof CheckCircle2 }> = {
  tested: { label: 'Tested', tone: 'green', icon: CheckCircle2 },
  partial: { label: 'Partial', tone: 'amber', icon: AlertTriangle },
  unsupported: { label: 'Not supported', tone: 'neutral', icon: CircleSlash },
  unverified: { label: 'Unverified', tone: 'blue', icon: HelpCircle },
};

interface Row {
  feature: string;
  status: Status;
  note: string;
}

const wordRows: Row[] = [
  { feature: 'Open and save DOCX', status: 'tested', note: 'Round-trip sample with paragraphs, runs, a table and an image.' },
  { feature: 'Text formatting', status: 'tested', note: 'Bold, italic, underline and basic paragraph formatting survive a save.' },
  { feature: 'Tables', status: 'tested', note: 'Cell text and table structure are preserved in the sample.' },
  { feature: 'Inline images', status: 'tested', note: 'The sample image survives opening and saving.' },
  { feature: 'Headers, footers, page numbers', status: 'partial', note: 'The engine models them, but complex field codes may be approximated.' },
  { feature: 'Floating shapes and text boxes', status: 'partial', note: 'Layout may shift; inspect the exported copy.' },
  { feature: 'Tracked changes workflow', status: 'partial', note: 'Changes can exist in a file; accept/reject workflows are not a tested guarantee.' },
  { feature: 'Fields, citations, embedded OLE', status: 'unverified', note: 'Not part of the automated sample. Treat as unsupported for critical documents.' },
  { feature: 'Print / PDF', status: 'tested', note: 'Uses the engine print preview; the browser print dialog produces the PDF.' },
];

const sheetsRows: Row[] = [
  { feature: 'Open and save XLSX', status: 'tested', note: 'Multiple worksheets, values, styles, merges and formulas in the sample.' },
  { feature: 'Formulas', status: 'tested', note: 'Formulas are preserved. The engine calculates locally; saved files may not contain a cached result for every formula.' },
  { feature: 'Cell formatting', status: 'tested', note: 'Fonts, fills, borders, alignment and number formats are part of the engine surface.' },
  { feature: 'CSV import', status: 'tested', note: 'Converted to an XLSX workbook in the browser before editing. The export name changes to .xlsx.' },
  { feature: 'CSV export', status: 'tested', note: 'Exports the active sheet through the structured read interface. Formatting and formulas are not part of CSV.' },
  { feature: 'Charts', status: 'partial', note: 'Chart objects are represented, but editing chart series is not a tested feature.' },
  { feature: 'Pivot tables and macros', status: 'unsupported', note: 'VBA macros are not executed. Pivot tables should be treated as read-only content.' },
  { feature: 'External data connections', status: 'unsupported', note: 'No network fetches are performed for workbook data.' },
  { feature: 'Print / PDF', status: 'partial', note: 'Rendered from the engine display list. Very large sheets may be clipped by the cell budget.' },
];

const slidesRows: Row[] = [
  { feature: 'Open and save PPTX', status: 'tested', note: 'A four-slide sample with text, shapes, a table and an image round-trips.' },
  { feature: 'Slide creation and reordering', status: 'tested', note: 'Add, duplicate, move and delete slides through the editor chrome.' },
  { feature: 'Text and preset shapes', status: 'tested', note: 'Text, rectangles, rounded rectangles and basic fills are preserved.' },
  { feature: 'Pictures', status: 'tested', note: 'Images survive a PPTX save; the print/PDF path omits them (documented below).' },
  { feature: 'SmartArt and charts', status: 'partial', note: 'Represented as content, but deep editing is not a tested guarantee.' },
  { feature: 'Transitions and animations', status: 'partial', note: 'The deck can retain them, but authoring new ones is not part of the tested surface.' },
  { feature: 'Speaker notes', status: 'partial', note: 'Readable through the engine; verify a saved copy before relying on notes.' },
  { feature: 'Print / PDF', status: 'partial', note: 'Slides are painted from display lists without the picture resolver. Export PPTX to keep pictures.' },
];

const browserRows = [
  { browser: 'Chromium (Playwright / recent Chrome)', status: 'tested' as Status, note: 'All three engines open, edit and save. Workers and WebAssembly run same-origin.' },
  { browser: 'Microsoft Edge (Chromium)', status: 'unverified' as Status, note: 'Expected to behave like Chromium, but not yet part of the automated run.' },
  { browser: 'Firefox', status: 'unverified' as Status, note: 'WebAssembly and workers are available; the engines have not been verified in this build.' },
  { browser: 'Safari / iOS Safari', status: 'unverified' as Status, note: 'Memory limits and File System Access support differ. Use downloads, not the picker.' },
];

const formatRows = [
  { format: '.docx', status: 'tested' as Status, note: 'Opened in Word, saved as a new DOCX.' },
  { format: '.xlsx', status: 'tested' as Status, note: 'Opened in Sheets, saved as a new XLSX.' },
  { format: '.csv', status: 'tested' as Status, note: 'Converted to XLSX on import; CSV export available from Sheets.' },
  { format: '.pptx', status: 'tested' as Status, note: 'Opened in Slides, saved as a new PPTX.' },
  { format: '.doc / .xls / .ppt', status: 'unsupported' as Status, note: 'Legacy binary formats are rejected. Re-save as DOCX/XLSX/PPTX in an office app.' },
  { format: '.odt / .ods / .odp', status: 'unsupported' as Status, note: 'OpenDocument files are not opened. Re-save in an OOXML format.' },
  { format: '.rtf / .txt', status: 'unsupported' as Status, note: 'Plain-text and RTF import are not part of this build.' },
  { format: '.pdf', status: 'unsupported' as Status, note: 'Wepo creates PDFs through the browser print flow; it does not edit existing PDFs.' },
];

function StatusBadge({ status }: { status: Status }) {
  const meta = statusMeta[status];
  const Icon = meta.icon;
  return (
    <Badge tone={meta.tone} className="gap-1 whitespace-nowrap">
      <Icon size={12} aria-hidden /> {meta.label}
    </Badge>
  );
}

function MatrixTable({ title, rows, tint }: { title: string; rows: Row[]; tint: string }) {
  return (
    <section>
      <h2 className="flex items-center gap-2 text-lg font-semibold tracking-tight text-slate-900">
        <span className={cn('h-2.5 w-2.5 rounded-full', tint)} aria-hidden /> {title}
      </h2>
      <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th scope="col" className="px-4 py-2.5 font-semibold">Feature</th>
              <th scope="col" className="px-4 py-2.5 font-semibold">Status</th>
              <th scope="col" className="hidden px-4 py-2.5 font-semibold md:table-cell">What was observed</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {rows.map((row) => (
              <tr key={row.feature} className="align-top">
                <th scope="row" className="px-4 py-3 font-medium text-slate-900">{row.feature}</th>
                <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                <td className="hidden px-4 py-3 text-slate-600 md:table-cell">{row.note}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}

export function CompatibilityPage() {
  useSeo({
    title: 'Compatibility — what Wepo has actually tested | Wepo Office',
    description:
      'An honest compatibility matrix for Wepo Office: verified DOCX, XLSX, CSV and PPTX round trips, partial features, unsupported legacy formats and browser notes.',
    path: '/compatibility',
  });

  return (
    <div className="container-page py-12 sm:py-16">
      <header className="max-w-3xl">
        <Badge tone="blue" className="gap-1.5">
          <FlaskConical size={13} aria-hidden /> Evidence over logos
        </Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Compatibility, stated plainly</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Wepo does not claim “full Microsoft Office compatibility”. This page lists what the automated round-trip
          tests and hands-on checks actually observed, what is only partial, and what is refused. If a feature is not
          listed as tested, do not assume it will survive.
        </p>
      </header>

      <div className="mt-8 grid gap-4 sm:grid-cols-3">
        {[
          { label: 'Formats opened', value: 'DOCX · XLSX · CSV · PPTX' },
          { label: 'Engines', value: 'BetterOffice 0.5.1 (Apache-2.0)' },
          { label: 'Tested browser', value: 'Chromium via Playwright' },
        ].map((item) => (
          <div key={item.label} className="rounded-2xl border border-slate-200 bg-white p-4">
            <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{item.label}</p>
            <p className="mt-1 text-sm font-semibold text-slate-900">{item.value}</p>
          </div>
        ))}
      </div>

      <div className="prose-page mt-10 max-w-none">
        <h2>How these results were produced</h2>
        <p>
          The repository includes a generator that creates real Office files with paragraphs, runs, tables, images,
          multiple worksheets and formulas. The Playwright suite opens each sample in the same production build,
          waits for the engine, edits or saves, and reads the saved file back with a separate parser. The manual
          matrix below records which sample was used and what was inspected. This is a small, transparent sample
          set, not a certification suite.
        </p>
      </div>

      <div className="mt-8 space-y-8">
        <MatrixTable
          title="Files and formats"
          rows={formatRows.map((row) => ({ feature: row.format, status: row.status, note: row.note }))}
          tint="bg-slate-400"
        />
        <MatrixTable title="Word — DOCX" rows={wordRows} tint="bg-blue-500" />
        <MatrixTable title="Sheets — XLSX and CSV" rows={sheetsRows} tint="bg-emerald-500" />
        <MatrixTable title="Slides — PPTX" rows={slidesRows} tint="bg-orange-500" />
      </div>

      <section className="mt-10">
        <h2 className="text-lg font-semibold tracking-tight text-slate-900">Browsers</h2>
        <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th scope="col" className="px-4 py-2.5 font-semibold">Browser</th>
                <th scope="col" className="px-4 py-2.5 font-semibold">Status</th>
                <th scope="col" className="hidden px-4 py-2.5 font-semibold md:table-cell">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {browserRows.map((row) => (
                <tr key={row.browser} className="align-top">
                  <th scope="row" className="px-4 py-3 font-medium text-slate-900">{row.browser}</th>
                  <td className="px-4 py-3"><StatusBadge status={row.status} /></td>
                  <td className="hidden px-4 py-3 text-slate-600 md:table-cell">{row.note}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="mt-10 grid gap-5 lg:grid-cols-2">
        <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5">
          <h2 className="flex items-center gap-2 text-sm font-semibold text-amber-900">
            <AlertTriangle size={16} aria-hidden /> Known limitations to plan around
          </h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-amber-900">
            <li>Saved XLSX files may omit cached formula results; another application recalculates on open.</li>
            <li>The Slides print/PDF path paints shapes and text but omits pictures. Export PPTX to keep images.</li>
            <li>Very large sheets and documents can hit engine cell or memory budgets; the UI reports failures rather than pretending success.</li>
            <li>CSV files become XLSX on import. Formatting and formulas are not representable in CSV.</li>
            <li>Legacy binary and OpenDocument files are refused with a re-save instruction.</li>
            <li>CJK fonts are not bundled. CJK text may use browser fallback and paginate differently.</li>
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-5">
          <h2 className="text-sm font-semibold text-slate-900">Before you rely on an export</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-600">
            <li>Keep the original file. Wepo writes a new copy and never overwrites the source.</li>
            <li>Open the exported copy in the application you need to share it with.</li>
            <li>Check tables, page breaks, images, formulas and fonts, not just the text.</li>
            <li>For high-value documents, keep a PDF snapshot as well as the editable file.</li>
            <li>Report a reproducible mismatch with the browser version and the feature involved; do not send confidential files.</li>
          </ul>
        </div>
      </div>

      <p className="mt-8 text-xs leading-5 text-slate-500">
        Last reviewed: 2 November 2026. This matrix is updated whenever the engines or the test suite change; see
        CHANGELOG.md in the repository.
      </p>
    </div>
  );
}
