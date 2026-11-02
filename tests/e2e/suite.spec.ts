import { expect, test, type Page } from '@playwright/test';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const samplesDir = path.resolve(process.cwd(), 'apps/web/public/samples');
const fixturesDir = path.resolve(process.cwd(), 'tests/e2e/fixtures');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    // Force the deterministic download fallback in headless Chromium.
    delete (window as Window & { showSaveFilePicker?: unknown }).showSaveFilePicker;
  });
});

async function openSample(page: Page, kind: 'word' | 'sheets' | 'slides', file: string) {
  await page.goto(`/${kind}`);
  await page.locator('input[type="file"]').first().setInputFiles(file);
  await page.waitForURL(new RegExp(`/${kind}/edit`), { timeout: 30_000 });
}

async function readySaveButton(page: Page) {
  const save = page.getByRole('button', { name: /Save a copy/i });
  await expect(save).toBeVisible({ timeout: 30_000 });
  await expect(save).toBeEnabled({ timeout: 120_000 });
  return save;
}

async function expectZipDownload(downloadPath: string, extension: string) {
  expect(path.extname(downloadPath).toLowerCase()).toBe(extension);
  const bytes = readFileSync(downloadPath);
  expect(bytes.byteLength).toBeGreaterThan(0);
  expect(bytes[0]).toBe(0x50);
  expect(bytes[1]).toBe(0x4b);
}

test('dashboard and landing pages expose metadata', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /office suite/i }).first()).toBeVisible();
  await expect(page).toHaveTitle(/Wepo Office/i);

  await page.goto('/word');
  await expect(page.getByRole('heading', { name: /Word/i }).first()).toBeVisible();

  await page.goto('/sheets');
  await expect(page.getByRole('heading', { name: /Sheets/i }).first()).toBeVisible();

  await page.goto('/slides');
  await expect(page.getByRole('heading', { name: /Slides/i }).first()).toBeVisible();

  await page.goto('/privacy');
  await expect(page.getByRole('heading', { name: /Privacy/i }).first()).toBeVisible();
});

test('Word opens a DOCX and saves a new copy', async ({ page }) => {
  await openSample(page, 'word', path.join(samplesDir, 'sample.docx'));
  await expect(page.getByText('sample.docx').first()).toBeVisible();

  const save = await readySaveButton(page);
  const downloadPromise = page.waitForEvent('download', { timeout: 120_000 });
  await save.click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('sample-edited.docx');
  const target = test.info().outputPath('sample-edited.docx');
  await download.saveAs(target);
  await expectZipDownload(target, '.docx');
});

test('Sheets opens formulas and edits a cell', async ({ page }) => {
  await openSample(page, 'sheets', path.join(samplesDir, 'sample.xlsx'));
  await expect(page.locator('[data-testid="xlsx-sheet-tabs"]')).toBeVisible({ timeout: 60_000 });
  await expect(page.getByRole('tab', { name: /Budget/i })).toBeVisible();
  await expect(page.getByRole('tab', { name: /Notes/i })).toBeVisible();

  const nameBox = page.locator('[data-testid="xlsx-name-box"]');
  const formula = page.locator('[data-testid="xlsx-formula-input"]');

  await nameBox.click();
  await nameBox.fill('B10');
  await nameBox.press('Enter');
  await expect(formula).toHaveValue('=MAX(B4:E7)', { timeout: 10_000 });

  await nameBox.click();
  await nameBox.fill('F4');
  await nameBox.press('Enter');
  await expect(formula).toHaveValue('=SUM(B4:E4)', { timeout: 10_000 });

  await formula.click();
  await formula.fill('=1+2');
  await formula.press('Enter');
  await expect(page.getByText(/Unsaved changes/i)).toBeVisible({ timeout: 10_000 });

  await nameBox.click();
  await nameBox.fill('F4');
  await nameBox.press('Enter');
  await expect(formula).toHaveValue('=1+2', { timeout: 10_000 });
});

