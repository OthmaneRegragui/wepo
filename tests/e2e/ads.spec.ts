import { expect, test, type Page } from '@playwright/test';

const AD_SCRIPT_PATTERN =
  /https:\/\/(www\.highrevenueformat\.com|pl32158799\.profitableratecpmnetwork\.com|pl32158800\.profitableratecpmnetwork\.com)\//;

const EXPECTED = {
  '728x90': { key: '6bb53be6eeea914dfa850468e90ae4a7', width: 728, height: 90 },
  '468x60': { key: '0577b959c87d94640b8c1dcb214707e8', width: 468, height: 60 },
  '320x50': { key: '36b036ba48ba6f32b725629e173f1a14', width: 320, height: 50 },
  '300x250': { key: '79de0dfa7ca75109fde53a09034cde06', width: 300, height: 250 },
  '160x600': { key: '1113bb33477a8a7b65f663417944ee60', width: 160, height: 600 },
  '160x300': { key: '2a9d3aac7fcb001a9a6cc647bdbbe801', width: 160, height: 300 },
} as const;

async function installAdStubs(page: Page): Promise<void> {
  await page.route(AD_SCRIPT_PATTERN, async (route) => {
    const url = route.request().url();

    if (url.includes('highrevenueformat.com')) {
      const key = url.split('/').at(-2) ?? '';
      await route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: `
          window.__adOptionsLog = window.__adOptionsLog || [];
          var options = window.atOptions || null;
          window.__adOptionsLog.push({
            key: options && options.key,
            width: options && options.width,
            height: options && options.height,
            format: options && options.format,
            params: options && options.params,
            at: Date.now()
          });
          var marker = document.createElement('div');
          marker.className = 'wepo-test-banner';
          marker.dataset.adKey = ${JSON.stringify(key)};
          marker.textContent = 'Test banner';
          marker.style.cssText = 'width:100%;height:100%;display:grid;place-items:center;background:#eef2ff;color:#1e3a8a;font:12px sans-serif';
          if (document.currentScript && document.currentScript.parentElement) {
            document.currentScript.parentElement.appendChild(marker);
          }
        `,
      });
      return;
    }

    if (url.includes('pl32158800')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: `
          window.__nativeLoads = (window.__nativeLoads || 0) + 1;
          var container = document.getElementById('container-01172eeac3fec1aa2688cd2353c20091');
          if (container) {
            container.dataset.nativeLoaded = 'true';
            container.textContent = 'Test native ad';
          }
        `,
      });
      return;
    }

    await route.fulfill({
      status: 200,
      contentType: 'application/javascript',
      body: `
        window.__socialLoads = (window.__socialLoads || 0) + 1;
        var overlay = document.createElement('div');
        overlay.id = 'wepo-test-social-overlay';
        overlay.textContent = 'Social bar test';
        overlay.style.cssText = 'position:fixed;left:0;top:0;z-index:2147483647;background:#fde68a;color:#78350f;padding:2px 6px;font:10px sans-serif';
        document.body.appendChild(overlay);
      `,
    });
  });
}

async function adKeys(page: Page): Promise<string[]> {
  return page.$$eval('script[data-wepo-ad-key]', (scripts) =>
    scripts.map((script) => script.getAttribute('data-wepo-ad-key') ?? ''),
  );
}

test('desktop home loads every classic banner sequentially with the exact options', async ({ page }) => {
  await installAdStubs(page);
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Your office suite/i })).toBeVisible();

  await page.waitForFunction(() => (window as Window & { __adOptionsLog?: unknown[] }).__adOptionsLog?.length === 4, undefined, {
    timeout: 30_000,
  });

  const log = await page.evaluate(
    () => (window as Window & { __adOptionsLog: Array<Record<string, unknown>> }).__adOptionsLog,
  );
  expect(log).toHaveLength(4);
  expect(new Set(log.map((entry) => entry.key)).size).toBe(4);

  for (const size of ['728x90', '468x60', '300x250', '160x600'] as const) {
    const expected = EXPECTED[size];
    expect(log).toContainEqual(
      expect.objectContaining({
        key: expected.key,
        width: expected.width,
        height: expected.height,
        format: 'iframe',
        params: {},
      }),
    );
  }

  expect((await adKeys(page)).sort()).toEqual(
    [EXPECTED['728x90'].key, EXPECTED['468x60'].key, EXPECTED['300x250'].key, EXPECTED['160x600'].key].sort(),
  );
  expect(await page.locator(`script[data-wepo-ad-key="${EXPECTED['160x300'].key}"]`).count()).toBe(0);
  expect(await page.locator(`script[data-wepo-ad-key="${EXPECTED['320x50'].key}"]`).count()).toBe(0);

  expect(await page.evaluate(() => (window as Window & { __nativeLoads?: number }).__nativeLoads)).toBe(1);
  expect(await page.evaluate(() => (window as Window & { __socialLoads?: number }).__socialLoads)).toBe(1);
  await expect(page.locator('[data-wepo-native-container]')).toHaveAttribute('data-native-loaded', 'true');
  await expect(page.locator('[data-wepo-ad-slot][data-ad-status="loaded"]')).toHaveCount(5);

  const smartlink = page.locator('[data-wepo-smartlink]');
  await expect(smartlink).toHaveAttribute('target', '_blank');
  await expect(smartlink).toHaveAttribute('rel', 'nofollow sponsored noopener noreferrer');
  await expect(smartlink).toHaveAttribute(
    'href',
    'https://www.profitableratecpmnetwork.com/tkzx5mzr34?key=54997fdb6af0107e9fbbb2ccec5c6552',
  );

  expect(await page.evaluate(() => crossOriginIsolated)).toBe(true);
});

