import { HERO_SCREEN_MARGIN, TEAM_COMBO_WINDOW, TEAM_METER_MAX, Z_MAX } from '../config';
import type { PlayerInput } from '../core/input';
import { boxesOverlap, clamp, Rng } from '../core/math';
import type { CampaignSave } from '../core/save';
import { ATTACKS, PROJECTILES } from '../data/attacks';
import type { AttackDef, DialogueLine, EncounterEvent, EnemyKind, HeroId, HintId, SfxId, SpawnDef, StageDef } from '../data/types';
import { bossClampHp } from './boss';
import { attackBox, computeDamage, hurtBox, isFrontal, resolveGuard, type GuardResult } from './combat';
import { Camera } from './camera';
import { CompanionBrain } from './companion';
import { Effects } from './effects';
import { Enemy, type EnemyScaling } from './enemy';
import type { AttackInstance, Fighter, HitInfo } from './fighter';
import { Hero } from './hero';
import { emptyStats, heroMods, teamMods, type RunStats, type TeamMods } from './progression';
import { Projectile, ProjectilePool } from './projectile';
import {
  CAR_WARN,
  HAND_WARN,
  PRESS_ACTIVE,
  PRESS_WARN,
  ROLLER_WARN,
  VENT_ACTIVE,
  VENT_WARN,
  hazardBounds,
  type Crate,
  type Gate,
  type HandSlam,
  type HazardState,
  type Pickup,
  type PickupKind,
  type Platform,
} from './stageObjects';

export interface SoundSink {
  play(id: SfxId, pan?: number, vol?: number): void;
}

export interface WorldListener {
  onDialogue(lines: DialogueLine[]): void;
  onBossIntro(boss: Enemy, lines: DialogueLine[] | undefined): void;
  onBossDefeated(boss: Enemy): void;
  onHint(id: HintId | 'twins' | 'finale' | 'out' | 'swap'): void;
  onObjective(text: string): void;
  onBossShout(name: string, text: string): void;
  onStageComplete(): void;
  onGameOver(): void;
  onCheckpoint(): void;
}

export interface Checkpoint {
  eventIndex: number;
  x: number;
  openGates: number[];
}

export interface WorldOptions {
  stage: StageDef;
  stageIndex: number;
  mode: 'solo' | 'coop';
  soloHero: HeroId;
  campaign: CampaignSave | null;
  listener: WorldListener;
  audio: SoundSink;
  viewW: number;
  checkpoint?: Checkpoint | null;
  carry?: { stats: RunStats; pencils: boolean[]; meter: number } | null;
  seed?: number;
  god?: boolean;
  autoplay?: boolean; // both heroes AI-driven (tests / attract mode)
}

interface ActiveEncounter {
  ev: EncounterEvent;
  wave: number;
  queue: { spawn: SpawnDef; at: number }[];
  waveStart: number;
  boss: Enemy | null;
  cleared: boolean;
}

export class World {
  readonly stage: StageDef;
  readonly stageIndex: number;
  readonly mode: 'solo' | 'coop';
  readonly listener: WorldListener;
  readonly audio: SoundSink;
  readonly rng: Rng;
  readonly fx = new Effects();
  readonly camera = new Camera();
  readonly team: TeamMods;
  readonly god: boolean;
  frame = 0;
  heroes: Hero[] = [];
  enemies: Enemy[] = [];
  projectiles = new ProjectilePool(72);
  platforms: Platform[] = [];
  crates: Crate[] = [];
  pickups: Pickup[] = [];
  gates: Gate[] = [];
  hazards: HazardState[] = [];
  handSlams: HandSlam[] = [];
  meter = 0;
  stats: RunStats;
  pencilsRun: boolean[];
  savedPencils: boolean[];
  combo = 0;
  comboT = 0;
  hitstop = 0;
  slowmo = 0;
  eventIndex = 0;
  encounter: ActiveEncounter | null = null;
  arena: [number, number] | null = null;
  checkpoint: Checkpoint;
  objective = '';
  boss: Enemy | null = null;
  cinematic: { kind: 'team'; t: number; initiator: Hero } | null = null;
  finisherActive = false;
  complete = false;
  gameOver = false;
  private overT = 0;
  private completeT = -1;
  rainT = 0;
  private stageRainT = 0;
  private tokens = new Map<HeroId, Set<number>>();
  private tokenOf = new Map<number, HeroId>();
  private brains = new Map<HeroId, CompanionBrain>();
  private spawnSlot = 0;
  private scaling: EnemyScaling;
  goSign = 0;
  finale: Enemy | null = null;
  private lastHint = new Map<string, number>();

  constructor(o: WorldOptions) {
    this.stage = o.stage;
    this.stageIndex = o.stageIndex;
    this.mode = o.mode;
    this.listener = o.listener;
    this.audio = o.audio;
    this.rng = new Rng(o.seed ?? 1234 + o.stageIndex * 77);
    this.team = teamMods(o.campaign);
    this.god = !!o.god;
    this.camera.stageLen = o.stage.length;
    this.camera.viewW = o.viewW;
    this.stats = o.carry ? { ...o.carry.stats } : emptyStats();
    this.pencilsRun = o.carry ? [...o.carry.pencils] : [false, false, false];
    this.savedPencils = o.campaign ? [...o.campaign.pencils[o.stageIndex]] : [false, false, false];
    this.meter = o.carry ? o.carry.meter : 0;
    const coopHp = o.mode === 'coop' ? 1.25 : 1;
    this.scaling = { hp: (1 + 0.12 * o.stageIndex) * coopHp, dmg: 1 + 0.1 * o.stageIndex, cooldown: Math.max(0.6, 1 - 0.09 * o.stageIndex) };
    this.checkpoint = o.checkpoint ?? { eventIndex: 0, x: 120, openGates: [] };

    // heroes
    const ids: HeroId[] = ['momo', 'scout'];
    ids.forEach((id, i) => {
      let ctrl: 'p1' | 'p2' | 'ai';
      if (o.autoplay) ctrl = 'ai';
      else if (o.mode === 'coop') ctrl = id === 'momo' ? 'p1' : 'p2';
      else ctrl = id === o.soloHero ? 'p1' : 'ai';
      const h = new Hero(id, heroMods(o.campaign, id), ctrl, i as 0 | 1);
      h.x = this.checkpoint.x - i * 70;
      h.z = 80 + i * 50;
      h.facing = 1;
      h.safe = { x: h.x, z: h.z };
      this.heroes.push(h);
      this.brains.set(id, new CompanionBrain(id, !!o.autoplay && (o.mode === 'coop' ? id === 'momo' : id === o.soloHero)));
      this.tokens.set(id, new Set());
    });

    // stage objects
    this.platforms = o.stage.platforms.map((p) => ({ ...p }));
    for (const c of o.stage.crates) {
      const plat = this.platforms.find((p) => c.x >= p.x && c.x <= p.x + p.w && c.z >= p.z && c.z <= p.z + p.d);
      this.crates.push({ x: c.x, z: c.z, y: plat ? plat.h : 0, hp: 2, drop: c.drop, pencilIndex: -1, broken: false, shakeT: 0 });
    }
    o.stage.pencils.forEach((p, i) => {
      if (this.pencilsRun[i]) return;
      if (p.inCrate) {
        const plat = this.platforms.find((q) => p.x >= q.x && p.x <= q.x + q.w && p.z >= q.z && p.z <= q.z + q.d);
        this.crates.push({ x: p.x, z: p.z, y: plat ? plat.h : 0, hp: 2, drop: 'pencil', pencilIndex: i, broken: false, shakeT: 0 });
      } else this.addPickup('pencil', p.x, p.y ?? 0, p.z, 0, i);
    });
    this.gates = o.stage.gates.map((g) => ({
      x: g.gateX,
      open: this.checkpoint.openGates.includes(g.gateX) || g.gateX < this.checkpoint.x,
      openT: 0,
      plates: g.plates.map((p) => ({ x: p.x, z: p.z, pressed: false })),
    }));
    this.hazards = o.stage.hazards.map((def) => ({ def, phase: 'idle', t: 'offset' in def && def.offset ? -def.offset : 0, px: 0, pz: 0, hitCooldown: new Map() }));

    this.eventIndex = this.checkpoint.eventIndex;
    this.camera.update(this.checkpoint.x + 200, true);
    this.updateObjective();
  }

