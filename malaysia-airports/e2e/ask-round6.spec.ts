import { expect, test, type Page } from '@playwright/test';
import { expectNoAxeViolations } from './support/axe';

/**
 * Round 6, package "ask" (docs/qa/fixes/round6-ask.md; third review, section 9.1 items 3 to 7 and 10).
 *
 * 1. Concierge focus (pilot condition P9): no focused control is hidden behind the question box,
 *    before or after an answer, at 1280 x 720, 1440 x 900 at 125% zoom and 390 x 844, in both
 *    languages; no axe `target-size` result.
 * 2. Focus after a search selection lands on the destination.
 */

test.describe.configure({ timeout: 120_000 });

/** Is the focused element fully on screen and clear of the composer, the header and the phone's bottom bar? */
async function focusedClear(page: Page) {
  return page.evaluate(() => {
    const active = document.activeElement as HTMLElement | null;
    if (!active || active === document.body) return { ok: true, label: '(body)', inMain: false };
    const rect = active.getBoundingClientRect();
    const covers: { name: string; rect: DOMRect }[] = [];
    const form = document.querySelector('main form');
    if (form && !form.contains(active)) covers.push({ name: 'composer', rect: form.getBoundingClientRect() });
    const bar = document.querySelector('[data-mobile-bar]');
    if (bar && getComputedStyle(bar).display !== 'none') covers.push({ name: 'bottom bar', rect: bar.getBoundingClientRect() });
    const header = document.querySelector('[data-site-header]') ?? document.querySelector('header');
    if (header && getComputedStyle(header).position !== 'static') covers.push({ name: 'header', rect: header.getBoundingClientRect() });
    const hit = covers.find(
      ({ rect: c }) => c.width > 0 && c.height > 0 && rect.left < c.right && rect.right > c.left && rect.top < c.bottom - 0.5 && rect.bottom > c.top + 0.5,
    );
    const inView = rect.top >= -0.5 && rect.bottom <= window.innerHeight + 0.5;
    const label = (active.getAttribute('aria-label') ?? active.textContent ?? active.tagName).trim().slice(0, 60);
    return { ok: !hit && inView, label, inMain: Boolean(active.closest('main')), under: hit?.name ?? (inView ? '' : 'outside the window'), top: Math.round(rect.top), bottom: Math.round(rect.bottom) };
  });
}

/** Tab from the page heading through the conversation, checking every stop; returns the labels seen. */
async function tabThroughConversation(page: Page, stops: number) {
  await page.evaluate(() => {
    window.scrollTo(0, 0);
    const heading = document.querySelector<HTMLElement>('main h1');
    heading?.setAttribute('tabindex', '-1');
    heading?.focus();
  });
  const seen: string[] = [];
  const hidden: string[] = [];
  for (let index = 0; index < stops; index++) {
    await page.keyboard.press('Tab');
    // Let the browser finish scrolling the focused control into view (and any smooth scroll).
    await page.waitForTimeout(120);
    const state = await focusedClear(page);
    if (!state.inMain) continue;
    seen.push(state.label);
    if (!state.ok) hidden.push(`${state.label} (${state.top} to ${state.bottom}, under the ${state.under})`);
  }
  return { seen, hidden };
}

const SUGGESTIONS = {
  en: ['Where do I check in for my flight?', 'What is the cheapest way to get to KL Sentral?', 'My flight is delayed. What should I do?', 'Is there free Wi-Fi at KLIA?'],
  ms: ['Di mana saya daftar masuk untuk penerbangan saya?', 'Apakah cara termurah ke KL Sentral?', 'Penerbangan saya lewat. Apa yang patut saya buat?', 'Adakah Wi-Fi percuma di KLIA?'],
} as const;

const QUESTION = { en: 'How do I get from Terminal 1 to Terminal 2?', ms: 'Bagaimana saya pergi dari Terminal 1 ke Terminal 2?' } as const;

async function askAndWait(page: Page, question: string, turns: number) {
  const field = page.locator('main form input');
  await expect(async () => {
    await field.fill(question, { timeout: 3000 });
    await field.press('Enter');
    await expect(page.locator('main [data-turn]')).toHaveCount(turns, { timeout: 5000 });
  }).toPass({ timeout: 30_000 });
  await expect(page.locator('main [data-turn]').nth(turns - 1).locator('[data-concierge-answer], [data-statement]').first()).toBeVisible({ timeout: 30_000 }).catch(() => undefined);
  await page.waitForTimeout(1200);
}

