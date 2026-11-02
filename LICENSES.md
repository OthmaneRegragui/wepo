# Licenses and third-party notices

Wepo Office is licensed under the Apache License, Version 2.0. The full text is
in [LICENSE](LICENSE) and is also served at `/licenses/APACHE-2.0.txt`.

This file records the third-party components used by the shipped application and
the obligations that apply. Versions are the versions resolved in
`package-lock.json` at the time of writing.

## Runtime dependencies

| Component | Version | License | Use |
|---|---|---|---|
| `@betteroffice/docx-react` | 0.5.1 | Apache-2.0 | Word editor React wrapper and DOCX engine |
| `@betteroffice/xlsx-react` | 0.5.1 | Apache-2.0 | Sheets editor React wrapper and XLSX engine |
| `@betteroffice/pptx-react` | 0.5.1 | Apache-2.0 | Slides editor React wrapper and PPTX engine |
| `@betteroffice/xlsx` | 0.5.1 | Apache-2.0 | XLSX save, structured export, print display lists |
| `@betteroffice/pptx` | 0.5.1 | Apache-2.0 | PPTX save, slide layout and painting |
| `@betteroffice/fonts` | 0.4.2 | Apache-2.0 AND OFL-1.1 | Source of the bundled font faces |
| `react` / `react-dom` | 19.3.1 | MIT | UI runtime |
| `react-router-dom` | 7.18.5 | MIT | Client-side routing |
| `zustand` | 5.0.16 | MIT | Small UI state stores |
| `lucide-react` | 1.66.0 | ISC | Icons |
| `clsx` | 2.1.1 | MIT | Conditional class names |
| `tailwind-merge` | 3.7.0 | MIT | Class merging |
| `xlsx` (SheetJS CE) | 0.18.5 | Apache-2.0 | CSV-to-XLSX conversion in the browser |

## Build and test dependencies

| Component | Version | License | Use |
|---|---|---|---|
| `vite` | 8.3.5 | MIT | Development server and production build |
| `@vitejs/plugin-react` | 6.2.1 | MIT | React transform |
| `typescript` | 6.0.3 / 7.0.2 | Apache-2.0 | Type checking |
| `tailwindcss` | 3.4.18 | MIT | CSS utility generation |
| `postcss` | 8.5.32 | MIT | CSS pipeline |
| `autoprefixer` | 10.6.2 | MIT | CSS prefixes |
| `vitest` | 4.1.12 | MIT | Unit tests |
| `@playwright/test` | 1.64.1 | Apache-2.0 | Browser end-to-end tests |
| `docx` | 9.15.1 | MIT | Generates the sample DOCX at build time |
| `pptxgenjs` | 4.0.1 | MIT | Generates the sample PPTX at build time |

Build and test dependencies are not part of the production bundle, except where
their output is copied into it (for example, generated asset files).

## Bundled fonts

The following families are copied from `@betteroffice/fonts` into
`apps/web/public/fonts` at install/build time. They are metric-compatible
substitutes for common Office fonts:

| Office family | Bundled family | License notice |
|---|---|---|
| Calibri | Carlito | `/licenses/OFL-Carlito.txt` |
| Cambria | Caladea | `/licenses/OFL-Caladea.txt` |
| Arial | Liberation Sans | `/licenses/OFL-Liberation.txt` |
| Times New Roman | Liberation Serif | `/licenses/OFL-Liberation.txt` |
| Courier New | Liberation Mono | `/licenses/OFL-Liberation.txt` |
| Georgia | Gelasio | `/licenses/OFL-Gelasio.txt` |
| Comic Sans MS | Comic Relief | `/licenses/OFL-ComicRelief.txt` |
| Segoe UI | Selawik | `/licenses/OFL-Selawik.txt` |

The font files are licensed under the SIL Open Font License 1.1 (OFL-1.1). The
full OFL text is served at `/licenses/OFL-1.1.txt`, and the family-specific
notices are in `/licenses/`. In summary, the OFL allows use, study,
modification, and redistribution of the fonts, including embedding in
documents, provided that:

- the license notice is retained with the fonts,
- the fonts are not sold by themselves,
- modified versions do not use the Reserved Font Names unless permission is
  granted,
- any redistributed modified font remains under the OFL.

Wepo does not modify the font files. The application fetches them from its own
origin for editor rendering.

CJK fonts are not bundled. Documents that use CJK families depend on fonts
available in the user's browser and operating system. This is documented in
`COMPATIBILITY.md`.

## Apache-2.0 obligations

For Apache-2.0 components (Wepo itself, BetterOffice, SheetJS CE, Playwright,
and TypeScript):

- Include a copy of the Apache License 2.0.
- Retain copyright, patent, trademark, and attribution notices from the
  component.
- State significant modifications made by Wepo. Wepo wraps the BetterOffice
  React editors with its own shell and does not modify the upstream engine
  source in this repository.
- Do not use upstream trademarks to imply endorsement.

The upstream packages' license and notice files are distributed inside their
npm packages. The project license is served at `/licenses/APACHE-2.0.txt`.

## MIT, ISC, and BSD obligations

For MIT, ISC, and BSD-licensed dependencies, retain the copyright notice and
permission notice. Those notices remain in the installed packages and, where
required by the build, in the generated output. No additional advertising
clause applies to the dependencies listed here.

## Alternatives considered and rejected

- **Univer**: the open-source core is Apache-2.0, but the Office import/export
  features needed for a DOCX/XLSX/PPTX suite are in commercial
  `@univerjs-pro/*` packages, so it was not selected for the full suite.
- **ranuts/document**: AGPL-3.0. Using it would impose AGPL network-source
  obligations that do not fit this project's distribution plan.
- **ONLYOFFICE / SuperDoc**: AGPL-3.0. Rejected for the same reason.

This project does not include AGPL-licensed code. If a future change introduces
an AGPL or other copyleft dependency, the project license and this notice must
be revisited before release.

## Reporting a licensing issue

Open an issue in the project repository with the component name, version, and
the notice you believe is missing. Licensing questions are treated as release
blockers.
