const { chromium, devices } = require('playwright');
(async () => { const b = await chromium.launch(); const ctx = await b.newContext({ ...devices['Pixel 7'] }); const p = await ctx.newPage();
  const cdp = await ctx.newCDPSession(p); await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
  await cdp.send('Profiler.enable'); await cdp.send('Profiler.setSamplingInterval', { interval: 200 }); await cdp.send('Profiler.start');
  await p.goto('http://localhost:3101' + (process.argv[2] || '/en'), { waitUntil: 'networkidle' }); await p.waitForTimeout(1500);
  const { profile } = await cdp.send('Profiler.stop');
  const byId = new Map(profile.nodes.map(n => [n.id, n])); const parent = new Map(); for (const n of profile.nodes) for (const c of n.children || []) parent.set(c, n.id);
  const self = {}; profile.samples.forEach((id, i) => self[id] = (self[id] || 0) + (profile.timeDeltas[i] || 0));
  const lab = n => (n.callFrame.url.split('/').pop() || '(' + n.callFrame.functionName + ')') + ':' + (n.callFrame.functionName || 'anon') + '@' + n.callFrame.columnNumber;
  // inclusive time of the hot zonedParts function by ancestor chain (4 levels)
  const chains = {};
  for (const n of profile.nodes) { if (!(n.callFrame.url.includes('20zi65') && n.callFrame.columnNumber === 55998)) continue; const t = (self[n.id] || 0) / 1000; let cur = parent.get(n.id), chain = []; for (let k = 0; k < 6 && cur; k++) { chain.push(lab(byId.get(cur))); cur = parent.get(cur); } const key = chain.join(' <- '); chains[key] = (chains[key] || 0) + t; }
  Object.entries(chains).sort((a, b) => b[1] - a[1]).slice(0, 6).forEach(([k, v]) => console.log(Math.round(v) + 'ms', k));
  await b.close(); })();
