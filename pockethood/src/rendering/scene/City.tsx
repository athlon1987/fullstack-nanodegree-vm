// The modern city around a Klang Valley neighbourhood: an elevated LRT line along the main
// road with trains gliding by and a station, a covered walkway, a highway flyover with traffic
// and a skyline of (fictional) towers across the lake that light up at night. Cheap: shared
// materials, merged geometry, a handful of moving objects.
import { useFrame } from '@react-three/fiber';
import { useMemo } from 'react';
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { ROAD_ROWS } from '../../game/world/grid';
import { WORLD_CELLS as SPAN } from '../../data/progression';
import { rng } from '../../game/core/rng';
import { model } from '../models/assets';
import { glass, mat, TEX } from '../kit/materials';
import { HALF, worldClock } from './coords';
import { ledLamp } from '../kit/urban';
import { bake } from '../kit/parts';

const LRT_Y = 1.75;
const lrtZ = () => ROAD_ROWS[0] - HALF + 1; // above the road's centre line

/** Merge a list of box specs [w,h,d,x,y,z] into one geometry. */
function boxes(specs: number[][]) {
  return mergeGeometries(specs.map(([w, h, d, x, y, z]) => new THREE.BoxGeometry(w, h, d).translate(x, y + h / 2, z)))!;
}

/** Elevated LRT viaduct with a station, trains and a covered walkway along the pavement. */
export function Lrt() {
  const z = lrtZ();
  const parts = useMemo(() => {
    const concrete = mat('#e4e1da', { roughness: 0.8 });
    const g = new THREE.Group();
    const pillars: number[][] = [];
    for (let x = -HALF - 2; x <= HALF + 2; x += 4) pillars.push([0.28, LRT_Y, 0.28, x, 0, z], [0.6, 0.12, 0.5, x, LRT_Y - 0.12, z]);
    const deck = new THREE.Mesh(boxes([[SPAN + 8, 0.16, 0.62, 0, LRT_Y, z], ...pillars]), concrete);
    deck.castShadow = deck.receiveShadow = true;
    g.add(deck);
    // Parapets and a teal accent stripe
    g.add(new THREE.Mesh(boxes([[SPAN + 8, 0.12, 0.04, 0, LRT_Y + 0.16, z - 0.29], [SPAN + 8, 0.12, 0.04, 0, LRT_Y + 0.16, z + 0.29]]), mat('#f4f2ec')));
    g.add(new THREE.Mesh(boxes([[SPAN + 8, 0.035, 0.045, 0, LRT_Y + 0.05, z + 0.32]]), mat('#22b3a6')));
    // Station: platform box with a curved-ish roof over the line, stairs to the north pavement
    const sx = -7.5;
    const station = new THREE.Group();
    station.add(new THREE.Mesh(boxes([[3.2, 0.12, 1.5, sx, LRT_Y - 0.02, z]]), concrete));
    const glassBox = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.42, 1.4).translate(sx, LRT_Y + 0.31, z), glass);
    station.add(glassBox);
    const roof = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 3.3, 20, 1, false, 0, Math.PI), mat('#ffffff', { roughness: 0.5 }));
    roof.rotation.z = Math.PI / 2;
    roof.scale.set(1, 1, 0.42);
    roof.position.set(sx, LRT_Y + 0.52, z);
    station.add(roof);
    station.add(new THREE.Mesh(boxes([[3.32, 0.05, 0.05, sx, LRT_Y + 0.54, z + 0.75]]), mat('#22b3a6')));
    // Stairs / escalator block down to the north pavement, with a covered entrance
    const stairs = new THREE.Mesh(boxes([[0.55, LRT_Y, 0.6, sx + 1.0, 0, z - 1.25]]), concrete);
    station.add(stairs);
    station.add(new THREE.Mesh(boxes([[0.7, 0.05, 0.75, sx + 1.0, LRT_Y + 0.12, z - 1.25]]), mat('#ffffff')));
    g.add(bake(station));
    // Covered walkway along the north edge of the road
    const wz = ROAD_ROWS[0] - HALF - 0.08;
    const posts: number[][] = [];
    for (let x = -HALF + 0.5; x <= HALF - 0.5; x += 2) posts.push([0.05, 0.72, 0.05, x, 0, wz]);
    const walkway = new THREE.Mesh(boxes([[SPAN - 0.4, 0.04, 0.42, 0, 0.72, wz + 0.05], ...posts]), mat('#3a4049', { metalness: 0.4, roughness: 0.4 }));
    walkway.castShadow = true;
    g.add(walkway);
    return g;
  }, [z]);

  // A three-car train shuttling along the line every ~25 s, each way.
  const trains = useMemo(() => {
    const body = mat('#ffffff', { roughness: 0.35, metalness: 0.15 });
    const stripe = mat('#22b3a6');
    const window = mat('#2b3a4a', { roughness: 0.15, metalness: 0.4 });
    const make = () => {
      const t = new THREE.Group();
      for (let i = 0; i < 3; i++) {
        const car = new THREE.Group();
        car.position.x = i * 1.55;
        car.add(new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.36, 0.42).translate(0, 0.18, 0), body));
        car.add(new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.1, 0.43).translate(0, 0.22, 0), window));
        car.add(new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.04, 0.44).translate(0, 0.08, 0), stripe));
        t.add(car);
      }
      return bake(t); // 3 draw calls per train instead of 9
    };
    return [make(), make()];
  }, []);
  useFrame(() => {
    const t = worldClock.t;
    trains.forEach((tr, i) => {
      const period = 26;
      const p = ((t + i * 13) % period) / period; // 0..1
      const span = SPAN + 16;
      const dir = i === 0 ? 1 : -1;
      // Ease into and out of the station so it reads as stopping there.
      const x = -span / 2 + p * span;
      tr.position.set(dir > 0 ? x : -x, LRT_Y + 0.16, z + (i === 0 ? 0.13 : -0.13));
      tr.rotation.y = dir > 0 ? 0 : Math.PI;
    });
  });
  return (
    <group>
      <primitive object={parts} />
      {trains.map((t, i) => (
        <primitive key={i} object={t} />
      ))}
    </group>
  );
}

