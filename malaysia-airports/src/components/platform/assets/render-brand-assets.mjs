/**
 * Renders the app icons and the Open Graph image from the brand mark
 * (`src/components/art/brand-mark.tsx`) with the site's own typefaces, using headless Chromium.
 * The outputs are committed; run this again only when the mark, the colours or the tagline change.
 *
 *   NODE_PATH=/opt/node-tools/node_modules node src/components/platform/assets/render-brand-assets.mjs
 *
 * Writes: src/app/icon.svg, src/app/icon1.png (192), src/app/icon2.png (512),
 * src/app/apple-icon.png (512, full bleed: Apple touch icon and the manifest's maskable icon),
 * src/app/[lang]/opengraph-image.png (1200 x 630) and its alt text.
 * Colours are tokens from globals.css, mirrored in `../brand.ts`.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const root = join(dirname(fileURLToPath(import.meta.url)), '../../../..');
const app = join(root, 'src/app');
const fonts = join(root, 'src/fonts');

const C = {
  primary: '#252a6c',
  inverse: '#181b3a',
  onPrimary: '#fbf6ea',
  onInverseDim: '#c2c0d6',
  gold: '#d2ac62',
};

/** The mark in its own 32-unit space (same paths as BrandMark). */
const mark = (stroke, gold, width = 2.2) =>
  `<g fill="none" stroke="${stroke}" stroke-width="${width}" stroke-linecap="square">` +
  `<path d="M3.5 27 16 9l12.5 18"/><path d="M10.5 27l5.5-8 5.5 8"/>` +
  `<path d="M16 1l2.6 3.2L16 7.4l-2.6-3.2z" fill="${gold}" stroke="none"/></g>`;

/** Rounded tile for `purpose: any` (transparent corners). The mark sits a touch high, optically centred. */
const tile = (size) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">` +
  `<rect width="512" height="512" rx="114" fill="${C.primary}"/>` +
  `<g transform="translate(256 252) scale(9.6) translate(-16 -14.5)">${mark(C.onPrimary, C.gold)}</g></svg>`;

/** Full-bleed square: the mark stays well inside the maskable safe zone (a circle of 80% diameter). */
const fullBleed = (size) =>
  `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 512 512">` +
  `<rect width="512" height="512" fill="${C.primary}"/>` +
  `<g transform="translate(256 250) scale(8.2) translate(-16 -14.5)">${mark(C.onPrimary, C.gold)}</g></svg>`;

/** Favicon: same tile, heavier strokes so the chevrons survive at 16 px. */
const favicon =
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32">` +
  `<rect width="32" height="32" rx="7" fill="${C.primary}"/>` +
  `<g transform="translate(16 15.6) scale(0.66) translate(-16 -14.5)">${mark(C.onPrimary, C.gold, 2.9)}</g></svg>\n`;

const font = (file) => `url(data:font/woff2;base64,${readFileSync(join(fonts, file)).toString('base64')}) format('woff2')`;

const ogHtml = `<!doctype html><html><head><style>
@font-face { font-family: Fraunces; src: ${font('fraunces-latin-opsz-normal.woff2')}; font-weight: 100 900; font-style: normal; }
@font-face { font-family: Fraunces; src: ${font('fraunces-latin-opsz-italic.woff2')}; font-weight: 100 900; font-style: italic; }
@font-face { font-family: Hanken; src: ${font('hanken-grotesk-latin-wght-normal.woff2')}; font-weight: 100 900; }
* { margin: 0; box-sizing: border-box; }
body { width: 1200px; height: 630px; overflow: hidden; background: ${C.inverse}; color: ${C.onPrimary}; font-family: Hanken; }
.frame { position: relative; width: 1200px; height: 630px; padding: 64px 72px; display: flex; flex-direction: column; }
.brand { display: flex; align-items: center; gap: 16px; font-size: 30px; font-weight: 620; letter-spacing: -0.01em; }
.brand svg { width: 46px; height: 46px; }
h1 { margin-top: auto; max-width: 760px; font-family: Fraunces; font-variation-settings: 'opsz' 144; font-weight: 380; font-size: 86px; line-height: 0.98; letter-spacing: -0.03em; }
.ms { margin-top: 22px; font-family: Fraunces; font-style: italic; font-variation-settings: 'opsz' 72; font-weight: 360; font-size: 36px; color: ${C.onInverseDim}; letter-spacing: -0.01em; }
.foot { margin-top: 44px; display: flex; align-items: center; gap: 18px; font-size: 19px; font-weight: 600; letter-spacing: 0.14em; text-transform: uppercase; color: ${C.gold}; }
.foot i { width: 56px; height: 2px; background: ${C.gold}; }
.art { position: absolute; right: -40px; bottom: -6px; width: 560px; height: 600px; opacity: 0.9; }
</style></head><body><div class="frame">
<svg class="art" viewBox="0 0 560 600" fill="none" stroke-linecap="square">
  <g stroke="${C.onPrimary}" stroke-opacity="0.07" stroke-width="2">
    ${Array.from({ length: 9 }, (_, i) => {
      const w = 520 - i * 56;
      const h = w * 1.44;
      const x = 280 - w / 2;
      return `<path d="M${x} 600 ${280} ${600 - h * 0.62}l${w / 2} ${h * 0.62}"/>`;
    }).join('')}
  </g>
  <path d="M280 96l12 15-12 15-12-15z" fill="${C.gold}" fill-opacity="0.85"/>
</svg>
<div class="brand"><svg viewBox="0 0 32 32">${mark(C.onPrimary, C.gold)}</svg>Malaysia Airports</div>
<h1>Your journey, beautifully connected.</h1>
<p class="ms" lang="ms">Perjalanan anda, terhubung dengan indah.</p>
<div class="foot"><i></i>Concept prototype · Prototaip konsep</div>
</div></body></html>`;

const browser = await chromium.launch();
try {
  const shot = async (html, width, height, file, transparent) => {
    const page = await browser.newPage({ viewport: { width, height }, deviceScaleFactor: 1 });
    await page.setContent(`<!doctype html><html><body style="margin:0;background:transparent">${html}</body></html>`);
    await page.evaluate(() => document.fonts.ready);
    writeFileSync(file, await page.screenshot({ omitBackground: transparent, clip: { x: 0, y: 0, width, height } }));
    await page.close();
  };
  writeFileSync(join(app, 'icon.svg'), favicon);
  await shot(tile(192), 192, 192, join(app, 'icon1.png'), true);
  await shot(tile(512), 512, 512, join(app, 'icon2.png'), true);
  await shot(fullBleed(512), 512, 512, join(app, 'apple-icon.png'), false);

  const page = await browser.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await page.setContent(ogHtml);
  await page.evaluate(() => document.fonts.ready);
  writeFileSync(join(app, '[lang]', 'opengraph-image.png'), await page.screenshot({ type: 'png' }));
  writeFileSync(
    join(app, '[lang]', 'opengraph-image.alt.txt'),
    'Malaysia Airports. Your journey, beautifully connected. Perjalanan anda, terhubung dengan indah. Concept prototype.',
  );
} finally {
  await browser.close();
}
console.log('Brand assets written to src/app');
