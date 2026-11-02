/**
 * Copies the metric-compatible font faces the editors use into the web app's
 * public directory. The @betteroffice/fonts package also ships CJK faces and
 * many display families; copying only this curated Latin set keeps the static
 * bundle small while still covering the fonts most Office documents use.
 */
import { createRequire } from 'node:module';
import { copyFileSync, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, '..');
const publicFonts = join(root, 'apps', 'web', 'public', 'fonts');
const publicLicenses = join(root, 'apps', 'web', 'public', 'licenses');

const LICENSE_FILES = [
  'OFL-Carlito.txt',
  'OFL-Caladea.txt',
  'OFL-Liberation.txt',
  'OFL-Selawik.txt',
  'OFL-Gelasio.txt',
  'OFL-ComicRelief.txt',
];

const FONT_FILES = [
  'Carlito-Regular.ttf',
  'Carlito-Bold.ttf',
  'Carlito-Italic.ttf',
  'Carlito-BoldItalic.ttf',
  'Caladea-Regular.ttf',
  'Caladea-Bold.ttf',
  'Caladea-Italic.ttf',
  'Caladea-BoldItalic.ttf',
  'LiberationSans-Regular.ttf',
  'LiberationSans-Bold.ttf',
  'LiberationSans-Italic.ttf',
  'LiberationSans-BoldItalic.ttf',
  'LiberationSerif-Regular.ttf',
  'LiberationSerif-Bold.ttf',
  'LiberationSerif-Italic.ttf',
  'LiberationSerif-BoldItalic.ttf',
  'LiberationMono-Regular.ttf',
  'LiberationMono-Bold.ttf',
  'LiberationMono-Italic.ttf',
  'LiberationMono-BoldItalic.ttf',
  'Selawik-Regular.ttf',
  'Selawik-Bold.ttf',
  'Gelasio-Regular.ttf',
  'Gelasio-Bold.ttf',
  'Gelasio-Italic.ttf',
  'Gelasio-BoldItalic.ttf',
  'ComicRelief-Regular.ttf',
  'ComicRelief-Bold.ttf',
];

function findAssetsDir() {
  const require = createRequire(import.meta.url);
  const candidates = [];
  try {
    candidates.push(resolve(dirname(require.resolve('@betteroffice/fonts/package.json')), 'assets'));
  } catch {
    // The package may not be installed yet; fall back to workspace locations.
  }
  candidates.push(join(root, 'node_modules', '@betteroffice', 'fonts', 'assets'));
  candidates.push(join(root, 'apps', 'web', 'node_modules', '@betteroffice', 'fonts', 'assets'));
  return candidates.find((candidate) => existsSync(join(candidate, 'Carlito-Regular.ttf')));
}

const assets = findAssetsDir();
if (!assets) {
  console.warn('[fonts] @betteroffice/fonts is not installed yet; skipping editor font copy.');
  process.exit(0);
}

mkdirSync(publicFonts, { recursive: true });
mkdirSync(publicLicenses, { recursive: true });
let copied = 0;
for (const file of FONT_FILES) {
  const source = join(assets, file);
  if (!existsSync(source)) {
    console.warn(`[fonts] missing ${file}; skipping.`);
    continue;
  }
  copyFileSync(source, join(publicFonts, file));
  copied += 1;
}
console.log(`[fonts] copied ${copied}/${FONT_FILES.length} faces to apps/web/public/fonts`);

const licenseSource = join(assets, '..', 'LICENSES');
let licensesCopied = 0;
for (const file of LICENSE_FILES) {
  const source = join(licenseSource, file);
  if (!existsSync(source)) continue;
  copyFileSync(source, join(publicLicenses, file));
  licensesCopied += 1;
}
const carlito = join(licenseSource, 'OFL-Carlito.txt');
if (existsSync(carlito)) {
  const text = readFileSync(carlito, 'utf8');
  const marker = text.indexOf('SIL OPEN FONT LICENSE');
  if (marker >= 0) writeFileSync(join(publicLicenses, 'OFL-1.1.txt'), text.slice(marker));
}
const apache = join(root, 'LICENSE');
if (existsSync(apache)) copyFileSync(apache, join(publicLicenses, 'APACHE-2.0.txt'));
console.log(`[fonts] copied ${licensesCopied} font license notices to apps/web/public/licenses`);
