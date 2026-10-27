// The Engagement Director observes gameplay events and advances every flywheel:
// stats → quests → resident stories & memories → daily Pulse → achievements →
// seasonal event tiers → neighborhood history. Pure and deterministic.
import { BUILDINGS, isDecoration } from '../../data/buildings';
import { ITEMS } from '../../data/items';
import { ACHIEVEMENTS, EVENTS, QUESTS, STORIES } from '../../data/progression';
import { RESIDENTS } from '../../data/residents';
import { dayKey } from '../core/rng';
import type { GameEvent, GameState, TextParams } from '../core/types';
import { friendshipLevel, grantReward } from '../economy/economy';
import { generatePulse, pulseTaskProgress } from './NeighborhoodPulse';
import { allDone, baselineFor, objectiveProgress } from './objectives';

const bump = (s: GameState, k: string, n = 1) => (s.stats[k] = (s.stats[k] ?? 0) + n);

function recordStats(s: GameState, e: GameEvent) {
  switch (e.type) {
    case 'RESOURCE_COLLECTED':
      bump(s, 'collect:any');
      if (e.coins) bump(s, 'collect:coins', e.coins);
      for (const [id, n] of Object.entries(e.items)) {
        bump(s, `produce:${id}`, n);
        bump(s, 'produce:any', n);
      }
      break;
    case 'BUILDING_CONSTRUCTED':
      bump(s, `build:${e.building}`);
      bump(s, 'build:any');
      break;
    case 'DECORATION_PLACED':
      if (e.building === 'path') bump(s, 'path');
      else {
        bump(s, 'decor');
        bump(s, `decor:${e.building}`);
      }
      break;
    case 'BUILDING_UPGRADED':
      bump(s, 'upgrade');
      break;
    case 'ORDER_COMPLETED':
      bump(s, 'orders');
      bump(s, `orders:${e.order.resident}`);
      break;
    case 'RESIDENT_INTERACTED':
      bump(s, 'talk');
      bump(s, `talk:${e.resident}`);
      break;
    case 'GIFT_GIVEN':
      bump(s, 'gift');
      bump(s, `gift:${e.resident}`);
      break;
    case 'PHOTO_TAKEN':
      bump(s, 'photo');
      break;
    case 'COMMUNITY_PROJECT_CONTRIBUTED':
      bump(s, 'contribute');
      break;
    case 'DISTRICT_UNLOCKED':
      bump(s, 'expand');
      break;
    case 'STORY_MILESTONE_COMPLETED':
      bump(s, 'story');
      break;
    case 'ITEM_SOLD':
      bump(s, 'sell', e.qty);
      break;
    case 'HAND_PREPARED':
      bump(s, 'handmade');
      bump(s, `produce:${e.item}`);
      bump(s, 'produce:any');
      break;
    case 'QUIZ_ANSWERED':
      bump(s, 'quiz');
      if (e.correct) bump(s, 'quiz_correct');
      break;
    case 'SHOWROOM_ARRANGED':
      bump(s, 'arrange');
      break;
    case 'PLANTED':
      bump(s, 'plant');
      break;
    case 'WATERED':
      bump(s, 'water');
      break;
    case 'HARVESTED':
      bump(s, 'harvest');
      for (const [id, n] of Object.entries(e.items)) {
        bump(s, `produce:${id}`, n);
        bump(s, 'produce:any', n);
      }
      break;
    case 'FISH_SEEN':
      bump(s, 'fish');
      break;
    case 'PET_FED':
      bump(s, 'pet');
      break;
    case 'ZEN_MOMENT':
      bump(s, 'zen');
      bump(s, `zen:${e.kind}`);
      break;
  }
}

function remember(s: GameState, resident: string, memory: string, now: number) {
  const r = s.residents.find((x) => x.id === resident);
  if (r && !r.memories[memory]) r.memories[memory] = now;
}

/** History is stored as i18n keys + content ids, so it reads in the viewer's language. */
function log(s: GameState, now: number, icon: string, key: string, params?: TextParams) {
  s.history.unshift({ t: now, icon, key: `history.${key}`, params });
  if (s.history.length > 200) s.history.length = 200;
}

