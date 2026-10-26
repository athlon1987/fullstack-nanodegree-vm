// Economy & engagement-flywheel simulator. Bot players with different habits play
// the REAL engine (src/game) for 30 simulated days. Results are estimates of pacing
// under stated assumptions — not evidence of real player retention.
//
// Run: npm run economy:sim   (writes docs/ECONOMY_SIMULATION.md)
import { writeFileSync } from 'node:fs';
import { BUILDINGS } from '../../src/data/buildings';
import { ITEMS, RECIPES } from '../../src/data/items';
import { COMMUNITY_PROJECTS, EXPANSIONS, QUESTS, STORIES, expansionCost } from '../../src/data/progression';
import { eligibleChapter, activeChapter } from '../../src/game/characters/relationships';
import { plotUnlockable } from '../../src/game/core/actions';
import { dispatch, type Action } from '../../src/game/core/engine';
import { createNewGame } from '../../src/game/core/newGame';
import type { GameState } from '../../src/game/core/types';
import { canAfford, finishedJobs, hasItems, levelDef, passiveReady } from '../../src/game/economy/economy';
import { findSpot } from '../../src/game/world/grid';

interface Profile {
  name: string;
  /** Sessions per day and minutes per session. */
  sessions: number;
  minutes: number;
  /** Play every N days (1 = daily). */
  everyDays: number;
  social: boolean;
  decorates: boolean;
  /** Extra long session every N days (enthusiast). */
  longEvery?: number;
}

const PROFILES: Profile[] = [
  { name: 'Casual (2×3 min/day)', sessions: 2, minutes: 3, everyDays: 1, social: false, decorates: false },
  { name: 'Regular (3×5 min/day)', sessions: 3, minutes: 5, everyDays: 1, social: true, decorates: true },
  { name: 'Enthusiast (3×10 min + 30 min every 3rd day)', sessions: 3, minutes: 10, everyDays: 1, social: true, decorates: true, longEvery: 3 },
  { name: 'Returning (1×15 min every 4 days)', sessions: 1, minutes: 15, everyDays: 4, social: false, decorates: true },
  { name: 'Solo (2×8 min/day, never contributes)', sessions: 2, minutes: 8, everyDays: 1, social: false, decorates: true },
];

const BUILD_ORDER = ['cafe', 'garden', 'bakery', 'workshop', 'flower_shop', 'cottage', 'park', 'grocery', 'garden', 'townhouse', 'town_hall', 'cottage'];
const DECOR = ['tree_round', 'flower_bed', 'bench', 'lamp', 'path', 'bush', 'tree_pine'];
const T0 = new Date('2026-11-02T08:00:00').getTime();
const STEP = 10_000;

class Bot {
  s: GameState;
  now = T0;
  log: string[] = [];
  actions = 0;
  errors = 0;
  idleSteps = 0;
  steps = 0;
  constructor(private p: Profile) {
    this.s = createNewGame(T0, 4242);
    this.act({ type: 'sessionStart' });
    this.act({ type: 'tutorial', skip: false });
  }

  act(a: Action) {
    const r = dispatch(this.s, a, this.now);
    if (r.error) {
      this.errors++;
      return false;
    }
    this.s = r.state;
    this.actions++;
    return true;
  }

  /** Items the bot currently needs (orders, active stories, upgrade/build materials). */
  wanted(): Record<string, number> {
    const need: Record<string, number> = {};
    const add = (bag: Record<string, number>) => {
      for (const [k, n] of Object.entries(bag)) need[k] = Math.max(need[k] ?? 0, n);
    };
    for (const o of this.s.orders) add(o.items);
    for (const r of this.s.residents) {
      const ch = activeChapter(r);
      if (ch) for (const o of ch.objectives) if (o.type === 'deliver') add(o.items);
    }
    for (const b of this.s.buildings) {
      const next = BUILDINGS[b.type].levels[b.level];
      if (next?.upgradeCost.items) add(next.upgradeCost.items);
    }
    for (const t of BUILD_ORDER) if (BUILDINGS[t].cost.items) add(BUILDINGS[t].cost.items!);
    if (this.p.social) {
      const p = COMMUNITY_PROJECTS[0];
      for (const [k, n] of Object.entries(p.requirements)) if (k !== 'coins') need[k] = Math.max(need[k] ?? 0, Math.min(3, n as number));
    }
    return need;
  }

