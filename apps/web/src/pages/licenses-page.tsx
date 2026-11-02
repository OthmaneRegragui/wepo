import { ExternalLink, Scale } from 'lucide-react';
import { useSeo } from '../lib/seo';
import { Badge } from '../components/ui/badge';

const libraries = [
  {
    name: 'BetterOffice DOCX / XLSX / PPTX engines and React shells',
    version: '0.5.1',
    license: 'Apache-2.0',
    role: 'Browser-side OOXML engines and editor UI',
    url: 'https://github.com/openooxml/betteroffice',
  },
  {
    name: 'BetterOffice bundled fonts',
    version: '0.4.2',
    license: 'OFL-1.1',
    role: 'Metric-compatible Latin font faces (see font notices below)',
    url: 'https://github.com/openooxml/betteroffice',
  },
  {
    name: 'SheetJS Community Edition (xlsx)',
    version: '0.18.x',
    license: 'Apache-2.0',
    role: 'CSV import conversion and spreadsheet interchange helpers',
    url: 'https://sheetjs.com/',
  },
  {
    name: 'React and React DOM',
    version: '19.x',
    license: 'MIT',
    role: 'User interface runtime',
    url: 'https://react.dev/',
  },
  {
    name: 'React Router',
    version: '7.x',
    license: 'MIT',
    role: 'Client-side routing',
    url: 'https://reactrouter.com/',
  },
  {
    name: 'Zustand',
    version: '5.x',
    license: 'MIT',
    role: 'Small UI state stores',
    url: 'https://github.com/pmndrs/zustand',
  },
  {
    name: 'Lucide',
    version: '1.x',
    license: 'ISC',
    role: 'Interface icons',
    url: 'https://lucide.dev/',
  },
  {
    name: 'Tailwind CSS',
    version: '3.x',
    license: 'MIT',
    role: 'Utility-first styling',
    url: 'https://tailwindcss.com/',
  },
  {
    name: 'Vite',
    version: '8.x',
    license: 'MIT',
    role: 'Development server and static build',
    url: 'https://vite.dev/',
  },
  {
    name: 'TypeScript',
    version: '7.x',
    license: 'Apache-2.0',
    role: 'Type checking and compiler tooling',
    url: 'https://www.typescriptlang.org/',
  },
  {
    name: 'docx',
    version: '9.x',
    license: 'MIT',
    role: 'Development-only sample/template generator',
    url: 'https://github.com/dolanmiu/docx',
  },
  {
    name: 'PptxGenJS',
    version: '4.x',
    license: 'MIT',
    role: 'Development-only sample/template generator',
    url: 'https://github.com/gitbrent/PptxGenJS',
  },
] as const;

const fonts = [
  { face: 'Carlito', copyright: 'Copyright 2013 The Carlito Project Authors', license: 'OFL-1.1', file: 'OFL-Carlito.txt' },
  { face: 'Caladea', copyright: 'Copyright 2012 The Caladea Project Authors', license: 'OFL-1.1', file: 'OFL-Caladea.txt' },
  { face: 'Liberation', copyright: 'Copyright 2010 Google Corporation; Copyright 2012 Red Hat, Inc.', license: 'OFL-1.1', file: 'OFL-Liberation.txt' },
  { face: 'Selawik', copyright: 'Copyright 2015 Microsoft Corporation', license: 'OFL-1.1', file: 'OFL-Selawik.txt' },
  { face: 'Gelasio', copyright: 'Copyright 2022 The Gelasio Project Authors', license: 'OFL-1.1', file: 'OFL-Gelasio.txt' },
  { face: 'Comic Relief', copyright: 'Copyright 2013 The Comic Relief Project Authors', license: 'OFL-1.1', file: 'OFL-ComicRelief.txt' },
] as const;