  // ------------------------------------------------------------------ queries
  sfx(id: SfxId, x?: number, vol = 1): void {
    const pan = x === undefined ? 0 : clamp((x - this.camera.x) / (this.camera.viewW / 2), -1, 1);
    this.audio.play(id, pan, vol);
  }

  partnerOf(h: Hero): Hero | null {
    return this.heroes.find((o) => o !== h) ?? null;
  }

  heroById(id: HeroId): Hero {
    return this.heroes.find((h) => h.heroId === id)!;
  }

  activeHeroes(): Hero[] {
    return this.heroes.filter((h) => h.active);
  }

  livingEnemies(): Enemy[] {
    return this.enemies.filter((e) => e.state !== 'dead' && !e.removed);
  }

  enemiesOnScreen(): Enemy[] {
    return this.enemies.filter((e) => e.state !== 'dead' && !e.removed && !e.mem.hidden && this.camera.onScreen(e.x, -30));
  }

  isPit(x: number): boolean {
    for (const [a, b] of this.stage.pits) if (x > a && x < b) return true;
    return false;
  }

  /** Highest walkable surface at (x,z) that is not above yRef, or null over a pit. */
  supportAt(x: number, z: number, yRef: number): number | null {
    let best: number | null = this.isPit(x) ? null : 0;
    for (const p of this.platforms) {
      if (x >= p.x && x <= p.x + p.w && z >= p.z && z <= p.z + p.d && p.h <= yRef + 0.5) {
        if (best === null || p.h > best) best = p.h;
      }
    }
    return best;
  }

  isSafeGround(x: number, z: number): boolean {
    for (const [a, b] of this.stage.pits) if (x > a - 60 && x < b + 60) return false;
    for (const h of this.hazards) {
      const d = h.def;
      if (d.type === 'spikes' && x > d.x - 30 && x < d.x + d.w + 30 && z > d.z - 30 && z < d.z + d.d + 30) return false;
      if (d.type === 'press' && x > d.x - 20 && x < d.x + d.w + 20) return false;
    }
    return true;
  }

  heroBounds(): [number, number] {
    let lo = Math.max(30, this.camera.left + HERO_SCREEN_MARGIN);
    let hi = Math.min(this.stage.length - 30, this.camera.right - HERO_SCREEN_MARGIN);
    if (this.arena) {
      lo = Math.max(lo, this.arena[0] + 20);
      hi = Math.min(hi, this.arena[1] - 20);
    }
    return [lo, hi];
  }

  collide(f: Fighter): void {
    const r = Math.min(f.w * 0.3, 26);
    for (const p of this.platforms) {
      if (f.y >= p.h - 6) continue;
      const x0 = p.x - r;
      const x1 = p.x + p.w + r;
      const z0 = p.z - r * 0.5;
      const z1 = p.z + p.d + r * 0.5;
      if (f.x > x0 && f.x < x1 && f.z > z0 && f.z < z1) {
        const pen = [f.x - x0, x1 - f.x, f.z - z0, z1 - f.z];
        const m = Math.min(...pen);
        if (m === pen[0]) f.x = x0;
        else if (m === pen[1]) f.x = x1;
        else if (m === pen[2]) f.z = z0;
        else f.z = z1;
      }
    }
    for (const g of this.gates) {
      if (g.open) continue;
      if (f.x > g.x - 30 && f.x < g.x + 30) f.x = f.x - f.vx < g.x ? g.x - 30 : g.x + 30;
    }
    if (f.team === 'hero') {
      if ((f as Hero).state !== 'script' || (f as Hero).script !== 'coopBall') {
        const [lo, hi] = this.heroBounds();
        f.x = clamp(f.x, lo, hi);
      } else {
        f.x = clamp(f.x, 30, this.stage.length - 30);
        if (this.arena) f.x = clamp(f.x, this.arena[0] + 20, this.arena[1] - 20);
      }
    } else {
      f.x = clamp(f.x, 20, this.stage.length - 20);
      if (this.arena && (f as Enemy).isBoss) f.x = clamp(f.x, this.arena[0] + 30, this.arena[1] - 30);
    }
    f.z = clamp(f.z, 0, Z_MAX);
  }

  // ------------------------------------------------------------------ tokens & targeting
  pickTarget(e: Enemy): Hero | null {
    const act = this.heroes.filter((h) => h.active && h.state !== 'script');
    const pool = act.length ? act : this.heroes.filter((h) => h.active);
    if (!pool.length) return null;
    if (e.kind === 'smudgeTwin' && pool.length > 1) return pool[(e.mem.twinIndex ?? 0) % pool.length];
    let best = pool[0];
    let bestD = Infinity;
    for (const h of pool) {
      let d = Math.abs(h.x - e.x) + Math.abs(h.z - e.z) * 1.5;
      if (e.target === h) d *= 0.7; // stickiness
      if (d < bestD) {
        bestD = d;
        best = h;
      }
    }
    return best;
  }

  requestToken(e: Enemy, h: Hero): boolean {
    const cur = this.tokenOf.get(e.id);
    if (cur === h.heroId) return true;
    if (cur) this.releaseToken(e);
    const set = this.tokens.get(h.heroId)!;
    const limit = this.stageIndex >= 2 ? 3 : 2;
    if (set.size >= limit) return false;
    set.add(e.id);
    this.tokenOf.set(e.id, h.heroId);
    e.token = true;
    return true;
  }

  releaseToken(e: Enemy): void {
    const cur = this.tokenOf.get(e.id);
    if (cur) this.tokens.get(cur)?.delete(e.id);
    this.tokenOf.delete(e.id);
    e.token = false;
  }

  // ------------------------------------------------------------------ combat
  resolveAttack(att: Fighter, inst: AttackInstance): void {
    const def = inst.def;
    const box = attackBox(att, def.hitbox, def.ring);
    const targets: Fighter[] = att.team === 'hero' ? this.enemies : this.heroes;
    for (const t of targets) {
      if (!t.hittable()) continue;
      const last = inst.hit.get(t.id);
      if (last !== undefined && (!def.multiHit || inst.t - last < def.multiHit)) continue;
      if (!boxesOverlap(box, hurtBox(t))) continue;
      inst.hit.set(t.id, inst.t);
      const chargeMul = def.charge ? 1 + (inst.charge / def.charge.max) * def.charge.dmg : 1;
      const kbMul = def.charge ? 1 + (inst.charge / def.charge.max) * def.charge.kb : 1;
      const res = this.applyHit(t, {
        damage: def.damage,
        kbX: def.kbX * kbMul,
        kbY: def.kbY * kbMul,
        reaction: def.reaction,
        hitstun: def.hitstun,
        dir: def.ring ? (t.x >= att.x ? 1 : -1) : att.facing,
        unblockable: def.unblockable,
        breaksGuard: def.breaksGuard,
        armorDamage: def.armorDamage,
        hitstop: def.hitstop,
        shake: def.shake,
        meter: def.meter,
        sfx: def.hitSfx,
        source: att,
        sourceX: att.x,
        chargeMul,
        fxColor: def.fxColor,
      });
      if (res === 'parried' && att.team === 'enemy') {
        const e = att as Enemy;
        e.attack = null;
        e.hitstun = e.isBoss ? 24 : 50;
        e.setState('hitstun');
        e.vx = -e.facing * 3;
        this.releaseToken(e);
      }
    }
    if (att.team === 'hero') {
      for (const c of this.crates) {
        if (c.broken) continue;
        const cb = { x0: c.x - 26, x1: c.x + 26, y0: c.y, y1: c.y + 52, z0: c.z - 20, z1: c.z + 20 };
        const key = -1000 - this.crates.indexOf(c);
        if (inst.hit.has(key)) continue;
        if (boxesOverlap(box, cb)) {
          inst.hit.set(key, inst.t);
          this.hitCrate(c);
        }
      }
    }
  }

