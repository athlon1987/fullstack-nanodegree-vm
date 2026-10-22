import { describe, expect, it } from 'vitest';
import { attackBox, chargeMultiplier, comboScale, computeDamage, hurtBox, isFrontal, resolveGuard, RELAY_BONUS, TEAM_BONUS } from '../src/game/combat';
import { boxesOverlap } from '../src/core/math';
import { ATTACKS, PROJECTILES } from '../src/data/attacks';
import { HEROES } from '../src/data/heroes';
import { ENEMIES } from '../src/data/enemies';

const base = { base: 10, attackerMul: 1, chargeMul: 1, defense: 0, teamBonus: false, relay: false, comboHits: 0, guard: 'none' as const, chip: 0.2, vulnerableMul: 1 };

describe('damage', () => {
  it('applies the base damage', () => {
    expect(computeDamage(base)).toBe(10);
  });
  it('team and relay bonuses stack', () => {
    expect(computeDamage({ ...base, teamBonus: true })).toBe(Math.round(10 * TEAM_BONUS));
    expect(computeDamage({ ...base, teamBonus: true, relay: true })).toBe(Math.round(10 * TEAM_BONUS * RELAY_BONUS));
  });
  it('defense reduces damage but never to zero on a clean hit', () => {
    expect(computeDamage({ ...base, defense: 0.15 })).toBe(9);
    expect(computeDamage({ ...base, base: 1, defense: 0.9 })).toBe(1);
  });
  it('blocking only lets chip damage through, parry negates', () => {
    expect(computeDamage({ ...base, guard: 'block' })).toBe(2);
    expect(computeDamage({ ...base, guard: 'block', chip: 0 })).toBe(0);
    expect(computeDamage({ ...base, guard: 'parry' })).toBe(0);
  });
  it('long combos scale down but never below half', () => {
    expect(comboScale(3)).toBe(1);
    expect(comboScale(12)).toBeLessThan(1);
    expect(comboScale(500)).toBe(0.5);
  });
  it('charging increases damage up to the cap', () => {
    expect(chargeMultiplier(0, 45, 0.9)).toBe(1);
    expect(chargeMultiplier(45, 45, 0.9)).toBeCloseTo(1.9);
    expect(chargeMultiplier(90, 45, 0.9)).toBeCloseTo(1.9);
  });
});

describe('guard', () => {
  it('parries inside the window and blocks after it', () => {
    const o = { blocking: true, parryWindow: 8, frontal: true, unblockable: false };
    expect(resolveGuard({ ...o, blockFrames: 3 })).toBe('parry');
    expect(resolveGuard({ ...o, blockFrames: 30 })).toBe('block');
  });
  it('cannot block from behind or against unblockable attacks', () => {
    expect(resolveGuard({ blocking: true, parryWindow: 8, frontal: false, unblockable: false, blockFrames: 30 })).toBe('none');
    expect(resolveGuard({ blocking: true, parryWindow: 8, frontal: true, unblockable: true, blockFrames: 30 })).toBe('none');
  });
  it('detects frontal attacks from facing', () => {
    expect(isFrontal({ x: 0, y: 0, z: 0, facing: 1 }, 50)).toBe(true);
    expect(isFrontal({ x: 0, y: 0, z: 0, facing: 1 }, -50)).toBe(false);
  });
});

describe('hitboxes', () => {
  const attacker = { x: 100, y: 0, z: 100, facing: 1 };
  it('jab reaches an enemy in front on the same depth lane', () => {
    const box = attackBox(attacker, ATTACKS.m_l1.hitbox);
    expect(boxesOverlap(box, hurtBox({ x: 150, y: 0, z: 100, w: 60, h: 96 }))).toBe(true);
  });
  it('does not hit enemies behind or on another depth plane', () => {
    const box = attackBox(attacker, ATTACKS.m_l1.hitbox);
    expect(boxesOverlap(box, hurtBox({ x: 40, y: 0, z: 100, w: 60, h: 96 }))).toBe(false);
    expect(boxesOverlap(box, hurtBox({ x: 150, y: 0, z: 180, w: 60, h: 96 }))).toBe(false);
  });
  it('ring attacks hit both sides', () => {
    const box = attackBox(attacker, ATTACKS.s_coop.hitbox, true);
    expect(boxesOverlap(box, hurtBox({ x: 0, y: 0, z: 100, w: 60, h: 96 }))).toBe(true);
    expect(boxesOverlap(box, hurtBox({ x: 200, y: 0, z: 100, w: 60, h: 96 }))).toBe(true);
  });
  it('every attack and projectile is well formed', () => {
    for (const a of Object.values(ATTACKS)) {
      expect(a.startup + a.active + a.recovery, a.id).toBeGreaterThan(0);
      if (a.next) expect(ATTACKS[a.next], `${a.id}.next`).toBeDefined();
      if (a.projectile) expect(PROJECTILES[a.projectile], `${a.id}.projectile`).toBeDefined();
    }
    for (const h of Object.values(HEROES)) for (const id of [h.lightStart, h.heavy, h.air]) expect(ATTACKS[id], id).toBeDefined();
    for (const e of Object.values(ENEMIES)) for (const id of e.attacks) expect(ATTACKS[id], `${e.kind}:${id}`).toBeDefined();
  });
});
