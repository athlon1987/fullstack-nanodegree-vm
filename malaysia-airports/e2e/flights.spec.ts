import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page, type TestInfo } from '@playwright/test';
import { AXE_TAGS as SHARED_AXE_TAGS } from './support/axe';

/**
 * Journeys for the flights feature: the departures and arrivals board, a flight page, and
 * My journey. Conventions as in `smoke.spec.ts` (role locators, a fresh context per test).
 *
 * The browser clock is fixed to a busy morning at KLIA, so the demonstration board is full and
 * the ids below exist whatever day the suite runs: rows, status and the journey timeline are
 * computed in the browser from that clock. `mh2626-20261118-d` is a Malaysia Airlines departure
 * to Singapore at 10:50 on the synthetic timetable.
 */

const AXE_TAGS = [...SHARED_AXE_TAGS];

/** A client address for this test alone (as `shell.spec.ts` gives A-03), so other tests' requests cannot use up its rate limits. */
async function ownClientAddress(page: Page, testInfo: TestInfo) {
  const key = `${testInfo.project.name}|${testInfo.titlePath.join('|')}|${testInfo.repeatEachIndex}|${testInfo.retry}`;
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  await page.setExtraHTTPHeaders({ 'x-e2e-client-ip': `10.204.${(hash >>> 8) % 250}.${(hash % 250) + 1}` });
}
const MORNING = new Date('2026-11-18T09:40:00+08:00');
const FLIGHT = '/en/kul/flights/mh2626-20261118-d';

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

test.beforeEach(async ({ page }) => {
  test.setTimeout(120_000);
  await page.clock.setFixedTime(MORNING);
});

test.describe('flight board', () => {
  test('honours ?dir= and ?q=, keeps the URL in step, and passes axe', async ({ page }) => {
    await page.goto('/en/kul/flights?dir=a&q=MH');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: 'Flights' })).toBeVisible();
    await expect(main.getByRole('tab', { name: /Arrivals/ })).toHaveAttribute('aria-selected', 'true');
    await expect(main.getByRole('searchbox', { name: 'Search this board' })).toHaveValue('MH');
    await expect(main.getByRole('heading', { level: 2, name: 'Arrivals' })).toBeVisible();
    await expect(main.getByRole('link', { name: /^View flight MH \d+/ }).first()).toBeVisible();
    await expect(main.getByRole('note', { name: 'Demonstration data' }).first()).toBeVisible();
    await expect(main.getByText('Reading this as')).toBeVisible();
    await expectNoAxeViolations(page);

    await main.getByRole('tab', { name: /Departures/ }).click();
    await expect(page).toHaveURL(/dir=d/);
    await expect(main.getByRole('heading', { level: 2, name: 'Departures' })).toBeVisible();
  });

  test('groups by hour, filters by status and moves the time window', async ({ page }) => {
    await page.goto('/en/kul/flights?dir=d');
    const main = page.getByRole('main');
    // Hour groups: a row header in the table (wide boards) or a heading over the cards (narrow ones).
    await expect(main.getByText(/^From \d\d:00/).filter({ visible: true }).first()).toBeVisible();
    const statuses = main.getByRole('group', { name: 'Status' });
    const delayed = statuses.getByRole('button', { name: /^Delayed/ });
    await delayed.click();
    await expect(delayed).toHaveAttribute('aria-pressed', 'true');
    await expect(page).toHaveURL(/s=delayed/);
    await statuses.getByRole('button', { name: 'Clear filters' }).click();
    await expect(page).not.toHaveURL(/s=/);

    const subtitle = main.getByText(/^\d\d:\d\d to \d\d:\d\d$/);
    const before = await subtitle.textContent();
    await main.getByRole('button', { name: 'Show earlier flights' }).click();
    await expect(subtitle).not.toHaveText(before ?? '');
  });

  test('the KLIA terminal filter in the URL narrows the board', async ({ page }) => {
    await page.goto('/en/kul/flights?dir=d&t=T2');
    const main = page.getByRole('main');
    await expect(main.getByText(/^KLIA Terminal 2, \d\d:\d\d to/)).toBeVisible();
    await main.getByRole('button', { name: /Showing KLIA Terminal 2 only/ }).click();
    await expect(page).not.toHaveURL(/t=T2/);
  });

  test('a search with no match says so and can be cleared', async ({ page }) => {
    await page.goto('/en/kul/flights?dir=d&q=zzzz');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { name: 'No flights match “zzzz”' })).toBeVisible();
    await main.getByRole('button', { name: 'Clear search' }).click();
    await expect(main.getByRole('searchbox', { name: 'Search this board' })).toHaveValue('');
    await expect(main.getByRole('link', { name: /^View flight / }).first()).toBeVisible();
  });

  test('fits a 360 px screen without sideways scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/en/kul/flights?dir=d');
    await expect(page.getByRole('main').getByRole('link', { name: /^View flight / }).first()).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});

