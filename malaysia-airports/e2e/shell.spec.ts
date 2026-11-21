import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { AXE_TAGS as SHARED_AXE_TAGS } from './support/axe';

/**
 * Shell, home and search checks from the fix round (package A, docs/qa/fixes/A.md). Each block
 * names the backlog item it guards. Strings are the English and Malay dictionary values.
 */

/**
 * The shared WCAG tag list from `e2e/support/axe.ts` (E-06). It includes wcag21a, so
 * label-content-name-mismatch (A-02) runs with the rest. Verification round: `withRules()` after
 * `withTags()` replaced the tag set, so this scan used to run that one rule only.
 */
const AXE_TAGS = [...SHARED_AXE_TAGS];
type AxePage = ConstructorParameters<typeof AxeBuilder>[0]['page'];

async function axeViolations(page: Page): Promise<string[]> {
  const results = await new AxeBuilder({ page: page as unknown as AxePage }).withTags(AXE_TAGS).analyze();
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
/** Tests that need rows on the full board fix the browser clock here; the feed answers for that instant. */
const BUSY_MORNING = new Date('2026-11-18T09:40:00+08:00');

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

  // Verification round two: A-01 names the flight page too. Round 2's outlet back link (globals.css)
  // also showed "< Flights" above this h1 on phones (244 px), which the section loop above missed.
  test('a flight page starts with its own heading on a phone', async ({ page, request }) => {
    const board = await request.get('/api/flights?airport=kul&dir=d&limit=1');
    const { flights } = (await board.json()) as { flights: { id: string }[] };
    for (const [width, height] of [
      [360, 800],
      [390, 664],
      [390, 844],
    ] as const) {
      await page.setViewportSize({ width, height });
      for (const lang of ['en', 'ms']) {
        await page.goto(`/${lang}/kul/flights/${flights[0].id}`);
        const h1 = page.locator('main h1').first();
        await expect(h1).toBeVisible();
        const top = await h1.evaluate((element) => element.getBoundingClientRect().top + window.scrollY);
        expect(top, `${lang} flight page h1 at ${width}x${height}`).toBeLessThanOrEqual(200);
      }
    }
  });

  test('the full airport banner stays on the overview only', async ({ page }) => {
    await page.goto('/en/kul');
    await expect(page.locator('[data-airport-chrome="full"]')).toBeVisible();
    await page.goto('/en/kul/parking');
    await expect(page.locator('[data-airport-chrome="full"]')).toHaveCount(0);
    // `:visible`: while a page streams in development, React keeps a hidden copy until the swap.
    await expect(page.locator('[data-airport-chrome="compact"]:visible')).toBeVisible();
  });

  // The first board row also depends on the board's own toolbar and banner (package B, B-03 and
  // B-16). It was `fixme` after the verification round (first row at 864 px on the phone project,
  // 893 px on the desktop project). Round 2 (docs/qa/fixes/round2-performance.md): on phones the
  // lead and the "N flights have already left" note are left to screen readers, the board header
  // is one row of window and Pause plus one row of freshness, and the gaps are tighter: first row
  // at 614 px in English and Malay at 390x664 (643 and 664 before the note moved).
  test('the first board row is inside the first 664 px', async ({ page }) => {
    // A busy morning (as in flights.spec.ts): with the real clock this failed from about 22:55 to
    // 05:05 Kuala Lumpur time, when the board's window holds no demonstration departures
    // (verification round four, CI run at 23:05).
    await page.clock.setFixedTime(BUSY_MORNING);
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
      ['ms', 'arrival card', 'Lihat semua hasil untuk "arrival card"'],
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

  for (const [lang, kindLabel, oneFound] of [
    ['en', /Flight number/, /1 flight/],
    ['ms', /Nombor penerbangan/, /1 penerbangan/],
  ] as const) {
    test(`a route opens the site search; one exact flight number opens that flight (${lang})`, async ({ page }) => {
      await page.goto(`/${lang}`);
      await page.waitForLoadState('networkidle');
      const box = page.getByRole('search').first().getByRole('searchbox');
      await box.fill('KUL-PEN');
      await box.press('Enter');
      await expect(page).toHaveURL(new RegExp(`/${lang}/search\\?q=KUL-PEN`));

      // A flight number from the KLIA board's own examples (the demo board changes every day, so
      // a fixed number such as MH2072 is not always on it).
      await page.goto(`/${lang}/kul`);
      // As above: this checks search routing, so wait until the page is live. Focus or text given
      // to the overview's search before hydration is still lost, because its Suspense fallback is
      // replaced rather than hydrated (open issue in docs/qa/verification.md, verification round).
      await page.waitForLoadState('networkidle');
      const kulBox = page.locator('#flight-search').getByRole('searchbox');
      await kulBox.focus();
      const example = page.locator('#flight-search').getByRole('button', { name: kindLabel }).first();
      await expect(example).toBeVisible();
      // The generic example ("MH 2") is replaced by one from KLIA's own board once the browser is idle.
      await expect(example).not.toHaveText(/MH 2$/);
      const number = (await example.locator('span').last().textContent())?.trim() ?? '';
      await kulBox.fill(number);
      await expect(page.locator('#flight-search').getByRole('status')).toContainText(oneFound);
      await kulBox.press('Enter');
      await expect(page).toHaveURL(new RegExp(`/${lang}/kul/flights/[a-z0-9]+-\\d{8}-d$`));
    });
  }
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
    // A busy morning, for the same reason as the A-01 board test above.
    await page.clock.setFixedTime(BUSY_MORNING);
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
      // The Menu button needs the page hydrated; a click before the JavaScript runs does nothing.
      await page.waitForLoadState('networkidle');
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
    for (const path of [
      '/en',
      '/ms',
      '/en/kul',
      '/en/kul/flights',
      '/en/kul/transport',
      '/en/kul/parking',
      '/en/kul/facilities',
      '/en/kul/map',
      '/en/kul/shop-dine',
      '/en/kul/lounges',
      '/en/help',
      '/en/journey',
      '/en/guides',
      '/en/search?q=parking',
      '/en/airports',
    ]) {
      await page.goto(path);
      const [scrollWidth, clientWidth] = await page.evaluate(() => [document.documentElement.scrollWidth, document.documentElement.clientWidth]);
      expect(scrollWidth, path).toBeLessThanOrEqual(clientWidth);
    }
  });
});

