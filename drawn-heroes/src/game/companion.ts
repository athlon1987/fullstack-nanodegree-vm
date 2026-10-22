import type { PlayerInput } from '../core/input';
import { clamp } from '../core/math';
import type { HeroId } from '../data/types';
import type { Enemy } from './enemy';
import type { AttackInstance } from './fighter';
import type { Hero } from './hero';
import type { World } from './world';

const empty = (): PlayerInput => ({ mx: 0, mz: 0, jump: false, light: false, heavy: false, special: false, dodge: false, ult: false, interact: false });

/**
 * Drives a hero with a virtual controller. As a companion it follows the player,
 * revives, stands on team plates and fights; as a leader (tests / attract mode)
 * it also pushes the stage forward.
 */
export class CompanionBrain {
  private reacted: AttackInstance | null = null;
  private evadeT = 0;
  private evadeZ = 0;
  private blockT = 0;
  private lastX = 0;
  private stuckT = 0;
  private heavyT = 0;
  private target: Enemy | null = null;
  private retargetT = 0;
  private jumpCd = 0;

  constructor(
    readonly heroId: HeroId,
    readonly leader: boolean,
  ) {}

  think(world: World, me: Hero): PlayerInput {
    const out = empty();
    if (!me.active || me.state === 'script') return out;
    const partner = world.partnerOf(me);
    const f = world.frame;
    if (this.jumpCd > 0) this.jumpCd--;

    // the final blow: fire the Team Finisher (the player gets a few seconds to do it first)
    if (world.finale && world.meter >= 100 && (this.leader || world.frame - (world.finale.mem.finaleAt ?? world.frame) > 360)) {
      out.ult = f % 4 < 2;
      return out;
    }

    // 1. revive a downed partner
    if (partner && partner.state === 'downed') {
      const danger = this.threatened(world, me);
      if (!danger || partner.downedT < 240) {
        const tx = partner.x + (me.x < partner.x ? -45 : 45);
        if (Math.abs(me.x - tx) < 30 && Math.abs(me.z - partner.z) < 30) {
          out.interact = true;
          return out;
        }
        this.steer(world, me, out, tx, partner.z);
        return out;
      }
    }

    // 2. defend against telegraphed attacks and hazards
    if (this.evadeT > 0) {
      this.evadeT--;
      out.mz = this.evadeZ;
      if (this.evadeT > 12) out.dodge = this.evadeT % 2 === 0;
      return out;
    }
    if (this.blockT > 0) {
      this.blockT--;
      out.dodge = true;
      return out;
    }
    const threat = this.threatened(world, me);
    if (threat && threat.attack && threat.attack !== this.reacted) {
      this.reacted = threat.attack;
      const big = threat.attack.def.damage >= 14 || threat.attack.def.unblockable || threat.attack.def.id === 'b_beam';
      if (world.rng.chance(this.leader ? 0.95 : 0.8)) {
        if (big || threat.isBoss) {
          this.evadeZ = me.z > 100 ? -1 : 1;
          if (threat.attack.def.id === 'b_beam') this.evadeZ = me.z >= threat.z ? 1 : -1;
          this.evadeT = 22;
          out.mz = this.evadeZ;
          out.dodge = true;
          return out;
        }
        this.blockT = Math.max(8, threat.attack.def.startup - threat.attack.t + 6);
        out.dodge = true;
        return out;
      }
    }
    if (this.dodgeHazards(world, me, out)) return out;

    // 3. team plates
    const gate = world.gates.find((g) => !g.open && g.x > me.x - 150 && g.x - me.x < 700);
    if (gate && !world.encounter) {
      const onPlate = (h: Hero | null, i: number) => !!h && Math.abs(h.x - gate.plates[i].x) < 30 && Math.abs(h.z - gate.plates[i].z) < 22;
      const partnerNear = partner && (partner.x > gate.x - 420 || onPlate(partner, 0) || onPlate(partner, 1));
      if (this.leader || partnerNear) {
        let idx = this.leader ? 0 : onPlate(partner, 0) ? 1 : onPlate(partner, 1) ? 0 : Math.abs(me.x - gate.plates[0].x) < Math.abs(me.x - gate.plates[1].x) ? 0 : 1;
        if (this.leader && partner && onPlate(partner, 0)) idx = 1;
        const p = gate.plates[idx];
        if (Math.abs(me.x - p.x) > 12 || Math.abs(me.z - p.z) > 10) this.steer(world, me, out, p.x, p.z, 0.8);
        return out;
      }
    }

    // 4. fight
    const foes = world.enemiesOnScreen().filter((e) => e.state !== 'spawn' && e.hittable() && !e.mem.hidden);
    if (foes.length) {
      this.fight(world, me, partner, foes, out);
      return out;
    }

    // 5. heal up
    if (me.hp / me.maxHp < 0.5) {
      const hp = world.pickups.find((p) => p.active && p.kind === 'health' && Math.abs(p.x - me.x) < 500);
      if (hp) {
        this.steer(world, me, out, hp.x, hp.z);
        return out;
      }
    }

    // 6. move: lead the way or follow the partner
    if (this.leader || !partner || !partner.active) {
      const pencil = world.pickups.find((p) => p.active && p.kind === 'pencil' && Math.abs(p.x - me.x) < 300 && p.y < 10);
      if (pencil) this.steer(world, me, out, pencil.x, pencil.z);
      else {
        const crate = world.crates.find((c) => !c.broken && c.y === 0 && c.x > me.x - 40 && c.x - me.x < 220);
        if (crate && this.leader) {
          this.steer(world, me, out, crate.x - 50, crate.z);
          if (Math.abs(me.x - (crate.x - 50)) < 20 && Math.abs(me.z - crate.z) < 12) {
            out.mx = 0.4;
            out.light = f % 8 < 4;
          }
        } else this.steer(world, me, out, me.x + 300, clamp(me.z, 40, 160));
      }
      return out;
    }
    const dist = Math.abs(partner.x - me.x);
    if (dist > 520 || (this.stuckT > 150 && dist > 160)) {
      // catch up with a doodle "poof"
      world.fx.ring(me.x, 40, me.z, 60, '#ffffff');
      me.x = clamp(partner.x - partner.facing * 70, world.heroBounds()[0], world.heroBounds()[1]);
      me.z = partner.z;
      me.y = Math.max(0, partner.y);
      me.vx = me.vy = 0;
      world.ensureSafe(me);
      world.fx.ring(me.x, 40, me.z, 60, '#ffffff');
      this.stuckT = 0;
      return out;
    }
    const tx = partner.x - partner.facing * 90;
    const tz = clamp(partner.z + (partner.z > 100 ? -35 : 35), 10, 190);
    if (Math.abs(me.x - tx) > 40 || Math.abs(me.z - tz) > 30) this.steer(world, me, out, tx, tz);
    return out;
  }

