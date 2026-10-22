import { COOP_COMBO_COST, COOP_COMBO_RANGE, PERSONAL_ULT_COST, TEAM_FINISHER_RANGE, TEAM_METER_MAX } from '../config';
import type { PlayerInput } from '../core/input';
import { clamp, lerp } from '../core/math';
import { ATTACKS } from '../data/attacks';
import { HEROES, type HeroDef } from '../data/heroes';
import type { AttackDef, HeroId } from '../data/types';
import { Fighter, type AttackInstance, type HitInfo } from './fighter';
import type { HeroMods } from './progression';
import type { World } from './world';

type Btn = 'jump' | 'light' | 'heavy' | 'special' | 'dodge' | 'ult' | 'interact';
const BTNS: Btn[] = ['jump', 'light', 'heavy', 'special', 'dodge', 'ult', 'interact'];
const BUFFER = 9;

export type ScriptKind = 'ult' | 'coopBall' | 'coopBrace' | 'coopVault' | 'coopBoost' | 'team';

export const emptyInput = (): PlayerInput => ({ mx: 0, mz: 0, jump: false, light: false, heavy: false, special: false, dodge: false, ult: false, interact: false });

export class Hero extends Fighter {
  readonly team = 'hero' as const;
  readonly heroId: HeroId;
  readonly def: HeroDef;
  mods: HeroMods;
  controller: 'p1' | 'p2' | 'ai';
  input: PlayerInput = emptyInput();
  private prev: PlayerInput = emptyInput();
  private buf: Record<Btn, number> = { jump: 0, light: 0, heavy: 0, special: 0, dodge: 0, ult: 0, interact: 0 };
  airJumps = 0;
  airDodged = false;
  airAttacked = false;
  specialCd = 0;
  specialMax = 1;
  blockT = 0;
  dodgeCd = 0;
  downedT = 0;
  downedMax = 600;
  reviveProgress = 0;
  revivedThisFrame = false;
  reviving = false;
  shield = 0;
  shieldT = 0;
  script: ScriptKind | null = null;
  scriptT = 0;
  private scriptTargets: Fighter[] = [];
  private scriptStart = { x: 0, z: 0 };
  private coopInst: AttackInstance | null = null;
  safe = { x: 0, z: 100 };
  comboTaken = 0;
  lastHurtFrame = -999;
  playerSlot: 0 | 1;
  lowHpWarned = false;

  constructor(heroId: HeroId, mods: HeroMods, controller: 'p1' | 'p2' | 'ai', slot: 0 | 1) {
    super();
    this.heroId = heroId;
    this.def = HEROES[heroId];
    this.mods = mods;
    this.controller = controller;
    this.playerSlot = slot;
    this.w = this.def.hurtW;
    this.h = this.def.hurtH;
    this.maxHp = Math.round(this.def.maxHp * mods.hpMul);
    this.hp = this.maxHp;
    this.defense = this.def.defense;
    this.dmgMul = mods.dmgMul;
    this.specialMax = Math.round(this.def.specialCooldown * mods.specialCdMul);
  }

  get active(): boolean {
    return this.state !== 'downed' && this.state !== 'out';
  }

  get blocking(): boolean {
    return this.state === 'block';
  }

  protected holdingCharge(): boolean {
    return this.input.heavy;
  }

  private pressed(b: Btn): boolean {
    return this.input[b] && !this.prev[b];
  }

  private consume(b: Btn): boolean {
    if (this.buf[b] > 0) {
      this.buf[b] = 0;
      return true;
    }
    return false;
  }

  update(world: World): void {
    this.tickTimers();
    for (const b of BTNS) {
      if (this.pressed(b)) this.buf[b] = BUFFER;
      else if (this.buf[b] > 0) this.buf[b]--;
    }
    if (this.specialCd > 0) this.specialCd--;
    if (this.dodgeCd > 0) this.dodgeCd--;
    if (this.shieldT > 0 && --this.shieldT === 0) this.shield = 0;
    this.reviving = false;

    switch (this.state) {
      case 'out':
        this.prev = { ...this.input };
        return;
      case 'downed':
        this.updateDowned(world);
        break;
      case 'script':
        this.updateScript(world);
        break;
      case 'dodge':
        this.updateDodge(world);
        break;
      case 'block':
        this.updateBlock(world);
        break;
      case 'attack':
        this.updateAttackState(world);
        break;
      default:
        if (!this.updateReaction(world, 45)) this.act(world);
    }
    this.physics(world);
    if (this.onGround && this.y === 0 && this.state !== 'downed' && world.isSafeGround(this.x, this.z)) {
      this.safe.x = this.x;
      this.safe.z = this.z;
    }
    if (this.y < -260) world.onFell(this);
    this.prev = { ...this.input };
  }

