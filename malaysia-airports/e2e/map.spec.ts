import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Terminal map, wayfinding and the facilities directory.
 *
 * Conventions follow e2e/smoke.spec.ts: role locators, English dictionary strings from
 * src/lib/i18n/features/map.ts, an axe scan on every page. The KLIA Terminal 1 schematic map is
 * the only map model today; Penang has facilities but no map.
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

test.describe('terminal map', () => {
  test.describe.configure({ timeout: 120_000 });

  test('search a place, read its details and get written directions to it', async ({ page }) => {
    await page.goto('/en/kul/map');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: 'Terminal map' })).toBeVisible();
    await expect(main.getByText('Schematic demonstration map, not a floor plan').first()).toBeVisible();
    await expect(main.getByRole('group', { name: 'Level', exact: true })).toBeVisible();
    await expect(main.getByRole('group', { name: /Schematic map: Level 5/ })).toBeVisible();

    const search = main.getByRole('searchbox', { name: 'Search this map' });
    // Typing before hydration does not reach React, so clear and type again until results show.
    await expect(async () => {
      await search.fill('');
      await search.fill('prayer');
      await expect(main.getByRole('listitem').getByRole('button', { name: /^Prayer room \(illustrative position\) Prayer room/ })).toBeVisible({ timeout: 2_000 });
    }).toPass();
    await main.getByRole('listitem').getByRole('button', { name: /^Prayer room \(illustrative position\) Prayer room/ }).click();

    const details = main.getByRole('region', { name: 'Prayer room (illustrative position)' });
    await expect(details).toBeVisible();
    await expect(details.getByText('Demo', { exact: false }).first()).toBeVisible();
    await expect(page).toHaveURL(/poi=l5-prayer-room/);

    await details.getByRole('button', { name: 'Route here', exact: true }).click();
    await expect(page).toHaveURL(/to=l5-prayer-room/);
    const directions = main.getByRole('region', { name: 'Directions' });
    await expect(directions.getByRole('heading', { name: 'Step by step' })).toBeVisible();
    await expect(directions.getByRole('listitem').first()).toContainText('Start at');
    await expect(directions.getByText('Typical walking pace')).toBeVisible();
    await expect(directions.getByText('Slower pace')).toBeVisible();

    await expectNoHorizontalOverflow(page);
    await expectNoAxeViolations(page);
  });

  test('deep link to a route across levels, with step-free routing and keyboard zoom', async ({ page }) => {
    await page.goto('/en/kul/map?from=l5-kerb&to=g-gates-c');
    const directions = page.getByRole('main').getByRole('region', { name: 'Directions' });
    await expect(directions.getByRole('button', { name: /Take the train to Aerotrain station \(Satellite Building\)/ })).toBeVisible();
    await expect(directions.getByText('Arrive at Gates C (Satellite Building)')).toBeVisible();

    await page.goto('/en/kul/map?from=l5-row-b&to=l3-toilets');
    await expect(directions.getByText('Includes an escalator or stairs')).toBeVisible();
    await directions.getByRole('switch', { name: 'Step-free route only' }).click();
    await expect(directions.getByText('Step-free', { exact: true })).toBeVisible();
    await expect(directions.getByRole('button', { name: /Take the lift down to Level 3/ })).toBeVisible();
    await expect(page).toHaveURL(/sf=1/);

    const surface = page.getByRole('group', { name: /Schematic map:/ });
    const zoomOut = page.getByRole('button', { name: 'Zoom out' });
    await expect(zoomOut).toBeDisabled();
    await surface.focus();
    await expect(async () => {
      await page.keyboard.press('+');
      await expect(zoomOut).toBeEnabled({ timeout: 1_000 });
    }).toPass();
    await page.getByRole('button', { name: 'Reset view' }).click();
    await expect(zoomOut).toBeDisabled();
    await expectNoAxeViolations(page);
  });

  test('filters apply to the map and to the list view', async ({ page }) => {
    await page.goto('/en/kul/map?level=GATES');
    const main = page.getByRole('main');
    const list = main.getByRole('region', { name: 'All places on this map' });
    await expect(list).toBeVisible();
    await expect(async () => {
      await main.getByRole('button', { name: /^Gates 5$/ }).click();
      await expect(page).toHaveURL(/cat=gates/, { timeout: 2_000 });
    }).toPass();
    await expect(list.getByText('5 places')).toBeVisible();
    await expect(list.getByRole('heading', { name: /Gates: Contact Pier and Satellite/ })).toBeVisible();
    await expect(list.getByRole('heading', { name: /Level 5: departures/ })).toHaveCount(0);
    await list.getByRole('button', { name: 'Show on map: Gates C (Satellite Building)' }).click();
    await expect(page).toHaveURL(/poi=g-gates-c/);
    await expect(main.getByRole('button', { name: /Gates C \(Satellite Building\)\. Gates\./ })).toBeFocused();
  });

  test('an airport without a map says so and points elsewhere', async ({ page }) => {
    await page.goto('/en/pen/map');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: 'Terminal map' })).toBeVisible();
    await expect(main.getByRole('heading', { name: 'No map for Penang International Airport yet' })).toBeVisible();
    await expect(main.getByRole('link', { name: 'Open the facilities directory' })).toHaveAttribute('href', '/en/pen/facilities');
    await expectNoAxeViolations(page);
  });

  test('renders in Bahasa Malaysia', async ({ page }) => {
    await page.goto('/ms/kul/map?poi=l5-calm-room');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: 'Peta terminal' })).toBeVisible();
    await expect(main.getByRole('region', { name: 'Bilik Tenang' })).toBeVisible();
  });
});

test.describe('facilities directory', () => {
  test.describe.configure({ timeout: 120_000 });

  test('filters by type and area, and links to the map', async ({ page }) => {
    await page.goto('/en/kul/facilities');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: 'Facilities and services' })).toBeVisible();
    await expect(main.getByText('17 facilities')).toBeVisible();

    const toggle = main.getByRole('button', { name: 'Filter facilities' });
    if (await toggle.isVisible()) await toggle.click();
    await expect(async () => {
      await main.getByRole('button', { name: /^Lounge 5$/ }).click();
      await expect(page).toHaveURL(/cat=lounge/, { timeout: 2_000 });
    }).toPass();
    await expect(main.getByText('5 facilities')).toBeVisible();
    await main.getByRole('button', { name: 'Passenger-only area (airside)' }).click();
    await expect(page).toHaveURL(/area=airside/);
    await expect(main.getByText('5 facilities')).toBeVisible();
    await expectNoAxeViolations(page);

    await main.getByRole('button', { name: 'Clear filters' }).first().click();
    await expect(main.getByText('17 facilities')).toBeVisible();
    await main.getByRole('link', { name: 'Show on map: Calm Room' }).click();
    await expect(page).toHaveURL(/\/en\/kul\/map\?t=T1&poi=l5-calm-room/);
    await expect(main.getByRole('region', { name: 'Calm Room' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });
});