  private threatened(world: World, me: Hero): Enemy | null {
    for (const e of world.enemies) {
      if (!e.attack || e.attackPhase !== 'startup' || !e.attack.def.telegraph) continue;
      if (e.target !== me && Math.abs(e.x - me.x) > 160) continue;
      const d = e.attack.def;
      const reach = d.id === 'b_beam' ? 1100 : d.hitbox.fx + d.hitbox.w / 2 + (d.lunge ?? 0) * (d.active + 6) + 30;
      const dx = (me.x - e.x) * e.facing;
      if (dx > -40 && dx < reach && Math.abs(me.z - e.z) < d.hitbox.d + 24) {
        if (e.attack.t > d.startup - 22 || d.id === 'b_charge' || d.id === 'b_beam') return e;
      }
    }
    return null;
  }

  private dodgeHazards(world: World, me: Hero, out: PlayerInput): boolean {
    // ground waves: jump them
    for (const p of world.projectiles.items) {
      if (!p.active || p.team !== 'enemy') continue;
      const dx = p.x - me.x;
      if (p.def.art === 'shockwave') {
        if (Math.abs(dx) < 90 && Math.sign(p.vx) === -Math.sign(dx || 1) && me.onGround && this.jumpCd <= 0) {
          out.jump = true;
          this.jumpCd = 30;
          return true;
        }
      } else if (p.def.arc) {
        // predict where the lob lands and step out of it
        const g = p.def.gravity;
        const tl = (p.vy + Math.sqrt(p.vy * p.vy + 2 * g * Math.max(0, p.y))) / g;
        const lx = p.x + p.vx * tl;
        const lz = p.z + p.vz * tl;
        if (Math.abs(lx - me.x) < 55 && Math.abs(lz - me.z) < 34 && tl < 45) {
          out.mz = me.z >= lz ? 1 : -1;
          if (me.z > 185) out.mz = -1;
          if (me.z < 15) out.mz = 1;
          return true;
        }
      } else if (Math.abs(dx) < 160 && Math.abs(p.z - me.z) < 30 && Math.sign(p.vx) === -Math.sign(dx || 1) && p.def.art !== 'inkdrop') {
        out.mz = me.z > 100 ? -1 : 1;
        return true;
      } else if (p.def.art === 'inkdrop' && Math.abs(dx) < 50 && Math.abs(p.z - me.z) < 30) {
        out.mx = dx > 0 ? -1 : 1;
        return true;
      }
    }
    for (const s of world.handSlams) {
      if (s.t < 50 && Math.abs(s.x - me.x) < 85 && Math.abs(s.z - me.z) < 50) {
        out.mx = me.x >= s.x ? 1 : -1;
        out.mz = me.z >= s.z ? 1 : -1;
        if (s.t > 30 && me.onGround) out.dodge = s.t % 2 === 0;
        return true;
      }
    }
    for (const h of world.hazards) {
      const d = h.def;
      if (d.type === 'press' && (h.phase === 'warn' || h.phase === 'active') && me.x > d.x - 30 && me.x < d.x + d.w + 30 && me.z > d.z - 30 && me.z < d.z + d.d + 30) {
        out.mx = me.x < d.x + d.w / 2 ? -1 : 1;
        return true;
      }
      if (d.type === 'vent' && h.phase === 'warn' && Math.abs(me.x - d.x) < 60 && Math.abs(me.z - d.z) < 34) {
        out.mz = me.z >= d.z ? 1 : -1;
        out.mx = me.x >= d.x ? 1 : -1;
        return true;
      }
      if (d.type === 'roller' && h.phase !== 'idle' && h.phase !== 'rest' && Math.abs(me.x - h.px) < 70 && me.z > h.pz - 40) {
        out.mx = me.x >= h.px ? 1 : -1;
        return true;
      }
      if (d.type === 'car' && h.phase === 'warn' && Math.abs(me.z - d.z) < d.d + 16 && me.x > d.x0 - 200 && me.x < d.x1 + 200) {
        out.mz = me.z >= d.z ? 1 : -1;
        return true;
      }
    }
    return false;
  }

