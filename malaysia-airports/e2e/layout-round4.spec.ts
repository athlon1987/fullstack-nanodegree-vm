import { expect, test, type APIRequestContext, type Page } from '@playwright/test';
import { expectNoAxeViolations } from './support/axe';

/**
 * Round 4, layout package (docs/qa/fixes/round4-layout.md): answer-first placement (6.1.6),
 * density (6.1.7, A-14), measurement hand-offs (6.1.9, E-17), the accessibility statement
 * (6.1.10) and the 404s that logged React error #419 (gallery notes).
 */

const phone = { width: 390, height: 844 };

async function isDevServer(request: APIRequestContext): Promise<boolean> {
  const response = await request.get('/en/offline');
  return (response.headers()['content-security-policy'] ?? '').includes('unsafe-eval');
}

/** Set the site's text size before the page loads (the preferences store). */
async function textSize(page: Page, size: 100 | 112 | 125) {
  await page.addInitScript((value) => localStorage.setItem('ma:preferences:v1', JSON.stringify({ textSize: value })), size);
}

test.describe('answer first and placement (6.1.6)', () => {
  test('transport: the KLIA Ekspres fare is on the first phone screen, above the touting warning', async ({ page }) => {
    await page.setViewportSize(phone);
    for (const lang of ['en', 'ms']) {
      await page.goto(`/${lang}/kul/transport`);
      const glance = page.locator('[data-transport-glance]');
      await expect(glance).toContainText('KLIA Ekspres');
      const fare = glance.getByText('RM 55', { exact: true }).first();
      const warning = page.getByRole('main').getByRole('note').filter({ hasText: lang === 'en' ? 'Book taxis only at the coupon counters' : 'Tempah teksi hanya di kaunter kupon' }).first();
      await expect(fare).toBeVisible();
      await expect(warning).toBeVisible();
      // Measured after hydration (the fare row settles on today's fare once the clock is read).
      await expect.poll(async () => ((await fare.boundingBox())?.y ?? Infinity) < ((await warning.boundingBox())?.y ?? -Infinity), { message: 'fare above the warning' }).toBe(true);
      const fareBox = await fare.boundingBox();
      // Was 1,658 px (English) and 1,846 px (Malay); now inside the first 844 px screen.
      expect(fareBox!.y + fareBox!.height).toBeLessThan(phone.height);
    }
  });

  test('transit: the verdict summary stays in view while the layover is changed on a phone', async ({ page }) => {
    await page.setViewportSize(phone);
    await page.goto('/en/kul/transit');
    const summary = page.locator('[data-verdict-summary]');
    await expect(summary).toBeVisible();
    const layover = page.getByRole('combobox', { name: 'Time between flights' });
    await expect(async () => {
      await layover.selectOption({ index: 0 });
      await expect(summary).toHaveAttribute('data-verdict-summary', 'very-tight', { timeout: 2000 });
    }).toPass({ timeout: 20_000 });
    await expect(summary).toBeInViewport();
    await expect(summary).toContainText('Very tight');
    await expect(summary.getByRole('link', { name: 'See the plan' })).toHaveAttribute('href', '#transit-verdict-title');
  });

  // Intended change (critique-redesign2 item 4, polish round): on a phone the drawing now comes
  // first, on the first screen, with From and To right under it; round 4 had put the form first,
  // which left a deep link's route two screens down (y 1,173 at 390 x 844).
  test('map on a phone: the drawing is on the first screen, From and To follow it, and no chip covers the disclaimer', async ({ page }) => {
    await page.setViewportSize(phone);
    await page.goto('/en/kul/map?from=l5-kerb&to=g-gates-c');
    const main = page.getByRole('main');
    const from = main.getByRole('combobox', { name: 'From' });
    const disclaimer = main.locator('[data-map-disclaimer]');
    await expect(disclaimer).toHaveText('Schematic demonstration map, not a floor plan');
    const fromBox = await from.boundingBox();
    const discBox = await disclaimer.boundingBox();
    const drawingBox = await main.locator('[data-map-surface]').boundingBox();
    expect(discBox!.y).toBeLessThan(drawingBox!.y);
    expect(drawingBox!.y).toBeLessThan(phone.height);
    expect(drawingBox!.y).toBeLessThan(fromBox!.y);
    await expect(main.getByRole('region', { name: 'Your route' })).toBeVisible();
    // The disclaimer is a strip above the drawing: nothing inside the drawing can overlap it.
    const overlaps = await page.evaluate(() => {
      const strip = document.querySelector('[data-map-disclaimer]')!.getBoundingClientRect();
      return [...document.querySelectorAll('main button, main [data-poi]')].filter((element) => {
        const box = element.getBoundingClientRect();
        return box.width > 0 && !(box.right <= strip.left || box.left >= strip.right || box.bottom <= strip.top || box.top >= strip.bottom);
      }).length;
    });
    expect(overlaps).toBe(0);
  });

  test('facilities at 320 px and 125% text: provenance chips wrap, none is clipped (A-16)', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 568 });
    await textSize(page, 125);
    await page.goto('/en/kul/facilities');
    await expect(page.locator('html')).toHaveAttribute('data-text-size', '125');
    const clipped = await page.evaluate(() =>
      [...document.querySelectorAll('main [data-provenance]')].filter((chip) => chip.getBoundingClientRect().width > 0 && chip.scrollWidth > chip.clientWidth + 1).length,
    );
    expect(clipped).toBe(0);
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(320);
  });

  test('Malay at 360 px and 125% text: no word breaks mid-word on the home and the KLIA overview', async ({ page }) => {
    await page.setViewportSize({ width: 360, height: 800 });
    await textSize(page, 125);
    for (const path of ['/ms', '/ms/kul']) {
      await page.goto(path);
      await expect(page.locator('html')).toHaveAttribute('data-text-size', '125');
      const broken = await page.evaluate(() => {
        const words: string[] = [];
        const walker = document.createTreeWalker(document.querySelector('main')!, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          const parent = node.parentElement;
          if (!parent || parent.closest('.sr-only, details:not([open]) > :not(summary)')) continue;
          const pattern = /[\p{L}\p{N}]{4,}/gu;
          for (let match = pattern.exec(node.textContent ?? ''); match; match = pattern.exec(node.textContent ?? '')) {
            const range = document.createRange();
            range.setStart(node, match.index);
            range.setEnd(node, match.index + match[0].length);
            const tops = new Set([...range.getClientRects()].filter((rect) => rect.width > 0).map((rect) => Math.round(rect.top)));
            if (tops.size > 1) words.push(match[0]);
          }
        }
        return words;
      });
      expect(broken, path).toEqual([]);
    }
  });

  test('at 400% zoom (320 x 256) sticky content follows the header and the concierge form does not stick', async ({ page }) => {
    await page.setViewportSize({ width: 320, height: 256 });
    await page.goto('/en/kul/flights');
    await expect(page.locator('html')).toHaveAttribute('data-compact-chrome', 'true');
    await expect(async () => {
      await page.mouse.wheel(0, 300);
      await expect(page.locator('html')).toHaveAttribute('data-scroll-chrome', 'hidden', { timeout: 1000 });
    }).toPass({ timeout: 15_000 });
    expect(await page.evaluate(() => getComputedStyle(document.documentElement).getPropertyValue('--spacing-sticky').trim())).toBe('0px');

    await page.goto('/en/concierge');
    const composer = page.locator('[data-sticky-bottom]');
    await expect(composer).toBeAttached();
    expect(await composer.evaluate((element) => getComputedStyle(element).position)).toBe('static');
  });
});

