// Player & system actions. Every action is a pure function of (state, action, now):
// it copies the state, applies rules, and returns the new state plus emitted events.
// In online mode the same functions are designed to run server-side (authoritative).
import { BUILDINGS, isDecoration, isFixed } from '../../data/buildings';
import { ITEMS, RECIPES } from '../../data/items';
import { COMMUNITY_PROJECTS, EVENTS, EXPANSIONS, START_PLOTS, expansionCost } from '../../data/progression';
import { RESIDENTS } from '../../data/residents';
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
import { dayKey } from './rng';
import type { ActionResult, BuildingInstance, DayPhase, GameEvent, GameState, Rotation, Settings, PlayerProfile } from './types';

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
  | { type: 'unlockPlot'; plot: string }
  | { type: 'sellItem'; item: string; qty: number }
  | { type: 'photo' }
  | { type: 'tutorial'; step?: number; done?: boolean; skip?: boolean }
  | { type: 'settings'; patch: Partial<Settings> }
  | { type: 'profile'; patch: Partial<PlayerProfile> }
  | { type: 'claimPulseBonus' }
  | { type: 'claimCommunityReward' }
  | { type: 'sessionStart' };

// New requests arrive at a neighborly pace (the main coin faucet is throttled here).
const ORDER_COOLDOWN_MS = 120_000;
const SKIP_COOLDOWN_MS = 180_000;

