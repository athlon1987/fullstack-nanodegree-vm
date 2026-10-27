// Offscreen renders of real game models for UI: build-catalog thumbnails and
// resident portraits. Rendered once on demand, cached as data URLs.
import * as THREE from 'three';
import { WORLD } from '../data/world';
import { ACTIVE_MODULES } from '../platform/content/install';
import { BUILDINGS } from '../data/buildings';
import { archetype } from './kit/archetypes';
import { clipsOf, model } from './models/assets';

let renderer: THREE.WebGLRenderer | null = null;
const cache = new Map<string, string>();

function setup(size: number) {
  if (!renderer) {
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, preserveDrawingBuffer: true });
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.setPixelRatio(1);
  }
  renderer.setSize(size, size, false);
  const scene = new THREE.Scene();
  scene.add(new THREE.HemisphereLight('#e8f4ff', '#9ab07a', 1.3));
  const sun = new THREE.DirectionalLight('#fff3dc', 2.4);
  sun.position.set(4, 8, 6);
  scene.add(sun);
  return scene;
}

export function buildingThumb(type: string): string {
  const key = `b:${type}:${WORLD.id}:${BUILDINGS[type]?.name}:${ACTIVE_MODULES[type]?.id ?? ''}`;
  const hit = cache.get(key);
  if (hit) return hit;
  try {
    const scene = setup(256);
    const def = BUILDINGS[type];
    const m = ACTIVE_MODULES[type];
    const obj = archetype(m ? `prefab:${m.prefab}` : def.archetype, {
      level: 1,
      flags: {},
      hoodName: WORLD.hoodName,
      biome: WORLD.biome,
      name: def.name,
      module: m ? { id: `${m.id}@${m.version}`, prefab: m.prefab, palette: m.brand.palette, sign: m.brand.signText, props: m.props } : undefined,
    });
    scene.add(obj);
    const box = new THREE.Box3().setFromObject(obj);
    const size = box.getSize(new THREE.Vector3());
    const center = box.getCenter(new THREE.Vector3());
    const span = Math.max(size.x, size.z) * 0.85 + size.y * 0.55;
    const cam = new THREE.OrthographicCamera(-span / 2, span / 2, span / 2, -span / 2, 0.1, 100);
    cam.position.copy(center).add(new THREE.Vector3(10, 9, 10));
    cam.lookAt(center);
    renderer!.render(scene, cam);
    const url = renderer!.domElement.toDataURL('image/png');
    cache.set(key, url);
    return url;
  } catch {
    return '';
  }
}

export function portrait(modelName: string): string {
  const hit = cache.get(`p:${modelName}`);
  if (hit) return hit;
  try {
    const scene = setup(192);
    const m = model(modelName, 1);
    // Pose: first frame of the idle clip so arms aren't in T-pose
    const idle = clipsOf(modelName).find((c) => c.name === 'idle');
    if (idle) {
      const mixer = new THREE.AnimationMixer(m);
      mixer.clipAction(idle).play();
      mixer.update(0.4);
    }
    m.rotation.y = 0.35;
    scene.add(m);
    const cam = new THREE.PerspectiveCamera(26, 1, 0.1, 50);
    cam.position.set(0.25, 0.86, 2.1);
    cam.lookAt(0, 0.68, 0);
    renderer!.render(scene, cam);
    const url = renderer!.domElement.toDataURL('image/png');
    cache.set(`p:${modelName}`, url);
    return url;
  } catch {
    return '';
  }
}
