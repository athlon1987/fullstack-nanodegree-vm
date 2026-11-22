import { expect, test, type Page, type TestInfo } from '@playwright/test';

/**
 * Round 6, package "access" (docs/qa/fixes/round6-access.md; review-3 section 9.1 items 1, 3, 5,
 * 7, 8, 9 and 10): resilience of lazy parts with a saved flight, focus for in-page links, the
 * overview and board hierarchy, one Demo marker per board view, the map route, the filter
 * strip's overflow cue, Fast Track in the flight summary, Malay words kept whole, device text at
 * 200% and the night board's layout shift. Every test sends its own client address (as A-03).
 */

const MORNING = new Date('2026-11-18T09:40:00+08:00');
const NIGHT = new Date('2026-11-18T23:30:00+08:00');
const MH2626 = { id: 'mh2626-20261118-d', airport: 'kul', number: 'MH2626', direction: 'd', date: '2026-11-18', route: 'Kuala Lumpur to Singapore', savedAt: '2026-11-18T01:00:00.000Z' };

async function ownClientAddress(page: Page, testInfo: TestInfo) {
  const key = `${testInfo.project.name}|${testInfo.titlePath.join('|')}|${testInfo.repeatEachIndex}|${testInfo.retry}`;
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  await page.setExtraHTTPHeaders({ 'x-e2e-client-ip': `10.206.${(hash >>> 8) % 250}.${(hash % 250) + 1}` });
}

async function withSavedFlight(page: Page) {
  await page.addInitScript((saved) => {
    localStorage.setItem('ma:airport:v1', JSON.stringify({ airport: 'kul' }));
    localStorage.setItem('ma:journey:v1', JSON.stringify({ flights: [saved], places: [], parkedCar: null }));
  }, MH2626);
}

