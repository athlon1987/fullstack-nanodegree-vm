// Residents and pets: autonomous daily routines on the navigation grid.
import { Html } from '@react-three/drei';
import { PETS, type PetDef } from '../../data/pets';
import { L } from '../../platform/content/install';
import { getLang, t } from '../../platform/i18n';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { BUILDINGS } from '../../data/buildings';
import { RESIDENTS, rdef } from '../../data/residents';
import { activeChapter, eligibleChapter } from '../../game/characters/relationships';
import { hashString, rng } from '../../game/core/rng';
import type { BuildingInstance, DayPhase, GameState, ResidentState } from '../../game/core/types';
import { buildNavGrid, findPath, nearestWalkable, walkable, type NavGrid } from '../../game/navigation/pathfinding';
import { doorCell } from '../../game/world/grid';
import { phaseOf } from '../../services/clock';
import { useGame } from '../../state/store';
import { audio } from '../../audio/AudioManager';
import { cameraState } from '../camera/CameraRig';
import { HALF, htmlPortal, worldClock } from '../scene/coords';
import { Actor, type AnimState } from './Actor';
import { SPOTS } from '../../data/spots';

const CHAR_HEIGHT = 0.62;
const WALK_SPEED = 0.95;

type Activity = { anim: AnimState; hidden?: boolean; face?: number; duration: number; emote?: EmoteKind };

interface Brain {
  id: string;
  actor: Actor;
  pos: THREE.Vector2;
  path: THREE.Vector2[];
  heading: number;
  mode: 'idle' | 'walk' | 'activity' | 'inside' | 'chat' | 'greet';
  timer: number;
  activity: Activity | null;
  chatWith: string | null;
  r: () => number;
  hiddenAmount: number;
  /** A small speech/emote bubble over the head (♥ ♪ ! …). */
  emote: { sprite: THREE.Sprite; until: number } | null;
  /** Seconds before this neighbour waves at a passer-by again. */
  greetCooldown: number;
}

// ─── Emote bubbles ───────────────────────────────────────────────────────────

type EmoteKind = 'heart' | 'note' | 'wave' | 'star' | 'chat';
const EMOTE_GLYPH: Record<EmoteKind, [string, string]> = { heart: ['♥', '#e0413a'], note: ['♪', '#3f6fa8'], wave: ['☺', '#2f7d6b'], star: ['★', '#e9a400'], chat: ['…', '#5b4636'] };
const emoteMats = new Map<EmoteKind, THREE.SpriteMaterial>();
function emoteMaterial(kind: EmoteKind) {
  let m = emoteMats.get(kind);
  if (m) return m;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d')!;
  g.fillStyle = '#fffaf0';
  g.strokeStyle = 'rgba(60,40,20,0.35)';
  g.lineWidth = 3;
  g.beginPath();
  g.arc(32, 28, 24, 0, Math.PI * 2);
  g.moveTo(26, 50);
  g.lineTo(32, 62);
  g.lineTo(38, 50);
  g.fill();
  g.stroke();
  const [glyph, color] = EMOTE_GLYPH[kind];
  g.fillStyle = color;
  g.font = 'bold 30px sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(glyph, 32, 29);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  m = new THREE.SpriteMaterial({ map: tex, depthWrite: false, transparent: true });
  emoteMats.set(kind, m);
  return m;
}
function showEmote(b: Brain, kind: EmoteKind, seconds = 2) {
  if (useGame.getState().game?.settings.zen) return;
  if (!b.emote) {
    const sprite = new THREE.Sprite(emoteMaterial(kind));
    sprite.scale.setScalar(0.24);
    sprite.position.set(0, CHAR_HEIGHT + 0.22, 0);
    sprite.renderOrder = 5;
    b.actor.root.add(sprite);
    b.emote = { sprite, until: 0 };
  }
  b.emote.sprite.material = emoteMaterial(kind);
  b.emote.sprite.visible = true;
  b.emote.until = performance.now() + seconds * 1000;
}

const cellToWorld = (x: number, z: number) => new THREE.Vector2(x - HALF + 0.5, z - HALF + 0.5);
const worldToCell = (v: THREE.Vector2): [number, number] => [Math.floor(v.x + HALF), Math.floor(v.y + HALF)];

