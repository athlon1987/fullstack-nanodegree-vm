import { Z_MAX } from '../config';
import { clamp, lerp } from '../core/math';
import { ENEMIES, type EnemyDef } from '../data/enemies';
import type { EnemyKind } from '../data/types';
import { bossAttackTick, bossOnHit, bossThink } from './boss';
import { Fighter, type HitInfo } from './fighter';
import type { Hero } from './hero';
import type { World } from './world';

export interface EnemyScaling {
  hp: number;
  dmg: number;
  cooldown: number; // multiplier on rest time between attacks
}

export class Enemy extends Fighter {
  readonly team = 'enemy' as const;
  readonly kind: EnemyKind;
  readonly def: EnemyDef;
  armorPts = 0;
  armorRegen = 0;
  shieldUp = false;
  guardBreakT = 0;
  cooldown = 40;
  token = false;
  target: Hero | null = null;
  thinkT = 0;
  wanderZ = 100;
  ringSlot = 0;
  fuse = -1;
  deathT = 0;
  entering = true;
  /** free-form memory for boss pattern scripts */
  mem: Record<string, number> = {};
  phase = 1;
  /** boss vulnerability window remaining (frames) */
  openT = 0;
  scaling: EnemyScaling;
  noDrops = false;
  escortOf: Enemy | null = null;

  constructor(kind: EnemyKind, scaling: EnemyScaling, rngSlot: number) {
    super();
    this.kind = kind;
    this.def = ENEMIES[kind];
    this.scaling = scaling;
    this.w = this.def.w;
    this.h = this.def.h;
    this.maxHp = Math.round(this.def.hp * scaling.hp);
    this.hp = this.maxHp;
    this.weight = this.def.weight;
    this.dmgMul = scaling.dmg;
    this.armorPts = this.def.armor ?? 0;
    this.shieldUp = !!this.def.shield;
    this.ringSlot = rngSlot;
    this.cooldown = 30 + (rngSlot % 4) * 15;
  }

  get maxArmor(): number {
    return this.def.armor ?? 0;
  }

  hittable(): boolean {
    return super.hittable() && !(this.entering && this.state === 'spawn');
  }

  releaseToken(world: World): void {
    if (this.token) world.releaseToken(this);
  }

  update(world: World): void {
    this.tickTimers();
    if (this.state === 'dead') {
      this.deathT++;
      this.vx *= 0.9;
      this.physics(world);
      if (this.deathT > 55) this.removed = true;
      return;
    }
    if (this.state === 'spawn') {
      this.physics(world);
      if (this.onGround) {
        this.setState('idle');
        this.entering = false;
        world.fx.dust(this.x, this.z, 8);
      }
      return;
    }
    if (this.armorPts < this.maxArmor && --this.armorRegen <= 0) this.armorPts = this.maxArmor;
    if (this.guardBreakT > 0) {
      if (--this.guardBreakT === 0) this.shieldUp = !!this.def.shield;
    }
    if (this.openT > 0) {
      this.openT--;
      this.vulnerableMul = 1.5;
    } else this.vulnerableMul = 1;

    if (this.stunT > 0) {
      this.stunT--;
      this.releaseToken(world);
      if (!this.updateReaction(world, 0)) {
        this.attack = null;
        if (this.state !== 'idle') this.setState('idle');
        this.vx *= 0.8;
        this.vz *= 0.8;
      }
      this.physics(world);
      return;
    }
    if (this.updateReaction(world, this.def.boss ? 30 : 16)) {
      this.releaseToken(world);
      this.physics(world);
      return;
    }
    if (this.state === 'attack') {
      if (this.def.boss) bossAttackTick(this, world);
      if (this.state === 'attack' && !this.updateAttack(world)) {
        this.afterAttack(world);
      }
      this.physics(world);
      return;
    }
    if (this.fuse >= 0) {
      this.updateFuse(world);
      this.physics(world);
      return;
    }
    this.target = world.pickTarget(this);
    if (this.def.boss) bossThink(this, world);
    else this.think(world);
    this.physics(world);
  }

  private afterAttack(world: World): void {
    this.releaseToken(world);
    const base = this.def.brain === 'ranged' ? 130 : this.def.brain === 'brute' ? 70 : 55;
    const mul = this.def.brain === 'ranged' ? Math.max(0.85, this.scaling.cooldown) : this.scaling.cooldown;
    this.cooldown = Math.round((base + world.rng.int(0, 50)) * mul);
    if (this.def.shield) this.shieldUp = this.guardBreakT <= 0;
  }

  /** Move toward a point while respecting pits and the screen edge. */
  moveTo(world: World, tx: number, tz: number, speedMul = 1): boolean {
    const dx = tx - this.x;
    const dz = tz - this.z;
    const dist = Math.hypot(dx, dz);
    if (dist < 6) {
      this.vx = lerp(this.vx, 0, 0.3);
      this.vz = lerp(this.vz, 0, 0.3);
      if (this.state !== 'idle') this.setState('idle');
      return true;
    }
    const sx = (dx / dist) * this.def.speed * speedMul;
    const sz = (dz / dist) * this.def.zSpeed * speedMul * 1.2;
    let nvx = lerp(this.vx, sx, 0.25);
    let nvz = lerp(this.vz, sz, 0.25);
    // never walk into a pit
    if (world.supportAt(this.x + nvx * 10, this.z + nvz * 10, this.y + 1) === null) {
      nvx = 0;
      if (world.supportAt(this.x, this.z + nvz * 10, this.y + 1) === null) nvz = 0;
    }
    this.vx = nvx;
    this.vz = nvz;
    if (this.state !== 'move') this.setState('move');
    return false;
  }