  applyHit(t: Fighter, info: HitInfo): 'hit' | 'blocked' | 'parried' | 'immune' {
    if (!t.hittable()) return 'immune';
    const src = info.source;
    const srcHero = src && src.team === 'hero' ? (src as Hero) : null;
    const frontal = isFrontal(t, info.sourceX);
    let guard: GuardResult = 'none';

    if (t.team === 'enemy') {
      const e = t as Enemy;
      if (e.def.shield && e.shieldUp && frontal && !info.unblockable && e.state !== 'attack') {
        if (info.breaksGuard) {
          e.shieldUp = false;
          e.guardBreakT = 150;
          this.fx.text(e.x, e.h + 20, e.z, 'GUARD BREAK!', '#ffd23f', 1.1);
          this.sfx('clang', e.x);
        } else {
          this.fx.hitSpark(e.x - e.facing * -20, e.y + e.h * 0.55, e.z, false, '#adb5bd');
          this.sfx('clang', e.x, 0.7);
          if (src) src.vx = -src.facing * 3;
          if (srcHero) this.addMeter(1);
          if (this.frame % 3 === 0) this.hint('heavy');
          return 'blocked';
        }
      }
    } else {
      const h = t as Hero;
      if (h.blocking) {
        guard = resolveGuard({
          blocking: true,
          blockFrames: h.blockT,
          parryWindow: h.def.parryWindow + h.mods.parryBonus,
          frontal,
          unblockable: !!info.unblockable,
        });
      }
      if (h.shield > 0 && guard === 'none') {
        const absorbed = Math.min(h.shield, info.damage);
        h.shield -= absorbed;
        info = { ...info, damage: info.damage - absorbed };
        this.fx.ring(h.x, h.y + h.h * 0.5, h.z, 60, '#7bf1a8');
        if (info.damage <= 0) return 'blocked';
      }
    }

    const teamBonus = !!srcHero && !!t.lastHeroHit && t.lastHeroHit.hero !== srcHero.heroId && this.frame - t.lastHeroHit.frame <= TEAM_COMBO_WINDOW;
    const relay = !!srcHero && t.state === 'launched' && !!t.launchedBy && t.launchedBy !== srcHero.heroId;
    let dmg = computeDamage({
      base: info.damage,
      attackerMul: src ? src.dmgMul : 1,
      chargeMul: info.chargeMul ?? 1,
      defense: t.defense,
      teamBonus,
      relay,
      comboHits: srcHero ? this.combo : 0,
      guard,
      chip: t.team === 'hero' ? (t as Hero).def.blockChip * (t as Hero).mods.chipMul : 0,
      vulnerableMul: t.vulnerableMul,
    });

    if (guard === 'parry') {
      const h = t as Hero;
      this.fx.hitSpark(h.x + h.facing * 30, h.y + h.h * 0.6, h.z, true, '#7bf1a8');
      this.fx.text(h.x, h.h + 30, h.z, 'PARRY!', '#7bf1a8', 1.2);
      this.sfx('parry', h.x);
      this.addMeter(10);
      this.stats.parries++;
      this.hitstop = Math.max(this.hitstop, 6);
      return 'parried';
    }
    if (guard === 'block') {
      const h = t as Hero;
      if (!this.god) h.hp = Math.max(1, h.hp - dmg);
      h.vx = info.dir * Math.min(5, info.kbX * 0.6);
      h.blockT = Math.max(h.blockT, h.def.parryWindow + 1);
      this.fx.hitSpark(h.x + h.facing * 30, h.y + h.h * 0.6, h.z, false, '#4cc9f0');
      this.sfx('block', h.x);
      this.addMeter(2);
      return 'blocked';
    }

    // armour
    let flinch = !t.superArmor;
    if (t.team === 'enemy') {
      const e = t as Enemy;
      if (e.armorPts > 0 && e.openT <= 0) {
        e.armorPts -= info.armorDamage ?? 0.5;
        e.armorRegen = 300;
        if (e.armorPts <= 0) {
          e.armorPts = 0;
          this.fx.text(e.x, e.h + 30, e.z, 'ARMOR BREAK!', '#ffd23f', 1.2);
          this.sfx('clang', e.x);
          e.stunT = Math.max(e.stunT, e.isBoss ? 40 : 60);
        } else {
          flinch = false;
          dmg = Math.max(1, Math.round(dmg * (info.armorDamage ? 0.85 : 0.5)));
        }
      }
      if (e.isBoss && info.reaction !== 'stagger' && !info.projectile && flinch) {
        // bosses only get knocked down by big hits when they are open
        if (e.openT <= 0 && e.stunT <= 0) flinch = info.armorDamage !== undefined && info.armorDamage >= 5;
      }
      if (e.isBoss && e.openT <= 0 && e.stunT <= 0 && info.reaction === 'stagger') flinch = flinch && this.rng.chance(0.25);
    }

    if (!(this.god && t.team === 'hero')) t.hp -= dmg;
    t.flash = 8;
    if (t.team === 'enemy') bossClampHp(t as Enemy, this);

    // feedback
    const heavy = dmg >= 14 || (info.hitstop ?? 0) >= 6;
    const hx = (t.x + (src ? src.x : t.x)) / 2;
    this.fx.hitSpark(hx, t.y + t.h * 0.55, t.z, heavy, info.fxColor ?? (teamBonus || relay ? '#7bf1a8' : '#ffffff'));
    if (dmg > 0) this.fx.text(t.x + this.rng.range(-10, 10), t.y + t.h + 6, t.z, String(dmg), t.team === 'hero' ? '#ff595e' : '#ffffff', heavy ? 1.15 : 0.85);
    if (teamBonus || relay) {
      this.fx.text(t.x, t.y + t.h + 34, t.z, relay ? 'RELAY!' : 'TEAM!', '#7bf1a8', 1);
      this.stats.teamHits++;
      this.addMeter(3);
    }
    this.sfx(info.sfx ?? (heavy ? 'hitHeavy' : 'hitLight'), t.x);
    this.hitstop = Math.min(10, Math.max(this.hitstop, info.hitstop ?? 3));
    if (info.shake) this.fx.shake(info.shake);

    if (srcHero) {
      this.addMeter(info.meter ?? 1);
      this.combo++;
      this.comboT = 120;
      this.stats.maxCombo = Math.max(this.stats.maxCombo, this.combo);
      this.stats.score += dmg * 10 + Math.min(this.combo, 50) * 5;
      t.lastHeroHit = { hero: srcHero.heroId, frame: this.frame };
      if (info.reaction === 'launch' && flinch) t.launchedBy = srcHero.heroId;
    }
    if (t.team === 'hero') {
      const h = t as Hero;
      this.stats.damageTaken += dmg;
      this.addMeter(3);
      if (h.controller !== 'ai') this.fx.flashScreen('#ff595e', 0.12);
    }

    if (t.hp <= 0) {
      t.hp = 0;
      if (t.team === 'hero') {
        (t as Hero).goDown(this);
        if (this.activeHeroes().length) this.hint('revive');
      } else {
        const e = t as Enemy;
        e.react(info, this);
        e.die(this, !!srcHero);
      }
      return 'hit';
    }
    if (flinch) t.react(info, this);
    if (t.team === 'enemy') (t as Enemy).onHit(info, this);
    return 'hit';
  }

  ultHit(src: Hero, t: Fighter, def: AttackDef, mul = 1): void {
    if (!t.hittable() && !(this.finisherActive && t.state !== 'dead')) return;
    if (t.invuln > 0 && t.invuln < 900) t.invuln = 0;
    this.applyHit(t, {
      damage: def.damage * mul,
      kbX: def.kbX,
      kbY: def.kbY,
      reaction: def.reaction,
      hitstun: def.hitstun,
      dir: t.x >= src.x ? 1 : -1,
      unblockable: true,
      breaksGuard: true,
      armorDamage: def.armorDamage,
      hitstop: def.hitstop,
      shake: def.shake,
      meter: 0,
      source: src,
      sourceX: src.x,
      fxColor: '#ffd23f',
    });
  }

  addMeter(n: number): void {
    this.meter = clamp(this.meter + n * this.team.meterMul, 0, TEAM_METER_MAX);
  }