/** Make every script the page's own HTML does not name fail (the lazily loaded parts). */
async function failLazyChunks(page: Page, path: string) {
  const html = await (await page.request.get(path)).text();
  const named = new Set([...html.matchAll(/\/_next\/static\/chunks\/[^"'\s)\\]+\.js/g)].map((match) => match[0]));
  const state = { failing: true, failed: 0 };
  await page.route('**/_next/static/chunks/**/*.js', (route) => {
    const pathname = new URL(route.request().url()).pathname;
    if (!state.failing || named.has(pathname)) return route.continue();
    state.failed += 1;
    return route.abort('internetdisconnected');
  });
  return state;
}

test.describe('item 1: a script that cannot be fetched, with a saved flight (P8)', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await ownClientAddress(page, testInfo);
    await page.clock.setFixedTime(MORNING);
    await withSavedFlight(page);
  });

  for (const lang of ['en', 'ms'] as const) {
    const retry = lang === 'en' ? 'Try again' : 'Cuba lagi';
    const broken = lang === 'en' ? 'Something went wrong' : 'Ada sesuatu yang tidak kena';

    test(`the home keeps its content, and "Try again" brings the saved flight (${lang})`, async ({ page }) => {
      const chunks = await failLazyChunks(page, `/${lang}`);
      await page.goto(`/${lang}`, { waitUntil: 'load' });
      const slot = page.locator('[data-saved-flight-slot]');
      // The card's place says what is happening, with its own "Try again"; the page stays.
      await expect(slot.getByRole('button', { name: retry })).toBeVisible({ timeout: 20_000 });
      expect(chunks.failed).toBeGreaterThan(0);
      await expect(page.getByRole('main').getByText(broken)).toHaveCount(0);
      await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible();
      expect((await page.getByRole('main').innerText()).length).toBeGreaterThan(2000);
      // The connection is back: "Try again" fetches the card afresh (not the failed import).
      chunks.failing = false;
      await slot.getByRole('button', { name: retry }).click();
      await expect(slot.locator('#saved-flight-title')).toBeVisible({ timeout: 20_000 });
      await expect(slot).toContainText('MH 2626');
      await expect(page.getByRole('main').getByText(broken)).toHaveCount(0);
    });

    test(`My journey keeps its content, and its clear control arrives when the connection returns (${lang})`, async ({ page, context }) => {
      const chunks = await failLazyChunks(page, `/${lang}/journey`);
      await page.goto(`/${lang}/journey`, { waitUntil: 'load' });
      const main = page.getByRole('main');
      await expect(main.getByRole('link', { name: lang === 'en' ? 'MH 2626 to Singapore' : 'MH 2626 ke Singapura' }).first()).toBeVisible({ timeout: 20_000 });
      await expect(main.getByRole('button', { name: retry })).toBeVisible({ timeout: 20_000 });
      expect(chunks.failed).toBeGreaterThan(0);
      await expect(main.getByText(broken)).toHaveCount(0);
      // Back online (the browser says so): the control is fetched again by itself.
      chunks.failing = false;
      await context.setOffline(true);
      await context.setOffline(false);
      const clear = main.getByRole('button', { name: lang === 'en' ? 'Clear my journey' : 'Kosongkan perjalanan saya' });
      await expect(main.getByRole('button', { name: retry })).toHaveCount(0, { timeout: 20_000 });
      await clear.click();
      await expect(page.getByRole('alertdialog').or(page.getByRole('dialog'))).toBeVisible();
    });
  }

  test('the "You are offline" notice does not wait for the runtime script', async ({ page, context }) => {
    await failLazyChunks(page, '/en');
    await page.goto('/en', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    await context.setOffline(true);
    await expect(page.getByRole('status').filter({ hasText: /You are offline/ })).toBeVisible();
    await context.setOffline(false);
    await expect(page.getByRole('status').filter({ hasText: 'Back online' })).toBeVisible();
  });
});

test.describe('item 2: a link to a part of the same page moves focus there', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await ownClientAddress(page, testInfo);
  });

  test('"My needs" on the flight page', async ({ page }) => {
    await page.clock.setFixedTime(MORNING);
    await page.goto('/en/kul/flights/mh2626-20261118-d');
    const link = page.getByRole('main').locator('[data-needs-link]');
    await link.focus();
    await page.keyboard.press('Enter');
    await expect.poll(() => page.evaluate(() => document.activeElement?.closest('#needs-control') !== null)).toBe(true);
    // Once the control has arrived, the next Tab goes into it.
    await expect(page.locator('#needs-control').getByRole('button', { name: 'Wheelchair' })).toBeVisible();
  });

  for (const [lang, name, id] of [
    ['en', 'Accessibility statement', 'statement'],
    ['ms', 'Penyata kebolehcapaian', 'statement'],
    ['en', 'Not published yet', 'not-published'],
  ] as const) {
    test(`the accessibility hub's contents: ${name}`, async ({ page }) => {
      await page.goto(`/${lang}/accessibility`);
      await page.getByRole('navigation', { name: lang === 'en' ? 'On this page' : 'Di halaman ini' }).getByRole('link', { name }).click();
      await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe(id);
      await expect(page.locator(`#${id}`)).toBeInViewport();
    });
  }

  test('the statement says so, dated after round six, in both languages', async ({ page }) => {
    await page.goto('/en/accessibility');
    await expect(page.locator('#statement')).toContainText('A link to another part of the same page');
    await expect(page.locator('#statement')).toContainText('Last reviewed 22 November 2026');
    await page.goto('/ms/accessibility');
    await expect(page.locator('#statement')).toContainText('Pautan ke bahagian lain dalam halaman yang sama');
  });
});