function focusSuite(name: string, sizes: { viewport: { width: number; height: number }; deviceScaleFactor?: number }, project: 'desktop' | 'phone') {
  test.describe(`concierge focus at ${name}`, () => {
    test.use(sizes);
    for (const lang of ['en', 'ms'] as const) {
      test(`${lang}: every suggestion and every answer control is fully visible when focused`, async ({ page }, testInfo) => {
        test.skip(testInfo.project.name !== project, `measured in the ${project} project`);
        await page.goto(`/${lang}/concierge`);
        await expect(page.getByRole('button', { name: SUGGESTIONS[lang][0] })).toBeVisible();
        await page.waitForLoadState('networkidle');

        const before = await tabThroughConversation(page, 22);
        for (const suggestion of SUGGESTIONS[lang]) expect(before.seen, 'the walk reached the suggestion').toContain(suggestion);
        expect(before.hidden, 'focused controls hidden before a question').toEqual([]);

        // After two answers the composer is stuck to the bottom of the window: its scroll padding
        // keeps every focused control in the answers clear of it.
        await askAndWait(page, QUESTION[lang], 1);
        await askAndWait(page, SUGGESTIONS[lang][3], 2);
        expect(await page.locator('main form').evaluate((form) => getComputedStyle(form).position)).toBe(sizes.viewport.height >= 640 ? 'sticky' : 'static');
        const after = await tabThroughConversation(page, 30);
        expect(after.seen.length, 'the walk reached the answers').toBeGreaterThan(4);
        expect(after.hidden, 'focused controls hidden after an answer').toEqual([]);
      });
    }
  });
}

focusSuite('1280 x 720', { viewport: { width: 1280, height: 720 } }, 'desktop');
// 1440 x 900 at 125% browser zoom is a 1152 x 720 CSS-pixel window at a device pixel ratio of 1.25.
focusSuite('1440 x 900 at 125%', { viewport: { width: 1152, height: 720 }, deviceScaleFactor: 1.25 }, 'desktop');
focusSuite('390 x 844', { viewport: { width: 390, height: 844 } }, 'phone');

test.describe('concierge composer before the first question', () => {
  test('the question field comes first and does not stick; the suggestions follow it', async ({ page }) => {
    await page.goto('/en/concierge');
    const form = page.locator('main form');
    await expect(form).toHaveAttribute('data-composer', 'static');
    expect(await form.evaluate((element) => getComputedStyle(element).position)).toBe('static');
    const order = await page.evaluate(() => {
      const field = document.querySelector('main form input');
      const suggestion = [...document.querySelectorAll('main button')].find((button) => button.textContent?.includes('Where do I check in'));
      return field && suggestion ? field.compareDocumentPosition(suggestion) & Node.DOCUMENT_POSITION_FOLLOWING : 0;
    });
    expect(order, 'the suggestions come after the field').toBeTruthy();
    await expect(page.getByRole('textbox', { name: 'Your question' })).toBeInViewport();
  });

  for (const { lang, viewport } of [
    { lang: 'ms', viewport: { width: 1440, height: 900 } },
    { lang: 'en', viewport: { width: 1280, height: 720 } },
  ] as const) {
    test(`axe finds nothing, target size included (${lang}, ${viewport.width} x ${viewport.height})`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop', 'a desktop window');
      await page.setViewportSize(viewport);
      await page.goto(`/${lang}/concierge`);
      await expect(page.getByRole('button', { name: SUGGESTIONS[lang][0] })).toBeVisible();
      await page.waitForLoadState('networkidle');
      await expectNoAxeViolations(page);
    });
  }
});

/** Opens the search palette: Ctrl+K on a desktop, the bottom bar's Search button on a phone. */
async function openPalette(page: Page, isMobile: boolean, lang: 'en' | 'ms') {
  const dialog = page.getByRole('dialog', { name: lang === 'en' ? 'Search' : 'Carian' });
  await expect(async () => {
    if (isMobile) await page.locator('[data-mobile-bar]').getByRole('button', { name: lang === 'en' ? 'Search' : 'Carian' }).click({ timeout: 2000 });
    else await page.keyboard.press('Control+K');
    await expect(dialog).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 20_000 });
  return dialog;
}