test('Sheets imports CSV as a local XLSX workbook', async ({ page }) => {
  await openSample(page, 'sheets', path.join(fixturesDir, 'sales.csv'));
  await expect(page.getByText(/CSV converted locally/i)).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('sales.xlsx').first()).toBeVisible();
  await expect(page.locator('[data-testid="xlsx-sheet-tabs"]')).toBeVisible({ timeout: 60_000 });
  // SheetJS parses a CSV into a single worksheet named "Sheet1".
  await expect(page.getByRole('tab', { name: /Sheet1/i })).toBeVisible();

  const nameBox = page.locator('[data-testid="xlsx-name-box"]');
  const formula = page.locator('[data-testid="xlsx-formula-input"]');
  await nameBox.click();
  await nameBox.fill('A1');
  await nameBox.press('Enter');
  await expect(formula).toHaveValue('Region', { timeout: 10_000 });

  await nameBox.click();
  await nameBox.fill('B2');
  await nameBox.press('Enter');
  await expect(formula).toHaveValue('12', { timeout: 10_000 });
});

test('Sheets exports the first visible worksheet as CSV', async ({ page }) => {
  await openSample(page, 'sheets', path.join(samplesDir, 'sample.xlsx'));
  await expect(page.locator('[data-testid="xlsx-sheet-tabs"]')).toBeVisible({ timeout: 60_000 });

  const downloadPromise = page.waitForEvent('download', { timeout: 60_000 });
  await page.getByRole('button', { name: /^CSV$/ }).click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('sample-export.csv');
  const target = test.info().outputPath('sample-export.csv');
  await download.saveAs(target);
  const csv = readFileSync(target, 'utf8');
  expect(csv).toContain('Item,Q1,Q2,Q3,Q4,Total,Average');
  expect(csv).toContain('Design,1200,1500,1800,2100');
  expect(csv).not.toContain('Notes');
});

test('Sheets saves a new XLSX copy', async ({ page }) => {
  await openSample(page, 'sheets', path.join(samplesDir, 'sample.xlsx'));
  await expect(page.locator('[data-testid="xlsx-sheet-tabs"]')).toBeVisible({ timeout: 60_000 });

  const save = await readySaveButton(page);
  const downloadPromise = page.waitForEvent('download', { timeout: 120_000 });
  await save.click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('sample-edited.xlsx');
  const target = test.info().outputPath('sample-edited.xlsx');
  await download.saveAs(target);
  await expectZipDownload(target, '.xlsx');
});

test('Slides adds a slide and saves a new PPTX copy', async ({ page }) => {
  await openSample(page, 'slides', path.join(samplesDir, 'sample.pptx'));
  await expect(page.getByText('sample.pptx').first()).toBeVisible();

  const addSlide = page.getByRole('button', { name: /Add slide/i });
  await expect(addSlide).toBeVisible({ timeout: 60_000 });
  await addSlide.click();
  await expect(page.getByText(/Unsaved changes/i)).toBeVisible({ timeout: 15_000 });

  const save = await readySaveButton(page);
  const downloadPromise = page.waitForEvent('download', { timeout: 120_000 });
  await save.click();
  const download = await downloadPromise;

  expect(download.suggestedFilename()).toBe('sample-edited.pptx');
  const target = test.info().outputPath('sample-edited.pptx');
  await download.saveAs(target);
  await expectZipDownload(target, '.pptx');
});

test('legacy DOC files are rejected without opening an editor', async ({ page }) => {
  await page.goto('/word');
  await page.locator('input[type="file"]').first().setInputFiles(path.join(fixturesDir, 'legacy.doc'));

  await expect(page.getByText(/Could not open the file/i)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/DOC files are not supported/i)).toBeVisible();
  await expect(page).toHaveURL(/\/word$/);
  await expect(page.getByRole('button', { name: /Save a copy/i })).toHaveCount(0);
});