/** Resident who works at a building type (its workplace), if any. */
const workerOf = (type: string) => BUILDINGS[type]?.resident ?? Object.values(RESIDENTS).find((r) => r.workplace === type)?.id;

function narrate(s: GameState, e: GameEvent, now: number) {
  switch (e.type) {
    case 'BUILDING_CONSTRUCTED': {
      if (!isDecoration(e.building)) log(s, now, 'build', 'opened', { building: e.building });
      // The worker remembers the day their place opened ("opened_<type>"), which unlocks lines.
      const worker = workerOf(e.building);
      if (worker) remember(s, worker, `opened_${e.building}`, now);
      break;
    }
    case 'BUILDING_UPGRADED': {
      log(s, now, 'upgrade', 'upgraded', { building: e.building, level: e.level });
      const worker = workerOf(e.building);
      if (worker) remember(s, worker, `upgraded_${e.building}_${e.level}`, now);
      break;
    }
    case 'RESIDENT_ARRIVED':
      log(s, now, 'resident', 'arrived', { resident: e.resident });
      break;
    case 'FRIENDSHIP_UP':
      log(s, now, 'heart', 'friendship', { resident: e.resident, friend: e.level });
      break;
    case 'STORY_MILESTONE_COMPLETED': {
      const ch = STORIES.find((c) => c.id === e.chapter);
      log(s, now, 'story', ch?.worldChange ? 'storyChange' : 'story', { resident: e.resident, chapter: e.chapter });
      break;
    }
    case 'LEVEL_UP':
      log(s, now, 'star', 'level', { level: e.level });
      break;
    case 'DISTRICT_UNLOCKED':
      log(s, now, 'map', 'land', { plot: e.plot });
      for (const r of s.residents) remember(s, r.id, 'expanded', now);
      break;
    case 'LANDMARK_COMPLETED':
      log(s, now, 'landmark', 'landmark', { project: e.project });
      for (const r of s.residents) remember(s, r.id, 'landmark_built', now);
      break;
    case 'ACHIEVEMENT':
      log(s, now, 'trophy', 'achievement', { achievement: e.id });
      break;
    case 'ORDER_COMPLETED':
      if ((s.stats['orders'] ?? 0) % 10 === 0) log(s, now, 'orders', 'orders', { n: s.stats['orders'] });
      break;
    case 'FISH_SEEN':
      if (e.first) log(s, now, 'fish', 'fish', { fish: e.species });
      break;
    case 'HARVESTED':
      if ((s.stats['harvest'] ?? 0) === 1) log(s, now, 'sapling', 'harvest');
      break;
  }
}

function questStep(s: GameState, now: number, out: GameEvent[]) {
  // Complete
  for (const aq of [...s.quests.active]) {
    const def = QUESTS.find((q) => q.id === aq.id);
    if (!def) continue; // quest content withdrawn: keep it, paused
    if (allDone(s, def.objectives, aq.baseline)) {
      s.quests.active = s.quests.active.filter((q) => q.id !== aq.id);
      s.quests.done.push(aq.id);
      grantReward(s, def.reward, out);
      out.push({ type: 'QUEST_COMPLETED', quest: aq.id, reward: def.reward });
    }
  }
  // Activate: tutorial quests are strictly sequential; others run up to 3 at once.
  const inTutorial = !s.tutorial.done;
  const nonTutorialActive = s.quests.active.filter((q) => !QUESTS.find((d) => d.id === q.id)?.tutorial).length;
  for (const def of QUESTS) {
    if (s.quests.done.includes(def.id) || s.quests.active.some((q) => q.id === def.id)) continue;
    if (def.after && !def.after.every((id) => s.quests.done.includes(id))) continue;
    if (def.minLevel && s.level < def.minLevel) continue;
    if (s.tutorial.skipped && def.tutorial) {
      // Skipping the tutorial still lets players earn the quest by doing it.
    }
    if (!def.tutorial && (inTutorial || nonTutorialActive >= 3)) continue;
    if (def.tutorial && s.quests.active.some((q) => QUESTS.find((d) => d.id === q.id)?.tutorial)) continue;
    s.quests.active.push({ id: def.id, startedAt: now, baseline: baselineFor(s, def.objectives) });
    out.push({ type: 'QUEST_STARTED', quest: def.id });
    if (!def.tutorial) break; // one new main quest per pass keeps the log readable
  }
  // The guided tutorial ends once every tutorial quest of this world is done.
  const tutorialQuests = QUESTS.filter((q) => q.tutorial);
  if (!s.tutorial.done && tutorialQuests.length && tutorialQuests.every((q) => s.quests.done.includes(q.id))) s.tutorial.done = true;
}

