// Fast, satisfying first session: a human-paced new player following the guide reaches every
// first-five-minute milestone in time and never hits a waiting wall. (A model, not a playtest:
// real playtests still have to confirm the feel — see docs/GAME_DESIGN.md §Pacing.)
import { beforeAll, describe, expect, it } from 'vitest';
import { activate, initContent } from '../platform/content/service';
import { simulateFirstSession } from './sim/firstSession';

const T0 = new Date('2026-11-02T09:00:00').getTime();

beforeAll(async () => {
  await initContent({ remoteBase: null, cache: null });
});

// Seconds from opening the game (design targets from the enhancement brief §3.2–3.3).
const TARGETS = {
  meetResident: 5,
  firstCollect: 20,
  firstReward: 60,
  firstBusiness: 60,
  firstProduct: 90,
  firstRequest: 150,
  firstImprovement: 300,
  nextObjective: 300,
} as const;

describe.each(['my.seri_bayu', 'my.kampung_seri', 'core.maple_hollow'])('first session in %s', (world) => {
  it('reaches every first-five-minute milestone on time, with no waiting walls', () => {
    activate(world, 'en', T0);
    const r = simulateFirstSession(T0, 900);
    for (const [m, limit] of Object.entries(TARGETS)) {
      const at = r.milestones[m as keyof typeof TARGETS];
      expect(at, `${m} reached`).toBeDefined();
      expect(at!, `${m} by ${limit}s`).toBeLessThanOrEqual(limit);
    }
    expect(r.longestWait, 'longest stretch with nothing useful to do').toBeLessThanOrEqual(20);
    expect(r.waitedLong / 900, 'share of time stuck waiting (stretches of 8 s+)').toBeLessThan(0.1);
    expect(r.waited / 900, 'share of time with nothing to do, including short pauses').toBeLessThan(0.2);
    expect(r.quests.filter((q) => q.at <= 600).length, 'goals completed in 10 minutes').toBeGreaterThanOrEqual(6);
  });
});