  shockwave(src: Fighter, radius: number, damage: number): void {
    this.fx.floorRing(src.x, src.z, radius * 2, src.team === 'hero' ? '#ffffff' : '#e63946');
    this.fx.dust(src.x, src.z, 10);
    if (src.team === 'enemy' && radius > 200) {
      // a travelling ground wave: jump over it
      this.spawnWave(src, 1, Math.round(damage * src.dmgMul));
      this.spawnWave(src, -1, Math.round(damage * src.dmgMul));
      return;
    }
    const targets: Fighter[] = src.team === 'hero' ? this.enemies : this.heroes;
    for (const t of targets) {
      if (!t.hittable() || t.y > 30) continue;
      const dx = t.x - src.x;
      const dz = (t.z - src.z) * 2;
      if (Math.hypot(dx, dz) > radius) continue;
      this.applyHit(t, { damage, kbX: 4, kbY: 6, reaction: 'launch', hitstun: 20, dir: dx >= 0 ? 1 : -1, source: src, sourceX: src.x, hitstop: 3, unblockable: src.team === 'enemy' });
    }
  }

  private spawnWave(src: Fighter, dir: number, damage: number): void {
    const p = this.projectiles.obtain();
    if (!p) return;
    p.reset(PROJECTILES.shockwave, src, 'enemy');
    p.x = src.x + dir * 40;
    p.y = 0;
    p.z = 100;
    p.vx = dir * 6;
    p.vy = 0;
    p.vz = 0;
    p.facing = dir;
    p.dmgMul = damage / PROJECTILES.shockwave.damage;
  }

  explode(x: number, z: number, radius: number, damage: number, src: Enemy): void {
    this.fx.floorRing(x, z, radius * 2, '#f77f00', 24);
    this.fx.hitSpark(x, 30, z, true, '#f77f00');
    this.fx.ink(x, 40, z, 16, '#f77f00');
    this.fx.shake(8);
    this.sfx('explode', x);
    const all: Fighter[] = [...this.heroes, ...this.enemies];
    for (const t of all) {
      if (t === src || !t.hittable()) continue;
      const dx = t.x - x;
      if (Math.hypot(dx, (t.z - z) * 1.6) > radius) continue;
      this.applyHit(t, { damage: t.team === 'enemy' ? damage * 2 : damage, kbX: 7, kbY: 9, reaction: 'launch', hitstun: 30, dir: dx >= 0 ? 1 : -1, unblockable: true, source: t.team === 'enemy' ? (src.lastHeroHit ? this.heroById(src.lastHeroHit.hero) : null) : null, sourceX: x, hitstop: 5 });
    }
  }

  spawnProjectile(id: string, owner: Fighter, zOff = 0): void {
    const def = PROJECTILES[id];
    if (!def) return;
    if (id === 'staple' || id === 'quill') {
      const n = owner instanceof Enemy && owner.phase === 2 ? 5 : 3;
      for (let i = 0; i < n; i++) {
        const p = this.projectiles.obtain();
        if (!p) return;
        p.reset(def, owner, 'enemy');
        p.x = owner.x + owner.facing * 50;
        p.y = owner.h * 0.45;
        p.z = owner.z;
        p.vx = owner.facing * def.speed;
        p.vz = (i - (n - 1) / 2) * 1.3;
        p.vy = 0;
      }
      return;
    }
    const p = this.projectiles.obtain();
    if (!p) return;
    p.reset(def, owner, owner.team);
    p.x = owner.x + owner.facing * 40;
    p.y = owner.team === 'hero' ? 55 : owner.h * 0.7;
    p.z = clamp(owner.z + zOff, 0, Z_MAX);
    p.startX = p.x;
    if (def.arc) {
      const tgt = owner instanceof Enemy && owner.target ? owner.target : null;
      const tx = tgt ? tgt.x + tgt.vx * 20 : p.x + owner.facing * 250;
      const tz = tgt ? tgt.z : p.z;
      const dist = Math.hypot(tx - p.x, tz - p.z);
      const T = clamp(dist / def.speed, 30, 75);
      p.vx = (tx - p.x) / T;
      p.vz = (tz - p.z) / T;
      p.vy = (def.gravity * T * T * 0.5 - p.y) / T;
    } else {
      p.vx = owner.facing * def.speed;
      p.vy = 0;
      p.vz = 0;
    }
  }

  clearProjectilesNear(src: Fighter, def: AttackDef): void {
    const box = attackBox(src, def.hitbox, def.ring);
    for (const p of this.projectiles.items) {
      if (!p.active || p.team === src.team || p.def.id === 'shockwave') continue;
      if (p.x > box.x0 - 20 && p.x < box.x1 + 20 && Math.abs(p.z - src.z) < def.hitbox.d + 30) {
        p.active = false;
        this.fx.ink(p.x, p.y, p.z, 5);
      }
    }
  }

  private updateProjectiles(): void {
    for (const p of this.projectiles.items) {
      if (!p.active) continue;
      p.age++;
      if (--p.life <= 0) {
        p.active = false;
        continue;
      }
      const d = p.def;
      if (d.boomerang) {
        if (!p.returning && Math.abs(p.x - p.startX) >= d.boomerang) {
          p.returning = true;
          p.hit.clear();
        }
        if (p.returning && p.owner) {
          const dx = p.owner.x - p.x;
          const dz = p.owner.z - p.z;
          const dist = Math.hypot(dx, dz) || 1;
          p.vx = (dx / dist) * d.speed * 1.1;
          p.vz = (dz / dist) * d.speed * 1.1;
          p.y += (60 - p.y) * 0.1;
          if (dist < 30) {
            p.active = false;
            continue;
          }
        }
      }
      p.vy -= d.gravity;
      p.x += p.vx;
      p.y += p.vy;
      p.z += p.vz;
      p.rot += d.art === 'banana' ? 0.4 : 0.1;
      if (d.art === 'inkblob' || d.art === 'inkdrop') {
        if (p.y <= 0) {
          p.active = false;
          this.fx.floorRing(p.x, p.z, 50, '#1b1730', 18);
          this.fx.ink(p.x, 5, p.z, 4);
          // splash damage on landing
          const box = { x0: p.x - 34, x1: p.x + 34, y0: -10, y1: 40, z0: p.z - 26, z1: p.z + 26 };
          this.projectileHits(p, box);
          continue;
        }
      }
      if (p.x < this.camera.left - 300 || p.x > this.camera.right + 300) {
        p.active = false;
        continue;
      }
      const box = { x0: p.x - d.w / 2, x1: p.x + d.w / 2, y0: p.y - d.h / 2, y1: p.y + d.h / 2, z0: p.z - d.d, z1: p.z + d.d };
      if (d.art === 'shockwave') {
        box.y0 = 0;
        box.y1 = d.h;
      }
      this.projectileHits(p, box);
    }
  }

  private projectileHits(p: Projectile, box: { x0: number; x1: number; y0: number; y1: number; z0: number; z1: number }): void {
    const d = p.def;
    const targets: Fighter[] = p.team === 'hero' ? this.enemies : this.heroes;
    for (const t of targets) {
      if (!p.active) return;
      if (!t.hittable() || p.hit.has(t.id)) continue;
      if (!boxesOverlap(box, hurtBox(t))) continue;
      p.hit.add(t.id);
      const res = this.applyHit(t, {
        damage: d.damage * p.dmgMul,
        kbX: d.kbX,
        kbY: d.kbY,
        reaction: d.reaction,
        hitstun: d.hitstun,
        dir: p.vx === 0 ? (t.x >= p.x ? 1 : -1) : Math.sign(p.vx),
        source: p.team === 'hero' ? p.owner : p.owner,
        sourceX: p.x - Math.sign(p.vx || 1) * 50,
        projectile: true,
        hitstop: 3,
        unblockable: d.art === 'shockwave' || d.art === 'inkdrop',
      });
      if (res === 'parried' && d.reflectable) {
        const h = t as Hero;
        p.team = 'hero';
        p.owner = h;
        p.vx = h.facing * Math.max(8, Math.abs(p.vx) * 1.4);
        p.vy = d.gravity ? 4 : 0;
        p.vz = 0;
        p.dmgMul = 2.5;
        p.hit.clear();
        p.life = 120;
        this.fx.text(h.x, h.h + 50, h.z, 'REFLECT!', '#7bf1a8', 1);
        return;
      }
      if (!d.pierce || res === 'blocked') {
        p.active = false;
        return;
      }
    }
  }

