import { describe, expect, it } from 'vitest';
import { dispatch, type Action } from './engine';
import { createNewGame } from './newGame';
import type { GameState } from './types';
import { canPlace, doorCell, findSpot, occupancy, placementProblem } from '../world/grid';
import { levelForXp, passiveReady, speedUpGems } from '../economy/economy';
import { generateOrder, producibleItems } from '../quests/orders';
import { generatePulse, pulseTaskProgress } from '../engagement/NeighborhoodPulse';
import { nextGoal, welcomeSummary } from '../engagement/PlayerReturnManager';
import { memoryAdapter, migrate, sanitize, SaveService } from '../../services/persistence';
import { ITEMS, RECIPES } from '../../data/items';
import { BUILDINGS } from '../../data/buildings';
import { dayKey } from './rng';
import { LocalSocialService } from '../social/SocialService';
import { tc } from '../../platform/i18n/content';

const T0 = new Date('2026-10-26T09:00:00').getTime();

/** Small harness: dispatch actions while moving a fake clock forward. */
function game(seed = 42) {
  let now = T0;
  let state = createNewGame(now, seed);
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
    try(a: Action) {
      const r = dispatch(state, a, now);
      if (!r.error) state = r.state;
      // Errors are i18n keys; tests read them in English.
      return { ...r, error: r.error ? tc(r.error, r.errorParams) : undefined };
    },
    wait(ms: number) {
      now += ms;
      state = dispatch(state, { type: 'tick' }, now).state;
    },
    uid(type: string) {
      return state.buildings.find((b) => b.type === type)!.uid;
    },
    place(type: string, x?: number, z?: number) {
      const spot = x === undefined ? findSpot(state, type, 14, 13)! : { x, z: z! };
      return h.act({ type: 'place', building: type, x: spot.x, z: spot.z, rot: 0 });
    },
    finish(type: string) {
      const b = state.buildings.find((x) => x.type === type)!;
      if (b.busyUntil) h.wait(b.busyUntil - now + 1);
    },
  };
  return h;
}

describe('world grid', () => {
  it('rejects overlap, roads, locked land and out of bounds', () => {
    const s = createNewGame(T0, 1);
    expect(placementProblem(s, 'cafe', 12, 15, 0)).toBe('occupied'); // starter house
    expect(placementProblem(s, 'cafe', 14, 18, 0)).toBe('road');
    expect(placementProblem(s, 'cafe', 2, 2, 0)).toBe('locked_land');
    expect(placementProblem(s, 'cafe', -1, 10, 0)).toBe('out_of_bounds');
    expect(canPlace(s, 'cafe', 15, 15, 0)).toBe(true);
  });
  it('rotation swaps the footprint and moves the door', () => {
    const b = { type: 'workshop', x: 10, z: 10, rot: 0 as const };
    expect(doorCell(b)).toEqual([11, 12]);
    expect(doorCell({ ...b, rot: 1 })).toEqual([12, 11]);
    const occ = occupancy([{ ...b, uid: 'w', rot: 1, level: 1, busyUntil: null, busyKind: null, queue: [], passiveSince: 0, placedAt: 0 }]);
    expect(occ.has('10,12')).toBe(true); // 2 wide × 3 deep when rotated
    expect(occ.has('12,10')).toBe(false);
  });
});

