import { GRAVITY, Z_MAX } from '../config';
import { approach, clamp } from '../core/math';
import { ATTACKS } from '../data/attacks';
import type { AttackDef, HeroId, Reaction } from '../data/types';
import type { World } from './world';

export type FState =
  | 'idle'
  | 'move'
  | 'air'
  | 'attack'
  | 'hitstun'
  | 'launched'
  | 'knockdown'
  | 'getup'
  | 'dodge'
  | 'block'
  | 'downed'
  | 'out'
  | 'dead'
  | 'spawn'
  | 'script';

export interface AttackInstance {
  def: AttackDef;
  t: number;
  hit: Map<number, number>;
  charge: number;
  spawned: boolean;
}

export interface HitInfo {
  damage: number;
  kbX: number;
  kbY: number;
  reaction: Reaction;
  hitstun: number;
  dir: number;
  unblockable?: boolean;
  breaksGuard?: boolean;
  armorDamage?: number;
  hitstop?: number;
  shake?: number;
  meter?: number;
  sfx?: import('../data/types').SfxId;
  source: Fighter | null;
  sourceX: number;
  chargeMul?: number;
  projectile?: boolean;
  fxColor?: string;
  stun?: number;
}

let NEXT_ID = 1;

export abstract class Fighter {
  readonly id = NEXT_ID++;
  abstract readonly team: 'hero' | 'enemy';
  x = 0;
  y = 0;
  z = 100;
  vx = 0;
  vy = 0;
  vz = 0;
  facing = 1;
  w = 60;
  h = 100;
  hp = 100;
  maxHp = 100;
  state: FState = 'idle';
  stateT = 0;
  onGround = true;
  attack: AttackInstance | null = null;
  invuln = 0;
  flash = 0;
  hitstun = 0;
  weight = 1;
  defense = 0;
  dmgMul = 1;
  juggle = 0;
  /** last hero to hit this fighter, for team-combo detection */
  lastHeroHit: { hero: HeroId; frame: number } | null = null;
  launchedBy: HeroId | null = null;
  /** visual-only animation helpers */
  squash = 0;
  animT = 0;
  hurtDir = 0;
  removed = false;
  stunT = 0;
  vulnerableMul = 1;
  /** remaining frames until this fighter may act again after landing etc. */
  lag = 0;

  get alive(): boolean {
    return this.state !== 'dead' && this.state !== 'downed' && this.state !== 'out';
  }

  get busy(): boolean {
    return this.state !== 'idle' && this.state !== 'move' && this.state !== 'air';
  }

  /** Whether attacks can currently connect. */
  hittable(): boolean {
    return this.alive && this.invuln <= 0 && this.state !== 'spawn' && !this.removed;
  }

  setState(s: FState): void {
    this.state = s;
    this.stateT = 0;
  }

  startAttack(id: string, world: World): void {
    const def = ATTACKS[id];
    if (!def) throw new Error(`Unknown attack ${id}`);
    this.attack = { def, t: 0, hit: new Map(), charge: 0, spawned: false };
    this.setState('attack');
    if (def.sfx && def.startup <= 2) world.sfx(def.sfx, this.x);
    if (def.vy !== undefined) this.vy = def.vy;
    this.onAttackStart(def, world);
  }

  protected onAttackStart(_def: AttackDef, _world: World): void {}

  /** Heroes override to keep charging while the button is held. */
  protected holdingCharge(): boolean {
    return false;
  }

  /** Advance the current attack. Returns true while it is still running. */
  protected updateAttack(world: World): boolean {
    const a = this.attack;
    if (!a) return false;
    const d = a.def;
    if (d.charge && a.t === d.startup - 3 && a.charge < d.charge.max && this.holdingCharge()) {
      a.charge++;
      if (a.charge % 6 === 0) world.fx.chargeSpark(this, a.charge / d.charge.max);
      this.vx *= 0.8;
      this.vz *= 0.8;
      return true;
    }
    a.t++;
    if (a.t === Math.max(1, d.startup - 2) && d.sfx && d.startup > 2) world.sfx(d.sfx, this.x);
    const activeStart = d.startup + 1;
    const activeEnd = d.startup + d.active;
    if (d.lunge && a.t <= activeEnd) {
      const chargeBoost = d.charge ? 1 + (a.charge / d.charge.max) * 0.6 : 1;
      const k = a.t < activeStart ? 0.5 : 1;
      this.vx = this.facing * d.lunge * k * chargeBoost;
    } else if (this.onGround) {
      this.vx *= 0.75;
    }
    if (a.t === activeStart) {
      this.onActiveStart(a, world);
    }
    if (a.t >= activeStart && a.t <= activeEnd && d.hitbox.w > 0) {
      world.resolveAttack(this, a);
    }
    if (a.t >= d.startup + d.active + d.recovery) {
      this.endAttack();
      return false;
    }
    return true;
  }

  protected onActiveStart(a: AttackInstance, world: World): void {
    const d = a.def;
    if (d.projectile) world.spawnProjectile(d.projectile, this);
    if (d.shockwave && !d.aerial) world.shockwave(this, d.shockwave.radius, d.shockwave.damage);
    if (d.shake) world.fx.shake(d.shake * 0.5);
  }

