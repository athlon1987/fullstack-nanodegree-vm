// Boss pattern scripts. Each boss has readable telegraphs, vulnerability windows
// and at least one moment that rewards the two heroes splitting up.
import { Z_MAX } from '../config';
import { clamp } from '../core/math';
import type { Enemy } from './enemy';
import type { HitInfo } from './fighter';
import type { World } from './world';

function inReach(e: Enemy, mul = 1): boolean {
  const t = e.target;
  if (!t) return false;
  return Math.abs(t.x - e.x) < e.def.reach * mul + 14 && Math.abs(t.z - e.z) < 22;
}

function approach(e: Enemy, world: World, speed = 1): void {
  const t = e.target;
  if (!t) return;
  const side = e.x < t.x ? -1 : 1;
  e.moveTo(world, t.x + side * e.def.reach * 0.8, t.z, speed);
  e.faceTarget();
}

function stayInArena(e: Enemy, world: World): void {
  const a = world.arena;
  if (!a) return;
  e.x = clamp(e.x, a[0] + 40, a[1] - 40);
}

function cycle(e: Enemy, key: string): number {
  e.mem[key] = (e.mem[key] ?? 0) + 1;
  return e.mem[key];
}

export function bossThink(e: Enemy, world: World): void {
  if (e.cooldown > 0) e.cooldown--;
  stayInArena(e, world);
  if (e.mem.hidden) {
    e.vx = 0;
    e.vz = 0;
    smudgeHiddenTick(e, world);
    return;
  }
  if (e.mem.finale) {
    e.vx *= 0.8;
    e.stunT = 2;
    return;
  }
  if (!e.target) return;
  const t = e.target;
  const hpFrac = e.hp / e.maxHp;
  switch (e.kind) {
    case 'bigScribbler': {
      if (hpFrac < 0.5 && !e.mem.summoned) {
        e.mem.summoned = 1;
        e.phase = 2;
        world.bossShout(e, 'Get \'em, little scribbles!');
        world.spawnEnemy('scribbler', 'left');
        world.spawnEnemy('scribbler', 'right');
      }
      approach(e, world, e.phase === 2 ? 1.25 : 1);
      if (e.cooldown <= 0 && inReach(e, 1.2)) {
        const n = cycle(e, 'n');
        e.faceTarget();
        e.startAttack(n % 3 === 0 ? 'b_pound' : 'b_swipe', world);
        if (e.phase === 2) e.cooldown = 20;
      }
      return;
    }
    case 'thornback': {
      if (hpFrac < 0.5) e.phase = 2;
      const n = e.mem.n ?? 0;
      const wantCharge = n % 3 === 0;
      if (e.cooldown > 0) {
        approach(e, world, 0.6);
        return;
      }
      if (wantCharge) {
        // back off to the arena edge on our side, then charge across
        const a = world.arena ?? [e.x - 400, e.x + 400];
        const edge = e.x < t.x ? a[0] + 90 : a[1] - 90;
        if (Math.abs(e.x - edge) > 30 && (e.mem.backT = (e.mem.backT ?? 0) + 1) < 120) {
          e.moveTo(world, edge, t.z, 1.3);
          e.faceTarget();
          return;
        }
        e.mem.backT = 0;
        e.z = clamp(e.z + Math.sign(t.z - e.z) * Math.min(4, Math.abs(t.z - e.z)), 0, Z_MAX);
        e.faceTarget();
        e.mem.charging = 1;
        cycle(e, 'n');
        e.startAttack('b_charge', world);
        return;
      }
      if (Math.abs(t.x - e.x) > 240 && Math.abs(t.z - e.z) < 30) {
        cycle(e, 'n');
        e.faceTarget();
        e.startAttack('b_quills', world);
        return;
      }
      approach(e, world, 1);
      if (inReach(e, 1.2)) {
        cycle(e, 'n');
        e.startAttack('b_swipe', world);
      }
      return;
    }
    case 'highlighter': {
      if (hpFrac < 0.5 && !e.mem.summoned) {
        e.mem.summoned = 1;
        e.phase = 2;
        world.bossShout(e, 'Lights! Darts, flank them!');
        world.spawnEnemy('dart', 'left');
        world.spawnEnemy('dart', 'right');
      }
      if (e.cooldown > 0) {
        // keep distance and hold the shield up
        const side = e.x < t.x ? -1 : 1;
        e.moveTo(world, t.x + side * 230, t.z + (e.phase === 2 ? 40 : 0), 0.7);
        e.faceTarget();
        return;
      }
      const n = cycle(e, 'n');
      e.faceTarget();
      if (n % 2 === 1) {
        e.z = clamp(e.z + Math.sign(t.z - e.z) * Math.min(6, Math.abs(t.z - e.z)), 0, Z_MAX);
        e.shieldUp = false;
        e.startAttack('b_beam', world);
        e.mem.beam = 1;
      } else {
        approach(e, world, 1.3);
        if (inReach(e, 1.6)) {
          e.shieldUp = false;
          e.startAttack('b_slash', world);
        } else e.mem.n--;
      }
      return;
    }
    case 'golem': {
      if (hpFrac < 0.5 && e.phase === 1) {
        e.phase = 2;
        world.bossShout(e, 'OVERTIME! Smudgebombs, report to the floor!');
        e.mem.bombT = 60;
      }
      if (e.phase === 2 && --e.mem.bombT <= 0) {
        e.mem.bombT = 600;
        world.spawnEnemy('bomb', 'left');
        world.spawnEnemy('bomb', 'right');
      }
      if (e.cooldown > 0) {
        approach(e, world, 0.7);
        return;
      }
      const n = cycle(e, 'n');
      e.faceTarget();
      if (n % 4 === 1 || (Math.abs(t.x - e.x) > 260 && n % 2 === 1)) {
        e.startAttack('b_volley', world);
        return;
      }
      approach(e, world, 1);
      if (inReach(e, 1.3)) {
        e.startAttack(n % 3 === 0 ? 'b_chomp' : 'b_pound', world);
        if (n % 3 === 0) e.mem.chomp = 1;
      } else e.mem.n--;
      return;
    }
    case 'smudgeKing':
      smudgeKingThink(e, world, hpFrac);
      return;
    case 'smudgeTwin': {
      approach(e, world, 1.15);
      if (e.cooldown <= 0 && inReach(e, 1.3)) {
        const n = cycle(e, 'n');
        e.startAttack(n % 2 ? 'b_slash' : 'b_swipe', world);
        e.cooldown = 30;
      }
      return;
    }
    default:
      approach(e, world);
  }
}

