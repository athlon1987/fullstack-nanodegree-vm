// Community: shared spots the neighbourhood transforms together, and rotating celebrations.
import { beforeAll, beforeEach, describe, expect, it } from 'vitest';
import { BUILDINGS } from '../data/buildings';
import { EVENTS } from '../data/progression';
import { SPOTS, SPOT_PLACES, refreshNeeds } from '../data/spots';
import { activate, initContent } from '../platform/content/service';
import { memoryAdapter, SaveService } from '../services/persistence';
import { dispatch, type Action } from './core/engine';
import { createNewGame } from './core/newGame';
import type { GameEvent, GameState } from './core/types';
import { nextEvent } from './engagement/events';
import { canPlace } from './world/grid';

const T0 = new Date('2026-11-02T09:00:00').getTime();
const DAY = 86_400_000;

beforeAll(async () => {
  await initContent({ remoteBase: null, cache: null });
});
beforeEach(() => activate('my.kampung_seri', 'en', T0));

function play(patch: Partial<GameState> = {}) {
  let s = { ...createNewGame(T0, 7), ...patch };
  let now = T0;
  const events: GameEvent[] = [];
  return {
    get s() {
      return s;
    },
    events,
    act(a: Action) {
      const r = dispatch(s, a, now);
      if (r.error) throw new Error(r.error);
      s = r.state;
      events.push(...r.events);
      return r;
    },
    err: (a: Action) => dispatch(s, a, now).error,
    wait(ms: number) {
      now += ms;
      const r = dispatch(s, { type: 'tick' }, now);
      s = r.state;
      events.push(...r.events);
    },
    set(next: GameState) {
      s = next;
    },
  };
}
let op = 0;
const give = (spot: string, resource: string, qty: number): Action => ({ type: 'spruce', spot, resource, qty, opId: `t${++op}` });