  private fight(world: World, me: Hero, partner: Hero | null, foes: Enemy[], out: PlayerInput): void {
    const f = world.frame;
    if (--this.retargetT <= 0 || !this.target || !foes.includes(this.target)) {
      this.retargetT = 40;
      let best: Enemy | null = null;
      let bestD = Infinity;
      for (const e of foes) {
        let d = Math.abs(e.x - me.x) + Math.abs(e.z - me.z) * 2;
        if (partner && partner.attack && Math.abs(partner.x - e.x) < 110) d *= 0.6; // help the partner for team combos
        if (e.kind === 'smudgeTwin' && partner && foes.filter((x) => x.kind === 'smudgeTwin').length > 1) {
          // split up on the twins
          d = (e.mem.twinIndex ?? 0) === me.playerSlot ? d * 0.3 : d * 3;
        }
        if (d < bestD) {
          bestD = d;
          best = e;
        }
      }
      this.target = best;
    }
    const t = this.target!;
    const reach = me.heroId === 'momo' ? 58 : 66;
    let side = me.x < t.x ? -1 : 1;
    // flank shielded enemies
    if (t.def.shield && t.shieldUp && Math.sign(me.x - t.x) === t.facing) {
      side = -t.facing;
      const tz = t.z + (me.z > t.z ? 60 : -60);
      if (Math.abs(me.x - t.x) < 140) {
        this.steer(world, me, out, t.x + side * reach, clamp(tz, 0, 200));
        if (world.rng.chance(0.02)) out.heavy = true;
        return;
      }
    }
    const tx = t.x + side * (reach + t.w * 0.25);
    const tz = t.z;
    const dx = Math.abs(me.x - tx);
    const dz = Math.abs(me.z - tz);
    if (dx > 14 || dz > 10) this.steer(world, me, out, tx, tz);
    if (Math.abs(me.x - t.x) < reach + t.w * 0.5 + 30 && dz < 16) {
      out.mx = t.x > me.x ? 0.3 : -0.3;
      const crowd = foes.filter((e) => Math.abs(e.x - me.x) < 240 && Math.abs(e.z - me.z) < 60).length;
      if (me.specialCd <= 0 && (crowd >= 2 || t.isBoss) && world.rng.chance(0.1)) {
        out.special = true;
        return;
      }
      if (++this.heavyT > 100 || (t.armorPts > 0 && this.heavyT > 40) || (t.def.shield && t.shieldUp)) {
        if (this.heavyT > 104) this.heavyT = 0;
        out.heavy = this.heavyT % 4 < 2;
        return;
      }
      out.light = f % 7 < 3;
    }
    // ranged foes: Momo throws bananas
    if (me.heroId === 'momo' && me.specialCd <= 0 && Math.abs(t.x - me.x) > 180 && Math.abs(t.z - me.z) < 20 && world.rng.chance(0.05)) {
      me.facing = t.x > me.x ? 1 : -1;
      out.special = true;
    }
  }