test.describe('flight page', () => {
  test('shows status, the journey and help, saves the flight, and passes axe', async ({ page }) => {
    await page.goto(FLIGHT);
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: 'MH 2626 to Singapore' })).toBeVisible();
    await expect(main.getByRole('heading', { name: 'Flight status' })).toBeVisible();
    await expect(main.getByRole('note', { name: 'Demonstration data' }).first()).toBeVisible();
    await expect(main.getByRole('heading', { level: 2, name: 'Your journey, step by step' })).toBeVisible();
    await expect(main.getByRole('heading', { name: 'If your flight is delayed or cancelled' })).toBeVisible();
    await expect(main.getByRole('link', { name: 'Flights and disruption' })).toHaveAttribute('href', '/en/help/flights');
    await expectNoAxeViolations(page);

    const save = main.getByRole('button', { name: 'Save flight' });
    await expect(save).toHaveAttribute('aria-pressed', 'false');
    await save.click();
    // Round 6 (review-3 9.1 item 7, intended change): the pressed state also reads "Saved".
    const saved = main.getByRole('button', { name: 'Saved', exact: true });
    await expect(saved).toHaveAttribute('aria-pressed', 'true');
    await expect(main.getByText('Saved to My journey.')).toBeVisible();
    await saved.click();
    await expect(save).toHaveAttribute('aria-pressed', 'false');
  });

  test('adds the flight to a calendar as a demonstration event', async ({ page, isMobile }) => {
    test.skip(isMobile, 'downloads are checked on desktop');
    await page.goto(FLIGHT);
    const download = page.waitForEvent('download');
    await page.getByRole('main').getByRole('button', { name: 'Add to calendar' }).click();
    const file = await download;
    expect(file.suggestedFilename()).toBe('mh2626-20261118-d.ics');
    await expect(page.getByRole('main').getByText(/Calendar file downloaded/)).toBeVisible();
  });

  // Intended change (B-14, security-05): unknown ids get a real 404 with a small page, before any
  // flight data is built; it still searches the board and links to it.
  test('malformed and oversized ids get the same small 404 before any page is built', async ({ request }) => {
    for (const id of ['%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E', 'x'.repeat(1600), 'zz9999-20990101-d']) {
      const response = await request.get(`/en/kul/flights/${id}`, { maxRedirects: 0 });
      expect(response.status(), id.slice(0, 20)).toBe(404);
      const body = await response.text();
      expect(body.length).toBeLessThan(30_000);
      expect(body).not.toContain('<img');
    }
  });

  test('an unknown flight gets a small 404 page with a search', async ({ page }) => {
    const response = await page.goto('/en/kul/flights/zz9999-20261118-d');
    expect(response?.status()).toBe(404);
    expect((await response?.body())?.length ?? 0).toBeLessThan(30_000);
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: 'We could not find this flight' })).toBeVisible();
    await expect(main.getByRole('searchbox', { name: 'Search the board' })).toBeVisible();
    await expect(main.getByRole('link', { name: 'See all flights' })).toHaveAttribute('href', '/en/kul/flights');
    await expectNoAxeViolations(page);
  });

  test('works in Bahasa Malaysia', async ({ page }) => {
    await page.goto('/ms/kul/flights/mh2626-20261118-d');
    // Round 6 (review-3 9.1 item 8, intended change): the city in Malay, as the board names it.
    await expect(page.getByRole('main').getByRole('heading', { level: 1, name: 'MH 2626 ke Singapura' })).toBeVisible();
    await expect(page.getByRole('main').getByRole('button', { name: 'Simpan penerbangan' })).toBeVisible();
  });
});

