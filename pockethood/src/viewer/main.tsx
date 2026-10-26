// Developer-only asset contact sheet: renders every model in a grid for visual QA.
import { createRoot } from 'react-dom/client';
import { Canvas } from '@react-three/fiber';
import { OrbitControls, useGLTF, Html } from '@react-three/drei';
import { Suspense, useMemo } from 'react';
import * as THREE from 'three';
import { clone as skeletonClone } from 'three/examples/jsm/utils/SkeletonUtils.js';

const params = new URLSearchParams(location.search);
const names = (params.get('m') ?? '').split(',').filter(Boolean);
const base = params.get('base') ?? 'assets/_src/';
const cols = Number(params.get('cols') ?? 6);
const zoom = Number(params.get('zoom') ?? 55);
const ground = params.get('ground') !== '0';

function Fit({ url, label }: { url: string; label: string }) {
  const { scene } = useGLTF(url);
  const obj = useMemo(() => {
    const o = skeletonClone(scene);
    o.updateMatrixWorld(true);
    const box = new THREE.Box3().setFromObject(o, true);
    const size = box.getSize(new THREE.Vector3());
    const s = 1.6 / Math.max(size.x, size.y, size.z);
    const wrap = new THREE.Group();
    wrap.add(o);
    o.position.set(-(box.min.x + box.max.x) / 2, -box.min.y, -(box.min.z + box.max.z) / 2);
    wrap.scale.setScalar(s);
    o.traverse((c) => { if ((c as THREE.Mesh).isMesh) { c.castShadow = true; c.receiveShadow = true; } });
    return wrap;
  }, [scene]);
  return (
    <group>
      <primitive object={obj} />
      <Html position={[0, -0.1, 0.9]} center style={{ font: '11px system-ui', color: '#223', whiteSpace: 'nowrap' }}>{label}</Html>
    </group>
  );
}

function App() {
  return (
    <Canvas shadows orthographic camera={{ position: [20, 20, 20], zoom }} gl={{ preserveDrawingBuffer: true }}>
      <color attach="background" args={['#cfe9ef']} />
      <hemisphereLight args={['#fff', '#8a7', 1.2]} />
      <directionalLight position={[10, 18, 6]} intensity={2.2} castShadow shadow-mapSize={[2048, 2048]}
        shadow-camera-left={-20} shadow-camera-right={20} shadow-camera-top={20} shadow-camera-bottom={-20} />
      {ground && <mesh rotation={[-Math.PI / 2, 0, 0]} receiveShadow position={[0, -0.01, 0]}>
        <planeGeometry args={[80, 80]} />
        <meshStandardMaterial color="#9bd46a" />
      </mesh>}
      <Suspense fallback={null}>
        {names.map((n, i) => (
          <group key={n} position={[(i % cols) * 2.4 - ((cols - 1) * 2.4) / 2, 0, Math.floor(i / cols) * 2.4 - (Math.ceil(names.length / cols) - 1) * 1.2]}>
            <Fit url={`${base}${n}.glb`} label={n} />
          </group>
        ))}
      </Suspense>
      <OrbitControls />
    </Canvas>
  );
}

createRoot(document.getElementById('root')!).render(<App />);
