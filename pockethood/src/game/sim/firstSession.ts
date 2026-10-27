// First-session pacing model. A new player who follows the guide plays the real engine with
// the installed world, at human pace: every tap costs time, dialogue takes time to read, and
// the bot only does what the game is visibly asking for or what is obviously useful. It
// records when the first-five-minute milestones happen and how long the player would ever
// have nothing useful to do ("waiting walls").
//
// This is a model, not a playtest: it validates that the design *allows* the target pace.
import { BUILDINGS } from '../../data/buildings';
import { PETS } from '../../data/pets';
import { SPOTS } from '../../data/spots';
import { behaviorOf } from '../../platform/content/install';
import { RECIPES } from '../../data/items';
import { QUESTS } from '../../data/progression';
import { dispatch, type Action } from '../core/engine';
import { createNewGame } from '../core/newGame';
import type { GameEvent, GameState } from '../core/types';
import { canAfford, finishedJobs, hasItems, levelDef, passiveReady } from '../economy/economy';
import { findSpot } from '../world/grid';

export type Milestone = 'meetResident' | 'firstCollect' | 'firstBusiness' | 'firstProduct' | 'firstRequest' | 'firstReward' | 'firstImprovement' | 'nextObjective';

export interface PacingReport {
  /** Seconds from the start of the session to each milestone (undefined = not reached). */
  milestones: Partial<Record<Milestone, number>>;
  /** Longest stretch (s) with nothing useful to do. */
  longestWait: number;
  /** Every stretch of 10 s or more with nothing useful to do: [start s, length s]. */
  waits: [number, number][];
  /** Total seconds with nothing useful to do. */
  waited: number;
  /** Seconds spent in stretches of 8 s or more with nothing to do (short pauses are natural). */
  waitedLong: number;
  /** Quests completed, with the second they completed. */
  quests: { id: string; at: number }[];
  /** Notable events, for the pacing timeline. */
  timeline: { at: number; what: string }[];
  coins: number;
  level: number;
}

/** Seconds a human needs: a tap, a placement (choose + drag + confirm), reading a line. */
export const HUMAN = { tap: 1.5, place: 4, read: 2.5 };