test.describe('my journey', () => {
  test('teaches the feature when empty, then shows a saved flight, a parking note and clears', async ({ page }) => {
    await page.goto('/en/journey');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: 'My journey' })).toBeVisible();
    await expect(main.getByRole('heading', { name: 'Keep your whole journey in one place' })).toBeVisible();
    await expect(main.getByText('Saved on this device only. Nothing is sent to a server.')).toBeVisible();
    await expectNoAxeViolations(page);

    await page.goto(FLIGHT);
    await page.getByRole('main').getByRole('button', { name: 'Save flight' }).click();
    await expect(page.getByRole('main').getByRole('button', { name: 'Saved', exact: true })).toHaveAttribute('aria-pressed', 'true');

    await page.goto('/en/journey');
    await expect(main.getByRole('link', { name: 'MH 2626 to Singapore' })).toBeVisible();
    await expect(main.getByRole('heading', { level: 2, name: 'Steps for MH 2626 to Singapore' })).toBeVisible();

    await main.getByRole('button', { name: 'Note where you parked' }).click();
    await main.getByRole('textbox', { name: /^Level/ }).fill('3');
    await main.getByRole('textbox', { name: /^Zone or bay/ }).fill('B 14');
    await main.getByRole('button', { name: 'Save note' }).click();
    await expect(main.getByText('B 14')).toBeVisible();
    await expectNoAxeViolations(page);

    await main.getByRole('button', { name: 'Clear my journey' }).click();
    const dialog = page.getByRole('dialog', { name: 'Clear everything in My journey?' });
    await dialog.getByRole('button', { name: 'Clear everything' }).click();
    await expect(main.getByRole('heading', { name: 'Keep your whole journey in one place' })).toBeVisible();
    await expect(main.getByRole('button', { name: 'Note where you parked' })).toBeVisible();
  });
});

/* ------------------------------------------------------------------------------------------
 * Fix round B
 * --------------------------------------------------------------------------------------- */

/** Scroll each matching element to the middle of the screen and count those with no demo label in view. */
async function unlabelledInView(page: Page, selector: string): Promise<{ total: number; unlabelled: string[] }> {
  return page.evaluate(async (sel) => {
    const items = [...document.querySelectorAll<HTMLElement>(sel)].filter((item) => item.getClientRects().length > 0);
    const unlabelled: string[] = [];
    for (const item of items) {
      // Redesign 3 (docs/qa/fixes/redesign3-perf.md): sample once the browser has delivered the
      // jump (its `scroll` event), then two frames as before. CSS now decides the floating label
      // (a view timeline), but right after load Chrome sometimes delivers a programmatic jump a
      // frame late to scroll events and scroll timelines alike, while layout already reports the
      // new position (about 1 in 30 first jumps with 4 workers: no scroll event yet, so the screen
      // had not moved either). The assertion is unchanged: every row needs a label in view.
      const from = window.scrollY;
      const delivered = new Promise((resolve) => {
        window.addEventListener('scroll', resolve, { once: true, passive: true });
        setTimeout(resolve, 500);
      });
      item.scrollIntoView({ block: 'center' });
      if (window.scrollY !== from) await delivered;
      await new Promise((resolve) => requestAnimationFrame(() => requestAnimationFrame(resolve)));
      const visible = [...document.querySelectorAll<HTMLElement>('[data-demo-banner], [data-provenance="demo"]')].some((marker) => {
        const box = marker.getBoundingClientRect();
        return box.height > 0 && box.bottom > 0 && box.top < window.innerHeight && getComputedStyle(marker).visibility !== 'hidden';
      });
      if (!visible) unlabelled.push((item.closest('li, tr, div') as HTMLElement | null)?.innerText.slice(0, 60) ?? sel);
    }
    return { total: items.length, unlabelled };
  }, selector);
}

