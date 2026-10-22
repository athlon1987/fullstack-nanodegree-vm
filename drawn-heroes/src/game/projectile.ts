import { PROJECTILES } from '../data/attacks';
import type { ProjectileDef } from '../data/types';
import type { Fighter } from './fighter';

export class Projectile {
  active = false;
  def: ProjectileDef = PROJECTILES.banana;
  x = 0;
  y = 0;
  z = 0;
  vx = 0;
  vy = 0;
  vz = 0;
  team: 'hero' | 'enemy' = 'hero';
  owner: Fighter | null = null;
  life = 0;
  hit = new Set<number>();
  returning = false;
  startX = 0;
  rot = 0;
  dmgMul = 1;
  facing = 1;
  age = 0;

  reset(def: ProjectileDef, owner: Fighter, team: 'hero' | 'enemy'): void {
    this.active = true;
    this.def = def;
    this.owner = owner;
    this.team = team;
    this.life = def.life;
    this.hit.clear();
    this.returning = false;
    this.rot = 0;
    this.dmgMul = owner.dmgMul;
    this.facing = owner.facing;
    this.age = 0;
  }
}

/** Fixed-size pool so heavy fights do not churn garbage. */
export class ProjectilePool {
  items: Projectile[] = [];
  constructor(size = 64) {
    for (let i = 0; i < size; i++) this.items.push(new Projectile());
  }
  obtain(): Projectile | null {
    for (const p of this.items) if (!p.active) return p;
    return null;
  }
  clear(): void {
    for (const p of this.items) {
      p.active = false;
      p.owner = null;
    }
  }
}