test.describe('item 3: hierarchy and density', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await ownClientAddress(page, testInfo);
    await page.clock.setFixedTime(MORNING);
  });

  test('the overview puts flight search above the notices, on the first phone screen', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/en/kul');
    const search = await page.locator('#airport-search-title').boundingBox();
    const notices = await page.locator('#airport-notices-title').boundingBox();
    expect(search && notices && search.y < notices.y).toBe(true);
    expect(search && search.y + search.height).toBeLessThan(844);
  });

  for (const lang of ['en', 'ms'] as const) {
    test(`five board rows above a 900 px desktop fold (${lang})`, async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(`/${lang}/kul/flights`);
      const rows = page.locator('main table tbody tr').filter({ has: page.locator('a[href*="/flights/"]') });
      await expect(rows.nth(4)).toBeVisible();
      const fifth = await rows.nth(4).boundingBox();
      expect(fifth && fifth.y + fifth.height).toBeLessThanOrEqual(900);
    });
  }

  for (const width of [390, 1440]) {
    test(`one Demo marker in every view of a filtered board (${width} px)`, async ({ page }) => {
      await page.setViewportSize({ width, height: width < 800 ? 844 : 900 });
      await page.goto('/en/kul/flights?q=penang');
      await expect(page.getByRole('main').getByRole('link', { name: /^View flight/ }).first()).toBeVisible();
      const views = await page.evaluate(async () => {
        const main = document.querySelector('main')!;
        const shown = (e: Element) => {
          const b = e.getBoundingClientRect();
          return b.width > 0 && b.height > 0 && getComputedStyle(e).visibility !== 'hidden';
        };
        const board = document.querySelector('.surface-board')!;
        const counts: number[] = [];
        const end = board.getBoundingClientRect().bottom + scrollY;
        for (let y = 0; y < end - innerHeight / 2; y += Math.round(innerHeight / 2)) {
          window.scrollTo(0, y);
          await new Promise((resolve) => setTimeout(resolve, 250));
          const cover = Math.max(0, ...[...document.querySelectorAll('header, [data-airport-chrome]')].filter((el) => !main.contains(el) && ['sticky', 'fixed'].includes(getComputedStyle(el).position)).map((el) => el.getBoundingClientRect().bottom));
          counts.push([...main.querySelectorAll('[data-demo-marker]')].filter((e) => shown(e) && e.getBoundingClientRect().bottom > cover + 2 && e.getBoundingClientRect().top < innerHeight).length);
        }
        return counts;
      });
      expect(Math.max(...views)).toBe(1);
      expect(Math.min(...views)).toBe(1);
    });
  }

  test('the status filter strip shows that it scrolls on a phone', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/en/kul/flights');
    const strip = page.getByRole('group', { name: 'Status' });
    await expect(strip.getByRole('button').first()).toBeVisible();
    await expect(strip).toHaveAttribute('data-overflow-end', 'true');
    await strip.evaluate((element) => element.scrollTo({ left: element.scrollWidth }));
    await expect(strip).toHaveAttribute('data-overflow-start', 'true');
  });

  test('an international departure offers Fast Track in its summary, as a measured hand-off', async ({ page }) => {
    await page.goto('/en/kul/flights/mh2626-20261118-d');
    const line = page.locator('[data-summary-fast-track]');
    await expect(line).toContainText('Optional: Fast Track');
    await expect(line.locator('a[data-handoff="fast-track-booking"]')).toHaveAttribute('href', /myairportfasttrack\.com/);
  });

  test('on a phone the map brings a chosen route into view, and no route chip covers a label', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/en/kul/map');
    await page.locator('#map-route-from').selectOption('l5-kerb');
    await page.locator('#map-route-to').selectOption('g-gates-c');
    const drawing = page.locator('[data-map-disclaimer]').locator('..');
    await expect(drawing).toBeInViewport({ ratio: 0.9 });
    const strip = page.locator('[data-route-connectors]');
    await expect(strip.getByRole('button', { name: 'To Gates' })).toBeVisible();
    // The chip is outside the drawing: nothing floats over a place or its label.
    await expect(page.locator('[data-map-disclaimer] ~ div button.absolute')).toHaveCount(0);
  });

  test('long pages keep secondary detail behind disclosures on a phone, and show it on a desktop', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/en/kul/transport');
    const more = page.locator('details[data-more-on-phones]').first();
    await expect(more).not.toHaveAttribute('open', '');
    await more.locator('summary').click();
    await expect(more).toHaveAttribute('open', '');
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/kul/transport');
    await expect(page.locator('details[data-more-on-phones]').first()).toHaveAttribute('open', '');
    await expect(page.locator('details[data-more-on-phones] > summary').first()).toBeHidden();
  });

  for (const width of [390, 1440]) {
    test(`at most 8 type sizes on the home with a saved flight (${width} px)`, async ({ page }) => {
      await withSavedFlight(page);
      await page.setViewportSize({ width, height: width < 800 ? 844 : 900 });
      await page.goto('/en');
      await expect(page.locator('#saved-flight-title')).toBeVisible();
      const sizes = await page.evaluate(() => {
        const main = document.querySelector('main')!;
        const shown = (e: Element) => {
          const b = e.getBoundingClientRect();
          return b.width > 0 && b.height > 0 && getComputedStyle(e).visibility !== 'hidden';
        };
        return [...new Set([...main.querySelectorAll('*')].filter((e) => shown(e) && [...e.childNodes].some((n) => n.nodeType === 3 && n.textContent?.trim())).map((e) => getComputedStyle(e).fontSize))];
      });
      expect(sizes.length).toBeLessThanOrEqual(8);
    });
  }
});

