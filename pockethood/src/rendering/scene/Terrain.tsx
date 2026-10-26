// The miniature-diorama landscape: island block, owned/locked land, sea,
// main street with traffic, cobbled paths, grass tufts and wildflowers.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { EXPANSIONS, PLOT_SIZE, WORLD_CELLS } from '../../data/progression';
import { rng } from '../../game/core/rng';
import { occupancy, key, ROAD_ROWS, plotOf } from '../../game/world/grid';
import { useGame } from '../../state/store';
import { mat, P, TEX } from '../kit/materials';
import { model } from '../models/assets';
import { bake } from '../kit/parts';
import { HALF, worldClock } from './coords';
import { plotUnlockable } from '../../game/core/actions';

const ISLAND_DEPTH = 1.6;

function Island() {
  const sideMat = useMemo(() => {
    const c = document.createElement('canvas');
    c.width = 64;
    c.height = 256;
    const ctx = c.getContext('2d')!;
    const bands = ['#7fbf5a', '#b98559', '#a8774f', '#c19066', '#8f6143', '#9d7050', '#7e573c'];
    const hs = [14, 40, 34, 46, 40, 44, 38];
    let y = 0;
    bands.forEach((b, i) => {
      ctx.fillStyle = b;
      ctx.fillRect(0, y, 64, hs[i]);
      y += hs[i];
    });
    for (let i = 0; i < 90; i++) {
      ctx.fillStyle = `rgba(60,40,25,${0.15 + Math.random() * 0.2})`;
      ctx.beginPath();
      ctx.arc(Math.random() * 64, 20 + Math.random() * 230, 1 + Math.random() * 3, 0, Math.PI * 2);
      ctx.fill();
    }
    const t = new THREE.CanvasTexture(c);
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    t.repeat.set(12, 1);
    return new THREE.MeshStandardMaterial({ map: t, roughness: 0.95 });
  }, []);
  return (
    <group>
      <mesh position={[0, -ISLAND_DEPTH / 2 - 0.02, 0]} material={sideMat} receiveShadow>
        <boxGeometry args={[WORLD_CELLS + 0.6, ISLAND_DEPTH, WORLD_CELLS + 0.6]} />
      </mesh>
      {/* Grass lip overhanging the earth, like a hand-built diorama */}
      <mesh position={[0, -0.06, 0]} receiveShadow>
        <boxGeometry args={[WORLD_CELLS + 0.8, 0.1, WORLD_CELLS + 0.8]} />
        <meshStandardMaterial color={P.grassDark} roughness={0.95} />
      </mesh>
    </group>
  );
}

function Sea() {
  const foam = useRef<THREE.Mesh>(null);
  const water = useRef<THREE.MeshStandardMaterial>(null);
  useFrame(() => {
    const t = worldClock.t;
    if (foam.current) {
      const s = 1 + Math.sin(t * 0.8) * 0.006;
      foam.current.scale.set(s, s, 1);
    }
    if (water.current) water.current.color.set(worldClock.night > 0.5 ? '#2c5a7a' : P.water);
  });
  return (
    <group position={[0, -1.15, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow>
        <circleGeometry args={[90, 64]} />
        <meshStandardMaterial ref={water} color={P.water} roughness={0.25} metalness={0.05} />
      </mesh>
      <mesh ref={foam} rotation={[-Math.PI / 2, 0, Math.PI / 4]} position={[0, 0.02, 0]}>
        <ringGeometry args={[17.3, 18.6, 4, 1]} />
        <meshBasicMaterial color="#eafcff" transparent opacity={0.55} />
      </mesh>
    </group>
  );
}

/** Ground: one plane with per-vertex colour for owned vs locked land and subtle noise. */
function Ground() {
  const plots = useGame((s) => s.game!.plots);
  const geo = useMemo(() => {
    const seg = WORLD_CELLS * 2;
    const g = new THREE.PlaneGeometry(WORLD_CELLS, WORLD_CELLS, seg, seg);
    g.rotateX(-Math.PI / 2);
    const pos = g.attributes.position;
    const colors = new Float32Array(pos.count * 3);
    const grass = new THREE.Color(P.grass);
    const grassDark = new THREE.Color(P.grassDark);
    const locked = new THREE.Color(P.grassLocked);
    const c = new THREE.Color();
    const r = rng(99);
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i) + HALF;
      const z = pos.getZ(i) + HALF;
      const owned = plots.includes(plotOf(Math.min(23, Math.floor(x)), Math.min(23, Math.floor(z))));
      const n = (Math.sin(x * 0.9) * Math.cos(z * 0.7) + Math.sin(x * 2.3 + z * 1.7) * 0.5) * 0.5 + 0.5;
      c.copy(owned ? grass : locked).lerp(grassDark, n * 0.35 + r() * 0.06);
      colors.set([c.r, c.g, c.b], i * 3);
    }
    g.setAttribute('color', new THREE.BufferAttribute(colors, 3));
    return g;
  }, [plots]);
  return (
    <mesh geometry={geo} receiveShadow name="ground">
      <meshStandardMaterial vertexColors roughness={0.95} />
    </mesh>
  );
}

