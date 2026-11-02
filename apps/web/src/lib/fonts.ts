import type { BundledFontProvider } from '@betteroffice/docx-react';

export interface BundledFaceSpec {
  /** Office family the face stands in for. */
  family: string;
  /** The actual bundled family name. */
  bundledFamily: string;
  weight: 400 | 700;
  style: 'normal' | 'italic';
  file: string;
}

/**
 * Curated Latin faces copied by `scripts/copy-editor-fonts.mjs`. The list is
 * intentionally small: it covers the metric-compatible substitutes Office uses
 * for Calibri, Cambria, Arial, Times New Roman, Courier New, Segoe UI, Georgia
 * and Comic Sans. CJK faces are not bundled; such documents fall back to the
 * browser's fonts and are reported in COMPATIBILITY.md.
 */
export const FONT_FACES: readonly BundledFaceSpec[] = [
  ...faces('Calibri', 'Carlito', 'Carlito'),
  ...faces('Cambria', 'Caladea', 'Caladea'),
  ...faces('Arial', 'Liberation Sans', 'LiberationSans'),
  ...faces('Times New Roman', 'Liberation Serif', 'LiberationSerif'),
  ...faces('Courier New', 'Liberation Mono', 'LiberationMono'),
  ...faces('Georgia', 'Gelasio', 'Gelasio'),
  { family: 'Comic Sans MS', bundledFamily: 'Comic Relief', weight: 400, style: 'normal', file: 'ComicRelief-Regular.ttf' },
  { family: 'Comic Sans MS', bundledFamily: 'Comic Relief', weight: 700, style: 'normal', file: 'ComicRelief-Bold.ttf' },
  { family: 'Segoe UI', bundledFamily: 'Selawik', weight: 400, style: 'normal', file: 'Selawik-Regular.ttf' },
  { family: 'Segoe UI', bundledFamily: 'Selawik', weight: 700, style: 'normal', file: 'Selawik-Bold.ttf' },
];

function faces(family: string, bundledFamily: string, prefix: string): BundledFaceSpec[] {
  return [
    { family, bundledFamily, weight: 400, style: 'normal', file: `${prefix}-Regular.ttf` },
    { family, bundledFamily, weight: 700, style: 'normal', file: `${prefix}-Bold.ttf` },
    { family, bundledFamily, weight: 400, style: 'italic', file: `${prefix}-Italic.ttf` },
    { family, bundledFamily, weight: 700, style: 'italic', file: `${prefix}-BoldItalic.ttf` },
  ];
}

const OFFICE_ALIASES: Record<string, string> = {
  calibri: 'Calibri',
  carlito: 'Calibri',
  cambria: 'Cambria',
  caladea: 'Cambria',
  arial: 'Arial',
  helvetica: 'Arial',
  'liberation sans': 'Arial',
  'times new roman': 'Times New Roman',
  times: 'Times New Roman',
  'liberation serif': 'Times New Roman',
  'courier new': 'Courier New',
  courier: 'Courier New',
  'liberation mono': 'Courier New',
  'segoe ui': 'Segoe UI',
  selawik: 'Segoe UI',
  georgia: 'Georgia',
  gelasio: 'Georgia',
  'comic sans ms': 'Comic Sans MS',
  'comic relief': 'Comic Relief',
};

const DIRECT_FAMILIES = new Set(
  FONT_FACES.flatMap((face) => [face.family.toLowerCase(), face.bundledFamily.toLowerCase()]),
);

const SERIF_HINTS = ['cambria', 'times', 'georgia', 'serif', 'garamond', 'book antiqua', 'palatino'];

const byteCache = new Map<string, Promise<ArrayBuffer>>();
const BASE = '/fonts/';

function loadFile(file: string): Promise<ArrayBuffer> {
  const cached = byteCache.get(file);
  if (cached) return cached;
  const promise = fetch(`${BASE}${file}`, { credentials: 'omit', cache: 'force-cache' }).then(async (response) => {
    if (!response.ok) throw new Error(`Font ${file} could not be loaded (HTTP ${response.status}).`);
    return response.arrayBuffer();
  });
  promise.catch(() => byteCache.delete(file));
  byteCache.set(file, promise);
  return promise;
}

function specFor(family: string, bold: boolean, italic: boolean): BundledFaceSpec | undefined {
  const resolved = OFFICE_ALIASES[family.toLowerCase()] ?? family;
  return FONT_FACES.find(
    (face) =>
      face.family.toLowerCase() === resolved.toLowerCase() &&
      face.weight === (bold ? 700 : 400) &&
      face.style === (italic ? 'italic' : 'normal'),
  );
}

function loaderFor(spec: BundledFaceSpec | undefined, measureAs?: string) {
  if (!spec) return undefined;
  const loader = (() => loadFile(spec.file)) as (() => Promise<ArrayBuffer>) & { measureAs?: string };
  if (measureAs) loader.measureAs = measureAs;
  return loader;
}

function isSerif(family: string): boolean {
  const lower = family.toLowerCase();
  return SERIF_HINTS.some((hint) => lower.includes(hint));
}

/**
 * Word layout provider. Everything is fetched lazily from the same origin; a
 * document that never mentions a family never downloads its faces.
 */
export const officeFontProvider: BundledFontProvider = {
  resolve(family, bold, italic) {
    const spec = specFor(family, bold, italic);
    return loaderFor(spec, family);
  },
  resolveFamily(family, bold, italic) {
    const spec = specFor(family, bold, italic) ?? specFor(OFFICE_ALIASES[family.toLowerCase()] ?? family, bold, italic);
    return loaderFor(spec);
  },
  resolveLastResort(family, bold, italic) {
    const fallback = isSerif(family) ? 'Times New Roman' : 'Arial';
    return loaderFor(specFor(fallback, bold, italic), family);
  },
};

export function hasBundledFamily(family: string): boolean {
  return DIRECT_FAMILIES.has(family.toLowerCase()) || family.toLowerCase() in OFFICE_ALIASES;
}

export interface PptxFontFaceLike {
  family: string;
  bold?: boolean;
  italic?: boolean;
  bytes: Uint8Array;
}

let pptxFontsPromise: Promise<PptxFontFaceLike[]> | undefined;

/** Font faces required by PptxEditor, loaded once per page. */
export function loadPptxFonts(): Promise<PptxFontFaceLike[]> {
  pptxFontsPromise ??= Promise.all(
    FONT_FACES.map(async (face) => ({
      family: face.family,
      bold: face.weight === 700,
      italic: face.style === 'italic',
      bytes: new Uint8Array(await loadFile(face.file)),
    })),
  ).catch((error) => {
    pptxFontsPromise = undefined;
    throw error;
  });
  return pptxFontsPromise;
}