  // ------------------------------------------------------------------ crates & pickups
  private hitCrate(c: Crate): void {
    c.hp--;
    c.shakeT = 10;
    this.sfx('crate', c.x);
    this.fx.dust(c.x, c.z, 3);
    if (c.hp > 0) return;
    c.broken = true;
    this.fx.ink(c.x, c.y + 20, c.z, 8, '#c08552');
    switch (c.drop) {
      case 'health':
        this.addPickup('health', c.x, c.y, c.z);
        break;
      case 'meter':
        this.addPickup('meter', c.x, c.y, c.z);
        break;
      case 'pencil':
        if (c.pencilIndex >= 0) this.addPickup('pencil', c.x, c.y, c.z, 6, c.pencilIndex);
        break;
      default:
        for (let i = 0; i < 6; i++) this.addPickup('ink', c.x, c.y, c.z, 3);
    }
  }

  addPickup(kind: PickupKind, x: number, y: number, z: number, value = 0, pencilIndex = -1): void {
    const pk: Pickup = {
      kind,
      x,
      y: y + 10,
      z,
      vy: kind === 'pencil' && y === 0 ? 0 : 5 + this.rng.range(0, 3),
      vx: kind === 'ink' ? this.rng.range(-2.5, 2.5) : 0,
      vz: kind === 'ink' ? this.rng.range(-1.5, 1.5) : 0,
      value: value || (kind === 'ink' ? 3 : 0),
      pencilIndex,
      ghost: kind === 'pencil' && pencilIndex >= 0 && this.savedPencils[pencilIndex],
      floatY: y,
      active: true,
      age: 0,
    };
    if (kind === 'pencil' && value === 0) pk.vy = 0;
    this.pickups.push(pk);
  }

  private updatePickups(): void {
    for (const pk of this.pickups) {
      if (!pk.active) continue;
      pk.age++;
      const ground = this.supportAt(pk.x, pk.z, pk.y + 1) ?? -999;
      if (pk.kind === 'pencil' && pk.vy === 0 && pk.y >= ground) {
        // hovering pencil
      } else {
        pk.vy -= 0.5;
        pk.y += pk.vy;
        pk.x += pk.vx;
        pk.z = clamp(pk.z + pk.vz, 0, Z_MAX);
        if (pk.y <= ground) {
          pk.y = ground;
          pk.vy = pk.vy < -3 ? -pk.vy * 0.35 : 0;
          pk.vx *= 0.6;
          pk.vz *= 0.6;
        }
        if (pk.y < -200) pk.active = false;
      }
      for (const h of this.heroes) {
        if (!h.active) continue;
        const dx = h.x - pk.x;
        const dz = h.z - pk.z;
        const dy = h.y + 40 - pk.y;
        if (pk.kind === 'ink' && pk.age > 20 && Math.abs(dx) < 140 && Math.abs(dz) < 60 && Math.abs(dy) < 120) {
          pk.x += dx * 0.12;
          pk.z += dz * 0.12;
        }
        if (Math.abs(dx) < 42 && Math.abs(dz) < 30 && Math.abs(dy) < 70 && pk.age > 12) {
          this.collect(pk, h);
          break;
        }
      }
    }
    if (this.pickups.length > 80) this.pickups = this.pickups.filter((p) => p.active);
  }

  private collect(pk: Pickup, h: Hero): void {
    pk.active = false;
    switch (pk.kind) {
      case 'ink':
        this.stats.inkCollected += pk.value;
        this.stats.score += pk.value * 5;
        this.sfx('coin', pk.x, 0.6);
        break;
      case 'health': {
        const amt = Math.round(h.maxHp * 0.35);
        h.hp = Math.min(h.maxHp, h.hp + amt);
        this.fx.text(h.x, h.h + 20, h.z, `+${amt}`, '#7bf1a8', 1.1);
        this.sfx('heal', pk.x);
        break;
      }
      case 'meter':
        this.addMeter(25);
        this.fx.text(h.x, h.h + 20, h.z, 'TEAM +25', '#ffd23f', 1);
        this.sfx('team', pk.x);
        break;
      case 'pencil':
        if (pk.pencilIndex >= 0) {
          const fresh = !this.pencilsRun[pk.pencilIndex];
          this.pencilsRun[pk.pencilIndex] = true;
          if (fresh) this.stats.pencilsFound = this.pencilsRun.filter(Boolean).length;
          this.stats.score += 1000;
          this.fx.text(h.x, h.h + 30, h.z, pk.ghost ? 'Golden Pencil (again)' : 'GOLDEN PENCIL!', '#ffd23f', 1.3);
          this.fx.confetti(pk.x, pk.y + 20, pk.z, 24);
          this.sfx('pencil', pk.x);
        }
        break;
    }
  }

  // ------------------------------------------------------------------ spawning
  spawnEnemy(kind: EnemyKind, side: 'left' | 'right' | 'drop', z?: number, xOff = 0): Enemy {
    const e = new Enemy(kind, this.scaling, this.spawnSlot++);
    e.z = z ?? this.rng.range(30, Z_MAX - 30);
    const cam = this.camera;
    let s = side;
    if (s === 'left' && cam.left - 60 < 25) s = 'right';
    if (s === 'right' && cam.right + 60 > this.stage.length - 25) s = 'left';
    if (s === 'drop') {
      const center = this.arena ? (this.arena[0] + this.arena[1]) / 2 : cam.x;
      e.x = clamp(center + xOff, cam.left + 80, cam.right - 80);
      e.y = 420;
      e.onGround = false;
      e.setState('spawn');
    } else {
      e.x = s === 'left' ? cam.left - 60 : cam.right + 60;
      e.facing = s === 'left' ? 1 : -1;
      e.entering = false;
      // a pit between the spawn point and the fight would strand it: drop in instead
      const a = Math.min(e.x, cam.x);
      const b = Math.max(e.x, cam.x);
      if (this.stage.pits.some(([p0, p1]) => p1 > a && p0 < b) || this.gates.some((g) => !g.open && g.x > a && g.x < b)) {
        e.x = clamp(cam.x + (s === 'left' ? -1 : 1) * (cam.viewW / 2 - 120), cam.left + 80, cam.right - 80);
        e.y = 420;
        e.onGround = false;
        e.entering = true;
        e.setState('spawn');
      }
    }
    if (this.supportAt(e.x, e.z, 0) === null) e.x = this.nearestGround(e.x);
    this.enemies.push(e);
    return e;
  }

  nearestGround(x: number): number {
    for (let d = 0; d < 400; d += 20) {
      if (!this.isPit(x + d)) return x + d + 20;
      if (!this.isPit(x - d)) return x - d - 20;
    }
    return x;
  }

  spawnEnemyAt(kind: EnemyKind, x: number, z: number): Enemy {
    const e = new Enemy(kind, this.scaling, this.spawnSlot++);
    e.x = x;
    e.z = z;
    e.y = 380;
    e.onGround = false;
    e.setState('spawn');
    this.enemies.push(e);
    return e;
  }

  spawnHandSlam(x: number, z: number, src: Enemy): void {
    this.handSlams.push({ x, z, t: 0, damage: Math.round(20 * src.dmgMul), done: false });
    this.sfx('telegraph', x);
  }

  startInkRain(frames: number): void {
    this.rainT = Math.max(this.rainT, frames);
  }

  bossShout(e: Enemy, text: string): void {
    this.listener.onBossShout(e.def.name, text);
  }

  hint(id: HintId | 'twins' | 'finale' | 'out' | 'swap'): void {
    const last = this.lastHint.get(id) ?? -99999;
    if (this.frame - last < 900) return;
    this.lastHint.set(id, this.frame);
    this.listener.onHint(id);
  }

  // ------------------------------------------------------------------ hero events
  onFell(h: Hero): void {
    const cost = Math.round(h.maxHp * 0.12);
    if (!this.god) h.hp = Math.max(1, h.hp - cost);
    h.x = h.safe.x;
    h.z = h.safe.z;
    h.y = 0;
    h.vx = h.vy = h.vz = 0;
    h.onGround = true;
    h.attack = null;
    if (h.state !== 'downed' && h.state !== 'out') h.setState('idle');
    if (h.script) h.endScript(this);
    h.invuln = 90;
    h.flash = 20;
    this.fx.text(h.x, h.h + 30, h.z, `-${cost}`, '#ff595e', 1);
    this.fx.ring(h.x, 40, h.z, 70, '#ffffff');
    this.sfx('fall', h.x);
  }

