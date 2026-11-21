import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { AXE_TAGS as SHARED_AXE_TAGS } from './support/axe';

/**
 * Terminal map, wayfinding and the facilities directory.
 *
 * Conventions follow e2e/smoke.spec.ts: role locators, English dictionary strings from
 * src/lib/i18n/features/map.ts, an axe scan on every page. The KLIA Terminal 1 schematic map is
 * the only map model today; Penang has facilities but no map.
 */

const AXE_TAGS = [...SHARED_AXE_TAGS];
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

  test('an illustrative pin for an unpublished location claims no level or area (C-04)', async ({ page }) => {
    await page.goto('/en/kul/map?poi=l5-prayer-room');
    const details = page.getByRole('main').getByRole('region', { name: 'Prayer room (illustrative position)' });
    await expect(details).toBeVisible();
    await expect(details).toContainText('Position illustrative: level and area not published.');
    await expect(details).not.toContainText('Level 5: departures');
    await expect(details).not.toContainText('Public area (landside)');
    // A sourced place keeps its level.
    await page.goto('/en/kul/map?poi=l5-calm-room');
    await expect(page.getByRole('main').getByRole('region', { name: 'Calm Room' })).toContainText('Level 5: departures');
  });

  test('From and To options are unique, and a step-free arrival route names the level change, immigration and customs (C-08, C-09)', async ({ page }) => {
    await page.goto('/en/kul/map?from=g-gates-c&to=l3-kerb&sf=1');
    const directions = page.getByRole('main').getByRole('region', { name: 'Directions' });
    await expect(directions.getByText('Arrive at Arrivals pick-up')).toBeVisible();
    const labels = await directions.getByRole('combobox', { name: 'From' }).locator('option').allTextContents();
    const places = labels.filter((label) => label.includes(' · '));
    expect(places.length).toBeGreaterThan(30);
    expect(new Set(places).size, 'duplicate option labels').toBe(places.length);
    expect(places).toContain('Aerotrain station (Satellite Building) · Gates');

    const steps = directions.getByRole('listitem');
    await expect(steps.filter({ hasText: 'Go down to Level 3: arrivals, to Arrival immigration' })).toHaveCount(1);
    await expect(steps.filter({ hasText: 'Step-free: use a lift or ramp' })).toHaveCount(1);
    await expect(steps.filter({ hasText: 'Go through Customs' })).toHaveCount(1);
    await expect(steps.filter({ hasText: /^\s*\d*\s*Walk on/ })).toHaveCount(0);
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
    await expect(main.getByRole('heading', { level: 1, name: 'Facilities' })).toBeVisible();
    // 22 since D-02 added the two Fast Track records (kul-t1-fast-track, kul-t2-fast-track).
    await expect(main.getByText('22 facilities')).toBeVisible();

    const toggle = main.getByRole('button', { name: 'Filter facilities' });
    if (await toggle.isVisible()) await toggle.click();
    await expect(async () => {
      await main.getByRole('button', { name: /^Lounge 6$/ }).click();
      await expect(page).toHaveURL(/cat=lounge/, { timeout: 2_000 });
    }).toPass();
    await expect(main.getByText('6 facilities')).toBeVisible();
    await main.getByRole('button', { name: 'Passenger-only area (airside)' }).click();
    await expect(page).toHaveURL(/area=airside/);
    await expect(main.getByText('6 facilities')).toBeVisible();
    // The filter clicks leave the page scrolled so that a chip can straddle the sticky header at
    // that instant, which axe's target-size rule counts as obscured. Check from the top of the page.
    await page.evaluate(() => window.scrollTo(0, 0));
    await expectNoAxeViolations(page);

    await main.getByRole('button', { name: 'Clear filters' }).first().click();
    await expect(main.getByText('22 facilities')).toBeVisible();
    await main.getByRole('link', { name: 'Show on map: Calm Room' }).click();
    await expect(page).toHaveURL(/\/en\/kul\/map\?t=T1&poi=l5-calm-room/);
    await expect(main.getByRole('region', { name: 'Calm Room' })).toBeVisible();
    await expectNoHorizontalOverflow(page);
  });

  test('a parent reaches the nursing-room answer in two interactions (C-07)', async ({ page }) => {
    await page.goto('/en/kul/facilities');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: 'Facilities' })).toBeVisible();
    // Unfiltered, the unpublished categories are listed at the end.
    const unpublished = main.getByRole('region', { name: 'Not published yet' });
    await expect(unpublished.getByRole('article', { name: 'Nursing and baby care room' })).toBeVisible();
    await expect(unpublished.getByRole('article', { name: 'Accessible toilet' })).toBeVisible();

    // 1. Open the filters (phones only), 2. choose "Nursing and baby care room".
    const toggle = main.getByRole('button', { name: 'Filter facilities' });
    if (await toggle.isVisible()) await toggle.click();
    await expect(async () => {
      await main.getByRole('button', { name: 'Nursing and baby care room' }).click();
      await expect(page).toHaveURL(/cat=nursing-room/, { timeout: 2_000 });
    }).toPass();
    const card = main.getByRole('article', { name: 'Nursing and baby care room' });
    await expect(card).toContainText('Not published: location, level and opening hours');
    await expect(card.getByRole('link', { name: /Find an information counter/ })).toHaveAttribute('href', '#kul-t1-information-counter');
    await expect(main.getByRole('heading', { name: 'No facilities match these filters' })).toHaveCount(0);
    await expectNoAxeViolations(page);
  });
});

