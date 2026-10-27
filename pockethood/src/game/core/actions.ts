// Player & system actions. Every action is a pure function of (state, action, now):
// it copies the state, applies rules, and returns the new state plus emitted events.
// In online mode the same functions are designed to run server-side (authoritative).
import { BUILDINGS, bdef, isDecoration, isFixed } from '../../data/buildings';
import { FISH, PETS } from '../../data/pets';
import { behaviorOf } from '../../platform/content/install';
import { MAX_WATER, canWater, readyAt } from '../behaviors/garden';
import { ITEMS, RECIPES } from '../../data/items';
import { COMMUNITY_PROJECTS, EXPANSIONS, START_PLOTS, expansionCost } from '../../data/progression';
import { RESIDENTS, rdef } from '../../data/residents';
import { activeChapter, chooseLine, eligibleChapter, giftReaction } from '../characters/relationships';
import {
  addFriendship,
  addItems,
  buildSeconds,
  canAfford,
  finishedJobs,
  grantReward,
  grantXp,
  hasItems,
  levelDef,
  missingFor,
  orderSlots,
  passiveReady,
  pay,
  recipeDurationMs,
  removeItems,
  speedUpGems,
  upgradeSeconds,
} from '../economy/economy';
import { PULSE_BONUS } from '../engagement/NeighborhoodPulse';
import { baselineFor } from '../engagement/objectives';
import { generateOrder } from '../quests/orders';
import { placementProblem } from '../world/grid';
import { dayKey, hashString, rng } from './rng';
import type { ActionResult, BuildingInstance, DayPhase, GameEvent, GameState, Rotation, Settings, PlayerProfile, TextParams } from './types';
import { isAcceptableName } from '../../platform/content/policy';
import { spotDef, spotNeeds } from '../../data/spots';
import { nextEvent } from '../engagement/events';

export type Action =
  | { type: 'tick' }
  | { type: 'place'; building: string; x: number; z: number; rot: Rotation }
  | { type: 'move'; uid: string; x: number; z: number; rot: Rotation }
  | { type: 'sell'; uid: string }
  | { type: 'produce'; uid: string; recipe: string }
  | { type: 'collect'; uid: string }
  | { type: 'upgrade'; uid: string }
  | { type: 'speedUp'; uid: string }
  | { type: 'deliverOrder'; id: string }
  | { type: 'skipOrder'; id: string }
  | { type: 'talk'; resident: string; phase: DayPhase }
  | { type: 'gift'; resident: string; item: string }
  | { type: 'startStory'; resident: string }
  | { type: 'deliverStory'; resident: string }
  | { type: 'contribute'; resource: string; qty: number; opId: string }
  | { type: 'spruce'; spot: string; resource: string; qty: number; opId: string }
  | { type: 'unlockPlot'; plot: string }
  | { type: 'sellItem'; item: string; qty: number }
  | { type: 'photo' }
  | { type: 'tutorial'; step?: number; done?: boolean; skip?: boolean }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'profile'; patch: Partial<PlayerProfile> }
  | { type: 'claimPulseBonus' }
  | { type: 'claimCommunityReward' }
  | { type: 'sessionStart' }
  // Module behaviours (data-parameterised, rules live here)
  | { type: 'handPrepare'; uid: string; recipe: string; steps: string[] }
  | { type: 'quizAnswer'; uid: string; question: string; choice: number }
  | { type: 'showroomSet'; uid: string; slot: number; model: string; paint: string }
  | { type: 'plant'; uid: string; plot: number; plant: string }
  | { type: 'water'; uid: string; plot: number }
  | { type: 'harvest'; uid: string; plot: number }
  // Gentle activities (Zen): journals and moments, never currencies
  | { type: 'fish' }
  | { type: 'feedPet'; pet: string }
  | { type: 'zenMoment'; kind: 'sunset' | 'lake' | 'arrange' };

// New requests arrive at a neighborly pace (the main coin faucet is throttled here). Early on
// they come quickly so a new player always has something to do; later they settle down.
export const orderCooldownMs = (level: number) => (level <= 2 ? 30_000 : level <= 4 ? 60_000 : 120_000);
const SKIP_COOLDOWN_MS = 180_000;

export const FISH_REST_MS = 40_000;
export const MOMENT_REST_MS = 3 * 60_000;

/** Refuse an action with an i18n key (errors.*) and optional placeholders. */
const fail = (state: GameState, error: string, errorParams?: TextParams): ActionResult => ({ state, events: [], error: `errors.${error}`, errorParams });
const find = (s: GameState, uid: string) => s.buildings.find((b) => b.uid === uid);

