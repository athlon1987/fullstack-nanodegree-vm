import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';
import { AXE_TAGS as SHARED_AXE_TAGS } from './support/axe';

/**
 * Concierge journeys: the full page and the panel, answers on this device before any consent
 * (fix round B, B-15), the opt-in for the concierge service, grounded answers with provenance
 * and sources, the clarifying question, demo flight labelling, the in-browser fallback when the
 * API is unreachable, the composer staying in view (B-20), and the API contract.
 *
 * Conventions follow e2e/smoke.spec.ts (getByRole, fresh storage per test, axe with the WCAG
 * 2.2 AA tags). Answers come from the content layer, so assertions check structure and labels
 * rather than exact facts that content authors may update.
 */

const AXE_TAGS = [...SHARED_AXE_TAGS];
type AxePage = ConstructorParameters<typeof AxeBuilder>[0]['page'];

async function expectNoAxeViolations(page: Page) {
  // Round 6: scan the page at rest. After an answer the page scrolls smoothly to it, and a frame in
  // the middle of that scroll leaves the privacy row's button half under the sticky header, which
  // axe reports as target-size (G3 item 5: 3 of 30 repeats); at rest it is either clear of the
  // header or wholly behind it.
  await expect
    .poll(async () => {
      const before = await page.evaluate(() => window.scrollY);
      await page.waitForTimeout(250);
      return (await page.evaluate(() => window.scrollY)) === before;
    }, { timeout: 10_000 })
    .toBe(true);
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

/** Opens the panel from the header launcher, or from the menu on phones. */
async function openPanel(page: Page) {
  const launcher = page.getByRole('banner').getByRole('button', { name: 'Ask the concierge' });
  // Clicks before hydration do nothing, so retry the whole step with short timeouts.
  await expect(async () => {
    if (await launcher.isVisible()) await launcher.click({ timeout: 3000 });
    else {
      const menu = page.getByRole('dialog', { name: /menu/i });
      if (!(await menu.isVisible())) await page.getByRole('button', { name: 'Menu', exact: true }).click({ timeout: 3000 });
      await page.getByRole('dialog').getByRole('button', { name: 'Ask the concierge' }).click({ timeout: 3000 });
    }
    await expect(page.getByRole('dialog', { name: 'Concierge' })).toBeVisible({ timeout: 3000 });
  }).toPass({ timeout: 45_000 });
  return page.getByRole('dialog', { name: 'Concierge' });
}

const answerIn = (page: Page) => page.getByRole('log', { name: 'Conversation' });

test.describe.configure({ timeout: 90_000 });

test.describe('concierge page', () => {
  // Changed in fix round B (B-15): suggested questions answer at once on this device, with the
  // privacy line above them; consent is asked only to turn on the concierge service.
  test('answers a suggested question at once on this device, with sources, and clears', async ({ page }) => {
    const sent: string[] = [];
    page.on('request', (request) => {
      if (request.url().includes('/api/concierge')) sent.push(request.url());
    });
    await page.goto('/en/concierge');
    await expect(page.getByRole('heading', { level: 1, name: 'Ask the concierge' })).toBeVisible();
    await expect(page).toHaveTitle(/Ask the concierge/);
    await expect(page.getByRole('navigation', { name: /breadcrumb/i })).toBeVisible();
    await expect(page.getByText('Nothing you type is sent or stored.', { exact: false })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Agree and start' })).toHaveCount(0);
    await expectNoAxeViolations(page);

    await expect(async () => {
      await page.getByRole('button', { name: 'What is the cheapest way to get to KL Sentral?' }).click({ timeout: 3000 });
      await expect(answerIn(page).getByRole('heading', { level: 3 })).toHaveCount(1, { timeout: 3000 });
    }).toPass({ timeout: 30_000 });
    const log = answerIn(page);
    await expect(log.getByRole('heading', { level: 3, name: /cheapest way to get to KL Sentral/ })).toBeVisible();
    await expect(log.getByText(/published fare|our sources list/).first()).toBeVisible({ timeout: 30_000 });
    // Round 4 (6.1.4), intended change: on a phone the details sit behind "Show N more".
    const more = log.getByRole('button', { name: /^Show \d+ more items?$/ });
    if (await more.isVisible()) await more.click();
    await expect(log.getByRole('list', { name: 'Details' }).getByText(/Official|Estimated|Suggestion/).first()).toBeVisible();
    await expect(log.getByText(/\d+ sources?/).first()).toBeVisible();
    await expect(log.getByText('Answered on this device', { exact: true })).toBeVisible();
    await expect(log.getByText('Your question was not sent anywhere.', { exact: false })).toBeVisible();
    expect(sent, 'nothing is sent before the visitor opts in').toEqual([]);
    await expectNoAxeViolations(page);
    await expectNoHorizontalOverflow(page);

    // Opting in to the service is a separate, explained step.
    await page.getByRole('button', { name: 'AI wording and saved flight' }).click();
    await expect(page.getByRole('heading', { name: 'Turn on AI wording and saved-flight help' })).toBeVisible();
    await page.getByRole('button', { name: 'Agree and start' }).click();
    await expect(page.getByText('Your questions go to the concierge service', { exact: false })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Answer on this device only' })).toBeVisible();

    await page.getByRole('button', { name: 'Clear conversation' }).click();
    await expect(page.getByRole('button', { name: 'What is the cheapest way to get to KL Sentral?' })).toBeVisible();
  });

  test('asks which airport when the question needs one, then answers', async ({ page }) => {
    await page.goto('/en/concierge');
    await expect(async () => {
      await page.getByRole('button', { name: 'Where is the nearest prayer room?' }).click({ timeout: 3000 });
      await expect(answerIn(page).getByRole('heading', { level: 3 })).toHaveCount(1, { timeout: 3000 });
    }).toPass({ timeout: 30_000 });
    const choose = answerIn(page).getByRole('group', { name: 'Choose an airport' });
    await expect(choose).toBeVisible({ timeout: 30_000 });
    await choose.getByRole('button', { name: 'KLIA Terminal 1' }).click();
    await expect(page.getByRole('button', { name: /Stop answering for KLIA Terminal 1/ })).toBeVisible({ timeout: 30_000 });
    await expect(answerIn(page).getByText('Published for KLIA Terminal 1', { exact: false })).toBeVisible();
  });

  test('keeps working in the browser when the concierge service is unreachable', async ({ page }) => {
    await page.route('**/api/concierge', (route) => route.abort('internetdisconnected'));
    await page.goto('/en/concierge');
    // The service is used only after opting in.
    await expect(async () => {
      await page.getByRole('button', { name: 'AI wording and saved flight' }).click({ timeout: 3000 });
      await expect(page.getByRole('button', { name: 'Agree and start' })).toBeVisible({ timeout: 3000 });
    }).toPass({ timeout: 30_000 });
    await page.getByRole('button', { name: 'Agree and start' }).click();
    await page.getByRole('textbox', { name: 'Your question' }).fill('How do I get from Terminal 1 to Terminal 2?');
    await page.getByRole('button', { name: 'Ask', exact: true }).click();
    await expect(answerIn(page).getByText('Answered on this device', { exact: true })).toBeVisible({ timeout: 45_000 });
    await expect(answerIn(page).getByText(/Terminal 1/).first()).toBeVisible();
  });

  test('labels a flight from the demo provider as demonstration data', async ({ page, request }) => {
    const board = await request.get('/api/flights?airport=kul&direction=d&limit=1');
    const { flights } = (await board.json()) as { flights: { number: string }[] };
    test.skip(flights.length === 0, 'no demo departures');
    await page.goto('/en/concierge');
    await expect(async () => {
      await page.getByRole('textbox', { name: 'Your question' }).fill(`Where do I check in for ${flights[0].number}?`, { timeout: 3000 });
      await page.getByRole('button', { name: 'Ask', exact: true }).click({ timeout: 3000 });
      await expect(answerIn(page).getByRole('heading', { level: 3 })).toHaveCount(1, { timeout: 3000 });
    }).toPass({ timeout: 30_000 });
    await expect(answerIn(page).getByText('This answer includes simulated flight data', { exact: false })).toBeVisible({ timeout: 30_000 });
    await expect(answerIn(page).getByText('Demo', { exact: true }).filter({ visible: true }).first()).toBeVisible();
  });

  test('works in Bahasa Malaysia', async ({ page }) => {
    await page.goto('/ms/concierge');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ms');
    // Round 4 (6.1.10), intended change: the concierge has a Malay name, "Tanya Kami".
    await expect(page.getByRole('heading', { level: 1, name: 'Tanya Kami' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Susunan kata AI dan penerbangan simpanan' })).toBeVisible();
    await expect(async () => {
      await page.getByRole('button', { name: 'Bagaimana saya pergi dari Terminal 1 ke Terminal 2?' }).click({ timeout: 3000 });
      await expect(page.getByRole('log', { name: 'Perbualan' }).getByRole('heading', { level: 3 })).toHaveCount(1, { timeout: 3000 });
    }).toPass({ timeout: 30_000 });
    await expect(page.getByRole('log', { name: 'Perbualan' }).getByText(/sumber kami/).first()).toBeVisible({ timeout: 30_000 });
    await expectNoAxeViolations(page);
  });
});

test.describe('concierge panel', () => {
  test('opens from the shell, answers and keeps the question field in reach', async ({ page }) => {
    await page.goto('/en/kul');
    const panel = await openPanel(page);
    await panel.getByRole('button', { name: 'How do I get from Terminal 1 to Terminal 2?' }).click();
    await expect(panel.getByRole('log', { name: 'Conversation' }).getByText(/To travel between/)).toBeVisible({ timeout: 30_000 });
    await expect(panel.getByRole('textbox', { name: 'Your question' })).toBeInViewport();
    await expectNoAxeViolations(page);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Concierge' })).toBeHidden();
  });
});

test.describe('fix round B: concierge', () => {
  test('the privacy line and the question field are in the server HTML', async ({ request }) => {
    const html = await (await request.get('/en/concierge')).text();
    expect(html).toContain('Nothing you type is sent or stored.');
    expect(html).toMatch(/<input[^>]*placeholder="Type your question"/);
    // The opt-in is not rendered (its words are only in the client dictionary).
    expect(html).not.toMatch(/>Agree and start</);
  });

  test('loading the page shifts nothing (CLS at most 0.05)', async ({ page }) => {
    await page.addInitScript(() => {
      (window as unknown as { __cls: number }).__cls = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries() as unknown as { value: number; hadRecentInput: boolean }[]) {
          if (!entry.hadRecentInput) (window as unknown as { __cls: number }).__cls += entry.value;
        }
      }).observe({ type: 'layout-shift', buffered: true });
    });
    // A first visit to the site also swaps web fonts, which moves the footer on every page (A-10,
    // package A): warm the font cache once, then measure the concierge's own load.
    await page.goto('/en/concierge', { waitUntil: 'load' });
    await page.waitForTimeout(1500);
    // A second navigation (not a reload, which revalidates the fonts on a dev server).
    await page.goto('/en/concierge', { waitUntil: 'load' });
    await expect(page.getByRole('textbox', { name: 'Your question' })).toBeVisible();
    await page.waitForTimeout(1500);
    const cls = await page.evaluate(() => (window as unknown as { __cls: number }).__cls);
    expect(cls).toBeLessThanOrEqual(0.05);
  });

  for (const size of [
    { width: 1280, height: 800 },
    { width: 390, height: 844 },
  ]) {
    test(`the focused question field stays in view after each answer (${size.width}x${size.height})`, async ({ page }) => {
      await page.setViewportSize(size);
      await page.goto('/en/concierge');
      const field = page.getByRole('textbox', { name: 'Your question' });
      for (const [index, question] of ['How do I get from Terminal 1 to Terminal 2?', 'Is there free Wi-Fi at KLIA?'].entries()) {
        await expect(async () => {
          await field.fill(question, { timeout: 3000 });
          await field.press('Enter');
          await expect(answerIn(page).getByRole('heading', { level: 3 })).toHaveCount(index + 1, { timeout: 5000 });
        }).toPass({ timeout: 30_000 });
        await expect(answerIn(page).locator('[data-turn]').nth(index).getByText('Answered on this device', { exact: true })).toBeVisible({ timeout: 30_000 });
        await page.waitForTimeout(800);
        await expect(field).toBeFocused();
        await expect(field).toBeInViewport({ ratio: 1 });
      }
    });
  }
});

test.describe('concierge API', () => {
  test('validates input and answers with a mode', async ({ request }) => {
    const bad = await request.post('/api/concierge', { data: { question: '', lang: 'xx' } });
    expect(bad.status()).toBe(400);
    const ok = await request.post('/api/concierge', { data: { question: 'How do I get from Terminal 1 to Terminal 2?', lang: 'en' } });
    expect(ok.status()).toBe(200);
    const body = (await ok.json()) as { mode: string; answer: { statements: unknown[]; sources: unknown[] } };
    expect(['grounded', 'grounded-rephrased']).toContain(body.mode);
    expect(body.answer.sources.length).toBeGreaterThan(0);
  });
});
