// Renders every placed building from the architecture kit, with construction
// scaffolding, a settle-bounce when placed/upgraded, selection rings and
// in-world status bubbles (collect / progress / story).
import { Html } from '@react-three/drei';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { memo, useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { BUILDINGS } from '../../data/buildings';
import { RECIPES } from '../../data/items';
import { communityStage } from '../../game/core/actions';
import type { BuildingInstance } from '../../game/core/types';
import { finishedJobs, passiveReady } from '../../game/economy/economy';
import { footprint } from '../../game/world/grid';
import { clock } from '../../services/clock';
import { useGame } from '../../state/store';
import { Icon } from '../../ui/components/Icon';
import { archetype, constructionSite } from '../kit/archetypes';
import { buildingCenter, buildingHeight, htmlPortal, rotY, worldClock } from './coords';
import { cameraState } from '../camera/CameraRig';
import { audio } from '../../audio/AudioManager';

const NON_INTERACTIVE = new Set(['path']);

export function Buildings() {
  const buildings = useGame((s) => s.game!.buildings);
  const placingUid = useGame((s) => s.ui.placing?.uid);
  return (
    <group>
      {buildings
        .filter((b) => !NON_INTERACTIVE.has(b.type) && b.uid !== placingUid)
        .map((b) => (
          <BuildingView key={b.uid} b={b} />
        ))}
    </group>
  );
}

const BuildingView = memo(function BuildingView({ b }: { b: BuildingInstance }) {
  const flagKey = useGame((s) => Object.keys(s.game!.flags).filter((k) => s.game!.flags[k]).sort().join(','));
  const hood = useGame((s) => s.game!.profile.hoodName);
  const stage = useGame((s) => (b.type === 'fountain' ? communityStage(s.game!) : undefined));
  const selected = useGame((s) => s.ui.selected === b.uid);
  const hinted = useGame((s) => s.ui.hintUid === b.uid);
  const reduced = useGame((s) => s.game!.settings.reducedMotion);
  const group = useRef<THREE.Group>(null);
  const bounce = useRef(1);
  const [hover, setHover] = useState(false);
  const building = b.busyKind === 'build';
  const def = BUILDINGS[b.type];
  const isTree = def.archetype.startsWith('deco:tree') && !reduced;
  const phase = b.x * 1.7 + b.z * 2.3;

  const obj = useMemo(() => {
    if (building) {
      const [w, d] = def.footprint;
      return constructionSite(w, d);
    }
    const flags = Object.fromEntries(flagKey.split(',').filter(Boolean).map((k) => [k, true]));
    return archetype(def.archetype, { level: b.level, flags, hoodName: hood, stage });
  }, [building, def, b.level, flagKey, hood, stage]);

  // Small decorations receive but don't cast shadows (cheaper shadow pass).
  useEffect(() => {
    const smallDeco = def.category === 'path' || ['fence', 'flower_bed', 'rock', 'mushroom', 'bush', 'planter', 'crate'].includes(def.id);
    if (smallDeco) obj.traverse((o) => (o.castShadow = false));
  }, [obj, def]);

  // Settle bounce whenever the visual changes (placement, completion, upgrade)
  useEffect(() => {
    bounce.current = reduced ? 1 : 0;
  }, [obj, reduced]);

  const smoke = useMemo(() => {
    const anchors: THREE.Vector3[] = [];
    obj.traverse((o) => {
      if (o.name === 'smoke') anchors.push(o.position.clone());
    });
    return anchors;
  }, [obj]);

  useFrame((_, dt) => {
    const g = group.current;
    if (!g) return;
    if (bounce.current < 1) {
      bounce.current = Math.min(1, bounce.current + dt * 2.2);
      const t = bounce.current;
      const s = 1 + Math.sin(t * Math.PI * 2.5) * (1 - t) * 0.18;
      g.scale.set(1 / Math.sqrt(s), s, 1 / Math.sqrt(s));
      g.position.y = (1 - t) * 0.25 * Math.max(0, Math.cos(t * Math.PI * 1.5));
    } else if (isTree) {
      g.rotation.z = Math.sin(worldClock.t * 1.2 + phase) * 0.025;
      g.rotation.x = Math.cos(worldClock.t * 0.9 + phase) * 0.015;
    } else if (hover) {
      g.scale.setScalar(1 + Math.sin(worldClock.t * 6) * 0.004 + 0.012);
    } else g.scale.setScalar(1);
  });

  const center = buildingCenter(b);
  const [fw, fd] = footprint(b.type, b.rot);
  const isDeco = def.category === 'decoration';

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    if (e.delta > 8 || cameraState.dragging) return;
    e.stopPropagation();
    const st = useGame.getState();
    if (st.ui.placing) return;
    const now = clock.now();
    if (finishedJobs(b, now).length || passiveReady(b, now).cycles) {
      st.dispatch({ type: 'collect', uid: b.uid });
      return;
    }
    if (b.type === 'request_board') {
      st.openPanel('orders');
      return;
    }
    if (b.type === 'fountain') {
      st.openPanel('community');
      return;
    }
    audio.play('click');
    st.setUI({ selected: b.uid, panel: null });
  };

  return (
    <group position={center}>
      <group rotation={[0, rotY(b.rot), 0]}>
        <group
          ref={group}
          onClick={onClick}
          onPointerOver={(e) => {
            e.stopPropagation();
            setHover(true);
            document.body.style.cursor = 'pointer';
          }}
          onPointerOut={() => {
            setHover(false);
            document.body.style.cursor = '';
          }}
        >
          <primitive object={obj} />
        </group>
      </group>
      {selected && <SelectionRing w={fw} d={fd} />}
      {!isDeco && <ContactShadow w={fw} d={fd} />}
      {smoke.length > 0 && !building && <Smoke anchors={smoke} rot={b.rot} />}
      {b.type === 'fountain' && stage === 4 && <FountainSpray />}
      {!isDeco && b.type !== 'pond' && b.type !== 'welcome_sign' && <StatusBubble b={b} height={buildingHeight(b.type)} />}
      {hinted && (
        <Html portal={htmlPortal} position={[0, buildingHeight(b.type) + 0.9, 0]} center zIndexRange={[21, 0]}>
          <button className="hint-arrow" aria-label={`Tap ${def.name}`} onClick={() => useGame.getState().setUI({ selected: b.uid, panel: null })}>
            <Icon name="arrow" size={30} style={{ transform: 'rotate(90deg)' }} />
          </button>
        </Html>
      )}
    </group>
  );
});

