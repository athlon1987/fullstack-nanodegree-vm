import { expect, test } from '@playwright/test';
import { expectNoAxeViolations } from './support/axe';

/**
 * Redesign stage two (docs/qa/fixes/redesign2-services.md): the service-page frame. Each page leads
 * with its answer, photographs appear only where the library holds the place's or service's own
 * picture, and outlets and lounges without one get category art, never a stand-in photograph.
 */

test.describe('service pages, Direction v2 frame', () => {
  test('facilities: the most-looked-for places open the directory filtered to them', async ({ page }) => {
    await page.goto('/en/kul/facilities');
    const main = page.getByRole('main');
    const quick = main.getByRole('region', { name: 'Most looked for' });
    await expect(quick.getByRole('link', { name: /Accessibility and assistance/ })).toHaveAttribute('href', '/en/kul/facilities?access=1#facility-results');
    // A category with nothing published says so in words, and still leads to its "not published" card.
    await expect(quick.getByRole('link', { name: /Nursing and baby care room/ })).toContainText('Not published yet');
    await quick.getByRole('link', { name: /Prayer room/ }).click();
    await expect(page).toHaveURL(/cat=prayer-room/);
    await expect(main.getByText('1 facility', { exact: true })).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('transport: only the KLIA Ekspres card carries a photograph, and it is its own train', async ({ page }) => {
    await page.goto('/en/kul/transport');
    const results = page.getByRole('main').getByRole('list', { name: /Ways to travel between KLIA and KL Sentral/ });
    await expect(results.getByRole('article', { name: /KLIA Ekspres/ }).locator('img[src*="klia-ekspres"]')).toHaveCount(1);
    await expect(results.getByRole('article').locator('img')).toHaveCount(1);
  });

  test('shops, lounges and an outlet page: no outlet or lounge photograph is invented', async ({ page }) => {
    for (const path of ['/en/kul/shop-dine', '/en/kul/lounges', '/en/kul/shop-dine/eraman-duty-free-mall-terminal-1']) {
      await page.goto(path);
      const main = page.getByRole('main');
      await expect(main.getByRole('heading', { level: 1 })).toBeVisible();
      // Cards (outlets, lounges) have category art only: no image inside any card.
      await expect(main.getByRole('article').locator('img')).toHaveCount(0);
    }
    // The answer panel's photograph is the overview's vetted section photograph (a Malaysian dish for food at KLIA).
    await page.goto('/en/kul/shop-dine');
    await expect(page.getByRole('main').getByRole('region', { name: 'At a glance' }).locator('img[src*="nasi-lemak"]')).toHaveCount(1);
    await page.goto('/en/pen/lounges');
    // Penang has no vetted lounges photograph: the panel shows none rather than another airport's.
    await expect(page.getByRole('main').getByRole('region', { name: 'At a glance' }).locator('img')).toHaveCount(0);
  });
});
