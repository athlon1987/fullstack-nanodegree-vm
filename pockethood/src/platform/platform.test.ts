// Platform tests: content validation against hostile input, integrity, lifecycle, sponsor and
// real-world-claim rules, module isolation, the Malaysian world and the gentle activities.
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { BUILDINGS } from '../data/buildings';
import { ITEMS, RECIPES } from '../data/items';
import { QUESTS } from '../data/progression';
import { RESIDENTS } from '../data/residents';
import { WORLD } from '../data/world';
import { dispatch, type Action } from '../game/core/engine';
import { createNewGame } from '../game/core/newGame';
import type { GameState } from '../game/core/types';
import { findSpot } from '../game/world/grid';
import { memoryAdapter, SaveService } from '../services/persistence';
import { ACTIVE_MODULES, behaviorOf, compileModule, installContent } from './content/install';
import { loadBundle, safeParse, type Fetcher } from './content/loader';
import { evaluate, rolloutBucket } from './content/registry';
import { indexSchema, moduleSchema, worldSchema, type ContentIndex, type ModuleManifest } from './content/schema';
import { activate, bundledFetcher, initContent, useContent } from './content/service';
import { tc } from './i18n/content';
import { DICTS } from './i18n/locales';
import { setLang, t } from './i18n';
import { sha256Hex, verifySignature } from './security/integrity';
import { isSafeText, run } from './validate';

const T0 = new Date('2026-11-02T09:00:00').getTime();
const MY = 'my.kampung_seri';
const raw = async (p: string) => JSON.parse(await bundledFetcher(p));
let kopitiam: ModuleManifest;
let world: unknown;

beforeAll(async () => {
  await initContent({ remoteBase: null, cache: null });
  kopitiam = (await raw('modules/my.food.kopitiam_lim.json')) as ModuleManifest;
  world = await raw('worlds/my.kampung_seri.json');
});
beforeEach(() => {
  setLang('en');
  activate(MY, 'en', T0);
});

const clone = <T>(x: T): T => structuredClone(x);
const issuesOf = (r: ReturnType<typeof run>) => (r.ok ? [] : r.issues.map((i) => `${i.path} ${i.message}`));

// ─── Hostile content ────────────────────────────────────────────────────────

