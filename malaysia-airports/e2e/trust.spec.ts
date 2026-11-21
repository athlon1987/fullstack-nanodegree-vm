import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations } from './support/axe';

/**
 * Round 4, trust and day of travel (docs/qa/fixes/round4-trust.md): the re-review's items 6.1.1,
 * 6.1.2, parts of 6.1.5, 6.1.6, 6.1.8, 6.1.9 and 6.1.10, and the gallery notes 2 and 3.
 *
 * The browser clock is fixed; the demonstration feed answers for that instant (`at=`), so the
 * same flights are in the same state on every run. MH 2626 (KLIA T1 to Singapore, scheduled
 * 10:50, estimated 12:00 at this moment) is delayed, and at 09:40 its arrive-by time (09:00 on the
 * new time) has passed while check-in is open until 11:00.
 */
const MORNING = new Date('2026-11-18T09:40:00+08:00');
const MH2626 = { id: 'mh2626-20261118-d', airport: 'kul', number: 'MH2626', direction: 'd', date: '2026-11-18', route: 'Kuala Lumpur to Singapore', savedAt: '2026-11-18T01:00:00.000Z' };

async function saveFlightAndNeeds(page: Page, needs: string[] = ['wheelchair']) {
  await page.addInitScript(
    ({ saved, chosen }) => {
      localStorage.setItem('ma:journey:v1', JSON.stringify({ flights: [saved], places: [], parkedCar: null }));
      localStorage.setItem('ma:needs:v1', JSON.stringify(chosen));
    },
    { saved: MH2626, chosen: needs },
  );
}

test.beforeEach(async ({ page }) => {
  test.setTimeout(120_000);
  await page.clock.setFixedTime(MORNING);
});

test.describe('6.1.1 status lines from notices', () => {
  test('the KLIA overview shows the notices date, never a checked time, and "Status not available" without a notice', async ({ page }) => {
    await page.goto('/en/kul');
    const status = page.getByRole('main').getByRole('region', { name: 'Services now' });
    await expect(status.locator('[data-ops-service="aerotrain"]')).toBeVisible();
    await expect(status).toContainText('From notices published up to 7 Oct 2026. No live operations feed is connected yet.');
    await expect(status).not.toContainText(/Checked \d\d:\d\d/);
    await expect(status).not.toContainText(/No disruption/i);
    const unknown = status.locator('[data-ops-state="unknown"]').first();
    await expect(unknown).toContainText('Status not available');
    // Where to check, once under the lines, with the airport's official contacts.
    await expect(status.locator('[data-ops-where]')).toContainText('Check the signs at the airport or ask at an information counter.');
    await expect(status.locator('[data-ops-where]').getByRole('link', { name: 'Official contacts' })).toHaveAttribute('href', '/en/kul#airport-contacts');
    // The Aerotrain notice carries its own date.
    await expect(status.locator('[data-ops-service="aerotrain"]')).toContainText('Notice dated 7 Oct 2026');
    await expectNoAxeViolations(page);
  });

  test('the home strip says the status is not available rather than "no disruption", in English and Malay', async ({ page }) => {
    // 20 December: no KLIA notice about these services is in effect or planned.
    await page.clock.setFixedTime(new Date('2026-12-20T10:00:00+08:00'));
    await page.goto('/en');
    const row = page.getByRole('main').locator('summary', { hasText: 'Services at KLIA now:' });
    // Every summary is in the server HTML (hidden); the current one shows once the clock is read.
    await expect(row.getByText('status not available (no live feed)')).toBeVisible();
    await expect(row.locator(':visible', { hasText: /no disruption/i })).toHaveCount(0);
    await row.click();
    await expect(page.getByRole('main').locator('[data-ops-state="unknown"]').first()).toContainText('Status not available');
    await expect(page.getByRole('main')).toContainText('From notices published up to 7 Oct 2026; no live feed.');

    await page.goto('/ms/kul');
    await expect(page.getByRole('main').locator('[data-ops-state="unknown"]').first()).toContainText('Status tidak tersedia');
    await expect(page.getByRole('main')).not.toContainText(/Disemak \d\d:\d\d/);
  });
});