function operational(s: GameState, type: string) {
  return s.buildings.filter((b) => b.type === type && b.busyKind !== 'build');
}

/** Choose the next destination + activity from the resident's schedule. */
function plan(s: GameState, b: Brain, phase: DayPhase, nav: NavGrid): { cell: [number, number]; act: Activity } | null {
  const def = rdef(b.id);
  const work = def.workplace ? operational(s, def.workplace)[0] : undefined;
  const homes = [...operational(s, 'cottage'), ...operational(s, 'townhouse'), ...operational(s, 'starter_house')];
  const home = homes[hashString(b.id) % homes.length];
  const door = (x?: BuildingInstance) => (x ? (nearestWalkable(nav, ...doorCell(x)) ?? null) : null);
  const benches = s.buildings.filter((x) => x.type === 'bench');
  const spots: { cell: [number, number] | null; act: Activity; w: number }[] = [];
  const favorite = def.favoritePlace === 'pond' ? s.buildings.find((x) => x.type === 'pond') : def.favoritePlace === 'park' ? operational(s, 'park')[0] : operational(s, def.favoritePlace)[0];
  const randomCell = (): [number, number] | null => {
    for (let i = 0; i < 20; i++) {
      const x = 6 + Math.floor(b.r() * 12);
      const z = 6 + Math.floor(b.r() * 12);
      if (walkable(nav, x, z)) return [x, z];
    }
    return null;
  };
  const plaza = nearestWalkable(nav, 12, 12);
  if (phase === 'night') spots.push({ cell: home ? door(home) : nearestWalkable(nav, 0, 18), act: { anim: 'idle', hidden: true, duration: 40 }, w: 10 });
  if (work && phase !== 'night') spots.push({ cell: door(work), act: { anim: 'work', duration: 9 + b.r() * 8 }, w: phase === 'morning' ? 6 : phase === 'day' ? 4 : 1 });
  if (favorite) spots.push({ cell: door(favorite), act: { anim: 'idle', duration: 6 + b.r() * 6 }, w: phase === 'evening' ? 4 : 2 });
  if (benches.length) {
    const bench = benches[Math.floor(b.r() * benches.length)];
    spots.push({ cell: [bench.x, bench.z + (bench.rot === 2 ? -1 : 1)], act: { anim: 'sit', duration: 8 + b.r() * 6, face: bench.rot === 2 ? Math.PI : 0 }, w: 2 });
  }
  spots.push({ cell: plaza, act: { anim: 'idle', duration: 4 + b.r() * 4 }, w: phase === 'evening' ? 3 : 1.5 });
  const day = phase !== 'night';
  // A celebration nearby: everyone drifts over to cheer.
  const gather = useGame.getState().ui.gather;
  if (gather && gather.until > Date.now() && day) {
    const c = nearestWalkable(nav, gather.x + Math.floor(b.r() * 3) - 1, gather.z + Math.floor(b.r() * 3) - 1);
    spots.push({ cell: c, act: { anim: b.r() < 0.5 ? 'celebrate' : 'happy', duration: 5 + b.r() * 4, emote: 'star' }, w: 14 });
  }
  // Gather at the café for a drink and a chat.
  const cafe = [...operational(s, 'cafe'), ...operational(s, 'bakery')][Math.floor(b.r() * 2)];
  if (cafe && day && def.workplace !== cafe.type) spots.push({ cell: door(cafe), act: { anim: 'eat', duration: 5 + b.r() * 5, emote: 'note' }, w: phase === 'morning' ? 3 : 1.5 });
  // Visit a shop.
  const shops = s.buildings.filter((x) => ['grocery', 'flower_shop', 'showroom', 'learning_centre'].includes(x.type) && x.busyKind !== 'build');
  if (shops.length && day) spots.push({ cell: door(shops[Math.floor(b.r() * shops.length)]), act: { anim: 'idle', duration: 3 + b.r() * 3 }, w: 1.2 });
  // Shared spots: relax in finished ones, lend a hand at ones in progress.
  for (const spot of SPOTS) {
    const st = s.spots?.[spot.id];
    const sb = s.buildings.find((x) => x.type === spot.building);
    if (!st || !sb || !day) continue;
    const [w, d] = BUILDINGS[spot.building].footprint;
    const inside: [number, number] = [sb.x + Math.floor(b.r() * w), sb.z + Math.floor(b.r() * d)];
    if (st.stage >= 2) spots.push({ cell: inside, act: { anim: st.stage >= 3 && b.r() < 0.6 ? 'sit' : 'happy', duration: 6 + b.r() * 6, emote: 'note' }, w: phase === 'evening' ? 3.5 : 1.8 });
    else if (st.stage >= 1 || st.given && Object.keys(st.given).length) spots.push({ cell: inside, act: { anim: b.r() < 0.5 ? 'crouch' : 'work', duration: 6 + b.r() * 4 }, w: 1.2 });
  }
  // Admire something new: decorations placed in the last minute and a half.
  const fresh = s.buildings.filter((x) => BUILDINGS[x.type]?.category === 'decoration' && Date.now() - x.placedAt < 90_000);
  if (fresh.length && day) {
    const f = fresh[Math.floor(b.r() * fresh.length)];
    spots.push({ cell: nearestWalkable(nav, f.x, f.z + 1), act: { anim: 'happy', duration: 3 + b.r() * 2, emote: 'heart' }, w: 5 });
  }
  spots.push({ cell: randomCell(), act: { anim: b.r() < 0.5 ? 'idle' : 'happy', duration: 3 + b.r() * 4 }, w: 2 });
  const valid = spots.filter((x) => x.cell && walkable(nav, x.cell[0], x.cell[1]));
  if (!valid.length) return null;
  const total = valid.reduce((a, x) => a + x.w, 0);
  let pick = b.r() * total;
  for (const v of valid) {
    pick -= v.w;
    if (pick <= 0) return { cell: v.cell!, act: v.act };
  }
  return { cell: valid[0].cell!, act: valid[0].act };
}