test.describe('missing airport sections (C-06)', () => {
  // Status codes only behave for real on `next start` (docs/engineering/next16-notes.md, section 5):
  // the dev server always answers 200. Run against a production server, or set E2E_STATUS_CODES=1.
  test.skip(Boolean(process.env.PLAYWRIGHT_BASE_URL) && !process.env.E2E_STATUS_CODES, 'needs next start');
  test.describe.configure({ timeout: 600_000 });

  test('every airport and section pair answers 200 or 404 from the first and a repeat request, with a matching title', async ({ request }) => {
    // The 39 airports, from the airport directory.
    const directory = await (await request.get('/en/airports')).text();
    const airports = [...new Set([...directory.matchAll(/href="\/en\/([a-z]{3})"/g)].map((match) => match[1]))];
    expect(airports).toHaveLength(39);
    // Airports with a content file (src/content/index.ts) get transit's simple page.
    const withContent = new Set(['kul', 'pen', 'bki', 'kch', 'lgk', 'szb']);
    // The overview is checked below; flights (package B's page) is left out until it declares
    // `ensureStatic` too: today an airport without demo flights may answer 200 on the first request.
    const sections = ['map', 'facilities', 'transport', 'parking', 'shop-dine', 'lounges', 'transit'] as const;
    const failures: string[] = [];
    for (const airport of airports) {
      // The overview always exists; its section navigation links only the sections the airport has.
      const overview = await request.get(`/en/${airport}`, { maxRedirects: 0 });
      if (overview.status() !== 200) failures.push(`/en/${airport}: ${overview.status()}`);
      const html = await overview.text();
      const has = (section: string) => html.includes(`href="/en/${airport}/${section}"`);
      for (const section of sections) {
        const expected = has(section) || (section === 'map' && has('facilities')) || (section === 'transit' && withContent.has(airport));
        const path = `/en/${airport}/${section}`;
        for (const attempt of ['first', 'repeat']) {
          const response = await request.get(path, { maxRedirects: 0 });
          const status = response.status();
          if (status !== (expected ? 200 : 404)) failures.push(`${path} (${attempt}): ${status}, expected ${expected ? 200 : 404}`);
          if (!expected && attempt === 'first' && !(await response.text()).includes('<title>Page not found')) failures.push(`${path}: title is not "Page not found"`);
        }
      }
    }
    expect(failures).toEqual([]);
  });
});
