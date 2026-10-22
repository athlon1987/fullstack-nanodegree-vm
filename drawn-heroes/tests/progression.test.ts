import { describe, expect, it } from 'vitest';
import { newCampaign } from '../src/core/save';
import { applyStageResult, buyUpgrade, emptyStats, heroMods, levelFromXp, quoteUpgrade, rateRun, teamMods, xpForLevel } from '../src/game/progression';

describe('levels', () => {
  it('levels grow with xp', () => {
    expect(levelFromXp(0).level).toBe(1);
    expect(levelFromXp(xpForLevel(2)).level).toBe(2);
    expect(levelFromXp(xpForLevel(5) + 1).level).toBe(5);
    expect(levelFromXp(1e9).level).toBe(20);
  });
});

describe('upgrades', () => {
  it('costs ink and has meaningful effects', () => {
    const c = newCampaign('solo', 'momo');
    expect(quoteUpgrade(c, 'momo_power').canBuy).toBe(false);
    c.ink = 1000;
    const before = heroMods(c, 'momo').dmgMul;
    expect(buyUpgrade(c, 'momo_power')).toBe(true);
    expect(c.ink).toBe(940);
    expect(heroMods(c, 'momo').dmgMul).toBeCloseTo(before * 1.1);
    buyUpgrade(c, 'momo_power');
    buyUpgrade(c, 'momo_power');
    expect(quoteUpgrade(c, 'momo_power').maxed).toBe(true);
    expect(buyUpgrade(c, 'momo_power')).toBe(false);
  });
  it('skills need golden pencils', () => {
    const c = newCampaign('solo', 'momo');
    c.ink = 1000;
    expect(quoteUpgrade(c, 'momo_finisher').reason).toMatch(/pencils/);
    c.pencils[0] = [true, true, false];
    expect(buyUpgrade(c, 'momo_finisher')).toBe(true);
    expect(heroMods(c, 'momo').finisher).toBe(true);
  });
  it('team upgrades change revive speed and downed time', () => {
    const c = newCampaign('solo', 'momo');
    c.ink = 1000;
    const t0 = teamMods(c);
    buyUpgrade(c, 'team_revive');
    const t1 = teamMods(c);
    expect(t1.reviveMul).toBeGreaterThan(t0.reviveMul);
    expect(t1.downedFrames).toBeGreaterThan(t0.downedFrames);
  });
});

describe('ratings and rewards', () => {
  it('a clean fast run earns S, a messy one a low grade', () => {
    const good = { ...emptyStats(), time: 150, maxCombo: 30, damageTaken: 0, downs: 0, pencilsFound: 3 };
    expect(rateRun(good, 200).rating).toBe('S');
    const bad = { ...emptyStats(), time: 600, maxCombo: 3, damageTaken: 500, downs: 4 };
    expect(['C', 'D']).toContain(rateRun(bad, 200).rating);
  });
  it('completing a stage unlocks the next one and banks rewards', () => {
    const c = newCampaign('solo', 'momo');
    const s = { ...emptyStats(), time: 100, inkCollected: 40, xpGained: 150 };
    const r = applyStageResult(c, 0, s, 200, [true, false, true], true);
    expect(c.completed[0]).toBe(true);
    expect(c.unlocked).toBe(1);
    expect(c.pencils[0]).toEqual([true, false, true]);
    expect(c.ink).toBe(r.inkTotal);
    expect(r.challengeBonus).toBeGreaterThan(0);
    // replaying does not pay the challenge bonus twice
    const r2 = applyStageResult(c, 0, s, 200, [false, false, false], true);
    expect(r2.challengeBonus).toBe(0);
    expect(c.pencils[0]).toEqual([true, false, true]);
  });
  it('finishing the last stage marks the story finished', () => {
    const c = newCampaign('solo', 'momo');
    applyStageResult(c, 4, emptyStats(), 300, [false, false, false], false);
    expect(c.finished).toBe(true);
  });
});