/** A highway flyover sweeping behind the neighbourhood, with cars, and a skyline across the lake. */
export function Skyline() {
  const { city, windows, cars } = useMemo(() => {
    const r = rng(2024);
    const g = new THREE.Group();
    const towerColours = ['#f4f1ea', '#dfe9f2', '#e9f3ee', '#f6e9df', '#e6e3f4', '#ffffff'];
    const towers: { geo: THREE.BufferGeometry; colour: string }[] = [];
    const win: THREE.BufferGeometry[] = [];
    const place = (x: number, z: number, w: number, d: number, h: number) => {
      const colour = towerColours[Math.floor(r() * towerColours.length)];
      towers.push({ geo: new THREE.BoxGeometry(w, h, d).translate(x, h / 2 - 1.1, z), colour });
      // Window bands on the two faces the camera sees (+x and +z)
      for (let y = 0.4; y < h - 0.3; y += 0.45) {
        win.push(new THREE.BoxGeometry(w * 0.86, 0.16, 0.02).translate(x, y - 1.1, z + d / 2 + 0.01));
        win.push(new THREE.BoxGeometry(0.02, 0.16, d * 0.86).translate(x + w / 2 + 0.01, y - 1.1, z));
      }
      if (r() < 0.35) towers.push({ geo: new THREE.CylinderGeometry(0.04, 0.06, 1.2, 6).translate(x, h - 1.1 + 0.6, z), colour: '#cfd6dd' });
    };
    // Across the lake: a band behind (−z) and one to the left (−x), taller further away.
    for (let i = 0; i < 18; i++) {
      const x = -26 + i * 3.1 + (r() - 0.5);
      const far = r() < 0.5;
      place(x, -21 - (far ? 6 : 0) - r() * 2, 1.6 + r() * 1.6, 1.6 + r() * 1.2, 3 + r() * (far ? 9 : 6));
    }
    for (let i = 0; i < 12; i++) {
      const z = -18 + i * 3.2 + (r() - 0.5);
      if (z > 14) continue;
      const far = r() < 0.5;
      place(-21 - (far ? 6 : 0) - r() * 2, z, 1.6 + r() * 1.2, 1.6 + r() * 1.6, 3 + r() * (far ? 9 : 6));
    }
    // One graceful, fictional landmark tower with a spire (not modelled on any real building).
    towers.push({ geo: new THREE.CylinderGeometry(0.9, 1.3, 14, 8).translate(-30, 6, -30), colour: '#e8eef5' });
    towers.push({ geo: new THREE.ConeGeometry(0.5, 4, 8).translate(-30, 15, -30), colour: '#cfd6dd' });
    const byColour = new Map<string, THREE.BufferGeometry[]>();
    for (const t of towers) byColour.set(t.colour, [...(byColour.get(t.colour) ?? []), t.geo]);
    for (const [colour, geos] of byColour) {
      const m = new THREE.Mesh(mergeGeometries(geos)!, mat(colour, { roughness: 0.6 }));
      m.castShadow = false;
      g.add(m);
    }
    const windowMat = new THREE.MeshStandardMaterial({ color: '#7fa6c4', roughness: 0.2, metalness: 0.3, emissive: new THREE.Color('#ffd98a'), emissiveIntensity: 0 });
    g.add(new THREE.Mesh(mergeGeometries(win)!, windowMat));
    // Ground across the lake (the city's edge) and a park strip along the water
    const land = new THREE.Mesh(new THREE.BoxGeometry(80, 0.4, 14).translate(-6, -1.15, -27), mat('#8fcf6a', { roughness: 1 }));
    const land2 = new THREE.Mesh(new THREE.BoxGeometry(14, 0.4, 60).translate(-27, -1.15, 0), mat('#8fcf6a', { roughness: 1 }));
    g.add(land, land2);
    // Highway flyover: a curved elevated road with pillars across the near band of the city
    const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(30, 1.4, -18), new THREE.Vector3(5, 1.9, -17.5), new THREE.Vector3(-14, 2.4, -16.5), new THREE.Vector3(-18, 2.2, -2), new THREE.Vector3(-18.5, 1.6, 22)]);
    const pts = curve.getSpacedPoints(80);
    const roadGeo: THREE.BufferGeometry[] = [];
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i];
      const b = pts[i + 1];
      const mid = a.clone().add(b).multiplyScalar(0.5);
      const len = a.distanceTo(b) + 0.02;
      const seg = new THREE.BoxGeometry(len, 0.14, 1.1);
      seg.rotateY(-Math.atan2(b.z - a.z, b.x - a.x));
      seg.translate(mid.x, mid.y, mid.z);
      roadGeo.push(seg);
      if (i % 6 === 0) roadGeo.push(new THREE.BoxGeometry(0.3, mid.y + 1.1, 0.3).translate(mid.x, (mid.y - 1.1) / 2, mid.z));
    }
    g.add(new THREE.Mesh(mergeGeometries(roadGeo)!, mat('#d9d6cf', { roughness: 0.85 })));
    const carList = [0, 1, 2, 3, 4].map((i) => {
      // Far away: one merged mesh per material, no shadow
      const m = bake(model(['sedan', 'taxi', 'suv', 'van', 'hatchback_sports'][i], 0.42));
      m.traverse((o) => (o.castShadow = false));
      g.add(m);
      return { obj: m, u: i / 5, speed: 0.012 + (i % 3) * 0.003, dir: i % 2 ? 1 : -1 };
    });
    return { city: g, windows: windowMat, cars: { list: carList, curve } };
  }, []);
  useFrame((_, dt) => {
    windows.emissiveIntensity = worldClock.night * 0.9;
    for (const c of cars.list) {
      c.u = (c.u + c.dir * c.speed * Math.min(dt, 0.1) + 1) % 1;
      const p = cars.curve.getPointAt(c.u);
      const tng = cars.curve.getTangentAt(c.u);
      c.obj.position.set(p.x, p.y + 0.08, p.z);
      c.obj.position.addScaledVector(new THREE.Vector3(-tng.z, 0, tng.x).normalize(), c.dir * 0.25);
      c.obj.rotation.y = Math.atan2(tng.x, tng.z) + (c.dir > 0 ? 0 : Math.PI);
    }
  });
  return <primitive object={city} />;
}