  step() {
    this.steps++;
    const before = this.actions;
    const s = () => this.s;
    for (const b of s().buildings) if (finishedJobs(b, this.now).length || passiveReady(b, this.now).cycles) this.act({ type: 'collect', uid: b.uid });
    for (const o of [...s().orders]) if (hasItems(s().inventory, o.items)) this.act({ type: 'deliverOrder', id: o.id });
    for (const r of s().residents) {
      if (r.lastTalkDay !== new Date(this.now).toDateString() && this.act({ type: 'talk', resident: r.id, phase: 'day' })) {
        /* daily chat */
      }
      if (eligibleChapter(s(), r)) this.act({ type: 'startStory', resident: r.id });
      const ch = activeChapter(s().residents.find((x) => x.id === r.id)!);
      if (ch) this.act({ type: 'deliverStory', resident: r.id });
    }
    // Build next planned building
    const counts: Record<string, number> = {};
    for (const t of BUILD_ORDER) {
      counts[t] = (counts[t] ?? 0) + 1;
      const have = s().buildings.filter((b) => b.type === t).length;
      if (have >= counts[t]) continue;
      const def = BUILDINGS[t];
      if (def.unlockLevel > s().level || !canAfford(s(), def.cost)) break;
      const spot = findSpot(s(), t, 14, 12);
      if (spot) this.act({ type: 'place', building: t, x: spot.x, z: spot.z, rot: 0 });
      break;
    }
    // Upgrades (keep a small reserve)
    for (const b of s().buildings) {
      const next = BUILDINGS[b.type].levels[b.level];
      if (!next || b.busyKind || BUILDINGS[b.type].category === 'decoration') continue;
      if (canAfford(s(), { ...next.upgradeCost, coins: (next.upgradeCost.coins ?? 0) + 60 })) this.act({ type: 'upgrade', uid: b.uid });
    }
    // Production: fill slots, prioritising wanted items, then materials, then value
    const want = this.wanted();
    for (const b of s().buildings) {
      if (b.busyKind) continue;
      const lv = levelDef(b);
      const recipes = Object.values(RECIPES).filter((r) => r.building === b.type && r.level <= b.level);
      if (!recipes.length) continue;
      let guard = 0;
      while (s().buildings.find((x) => x.uid === b.uid)!.queue.length < lv.slots && guard++ < 6) {
        const can = recipes.filter((r) => hasItems(s().inventory, r.inputs));
        if (!can.length) break;
        const score = (r: (typeof recipes)[0]) => {
          const have = s().inventory[r.output] ?? 0;
          const deficit = Math.max(0, (want[r.output] ?? 0) - have);
          return deficit * 100 + (ITEMS[r.output].kind === 'material' ? 20 : 0) + ITEMS[r.output].value / r.seconds;
        };
        can.sort((a, c) => score(c) - score(a));
        if (!this.act({ type: 'produce', uid: b.uid, recipe: can[0].id })) break;
      }
    }
    // Decorate a little when comfortable
    if (this.p.decorates && s().coins > 500 && this.steps % 12 === 0) {
      const t = DECOR[this.steps % DECOR.length];
      const def = BUILDINGS[t];
      if (def.unlockLevel <= s().level) {
        const spot = findSpot(s(), t, 9 + (this.steps % 8), 7 + (this.steps % 6));
        if (spot) this.act({ type: 'place', building: t, x: spot.x, z: spot.z, rot: 0 });
      }
    }
    // Community project
    if (this.p.social && s().level >= 3 && !s().community.completedAt) {
      for (const [res, need] of Object.entries(COMMUNITY_PROJECTS[0].requirements as Record<string, number>)) {
        const given = (s().community.contributed as Record<string, number>)[res] ?? 0;
        const have = res === 'coins' ? s().coins - 400 : (s().inventory[res] ?? 0) - (want[res] ?? 0);
        if (have > 0 && given < need) this.act({ type: 'contribute', resource: res, qty: Math.min(have, need - given), opId: `sim-${this.steps}-${res}` });
      }
    }
    if (s().community.completedAt && !s().community.rewardClaimed) this.act({ type: 'claimCommunityReward' });
    if (s().pulse?.tasks.every((t) => t.claimed) && !s().pulse?.bonusClaimed) this.act({ type: 'claimPulseBonus' });
    // Expand when wealthy
    for (const e of EXPANSIONS) {
      if (plotUnlockable(s(), e.id) && s().level >= e.minLevel && canAfford(s(), { coins: (expansionCost(e, s().plots.length).coins ?? 0) + 400, items: expansionCost(e, s().plots.length).items })) {
        this.act({ type: 'unlockPlot', plot: e.id });
        break;
      }
    }
    if (this.steps % 30 === 0) this.act({ type: 'photo' });
    if (this.actions === before) this.idleSteps++;
  }

