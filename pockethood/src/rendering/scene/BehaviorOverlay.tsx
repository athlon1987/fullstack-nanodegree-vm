// Live, state-driven dressing for module behaviours: the cars a player arranged in a showroom
// and the crops growing in community-garden plots. Drawn at named anchors baked into the
// building template, inside the building's rotated frame.
import { useFrame } from '@react-three/fiber';
import { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { showroomSlots } from '../../game/core/actions';
import { plotStage } from '../../game/behaviors/garden';
import type { BuildingInstance } from '../../game/core/types';
import { behaviorOf } from '../../platform/content/install';
import { clock } from '../../services/clock';
import { useGame } from '../../state/store';
import { model, tint } from '../models/assets';
import { mat } from '../kit/materials';
import { worldClock } from './coords';

function anchorsOf(obj: THREE.Object3D, prefix: string) {
  const out: THREE.Vector3[] = [];
  obj.traverse((o) => {
    const m = o.name.match(new RegExp(`^anchor:${prefix}(\\d+)$`));
    if (m) out[Number(m[1])] = o.position.clone();
  });
  return out;
}

export function BehaviorOverlay({ b, obj }: { b: BuildingInstance; obj: THREE.Object3D }) {
  const rev = useGame((s) => s.contentRev);
  const showroom = useMemo(() => behaviorOf(b.type, 'showroom'), [b.type, rev]);
  const garden = useMemo(() => behaviorOf(b.type, 'garden_plots'), [b.type, rev]);
  if (showroom) return <ShowroomCars b={b} obj={obj} />;
  if (garden) return <GardenPlots b={b} obj={obj} />;
  return null;
}

/** Paint shows through the texture without turning tyres and glass the same colour. */
const paintTint = (hex: string) => `#${new THREE.Color(hex).lerp(new THREE.Color('#ffffff'), 0.35).getHexString()}`;

function ShowroomCars({ b, obj }: { b: BuildingInstance; obj: THREE.Object3D }) {
  const sh = behaviorOf(b.type, 'showroom')!;
  const display = useGame((s) => s.game!.ext.showrooms[b.uid]);
  const reduced = useGame((s) => s.game!.settings.reducedMotion);
  const bays = useMemo(() => anchorsOf(obj, 'bay'), [obj]);
  const n = Math.min(bays.length, showroomSlots(sh.slots, b.level));
  const cars = useMemo(
    () =>
      Array.from({ length: n }, (_, i) => {
        const slot = display?.[i] ?? { model: sh.models[i % sh.models.length], paint: sh.paints[i % sh.paints.length].id };
        const paint = sh.paints.find((p) => p.id === slot.paint) ?? sh.paints[0];
        const m = model(slot.model, 0.32);
        tint(m, { colormap: paintTint(paint.hex) });
        m.traverse((o) => (o.castShadow = true));
        return m;
      }),
    [display, n, sh],
  );
  const group = useRef<THREE.Group>(null);
  useFrame(() => {
    if (reduced || !group.current) return;
    group.current.children.forEach((c, i) => (c.rotation.y = 0.5 + Math.sin(worldClock.t * 0.25 + i) * 0.35));
  });
  return (
    <group ref={group}>
      {cars.map((m, i) => (
        <primitive key={i} object={m} position={bays[i]} rotation={[0, 0.5, 0]} />
      ))}
    </group>
  );
}

const leaf = mat('#4f9a3f', { roughness: 0.9 });
const leafLight = mat('#7cc35a', { roughness: 0.9 });
const soilMound = mat('#4a3220', { roughness: 1 });

function PlantMesh({ stage, color, icon }: { stage: number; color: string; icon: string }) {
  const fruit = useMemo(() => mat(color), [color]);
  const tall = icon === 'sapling' || icon === 'herbs';
  if (stage === 0)
    return (
      <mesh material={soilMound} position={[0, 0.02, 0]} scale={[1, 0.4, 1]}>
        <sphereGeometry args={[0.07, 8, 6]} />
      </mesh>
    );
  const s = stage === 1 ? 0.45 : stage === 2 ? 0.75 : 1;
  return (
    <group scale={s}>
      {tall ? (
        <>
          <mesh material={leaf} position={[0, 0.16, 0]}>
            <coneGeometry args={[0.035, 0.34, 5]} />
          </mesh>
          {icon === 'sapling' &&
            [0, 1.3, 2.6, 3.9, 5.2].map((a) => (
              <mesh key={a} material={leafLight} position={[Math.cos(a) * 0.07, 0.32, Math.sin(a) * 0.07]} rotation={[Math.sin(a) * 0.9, a, Math.cos(a) * 0.9]}>
                <boxGeometry args={[0.03, 0.01, 0.16]} />
              </mesh>
            ))}
          {icon === 'herbs' &&
            [0.08, -0.08].map((x) => (
              <mesh key={x} material={leafLight} position={[x, 0.13, 0]}>
                <coneGeometry args={[0.025, 0.26, 4]} />
              </mesh>
            ))}
        </>
      ) : (
        <mesh material={leaf} position={[0, 0.1, 0]} scale={[1, 0.8, 1]}>
          <sphereGeometry args={[0.11, 9, 7]} />
        </mesh>
      )}
      {stage === 3 &&
        [0, 2.1, 4.2].map((a) => (
          <mesh key={a} material={fruit} position={[Math.cos(a) * 0.08, tall ? 0.28 : 0.17, Math.sin(a) * 0.08]}>
            <sphereGeometry args={[0.035, 7, 5]} />
          </mesh>
        ))}
    </group>
  );
}

function GardenPlots({ b, obj }: { b: BuildingInstance; obj: THREE.Object3D }) {
  const gb = behaviorOf(b.type, 'garden_plots')!;
  const plots = useGame((s) => s.game!.ext.gardens[b.uid]);
  const anchors = useMemo(() => anchorsOf(obj, 'plot'), [obj]);
  // Growth is time-based: refresh stages every few seconds.
  const [, setTick] = useState(0);
  useEffect(() => {
    const id = window.setInterval(() => setTick((x) => x + 1), 4000);
    return () => window.clearInterval(id);
  }, []);
  const now = clock.now();
  return (
    <group>
      {anchors.slice(0, gb.plots).map((pos, i) => {
        const p = plots?.[i];
        const def = p?.plant ? gb.plants.find((x) => x.id === p.plant) : undefined;
        if (!p || !def || !pos) return null;
        const stage = plotStage(p, def, now);
        return (
          <group key={i} position={pos}>
            {[-0.16, 0, 0.16].map((dx) => (
              <group key={dx} position={[dx, 0, 0]}>
                <PlantMesh stage={stage} color={def.color} icon={def.icon} />
              </group>
            ))}
          </group>
        );
      })}
    </group>
  );
}
