import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { expectNoAxeViolations } from './support/axe';

/**
 * Round 5, polish package (docs/qa/fixes/round5-polish.md): the `[lang]/[...rest]` 404s, the search
 * index's airline summaries, density on the parking page, the transport fare row (layout shift and
 * its place at 125% text), the `/en/airports` map labels and the canonical in the HTML head.
 */

const phone = { width: 390, height: 844 };
const desktop = { width: 1440, height: 900 };
/** A day inside the KLIA Ekspres RM 55 period (it changes to RM 65 on 1 January 2027). */
const NOVEMBER = new Date('2026-11-21T10:00:00+08:00');

async function isDevServer(request: APIRequestContext): Promise<boolean> {
  const response = await request.get('/en/offline');
  return (response.headers()['content-security-policy'] ?? '').includes('unsafe-eval');
}

async function preferences(page: Page, textSize: 100 | 125) {
  await page.addInitScript((value) => localStorage.setItem('ma:preferences:v1', JSON.stringify({ textSize: value, reducedMotion: true })), textSize);
}

test.describe('catch-all 404s with the site shell (open issue 7)', () => {
  for (const [path, title] of [
    ['/en/kul/zzz', 'Page not found'],
    ['/en/nothing/here', 'Page not found'],
    ['/ms/kul/zzz', 'Halaman tidak ditemui'],
    ['/ms/tiada/halaman/ini', 'Halaman tidak ditemui'],
  ] as const) {
    test(`${path}: 404 with the shell, the title and the h1 in the server HTML, and no client error`, async ({ page, request }) => {
      const dev = await isDevServer(request);
      for (const attempt of ['first', 'repeat']) {
        const response = await request.get(path);
        if (!dev) expect(response.status(), `${attempt} request`).toBe(404);
        const html = await response.text();
        // Was Next.js's empty error document: no shell, no title, no body.
        expect(html).not.toContain('__next_error__');
        expect(html).toContain(`<title>${title} | `);
        expect(html).toContain(`${title}</h1>`);
        expect(html).toContain('data-site-header');
        expect(html).toContain('href="#main"');
        expect(html).toMatch(/<meta name="robots" content="noindex/);
        expect(html.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/g, '')).not.toContain('<!--$!-->');
      }

      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error' && !/instant-shell-url-data|URL data during prerendering/.test(message.text())) errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
      await expect(page).toHaveTitle(new RegExp(`^${title} \\| `));
      await page.waitForTimeout(1000);
      expect(errors.filter((text) => !/Failed to load resource/.test(text))).toEqual([]);
    });
  }
});

test.describe('search index (round 5)', () => {
  test('no document prints "[object Object]", and airline summaries carry their check-in text, in both languages', async ({ request }) => {
    for (const lang of ['en', 'ms']) {
      const response = await request.get(`/${lang}/search/index.json`);
      expect(response.status()).toBe(200);
      const text = await response.text();
      expect(text, lang).not.toContain('[object Object]');
      const body = JSON.parse(text) as unknown;
      const documents = (Array.isArray(body) ? body : ((body as { documents?: unknown[] }).documents ?? [])) as { id: string; summary: string }[];
      const mh = documents.find((document) => document.id === 'airline:kul:mh');
      expect(mh, `${lang} airline:kul:mh`).toBeDefined();
      expect(mh!.summary.split(' · ').length, mh!.summary).toBeGreaterThan(1);
    }
  });
});