test.describe('items 8 and 9: Malay words stay whole, and device text at 200%', () => {
  test.beforeEach(async ({ page }, testInfo) => {
    await ownClientAddress(page, testInfo);
  });

  test('no word of a segmented control is broken at 360 px and 125% text (transit, Malay)', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.addInitScript(() => localStorage.setItem('ma:preferences:v1', JSON.stringify({ theme: 'light', textSize: 125, highContrast: false, reducedMotion: true })));
    await page.goto('/ms/kul/transit');
    const split = await page.evaluate(() => {
      const out: string[] = [];
      for (const label of document.querySelectorAll('main fieldset label')) {
        const walker = document.createTreeWalker(label, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          for (const match of (node.textContent ?? '').matchAll(/[A-Za-z]{4,}/g)) {
            const range = document.createRange();
            range.setStart(node, match.index!);
            range.setEnd(node, match.index! + match[0].length);
            if (new Set([...range.getClientRects()].filter((r) => r.width > 0).map((r) => Math.round(r.top))).size > 1) out.push(match[0]);
          }
        }
      }
      return out;
    });
    expect(split).toEqual([]);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - innerWidth)).toBeLessThanOrEqual(0);
  });

  test('a Malay flight page names Pulau Pinang as the board does', async ({ page }) => {
    await page.clock.setFixedTime(MORNING);
    await page.goto('/ms/kul/flights?q=penang');
    const link = page.getByRole('main').getByRole('link', { name: /^Lihat penerbangan .*Pulau Pinang/ }).first();
    await expect(link).toBeVisible();
    await link.click();
    await expect(page.getByRole('heading', { level: 1 })).toContainText('ke Pulau Pinang');
  });

  for (const [width, height] of [
    [390, 844],
    [1280, 800],
  ] as const) {
    test(`header and bottom bar survive 200% device text (${width} px)`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.addInitScript(() => {
        localStorage.setItem('ma:airport:v1', JSON.stringify({ airport: 'kul' }));
        document.addEventListener('DOMContentLoaded', () => {
          const style = document.createElement('style');
          style.textContent = 'html{font-size:200%!important}';
          document.head.append(style);
        });
      });
      await page.goto('/ms');
      await expect(page.locator('html')).toHaveAttribute('data-compact-chrome', 'true');
      const result = await page.evaluate(() => {
        const offscreen = [...document.querySelectorAll('header button, header a, [data-mobile-bar] a, [data-mobile-bar] button')]
          .filter((e) => {
            const b = e.getBoundingClientRect();
            return b.width > 0 && getComputedStyle(e).visibility !== 'hidden' && (b.right > innerWidth + 1 || b.left < -1);
          })
          .map((e) => e.textContent?.trim());
        return { overflow: document.documentElement.scrollWidth - innerWidth, offscreen };
      });
      expect(result.overflow).toBeLessThanOrEqual(0);
      expect(result.offscreen).toEqual([]);
    });
  }
});

test.describe('item 10: the night board does not shift on a desktop', () => {
  for (const lang of ['en', 'ms'] as const) {
    test(`CLS 0.01 or less at 1440 px (${lang})`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop', 'measured on the desktop project');
      await ownClientAddress(page, testInfo);
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.clock.setFixedTime(NIGHT);
      await page.addInitScript(() => {
        (window as unknown as { __shift: number }).__shift = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) if (!entry.hadRecentInput) (window as unknown as { __shift: number }).__shift += entry.value;
        }).observe({ type: 'layout-shift', buffered: true });
      });
      await page.goto(`/${lang}/kul/flights`, { waitUntil: 'networkidle' });
      await expect(page.locator('[data-board-state="empty"]')).toBeVisible();
      await page.waitForTimeout(1000);
      expect(await page.evaluate(() => (window as unknown as { __shift: number }).__shift)).toBeLessThanOrEqual(0.01);
    });
  }
});
