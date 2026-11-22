import { expect, test, type Page } from '@playwright/test';

/**
 * Round 4, package "ask" (re-review 6.1.3, 6.1.4, 6.1.5, 6.1.9 and 6.1.10):
 *
 *  - one fact, one answer: the parking page, the concierge and the help FAQ give the Long Term Car
 *    Park the same rate status, read from the same record;
 *  - the main "Book parking online" link is a measured hand-off with campaign parameters;
 *  - the concierge says plainly when it cannot answer and names the official contact, honours
 *    access qualifiers in Malay, and on a phone shows a lead line and two cards with the rest
 *    behind an accessible "More" button;
 *  - search relevance for the queries the panel quoted.
 *
 * Conventions follow e2e/concierge.spec.ts: getByRole, fresh storage per test.
 */

test.describe.configure({ timeout: 90_000 });

const log = (page: Page) => page.getByRole('log', { name: /Conversation|Perbualan/ });

/** Ask on the concierge page and wait for the answer to the question. */
async function ask(page: Page, question: string, lang: 'en' | 'ms' = 'en') {
  const field = page.getByRole('textbox', { name: lang === 'en' ? 'Your question' : 'Soalan anda' });
  await expect(async () => {
    await field.fill(question, { timeout: 3000 });
    await page.getByRole('button', { name: lang === 'en' ? 'Ask' : 'Tanya', exact: true }).click({ timeout: 3000 });
    await expect(log(page).getByRole('heading', { level: 3, name: question })).toBeVisible({ timeout: 5000 });
  }).toPass({ timeout: 45_000 });
  return log(page).locator('ol > li').filter({ has: page.getByRole('heading', { level: 3, name: question }) });
}

test.describe('one fact, one answer: parking rates (6.1.3)', () => {
  test('the parking page, the concierge and the help FAQ say the same about the Long Term Car Park', async ({ page }) => {
    await page.goto('/en/kul/parking');
    const row = page.locator('[data-parking-matrix] [data-car-park="kul-long-term-car-park"]');
    const pageLine = (await row.locator('[data-rate-line]').innerText()).trim();
    expect(pageLine).toMatch(/^Rates not verified: our sources give a daily maximum of RM\s32/);
    // The figures are marked "not verified" like the terminal car parks', not shown bare.
    await expect(row.locator('[data-rate-verified="false"]')).toHaveCount(3);
    await expect(row.getByText('(not verified)').first()).toBeAttached();
    // The car-park card says the same. On a production build the list is in the static shell as the
    // Suspense fallback and streams again with the URL's state, so until React reveals the streamed
    // copy the card exists twice (one in a hidden segment). Wait for the reveal: one card, one line.
    await expect(page.locator('[id="car-park-kul-long-term-car-park"]')).toHaveCount(1);
    await expect(page.locator('#car-park-kul-long-term-car-park [data-rate-line]')).toHaveText(pageLine);

    await page.goto('/en/concierge');
    const turn = await ask(page, 'How much does parking cost at KLIA?');
    await expect(turn.getByText(/^No parking rates at KLIA are verified\. The lowest daily maximum in our sources is RM\s32, at Long Term Car Park/)).toBeVisible();
    await expect(turn.locator('[data-rate-line]').first()).toHaveText(pageLine);

    await page.goto('/en/help/parking-transport');
    const question = page.getByRole('button', { name: 'How do I get from the Long Term Car Park to the terminal at KLIA?' });
    await expect(async () => {
      if ((await question.getAttribute('aria-expanded')) !== 'true') await question.click({ timeout: 3000 });
      await expect(page.getByText('A complimentary shuttle runs between the Long Term Car Park', { exact: false })).toBeVisible({ timeout: 3000 });
    }).toPass({ timeout: 30_000 });
    const faq = await page.getByText('A complimentary shuttle runs between the Long Term Car Park', { exact: false }).innerText();
    expect(faq).toContain(pageLine);
    await expect(page.getByText('not yet verified in this prototype')).toHaveCount(0);
  });

  test('the main "Book parking online" link is a measured hand-off with a campaign (6.1.9)', async ({ page, context }) => {
    await context.route('https://airports.malaysiaairports.com.my/**', (route) => route.fulfill({ status: 200, contentType: 'text/html', body: '<title>stub</title>' }));
    await page.goto('/en/kul/parking');
    const link = page.locator('[data-parking-matrix]').getByRole('link', { name: /Book parking online/ });
    await expect(link).toHaveAttribute('data-handoff', 'parking-booking');
    const beacon = page.waitForRequest((request) => request.url().endsWith('/api/metrics') && (request.postData() ?? '').includes('"handoff"'), { timeout: 30_000 }).catch(() => null);
    // The measurement starts once the page has hydrated; a click before then opens the plain link.
    await expect(async () => {
      const [popup] = await Promise.all([context.waitForEvent('page', { timeout: 5000 }), link.click({ timeout: 3000 })]);
      const url = popup.url();
      await popup.close();
      expect(url).toContain('utm_campaign=parking-booking');
    }).toPass({ timeout: 30_000 });
    const sent = await beacon;
    if (sent) expect(sent.postData()).toContain('parking-booking');
  });
});