test.describe('fix round B: flight board', () => {
  for (const path of ['/en/kul/flights?dir=d', '/ms/kul/flights?dir=d', '/en/pen/flights?dir=d']) {
    test(`every board row has a demo label in view (${path})`, async ({ page, isMobile }) => {
      // The sizes the content-integrity check used: 390x844 on the phone, 1280x900 on desktop.
      await page.setViewportSize(isMobile ? { width: 390, height: 844 } : { width: 1280, height: 900 });
      await page.goto(path);
      await expect(page.getByRole('main').locator('[data-status]').filter({ visible: true }).first()).toBeVisible();
      const result = await unlabelledInView(page, 'main [data-status]');
      expect(result.total).toBeGreaterThan(5);
      expect(result.unlabelled).toEqual([]);
    });
  }

  test('leads with flights still to leave, and Earlier brings the departed ones back', async ({ page }) => {
    await page.goto('/en/kul/flights?dir=d');
    const main = page.getByRole('main');
    const first = main.locator('[data-status]').filter({ visible: true }).first();
    await expect(first).toBeVisible();
    await expect(first).not.toHaveAttribute('data-status', 'departed');
    await main.getByRole('button', { name: 'Show earlier flights' }).click();
    await expect(main.locator('[data-status="departed"]').filter({ visible: true }).first()).toBeVisible();
  });

  test('renders at most 40 rows until Show more, and typing stays responsive', async ({ page }) => {
    await page.goto('/en/kul/flights?dir=d&q=MH');
    const main = page.getByRole('main');
    await expect(main.locator('[data-status]').filter({ visible: true }).first()).toBeVisible();
    expect(await main.locator('[data-status]').filter({ visible: true }).count()).toBeLessThanOrEqual(40);
    const more = main.getByRole('button', { name: /^Show \d+ more flights?$/ });
    if (await more.isVisible()) {
      await more.click();
      expect(await main.locator('[data-status]').filter({ visible: true }).count()).toBeGreaterThan(40);
    }
    const field = main.getByRole('searchbox', { name: 'Search this board' });
    await field.fill('');
    const started = Date.now();
    await field.pressSequentially('AK', { delay: 20 });
    await expect(field).toHaveValue('AK');
    expect(Date.now() - started).toBeLessThan(2_000);
  });

  test('says when the scheduled time has changed, in words, for assistive technology', async ({ page }) => {
    await page.goto('/en/kul/flights?dir=d&s=delayed');
    const main = page.getByRole('main');
    await expect(main.locator('[data-status="delayed"]').filter({ visible: true }).first()).toBeVisible();
    await expect(main.getByText(/^Scheduled \d\d:\d\d, now \d\d:\d\d$/).first()).toBeAttached();

    // The accessibility tree of the board (arrivals have both on this timetable): the struck
    // times are hidden and the words say which time is old (accessibility-03).
    await page.goto('/en/kul/flights?dir=a&s=delayed,cancelled');
    await expect(main.locator('[data-status="cancelled"]').filter({ visible: true }).first()).toBeVisible();
    const tree = await main.ariaSnapshot();
    expect(tree).toMatch(/Scheduled \d\d:\d\d, now \d\d:\d\d/);
    expect(tree).toMatch(/Cancelled, was \d\d:\d\d/);
    expect(tree).not.toMatch(/^\s*- (?:text|deletion): "?\d\d:\d\d"?\s*$/m);
  });

  test('live updates can be paused and resumed, and the change is announced', async ({ page }) => {
    await page.goto('/en/kul/flights?dir=d');
    const main = page.getByRole('main');
    const pause = main.getByRole('button', { name: 'Pause live updates' });
    await pause.click();
    const resume = main.getByRole('button', { name: 'Resume live updates' });
    await expect(resume).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('status').filter({ hasText: 'Live updates paused.' }).first()).toBeAttached();
    await resume.click();
    await expect(main.getByRole('button', { name: 'Pause live updates' })).toHaveAttribute('aria-pressed', 'false');
  });

  test('keeps last-known flights with their age when a refresh fails, and fails clearly with nothing to show', async ({ page }) => {
    await page.clock.install({ time: MORNING });
    await page.goto('/en/kul/flights?dir=d');
    const main = page.getByRole('main');
    await expect(main.locator('[data-status]').filter({ visible: true }).first()).toBeVisible();
    await page.route('**/flights/feed?**', (route) => route.abort());
    await page.clock.runFor(31_000);
    await expect(main.locator('[data-feed-state="stale"]')).toBeVisible({ timeout: 2_000 });
    await expect(main.locator('[data-status]').filter({ visible: true }).first()).toBeVisible();

    const fresh = await page.context().newPage();
    await fresh.clock.setFixedTime(MORNING);
    await fresh.route('**/flights/feed?**', (route) => route.abort());
    await fresh.goto('/en/kul/flights?dir=d');
    await expect(fresh.getByRole('main').locator('[data-feed-state="error"]')).toBeVisible({ timeout: 10_000 });
    await fresh.unroute('**/flights/feed?**');
    await fresh.getByRole('main').getByRole('button', { name: 'Try again' }).click();
    await expect(fresh.getByRole('main').locator('[data-status]').filter({ visible: true }).first()).toBeVisible();
  });

  test('announces a change to a saved flight once, politely', async ({ page }, testInfo) => {
    // Round 6 (G8 item 9): its own client address, as A-03 has. The board refreshes about 18
    // times while the clock runs forward, and on the worker's shared address a repeat met the
    // feed's rate limit (14 of 20 with --repeat-each=10). The assertions are unchanged.
    await ownClientAddress(page, testInfo);
    // A minute before MH 2626 starts boarding (11:15 on this timetable, after its delay), so a
    // slow first load on a busy server cannot run past the change before the first snapshot.
    await page.clock.install({ time: new Date('2026-11-18T11:14:00+08:00') });
    // The flight is already saved on this device (saving is covered by the flight page tests).
    await page.addInitScript(() => {
      const saved = { id: 'mh2626-20261118-d', airport: 'kul', number: 'MH2626', direction: 'd', date: '2026-11-18', route: 'Kuala Lumpur to Singapore', savedAt: '2026-11-18T03:00:00.000Z' };
      localStorage.setItem('ma:journey:v1', JSON.stringify({ flights: [saved], places: [], parkedCar: null }));
    });
    await page.goto('/en/kul/flights?dir=d&q=MH2626');
    await expect(page.getByRole('main').getByRole('link', { name: /^View flight MH 2626/ }).first()).toBeVisible();
    await expect(page.getByRole('main').getByRole('button', { name: 'Save MH 2626 to My journey' }).first()).toHaveAttribute('aria-pressed', 'true');
    await expect(page.getByRole('status').filter({ hasText: /MH 2626 to Singapore: now Boarding/ })).toHaveCount(0);
    // Updates wait while the pointer rests on a row (WCAG 2.2.2): keep it off the board.
    await page.mouse.move(1, 1);
    await page.clock.runFor(61_000);
    await expect(page.getByRole('status').filter({ hasText: /MH 2626 to Singapore: now Boarding/ })).toBeAttached({ timeout: 10_000 });
  });
});

