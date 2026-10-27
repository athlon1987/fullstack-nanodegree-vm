// Pure economy helpers: wallet checks, rewards, XP/levels, production and passive income.
import { BUILDINGS } from '../../data/buildings';
import { ITEMS, RECIPES } from '../../data/items';
import { t } from '../../platform/i18n';
import { LEVELS, MAX_LEVEL } from '../../data/progression';
import { FRIENDSHIP_LEVELS, RESIDENTS } from '../../data/residents';
import type { BuildingInstance, Cost, GameEvent, GameState, ItemBag, Reward } from '../core/types';

export function canAfford(state: GameState, cost: Cost): boolean {
  if ((cost.coins ?? 0) > state.coins) return false;
  if ((cost.gems ?? 0) > state.gems) return false;
  for (const [id, n] of Object.entries(cost.items ?? {})) if ((state.inventory[id] ?? 0) < n) return false;
  return true;
}

export function missingFor(state: GameState, cost: Cost): string[] {
  const out: string[] = [];
  if ((cost.coins ?? 0) > state.coins) out.push(t('common.coinsN', { n: (cost.coins ?? 0) - state.coins }));
  if ((cost.gems ?? 0) > state.gems) out.push(t('common.gemsN', { n: (cost.gems ?? 0) - state.gems }));
  for (const [id, n] of Object.entries(cost.items ?? {})) {
    const have = state.inventory[id] ?? 0;
    if (have < n) out.push(t('common.itemN', { n: n - have, item: ITEMS[id]?.name ?? id }));
  }
  return out;
}

/** Mutates `state` (callers work on a draft copy). */
export function pay(state: GameState, cost: Cost) {
  state.coins -= cost.coins ?? 0;
  state.gems -= cost.gems ?? 0;
  for (const [id, n] of Object.entries(cost.items ?? {})) removeItems(state.inventory, { [id]: n });
}

export function addItems(bag: ItemBag, items: ItemBag) {
  for (const [id, n] of Object.entries(items)) bag[id] = (bag[id] ?? 0) + n;
}

export function removeItems(bag: ItemBag, items: ItemBag) {
  for (const [id, n] of Object.entries(items)) {
    bag[id] = (bag[id] ?? 0) - n;
    if (bag[id] <= 0) delete bag[id];
  }
}

export const hasItems = (bag: ItemBag, items: ItemBag) => Object.entries(items).every(([id, n]) => (bag[id] ?? 0) >= n);

export function levelForXp(xp: number): number {
  let level = 1;
  for (const l of LEVELS) if (xp >= l.xp) level = l.level;
  return Math.min(level, MAX_LEVEL);
}

export function xpProgress(state: Pick<GameState, 'xp' | 'level'>) {
  const cur = LEVELS[state.level - 1]?.xp ?? 0;
  const next = LEVELS[state.level]?.xp ?? cur;
  return { cur: state.xp - cur, need: Math.max(1, next - cur), ratio: next === cur ? 1 : (state.xp - cur) / (next - cur) };
}

/** Mutates. Applies XP and emits LEVEL_UP for every level gained. */
export function grantXp(state: GameState, xp: number, events: GameEvent[]) {
  if (!xp) return;
  state.xp += xp;
  events.push({ type: 'XP_GAINED', amount: xp });
  const newLevel = levelForXp(state.xp);
  while (state.level < newLevel) {
    state.level++;
    events.push({ type: 'LEVEL_UP', level: state.level, unlocks: LEVELS[state.level - 1].unlocks });
  }
}

export function friendshipLevel(points: number): number {
  let lvl = 0;
  FRIENDSHIP_LEVELS.forEach((f, i) => {
    if (points >= f.at) lvl = i;
  });
  return lvl;
}

/** Mutates. Applies a reward bundle. */
export function grantReward(state: GameState, reward: Reward, events: GameEvent[]) {
  if (reward.coins) {
    state.coins += reward.coins;
    events.push({ type: 'COINS_CHANGED', delta: reward.coins });
  }
  if (reward.gems) state.gems += reward.gems;
  if (reward.items) addItems(state.inventory, reward.items);
  for (const u of reward.unlocks ?? []) {
    if (!state.unlocked.includes(u)) {
      state.unlocked.push(u);
      events.push({ type: 'UNLOCKED', what: u });
    }
  }
  if (reward.friendship) addFriendship(state, reward.friendship.resident, reward.friendship.points, events);
  grantXp(state, reward.xp ?? 0, events);
}

export function addFriendship(state: GameState, resident: string, points: number, events: GameEvent[]) {
  const r = state.residents.find((x) => x.id === resident);
  if (!r) return;
  const before = friendshipLevel(r.friendship);
  r.friendship += points;
  const after = friendshipLevel(r.friendship);
  if (after > before) events.push({ type: 'FRIENDSHIP_UP', resident, level: after });
}

// ─── Buildings ───────────────────────────────────────────────────────────────

/** The building's current level definition (undefined if its content isn't installed). */
export const levelDef = (b: Pick<BuildingInstance, 'type' | 'level'>) => BUILDINGS[b.type]?.levels[Math.min(b.level, BUILDINGS[b.type].levels.length) - 1];
export const isOperational = (b: BuildingInstance) => b.busyKind !== 'build';

export function buildSeconds(type: string): number {
  const def = BUILDINGS[type];
  if (!def || def.category === 'decoration' || def.category === 'path') return 0;
  return Math.max(5, Math.round((def.cost.coins ?? 0) / 20));
}

export function upgradeSeconds(type: string, toLevel: number): number {
  const cost = BUILDINGS[type]?.levels[toLevel - 1]?.upgradeCost.coins ?? 0;
  return Math.max(8, Math.round(cost / 10));
}

/** Gem price to finish a timer now: 1 gem per started 2 minutes. */
export const speedUpGems = (remainingMs: number) => Math.max(1, Math.ceil(remainingMs / 120_000));

export function recipesFor(b: Pick<BuildingInstance, 'type' | 'level'>) {
  return Object.values(RECIPES).filter((r) => r.building === b.type);
}

export const recipeDurationMs = (recipeId: string, b: Pick<BuildingInstance, 'type' | 'level'>) =>
  Math.round(((RECIPES[recipeId]?.seconds ?? 60) * 1000) / (levelDef(b)?.speed ?? 1));

export function finishedJobs(b: BuildingInstance, now: number) {
  return b.queue.filter((j) => j.end <= now);
}

/** Passive income ready to collect, capped by the level's storage. */
export function passiveReady(b: BuildingInstance, now: number): { coins: number; cycles: number } {
  const p = levelDef(b)?.passive;
  if (!p || !isOperational(b)) return { coins: 0, cycles: 0 };
  const cycles = Math.min(p.cycles, Math.floor(Math.max(0, now - b.passiveSince) / (p.seconds * 1000)));
  return { coins: cycles * p.coins, cycles };
}

/** True when the building has something worth tapping. */
export function hasCollectable(b: BuildingInstance, now: number) {
  return finishedJobs(b, now).length > 0 || passiveReady(b, now).cycles > 0;
}

export function orderSlots(state: GameState) {
  const hall = state.buildings.some((b) => b.type === 'town_hall' && isOperational(b));
  // A tiny town has fewer neighbors asking for things; the board grows with the hood.
  const here = state.residents.filter((r) => RESIDENTS[r.id]).length;
  return Math.min(3, 1 + here) + (hall ? 1 : 0);
}