  ensureSafe(h: Hero): void {
    if (this.supportAt(h.x, h.z, Math.max(h.y, 0) + 1) === null && h.y <= 5) {
      h.x = h.safe.x;
      h.z = h.safe.z;
      h.y = 0;
      h.vy = 0;
      h.onGround = true;
    }
  }

  onHeroOut(h: Hero): void {
    this.fx.text(h.x, h.h + 20, h.z, 'KNOCKED OUT', '#ff595e', 1.2);
    const other = this.partnerOf(h);
    if (other && other.active) {
      this.hint('out');
      if (this.mode === 'solo' && h.controller === 'p1') this.swapControl(true);
    }
  }

  swapControl(force = false): boolean {
    if (this.mode !== 'solo') return false;
    const p = this.heroes.find((h) => h.controller === 'p1');
    const a = this.heroes.find((h) => h.controller === 'ai');
    if (!p || !a) return false;
    if (!a.active && !force) return false;
    if (!a.active) return false;
    p.controller = 'ai';
    a.controller = 'p1';
    this.fx.ring(a.x, a.h + 30, a.z, 50, '#ffd23f');
    this.sfx('uiSelect');
    return true;
  }

  interact(h: Hero): void {
    const partner = this.partnerOf(h);
    if (partner && partner.active && Math.abs(partner.x - h.x) > 120) this.hint('coop');
  }

  restoreOutHeroes(frac = 0.3): void {
    for (const h of this.heroes) {
      if (h.state === 'out' || h.state === 'downed') {
        const p = this.partnerOf(h);
        if (p && p.active) {
          h.x = clamp(p.x - p.facing * 60, this.heroBounds()[0], this.heroBounds()[1]);
          h.z = p.z;
          h.y = 0;
          h.onGround = true;
        }
        h.revive(this, frac);
        this.ensureSafe(h);
      }
    }
  }

  grantShield(): void {
    for (const h of this.heroes) {
      if (!h.active) continue;
      h.shield = 40;
      h.shieldT = 480;
      h.hp = Math.min(h.maxHp, h.hp + Math.round(h.maxHp * 0.2));
      this.fx.ring(h.x, h.h * 0.5, h.z, 80, '#7bf1a8');
    }
  }

  canStartCinematic(): boolean {
    return !this.cinematic && !this.complete;
  }

  startTeamFinisher(initiator: Hero): void {
    this.meter = 0;
    this.cinematic = { kind: 'team', t: 0, initiator };
    this.finisherActive = true;
    for (const h of this.heroes) {
      if (h.active) h.beginScript('team', this);
    }
    this.fx.flashScreen('#ffffff', 0.6);
    this.sfx('team');
    this.stats.teamHits += 3;
  }

  private updateCinematic(): void {
    const c = this.cinematic!;
    c.t++;
    const cx = this.camera.x;
    const hs = this.heroes.filter((h) => h.state === 'script');
    hs.forEach((h, i) => {
      const tx = cx + (i === 0 ? -140 : 140);
      if (c.t < 22) {
        h.x += (tx - h.x) * 0.15;
        h.y = Math.sin((c.t / 22) * Math.PI * 0.5) * 90;
        h.onGround = false;
        h.vy = 0;
        h.facing = i === 0 ? 1 : -1;
      } else if (c.t < 86) {
        h.y = 90 + Math.sin(c.t * 0.3 + i) * 8;
        h.vy = 0;
      }
    });
    if (c.t >= 26 && c.t <= 74 && (c.t - 26) % 16 === 0) {
      const strikeHero = hs[((c.t - 26) / 16) % Math.max(1, hs.length)] ?? c.initiator;
      for (const e of this.enemiesOnScreen()) this.ultHit(strikeHero, e, ATTACKS.team, 0.25);
      this.fx.shake(6);
      this.sfx('hitHeavy');
    }
    if (c.t === 86) {
      for (const e of this.enemiesOnScreen()) this.ultHit(c.initiator, e, ATTACKS.team, 0.25);
      this.fx.flashScreen('#ffffff', 0.7);
      this.fx.shake(12);
      this.sfx('explode');
      for (const h of hs) {
        h.vy = 2;
        h.onGround = false;
      }
    }
    if (c.t >= 100) {
      this.cinematic = null;
      this.finisherActive = false;
      for (const h of hs) h.endScript(this);
      if (this.team.shield) this.grantShield();
    }
  }

  beginFinale(e: Enemy): void {
    this.finale = e;
    e.mem.finaleAt = this.frame;
    for (const h of this.heroes) if (!h.active) h.revive(this, 0.5);
    this.restoreOutHeroes(0.5);
    this.meter = TEAM_METER_MAX;
    this.enemies.forEach((x) => {
      if (x !== e && x.state !== 'dead') x.die(this, true);
    });
    this.bossShout(e, 'No... no! Not the eraser-bright light of teamwork!');
    this.hint('finale');
  }

  // ------------------------------------------------------------------ enemy events
  onEnemyDefeated(e: Enemy, byHero: boolean): void {
    this.stats.defeated++;
    if (byHero) {
      this.stats.score += e.def.score;
      this.stats.xpGained += e.def.xp;
    }
    this.fx.ink(e.x, e.y + e.h * 0.5, e.z, e.isBoss ? 30 : 10);
    if (!e.noDrops && byHero) {
      const n = this.rng.int(e.def.ink[0], e.def.ink[1]);
      const drops = Math.min(10, Math.ceil(n / 2));
      for (let i = 0; i < drops; i++) this.addPickup('ink', e.x, e.y + 20, e.z, Math.max(1, Math.round(n / drops)));
      if (!e.isBoss) {
        const r = this.rng.next();
        if (r < 0.1) this.addPickup('health', e.x, e.y + 20, e.z);
        else if (r < 0.16) this.addPickup('meter', e.x, e.y + 20, e.z);
      }
    }
    if (e.isBoss && e.kind !== 'smudgeTwin') {
      this.slowmo = 90;
      this.fx.confetti(e.x, e.h, e.z, 60);
      this.fx.flashScreen('#ffffff', 0.5);
      this.fx.shake(12);
      this.sfx('explode', e.x);
      this.listener.onBossDefeated(e);
      if (this.finale === e) this.finale = null;
    }
  }

  // ------------------------------------------------------------------ stage flow
  private updateObjective(): void {
    let text: string;
    if (this.encounter) text = this.encounter.ev.objective ?? (this.encounter.boss ? `Defeat ${this.encounter.boss.def.name}!` : 'Clear out the Scribbles!');
    else if (this.gates.some((g) => !g.open && g.x > this.leadX() - 400 && g.x < this.leadX() + 600)) text = 'Stand on both plates together to open the gate';
    else text = this.eventIndex >= this.stage.events.length ? 'Reach the end of the page →' : 'Keep moving →';
    if (text !== this.objective) {
      this.objective = text;
      this.listener.onObjective(text);
    }
  }

  leadX(): number {
    let m = -Infinity;
    for (const h of this.heroes) if (h.active) m = Math.max(m, h.x);
    if (m === -Infinity) m = Math.max(...this.heroes.map((h) => h.x));
    return m;
  }

  private startEncounter(ev: EncounterEvent): void {
    this.encounter = { ev, wave: -1, queue: [], waveStart: this.frame, boss: null, cleared: false };
    this.arena = ev.lock;
    this.camera.lock = ev.lock;
    if (ev.boss) {
      const a = ev.lock;
      const boss = this.spawnEnemyAt(ev.boss, a[1] - 220, 100);
      boss.facing = -1;
      this.encounter.boss = boss;
      this.boss = boss;
      this.listener.onBossIntro(boss, ev.bossIntro);
      this.sfx('roar');
    }
    this.nextWave();
    this.updateObjective();
  }

  private nextWave(): void {
    const enc = this.encounter!;
    enc.wave++;
    enc.waveStart = this.frame;
    const w = enc.ev.waves[enc.wave];
    if (!w) return;
    const extra = this.mode === 'coop' && w.spawns.length >= 3 ? 1 : 0;
    const list = [...w.spawns];
    for (let i = 0; i < extra; i++) list.push({ ...w.spawns[0], side: w.spawns[0].side === 'left' ? 'right' : 'left', delay: (w.spawns[0].delay ?? 0) + 40 });
    enc.queue = list.map((s) => ({ spawn: s, at: this.frame + (s.delay ?? 0) }));
  }