  /** Steer toward a point, jumping pits and climbing over obstacles. */
  private steer(world: World, me: Hero, out: PlayerInput, tx: number, tz: number, speed = 1): void {
    const dx = tx - me.x;
    const dz = tz - me.z;
    out.mx = Math.abs(dx) > 6 ? clamp(dx / 30, -1, 1) * speed : 0;
    out.mz = Math.abs(dz) > 5 ? clamp(dz / 24, -1, 1) * speed : 0;
    if (Math.abs(me.x - this.lastX) < 0.4 && Math.abs(out.mx) > 0.5 && me.onGround) this.stuckT++;
    else this.stuckT = Math.max(0, this.stuckT - 2);
    this.lastX = me.x;
    const dir = Math.sign(out.mx);
    if (dir !== 0 && me.onGround && this.jumpCd <= 0) {
      const ahead = me.x + dir * 34;
      const target = tx;
      const pitAhead = world.isPit(ahead) || world.isPit(me.x + dir * 20);
      if (pitAhead && Math.sign(target - me.x) === dir) {
        out.mx = dir;
        out.jump = true;
        this.jumpCd = 40;
      } else if (this.stuckT > 18) {
        out.jump = true;
        this.jumpCd = 30;
        if (this.stuckT > 40) out.mz = me.z > 100 ? -1 : 1;
      }
    }
    if (!me.onGround && dir !== 0) {
      out.mx = dir;
      // Momo double-jumps over wide gaps
      if (me.vy < -1 && world.isPit(me.x + dir * 30) && me.airJumps > 0 && me.y > 0) out.jump = world.frame % 2 === 0;
    }
  }
}