describe('content validation rejects hostile or malformed data', () => {
  it('rejects markup, script URLs, inline handlers, control and bidi characters', () => {
    for (const bad of ['<script>alert(1)</script>', '<img src=x onerror=alert(1)>', 'javascript:alert(1)', 'JaVaScRiPt :x', 'data:text/html,hi', 'click onload=steal()', 'a\u0007b', 'abc‮def'])
      expect(isSafeText(bad), bad).toBe(false);
    expect(isSafeText('Kopi-O & teh tarik — RM2.50? “Sedap!” 😋')).toBe(true);
  });

  it('a module with an HTML name, unknown field or unknown behaviour is refused', () => {
    const m = clone(kopitiam) as Record<string, unknown>;
    (m.name as Record<string, string>)['en-MY'] = 'Kopitiam <b>Lim</b>';
    m.onInstall = 'fetch("https://evil.example")';
    (m.behaviors as unknown[]).push({ type: 'run_script', code: 'alert(1)' });
    const issues = issuesOf(run(moduleSchema, m));
    expect(issues.some((i) => i.includes('$.name') && i.includes('markup'))).toBe(true);
    expect(issues.some((i) => i.includes('onInstall') && i.includes('not an allowed field'))).toBe(true);
    expect(issues.some((i) => i.includes('behaviors') && i.includes('must be one of'))).toBe(true);
  });

  it('rejects unapproved prefabs, icons and vehicle models, oversized lists and bad link schemes', () => {
    const m = clone(kopitiam);
    (m.presentation as { prefab: string }).prefab = 'custom_html_widget';
    (m.items[0] as { icon: string }).icon = 'https://evil.example/icon.svg';
    m.realWorld = { links: [{ label: 'Order', url: 'http://shop.example' }] } as never;
    const big = clone(kopitiam);
    big.items = Array.from({ length: 40 }, (_, i) => ({ ...kopitiam.items[0], id: `i${i}` }));
    expect(issuesOf(run(moduleSchema, m)).length).toBeGreaterThanOrEqual(3);
    expect(issuesOf(run(moduleSchema, big)).some((i) => i.includes('at most'))).toBe(true);
  });

  it('JSON with prototype-pollution keys is refused before validation', () => {
    expect(() => safeParse('{"__proto__":{"polluted":true}}')).toThrow(/forbidden/);
    expect(() => safeParse('{"a":{"constructor":{"prototype":{}}}}')).toThrow(/forbidden/);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
  });

  it('the content index refuses path traversal and absolute paths', () => {
    const idx = clone(useContent.getState().bundle!.index) as ContentIndex;
    idx.modules[0].path = '../../src/main.json';
    idx.worlds[0].path = '/etc/passwd.json';
    const issues = issuesOf(run(indexSchema, idx));
    expect(issues.some((i) => i.includes('modules[0].path'))).toBe(true);
    expect(issues.some((i) => i.includes('worlds[0].path'))).toBe(true);
  });

  it('a world pack with broken references is refused and the core world stays', () => {
    const w = clone(world) as { quests: { giver: string }[]; layout: { type: string }[] };
    w.quests[0].giver = 'nobody';
    w.layout.push({ type: 'casino', x: 1, z: 1 } as never);
    const v = run(worldSchema, w);
    expect(v.ok).toBe(true); // structurally fine…
    const report = installContent({ world: (v as unknown as { value: never }).value, modules: [], lang: 'en', now: T0 });
    expect(report.world.ok).toBe(false); // …but semantically broken
    expect(report.world.errors.join(' ')).toMatch(/nobody|casino/);
    expect(WORLD.id).toBe('core.maple_hollow');
    expect(BUILDINGS.cafe.name).toBe('Mia’s Café');
  });
});

// ─── Integrity ───────────────────────────────────────────────────────────────

describe('integrity', () => {
  it('a module whose bytes do not match the index hash is quarantined; others still load', async () => {
    const tampered: Fetcher = async (p) => {
      const text = await bundledFetcher(p);
      return p.includes('kopitiam') ? text.replace('Kopi-O', 'Kopi-0') : text;
    };
    const b = await loadBundle(tampered, 'remote', { requireSignature: false });
    const k = b.modules.find((m) => m.entry.id === 'my.food.kopitiam_lim')!;
    expect(k.manifest).toBeUndefined();
    expect(k.issues.join(' ')).toMatch(/sha256|size/);
    expect(b.modules.filter((m) => m.manifest).length).toBe(3);
  });

  it('signed indexes verify; a tampered index or missing signature is refused', async () => {
    const keys = (await crypto.subtle.generateKey({ name: 'ECDSA', namedCurve: 'P-256' }, true, ['sign', 'verify'])) as CryptoKeyPair;
    const pub = await crypto.subtle.exportKey('jwk', keys.publicKey);
    const index = await bundledFetcher('index.json');
    const sig = new Uint8Array(await crypto.subtle.sign({ name: 'ECDSA', hash: 'SHA-256' }, keys.privateKey, new TextEncoder().encode(index)));
    const sigB64 = btoa(String.fromCharCode(...sig));
    expect(await verifySignature(index, sigB64, pub)).toBe(true);
    expect(await verifySignature(index.replace('"enabled": true', '"enabled": false'), sigB64, pub)).toBe(false);
    const withSig: Fetcher = async (p) => (p === 'index.json.sig' ? sigB64 : bundledFetcher(p));
    await expect(loadBundle(withSig, 'remote', { requireSignature: true, publicKey: pub })).resolves.toBeTruthy();
    await expect(loadBundle(bundledFetcher, 'remote', { requireSignature: true, publicKey: pub })).rejects.toThrow(/signature/);
    expect(await sha256Hex('abc')).toBe('ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad');
  });
});

// ─── Lifecycle ───────────────────────────────────────────────────────────────