/** Plot borders: a soft hedge line around owned land so expansion edges read clearly. */
function PlotEdges() {
  const plots = useGame((s) => s.game!.plots);
  const level = useGame((s) => s.game!.level);
  const game = useGame((s) => s.game!);
  const openPanel = useGame((s) => s.openPanel);
  const signs = EXPANSIONS.filter((e) => plotUnlockable(game, e.id) && level >= e.minLevel);
  const hint = EXPANSIONS.filter((e) => plotUnlockable(game, e.id) && level < e.minLevel);
  return (
    <group>
      {[...signs, ...hint].map((e) => {
        const [x, z, w, d] = e.rect;
        const cx = x + w / 2 - HALF;
        const cz = z + d / 2 - HALF;
        const active = level >= e.minLevel;
        return (
          <group
            key={e.id}
            position={[cx, 0, cz]}
            onClick={(ev) => {
              if (ev.delta > 8) return;
              ev.stopPropagation();
              openPanel('expand');
            }}
          >
            <mesh position={[0, 0.45, 0]} castShadow>
              <boxGeometry args={[0.06, 0.9, 0.06]} />
              <meshStandardMaterial color={P.woodDark} />
            </mesh>
            <mesh position={[0, 0.82, 0.04]} castShadow>
              <boxGeometry args={[0.7, 0.36, 0.05]} />
              <meshStandardMaterial color={active ? P.ivory : '#d8d2c4'} />
            </mesh>
            <mesh position={[0, 0.82, 0.07]}>
              <planeGeometry args={[0.6, 0.26]} />
              <meshStandardMaterial map={saleTexture(active)} transparent />
            </mesh>
          </group>
        );
      })}
      {plots.length > 0 && null}
    </group>
  );
}

const saleTex: Record<string, THREE.CanvasTexture> = {};
function saleTexture(active: boolean) {
  const k = String(active);
  if (saleTex[k]) return saleTex[k];
  const c = document.createElement('canvas');
  c.width = 256;
  c.height = 112;
  const ctx = c.getContext('2d')!;
  ctx.fillStyle = active ? '#3f7d4f' : '#8a8478';
  ctx.font = '700 46px "Fredoka Variable", system-ui';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText(active ? 'FOR SALE' : 'COMING', 128, 40);
  ctx.font = '600 28px "Fredoka Variable", system-ui';
  ctx.fillText(active ? 'tap to expand' : 'at higher level', 128, 84);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  saleTex[k] = t;
  return t;
}