describe('core loop', () => {
  it('collecting rent updates coins and stats immediately', () => {
    const g = game();
    const before = g.s.coins;
    const ready = passiveReady(g.s.buildings.find((b) => b.type === 'starter_house')!, g.now);
    expect(ready.coins).toBe(18);
    g.act({ type: 'collect', uid: g.uid('starter_house') });
    expect(g.s.coins).toBe(before + 18 + 20); // rent + welcome quest reward
    expect(g.s.stats['collect:any']).toBe(1);
    expect(g.try({ type: 'collect', uid: g.uid('starter_house') }).error).toBeTruthy();
  });

  it('passive income is capped (no infinite offline coins)', () => {
    const g = game();
    g.wait(30 * 86_400_000);
    const b = g.s.buildings.find((x) => x.type === 'starter_house')!;
    expect(passiveReady(b, g.now).coins).toBe(6 * 10);
  });

  it('construction costs coins, takes time and then produces', () => {
    const g = game();
    const coins = g.s.coins;
    g.place('cafe', 15, 15);
    expect(g.s.coins).toBe(coins - 100);
    const cafe = g.uid('cafe');
    expect(g.try({ type: 'produce', uid: cafe, recipe: 'coffee' }).error).toMatch(/construction/);
    g.finish('cafe');
    g.act({ type: 'produce', uid: cafe, recipe: 'coffee' });
    g.act({ type: 'produce', uid: cafe, recipe: 'coffee' });
    expect(g.try({ type: 'produce', uid: cafe, recipe: 'coffee' }).error).toMatch(/full/);
    g.wait(15_000);
    g.act({ type: 'collect', uid: cafe });
    expect(g.s.inventory.coffee).toBe(1); // second job runs after the first
    g.wait(15_000);
    g.act({ type: 'collect', uid: cafe });
    expect(g.s.inventory.coffee).toBe(2);
  });

  it('production consumes inputs and refuses without them', () => {
    const g = game();
    g.set({ ...g.s, level: 3, coins: 5000 });
    g.place('flower_shop', 14, 9);
    g.finish('flower_shop');
    const shop = g.uid('flower_shop');
    expect(g.try({ type: 'produce', uid: shop, recipe: 'bouquet' }).error).toMatch(/ingredients/);
    g.set({ ...g.s, inventory: { flowers: 4 } });
    g.act({ type: 'produce', uid: shop, recipe: 'bouquet' });
    expect(g.s.inventory.flowers).toBe(1);
  });

  it('upgrades change the functional state (slots, recipes)', () => {
    const g = game();
    g.place('cafe', 15, 15);
    g.finish('cafe');
    const cafe = g.uid('cafe');
    expect(g.try({ type: 'produce', uid: cafe, recipe: 'breakfast' }).error).toMatch(/level 2/);
    g.set({ ...g.s, coins: 1000 });
    g.act({ type: 'upgrade', uid: cafe });
    g.finish('cafe');
    const b = g.s.buildings.find((x) => x.uid === cafe)!;
    expect(b.level).toBe(2);
    expect(BUILDINGS.cafe.levels[1].slots).toBe(3);
    g.set({ ...g.s, inventory: { coffee: 1, bread: 1 } });
    g.act({ type: 'produce', uid: cafe, recipe: 'breakfast' });
  });

  it('levels follow the XP table and level-ups unlock content', () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(30)).toBe(2);
    expect(levelForXp(89)).toBe(2);
    const g = game();
    expect(g.try({ type: 'place', building: 'bakery', x: 14, z: 10, rot: 0 }).error).toMatch(/level 2/);
  });

  it('speed-up spends gems and completes the timer', () => {
    const g = game();
    g.set({ ...g.s, coins: 9999, level: 7, achievements: ['first_build'] });
    expect(g.try({ type: 'place', building: 'town_hall', x: 14, z: 12, rot: 0 }).error).toMatch(/Not enough/); // needs bricks + planks
    g.place('cafe', 15, 15);
    const gems = g.s.gems;
    g.act({ type: 'speedUp', uid: g.uid('cafe') });
    expect(g.s.gems).toBe(gems - speedUpGems(5000));
    expect(g.s.buildings.find((b) => b.type === 'cafe')!.busyKind).toBeNull();
  });
});

