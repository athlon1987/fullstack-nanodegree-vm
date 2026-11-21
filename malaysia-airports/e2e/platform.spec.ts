import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { expectNoAxeViolations } from './support/axe';

/**
 * Platform quality: security headers, the web app manifest and icons, sitemap and robots, legacy
 * redirects, the offline page, the designed global 404, and (production builds only) the service
 * worker saving pages for offline use.
 *
 * Conventions as in smoke.spec.ts: `getByRole` locators, the shared axe scan from
 * `e2e/support/axe.ts` (WCAG 2.0, 2.1 and 2.2, A and AA) on every page this feature owns,
 * English strings from src/lib/i18n/features/platform.ts. Also the API hardening of the fix
 * round: concierge origin and media-type checks, JSON 404s, the public health body, request
 * limits, canonical and hreflang links, and the report-only CSP.
 */

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
      // Only the enforced policy counts here. The report-only policy (security-07) is expected to
      // report the framework's inline scripts until hashes and nonces replace 'unsafe-inline'.
      document.addEventListener('securitypolicyviolation', (event) => {
        if (event.disposition === 'enforce') found.push(`${event.effectiveDirective} ${event.blockedURI}`);
      });
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

test.describe('API hardening (fix round)', () => {
  test('the concierge refuses other sites and look-alike media types before counting them', async ({ request }) => {
    const crossSite = await request.post('/api/concierge', {
      data: { question: 'Where can I pray?', lang: 'en' },
      headers: { Origin: 'https://evil.example', 'Sec-Fetch-Site': 'cross-site' },
    });
    expect(crossSite.status()).toBe(403);
    expect(crossSite.headers()['x-ratelimit-remaining']).toBeUndefined();
    const noCors = await request.post('/api/concierge', {
      data: '{"question":"hi","lang":"en"}',
      headers: { 'Content-Type': 'text/plain;x=application/json' },
    });
    expect(noCors.status()).toBe(415);
    const tooLarge = await request.post('/api/concierge', { data: JSON.stringify({ question: 'x'.repeat(5000), lang: 'en' }), headers: { 'Content-Type': 'application/json' } });
    expect([413, 429]).toContain(tooLarge.status());
  });

  test('unknown API paths answer a small JSON 404, and the flights API refuses ambiguous queries', async ({ request }) => {
    for (const path of ['/api/nope', '/api', '/api/nope/deeper']) {
      const response = await request.get(path);
      expect(response.status(), path).toBe(404);
      expect(response.headers()['content-type'], path).toContain('application/json');
      expect(await response.json(), path).toEqual({ error: { code: 'not_found', message: 'No such API endpoint.' } });
    }
    expect((await request.get('/api/flights?airport=kul&airport=pen')).status()).toBe(400);
    expect((await request.get('/api/flights?airport=kul&date=1900-01-01')).status()).toBe(400);
    expect((await request.head('/api/flights?airport=kul')).status()).toBe(200);
  });

  test('the public health check says only that the service is up and which build runs', async ({ request }) => {
    const body = (await (await request.get('/api/health')).json()) as Record<string, unknown>;
    expect(Object.keys(body).sort()).toEqual(['build', 'status']);
    expect(body.status).toBe('ok');
    expect(JSON.stringify(body)).not.toMatch(/node|environment|v\d+\.\d+\.\d+/i);
  });

  test('every localised page names its canonical URL and both languages', async ({ request }) => {
    for (const [path, rest] of [['/en', ''], ['/ms/kul/parking', '/kul/parking'], ['/en/guides/baggage', '/guides/baggage']] as const) {
      const link = (await request.get(path, { maxRedirects: 0 })).headers().link ?? '';
      const lang = path.split('/')[1];
      expect(link, path).toMatch(new RegExp(`<[^>]*/${lang}${rest}>; rel="canonical"`));
      expect(link, path).toMatch(new RegExp(`<[^>]*/en${rest}>; rel="alternate"; hreflang="en"`));
      expect(link, path).toMatch(new RegExp(`<[^>]*/ms${rest}>; rel="alternate"; hreflang="ms"`));
    }
  });

  test('a stricter report-only policy reports to this site', async ({ request }) => {
    const headers = (await request.get('/en')).headers();
    expect(headers['content-security-policy-report-only']).toContain("require-trusted-types-for 'script'");
    expect(headers['content-security-policy-report-only']).toMatch(/script-src 'self' 'sha256-[^']+'/);
    expect(headers['reporting-endpoints']).toBe('csp="/api/csp-report"');
    const report = await request.post('/api/csp-report', {
      data: JSON.stringify({ 'csp-report': { 'effective-directive': 'script-src-elem', 'blocked-uri': 'inline', 'document-uri': 'http://localhost/en' } }),
      headers: { 'Content-Type': 'application/csp-report' },
    });
    expect(report.status()).toBe(204);
  });

  test('404 responses are not kept in shared caches for long (production)', async ({ request }) => {
    test.skip(await isDevServer(request), 'The dev server never caches; judge against a production build.');
    for (const path of ['/en/nope-xyz', '/xyz.txt', '/en/a/b/c']) {
      await request.get(path);
      const response = await request.get(path);
      const cacheControl = response.headers()['cache-control'] ?? '';
      const sMaxAge = /s-maxage=(\d+)/.exec(cacheControl);
      expect(!sMaxAge || Number(sMaxAge[1]) <= 60, `${path}: ${cacheControl}`).toBe(true);
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
      // docs-07: only an equivalent page is a permanent destination.
      ['/en/klia1/air-travel/services/fast-track', 308, '/en/kul/facilities?t=T1#kul-t1-fast-track'],
      ['/en/klia2/air-travel/services/wifi', 307, '/en/kul/facilities?t=T2'],
      ['/en/klia1/air-travel/rental-services', 307, '/en/kul/transport?t=T1'],
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