test.describe('focus after a search selection (A-05 residual)', () => {
  for (const { lang, from, query, option, url, focus } of [
    { lang: 'en', from: '/en', query: 'parking klia', option: /^Parking at KLIA/, url: /\/en\/kul\/parking$/, focus: 'h1' },
    { lang: 'en', from: '/en/kul', query: 'accessible toilet', option: /Accessible toilets: not published/, url: /\/en\/accessibility#/, focus: 'anchor' },
    { lang: 'ms', from: '/ms', query: 'tandas OKU', option: /Tandas OKU: belum diterbitkan/, url: /\/ms\/accessibility#/, focus: 'anchor' },
    { lang: 'ms', from: '/ms/kul', query: 'surau', option: /Surau/, url: /\/ms\/kul\//, focus: 'any' },
    // The same page, a new anchor: no route change, so only the palette can move focus.
    { lang: 'en', from: '/en/accessibility', query: 'accessible toilet', option: /Accessible toilets: not published/, url: /\/en\/accessibility#/, focus: 'anchor' },
  ] as const) {
    test(`${lang}: choosing "${query}" on ${from} moves focus to the destination`, async ({ page, isMobile }) => {
      await page.goto(from);
      await page.waitForLoadState('networkidle');
      const dialog = await openPalette(page, isMobile, lang);
      const box = dialog.getByRole('combobox');
      await box.fill(query);
      const choice = dialog.getByRole('option', { name: option }).first();
      await expect(choice).toBeVisible({ timeout: 15_000 });
      // Move the active option to the choice with the arrow keys, then Enter.
      const id = await choice.getAttribute('id');
      for (let step = 0; step < 12 && (await box.getAttribute('aria-activedescendant')) !== id; step++) await box.press('ArrowDown');
      await expect(box).toHaveAttribute('aria-activedescendant', id ?? '');
      await box.press('Enter');
      await expect(dialog).toBeHidden();
      await expect(page).toHaveURL(url);
      await expect
        .poll(
          () =>
            page.evaluate(() => {
              const active = document.activeElement as HTMLElement | null;
              if (!active || active === document.body) return 'body';
              if (active.matches('main h1')) return 'h1';
              if (active.id && `#${active.id}` === window.location.hash) return 'anchor';
              if (active.closest('[data-mobile-bar], header')) return 'chrome';
              return active.closest('main') ? 'main' : 'elsewhere';
            }),
          { timeout: 10_000 },
        )
        .toBe(focus === 'any' ? (await page.evaluate(() => (window.location.hash ? 'anchor' : 'h1'))) : focus);
      // The next Tab continues inside the page's content, not in the header.
      await page.keyboard.press('Tab');
      expect(await page.evaluate(() => Boolean(document.activeElement?.closest('main')))).toBe(true);
    });
  }
});

/* ---- 3. Concierge intent and length (9.1 item 4) ------------------------------------------ */

const conversation = (page: Page) => page.getByRole('log', { name: /Conversation|Perbualan/ });

/** Ask on the concierge page; returns the turn for this question. */
async function askTurn(page: Page, question: string, lang: 'en' | 'ms' = 'en') {
  const field = page.getByRole('textbox', { name: lang === 'en' ? 'Your question' : 'Soalan anda' });
  await expect(async () => {
    await field.fill(question, { timeout: 3000 });
    await field.press('Enter');
    await expect(conversation(page).getByRole('heading', { level: 3, name: question })).toBeVisible({ timeout: 5000 });
  }).toPass({ timeout: 45_000 });
  const turn = conversation(page).locator('ol > li').filter({ has: page.getByRole('heading', { level: 3, name: question }) });
  await expect(turn.locator('p.type-body-lg')).toBeVisible({ timeout: 30_000 });
  return turn;
}

test.describe('concierge intents (9.1 item 4)', () => {
  test('en: cannot book a taxi, no live queue data, weather outside its scope, business channel, gate letter', async ({ page }) => {
    await page.goto('/en/concierge');
    const taxi = await askTurn(page, 'Can you book me a taxi at KLIA?');
    await expect(taxi.locator('p.type-body-lg')).toHaveText('I can’t book a taxi for you. Airport taxis are paid for by coupon at a counter before you ride.');
    await expect(taxi.getByRole('heading', { name: /Airport taxi \(prepaid coupon\)/ })).toBeVisible();

    const queue = await askTurn(page, 'What is the queue at immigration right now at KLIA?');
    await expect(queue.locator('p.type-body-lg')).toHaveText('There is no live queue data yet. The waiting times we show are demonstration estimates, not measurements.');
    await expect(queue.locator('[data-provenance="demo"]').first()).toBeVisible();
    await expect(queue.getByRole('list', { name: 'Official contacts' })).toHaveCount(0);

    const weather = await askTurn(page, 'What will the weather be like tomorrow?');
    await expect(weather.locator('p.type-body-lg')).toHaveText(/^I can’t give weather forecasts/);
    await expect(weather.getByText('+60 3 8777 0000')).toHaveCount(0);

    const business = await askTurn(page, 'Advertising space at KLIA?');
    await expect(business.locator('p.type-body-lg')).toHaveText(/^A dedicated channel for advertising enquiries is not published in our sources\./);
    // The lead is not repeated word for word as a detail.
    await expect(business.getByText(/^A dedicated channel for advertising/)).toHaveCount(1);

    const gate = await askTurn(page, 'Where can I eat near gate C?');
    await expect(gate.locator('p.type-body-lg')).toHaveText(/^Food and drink published for KLIA Terminal 1/);
    await expect(gate.getByRole('group', { name: 'Choose an airport' })).toHaveCount(0);
  });

  test('ms: departure autogates for an older parent lead with the departing-citizen card', async ({ page }) => {
    await page.goto('/ms/concierge');
    const turn = await askTurn(page, 'Bolehkah ibu saya yang warga emas guna autogate semasa berlepas di KLIA?', 'ms');
    await expect(turn.locator('p.type-body-lg')).toHaveText(/^Sumber kami tidak menerbitkan siapa yang boleh menggunakan autogate berlepas/);
    await expect(turn.getByText(/MDAC/)).toHaveCount(0);
    const taxi = await askTurn(page, 'Boleh tempah teksi untuk saya di KLIA?', 'ms');
    await expect(taxi.locator('p.type-body-lg')).toHaveText(/^Saya tidak boleh menempah teksi untuk anda\./);
  });

  test('on a phone an answer shows one lead line and at most two cards (or one detail) before "More"', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'phone', 'a phone answer');
    await page.goto('/en/concierge');
    for (const question of ['How do I get from Terminal 1 to Terminal 2 at KLIA?', 'My flight is delayed. What should I do?', 'Is there free Wi-Fi at KLIA?', 'How much is the KLIA Ekspres?']) {
      const turn = await askTurn(page, question);
      const shown = await turn.evaluate((element) => {
        const visible = (node: Element) => node.getClientRects().length > 0;
        return {
          cards: [...element.querySelectorAll('ul.grid > li')].filter(visible).length,
          details: [...element.querySelectorAll('ul[aria-label="Details"] > li')].filter(visible).length,
        };
      });
      expect(shown.cards, question).toBeLessThanOrEqual(2);
      expect(shown.details, question).toBeLessThanOrEqual(shown.cards > 0 ? 0 : 1);
      await expect(turn.getByRole('button', { name: /^Show \d+ more items?$/ })).toBeVisible();
      expect((await turn.boundingBox())?.height ?? 0, question).toBeLessThan(1100);
    }
  });
});

/* ---- 4. Search (9.1 item 5) ---------------------------------------------------------------- */

test.describe('search: the airport a query names, vocabulary and illustrative places (9.1 item 5)', () => {
  const results = (page: Page) => page.getByRole('main').getByRole('link');
  const firstResultTitle = async (page: Page, pattern: RegExp) => {
    const link = page.getByRole('main').getByRole('link', { name: pattern }).first();
    await expect(link).toBeVisible({ timeout: 30_000 });
    return link;
  };

  for (const { path, gap, href, other } of [
    { path: '/en/search?q=kuching%20parking', gap: /^Parking at Kuching International Airport: not published/, href: /\/en\/airports\/not-published\?airport=kch&section=parking$/, other: /Parking at KLIA/ },
    { path: '/en/search?q=langkawi%20taxi', gap: /^Ground transport at Langkawi International Airport: not published/, href: /\/en\/airports\/not-published\?airport=lgk&section=transport$/, other: /Airport taxi/ },
    { path: '/ms/search?q=parkir%20kuching', gap: /^Parkir di Lapangan Terbang Antarabangsa Kuching: belum diterbitkan/, href: /\/ms\/airports\/not-published\?airport=kch&section=parking$/, other: /Parkir di KLIA/ },
  ]) {
    test(`${path}: "not published" for the named airport comes first, with its official page`, async ({ page }) => {
      await page.goto(path);
      const gapLink = await firstResultTitle(page, gap);
      await expect(gapLink).toHaveAttribute('href', href);
      const order = await page.getByRole('main').evaluate(
        (main, [gapSource, otherSource]) => {
          const links = [...main.querySelectorAll('a')].map((link) => link.textContent ?? '');
          return { gap: links.findIndex((text) => new RegExp(gapSource).test(text.trim())), other: links.findIndex((text) => new RegExp(otherSource).test(text)) };
        },
        [gap.source, other.source],
      );
      expect(order.gap).toBeGreaterThanOrEqual(0);
      if (order.other >= 0) expect(order.gap, 'the gap comes before other airports').toBeLessThan(order.other);
    });
  }

  for (const { path, first, absent } of [
    { path: '/en/search?q=pharmacy', first: /Pharmacies: not published yet/, absent: null },
    { path: '/ms/search?q=farmasi', first: /Farmasi: belum diterbitkan/, absent: null },
    { path: '/en/search?q=charging', first: /Charging points: not published yet/, absent: /Train between Terminal 1 and Terminal 2/ },
    { path: '/en/search?q=money%20changer', first: /Money changers: not published yet/, absent: /KLIA Ekspres/ },
    { path: '/en/search?q=atm', first: /^ATMs/, absent: null },
    { path: '/en/search?q=lost%20and%20found', first: /Lost & Found/, absent: /Travel Club Lounge|Medical services|Kepler/ },
    { path: '/en/search?q=advertising', first: /Business with us/, absent: null },
  ]) {
    test(`${path}: leads with an honest answer and leaves out unrelated pages`, async ({ page }) => {
      await page.goto(path);
      await firstResultTitle(page, first);
      if (absent) await expect(page.getByRole('main').getByRole('link', { name: absent })).toHaveCount(0);
    });
  }

  test('"lost and found" lists a handful of results, not 134', async ({ page }) => {
    await page.goto('/en/search?q=lost%20and%20found');
    await firstResultTitle(page, /Lost & Found/);
    const count = await results(page).filter({ hasText: /./ }).count();
    expect(count).toBeLessThan(25);
  });

  for (const [path, marker] of [
    ['/en/search?q=lift', 'illustrative position'],
    ['/ms/search?q=lif', 'kedudukan ilustrasi'],
  ] as const) {
    test(`${path}: every demonstration lift says it is illustrative`, async ({ page }) => {
      await page.goto(path);
      const lifts = page.getByRole('main').getByRole('link', { name: /^(Lifts|Lif) / });
      await expect(lifts.first()).toBeVisible({ timeout: 30_000 });
      for (const name of await lifts.allTextContents()) expect(name).toContain(marker);
    });
  }
});

/* ---- 5. Notice and copy semantics (9.1 item 6) ------------------------------------------- */

test.describe('notice semantics (9.1 item 6)', () => {
  // The day the third review read "In effect now" beside "RM65 from 1 January 2027".
  test.beforeEach(async ({ page }) => {
    await page.clock.setFixedTime(new Date('2026-11-22T06:40:00+08:00'));
  });

  for (const { path, announced } of [
    { path: '/en/kul', announced: 'Announced; applies from 1 January 2027' },
    { path: '/en/notices', announced: 'Announced; applies from 1 January 2027' },
    { path: '/ms/kul', announced: 'Diumumkan; berkuat kuasa mulai 1 Januari 2027' },
  ]) {
    test(`${path}: the 2027 fare reads "${announced}", never "In effect now", and no notice has an "Estimated" chip`, async ({ page }) => {
      await page.goto(path);
      const card = page.locator('li#kul-klia-ekspres-fare-rise-2027 article');
      await expect(card).toBeVisible({ timeout: 30_000 });
      await expect(card.getByText(announced, { exact: true })).toBeVisible();
      await expect(card.getByText(/In effect now|Berkuat kuasa sekarang/)).toHaveCount(0);
      await expect(page.locator('article[data-severity] [data-provenance="estimated"]')).toHaveCount(0);
    });
  }

  test('a directory-only airport says there are no notices in our sources, not "right now"', async ({ page }) => {
    await page.goto('/en/lwy');
    await expect(page.getByText('No notices in our sources for this airport.', { exact: true })).toBeVisible({ timeout: 30_000 });
    await expect(page.getByText(/no notices for this airport right now/i)).toHaveCount(0);
  });

  test('queue lines at a one-terminal airport do not print "MAIN"', async ({ page }) => {
    await page.goto('/en/kch');
    await expect(page.getByText(/Immigration|Security/).first()).toBeVisible({ timeout: 30_000 });
    await expect(page.getByRole('main').getByText(/\bMAIN\b/)).toHaveCount(0);
  });

  test("the concierge's long-stay parking card carries its \"not verified\" qualifier", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/concierge');
    const turn = await askTurn(page, 'How much is parking for 3 days at the long term car park at KLIA?');
    const longStay = turn.locator('li').filter({ hasText: 'Staying more than a day?' });
    await expect(longStay).toContainText('costs at most RM32 a day from 1 May 2026');
    await expect(longStay).toContainText('Rates not verified');
  });
});

/* ---- 6. Corporate type sizes (9.1 item 7, A-14) ------------------------------------------- */

test.describe('corporate type sizes (A-14)', () => {
  for (const width of [390, 1440]) {
    test(`the corporate hub and news use at most 8 type sizes at ${width} px (EN and MS)`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'desktop', 'sizes set explicitly');
      await page.setViewportSize({ width, height: 900 });
      for (const path of ['/en/corporate', '/ms/corporate', '/en/corporate/news', '/ms/corporate/news']) {
        await page.goto(path);
        await page.waitForLoadState('networkidle');
        // scripts/qa/type-sizes.mjs's count: distinct font sizes of visible elements with their own text in <main>.
        const sizes = await page.evaluate(() => {
          const shown = (element: Element) => {
            const box = element.getBoundingClientRect();
            return box.width > 0 && box.height > 0 && getComputedStyle(element).visibility !== 'hidden';
          };
          return [
            ...new Set(
              [...document.querySelectorAll('main *')]
                .filter((element) => shown(element) && [...element.childNodes].some((node) => node.nodeType === 3 && node.textContent?.trim()))
                .map((element) => parseFloat(getComputedStyle(element).fontSize)),
            ),
          ].sort((a, b) => a - b);
        });
        expect(sizes.length, `${path}: ${sizes.join(' ')}`).toBeLessThanOrEqual(8);
      }
    });
  }
});