  private moveDir(): { mx: number; mz: number; mag: number } {
    const mx = this.input.mx;
    const mz = this.input.mz;
    return { mx, mz, mag: Math.hypot(mx, mz) };
  }

  private act(world: World): void {
    const { mx, mz, mag } = this.moveDir();
    const partner = world.partnerOf(this);

    // revive (hold interact next to a downed partner)
    if (this.input.interact && partner && partner.state === 'downed' && this.onGround && Math.abs(partner.x - this.x) < 80 && Math.abs(partner.z - this.z) < 45) {
      this.reviving = true;
      this.vx = 0;
      this.vz = 0;
      this.facing = partner.x >= this.x ? 1 : -1;
      partner.reviveProgress += world.team.reviveMul;
      partner.revivedThisFrame = true;
      if (partner.reviveProgress >= 80) partner.revive(world);
      this.buf.interact = 0;
      if (this.state !== 'idle') this.setState('idle');
      return;
    }

    if (this.lag <= 0) {
      if (this.consume('ult')) {
        if (this.tryUltimate(world)) return;
      }
      if (this.consume('interact')) {
        if (partner && this.tryCoop(world, partner)) return;
        world.interact(this);
      }
      if (this.buf.special > 0 && this.specialCd <= 0 && this.onGround) {
        this.buf.special = 0;
        this.doSpecial(world);
        return;
      }
      if (this.buf.heavy > 0) {
        this.buf.heavy = 0;
        if (this.onGround) {
          this.startAttack(this.def.heavy, world);
          return;
        } else if (!this.airAttacked) {
          this.airAttacked = true;
          this.startAttack(this.def.air, world);
          return;
        }
      }
      if (this.buf.light > 0) {
        this.buf.light = 0;
        if (this.onGround) {
          this.startAttack(this.def.lightStart, world);
          return;
        } else if (!this.airAttacked) {
          this.airAttacked = true;
          this.startAttack(this.def.air, world);
          return;
        }
      }
      if (this.buf.jump > 0) {
        if (this.onGround) {
          this.buf.jump = 0;
          this.jump(world, this.def.jump);
        } else if (this.airJumps > 0) {
          this.buf.jump = 0;
          this.airJumps--;
          this.jump(world, this.def.jump * 0.92);
          world.fx.ring(this.x, this.y, this.z, 30, '#ffffff');
        }
      }
      if (this.buf.dodge > 0 && this.dodgeCd <= 0) {
        if (mag > 0.35 && (this.onGround || (!this.airDodged && this.heroId === 'momo'))) {
          this.buf.dodge = 0;
          this.startDodge(world, mx, mz);
          return;
        }
        if (mag <= 0.35 && this.onGround) {
          this.buf.dodge = 0;
          this.setState('block');
          this.blockT = 0;
          return;
        }
      }
      if (this.input.dodge && mag <= 0.35 && this.onGround && this.dodgeCd <= 0) {
        this.setState('block');
        this.blockT = this.def.parryWindow + 1; // held block, not a fresh parry
        return;
      }
    }

    // movement
    const spd = this.def.speed;
    const ctrl = this.onGround ? 0.35 : 0.12;
    this.vx = lerp(this.vx, mx * spd, ctrl);
    this.vz = lerp(this.vz, mz * this.def.zSpeed, ctrl);
    if (Math.abs(mx) > 0.2) this.facing = mx > 0 ? 1 : -1;
    if (this.onGround) {
      if (mag > 0.15) {
        if (this.state !== 'move') this.setState('move');
      } else if (this.state !== 'idle') this.setState('idle');
    } else if (this.state !== 'air') this.setState('air');
  }

  jump(world: World, v: number): void {
    this.vy = v;
    this.onGround = false;
    this.setState('air');
    world.sfx('jump', this.x);
    world.fx.dust(this.x, this.z, 3);
  }

