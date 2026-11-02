# Changelog

All notable changes to Wepo Office are recorded here. The format follows
Keep a Changelog, and versions use Semantic Versioning.

## [0.1.0] - 2026-11-02

### Added

- Browser-only Word, Sheets, and Slides editors backed by BetterOffice 0.5.1
  WebAssembly engines.
- DOCX open/edit/save with tables, images, formatting, undo, and a print path.
- XLSX and CSV open/edit/save with multiple worksheets and a local formula
  engine; CSV import is converted to XLSX in the browser.
- PPTX open/edit/save with slide creation, text, shapes, images, thumbnails,
  and full-screen presenting.
- CSV export for the first visible worksheet.
- Print/PDF paths for all three apps using the browser print dialog.
- Client-side file validation: extension plus magic-byte detection, size
  limits, and a ZIP central-directory audit that blocks oversized, encrypted,
  ZIP64, malformed, and compression-bomb-style containers.
- Legacy and OpenDocument format rejection with a clear re-save instruction.
- IndexedDB recovery storage with a 30-second debounce and page-hide snapshot.
- Explicit Save that always writes a new name through the File System Access
  picker or a download fallback; the original file is never overwritten.
- Responsive dashboard, separate SEO landing pages for each app, privacy,
  licenses, compatibility, and 404 pages.
- Shared UI components, toast notifications, drop zones, recent documents, and
  an editor error boundary.
- Lazy-loaded editor engines and workers; per-editor code splitting.
- Bundled OFL font faces and notices for common Office font substitutions.
- Static deployment assets: strict CSP and COOP/COEP/CORP headers, SPA
  redirects, robots, sitemap, manifest, favicon, and Open Graph image.
- Unit tests for detection, ZIP audit, file loading, CSV conversion, download
  fallback and naming, and storage-unavailable behavior.
- Playwright end-to-end tests for navigation, Word/Sheets/Slides opening,
  formula editing, CSV export, slide creation, save downloads, and unsupported
  file errors.
- Project documentation: README, PLAN, ARCHITECTURE, LICENSES, COMPATIBILITY,
  and CHANGELOG.

### Fixed

- Sheets and Slides editors stalled because a height-constrained loading
  indicator collapsed the editor workspace before first paint. Editors now
  render at full size behind an absolute overlay, and the Sheets engine uses a
  compact inline indicator so the grid can measure itself.
- Enabled COOP/COEP in the Vite preview server so `SharedArrayBuffer` and the
  worker-based Sheets editor can be tested outside Cloudflare Pages.

### Known limitations

- Legacy binary formats and OpenDocument formats are rejected, not converted.
- CJK fonts are not bundled.
- Slides print/PDF omits pictures; PPTX export keeps them.
- Pivot tables, macros, external data, SmartArt, transitions, and animations are
  not fully supported.
- The public domain and email in the source are placeholders
  (`wepo.example`) and must be replaced before launch.
