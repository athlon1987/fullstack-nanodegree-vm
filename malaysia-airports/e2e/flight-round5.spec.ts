import { expect, test, type APIRequestContext, type Page, type TestInfo } from '@playwright/test';

/**
 * Round 5, flight package (docs/qa/fixes/round5-flight.md). Run against a production build: the
 * first-flush checks read the server HTML, and the paint checks hold the flight feed back so that
 * anything painted after it would show.
 */

const MORNING = new Date('2026-11-18T09:40:00+08:00');
const NIGHT = new Date('2026-11-18T23:30:00+08:00');
const FLIGHT = '/en/kul/flights/mh2626-20261118-d';
const FEED_DELAY_MS = 3000;

/*
 * Every test here sends its own client address through the header the e2e server trusts (as A-03
 * does since round 5), so these page and feed requests do not use up the rate limits of the
 * worker's shared address, which the other flight specs rely on.
 */
let address = '';
test.beforeEach(async ({ page }, testInfo: TestInfo) => {
  const key = `${testInfo.project.name}|${testInfo.titlePath.join('|')}|${testInfo.repeatEachIndex}|${testInfo.retry}`;
  let hash = 7;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  address = `10.205.${(hash >>> 8) % 250}.${(hash % 250) + 1}`;
  await page.setExtraHTTPHeaders({ 'x-e2e-client-ip': address });
});
const get = (request: APIRequestContext, path: string) => request.get(path, { headers: { 'x-e2e-client-ip': address } });