  land(world: World): void {
    super.land(world);
    if (this.onGround) {
      this.airJumps = this.def.airJumps;
      this.airDodged = false;
      this.airAttacked = false;
    }
  }

  private startDodge(world: World, mx: number, mz: number): void {
    const m = Math.hypot(mx, mz) || 1;
    this.setState('dodge');
    this.attack = null;
    this.vx = (mx / m) * 8.2;
    this.vz = (mz / m) * 5.2;
    if (Math.abs(mx) > 0.2) this.facing = mx > 0 ? 1 : -1;
    if (!this.onGround) {
      this.airDodged = true;
      this.vy = Math.max(this.vy, 3);
    }
    this.invuln = Math.max(this.invuln, 15);
    world.sfx('dodge', this.x);
  }

  private updateDodge(world: World): void {
    if (this.stateT > 12) {
      this.vx *= 0.75;
      this.vz *= 0.75;
    }
    if (this.stateT % 3 === 0) world.fx.afterimage(this);
    if (this.stateT >= 20) {
      this.dodgeCd = 8;
      this.setState(this.onGround ? 'idle' : 'air');
    }
  }

  private updateBlock(world: World): void {
    this.blockT++;
    this.vx *= 0.7;
    this.vz *= 0.7;
    const { mx, mz, mag } = this.moveDir();
    if (!this.input.dodge) {
      this.setState('idle');
      return;
    }
    if (mag > 0.6 && this.dodgeCd <= 0 && this.blockT > 4) {
      this.startDodge(world, mx, mz);
      return;
    }
    if (this.consume('light')) {
      this.startAttack(this.def.lightStart, world);
    }
  }

  private nextOf(def: AttackDef): string | undefined {
    if (def.next) return def.next;
    if (def.id === 'm_l4' && this.mods.finisher) return 'm_l5';
    return undefined;
  }

  private updateAttackState(world: World): void {
    const a = this.attack!;
    const d = a.def;
    const ph = this.attackPhase;
    const cancelable = ph === 'recovery' || (ph === 'active' && a.t >= d.startup + d.active);
    const isLight = d.id.includes('_l');
    if (cancelable && !d.aerial) {
      const next = this.nextOf(d);
      if (this.buf.light > 0 && next) {
        this.buf.light = 0;
        this.faceInput();
        this.startAttack(next, world);
        return;
      }
      if (this.buf.heavy > 0 && isLight) {
        this.buf.heavy = 0;
        this.faceInput();
        this.startAttack(this.def.heavy, world);
        return;
      }
      if (this.buf.heavy > 0 && d.id === 's_heavy' && this.mods.pounceChain) {
        this.buf.heavy = 0;
        this.faceInput();
        this.startAttack('s_heavy2', world);
        return;
      }
      if (this.buf.special > 0 && this.specialCd <= 0) {
        this.buf.special = 0;
        this.faceInput();
        this.doSpecial(world);
        return;
      }
      const { mx, mz, mag } = this.moveDir();
      if (this.buf.dodge > 0 && mag > 0.35 && this.dodgeCd <= 0) {
        this.buf.dodge = 0;
        this.startDodge(world, mx, mz);
        return;
      }
    }
    if (ph === 'startup' && a.t <= 2 && d.id !== 's_heavy') this.faceInput();
    if (!this.updateAttack(world)) {
      // attack finished
    }
  }

  private faceInput(): void {
    if (Math.abs(this.input.mx) > 0.3) this.facing = this.input.mx > 0 ? 1 : -1;
  }

  protected onActiveStart(a: AttackInstance, world: World): void {
    if (a.def.id === 'm_special') {
      world.spawnProjectile('banana', this, 0);
      if (this.mods.bananaSplit) {
        world.spawnProjectile('banana', this, this.z > 100 ? -40 : 40);
      }
      world.sfx('chatter', this.x);
      return;
    }
    if (a.def.id.startsWith('s_bark')) {
      world.fx.barkWave(this, a.def.id === 's_bark_echo');
      world.clearProjectilesNear(this, a.def);
    }
    super.onActiveStart(a, world);
  }

  private doSpecial(world: World): void {
    this.specialCd = this.specialMax;
    if (this.heroId === 'momo') this.startAttack('m_special', world);
    else this.startAttack(this.mods.echoBark ? 's_bark_echo' : 's_bark', world);
  }