describe('shared spots', () => {
  it('every new world starts with the four spots on shared land just past the border', () => {
    const s = createNewGame(T0, 1);
    for (const p of SPOTS) {
      const b = s.buildings.find((x) => x.type === p.building)!;
      expect(b, p.id).toBeDefined();
      expect([b.x, b.z]).toEqual(SPOT_PLACES[p.id]);
      expect(s.spots[p.id]).toEqual({ stage: 0, given: {}, ops: [], doneAt: null });
      expect(BUILDINGS[p.building].walkable).toBe(true);
    }
    // Nobody can build over a spot, even after buying the land around it.
    const all = { ...s, plots: ['p11', 'p21', 'p12', 'p22', 'p31', 'p20', 'p02', 'p23'] };
    expect(canPlace(all, 'cafe', SPOT_PLACES.park[0], SPOT_PLACES.park[1], 0)).toBe(false);
  });

  it('gifts add up step by step; a finished step changes the spot, thanks every neighbour and never pays coins back', () => {
    const g = play();
    g.set({ ...g.s, level: 2, coins: 500, inventory: { flowers: 10 } });
    const friendship = () => g.s.residents.map((r) => r.friendship);
    const before = friendship();
    g.act(give('park', 'coins', 40));
    expect(g.s.spots.park).toMatchObject({ stage: 0, given: { coins: 40 } });
    expect(g.s.coins).toBe(460);
    g.act(give('park', 'coins', 999)); // capped at what's still needed
    expect(g.s.coins).toBe(440);
    expect(g.s.spots.park.stage).toBe(1);
    expect(g.s.spots.park.given).toEqual({});
    expect(friendship().every((f, i) => f === before[i] + SPOTS[0].stages[0].friendship)).toBe(true);
    expect(g.events.some((e) => e.type === 'SPOT_STAGE' && e.spot === 'park' && e.stage === 1 && !e.final)).toBe(true);
    expect(g.s.stats['spruce_stage:park']).toBe(1);
    // Coins never come back from a spot.
    expect(g.events.filter((e) => e.type === 'SPOT_STAGE').length).toBe(1);
    expect(g.s.coins).toBe(440);
    // Only what the step needs is accepted.
    expect(g.err(give('park', 'bread', 1))).toBe('errors.notNeeded');
    g.act(give('park', 'flowers', 6));
    expect(g.s.inventory.flowers).toBe(4);
  });

  it('a repeated request (same op id) is applied once', () => {
    const g = play();
    g.set({ ...g.s, level: 2, coins: 500 });
    const a = give('park', 'coins', 20);
    g.act(a);
    g.act(a);
    expect(g.s.spots.park.given.coins).toBe(20);
    expect(g.s.coins).toBe(480);
  });

  it('spots open at their level; finishing one sets its flag, unlocks a keepsake and opens a celebration', () => {
    const g = play();
    g.set({ ...g.s, level: 1, coins: 5000 });
    expect(g.err(give('park', 'coins', 10))).toBe('errors.unlocksAt');
    g.set({ ...g.s, level: 2, inventory: { flowers: 20, planks: 20, coffee: 10, bread: 10 } });
    for (const step of SPOTS[0].stages) for (const [res, n] of Object.entries(step.needs)) g.act(give('park', res, n as number));
    expect(g.s.spots.park.stage).toBe(4);
    expect(g.s.spots.park.doneAt).toBe(T0);
    expect(g.s.flags.spot_park).toBe(true);
    expect(g.s.unlocked).toContain('picnic_set');
    // Once finished, the spot can optionally be refreshed each season (a fresh look; needs grow).
    expect(g.err(give('park', 'bread', 1))).toBe('errors.notNeeded');
    g.set({ ...g.s, coins: 5000, inventory: { flowers: 40, coffee: 20 } });
    for (const [res, n] of Object.entries(refreshNeeds(SPOTS[0], 0))) g.act(give('park', res, n));
    expect(g.s.spots.park.refreshes).toBe(1);
    expect(g.events.some((e) => e.type === 'SPOT_REFRESHED' && e.season === 1)).toBe(true);
    expect(refreshNeeds(SPOTS[0], 1).coins).toBeGreaterThan(refreshNeeds(SPOTS[0], 0).coins);
    expect(g.s.history.some((h) => h.key === 'history.spotDone')).toBe(true);
    // The garden party needs the finished park.
    const party = EVENTS.find((e) => e.id === 'garden_party')!;
    expect(party.requires).toBe('spot_park');
  });

  it('saves from before spots existed get them on load, without moving anything the player built', async () => {
    const old = createNewGame(T0, 3) as unknown as Record<string, unknown>;
    const buildings = (old.buildings as { type: string }[]).filter((b) => !b.type.startsWith('spot_'));
    const raw = { ...old, version: 4, buildings, spots: undefined };
    const adapter = memoryAdapter();
    await adapter.set('pockethood.save', JSON.stringify(raw));
    const { state } = await new SaveService(adapter, null).load(T0);
    for (const p of SPOTS) expect(state.buildings.filter((b) => b.type === p.building)).toHaveLength(1);
    expect(state.spots.plaza.stage).toBe(0);
    expect(new Set(state.buildings.map((b) => b.uid)).size).toBe(state.buildings.length);
  });
});

describe('community celebrations', () => {
  it('take turns with a day of rest, skipping ones the neighbourhood isn’t ready for', () => {
    const g = play();
    g.set({ ...g.s, level: 4, tutorial: { step: 99, done: true, skipped: false } });
    g.wait(1000);
    const first = g.s.event!.id;
    expect(EVENTS.find((e) => e.id === first)!.requires).toBeUndefined();
    const def = EVENTS.find((e) => e.id === first)!;
    g.wait(def.durationDays * DAY + 1000);
    expect(g.s.event!.id).toBe(first); // resting
    g.wait(DAY);
    const second = g.s.event!.id;
    expect(second).not.toBe(first);
    expect(EVENTS.find((e) => e.id === second)!.requires).toBeUndefined();
    // With the park finished, the garden party joins the rotation.
    g.set({ ...g.s, flags: { ...g.s.flags, spot_park: true }, event: { id: 'anniversary', startedAt: 0, baseline: {}, claimedTiers: [] } });
    expect(nextEvent(g.s, g.s.event!.startedAt + 10 * DAY)?.id).toBe(EVENTS[0].id);
    g.set({ ...g.s, event: { id: 'music_night', startedAt: 0, baseline: {}, claimedTiers: [] } });
    expect(nextEvent(g.s, 10 * DAY)?.id).toBe('garden_party');
  });
});