export function simulateFirstSession(start: number, seconds = 600, seed = 4242): PacingReport {
  let s: GameState = createNewGame(start, seed);
  let now = start;
  let busy = 0;
  let wait = 0;
  const rep: PacingReport = { milestones: {}, longestWait: 0, waits: [], waited: 0, waitedLong: 0, quests: [], timeline: [], coins: 0, level: 1 };
  const at = () => Math.round((now - start) / 100) / 10;
  const mark = (m: Milestone) => rep.milestones[m] ?? (rep.milestones[m] = at());
  const onEvents = (events: GameEvent[]) => {
    for (const e of events) {
      if (e.type === 'QUEST_STARTED') {
        mark('meetResident');
        busy += HUMAN.read * 2; // intro dialogue
        if (rep.quests.length >= 4) mark('nextObjective');
      }
      if (e.type === 'RESOURCE_COLLECTED') {
        mark('firstCollect');
        if (Object.keys(e.items).length) mark('firstProduct');
      }
      if (e.type === 'BUILDING_CONSTRUCTED' && BUILDINGS[e.building]?.category === 'commercial') {
        mark('firstBusiness');
        rep.timeline.push({ at: at(), what: `${e.building} opens` });
      }
      if (e.type === 'ORDER_COMPLETED') mark('firstRequest');
      if (e.type === 'QUEST_COMPLETED') {
        mark('firstReward');
        rep.quests.push({ id: e.quest, at: at() });
        rep.timeline.push({ at: at(), what: `quest ${e.quest} done` });
        busy += HUMAN.read; // outro
      }
      if (e.type === 'BUILDING_UPGRADED' || (e.type === 'BUILDING_PLACED' && BUILDINGS[e.building]?.category === 'decoration')) mark('firstImprovement');
      if (e.type === 'LEVEL_UP') rep.timeline.push({ at: at(), what: `level ${e.level}` });
    }
  };
  const act = (a: Action, cost: number) => {
    const r = dispatch(s, a, now);
    if (r.error) return false;
    s = r.state;
    busy += cost;
    onEvents(r.events);
    return true;
  };
  act({ type: 'sessionStart' }, 0);

  const questObjectives = () => s.quests.active.flatMap((q) => QUESTS.find((d) => d.id === q.id)?.objectives ?? []);

  /** One useful thing to do now, or false. */
  const tryOne = (): boolean => {
    for (const b of s.buildings) if ((finishedJobs(b, now).length || passiveReady(b, now).cycles) && act({ type: 'collect', uid: b.uid }, HUMAN.tap)) return true;
    for (const o of s.orders) if (hasItems(s.inventory, o.items) && act({ type: 'deliverOrder', id: o.id }, HUMAN.tap * 2)) return true;
    for (const o of questObjectives()) {
      if (o.type === 'build' && !s.buildings.some((b) => b.type === o.building)) {
        const def = BUILDINGS[o.building];
        const spot = def && def.unlockLevel <= s.level && canAfford(s, def.cost) ? findSpot(s, o.building, 14, 12) : null;
        if (spot && act({ type: 'place', building: o.building, x: spot.x, z: spot.z, rot: 0 }, HUMAN.place)) return true;
      }
      if (o.type === 'upgrade') {
        const b = s.buildings.find((x) => x.type === o.building && x.level < o.level && !x.busyKind);
        if (b && act({ type: 'upgrade', uid: b.uid }, HUMAN.tap * 2)) return true;
      }
      if (o.type === 'counter' && o.counter === 'decor') {
        const deco = Object.values(BUILDINGS).filter((d) => d.category === 'decoration' && d.unlockLevel <= s.level && canAfford(s, d.cost)).sort((a, c) => (a.cost.coins ?? 0) - (c.cost.coins ?? 0))[0];
        const spot = deco ? findSpot(s, deco.id, 9, 9) : null;
        if (spot && act({ type: 'place', building: deco.id, x: spot.x, z: spot.z, rot: 0 }, HUMAN.place)) return true;
      }
      if (o.type === 'counter' && o.counter === 'contribute') {
        const have = Object.entries(s.inventory).find(([, n]) => n > 0);
        if (have && act({ type: 'contribute', resource: have[0], qty: 1, opId: `p${now}` }, HUMAN.tap * 2)) return true;
      }
    }
    // Keep shops working on what neighbours (and quests) want.
    const want = new Set([...s.orders.flatMap((o) => Object.keys(o.items)), ...questObjectives().flatMap((o) => (o.type === 'counter' && o.counter.startsWith('produce:') ? [o.counter.slice(8)] : []))]);
    for (const b of s.buildings) {
      if (b.busyKind) continue;
      const lv = levelDef(b);
      if (!lv || b.queue.length >= lv.slots) continue;
      const recipes = Object.values(RECIPES).filter((r) => r.building === b.type && r.level <= b.level && hasItems(s.inventory, r.inputs));
      recipes.sort((a, c) => Number(want.has(c.output)) - Number(want.has(a.output)) || a.seconds - c.seconds);
      if (recipes[0] && act({ type: 'produce', uid: b.uid, recipe: recipes[0].id }, HUMAN.tap)) return true;
    }
    for (const r of s.residents) if (r.lastTalkDay === null && act({ type: 'talk', resident: r.id, phase: 'day' }, HUMAN.read)) return true;
    // Give spare goods and coins to a shared spot (keeping enough to build what the guide asks for).
    const asked = new Set(questObjectives().flatMap((o) => (o.type === 'counter' && /^(spruce_stage|spot_done):/.test(o.counter) ? [o.counter.split(':')[1]] : [])));
    for (const p of SPOTS) {
      const reserve = asked.has(p.id) ? 0 : questObjectives().some((o) => o.type === 'build' || o.type === 'upgrade') ? 260 : 60;
      const st = s.spots[p.id];
      if (!st || s.level < p.minLevel || st.stage >= p.stages.length) continue;
      for (const [res, need] of Object.entries(p.stages[st.stage].needs as Record<string, number>)) {
        const left = need - ((st.given as Record<string, number>)[res] ?? 0);
        const spare = res === 'coins' ? s.coins - reserve : (s.inventory[res] ?? 0) - (want.has(res) ? 2 : 0);
        if (left > 0 && spare >= Math.min(left, res === 'coins' ? 50 : 1) && act({ type: 'spruce', spot: p.id, resource: res, qty: Math.min(left, spare), opId: `p${now}${res}` }, HUMAN.tap * 2)) return true;
      }
    }
    // Gentle activities that are always there: hand-made specials, garden plots, the lake, pets.
    for (const b of s.buildings) {
      const prep = behaviorOf(b.type, 'hand_prepare');
      if (prep && act({ type: 'handPrepare', uid: b.uid, recipe: prep.recipe, steps: prep.steps }, HUMAN.tap * prep.steps.length + 2)) return true;
      const garden = behaviorOf(b.type, 'garden_plots');
      if (garden) {
        for (let i = 0; i < garden.plots; i++) {
          if (act({ type: 'harvest', uid: b.uid, plot: i }, HUMAN.tap)) return true;
          if (act({ type: 'plant', uid: b.uid, plot: i, plant: garden.plants[0].id }, HUMAN.tap * 2)) return true;
          if (act({ type: 'water', uid: b.uid, plot: i }, HUMAN.tap)) return true;
        }
      }
    }
    if (act({ type: 'fish' }, HUMAN.read * 2)) return true;
    for (const p of PETS) if (act({ type: 'feedPet', pet: p.id }, HUMAN.tap * 2)) return true;
    return false;
  };

  for (let t = 0; t < seconds; t++) {
    now = start + t * 1000;
    act({ type: 'tick' }, 0);
    if (busy > 0) {
      busy = Math.max(0, busy - 1);
      continue;
    }
    if (tryOne()) {
      if (wait >= 10) rep.waits.push([t - wait, wait]);
      if (wait >= 8) rep.waitedLong += wait;
      wait = 0;
      continue;
    }
    wait++;
    rep.waited++;
    rep.longestWait = Math.max(rep.longestWait, wait);
  }
  rep.coins = s.coins;
  rep.level = s.level;
  return rep;
}