/** Road markings for a city street: a central median with planters under the LRT pillars. */
export function Median() {
  const z = lrtZ();
  const geo = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    parts.push(new THREE.BoxGeometry(SPAN + 0.6, 0.06, 0.32).translate(0, 0.05, z));
    return mergeGeometries(parts)!;
  }, [z]);
  const kerb = useMemo(() => mat('#d6d1c6', { map: TEX.paving() }), []);
  const shrubs = useMemo(() => {
    const parts: THREE.BufferGeometry[] = [];
    for (let x = -HALF + 1; x < HALF; x += 2) parts.push(new THREE.SphereGeometry(0.13, 8, 6).scale(1, 0.7, 1).translate(x, 0.13, z));
    const m = new THREE.Mesh(mergeGeometries(parts)!, mat('#3fae4a', { roughness: 0.9 }));
    m.castShadow = true;
    return m;
  }, [z]);
  return (
    <group>
      <mesh geometry={geo} material={kerb} receiveShadow />
      <primitive object={shrubs} />
    </group>
  );
}

/** Width of the ring road band around the neighbourhood (pavement + road + outer pavement). */
export const RING = 1.75;

/** A ring road around the township block: inner and outer pavements, lane markings,
 *  LED street lamps and a row of palms and rain trees, with a few cars circling. */