test.describe('6.1.2 day of travel', () => {
  test('the home card names the deadline that still matters once the arrive-by time has passed', async ({ page }) => {
    await saveFlightAndNeeds(page, []);
    await page.goto('/en');
    const card = page.getByRole('main').getByRole('region', { name: 'Your saved flight' });
    await expect(card).toContainText('Check-in closes');
    await expect(card).toContainText('11:00');
    // Neither the old scheduled-basis arrive-by (07:50) nor the new one (09:00, already past).
    await expect(card).not.toContainText('07:50');
    await expect(card).not.toContainText('Be at the airport by');
    await expect(card).not.toContainText(/09:00/);
  });

  test('My journey shows the deadline and never a past time as Next', async ({ page }) => {
    await saveFlightAndNeeds(page, []);
    await page.goto('/en/journey');
    const card = page.getByRole('main').locator('li', { has: page.getByRole('link', { name: /MH 2626/ }) }).first();
    await expect(card.locator('[data-deadline="check-in-closes"]')).toContainText('11:00');
    await expect(card.locator('[data-next-step]')).toBeVisible();
    await expect(card.locator('[data-next-step]')).not.toContainText(/0[0-8]:\d\d|09:[0-3]\d/);
  });

  test('the flight page shows the delay first, one time basis, and no "Done" for assistance nobody confirmed', async ({ page }) => {
    await saveFlightAndNeeds(page, ['wheelchair', 'older']);
    await page.goto('/en/kul/flights/mh2626-20261118-d');
    const summary = page.getByRole('main').locator('[data-flight-summary]');
    await expect(summary).toContainText('Delayed: now 12:00');
    await expect(summary).toContainText('Check-in closes 11:00');

    const delay = page.locator('[data-step="delay"]');
    await expect(delay).toContainText('The times below follow the new departure time, 12:00.');
    await expect(delay).not.toContainText('Keep to the original check-in times');
    await expect(delay).toContainText('Flight status:');

    const assistance = page.locator('[data-step="assistance"]');
    await expect(assistance).toContainText('Past:');
    await expect(assistance).not.toContainText('Done:');
    await expect(assistance).toContainText('Your needs: wheelchair, older traveller.');
    await expect(assistance.locator('[data-step-warning]')).toContainText('If nobody has arranged assistance yet, contact Malaysia Airlines now');
    // No past step is called done; the arrive-by step is on the new time.
    await expect(page.locator('[data-step]').filter({ hasText: 'Done:' })).toHaveCount(0);
    await expect(page.locator('[data-step="arrive"]')).toContainText('Arrive at the airport by 09:00');
    await expectNoAxeViolations(page);
  });

  test('inside the sourced notice period the assistance step warns before it has passed', async ({ page }) => {
    // 18:00 the day before: about 17 hours before departure, inside Malaysia Airlines' 48 hours.
    await page.clock.setFixedTime(new Date('2026-11-17T18:00:00+08:00'));
    await page.addInitScript(() => localStorage.setItem('ma:needs:v1', JSON.stringify(['wheelchair'])));
    await page.goto('/en/kul/flights/mh2626-20261118-d');
    const assistance = page.locator('[data-step="assistance"]');
    await expect(assistance).toContainText('Coming up:');
    await expect(assistance.locator('[data-step-warning]')).toContainText("Malaysia Airlines asks for 48 hours' notice, and your flight leaves in less than that.");
  });

  test('the Fast Track booking link on the timeline is a measured hand-off', async ({ page }) => {
    await page.goto('/en/kul/flights/mh2626-20261118-d');
    const link = page.locator('[data-step="fast-track"]').getByRole('link', { name: /Booking site/ });
    await expect(link).toHaveAttribute('data-handoff', 'fast-track-booking');
    await expect(link).toHaveAttribute('href', 'https://www.myairportfasttrack.com/');
  });
});

