import AxeBuilder from '@axe-core/playwright';
import { expect, test, type Page } from '@playwright/test';

/**
 * Concierge journeys: the full page and the panel, consent, grounded answers with provenance
 * and sources, the clarifying question, demo flight labelling, the in-browser fallback when the
 * API is unreachable, and the API contract.
 *
 * Conventions follow e2e/smoke.spec.ts (getByRole, fresh storage per test, axe with the WCAG
 * 2.2 AA tags). Answers come from the content layer, so assertions check structure and labels
 * rather than exact facts that content authors may update.
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
  test('asks for consent, answers with provenance and sources, and clears', async ({ page }) => {
    await page.goto('/en/concierge');
    await expect(page.getByRole('heading', { level: 1, name: 'Ask the concierge' })).toBeVisible();
    await expect(page).toHaveTitle(/Ask the concierge/);
    await expect(page.getByRole('navigation', { name: /breadcrumb/i })).toBeVisible();
    const agree = page.getByRole('button', { name: 'Agree and start' });
    await expect(agree).toBeVisible();
    await expectNoAxeViolations(page);

    await agree.click();
    await page.getByRole('button', { name: 'What is the cheapest way to get to KL Sentral?' }).click();
    const log = answerIn(page);
    await expect(log.getByRole('heading', { level: 3, name: /cheapest way to get to KL Sentral/ })).toBeVisible();
    await expect(log.getByText(/published fare|our sources list/).first()).toBeVisible({ timeout: 30_000 });
    await expect(log.getByRole('list', { name: 'Details' }).getByText(/Official|Estimated|Suggestion/).first()).toBeVisible();
    await expect(log.getByText(/\d+ sources?/).first()).toBeVisible();
    await expect(log.getByText(/From verified content|Worded by AI from verified content|Answered on this device/)).toBeVisible();
    await expectNoAxeViolations(page);
    await expectNoHorizontalOverflow(page);

    await page.getByRole('button', { name: 'Clear conversation' }).click();
    await expect(page.getByRole('button', { name: 'What is the cheapest way to get to KL Sentral?' })).toBeVisible();
  });

  test('asks which airport when the question needs one, then answers', async ({ page }) => {
    await page.goto('/en/concierge');
    await page.getByRole('button', { name: 'Agree and start' }).click();
    await page.getByRole('button', { name: 'Where is the nearest prayer room?' }).click();
    const choose = answerIn(page).getByRole('group', { name: 'Choose an airport' });
    await expect(choose).toBeVisible({ timeout: 30_000 });
    await choose.getByRole('button', { name: 'KLIA Terminal 1' }).click();
    await expect(page.getByRole('button', { name: /Stop answering for KLIA Terminal 1/ })).toBeVisible({ timeout: 30_000 });
    await expect(answerIn(page).getByText('Published for KLIA Terminal 1', { exact: false })).toBeVisible();
  });

  test('keeps working in the browser when the concierge service is unreachable', async ({ page }) => {
    await page.route('**/api/concierge', (route) => route.abort('internetdisconnected'));
    await page.goto('/en/concierge');
    await page.getByRole('button', { name: 'Agree and start' }).click();
    await page.getByRole('textbox', { name: 'Your question' }).fill('How do I get from Terminal 1 to Terminal 2?');
    await page.getByRole('button', { name: 'Ask', exact: true }).click();
    await expect(answerIn(page).getByText('Answered on this device')).toBeVisible({ timeout: 45_000 });
    await expect(answerIn(page).getByText(/Terminal 1/).first()).toBeVisible();
  });

  test('labels a flight from the demo provider as demonstration data', async ({ page, request }) => {
    const board = await request.get('/api/flights?airport=kul&direction=d&limit=1');
    const { flights } = (await board.json()) as { flights: { number: string }[] };
    test.skip(flights.length === 0, 'no demo departures');
    await page.goto('/en/concierge');
    await page.getByRole('button', { name: 'Agree and start' }).click();
    await page.getByRole('textbox', { name: 'Your question' }).fill(`Where do I check in for ${flights[0].number}?`);
    await page.getByRole('button', { name: 'Ask', exact: true }).click();
    await expect(answerIn(page).getByText('This answer includes simulated flight data', { exact: false })).toBeVisible({ timeout: 30_000 });
    await expect(answerIn(page).getByText('Demo', { exact: true }).first()).toBeVisible();
  });

  test('works in Bahasa Malaysia', async ({ page }) => {
    await page.goto('/ms/concierge');
    await expect(page.locator('html')).toHaveAttribute('lang', 'ms');
    await expect(page.getByRole('heading', { level: 1, name: 'Tanya concierge' })).toBeVisible();
    await page.getByRole('button', { name: 'Setuju dan mula' }).click();
    await page.getByRole('button', { name: 'Bagaimana saya pergi dari Terminal 1 ke Terminal 2?' }).click();
    await expect(page.getByRole('log', { name: 'Perbualan' }).getByText(/sumber kami/).first()).toBeVisible({ timeout: 30_000 });
    await expectNoAxeViolations(page);
  });
});

test.describe('concierge panel', () => {
  test('opens from the shell, answers and keeps the question field in reach', async ({ page }) => {
    await page.goto('/en/kul');
    const panel = await openPanel(page);
    await panel.getByRole('button', { name: 'Agree and start' }).click();
    await panel.getByRole('button', { name: 'How do I get from Terminal 1 to Terminal 2?' }).click();
    await expect(panel.getByRole('log', { name: 'Conversation' }).getByText(/To travel between/)).toBeVisible({ timeout: 30_000 });
    await expect(panel.getByRole('textbox', { name: 'Your question' })).toBeInViewport();
    await expectNoAxeViolations(page);
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: 'Concierge' })).toBeHidden();
  });
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