describe('orders', () => {
  it('never requests goods the player cannot produce', () => {
    const g = game();
    expect(g.s.orders).toHaveLength(0); // nothing producible yet
    g.place('cafe', 15, 15);
    g.finish('cafe');
    expect(g.s.orders[0]).toMatchObject({ resident: 'mia', items: { coffee: 2 } });
    for (let seed = 1; seed < 60; seed++) {
      const s: GameState = { ...g.s, seed, orderCounter: 1 + seed, level: 1 + (seed % 9) };
      const o = generateOrder(s, g.now)!;
      const can = producibleItems(s);
      for (const item of Object.keys(o.items)) expect(can).toContain(item);
    }
  });

  it('pays the configured reward once and cannot be completed twice', () => {
    const g = game();
    g.place('cafe', 15, 15);
    g.finish('cafe');
    const order = g.s.orders[0];
    g.set({ ...g.s, inventory: { coffee: 4 } });
    const coins = g.s.coins;
    g.act({ type: 'deliverOrder', id: order.id });
    expect(g.s.inventory.coffee).toBe(2);
    expect(g.s.coins).toBeGreaterThanOrEqual(coins + order.reward.coins!);
    expect(g.try({ type: 'deliverOrder', id: order.id }).error).toBeTruthy();
    expect(g.s.coins).toBeGreaterThanOrEqual(coins + order.reward.coins!);
  });

  it('multi-step chains are only requested when inputs are producible', () => {
    const items = producibleItems({
      buildings: [{ uid: 'a', type: 'cafe', x: 0, z: 0, rot: 0, level: 2, busyUntil: null, busyKind: null, queue: [], passiveSince: 0, placedAt: 0 }],
    });
    expect(items).toContain('coffee');
    expect(items).not.toContain('breakfast'); // needs bread from a bakery
  });
});

describe('the first engagement flywheel (end to end)', () => {
  it('collect → produce → order → reward → upgrade → visible change → resident → next goal → persist → return', async () => {
    const g = game(7);
    expect(g.s.quests.active.map((q) => q.id)).toEqual(['welcome']);
    // 1. collect resources
    g.act({ type: 'collect', uid: g.uid('starter_house') });
    expect(g.s.quests.done).toContain('welcome');
    // 2. build the café
    g.place('cafe', 15, 15);
    g.finish('cafe');
    expect(g.s.quests.done).toContain('open_cafe');
    expect(g.s.residents.find((r) => r.id === 'mia')!.memories.opened_cafe).toBeTruthy();
    // 3. brew three coffees
    const cafe = g.uid('cafe');
    for (let i = 0; i < 3; i++) {
      g.act({ type: 'produce', uid: cafe, recipe: 'coffee' });
      g.wait(15_001);
      g.act({ type: 'collect', uid: cafe });
    }
    expect(g.s.quests.done).toContain('first_brew');
    // 4. complete Mia's order → coins + XP
    const xp = g.s.xp;
    g.act({ type: 'deliverOrder', id: g.s.orders.find((o) => o.resident === 'mia')!.id });
    expect(g.s.xp).toBeGreaterThan(xp);
    expect(g.s.quests.done).toContain('first_order');
    expect(g.s.level).toBeGreaterThanOrEqual(2);
    // 5. rewards fund the upgrade, which changes function and visuals
    expect(g.s.coins).toBeGreaterThanOrEqual(BUILDINGS.cafe.levels[1].upgradeCost.coins!);
    g.act({ type: 'upgrade', uid: cafe });
    g.finish('cafe');
    expect(g.s.buildings.find((b) => b.uid === cafe)!.level).toBe(2);
    expect(g.s.quests.done).toContain('cafe_upgrade');
    // 5b. the tutorial's next step (Community Garden) is affordable right away — no dead end
    expect(g.s.quests.active.map((q) => q.id)).toContain('meet_luna');
    expect(g.s.coins).toBeGreaterThanOrEqual(BUILDINGS.garden.cost.coins!);
    // 6. the improvement triggers a resident interaction: Mia remembers & has a new story
    expect(g.s.residents.find((r) => r.id === 'mia')!.memories.upgraded_cafe_2).toBeTruthy();
    const talk = g.act({ type: 'talk', resident: 'mia', phase: 'day' });
    expect(talk.events.some((e) => e.type === 'RESIDENT_INTERACTED')).toBe(true);
    g.act({ type: 'startStory', resident: 'mia' });
    expect(g.s.residents.find((r) => r.id === 'mia')!.storyActive?.id).toBe('mia_1');
    // 7. the next achievable goal points at real content
    const goal = nextGoal(g.s, g.now);
    expect(goal?.text).toBeTruthy();
    // 8. personalise the improved area
    g.act({ type: 'place', building: 'flower_bed', x: 14, z: 15, rot: 0 });
    expect(g.s.stats.decor).toBe(1);
    // 9. persistence survives a "browser restart"
    const store = memoryAdapter();
    const saves = new SaveService(store);
    await saves.save(g.s);
    const loaded = await saves.load(g.now + 3 * 3_600_000);
    expect(loaded.fresh).toBe(false);
    expect(loaded.state.residents.find((r) => r.id === 'mia')!.memories.upgraded_cafe_2).toBeTruthy();
    expect(loaded.state.quests.done).toEqual(g.s.quests.done);
    // 10. returning later presents a useful next objective without penalties
    const later = g.now + 3 * 3_600_000;
    const summary = welcomeSummary({ ...loaded.state, tutorial: { ...loaded.state.tutorial, done: true } }, later);
    expect(summary?.coinsWaiting).toBeGreaterThan(0);
    expect(summary?.nextGoal?.text).toBeTruthy();
    expect(loaded.state.residents.find((r) => r.id === 'mia')!.friendship).toBe(g.s.residents.find((r) => r.id === 'mia')!.friendship);
  });
});