export function Residents() {
  // Residents whose content isn't installed (e.g. a world pack is unavailable) stay in the save but aren't drawn.
  const allResidents = useGame((s) => s.game!.residents);
  const rev = useGame((s) => s.contentRev);
  const residents = useMemo(() => allResidents.filter((r) => RESIDENTS[r.id]), [allResidents, rev]);
  const buildings = useGame((s) => s.game!.buildings);
  const plots = useGame((s) => s.game!.plots);
  const nav = useMemo(() => buildNavGrid({ buildings, plots }), [buildings, plots]);
  const navRef = useRef(nav);
  navRef.current = nav;
  const brains = useRef(new Map<string, Brain>());
  const group = useMemo(() => new THREE.Group(), []);

  // Create brains for arrived residents (new arrivals walk in from the street).
  useEffect(() => {
    for (const r of residents) {
      if (brains.current.has(r.id)) continue;
      const def = rdef(r.id);
      const actor = new Actor(def.model, CHAR_HEIGHT, 'humanoid');
      actor.root.userData.resident = r.id;
      const fresh = Date.now() - r.arrivedAt < 60_000;
      const s = useGame.getState().game!;
      const work = def.workplace ? operational(s, def.workplace)[0] : undefined;
      const start = fresh ? ([0, 18] as [number, number]) : work ? (nearestWalkable(nav, ...doorCell(work)) ?? [12, 13]) : (nearestWalkable(nav, 12 + (hashString(r.id) % 4), 13) ?? [12, 13]);
      const pos = cellToWorld(...(walkable(nav, ...start) ? start : (nearestWalkable(nav, ...start) ?? [12, 13])));
      const brain: Brain = { id: r.id, actor, pos, path: [], heading: 0, mode: 'idle', timer: 0.5 + Math.random(), activity: null, chatWith: null, r: rng(hashString(r.id) ^ Date.now()), hiddenAmount: 0, emote: null, greetCooldown: 3 };
      brains.current.set(r.id, brain);
      residentIndex.set(r.id, actor.root);
      group.add(actor.root);
    }
  }, [residents, nav, group]);

  // Re-path anyone whose route got blocked by a new building.
  useEffect(() => {
    for (const b of brains.current.values()) {
      if (b.path.some((p) => !walkable(nav, ...worldToCell(p)))) {
        b.path = [];
        b.mode = 'idle';
        b.timer = 0.2;
      }
      const c = worldToCell(b.pos);
      if (!walkable(nav, ...c)) {
        const n = nearestWalkable(nav, ...c);
        if (n) b.pos.copy(cellToWorld(...n));
      }
    }
  }, [nav]);

  useFrame((_, rawDt) => {
    // Movement is capped per frame (no teleporting after a stall); timers use real time.
    const dt = Math.min(rawDt, 0.25);
    const s = useGame.getState().game!;
    const phase = phaseOf(worldClock.hour);
    const all = [...brains.current.values()];
    for (const b of all) {
      b.timer -= Math.min(rawDt, 2);
      if (b.mode === 'walk') {
        const target = b.path[0];
        if (!target) {
          arrive(b);
        } else {
          const d = target.clone().sub(b.pos);
          const len = d.length();
          const step = WALK_SPEED * dt;
          if (len <= step) {
            b.pos.copy(target);
            b.path.shift();
          } else b.pos.addScaledVector(d.normalize(), step);
          if (len > 0.001) b.heading = turn(b.heading, Math.atan2(d.x, d.y), dt * 10);
          b.actor.play('walk', 0.2, 1.1);
          // Neighbours stop to chat now and then — and always wave when they pass each other.
          b.greetCooldown -= dt;
          if (phase !== 'night') {
            const other = all.find((o) => o !== b && (o.mode === 'walk' || o.mode === 'idle') && o.pos.distanceTo(b.pos) < 1.1);
            if (other && b.r() < dt * 0.15) startChat(b, other);
            else if (other && b.greetCooldown <= 0 && other.greetCooldown <= 0) {
              for (const x of [b, other]) {
                x.greetCooldown = 25;
                x.actor.play('wave', 0.15);
                showEmote(x, 'wave', 1.4);
              }
            }
          }
        }
      } else if (b.mode === 'activity' || b.mode === 'chat' || b.mode === 'greet') {
        if (b.activity) b.actor.play(b.activity.anim, 0.3, b.activity.anim === 'talk' ? 0.6 : 1);
        if (b.chatWith) {
          const o = brains.current.get(b.chatWith);
          if (o) b.heading = turn(b.heading, Math.atan2(o.pos.x - b.pos.x, o.pos.y - b.pos.y), dt * 6);
        } else if (b.activity?.face !== undefined) b.heading = turn(b.heading, b.activity.face, dt * 6);
        if (b.timer <= 0) {
          b.mode = 'idle';
          b.chatWith = null;
          b.timer = 0.4 + b.r() * 1.2;
        }
      } else if (b.mode === 'inside') {
        if (b.timer <= 0 && phase !== 'night') {
          b.mode = 'idle';
          b.timer = 0.1;
        }
      } else if (b.mode === 'idle') {
        if (!b.actor.busyOneShot) b.actor.play('idle');
        if (b.timer <= 0) {
          const p = plan(s, b, phase, navRef.current);
          const from = worldToCell(b.pos);
          const path = p ? findPath(navRef.current, from[0], from[1], p.cell[0], p.cell[1]) : null;
          if (p && path && path.length > 1) {
            b.path = path.slice(1).map(([x, z]) => cellToWorld(x, z).add(new THREE.Vector2((b.r() - 0.5) * 0.3, (b.r() - 0.5) * 0.3)));
            b.activity = p.act;
            b.mode = 'walk';
          } else if (p) {
            b.activity = p.act;
            arrive(b);
          } else b.timer = 2;
        }
      }
      // Fade in/out when entering buildings at night
      const hidden = b.mode === 'inside';
      b.hiddenAmount = THREE.MathUtils.clamp(b.hiddenAmount + (hidden ? dt * 2 : -dt * 2), 0, 1);
      b.actor.root.visible = b.hiddenAmount < 0.99;
      b.actor.root.scale.setScalar(1 - b.hiddenAmount * 0.6);
      b.actor.root.position.set(b.pos.x, 0.04, b.pos.y);
      b.actor.root.rotation.y = b.heading;
      if (b.emote && b.emote.sprite.visible) {
        const left = b.emote.until - performance.now();
        b.emote.sprite.visible = left > 0;
        b.emote.sprite.position.y = CHAR_HEIGHT + 0.22 + Math.min(0.05, (2000 - Math.min(2000, left)) / 40000);
      }
      b.actor.update(dt);
    }
  });

  function arrive(b: Brain) {
    const act = b.activity ?? { anim: 'idle' as AnimState, duration: 3 };
    if (act.emote && b.r() < 0.7) showEmote(b, act.emote, 2.2);
    b.timer = act.duration;
    b.mode = act.hidden ? 'inside' : 'activity';
    if (act.anim === 'work') b.activity = { ...act, anim: rdef(b.id).workAction === 'interact' ? 'work' : rdef(b.id).workAction === 'pick-up' ? 'eat' : rdef(b.id).workAction === 'crouch' ? 'crouch' : 'talk', face: Math.PI };
  }

  function startChat(a: Brain, o: Brain) {
    for (const [x, y] of [
      [a, o],
      [o, a],
    ] as const) {
      x.mode = 'chat';
      x.chatWith = y.id;
      x.timer = 3 + a.r() * 2;
      x.path = [];
      x.activity = { anim: 'talk', duration: x.timer };
    }
    showEmote(a, 'chat', 2);
  }

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 8 || cameraState.dragging) return;
    let o: THREE.Object3D | null = e.object;
    while (o && !o.userData.resident) o = o.parent;
    if (!o) return;
    e.stopPropagation();
    const id = o.userData.resident as string;
    const b = brains.current.get(id);
    if (b) {
      b.mode = 'greet';
      b.path = [];
      b.timer = 4;
      b.activity = { anim: 'wave', duration: 4, face: Math.PI / 4 };
      b.actor.play('wave');
    }
    audio.play('pop');
    useGame.getState().setUI({ resident: id, selected: null });
  };

  return (
    <group>
      <primitive object={group} onClick={onClick} />
      {residents.map((r) => (
        <StoryMarker key={r.id} r={r} brains={brains} />
      ))}
    </group>
  );
}

