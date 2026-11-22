import { expect, test, type Page, type TestInfo } from '@playwright/test';

/**
 * Verification round 7 (docs/qa/verification.md, "Round seven", S3 item 1): the redesigned phone
 * flight row (`flight-row.tsx`, one card per flight) must not paint its pieces over each other.
 * On the delivered build, a 360 px phone or 112 to 125% text made the badge and flight number run
 * under the gate block, the airport code slide under the status pill, and the flight link (the
 * city) collapse to 0 px. Every test sends its own client address (as A-03).
 */

const MORNING = new Date('2026-11-18T09:40:00+08:00');

async function ownClientAddress(page: Page, testInfo: TestInfo) {
  const key = `${testInfo.project.name}|${testInfo.titlePath.join('|')}|${testInfo.repeatEachIndex}|${testInfo.retry}`;
  let hash = 0;
  for (const char of key) hash = (hash * 31 + char.charCodeAt(0)) >>> 0;
  await page.setExtraHTTPHeaders({ 'x-e2e-client-ip': `10.217.${(hash >>> 8) % 250}.${(hash % 250) + 1}` });
}

test.beforeEach(async ({ page }, testInfo) => {
  await ownClientAddress(page, testInfo);
});

/** Per visible flight row: overlapping pieces, the flight link's width, and pieces outside the row. */
async function rowFaults(page: Page) {
  return page.evaluate(() => {
    const rows = [...document.querySelectorAll('main li')].filter(
      (li) => li.querySelector(':scope > div a[href*="/flights/"]') && li.getBoundingClientRect().height > 0,
    );
    const faults: string[] = [];
    for (const li of rows) {
      const row = li.getBoundingClientRect();
      const link = li.querySelector('a[href*="/flights/"]')!;
      if (link.getBoundingClientRect().width < 8) faults.push(`flight link ${Math.round(link.getBoundingClientRect().width)} px wide: ${link.getAttribute('aria-label')}`);
      // Every piece that paints text or an icon, its box clipped by any ancestor that clips (truncate).
      const pieces = [...li.querySelectorAll('*')]
        .filter((element) => {
          if (element.closest('.sr-only') || (element.closest('svg') && element.tagName !== 'svg')) return false;
          if (!element.checkVisibility({ visibilityProperty: true })) return false;
          return element.tagName === 'svg' || [...element.childNodes].some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim());
        })
        .map((element) => {
          const box = element.getBoundingClientRect();
          let left = box.left;
          let right = box.right;
          for (let parent = element.parentElement; parent && parent !== li; parent = parent.parentElement) {
            if (getComputedStyle(parent).overflowX !== 'visible') {
              const clip = parent.getBoundingClientRect();
              left = Math.max(left, clip.left);
              right = Math.min(right, clip.right);
            }
          }
          return { element, left, right, top: box.top, bottom: box.bottom };
        })
        .filter((piece) => piece.right - piece.left > 0 && piece.bottom - piece.top > 0);
      for (const piece of pieces) {
        if (piece.right > row.right + 1 || piece.left < row.left - 1) faults.push(`outside the row: "${piece.element.textContent?.trim()}"`);
      }
      for (let i = 0; i < pieces.length; i++) {
        for (let j = i + 1; j < pieces.length; j++) {
          const a = pieces[i];
          const b = pieces[j];
          if (a.element.contains(b.element) || b.element.contains(a.element)) continue;
          const x = Math.min(a.right, b.right) - Math.max(a.left, b.left);
          const y = Math.min(a.bottom, b.bottom) - Math.max(a.top, b.top);
          if (x > 1 && y > 1) faults.push(`"${a.element.textContent?.trim() || a.element.tagName}" over "${b.element.textContent?.trim() || b.element.tagName}"`);
        }
      }
    }
    return { rows: rows.length, faults };
  });
}

test.describe('phone flight rows do not overlap (round seven, S3 item 1)', () => {
  for (const [width, textSize] of [
    [360, 100],
    [390, 125],
  ] as const) {
    for (const lang of ['en', 'ms'] as const) {
      for (const [name, path] of [
        ['home preview', `/${lang}`],
        ['board', `/${lang}/kul/flights`],
      ] as const) {
        test(`${name}, ${lang}, ${width} px at ${textSize}% text`, async ({ page }) => {
          await page.clock.setFixedTime(MORNING);
          await page.addInitScript((size) => {
            localStorage.setItem('ma:airport:v1', JSON.stringify({ airport: 'kul' }));
            localStorage.setItem('ma:preferences:v1', JSON.stringify({ theme: 'light', textSize: size, highContrast: false, reducedMotion: true }));
          }, textSize);
          await page.setViewportSize({ width, height: 844 });
          await page.goto(path);
          await expect(page.locator('main li a[href*="/flights/"][href*="-20"]').filter({ visible: true }).first()).toBeVisible();
          const result = await rowFaults(page);
          expect(result.rows).toBeGreaterThan(0);
          expect(result.faults).toEqual([]);
        });
      }
    }
  }
});