function SelectionRing({ w, d }: { w: number; d: number }) {
  const ref = useRef<THREE.Mesh>(null);
  useFrame(() => {
    if (ref.current) (ref.current.material as THREE.MeshBasicMaterial).opacity = 0.55 + Math.sin(worldClock.t * 4) * 0.2;
  });
  return (
    <mesh ref={ref} rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.03, 0]}>
      <planeGeometry args={[w + 0.1, d + 0.1]} />
      <meshBasicMaterial color="#fff2a8" transparent opacity={0.6} depthWrite={false} />
    </mesh>
  );
}

const aoTex = (() => {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(32, 32, 8, 32, 32, 32);
  g.addColorStop(0, 'rgba(0,0,0,0.38)');
  g.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();

/** Soft ambient-occlusion blob grounding buildings (cheap fake AO). */
function ContactShadow({ w, d }: { w: number; d: number }) {
  return (
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.012, 0]} renderOrder={1}>
      <planeGeometry args={[w * 1.15, d * 1.15]} />
      <meshBasicMaterial map={aoTex} transparent depthWrite={false} />
    </mesh>
  );
}

const puffGeo = new THREE.SphereGeometry(0.07, 7, 5);
const puffMat = new THREE.MeshStandardMaterial({ color: '#f4f1ec', transparent: true, opacity: 0.7, roughness: 1 });