function storyStep(s: GameState, now: number, out: GameEvent[]) {
  for (const r of s.residents) {
    if (!r.storyActive) continue;
    const ch = STORIES.find((c) => c.id === r.storyActive!.id);
    if (!ch) continue;
    if (!allDone(s, ch.objectives, r.storyActive.baseline, r.storyActive.delivered)) continue;
    r.storyActive = null;
    r.storyDone.push(ch.id);
    r.memories[ch.memory] = now;
    if (ch.flag) s.flags[ch.flag] = true;
    grantReward(s, ch.reward, out);
    out.push({ type: 'STORY_MILESTONE_COMPLETED', chapter: ch.id, resident: r.id, reward: ch.reward });
  }
}

function pulseStep(s: GameState, now: number, out: GameEvent[]) {
  if (!s.tutorial.done) return;
  const today = dayKey(now);
  if (!s.pulse || s.pulse.day !== today) s.pulse = generatePulse(s, today);
  for (const t of s.pulse.tasks) {
    if (t.claimed || pulseTaskProgress(s, t) < t.n) continue;
    t.claimed = true;
    grantReward(s, t.reward, out);
    out.push({ type: 'PULSE_TASK_DONE', task: t.id });
  }
}

function achievementStep(s: GameState, out: GameEvent[]) {
  for (const a of ACHIEVEMENTS) {
    if (s.achievements.includes(a.id)) continue;
    let done = false;
    if (a.counter) done = (s.stats[a.counter] ?? 0) >= a.n;
    else if (a.check === 'friend') done = s.residents.some((r) => friendshipLevel(r.friendship) >= 2);
    else if (a.check === 'landmark') done = !!s.community.completedAt;
    if (!done) continue;
    s.achievements.push(a.id);
    grantReward(s, a.reward, out);
    out.push({ type: 'ACHIEVEMENT', id: a.id });
  }
}

function eventStep(s: GameState, now: number, out: GameEvent[]) {
  if (!s.event) return;
  const def = EVENTS.find((e) => e.id === s.event!.id);
  if (!def) return;
  if (now > s.event.startedAt + def.durationDays * 86_400_000) return;
  const done = def.objectives.filter((o) => objectiveProgress(s, o, s.event!.baseline).done).length;
  def.tiers.forEach((tier, i) => {
    if (done >= tier.at && !s.event!.claimedTiers.includes(i)) {
      s.event!.claimedTiers.push(i);
      grantReward(s, tier.reward, out);
      out.push({ type: 'EVENT_TIER', event: def.id, tier: i });
    }
  });
}

/** Process a batch of events to a fixed point. Returns all follow-up events. */
export function directEngagement(s: GameState, events: GameEvent[], now: number): GameEvent[] {
  const all: GameEvent[] = [];
  let batch = events;
  for (let guard = 0; guard < 8; guard++) {
    for (const e of batch) {
      recordStats(s, e);
      narrate(s, e, now);
    }
    const out: GameEvent[] = [];
    questStep(s, now, out);
    storyStep(s, now, out);
    pulseStep(s, now, out);
    achievementStep(s, out);
    eventStep(s, now, out);
    if (!out.length) break;
    all.push(...out);
    batch = out;
  }
  return all;
}

export const itemLabel = (id: string, n: number) => `${n} ${ITEMS[id]?.name ?? id}`;
