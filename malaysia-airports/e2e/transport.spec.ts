import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { AXE_TAGS as SHARED_AXE_TAGS } from './support/axe';

/**
 * Journeys for the ground transport planner (`/[lang]/[airport]/transport`) and parking
 * (`/[lang]/[airport]/parking`). Conventions as in `smoke.spec.ts`: role locators, a fresh context
 * per test, English dictionary values from `src/lib/i18n/features/transport.ts`.
 *
 * The browser clock is fixed, because which KLIA Ekspres fare applies depends on the date: the
 * content publishes RM 55 until 31 December 2026 and RM 65 from 1 January 2027.
 */

const AXE_TAGS = [...SHARED_AXE_TAGS];
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
    await expect(main.getByRole('heading', { level: 1, name: 'Transport to and from KLIA' })).toBeVisible();
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

    // The visible label covers each visually hidden radio, so check it without the pointer test.
    await expect(async () => {
      await main.getByRole('radio', { name: 'Least effort' }).check({ force: true });
      await expect(page).toHaveURL(/by=convenience/, { timeout: 2_000 });
    }).toPass();
    await expect(main.getByText(/Sorted by our rule of thumb/)).toBeVisible();

    await main.getByRole('radio', { name: 'Table' }).check({ force: true });
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
    await expect(page.getByRole('heading', { level: 1, name: 'Pengangkutan ke dan dari KLIA' })).toBeVisible();
    // C-02: the anti-touting advice is at the top in Malay too, with the Help answer.
    const warning = page.getByRole('main').getByRole('note').filter({ hasText: 'Tempah teksi hanya di kaunter kupon; abaikan sesiapa yang menawarkan tumpangan' });
    await expect(warning).toBeVisible();
    await expect(warning.getByRole('link', { name: /Amaran penipuan/ })).toHaveAttribute('href', '/ms/help/scams#scam-touts');
  });

  test('warns against touts at the top and beside taxis and e-hailing, lists the coupon taxi for KL Sentral and links to official tickets (C-02)', async ({ page }) => {
    await page.clock.setFixedTime(BEFORE_RISE);
    await page.goto('/en/kul/transport');
    const main = page.getByRole('main');
    const warning = main.getByRole('note').filter({ hasText: 'Book taxis only at the coupon counters; ignore anyone offering a ride' });
    await expect(warning).toBeVisible();
    await expect(warning).toContainText('Road Transport Department');
    await expect(warning.getByRole('link', { name: 'Scam alerts: what to do' })).toHaveAttribute('href', '/en/help/scams#scam-touts');
    // It comes before the comparison.
    const warningBox = await warning.boundingBox();
    const plannerBox = await main.getByRole('heading', { name: 'Compare your options' }).boundingBox();
    expect(warningBox!.y).toBeLessThan(plannerBox!.y);

    const results = main.getByRole('list', { name: /Ways to travel between KLIA and KL Sentral/ });
    const taxi = results.getByRole('article', { name: 'Airport taxi (prepaid coupon)' });
    await expect(taxi).toBeVisible();
    await expect(taxi).toContainText('Book taxis only at the coupon counters; ignore anyone offering a ride.');
    await expect(taxi).toContainText('Coupon counters: International Arrival Hall');
    await expect(results.getByRole('article', { name: /E-hailing/ })).toContainText('Book in the app and meet your driver at the pick-up point; ignore anyone offering a ride.');
    await expect(main.getByRole('heading', { name: 'Not listed for KL Sentral' })).toBeVisible();
    await expect(main.getByRole('region', { name: 'Not listed for KL Sentral' }).getByText('Airport taxi (prepaid coupon)')).toHaveCount(0);

    const ekspres = results.getByRole('article', { name: /KLIA Ekspres/ });
    await expect(ekspres.getByRole('link', { name: /Tickets on the operator’s website/ })).toHaveAttribute('href', 'https://kliaekspres.com/');
    await expectNoAxeViolations(page);
  });

  test('puts each section heading before its sub-headings (C-10)', async ({ page }) => {
    await page.goto('/en/kul/transport');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1 })).toBeVisible();
    const levels = await main.locator('h1, h2, h3, h4').evaluateAll((nodes) => nodes.filter((node) => (node as HTMLElement).offsetParent !== null).map((node) => Number(node.tagName.slice(1))));
    // No heading skips a level on the way down (an h3 right after an h1 would).
    for (let index = 1; index < levels.length; index += 1) expect(levels[index] - levels[index - 1], `heading ${index}`).toBeLessThanOrEqual(1);
    const missing = main.getByRole('region', { name: 'Not covered here yet' });
    const order = await missing.locator('h2, h3').evaluateAll((nodes) => nodes.map((node) => node.tagName));
    expect(order[0]).toBe('H2');
  });
});