test.describe('A-01 airport chrome at 125% text', () => {
  test('the section heading is never under the fixed bottom bar', async ({ page }) => {
    await seed(page, { textSize: 125 });
    for (const [width, height] of [
      [360, 800],
      [390, 664],
    ] as const) {
      await page.setViewportSize({ width, height });
      for (const path of ['/en/kul/flights', '/ms/kul/transport', '/en/kul/parking']) {
        await page.goto(path);
        const h1 = page.locator('main h1').first();
        await expect(h1).toBeVisible();
        const heading = await h1.evaluate((element) => element.getBoundingClientRect());
        const bar = await page.locator('[data-mobile-bar]').evaluate((element) => element.getBoundingClientRect().top);
        expect(heading.bottom, `${path} at ${width}x${height}`).toBeLessThanOrEqual(bar);
      }
    }
  });
});

test.describe('A-24 English citations on Malay pages', () => {
  test('every source title and publisher on /ms/kul/parking is marked lang="en"', async ({ page }) => {
    await page.goto('/ms/kul/parking');
    const notes = page.locator('main details:has([data-source-marker])');
    // `count()` does not wait; under parallel load it once read 0 (verification round).
    await expect(notes.first()).toBeAttached();
    expect(await notes.count()).toBeGreaterThan(0);
    const unmarked = await notes.evaluateAll((elements) =>
      elements.flatMap((details) =>
        [...details.querySelectorAll('li')].flatMap((item) => {
          const title = item.querySelector('a');
          return title && !title.closest('[lang="en"]') && !title.querySelector('[lang="en"]')
            ? [{ href: (title.getAttribute('href') ?? '').replace(/^\/ms(?=\/|$)/, '/en'), text: title.querySelector('span')?.textContent?.trim() ?? '' }]
            : [];
        }),
      ),
    );
    // D-03 translated this prototype's own source titles into Malay, and those need no lang="en".
    // A title that reads the same as on the English page is English, so it must be marked.
    await page.goto('/en/kul/parking');
    const englishTitles = new Map(
      await page.locator('main details:has([data-source-marker]) li a').evaluateAll((links) =>
        links.map((link) => [link.getAttribute('href') ?? '', link.querySelector('span')?.textContent?.trim() ?? ''] as [string, string]),
      ),
    );
    expect(unmarked.filter((item) => englishTitles.get(item.href) === item.text).map((item) => item.text)).toEqual([]);
  });
});