  private tryUltimate(world: World): boolean {
    const partner = world.partnerOf(this);
    if (
      world.meter >= TEAM_METER_MAX &&
      partner &&
      partner.active &&
      Math.abs(partner.x - this.x) < TEAM_FINISHER_RANGE &&
      world.canStartCinematic()
    ) {
      world.startTeamFinisher(this);
      return true;
    }
    if (world.meter >= PERSONAL_ULT_COST && world.canStartCinematic()) {
      world.meter -= PERSONAL_ULT_COST;
      this.beginScript('ult', world);
      return true;
    }
    world.fx.text(this.x, this.y + this.h + 30, this.z, 'Team meter low', '#ffffff', 0.8);
    return false;
  }

  private tryCoop(world: World, partner: Hero): boolean {
    if (!partner.active || partner.state === 'script' || this.state === 'script') return false;
    if (Math.abs(partner.x - this.x) > COOP_COMBO_RANGE || Math.abs(partner.z - this.z) > 60) return false;
    if (world.meter < COOP_COMBO_COST) {
      world.fx.text(this.x, this.y + this.h + 30, this.z, `Co-op needs ${COOP_COMBO_COST}% meter`, '#ffffff', 0.8);
      return false;
    }
    if (!world.canStartCinematic()) return false;
    world.meter -= COOP_COMBO_COST;
    world.stats.teamHits++;
    if (this.heroId === 'momo') {
      partner.facing = this.facing;
      this.beginScript('coopBall', world);
      partner.beginScript('coopBrace', world);
    } else {
      partner.facing = this.facing;
      this.beginScript('coopVault', world);
      partner.beginScript('coopBoost', world);
    }
    world.sfx('team', this.x);
    return true;
  }

  beginScript(kind: ScriptKind, world: World): void {
    this.attack = null;
    this.script = kind;
    this.scriptT = 0;
    this.setState('script');
    this.invuln = 999;
    this.scriptStart = { x: this.x, z: this.z };
    this.vx = 0;
    this.vz = 0;
    if (kind === 'ult') {
      if (this.heroId === 'momo') {
        this.scriptTargets = world.enemiesOnScreen().slice(0, 6);
        world.sfx('chatter', this.x);
      } else world.sfx('howl', this.x);
      world.fx.flashScreen(this.heroId === 'momo' ? '#ffd23f' : '#4cc9f0', 0.35);
    }
    if (kind === 'coopBall') {
      this.coopInst = { def: ATTACKS.m_coop, t: 0, hit: new Map(), charge: 0, spawned: false };
    }
  }

  endScript(world: World): void {
    this.script = null;
    this.invuln = 30;
    this.setState(this.onGround ? 'idle' : 'air');
    world.ensureSafe(this);
  }