/** Locked land is wooded; trees clear away when the plot is bought. */
function Wilderness() {
  const plots = useGame((s) => s.game!.plots);
  const items = useMemo(() => {
    const out: { name: string; x: number; z: number; h: number; ry: number }[] = [];
    const r = rng(1234);
    for (const e of EXPANSIONS) {
      const [x0, z0, w, d] = e.rect;
      const n = 7;
      for (let i = 0; i < n; i++) {
        const x = x0 + 0.5 + r() * (w - 1);
        const z = z0 + 0.5 + r() * (d - 1);
        if (ROAD_ROWS.includes(Math.floor(z)) || ROAD_ROWS.includes(Math.floor(z + 0.6)) || ROAD_ROWS.includes(Math.floor(z - 0.6))) continue;
        const kind = r();
        out.push({ name: kind < 0.45 ? 'tree_pine' : kind < 0.8 ? 'tree_fat' : 'tree_dark', x: x - HALF, z: z - HALF, h: 1.1 + r() * 0.6, ry: r() * 6, plot: e.id } as never);
      }
    }
    return out as ({ name: string; x: number; z: number; h: number; ry: number; plot: string })[];
  }, []);
  // One baked mesh-set per plot: ~3 draw calls per plot instead of one per tree part.
  const group = useMemo(() => {
    const g = new THREE.Group();
    for (const e of EXPANSIONS) {
      const plotGroup = new THREE.Group();
      for (const it of items.filter((i) => i.plot === e.id)) {
        const m = model(it.name, it.h);
        m.position.set(it.x, 0, it.z);
        m.rotation.y = it.ry;
        plotGroup.add(m);
      }
      const baked = bake(plotGroup);
      baked.userData.plot = e.id;
      g.add(baked);
    }
    return g;
  }, [items]);
  group.children.forEach((c) => (c.visible = !plots.includes(c.userData.plot)));
  return <primitive object={group} />;
}

/** Main street running across the island with curbs, markings and a crosswalk. */
function Road() {
  const z0 = ROAD_ROWS[0] - HALF;
  const asphalt = useMemo(() => mat(P.asphalt, { map: TEX.asphalt(), repeat: [24, 2], roughness: 0.9 }), []);
  const curb = useMemo(() => mat(P.stone), []);
  // Lane dashes + crosswalk merged into a single mesh.
  const dashes = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    for (let x = -HALF + 0.4; x < HALF; x += 1) parts.push(new THREE.BoxGeometry(0.45, 0.012, 0.06).translate(x, 0.035, z0 + 1));
    for (let i = 0; i < 6; i++) parts.push(new THREE.BoxGeometry(0.12, 0.012, 1.5).translate(0.95 + i * 0.22, 0.035, z0 + 1));
    const mesh = new THREE.Mesh(mergeGeometries(parts)!, new THREE.MeshStandardMaterial({ color: '#fff6d8', roughness: 0.8 }));
    mesh.receiveShadow = true;
    return mesh;
  }, [z0]);
  return (
    <group>
      <mesh position={[0, 0.015, z0 + 1]} receiveShadow material={asphalt}>
        <boxGeometry args={[WORLD_CELLS + 0.6, 0.03, 1.6]} />
      </mesh>
      {[z0 + 0.12, z0 + 1.88].map((z) => (
        <mesh key={z} position={[0, 0.04, z]} receiveShadow castShadow material={curb}>
          <boxGeometry args={[WORLD_CELLS + 0.6, 0.08, 0.24]} />
        </mesh>
      ))}
      <primitive object={dashes} />
      <Traffic z0={z0} />
    </group>
  );
}

const CARS = ['sedan', 'taxi', 'van', 'delivery_van', 'truck', 'suv', 'hatchback_sports'];

function Traffic({ z0 }: { z0: number }) {
  const cars = useMemo(
    () =>
      [0, 1, 2].map((i) => {
        const m = model(CARS[i * 2], 0.42);
        return { obj: m, lane: i % 2, x: -HALF - 3 + i * 9, speed: 1.1 + i * 0.25, type: i * 2 };
      }),
    [],
  );
  const group = useMemo(() => {
    const g = new THREE.Group();
    cars.forEach((c) => g.add(c.obj));
    return g;
  }, [cars]);
  useFrame((_, dt) => {
    const step = Math.min(dt, 0.1);
    for (const c of cars) {
      const dir = c.lane === 0 ? 1 : -1;
      c.x += dir * c.speed * step;
      if (c.x > HALF + 4 || c.x < -HALF - 4) {
        c.x = dir > 0 ? -HALF - 4 : HALF + 4;
        // Swap to another car model for variety
        c.type = (c.type + 3) % CARS.length;
        const replacement = model(CARS[c.type], 0.42);
        group.remove(c.obj);
        c.obj = replacement;
        group.add(c.obj);
      }
      c.obj.position.set(c.x, 0.03, z0 + (c.lane === 0 ? 1.45 : 0.55));
      c.obj.rotation.y = dir > 0 ? Math.PI / 2 : -Math.PI / 2;
      c.obj.visible = Math.abs(c.x) < HALF + 0.5;
    }
  });
  return <primitive object={group} />;
}

