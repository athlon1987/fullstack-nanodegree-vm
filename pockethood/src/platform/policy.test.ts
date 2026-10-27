// Content policy: a peaceful, welcoming world. Authored text, partner modules and player
// names stay clear of religion, politics, hostility, restricted products and unverified claims
// — in every language — without ever treating a nationality, ethnicity or identity as a problem.
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { BUILDINGS } from '../data/buildings';
import { ITEMS, RECIPES } from '../data/items';
import { ACHIEVEMENTS, COMMUNITY_PROJECTS, EVENTS, QUESTS, STORIES } from '../data/progression';
import { RESIDENTS } from '../data/residents';
import { dispatch } from '../game/core/engine';
import { createNewGame } from '../game/core/newGame';
import { migrate } from '../services/persistence';
import { decodeVisit, encodeVisit, visitState } from '../services/visit';
import { checkWorld, compileModule, MODULE_MAX_REPEATS } from './content/install';
import { scanDocument, screenText, isAcceptableName } from './content/policy';
import { moduleSchema, worldSchema, type ModuleManifest, type WorldPack } from './content/schema';
import { activate, bundledFetcher, initContent } from './content/service';
import { DICTS } from './i18n/locales';
import { setLang } from './i18n';
import { run } from './validate';

const T0 = new Date('2026-11-02T09:00:00').getTime();
const MY = 'my.kampung_seri';
const raw = async (p: string) => JSON.parse(await bundledFetcher(p));
const clone = <T>(x: T): T => structuredClone(x);
let kopitiam: ModuleManifest;
let world: WorldPack;
const MODULES = ['my.food.kopitiam_lim', 'my.auto.galeri_seri', 'my.edu.pusat_cahaya', 'my.community.kebun_seri'];

beforeAll(async () => {
  await initContent({ remoteBase: null, cache: null });
  kopitiam = await raw('modules/my.food.kopitiam_lim.json');
  const w = run(worldSchema, await raw('worlds/my.kampung_seri.json'));
  if (!w.ok) throw new Error('world invalid');
  world = w.value as WorldPack;
});
beforeEach(() => {
  setLang('en');
  activate(MY, 'en', T0);
});

describe('content policy screen', () => {
  it('catches religious and political topics in English and Malay, whatever the case or punctuation', () => {
    const cases: [string, string][] = [
      ['Selamat Hari Raya, jiran!', 'religion'],
      ['Assalamualaikum!', 'religion'],
      ['MasyaAllah, cantiknya!', 'religion'],
      ['Meet me at the TEMPLE later', 'religion'],
      ['Jom ke surau', 'religion'],
      ['Merry Christmas from the café', 'religion'],
      ['Vote for the new mayor!', 'politics'],
      ['Pilihan raya kecil minggu depan', 'politics'],
      ['The Prime-Minister visited', 'politics'],
      ['Undi kami!', 'politics'],
      ['Political talk at the kopitiam', 'politics'],
      ['I hate the bakery', 'hostility'],
      ['Happy hour: beer & wine', 'restricted_product'],
      ['Our food is 100% HALAL', 'claim'],
    ];
    for (const [text, topic] of cases) expect(screenText(text)?.topic, text).toBe(topic);
  });

  it('never flags everyday words, celebrations, or any nationality, ethnicity or identity', () => {
    const fine = [
      'A surprise birthday party for Mei!', 'Parti hari jadi kejutan untuk Mei!', 'The monkey stole a banana from the warung',
      'Hello! The community garden needs skills and sprays of water', 'Selamat pagi! Selamat datang!', 'Gotong-royong at the balai raya',
      'Malay, Chinese, Indian, Iban, Kadazan-Dusun, Orang Asli, Sabahan, Sarawakian, Malaysian, Singaporean, Thai, Japanese, Korean',
      'Aisyah, Kavitha, Arjun, Farid, Joanna, Mei, Uncle Lim, Mak Cik Zainab, Amin, Sami, Devi, Wei Ling',
      'Bunga raya, kuih kelapa, teh tarik, roti canai, nasi lemak', 'Street Food Day, Music Night, Pet Parade, Flower Festival',
      'A car rally of polished classics', 'Hellos and high-fives', 'Ten good questions',
    ];
    for (const text of fine) expect(screenText(text), text).toBeNull();
  });

  it('all authored content passes: Seri Bayu, Kampung Seri, the core world and every module, in both languages', async () => {
    for (const w of ['my.seri_bayu', 'my.kampung_seri']) expect(scanDocument(await raw(`worlds/${w}.json`)), w).toEqual([]);
    for (const id of MODULES) expect(scanDocument(await raw(`modules/${id}.json`), (p) => p.startsWith('realWorld.halal') || /^(approval|licensing)/.test(p)), id).toEqual([]);
    for (const lang of ['en', 'ms'] as const) {
      activate('core.maple_hollow', lang, T0);
      const core = { BUILDINGS, ITEMS, RECIPES, QUESTS, STORIES, RESIDENTS, EVENTS, COMMUNITY_PROJECTS, ACHIEVEMENTS };
      expect(scanDocument(core), `core ${lang}`).toEqual([]);
      activate(MY, lang, T0);
      expect(scanDocument({ BUILDINGS, ITEMS, QUESTS, STORIES, RESIDENTS, EVENTS, COMMUNITY_PROJECTS }), `MY ${lang}`).toEqual([]);
    }
  });

  it('all interface text passes (both languages)', () => {
    for (const lang of ['en', 'ms'] as const) {
      const hits = scanDocument(DICTS[lang], () => false, ['religion', 'politics', 'hostility', 'restricted_product']);
      expect(hits.map((h) => `${h.path}: ${h.term}`), lang).toEqual([]);
    }
  });
});