function turn(cur: number, target: number, k: number) {
  let d = target - cur;
  while (d > Math.PI) d -= Math.PI * 2;
  while (d < -Math.PI) d += Math.PI * 2;
  return cur + d * Math.min(1, k);
}

/** "!" when a resident has a new story chapter; "…" when you can hand items over. */
function StoryMarker({ r, brains }: { r: ResidentState; brains: React.MutableRefObject<Map<string, Brain>> }) {
  const game = useGame((s) => s.game!);
  const ref = useRef<THREE.Group>(null);
  const eligible = eligibleChapter(game, r);
  const active = activeChapter(r);
  const zen = game.settings.zen;
  useFrame(() => {
    const b = brains.current.get(r.id);
    if (ref.current && b) {
      ref.current.position.set(b.pos.x, 0.95 + Math.sin(worldClock.t * 3) * 0.04, b.pos.y);
      ref.current.visible = b.mode !== 'inside';
    }
  });
  if ((!eligible && !active) || zen || !RESIDENTS[r.id]) return null;
  return (
    <group ref={ref}>
      <Html portal={htmlPortal} center zIndexRange={[19, 0]}>
        <button
          className={`story-marker ${eligible ? 'story-marker--new' : ''}`}
          aria-label={t('world.hasStory', { name: rdef(r.id).name })}
          onClick={() => useGame.getState().setUI({ resident: r.id })}
        >
          {eligible ? '!' : '…'}
        </button>
      </Html>
    </group>
  );
}