export function RingRoad() {
  const { group, path } = useMemo(() => {
    const g = new THREE.Group();
    const inner = HALF + 0.25; // grid edge + inner pavement
    const outer = HALF + 1.35;
    const mid = (inner + outer) / 2;
    const L = SPAN + 2 * RING;
    const frame = (o: number, width: number) => [
      [L, width, 0, -o],
      [L, width, 0, o],
      [width, L - 2 * width, -o, 0],
      [width, L - 2 * width, o, 0],
    ];
    const asphalt = mat('#565d68', { map: TEX.asphalt(), repeat: [24, 2], roughness: 0.9 });
    const paving = mat('#efe9dd', { map: TEX.paving(), repeat: [24, 1], roughness: 0.85 });
    const road = mergeGeometries(frame(mid, outer - inner).map(([w, d, x, z]) => new THREE.BoxGeometry(w, 0.03, d).translate(x, 0.015, z)))!;
    const walk = mergeGeometries([
      ...frame(HALF + 0.125, 0.25).map(([w, d, x, z]) => new THREE.BoxGeometry(w, 0.07, d).translate(x, 0.035, z)),
      ...frame(outer + 0.2, 0.4).map(([w, d, x, z]) => new THREE.BoxGeometry(w, 0.07, d).translate(x, 0.035, z)),
    ])!;
    const r = new THREE.Mesh(road, asphalt);
    const w = new THREE.Mesh(walk, paving);
    r.receiveShadow = w.receiveShadow = true;
    g.add(r, w);
    const dash: THREE.BufferGeometry[] = [];
    for (let t = -L / 2 + 0.6; t < L / 2 - 0.6; t += 1) {
      dash.push(new THREE.BoxGeometry(0.45, 0.012, 0.05).translate(t, 0.035, -mid), new THREE.BoxGeometry(0.45, 0.012, 0.05).translate(t, 0.035, mid));
      dash.push(new THREE.BoxGeometry(0.05, 0.012, 0.45).translate(-mid, 0.035, t), new THREE.BoxGeometry(0.05, 0.012, 0.45).translate(mid, 0.035, t));
    }
    g.add(new THREE.Mesh(mergeGeometries(dash)!, mat('#ffffff', { roughness: 0.8 })));
    // Lamps and trees along the outer pavement (skipping where the main road meets the ring)
    const props = new THREE.Group();
    const lamps: [number, number, number][] = [];
    const roadZ = ROAD_ROWS[0] - HALF + 1;
    const o = outer + 0.22;
    let i = 0;
    for (let t = -L / 2 + 1.2; t < L / 2 - 1; t += 1.5, i++) {
      for (const [x, z, ry] of [[t, -o, 0], [t, o, Math.PI], [-o, t, Math.PI / 2], [o, t, -Math.PI / 2]] as [number, number, number][]) {
        if (Math.abs(z - roadZ) < 1.3 && Math.abs(x) > HALF) continue;
        if (i % 2 === 0) {
          ledLamp(props, x, z, 0.95, ry);
          lamps.push([x, z, ry]);
        }
        else {
          const tree = model(i % 4 === 1 ? 'tree_palm' : 'tree_fat', i % 4 === 1 ? 1.2 : 0.85);
          tree.position.set(x, 0.07, z);
          tree.rotation.y = t;
          props.add(tree);
        }
      }
    }
    props.traverse((m) => ((m as THREE.Mesh).isMesh ? ((m as THREE.Mesh).castShadow = true) : null));
    g.add(bake(props));
    // Warm pools of light under the lamps after dark (one instanced, additive mesh)
    const glowMat = new THREE.MeshBasicMaterial({ color: '#ffd38a', transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false });
    const disc = new THREE.CircleGeometry(0.55, 20).rotateX(-Math.PI / 2);
    const pools = new THREE.InstancedMesh(disc, glowMat, lamps.length);
    const d = new THREE.Object3D();
    lamps.forEach(([x, z, ry], k) => {
      // The lamp arm reaches over the road (towards the island)
      d.position.set(x + Math.sin(ry) * 0.17, 0.045, z + Math.cos(ry) * 0.17);
      d.updateMatrix();
      pools.setMatrixAt(k, d.matrix);
    });
    pools.renderOrder = 2;
    g.add(pools);
    g.userData.glow = glowMat;
    // Clockwise loop for the cars, in the outer lane
    const lane = mid + 0.27;
    const path = new THREE.CurvePath<THREE.Vector3>();
    const c = [new THREE.Vector3(-lane, 0.03, -lane), new THREE.Vector3(lane, 0.03, -lane), new THREE.Vector3(lane, 0.03, lane), new THREE.Vector3(-lane, 0.03, lane)];
    for (let k = 0; k < 4; k++) path.add(new THREE.LineCurve3(c[k], c[(k + 1) % 4]));
    return { group: g, path };
  }, []);
  const cars = useMemo(() => ['taxi', 'hatchback_sports', 'suv', 'sedan'].map((n, i) => ({ obj: bake(model(n, 0.42)), u: i / 4 + 0.07 })), []);
  useFrame((_, dt) => {
    (group.userData.glow as THREE.MeshBasicMaterial).opacity = worldClock.night * 0.45;
    const len = path.getLength();
    for (const c of cars) {
      c.u = (c.u + (Math.min(dt, 0.1) * 1.2) / len) % 1;
      const p = path.getPointAt(c.u);
      const tng = path.getTangentAt(c.u);
      c.obj.position.copy(p);
      c.obj.rotation.y = Math.atan2(tng.x, tng.z);
    }
  });
  return (
    <group>
      <primitive object={group} />
      {cars.map((c, i) => (
        <primitive key={i} object={c.obj} />
      ))}
    </group>
  );
}