  session(minutes: number) {
    this.act({ type: 'sessionStart' });
    const end = this.now + minutes * 60_000;
    while (this.now < end) {
      this.step();
      this.now += STEP;
      this.act({ type: 'tick' });
    }
  }
}

interface DayRow {
  day: number;
  level: number;
  coins: number;
  buildings: number;
  residents: number;
  quests: number;
  stories: number;
  orders: number;
  achievements: number;
  plots: number;
  pulseDays: number;
  fountain: string;
}

function run(p: Profile) {
  const bot = new Bot(p);
  const rows: DayRow[] = [];
  const milestones: string[] = [];
  const seen = new Set<string>();
  let pulseDays = 0;
  const minutesPlayed = { total: 0 };
  for (let day = 1; day <= 30; day++) {
    const dayStart = T0 + (day - 1) * 86_400_000;
    if ((day - 1) % p.everyDays === 0) {
      const sessions = p.sessions;
      for (let k = 0; k < sessions; k++) {
        bot.now = Math.max(bot.now, dayStart + (k * 12 * 3_600_000) / sessions + 30 * 60_000);
        const mins = p.longEvery && day % p.longEvery === 0 && k === 0 ? 30 : p.minutes;
        bot.session(mins);
        minutesPlayed.total += mins;
      }
      if (bot.s.pulse?.bonusClaimed) pulseDays++;
    }
    const s = bot.s;
    const note = (k: string, text: string) => {
      if (!seen.has(k)) {
        seen.add(k);
        milestones.push(`Day ${day}: ${text}`);
      }
    };
    for (const b of s.buildings) if (!['decoration', 'path', 'landmark'].includes(BUILDINGS[b.type].category)) note(`b:${b.type}`, `built ${BUILDINGS[b.type].name}`);
    note(`lv:${s.level}`, `reached level ${s.level}`);
    if (s.community.completedAt) note('fountain', 'completed the community fountain');
    for (const r of s.residents) for (const c of r.storyDone) note(`st:${c}`, `story “${STORIES.find((x) => x.id === c)!.title}”`);
    rows.push({
      day,
      level: s.level,
      coins: s.coins,
      buildings: s.buildings.filter((b) => !['decoration', 'path', 'landmark'].includes(BUILDINGS[b.type].category)).length,
      residents: s.residents.length,
      quests: s.quests.done.length,
      stories: s.residents.reduce((a, r) => a + r.storyDone.length, 0),
      orders: s.stats.orders ?? 0,
      achievements: s.achievements.length,
      plots: s.plots.length,
      pulseDays,
      fountain: s.community.completedAt ? 'done' : `${Math.round(fountainPct(s) * 100)}%`,
    });
  }
  return { p, rows, milestones, bot, minutes: minutesPlayed.total };
}

function fountainPct(s: GameState) {
  const req = Object.entries(COMMUNITY_PROJECTS[0].requirements as Record<string, number>);
  return req.reduce((a, [k, n]) => a + Math.min(1, ((s.community.contributed as Record<string, number>)[k] ?? 0) / n), 0) / req.length;
}