/** Instanced cobble tiles for every placed path. */
function Paths() {
  const buildings = useGame((s) => s.game!.buildings);
  const paths = buildings.filter((b) => b.type === 'path');
  const mesh = useMemo(() => {
    const geo = new THREE.BoxGeometry(0.96, 0.04, 0.96);
    const m = mat(P.stone, { map: TEX.cobbles(), repeat: [2, 2], roughness: 0.9 });
    const im = new THREE.InstancedMesh(geo, m, 600);
    im.receiveShadow = true;
    im.count = 0;
    return im;
  }, []);
  const dummy = useMemo(() => new THREE.Object3D(), []);
  mesh.count = Math.min(600, paths.length);
  paths.slice(0, 600).forEach((p, i) => {
    dummy.position.set(p.x - HALF + 0.5, 0.02, p.z - HALF + 0.5);
    dummy.rotation.y = ((p.x * 7 + p.z * 13) % 4) * (Math.PI / 2);
    dummy.updateMatrix();
    mesh.setMatrixAt(i, dummy.matrix);
  });
  mesh.instanceMatrix.needsUpdate = true;
  return <primitive object={mesh} />;
}

/** Grass tufts and wildflowers scattered on free cells (deterministic). */
function Scatter() {
  const buildings = useGame((s) => s.game!.buildings);
  const graphics = useGame((s) => s.game!.settings.graphics);
  const { tufts, flowers } = useMemo(() => {
    const tuftGeo = new THREE.ConeGeometry(0.035, 0.14, 4);
    tuftGeo.translate(0, 0.07, 0);
    const t = new THREE.InstancedMesh(tuftGeo, new THREE.MeshStandardMaterial({ color: '#6fbf4a', roughness: 1 }), 2400);
    const fGeo = new THREE.SphereGeometry(0.035, 6, 4);
    fGeo.translate(0, 0.06, 0);
    const f = new THREE.InstancedMesh(fGeo, new THREE.MeshStandardMaterial({ roughness: 0.8 }), 500);
    t.receiveShadow = true;
    return { tufts: t, flowers: f };
  }, []);
  useMemo(() => {
    const occ = occupancy(buildings);
    const r = rng(777);
    const d = new THREE.Object3D();
    const col = new THREE.Color();
    const palette = ['#ffffff', '#ffd34d', '#ff8fb1', '#b9a2ff'];
    let ti = 0;
    let fi = 0;
    const density = graphics === 'low' ? 2 : graphics === 'medium' ? 3 : 5;
    for (let z = 0; z < WORLD_CELLS; z++)
      for (let x = 0; x < WORLD_CELLS; x++) {
        if (occ.has(key(x, z)) || ROAD_ROWS.includes(z)) continue;
        for (let k = 0; k < density && ti < 2400; k++) {
          d.position.set(x - HALF + r(), 0, z - HALF + r());
          d.rotation.set(0, r() * 6, (r() - 0.5) * 0.3);
          d.scale.setScalar(0.7 + r() * 0.8);
          d.updateMatrix();
          tufts.setMatrixAt(ti++, d.matrix);
        }
        if (r() < 0.35 && fi < 500) {
          d.position.set(x - HALF + r(), 0, z - HALF + r());
          d.rotation.set(0, 0, 0);
          d.scale.setScalar(0.8 + r() * 0.5);
          d.updateMatrix();
          flowers.setMatrixAt(fi, d.matrix);
          flowers.setColorAt(fi, col.set(palette[Math.floor(r() * palette.length)]));
          fi++;
        }
      }
    tufts.count = ti;
    flowers.count = fi;
    tufts.instanceMatrix.needsUpdate = true;
    flowers.instanceMatrix.needsUpdate = true;
    if (flowers.instanceColor) flowers.instanceColor.needsUpdate = true;
  }, [buildings, graphics, tufts, flowers]);
  return (
    <group>
      <primitive object={tufts} />
      <primitive object={flowers} />
    </group>
  );
}

export function Terrain() {
  return (
    <group>
      <Island />
      <Sea />
      <Ground />
      <PlotEdges />
      <Wilderness />
      <Road />
      <Paths />
      <Scatter />
    </group>
  );
}

export const PLOT = PLOT_SIZE;
