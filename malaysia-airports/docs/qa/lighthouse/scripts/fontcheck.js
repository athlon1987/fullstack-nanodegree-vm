const { chromium, devices } = require('playwright');
(async () => { const b = await chromium.launch();
  for (const [name, opts] of [['mobile', { ...devices['Pixel 7'] }], ['desktop', { viewport: { width: 1440, height: 900 } }]]) for (const lang of ['ms', 'en']) for (const block of [false, true]) {
    const ctx = await b.newContext(opts); const p = await ctx.newPage();
    if (block) await p.route(/fraunces/, r => r.abort());
    await p.goto('http://localhost:3101/' + lang, { waitUntil: 'networkidle' }); await p.waitForTimeout(500);
    const h = await p.evaluate(() => { const e = document.querySelector('#home-title'); const r = e.getBoundingClientRect(); return { h: Math.round(r.height), font: getComputedStyle(e).fontFamily.slice(0, 40), lines: Math.round(r.height / parseFloat(getComputedStyle(e).lineHeight)) }; });
    console.log(name, '/' + lang, block ? 'Fraunces blocked (fallback)' : 'Fraunces loaded', JSON.stringify(h)); await ctx.close(); }
  await b.close(); })();
