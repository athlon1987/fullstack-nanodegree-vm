import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Journeys for the ground transport planner (`/[lang]/[airport]/transport`) and parking
 * (`/[lang]/[airport]/parking`). Conventions as in `smoke.spec.ts`: role locators, a fresh context
 * per test, English dictionary values from `src/lib/i18n/features/transport.ts`.
 *
 * The browser clock is fixed, because which KLIA Ekspres fare applies depends on the date: the
 * content publishes RM 55 until 31 December 2026 and RM 65 from 1 January 2027.
 */

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];
const BEFORE_RISE = new Date('2026-11-17T10:00:00+08:00');
const AFTER_RISE = new Date('2027-01-02T10:00:00+08:00');

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

test.beforeEach(() => {
  test.setTimeout(120_000);
});

test.describe('transport planner', () => {
  test('ranks options for KL Sentral on today’s fare, shows the coming change, and passes axe', async ({ page }) => {
    await page.clock.setFixedTime(BEFORE_RISE);
    await page.goto('/en/kul/transport');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: 'Getting to and from KLIA' })).toBeVisible();
    await expect(main.getByRole('combobox', { name: /Going to or from/ })).toHaveValue('KL Sentral');
    await expect(main.getByRole('radio', { name: 'Lowest price' })).toBeChecked();

    const results = main.getByRole('list', { name: /Ways to travel between KLIA and KL Sentral/ });
    const first = results.getByRole('article').first();
    await expect(first.getByRole('heading', { name: /KLIA Ekspres/ })).toBeVisible();
    await expect(first).toContainText('RM 55');
    await expect(first).toContainText('Applies today');
    await expect(first).toContainText('Changes to RM 65 on 1 January 2027');
    await expect(main.getByText('Options without a published fare come after those with one.')).toBeVisible();
    // The coach has no published fare: it comes after the train and says so.
    await expect(results.getByRole('article').nth(1)).toContainText('Not published');
    await expectNoHorizontalOverflow(page);
    await expectNoAxeViolations(page);
  });

  test('uses the new fare once it applies', async ({ page }) => {
    await page.clock.setFixedTime(AFTER_RISE);
    await page.goto('/en/kul/transport');
    const first = page.getByRole('main').getByRole('list', { name: /KL Sentral/ }).getByRole('article').first();
    await expect(first).toContainText('RM 65');
    await expect(first).toContainText('Applies today');
    await expect(first).not.toContainText('Changes to');
  });

  test('keeps choices in the URL, switches to the table and lists places an option does not serve', async ({ page }) => {
    await page.clock.setFixedTime(BEFORE_RISE);
    await page.goto('/en/kul/transport');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1 })).toBeVisible();

    await expect(async () => {
      await main.getByRole('radio', { name: 'Least effort' }).check();
      await expect(page).toHaveURL(/by=convenience/);
    }).toPass();
    await expect(main.getByText(/Sorted by our rule of thumb/)).toBeVisible();

    await main.getByRole('radio', { name: 'Table' }).check();
    await expect(page).toHaveURL(/view=table/);
    const table = main.getByRole('table', { name: /Ways to travel between KLIA and KL Sentral/ });
    await expect(table).toBeVisible();
    await expect(table.getByRole('rowheader', { name: /E-hailing/ })).toBeVisible();

    await main.getByRole('combobox', { name: /Going to or from/ }).selectOption('Salak Tinggi');
    await expect(page).toHaveURL(/to=Salak\+Tinggi/);
    await expect(main.getByRole('heading', { name: 'Not listed for Salak Tinggi' })).toBeVisible();

    await page.reload();
    await expect(main.getByRole('combobox', { name: /Going to or from/ })).toHaveValue('Salak Tinggi');
    await expect(main.getByRole('radio', { name: 'Table' })).toBeChecked();
    await expectNoAxeViolations(page);
  });

  test('explains changing terminals at KLIA: train fare, free shuttle stops, no airside link', async ({ page }) => {
    await page.goto('/en/kul/transport');
    const section = page.getByRole('region', { name: 'Between the terminals' });
    await expect(section.getByRole('note').filter({ hasText: 'There is no airside link between Terminal 1 and Terminal 2' })).toBeVisible();
    const train = section.getByRole('article', { name: 'Train between Terminal 1 and Terminal 2' });
    await expect(train).toContainText('RM 2');
    const shuttle = section.getByRole('article', { name: 'Free shuttle bus between the terminals' });
    await expect(shuttle).toContainText('Free');
    await expect(shuttle).toContainText('Bay A10, Level 1, Transportation Hub');
    await expect(shuttle).toContainText('Door 4, Level 1, Main Terminal Building');
  });

  test('renders in Bahasa Malaysia', async ({ page }) => {
    await page.goto('/ms/kul/transport');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ms');
    await expect(page.getByRole('heading', { level: 1, name: 'Ke dan dari KLIA' })).toBeVisible();
  });
});

test.describe('parking', () => {
  test('warns about Preferred Parking, says rates are not verified, estimates only a ceiling, and passes axe', async ({ page }) => {
    await page.clock.setFixedTime(BEFORE_RISE);
    await page.goto('/en/kul/parking');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: 'Parking at KLIA' })).toBeVisible();
    await expect(main.getByRole('note').filter({ hasText: 'Parking for more than a day? Avoid Preferred Parking' }).first()).toBeVisible();
    await expect(main.getByRole('note').filter({ hasText: 'Parking rates are not verified' })).toBeVisible();

    // Long Term Car Park: rates not verified, daily maximum RM 32 published, so only "at most".
    await expect(main.getByRole('combobox', { name: 'Car park' }).first()).toHaveValue('kul-long-term-car-park');
    await expect(main.getByRole('status').filter({ hasText: 'At most RM 32' })).toBeVisible();
    await main.getByRole('button', { name: '3 days' }).click();
    await expect(main.getByRole('status').filter({ hasText: 'At most RM 96' })).toBeVisible();

    // A car park without a daily maximum gets no figure at all.
    await main.getByRole('combobox', { name: 'Car park' }).first().selectOption('kul-t1-car-park');
    await expect(main.getByRole('status').filter({ hasText: 'No estimate: rates not verified' })).toBeVisible();

    // Simulated space is labelled.
    await expect(main.getByRole('note', { name: 'Demonstration data' }).first()).toBeVisible();
    await expect(main.getByRole('article', { name: 'Preferred Parking' })).toContainText('Demo');
    await expectNoHorizontalOverflow(page);
    await expectNoAxeViolations(page);
  });

  test('remembers where I parked and shows it on My journey', async ({ page }) => {
    await page.goto('/en/kul/parking');
    const main = page.getByRole('main');
    const form = main.getByRole('form', { name: 'Where I parked' });
    await expect(form).toBeVisible();
    await expect(async () => {
      await form.getByRole('combobox', { name: 'Car park' }).selectOption('kul-long-term-car-park');
      await form.getByRole('textbox', { name: /^Level/ }).fill('2');
      await form.getByRole('textbox', { name: /^Zone or bay/ }).fill('B-114');
      await form.getByRole('button', { name: 'Save where I parked' }).click();
      await expect(main.getByText('Saved on this device. You will find it in My journey.')).toBeVisible({ timeout: 2_000 });
    }).toPass();
    await expect(main.getByRole('heading', { name: 'Your saved note' })).toBeVisible();
    await expect(main.getByText('B-114')).toBeVisible();

    await main.getByRole('link', { name: 'Open My journey' }).click();
    await expect(page).toHaveURL(/\/en\/journey/);
    await expect(page.getByRole('main').getByText('B-114')).toBeVisible();
  });
});