describe('module lifecycle', () => {
  const ctx = () => {
    const index = clone(useContent.getState().bundle!.index);
    return { now: T0, country: 'MY', flags: { modules: true }, index, installId: 'test' };
  };
  const entry = () => clone(useContent.getState().bundle!.index.modules.find((m) => m.id === kopitiam.id)!);

  it('active by default; kill switch, disable, approval, country, version, dates, flags and rollout all gate it', () => {
    expect(evaluate(entry(), kopitiam, ctx()).status).toBe('active');
    const c = ctx();
    c.index.killSwitch.modules.push(kopitiam.id);
    expect(evaluate(entry(), kopitiam, c).status).toBe('killed');
    expect(evaluate({ ...entry(), enabled: false }, kopitiam, ctx()).status).toBe('disabled');
    expect(evaluate(entry(), undefined, ctx()).status).toBe('quarantined');
    expect(evaluate(entry(), { ...kopitiam, approval: { state: 'in_review' } }, ctx()).status).toBe('unapproved');
    expect(evaluate(entry(), kopitiam, { ...ctx(), country: 'SG' }).status).toBe('other_country');
    expect(evaluate(entry(), { ...kopitiam, activation: { minGameVersion: '9.0.0' } }, ctx()).status).toBe('incompatible');
    expect(evaluate(entry(), { ...kopitiam, activation: { minGameVersion: '0.1.0', from: '2027-01-01' } }, ctx()).status).toBe('scheduled');
    expect(evaluate(entry(), { ...kopitiam, activation: { minGameVersion: '0.1.0', until: '2026-01-01' } }, ctx()).status).toBe('expired');
    expect(evaluate(entry(), { ...kopitiam, activation: { minGameVersion: '0.1.0', flags: ['pilot'] } }, ctx()).status).toBe('flag_off');
    const bucket = rolloutBucket('test', kopitiam.id);
    expect(evaluate({ ...entry(), rolloutPercent: bucket }, kopitiam, ctx()).status).toBe('rollout');
    expect(evaluate({ ...entry(), rolloutPercent: bucket + 1 }, kopitiam, ctx()).status).toBe('active');
  });

  it('the MY world activates all four demo modules through the same pipeline', () => {
    const mods = useContent.getState().modules;
    expect(mods.map((m) => [m.id, m.status])).toEqual([
      ['my.auto.galeri_seri', 'active'],
      ['my.community.kebun_seri', 'active'],
      ['my.edu.pusat_cahaya', 'active'],
      ['my.food.kopitiam_lim', 'active'],
    ]);
    expect(Object.keys(ACTIVE_MODULES).sort()).toEqual(['cafe', 'garden', 'learning_centre', 'showroom']);
  });
});

// ─── Templates, economy, sponsors and real-world claims ──────────────────────

