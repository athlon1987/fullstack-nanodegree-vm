import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Smoke journeys for the application shell, the home page and the airport pages.
 *
 * Conventions (see docs/engineering/handoffs/shell.md):
 * - Locate with `getByRole`: Next.js 16 keeps up to three earlier routes mounted but hidden, and
 *   role queries ignore hidden copies where `locator()` or `getByLabel` could match them.
 * - Each test gets a fresh browser context, so storage (airport, mode, preferences) starts empty.
 * - The strings below are the English (and a few Malay) dictionary values. If you change copy in
 *   `src/lib/i18n/*.ts`, update the matching expectation here.
 */

const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa'];

/**
 * `@axe-core/playwright` is typed against a newer `playwright-core` than the one `@playwright/test`
 * bundles, so the two `Page` types differ by a few new methods. The runtime object is the same.
 */
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

test.describe('home', () => {
  test('renders in English and in Bahasa Malaysia', async ({ page }) => {
    await page.goto('/en');
    await expect(page.locator('html')).toHaveAttribute('lang', 'en');
    await expect(page.getByRole('heading', { level: 1, name: 'Your journey, beautifully connected.' })).toBeVisible();
    await expect(page).toHaveTitle(/Malaysia Airports/);

    await page.goto('/ms');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ms');
    await expect(page.getByRole('heading', { level: 1, name: 'Perjalanan anda, terhubung dengan indah.' })).toBeVisible();
    await expect(page.getByRole('list', { name: 'Tindakan pantas' })).toBeVisible();
  });

  test('first screen holds search, modes, airport selector, notice and quick actions', async ({ page }) => {
    await page.goto('/en');
    const main = page.getByRole('main');
    await expect(main.getByRole('searchbox', { name: 'Search flights' })).toBeInViewport();
    await expect(main.getByRole('group', { name: 'What are you doing today?' })).toBeInViewport({ ratio: 1 });
    await expect(main.getByRole('button', { name: /Airport or terminal/ })).toBeInViewport({ ratio: 1 });
    await expect(main.getByRole('link', { name: /^Details:/ })).toBeInViewport({ ratio: 1 });
    const actions = main.getByRole('list', { name: 'Quick actions' });
    await expect(actions).toBeInViewport({ ratio: 1 });
    await expect(actions.getByRole('link')).toHaveCount(6);
  });

  test('also fits the first screen at 1280 by 720', async ({ page, isMobile }) => {
    test.skip(isMobile, 'desktop size only');
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/en');
    const main = page.getByRole('main');
    await expect(main.getByRole('searchbox', { name: 'Search flights' })).toBeInViewport();
    await expect(main.getByRole('link', { name: /^Details:/ })).toBeInViewport({ ratio: 1 });
    await expect(main.getByRole('list', { name: 'Quick actions' })).toBeInViewport({ ratio: 1 });
  });

  test('a journey mode switches the board direction and reorders the quick actions', async ({ page }) => {
    await page.goto('/en');
    const main = page.getByRole('main');
    await main.getByRole('radio', { name: /^Arriving/ }).check();
    await expect(main.getByRole('radio', { name: 'Arrivals' })).toBeChecked();
    await expect(main.getByRole('list', { name: 'Quick actions' }).getByRole('link').first()).toHaveAccessibleName(/Follow your flight in/);
    await expect(main.getByRole('group', { name: 'What are you doing today?' }).getByRole('status')).toContainText('Arriving selected');
  });

  test('flight search shows demo-labelled results inline', async ({ page }) => {
    await page.goto('/en');
    const desk = page.getByRole('main').getByRole('region', { name: 'Flight search' });
    await desk.getByRole('searchbox', { name: 'Search flights' }).fill('MH');
    await desk.getByRole('button', { name: 'Search flights' }).click();
    const results = desk.getByRole('list', { name: 'Matching flights' });
    await expect(results.getByRole('link', { name: /^View flight MH \d+/ }).first()).toBeVisible();
    await expect(desk.getByText('Demo', { exact: true })).toBeVisible();
    await expect(desk.getByRole('status')).toContainText('flights found');
  });
});