function smudgeKingThink(e: Enemy, world: World, hpFrac: number): void {
  const t = e.target!;
  if (e.phase === 1 && hpFrac <= 0.55) {
    // split into the twins
    e.phase = 2;
    e.mem.hidden = 1;
    e.invuln = 999;
    e.attack = null;
    world.bossShout(e, 'Two of me! Let\'s see you handle TWO of me!');
    world.fx.inkSplash(e.x, e.z, 40);
    const a = world.arena!;
    const t1 = world.spawnEnemyAt('smudgeTwin', a[0] + 160, 60);
    const t2 = world.spawnEnemyAt('smudgeTwin', a[1] - 160, 150);
    t1.mem.twinIndex = 0;
    t2.mem.twinIndex = 1;
    e.mem.twinsAlive = 2;
    return;
  }
  if (e.phase === 1 && hpFrac < 0.8 && !e.mem.summoned) {
    e.mem.summoned = 1;
    world.spawnEnemy('scribbler', 'left');
    world.spawnEnemy('slinger', 'right');
  }
  if (e.cooldown > 0) {
    approach(e, world, 0.6);
    return;
  }
  const n = cycle(e, 'n');
  e.faceTarget();
  if (e.phase === 3) {
    // hand-slam barrage at every hero, then the core opens up
    const step = n % 4;
    if (step === 0) {
      e.startAttack('b_wave', world);
      return;
    }
    if (step === 1 || step === 2) {
      for (const h of world.heroes) if (h.active) world.spawnHandSlam(h.x, h.z, e);
      e.cooldown = 70;
      e.mem.slams = (e.mem.slams ?? 0) + 1;
      return;
    }
    world.startInkRain(240);
    e.openT = 170;
    e.armorPts = 0;
    e.armorRegen = 200;
    e.stunT = 150;
    world.bossShout(e, 'Ugh... my core is showing!');
    e.cooldown = 160;
    return;
  }
  if (n % 3 === 0) {
    e.startAttack('b_wave', world);
  } else if (n % 3 === 1) {
    world.startInkRain(180);
    e.cooldown = 80;
  } else {
    approach(e, world, 1.2);
    if (inReach(e, 1.4)) e.startAttack('b_swipe', world);
    else e.mem.n--;
  }
  void t;
}

