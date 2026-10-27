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

test('loads into Kampung Seri with Uncle Lim’s introduction', async ({ page }) => {
  await boot(page);
  await expect(page.locator('.dialogue')).toContainText('Uncle Lim');
  await expect(page.locator('#hud-coins')).toContainText('150');
  await expect(page.locator('canvas')).toBeVisible();
  const g = await game(page);
  expect(g.buildings.some((b: { type: string }) => b.type === 'starter_house')).toBe(true);
  expect(g.world.id).toBe('my.kampung_seri');
});

test('guided tutorial: collect → open kopitiam → brew → deliver → upgrade', async ({ page }) => {
  await boot(page);
  await dismiss(page);
  await page.locator('.bubble--ready[data-building="starter_house"]').click({ force: true });
  await expect.poll(async () => (await game(page)).quests.done).toContain('welcome');
  await dismiss(page);

  await page.locator('[data-tutorial="nav-build"]').click();
  await page.locator('[data-tutorial="card-cafe"]').click({ force: true });
  await page.locator('[data-tutorial="place-confirm"]').click({ force: true });
  await skipTime(page, 6_000);
  await expect.poll(async () => (await game(page)).quests.done).toContain('reopen_kopitiam');
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
  await expect.poll(async () => (await game(page)).quests.done).toContain('kopitiam_upgrade');
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
    ['nav-community', 'Our Neighbourhood'],
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

const selectType = (page: import('@playwright/test').Page, type: string) =>
  page.evaluate((t) => {
    const st = (window as any).__pockethood.getState();
    st.setUI({ selected: st.game.buildings.find((b: { type: string }) => b.type === t).uid, panel: null });
  }, type);

async function richGame(page: import('@playwright/test').Page) {
  await page.evaluate(() => {
    const S = (window as any).__pockethood;
    S.getState().dispatch({ type: 'tutorial', skip: true });
    S.setState({ game: { ...S.getState().game, coins: 5000, level: 4, xp: 700 } });
    S.getState().dispatch({ type: 'place', building: 'cafe', x: 14, z: 15, rot: 0 });
  });
  await skipTime(page, 6_000);
  await dismiss(page);
}

test('switching to Bahasa Melayu translates the interface and the world', async ({ page }) => {
  await boot(page);
  await dismiss(page);
  await page.getByRole('button', { name: 'Settings' }).click();
  await page.getByRole('button', { name: 'Bahasa Melayu' }).click();
  await page.keyboard.press('Escape');
  await expect(page.locator('[data-tutorial="nav-build"]')).toContainText('Bina');
  await expect.poll(async () => (await game(page)).settings.locale).toBe('ms');
  await page.locator('[data-tutorial="nav-orders"]').click({ force: true });
  await expect(page.getByRole('dialog', { name: 'Papan Pesanan' })).toBeVisible();
});

test('hand-preparing teh tarik at the kopitiam module', async ({ page }) => {
  await boot(page);
  await dismiss(page);
  await richGame(page);
  await selectType(page, 'cafe');
  await expect(page.locator('.sheet')).toContainText('Kopitiam Lim');
  await expect(page.locator('.sheet')).toContainText('Fictional business');
  await page.locator('.sheet').getByRole('button', { name: 'Start' }).click({ force: true });
  for (const step of ['Pour', 'Pull', 'Pull', 'Serve']) await page.locator('.prep-pads').getByRole('button', { name: step }).click({ force: true });
  await expect.poll(async () => (await game(page)).inventory['my.food.kopitiam_lim/teh_tarik']).toBe(1);
});

test('Zen Mode hides currencies and objectives', async ({ page }) => {
  await boot(page);
  await dismiss(page);
  await expect(page.locator('#hud-coins')).toBeVisible();
  await page.evaluate(() => (window as any).__pockethood.getState().dispatch({ type: 'settings', patch: { zen: true } }));
  await expect(page.locator('#hud-coins')).toHaveCount(0);
  await expect(page.locator('.tracker')).toHaveCount(0);
  await expect(page.locator('.zen-pill')).toBeVisible();
});

test('switching a module off falls back to the neutral shop without losing anything', async ({ page }) => {
  await boot(page);
  await dismiss(page);
  await richGame(page);
  await page.evaluate(() => (window as any).__pockethood.getState().dispatch({ type: 'produce', uid: (window as any).__pockethood.getState().game.buildings.find((b: { type: string }) => b.type === 'cafe').uid, recipe: 'my.food.kopitiam_lim/kopi_o' }));
  await page.evaluate(() => (window as any).__pockethood.getState().setUI({ activity: { kind: 'studio' } }));
  await page.getByRole('tab', { name: 'Modules' }).click();
  await page.locator('.card', { hasText: 'my.food.kopitiam_lim' }).getByRole('button', { name: /Switch off/ }).click();
  await page.keyboard.press('Escape');
  await selectType(page, 'cafe');
  await expect(page.locator('.sheet h2')).toHaveText('Coffee Shop');
  const g = await game(page);
  expect(g.buildings.find((b: { type: string }) => b.type === 'cafe').queue[0].out.item).toBe('my.food.kopitiam_lim/kopi_o');
});

test('a shared snapshot link opens read-only and never touches the visitor’s save', async ({ page }) => {
  await boot(page);
  await dismiss(page);
  await page.locator('.bubble--ready[data-building="starter_house"]').click({ force: true });
  await expect.poll(async () => (await game(page)).coins).toBe(188);
  const link = await page.evaluate(async () => {
    const { encodeVisit, visitLink } = await import('/src/services/visit.ts');
    const g = (window as any).__pockethood.getState().game;
    return visitLink(encodeVisit({ ...g, profile: { ...g.profile, hoodName: 'Kampung Kawan' } }));
  });
  expect(link).not.toContain('coins');
  await page.waitForTimeout(1500);
  await page.goto(link);
  await page.waitForSelector('.hud', { timeout: 120_000 });
  await expect(page.locator('.visit-banner')).toContainText('Kampung Kawan');
  await page.goto('/');
  await page.waitForSelector('.hud', { timeout: 120_000 });
  expect((await game(page)).coins).toBe(188);
});

test('the soundtrack starts on the first tap and follows what you do', async ({ page }) => {
  await boot(page);
  await dismiss(page);
  await page.mouse.click(560, 380);
  await expect.poll(async () => page.evaluate(() => (window as any).__pockethoodAudio.musicState?.mood), { timeout: 15_000 }).toBe('town');
  // Opening the build menu moves the music to its construction arrangement at the next bar line.
  await page.locator('[data-tutorial="nav-build"]').click({ force: true });
  await expect.poll(async () => page.evaluate(() => (window as any).__pockethoodAudio.musicState?.mood), { timeout: 15_000 }).toBe('build');
  const bar = await page.evaluate(() => (window as any).__pockethoodAudio.musicState.bar);
  expect(bar).toBeGreaterThan(0); // the song kept going rather than restarting
  // Zen Mode switches to the calm arrangement.
  await page.keyboard.press('Escape');
  await page.evaluate(() => (window as any).__pockethood.getState().dispatch({ type: 'settings', patch: { zen: true } }));
  await expect.poll(async () => page.evaluate(() => (window as any).__pockethoodAudio.musicState?.mood), { timeout: 15_000 }).toBe('zen');
});

test('giving to the pocket park changes it for everyone', async ({ page }) => {
  await boot(page);
  await dismiss(page);
  await page.evaluate(() => {
    const S = (window as any).__pockethood;
    S.getState().dispatch({ type: 'tutorial', skip: true });
    S.setState({ game: { ...S.getState().game, coins: 400, level: 2, xp: 120 } });
  });
  await dismiss(page);
  await page.locator('[data-tutorial="nav-community"]').click({ force: true });
  const park = page.locator('.spot-card[data-spot="park"]');
  await expect(park).toContainText('Taman Poket');
  await park.getByRole('button', { name: 'Give all I can' }).click();
  await expect.poll(async () => (await game(page)).spots.park.stage).toBe(1);
  expect((await game(page)).coins).toBe(340);
  await expect(park).toContainText('Step 2 of 4');
});

test('neighbourhood names outside the content policy are politely refused', async ({ page }) => {
  await boot(page);
  await dismiss(page);
  await page.locator('.profile-chip').click({ force: true });
  const field = page.locator('#hname');
  await field.fill('Vote Street');
  await field.press('Enter');
  await expect(page.locator('.toast')).toContainText('pick a different name');
  expect((await game(page)).profile.hoodName).toBe('Kampung Seri');
  await field.fill('Taman Ceria');
  await field.press('Enter');
  await expect.poll(async () => (await game(page)).profile.hoodName).toBe('Taman Ceria');
});
