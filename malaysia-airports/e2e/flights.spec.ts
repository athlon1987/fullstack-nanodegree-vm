import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Journeys for the flights feature: the departures and arrivals board, a flight page, and
 * My journey. Conventions as in `smoke.spec.ts` (role locators, a fresh context per test).
 *
 * The browser clock is fixed to a busy morning at KLIA, so the demonstration board is full and
 * the ids below exist whatever day the suite runs: rows, status and the journey timeline are
 * computed in the browser from that clock. `mh2626-20261118-d` is a Malaysia Airlines departure
 * to Singapore at 10:50 on the synthetic timetable.
 */

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];
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
    await expect(main.getByRole('heading', { level: 1, name: 'Departures and arrivals' })).toBeVisible();
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
    await expect(save).toHaveAttribute('aria-pressed', 'true');
    await expect(main.getByText('Saved to My journey.')).toBeVisible();
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

  test('an unknown flight gets a helpful page with a search', async ({ page }) => {
    await page.goto('/en/kul/flights/zz9999-20261118-d');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: 'We could not find this flight' })).toBeVisible();
    await expect(main.getByRole('searchbox', { name: 'Search flights' })).toBeVisible();
    await expect(main.getByRole('link', { name: 'Open the KLIA board' })).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('works in Bahasa Malaysia', async ({ page }) => {
    await page.goto('/ms/kul/flights/mh2626-20261118-d');
    await expect(page.getByRole('main').getByRole('heading', { level: 1, name: 'MH 2626 ke Singapore' })).toBeVisible();
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
    await expect(page.getByRole('main').getByRole('button', { name: 'Save flight' })).toHaveAttribute('aria-pressed', 'true');

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