function smudgeHiddenTick(e: Enemy, world: World): void {
  // waiting for the twins. If one twin falls, the other must follow within 8 seconds.
  const twins = world.enemies.filter((x) => x.kind === 'smudgeTwin' && x.state !== 'dead');
  if (e.mem.reformT > 0) {
    e.mem.reformT--;
    if (twins.length === 0) {
      e.mem.reformT = 0;
      reformKing(e, world);
      return;
    }
    if (e.mem.reformT === 0) {
      // too slow: the fallen twin pulls itself back together
      const a = world.arena!;
      const tw = world.spawnEnemyAt('smudgeTwin', twins[0].x < (a[0] + a[1]) / 2 ? a[1] - 160 : a[0] + 160, world.rng.range(50, 150));
      tw.hp = Math.round(tw.maxHp * 0.5);
      world.bossShout(e, 'Ha! Too slow. Defeat us TOGETHER!');
    }
    return;
  }
  if (twins.length === 1 && e.mem.twinsAlive === 2) {
    e.mem.reformT = 480;
    world.hint('twins');
  }
  if (twins.length === 0) reformKing(e, world);
  e.mem.twinsAlive = twins.length;
}

function reformKing(e: Enemy, world: World): void {
  e.mem.hidden = 0;
  e.phase = 3;
  e.invuln = 60;
  e.hp = Math.round(e.maxHp * 0.55);
  e.armorPts = e.maxArmor;
  e.state = 'idle';
  const a = world.arena!;
  e.x = (a[0] + a[1]) / 2;
  e.z = 100;
  e.cooldown = 60;
  world.fx.inkSplash(e.x, e.z, 50);
  world.fx.shake(10);
  world.bossShout(e, 'ENOUGH! I will smudge this whole sketchbook!');
}

/** Called after damage is applied, before death is resolved. */
export function bossClampHp(e: Enemy, world: World): void {
  if (e.kind !== 'smudgeKing') return;
  if (e.phase < 3 && e.hp <= 1) e.hp = Math.max(1, Math.round(e.maxHp * 0.5));
  if (e.phase === 3 && e.hp <= 1 && !e.mem.finale) {
    e.hp = 1;
    e.mem.finale = 1;
    e.attack = null;
    e.setState('idle');
    e.invuln = 0;
    world.beginFinale(e);
  }
  if (e.mem.finale && !world.finisherActive) e.hp = Math.max(1, e.hp);
}

export function bossAttackTick(e: Enemy, world: World): void {
  const a = e.attack;
  if (!a) return;
  if (a.def.id === 'b_charge' && e.attackPhase === 'active') {
    world.fx.dust(e.x - e.facing * 30, e.z, 1);
    const arena = world.arena;
    if (arena && ((e.facing > 0 && e.x >= arena[1] - 70) || (e.facing < 0 && e.x <= arena[0] + 70))) {
      // slammed into the wall: dazed and open
      e.attack = null;
      e.setState('idle');
      e.vx = -e.facing * 3;
      e.stunT = 150;
      e.openT = 170;
      e.armorPts = 0;
      e.armorRegen = 240;
      world.fx.shake(10);
      world.sfx('clang', e.x);
      world.fx.text(e.x, e.h + 30, e.z, 'DAZED!', '#ffd23f', 1.3);
      e.cooldown = 40;
    }
  }
  if (a.def.id === 'b_chomp' && a.t === a.def.startup + a.def.active + 1) {
    e.stunT = 130;
    e.openT = 150;
    e.armorPts = 0;
    e.armorRegen = 200;
    world.fx.text(e.x, e.h + 30, e.z, 'JAW STUCK!', '#ffd23f', 1.3);
  }
  if (a.def.id === 'b_beam' && a.t === a.def.startup + a.def.active + 1 && e.phase === 2) {
    e.openT = 90;
    e.stunT = 60;
    world.fx.text(e.x, e.h + 30, e.z, 'OVERHEATED!', '#ffd23f', 1.2);
  }
  if (a.def.id === 'b_pound' && e.kind === 'bigScribbler' && e.phase === 2 && a.t === a.def.startup + a.def.active + 1) {
    e.openT = 90;
    e.stunT = 70;
  }
}

export function bossOnHit(e: Enemy, info: HitInfo, world: World): void {
  void info;
  void world;
  void e;
}
