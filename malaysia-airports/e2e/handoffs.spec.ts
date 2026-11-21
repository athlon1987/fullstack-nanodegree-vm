import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from './support/axe';

/**
 * Round 2: the cross-package hand-offs that kept backlog items partial (verification section 4,
 * item 6), the density pass (A-14) and the measurement switch (E-17). One test per hand-off,
 * named by its backlog id.
 */

test.describe('round 2 hand-offs', () => {
  test('B-01: the KLIA overview and the home strip show the service status lines', async ({ page }) => {
    await page.goto('/en/kul');
    const main = page.getByRole('main');
    const status = main.getByRole('region', { name: 'Services now' });
    await expect(status.getByRole('heading', { name: 'Services now' })).toBeVisible();
    await expect(status.locator('[data-ops-service="aerotrain"]')).toBeVisible();
    await expect(status.locator('[data-ops-service="immigration"]')).toContainText('Queue estimates');

    await page.goto('/en');
    const row = page.getByRole('main').locator('summary', { hasText: 'Services at KLIA now:' });
    await expect(row).toBeVisible();
    await row.click();
    await expect(page.getByRole('main').locator('[data-ops-service="aerotrain"]')).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('D-02: the KLIA overview lists Fast Track per terminal with its details and booking site', async ({ page }) => {
    await page.goto('/en/kul');
    const services = page.getByRole('main').getByRole('region', { name: 'Services you can book' });
    await expect(services.getByRole('heading', { level: 3, name: /Fast Track/ })).toHaveCount(2);
    await expect(services.getByRole('link', { name: 'Fast Track details' }).first()).toHaveAttribute('href', '/en/kul/facilities#kul-t1-fast-track');
    await expect(services.getByRole('link', { name: 'Fast Track details' }).last()).toHaveAttribute('href', '/en/kul/facilities#kul-t2-fast-track');
    await expect(services.getByRole('link', { name: /Booking site/ }).first()).toHaveAttribute('href', 'https://www.myairportfasttrack.com/');
    await expect(services).toContainText('Not published in our sources: price, hours');
  });

  test('D-05: parking, facilities and transport point to the single list of gaps in one line', async ({ page }) => {
    for (const section of ['parking', 'facilities', 'transport']) {
      await page.goto(`/en/kul/${section}`);
      const main = page.getByRole('main');
      await expect(main.getByRole('link', { name: 'See the gaps at KLIA' })).toHaveAttribute('href', '/en/about-this-prototype#gaps-kul');
      // The long note itself lives only on About this prototype.
      await expect(main.getByText('What this prototype has not verified at KLIA', { exact: true })).toHaveCount(0);
    }
  });

  test('D-08: the transit gate step for Terminal 1 reads the Aerotrain notices', async ({ page }) => {
    await page.goto('/en/kul/transit?from=T2&to=T1&ticket=protected&arr=intl&dep=intl&layover=180');
    const step = page.getByRole('main').getByRole('listitem').filter({ has: page.getByRole('heading', { name: 'Go to your gate' }) }).first();
    await expect(step.locator('[data-ops-service="aerotrain"]')).toBeVisible();
    await expect(step.locator('[data-ops-service="aerotrain"]')).toContainText(/Aerotrain to the C gates/);
  });

  test('D-09: Malay pages name the airport in Malay', async ({ page }) => {
    await page.goto('/ms/pen');
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Lapangan Terbang Antarabangsa Pulau Pinang');
    await expect(page).toHaveTitle(/Lapangan Terbang Antarabangsa Pulau Pinang/);
    await page.goto('/ms/pen/transport');
    await expect(page).toHaveTitle(/Pulau Pinang/);
    await page.goto('/ms/airports');
    await expect(page.getByRole('main').getByRole('link', { name: 'Lapangan Terbang Antarabangsa Pulau Pinang' })).toBeVisible();
    // Verification round two: the overview's board preview named the airport in English on /ms
    // (its subtitle line). Cited English source titles may still contain the English name.
    await page.goto('/ms/pen');
    const board = page.getByRole('main').locator('.surface-board');
    await expect(board.locator('p').filter({ hasText: /^Lapangan Terbang Antarabangsa Pulau Pinang$/ })).toBeVisible();
    await expect(board.locator('p').filter({ hasText: /^Penang International Airport$/ })).toHaveCount(0);
  });

  test('D-13: the home arrive-by step reads the sourced rule', async ({ page }) => {
    await page.goto('/en');
    await expect(page.getByRole('main').getByText('About 3 hours before an international flight and 2 hours before a domestic flight.')).toBeVisible();
  });

  test('B-09: the home flight search says so when the flight feed fails, with a retry', async ({ page }) => {
    await page.route('**/flights/feed?**', (route) => route.fulfill({ status: 503, body: 'unavailable' }));
    await page.goto('/en');
    const search = page.getByRole('search', { name: 'Search flights' });
    await search.getByRole('searchbox').fill('MH');
    const notice = page.locator('[data-feed-state="error"]');
    await expect(notice).toBeVisible({ timeout: 10_000 });
    await expect(notice).toContainText('We could not load flight information.');
    await page.unroute('**/flights/feed?**');
    await notice.getByRole('button', { name: 'Try again' }).click();
    await expect(search.getByText(/^\d+ flights? found$/).or(page.getByRole('main').getByText(/^\d+ flights? found$/)).first()).toBeVisible({ timeout: 10_000 });
  });

  test('B-15: the phone Search sheet offers the concierge', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'The Search sheet opens from the phone bar');
    await page.goto('/en');
    await page.getByRole('navigation', { name: 'Quick navigation' }).getByRole('button', { name: 'Search' }).click();
    await expect(page.getByRole('dialog').getByRole('option', { name: /Ask the concierge/ })).toBeVisible();
  });

  test('C-05: the home shop strip offers only filters the chosen airport can serve', async ({ page }) => {
    // No KLIA outlet publishes opening hours a machine can read, so "Open now" is not offered there.
    await page.addInitScript(() => localStorage.setItem('ma:airport:v1', JSON.stringify({ airport: 'kul', terminal: 'T1' })));
    await page.goto('/en');
    const filters = page.getByRole('main').getByRole('group', { name: 'Filter food and shops' });
    await expect(filters.getByRole('button', { name: /Halal/ })).toBeVisible();
    await expect(filters.getByText('Open now')).toHaveCount(0);
  });

  test('A-14: facilities say the shared provenance once, and only the other items carry a tag', async ({ page }) => {
    await page.goto('/en/kul/facilities');
    const main = page.getByRole('main');
    await expect(main.locator('[data-provenance-default="official"]')).toContainText('unless marked otherwise');
    const cards = await main.locator('article[id^="kul-"]').count();
    const tags = await main.locator('article [data-provenance]').count();
    expect(tags).toBeLessThan(cards / 2);
    await expect(main.locator('article [data-provenance="official"]')).toHaveCount(0);
  });

  test('E-17: the privacy page describes the measurement and the switch turns it off', async ({ page }) => {
    await page.goto('/en/privacy#measurement');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { name: 'What we measure, and how to turn it off' })).toBeVisible();
    const toggle = main.getByRole('switch', { name: 'Count my visits in the anonymous totals' });
    await expect(toggle).toBeChecked();
    await toggle.click();
    await expect(toggle).not.toBeChecked();
    expect(await page.evaluate(() => localStorage.getItem('ma:measurement:v1'))).toContain('off');
    await expect(main.getByText('ma:measurement:v1').first()).toBeAttached();
  });
});