/* ---- 7. hreflang in the head (9.1 item 10, E-14) ------------------------------------------ */

test.describe('hreflang alternates in the head (E-14)', () => {
  test('every sitemap page names both languages and x-default in its head, with exactly one canonical', async ({ request }) => {
    test.setTimeout(300_000);
    const xml = await (await request.get('/sitemap.xml')).text();
    const paths = [...new Set([...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => new URL(match[1]).pathname))];
    expect(paths.length).toBeGreaterThan(200);
    const missing: string[] = [];
    for (let index = 0; index < paths.length; index += 8) {
      await Promise.all(
        paths.slice(index, index + 8).map(async (path) => {
          const html = await (await request.get(path, { maxRedirects: 0 })).text();
          const head = html.slice(0, html.indexOf('</head>'));
          const rest = path.replace(/^\/(en|ms)/, '');
          const alternate = (lang: string) => new RegExp(`<link rel="alternate" hrefLang="${lang}" href="[^"]*/${lang === 'x-default' ? 'en' : lang}${rest.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}"`);
          for (const lang of ['en', 'ms', 'x-default']) if (!alternate(lang).test(head)) missing.push(`${path} ${lang}`);
          const canonicals = head.match(/<link rel="canonical" href="[^"]*"/g) ?? [];
          if (canonicals.length !== 1 || !canonicals[0].endsWith(`${path}"`)) missing.push(`${path} canonical ${canonicals.length}`);
          if ((html.match(/rel="canonical"/g) ?? []).length !== 1) missing.push(`${path} canonical outside the head`);
        }),
      );
    }
    expect(missing).toEqual([]);
  });
});
