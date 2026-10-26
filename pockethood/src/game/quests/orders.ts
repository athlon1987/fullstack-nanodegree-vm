// Neighborhood request board: deterministic, state-aware order generation.
// Orders only ever ask for goods the player can currently produce.
import { BUILDINGS } from '../../data/buildings';
import { ITEMS, RECIPES } from '../../data/items';
import { RESIDENTS } from '../../data/residents';
import { hashString, pick, rng } from '../core/rng';
import type { GameState, ItemBag, Order } from '../core/types';
import { isOperational } from '../economy/economy';

/** Items producible right now, including multi-step chains whose inputs are producible. */
export function producibleItems(state: Pick<GameState, 'buildings'>): string[] {
  const levels = new Map<string, number>();
  for (const b of state.buildings) {
    if (!isOperational(b)) continue;
    levels.set(b.type, Math.max(levels.get(b.type) ?? 0, b.level));
  }
  const available = Object.values(RECIPES).filter((r) => (levels.get(r.building) ?? 0) >= r.level);
  const out = new Set<string>();
  let changed = true;
  while (changed) {
    changed = false;
    for (const r of available) {
      if (out.has(r.output)) continue;
      if (Object.keys(r.inputs).every((i) => out.has(i))) {
        out.add(r.output);
        changed = true;
      }
    }
  }
  return [...out];
}

const recipeFor = (item: string) => Object.values(RECIPES).find((r) => r.output === item)!;

export function orderReward(items: ItemBag, level: number) {
  const value = Object.entries(items).reduce((s, [id, n]) => s + ITEMS[id].value * n, 0);
  return { coins: Math.round(value * 1.3 + 3 + level * 0.5), xp: Math.max(2, Math.round(value / 6)) + 1 };
}

export function generateOrder(state: GameState, now: number): Order | null {
  const items = producibleItems(state).filter((i) => ITEMS[i].kind === 'good' || state.level >= 4);
  const arrived = state.residents.map((r) => r.id);
  if (!items.length || !arrived.length) return null;
  const counter = state.orderCounter;
  // The very first order is scripted for the tutorial.
  if (counter === 0 && items.includes('coffee')) {
    const bag = { coffee: 2 };
    return { id: `o${counter + 1}`, resident: 'mia', items: bag, reward: orderReward(bag, state.level), createdAt: now };
  }
  const r = rng(state.seed ^ hashString(`order:${counter}`));
  const busy = new Set(state.orders.map((o) => o.resident));
  const free = arrived.filter((id) => !busy.has(id));
  const resident = pick(r, free.length ? free : arrived);
  const favorites = RESIDENTS[resident].favorites.filter((f) => items.includes(f));
  const maxDistinct = state.level < 3 ? 1 : state.level < 6 ? 2 : 3;
  const distinct = Math.min(items.length, 1 + Math.floor(r() * maxDistinct));
  const bag: ItemBag = {};
  const pool = [...items];
  for (let i = 0; i < distinct; i++) {
    const usesFavorite = i === 0 && favorites.length > 0 && r() < 0.45;
    const item = usesFavorite ? pick(r, favorites) : pick(r, pool);
    pool.splice(pool.indexOf(item), 1);
    const seconds = recipeFor(item).seconds;
    const maxQty = seconds <= 30 ? 5 : seconds <= 90 ? 3 : 2;
    bag[item] = Math.max(1, Math.min(maxQty, 1 + Math.floor(r() * (1 + state.level / 2))));
    if (!pool.length) break;
  }
  // Avoid pinning an identical request twice: nudge the quantity instead.
  const sig = (b: ItemBag) => JSON.stringify(Object.entries(b).sort());
  if (state.orders.some((o) => sig(o.items) === sig(bag))) {
    const first = Object.keys(bag)[0];
    bag[first] += 1;
  }
  return { id: `o${counter + 1}`, resident, items: bag, reward: orderReward(bag, state.level), createdAt: now };
}

/** Buildings that produce a given item (for "where do I get this?" hints). */
export const producerOf = (item: string) => {
  const r = recipeFor(item);
  return r ? BUILDINGS[r.building] : undefined;
};