test.describe('parking', () => {
  // Intended behaviour changed in the fix round (C-01): the Preferred Parking warning moved from a
  // callout at the top into its row of the price matrix, and the "rates are not verified" callout
  // into the matrix lead. The calculator still estimates only a ceiling.
  test('leads with the price matrix, keeps the warning in its row, estimates only a ceiling, and passes axe', async ({ page }) => {
    await page.clock.setFixedTime(BEFORE_RISE);
    await page.goto('/en/kul/parking');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: 'Parking at KLIA' })).toBeVisible();

    const matrix = main.getByRole('region', { name: 'Prices at a glance' });
    await expect(matrix).toContainText('Not the fee');
    const table = matrix.getByRole('table', { name: 'What parking at KLIA can cost for 1, 3 or 7 days' });
    await expect(table.getByRole('columnheader', { name: '7 days' })).toBeVisible();
    // Long Term Car Park: published daily maximum, so "at most" RM 32, 96 and 224. Anchored: the
    // Preferred Parking warning row now names the Long Term Car Park too (D-06).
    const ltcp = table.getByRole('row', { name: /^Long Term Car Park/ });
    await expect(ltcp).toContainText('RM 32');
    await expect(ltcp).toContainText('RM 96');
    await expect(ltcp).toContainText('RM 224');
    // Terminal 1 Car Park: not verified; the source's own figure, dated and attributed, with a link out.
    await expect(table).toContainText('Not verified. RM 52 a day according to klia.info (undated, retrieved 17 Nov 2026).');
    await expect(table.getByRole('link', { name: /Check the official rates/ }).first()).toHaveAttribute('href', /malaysiaairports\.com\.my/);
    // Preferred Parking: no price, and its warning in its own row.
    await expect(table.getByRole('row', { name: /^Preferred Parking/ })).toContainText('No price published');
    // D-06 states the warning as a rule (verification round: was "Parking for more than a day? Avoid Preferred Parking").
    await expect(table).toContainText('Staying more than a day? Use the Long Term Car Park');
    await expect(matrix.getByRole('link', { name: /Book parking online/ })).toHaveAttribute('href', /malaysiaairports\.com\.my/);

    // Long Term Car Park: rates not verified, daily maximum RM 32 published, so only "at most".
    await expect(main.getByRole('combobox', { name: 'Car park' }).first()).toHaveValue('kul-long-term-car-park');
    await expect(main.getByRole('status').filter({ hasText: 'At most RM 32' })).toBeVisible();
    await main.getByRole('button', { name: '3 days' }).click();
    await expect(main.getByRole('status').filter({ hasText: 'At most RM 96' })).toBeVisible();
    // The official site takes no dates in its link, so the dates are shown beside it.
    await expect(main.getByRole('link', { name: /Book Long Term Car Park \(LTCP\) on the official site/ })).toBeVisible();
    await expect(main.getByText(/^Your dates: .+ to .+\. Enter them on the official site/)).toBeVisible();

    // A car park without a daily maximum gets no figure at all.
    await main.getByRole('combobox', { name: 'Car park' }).first().selectOption('kul-t1-car-park');
    await expect(main.getByRole('status').filter({ hasText: 'No estimate: rates not verified' })).toBeVisible();

    // Simulated space is labelled.
    await expect(main.getByRole('note', { name: 'Demonstration data' }).first()).toBeVisible();
    await expect(main.getByRole('article', { name: 'Preferred Parking' })).toContainText('Demo');
    await expectNoHorizontalOverflow(page);
    await expectNoAxeViolations(page);
  });

  test('shows the price matrix in the first phone screen, before the calculator (C-01)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/en/kul/parking');
    const matrix = page.getByRole('main').getByRole('region', { name: 'Prices at a glance' });
    await expect(matrix).toBeVisible();
    const box = await matrix.boundingBox();
    expect(box, 'matrix box').not.toBeNull();
    // It starts inside the first screen, under the page header (with the current airport chrome).
    expect(box!.y).toBeLessThan(844 - 120);
    const calculator = await page.getByRole('heading', { name: 'Estimate your stay' }).boundingBox();
    expect(calculator!.y).toBeGreaterThan(box!.y + box!.height - 1);
    await expectNoHorizontalOverflow(page);
  });

  test('fills the calculator with the dates a journey link carries (B-13, C-01)', async ({ page }) => {
    await page.clock.setFixedTime(BEFORE_RISE);
    await page.goto('/en/kul/parking?t=T1&from=2026-11-20T08%3A00%3A00%2B08%3A00&to=2026-11-23T08%3A00%3A00%2B08%3A00');
    const main = page.getByRole('main');
    await expect(main.getByText('Dates filled in from your flight. Change them if your plans differ.')).toBeVisible();
    await expect(main.getByLabel('Entry date')).toHaveValue('2026-11-20');
    await expect(main.getByLabel('Exit date')).toHaveValue('2026-11-23');
    await expect(main.getByRole('status').filter({ hasText: 'At most RM 96' })).toBeVisible();
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
    // Next.js keeps the parking page mounted but hidden; role queries skip it.
    await expect(page.getByRole('main').getByRole('definition').filter({ hasText: 'B-114' })).toBeVisible();
  });
});

test.describe('transit planner verdict (C-03)', () => {
  test('puts the verdict card under the form and before the steps, within one phone screen, and announces changes', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 664 });
    await page.goto('/en/kul/transit?from=T1&to=T2&ticket=self&arr=intl&dep=intl&layover=180');
    const main = page.getByRole('main');
    const verdict = main.getByRole('region', { name: 'Tight' });
    await expect(verdict).toBeVisible();
    await expect(verdict).toContainText('Your time sits inside our estimate');
    await expect(verdict).toContainText('Our estimate');
    await expect(verdict.getByRole('link', { name: /If it is tight: what to do/ })).toHaveAttribute('href', '#transit-late');

    const form = main.getByRole('form', { name: 'Plan your connection' });
    const last = await form.getByRole('combobox').last().boundingBox();
    const card = await verdict.boundingBox();
    const steps = await main.getByRole('heading', { name: /steps/i }).first().boundingBox();
    expect(card!.y).toBeGreaterThan(last!.y);
    expect(card!.y - (last!.y + last!.height)).toBeLessThan(664);
    expect(steps!.y).toBeGreaterThan(card!.y);

    // A change is announced politely with the new verdict.
    await form.getByRole('combobox').last().selectOption('720');
    await expect(main.getByRole('region', { name: 'Looks workable' })).toBeVisible();
    await expect(form.getByRole('status')).toContainText('Looks workable.');
  });
});
