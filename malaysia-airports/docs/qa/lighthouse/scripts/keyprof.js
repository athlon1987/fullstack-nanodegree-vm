/* keyprof.js: CPU profile of typing "MH" in the board filter (4x CPU), self time by function. */
const { chromium, devices } = require('playwright');
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['Pixel 7'] }); const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await p.goto('http://localhost:3101/en/kul/flights', { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
  await p.locator('main input[type=search]').first().tap(); await p.waitForTimeout(300);
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start');
  await p.keyboard.type('MH', { delay: 180 }); await p.waitForTimeout(1200);
  const { profile } = await cdp.send('Profiler.stop');
  const self = {}; profile.samples.forEach((id, i) => self[id] = (self[id] || 0) + (profile.timeDeltas[i] || 0));
  const agg = {}; let total = 0; for (const n of profile.nodes) { const t = (self[n.id] || 0) / 1000; const cf = n.callFrame; if (['(idle)', '(program)'].includes(cf.functionName) && !cf.url) continue; total += t; const k = (cf.url.split('/').pop() || '') + ':' + (cf.functionName || 'anon') + '@' + cf.columnNumber; agg[k] = (agg[k] || 0) + t; }
  console.log('busy ms (4x)', Math.round(total)); Object.entries(agg).sort((a, b) => b[1] - a[1]).slice(0, 8).forEach(([k, v]) => console.log(Math.round(v) + 'ms', k));
  console.log('rows shown after search:', await p.locator('main li, main tr').count());
  await b.close(); })();
