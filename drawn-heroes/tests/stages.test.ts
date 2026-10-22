import { describe, expect, it } from 'vitest';
import { STAGES } from '../src/data/stages';
import { ENEMIES } from '../src/data/enemies';
import { runStage } from './sim';
import { newCampaign } from '../src/core/save';

describe('stage data', () => {
  it('has five stages, each with three pencils and a boss finale', () => {
    expect(STAGES).toHaveLength(5);
    for (const s of STAGES) {
      expect(s.pencils, s.name).toHaveLength(3);
      const last = s.events[s.events.length - 1];
      expect(last.type, s.name).toBe('encounter');
      expect(last.type === 'encounter' && last.boss, s.name).toBeTruthy();
    }
  });
  it('events are ordered and inside the stage; arenas contain their trigger', () => {
    for (const s of STAGES) {
      let prev = -Infinity;
      for (const e of s.events) {
        expect(e.x, `${s.name} event order`).toBeGreaterThanOrEqual(prev);
        expect(e.x).toBeLessThan(s.length);
        prev = e.x;
        if (e.type === 'encounter') {
          expect(e.lock[0], `${s.name} lock`).toBeLessThan(e.x);
          expect(e.lock[1]).toBeGreaterThan(e.x);
          expect(e.lock[1]).toBeLessThanOrEqual(s.length);
          for (const w of e.waves) for (const sp of w.spawns) expect(ENEMIES[sp.kind]).toBeDefined();
          for (const [a, b] of s.pits) expect(b <= e.lock[0] || a >= e.lock[1], `${s.name}: pit inside arena`).toBe(true);
        }
      }
    }
  });
  it('pits are jumpable and gates have two plates before them', () => {
    for (const s of STAGES) {
      for (const [a, b] of s.pits) expect(b - a, s.name).toBeLessThanOrEqual(95);
      for (const g of s.gates) for (const p of g.plates) expect(p.x).toBeLessThan(g.gateX);
    }
  });
});

describe('every stage can be completed', () => {
  // Two AI heroes play each stage start to finish (invulnerable, so this checks
  // that triggers, gates, pits, waves and bosses all resolve).
  for (let i = 0; i < 5; i++) {
    it(`page ${i + 1}: ${STAGES[i].name}`, () => {
      const r = runStage(i, { god: true, seed: 11 + i });
      expect(r.complete, r.log.slice(-6).join('\n')).toBe(true);
      expect(r.world.stats.defeated).toBeGreaterThan(5);
    }, 60000);
  }
  it('page 1 is beatable without invulnerability by the AI pair', () => {
    const r = runStage(0, { seed: 3 });
    expect(r.complete).toBe(true);
  }, 60000);
  it('co-op mode works with scaled enemies', () => {
    const r = runStage(1, { god: true, mode: 'coop', seed: 5, campaign: newCampaign('coop', 'momo') });
    expect(r.complete).toBe(true);
  }, 60000);
});
