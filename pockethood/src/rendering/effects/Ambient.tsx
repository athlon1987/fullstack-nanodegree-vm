// Ambient life: birds crossing the sky, butterflies over flowers, drifting
// clouds, swaying trees, fireflies and warm light pools at night. All cheap:
// shared geometry/materials, a handful of objects, no per-frame allocation.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useGame } from '../../state/store';
import { HALF, weatherState, worldClock } from '../scene/coords';

const wingGeo = (() => {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0, 0.09, 0, -0.03, 0.05, 0, 0.05], 3));
  g.computeVertexNormals();
  return g;
})();

function Birds() {
  const flock = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: '#4b4f5c', side: THREE.DoubleSide });
    const birds = Array.from({ length: 5 }, () => {
      const b = new THREE.Group();
      const l = new THREE.Mesh(wingGeo, m);
      const r = new THREE.Mesh(wingGeo, m);
      r.scale.x = -1;
      const body = new THREE.Mesh(new THREE.SphereGeometry(0.035, 6, 4), m);
      body.scale.set(0.8, 0.7, 1.6);
      b.add(l, r, body);
      return { g: b, l, r, off: Math.random() * 10 };
    });
    const g = new THREE.Group();
    birds.forEach((b) => g.add(b.g));
    return { g, birds };
  }, []);
  useFrame(() => {
    const t = worldClock.t;
    const cycle = (t % 38) / 38;
    flock.g.visible = worldClock.night < 0.6;
    flock.birds.forEach((b, i) => {
      const x = -22 + cycle * 44 + Math.sin(t * 0.7 + i) * 0.4 - (i % 3) * 0.5;
      const z = 6 - cycle * 18 + (i - 2) * 0.6;
      b.g.position.set(x, 4.5 + Math.sin(t * 1.3 + b.off) * 0.25 + i * 0.12, z);
      b.g.rotation.y = -Math.PI / 3.4;
      const flap = Math.sin(t * 14 + b.off) * 0.8;
      b.l.rotation.z = flap;
      b.r.rotation.z = -flap;
    });
  });
  return <primitive object={flock.g} />;
}

function Butterflies() {
  const buildings = useGame((s) => s.game!.buildings);
  const extra = useGame((s) => !!s.game!.flags.butterflies);
  const beds = buildings.filter((b) => b.type === 'flower_bed' || b.type === 'garden' || b.type === 'flower_shop');
  const count = Math.min(14, beds.length * (extra ? 2 : 1));
  const data = useMemo(() => {
    const cols = ['#ffb347', '#ff8fb1', '#ffffff', '#9ad0ff', '#ffe066'];
    const g = new THREE.Group();
    const items = Array.from({ length: 14 }, (_, i) => {
      const m = new THREE.MeshStandardMaterial({ color: cols[i % cols.length], side: THREE.DoubleSide, emissive: cols[i % cols.length], emissiveIntensity: 0.15 });
      const b = new THREE.Group();
      const l = new THREE.Mesh(wingGeo, m);
      const r = new THREE.Mesh(wingGeo, m);
      r.scale.x = -1;
      b.add(l, r);
      b.scale.setScalar(0.8);
      g.add(b);
      return { b, l, r, off: Math.random() * 20 };
    });
    return { g, items };
  }, []);
  useFrame(() => {
    const t = worldClock.t;
    data.items.forEach((it, i) => {
      const bed = beds[i % Math.max(1, beds.length)];
      it.b.visible = i < count && !!bed && worldClock.night < 0.5;
      if (!it.b.visible) return;
      const cx = bed.x - HALF + 0.9;
      const cz = bed.z - HALF + 0.9;
      it.b.position.set(cx + Math.sin(t * 0.6 + it.off) * 0.6, 0.45 + Math.sin(t * 1.7 + it.off) * 0.15, cz + Math.cos(t * 0.5 + it.off * 1.3) * 0.6);
      it.b.rotation.y = t * 0.6 + it.off;
      const flap = Math.sin(t * 22 + it.off) * 1.1;
      it.l.rotation.z = flap;
      it.r.rotation.z = -flap;
    });
  });
  return <primitive object={data.g} />;
}

const tmpGrey = new THREE.Color();

