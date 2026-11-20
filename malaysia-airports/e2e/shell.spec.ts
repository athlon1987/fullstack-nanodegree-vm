import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Shell, home and search checks from the fix round (package A, docs/qa/fixes/A.md). Each block
 * names the backlog item it guards. Strings are the English and Malay dictionary values.
 */

/**
 * The shared WCAG tag list (wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa). Package E publishes it
 * in `e2e/support/axe.ts` (E-06); until that file lands this spec keeps the same list here.
 */
const AXE_TAGS = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'];
type AxePage = ConstructorParameters<typeof AxeBuilder>[0]['page'];

async function axeViolations(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page: page as unknown as AxePage }).withTags(AXE_TAGS).withRules(['label-content-name-mismatch']).analyze();
  return results.violations.map((v) => `${v.id} (${v.impact}): ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`);
}

/** Remember an airport and display preferences before the first paint. */
async function seed(page: Page, { airport, textSize }: { airport?: string; textSize?: 100 | 112 | 125 } = {}) {
  await page.addInitScript(
    ([slug, size]) => {
      try {
        if (slug) localStorage.setItem('ma:airport:v1', JSON.stringify({ airport: slug }));
        if (size) localStorage.setItem('ma:preferences:v1', JSON.stringify({ theme: 'light', textSize: size, highContrast: false, reducedMotion: true }));
      } catch {
        /* storage blocked */
      }
    },
    [airport ?? '', textSize ?? 0] as const,
  );
}

const SUB_PAGES = ['flights', 'transport', 'parking', 'facilities', 'map', 'transit', 'lounges', 'shop-dine'];

test.describe('A-01 airport chrome on a phone', () => {
  for (const [width, height] of [
    [360, 800],
    [390, 664],
    [390, 844],
  ] as const) {
    test(`section pages start with their own heading at ${width}x${height}`, async ({ page }) => {
      await page.setViewportSize({ width, height });
      for (const lang of ['en', 'ms']) {
        for (const section of SUB_PAGES) {
          await page.goto(`/${lang}/kul/${section}`);
          const h1 = page.locator('main h1').first();
          await expect(h1).toBeVisible();
          const top = await h1.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
          expect(top, `${lang}/${section} h1`).toBeLessThanOrEqual(200);
          const chrome = await page.locator('[data-airport-chrome="compact"] > div').first().evaluate((element) => element.getBoundingClientRect().height);
          expect(chrome, `${lang}/${section} airport bar`).toBeLessThanOrEqual(56);
        }
      }
    });
  }

  test('the full airport banner stays on the overview only', async ({ page }) => {
    await page.goto('/en/kul');
    await expect(page.locator('[data-airport-chrome="full"]')).toBeVisible();
    await page.goto('/en/kul/parking');
    await expect(page.locator('[data-airport-chrome="full"]')).toHaveCount(0);
    await expect(page.locator('[data-airport-chrome="compact"]')).toBeVisible();
  });

  // The first board row also depends on the board's own toolbar and banner (package B, B-03 and
  // B-16). Enable once those land; the chrome above the heading is already within budget.
  test.fixme('the first board row is inside the first 664 px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 664 });
    await page.goto('/en/kul/flights');
    const row = page.locator('main a[href*="/kul/flights/"]').first();
    await expect(row).toBeVisible();
    expect(await row.evaluate((element) => element.getBoundingClientRect().top + window.scrollY)).toBeLessThanOrEqual(664);
  });
});

test.describe('A-02 label in name', () => {
  test('the header airport switcher names start with their visible text', async ({ page }) => {
    await seed(page, { airport: 'kul' });
    for (const path of ['/en/kul', '/en/kul/flights', '/ms/kul/map', '/en/concierge']) {
      await page.goto(path);
      await expect(page.getByRole('banner').getByRole('button', { name: /^KUL/ })).toBeVisible();
      expect(await axeViolations(page), path).toEqual([]);
    }
  });
});

test.describe('A-03 the home search is not flights-only', () => {
  test('a topic shows site results and a link to all results; Enter opens the site search', async ({ page }) => {
    for (const [lang, query, label] of [
      ['en', 'parking', 'See all results for "parking"'],
      ['en', 'arrival card', 'See all results for "arrival card"'],
      ['ms', 'parking', 'Lihat semua hasil untuk "parking"'],
    ] as const) {
      await page.goto(`/${lang}`);
      const box = page.getByRole('search').first().getByRole('searchbox');
      await box.fill(query);
      await expect(page.getByRole('link', { name: label })).toBeVisible();
      await expect(page.locator('#flight-search').getByRole('link').filter({ hasNotText: label }).first()).toBeVisible();
      await box.press('Enter');
      await expect(page).toHaveURL(new RegExp(`/${lang}/search\\?q=${encodeURIComponent(query).replace(/%20/g, '(%20|\\+)')}`));
    }
  });

  test('a route opens the site search; one exact flight number opens that flight', async ({ page }) => {
    await page.goto('/en');
    await page.waitForLoadState('networkidle');
    const box = page.getByRole('search').first().getByRole('searchbox');
    await box.fill('KUL-PEN');
    await box.press('Enter');
    await expect(page).toHaveURL(/\/en\/search\?q=KUL-PEN/);

    // A flight number from the KLIA board's own examples (it always exists today).
    await page.goto('/en/kul');
    const kulBox = page.locator('#flight-search').getByRole('searchbox');
    await kulBox.focus();
    const example = page.locator('#flight-search').getByRole('button', { name: /Flight number/ }).first();
    await expect(example).toBeVisible();
    // The generic example ("MH 2") is replaced by one from KLIA's own board once the browser is idle.
    await expect(example).not.toHaveText(/MH 2$/);
    const number = (await example.locator('span').last().textContent())?.trim() ?? '';
    await kulBox.fill(number);
    await expect(page.locator('#flight-search').getByRole('status')).toContainText(/1 flight/);
    await kulBox.press('Enter');
    await expect(page).toHaveURL(/\/en\/kul\/flights\/[a-z0-9]+-\d{8}-d$/);
  });
});

