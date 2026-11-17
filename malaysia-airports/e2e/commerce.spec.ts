import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Commerce journeys: shop and dine discovery, an outlet page, and lounges and rest.
 *
 * Conventions follow e2e/smoke.spec.ts: `getByRole` locators (Next.js keeps earlier routes
 * mounted but hidden), a fresh context per test, and the English dictionary values from
 * `src/lib/i18n/features/commerce.ts`. Outlet names come from `src/content/airports/kul.ts`.
 * The dev server compiles pages on first visit, so navigation waits are generous.
 */

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];
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

/** On phones the filter panel is folded behind a button. */
async function openFilters(page: Page, isMobile: boolean) {
  if (isMobile) await page.getByRole('main').getByRole('button', { name: /^Filters/ }).click();
}

test.describe.configure({ timeout: 120_000 });

test.describe('shop and dine', () => {
  test('discovery lists published outlets with an honest note and the official directory', async ({ page }) => {
    await page.goto('/en/kul/shop-dine', { timeout: 90_000 });
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: 'Shop & dine' })).toBeVisible();
    await expect(page).toHaveTitle(/Shop & dine: KLIA/);
    await expect(main.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'KLIA' })).toBeVisible();

    const note = main.getByRole('complementary', { name: 'Only what we could confirm' });
    await expect(note).toContainText('Partial directory');
    await expect(note.getByRole('link', { name: /Restaurants and cafes/ })).toHaveAttribute('href', /klia1\/shop-dine-services\/dine/);

    await expect(main.getByText(/^\d+ places$/)).toBeVisible();
    await expect(main.getByRole('link', { name: 'Charlotte Tilbury' })).toBeVisible();
    await expect(main.getByRole('heading', { name: 'What the sources tell us' })).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('search, type and halal filters narrow the list and live in the URL', async ({ page, isMobile }) => {
    await page.goto('/en/kul/shop-dine', { timeout: 90_000 });
    const main = page.getByRole('main');
    const search = main.getByRole('searchbox', { name: 'Search shops, food and services' });
    await expect(async () => {
      await search.fill('satellite');
      await expect(page).toHaveURL(/q=satellite/, { timeout: 1_000 });
    }).toPass();
    await expect(main.getByRole('link', { name: 'Eraman Chocolate and Liquor Duty Free' })).toBeVisible();
    await expect(main.getByRole('link', { name: 'Kapten Batik' })).toHaveCount(0);
    await expect(main.getByText(/of \d+ places for “satellite”/)).toBeVisible();

    await search.fill('');
    await main.getByRole('group', { name: 'Type' }).getByRole('button', { name: /^Dine/ }).click();
    await expect(page).toHaveURL(/kind=dine/);
    await expect(main.getByRole('link', { name: 'PAUL Le Cafe' })).toBeVisible();
    await expect(main.getByRole('link', { name: 'Charlotte Tilbury' })).toHaveCount(0);

    await main.getByRole('group', { name: 'Type' }).getByRole('button', { name: /^All/ }).click();
    await openFilters(page, isMobile);
    await main.getByRole('switch', { name: 'Halal certified' }).click();
    await expect(page).toHaveURL(/halal=1/);
    await expect(main.getByRole('link', { name: 'PAUL Le Cafe' })).toBeVisible();
    await expect(main.getByRole('link', { name: 'Eraman Duty-Free Mall' })).toHaveCount(0);
  });

  test('honours the home page filters and explains why "open now" leaves outlets out', async ({ page, isMobile }) => {
    await page.goto('/en/kul/shop-dine?filters=open-now,airside', { timeout: 90_000 });
    const main = page.getByRole('main');
    await openFilters(page, isMobile);
    await expect(main.getByRole('switch', { name: 'Open now' })).toBeChecked();
    await expect(main.getByRole('heading', { name: 'No outlet with published hours is open now' })).toBeVisible();
    // The button is in the static HTML: retry until hydration has attached its handler.
    await expect(async () => {
      await main.getByRole('button', { name: 'Turn off “Open now”' }).click({ timeout: 2_000 });
      await expect(main.getByRole('link', { name: 'Eraman Chocolate and Liquor Duty Free' })).toBeVisible({ timeout: 1_000 });
    }).toPass();
    await expect(main.getByRole('link', { name: 'gateway@klia2' })).toHaveCount(0);
  });

  test('near your gate groups outlets by schematic proximity, labelled as an estimate', async ({ page }) => {
    await page.goto('/en/kul/shop-dine', { timeout: 90_000 });
    const main = page.getByRole('main');
    const panel = main.getByRole('region', { name: 'Near your gate' });
    await expect(async () => {
      await panel.getByRole('combobox', { name: 'Your gate area' }).selectOption({ label: 'Gates C, international' });
      await expect(page).toHaveURL(/gate=kul-t1-c/, { timeout: 1_000 });
    }).toPass();
    const near = main.getByRole('region', { name: /^Near your gate area/ });
    await expect(near.getByRole('link', { name: 'Eraman Chocolate and Liquor Duty Free' })).toBeVisible();
    await expect(near.getByText('Estimated').first()).toBeVisible();
    await expect(main.getByRole('combobox', { name: 'Sort by' })).toHaveValue('gate');
    await expect(main.getByRole('region', { name: /^On your way to your gate/ }).getByRole('link', { name: 'Eraman Duty-Free Mall' })).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('fits a 360 pixel screen without sideways scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    await page.goto('/ms/kul/shop-dine', { timeout: 90_000 });
    await expect(page.getByRole('main').getByRole('heading', { level: 1, name: 'Beli-belah & makan' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});

test.describe('outlet page', () => {
  test('shows where, hours or "not published", sources and related outlets, and saves to my journey', async ({ page }) => {
    await page.goto('/en/kul/shop-dine/paul-le-cafe', { timeout: 90_000 });
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: 'PAUL Le Cafe' })).toBeVisible();
    await expect(page).toHaveTitle(/PAUL Le Cafe, KLIA Terminal 1/);
    await expect(main.getByRole('navigation', { name: 'Breadcrumb' }).getByRole('link', { name: 'Shop & dine' })).toBeVisible();
    await expect(main.getByRole('heading', { level: 2, name: 'Where to find it' })).toBeVisible();
    await expect(main.getByText('Not published').first()).toBeVisible();
    await expect(main.getByText('Halal certified').first()).toBeVisible();
    await expect(main.getByRole('heading', { level: 2, name: 'Sources' })).toBeVisible();
    await expect(main.getByRole('link', { name: /KLIA Terminal 1 homepage/ })).toBeVisible();
    await expect(main.getByRole('heading', { level: 2, name: 'Also at KLIA' })).toBeVisible();

    const save = main.getByRole('button', { name: 'Save to my journey' });
    await expect(save).toBeEnabled();
    await save.click();
    await expect(main.getByRole('button', { name: 'Saved to my journey' })).toHaveAttribute('aria-pressed', 'true');
    await expectNoAxeViolations(page);
  });

  test('is published in Bahasa Malaysia too', async ({ page }) => {
    await page.goto('/ms/kul/shop-dine/gateway-klia2', { timeout: 90_000 });
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: 'gateway@klia2' })).toBeVisible();
    await expect(main.getByRole('heading', { level: 2, name: 'Di mana untuk mencarinya' })).toBeVisible();
  });
});