describe('module compile rules', () => {
  const compile = (m: ModuleManifest) => compileModule(m, 'en', T0, 'MY');

  it('data changes alter content without code changes', () => {
    const m = clone(kopitiam);
    (m.items[1].name as Record<string, string>)['en-MY'] = 'Teh Halia';
    m.recipes[1].seconds = 25;
    const r = compile(m);
    expect(r.ok).toBe(true);
    expect(r.defs!.items.find((i) => i.id.endsWith('/teh_tarik'))!.name).toBe('Teh Halia');
    expect(r.defs!.recipes.find((x) => x.id.endsWith('/teh_tarik'))!.seconds).toBe(25);
  });

  it('templates gate behaviours and prefabs; economic ceilings stop pay-to-win content', () => {
    const quiz = clone(kopitiam);
    quiz.behaviors.push({ type: 'quiz', topic: 'x', dailyLimit: 3, questions: [] } as never);
    expect(compile(quiz).errors.join(' ')).toMatch(/quiz is not allowed/);
    const rich = clone(kopitiam);
    rich.recipes[0].seconds = 12;
    rich.items[0].value = 60;
    expect(compile(rich).errors.join(' ')).toMatch(/value\/min/);
    const gems = clone(kopitiam);
    gems.quests![0].reward.gems = 5;
    expect(compile(gems).errors.join(' ')).toMatch(/may not grant gems/);
    const wrongSlot = clone(kopitiam);
    wrongSlot.slot = 'showroom';
    expect(compile(wrongSlot).errors.join(' ')).toMatch(/template/);
    expect(compileModule(kopitiam, 'en', T0, 'SG').errors.join(' ')).toMatch(/country/);
  });

  it('sponsor labels require verification; "Official Brand Partner" requires a licensed brand', () => {
    const unverified = { ...clone(kopitiam), sponsor: { partnerId: 'acme', label: 'official_partner' as const, verified: false } };
    expect(compile(unverified).module!.sponsorLabel).toBeNull();
    const verified = { ...clone(kopitiam), sponsor: { partnerId: 'acme', label: 'official_partner' as const, verified: true, verifiedAt: '2026-10-01', contractRef: 'C-1' } };
    expect(compile(verified).module!.sponsorLabel).toBe('sponsored_experience'); // fictional brand
    const licensed = clone(verified);
    licensed.brand = { ...licensed.brand, kind: 'licensed', licence: { holder: 'Acme Sdn Bhd', agreementRef: 'L-9', expires: '2027-12-31' } };
    expect(compile(licensed).module!.sponsorLabel).toBe('official_partner');
    licensed.brand.licence!.expires = '2026-01-01';
    expect(compile(licensed).ok).toBe(false);
  });

  it('never shows unverified prices or halal claims, and drops links to non-allowlisted hosts', () => {
    const m = clone(kopitiam);
    m.realWorld = {
      menu: { currency: 'MYR', version: '1.0.0', source: 'partner_supplied', items: [{ name: 'Kopi', priceMinor: 250 }] },
      halal: { status: 'certified', certifier: 'Example Body' },
      links: [{ label: 'Website', url: 'https://kopitiam.example/menu' }],
    };
    const r = compile(m).module!;
    expect(r.realWorld!.menu!.items[0].priceMinor).toBeNull();
    expect(r.realWorld!.halal.status).toBe('not_stated');
    expect(r.realWorld!.links).toEqual([]);
    expect(r.warnings.join(' ')).toMatch(/prices removed/);
    m.realWorld!.menu!.verifiedAt = '2026-10-20';
    m.realWorld!.halal = { status: 'certified', certifier: 'Example Body', certificateRef: 'H-123', verifiedAt: '2026-10-20', expires: '2027-10-20' };
    const ok = compile(m).module!;
    expect(ok.realWorld!.menu!.items[0].priceMinor).toBe(250);
    expect(ok.realWorld!.halal.status).toBe('certified');
    m.realWorld!.halal!.expires = '2026-10-21';
    expect(compile(m).module!.realWorld!.halal.status).toBe('not_stated'); // expired before T0
  });

  it('two modules cannot dress the same slot', () => {
    const twin = { ...clone(kopitiam), id: 'my.food.kopitiam_twin' };
    const report = installContent({ world: useContent.getState().bundle!.worlds[MY], modules: [kopitiam, twin], lang: 'en', now: T0 });
    expect(report.modules.find((m) => m.id === twin.id)!.errors.join(' ')).toMatch(/already dressed/);
  });
});

// ─── Engine with the Malaysian world ─────────────────────────────────────────

function play(seed = 11) {
  let now = T0;
  let state: GameState = createNewGame(now, seed);
  state = dispatch(state, { type: 'sessionStart' }, now).state;
  const h = {
    get s() {
      return state;
    },
    get now() {
      return now;
    },
    set(s: GameState) {
      state = s;
    },
    act(a: Action) {
      const r = dispatch(state, a, now);
      if (r.error) throw new Error(`${a.type}: ${tc(r.error, r.errorParams)}`);
      state = r.state;
      return r;
    },
    err(a: Action) {
      const r = dispatch(state, a, now);
      if (!r.error) state = r.state;
      return r.error;
    },
    wait(ms: number) {
      now += ms;
      state = dispatch(state, { type: 'tick' }, now).state;
    },
    uid: (type: string) => state.buildings.find((b) => b.type === type)!.uid,
    build(type: string) {
      const spot = findSpot(state, type, 14, 13)!;
      h.act({ type: 'place', building: type, x: spot.x, z: spot.z, rot: 0 });
      const b = state.buildings.find((x) => x.type === type)!;
      if (b.busyUntil) h.wait(b.busyUntil - now + 1);
      return b.uid;
    },
  };
  return h;
}

