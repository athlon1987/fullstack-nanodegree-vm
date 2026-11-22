import { expect, test, type Page, type TestInfo } from '@playwright/test';

/**
 * Verification round 6 (docs/qa/verification.md, "Round six", H3): regression tests for the four
 * defects found while testing the accessibility statement (pilot condition P10) on the production
 * build. Every test sends its own client address (as A-03).
 */

const SAVED = { id: 'mh2626-20261118-d', airport: 'kul', number: 'MH2626', direction: 'd', date: '2026-11-18', route: 'Kuala Lumpur to Singapore', savedAt: '2026-11-18T01:00:00.000Z' };
const MORNING = new Date('2026-11-18T09:40:00+08:00');

async function ownClientAddress(page: Page, testInfo: TestInfo) {
  const key = `${testInfo.project.name}|${testInfo.titlePath.join('|')}|${testInfo.repeatEachIndex}|${testInfo.retry}`;
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  await page.setExtraHTTPHeaders({ 'x-e2e-client-ip': `10.216.${(hash >>> 8) % 250}.${(hash % 250) + 1}` });
}

async function textSize125(page: Page, journey = false) {
  await page.addInitScript(
    ([saved, withJourney]) => {
      localStorage.setItem('ma:airport:v1', JSON.stringify({ airport: 'kul' }));
      localStorage.setItem('ma:preferences:v1', JSON.stringify({ theme: 'light', textSize: 125, highContrast: false, reducedMotion: true }));
      if (withJourney) localStorage.setItem('ma:journey:v1', JSON.stringify({ flights: [saved], places: [], parkedCar: null }));
    },
    [SAVED, journey] as const,
  );
}

test.beforeEach(async ({ page }, testInfo) => {
  await ownClientAddress(page, testInfo);
});

test.describe('320 px at 125% text (WCAG 1.4.10)', () => {
  test.use({ viewport: { width: 320, height: 640 } });

  for (const lang of ['en', 'ms'] as const) {
    test(`the concierge with a saved flight does not scroll sideways (${lang})`, async ({ page }) => {
      await page.clock.setFixedTime(MORNING);
      await textSize125(page, true);
      await page.goto(`/${lang}/concierge`);
      // The saved-flight chip ("Sertakan penerbangan simpanan saya MH2626") wraps instead of
      // widening the page (129 px of sideways scroll in Malay before).
      await expect(page.getByRole('button', { name: /MH2626/ })).toBeVisible();
      expect(await page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth)).toBeLessThanOrEqual(0);
    });

    test(`the flight card's aircraft is not cut off (${lang})`, async ({ page }) => {
      await page.clock.setFixedTime(MORNING);
      await textSize125(page);
      await page.goto(`/${lang}/kul/flights/mh2626-20261118-d`);
      const card = page.locator('.surface-board').filter({ has: page.locator('dd') }).first();
      await expect(card).toBeVisible();
      const overflow = await card.evaluate((element) => {
        const box = element.getBoundingClientRect();
        return Math.max(0, ...[...element.querySelectorAll('dd, dd *')].map((child) => child.getBoundingClientRect().right - box.right));
      });
      expect(overflow).toBeLessThanOrEqual(0);
    });
  }
});

test.describe('focus stays reachable', () => {
  test('every facility filter is in the window when it has focus (1280 x 720)', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'the filters are a sticky column on a desktop');
    await page.setViewportSize({ width: 1280, height: 720 });
    await page.goto('/en/kul/facilities');
    const filters = page.locator('[aria-labelledby="facility-filters-title"]');
    await expect(filters.getByRole('button').first()).toBeVisible();
    // Tab from the heading through the filter column; once each focused control has been scrolled
    // into view, it must be inside the window (six were below a 720 px window before).
    await page.evaluate(() => {
      const heading = document.querySelector<HTMLElement>('main h1');
      heading?.setAttribute('tabindex', '-1');
      heading?.focus();
    });
    const outside: string[] = [];
    let visited = 0;
    for (let index = 0; index < 80; index++) {
      await page.keyboard.press('Tab');
      const read = () =>
        page.evaluate(() => {
          const active = document.activeElement as HTMLElement;
          const box = active.getBoundingClientRect();
          return { label: (active.innerText || active.getAttribute('aria-label') || '').trim(), inside: box.top >= -1 && box.bottom <= window.innerHeight + 1, inFilters: Boolean(active.closest('[aria-labelledby="facility-filters-title"]')) };
        });
      // Give the browser time to finish scrolling the control into view (smooth scrolling).
      let state = await read();
      for (let wait = 0; state.inFilters && !state.inside && wait < 10; wait++) {
        await page.waitForTimeout(200);
        state = await read();
      }
      if (!state.inFilters) {
        if (visited > 0) break;
        continue;
      }
      visited += 1;
      if (!state.inside) outside.push(state.label);
    }
    expect(visited).toBeGreaterThan(10);
    expect(outside).toEqual([]);
  });

  for (const lang of ['en', 'ms'] as const) {
    test(`the overview's link to its contacts moves focus there (${lang})`, async ({ page }) => {
      await page.goto(`/${lang}/kul`);
      const link = page.locator(`a[href="/${lang}/kul#airport-contacts"]`).first();
      await expect(link).toBeVisible();
      await link.focus();
      await page.keyboard.press('Enter');
      await expect.poll(() => page.evaluate(() => document.activeElement?.id)).toBe('airport-contacts');
      await expect(page.locator('#airport-contacts')).toBeInViewport();
    });
  }
});
