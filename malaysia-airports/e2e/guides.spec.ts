import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Journeys for the guides feature: Plan your journey guides, the transit planner, the help
 * centre and the accessibility hub. Conventions follow e2e/smoke.spec.ts: role locators, a fresh
 * context per test, English dictionary strings from src/lib/i18n/features/guides.ts.
 * The dev server compiles pages on first visit, so the first navigation can be slow.
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

test.describe.configure({ timeout: 120_000 });

test.describe('guides', () => {
  test('hub lists guides and filters by who they apply to', async ({ page }) => {
    await page.goto('/en/guides');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: 'Plan your journey' })).toBeVisible();
    await expect(main.getByRole('link', { name: 'Flying internationally for the first time' })).toBeVisible();
    await expect(main.getByRole('status')).toHaveText('11 guides');

    const filters = main.getByRole('group', { name: 'Show guides that cover' });
    await expect(async () => {
      await filters.getByRole('button', { name: 'Sabah and Sarawak rules' }).click();
      await expect(main.getByRole('status')).toHaveText('2 guides');
    }).toPass();
    await expect(main.getByRole('link', { name: 'Immigration and customs' })).toBeVisible();
    await expect(main.getByRole('link', { name: 'Baggage' })).toHaveCount(0);
    await expectNoAxeViolations(page);
    await expectNoHorizontalOverflow(page);
  });

  test('a guide shows ordered steps with provenance, sources and scope chips', async ({ page }) => {
    await page.goto('/en/guides/immigration-customs');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: 'Immigration and customs' })).toBeVisible();
    const borneo = main.getByRole('list', { name: 'Steps: Flying between Peninsular Malaysia, Sabah and Sarawak' });
    await expect(borneo.getByRole('heading', { name: 'Arriving in Sabah: immigration applies' })).toBeVisible();
    await expect(borneo.getByText('Sabah and Sarawak rules').first()).toBeVisible();
    await expect(main.getByText('Official').first()).toBeVisible();
    await expect(main.getByText('Estimated').first()).toBeVisible();
    await expect(main.getByRole('heading', { name: 'At specific airports' })).toBeVisible();
    await expectNoAxeViolations(page);

    await page.goto('/ms/guides/immigration-customs');
    await expect(page.getByRole('heading', { level: 1, name: 'Imigresen dan kastam' })).toBeVisible();
  });

  test('an unknown guide is not found', async ({ page }) => {
    await page.goto('/en/guides/no-such-guide');
    await expect(page).toHaveTitle(/not found/i);
  });
});

test.describe('transit planner', () => {
  test('changing terminals switches to the landside steps and grades the time', async ({ page }) => {
    await page.goto('/en/kul/transit');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: 'Connecting at KLIA' })).toBeVisible();
    await expect(main.getByRole('heading', { name: 'You stay in the secure area' })).toBeVisible();

    await expect(async () => {
      await main.getByRole('group', { name: 'Your next flight leaves from' }).getByRole('radio', { name: 'Terminal 2' }).check({ force: true });
      await expect(main.getByRole('heading', { name: 'You change terminals: leave, travel and check in again' })).toBeVisible();
    }).toPass();
    const steps = main.getByRole('list', { name: 'Steps for your connection' });
    await expect(steps.getByRole('heading', { name: 'Travel to Terminal 2' })).toBeVisible();
    await expect(steps.getByRole('heading', { name: 'Check in again and drop your bags' })).toBeVisible();
    await expect(page).toHaveURL(/to=T2/);

    await main.getByRole('combobox', { name: /Time between flights/ }).selectOption('45');
    await expect(main.getByText('Very tight')).toBeVisible();
    await expect(main.getByText(/Confirm the minimum connection time with your airline/)).toBeVisible();
    await expect(main.getByRole('heading', { name: 'Changing terminals at KLIA' })).toBeVisible();
    await expectNoAxeViolations(page);
    await expectNoHorizontalOverflow(page);
  });

  test('a shared plan opens from the URL', async ({ page }) => {
    await page.goto('/en/kul/transit?from=T1&to=T1&ticket=self&arr=intl&dep=dom&layover=360');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { name: 'You leave the secure area and check in again' })).toBeVisible();
    await expect(main.getByRole('heading', { name: 'With a long layover' })).toBeVisible();
  });

  test('another airport gets an honest page', async ({ page }) => {
    await page.goto('/en/pen/transit');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: 'Connecting at Penang' })).toBeVisible();
    await expect(main.getByRole('heading', { name: 'No verified transfer information for Penang yet' })).toBeVisible();
    await expect(main.getByRole('link', { name: 'Open the KLIA transit planner' })).toBeVisible();
    await expectNoAxeViolations(page);
  });
});

test.describe('help centre', () => {
  test('search finds an answer and topics link through', async ({ page }) => {
    await page.goto('/en/help');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: 'Help centre' })).toBeVisible();
    await expect(async () => {
      await main.getByRole('searchbox', { name: 'Search help' }).fill('wheelchair');
      await expect(main.getByRole('link', { name: 'How do I ask for a wheelchair? Assistance and accessibility' })).toBeVisible();
    }).toPass();
    await expect(main.getByRole('table', { name: 'Who to contact for common problems' })).toBeVisible();
    await expect(main.getByRole('link', { name: /Scam alerts/ })).toBeVisible();
    await expectNoAxeViolations(page);
    await expectNoHorizontalOverflow(page);
  });

  test('a deep link opens its answer', async ({ page }) => {
    await page.goto('/en/help/flights#flight-delay-refund');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: 'Flights and disruption' })).toBeVisible();
    const trigger = main.getByRole('button', { name: 'Can I get a refund if my flight is delayed by five hours or more?' });
    await expect(trigger).toHaveAttribute('aria-expanded', 'true');
    await expect(main.getByText(/Malaysian Aviation Commission \(Mavcom\) says airlines must offer/)).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('feedback topic shows the escalation steps', async ({ page }) => {
    await page.goto('/en/help/feedback');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { name: 'If it is not resolved' })).toBeVisible();
    await expect(main.getByRole('link', { name: /Malaysia Airports feedback site/ })).toBeVisible();
  });
});

test.describe('accessibility hub', () => {
  test('assistance, Butterfly Effect, settings and statement', async ({ page }) => {
    await page.goto('/en/accessibility');
    const main = page.getByRole('main');
    await expect(main.getByRole('heading', { level: 1, name: 'Assistance and accessibility' })).toBeVisible();
    await expect(main.getByRole('heading', { name: 'Hidden disabilities: the Butterfly Effect' })).toBeVisible();
    await expect(main.getByRole('heading', { name: 'Accessibility statement' })).toBeVisible();
    await expectNoAxeViolations(page);

    await expect(async () => {
      await main.getByRole('group', { name: 'Text size' }).getByRole('radio', { name: 'Largest' }).check({ force: true });
      await expect(page.locator('html')).toHaveAttribute('data-text-size', '125');
    }).toPass();
    await expectNoHorizontalOverflow(page);
  });
});
