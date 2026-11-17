import AxeBuilder from '@axe-core/playwright';
import { expect, test, type APIRequestContext, type Page } from '@playwright/test';

/**
 * Platform quality: security headers, the web app manifest and icons, sitemap and robots, legacy
 * redirects, the offline page, the designed global 404, and (production builds only) the service
 * worker saving pages for offline use.
 *
 * Conventions as in smoke.spec.ts: `getByRole` locators, an axe scan (WCAG 2.0 to 2.2 A and AA)
 * on every page this feature owns, English strings from src/lib/i18n/features/platform.ts.
 */

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];
type AxePage = ConstructorParameters<typeof AxeBuilder>[0]['page'];

async function expectNoAxeViolations(page: Page) {
  const results = await new AxeBuilder({ page: page as unknown as AxePage }).withTags(AXE_TAGS).analyze();
  const summary = results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
  expect(summary, 'axe violations').toEqual([]);
}

async function expectNoHorizontalOverflow(page: Page) {
  const { scrollWidth, clientWidth } = await page.evaluate(() => ({
    scrollWidth: document.documentElement.scrollWidth,
    clientWidth: document.documentElement.clientWidth,
  }));
  expect(scrollWidth, 'page scrolls sideways').toBeLessThanOrEqual(clientWidth);
}

/** `next dev` adds `'unsafe-eval'` to the CSP; production never does. */
async function isDevServer(request: APIRequestContext): Promise<boolean> {
  const response = await request.get('/en/offline');
  return (response.headers()['content-security-policy'] ?? '').includes('unsafe-eval');
}

test.describe('security headers', () => {
  test('every response carries the security headers', async ({ request }) => {
    for (const path of ['/en', '/ms/kul', '/manifest.webmanifest', '/api/health']) {
      const headers = (await request.get(path)).headers();
      expect(headers['content-security-policy'], path).toContain("default-src 'self'");
      expect(headers['content-security-policy'], path).toContain("frame-ancestors 'none'");
      expect(headers['strict-transport-security'], path).toContain('max-age=');
      expect(headers['x-content-type-options'], path).toBe('nosniff');
      expect(headers['referrer-policy'], path).toBe('strict-origin-when-cross-origin');
      expect(headers['permissions-policy'], path).toContain('camera=()');
      expect(headers['permissions-policy'], path).toContain('geolocation=()');
      expect(headers['cross-origin-opener-policy'], path).toBe('same-origin');
      expect(headers['x-powered-by'], path).toBeUndefined();
    }
    expect((await request.get('/api/health')).headers()['cross-origin-resource-policy']).toBe('same-origin');
  });

  test('production pages raise no CSP violations', async ({ page, request }) => {
    test.skip(await isDevServer(request), 'The development CSP is looser; judge against a production build.');
    await page.addInitScript(() => {
      const found: string[] = [];
      (window as unknown as { __csp: string[] }).__csp = found;
      document.addEventListener('securitypolicyviolation', (event) => found.push(`${event.effectiveDirective} ${event.blockedURI}`));
    });
    for (const path of ['/en', '/en/kul', '/en/offline', '/ms/kul/parking']) {
      await page.goto(path);
      await page.waitForLoadState('networkidle');
      const violations = await page.evaluate(() => (window as unknown as { __csp: string[] }).__csp);
      // zod probes `new Function` once while building schemas; see platform hand-off, "Requests".
      expect(violations.filter((violation) => !/^script-src eval$/.test(violation)), path).toEqual([]);
    }
  });
});

