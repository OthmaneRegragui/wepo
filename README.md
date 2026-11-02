# Wepo Office

Wepo Office is a private, browser-only office suite for editing DOCX, XLSX, CSV, and PPTX files. Everything runs locally in your browser using WebAssembly - no uploads, no accounts, and no server-side document processing.

## Features

### Word
- Open and edit `.DOCX` files in a paginated layout
- Text formatting (bold, italic, underline, strikethrough)
- Headings, lists, paragraph spacing
- Tables, images, page layout
- Undo/redo, DOCX export, print-to-PDF

### Sheets
- Open `.XLSX` and `.CSV` files, edit multiple worksheets
- Formula engine with Excel functions (SUM, AVERAGE, MAX, etc.)
- Cell formatting, borders, merges
- Undo/redo, clipboard support
- Export to XLSX, CSV, or print-to-PDF
- CSV files are converted to XLSX locally for editing

### Slides
- Open `.PPTX` presentations, add/reorder/delete slides
- Edit text, shapes, images
- Slide thumbnails, zoom
- Full-screen presentation mode
- Export to PPTX or slide images

## Privacy First

- **100% local processing** - Files never leave your device
- **No uploads** - All operations use the File System Access API or standard downloads
- **No tracking** - No analytics of document contents or filenames
- **No accounts required** - Just open and edit
- **Recovery only in browser** - Autosave/recovery copies stored in IndexedDB stay local

## Supported Formats

| App | Open | Export |
|---|---|---|
| Word | DOCX | DOCX, PDF (print) |
| Sheets | XLSX, CSV | XLSX, CSV, PDF (print) |
| Slides | PPTX | PPTX, PDF (print) |

Legacy formats (`.DOC`, `.XLS`, `.PPT`, `.ODT`, `.ODS`, `.ODP`, `.RTF`, `.TXT`) are not supported - please re-save them as OOXML formats in your current office app.

## Development

### Prerequisites
- Node.js >= 20.19
- npm 10.9.8

### Setup
```bash
npm install
npm run dev
```

### Build
```bash
npm run build
npm run preview
```

### Test
```bash
npm run test        # Unit tests
npm run test:e2e    # E2E tests (requires build/preview)
npm run check       # typecheck + test + build
```

## Architecture

This is a monorepo with npm workspaces:
- `apps/web` - React/TypeScript/Vite frontend
- `packages/core` - Shared types, validation, file handling
- `scripts/` - Build and asset generation scripts

