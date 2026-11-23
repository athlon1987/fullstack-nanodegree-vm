import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations } from './support/axe';

/**
 * Journeys for the guides feature: Plan your journey guides, the transit planner, the help
 * centre and the accessibility hub. Conventions follow e2e/smoke.spec.ts: role locators, a fresh
 * context per test, English dictionary strings from src/lib/i18n/features/guides.ts.
 * The dev server compiles pages on first visit, so the first navigation can be slow.
 */

// The shared WCAG 2.2 AA scan (e2e/support/axe.ts) replaces this spec's own tag list.

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
    await expect(main.getByRole('heading', { level: 1, name: 'Transit and connections at KLIA' })).toBeVisible();
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
    // The verdict heading; the planner's live status line repeats the words for screen readers.
    await expect(main.getByRole('heading', { name: 'Very tight' })).toBeVisible();
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
    await expect(main.getByRole('heading', { level: 1, name: 'Transit and connections at Penang' })).toBeVisible();
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

test.describe('fix round D', () => {
  test('Help puts a tappable Malaysia Airports number in the first phone screen (D-15)', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/en/help');
    const call = page.getByRole('main').getByRole('region', { name: 'Call Malaysia Airports' });
    const link = call.getByRole('link', { name: /\+60 3 8777 0000/ });
    await expect(link).toHaveAttribute('href', 'tel:+60387770000');
    const box = await link.boundingBox();
    expect(box && box.y + box.height, 'number is in the first screen').toBeLessThanOrEqual(844);
    expect(box && box.height, 'tap target').toBeGreaterThanOrEqual(44);
    await expectNoAxeViolations(page);
    await expectNoHorizontalOverflow(page);
  });

  test('accessibility hub: no map link while toilets are unpublished, and one list of what is missing (D-04, D-11)', async ({ page }) => {
    await page.goto('/en/accessibility');
    const main = page.getByRole('main');
    await expect(main.getByRole('link', { name: 'Show on the map' })).toHaveCount(0);
    await expect(main.getByRole('link', { name: /Official special assistance page/ })).toHaveAttribute('href', /special-assistance/);
    await expect(main.getByRole('heading', { level: 2, name: 'Not published yet' })).toBeVisible();
    await expect(main.getByText(/including AirAsia, AirAsia X and Batik Air/)).toBeVisible();
    await expect(main.getByText('CARE live chat hours: not published in our sources.')).toBeVisible();
    await expectNoAxeViolations(page);
  });

  test('departing guide shows the passport-control note for Malaysian citizens; Malay sources are in Malay (D-03, D-07)', async ({ page }) => {
    await page.goto('/en/guides/departing');
    await expect(page.getByRole('main').getByText('Leaving Malaysia: passport control for Malaysian citizens')).toBeVisible();
    await page.goto('/ms/guides/departing');
    const main = page.getByRole('main');
    await expect(main.getByText('Meninggalkan Malaysia: kawalan pasport bagi warganegara Malaysia')).toBeVisible();
    const html = await main.innerHTML();
    expect(html).not.toContain('(as summarised in search results)');
    expect(html).not.toContain('Source undated');
    expect(html).not.toContain('This prototype (not an official source)');
    expect(html).toContain('Prototaip ini (bukan sumber rasmi)');
  });

  test('About this prototype lists what is not verified, once per airport (D-05)', async ({ page }) => {
    await page.goto('/en/about-this-prototype#gaps-kul');
    const kul = page.locator('#gaps-kul');
    await expect(kul.getByRole('heading', { name: 'What this prototype has not verified at KLIA' })).toBeVisible();
    await expect(kul.getByText(/Checked against this site on 21 November 2026/)).toBeVisible();
    await expect(page.locator('#gaps-pen')).toBeAttached();
    await expectNoAxeViolations(page);
  });

  test('KLIA facilities list Fast Track with its booking link (D-02)', async ({ page }) => {
    await page.goto('/en/kul/facilities');
    const main = page.getByRole('main');
    // Intended change (redesign three, phone page length): below 768 px each group shows its first
    // card and keeps the rest behind "Show N more"; Fast Track is the second card of "Other".
    // The server HTML shows two cards per group; a phone moves the second into the disclosure once
    // loaded, so wait for that summary rather than sampling it once.
    if (page.viewportSize()!.width < 768) await main.locator('summary', { hasText: 'Show 2 more: Other' }).click();
    await expect(main.getByRole('heading', { name: 'Fast Track' }).first()).toBeVisible();
    await expect(main.getByText(/Not published in our sources: what it includes/).first()).toBeVisible();
  });
});
