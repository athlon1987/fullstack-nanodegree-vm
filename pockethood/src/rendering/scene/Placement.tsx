// Placement mode: grid overlay, a hovering ghost of the building, green/red
// footprint tiles, and pointer/touch controls (hover, tap, or drag the ghost).
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { BUILDINGS } from '../../data/buildings';
import { WORLD_CELLS } from '../../data/progression';
import { cellsOf, footprint, placementProblem, plotOf } from '../../game/world/grid';
import { useGame } from '../../state/store';
import { archetype } from '../kit/archetypes';
import { cameraState } from '../camera/CameraRig';
import { HALF, placementDrag, worldClock } from './coords';
import { WORLD } from '../../data/world';


function GridOverlay() {
  const plots = useGame((s) => s.game!.plots);
  const geo = useMemo(() => {
    const pts: number[] = [];
    for (let z = 0; z < WORLD_CELLS; z++)
      for (let x = 0; x < WORLD_CELLS; x++) {
        if (!plots.includes(plotOf(x, z))) continue;
        const wx = x - HALF;
        const wz = z - HALF;
        pts.push(wx, 0.03, wz, wx + 1, 0.03, wz, wx, 0.03, wz, wx, 0.03, wz + 1);
      }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    return g;
  }, [plots]);
  return (
    <lineSegments geometry={geo}>
      <lineBasicMaterial color="#ffffff" transparent opacity={0.35} />
    </lineSegments>
  );
}

function Ghost() {
  const placing = useGame((s) => s.ui.placing)!;
  const game = useGame((s) => s.game!);
  const def = BUILDINGS[placing.type];
  const existing = placing.uid ? game.buildings.find((b) => b.uid === placing.uid) : undefined;
  const obj = useMemo(
    () => archetype(def.archetype, { level: existing?.level ?? 1, flags: game.flags, hoodName: game.profile.hoodName, biome: WORLD.biome, style: WORLD.style, name: def.name }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [def.archetype, existing?.level, game.profile.hoodName],
  );
  const problem = placementProblem(game, placing.type, placing.x, placing.z, placing.rot, placing.uid);
  const ok = problem === null;
  const [w, d] = footprint(placing.type, placing.rot);
  const holder = useRef<THREE.Group>(null);
  useFrame(() => {
    if (holder.current) holder.current.position.y = 0.12 + Math.sin(worldClock.t * 4) * 0.04;
  });
  const cells = cellsOf(placing.type, placing.x, placing.z, placing.rot);
  const startDrag = (e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    placementDrag.active = true;
    cameraState.dragging = false;
  };
  return (
    <group>
      {cells.map(([cx, cz]) => (
        <mesh key={`${cx},${cz}`} position={[cx - HALF + 0.5, 0.035, cz - HALF + 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
          <planeGeometry args={[0.94, 0.94]} />
          <meshBasicMaterial color={ok ? '#5fd36a' : '#ff5a5a'} transparent opacity={0.55} depthWrite={false} />
        </mesh>
      ))}
      <group position={[placing.x - HALF + w / 2, 0, placing.z - HALF + d / 2]} onPointerDown={startDrag}>
        <group ref={holder} rotation={[0, placing.rot * (Math.PI / 2), 0]}>
          <primitive object={obj} />
          {/* Door direction arrow */}
          <mesh position={[0, 0.05, def.footprint[1] / 2 + 0.25]} rotation={[-Math.PI / 2, 0, 0]}>
            <circleGeometry args={[0.16, 3]} />
            <meshBasicMaterial color={ok ? '#ffffff' : '#ffd0d0'} />
          </mesh>
        </group>
      </group>
    </group>
  );
}

/** Invisible ground catcher for taps, hover-placement and ghost dragging. */
export function GroundInteraction() {
  const placing = useGame((s) => !!s.ui.placing);
  const setUI = useGame((s) => s.setUI);
  const cellFromEvent = (e: ThreeEvent<PointerEvent | MouseEvent>) => {
    const p = e.point;
    return [Math.floor(p.x + HALF), Math.floor(p.z + HALF)] as const;
  };
  const moveGhost = (cx: number, cz: number) => {
    const st = useGame.getState();
    const pl = st.ui.placing;
    if (!pl) return;
    const [w, d] = footprint(pl.type, pl.rot);
    const x = Math.max(0, Math.min(WORLD_CELLS - w, cx - Math.floor((w - 1) / 2)));
    const z = Math.max(0, Math.min(WORLD_CELLS - d, cz - Math.floor((d - 1) / 2)));
    if (x !== pl.x || z !== pl.z) st.setUI({ placing: { ...pl, x, z } });
  };
  useEffect(() => {
    const up = () => (placementDrag.active = false);
    window.addEventListener('pointerup', up);
    return () => window.removeEventListener('pointerup', up);
  }, []);
  return (
    <mesh
      rotation={[-Math.PI / 2, 0, 0]}
      position={[0, 0.001, 0]}
      onPointerMove={(e) => {
        if (!useGame.getState().ui.placing) return;
        if (placementDrag.active || e.pointerType === 'mouse') moveGhost(...cellFromEvent(e));
      }}
      onClick={(e) => {
        if (e.delta > 8 || cameraState.dragging) return;
        if (useGame.getState().ui.placing) moveGhost(...cellFromEvent(e));
        else setUI({ selected: null });
      }}
    >
      <planeGeometry args={[WORLD_CELLS + 8, WORLD_CELLS + 8]} />
      <meshBasicMaterial visible={false} />
      {placing && null}
    </mesh>
  );
}

export function Placement() {
  const placing = useGame((s) => !!s.ui.placing);
  const showGrid = useGame((s) => s.game!.settings.showGrid);
  return (
    <group>
      {(placing || showGrid) && <GridOverlay />}
      {placing && <Ghost />}
    </group>
  );
}
