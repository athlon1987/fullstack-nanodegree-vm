// Tropical rain: falling streaks over the island and a soft grey veil. Intensity comes from
// the deterministic weather model; Zen/reduced-motion players get a gentle, slower shower.
import { useFrame } from '@react-three/fiber';
import { useMemo, useRef } from 'react';
import * as THREE from 'three';
import { WORLD } from '../../data/world';
import { weatherAt } from '../../game/world/weather';
import { clock } from '../../services/clock';
import { useGame } from '../../state/store';
import { weatherState, worldClock } from '../scene/coords';
import { flag } from '../../platform/content/flags';

const AREA = 26;
const TOP = 9;

export function Rain() {
  const graphics = useGame((s) => s.game!.settings.graphics);
  const enabled = useGame((s) => s.game!.settings.weather);
  const reduced = useGame((s) => s.game!.settings.reducedMotion);
  const zen = useGame((s) => s.game!.settings.zen);
  const count = Math.round((graphics === 'low' ? 250 : graphics === 'medium' ? 500 : 900) * (zen ? 0.5 : 1));
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
    const on = enabled && flag('weather');
    const w = on ? weatherAt(clock.now(), WORLD.rainChance, worldClock.hour) : { rain: 0, cloud: 0.15, wind: 0.25, mist: 0, afterglow: 0 };
    const target = weatherState.force ?? w.rain;
    intensity.current += (target - intensity.current) * Math.min(1, dt * 0.8);
    const k = intensity.current;
    weatherState.rain = k;
    // Everything else eases too, so the sky never jumps.
    const ease = Math.min(1, dt * 0.5);
    for (const key of ['cloud', 'wind', 'mist', 'afterglow'] as const) {
      const v = weatherState.forceAll?.[key] ?? (key === 'cloud' ? Math.max(w.cloud, k * 0.8) : w[key]);
      weatherState[key] += (v - weatherState[key]) * ease;
    }
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
      // A breeze slants the rain a little.
      arr[o + 3] = arr[o] + 0.03 + weatherState.wind * 0.12;
    }
    pos.needsUpdate = true;
  });
  return <primitive object={lines} />;
}
