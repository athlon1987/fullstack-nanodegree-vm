// THE NEIGHBORHOOD PULSE — three meaningful, achievable priorities for today.
// Generated deterministically from (seed, day) and the player's *actual* capabilities:
// it never asks for goods that can't be produced or residents who haven't arrived.
import { BUILDINGS } from '../../data/buildings';
import { ITEMS, RECIPES } from '../../data/items';
import { COMMUNITY_PROJECTS } from '../../data/progression';
import { RESIDENTS } from '../../data/residents';
import { hashString, pick, rng } from '../core/rng';
import type { GameState, PulseState, PulseTask, Reward, TextParams } from '../core/types';
import { producibleItems } from '../quests/orders';

const scale = (state: GameState, base: number) => Math.round(base * (1 + state.level * 0.15));

export function generatePulse(state: GameState, day: string): PulseState {
  const r = rng(state.seed ^ hashString(`pulse:${day}`));
  const tasks: PulseTask[] = [];
  const mk = (kind: PulseTask['kind'], key: string, params: TextParams, counter: string, n: number, reward: Reward): PulseTask => ({
    id: `${day}:${kind}`,
    kind,
    key: `pulse.task.${key}`,
    params,
    counter,
    n,
    baseline: state.stats[counter] ?? 0,
    reward,
    claimed: false,
  });

  // 1. A practical neighborhood improvement
  const items = producibleItems(state).filter((i) => ITEMS[i]?.kind === 'good');
  const practical: (() => PulseTask)[] = [];
  if (items.length) {
    practical.push(() => {
      const item = pick(r, items);
      const rec = Object.values(RECIPES).find((x) => x.output === item)!;
      const n = rec.seconds <= 40 ? 6 : rec.seconds <= 90 ? 3 : 2;
      return mk('practical', 'produce', { n, item }, `produce:${item}`, n, { coins: scale(state, 30), xp: 10 });
    });
    practical.push(() => mk('practical', 'orders', { n: 3 }, 'orders', 3, { coins: scale(state, 35), xp: 12 }));
  }
  practical.push(() => mk('practical', 'collect', { n: 5 }, 'collect:any', 5, { coins: scale(state, 25), xp: 8 }));
  tasks.push(pick(r, practical)());

  // 2. A resident-related activity — favour the neighbor you know least
  const residents = state.residents.filter((x) => RESIDENTS[x.id]).sort((a, b) => a.friendship - b.friendship);
  const target = residents[0];
  if (residents.length >= 2 && r() < 0.4) {
    tasks.push(mk('resident', 'chat', { n: 2 }, 'talk', 2, { coins: scale(state, 20), xp: 8 }));
  } else if (target && state.stats['gift'] && r() < 0.5) {
    tasks.push(mk('resident', 'gift', { resident: target.id }, `gift:${target.id}`, 1, { coins: scale(state, 20), xp: 10 }));
  } else if (target) {
    tasks.push(mk('resident', 'hello', { resident: target.id }, `talk:${target.id}`, 1, { coins: scale(state, 15), xp: 8 }));
  }

  // 3. An optional creative or social opportunity
  const creative: (() => PulseTask)[] = [() => mk('creative', 'photo', {}, 'photo', 1, { coins: scale(state, 20), xp: 8 })];
  const cheapestDecor = Math.min(...Object.values(BUILDINGS).filter((b) => b.category === 'decoration' && !b.keepsake).map((b) => b.cost.coins ?? 0));
  if (state.coins >= cheapestDecor * 3) creative.push(() => mk('creative', 'decor', { n: 3 }, 'decor', 3, { coins: scale(state, 25), xp: 10 }));
  const project = COMMUNITY_PROJECTS.find((p) => p.id === state.community.projectId);
  if (project && state.level >= project.minLevel && !state.community.completedAt)
    creative.push(() => mk('creative', 'contribute', { project: project.id }, 'contribute', 1, { coins: scale(state, 20), xp: 10 }));
  tasks.push(pick(r, creative)());

  return { day, tasks, bonusClaimed: false };
}

export const PULSE_BONUS: Reward = { gems: 2, xp: 10 };

export const pulseTaskProgress = (state: GameState, t: PulseTask) => Math.min(t.n, (state.stats[t.counter] ?? 0) - t.baseline);