test.describe('parking density (A-14, 6.1.7, round 5)', () => {
  test('one source list per section, one Demo marker in the car-park view, no feature or status chips on cards', async ({ page }) => {
    await page.setViewportSize(phone);
    await page.goto('/en/kul/parking');
    const main = page.getByRole('main');
    const list = main.locator('section[aria-labelledby="car-parks-title"]');
    await expect(list.locator('#car-park-kul-long-term-car-park')).toHaveCount(1);
    // Wait for the simulated space (read after the clock).
    await expect(list.locator('#car-park-kul-long-term-car-park')).toContainText(/bays? free|% full/);

    const counts = await main.evaluate((root) => {
      const shown = (element: Element) => element.getBoundingClientRect().height > 0;
      const count = (selector: string, within: Element = root) => [...within.querySelectorAll(selector)].filter(shown).length;
      const list = root.querySelector('section[aria-labelledby="car-parks-title"]')!;
      const sizes = new Set(
        [...root.querySelectorAll('*')].filter((element) => shown(element) && [...element.childNodes].some((node) => node.nodeType === 3 && node.textContent!.trim())).map((element) => getComputedStyle(element).fontSize),
      );
      return {
        sourceToggles: count('[data-source-marker]'),
        listToggles: count('[data-source-marker]', list),
        sectionLists: count('[data-section-sources]'),
        demoMarkersInList: count('[data-demo-marker]', list),
        demoBannersInList: count('[data-demo-banner]', list),
        cardChips: [...list.querySelectorAll('article span.min-h-chip')].filter(shown).map((chip) => chip.textContent!.trim()),
        provenanceTags: count('[data-provenance]'),
        typeSizes: sizes.size,
      };
    });
    // Round four: 8 source toggles (one per card and per price row), 4 "Demo" tags beside the space, 13 chips on the cards.
    expect(counts.listToggles).toBe(1);
    expect(counts.sectionLists).toBe(2);
    expect(counts.sourceToggles).toBeLessThanOrEqual(3);
    expect(counts.demoMarkersInList).toBe(1);
    expect(counts.demoBannersInList).toBe(1);
    // Only the simulated space is a chip now.
    expect(counts.cardChips.every((text) => /bays? free|% full/.test(text)), counts.cardChips.join(' | ')).toBe(true);
    expect(counts.provenanceTags).toBeLessThanOrEqual(4);
    expect(counts.typeSizes).toBeLessThanOrEqual(8);

    // Every card still says, in words, that its space is simulated, and keeps its one rate line (6.1.3).
    const cards = list.getByRole('article');
    const total = await cards.count();
    expect(total).toBeGreaterThanOrEqual(4);
    for (let index = 0; index < total; index += 1) {
      await expect(cards.nth(index)).toContainText('Simulated space');
      await expect(cards.nth(index).locator('[data-rate-line]')).toHaveCount(1);
    }
    // The section's sources name the car parks they support.
    const sources = list.locator('[data-section-sources] summary');
    await sources.click();
    await expect(list.locator('[data-section-sources]')).toContainText('Long Term Car Park');
    await expectNoAxeViolations(page);
  });

  test('Malay: the car-park cards say "Ruang simulasi" and the list has one Demo marker', async ({ page }) => {
    await page.setViewportSize(phone);
    await page.goto('/ms/kul/parking');
    const list = page.getByRole('main').locator('section[aria-labelledby="car-parks-title"]');
    await expect(list.getByRole('article').first()).toContainText('Ruang simulasi');
    await expect(list.locator('[data-demo-marker]:visible')).toHaveCount(1);
  });
});

/** Layout shift without input over 3.5 s after load (the method of `scripts/qa/layout-shift.mjs`). */
async function layoutShift(page: Page, path: string): Promise<number> {
  await page.addInitScript(() => {
    (window as unknown as { __shift: number }).__shift = 0;
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean })[]) {
        if (!entry.hadRecentInput) (window as unknown as { __shift: number }).__shift += entry.value;
      }
    }).observe({ type: 'layout-shift', buffered: true });
  });
  await page.goto(path, { waitUntil: 'load' });
  await page.waitForTimeout(3500);
  return page.evaluate(() => (window as unknown as { __shift: number }).__shift);
}

test.describe('transport fare row (round 5)', () => {
  test('desktop: the fare row does not move the page when the date is read (CLS budget 0.01)', async ({ page, request }) => {
    test.skip(await isDevServer(request), 'layout shift is measured on a production build');
    await page.clock.setFixedTime(NOVEMBER);
    await page.setViewportSize(desktop);
    for (const lang of ['en', 'ms']) {
      const shift = await layoutShift(page, `/${lang}/kul/transport`);
      // Round four: 0.045 to 0.049 (0.020 to 0.022 after the section tabs were fixed this round).
      expect(shift, `${lang} layout shift`).toBeLessThanOrEqual(0.01);
    }
  });

  test('the row has one line per dated fare before and after the date is known', async ({ browser }) => {
    const counts: number[] = [];
    for (const javaScriptEnabled of [false, true]) {
      const context = await browser.newContext({ javaScriptEnabled, viewport: desktop });
      const page = await context.newPage();
      if (javaScriptEnabled) await page.clock.setFixedTime(NOVEMBER);
      await page.goto('/en/kul/transport');
      const glance = page.locator('[data-transport-glance]');
      await expect(glance).toContainText('KLIA Ekspres');
      if (javaScriptEnabled) await expect(glance).toContainText('Today, until');
      else await expect(glance).toContainText('from RM 55');
      counts.push(await glance.locator('[data-glance-periods] > li').count());
      await context.close();
    }
    expect(counts[0]).toBeGreaterThanOrEqual(2);
    expect(counts[1]).toBe(counts[0]);
  });

  for (const lang of ['en', 'ms'] as const) {
    test(`${lang}, 125% text on a phone: the fare is on the first screen, above the warning`, async ({ page }) => {
      await preferences(page, 125);
      await page.clock.setFixedTime(NOVEMBER);
      await page.setViewportSize(phone);
      await page.goto(`/${lang}/kul/transport`);
      const glance = page.locator('[data-transport-glance]');
      const fare = glance.getByText('RM 55', { exact: true }).first();
      await expect(fare).toBeVisible();
      const warning = page.getByRole('main').getByRole('note').filter({ hasText: lang === 'en' ? 'Book taxis only at the coupon counters' : 'Tempah teksi hanya di kaunter kupon' }).first();
      await expect.poll(async () => ((await fare.boundingBox())?.y ?? Infinity) < ((await warning.boundingBox())?.y ?? -Infinity)).toBe(true);
      const box = (await fare.boundingBox())!;
      // Malay was at 881 px (round four), under the 844 px screen.
      expect(box.y + box.height, `${lang} fare bottom`).toBeLessThan(phone.height);
    });
  }

  test('desktop, 125% text: the fare is on the first screen in both languages', async ({ page }) => {
    await preferences(page, 125);
    await page.clock.setFixedTime(NOVEMBER);
    await page.setViewportSize(desktop);
    for (const lang of ['en', 'ms']) {
      await page.goto(`/${lang}/kul/transport`);
      const fare = page.locator('[data-transport-glance]').getByText('RM 55', { exact: true }).first();
      await expect(fare).toBeVisible();
      const box = (await fare.boundingBox())!;
      expect(box.y + box.height, lang).toBeLessThan(desktop.height);
    }
  });
});

