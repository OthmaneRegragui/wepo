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
  routing, robots, sitemap, manifest, favicon, and Open Graph image.
- Cloudflare Workers Static Assets deployment through `wrangler.jsonc` and
  Wrangler 4, with the SPA fallback configured in Wrangler. `.nvmrc` pins the
  Node version used by Workers Builds.
- Adsterra advertising: exact Social Bar and native-banner publisher codes plus
  six display-banner codes; serial `atOptions` loading; responsive
  desktop/mobile/sidebar placement selection; build-time format and placement
  flags; duplicate prevention; graceful failure handling; and a scoped
  `credentialless` iframe bridge that preserves COOP/COEP and
  `SharedArrayBuffer`.
- A single native-banner container shared by every `SiteLayout` page. The live
  container moves between SPA slots (and is detached, not hidden, between
  eligible routes) instead of re-running the publisher script.
- A global Social Bar mounted once per document outside the routed layouts, so
  direct URL access and SPA navigation no longer suppress or duplicate it.
- Separate script-load and creative-fill reporting through `data-ad-status` and
  `data-wepo-ad-served`. Classic display banners are mounted from the shared
  layout on every content route, with an extra content rectangle on the app
  landing pages; editor routes keep the Social Bar but render no native or
  display slots. Popunder remains disabled pending an official publisher code.
- Unit tests for detection, ZIP audit, file loading, CSV conversion, download
  fallback and naming, and storage-unavailable behavior.
- Playwright end-to-end tests for navigation, Word/Sheets/Slides opening,
  formula editing, CSV export, slide creation, save downloads, and unsupported
  file errors.
- Project documentation: README, LICENSES, COMPATIBILITY, and CHANGELOG.

### Fixed

- Adsterra display banners were blank because the network injects an inline
  script into an `about:blank` frame that inherits the page policy, and because
  nested creative domains rotate. `script-src` now allows inline scripts,
  `eval()` and HTTPS sub-origins, so the leaderboard, rectangle, native and
  social formats can render their creatives.
- Third-party ad images, tracking pixels and iframes no longer fail CORP checks:
  the site uses COEP `credentialless` instead of `require-corp`, which keeps
  cross-origin isolation and `SharedArrayBuffer` available while allowing
  creatives that omit `Cross-Origin-Resource-Policy` headers.
- Display advertising now follows the shared layout and appears on every content
  route, with a responsive top banner and a correctly positioned in-content
  rectangle on Word, Sheets and Slides landing pages.
- The Word, Sheets and Slides editors now show one desktop-only 300 × 250
  sponsor rail in a dedicated column beside the canvas. It waits for the engine
  bridge, is excluded from print, and hides below the 1280px breakpoint so the
  document keeps the full width on smaller screens. App landing page rectangles
  stay sticky beside the content on large screens.
- Sheets and Slides editors stalled because a height-constrained loading
  indicator collapsed the editor workspace before first paint. Editors now
  render at full size behind an absolute overlay, and the Sheets engine uses a
  compact inline indicator so the grid can measure itself.
- Enabled COOP/COEP in the Vite preview server so `SharedArrayBuffer` and the
  worker-based Sheets editor can be tested outside Cloudflare.

### Known limitations

- Legacy binary formats and OpenDocument formats are rejected, not converted.
- CJK fonts are not bundled.
- Slides print/PDF omits pictures; PPTX export keeps them.
- Pivot tables, macros, external data, SmartArt, transitions, and animations are
  not fully supported.
- The public domain and email in the source are placeholders
  (`wepo.example`) and must be replaced before launch.
- Adsterra returns empty/no-op scripts to automated and datacenter traffic, so
  local tests verify loader sequencing, CSP, failure handling, and editor
  isolation but not real creative fill. No Popunder code is included.