test.describe('lounges and rest', () => {
  test('lists lounges by terminal and side of security, with the transit explainer', async ({ page }) => {
    await page.goto('/en/kul/lounges', { timeout: 90_000 });
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: 'Lounges and hotels' })).toBeVisible();
    await expect(main.getByRole('heading', { level: 2, name: 'KLIA Terminal 1' })).toBeVisible();
    await expect(main.getByRole('heading', { level: 2, name: 'KLIA Terminal 2' })).toBeVisible();
    await expect(main.getByRole('heading', { name: 'Plaza Premium Lounge', exact: true })).toBeVisible();
    await expect(main.getByRole('heading', { level: 2, name: 'Rest airside or landside?' })).toBeVisible();
    await expect(main.getByText('Suggestion', { exact: true })).toBeVisible();
    await expectNoAxeViolations(page);

    await page.goto('/en/kul/lounges?t=T2', { timeout: 90_000 });
    await expect(main.getByRole('heading', { level: 2, name: 'KLIA Terminal 2' })).toBeVisible();
    await expect(main.getByRole('heading', { level: 2, name: 'KLIA Terminal 1' })).toHaveCount(0);
    await expect(main.getByRole('heading', { name: 'Travel Club Lounge' })).toBeVisible();
  });

  test('works for a single-terminal airport with operator links', async ({ page }) => {
    await page.goto('/en/pen/lounges', { timeout: 90_000 });
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: 'Lounges and hotels' })).toBeVisible();
    await expect(main.getByRole('link', { name: /Operator’s page/ }).first()).toHaveAttribute('href', /plazapremiumlounge\.com/);
    await expectNoAxeViolations(page);
  });
});