test.describe('6.1.6 placement', () => {
  test('the first board row is above the 900 px fold at 1440 x 900, in English and Malay', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    for (const lang of ['en', 'ms']) {
      await page.goto(`/${lang}/kul/flights`);
      const row = page.getByRole('main').locator('tbody tr', { has: page.locator('[data-status]') }).first();
      await expect(row).toBeVisible();
      const box = await row.boundingBox();
      expect(box, lang).not.toBeNull();
      expect((box?.y ?? 0) + (box?.height ?? 0), `${lang}: bottom of the first row`).toBeLessThanOrEqual(900);
    }
  });

  test('on a phone, Follow and My needs are within the first two screens of the flight page', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/en/kul/flights/mh2626-20261118-d');
    const follow = page.getByRole('main').getByRole('button', { name: /^Follow/ });
    const needs = page.getByRole('main').locator('[data-needs-link]');
    await expect(follow).toBeVisible();
    await expect(needs).toHaveText('My needs');
    for (const [name, locator] of [
      ['Follow', follow],
      ['My needs', needs],
    ] as const) {
      const top = await locator.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
      expect(top, name).toBeLessThan(2 * 844);
    }
    await needs.click();
    await expect(page.locator('#needs-control')).toBeInViewport();
  });
});

test.describe('6.1.8 thin and directory-only airports', () => {
  test('Lawas has no empty journey-mode switcher, and says what is not published', async ({ page }) => {
    await page.goto('/en/lwy');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1 })).toContainText('Lawas Airport');
    await expect(main.getByRole('radio')).toHaveCount(0);
    await expect(main.getByText('What are you doing today?')).toHaveCount(0);
    await expect(main.getByText('Our sources do not say which airlines fly here.', { exact: false })).toBeVisible();
    await expect(main.locator('[data-own-contact="missing"]')).toContainText("This airport's own phone number");
    await expect(main.locator('[data-own-contact="missing"]')).toContainText('Not published');
  });

  test('KLIA lists the airlines its content publishes', async ({ page }) => {
    await page.goto('/en/kul');
    await expect(page.getByRole('main').locator('[data-airlines]')).toContainText('Malaysia Airlines');
  });

  test('/airports labels the content depth of each airport, in English and Malay', async ({ page }) => {
    await page.goto('/en/airports');
    const card = (slug: string) => page.locator(`[data-airport="${slug}"] [data-depth]`);
    await expect(card('kul')).toHaveText('Flights and airport guide');
    await expect(card('kch')).toHaveText('Flights only');
    await expect(card('lwy')).toHaveText('Directory only');
    await expect(page.getByRole('heading', { name: 'What each airport has here' })).toBeVisible();
    await expectNoAxeViolations(page);
    await page.goto('/ms/airports');
    await expect(card('lwy')).toHaveText('Direktori sahaja');
    await expect(card('kch')).toHaveText('Penerbangan sahaja');
  });
});

test.describe('6.1.10 and 6.1.5 home', () => {
  test('the Malay home h1 is about the task', async ({ page }) => {
    await page.goto('/ms');
    await expect(page.getByRole('heading', { level: 1 })).toHaveText('Semak penerbangan, rancang perjalanan anda.');
  });

  test('a topic word in the home flight field is not announced as "0 flights found"', async ({ page }) => {
    await page.goto('/en');
    const field = page.getByRole('main').getByRole('searchbox').first();
    await field.fill('parking');
    const status = page.getByRole('main').getByRole('status').filter({ hasText: /parking/ }).first();
    await expect(status).toContainText('No flights match “parking”.');
    await expect(status).toContainText('Pages that do are listed below, first:', { timeout: 15_000 });
    await expect(page.getByRole('main').getByRole('status').filter({ hasText: /0 flights found/ })).toHaveCount(0);
  });
});

test.describe('gallery note 2: next-day flights in a short preview', () => {
  test("Ipoh's preview labels a next-morning flight", async ({ page }) => {
    // 11:00: one Ipoh departure left today (15:30), then the next morning's.
    await page.clock.setFixedTime(new Date('2026-11-18T11:00:00+08:00'));
    await page.goto('/en/iph');
    const rows = page.getByRole('main').locator('li, tr').filter({ has: page.locator('[data-status]') }).filter({ visible: true });
    await expect(rows.first()).toBeVisible();
    const today = rows.filter({ hasText: '15:30' }).first();
    await expect(today.locator('[data-row-day]')).toHaveCount(0);
    const tomorrow = rows.filter({ hasText: '09:25' }).first();
    await expect(tomorrow.locator('[data-row-day]')).toHaveText('Tomorrow');
  });
});