test.describe('airport context', () => {
  test('choosing an airport scopes the page and is remembered', async ({ page }) => {
    await page.goto('/en');
    await page.getByRole('banner').getByRole('button', { name: 'Choose airport' }).click();
    const dialog = page.getByRole('dialog', { name: 'Choose an airport' });
    await expect(dialog.getByRole('button', { name: /^KUL KLIA Terminal 1/ })).toBeVisible();
    await expect(dialog.getByRole('button', { name: /^KUL KLIA Terminal 2/ })).toBeVisible();
    await dialog.getByRole('searchbox', { name: 'Search airports' }).fill('penang');
    await dialog.getByRole('button', { name: /^PEN Penang/ }).click();
    await expect(dialog).toBeHidden();

    const current = page.getByRole('banner').getByRole('button', { name: /Currently Penang/ });
    await expect(current).toBeVisible();
    await page.reload();
    await expect(current).toBeVisible();

    // The remembered choice is offered first next time.
    await current.click();
    await expect(page.getByRole('region', { name: 'Your last choice' }).getByRole('button', { name: /^PEN Penang/ })).toBeVisible();
  });

  test('choosing from an airport page keeps the section', async ({ page }) => {
    await page.goto('/en/kul');
    await expect(page.getByRole('heading', { level: 1, name: 'Kuala Lumpur International Airport' })).toBeVisible();
    await page.getByRole('banner').getByRole('button', { name: /Currently KLIA|KUL/ }).click();
    await page.getByRole('dialog').getByRole('button', { name: /^PEN Penang/ }).click();
    await expect(page).toHaveURL(/\/en\/pen$/);
    await expect(page.getByRole('heading', { level: 1, name: 'Penang International Airport' })).toBeVisible();
  });

  test('the directory honours ?then= and sends the visitor to that section', async ({ page }) => {
    await page.goto('/en/airports?then=parking');
    await expect(page.getByRole('note').filter({ hasText: 'continue to Parking' })).toBeVisible();
    await expect(page.getByRole('link', { name: 'Go to Parking at Kuala Lumpur International Airport' })).toHaveAttribute('href', '/en/kul/parking');
  });
});

test.describe('shell', () => {
  test('the language switch keeps the page', async ({ page, isMobile }) => {
    await page.goto('/en/kul');
    if (isMobile) {
      await page.getByRole('navigation', { name: 'Quick navigation' }).getByRole('button', { name: 'Menu' }).click();
      await page.getByRole('dialog', { name: 'Menu' }).getByRole('link', { name: /Bahasa Malaysia/ }).click();
    } else {
      await page.getByRole('group', { name: 'Language' }).getByRole('link', { name: /Bahasa Malaysia/ }).click();
    }
    await expect(page).toHaveURL(/\/ms\/kul$/);
    await expect(page.locator('html')).toHaveAttribute('lang', 'ms');
  });

  test('the search palette opens with the keyboard and finds flights and places', async ({ page }) => {
    await page.goto('/en');
    await page.keyboard.press('/');
    const dialog = page.getByRole('dialog', { name: 'Search' });
    const box = dialog.getByRole('combobox', { name: 'Search the site' });
    await expect(box).toBeFocused();
    await box.fill('prayer');
    await expect(dialog.getByRole('option', { name: /Prayer room/ }).first()).toBeVisible();
    await box.fill('MH 2');
    await expect(dialog.getByRole('group', { name: 'Flights' })).toBeVisible();
    await expect(dialog.getByText('Flights are demonstration data')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    await page.keyboard.press('ControlOrMeta+k');
    await expect(page.getByRole('dialog', { name: 'Search' })).toBeVisible();
  });

  test('the search page answers ?q= with the same engine', async ({ page }) => {
    await page.goto('/en/search?q=prayer');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(page.getByRole('link', { name: /Prayer room/ }).first()).toBeVisible();
  });

  test('there is no horizontal overflow at 360 px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    for (const path of ['/en', '/ms', '/en/kul', '/en/iph', '/en/airports', '/en/notices', '/en/search?q=klia']) {
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  });

  test('unknown pages answer 404 and bare paths redirect to a locale', async ({ request }) => {
    expect((await request.get('/en/zzz')).status()).toBe(404);
    expect((await request.get('/en/nothing/here')).status()).toBe(404);
    const bare = await request.get('/', { maxRedirects: 0 });
    expect(bare.status()).toBe(307);
    expect(bare.headers().location).toMatch(/\/en$/);
    const malay = await request.get('/kul', { maxRedirects: 0, headers: { 'Accept-Language': 'ms-MY,ms;q=0.9,en;q=0.5' } });
    expect(malay.headers().location).toMatch(/\/ms\/kul$/);
  });
});

test.describe('accessibility', () => {
  test('home has no axe violations', async ({ page }) => {
    await page.goto('/en');
    await expect(page.getByRole('table').or(page.getByRole('list', { name: 'Quick actions' })).first()).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('an airport page has no axe violations', async ({ page }) => {
    await page.goto('/en/kul');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('a directory-only airport page has no axe violations', async ({ page }) => {
    await page.goto('/ms/iph');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expectNoAxeViolations(page);
  });
});
