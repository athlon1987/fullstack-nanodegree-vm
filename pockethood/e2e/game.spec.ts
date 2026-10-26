import { expect, test } from '@playwright/test';
import { boot, dismiss, game, skipTime } from './helpers';

test.beforeEach(async ({ page }) => {
  await page.goto('/');
  await page.evaluate(async () => {
    localStorage.clear();
    await new Promise((r) => {
      const req = indexedDB.deleteDatabase('keyval-store');
      req.onsuccess = req.onerror = req.onblocked = () => r(null);
    });
  });
});

test('loads into a playable neighborhood with Mia’s introduction', async ({ page }) => {
  await boot(page);
  await expect(page.locator('.dialogue')).toContainText('Mia');
  await expect(page.locator('#hud-coins')).toContainText('150');
  await expect(page.locator('canvas')).toBeVisible();
  const g = await game(page);
  expect(g.buildings.some((b: { type: string }) => b.type === 'starter_house')).toBe(true);
});

test('guided tutorial: collect → build café → brew → deliver → upgrade', async ({ page }) => {
  await boot(page);
  await dismiss(page);
  await page.locator('.bubble--ready[data-building="starter_house"]').click({ force: true });
  await expect.poll(async () => (await game(page)).quests.done).toContain('welcome');
  await dismiss(page);

  await page.locator('[data-tutorial="nav-build"]').click();
  await page.locator('[data-tutorial="card-cafe"]').click({ force: true });
  await page.locator('[data-tutorial="place-confirm"]').click({ force: true });
  await skipTime(page, 6_000);
  await expect.poll(async () => (await game(page)).quests.done).toContain('open_cafe');
  await dismiss(page);

  for (let i = 0; i < 3; i++) {
    await page.evaluate(() => {
      const st = (window as any).__pockethood.getState();
      st.setUI({ selected: st.game.buildings.find((b: { type: string }) => b.type === 'cafe').uid });
    });
    await page.locator('[data-tutorial="recipe-coffee"]').click({ force: true });
    await page.locator('.sheet .round-btn').click({ force: true });
    await skipTime(page, 16_000);
    await page.locator('.bubble--ready[data-building="cafe"]').click({ force: true });
    await dismiss(page);
  }
  await expect.poll(async () => (await game(page)).quests.done).toContain('first_brew');

  await dismiss(page);
  await page.locator('[data-tutorial="nav-orders"]').click();
  await page.locator('[data-tutorial="deliver"]').first().click({ force: true });
  await expect.poll(async () => (await game(page)).quests.done).toContain('first_order');
  await dismiss(page);
  await page.keyboard.press('Escape');
  await dismiss(page);

  await page.evaluate(() => {
    const st = (window as any).__pockethood.getState();
    st.setUI({ selected: st.game.buildings.find((b: { type: string }) => b.type === 'cafe').uid });
  });
  await page.locator('[data-tutorial="upgrade"]').click({ force: true });
  await skipTime(page, 15_000);
  await expect.poll(async () => (await game(page)).buildings.find((b: { type: string }) => b.type === 'cafe').level).toBe(2);
  await expect.poll(async () => (await game(page)).quests.done).toContain('cafe_upgrade');
});

test('progress persists across a reload', async ({ page }) => {
  await boot(page);
  await dismiss(page);
  await page.locator('.bubble--ready[data-building="starter_house"]').click({ force: true });
  await expect.poll(async () => (await game(page)).coins).toBe(188);
  await page.waitForTimeout(1500); // debounced autosave
  await page.reload();
  await page.waitForSelector('.hud', { timeout: 120_000 });
  const g = await game(page);
  expect(g.coins).toBe(188);
  expect(g.quests.done).toContain('welcome');
});

test('every main panel opens and closes', async ({ page }) => {
  await boot(page);
  await dismiss(page);
  for (const [nav, title] of [
    ['nav-build', 'Build'],
    ['nav-orders', 'Request Board'],
    ['nav-residents', 'Neighbors'],
    ['nav-inventory', 'Storage'],
    ['nav-friends', 'Friends & Hoods'],
  ]) {
    await page.locator(`[data-tutorial="${nav}"]`).click({ force: true });
    await expect(page.getByRole('dialog', { name: title })).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog', { name: title })).toHaveCount(0);
  }
  await page.getByRole('button', { name: 'Settings' }).click();
  await expect(page.getByRole('dialog', { name: 'Settings' })).toBeVisible();
  await expect(page.getByText('Online play is coming in a later update')).toHaveCount(0);
});

test('placement explains invalid spots and refuses them', async ({ page }) => {
  await boot(page);
  await dismiss(page);
  await page.evaluate(() => (window as any).__pockethood.getState().setUI({ placing: { type: 'bush', x: 12, z: 15, rot: 0 } }));
  await expect(page.locator('.placebar')).toContainText('Something is in the way');
  await expect(page.locator('[data-tutorial="place-confirm"]')).toBeDisabled();
  await page.evaluate(() => (window as any).__pockethood.getState().setUI({ placing: { type: 'bush', x: 14, z: 10, rot: 0 } }));
  await expect(page.locator('.placebar')).toContainText('Looks good');
  await page.locator('[data-tutorial="place-confirm"]').click({ force: true });
  await expect.poll(async () => (await game(page)).buildings.filter((b: { type: string }) => b.type === 'bush').length).toBe(5);
});

test('mobile layout fits the screen', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await boot(page);
  await dismiss(page);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth);
  expect(overflow).toBe(false);
  const bar = await page.locator('.bottombar').boundingBox();
  expect(bar!.x).toBeGreaterThanOrEqual(0);
  expect(bar!.x + bar!.width).toBeLessThanOrEqual(390);
});