describe('partner modules follow the content policy', () => {
  const compile = (m: ModuleManifest) => {
    const r = run(moduleSchema, m);
    if (!r.ok) throw new Error(r.issues.map((i) => i.path + ' ' + i.message).join('\n'));
    return compileModule(r.value as ModuleManifest, 'en', T0, 'MY');
  };

  it('the demo kopitiam compiles cleanly', () => {
    expect(compile(clone(kopitiam)).errors).toEqual([]);
  });

  it('rejects religious or political messaging in any language, and self-declared claims', () => {
    const a = clone(kopitiam);
    a.tagline = { 'en-MY': 'Vote for the best kopi!', 'ms-MY': 'Kopi terbaik!' };
    expect(compile(a).errors.some((e) => e.startsWith('tagline.en-MY') && e.includes('political'))).toBe(true);
    const b = clone(kopitiam);
    b.description = { 'en-MY': 'Fresh kopi every morning.', 'ms-MY': 'Selamat Hari Raya dari kopitiam kami.' };
    expect(compile(b).errors.some((e) => e.startsWith('description.ms-MY') && e.includes('religious'))).toBe(true);
    const c = clone(kopitiam);
    c.presentation.greeting = { 'en-MY': 'Proudly halal since 1965!', 'ms-MY': 'Selamat datang!' };
    expect(compile(c).errors.some((e) => e.includes('verified record'))).toBe(true);
  });

  it('the structured halal record is not prose and stays governed by its own verification rules', () => {
    const m = clone(kopitiam);
    m.realWorld = { ...(m.realWorld ?? {}), halal: { status: 'certified', certifier: 'Halal Body', certificateRef: 'H-1', verifiedAt: '2026-10-01', expires: '2027-10-01' } };
    expect(compile(m).errors).toEqual([]);
  });

  it('rejects blocked or unknown content tags, and grinding quests', () => {
    const a = clone(kopitiam);
    a.contentTags = ['food', 'politics'];
    expect(compile(a).errors).toContain(`contentTags: "politics" is outside POCKETHOOD's content policy`);
    a.contentTags = ['food', 'mystery'];
    expect(compile(a).errors).toContain('contentTags: unknown tag mystery');
    const b = clone(kopitiam);
    b.quests = [{ id: 'grind', title: { 'en-MY': 'Busy', 'ms-MY': 'Sibuk' }, giver: 'lim', intro: { 'en-MY': 'Hi', 'ms-MY': 'Hai' }, outro: { 'en-MY': 'Done', 'ms-MY': 'Siap' }, objectives: [{ type: 'counter', counter: 'orders', n: MODULE_MAX_REPEATS + 40, label: { 'en-MY': 'Lots', 'ms-MY': 'Banyak' } }], reward: { coins: 10 } }];
    expect(compile(b).errors.some((e) => e.includes('partner limit'))).toBe(true);
  });

  it('a world pack with a religious greeting is refused', () => {
    const w = clone(world);
    w.residents[0].greetings[0].text = { 'en-MY': 'Happy Deepavali!', 'ms-MY': 'Selamat Deepavali!' };
    expect(checkWorld(w).some((e) => e.includes('religious'))).toBe(true);
    expect(checkWorld(clone(world))).toEqual([]);
  });
});

describe('player-entered names', () => {
  it('neighbourhood and player names follow the policy; everyday names are fine', () => {
    const s = createNewGame(T0, 1);
    expect(dispatch(s, { type: 'profile', patch: { hoodName: 'Taman Vote Here' } }, T0).error).toBe('errors.nameNotAllowed');
    expect(dispatch(s, { type: 'profile', patch: { name: 'Pastor Bob' } }, T0).error).toBe('errors.nameNotAllowed');
    expect(dispatch(s, { type: 'profile', patch: { hoodName: 'Taman Bahagia' } }, T0).state.profile.hoodName).toBe('Taman Bahagia');
    expect(isAcceptableName('Kampung Ceria')).toBe(true);
    expect(isAcceptableName('   ')).toBe(false);
  });

  it('a shared snapshot with a name outside the policy opens with the world’s own name', () => {
    const s = createNewGame(T0, 1);
    s.profile.hoodName = 'Election Street';
    const v = decodeVisit(encodeVisit(s))!;
    expect(visitState(v, T0).profile.hoodName).not.toBe('Election Street');
  });

  it('saves from before the pavilion rename keep their progress', () => {
    const s = createNewGame(T0, 1) as unknown as Record<string, unknown>;
    const old = { ...s, version: 4, quests: { active: [{ id: 'wakaf', startedAt: 1, baseline: {} }], done: ['welcome', 'wakaf'] }, community: { projectId: 'wakaf', contributed: { coins: 50 }, ops: [], log: [], completedAt: null, rewardClaimed: false } };
    const m = migrate(old);
    expect(m.version).toBe(5);
    expect(m.quests.done).toEqual(['welcome', 'pavilion']);
    expect(m.quests.active[0].id).toBe('pavilion');
    expect(m.community.projectId).toBe('pavilion');
    expect(m.community.contributed.coins).toBe(50);
  });
});