export function LicensesPage() {
  useSeo({
    title: 'Licenses and attribution — Wepo Office',
    description:
      'Open-source licenses for Wepo Office: Apache-2.0 application code, BetterOffice engines, SheetJS and OFL-1.1 bundled fonts.',
    path: '/licenses',
  });

  return (
    <div className="container-page py-12 sm:py-16">
      <header className="max-w-3xl">
        <Badge tone="amber" className="gap-1.5">
          <Scale size={13} aria-hidden /> Apache-2.0 · OFL-1.1 · MIT · ISC
        </Badge>
        <h1 className="mt-4 text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">Licenses and attribution</h1>
        <p className="mt-3 text-base leading-7 text-slate-600">
          Wepo is open-source software. The application code in this repository is released under the Apache License
          2.0. The document engines, fonts and libraries below remain under their own licenses; this page records
          the obligations that come with distributing them as part of a static build.
        </p>
      </header>

      <div className="mt-8 grid gap-8 lg:grid-cols-[1.25fr_0.75fr] lg:items-start">
        <div>
          <section className="rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Application code</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              The Wepo shell, validation, storage, routing, editor bridges and pages are licensed under the Apache
              License, Version 2.0. You may use, modify and redistribute them, including commercially, provided you
              keep the copyright and license notices and state any significant changes. The full text is in the
              repository's <code className="rounded bg-slate-100 px-1 py-0.5 text-xs">LICENSE</code> file and is
              served at{' '}
              <a className="font-medium text-blue-700 underline underline-offset-2" href="/licenses/APACHE-2.0.txt">
                /licenses/APACHE-2.0.txt
              </a>
              .
            </p>
          </section>

          <section className="mt-6">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Third-party components</h2>
            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <ul className="divide-y divide-slate-100">
                {libraries.map((library) => (
                  <li key={library.name} className="flex flex-col gap-2 p-4 sm:flex-row sm:items-start sm:justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-slate-900">{library.name}</p>
                      <p className="mt-0.5 text-xs text-slate-500">
                        {library.version} · {library.role}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center gap-3">
                      <Badge tone={library.license === 'Apache-2.0' ? 'blue' : library.license === 'OFL-1.1' ? 'amber' : 'neutral'}>
                        {library.license}
                      </Badge>
                      <a
                        href={library.url}
                        target="_blank"
                        rel="noreferrer noopener"
                        className="text-slate-400 hover:text-slate-700"
                        aria-label={`${library.name} project page`}
                      >
                        <ExternalLink size={15} />
                      </a>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              Versions are the ranges declared in the workspace. Run <code className="rounded bg-slate-100 px-1">npm ls</code>{' '}
              to see the exact resolved versions in a given build. Development-only tools are not shipped in the
              production bundle.
            </p>
          </section>

          <section className="mt-8">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">Bundled font notices</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Wepo serves six curated Latin font families so DOCX and PPTX layout can use metric-compatible
              substitutes for common Office fonts. The font files are redistributed unmodified under the SIL Open
              Font License 1.1. The copyright notices and full license text are served alongside them.
            </p>
            <div className="mt-3 overflow-hidden rounded-2xl border border-slate-200 bg-white">
              <ul className="divide-y divide-slate-100">
                {fonts.map((font) => (
                  <li key={font.face} className="flex flex-col gap-1 p-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-900">{font.face}</p>
                      <p className="text-xs text-slate-500">{font.copyright}</p>
                    </div>
                    <a
                      href={`/licenses/${font.file}`}
                      className="shrink-0 text-xs font-medium text-blue-700 underline underline-offset-2"
                    >
                      {font.license} notice
                    </a>
                  </li>
                ))}
              </ul>
            </div>
            <p className="mt-2 text-xs leading-5 text-slate-500">
              The OFL permits bundling and redistribution with software, including commercial software. It requires
              that the copyright notice and license accompany the fonts, and that Reserved Font Names are not used
              for modified versions. Wepo does not modify the font files.
            </p>
          </section>

          <section className="mt-8 rounded-2xl border border-slate-200 bg-white p-6">
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">What is not included</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Earlier research evaluated other engines. Wepo does not bundle ONLYOFFICE, SuperDoc or ranuts/document
              (AGPL-3.0 obligations), and it does not bundle Univer's commercial Office import/export packages. The
              chosen BetterOffice engines are Apache-2.0. No AGPL, SSPL or proprietary document-processing code is
              part of this build.
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Microsoft, Word, Excel, PowerPoint and Office are trademarks of Microsoft Corporation. Wepo is not
              affiliated with or endorsed by Microsoft. Format names are used descriptively.
            </p>
          </section>
        </div>

        <aside className="space-y-5">
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">Redistribution checklist</h2>
            <ul className="mt-3 space-y-2 text-sm leading-6 text-slate-600">
              <li>Include the Apache-2.0 text with the application.</li>
              <li>Keep the BetterOffice and SheetJS notices.</li>
              <li>Keep the OFL notices and copyright lines for every served font.</li>
              <li>Do not rename a modified font to its Reserved Font Name.</li>
              <li>Disclose any modified source files as Apache-2.0 requires.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-slate-200 bg-white p-5">
            <h2 className="text-sm font-semibold text-slate-900">License texts</h2>
            <ul className="mt-3 space-y-2 text-sm">
              <li>
                <a className="text-blue-700 underline underline-offset-2" href="/licenses/APACHE-2.0.txt">
                  Apache License 2.0
                </a>
              </li>
              <li>
                <a className="text-blue-700 underline underline-offset-2" href="/licenses/OFL-1.1.txt">
                  SIL Open Font License 1.1
                </a>
              </li>
              <li>
                <a
                  className="text-blue-700 underline underline-offset-2"
                  href="https://github.com/openooxml/betteroffice"
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  BetterOffice source and notices
                </a>
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </div>
  );
}