  private updateScript(world: World): void {
    const t = ++this.scriptT;
    const partner = world.partnerOf(this);
    switch (this.script) {
      case 'team':
        this.vx = 0;
        this.vz = 0;
        return;
      case 'ult':
        if (this.heroId === 'momo') {
          const live = this.scriptTargets.filter((e) => e.alive && !e.removed);
          if (t % 8 === 0 && t <= 64 && live.length) {
            const tgt = live[(t / 8) % live.length];
            const side = this.x <= tgt.x ? -1 : 1;
            world.fx.afterimage(this);
            this.x = tgt.x + side * 50;
            this.z = tgt.z;
            this.facing = -side;
            world.fx.afterimage(this);
            world.ultHit(this, tgt, ATTACKS.m_ult);
          } else if (!live.length && t % 10 === 0 && t < 40) {
            world.fx.ring(this.x, 40, this.z, 70, '#ffd23f');
          }
          if (t >= 74) this.endScript(world);
        } else {
          if (t === 16) {
            world.fx.sirenWave(this);
            world.fx.shake(8);
            for (const e of world.enemiesOnScreen()) {
              world.ultHit(this, e, ATTACKS.s_ult);
              e.stunT = Math.max(e.stunT, e.def.boss ? 70 : 200);
            }
            if (world.team.shield) world.grantShield();
          }
          if (t >= 50) this.endScript(world);
        }
        return;
      case 'coopBrace':
        if (t === 18) world.fx.ring(this.x, 30, this.z, 60, '#4cc9f0');
        if (t >= 26) this.endScript(world);
        return;
      case 'coopBall': {
        const dir = this.facing;
        if (t <= 12 && partner) {
          const k = t / 12;
          this.x = lerp(this.scriptStart.x, partner.x, k);
          this.z = lerp(this.scriptStart.z, partner.z, k);
          this.y = partner.y + Math.sin(k * Math.PI) * 60 + k * (partner.h * 0.8);
          this.onGround = false;
          this.vy = 0;
        } else if (t <= 16 && partner) {
          this.x = partner.x;
          this.y = partner.y + partner.h * 0.8;
        } else if (t <= 52) {
          if (t === 17) {
            world.sfx('swingHeavy', this.x);
            world.fx.shake(4);
          }
          this.vx = dir * 13;
          this.vy = 0;
          this.y = Math.max(20, this.y - 2);
          if (t % 2 === 0) world.fx.afterimage(this);
          if (this.coopInst) {
            this.coopInst.t = ATTACKS.m_coop.startup + 1;
            world.resolveAttack(this, this.coopInst);
          }
        } else {
          this.vy = 3;
          this.vx = dir * 3;
          this.endScript(world);
        }
        return;
      }
      case 'coopBoost':
        this.vx = 0;
        if (t >= 24) this.endScript(world);
        return;
      case 'coopVault':
        if (t <= 10 && partner) {
          const k = t / 10;
          this.x = lerp(this.scriptStart.x, partner.x, k);
          this.z = lerp(this.scriptStart.z, partner.z, k);
        } else if (t === 11) {
          this.onGround = false;
          this.vy = 17;
          world.sfx('jump', this.x);
          world.fx.ring(this.x, this.y, this.z, 50, '#ffffff');
        } else if (t > 14 && this.onGround) {
          const inst: AttackInstance = { def: ATTACKS.s_coop, t: ATTACKS.s_coop.startup + 1, hit: new Map(), charge: 0, spawned: false };
          world.resolveAttack(this, inst);
          world.fx.crater(this.x, this.z, 160);
          world.fx.shake(9);
          world.sfx('stomp', this.x);
          this.endScript(world);
        } else if (t > 120) this.endScript(world);
        return;
    }
  }

  private updateDowned(world: World): void {
    this.vx *= 0.8;
    if (!this.revivedThisFrame) this.reviveProgress = Math.max(0, this.reviveProgress - 0.5);
    this.revivedThisFrame = false;
    this.downedT--;
    if (this.downedT <= 0) {
      this.setState('out');
      this.reviveProgress = 0;
      world.onHeroOut(this);
    }
  }

  revive(world: World, frac = 0.4): void {
    this.hp = Math.max(1, Math.round(this.maxHp * frac));
    this.reviveProgress = 0;
    this.y = Math.max(this.y, 0);
    this.setState('getup');
    this.invuln = 120;
    world.fx.ring(this.x, 20, this.z, 70, '#7bf1a8');
    world.fx.text(this.x, this.h + 20, this.z, 'REVIVED!', '#7bf1a8', 1.1);
    world.sfx('revive', this.x);
    this.lowHpWarned = false;
  }

  /** Called by world when hp reaches zero. */
  goDown(world: World): void {
    this.attack = null;
    this.script = null;
    this.hp = 0;
    this.setState('downed');
    this.downedMax = world.team.downedFrames;
    this.downedT = this.downedMax;
    this.reviveProgress = 0;
    this.invuln = 0;
    world.stats.downs++;
    world.sfx('down', this.x);
    world.fx.text(this.x, this.h + 20, this.z, 'DOWN!', '#ff595e', 1.2);
  }

  react(info: HitInfo, world: World): void {
    const f = world.frame;
    if (f - this.lastHurtFrame > 100) this.comboTaken = 0;
    this.lastHurtFrame = f;
    this.comboTaken++;
    // anti stun-lock: after several hits in a row the hero is knocked clear
    if (this.comboTaken >= 5 && info.reaction === 'stagger') {
      info = { ...info, reaction: 'knockdown', kbX: Math.max(info.kbX, 5), kbY: Math.max(info.kbY, 5) };
      this.comboTaken = 0;
    }
    super.react(info, world);
  }

  /** extra invulnerability after getting up, to prevent wake-up traps */
  protected updateReaction(world: World, getupInvuln: number): boolean {
    return super.updateReaction(world, getupInvuln);
  }

  hpFrac(): number {
    return clamp(this.hp / this.maxHp, 0, 1);
  }
}
