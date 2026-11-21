import { expect, test, type Page } from '@playwright/test';

/**
 * Round 5, package "speed" (docs/qa/fixes/round5-speed.md): the concierge's flights from the
 * server feed (B-09), icons as plain SVG (E-03, A-09), the header tooltip without Radix, the
 * concierge copy left out of other pages (E-11) and the home's type scale (A-14).
 */

async function ask(page: Page, question: string) {
  const input = page.getByRole('textbox', { name: 'Your question' });
  // Typing before hydration is kept by the browser; retry until the answer starts.
  await expect(async () => {
    await input.fill(question);
    await input.press('Enter');
    await expect(page.getByRole('log').getByText(`You asked: ${question}`, { exact: false }).last()).toBeVisible({ timeout: 3000 });
  }).toPass({ timeout: 20_000 });
}

async function feedFlight(page: Page, lang: 'en' | 'ms') {
  const date = await page.evaluate(() => new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }).format(new Date()));
  const response = await page.request.get(`/${lang}/flights/feed?date=${date}&dir=d&airports=kul`);
  expect(response.ok()).toBe(true);
  const { days } = (await response.json()) as { days: { flights: { number: string; id: string }[] }[] };
  return days[0].flights[Math.min(5, days[0].flights.length - 1)];
}

test.describe('concierge flights come from the flight feed (B-09)', () => {
  test('an on-device answer about a flight reads the feed and keeps the demo label', async ({ page }) => {
    const feed: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/flights/feed')) feed.push(new URL(request.url()).pathname);
    });
    await page.goto('/en/concierge');
    const flight = await feedFlight(page, 'en');
    feed.length = 0;
    const number = flight.number.replace(/\s+/g, '');
    await ask(page, `Is ${number} delayed?`);
    const log = page.getByRole('log');
    await expect(log.getByText(/demonstration data/i).first()).toBeVisible({ timeout: 15_000 });
    await expect(log.getByText(new RegExp(number.replace(/^([A-Z0-9]{2})(\d+)$/, '$1\\s?$2'))).first()).toBeVisible();
    // Answered on this device (no consent given), with the boards from the batched feed route.
    await expect(log.getByText('Answered on this device').first()).toBeVisible();
    expect(feed.some((path) => path === '/en/flights/feed')).toBe(true);
  });

  test('when the feed cannot be reached, the answer says so instead of "not found"', async ({ page }) => {
    await page.goto('/en/concierge');
    const flight = await feedFlight(page, 'en');
    await page.route('**/flights/feed**', (route) => route.abort('internetdisconnected'));
    const number = flight.number.replace(/\s+/g, '');
    await ask(page, `Is ${number} on time?`);
    const log = page.getByRole('log');
    await expect(log.getByText(/Flight information could not be loaded just now/).filter({ visible: true }).first()).toBeVisible({ timeout: 15_000 });
    await expect(log.getByText(/could not find .* on the demonstration boards/)).toHaveCount(0);
  });

  test('Malay: the same honest message', async ({ page }) => {
    await page.goto('/ms/concierge');
    const flight = await feedFlight(page, 'ms');
    await page.route('**/flights/feed**', (route) => route.abort('internetdisconnected'));
    const number = flight.number.replace(/\s+/g, '');
    const input = page.getByRole('textbox', { name: 'Soalan anda' });
    await expect(async () => {
      await input.fill(`Apakah status ${number}?`);
      await input.press('Enter');
      await expect(page.getByRole('log').getByText(/Maklumat penerbangan tidak dapat dimuatkan sekarang/).filter({ visible: true }).first()).toBeVisible({ timeout: 8000 });
    }).toPass({ timeout: 30_000 });
  });

  test('the server route answers flights from the feed too', async ({ request }) => {
    const date = new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Kuala_Lumpur' }).format(new Date());
    const { days } = (await (await request.get(`/en/flights/feed?date=${date}&dir=d&airports=kul`)).json()) as { days: { flights: { number: string }[] }[] };
    const number = days[0].flights[3].number.replace(/\s+/g, '');
    const response = await request.post('/api/concierge', {
      headers: { 'Content-Type': 'application/json', Origin: new URL(test.info().project.use.baseURL ?? 'http://localhost:3100').origin, 'Sec-Fetch-Site': 'same-origin' },
      data: { question: `Is ${number} delayed?`, lang: 'en', airport: 'kul' },
    });
    expect(response.status()).toBe(200);
    const body = (await response.json()) as { answer: { demo: boolean; cards: { type: string; number?: string }[] } };
    expect(body.answer.demo).toBe(true);
    expect(body.answer.cards.some((card) => card.type === 'flight')).toBe(true);
  });
});