describe('residents & stories', () => {
  it('talking raises friendship once per day; gifts once per day', () => {
    const g = game();
    g.act({ type: 'talk', resident: 'mia', phase: 'day' });
    g.act({ type: 'talk', resident: 'mia', phase: 'day' });
    expect(g.s.residents[0].friendship).toBe(3);
    g.set({ ...g.s, inventory: { flowers: 2 } });
    const r = g.act({ type: 'gift', resident: 'mia', item: 'flowers' });
    expect(r.events.find((e) => e.type === 'GIFT_GIVEN')).toMatchObject({ reaction: 'love' });
    expect(g.s.residents[0].friendship).toBe(11);
    expect(g.try({ type: 'gift', resident: 'mia', item: 'flowers' }).error).toMatch(/already/);
    g.wait(86_400_000);
    g.act({ type: 'talk', resident: 'mia', phase: 'day' });
    expect(g.s.residents[0].friendship).toBe(14);
  });

  it('relationship milestones unlock story chapters and keepsakes, rewarded once', () => {
    const g = game();
    g.set({ ...g.s, level: 3, coins: 9999, quests: { ...g.s.quests, done: [...g.s.quests.done, 'cafe_upgrade'] } });
    g.place('cafe', 15, 15);
    g.finish('cafe');
    g.act({ type: 'startStory', resident: 'mia' });
    expect(g.try({ type: 'deliverStory', resident: 'mia' }).error).toBeTruthy();
    g.set({ ...g.s, inventory: { coffee: 4 } });
    g.act({ type: 'deliverStory', resident: 'mia' });
    const mia = () => g.s.residents.find((r) => r.id === 'mia')!;
    expect(mia().storyDone).toContain('mia_1');
    expect(mia().memories.mia_regulars).toBeTruthy();
    expect(g.s.flags.cafe_chalkboard).toBe(true);
    // mia_2 requires friendship level 2 ("Friend")
    expect(g.try({ type: 'startStory', resident: 'mia' }).error).toBeTruthy();
    g.set({ ...g.s, residents: g.s.residents.map((r) => (r.id === 'mia' ? { ...r, friendship: 30 } : r)) });
    g.act({ type: 'startStory', resident: 'mia' });
    g.set({ ...g.s, inventory: { breakfast: 2 } });
    g.act({ type: 'deliverStory', resident: 'mia' });
    expect(g.s.unlocked).toContain('parasol');
    const coins = g.s.coins;
    g.wait(1000);
    expect(g.s.coins).toBe(coins); // no double reward on later ticks
    expect(g.s.stats.story).toBe(2);
  });

  it('residents arrive when their workplace is built', () => {
    const g = game();
    g.set({ ...g.s, level: 2, coins: 999 });
    g.place('bakery', 14, 9);
    expect(g.s.residents.some((r) => r.id === 'felix')).toBe(false);
    g.finish('bakery');
    expect(g.s.residents.some((r) => r.id === 'felix')).toBe(true);
    expect(g.s.history.some((h) => h.key === 'history.arrived' && h.params?.resident === 'felix')).toBe(true);
  });
});

