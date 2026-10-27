// Isometric orthographic camera: drag-to-pan with inertia, wheel & pinch zoom,
// bounds restricted to owned land, smooth focus for tutorials and selections.
import { useFrame, useThree } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { EXPANSIONS, START_PLOTS } from '../../data/progression';
import { useGame } from '../../state/store';
import { HALF, placementDrag, projector } from '../scene/coords';

const DIR = new THREE.Vector3(1, 1.12, 1).normalize();
const DIST = 40;
export const ZOOM_MIN = 0.55;
export const ZOOM_MAX = 2.6;

export const cameraState = {
  target: new THREE.Vector3(1, 0, 2.5),
  vel: new THREE.Vector2(),
  zoom: 1.45,
  /** Base pixels-per-unit for this viewport; zoom multiplies it. */
  base: 48,
  dragging: false,
  /** Last time the player touched the camera (Zen Mode drifts gently when idle). */
  lastInput: 0,
};

const ground = new THREE.Plane(new THREE.Vector3(0, 1, 0), 0);
const ray = new THREE.Raycaster();

export function CameraRig() {
  const { camera, gl, size } = useThree();
  const focusAnim = useRef<{ from: THREE.Vector3; to: THREE.Vector3; z0: number; z1: number; t: number } | null>(null);
  const focus = useGame((s) => s.ui.focus);
  const plots = useGame((s) => s.game?.plots ?? START_PLOTS);

  // Fit the starting neighborhood comfortably on any screen.
  useEffect(() => {
    cameraState.base = Math.max(28, Math.min(size.width / 22, size.height / 13));
    projector.width = size.width;
    projector.height = size.height;
  }, [size]);

  useEffect(() => {
    if (!focus) return;
    focusAnim.current = {
      from: cameraState.target.clone(),
      to: new THREE.Vector3(focus.x, 0, focus.z),
      z0: cameraState.zoom,
      z1: focus.zoom ?? Math.max(cameraState.zoom, 1.25),
      t: 0,
    };
  }, [focus]);

  useEffect(() => {
    const el = gl.domElement;
    const pointers = new Map<number, { x: number; y: number }>();
    let last: THREE.Vector3 | null = null;
    let pinchDist = 0;
    let lastMove = 0;

    const groundAt = (cx: number, cy: number) => {
      const r = el.getBoundingClientRect();
      const ndc = new THREE.Vector2(((cx - r.left) / r.width) * 2 - 1, -((cy - r.top) / r.height) * 2 + 1);
      ray.setFromCamera(ndc, camera);
      const p = new THREE.Vector3();
      return ray.ray.intersectPlane(ground, p) ? p : null;
    };

    const down = (e: PointerEvent) => {
      cameraState.lastInput = performance.now();
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 1) {
        last = groundAt(e.clientX, e.clientY);
        cameraState.vel.set(0, 0);
        focusAnim.current = null;
      } else if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        pinchDist = Math.hypot(a.x - b.x, a.y - b.y);
      }
    };
    const move = (e: PointerEvent) => {
      if (!pointers.has(e.pointerId)) return;
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
      if (pointers.size === 2) {
        const [a, b] = [...pointers.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y);
        if (pinchDist > 0) setZoom(cameraState.zoom * (d / pinchDist));
        pinchDist = d;
        return;
      }
      if (!last || placementDrag.active) return;
      const now = groundAt(e.clientX, e.clientY);
      if (!now) return;
      const dx = last.x - now.x;
      const dz = last.z - now.z;
      if (Math.hypot(dx, dz) > 0.0001) {
        cameraState.dragging = true;
        cameraState.target.x += dx;
        cameraState.target.z += dz;
        const dt = Math.max(1, performance.now() - lastMove);
        cameraState.vel.set((dx / dt) * 16, (dz / dt) * 16);
        lastMove = performance.now();
        camera.position.copy(cameraState.target).addScaledVector(DIR, DIST);
        camera.updateMatrixWorld();
        last = groundAt(e.clientX, e.clientY);
      }
    };
    const up = (e: PointerEvent) => {
      pointers.delete(e.pointerId);
      if (pointers.size === 0) {
        last = null;
        if (performance.now() - lastMove > 80) cameraState.vel.set(0, 0);
        window.setTimeout(() => (cameraState.dragging = false), 0);
      }
      if (pointers.size < 2) pinchDist = 0;
    };
    const wheel = (e: WheelEvent) => {
      cameraState.lastInput = performance.now();
      e.preventDefault();
      focusAnim.current = null;
      setZoom(cameraState.zoom * Math.exp(-e.deltaY * 0.0015));
    };
    el.addEventListener('pointerdown', down);
    window.addEventListener('pointermove', move);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    el.addEventListener('wheel', wheel, { passive: false });
    return () => {
      el.removeEventListener('pointerdown', down);
      window.removeEventListener('pointermove', move);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      el.removeEventListener('wheel', wheel);
    };
  }, [camera, gl]);

  useFrame((_, dt) => {
    const cam = camera as THREE.OrthographicCamera;
    const f = focusAnim.current;
    const settings = useGame.getState().game?.settings;
    const zen = !!settings?.zen;
    if (f) {
      f.t = Math.min(1, f.t + dt * (settings?.reducedMotion ? 4 : zen ? 0.8 : 1.6));
      const e = 1 - Math.pow(1 - f.t, 3);
      cameraState.target.lerpVectors(f.from, f.to, e);
      cameraState.zoom = f.z0 + (f.z1 - f.z0) * e;
      if (f.t >= 1) focusAnim.current = null;
    } else if (!cameraState.dragging && cameraState.vel.lengthSq() > 1e-6) {
      const k = zen ? 2.2 : 3.5;
      cameraState.target.x += cameraState.vel.x * dt * k;
      cameraState.target.z += cameraState.vel.y * dt * k;
      cameraState.vel.multiplyScalar(Math.pow(zen ? 0.05 : 0.02, dt));
    } else if (zen && !settings?.reducedMotion && !cameraState.dragging && performance.now() - cameraState.lastInput > 20_000) {
      // A slow, wandering drift — like letting your eyes rest on the scene.
      const t = performance.now() / 1000;
      cameraState.target.x += Math.sin(t * 0.07) * dt * 0.12;
      cameraState.target.z += Math.cos(t * 0.05) * dt * 0.1;
    }
    // Bounds: owned land plus a margin
    const owned = plots.map((p) => EXPANSIONS.find((e) => e.id === p)?.rect ?? startRect(p));
    const minX = Math.min(...owned.map((r) => r[0])) - HALF - 2;
    const maxX = Math.max(...owned.map((r) => r[0] + r[2])) - HALF + 2;
    const minZ = Math.min(...owned.map((r) => r[1])) - HALF - 2;
    const maxZ = Math.max(...owned.map((r) => r[1] + r[3])) - HALF + 4;
    cameraState.target.x = THREE.MathUtils.clamp(cameraState.target.x, minX, maxX);
    cameraState.target.z = THREE.MathUtils.clamp(cameraState.target.z, minZ, maxZ);
    cam.position.copy(cameraState.target).addScaledVector(DIR, DIST);
    cam.lookAt(cameraState.target);
    const z = cameraState.base * cameraState.zoom;
    if (Math.abs(cam.zoom - z) > 1e-3) {
      cam.zoom = z;
      cam.updateProjectionMatrix();
    }
    projector.camera = cam;
  });

  return null;
}

function setZoom(z: number) {
  cameraState.zoom = THREE.MathUtils.clamp(z, ZOOM_MIN, ZOOM_MAX);
}

function startRect(id: string): [number, number, number, number] {
  const px = Number(id[1]);
  const pz = Number(id[2]);
  return [px * 6, pz * 6, 6, 6];
}

export const zoomBy = (f: number) => setZoom(cameraState.zoom * f);