test.describe('A-27 home preview targets', () => {
  test('each preview row is one link with a hit area of at least 44 px at 360 px and 125% text', async ({ page }) => {
    await seed(page, { textSize: 125 });
    await page.setViewportSize({ width: 360, height: 800 });
    await page.goto('/en');
    const rows = page.locator('main a[href*="/flights/"][href*="-20"]');
    await expect(rows.first()).toBeVisible();
    const heights = await rows.evaluateAll((links) =>
      links
        .filter((link) => link.getBoundingClientRect().height > 0)
        .map((link) => {
          // A stretched link (::after over its row) is the whole row for a tap.
          if (getComputedStyle(link, '::after').position !== 'absolute') return link.getBoundingClientRect().height;
          let row = link.parentElement;
          while (row && getComputedStyle(row).position === 'static') row = row.parentElement;
          return row ? row.getBoundingClientRect().height : 0;
        }),
    );
    expect(heights.length).toBeGreaterThan(0);
    for (const height of heights) expect(height).toBeGreaterThanOrEqual(44);
  });
});

test.describe('A-30 breadcrumb structured data', () => {
  test('/en/kul/parking emits a BreadcrumbList matching the visible trail', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    await page.goto('/en/kul/parking');
    const lists = await page.locator('script[type="application/ld+json"]').evaluateAll((scripts) =>
      scripts.flatMap((script) => {
        const data = JSON.parse(script.textContent ?? 'null');
        return (Array.isArray(data) ? data : [data]).filter((item) => item && item['@type'] === 'BreadcrumbList');
      }),
    );
    expect(lists).toHaveLength(1);
    const items = lists[0].itemListElement as { position: number; name: string; item?: string }[];
    // `allTextContents()` does not wait: the prerendered page body is revealed from React's hidden
    // segment shortly after `load`, so wait for the trail first (verification round: 4 of 8 phone runs read []).
    await expect(page.getByRole('navigation', { name: 'Breadcrumb' }).locator('li').last()).toBeVisible();
    const visible = (await page.getByRole('navigation', { name: 'Breadcrumb' }).locator('li').allTextContents()).map((text) => text.trim());
    expect(items.map((item) => item.name)).toEqual(visible);
    expect(items.map((item) => item.position)).toEqual(visible.map((_, index) => index + 1));
    expect(items[0].item).toMatch(/\/en$/);
    expect(items[1].item).toMatch(/\/en\/kul$/);
    expect(items.at(-1)?.item).toBeUndefined();
  });
});

test.describe('A-09 early taps', () => {
  test('a journey mode tapped before hydration is kept', async ({ page }) => {
    // Hold the JavaScript back so the tap lands on the server HTML, before React hydrates.
    await page.route(/\/_next\/static\/chunks\/.*\.js/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });
    await page.goto('/en', { waitUntil: 'domcontentloaded' });
    await page.getByRole('main').getByRole('radio', { name: /^Arriving/ }).check({ force: true });
    await page.waitForLoadState('networkidle');
    await expect(page.getByRole('main').getByRole('radio', { name: /^Arriving/ })).toBeChecked();
    await expect(page.getByRole('main').locator('[data-flight-scope]')).toContainText(/arrivals/);
  });

  test('the header airport switcher tapped before hydration opens once the page is ready', async ({ page }) => {
    await page.route(/\/_next\/static\/chunks\/.*\.js/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });
    await page.goto('/en', { waitUntil: 'domcontentloaded' });
    await page.getByRole('banner').getByRole('button', { name: /Choose airport/ }).click();
    await expect(page.getByRole('dialog', { name: 'Choose an airport' })).toBeVisible({ timeout: 30_000 });
  });

  test('a flight query typed before hydration still gets its results', async ({ page }) => {
    await page.route(/\/_next\/static\/chunks\/.*\.js/, async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 1500));
      await route.continue();
    });
    await page.goto('/en', { waitUntil: 'domcontentloaded' });
    const desk = page.getByRole('main').getByRole('region', { name: 'Flight search' });
    await desk.getByRole('searchbox').fill('MH');
    await expect(desk.getByRole('status').first()).toContainText(/flights? found/, { timeout: 30_000 });
  });
});