const results = PROFILES.map(run);
const findings: string[] = [];
for (const r of results) {
  const last = r.rows[r.rows.length - 1];
  const d1 = r.rows[0];
  const d7 = r.rows[6];
  const idleRate = r.bot.idleSteps / Math.max(1, r.bot.steps);
  if (d1.level < 2) findings.push(`⚠ ${r.p.name}: still level ${d1.level} after day 1 — first-day pacing may feel slow.`);
  if (d7.level >= 9) findings.push(`⚠ ${r.p.name}: level ${d7.level} by day 7 — early levels may be too fast.`);
  if (last.coins > 20000) findings.push(`⚠ ${r.p.name}: ${last.coins} coins banked at day 30 — needs more coin sinks (inflation risk).`);
  if (idleRate > 0.6) findings.push(`⚠ ${r.p.name}: ${(idleRate * 100).toFixed(0)}% of 10-second steps had nothing useful to do — sessions may feel like waiting.`);
  if (last.quests < QUESTS.length / 2) findings.push(`ℹ ${r.p.name}: ${last.quests}/${QUESTS.length} main quests by day 30.`);
  if (r.p.social === false && last.fountain !== 'done') findings.push(`ℹ ${r.p.name}: fountain at ${last.fountain} without contributing — solo progress is not blocked by it (by design).`);
}
const table = (r: (typeof results)[0]) => {
  const pick = [1, 2, 3, 5, 7, 10, 14, 21, 30];
  const head = '| Day | Lvl | Coins | Buildings | Residents | Quests | Stories | Orders | Achievements | Plots | Pulse days | Fountain |\n|---|---|---|---|---|---|---|---|---|---|---|---|';
  return head + '\n' + r.rows.filter((x) => pick.includes(x.day)).map((x) => `| ${x.day} | ${x.level} | ${x.coins} | ${x.buildings} | ${x.residents} | ${x.quests} | ${x.stories} | ${x.orders} | ${x.achievements} | ${x.plots} | ${x.pulseDays} | ${x.fountain} |`).join('\n');
};
const md = `# Economy & Flywheel Simulation

_Generated by \`npm run economy:sim\` (scripts/economy/simulate.ts) on ${new Date().toISOString().slice(0, 10)}._

Bots play the **real game engine** for 30 simulated days with a simple, reasonable policy: collect everything, deliver orders, chat daily, start and complete resident stories, follow a fixed build order, upgrade when affordable (keeping a small reserve), keep production slots full (prioritising items needed for orders/stories/upgrades), decorate when comfortable, contribute to the fountain (social profiles), expand land when wealthy.

**These are pacing estimates under stated assumptions, not retention data.** Real players are less efficient than bots in some ways (they don't optimise) and more in others (they play longer when engaged).

## Findings

${findings.length ? findings.map((f) => `- ${f}`).join('\n') : '- No balance warnings triggered.'}

${results
  .map(
    (r) => `## ${r.p.name}

Played ${r.minutes} minutes over 30 days · ${r.bot.actions} successful actions · ${(100 * r.bot.idleSteps / Math.max(1, r.bot.steps)).toFixed(0)}% idle steps

${table(r)}

<details><summary>Milestones</summary>

${r.milestones.map((m) => `- ${m}`).join('\n')}

</details>
`,
  )
  .join('\n')}
`;
writeFileSync('docs/ECONOMY_SIMULATION.md', md);
for (const r of results) {
  const l = r.rows[r.rows.length - 1];
  console.log(`${r.p.name.padEnd(50)} D1 lv${r.rows[0].level}  D7 lv${r.rows[6].level}  D30 lv${l.level} coins ${l.coins} bld ${l.buildings} res ${l.residents} quests ${l.quests} stories ${l.stories} fountain ${l.fountain} idle ${(100 * r.bot.idleSteps / r.bot.steps).toFixed(0)}%`);
}
console.log(findings.join('\n'));
