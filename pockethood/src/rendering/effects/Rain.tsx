// Tropical rain: falling streaks over the island and a soft grey veil. Intensity comes from
// the deterministic weather model; Zen/reduced-motion players get a gentle, slower shower.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { WORLD } from '../../data/world';
import { rainAt } from '../../game/world/weather';
import { clock } from '../../services/clock';
import { useGame } from '../../state/store';
import { weatherState } from '../scene/coords';

const AREA = 26;
const TOP = 9;

export function Rain() {
  const graphics = useGame((s) => s.game!.settings.graphics);
  const enabled = useGame((s) => s.game!.settings.weather);
  const reduced = useGame((s) => s.game!.settings.reducedMotion);
  const count = graphics === 'low' ? 250 : graphics === 'medium' ? 500 : 900;
  const { lines, speeds } = useMemo(() => {
    const pos = new Float32Array(count * 6);
    const speeds = new Float32Array(count);
    for (let i = 0; i < count; i++) {
      const x = (Math.random() - 0.5) * AREA;
      const z = (Math.random() - 0.5) * AREA;
      const y = Math.random() * TOP;
      pos.set([x, y, z, x + 0.03, y - 0.32, z + 0.03], i * 6);
      speeds[i] = 7 + Math.random() * 4;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    const m = new THREE.LineBasicMaterial({ color: '#dfeef7', transparent: true, opacity: 0, depthWrite: false });
    const lines = new THREE.LineSegments(geo, m);
    lines.frustumCulled = false;
    return { lines, speeds };
  }, [count]);
  const intensity = useRef(0);

  useFrame((_, dt) => {
    const target = weatherState.force ?? (enabled ? rainAt(clock.now(), WORLD.rainChance) : 0);
    intensity.current += (target - intensity.current) * Math.min(1, dt * 0.8);
    const k = intensity.current;
    weatherState.rain = k;
    const m = lines.material as THREE.LineBasicMaterial;
    m.opacity = k * 0.55;
    lines.visible = k > 0.02;
    if (!lines.visible) return;
    const pos = lines.geometry.attributes.position as THREE.BufferAttribute;
    const arr = pos.array as Float32Array;
    const slow = reduced ? 0.35 : 1;
    const active = Math.floor(count * Math.min(1, k * 1.2));
    for (let i = 0; i < count; i++) {
      const o = i * 6;
      if (i >= active) {
        arr[o + 1] = arr[o + 4] = -50;
        continue;
      }
      let y = arr[o + 1] - speeds[i] * dt * slow;
      if (y < 0) {
        y = TOP + Math.random() * 2;
        arr[o] = (Math.random() - 0.5) * AREA;
        arr[o + 2] = (Math.random() - 0.5) * AREA;
        arr[o + 3] = arr[o] + 0.03;
        arr[o + 5] = arr[o + 2] + 0.03;
      }
      arr[o + 1] = y;
      arr[o + 4] = y - 0.32;
    }
    pos.needsUpdate = true;
  });
  return <primitive object={lines} />;
}