test.describe('density (6.1.7, A-14)', () => {
  const count = (page: Page, selector: string) =>
    page.evaluate((query) => [...document.querySelectorAll(`main ${query}`)].filter((element) => element.getBoundingClientRect().width > 0).length, selector);

  test('one source list per section, each naming what it supports, and at most 8 type sizes', async ({ page }) => {
    await page.setViewportSize(phone);
    // Before round 4: facilities 21 source toggles, transport 9, transit 16.
    for (const [path, max] of [
      ['/en/kul/facilities', 12],
      ['/en/kul/transport', 5],
      ['/en/kul/transit', 8],
    ] as const) {
      await page.goto(path);
      await expect(page.locator('[data-section-sources]').first()).toBeAttached();
      expect(await count(page, 'summary[data-source-marker]'), path).toBeLessThanOrEqual(max);
      const sizes = await page.evaluate(() => {
        const found = new Set<string>();
        for (const element of document.querySelectorAll('main *')) {
          if (element.getBoundingClientRect().width === 0) continue;
          if (![...element.childNodes].some((child) => child.nodeType === 3 && child.textContent?.trim())) continue;
          found.add(getComputedStyle(element).fontSize);
        }
        return [...found];
      });
      expect(sizes.length, `${path}: ${sizes.join(', ')}`).toBeLessThanOrEqual(8);
    }
    await page.goto('/en/kul/facilities');
    const lounges = page.getByRole('region', { name: /^Lounge/ });
    await lounges.locator('[data-section-sources] summary').click();
    await expect(lounges.locator('[data-source-cited-by]').first()).toContainText('For: ');
  });

  test('the map list states each level’s shared tag once instead of a tag per place', async ({ page }) => {
    await page.goto('/en/kul/map');
    // Before: 42 tags in the place list, 18 of them "Demo".
    expect(await count(page, '#map-places [data-provenance]')).toBeLessThanOrEqual(24);
    await expect(page.locator('#map-places [data-provenance-default]').first()).toBeVisible();
  });
});