describe('Kampung Seri (MY world)', () => {
  it('installs Malaysian content: names, residents, quests and module dressing', () => {
    expect(WORLD.id).toBe(MY);
    expect(WORLD.biome).toBe('tropical');
    expect(BUILDINGS.starter_house.name).toBe('Rumah Kampung');
    expect(BUILDINGS.cafe.name).toBe('Kopitiam Lim'); // dressed by the module
    expect(BUILDINGS.cafe.resident).toBe('lim');
    expect(ITEMS.coffee.name).toBe('Kopi');
    expect(Object.keys(RESIDENTS)).toContain('zainab');
    expect(RESIDENTS.mia).toBeUndefined();
    expect(QUESTS.filter((q) => q.tutorial).map((q) => q.id)).toEqual(['welcome', 'reopen_kopitiam', 'first_brew', 'first_order', 'kopitiam_upgrade', 'meet_zainab']);
    expect(ITEMS['my.food.kopitiam_lim/teh_tarik'].name).toBe('Teh Tarik');
  });

  it('switches language without code: Bahasa Melayu content and UI', () => {
    activate(MY, 'ms', T0);
    setLang('ms');
    expect(RESIDENTS.lim.name).toBe('Pak Cik Lim');
    expect(BUILDINGS.bench.name).toBe('Bangku Kayu');
    expect(QUESTS.find((q) => q.id === 'first_brew')!.title).toBe('Kopi Pertama');
    expect(t('errors.missingIngredients')).toBe('Bahan tidak cukup');
    expect(tc('errors.giftedToday', { resident: 'zainab' })).toBe('Mak Cik Zainab sudah dapat hadiah hari ini');
  });

  it('the guided Malaysian tutorial can be completed end to end', () => {
    const g = play();
    expect(g.s.residents.map((r) => r.id)).toEqual(['lim']);
    g.act({ type: 'collect', uid: g.uid('starter_house') });
    const cafe = g.build('cafe');
    expect(g.s.residents.find((r) => r.id === 'lim')!.memories.opened_cafe).toBeTruthy();
    for (let i = 0; i < 3; i++) {
      g.act({ type: 'produce', uid: cafe, recipe: 'coffee' });
      g.wait(15_001);
      g.act({ type: 'collect', uid: cafe });
    }
    g.act({ type: 'deliverOrder', id: g.s.orders.find((o) => o.resident === 'lim')!.id });
    g.act({ type: 'upgrade', uid: cafe });
    g.wait(60_000);
    expect(g.s.quests.done).toContain('kopitiam_upgrade');
    expect(g.s.coins).toBeGreaterThanOrEqual(BUILDINGS.garden.cost.coins!);
    g.build('garden');
    expect(g.s.tutorial.done).toBe(true);
    expect(g.s.residents.map((r) => r.id)).toContain('zainab');
    expect(g.s.history.some((h) => h.key === 'history.arrived' && h.params?.resident === 'zainab')).toBe(true);
  });

  it('hand preparation checks the step order and rests between attempts', () => {
    const g = play();
    g.set({ ...g.s, coins: 500, level: 2 });
    const cafe = g.build('cafe');
    const recipe = 'my.food.kopitiam_lim/teh_tarik';
    expect(g.err({ type: 'handPrepare', uid: cafe, recipe, steps: ['pull', 'pour', 'pull', 'serve'] })).toBe('errors.prepOrder');
    g.act({ type: 'handPrepare', uid: cafe, recipe, steps: ['pour', 'pull', 'pull', 'serve'] });
    expect(g.s.inventory[recipe]).toBe(1);
    expect(g.s.stats.handmade).toBe(1);
    expect(g.err({ type: 'handPrepare', uid: cafe, recipe, steps: ['pour', 'pull', 'pull', 'serve'] })).toBe('errors.prepRest');
    g.wait(91_000);
    g.act({ type: 'handPrepare', uid: cafe, recipe, steps: ['pour', 'pull', 'pull', 'serve'] });
    expect(g.s.inventory[recipe]).toBe(2);
  });

  it('the daily quiz has a limit, no repeats, and explains every answer', () => {
    const g = play();
    g.set({ ...g.s, coins: 900, level: 3 });
    const lc = g.build('learning_centre');
    const quiz = behaviorOf('learning_centre', 'quiz')!;
    expect(quiz.questions.every((q) => q.explain.length > 0)).toBe(true);
    const [a, b, c, d] = quiz.questions;
    g.act({ type: 'quizAnswer', uid: lc, question: a.id, choice: a.answer });
    expect(g.err({ type: 'quizAnswer', uid: lc, question: a.id, choice: 0 })).toBe('errors.quizSeen');
    g.act({ type: 'quizAnswer', uid: lc, question: b.id, choice: (b.answer + 1) % b.choices.length });
    g.act({ type: 'quizAnswer', uid: lc, question: c.id, choice: c.answer });
    expect(g.err({ type: 'quizAnswer', uid: lc, question: d.id, choice: d.answer })).toBe('errors.quizRest');
    expect(g.s.ext.learning).toMatchObject({ correct: 2, answered: 3 });
    g.wait(86_400_000);
    g.act({ type: 'quizAnswer', uid: lc, question: d.id, choice: d.answer });
  });

  it('showroom bays open with upgrades and only accept approved models and paints', () => {
    const g = play();
    g.set({ ...g.s, coins: 3000, level: 4 });
    const sr = g.build('showroom');
    g.act({ type: 'showroomSet', uid: sr, slot: 1, model: 'suv', paint: 'pandan' });
    expect(g.err({ type: 'showroomSet', uid: sr, slot: 2, model: 'suv', paint: 'pandan' })).toBe('errors.showroomSlot');
    expect(g.err({ type: 'showroomSet', uid: sr, slot: 0, model: 'monster_truck', paint: 'pandan' })).toBe('errors.unavailable');
    expect(g.s.ext.showrooms[sr]).toHaveLength(2);
  });

  it('garden plots grow over time, watering speeds them up, harvests yield goods', () => {
    const g = play();
    g.set({ ...g.s, coins: 500, level: 2 });
    const garden = g.build('garden');
    g.act({ type: 'plant', uid: garden, plot: 0, plant: 'bunga_raya' });
    expect(g.err({ type: 'plant', uid: garden, plot: 0, plant: 'cili' })).toBe('errors.plotBusy');
    expect(g.err({ type: 'harvest', uid: garden, plot: 0 })).toBe('errors.plotGrowing');
    g.act({ type: 'water', uid: garden, plot: 0 });
    expect(g.err({ type: 'water', uid: garden, plot: 0 })).toBe('errors.wateredRecently');
    g.wait(240_000 * 0.85 + 1000);
    const before = g.s.inventory.flowers ?? 0;
    g.act({ type: 'harvest', uid: garden, plot: 0 });
    expect(g.s.inventory.flowers).toBe(before + 2);
    expect(g.s.stats.harvest).toBe(1);
  });

  it('Zen activities keep journals, never currencies', () => {
    const g = play();
    const coins = g.s.coins;
    g.act({ type: 'fish' });
    expect(g.err({ type: 'fish' })).toBe('errors.fishRest');
    g.wait(41_000);
    g.act({ type: 'fish' });
    expect(Object.values(g.s.zen.fish).reduce((a, n) => a + n, 0)).toBe(2);
    g.act({ type: 'feedPet', pet: 'mochi' });
    expect(g.err({ type: 'feedPet', pet: 'mochi' })).toBe('errors.petFed');
    g.act({ type: 'zenMoment', kind: 'sunset' });
    expect(g.s.coins).toBe(coins);
    // Deterministic: the same seed sees the same fish.
    const a = play(5);
    const b = play(5);
    a.act({ type: 'fish' });
    b.act({ type: 'fish' });
    expect(a.s.zen.fish).toEqual(b.s.zen.fish);
  });
});