/** Cheap check: would a tick change anything? Lets idle ticks skip cloning entirely. */
export function tickNeeded(s: GameState, now: number): boolean {
  if (s.buildings.some((b) => b.busyUntil !== null && b.busyUntil <= now)) return true;
  for (const [id, def] of Object.entries(RESIDENTS)) {
    if (s.residents.some((r) => r.id === id)) continue;
    const a = def.arrival;
    if (a.type === 'start' || (a.type === 'level' && s.level >= a.level) || (a.type === 'building' && s.buildings.some((b) => b.type === a.building && b.busyKind !== 'build'))) return true;
  }
  if (s.orderCooldowns.some((t) => t <= now)) return true;
  if (s.orders.some((o) => Object.keys(o.items).some((i) => !ITEMS[i]))) return true;
  if (s.orders.length + s.orderCooldowns.length < orderSlots(s) && generateOrder(s, now)) return true;
  if (nextEvent(s, now)) return true;
  return false;
}

export function applyAction(prev: GameState, action: Action, now: number): ActionResult {
  if (action.type === 'tick' && !tickNeeded(prev, now)) return { state: prev, events: [] };
  const s: GameState = structuredClone(prev);
  const ev: GameEvent[] = [];
  const ok = (): ActionResult => ({ state: s, events: ev });

  switch (action.type) {
    case 'tick':
    case 'sessionStart': {
      if (action.type === 'sessionStart') {
        s.sessions += 1;
        s.lastSessionStart = now;
      }
      // Timers are timestamp-based, so "offline progression" is just catching up.
      for (const b of s.buildings) {
        if (b.busyUntil !== null && b.busyUntil <= now) {
          const kind = b.busyKind;
          b.busyUntil = null;
          b.busyKind = null;
          if (kind === 'build') {
            b.passiveSince = now;
            ev.push({ type: 'BUILDING_CONSTRUCTED', uid: b.uid, building: b.type });
            grantXp(s, bdef(b.type).xp, ev);
          } else if (kind === 'upgrade') {
            b.level = Math.min(b.level + 1, bdef(b.type).levels.length);
            ev.push({ type: 'BUILDING_UPGRADED', uid: b.uid, building: b.type, level: b.level });
            grantXp(s, levelDef(b)?.xp ?? 0, ev);
          }
        }
      }
      // Resident arrivals
      for (const [id, def] of Object.entries(RESIDENTS)) {
        if (s.residents.some((r) => r.id === id)) continue;
        const a = def.arrival;
        const arrived =
          a.type === 'start' ||
          (a.type === 'level' && s.level >= a.level) ||
          (a.type === 'building' && s.buildings.some((b) => b.type === a.building && b.busyKind !== 'build'));
        if (arrived) {
          s.residents.push({ id, arrivedAt: now, friendship: 0, memories: { moved_in: now }, lastTalkDay: null, lastGiftDay: null, storyDone: [], storyActive: null });
          ev.push({ type: 'RESIDENT_ARRIVED', resident: id });
        }
      }
      // Orders for goods whose content was withdrawn can't be filled: retire them gently.
      for (const o of s.orders.filter((x) => Object.keys(x.items).some((i) => !ITEMS[i]))) {
        s.orders = s.orders.filter((x) => x !== o);
        s.orderCooldowns.push(now + 30_000);
      }
      // Order board: reopen cooled-down slots and fill empty ones
      s.orderCooldowns = s.orderCooldowns.filter((t) => t > now);
      while (s.orders.length + s.orderCooldowns.length < orderSlots(s)) {
        const o = generateOrder(s, now);
        if (!o) break;
        s.orders.push(o);
        s.orderCounter++;
      }
      // Community celebrations take turns, with a day's rest in between.
      const evDef = nextEvent(s, now);
      if (evDef) {
        s.event = { id: evDef.id, startedAt: now, baseline: baselineFor(s, evDef.objectives), claimedTiers: [] };
        ev.push({ type: 'EVENT_STARTED', event: evDef.id });
      }
      return ok();
    }

    case 'place': {
      const def = BUILDINGS[action.building];
      if (!def || (def.hidden && !def.keepsake)) return fail(s, 'unknownBuilding');
      const unlocked = def.keepsake ? s.unlocked.includes(def.id) : def.unlockLevel <= s.level;
      if (!unlocked) return def.keepsake ? fail(s, 'notUnlocked') : fail(s, 'unlocksAt', { level: def.unlockLevel });
      const count = s.buildings.filter((b) => b.type === def.id).length;
      if (def.maxCount !== undefined && count >= def.maxCount) return fail(s, 'maxCount');
      const problem = placementProblem(s, def.id, action.x, action.z, action.rot);
      if (problem) return fail(s, `place.${problem}`);
      if (!canAfford(s, def.cost)) return fail(s, 'notEnough', { missing: missingFor(s, def.cost).join(', ') });
      pay(s, def.cost);
      const secs = buildSeconds(def.id);
      const b: BuildingInstance = {
        uid: `b${++s.uidCounter}`,
        type: def.id,
        x: action.x,
        z: action.z,
        rot: action.rot,
        level: 1,
        busyUntil: secs > 0 ? now + secs * 1000 : null,
        busyKind: secs > 0 ? 'build' : null,
        busyFrom: now,
        queue: [],
        passiveSince: now,
        placedAt: now,
        fp: [...def.footprint],
      };
      s.buildings.push(b);
      ev.push({ type: 'BUILDING_PLACED', uid: b.uid, building: def.id });
      if (isDecoration(def.id)) {
        ev.push({ type: 'DECORATION_PLACED', uid: b.uid, building: def.id });
        grantXp(s, def.xp, ev);
      }
      return ok();
    }

    case 'move': {
      const b = find(s, action.uid);
      if (!b) return fail(s, 'notFound');
      if (isFixed(b.type) && b.type !== 'starter_house' && b.type !== 'request_board' && b.type !== 'welcome_sign') return fail(s, 'landmarkFixed');
      const problem = placementProblem(s, b.type, action.x, action.z, action.rot, b.uid);
      if (problem) return fail(s, `place.${problem}`);
      Object.assign(b, { x: action.x, z: action.z, rot: action.rot });
      ev.push({ type: 'BUILDING_MOVED', uid: b.uid });
      return ok();
    }

    case 'sell': {
      const b = find(s, action.uid);
      if (!b) return fail(s, 'notFound');
      const def = BUILDINGS[b.type];
      if (b.type === 'starter_house') return fail(s, 'sellHome');
      if (isFixed(b.type)) return fail(s, 'landmarkKept');
      if (!def || !isDecoration(b.type)) return fail(s, 'sellDecorOnly');
      const refund = Math.floor((def.cost.coins ?? 0) * (def.sellRefund ?? 0.5));
      s.coins += refund;
      s.buildings = s.buildings.filter((x) => x.uid !== b.uid);
      ev.push({ type: 'BUILDING_SOLD', uid: b.uid, building: b.type });
      return ok();
    }

    case 'produce': {
      const b = find(s, action.uid);
      const recipe = RECIPES[action.recipe];
      if (!b || !recipe || recipe.building !== b.type) return fail(s, 'invalidRecipe');
      if (b.busyKind) return fail(s, b.busyKind === 'build' ? 'underConstruction' : 'busyUpgrading');
      if (b.level < recipe.level) return fail(s, 'recipeLevel', { level: recipe.level });
      if (b.queue.length >= (levelDef(b)?.slots ?? 0)) return fail(s, 'queueFull');
      if (!hasItems(s.inventory, recipe.inputs)) return fail(s, 'missingIngredients');
      if ((recipe.coins ?? 0) > s.coins) return fail(s, 'ingredientCoins', { n: recipe.coins ?? 0 });
      removeItems(s.inventory, recipe.inputs);
      s.coins -= recipe.coins ?? 0;
      const last = b.queue[b.queue.length - 1];
      const start = Math.max(now, last?.end ?? 0);
      b.queue.push({ recipe: recipe.id, start, end: start + recipeDurationMs(recipe.id, b), out: { item: recipe.output, qty: recipe.qty, xp: recipe.xp } });
      ev.push({ type: 'PRODUCTION_STARTED', uid: b.uid, recipe: recipe.id });
      return ok();
    }

    case 'collect': {
      const b = find(s, action.uid);
      if (!b) return fail(s, 'notFound');
      const done = finishedJobs(b, now);
      const passive = passiveReady(b, now);
      if (!done.length && !passive.cycles) return fail(s, 'nothingToCollect');
      const items: Record<string, number> = {};
      let xp = 0;
      for (const j of done) {
        // The snapshot taken at start pays out even if the recipe's module has since been withdrawn.
        const r = RECIPES[j.recipe];
        const out = j.out ?? (r && { item: r.output, qty: r.qty, xp: r.xp });
        if (!out) continue;
        items[out.item] = (items[out.item] ?? 0) + out.qty;
        xp += out.xp;
      }
      b.queue = b.queue.filter((j) => j.end > now);
      addItems(s.inventory, items);
      if (passive.cycles) {
        const p = levelDef(b)!.passive!;
        s.coins += passive.coins;
        // Keep the partial cycle's progress unless storage was full.
        b.passiveSince = passive.cycles >= p.cycles ? now : b.passiveSince + passive.cycles * p.seconds * 1000;
      }
      grantXp(s, xp, ev);
      ev.push({ type: 'RESOURCE_COLLECTED', uid: b.uid, coins: passive.coins, items, xp });
      return ok();
    }

    case 'upgrade': {
      const b = find(s, action.uid);
      if (!b) return fail(s, 'notFound');
      const def = BUILDINGS[b.type];
      if (!def) return fail(s, 'unavailable');
      const next = def.levels[b.level];
      if (!next) return fail(s, 'maxLevel');
      if (b.busyKind) return fail(s, 'busy');
      if (!canAfford(s, next.upgradeCost)) return fail(s, 'notEnough', { missing: missingFor(s, next.upgradeCost).join(', ') });
      pay(s, next.upgradeCost);
      b.busyKind = 'upgrade';
      b.busyFrom = now;
      b.busyUntil = now + upgradeSeconds(b.type, b.level + 1) * 1000;
      return ok();
    }

    case 'speedUp': {
      const b = find(s, action.uid);
      if (!b || b.busyUntil === null) return fail(s, 'nothingToSpeed');
      const gems = speedUpGems(b.busyUntil - now);
      if (s.gems < gems) return fail(s, 'notEnoughGems');
      s.gems -= gems;
      b.busyUntil = now;
      return applyAction(s, { type: 'tick' }, now);
    }

    case 'deliverOrder': {
      const o = s.orders.find((x) => x.id === action.id);
      if (!o) return fail(s, 'orderNotFound');
      if (!hasItems(s.inventory, o.items)) return fail(s, 'missingItems');
      removeItems(s.inventory, o.items);
      s.orders = s.orders.filter((x) => x.id !== o.id);
      s.orderCooldowns.push(now + orderCooldownMs(s.level));
      grantReward(s, o.reward, ev);
      addFriendship(s, o.resident, 3, ev);
      ev.push({ type: 'ORDER_COMPLETED', order: o });
      return ok();
    }

    case 'skipOrder': {
      const o = s.orders.find((x) => x.id === action.id);
      if (!o) return fail(s, 'orderNotFound');
      s.orders = s.orders.filter((x) => x.id !== o.id);
      s.orderCooldowns.push(now + SKIP_COOLDOWN_MS);
      ev.push({ type: 'ORDER_SKIPPED', order: o });
      return ok();
    }

    case 'talk': {
      const r = s.residents.find((x) => x.id === action.resident);
      if (!r || !RESIDENTS[r.id]) return fail(s, 'notHereYet');
      const today = dayKey(now);
      const line = chooseLine(s, r, action.phase, now);
      if (r.lastTalkDay !== today) {
        r.lastTalkDay = today;
        addFriendship(s, r.id, 3, ev);
      }
      ev.push({ type: 'RESIDENT_INTERACTED', resident: r.id, line });
      return ok();
    }

    case 'gift': {
      const r = s.residents.find((x) => x.id === action.resident);
      if (!r || !RESIDENTS[r.id]) return fail(s, 'notHereYet');
      if (!(s.inventory[action.item] > 0)) return fail(s, 'noItem');
      const today = dayKey(now);
      if (r.lastGiftDay === today) return fail(s, 'giftedToday', { resident: r.id });
      removeItems(s.inventory, { [action.item]: 1 });
      r.lastGiftDay = today;
      const { reaction, points } = giftReaction(r.id, action.item);
      if (reaction === 'love') r.memories[`gift_${action.item}`] = now;
      addFriendship(s, r.id, points, ev);
      ev.push({ type: 'GIFT_GIVEN', resident: r.id, item: action.item, reaction, line: rdef(r.id).giftReactions[reaction] });
      return ok();
    }

    case 'startStory': {
      const r = s.residents.find((x) => x.id === action.resident);
      if (!r || !RESIDENTS[r.id]) return fail(s, 'notHereYet');
      const ch = eligibleChapter(s, r);
      if (!ch) return fail(s, 'noStory');
      r.storyActive = { id: ch.id, startedAt: now, baseline: baselineFor(s, ch.objectives) };
      ev.push({ type: 'STORY_STARTED', chapter: ch.id, resident: r.id });
      return ok();
    }

    case 'deliverStory': {
      const r = s.residents.find((x) => x.id === action.resident);
      const ch = r && activeChapter(r);
      if (!r || !ch || !r.storyActive) return fail(s, 'noActiveStory');
      const need: Record<string, number> = {};
      for (const o of ch.objectives) if (o.type === 'deliver') addItems(need, o.items);
      if (!Object.keys(need).length) return fail(s, 'nothingToHand');
      if (!hasItems(s.inventory, need)) return fail(s, 'missingItems');
      removeItems(s.inventory, need);
      r.storyActive.delivered = need;
      return ok(); // completion is detected by the Engagement Director
    }

    case 'contribute': {
      const project = COMMUNITY_PROJECTS.find((p) => p.id === s.community.projectId);
      if (!project) return fail(s, 'noProject');
      if (s.level < project.minLevel) return fail(s, 'unlocksAt', { level: project.minLevel });
      if (s.community.completedAt) return fail(s, 'projectDone');
      // Idempotency: a retried request with the same op id is applied once only.
      if (s.community.ops.includes(action.opId)) return { state: prev, events: [] };
      const req = (project.requirements as Record<string, number>)[action.resource];
      if (!req) return fail(s, 'notNeeded');
      const given = (s.community.contributed as Record<string, number>)[action.resource] ?? 0;
      const have = action.resource === 'coins' ? s.coins : s.inventory[action.resource] ?? 0;
      const qty = Math.min(Math.max(0, Math.floor(action.qty)), req - given, have);
      if (qty <= 0) return fail(s, have <= 0 ? 'noneToGive' : 'partDone');
      if (action.resource === 'coins') s.coins -= qty;
      else removeItems(s.inventory, { [action.resource]: qty });
      (s.community.contributed as Record<string, number>)[action.resource] = given + qty;
      s.community.ops.push(action.opId);
      if (s.community.ops.length > 500) s.community.ops.splice(0, s.community.ops.length - 500);
      // Stored as a token ("coins:5" / "item:planks:2") and rendered in the viewer's language.
      const label = action.resource === 'coins' ? `coins:${qty}` : `item:${action.resource}:${qty}`;
      s.community.log.unshift({ t: now, who: s.profile.name, what: label });
      const stage = communityStage(s);
      ev.push({ type: 'COMMUNITY_PROJECT_CONTRIBUTED', project: project.id, what: label, stage });
      if (communityRatio(s) >= 1) {
        s.community.completedAt = now;
        s.flags[project.flag] = true;
        ev.push({ type: 'LANDMARK_COMPLETED', project: project.id });
      }
      return ok();
    }

    case 'spruce': {
      // Give towards a shared spot's next step. Partial gifts are welcome; when the step's
      // needs are all met the spot visibly changes and every neighbour feels it. A finished
      // spot can be refreshed each season (optional, a fresh look, needs grow over time).
      const def = spotDef(action.spot);
      if (!def) return fail(s, 'unavailable');
      if (s.level < def.minLevel) return fail(s, 'unlocksAt', { level: def.minLevel });
      const st = s.spots[def.id] ?? (s.spots[def.id] = { stage: 0, given: {}, ops: [], doneAt: null });
      if (st.ops.includes(action.opId)) return { state: prev, events: [] };
      const needs = spotNeeds(def, st);
      const req = needs[action.resource];
      if (!req) return fail(s, 'notNeeded');
      const given = (st.given as Record<string, number>)[action.resource] ?? 0;
      const have = action.resource === 'coins' ? s.coins : s.inventory[action.resource] ?? 0;
      const qty = Math.min(Math.max(0, Math.floor(action.qty)), req - given, have);
      if (qty <= 0) return fail(s, have <= 0 ? 'noneToGive' : 'partDone');
      if (action.resource === 'coins') s.coins -= qty;
      else removeItems(s.inventory, { [action.resource]: qty });
      (st.given as Record<string, number>)[action.resource] = given + qty;
      st.ops.push(action.opId);
      if (st.ops.length > 200) st.ops.splice(0, st.ops.length - 200);
      ev.push({ type: 'SPOT_CONTRIBUTED', spot: def.id, what: action.resource === 'coins' ? `coins:${qty}` : `item:${action.resource}:${qty}` });
      if (!Object.entries(needs).every(([k, n]) => ((st.given as Record<string, number>)[k] ?? 0) >= n)) return ok();
      st.given = {};
      if (st.stage >= def.stages.length) {
        st.refreshes = (st.refreshes ?? 0) + 1;
        grantXp(s, 30 + st.refreshes * 10, ev);
        for (const r of s.residents) addFriendship(s, r.id, 2, ev);
        ev.push({ type: 'SPOT_REFRESHED', spot: def.id, season: st.refreshes });
        return ok();
      }
      const step = def.stages[st.stage];
      st.stage += 1;
      const final = st.stage >= def.stages.length;
      grantXp(s, step.xp, ev);
      for (const r of s.residents) addFriendship(s, r.id, step.friendship, ev);
      ev.push({ type: 'SPOT_STAGE', spot: def.id, stage: st.stage, final });
      if (final) {
        st.doneAt = now;
        s.flags[def.flag] = true;
        if (def.unlocks && !s.unlocked.includes(def.unlocks)) {
          s.unlocked.push(def.unlocks);
          ev.push({ type: 'UNLOCKED', what: def.unlocks });
        }
      }
      return ok();
    }

    case 'claimCommunityReward': {
      const project = COMMUNITY_PROJECTS.find((p) => p.id === s.community.projectId);
      if (!project || !s.community.completedAt || s.community.rewardClaimed) return fail(s, 'nothingToClaim');
      s.community.rewardClaimed = true;
      grantReward(s, project.reward, ev);
      return ok();
    }

    case 'unlockPlot': {
      const def = EXPANSIONS.find((e) => e.id === action.plot);
      if (!def) return fail(s, 'unknownPlot');
      if (s.plots.includes(def.id)) return fail(s, 'plotOwned');
      if (s.level < def.minLevel) return fail(s, 'unlocksAt', { level: def.minLevel });
      if (!def.adjacentTo.some((p) => s.plots.includes(p))) return fail(s, 'plotAdjacent');
      const cost = expansionCost(def, s.plots.length);
      if (!canAfford(s, cost)) return fail(s, 'notEnough', { missing: missingFor(s, cost).join(', ') });
      pay(s, cost);
      s.plots.push(def.id);
      ev.push({ type: 'DISTRICT_UNLOCKED', plot: def.id });
      grantXp(s, 20, ev);
      return ok();
    }

    case 'sellItem': {
      const have = s.inventory[action.item] ?? 0;
      const qty = Math.min(have, Math.max(0, Math.floor(action.qty)));
      if (qty <= 0) return fail(s, 'nothingToSell');
      const coins = Math.floor((ITEMS[action.item]?.value ?? 0) * 0.6) * qty;
      if (!ITEMS[action.item]) return fail(s, 'unavailable');
      removeItems(s.inventory, { [action.item]: qty });
      s.coins += coins;
      ev.push({ type: 'ITEM_SOLD', item: action.item, qty, coins });
      return ok();
    }

    case 'photo':
      ev.push({ type: 'PHOTO_TAKEN' });
      return ok();

    case 'tutorial':
      if (action.skip) s.tutorial = { ...s.tutorial, skipped: true, done: true };
      if (action.done) s.tutorial.done = true;
      if (action.step !== undefined) s.tutorial.step = action.step;
      return ok();

    case 'settings':
      s.settings = { ...s.settings, ...action.patch };
      return ok();

    case 'profile': {
      // Player-entered names follow the same content policy as authored text.
      const { name, hoodName } = action.patch;
      if (name !== undefined && name.trim() && !isAcceptableName(name)) return fail(s, 'nameNotAllowed');
      if (hoodName !== undefined && !isAcceptableName(hoodName)) return fail(s, 'nameNotAllowed');
      s.profile = { ...s.profile, ...action.patch };
      return ok();
    }

    case 'claimPulseBonus': {
      if (!s.pulse || s.pulse.bonusClaimed || !s.pulse.tasks.every((t) => t.claimed)) return fail(s, 'pulseUnfinished');
      s.pulse.bonusClaimed = true;
      grantReward(s, PULSE_BONUS, ev);
      ev.push({ type: 'PULSE_COMPLETE' });
      return ok();
    }

    // ─── Module behaviours ────────────────────────────────────────────────
    case 'handPrepare': {
      const b = find(s, action.uid);
      if (!b) return fail(s, 'notFound');
      if (b.busyKind === 'build') return fail(s, 'underConstruction');
      const beh = behaviorOf(b.type, 'hand_prepare');
      const recipe = RECIPES[action.recipe];
      if (!beh || beh.recipe !== action.recipe || !recipe) return fail(s, 'unavailable');
      if (b.level < recipe.level) return fail(s, 'recipeLevel', { level: recipe.level });
      const ready = (s.ext.prep[b.uid] ?? 0) + beh.cooldownSeconds * 1000;
      if (ready > now) return fail(s, 'prepRest', { seconds: Math.ceil((ready - now) / 1000) });
      // The client plays the mini-game; the rules check the sequence it reports.
      if (action.steps.length !== beh.steps.length || action.steps.some((x, i) => x !== beh.steps[i])) return fail(s, 'prepOrder');
      if (!hasItems(s.inventory, recipe.inputs)) return fail(s, 'missingIngredients');
      if ((recipe.coins ?? 0) > s.coins) return fail(s, 'ingredientCoins', { n: recipe.coins ?? 0 });
      removeItems(s.inventory, recipe.inputs);
      s.coins -= recipe.coins ?? 0;
      s.ext.prep[b.uid] = now;
      addItems(s.inventory, { [recipe.output]: recipe.qty });
      grantXp(s, recipe.xp + 1, ev);
      const staff = bdef(b.type).resident;
      if (staff) addFriendship(s, staff, 1, ev);
      ev.push({ type: 'HAND_PREPARED', uid: b.uid, recipe: recipe.id, item: recipe.output });
      return ok();
    }

    case 'quizAnswer': {
      const b = find(s, action.uid);
      if (!b) return fail(s, 'notFound');
      if (b.busyKind === 'build') return fail(s, 'underConstruction');
      const quiz = behaviorOf(b.type, 'quiz');
      const q = quiz?.questions.find((x) => x.id === action.question);
      if (!quiz || !q) return fail(s, 'unavailable');
      const today = dayKey(now);
      const L = s.ext.learning;
      if (L.day !== today) Object.assign(L, { day: today, today: 0 });
      if (L.today >= quizLimit(quiz.dailyLimit, b.level)) return fail(s, 'quizRest');
      if (L.seen[q.id] && dayKey(L.seen[q.id]) === today) return fail(s, 'quizSeen');
      if (!Number.isInteger(action.choice) || action.choice < 0 || action.choice >= q.choices.length) return fail(s, 'unavailable');
      const correct = action.choice === q.answer;
      L.today += 1;
      L.answered += 1;
      L.seen[q.id] = now;
      if (correct) L.correct += 1;
      // Learning is its own reward: a little XP, a few coins for a right answer.
      grantXp(s, correct ? 3 : 1, ev);
      if (correct) s.coins += 4;
      ev.push({ type: 'QUIZ_ANSWERED', uid: b.uid, question: q.id, correct });
      return ok();
    }

    case 'showroomSet': {
      const b = find(s, action.uid);
      if (!b) return fail(s, 'notFound');
      const sh = behaviorOf(b.type, 'showroom');
      if (!sh) return fail(s, 'unavailable');
      const slots = showroomSlots(sh.slots, b.level);
      if (!Number.isInteger(action.slot) || action.slot < 0 || action.slot >= slots) return fail(s, 'showroomSlot');
      if (!sh.models.includes(action.model) || !sh.paints.some((p) => p.id === action.paint)) return fail(s, 'unavailable');
      const display = (s.ext.showrooms[b.uid] ??= []);
      const wasEmpty = !display[action.slot];
      display[action.slot] = { model: action.model, paint: action.paint };
      for (let i = 0; i < display.length; i++) display[i] ??= { model: sh.models[0], paint: sh.paints[0].id };
      if (wasEmpty) grantXp(s, 2, ev);
      ev.push({ type: 'SHOWROOM_ARRANGED', uid: b.uid, slot: action.slot });
      return ok();
    }

    case 'plant':
    case 'water':
    case 'harvest': {
      const b = find(s, action.uid);
      if (!b) return fail(s, 'notFound');
      if (b.busyKind === 'build') return fail(s, 'underConstruction');
      const g = behaviorOf(b.type, 'garden_plots');
      if (!g) return fail(s, 'unavailable');
      if (!Number.isInteger(action.plot) || action.plot < 0 || action.plot >= g.plots) return fail(s, 'unavailable');
      const plots = (s.ext.gardens[b.uid] ??= []);
      const plot = plots[action.plot];
      const plantDef = plot?.plant ? g.plants.find((p) => p.id === plot.plant) : undefined;
      if (action.type === 'plant') {
        if (plot?.plant) return fail(s, 'plotBusy');
        if (!g.plants.some((p) => p.id === action.plant)) return fail(s, 'unavailable');
        plots[action.plot] = { plant: action.plant, plantedAt: now, water: 0, lastWater: 0 };
        for (let i = 0; i < plots.length; i++) plots[i] ??= { plant: null, plantedAt: 0, water: 0, lastWater: 0 };
        ev.push({ type: 'PLANTED', uid: b.uid, plot: action.plot, plant: action.plant });
        return ok();
      }
      if (!plot?.plant || !plantDef) return fail(s, 'plotEmpty');
      if (action.type === 'water') {
        if (now >= readyAt(plot, plantDef)) return fail(s, 'plotReady');
        if (plot.water >= MAX_WATER || !canWater(plot, now)) return fail(s, 'wateredRecently');
        plot.water += 1;
        plot.lastWater = now;
        ev.push({ type: 'WATERED', uid: b.uid, plot: action.plot });
        return ok();
      }
      if (now < readyAt(plot, plantDef)) return fail(s, 'plotGrowing');
      const items = { [plantDef.yields]: plantDef.qty };
      addItems(s.inventory, items);
      plots[action.plot] = { plant: null, plantedAt: 0, water: 0, lastWater: 0 };
      grantXp(s, 2, ev);
      ev.push({ type: 'HARVESTED', uid: b.uid, plot: action.plot, items });
      return ok();
    }

    // ─── Gentle activities ───────────────────────────────────────────────
    case 'fish': {
      if (!s.buildings.some((b) => b.type === 'pond')) return fail(s, 'unavailable');
      if (now - s.zen.lastFish < FISH_REST_MS) return fail(s, 'fishRest');
      const seen = Object.values(s.zen.fish).reduce((a, n) => a + n, 0);
      const r = rng(s.seed ^ hashString(`fish:${seen}`));
      // Rarer fish appear further down the list.
      const species = FISH[Math.min(FISH.length - 1, Math.floor(Math.pow(r(), 1.6) * FISH.length))];
      const first = !s.zen.fish[species];
      s.zen.fish[species] = (s.zen.fish[species] ?? 0) + 1;
      s.zen.lastFish = now;
      ev.push({ type: 'FISH_SEEN', species, first });
      return ok();
    }

    case 'feedPet': {
      if (!PETS.some((p) => p.id === action.pet)) return fail(s, 'unavailable');
      const today = dayKey(now);
      if (s.zen.pets[action.pet] === today) return fail(s, 'petFed');
      s.zen.pets[action.pet] = today;
      ev.push({ type: 'PET_FED', pet: action.pet });
      return ok();
    }

    case 'zenMoment': {
      if (!['sunset', 'lake', 'arrange'].includes(action.kind)) return fail(s, 'unavailable');
      if (now - s.zen.lastMoment < MOMENT_REST_MS) return fail(s, 'momentRest');
      if (action.kind === 'arrange') {
        const flowers = Object.keys(s.inventory).find((id) => ITEMS[id]?.icon === 'flowers' || ITEMS[id]?.icon === 'hibiscus');
        if (!flowers || s.inventory[flowers] < 2) return fail(s, 'needFlowers');
        removeItems(s.inventory, { [flowers]: 2 });
      }
      s.zen.moments[action.kind] = (s.zen.moments[action.kind] ?? 0) + 1;
      s.zen.lastMoment = now;
      ev.push({ type: 'ZEN_MOMENT', kind: action.kind });
      return ok();
    }
  }
}

/** Daily questions allowed: the module's limit, plus two per learning-centre upgrade. */
export const quizLimit = (base: number, level: number) => base + (level - 1) * 2;
/** Display bays: one more per showroom level, up to the module's maximum. */
export const showroomSlots = (max: number, level: number) => Math.min(max, level + 1);

export function communityRatio(s: GameState) {
  const p = COMMUNITY_PROJECTS.find((x) => x.id === s.community.projectId);
  if (!p) return 0;
  const req = Object.entries(p.requirements as Record<string, number>);
  const total = req.length;
  const sum = req.reduce((a, [id, n]) => a + Math.min(1, ((s.community.contributed as Record<string, number>)[id] ?? 0) / n), 0);
  return sum / total;
}

export function communityStage(s: GameState) {
  const p = COMMUNITY_PROJECTS.find((x) => x.id === s.community.projectId);
  if (!p) return 0;
  const ratio = communityRatio(s);
  return p.stages.filter((st) => ratio >= st.at).length;
}

export const plotUnlockable = (s: GameState, plot: string) => {
  const def = EXPANSIONS.find((e) => e.id === plot);
  return !!def && !s.plots.includes(plot) && !START_PLOTS.includes(plot) && def.adjacentTo.some((p) => s.plots.includes(p));
};