test.describe('fix round B: flight page', () => {
  for (const [lang, textSize] of [
    ['en', 100],
    ['en', 125],
    ['ms', 100],
    ['ms', 125],
  ] as const) {
    test(`answers first on a 360 px phone (${lang}, ${textSize}% text)`, async ({ page }) => {
      await page.setViewportSize({ width: 360, height: 780 });
      await page.addInitScript((size) => localStorage.setItem('ma:preferences:v1', JSON.stringify({ theme: 'light', textSize: size, highContrast: false, reducedMotion: false })), textSize);
      await page.goto(`/${lang}/kul/flights/mh2626-20261118-d`);
      const summary = page.locator('[data-flight-summary]');
      await expect(summary).toBeVisible();
      const box = await summary.boundingBox();
      // Inside the first screen, above the fixed bottom bar (about 64 px).
      expect(box && box.y + Math.min(box.height, 80)).toBeLessThan(780 - 64);
      await expect(summary.getByRole('link', { name: /See this step|Lihat langkah ini/ })).toHaveAttribute('href', /#journey-step-/);
    });
  }

  test('labels the gate, belt and check-in values as demo data in the same view', async ({ page, isMobile }) => {
    await page.setViewportSize(isMobile ? { width: 390, height: 844 } : { width: 1280, height: 900 });
    for (const path of [FLIGHT, '/en/kul/flights/mh2627-20261118-a']) {
      await page.goto(path);
      await expect(page.locator('#flight-status-title')).toBeVisible();
      const result = await unlabelledInView(page, 'main section[aria-labelledby="flight-status-title"] dd');
      expect(result.unlabelled, path).toEqual([]);
    }
  });

  test('offers Follow next to Save with an e-mail option and says what is delivered', async ({ page }) => {
    await page.goto(FLIGHT);
    const main = page.getByRole('main');
    const follow = main.getByRole('button', { name: 'Follow' });
    await expect(follow).toHaveAttribute('aria-expanded', 'false');
    await follow.click();
    const panel = main.getByRole('region', { name: 'Follow this flight' });
    await expect(panel.getByText(/only while a page of this site is open/)).toBeVisible();
    await panel.getByRole('textbox', { name: 'E-mail address' }).fill('not-an-address');
    await panel.getByRole('button', { name: 'Follow by e-mail' }).click();
    await expect(panel.getByText('Enter an e-mail address, for example name@example.com.')).toBeVisible();
    await panel.getByRole('textbox', { name: 'E-mail address' }).fill('traveller@example.com');
    await panel.getByRole('button', { name: 'Follow by e-mail' }).click();
    await expect(panel.getByText('traveller@example.com')).toBeVisible();
    await expect(main.getByRole('button', { name: 'Following' })).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('without browser notifications, explains the alternatives instead of a dead end', async ({ page }) => {
    await page.addInitScript(() => {
      // Safari on iPhone outside a Home Screen app has no Notification API.
      delete (window as unknown as { Notification?: unknown }).Notification;
    });
    await page.goto(FLIGHT);
    await page.getByRole('main').getByRole('button', { name: 'Follow' }).click();
    const panel = page.getByRole('main').getByRole('region', { name: 'Follow this flight' });
    await expect(panel.getByText('This browser cannot show notifications from a web page.')).toBeVisible();
    await expect(panel.getByRole('textbox', { name: 'E-mail address' })).toBeVisible();
  });

  test('My needs adds the assistance step and step-free map links', async ({ page }) => {
    await page.goto(FLIGHT);
    const main = page.getByRole('main');
    await expect(main.locator('[data-step="assistance"]')).toHaveCount(0);
    await main.getByRole('button', { name: 'Wheelchair' }).click();
    await expect(main.getByRole('heading', { level: 3, name: 'Arrange assistance with Malaysia Airlines' })).toBeVisible();
    await expect(main.locator('[data-step="assistance"]').getByText(/48 hours/)).toBeVisible();
    const mapLinks = main.locator('section[aria-labelledby="flight-journey-title"] a[href*="/kul/map"]');
    expect(await mapLinks.count()).toBeGreaterThan(0);
    for (const href of await mapLinks.evaluateAll((links) => links.map((link) => link.getAttribute('href')))) expect(href).toContain('sf=1');
    // Remembered on this device, and used by My journey too.
    await main.getByRole('button', { name: 'Save flight' }).click();
    await page.goto('/en/journey');
    await expect(page.getByRole('main').getByRole('heading', { level: 3, name: 'Arrange assistance with Malaysia Airlines' })).toBeVisible();
  });

  test('a codeshare number opens the operating flight', async ({ request }) => {
    const feed = await request.get(`/en/kul/flights/feed?date=2026-11-18&dir=d&at=${MORNING.getTime()}`);
    const body = (await feed.json()) as { flights: { id: string; codeshares?: string[] }[] };
    const shared = body.flights.find((flight) => flight.codeshares && flight.codeshares.length > 0);
    expect(shared).toBeDefined();
    const [airline, digits] = (shared?.codeshares?.[0] ?? '').split(' ');
    const response = await request.get(`/en/kul/flights/${airline.toLowerCase()}${digits}-20261118-d`, { maxRedirects: 0 });
    expect(response.status()).toBe(308);
    expect(response.headers().location).toContain(`/en/kul/flights/${shared?.id}`);
  });
});

test.describe('fix round B: my journey', () => {
  test('the empty state is in the server HTML', async ({ request }) => {
    const html = await (await request.get('/en/journey')).text();
    expect(html).toContain('Keep your whole journey in one place');
  });
});