/** The HTML segments React sends hidden and reveals later with `$RC`. */
function hiddenSegments(html: string): string[] {
  return [...html.matchAll(/<div hidden id="S:[^"]*">([\s\S]*?)<\/div><script>/g)].map((match) => match[1]);
}

/** Hold every flight feed answer back, so whatever waits for it paints late. */
async function delayFeed(page: Page) {
  await page.route(/\/flights\/feed(\?|$)/, async (route) => {
    await new Promise((resolve) => setTimeout(resolve, FEED_DELAY_MS));
    await route.continue();
  });
}

/** Record largest-contentful-paint entries and the first painted copy of the given elements. */
async function watchPaint(page: Page, selectors: Record<string, string>) {
  await page.addInitScript((wanted) => {
    const w = window as unknown as { __lcp: { time: number; inside: string | null }[]; __first: Record<string, Element | null> };
    w.__lcp = [];
    w.__first = {};
    new PerformanceObserver((list) => {
      for (const entry of list.getEntries() as (PerformanceEntry & { element?: Element | null })[]) {
        const element = entry.element ?? null;
        const inside = Object.entries(wanted).find(([, selector]) => element?.closest(selector))?.[0] ?? (element?.tagName.toLowerCase() ?? null);
        w.__lcp.push({ time: Math.round(entry.startTime), inside });
      }
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    document.addEventListener('DOMContentLoaded', () => {
      for (const [name, selector] of Object.entries(wanted)) w.__first[name] = document.querySelector(selector);
    });
  }, selectors);
}

test.describe('round 5: the flight page paints its answer frame in the first flush', () => {
  test('the h1 and the timetable facts are in the server HTML, not revealed by $RC', async ({ request }) => {
    for (const path of [FLIGHT, FLIGHT.replace('/en/', '/ms/'), '/en/kul/flights/mh2627-20261118-a']) {
      const response = await get(request, path);
      expect(response.status(), path).toBe(200);
      const html = await response.text();
      const h1 = html.indexOf('<h1');
      expect(h1, path).toBeGreaterThan(0);
      expect(hiddenSegments(html).some((segment) => segment.includes('<h1')), `${path}: h1 in a hidden segment`).toBe(false);
      const firstHidden = html.search(/<div hidden id="S:/);
      // The status card with the route and the scheduled time, and the summary frame, come before
      // anything React holds back.
      const hero = html.indexOf('data-flight-hero="pending"');
      expect(hero, path).toBeGreaterThan(h1);
      if (firstHidden > 0) expect(hero, path).toBeLessThan(firstHidden);
      expect(html.indexOf('data-flight-summary'), path).toBeGreaterThan(h1);
    }
    const html = await (await get(request, FLIGHT)).text();
    expect(html).toMatch(/MH 2626 to Singapore<\/span><\/h1>/);
    expect(html).toContain('10:50'); // the scheduled time, from the timetable
  });

  test('the status fills the same card when the feed answers, and the largest paint is not late', async ({ page }) => {
    await page.clock.setFixedTime(MORNING);
    await delayFeed(page);
    await watchPaint(page, { summary: '[data-flight-summary] p', hero: '[data-flight-hero]' });
    await page.goto(FLIGHT);
    const summary = page.locator('[data-flight-summary]');
    await expect(summary).toContainText('Delayed: now 12:00', { timeout: FEED_DELAY_MS + 15_000 });
    await expect(page.locator('[data-flight-hero="live"]')).toBeVisible();
    const result = await page.evaluate(() => {
      const w = window as unknown as { __lcp: { time: number; inside: string | null }[]; __first: Record<string, Element | null> };
      return {
        samePara: w.__first.summary !== null && w.__first.summary === document.querySelector('[data-flight-summary] p'),
        sameHero: w.__first.hero !== null && w.__first.hero === document.querySelector('[data-flight-hero]'),
        lcp: w.__lcp,
      };
    });
    // Filled in place: no new block is painted after the feed (the LCP was that block: 4.2 to 5.3 s).
    expect(result.samePara, 'the summary paragraph is the server-rendered one').toBe(true);
    expect(result.sameHero, 'the status card is the server-rendered one').toBe(true);
    expect(result.lcp.length).toBeGreaterThan(0);
    for (const entry of result.lcp) expect(entry.time, JSON.stringify(result.lcp)).toBeLessThan(FEED_DELAY_MS);
  });
});

test.describe('round 5: flight pages that do not exist', () => {
  test('an airport without a board, an unknown airport or flight: a real 404 on the first request', async ({ request }) => {
    // The flight page streams after a static start, so the proxy answers these (flight-route.ts).
    for (const [path, title] of [
      ['/en/bbn/flights/mh1-20261118-d', 'We could not find this flight'],
      ['/ms/tod/flights/mh1-20261118-d', 'Kami tidak menemui penerbangan ini'],
      ['/en/kul/flights/zz9999-20261118-d', 'We could not find this flight'],
      ['/en/zzz/flights/mh1-20261118-d', 'We could not find this flight'],
    ] as const) {
      const response = await get(request, path);
      expect(response.status(), path).toBe(404);
      const html = await response.text();
      expect(html, path).toContain(`<h1>${title}</h1>`);
      // No board to search at an airport without one.
      if (path.includes('/bbn/') || path.includes('/tod/')) expect(html, path).not.toContain('role="search"');
    }
  });
});

test.describe('round 5: the board at night', () => {
  test('the server HTML holds the board block that later says there are no departures', async ({ request }) => {
    const html = await (await get(request, '/en/kul/flights')).text();
    expect(html).toContain('data-board-state="loading"');
    expect(html).toContain('Loading the board');
    const ms = await (await get(request, '/ms/kul/flights')).text();
    expect(ms).toContain('Memuatkan papan');
  });

  test('the empty state fills the block already painted, and offers both steps', async ({ page }) => {
    await page.clock.setFixedTime(NIGHT);
    await delayFeed(page);
    await watchPaint(page, { board: '[data-board-state]' });
    await page.goto('/en/kul/flights?dir=d');
    const block = page.locator('[data-board-state]');
    await expect(block).toHaveAttribute('data-board-state', 'empty', { timeout: FEED_DELAY_MS + 15_000 });
    await expect(block.getByRole('heading', { level: 3 })).toContainText(/No departures between \d\d:\d\d and \d\d:\d\d/);
    // The message says "Show later flights … or earlier ones": both are offered.
    await expect(block.getByRole('button', { name: 'Show later flights' })).toBeVisible();
    await expect(block.getByRole('button', { name: 'Show earlier flights' })).toBeVisible();
    const result = await page.evaluate(() => {
      const w = window as unknown as { __lcp: { time: number; inside: string | null }[]; __first: Record<string, Element | null> };
      return { same: w.__first.board !== null && w.__first.board === document.querySelector('[data-board-state]'), lcp: w.__lcp };
    });
    expect(result.same, 'the empty state is the server-rendered block').toBe(true);
    for (const entry of result.lcp) expect(entry.time, JSON.stringify(result.lcp)).toBeLessThan(FEED_DELAY_MS);
  });
});

test.describe('round 5: airport section pages do not move when the airport header arrives', () => {
  // Pages whose own content does not change after the first paint, so any shift inside <main>
  // would come from the airport header (the site header above <main> is another package's).
  for (const path of ['/en/kul/parking', '/en/kul/map', '/en/kul/transit', '/en/pen/parking']) {
    test(`desktop layout shift on ${path}`, async ({ page, isMobile }) => {
      test.skip(isMobile, 'the section tabs show from md up');
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.addInitScript(() => {
        const w = window as unknown as { __cls: number };
        w.__cls = 0;
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries() as (PerformanceEntry & { value: number; hadRecentInput: boolean; sources?: { node?: Node | null }[] })[]) {
            const inMain = (entry.sources ?? []).some((source) => source.node instanceof Element && source.node.closest('main'));
            if (!entry.hadRecentInput && inMain) w.__cls += entry.value;
          }
        }).observe({ type: 'layout-shift', buffered: true });
      });
      await page.goto(path, { waitUntil: 'load' });
      await expect(page.locator('[data-airport-chrome="compact"] nav').filter({ visible: true }).first()).toBeVisible();
      await page.waitForTimeout(1500);
      // Round 4 measured 0.025 to 0.026 here (the tab row pushed the page down by 48 px), all of it in <main>.
      expect(await page.evaluate(() => (window as unknown as { __cls: number }).__cls)).toBeLessThanOrEqual(0.01);
    });
  }
});

/** Count what A-14 counts, scrolling one viewport at a time. */
async function density(page: Page) {
  return page.evaluate(async () => {
    const main = document.querySelector('main')!;
    const shown = (element: Element) => {
      const box = element.getBoundingClientRect();
      return box.width > 0 && box.height > 0 && getComputedStyle(element).visibility !== 'hidden';
    };
    const sizes = new Set(
      [...main.querySelectorAll('*')].filter((element) => shown(element) && [...element.childNodes].some((node) => node.nodeType === 3 && node.textContent?.trim())).map((element) => getComputedStyle(element).fontSize),
    );
    let maxDemo = 0;
    for (let y = 0; y < document.documentElement.scrollHeight; y += innerHeight) {
      window.scrollTo(0, y);
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const inView = [...main.querySelectorAll('[data-demo-marker], [data-demo-label]')].filter((element) => {
        const box = element.getBoundingClientRect();
        return shown(element) && box.bottom > 0 && box.top < innerHeight;
      }).length;
      maxDemo = Math.max(maxDemo, inView);
    }
    const timeline = document.querySelector('[data-step]')?.closest('section');
    return {
      sizes: sizes.size,
      maxDemo,
      timelineSourceLists: timeline ? timeline.querySelectorAll('[data-source-marker]').length : -1,
    };
  });
}

test.describe('round 5: density on the flight page, My journey and the airport overview (A-14)', () => {
  const saved = { flights: [{ id: 'mh2626-20261118-d', airport: 'kul', number: 'MH2626', direction: 'd', date: '2026-11-18', route: 'Kuala Lumpur to Singapore', savedAt: '2026-11-18T01:00:00.000Z' }], places: [], parkedCar: null };

  for (const [width, height] of [
    [390, 844],
    [1440, 900],
  ] as const) {
    test(`one Demo label per view and one source list for the timeline (${width} px)`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.clock.setFixedTime(MORNING);
      await page.addInitScript((journey) => localStorage.setItem('ma:journey:v1', JSON.stringify(journey)), saved);
      for (const path of [FLIGHT, '/en/journey']) {
        await page.goto(path);
        await expect(page.locator('[data-step="boarding"]').first()).toBeVisible({ timeout: 20_000 });
        // My journey loads the airport's sources with its content, after the steps.
        await expect(page.locator('section:has([data-step]) [data-section-sources]').first()).toBeVisible({ timeout: 20_000 });
        const counts = await density(page);
        expect(counts.maxDemo, `${path}: Demo labels in one view`).toBeLessThanOrEqual(1);
        expect(counts.timelineSourceLists, `${path}: source lists in the timeline`).toBe(1);
        if (path === FLIGHT) expect(counts.sizes, `${path}: type sizes`).toBeLessThanOrEqual(8);
      }
    });

    test(`at most 8 type sizes on the airport overview (${width} px)`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      await page.clock.setFixedTime(MORNING);
      await page.goto('/en/kul');
      await expect(page.locator('main [data-status]').filter({ visible: true }).first()).toBeVisible({ timeout: 20_000 });
      expect((await density(page)).sizes).toBeLessThanOrEqual(8);
    });
  }
});