test.describe('shared JavaScript and HTML (E-03, E-11)', () => {
  test('icons are plain SVG pointing at one sprite, not client components', async ({ page, request }) => {
    const html = await (await request.get('/en/guides/departing')).text();
    // lucide-react 1.x sent every icon's geometry in the page data as a client component's props.
    expect(html).not.toContain('\\"node\\":[[\\"path\\"');
    const hrefs = [...html.matchAll(/<use href="([^"#]+)#([a-z0-9-]+)"/g)];
    expect(hrefs.length).toBeGreaterThan(10);
    expect(new Set(hrefs.map((match) => match[1])).size).toBe(1);
    const sprite = await request.get(hrefs[0][1]);
    expect(sprite.status()).toBe(200);
    expect(sprite.headers()['content-type']).toContain('image/svg+xml');
    const body = await sprite.text();
    for (const [, , name] of hrefs) expect(body).toContain(`<symbol id="${name}" viewBox="0 0 24 24">`);
    await page.goto('/en/guides/departing');
    const icon = page.locator('main svg[aria-hidden="true"]').filter({ visible: true }).first();
    await expect(icon).toHaveAttribute('viewBox', '0 0 24 24');
    // Drawn: the referenced symbol has a size once the sprite has loaded.
    await expect.poll(async () => icon.locator('use').evaluate((element) => (element as SVGGraphicsElement).getBBox().width)).toBeGreaterThan(0);
  });

  test('the concierge copy is sent with the concierge page only', async ({ request }) => {
    const marker = 'Anthropic’s Claude model';
    expect(await (await request.get('/en/guides')).text()).not.toContain(marker);
    expect(await (await request.get('/en')).text()).not.toContain(marker);
    expect(await (await request.get('/en/concierge')).text()).toContain(marker);
  });

  test('the concierge panel loads its copy when opened', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'the header launcher is on desktop');
    await page.goto('/en/guides');
    const launcher = page.getByRole('banner').getByRole('button', { name: 'Ask the concierge' });
    await expect(async () => {
      await launcher.click({ timeout: 3000 });
      await expect(page.getByRole('dialog', { name: 'Concierge' })).toBeVisible({ timeout: 3000 });
    }).toPass({ timeout: 20_000 });
    const dialog = page.getByRole('dialog', { name: 'Concierge' });
    await expect(dialog.getByRole('textbox', { name: 'Your question' })).toBeVisible({ timeout: 15_000 });
    await expect(dialog.getByText('Try asking')).toBeVisible();
    await expect(dialog.getByText(/^conciergePage\./)).toHaveCount(0);
  });
});

test.describe('header tooltip without Radix (WCAG 1.4.13)', () => {
  test('shows on hover and keyboard focus, describes the button, closes with Escape', async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== 'desktop', 'tooltips are not shown on touch');
    await page.goto('/en');
    const search = page.getByRole('banner').getByRole('button', { name: 'Open search' });
    await expect(async () => {
      await page.mouse.move(5, 500);
      await search.hover();
      await expect(page.getByRole('tooltip')).toBeVisible({ timeout: 2000 });
    }).toPass({ timeout: 20_000 });
    const tooltip = page.getByRole('tooltip');
    await expect(tooltip).toContainText('Ctrl K');
    await expect(search).toHaveAttribute('aria-describedby', (await tooltip.getAttribute('id')) ?? 'missing');
    // Hoverable: moving onto the tooltip keeps it open.
    const box = await tooltip.boundingBox();
    if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2, { steps: 4 });
    await expect(tooltip).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('tooltip')).toHaveCount(0);
    // Inside the window.
    await page.mouse.move(5, 500);
    await search.focus();
    await page.keyboard.press('Shift+Tab');
    await page.keyboard.press('Tab');
    await expect(page.getByRole('tooltip')).toBeVisible();
    const focused = await page.getByRole('tooltip').boundingBox();
    expect(focused && focused.x + focused.width).toBeLessThanOrEqual(1440);
  });
});

test.describe('home type scale (A-14)', () => {
  for (const lang of ['en', 'ms'] as const) {
    test(`/${lang} uses at most 8 type sizes on a phone (the A-14 count)`, async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== 'phone', 'measured at 390 px, as A-14 counts it');
      await page.goto(`/${lang}`);
      await page.waitForLoadState('networkidle');
      const sizes = await page.evaluate(() => {
        const main = document.querySelector('main')!;
        const visible = (element: Element) => element.getBoundingClientRect().height > 0;
        return [...new Set([...main.querySelectorAll('*')].filter((element) => visible(element) && [...element.childNodes].some((node) => node.nodeType === 3 && node.textContent?.trim())).map((element) => getComputedStyle(element).fontSize))];
      });
      expect(sizes.length, sizes.join(' ')).toBeLessThanOrEqual(8);
    });
  }
});
