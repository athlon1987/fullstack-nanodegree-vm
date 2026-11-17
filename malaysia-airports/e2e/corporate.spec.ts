import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Journeys for the corporate section and the transparency pages (about this prototype, privacy,
 * terms). Conventions follow e2e/smoke.spec.ts: role locators, a fresh context per test, English
 * strings from src/lib/i18n/features/corporate.ts. The dev server compiles pages on first visit,
 * so timeouts are generous.
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

const CORPORATE_PAGES = [
  { path: '/en/corporate/about', h1: 'About Malaysia Airports', nav: 'About' },
  { path: '/en/corporate/network', h1: 'Our airports', nav: 'Our airports' },
  { path: '/en/corporate/business', h1: 'Business with Malaysia Airports', nav: 'Business with us' },
  { path: '/en/corporate/sustainability', h1: 'Sustainability', nav: 'Sustainability' },
  { path: '/en/corporate/careers', h1: 'Careers', nav: 'Careers' },
  { path: '/en/corporate/news', h1: 'Media centre', nav: 'Media centre' },
  { path: '/en/corporate/governance', h1: 'Governance', nav: 'Governance' },
  { path: '/en/corporate/contact', h1: 'Contact Malaysia Airports', nav: 'Contact' },
];

test.describe.configure({ timeout: 180_000 });

test.describe('corporate', () => {
  test('home shows the company in numbers with sources and links to every section', async ({ page }) => {
    await page.goto('/en/corporate');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: /The company that runs Malaysia.s airports/ })).toBeVisible();
    await expect(page).toHaveTitle(/Corporate/);

    const nav = main.getByRole('navigation', { name: 'Corporate sections' });
    await expect(nav.getByRole('link', { name: 'Passenger site' })).toBeVisible();

    await expect(main.getByRole('heading', { name: 'The network in 2025' })).toBeVisible();
    await expect(main.getByText('104.4 million').first()).toBeVisible();
    await expect(main.getByText(/\d+ sources?/).first()).toBeVisible();

    const index = main.getByRole('region', { name: 'Explore the company' });
    for (const name of ['About', 'Our airports', 'Business with us', 'Sustainability', 'Careers', 'Media centre', 'Governance', 'Contact']) {
      await expect(index.getByRole('link', { name, exact: true })).toBeVisible();
    }
    await expectNoAxeViolations(page);
  });

  test('every corporate page has one h1, marks itself in the section navigation and passes axe', async ({ page }) => {
    for (const item of CORPORATE_PAGES) {
      await page.goto(item.path);
      const main = page.getByRole('main');
      await expect(main.getByRole('heading', { level: 1 })).toHaveCount(1);
      await expect(main.getByRole('heading', { level: 1, name: item.h1 })).toBeVisible();
      const nav = main.getByRole('navigation', { name: 'Corporate sections' });
      await expect(nav.locator('a[aria-current="page"]').first()).toHaveText(new RegExp(item.nav));
      await expectNoAxeViolations(page);
    }
  });

  test('the section navigation moves between pages and back to the passenger site', async ({ page, isMobile }) => {
    await page.goto('/en/corporate');
    const nav = page.getByRole('main').getByRole('navigation', { name: 'Corporate sections' });
    if (isMobile) await nav.getByText('Sections').click();
    await nav.getByRole('link', { name: 'Sustainability' }).click();
    await expect(page).toHaveURL(/\/en\/corporate\/sustainability$/);
    await expect(page.getByRole('main').getByRole('heading', { level: 1, name: 'Sustainability' })).toBeVisible();
    await expect(page.getByRole('table', { name: 'Airport Carbon Accreditation by airport' })).toBeVisible();

    await page.getByRole('main').getByRole('navigation', { name: 'Corporate sections' }).getByRole('link', { name: 'Passenger site' }).click();
    await expect(page).toHaveURL(/\/en$/);
  });

  test('about states leadership with a date, ownership after privatisation and what is not published', async ({ page }) => {
    await page.goto('/en/corporate/about');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { name: 'Ownership after the 2025 privatisation' })).toBeVisible();
    await expect(main.getByText('Gateway Development Alliance (GDA)').first()).toBeVisible();
    await expect(main.getByText(/Leadership as of 16 November 2026/)).toBeVisible();
    await expect(main.getByText('Tan Sri Dr. Azmil Khalid', { exact: true })).toBeVisible();
    await expect(main.getByText('Full Board of Directors after the 2025 delisting')).toBeVisible();
    await expect(main.getByRole('link', { name: /Board of Directors on the official site/ })).toHaveAttribute('target', '_blank');
  });

  test('the media centre lists statistics and news, and a story shows its sources', async ({ page, isMobile }) => {
    await page.goto('/en/corporate/news');
    const main = page.getByRole('main');
    // A table on wide screens, a stacked list on phones.
    const stats = isMobile ? main.getByRole('list', { name: 'Passenger traffic statistics' }) : main.getByRole('table', { name: 'Passenger traffic statistics' });
    await expect(stats).toContainText('104.4 million');
    await main.getByRole('link', { name: 'Malaysia Airports leaves Bursa Malaysia', exact: true }).click();
    await expect(page).toHaveURL(/\/en\/corporate\/news\/malaysia-airports-delisted$/);
    const story = page.getByRole('main');
    await expect(story.getByRole('heading', { level: 1, name: 'Malaysia Airports leaves Bursa Malaysia' })).toBeVisible();
    await expect(story.getByRole('complementary', { name: 'Sources' }).getByRole('link', { name: /Delisting a watershed moment/ })).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('business says plainly where no channel is published', async ({ page }) => {
    await page.goto('/en/corporate/business');
    const main = page.getByRole('main');
    const procurement = main.getByRole('article', { name: 'Procurement and tenders' });
    await expect(procurement.getByText('Not published')).toBeVisible();
    await expect(main.getByRole('link', { name: /Scam alert on the corporate website/ })).toBeVisible();
  });

  test('works in Bahasa Malaysia', async ({ page }) => {
    await page.goto('/ms/corporate');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ms');
    await expect(page.getByRole('main').getByRole('heading', { level: 1, name: 'Syarikat yang mengendalikan lapangan terbang Malaysia' })).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('fits a 360 pixel screen without sideways scrolling', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 780 });
    for (const path of ['/en/corporate', '/en/corporate/about', '/en/corporate/news', '/en/privacy']) {
      await page.goto(path);
      await expect(page.getByRole('main').getByRole('heading', { level: 1 })).toBeVisible();
      await expectNoHorizontalOverflow(page);
    }
  });
});