function Clouds() {
  const clouds = useMemo(() => {
    const m = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1, transparent: true, opacity: 0.92 });
    const g = new THREE.Group();
    const list = Array.from({ length: 5 }, (_, i) => {
      const c = new THREE.Group();
      for (let k = 0; k < 4; k++) {
        const s = new THREE.Mesh(new THREE.SphereGeometry(0.6 + Math.random() * 0.4, 9, 7), m);
        s.position.set(k * 0.6 - 0.9, Math.random() * 0.2, (Math.random() - 0.5) * 0.5);
        s.scale.y = 0.6;
        c.add(s);
      }
      // Keep clouds over the far sea so they never clip into the island.
      c.position.set(-30 + i * 14, 6 + (i % 2) * 1.5, -24 - (i % 3) * 4);
      g.add(c);
      return c;
    });
    return { g, list, m };
  }, []);
  const grey = useMemo(() => new THREE.Color(), []);
  useFrame((_, dt) => {
    // Cloud cover: more (and fuller, greyer) clouds around showers; they drift with the breeze.
    const cover = weatherState.cloud;
    grey.set(worldClock.night > 0.5 ? '#8c93b8' : '#ffffff').lerp(tmpGrey.set('#aab3bb'), weatherState.rain * 0.7);
    clouds.m.color.copy(grey);
    clouds.m.opacity = 0.75 + cover * 0.2;
    clouds.list.forEach((c, i) => {
      c.visible = i < 2 + Math.round(cover * 3);
      c.scale.setScalar(0.9 + cover * 0.5);
      c.position.x += dt * (0.15 + weatherState.wind * 0.35);
      if (c.position.x > 34) c.position.x = -34;
    });
  });
  return <primitive object={clouds.g} />;
}

const glowTex = (() => {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const ctx = c.getContext('2d')!;
  const g = ctx.createRadialGradient(32, 32, 2, 32, 32, 32);
  g.addColorStop(0, 'rgba(255,214,140,0.9)');
  g.addColorStop(1, 'rgba(255,214,140,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new THREE.CanvasTexture(c);
})();

/** Warm pools of light under lamps and in front of doors at night. */
function NightLights() {
  const buildings = useGame((s) => s.game!.buildings);
  const lamps = buildings.filter((b) => b.type === 'lamp' || b.type === 'lantern_string');
  const mat = useMemo(() => new THREE.MeshBasicMaterial({ map: glowTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }), []);
  useFrame(() => {
    mat.opacity = worldClock.night * 0.85;
  });
  return (
    <group>
      {lamps.map((l) => (
        <mesh key={l.uid} material={mat} rotation={[-Math.PI / 2, 0, 0]} position={[l.x - HALF + 0.5, 0.05, l.z - HALF + 0.5]}>
          <planeGeometry args={[2.2, 2.2]} />
        </mesh>
      ))}
    </group>
  );
}

function Fireflies() {
  const pts = useMemo(() => {
    const n = 40;
    const g = new THREE.BufferGeometry();
    const p = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) p.set([(Math.random() - 0.5) * 12, 0.3 + Math.random() * 0.8, (Math.random() - 0.5) * 12], i * 3);
    g.setAttribute('position', new THREE.BufferAttribute(p, 3));
    const m = new THREE.PointsMaterial({ color: '#fff3a0', size: 0.08, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending });
    return { obj: new THREE.Points(g, m), base: p.slice(), m };
  }, []);
  const ref = useRef(0);
  useFrame(() => {
    const t = worldClock.t;
    pts.m.opacity = worldClock.night * (0.6 + Math.sin(t * 3) * 0.3);
    if (worldClock.night < 0.05) return;
    ref.current++;
    const a = pts.obj.geometry.attributes.position as THREE.BufferAttribute;
    for (let i = 0; i < a.count; i++) {
      a.setXYZ(i, pts.base[i * 3] + Math.sin(t * 0.5 + i) * 0.3, pts.base[i * 3 + 1] + Math.sin(t + i * 2) * 0.15, pts.base[i * 3 + 2] + Math.cos(t * 0.4 + i) * 0.3);
    }
    a.needsUpdate = true;
  });
  return <primitive object={pts.obj} position={[0, 0, 0]} />;
}

export function Ambient() {
  const graphics = useGame((s) => s.game!.settings.graphics);
  const reduced = useGame((s) => s.game!.settings.reducedMotion);
  return (
    <group>
      <Clouds />
      {!reduced && <Birds />}
      <Butterflies />
      <NightLights />
      {graphics !== 'low' && <Fireflies />}
    </group>
  );
}
