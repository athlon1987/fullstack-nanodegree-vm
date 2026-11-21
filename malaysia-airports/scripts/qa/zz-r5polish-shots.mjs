import { chromium, devices } from '@playwright/test';
const [BASE, OUT, which] = process.argv.slice(2);
const browser = await chromium.launch();
async function shot(name, { path, width, height, phone, textSize = 100, theme = 'light', selector, full = false, noJs = false }) {
  const ctx = await browser.newContext({ ...(phone ? devices['Pixel 7'] : {}), viewport: { width, height }, javaScriptEnabled: !noJs, colorScheme: theme, extraHTTPHeaders: { 'x-e2e-client-ip': '10.66.' + Math.floor(Math.random() * 200) + '.9' } });
  await ctx.addInitScript(([s, th]) => { try { localStorage.setItem('ma:preferences:v1', JSON.stringify({ theme: th, textSize: s, highContrast: false, reducedMotion: true })); } catch {} }, [textSize, theme]);
  const page = await ctx.newPage();
  await page.goto(BASE + path, { waitUntil: 'networkidle' });
  await page.waitForTimeout(600);
  if (selector) await page.locator(selector).first().screenshot({ path: `${OUT}/${name}.png` });
  else await page.screenshot({ path: `${OUT}/${name}.png`, fullPage: full });
  await ctx.close();
}
const sets = {
  nonglance: [],
  final: [
    ['01-404-en-kul-zzz-1440-dark', { path: '/en/kul/zzz', width: 1440, height: 900, theme: 'dark' }],
    ['02-404-ms-kul-zzz-390', { path: '/ms/kul/zzz', width: 390, height: 844, phone: true }],
    ['03-transport-glance-en-1440', { path: '/en/kul/transport', width: 1440, height: 900, selector: '[data-transport-glance]' }],
    ['04-transport-ms-390-125', { path: '/ms/kul/transport', width: 390, height: 844, phone: true, textSize: 125 }],
    ['09-transport-glance-nojs-ms-1440', { path: '/ms/kul/transport', width: 1440, height: 900, noJs: true, selector: '[data-transport-glance]' }],
    ['05-parking-card-en-390', { path: '/en/kul/parking', width: 390, height: 844, phone: true, selector: '#car-park-kul-t1-preferred-parking' }],
    ['06-parking-matrix-ms-1440-dark', { path: '/ms/kul/parking', width: 1440, height: 900, theme: 'dark', selector: '[data-parking-matrix]' }],
    ['07-airports-map-1440', { path: '/en/airports', width: 1440, height: 900, selector: 'main svg[role="img"] >> nth=0' }],
    ['08-airports-map-320', { path: '/en/airports', width: 320, height: 700, phone: true, selector: 'main svg[role="img"] >> nth=0' }],
  ],
  glance: [
    ['glance-en-1440', { path: '/en/kul/transport', width: 1440, height: 900, selector: '[data-transport-glance]' }],
    ['glance-ms-390-125', { path: '/ms/kul/transport', width: 390, height: 844, phone: true, textSize: 125 }],
  ],
  parking: [
    ['parking-card-en-390', { path: '/en/kul/parking', width: 390, height: 844, phone: true, selector: '#car-park-kul-long-term-car-park' }],
  ],
};
const list = which === 'nonglance' ? sets.final.filter(([n]) => !n.includes('transport')) : which === 'glanceonly' ? sets.final.filter(([n]) => n.includes('transport')) : sets[which];
for (const [name, opts] of list) await shot(name, opts);
await browser.close();