test.describe('transparency pages', () => {
  test('about this prototype separates verified from demonstration data', async ({ page }) => {
    await page.goto('/en/about-this-prototype');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: 'About this prototype' })).toBeVisible();
    const table = main.getByRole('table', { name: 'What is verified and what is simulated' });
    await expect(table.getByRole('row', { name: /Flights, gates, times and statuses/ })).toContainText('Demonstration');
    await expect(main.getByRole('table', { name: 'Integrations needed for a production service' }).getByRole('rowheader', { name: 'Flight information' })).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('privacy lists what is stored and the clear button removes it', async ({ page, isMobile }) => {
    await page.goto('/en/privacy');
    await page.evaluate(() => {
      localStorage.setItem('ma:airport:v1', JSON.stringify({ airport: 'pen' }));
      localStorage.setItem('ma:recent-searches:v1', JSON.stringify(['prayer room']));
    });
    await page.reload();
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: 'Privacy' })).toBeVisible();
    const keysName = 'Data this site stores in your browser';
    const keys = isMobile ? main.getByRole('list', { name: keysName }) : main.getByRole('table', { name: keysName });
    await expect(keys).toContainText('ma:journey:v1');
    await expect(main.getByRole('list', { name: 'On this device now' }).getByRole('listitem').filter({ hasText: 'ma:recent-searches:v1' })).toBeVisible();
    await expectNoAxeViolations(page);

    await expect(async () => {
      await main.getByRole('button', { name: 'Clear all data on this device' }).click();
      await expect(page.getByRole('dialog', { name: 'Clear everything this site stored?' })).toBeVisible({ timeout: 2_000 });
    }).toPass();
    await page.getByRole('dialog').getByRole('button', { name: 'Clear all data' }).click();

    await expect(page.getByRole('main').getByRole('status').filter({ hasText: /Cleared \d+ items? from this device/ })).toBeVisible();
    const left = await page.evaluate(() => [localStorage.getItem('ma:airport:v1'), localStorage.getItem('ma:recent-searches:v1')]);
    expect(left).toEqual([null, null]);
    await expect(page).not.toHaveURL(/cleared=/);
  });

  test('terms put official channels first and pass axe', async ({ page }) => {
    await page.goto('/en/terms');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: 'Terms of use' })).toBeVisible();
    await expect(main.getByRole('heading', { name: 'Official channels prevail' })).toBeVisible();
    await expectNoAxeViolations(page);
  });
});