// ─── Pets ────────────────────────────────────────────────────────────────────

/** Renderer view of a pet: the data definition plus who it follows in this world. */
type PetView = PetDef & { follow?: string; label: string };
const petView = (p: PetDef): PetView => ({ ...p, follow: p.followWorkerOf ? BUILDINGS[p.followWorkerOf]?.resident : undefined, label: L(p.name, getLang()) });

export function Pets() {
  const buildings = useGame((s) => s.game!.buildings);
  const plots = useGame((s) => s.game!.plots);
  const nav = useMemo(() => buildNavGrid({ buildings, plots }), [buildings, plots]);
  const rev = useGame((s) => s.contentRev);
  const pets = useMemo(() => PETS.filter((p) => !p.requires || buildings.some((b) => b.type === p.requires && b.busyKind !== 'build')).map(petView), [buildings, rev]);
  return (
    <group>
      {pets.map((p) => (
        <Pet key={p.id} def={p} nav={nav} />
      ))}
    </group>
  );
}

function Pet({ def, nav }: { def: PetView; nav: NavGrid }) {
  const actor = useMemo(() => new Actor(def.model, def.height, 'animal'), [def]);
  const st = useRef({ pos: new THREE.Vector2(0, 2), path: [] as THREE.Vector2[], heading: 0, timer: 1, mode: 'idle' as 'idle' | 'walk' | 'rest' | 'play', r: rng(hashString(def.id)) });
  const navRef = useRef(nav);
  navRef.current = nav;
  useEffect(() => {
    const s = useGame.getState().game!;
    const anchor = s.buildings.find((b) => b.type === (def.home ?? 'starter_house'));
    const c = anchor ? nearestWalkable(nav, ...doorCell(anchor)) : null;
    if (c) st.current.pos.copy(cellToWorld(...c)).add(new THREE.Vector2(0.3, 0.2));
    actor.root.userData.pet = def.id;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  useFrame((_, rawDt) => {
    const dt = Math.min(rawDt, 0.25);
    const p = st.current;
    p.timer -= Math.min(rawDt, 2);
    if (p.mode === 'walk') {
      const t = p.path[0];
      if (!t) {
        p.mode = p.r() < 0.4 ? 'rest' : 'idle';
        p.timer = 3 + p.r() * 5;
      } else {
        const d = t.clone().sub(p.pos);
        const len = d.length();
        const speed = def.follow ? 1.0 : 0.6;
        if (len <= speed * dt) {
          p.pos.copy(t);
          p.path.shift();
        } else p.pos.addScaledVector(d.normalize(), speed * dt);
        p.heading = turn(p.heading, Math.atan2(d.x, d.y), dt * 8);
        actor.play(def.follow && len > 0.5 ? 'run' : 'walk');
      }
    } else {
      if (p.mode !== 'play') actor.play(p.mode === 'rest' ? 'sit' : 'idle');
      if (p.timer <= 0) {
        const s = useGame.getState().game!;
        let goal: [number, number] | null = null;
        if (def.follow) {
          const owner = s.residents.find((r) => r.id === def.follow);
          const ownerObj = owner && findResidentWorld(def.follow);
          if (ownerObj) goal = nearestWalkable(navRef.current, ...worldToCell(new THREE.Vector2(ownerObj.x + 0.4, ownerObj.z + 0.3)));
        }
        if (!goal) {
          const anchor = s.buildings.find((b) => b.type === (def.home ?? 'starter_house'));
          const [ax, az] = anchor ? doorCell(anchor) : [12, 13];
          goal = nearestWalkable(navRef.current, ax + Math.floor((p.r() - 0.5) * 6), az + Math.floor((p.r() - 0.5) * 4));
        }
        const from = worldToCell(p.pos);
        const path = goal ? findPath(navRef.current, from[0], from[1], goal[0], goal[1], 1500) : null;
        if (path && path.length > 1) {
          p.path = path.slice(1).map(([x, z]) => cellToWorld(x, z).add(new THREE.Vector2((p.r() - 0.5) * 0.4, (p.r() - 0.5) * 0.4)));
          p.mode = 'walk';
        } else p.timer = def.follow ? 1 : 3;
      }
    }
    actor.root.position.set(p.pos.x, 0.03, p.pos.y);
    actor.root.rotation.y = p.heading;
    actor.update(dt);
  });
  return (
    <primitive
      object={actor.root}
      onClick={(e: ThreeEvent<MouseEvent>) => {
        if (e.delta > 8 || cameraState.dragging) return;
        e.stopPropagation();
        st.current.mode = 'play';
        st.current.timer = 2.5;
        st.current.path = [];
        actor.play('celebrate');
        audio.play('pop');
        useGame.getState().toast({ icon: 'heart', title: t('world.petLoves', { name: def.label }), tone: 'story' });
      }}
    />
  );
}

/** Lookup for pets that follow residents (shared through the scene graph). */
function findResidentWorld(id: string): { x: number; z: number } | null {
  let found: { x: number; z: number } | null = null;
  residentIndex.forEach((obj, key) => {
    if (key === id) found = { x: obj.position.x, z: obj.position.z };
  });
  return found;
}
export const residentIndex = new Map<string, THREE.Object3D>();

export const isFixedBuilding = (t: string) => BUILDINGS[t]?.category === 'landmark';