test.describe('installability', () => {
  test('the manifest is linked, valid and its icons load', async ({ page, request }) => {
    await page.goto('/en');
    const href = await page.locator('link[rel="manifest"]').getAttribute('href');
    expect(href).toBeTruthy();
    const response = await request.get(href ?? '/manifest.webmanifest');
    expect(response.headers()['content-type']).toContain('manifest+json');
    const manifest = (await response.json()) as { name: string; start_url: string; display: string; icons: { src: string; sizes: string; purpose: string }[] };
    expect(manifest.name).toBe('Malaysia Airports');
    expect(manifest.start_url).toBe('/');
    expect(manifest.display).toBe('standalone');
    expect(manifest.icons.map((icon) => icon.purpose)).toEqual(['any', 'any', 'maskable']);
    for (const icon of manifest.icons) {
      const image = await request.get(icon.src);
      expect(image.status(), icon.src).toBe(200);
      expect(image.headers()['content-type'], icon.src).toBe('image/png');
    }
    await expect(page.locator('link[rel="apple-touch-icon"]')).toHaveCount(1);
    // Next.js 16.4 serves one static image under the root `[lang]` segment for both locales, at
    // `/-/opengraph-image.png?<hash>` (measured in the production build), so check that the URL is
    // absolute and that the image itself loads.
    const ogImage = page.locator('meta[property="og:image"]');
    await expect(ogImage).toHaveAttribute('content', /^https?:\/\/[^/]+\/[^/]+\/opengraph-image\.png/);
    const ogUrl = new URL((await ogImage.getAttribute('content')) ?? '');
    const og = await request.get(`${ogUrl.pathname}${ogUrl.search}`);
    expect(og.status()).toBe(200);
    expect(og.headers()['content-type']).toBe('image/png');
  });
});

test.describe('search engines', () => {
  test('the sitemap lists both languages with hreflang alternates', async ({ request }) => {
    const response = await request.get('/sitemap.xml');
    expect(response.status()).toBe(200);
    const xml = await response.text();
    expect(xml).toMatch(/<loc>[^<]*\/en\/kul<\/loc>/);
    expect(xml).toMatch(/<loc>[^<]*\/ms\/kul<\/loc>/);
    expect(xml).toMatch(/<loc>[^<]*\/ms\/guides\/baggage<\/loc>/);
    expect(xml).toContain('hreflang="ms"');
    expect(xml).toContain('hreflang="x-default"');
    expect(xml).not.toMatch(/\/(?:en|ms)\/(?:search|journey|offline)</);
  });

  test('every sitemap URL answers 200 (production)', async ({ request }) => {
    test.skip(await isDevServer(request), 'The dev server compiles each page on first visit; run against a production build.');
    const xml = await (await request.get('/sitemap.xml')).text();
    const paths = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname);
    expect(paths.length).toBeGreaterThan(100);
    for (let index = 0; index < paths.length; index += 12) {
      const batch = paths.slice(index, index + 12);
      const statuses = await Promise.all(batch.map(async (path) => [path, (await request.get(path, { maxRedirects: 0 })).status()] as const));
      for (const [path, status] of statuses) expect(status, path).toBe(200);
    }
  });

  test('robots.txt points to the sitemap and keeps crawlers out of the API', async ({ request }) => {
    const text = await (await request.get('/robots.txt')).text();
    expect(text).toMatch(/Sitemap: .*\/sitemap\.xml/);
    expect(text).toContain('Disallow: /api/');
  });
});

test.describe('legacy MAHB URLs', () => {
  test('old airport paths redirect to the new structure', async ({ request }) => {
    const cases: [string, number, string][] = [
      ['/en/klia1/parking', 308, '/en/kul/parking?t=T1'],
      ['/en/klia2/flight-information/departures', 308, '/en/kul/flights?t=T2&dir=d'],
      ['/en/penang/air-travel/baggage', 308, '/en/guides/baggage'],
      ['/en/kuching/parking', 307, '/en/kch'],
    ];
    for (const [from, status, to] of cases) {
      const response = await request.get(from, { maxRedirects: 0 });
      expect(response.status(), from).toBe(status);
      expect(response.headers().location, from).toBe(to);
    }
  });

  test('a visitor following an old link lands on the right page', async ({ page }) => {
    await page.goto('/en/klia2/air-travel/parking');
    await expect(page).toHaveURL(/\/en\/kul\/parking\?t=T2$/);
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
  });
});

