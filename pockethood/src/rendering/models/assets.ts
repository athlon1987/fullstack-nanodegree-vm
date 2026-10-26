// Runtime model registry: preloads the imported CC0 GLBs (see scripts/asset-pipeline;
// they are quantised but not meshopt-compressed, so no WebAssembly decoder is needed),
// then hands out normalised clones (consistent scale, ground at y=0, centred).
import * as THREE from 'three';
import { GLTFLoader, type GLTF } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';
import catalog from './catalog.generated.json';

export type ModelName = keyof typeof catalog;
export const CATALOG = catalog as Record<string, { url: string; category: string; clips: string[]; tris: number; bytes: number }>;

/** Builds for text-only hosts ship models as embedded JSON glTF (see export-embedded.mjs). */
const MODEL_EXT: string = import.meta.env.VITE_MODEL_EXT || '.glb';

const loaded = new Map<string, GLTF>();
const scaleCache = new Map<string, { s: number; offset: THREE.Vector3 }>();

export async function preloadModels(names: string[], base: string, onProgress: (done: number, total: number) => void) {
  const loader = new GLTFLoader();
  let done = 0;
  await Promise.all(
    names.map(async (n) => {
      try {
        const gltf = await loader.loadAsync(base + CATALOG[n].url.replace(/\.glb$/, MODEL_EXT));
        gltf.scene.traverse((o) => {
          const m = o as THREE.Mesh;
          if (m.isMesh) {
            m.castShadow = true;
            m.receiveShadow = true;
            const mats = Array.isArray(m.material) ? m.material : [m.material];
            for (const mt of mats) {
              const sm = mt as THREE.MeshStandardMaterial;
              if (sm.map) sm.map.anisotropy = 4;
              sm.roughness = Math.max(sm.roughness ?? 1, 0.6);
              sm.metalness = Math.min(sm.metalness ?? 0, 0.15);
            }
          }
        });
        loaded.set(n, gltf);
      } catch (e) {
        console.error(`Model failed to load: ${n}`, e);
      }
      onProgress(++done, names.length);
    }),
  );
}

export const hasModel = (n: string) => loaded.has(n);
export const clipsOf = (n: string) => loaded.get(n)?.animations ?? [];

function rawClone(n: string): THREE.Object3D {
  const g = loaded.get(n);
  if (!g) return new THREE.Group();
  let skinned = false;
  g.scene.traverse((o) => {
    if ((o as THREE.SkinnedMesh).isSkinnedMesh) skinned = true;
  });
  return skinned ? skeletonClone(g.scene) : g.scene.clone(true);
}

/**
 * A normalised clone: the model is scaled so its height equals `height`
 * (world units, 1 = one grid cell), centred in XZ, with its base at y = 0.
 */
export function model(n: string, height: number): THREE.Group {
  const inner = rawClone(n);
  const wrap = new THREE.Group();
  wrap.name = n;
  let norm = scaleCache.get(n);
  if (!norm) {
    inner.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(inner, true);
    const size = box.getSize(new THREE.Vector3());
    const s = 1 / Math.max(size.y, 1e-6);
    norm = { s, offset: new THREE.Vector3(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2) };
    scaleCache.set(n, norm);
  }
  inner.position.copy(norm.offset);
  wrap.add(inner);
  wrap.scale.setScalar(norm.s * height);
  return wrap;
}

const tintCache = new Map<string, THREE.Material>();

/** Recolour a cloned model's named materials (palette harmonisation per use). Tinted materials are shared. */
export function tint(obj: THREE.Object3D, colors: Record<string, string>) {
  obj.traverse((o) => {
    const m = o as THREE.Mesh;
    if (!m.isMesh) return;
    const apply = (mt: THREE.Material) => {
      const c = colors[mt.name];
      if (!c) return mt;
      const k = `${mt.uuid}:${c}`;
      let copy = tintCache.get(k);
      if (!copy) {
        copy = (mt as THREE.MeshStandardMaterial).clone();
        (copy as THREE.MeshStandardMaterial).color.set(c);
        tintCache.set(k, copy);
      }
      return copy;
    };
    m.material = Array.isArray(m.material) ? m.material.map(apply) : apply(m.material);
  });
  return obj;
}

/** Every model the game needs at start (preloaded behind the loading screen). */
export const ALL_MODELS = Object.keys(CATALOG);
