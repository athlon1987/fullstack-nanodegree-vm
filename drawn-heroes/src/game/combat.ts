// Pure combat helpers (no world state) so they can be unit tested.
import { DEPTH_HIT_TOLERANCE } from '../config';
import type { Box3 } from '../core/math';
import type { HitboxDef } from '../data/types';

export interface Placed {
  x: number;
  y: number;
  z: number;
  facing: number;
}

export interface Bodied {
  x: number;
  y: number;
  z: number;
  w: number;
  h: number;
}

export function attackBox(a: Placed, hb: HitboxDef, ring = false): Box3 {
  if (ring) {
    return { x0: a.x - hb.w / 2, x1: a.x + hb.w / 2, y0: a.y + hb.y, y1: a.y + hb.y + hb.h, z0: a.z - hb.d, z1: a.z + hb.d };
  }
  const cx = a.x + a.facing * hb.fx;
  return { x0: cx - hb.w / 2, x1: cx + hb.w / 2, y0: a.y + hb.y, y1: a.y + hb.y + hb.h, z0: a.z - hb.d, z1: a.z + hb.d };
}

export function hurtBox(t: Bodied): Box3 {
  return { x0: t.x - t.w / 2, x1: t.x + t.w / 2, y0: t.y, y1: t.y + t.h, z0: t.z - DEPTH_HIT_TOLERANCE, z1: t.z + DEPTH_HIT_TOLERANCE };
}

/** True when the attacker stands on the side the defender is facing. */
export function isFrontal(defender: Placed, attackerX: number): boolean {
  const dx = attackerX - defender.x;
  return dx === 0 || Math.sign(dx) === defender.facing;
}

export type GuardResult = 'none' | 'block' | 'parry';

export interface DamageInput {
  base: number;
  attackerMul: number;
  chargeMul: number;
  defense: number;
  teamBonus: boolean;
  relay: boolean; // target was launched by the partner
  comboHits: number; // hits already landed in the current combo
  guard: GuardResult;
  chip: number;
  vulnerableMul: number;
}

export const TEAM_BONUS = 1.25;
export const RELAY_BONUS = 1.35;

/** Damage scaling: long combos deal slightly less per hit so they never trivialise bosses. */
export function comboScale(hits: number): number {
  if (hits < 8) return 1;
  return Math.max(0.5, 1 - (hits - 7) * 0.04);
}

export function computeDamage(d: DamageInput): number {
  if (d.guard === 'parry') return 0;
  let dmg = d.base * d.attackerMul * d.chargeMul * d.vulnerableMul;
  if (d.teamBonus) dmg *= TEAM_BONUS;
  if (d.relay) dmg *= RELAY_BONUS;
  dmg *= comboScale(d.comboHits);
  dmg *= 1 - d.defense;
  if (d.guard === 'block') dmg *= d.chip;
  return Math.max(d.guard === 'block' ? 0 : 1, Math.round(dmg));
}

/** Decide whether a defender blocks or parries an incoming hit. */
export function resolveGuard(opts: {
  blocking: boolean;
  blockFrames: number; // frames the block has been held
  parryWindow: number;
  frontal: boolean;
  unblockable: boolean;
}): GuardResult {
  if (!opts.blocking || !opts.frontal || opts.unblockable) return 'none';
  return opts.blockFrames <= opts.parryWindow ? 'parry' : 'block';
}

export function chargeMultiplier(chargeFrames: number, max: number, bonus: number): number {
  if (max <= 0) return 1;
  return 1 + (Math.min(chargeFrames, max) / max) * bonus;
}