const fail = (state: GameState, error: string): ActionResult => ({ state, events: [], error });
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
  if (s.orders.length + s.orderCooldowns.length < orderSlots(s) && generateOrder(s, now)) return true;
  const evDef = EVENTS[0];
  if (s.level >= evDef.minLevel && (!s.event || now > s.event.startedAt + (evDef.durationDays + 3) * 86_400_000)) return true;
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
            grantXp(s, BUILDINGS[b.type].xp, ev);
          } else if (kind === 'upgrade') {
            b.level += 1;
            ev.push({ type: 'BUILDING_UPGRADED', uid: b.uid, building: b.type, level: b.level });
            grantXp(s, levelDef(b).xp, ev);
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
      // Order board: reopen cooled-down slots and fill empty ones
      s.orderCooldowns = s.orderCooldowns.filter((t) => t > now);
      while (s.orders.length + s.orderCooldowns.length < orderSlots(s)) {
        const o = generateOrder(s, now);
        if (!o) break;
        s.orders.push(o);
        s.orderCounter++;
      }
      // Optional seasonal event: starts once eligible, reruns after a short break
      const evDef = EVENTS[0];
      if (s.level >= evDef.minLevel) {
        const ended = s.event && now > s.event.startedAt + evDef.durationDays * 86_400_000;
        const restReady = !s.event || now > s.event.startedAt + (evDef.durationDays + 3) * 86_400_000;
        if (!s.event || (ended && restReady)) {
          s.event = { id: evDef.id, startedAt: now, baseline: baselineFor(s, evDef.objectives), claimedTiers: [] };
        }
      }
      return ok();
    }

    case 'place': {
      const def = BUILDINGS[action.building];
      if (!def) return fail(s, 'Unknown building');
      const unlocked = def.keepsake ? s.unlocked.includes(def.id) : def.unlockLevel <= s.level;
      if (!unlocked) return fail(s, def.keepsake ? 'Not unlocked yet' : `Unlocks at level ${def.unlockLevel}`);
      const count = s.buildings.filter((b) => b.type === def.id).length;
      if (def.maxCount !== undefined && count >= def.maxCount) return fail(s, 'You already have the maximum number');
      const problem = placementProblem(s, def.id, action.x, action.z, action.rot);
      if (problem) return fail(s, `Can’t place here (${problem.replace('_', ' ')})`);
      if (!canAfford(s, def.cost)) return fail(s, `Not enough: ${missingFor(s, def.cost).join(', ')}`);
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
      if (!b) return fail(s, 'Not found');
      if (['pond', 'fountain'].includes(b.type)) return fail(s, 'This landmark can’t be moved');
      const problem = placementProblem(s, b.type, action.x, action.z, action.rot, b.uid);
      if (problem) return fail(s, `Can’t move here (${problem.replace('_', ' ')})`);
      Object.assign(b, { x: action.x, z: action.z, rot: action.rot });
      ev.push({ type: 'BUILDING_MOVED', uid: b.uid });
      return ok();
    }

    case 'sell': {
      const b = find(s, action.uid);
      if (!b) return fail(s, 'Not found');
      const def = BUILDINGS[b.type];
      if (isFixed(b.type) && b.type !== 'starter_house') return fail(s, 'Landmarks can’t be removed');
      if (b.type === 'starter_house') return fail(s, 'You can’t sell your home!');
      if (!isDecoration(b.type)) return fail(s, 'Only decorations can be sold. Move buildings instead.');
      const refund = Math.floor((def.cost.coins ?? 0) * (def.sellRefund ?? 0.5));
      s.coins += refund;
      s.buildings = s.buildings.filter((x) => x.uid !== b.uid);
      ev.push({ type: 'BUILDING_SOLD', uid: b.uid, building: b.type });
      return ok();
    }

    case 'produce': {
      const b = find(s, action.uid);
      const recipe = RECIPES[action.recipe];
      if (!b || !recipe || recipe.building !== b.type) return fail(s, 'Invalid recipe');
      if (b.busyKind) return fail(s, b.busyKind === 'build' ? 'Still under construction' : 'Busy upgrading');
      if (b.level < recipe.level) return fail(s, `Unlocks at building level ${recipe.level}`);
      if (b.queue.length >= levelDef(b).slots) return fail(s, 'Production queue is full — collect first');
      if (!hasItems(s.inventory, recipe.inputs)) return fail(s, 'Missing ingredients');
      if ((recipe.coins ?? 0) > s.coins) return fail(s, `Ingredients cost ${recipe.coins} coins`);
      removeItems(s.inventory, recipe.inputs);
      s.coins -= recipe.coins ?? 0;
      const last = b.queue[b.queue.length - 1];
      const start = Math.max(now, last?.end ?? 0);
      b.queue.push({ recipe: recipe.id, start, end: start + recipeDurationMs(recipe.id, b) });
      ev.push({ type: 'PRODUCTION_STARTED', uid: b.uid, recipe: recipe.id });
      return ok();
    }

    case 'collect': {
      const b = find(s, action.uid);
      if (!b) return fail(s, 'Not found');
      const done = finishedJobs(b, now);
      const passive = passiveReady(b, now);
      if (!done.length && !passive.cycles) return fail(s, 'Nothing to collect yet');
      const items: Record<string, number> = {};
      let xp = 0;
      for (const j of done) {
        const r = RECIPES[j.recipe];
        items[r.output] = (items[r.output] ?? 0) + r.qty;
        xp += r.xp;
      }
      b.queue = b.queue.filter((j) => j.end > now);
      addItems(s.inventory, items);
      if (passive.cycles) {
        const p = levelDef(b).passive!;
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
      if (!b) return fail(s, 'Not found');
      const def = BUILDINGS[b.type];
      const next = def.levels[b.level];
      if (!next) return fail(s, 'Already at max level');
      if (b.busyKind) return fail(s, 'Busy right now');
      if (!canAfford(s, next.upgradeCost)) return fail(s, `Not enough: ${missingFor(s, next.upgradeCost).join(', ')}`);
      pay(s, next.upgradeCost);
      b.busyKind = 'upgrade';
      b.busyFrom = now;
      b.busyUntil = now + upgradeSeconds(b.type, b.level + 1) * 1000;
      return ok();
    }

    case 'speedUp': {
      const b = find(s, action.uid);
      if (!b || b.busyUntil === null) return fail(s, 'Nothing to speed up');
      const gems = speedUpGems(b.busyUntil - now);
      if (s.gems < gems) return fail(s, 'Not enough gems');
      s.gems -= gems;
      b.busyUntil = now;
      return applyAction(s, { type: 'tick' }, now);
    }

    case 'deliverOrder': {
      const o = s.orders.find((x) => x.id === action.id);
      if (!o) return fail(s, 'Order not found');
      if (!hasItems(s.inventory, o.items)) return fail(s, 'You don’t have everything yet');
      removeItems(s.inventory, o.items);
      s.orders = s.orders.filter((x) => x.id !== o.id);
      s.orderCooldowns.push(now + ORDER_COOLDOWN_MS);
      grantReward(s, o.reward, ev);
      addFriendship(s, o.resident, 3, ev);
      ev.push({ type: 'ORDER_COMPLETED', order: o });
      return ok();
    }

    case 'skipOrder': {
      const o = s.orders.find((x) => x.id === action.id);
      if (!o) return fail(s, 'Order not found');
      s.orders = s.orders.filter((x) => x.id !== o.id);
      s.orderCooldowns.push(now + SKIP_COOLDOWN_MS);
      ev.push({ type: 'ORDER_SKIPPED', order: o });
      return ok();
    }

    case 'talk': {
      const r = s.residents.find((x) => x.id === action.resident);
      if (!r) return fail(s, 'Not here yet');
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
      if (!r) return fail(s, 'Not here yet');
      if (!(s.inventory[action.item] > 0)) return fail(s, 'You don’t have that item');
      const today = dayKey(now);
      if (r.lastGiftDay === today) return fail(s, `${RESIDENTS[r.id].name} already got a gift today`);
      removeItems(s.inventory, { [action.item]: 1 });
      r.lastGiftDay = today;
      const { reaction, points } = giftReaction(r.id, action.item);
      if (reaction === 'love') r.memories[`gift_${action.item}`] = now;
      addFriendship(s, r.id, points, ev);
      ev.push({ type: 'GIFT_GIVEN', resident: r.id, item: action.item, reaction, line: RESIDENTS[r.id].giftReactions[reaction] });
      return ok();
    }

    case 'startStory': {
      const r = s.residents.find((x) => x.id === action.resident);
      if (!r) return fail(s, 'Not here yet');
      const ch = eligibleChapter(s, r);
      if (!ch) return fail(s, 'No story available');
      r.storyActive = { id: ch.id, startedAt: now, baseline: baselineFor(s, ch.objectives) };
      ev.push({ type: 'STORY_STARTED', chapter: ch.id, resident: r.id });
      return ok();
    }

    case 'deliverStory': {
      const r = s.residents.find((x) => x.id === action.resident);
      const ch = r && activeChapter(r);
      if (!r || !ch || !r.storyActive) return fail(s, 'No active story');
      const need: Record<string, number> = {};
      for (const o of ch.objectives) if (o.type === 'deliver') addItems(need, o.items);
      if (!Object.keys(need).length) return fail(s, 'Nothing to hand over');
      if (!hasItems(s.inventory, need)) return fail(s, 'You don’t have everything yet');
      removeItems(s.inventory, need);
      r.storyActive.delivered = need;
      return ok(); // completion is detected by the Engagement Director
    }

    case 'contribute': {
      const project = COMMUNITY_PROJECTS.find((p) => p.id === s.community.projectId);
      if (!project) return fail(s, 'No project');
      if (s.level < project.minLevel) return fail(s, `Unlocks at level ${project.minLevel}`);
      if (s.community.completedAt) return fail(s, 'Project already complete');
      // Idempotency: a retried request with the same op id is applied once only.
      if (s.community.ops.includes(action.opId)) return { state: prev, events: [] };
      const req = (project.requirements as Record<string, number>)[action.resource];
      if (!req) return fail(s, 'Not needed for this project');
      const given = (s.community.contributed as Record<string, number>)[action.resource] ?? 0;
      const have = action.resource === 'coins' ? s.coins : s.inventory[action.resource] ?? 0;
      const qty = Math.min(Math.max(0, Math.floor(action.qty)), req - given, have);
      if (qty <= 0) return fail(s, have <= 0 ? 'You don’t have any to give' : 'That part is already complete');
      if (action.resource === 'coins') s.coins -= qty;
      else removeItems(s.inventory, { [action.resource]: qty });
      (s.community.contributed as Record<string, number>)[action.resource] = given + qty;
      s.community.ops.push(action.opId);
      if (s.community.ops.length > 500) s.community.ops.splice(0, s.community.ops.length - 500);
      const label = action.resource === 'coins' ? `${qty} coins` : `${qty} ${ITEMS[action.resource].name}`;
      s.community.log.unshift({ t: now, who: s.profile.name, what: label });
      const stage = communityStage(s);
      ev.push({ type: 'COMMUNITY_PROJECT_CONTRIBUTED', project: project.id, what: label, stage });
      if (communityRatio(s) >= 1) {
        s.community.completedAt = now;
        s.flags.fountain_complete = true;
        ev.push({ type: 'LANDMARK_COMPLETED', project: project.id });
      }
      return ok();
    }

    case 'claimCommunityReward': {
      const project = COMMUNITY_PROJECTS.find((p) => p.id === s.community.projectId)!;
      if (!s.community.completedAt || s.community.rewardClaimed) return fail(s, 'Nothing to claim');
      s.community.rewardClaimed = true;
      grantReward(s, project.reward, ev);
      return ok();
    }

    case 'unlockPlot': {
      const def = EXPANSIONS.find((e) => e.id === action.plot);
      if (!def) return fail(s, 'Unknown plot');
      if (s.plots.includes(def.id)) return fail(s, 'Already yours');
      if (s.level < def.minLevel) return fail(s, `Unlocks at level ${def.minLevel}`);
      if (!def.adjacentTo.some((p) => s.plots.includes(p))) return fail(s, 'Must border land you own');
      const cost = expansionCost(def, s.plots.length);
      if (!canAfford(s, cost)) return fail(s, `Not enough: ${missingFor(s, cost).join(', ')}`);
      pay(s, cost);
      s.plots.push(def.id);
      ev.push({ type: 'DISTRICT_UNLOCKED', plot: def.id });
      grantXp(s, 20, ev);
      return ok();
    }

    case 'sellItem': {
      const have = s.inventory[action.item] ?? 0;
      const qty = Math.min(have, Math.max(0, Math.floor(action.qty)));
      if (qty <= 0) return fail(s, 'Nothing to sell');
      const coins = Math.floor(ITEMS[action.item].value * 0.6) * qty;
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

    case 'profile':
      s.profile = { ...s.profile, ...action.patch };
      return ok();

    case 'claimPulseBonus': {
      if (!s.pulse || s.pulse.bonusClaimed || !s.pulse.tasks.every((t) => t.claimed)) return fail(s, 'Finish all three first');
      s.pulse.bonusClaimed = true;
      grantReward(s, PULSE_BONUS, ev);
      ev.push({ type: 'PULSE_COMPLETE' });
      return ok();
    }
  }
}

export function communityRatio(s: GameState) {
  const p = COMMUNITY_PROJECTS.find((x) => x.id === s.community.projectId)!;
  const req = Object.entries(p.requirements as Record<string, number>);
  const total = req.length;
  const sum = req.reduce((a, [id, n]) => a + Math.min(1, ((s.community.contributed as Record<string, number>)[id] ?? 0) / n), 0);
  return sum / total;
}

export function communityStage(s: GameState) {
  const p = COMMUNITY_PROJECTS.find((x) => x.id === s.community.projectId)!;
  const ratio = communityRatio(s);
  return p.stages.filter((st) => ratio >= st.at).length;
}

export const plotUnlockable = (s: GameState, plot: string) => {
  const def = EXPANSIONS.find((e) => e.id === plot);
  return !!def && !s.plots.includes(plot) && !START_PLOTS.includes(plot) && def.adjacentTo.some((p) => s.plots.includes(p));
};