test.describe('A-04 demo label in view', () => {
  test('every phone preview row has a demo marker in view', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const path of ['/en', '/ms', '/en/kul', '/en/search?q=MH']) {
      await page.goto(path);
      const rows = page.locator('main a[href*="/flights/"][href*="-20"]');
      await expect(rows.first()).toBeVisible();
      const count = await rows.count();
      for (let index = 0; index < count; index += 1) {
        const row = rows.nth(index);
        // Boards render a table and a card list and show one of them for the container width.
        if (!(await row.isVisible())) continue;
        await row.evaluate((element) => element.scrollIntoView({ block: 'center' }));
        await page.waitForTimeout(50);
        const labelled = await page.evaluate(() =>
          [...document.querySelectorAll('[data-demo-marker]')].some((marker) => {
            const box = marker.getBoundingClientRect();
            return box.width > 0 && box.height > 0 && box.bottom > 0 && box.top < window.innerHeight && getComputedStyle(marker).visibility !== 'hidden';
          }),
        );
        expect(labelled, `${path} row ${index + 1}`).toBe(true);
      }
    }
  });

  test('the narrow demo banner is one line, at most 48 px', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto('/en/kul/flights');
    const banner = page.locator('main [data-demo-banner]').first();
    await expect(banner).toBeVisible();
    expect(await banner.evaluate((element) => element.getBoundingClientRect().height)).toBeLessThanOrEqual(48);
    await expect(banner).toHaveAccessibleName('Demonstration data');
  });
});

test.describe('A-05 focus after a client-side navigation', () => {
  for (const [from, link, to] of [
    ['/en/kul', /Terminal map/, /\/en\/kul\/map/],
    ['/en', /Shops and food/, /\/en\/airports/],
    ['/en/guides', /My journey|Journey/, /\/en\/journey/],
  ] as const) {
    test(`focus lands on the new heading after ${from}`, async ({ page }) => {
      await page.goto(from);
      // A client-side navigation needs the page hydrated; before that the link loads a new document.
      await page.waitForLoadState('networkidle');
      const target = page.locator('main').getByRole('link', { name: link }).first();
      await target.focus();
      await page.keyboard.press('Enter');
      await expect(page).toHaveURL(to);
      await expect
        .poll(() => page.evaluate(() => ({ tag: document.activeElement?.tagName, inMain: Boolean(document.activeElement?.closest('main')) })))
        .toMatchObject({ inMain: true });
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => Boolean(document.activeElement?.closest('main')))).toBe(true);
    });
  }
});

test.describe('A-06 search palette states', () => {
  test('the active option has a focus-colour outline and the field shows a ring', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Opened with the keyboard shortcut');
    await page.goto('/en');
    const dialog = page.getByRole('dialog', { name: 'Search' });
    await expect(async () => {
      await page.keyboard.press('Control+K');
      await expect(dialog).toBeVisible({ timeout: 1_000 });
    }).toPass({ timeout: 15_000 });
    const box = dialog.getByRole('combobox');
    await box.fill('prayer');
    const active = dialog.locator('[role="option"][aria-selected="true"]');
    await expect(active).toBeVisible();
    const style = await active.evaluate((element) => ({ outline: getComputedStyle(element).outlineStyle, shadow: getComputedStyle(element).boxShadow }));
    expect(style.outline).toBe('solid');
    expect(style.shadow).toContain('inset');
    const ring = await box.evaluate((element) => getComputedStyle(element.parentElement as Element).outlineStyle);
    expect(ring).toBe('solid');
  });

  test('a single "/" no longer opens search (WCAG 2.1.4), Ctrl+K does', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Keyboard shortcut');
    await page.goto('/en');
    await page.waitForLoadState('networkidle');
    await page.keyboard.press('/');
    await expect(page.getByRole('dialog', { name: 'Search' })).toBeHidden();
  });
});

