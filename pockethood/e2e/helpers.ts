import type { Page } from '@playwright/test';

type W = Window & {
  __pockethood: { getState(): { game: Record<string, any>; dispatch(a: unknown): unknown; setUI(p: unknown): void } };
  __pockethoodClock: { advance(ms: number): void };
};

export async function boot(page: Page) {
  await page.goto('/');
  await page.waitForSelector('.hud', { timeout: 120_000 });
  // Keep the software renderer as light as possible during tests.
  await page.evaluate(() => (window as unknown as W).__pockethood.getState().dispatch({ type: 'settings', patch: { graphics: 'low', reducedMotion: true } }));
}

export const game = (page: Page) => page.evaluate(() => (window as unknown as W).__pockethood.getState().game);

export async function skipTime(page: Page, ms: number) {
  await page.evaluate((ms) => {
    const w = window as unknown as W;
    w.__pockethoodClock.advance(ms);
    w.__pockethood.getState().dispatch({ type: 'tick' });
  }, ms);
}

/** Close any dialogue/modal currently on screen. */
export async function dismiss(page: Page) {
  for (let i = 0; i < 8; i++) {
    const modal = page.locator('.modal-wrap .btn').last();
    if (await modal.count()) {
      await modal.click({ force: true });
      continue;
    }
    const dlg = page.locator('.dialogue .dialogue__actions .btn').last();
    if (await dlg.count()) {
      await dlg.click({ force: true });
      continue;
    }
    break;
  }
}
