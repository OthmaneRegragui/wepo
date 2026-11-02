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

Optimized for static hosting (e.g., Cloudflare Pages). Requires COOP/COEP headers for SharedArrayBuffer support (see `public/_headers`).

## License

Apache-2.0 - see [LICENSE](LICENSE). Third-party licenses documented in [LICENSES.md](LICENSES.md).
