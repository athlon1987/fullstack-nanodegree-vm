// Visit snapshots: share a read-only picture of your neighbourhood's *layout* by link.
// Privacy by design — a snapshot carries only: world id, neighbourhood name, level, building
// positions/levels and which residents live there. Never coins, inventory, player name,
// avatar, stats, history, timestamps, settings or anything that identifies a device.
// Incoming codes are untrusted: size-capped, decoded without eval, schema-validated.
import { createNewGame } from '../game/core/newGame';
import type { BuildingInstance, GameState, Rotation } from '../game/core/types';
import { safeParse } from '../platform/content/loader';
import { arr, ID, lit, num, obj, opt, run, str } from '../platform/validate';

export const VISIT_PARAM = 'visit';
const MAX_CODE = 12_000;

const int = (min: number, max: number) => num({ min, max, int: true });
const visitSchema = obj({
  v: lit(1),
  w: ID,
  n: str({ min: 1, max: 32 }),
  l: int(1, 99),
  b: arr(arr(num({ min: -1, max: 99, int: true }), { min: 5, max: 5 }), { max: 600 }),
  t: arr(ID, { max: 80 }),
  r: opt(arr(ID, { max: 32 })),
});

export interface VisitSnapshot {
  v: 1;
  w: string;
  n: string;
  l: number;
  /** [typeIndex, x, z, rot, level] */
  b: number[][];
  /** Building type table. */
  t: string[];
  r?: string[];
}

const b64url = (bytes: Uint8Array) => btoa(String.fromCharCode(...bytes)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
const fromB64url = (s: string) => Uint8Array.from(atob(s.replace(/-/g, '+').replace(/_/g, '/')), (c) => c.charCodeAt(0));

export function encodeVisit(s: GameState): string {
  const types = [...new Set(s.buildings.map((b) => b.type))];
  const snap: VisitSnapshot = {
    v: 1,
    w: s.world.id,
    n: s.profile.hoodName.slice(0, 32),
    l: s.level,
    t: types,
    b: s.buildings.slice(0, 600).map((b) => [types.indexOf(b.type), b.x, b.z, b.rot, b.busyKind === 'build' ? 0 : b.level]),
    r: s.residents.map((r) => r.id).slice(0, 32),
  };
  return b64url(new TextEncoder().encode(JSON.stringify(snap)));
}

export function decodeVisit(code: string | null | undefined): VisitSnapshot | null {
  if (!code || code.length > MAX_CODE || !/^[A-Za-z0-9_-]+$/.test(code)) return null;
  try {
    const parsed = run(visitSchema, safeParse(new TextDecoder().decode(fromB64url(code))));
    if (!parsed.ok) return null;
    const v = parsed.value as VisitSnapshot;
    if (v.b.some((e) => e[0] < 0 || e[0] >= v.t.length || e[1] < 0 || e[1] > 23 || e[2] < 0 || e[2] > 23 || e[3] < 0 || e[3] > 3 || e[4] < 0 || e[4] > 9)) return null;
    return v;
  } catch {
    return null;
  }
}

/** A throwaway, read-only game state for rendering a visit (never saved). */
export function visitState(v: VisitSnapshot, now: number): GameState {
  const base = createNewGame(now, 1);
  let uid = 0;
  const buildings: BuildingInstance[] = v.b.map(([ti, x, z, rot, level]) => ({
    uid: `v${++uid}`,
    type: v.t[ti],
    x,
    z,
    rot: rot as Rotation,
    level: Math.max(1, level),
    busyUntil: null,
    busyKind: null,
    queue: [],
    passiveSince: now,
    placedAt: now,
  }));
  const plots = new Set(base.plots);
  for (const b of buildings) plots.add(`p${Math.floor(b.x / 6)}${Math.floor(b.z / 6)}`);
  return {
    ...base,
    level: v.l,
    buildings,
    plots: [...plots],
    profile: { ...base.profile, hoodName: v.n, name: '' },
    residents: (v.r ?? []).map((id) => ({ id, arrivedAt: now, friendship: 0, memories: {}, lastTalkDay: null, lastGiftDay: null, storyDone: [], storyActive: null })),
    tutorial: { step: 0, done: true, skipped: true },
    world: { id: v.w, country: base.world.country },
    history: [],
  };
}

export function visitLink(code: string): string {
  const u = new URL(location.href);
  u.search = '';
  u.hash = '';
  u.searchParams.set(VISIT_PARAM, code);
  return u.toString();
}