describe('neighborhood pulse', () => {
  it('never generates impossible goals across many seeds and days', () => {
    const g = game();
    g.set({ ...g.s, tutorial: { step: 9, done: true, skipped: false } });
    g.place('cafe', 15, 15);
    g.finish('cafe');
    for (let seed = 0; seed < 200; seed++) {
      const s = { ...g.s, seed };
      const p = generatePulse(s, dayKey(g.now + seed * 86_400_000));
      expect(p.tasks).toHaveLength(3);
      for (const t of p.tasks) {
        if (t.counter.startsWith('produce:')) expect(producibleItems(s)).toContain(t.counter.split(':')[1]);
        if (t.counter.startsWith('talk:') || t.counter.startsWith('gift:')) expect(s.residents.map((r) => r.id)).toContain(t.counter.split(':')[1]);
        if (t.counter === 'orders') expect(producibleItems(s).length).toBeGreaterThan(0);
      }
    }
  });

  it('completed tasks pay once; bonus requires all three', () => {
    const g = game();
    g.set({ ...g.s, tutorial: { step: 9, done: true, skipped: false } });
    g.wait(1000);
    const pulse = g.s.pulse!;
    expect(pulse.tasks).toHaveLength(3);
    const talkTask = pulse.tasks.find((t) => t.kind === 'resident')!;
    expect(g.try({ type: 'claimPulseBonus' }).error).toBeTruthy();
    g.act({ type: 'talk', resident: 'mia', phase: 'day' });
    if (talkTask.counter === 'talk:mia' || talkTask.counter === 'talk') {
      const t = g.s.pulse!.tasks.find((x) => x.kind === 'resident')!;
      if (pulseTaskProgress(g.s, t) >= t.n) expect(t.claimed).toBe(true);
    }
    const coins = g.s.coins;
    g.wait(1000);
    expect(g.s.coins).toBe(coins);
  });
});

describe('community project', () => {
  it('contributions are idempotent per op id and capped by requirement', () => {
    const g = game();
    g.set({ ...g.s, level: 3, coins: 1000, inventory: { planks: 10 } });
    g.act({ type: 'contribute', resource: 'planks', qty: 3, opId: 'op-1' });
    const r = dispatch(g.s, { type: 'contribute', resource: 'planks', qty: 3, opId: 'op-1' }, g.now);
    expect(r.state.inventory.planks).toBe(7);
    expect(r.state.community.contributed.planks).toBe(3);
    g.act({ type: 'contribute', resource: 'planks', qty: 99, opId: 'op-2' });
    expect(g.s.community.contributed.planks).toBe(5); // requirement cap
    expect(g.s.inventory.planks).toBe(5);
  });

  it('completing the landmark is recorded in history and remembered by residents', () => {
    const g = game();
    g.set({ ...g.s, level: 3, coins: 1000, inventory: { planks: 5, flowers: 8, bread: 6 } });
    for (const [res, q] of [['coins', 300], ['planks', 5], ['flowers', 8], ['bread', 6]] as const)
      g.act({ type: 'contribute', resource: res, qty: q, opId: `op-${res}` });
    expect(g.s.community.completedAt).toBeTruthy();
    expect(g.s.flags.fountain_complete).toBe(true);
    expect(g.s.residents[0].memories.landmark_built).toBeTruthy();
    g.act({ type: 'claimCommunityReward' });
    expect(g.s.unlocked).toContain('statue');
    expect(g.try({ type: 'claimCommunityReward' }).error).toBeTruthy();
  });
});