test.describe('mobile', () => {
  test.use({ viewport: { width: 390, height: 844 } });

  test('mobile home uses the mobile banner, native banner, and no desktop widths', async ({ page }) => {
    await installAdStubs(page);
    await page.goto('/');
    await expect(page.getByRole('heading', { name: /Your office suite/i })).toBeVisible();

    await page.waitForFunction(
      () => (window as Window & { __adOptionsLog?: unknown[] }).__adOptionsLog?.length === 2,
      undefined,
      { timeout: 30_000 },
    );

    expect((await adKeys(page)).sort()).toEqual([EXPECTED['320x50'].key, EXPECTED['300x250'].key].sort());
    for (const size of ['728x90', '468x60', '160x600', '160x300'] as const) {
      expect(await page.locator(`script[data-wepo-ad-key="${EXPECTED[size].key}"]`).count(), size).toBe(0);
    }

    expect(await page.evaluate(() => (window as Window & { __nativeLoads?: number }).__nativeLoads)).toBe(1);
    expect(await page.evaluate(() => (window as Window & { __socialLoads?: number }).__socialLoads)).toBe(1);
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
  });
});

test('Social Bar is initialised once and hidden as soon as the route leaves the dashboard', async ({ page }) => {
  await installAdStubs(page);
  await page.goto('/');
  await expect.poll(async () => page.evaluate(() => (window as Window & { __socialLoads?: number }).__socialLoads)).toBe(1);

  const overlay = page.locator('#wepo-test-social-overlay');
  await expect(overlay).toBeVisible();

  await page.locator('footer').getByRole('link', { name: 'Privacy' }).click();
  await expect(page).toHaveURL(/\/privacy$/);
  await expect(page.locator('html')).toHaveAttribute('data-wepo-ads-suppressed', 'true');
  await expect(overlay).toBeHidden();
  await expect(page.locator('[data-wepo-ad-slot]')).toHaveCount(0);
  expect(await page.evaluate(() => (window as Window & { __socialLoads?: number }).__socialLoads)).toBe(1);

  await page.getByRole('banner').getByRole('link', { name: 'Wepo Office home' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.locator('html')).not.toHaveAttribute('data-wepo-ads-suppressed', 'true');
  await expect(overlay).toBeVisible();
  expect(await page.evaluate(() => (window as Window & { __socialLoads?: number }).__socialLoads)).toBe(1);
});

test('editor routes load no ad scripts and keep cross-origin isolation', async ({ page }) => {
  await installAdStubs(page);
  await page.goto('/word/edit');
  await expect(page).toHaveURL(/\/word\/edit/);

  await expect(page.locator('[data-wepo-ad-slot]')).toHaveCount(0);
  expect(await page.locator('script[data-wepo-ad-key], script[data-wepo-native-key], script[data-wepo-social-bar]').count()).toBe(0);
  expect(await page.evaluate(() => crossOriginIsolated)).toBe(true);
});

test('blocked ad scripts fail gracefully without breaking the page', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));
  await page.route(AD_SCRIPT_PATTERN, (route) => route.abort());

  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Your office suite/i })).toBeVisible();
  await expect(page.locator('[data-wepo-ad-slot][data-ad-status="failed"]').first()).toBeVisible({ timeout: 20_000 });
  await expect(page.getByRole('button', { name: /Open a document/i }).first()).toBeEnabled();
  expect(pageErrors).toEqual([]);
});