  faceTarget(): void {
    if (this.target) this.facing = this.target.x >= this.x ? 1 : -1;
  }

  private think(world: World): void {
    const t = this.target;
    if (this.cooldown > 0) this.cooldown--;
    if (!t) {
      this.moveTo(world, this.x, this.z);
      return;
    }
    const cam = world.camera;
    // walk into view before doing anything else (never attack from off-screen)
    if (!cam.onScreen(this.x, 30)) {
      this.moveTo(world, clamp(t.x, cam.left + 80, cam.right - 80), t.z, 1);
      this.faceTarget();
      return;
    }
    const dx = t.x - this.x;
    const dz = t.z - this.z;
    const adx = Math.abs(dx);
    const side = this.x < t.x ? -1 : 1;
    const reach = this.def.reach;
    if (--this.thinkT <= 0) {
      this.thinkT = 50 + world.rng.int(0, 60);
      this.wanderZ = clamp(t.z + world.rng.range(-70, 70), 10, Z_MAX - 10);
    }

    switch (this.def.brain) {
      case 'ranged': {
        const want = 290;
        let gx = t.x + side * want;
        if (!cam.onScreen(gx, 50)) gx = t.x - side * want;
        if (adx < 150) gx = this.x + side * 120; // back away
        gx = clamp(gx, cam.left + 50, cam.right - 50);
        this.moveTo(world, gx, t.z, adx < 150 ? 1.15 : 0.9);
        this.faceTarget();
        if (this.cooldown <= 0 && adx > 150 && adx < 460 && Math.abs(dz) < 40 && cam.onScreen(this.x, 40)) {
          this.faceTarget();
          this.startAttack('e_lob', world);
        }
        return;
      }
      case 'bomb': {
        this.moveTo(world, t.x - side * 30, t.z, 1);
        this.faceTarget();
        if (adx < 75 && Math.abs(dz) < 30) {
          this.fuse = 70;
          world.sfx('telegraph', this.x);
        }
        return;
      }
      case 'flanker': {
        const behind = -t.facing;
        let gx = t.x + behind * reach * 0.8;
        let gz = t.z;
        if (Math.sign(this.x - t.x) !== behind && adx < 120) gz = t.z + (this.z >= t.z ? 70 : -70); // swing around
        if (this.cooldown > 0 || !world.requestToken(this, t)) {
          gx = t.x + side * 190;
          gz = this.wanderZ;
          this.moveTo(world, gx, gz, 0.7);
          this.faceTarget();
          return;
        }
        this.moveTo(world, gx, clamp(gz, 0, Z_MAX), 1.1);
        this.faceTarget();
        if (adx < reach + 20 && adx > 25 && Math.abs(dz) < 16) this.startAttack('e_bite', world);
        return;
      }
      default: {
        // melee, brute, knight
        const canAttack = this.cooldown <= 0 && world.requestToken(this, t);
        if (!canAttack) {
          const ring = 170 + (this.ringSlot % 3) * 45;
          this.moveTo(world, t.x + side * ring, this.wanderZ, 0.55);
          this.faceTarget();
          return;
        }
        this.moveTo(world, t.x + side * reach * 0.85, t.z, 1);
        this.faceTarget();
        if (adx < reach + 14 && adx > 18 && Math.abs(dz) < 15) {
          let atk = this.def.attacks[0];
          if (this.def.brain === 'brute') atk = adx < 90 && world.rng.chance(0.55) ? 'e_slam' : 'e_shove';
          if (this.def.shield) this.shieldUp = false;
          this.startAttack(atk, world);
        }
      }
    }
  }

  private updateFuse(world: World): void {
    this.fuse--;
    const t = this.target;
    if (t) this.moveTo(world, t.x, t.z, 0.45);
    if (this.fuse % 10 === 0) world.sfx('telegraph', this.x);
    if (this.fuse <= 0) {
      world.explode(this.x, this.z, 110, Math.round(16 * this.dmgMul), this);
      this.noDrops = true;
      this.die(world, false);
    }
  }

  /** Called by the world after a hit lands. Returns false if the hit should not flinch. */
  onHit(info: HitInfo, world: World): void {
    if (this.def.boss) bossOnHit(this, info, world);
  }

  react(info: HitInfo, world: World): void {
    this.releaseToken(world);
    super.react(info, world);
  }

  die(world: World, byHero: boolean): void {
    this.releaseToken(world);
    this.attack = null;
    this.fuse = -1;
    this.setState('dead');
    this.deathT = 0;
    this.invuln = 0;
    if (this.onGround) {
      this.vy = 6;
      this.onGround = false;
    }
    world.onEnemyDefeated(this, byHero);
  }

  /** Spawned enemies walk in from beyond the screen edge or drop from the sky. */
  static create(kind: EnemyKind, scaling: EnemyScaling, slot: number): Enemy {
    return new Enemy(kind, scaling, slot);
  }

  get isBoss(): boolean {
    return !!this.def.boss;
  }

  get telegraphing(): boolean {
    return !!this.attack && !!this.attack.def.telegraph && this.attackPhase === 'startup';
  }

  static readonly KINDS = Object.keys(ENEMIES) as EnemyKind[];
}