  private updateEncounter(): void {
    const enc = this.encounter!;
    for (let i = enc.queue.length - 1; i >= 0; i--) {
      const q = enc.queue[i];
      if (this.frame >= q.at) {
        this.spawnEnemy(q.spawn.kind, q.spawn.side, q.spawn.z, q.spawn.x ?? 0);
        enc.queue.splice(i, 1);
      }
    }
    for (const e of this.enemies) {
      if (e.state === 'dead' || e.state === 'spawn' || e.mem.hidden) continue;
      if (this.camera.onScreen(e.x, -10)) e.mem.offT = 0;
      else if ((e.mem.offT = (e.mem.offT ?? 0) + 1) > 360) {
        // stranded off-screen for 6 s: bring it back into the fight
        e.mem.offT = 0;
        e.x = clamp(this.camera.x + this.rng.range(-200, 200), this.camera.left + 80, this.camera.right - 80);
        e.y = 420;
        e.onGround = false;
        e.attack = null;
        e.setState('spawn');
      }
    }
    const alive = this.livingEnemies().filter((e) => !e.mem.hidden || e.kind === 'smudgeKing').length;
    const next = enc.ev.waves[enc.wave + 1];
    if (enc.queue.length === 0 && next && alive <= (next.whenAlive ?? 0) && this.frame - enc.waveStart > 30) {
      this.nextWave();
      return;
    }
    if (enc.queue.length === 0 && !next && alive === 0) {
      // cleared
      this.encounter = null;
      this.arena = null;
      this.camera.lock = null;
      this.boss = null;
      this.goSign = 180;
      this.restoreOutHeroes(0.3);
      this.setCheckpoint(this.eventIndex, this.leadX() - 40);
      this.sfx('pencil');
      this.updateObjective();
      if (enc.ev.boss && this.eventIndex >= this.stage.events.length) this.completeT = 160;
    }
  }

  setCheckpoint(eventIndex: number, x: number): void {
    this.checkpoint = { eventIndex, x: Math.max(80, x), openGates: this.gates.filter((g) => g.open).map((g) => g.x) };
    this.listener.onCheckpoint();
  }

  private updateEvents(): void {
    if (this.encounter) {
      this.updateEncounter();
      return;
    }
    const lead = this.leadX();
    while (this.eventIndex < this.stage.events.length && this.stage.events[this.eventIndex].x <= lead) {
      const ev = this.stage.events[this.eventIndex++];
      if (ev.type === 'encounter') {
        this.startEncounter(ev);
        return;
      }
      if (ev.type === 'dialogue') this.listener.onDialogue(ev.lines);
      else if (ev.type === 'hint') this.hint(ev.hint);
      else if (ev.type === 'checkpoint') this.setCheckpoint(this.eventIndex, ev.x);
    }
    if (this.completeT > 0) {
      if (--this.completeT === 0) this.finish();
      return;
    }
    if (this.eventIndex >= this.stage.events.length && lead >= this.stage.exitX && !this.complete) this.finish();
  }

  private finish(): void {
    if (this.complete) return;
    this.complete = true;
    this.stats.pencilsFound = this.pencilsRun.filter(Boolean).length;
    this.listener.onStageComplete();
  }

  private updateGates(): void {
    for (const g of this.gates) {
      if (g.open) {
        g.openT++;
        continue;
      }
      let all = true;
      for (const p of g.plates) {
        const was = p.pressed;
        p.pressed = this.heroes.some((h) => h.active && h.onGround && Math.abs(h.x - p.x) < 36 && Math.abs(h.z - p.z) < 26 && h.y < 10);
        if (p.pressed && !was) this.sfx('plate', p.x);
        if (!p.pressed) all = false;
      }
      if (all) {
        g.open = true;
        g.openT = 0;
        this.sfx('gate', g.x);
        this.fx.confetti(g.x, 80, 100, 20);
        this.fx.text(g.x, 160, 100, 'GATE OPEN!', '#7bf1a8', 1.3);
        this.updateObjective();
      }
    }
  }

  // ------------------------------------------------------------------ hazards
  private hazardHit(t: Fighter, h: HazardState, info: Omit<HitInfo, 'source' | 'sourceX'>, sourceX: number, cooldown = 50): void {
    const last = h.hitCooldown.get(t.id) ?? -9999;
    if (this.frame - last < cooldown) return;
    if (!t.hittable()) return;
    h.hitCooldown.set(t.id, this.frame);
    const src = t.team === 'enemy' && t.lastHeroHit ? this.heroById(t.lastHeroHit.hero) : null;
    this.applyHit(t, { ...info, damage: t.team === 'enemy' ? info.damage * 2 : info.damage, source: src, sourceX, unblockable: true });
  }

