import type { CrateDef, HazardDef, PlatformDef } from '../data/types';

export interface Platform extends PlatformDef {}

export interface Crate {
  x: number;
  z: number;
  y: number;
  hp: number;
  drop: CrateDef['drop'];
  pencilIndex: number;
  broken: boolean;
  shakeT: number;
}

export type PickupKind = 'health' | 'ink' | 'meter' | 'pencil';

export interface Pickup {
  kind: PickupKind;
  x: number;
  y: number;
  z: number;
  vy: number;
  vx: number;
  vz: number;
  value: number;
  pencilIndex: number;
  ghost: boolean; // pencil already collected in a previous run
  floatY: number;
  active: boolean;
  age: number;
}

export interface Plate {
  x: number;
  z: number;
  pressed: boolean;
}

export interface Gate {
  x: number;
  open: boolean;
  openT: number;
  plates: Plate[];
}

export type HazardPhase = 'idle' | 'warn' | 'active' | 'rest';

export interface HazardState {
  def: HazardDef;
  phase: HazardPhase;
  t: number;
  /** current x of a moving element (roller, car) */
  px: number;
  pz: number;
  hitCooldown: Map<number, number>;
}

export interface HandSlam {
  x: number;
  z: number;
  t: number;
  damage: number;
  done: boolean;
}

export function hazardBounds(h: HazardDef): [number, number] {
  switch (h.type) {
    case 'spikes':
    case 'press':
    case 'conveyor':
      return [h.x, h.x + h.w];
    case 'vent':
      return [h.x - 40, h.x + 40];
    case 'roller':
    case 'car':
    case 'inkRain':
      return [h.x0, h.x1];
  }
}

export const PRESS_WARN = 50;
export const PRESS_ACTIVE = 10;
export const VENT_WARN = 40;
export const VENT_ACTIVE = 55;
export const ROLLER_WARN = 60;
export const CAR_WARN = 70;
export const HAND_WARN = 52;