test.describe('measurement hand-offs (6.1.9, E-17)', () => {
  for (const { path, selector, name, host } of [
    { path: '/en/kul/facilities', selector: '#kul-t1-fast-track a[data-handoff]', name: 'fast-track-booking', host: 'https://www.myairportfasttrack.com/**' },
    { path: '/en/kul/lounges', selector: 'a[data-handoff="lounge-operator"]', name: 'lounge-operator', host: 'https://www.malaysiaairlines.com/**' },
    { path: '/en/kul/transport', selector: 'a[data-handoff="rail-tickets"]', name: 'rail-tickets', host: 'https://kliaekspres.com/**' },
  ]) {
    test(`${path}: the ${name} link is a measured hand-off with a campaign`, async ({ page, context }) => {
      await context.route(host, (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>stub</title>' }));
      // Intended change (redesign three): on phones the Fast Track card is behind its group's
      // "Show N more"; a link to the card opens that disclosure (as the overview's link does).
      await page.goto(path === '/en/kul/facilities' ? `${path}#kul-t1-fast-track` : path);
      const link = page.locator(selector).first();
      await expect(link).toHaveAttribute('data-handoff', name);
      await expect(async () => {
        const [popup] = await Promise.all([context.waitForEvent('page', { timeout: 5000 }), link.click({ timeout: 3000 })]);
        const url = popup.url();
        await popup.close();
        expect(url).toContain(`utm_campaign=${name}`);
      }).toPass({ timeout: 30_000 });
    });
  }

  test('an official page that sells nothing is not marked as a hand-off', async ({ page }) => {
    await page.goto('/en/kul/facilities');
    await expect(page.locator('a[data-handoff]').filter({ hasText: /official site/ })).toHaveCount(2);
    await expect(page.locator('main article[id*="lost"]').first()).toBeAttached();
    await expect(page.locator('main article[id*="lost"] a[data-handoff]')).toHaveCount(0);
  });
});

test.describe('accessibility statement (6.1.10)', () => {
  test('describes focus, the test scope, the review date and the contact, in both languages', async ({ page }) => {
    await page.goto('/en/accessibility#statement');
    const statement = page.locator('#statement');
    // Round 6: re-dated after the sixth round of fixes (the date is the intended change).
    await expect(statement).toContainText('Last reviewed 22 November 2026, after the sixth round of fixes');
    await expect(statement).toContainText('keyboard focus moves to that page');
    await expect(statement).toContainText('moves focus to that part');
    await expect(statement).toContainText('125 per cent browser zoom');
    await expect(statement).not.toContainText('focus stays where it was');
    await expect(statement).toContainText('200 and 400 per cent');
    await expect(statement).toContainText('Safari on iPhone and iPad (WebKit) has not been tested');
    await expect(statement.locator('[data-accessibility-contact]')).toContainText('does not publish an accessibility contact or a response time');
    await expect(statement.getByRole('link', { name: 'info@malaysiaairports.com.my' })).toHaveAttribute('href', /^mailto:/);
    await expectNoAxeViolations(page, { include: '#statement' });

    await page.goto('/ms/accessibility#statement');
    const ms = page.locator('#statement');
    await expect(ms).toContainText('22 November 2026, selepas pusingan pembaikan keenam');
    await expect(ms).toContainText('memindahkan fokus ke bahagian itu');
    await expect(ms).toContainText('fokus papan kekunci berpindah ke tajuk utama');
    await expect(ms).toContainText('200 dan 400 peratus');
    await expect(ms.locator('[data-accessibility-contact]')).toContainText('tidak menerbitkan saluran kebolehcapaian');
  });
});

test.describe('404s without a client error (gallery note 1)', () => {
  for (const [path, title] of [
    ['/en/no-such-page', 'Page not found'],
    ['/ms/tiada-halaman', 'Halaman tidak ditemui'],
    ['/en/guides/no-such-guide', 'Page not found'],
  ] as const) {
    test(`${path}: the body is in the HTML, inside the site shell, with no failed boundary`, async ({ page, request }) => {
      const response = await request.get(path);
      if (!(await isDevServer(request))) expect(response.status()).toBe(404);
      const html = await response.text();
      expect(html).toContain(`<title>${title}`);
      expect(html).toContain(`${title}</h1>`);
      expect(html).toContain('data-site-header');
      // A boundary React could not finish on the server (`<!--$!-->`) is what the browser reported as #419.
      expect(html.replace(/<noscript[^>]*>[\s\S]*?<\/noscript>/g, '')).not.toContain('<!--$!-->');

      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error' && !/instant-shell-url-data|URL data during prerendering/.test(message.text())) errors.push(message.text());
      });
      page.on('pageerror', (error) => errors.push(error.message));
      await page.goto(path);
      await expect(page.getByRole('heading', { level: 1, name: title })).toBeVisible();
      await page.waitForTimeout(1000);
      expect(errors.filter((text) => !/Failed to load resource/.test(text))).toEqual([]);
    });
  }
});
