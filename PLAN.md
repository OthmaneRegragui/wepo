# Wepo Office - Plan

This plan records what has been built, what has been verified, and what remains.
It is updated at the end of every phase.

## Product goal

A static, open-source office suite that runs entirely in the browser:

- Open, edit, and export DOCX, XLSX, CSV, and PPTX files.
- Produce PDF where the engines support a faithful print path.
- Never upload document bytes or filenames for processing.
- Deploy as static assets (Cloudflare Pages is the reference target).
- Be explicit about unsupported features instead of pretending full Office
  compatibility.

## Non-goals

- A production Node/PHP/Postgres/Redis/Docker document service.
- Remote document-conversion or document-AI APIs.
- Full Microsoft Office feature parity or a claim of such parity.
- Accounts, cloud sync, collaborative editing, or server-side recovery.
- Silent in-place overwrite of the user's original local file.

## Phase 0 - Research and proof of concept

Status: **complete**

- Evaluated `ranuts/document`, Univer, ONLYOFFICE/SuperDoc, and BetterOffice.
- Rejected Univer for the full suite because Office import/export is in the
  commercial `@univerjs-pro/*` packages.
- Rejected `ranuts/document` and ONLYOFFICE/SuperDoc because their AGPL-3.0
  obligations do not fit the intended distribution model.
- Selected BetterOffice `0.5.1` (`@betteroffice/docx-react`,
  `@betteroffice/xlsx-react`, `@betteroffice/pptx-react`), licensed
  Apache-2.0.
- Proved in Chromium that each engine opens a real sample and produces a saved
  file: DOCX text/table/image/bold/italic, XLSX formulas, and PPTX
  slides/shapes/images/text.

## Phase 1 - Workspace and core safety layer

Status: **complete**

- npm workspaces with `apps/web` and `packages/core`.
- Strict TypeScript across both workspaces.
- Format detection from extension plus magic bytes.
- Legacy and unsupported format rejection with a re-save instruction.
- ZIP central-directory audit before any engine sees the bytes: entry count,
  uncompressed total, per-entry size, compression ratio, encryption, and ZIP64.
- File-size limit of 100 MB and a 50 MB per-document recovery-storage cap.
- IndexedDB recovery storage with a 25-document / 300 MB pruning policy.
- Download fallback plus File System Access support.
- Output naming always adds a suffix so the original name is not reused.

## Phase 2 - UI foundation

Status: **complete**

- Responsive dashboard, three color-coded app landing pages, and SEO routes.
- Shared components: buttons, cards, badges, modals, toasts, drop zones,
  privacy notice, app icons, and loading states.
- Per-app editor pages with save, print/PDF, CSV export (Sheets), dirty state,
  recovery snapshots, and an editor error boundary.
- Local recovery copy writes on a 30-second debounce and on `pagehide`.
- Explicit Save always writes a new named file; it never overwrites the source.
- Privacy, licenses, compatibility, and 404 pages.
- `robots.txt`, `sitemap.xml`, Open Graph metadata, manifest, and JSON-LD.

## Phase 3 - Editor integration

Status: **complete**

- Word: `DocxEditor` with a save/print bridge and a bundled font provider.
- Sheets: `XlsxEditor` worker editor with save, CSV export, and print display
  lists; CSV imports are converted to XLSX with SheetJS before editing.
- Slides: `PptxEditor` with bundled fonts, save, print, and full-screen
  presentation support from the engine.
- Editors are lazy-loaded so each engine chunk is fetched only when needed.
- Fixed a Sheets/Slides startup stall caused by a height-constrained loading
  indicator collapsing the workspace before the first paint. The editors now
  render at full size behind an absolute loading overlay, and the Sheets
  engine uses a compact inline indicator.

## Phase 4 - Verification

Status: **in progress**

Completed:

- 52 unit tests across format detection, ZIP audit, file loading, CSV,
  download naming/fallback, and IndexedDB-unavailable behavior.
- `npm run typecheck`, `npm run test`, and `npm run build` pass.
- Browser checks confirm `crossOriginIsolated: true`, `SharedArrayBuffer`
  availability, WASM loading, worker startup, and engine readiness.
- E2E coverage for dashboard/landing pages, Word open/save, Sheets open/
  formula edit/CSV export/save, Slides open/add slide/save, and unsupported
  file errors.
- Production preview headers checked for COOP/COEP/CORP.

Remaining:

- Run the manual compatibility matrix against a wider set of real files
  produced by Microsoft Office, LibreOffice, and Google Workspace.
- Verify the Cloudflare Pages deployment with production headers and real
  static assets.
- Check print/PDF output in Chromium, Firefox, and Safari.

## Phase 5 - Documentation

Status: **in progress**

- README, PLAN, ARCHITECTURE, LICENSES, COMPATIBILITY, and CHANGELOG are
  present.
- Keep the documents aligned with actual behavior and test results.
- Replace the placeholder `wepo.example` domain and email before a public
  launch, or explicitly mark them as placeholders.

## Phase 6 - Release

Status: **pending**

- Final `npm run check` and full E2E run.
- License and notice review for the exact production bundle.
- Cloudflare Pages project, custom domain, and HTTPS.
- Verify that no analytics or remote document calls exist in the production
  bundle.
- Publish the 0.1.0 release notes and compatibility report.

## Known gaps

- Legacy binary formats (`.doc`, `.xls`, `.ppt`) and OpenDocument formats are
  rejected rather than converted.
- CJK fonts are not bundled; documents using them depend on browser fonts.
- Slides print/PDF omits pictures; PPTX export keeps them.
- Sheets print path clips very large sheets at the engine cell budget.
- Pivot tables, macros, external data, SmartArt, charts, transitions, and
  animations are not fully editable.
- There is no collaborative editing or cloud storage.
