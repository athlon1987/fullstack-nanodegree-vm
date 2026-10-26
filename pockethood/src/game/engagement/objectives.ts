// Objective evaluation shared by quests, resident stories, events and the Pulse.
import type { GameState, ItemBag, Objective } from '../core/types';
import { friendshipLevel, isOperational } from '../economy/economy';

export interface Progress {
  cur: number;
  n: number;
  done: boolean;
}

/** The stat counters an objective reads, so a baseline can be captured at start. */
export function countersOf(objectives: Objective[]): string[] {
  return objectives.filter((o) => o.type === 'counter').map((o) => (o as { counter: string }).counter);
}

export function baselineFor(state: GameState, objectives: Objective[]): Record<string, number> {
  return Object.fromEntries(countersOf(objectives).map((c) => [c, state.stats[c] ?? 0]));
}

export function objectiveProgress(
  state: GameState,
  o: Objective,
  baseline: Record<string, number> = {},
  delivered?: ItemBag,
): Progress {
  const clamp = (cur: number, n: number): Progress => ({ cur: Math.min(cur, n), n, done: cur >= n });
  switch (o.type) {
    case 'counter':
      return clamp((state.stats[o.counter] ?? 0) - (baseline[o.counter] ?? 0), o.n);
    case 'build':
      return clamp(state.buildings.filter((b) => b.type === o.building && isOperational(b)).length, o.n);
    case 'upgrade': {
      const best = Math.max(0, ...state.buildings.filter((b) => b.type === o.building && isOperational(b)).map((b) => b.level));
      return clamp(best, o.level);
    }
    case 'level':
      return clamp(state.level, o.level);
    case 'friendship': {
      const r = state.residents.find((x) => x.id === o.resident);
      return clamp(r ? friendshipLevel(r.friendship) : 0, o.level);
    }
    case 'deliver': {
      const need = Object.values(o.items).reduce((s, n) => s + n, 0);
      if (delivered && Object.entries(o.items).every(([id, n]) => (delivered[id] ?? 0) >= n)) return { cur: need, n: need, done: true };
      const have = Object.entries(o.items).reduce((s, [id, n]) => s + Math.min(n, state.inventory[id] ?? 0), 0);
      return { cur: have, n: need, done: false };
    }
  }
}

export const allDone = (state: GameState, objectives: Objective[], baseline: Record<string, number>, delivered?: ItemBag) =>
  objectives.every((o) => objectiveProgress(state, o, baseline, delivered).done);
