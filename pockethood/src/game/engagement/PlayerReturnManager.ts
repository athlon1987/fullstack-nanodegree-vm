// Welcome-back summaries and "what can I do next?" guidance.
// Returning players are never penalised: production simply waits (capped), and
// relationships, memories and achievements are never lost.
import { BUILDINGS } from '../../data/buildings';
import { QUESTS } from '../../data/progression';
import { RESIDENTS } from '../../data/residents';
import { eligibleChapter, activeChapter } from '../characters/relationships';
import type { GameState, TextParams } from '../core/types';
import { canAfford, finishedJobs, hasItems, passiveReady } from '../economy/economy';
import { objectiveProgress } from './objectives';

export interface WelcomeSummary {
  awayMs: number;
  readyGoods: number;
  coinsWaiting: number;
  buildingsFinished: string[];
  ordersOpen: number;
  storiesWaiting: string[];
  nextGoal: NextGoal | null;
}

export interface NextGoal {
  /** Either a ready-made (content) text, or an i18n key + params. */
  text?: string;
  key?: string;
  params?: TextParams;
  /** What to focus: building uid, panel id or resident id. */
  target?: { uid?: string; panel?: string; resident?: string };
}

export const WELCOME_BACK_AFTER_MS = 15 * 60_000;

export function welcomeSummary(prev: GameState, now: number): WelcomeSummary | null {
  const awayMs = now - prev.lastSeen;
  if (awayMs < WELCOME_BACK_AFTER_MS || !prev.tutorial.done) return null;
  let readyGoods = 0;
  let coinsWaiting = 0;
  const buildingsFinished: string[] = [];
  for (const b of prev.buildings) {
    readyGoods += finishedJobs(b, now).length;
    coinsWaiting += passiveReady(b, now).coins;
    if (b.busyUntil !== null && b.busyUntil <= now && BUILDINGS[b.type]) buildingsFinished.push(BUILDINGS[b.type].name);
  }
  const storiesWaiting = prev.residents.filter((r) => RESIDENTS[r.id] && eligibleChapter(prev, r)).map((r) => RESIDENTS[r.id].name);
  return { awayMs, readyGoods, coinsWaiting, buildingsFinished, ordersOpen: prev.orders.length, storiesWaiting, nextGoal: nextGoal(prev, now) };
}

/** The single most useful next step, derived from the real world state. */
export function nextGoal(s: GameState, now: number): NextGoal | null {
  const tut = s.quests.active.find((q) => QUESTS.find((d) => d.id === q.id)?.tutorial);
  if (tut) {
    const def = QUESTS.find((d) => d.id === tut.id)!;
    const o = def.objectives.find((x) => !objectiveProgress(s, x, tut.baseline).done);
    if (o) return { text: o.label, target: { panel: def.focus?.panel } };
  }
  const ready = s.buildings.find((b) => finishedJobs(b, now).length || passiveReady(b, now).cycles);
  if (ready) return { key: 'goal.collect', params: { building: ready.type }, target: { uid: ready.uid } };
  const deliverable = s.orders.find((o) => hasItems(s.inventory, o.items));
  if (deliverable) return { key: 'goal.deliver', params: { resident: deliverable.resident }, target: { panel: 'orders' } };
  for (const r of s.residents) {
    if (!RESIDENTS[r.id]) continue;
    const ch = activeChapter(r);
    if (ch) {
      const o = ch.objectives.find((x) => !objectiveProgress(s, x, r.storyActive!.baseline, r.storyActive!.delivered).done);
      if (o && o.type === 'deliver' && objectiveProgress(s, o).cur >= objectiveProgress(s, o).n)
        return { key: 'goal.hand', params: { resident: r.id }, target: { resident: r.id } };
    }
    if (eligibleChapter(s, r)) return { key: 'goal.story', params: { resident: r.id }, target: { resident: r.id } };
  }
  const upgradable = s.buildings.find((b) => {
    const next = BUILDINGS[b.type]?.levels[b.level];
    return next && !b.busyKind && BUILDINGS[b.type].category !== 'decoration' && canAfford(s, next.upgradeCost);
  });
  if (upgradable) return { key: 'goal.upgrade', params: { building: upgradable.type }, target: { uid: upgradable.uid } };
  const quest = s.quests.active.find((q) => QUESTS.some((d) => d.id === q.id));
  if (quest) {
    const def = QUESTS.find((d) => d.id === quest.id)!;
    const o = def.objectives.find((x) => !objectiveProgress(s, x, quest.baseline).done);
    if (o) return { text: o.label, target: { panel: 'quests' } };
  }
  const idle = s.buildings.find((b) => !b.busyKind && (BUILDINGS[b.type]?.levels[b.level - 1]?.slots ?? 0) > b.queue.length);
  if (idle) return { key: 'goal.produce', params: { building: idle.type }, target: { uid: idle.uid } };
  return { key: 'goal.decorate', target: { panel: 'build' } };
}