test.describe('concierge (6.1.4, 6.1.10)', () => {
  test('says plainly it cannot answer, and names the official contact', async ({ page }) => {
    await page.goto('/en/concierge');
    // Round 6, intended change: the weather is outside what the concierge covers and no longer goes
    // to the airport's support line (e2e/ask-round6.spec.ts); an airport question it cannot answer does.
    const turn = await ask(page, 'Can I bring durian in my hand luggage?');
    await expect(turn.getByText(/^I can’t answer that from our verified content\. For a definite answer, contact .*\+60/)).toBeVisible();
    await expect(turn.getByRole('list', { name: 'Details' })).toHaveCount(0);
    // The official contacts show at once, even on a phone: they are the answer here.
    await expect(turn.getByRole('list', { name: 'Official contacts' })).toBeVisible();
    await expect(turn.getByRole('list', { name: 'Official contacts' }).getByRole('link').first()).toBeVisible();
  });

  test.describe('on a phone', () => {
    test.use({ viewport: { width: 390, height: 844 } });

    test('"I can’t answer that" shows the official contacts without "More"', async ({ page }) => {
      await page.goto('/en/concierge');
      const turn = await ask(page, 'Can I bring durian in my hand luggage?');
      await expect(turn.getByText(/^I can’t answer that from our verified content\./)).toBeVisible();
      await expect(turn.getByRole('list', { name: 'Official contacts' })).toBeVisible();
    });

    test('an answer shows its lead and two cards; the rest is behind an accessible "More" button', async ({ page }) => {
      await page.goto('/en/concierge');
      const turn = await ask(page, 'How much does parking cost at KLIA?');
      const more = turn.getByRole('button', { name: /^Show \d+ more items?$/ });
      await expect(more).toBeVisible();
      await expect(more).toHaveAttribute('aria-expanded', 'false');
      const region = page.locator(`[id="${await more.getAttribute('aria-controls')}"]`);
      await expect(region).toBeHidden();
      await expect(turn.locator('[data-rate-line]:visible')).toHaveCount(2);
      const collapsed = (await turn.boundingBox())?.height ?? 0;
      await more.click();
      await expect(turn.getByRole('button', { name: 'Show less' })).toHaveAttribute('aria-expanded', 'true');
      await expect(region).toBeVisible();
      await expect(region.getByText('Talk to a person', { exact: false }).or(region.getByRole('list', { name: 'Official contacts' })).first()).toBeVisible();
      expect((await turn.boundingBox())?.height ?? 0).toBeGreaterThan(collapsed);
      expect(collapsed, 'the collapsed answer fits about one phone screen').toBeLessThan(900);
    });
  });

  test('on a wide screen the whole answer shows and there is no "More" button', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/en/concierge');
    const turn = await ask(page, 'How much does parking cost at KLIA?');
    await expect(turn.getByRole('button', { name: /^Show \d+ more/ })).toBeHidden();
    // Three figures, each with the parking page's sentence, and Preferred Parking "No price published".
    await expect(turn.locator('[data-rate-line]:visible')).toHaveCount(3);
    await expect(turn.getByText('No price published.', { exact: true })).toBeVisible();
  });

  test('in Malay: a Malay name, and "tandas OKU" and a named airline are honoured', async ({ page }) => {
    await page.goto('/ms/concierge');
    await expect(page.getByRole('heading', { level: 1, name: 'Tanya Kami' })).toBeVisible();
    const toilet = await ask(page, 'Di mana tandas OKU di KLIA berhampiran pintu C?', 'ms');
    // Round 6, intended change: gate C is in Terminal 1, so the answer names the terminal.
    await expect(toilet.getByText('Lokasi tandas OKU di KLIA Terminal 1 belum diterbitkan dalam sumber kami.', { exact: true })).toBeVisible();
    const wheelchair = await ask(page, 'kerusi roda untuk penerbangan AirAsia di KLIA T2', 'ms');
    await expect(wheelchair.getByText(/^Peraturan bantuan AirAsia tidak diterbitkan dalam sumber kami\./)).toBeVisible();
    await expect(wheelchair.getByText('Bilik Tenang')).toHaveCount(0);
  });
});

test.describe('search relevance (6.1.5)', () => {
  test('repeated titles name their terminal, and topic gaps answer honestly', async ({ page }) => {
    await page.goto('/en/search?q=fast%20track');
    const main = page.getByRole('main');
    await expect(main.getByRole('link', { name: /Fast Track \(Terminal 1\)/ })).toBeVisible({ timeout: 30_000 });
    await expect(main.getByRole('link', { name: /Fast Track \(Terminal 2\)/ })).toBeVisible();

    for (const [query, first] of [
      ['smoking', 'Smoking rooms: not published yet'],
      ['wifi', 'Wi-Fi: not published yet'],
      ['accessible toilet', 'Accessible toilets: not published yet'],
    ] as const) {
      await page.goto(`/en/search?q=${encodeURIComponent(query)}`);
      await expect(main.getByRole('link', { name: new RegExp(first.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')) }).first()).toBeVisible({ timeout: 30_000 });
    }
    await page.goto('/en/search?q=taxi');
    await expect(main.getByRole('link', { name: /Airport taxi/ }).first()).toBeVisible({ timeout: 30_000 });
    await expect(main.getByRole('link', { name: /How much liquid/ })).toHaveCount(0);
  });

  test('the home field\'s "parking" suggestion leads with the parking page', async ({ page }) => {
    await page.goto('/en');
    const box = page.getByRole('search').first().getByRole('searchbox');
    await box.fill('parking');
    await expect(page.getByRole('link', { name: 'See all results for "parking"' })).toBeVisible({ timeout: 30_000 });
    const first = page.locator('#flight-search section').filter({ hasText: 'See all results' }).getByRole('listitem').first();
    await expect(first).toContainText('Parking at KLIA: prices and car parks', { timeout: 15_000 });
    await expect(first).not.toContainText('Preferred Parking');
  });
});