describe('expansion', () => {
  it('requires level, adjacency and coins', () => {
    const g = game();
    expect(g.try({ type: 'unlockPlot', plot: 'p01' }).error).toMatch(/level/);
    g.set({ ...g.s, level: 4, coins: 2000 });
    expect(g.try({ type: 'unlockPlot', plot: 'p00' }).error).toBeTruthy(); // corner, ring 2
    g.act({ type: 'unlockPlot', plot: 'p01' });
    expect(g.s.plots).toContain('p01');
    expect(canPlace(g.s, 'bush', 2, 8, 0)).toBe(true);
  });
});

describe('persistence & recovery', () => {
  it('migrates old saves and repairs invalid values', () => {
    const fresh = createNewGame(T0, 3);
    const old = { ...fresh, version: 1 } as Record<string, unknown>;
    delete old.flags;
    delete old.community;
    const migrated = migrate(old);
    expect(migrated.version).toBe(4);
    expect(migrated.world.id).toBe('core.maple_hollow');
    expect(migrated.community.projectId).toBe('fountain');
    const broken = sanitize({ ...migrated, coins: NaN, inventory: { coffee: -3 }, buildings: [...migrated.buildings, { type: 'nope' } as never] }, T0);
    expect(broken.coins).toBe(150);
    expect(broken.inventory.coffee).toBeUndefined();
    expect(broken.buildings.every((b) => BUILDINGS[b.type])).toBe(true);
  });

  it('a corrupt save starts fresh and keeps a backup', async () => {
    const store = memoryAdapter();
    await store.set('pockethood.save', '{not json');
    const r = await new SaveService(store).load(T0);
    expect(r.recovered).toBe(true);
    expect([...store.data.keys()].some((k) => k.includes('corrupt'))).toBe(true);
  });

  it('prefers a newer unload-time snapshot over an older async save', async () => {
    const store = memoryAdapter();
    const mem = new Map<string, string>();
    const sync = { getItem: (k: string) => mem.get(k) ?? null, setItem: (k: string, v: string) => void mem.set(k, v), removeItem: (k: string) => void mem.delete(k) };
    const svc = new SaveService(store, sync);
    const a = createNewGame(T0, 5);
    await svc.save({ ...a, coins: 1, lastSeen: T0 });
    svc.saveSync({ ...a, coins: 999, lastSeen: T0 + 1000 });
    expect((await svc.load(T0 + 2000)).state.coins).toBe(999);
    await svc.save({ ...a, coins: 5, lastSeen: T0 + 5000 });
    expect((await svc.load(T0 + 6000)).state.coins).toBe(5);
  });

  it('clamps timers far in the future (clock manipulation guard)', () => {
    const s = createNewGame(T0, 3);
    s.buildings[0].busyUntil = T0 + 365 * 86_400_000;
    s.buildings[0].passiveSince = T0 + 86_400_000;
    const fixed = sanitize(s, T0);
    expect(fixed.buildings[0].busyUntil).toBe(T0);
    expect(fixed.buildings[0].passiveSince).toBe(T0);
  });
});

describe('content integrity', () => {
  it('every recipe references real items and buildings', () => {
    for (const r of Object.values(RECIPES)) {
      expect(ITEMS[r.output]).toBeTruthy();
      expect(BUILDINGS[r.building]).toBeTruthy();
      for (const i of Object.keys(r.inputs)) expect(ITEMS[i]).toBeTruthy();
    }
  });
  it('social features are honest about being offline', async () => {
    const svc = new LocalSocialService('Me');
    expect(svc.online).toBe(false);
    expect(await svc.listFriends()).toEqual([]);
    expect((await svc.sendGift()).ok).toBe(false);
  });
  it('skipping the tutorial does not block solo progression', () => {
    const g = game();
    g.act({ type: 'tutorial', skip: true });
    g.wait(1000);
    expect(g.s.pulse).not.toBeNull();
    g.place('cafe', 15, 15);
    g.finish('cafe');
    expect(g.s.orders.length).toBeGreaterThan(0);
  });
});