// ─── Module isolation ────────────────────────────────────────────────────────

describe('module isolation', () => {
  it('a killed module falls back to neutral without losing player state, and comes back intact', async () => {
    const g = play();
    g.set({ ...g.s, coins: 500, level: 2 });
    const cafe = g.build('cafe');
    const teh = 'my.food.kopitiam_lim/teh_tarik';
    g.act({ type: 'produce', uid: cafe, recipe: teh });
    g.act({ type: 'handPrepare', uid: cafe, recipe: teh, steps: ['pour', 'pull', 'pull', 'serve'] });
    g.set({ ...g.s, orders: [...g.s.orders, { id: 'oX', resident: 'lim', items: { [teh]: 1 }, reward: { coins: 10 }, createdAt: g.now }] });

    // Remote kill switch.
    const bundle = useContent.getState().bundle!;
    bundle.index.killSwitch.modules.push('my.food.kopitiam_lim');
    activate(MY, 'en', g.now);
    expect(useContent.getState().modules.find((m) => m.id === 'my.food.kopitiam_lim')!.status).toBe('killed');
    expect(BUILDINGS.cafe.name).toBe('Coffee Shop'); // neutral presentation
    expect(RECIPES[teh]).toBeUndefined();
    // The job started before the switch still pays out; the order for withdrawn goods retires.
    g.wait(21_000);
    g.act({ type: 'collect', uid: cafe });
    expect(g.s.inventory[teh]).toBe(2);
    expect(g.s.orders.some((o) => o.id === 'oX')).toBe(false);
    g.act({ type: 'produce', uid: cafe, recipe: 'coffee' }); // neutral recipes keep working
    // Saves made meanwhile keep everything.
    const saves = new SaveService(memoryAdapter());
    await saves.save(g.s);
    const loaded = await saves.load(g.now);
    expect(loaded.state.inventory[teh]).toBe(2);

    // Switched back on: the same items are usable again.
    bundle.index.killSwitch.modules.length = 0;
    activate(MY, 'en', g.now);
    expect(ITEMS[teh]).toBeTruthy();
    expect(BUILDINGS.cafe.name).toBe('Kopitiam Lim');
  });

  it('a save from an unavailable world loads in the core world with nothing deleted', async () => {
    const g = play();
    g.set({ ...g.s, buildings: [...g.s.buildings, { ...g.s.buildings[0], uid: 'bz', type: 'future_pagoda', x: 20, z: 20, fp: [2, 2] }] });
    const saves = new SaveService(memoryAdapter());
    await saves.save(g.s);
    const loaded = await saves.load(g.now, () => activate('xx.missing_world', 'en', g.now));
    expect(WORLD.id).toBe('core.maple_hollow');
    expect(loaded.state.buildings.some((b) => b.type === 'future_pagoda')).toBe(true);
    expect(loaded.state.residents.map((r) => r.id)).toContain('lim'); // kept, just not shown
    // The engine keeps running around content it doesn't know.
    const r = dispatch(loaded.state, { type: 'tick' }, g.now + 60_000);
    expect(r.error).toBeUndefined();
  });
});

// ─── Localisation completeness ───────────────────────────────────────────────

describe('localisation', () => {
  it('every English key has a Malay translation with the same placeholders', () => {
    const ph = (s: string) => [...s.matchAll(/\{(\w+)\}/g)].map((m) => m[1]).sort().join(',');
    const missing = Object.keys(DICTS.en).filter((k) => !(k in DICTS.ms));
    expect(missing).toEqual([]);
    const mismatched = Object.keys(DICTS.en).filter((k) => ph(DICTS.en[k]) !== ph(DICTS.ms[k]));
    expect(mismatched).toEqual([]);
  });
});