test.describe('offline page', () => {
  test('renders in both languages and explains what works offline', async ({ page }) => {
    await page.goto('/en/offline');
    await expect(page).toHaveTitle(/Offline access/);
    await expect(page.getByRole('heading', { level: 1, name: 'Offline access' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Your connection' })).toBeVisible();
    await expect(page.getByText('You are online', { exact: true })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'What works without a connection' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'What needs a connection' })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Before you lose signal' })).toBeVisible();
    await expect(page.getByRole('link', { name: /Your journey/ })).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Keep it on your home screen' })).toBeVisible();
    await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
    await expectNoHorizontalOverflow(page);
    await expectNoAxeViolations(page);

    await page.goto('/ms/offline');
    await expect(page.getByRole('heading', { level: 1, name: 'Akses luar talian' })).toBeVisible();
  });

  test('says when the page asked for was not saved', async ({ page }) => {
    await page.goto('/en/offline?from=%2Fen%2Fkul%2Flounges');
    await expect(page.getByText('That page is not saved on this device')).toBeVisible();
    await expect(page.getByText('/en/kul/lounges')).toBeVisible();
  });

  test('the indicator appears when the connection drops', async ({ page, context }) => {
    await page.goto('/en/offline');
    await expect(page.getByText('You are online', { exact: true })).toBeVisible();
    await context.setOffline(true);
    await expect(page.getByRole('status').filter({ hasText: 'You are offline: showing saved information' })).toBeVisible();
    await expect(page.getByText('You are offline', { exact: true })).toBeVisible();
    await expectNoAxeViolations(page);
    await context.setOffline(false);
    await expect(page.getByRole('status').filter({ hasText: 'Back online' })).toBeVisible();
  });
});

test.describe('service worker (production)', () => {
  test('saves the pages you open and serves them without a connection', async ({ page, context, request }) => {
    test.skip(await isDevServer(request), 'The service worker is registered in production builds only.');
    await page.goto('/en/kul/parking');
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller)), { timeout: 20_000 }).toBe(true);
    await expect
      .poll(() => page.evaluate(async () => (await (await caches.open('ma-v1-pages')).keys()).map((key) => new URL(key.url).pathname)), { timeout: 20_000 })
      .toEqual(expect.arrayContaining(['/en/kul/parking', '/en/offline', '/en']));

    await context.setOffline(true);
    await page.reload();
    await expect(page).toHaveTitle(/Parking/);
    await expect(page.getByRole('status').filter({ hasText: 'showing saved information' })).toBeVisible();

    await page.goto('/en/offline');
    await expect(page.getByRole('list', { name: 'Saved pages' }).getByRole('link')).not.toHaveCount(0);
    await context.setOffline(false);
  });
});

test.describe('global not-found page', () => {
  test('unmatched URLs get the designed, bilingual 404', async ({ page, request }) => {
    const response = await request.get('/no-such-file.txt');
    expect(response.status()).toBe(404);
    await page.goto('/no-such-file.txt');
    await expect(page.getByRole('heading', { level: 1, name: 'Page not found' })).toBeVisible();
    await expect(page.getByText('Halaman tidak ditemui')).toBeVisible();
    await expect(page.getByRole('search').getByRole('searchbox')).toBeVisible();
    await expect(page.getByRole('link', { name: 'Go to the home page' })).toHaveAttribute('href', '/en');
    await expect(page.getByRole('link', { name: 'Pergi ke laman utama' })).toHaveAttribute('href', '/ms');
    await expectNoHorizontalOverflow(page);
    await expectNoAxeViolations(page);

    await page.getByRole('searchbox').fill('parking');
    await page.getByRole('button', { name: 'Search' }).click();
    await expect(page).toHaveURL(/\/en\/search\?q=parking/);
  });
});