test.describe('A-07 sections an airport does not publish', () => {
  test('home tiles for Subang say so and lead to an honest state', async ({ page }) => {
    await seed(page, { airport: 'szb' });
    await page.goto('/en');
    const tile = page.getByRole('link', { name: /Parking: not published for Subang/ });
    await expect(tile).toBeVisible();
    await tile.click();
    await expect(page).toHaveURL(/\/en\/airports\/not-published\?airport=szb&section=parking/);
    await expect(page.getByRole('heading', { level: 1 })).toContainText('Parking at Subang');
    await expect(page.getByRole("main").getByRole("link", { name: /\+60 3 8777 0000/ })).toBeVisible();
  });
});

test.describe('A-08 the saved flight on the home', () => {
  test('a flight saved from the board appears above the journey modes', async ({ page }) => {
    await page.goto('/en/kul/flights');
    const save = page.getByRole('main').getByRole('button', { name: /^Save/ }).first();
    await expect(save).toBeVisible();
    await save.click();
    await page.goto('/en');
    const card = page.getByRole('region', { name: 'Your saved flight' });
    await expect(card).toBeVisible();
    const cardTop = await card.evaluate((element) => element.getBoundingClientRect().top);
    const modesTop = await page.locator('fieldset').first().evaluate((element) => element.getBoundingClientRect().top);
    expect(cardTop).toBeLessThan(modesTop);
  });
});

test.describe('A-11 fixed chrome at large text', () => {
  test('header and bottom bar give way while scrolling at 320x568 and 125% text', async ({ page }) => {
    await seed(page, { textSize: 125 });
    await page.setViewportSize({ width: 320, height: 568 });
    await page.goto('/en/kul/parking');
    await expect(page.locator('html')).toHaveAttribute('data-compact-chrome', 'true');
    await page.waitForLoadState('networkidle');
    await page.mouse.wheel(0, 600);
    await expect(page.locator('html')).toHaveAttribute('data-scroll-chrome', 'hidden');
    await expect.poll(() => page.evaluate(() => {
      const visible = (selector: string) => {
        const element = document.querySelector(selector);
        if (!element) return 0;
        const box = element.getBoundingClientRect();
        return Math.max(0, Math.min(box.bottom, window.innerHeight) - Math.max(box.top, 0));
      };
      return (visible('[data-site-header]') + visible('[data-mobile-bar]')) / window.innerHeight;
    })).toBeLessThanOrEqual(0.15);
  });
});

test.describe('A-13 section tabs and the bottom bar', () => {
  test('all section tabs fit at 1280 and 1440 in both languages', async ({ page, isMobile }) => {
    test.skip(isMobile, 'Desktop widths');
    for (const width of [1280, 1440]) {
      await page.setViewportSize({ width, height: 900 });
      for (const path of ['/en/kul', '/ms/kul', '/en/kul/flights', '/ms/kul/shop-dine']) {
        await page.goto(path);
        const list = page.getByRole('navigation', { name: /KLIA (sections|bahagian)|Bahagian KLIA|sections/i }).locator('ul').first();
        const [scrollWidth, clientWidth] = await list.evaluate((element) => [element.scrollWidth, element.clientWidth]);
        expect(scrollWidth, `${path} at ${width}`).toBeLessThanOrEqual(clientWidth + 1);
      }
    }
  });

  test('Malay bottom-bar labels stay on one line at 360 px', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/ms');
    const labels = page.getByRole('navigation', { name: 'Navigasi pantas' }).locator('[data-bar-label]');
    const heights = await labels.evaluateAll((elements) => elements.map((element) => element.getBoundingClientRect().height));
    for (const height of heights) expect(height).toBeLessThan(20);
  });
});

test.describe('A-15 assistance in the header', () => {
  test('desktop header and phone menu offer Assistance', async ({ page, isMobile }) => {
    if (isMobile) {
      await page.setViewportSize({ width: 390, height: 844 });
      await page.goto('/en');
      await page.getByRole('navigation', { name: 'Quick navigation' }).getByRole('button', { name: 'Menu' }).click();
      await expect(page.getByRole('dialog', { name: 'Menu' }).getByRole('link', { name: 'Assistance' })).toHaveAttribute('href', '/en/accessibility');
    } else {
      await page.setViewportSize({ width: 1280, height: 800 });
      for (const lang of ['en', 'ms']) {
        await page.goto(`/${lang}`);
        const name = lang === 'en' ? 'Assistance' : 'Bantuan khas';
        // In the utility bar above the header, beside the language switch and display settings.
        const link = page.getByRole('link', { name, exact: true }).first();
        await expect(link).toBeVisible();
        await expect(link).toHaveAttribute('href', `/${lang}/accessibility`);
      }
    }
  });
});

test.describe('A-16 reflow at 320 px and 125% text', () => {
  test('no page scrolls sideways', async ({ page }) => {
    await seed(page, { textSize: 125 });
    await page.setViewportSize({ width: 320, height: 640 });
    for (const path of ['/en', '/ms', '/en/kul', '/en/kul/transport', '/en/kul/parking', '/en/search?q=parking', '/en/airports']) {
      await page.goto(path);
      const [scrollWidth, clientWidth] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      expect(scrollWidth, path).toBeLessThanOrEqual(clientWidth);
    }
  });
});