  private updateHazards(): void {
    const cam = this.camera;
    const fighters: Fighter[] = [...this.heroes, ...this.enemies];
    const dmgMul = this.scaling.dmg;
    for (const h of this.hazards) {
      const d = h.def;
      const [bx0, bx1] = hazardBounds(d);
      const near = bx1 > cam.left - 150 && bx0 < cam.right + 150;
      if (!near && h.phase === 'idle') continue;
      h.t++;
      switch (d.type) {
        case 'spikes':
          for (const f of fighters) {
            if (f.y > 4 || !f.onGround) continue;
            if (f.x > d.x && f.x < d.x + d.w && f.z > d.z && f.z < d.z + d.d) {
              this.hazardHit(f, h, { damage: Math.round(8 * dmgMul), kbX: 4, kbY: 7, reaction: 'launch', hitstun: 20, dir: f.vx > 0 ? -1 : 1 }, f.x + 10, 50);
              if (f.team === 'hero') this.hint('hazard');
            }
          }
          break;
        case 'conveyor':
          for (const f of fighters) {
            if (f.onGround && f.y < 2 && f.x > d.x && f.x < d.x + d.w && f.z > d.z && f.z < d.z + d.d) f.x += d.speed;
          }
          break;
        case 'vent': {
          const cyc = d.period + VENT_WARN + VENT_ACTIVE;
          const t = ((h.t % cyc) + cyc) % cyc;
          h.phase = t < d.period ? 'rest' : t < d.period + VENT_WARN ? 'warn' : 'active';
          if (h.phase === 'warn' && t === d.period) this.sfx('steam', d.x, 0.4);
          if (h.phase === 'active') {
            for (const f of fighters) {
              if (Math.abs(f.x - d.x) < 42 && Math.abs(f.z - d.z) < 24 && f.y < 140)
                this.hazardHit(f, h, { damage: Math.round(10 * dmgMul), kbX: 2, kbY: 11, reaction: 'launch', hitstun: 24, dir: f.x >= d.x ? 1 : -1 }, d.x, 60);
            }
          }
          break;
        }
        case 'press': {
          const cyc = d.period + PRESS_WARN + PRESS_ACTIVE + 30;
          const t = ((h.t % cyc) + cyc) % cyc;
          h.phase = t < d.period ? 'rest' : t < d.period + PRESS_WARN ? 'warn' : t < d.period + PRESS_WARN + PRESS_ACTIVE ? 'active' : 'rest';
          if (t === d.period + PRESS_WARN) {
            this.sfx('stomp', d.x, 0.6);
            this.fx.shake(3);
            this.fx.dust(d.x + d.w / 2, d.z + d.d / 2, 6);
          }
          if (h.phase === 'active') {
            for (const f of fighters) {
              if (f.x > d.x && f.x < d.x + d.w && f.z > d.z - 10 && f.z < d.z + d.d + 10 && f.y < 200)
                this.hazardHit(f, h, { damage: Math.round(22 * dmgMul), kbX: 6, kbY: 6, reaction: 'knockdown', hitstun: 30, dir: f.x < d.x + d.w / 2 ? -1 : 1 }, d.x + d.w / 2, 60);
            }
          }
          break;
        }
        case 'roller': {
          // a giant crayon rolls in from the back toward the front at the heroes' position
          const lead = this.leadX();
          const inRange = lead > d.x0 && lead < d.x1;
          if (h.phase === 'idle' || h.phase === 'rest') {
            if (inRange && h.t >= d.period) {
              h.phase = 'warn';
              h.t = 0;
              const tgt = this.rng.pick(this.activeHeroes().length ? this.activeHeroes() : this.heroes);
              h.px = clamp(tgt.x + this.rng.range(-40, 40), d.x0, d.x1);
              h.pz = -60;
              this.sfx('telegraph', h.px, 0.6);
            } else if (!inRange) h.t = Math.min(h.t, d.period - 40);
          } else if (h.phase === 'warn') {
            if (h.t >= ROLLER_WARN) {
              h.phase = 'active';
              h.t = 0;
              this.sfx('stomp', h.px, 0.5);
            }
          } else if (h.phase === 'active') {
            h.pz += 6;
            for (const f of fighters) {
              if (Math.abs(f.x - h.px) < 46 && Math.abs(f.z - h.pz) < 26 && f.y < 50)
                this.hazardHit(f, h, { damage: Math.round(14 * dmgMul), kbX: 3, kbY: 8, reaction: 'launch', hitstun: 28, dir: f.x >= h.px ? 1 : -1 }, h.px, 40);
            }
            if (h.pz > Z_MAX + 80) {
              h.phase = 'rest';
              h.t = 0;
            }
          }
          break;
        }
        case 'car': {
          const lead = this.leadX();
          const inRange = lead > d.x0 - 200 && lead < d.x1 + 200;
          if (h.phase === 'idle' || h.phase === 'rest') {
            if (inRange && h.t >= d.period) {
              h.phase = 'warn';
              h.t = 0;
              this.sfx('horn', cam.x, 0.7);
            }
          } else if (h.phase === 'warn') {
            if (h.t >= CAR_WARN) {
              h.phase = 'active';
              h.t = 0;
              h.px = cam.left - 200;
            }
          } else if (h.phase === 'active') {
            h.px += 18;
            for (const f of fighters) {
              if (Math.abs(f.x - h.px) < 80 && Math.abs(f.z - d.z) < d.d && f.y < 60)
                this.hazardHit(f, h, { damage: Math.round(18 * dmgMul), kbX: 9, kbY: 9, reaction: 'launch', hitstun: 30, dir: 1 }, h.px - 50, 60);
            }
            if (h.px > cam.right + 300) {
              h.phase = 'rest';
              h.t = 0;
            }
          }
          break;
        }
        case 'inkRain': {
          const lead = this.leadX();
          if (lead > d.x0 && lead < d.x1 && h.t % d.period === 0) this.dropInk();
          break;
        }
      }
    }
    // boss hand slams
    for (const s of this.handSlams) {
      s.t++;
      if (s.t === HAND_WARN) {
        this.fx.floorRing(s.x, s.z, 160, '#3c096c', 20);
        this.fx.shake(7);
        this.sfx('stomp', s.x);
        for (const f of this.heroes) {
          if (!f.hittable()) continue;
          if (Math.abs(f.x - s.x) < 70 && Math.abs(f.z - s.z) < 40 && f.y < 120)
            this.applyHit(f, { damage: s.damage, kbX: 6, kbY: 9, reaction: 'knockdown', hitstun: 30, dir: f.x >= s.x ? 1 : -1, unblockable: true, source: this.boss, sourceX: s.x, hitstop: 6 });
        }
      }
      if (s.t > HAND_WARN + 24) s.done = true;
    }
    this.handSlams = this.handSlams.filter((s) => !s.done);
    if (this.rainT > 0) {
      this.rainT--;
      if (this.rainT % 36 === 0) this.dropInk();
    }
  }

  private dropInk(): void {
    const hs = this.activeHeroes();
    if (!hs.length) return;
    const h = this.rng.pick(hs);
    const p = this.projectiles.obtain();
    if (!p) return;
    p.reset(PROJECTILES.inkdrop, h, 'enemy');
    p.owner = this.boss ?? null;
    p.x = h.x + this.rng.range(-90, 90) + h.vx * 30;
    p.z = clamp(h.z + this.rng.range(-40, 40), 0, Z_MAX);
    p.y = 420;
    p.vx = 0;
    p.vz = 0;
    p.vy = 0;
    p.dmgMul = this.scaling.dmg;
  }

  // ------------------------------------------------------------------ main update
  update(inputs: PlayerInput[]): void {
    this.fx.update();
    if (this.complete) {
      // let heroes idle on the results screen
      return;
    }
    if (this.hitstop > 0) {
      this.hitstop--;
      return;
    }
    if (this.slowmo > 0) {
      this.slowmo--;
      if (this.slowmo % 2 === 1) return;
    }
    this.frame++;
    if (!this.cinematic) this.stats.time += 1 / 60;
    if (this.comboT > 0 && --this.comboT === 0) this.combo = 0;
    if (this.goSign > 0) this.goSign--;

    // inputs
    for (const h of this.heroes) {
      if (h.controller === 'p1') h.input = inputs[0];
      else if (h.controller === 'p2') h.input = inputs[1];
      else h.input = this.brains.get(h.heroId)!.think(this, h);
    }
    for (const h of this.heroes) h.update(this);

    if (this.cinematic) {
      this.updateCinematic();
      this.updateCamera();
      return;
    }

    for (const e of this.enemies) e.update(this);
    this.separateEnemies();
    this.enemies = this.enemies.filter((e) => !e.removed);
    for (const e of this.enemies) {
      if (e.y < -200 && e.state !== 'dead') {
        this.fx.text(e.x, 40, e.z, 'RING OUT!', '#ffd23f', 1.1);
        e.die(this, !!e.lastHeroHit);
        e.removed = true;
      }
    }
    this.updateProjectiles();
    this.updateHazards();
    this.updatePickups();
    this.updateGates();
    for (const c of this.crates) if (c.shakeT > 0) c.shakeT--;
    if (this.stageRainT > 0) this.stageRainT--;
    this.updateEvents();
    this.updateCamera();
    if (this.frame % 30 === 0) this.updateObjective();
    for (const h of this.heroes) {
      if (h.active && h.hp / h.maxHp < 0.25 && !h.lowHpWarned) {
        h.lowHpWarned = true;
        this.sfx('heartbeat');
      }
      if (h.hp / h.maxHp >= 0.25) h.lowHpWarned = false;
    }

    // game over: nobody left standing
    if (!this.activeHeroes().length) {
      if (++this.overT === 90 && !this.gameOver) {
        this.gameOver = true;
        this.listener.onGameOver();
      }
    } else this.overT = 0;
  }

  private separateEnemies(): void {
    const es = this.enemies;
    for (let i = 0; i < es.length; i++) {
      const a = es[i];
      if (a.state === 'dead' || !a.onGround) continue;
      for (let j = i + 1; j < es.length; j++) {
        const b = es[j];
        if (b.state === 'dead' || !b.onGround) continue;
        const dx = b.x - a.x;
        const dz = b.z - a.z;
        const minD = (a.w + b.w) * 0.32;
        if (Math.abs(dx) < minD && Math.abs(dz) < 16) {
          const push = (minD - Math.abs(dx)) * 0.1 * (dx >= 0 ? 1 : -1);
          if (!a.isBoss) a.x -= push;
          if (!b.isBoss) b.x += push;
          a.z -= dz >= 0 ? 0.4 : -0.4;
          b.z += dz >= 0 ? 0.4 : -0.4;
        }
      }
    }
  }

  private updateCamera(): void {
    const hs = this.heroes.filter((h) => h.state !== 'out');
    const list = hs.length ? hs : this.heroes;
    let target = list.reduce((s, h) => s + h.x, 0) / list.length;
    const p1 = this.heroes.find((h) => h.controller === 'p1');
    if (this.mode === 'solo' && p1 && p1.active) target = p1.x * 0.7 + target * 0.3 + p1.facing * 60;
    this.camera.update(target);
  }

  get bossBar(): Enemy | null {
    if (this.boss && this.boss.state !== 'dead' && !this.boss.removed) return this.boss;
    return null;
  }

  get twins(): Enemy[] {
    return this.enemies.filter((e) => e.kind === 'smudgeTwin' && e.state !== 'dead');
  }
}