test.describe('network map labels (round 5)', () => {
  for (const [width, scale] of [
    [320, 1],
    [390, 1],
    [768, 1],
    [1440, 1],
    [1920, 1],
    [720, 2], // 1440 px at 200% zoom
    [960, 2], // 1920 px at 200% zoom
  ] as const) {
    test(`every airport code is inside the drawing at ${width} px${scale > 1 ? ` (${scale * 100}% zoom)` : ''}`, async ({ browser }) => {
      const context = await browser.newContext({ viewport: { width, height: 900 }, deviceScaleFactor: scale });
      const page = await context.newPage();
      await page.goto('/en/airports');
      const svg = page.getByRole('main').locator('svg[role="img"]').filter({ has: page.locator('text') });
      await expect(svg).toHaveCount(2);
      const outside = await page.getByRole('main').evaluate((main) => {
        const found: string[] = [];
        for (const drawing of main.querySelectorAll('svg[role="img"]')) {
          const frame = drawing.getBoundingClientRect();
          for (const label of drawing.querySelectorAll('text')) {
            const box = label.getBoundingClientRect();
            if (box.left < frame.left - 0.5 || box.right > frame.right + 0.5 || box.top < frame.top - 0.5 || box.bottom > frame.bottom + 0.5) found.push(label.textContent ?? '');
          }
        }
        return found;
      });
      // Round four: "LGK" 2 to 5 px outside the left edge at every width.
      expect(outside).toEqual([]);
      await expect(page.getByRole('main').locator('svg text').filter({ hasText: 'LGK' })).toHaveCount(1);
      await context.close();
    });
  }
});

test.describe('canonical in the HTML head (E-14, round 5)', () => {
  test('pages without their own metadata helper name themselves canonical in the head, once, as the Link header does', async ({ request }) => {
    for (const path of ['/en/guides', '/ms/guides/baggage', '/en/help', '/en/corporate', '/ms/corporate/news', '/en/airports', '/en/concierge', '/ms/journey', '/en/notices', '/en/privacy', '/en/accessibility', '/ms/terms']) {
      const response = await request.get(path, { maxRedirects: 0 });
      expect(response.status(), path).toBe(200);
      const html = await response.text();
      const head = html.slice(0, html.indexOf('</head>'));
      const inHead = [...head.matchAll(/<link rel="canonical" href="([^"]+)"/g)].map((match) => new URL(match[1]).pathname);
      const inHeader = [...(response.headers().link ?? '').matchAll(/<([^>]+)>; rel="canonical"/g)].map((match) => new URL(match[1]).pathname);
      expect(inHead, path).toEqual([path]);
      expect(inHeader, path).toEqual([path]);
      // Exactly one canonical anywhere in the document.
      expect(html.match(/rel="canonical"/g), path).toHaveLength(1);
    }
  });

  test('pages with their own metadata keep exactly one canonical in the head', async ({ request }) => {
    for (const path of ['/en', '/ms/kul/parking', '/en/kul/transport', '/ms/kul', '/en/kul/shop-dine']) {
      const html = await (await request.get(path, { maxRedirects: 0 })).text();
      const head = html.slice(0, html.indexOf('</head>'));
      expect(head.match(/<link rel="canonical" href="[^"]*"/g), path).toEqual([expect.stringContaining(`${path}"`)]);
    }
  });
});