function Smoke({ anchors, rot }: { anchors: THREE.Vector3[]; rot: number }) {
  const N = 5;
  const meshes = useMemo(() => anchors.flatMap(() => Array.from({ length: N }, () => new THREE.Mesh(puffGeo, puffMat.clone()))), [anchors]);
  const g = useMemo(() => {
    const gr = new THREE.Group();
    gr.rotation.y = rotY(rot as 0);
    meshes.forEach((m) => gr.add(m));
    return gr;
  }, [meshes, rot]);
  useFrame(() => {
    const t = worldClock.t;
    meshes.forEach((m, i) => {
      const a = anchors[Math.floor(i / N)];
      const phase = ((t * 0.35 + (i % N) / N) % 1 + 1) % 1;
      m.position.set(a.x + Math.sin(phase * 5 + i) * 0.05 + phase * 0.15, a.y + phase * 0.9, a.z);
      m.scale.setScalar(0.6 + phase * 1.6);
      (m.material as THREE.MeshStandardMaterial).opacity = 0.55 * (1 - phase);
    });
  });
  return <primitive object={g} />;
}

function FountainSpray() {
  const N = 26;
  const drops = useMemo(() => Array.from({ length: N }, () => new THREE.Mesh(new THREE.SphereGeometry(0.025, 5, 4), new THREE.MeshStandardMaterial({ color: '#d6f4ff', transparent: true, opacity: 0.85 }))), []);
  const g = useMemo(() => {
    const gr = new THREE.Group();
    drops.forEach((d) => gr.add(d));
    return gr;
  }, [drops]);
  useFrame(() => {
    const t = worldClock.t;
    drops.forEach((d, i) => {
      const p = ((t * 0.7 + i / N) % 1 + 1) % 1;
      const a = (i / N) * Math.PI * 2;
      const r = p * 0.45;
      d.position.set(Math.cos(a) * r, 0.86 + p * 0.35 - p * p * 0.9, Math.sin(a) * r);
    });
  });
  return <primitive object={g} />;
}

/** Floating status above a building: ready-to-collect, timers, construction. */
function StatusBubble({ b, height }: { b: BuildingInstance; height: number }) {
  const [now, setNow] = useState(clock.now());
  useEffect(() => {
    const id = window.setInterval(() => setNow(clock.now()), 500);
    return () => window.clearInterval(id);
  }, []);
  const dispatch = useGame((s) => s.dispatch);
  const done = finishedJobs(b, now);
  const passive = passiveReady(b, now);
  let content: React.ReactNode = null;
  let ready = false;
  if (b.busyUntil !== null) {
    const total = Math.max(1, b.busyUntil - (b.busyFrom ?? b.placedAt));
    const remain = Math.max(0, b.busyUntil - now);
    const pct = 1 - remain / total;
    content = (
      <div className="bubble bubble--timer" aria-label="Under construction">
        <Icon name={b.busyKind === 'build' ? 'build' : 'upgrade'} size={18} />
        <span>{fmt(remain)}</span>
        <i style={{ width: `${pct * 100}%` }} />
      </div>
    );
  } else if (done.length || passive.cycles) {
    ready = true;
    const item = done[0] ? RECIPES[done[0].recipe].output : null;
    content = (
      <button
        className="bubble bubble--ready"
        data-building={b.type}
        aria-label="Collect"
        onClick={(e) => {
          e.stopPropagation();
          dispatch({ type: 'collect', uid: b.uid });
        }}
      >
        <Icon name={item ?? 'coin'} size={26} />
        {done.length + (passive.cycles ? 1 : 0) > 1 && <b>×{done.length + (passive.cycles && done.length ? 1 : 0)}</b>}
      </button>
    );
  } else if (b.queue.length) {
    const job = b.queue[0];
    const pct = Math.min(1, (now - job.start) / (job.end - job.start));
    content = (
      <div className="bubble bubble--work">
        <Icon name={RECIPES[job.recipe].output} size={16} />
        <i style={{ width: `${Math.max(0, pct) * 100}%` }} />
      </div>
    );
  }
  if (!content) return null;
  return (
    <Html portal={htmlPortal} position={[0, height, 0]} center zIndexRange={[20, 0]} className={ready ? 'bubble-wrap bubble-wrap--ready' : 'bubble-wrap'}>
      {content}
    </Html>
  );
}

export function fmt(ms: number) {
  const s = Math.ceil(ms / 1000);
  if (s < 60) return `${s}s`;
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ${String(s % 60).padStart(2, '0')}s`;
  return `${Math.floor(m / 60)}h ${m % 60}m`;
}