  endAttack(): void {
    this.attack = null;
    this.setState(this.onGround ? 'idle' : 'air');
  }

  get attackPhase(): 'startup' | 'active' | 'recovery' | null {
    const a = this.attack;
    if (!a) return null;
    if (a.t <= a.def.startup) return 'startup';
    if (a.t <= a.def.startup + a.def.active) return 'active';
    return 'recovery';
  }

  /** True when an attack has super armour right now (cannot be flinched). */
  get superArmor(): boolean {
    const a = this.attack;
    return !!a && !!a.def.armor && a.t <= a.def.startup + a.def.active;
  }

  react(info: HitInfo, world: World): void {
    this.attack = null;
    const dir = info.dir || 1;
    this.hurtDir = dir;
    this.facing = -dir;
    const kbMul = this.weight;
    if (!this.onGround || info.reaction === 'launch') {
      this.juggle++;
      this.onGround = false;
      this.vy = info.reaction === 'launch' ? info.kbY * Math.min(1.2, 0.6 + kbMul * 0.5) : Math.max(this.vy, 4.5);
      this.vx = dir * info.kbX * kbMul;
      this.setState('launched');
      if (this.juggle > 7) this.invuln = Math.max(this.invuln, 999); // no infinite juggles
      return;
    }
    if (info.reaction === 'knockdown') {
      this.onGround = false;
      this.vy = Math.max(4, info.kbY * 0.8);
      this.vx = dir * info.kbX * kbMul;
      this.setState('launched');
      return;
    }
    this.hitstun = Math.round(info.hitstun * (0.7 + 0.3 * kbMul));
    this.vx = dir * info.kbX * kbMul;
    this.setState('hitstun');
    void world;
  }

  /** Physics shared by every fighter. */
  physics(world: World): void {
    const grav = GRAVITY * (this.state === 'launched' ? 1 + this.juggle * 0.07 : 1);
    if (!this.onGround) {
      this.vy -= grav;
      this.y += this.vy;
      const support = world.supportAt(this.x, this.z, this.y - this.vy + 1);
      if (this.vy <= 0 && support !== null && this.y <= support) {
        this.y = support;
        this.land(world);
      }
    } else {
      const support = world.supportAt(this.x, this.z, this.y + 1);
      if (support === null) {
        this.onGround = false;
        this.vy = 0;
      } else if (support < this.y - 2) {
        this.onGround = false;
        this.vy = 0;
      } else this.y = support;
    }
    this.x += this.vx;
    this.z += this.vz;
    this.z = clamp(this.z, 0, Z_MAX);
    world.collide(this);
    if (this.onGround && (this.state === 'hitstun' || this.state === 'knockdown' || this.state === 'getup' || this.state === 'dead' || this.state === 'downed' || this.state === 'block')) {
      this.vx = approach(this.vx * 0.86, 0, 0.05);
      this.vz *= 0.8;
    }
  }

  land(world: World): void {
    const impact = -this.vy;
    this.onGround = true;
    this.vy = 0;
    if (this.state === 'launched') {
      if (impact > 9 && this.juggle < 9) {
        // small bounce for weight
        this.vy = impact * 0.3;
        this.onGround = false;
        this.juggle += 1;
        world.fx.dust(this.x, this.z, 6);
        return;
      }
      this.setState('knockdown');
      this.vx *= 0.5;
      this.juggle = 0;
      this.launchedBy = null;
      if (this.invuln > 100) this.invuln = 0;
      world.fx.dust(this.x, this.z, 8);
      world.sfx('land', this.x);
      return;
    }
    this.juggle = 0;
    this.squash = Math.min(1, impact / 12);
    if (this.state === 'air') {
      this.setState('idle');
      if (impact > 6) world.fx.dust(this.x, this.z, 4);
    }
    if (this.state === 'attack' && this.attack?.def.aerial) {
      if (this.attack.def.shockwave) world.shockwave(this, this.attack.def.shockwave.radius, this.attack.def.shockwave.damage);
      this.attack = null;
      this.setState('idle');
      this.lag = 6;
    }
  }

  /** Shared hit-reaction state timers. Returns true if the fighter is busy reacting. */
  protected updateReaction(world: World, getupInvuln: number): boolean {
    switch (this.state) {
      case 'hitstun':
        if (--this.hitstun <= 0) this.setState(this.onGround ? 'idle' : 'air');
        return true;
      case 'launched':
        return true;
      case 'knockdown':
        if (this.stateT > 42) {
          this.setState('getup');
        }
        return true;
      case 'getup':
        if (this.stateT > 18) {
          this.setState('idle');
          this.invuln = Math.max(this.invuln, getupInvuln);
        }
        return true;
    }
    void world;
    return false;
  }

  tickTimers(): void {
    this.stateT++;
    this.animT++;
    if (this.invuln > 0 && this.invuln < 900) this.invuln--;
    if (this.flash > 0) this.flash--;
    if (this.squash > 0) this.squash = Math.max(0, this.squash - 0.08);
    if (this.lag > 0) this.lag--;
  }
}