Editors are powered by [BetterOffice](https://github.com/openooxml/betteroffice) (Apache-2.0) running as WebAssembly in workers for performance and isolation.

## Deployment

The reference target is Cloudflare Workers with Static Assets. The root
`wrangler.jsonc` points Wrangler at `apps/web/dist`, enables the SPA fallback,
and keeps the Worker static-assets-only. Build and deploy from the repository
root:

```bash
npm ci
npm run build
npx wrangler deploy --config ./wrangler.jsonc
```

Cloudflare Workers Builds settings:

| Setting | Value |
|---|---|
| Root directory | `/` |
| Build command | `npm run build` |
| Deploy command | `npx wrangler deploy --config ./wrangler.jsonc` |
| Include paths | `*` |
| Exclude paths | `node_modules/**`, `.git/**` |

`apps/web/public/_headers` is copied into the build and applied by Workers
Static Assets. It supplies COOP, COEP, CORP, CSP, and the other security headers
needed for `SharedArrayBuffer` and WebAssembly. `.nvmrc` pins Node 22.12.0 for
the build image. No backend Worker or API is required.

## Advertising

Advertising is supplied by Adsterra and is split between two scopes:

- **Shared shell**: a responsive leaderboard/mobile banner and the Native Banner
  on every `SiteLayout` page, plus the Social Bar once per document lifecycle on
  every route.
- **Page-specific**: extra home dashboard placements, the sponsored smartlink
  and the desktop sidebar; application landing pages add a content rectangle.

| Placement | Scope | Format | Desktop | Mobile |
|---|---|---|---|---|
| Top leaderboard | All content pages | 728 × 90 | Shown at ≥ 768 px | — |
| Top banner | All content pages | 320 × 50 | — | Shown below 768 px |
| Dashboard banner | Homepage | 468 × 60 | Shown at ≥ 640 px | — |
| Content rectangle | Homepage | 300 × 250 | Shown | Shown (fits 320 px) |
| App landing rectangle | `/word`, `/sheets`, `/slides` | 300 × 250 | Shown | Shown (fits 320 px) |
| Native banner | Shared shell | Publisher native | Shown | Shown |
| Desktop sidebar | Homepage | 160 × 600 | Shown at ≥ 1280 px | — |
| Desktop sidebar | Homepage | 160 × 300 | Shown at 1024–1279 px | — |
| Social Bar | Global | Publisher script | Once per document | Once per document |
| Sponsored offers | Homepage | Smartlink | Shown | Shown |

Only one top banner size is ever mounted: the media query selects the leaderboard
or mobile format before the component mounts. Only one sidebar size is ever
mounted, for the same reason, so desktop and mobile scripts never load together.

Classic banners share `window.atOptions`, so `ad-loader.ts` serialises them:
create the dedicated container, set the exact `atOptions`, append the exact
`invoke.js`, wait for `load`/`error`, release the global, pause briefly, then
start the next banner. Scripts are never loaded concurrently and each key has a
single container. If a script is blocked or times out, the slot reports a
non-blocking failure and the rest of the page continues to work.

The native banner and the responsive top banner are mounted in `SiteLayout`,
which covers the homepage, application landing pages, privacy, licenses,
compatibility, and 404. The native loader creates one publisher container with
the exact `container-<key>` id and runs the publisher script only once per
document. On SPA navigation the live container is moved into the next page's
slot; while no eligible slot is mounted it is detached from the document rather
than concealed on a live page. The top banner stays mounted across content-route
transitions, so it is not reloaded on every navigation. It is never recreated or
re-executed, so a filled placement survives route changes and duplicate widgets
cannot register. Application landing pages add a route-local 300 × 250 rectangle
in their content sidebar.

Active editor routes (`/:kind/edit`) do not use `SiteLayout`, so they contain no
native or display slot. The globally mounted Social Bar remains active there
because it is a separate publisher format and never covers the editing surface.

The Social Bar is initialised at most once per document lifecycle by
`AdManager`, outside the routed layouts. Its injected top-level nodes are marked
by a mutation observer for diagnostics only; they are not hidden or suppressed.
The Popunder format is intentionally disabled because no official publisher code
was supplied; the Social Bar script is not reused for it.

Script success and creative fill are tracked separately. `data-ad-status`
reports loader state (`idle`/`loading`/`loaded`/`failed`), while
`data-wepo-ad-served="true"` is set only when publisher DOM or text actually
appears in the container. That flag means the placement was initialized or
filled; it is not proof that a particular impression was viewed or billed. A
script returning HTTP 200 does not by itself mark an advertisement as served.

Advertising is disabled at build time by any of these Vite environment flags:

| Flag | Scope |
|---|---|
| `VITE_ADS_ENABLED=false` | Entire advertising system |
| `VITE_ADS_DISPLAY_BANNER=false` | All classic display banners |
| `VITE_ADS_NATIVE_BANNER=false` | Native banner |
| `VITE_ADS_SOCIAL_BAR=false` | Social Bar |
| `VITE_ADS_SMARTLINK=false` | Sponsored offers |
| `VITE_ADS_PLACEMENT_SITE_LEADERBOARD=false` | Top 728 × 90 banner |
| `VITE_ADS_PLACEMENT_SITE_MOBILE_BANNER=false` | Top 320 × 50 banner |
| `VITE_ADS_PLACEMENT_DASHBOARD_BANNER=false` | 468 × 60 |
| `VITE_ADS_PLACEMENT_HOME_RECTANGLE=false` | Home 300 × 250 |
| `VITE_ADS_PLACEMENT_APP_RECTANGLE=false` | App landing 300 × 250 |
| `VITE_ADS_PLACEMENT_SITE_NATIVE=false` | Native banner placement |
| `VITE_ADS_PLACEMENT_HOME_SIDEBAR=false` | 160 × 600 / 160 × 300 |
| `VITE_ADS_PLACEMENT_HOME_SMARTLINK=false` | Sponsored offers |
| `VITE_ADS_PLACEMENT_SITE_SOCIAL_BAR=false` | Social Bar placement |

The CSP in `_headers` allowlists the publisher and nested ad-network script
origins (including `aqml.org`, wildcard Adsterra hosts and the creative CDN)
plus HTTPS allowances for ad creatives, frames, images, fonts, media, and
tracking beacons. COOP `same-origin` and COEP `credentialless` remain in place,
so cross-origin creatives and pixels without CORP headers load without
weakening cross-origin isolation or breaking `SharedArrayBuffer`. A scoped
`document.createElement` patch also marks ad-created iframes as
`credentialless` for browsers that still require the attribute.

Adsterra can return empty or no-op scripts to automated/datacenter traffic, so a
local build can verify sequencing, route coverage, CSP, failure handling, and
editor isolation but not real creative fill. Fill depends on Adsterra's
inventory, the visitor's region, and whether an ad blocker is active. The
publisher codes and dimensions live in
`apps/web/src/components/ads/ad-config.ts`; do not replace them with
placeholders.

## License

Apache-2.0 - see [LICENSE](LICENSE). Third-party licenses documented in [LICENSES.md](LICENSES.md).
