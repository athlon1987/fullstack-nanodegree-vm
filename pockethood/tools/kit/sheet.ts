// Developer contact sheet for the parametric architecture kit: renders archetypes side by side
// under game-like lighting. Dev server only, e.g.
//   /tools/kit/sheet.html?a=kl:terrace,kl:condo&level=2&style=urban&cols=4
// Optional: stage=N (community projects), flags=a,b, zoom=N, angle=deg, night=1.
import * as THREE from 'three';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { archetype } from '../../src/rendering/kit/archetypes';
import { setNightAmount } from '../../src/rendering/kit/materials';

const q = new URLSearchParams(location.search);
const list = (q.get('a') ?? '').split(',').filter(Boolean);
const cols = Number(q.get('cols') ?? Math.min(4, list.length || 1));
const level = Number(q.get('level') ?? 1);
const style = (q.get('style') ?? 'urban') as 'classic' | 'kampung' | 'urban';
const night = q.get('night') === '1';
const flags = Object.fromEntries((q.get('flags') ?? '').split(',').filter(Boolean).map((f) => [f, true]));
const cell = Number(q.get('cell') ?? 5);

const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
renderer.setSize(innerWidth, innerHeight);
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = style === 'urban' ? THREE.NeutralToneMapping : THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = style === 'urban' ? 0.98 : 1.05;
document.body.appendChild(renderer.domElement);

const scene = new THREE.Scene();
scene.background = new THREE.Color(night ? '#27336a' : '#bfe6f2');
if (style === 'urban') {
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(), 0.04).texture;
  scene.environmentIntensity = night ? 0.08 : 0.32;
}
scene.add(new THREE.HemisphereLight(night ? '#6676b4' : '#d7ecff', night ? '#343e5c' : '#9ab07a', night ? 0.72 : 1.15));
const sun = new THREE.DirectionalLight(night ? '#7f8fcf' : '#fff3dc', night ? 0.45 : 2.6);
sun.position.set(12, 20, 8);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
Object.assign(sun.shadow.camera, { left: -30, right: 30, top: 30, bottom: -30 });
scene.add(sun);
setNightAmount(night ? 1 : 0);

const rows = Math.ceil(list.length / cols);
const ground = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), new THREE.MeshStandardMaterial({ color: '#6cc157' }));
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);
list.forEach((a, i) => {
  const g = archetype(a, { level, flags, hoodName: 'Seri Bayu', stage: q.has('stage') ? Number(q.get('stage')) : undefined, biome: 'tropical', style });
  g.position.set((i % cols) * cell - ((cols - 1) * cell) / 2, 0, Math.floor(i / cols) * cell - ((rows - 1) * cell) / 2);
  g.traverse((o) => {
    if ((o as THREE.Mesh).isMesh) o.castShadow = o.receiveShadow = true;
  });
  scene.add(g);
});

const aspect = innerWidth / innerHeight;
const zoom = Number(q.get('zoom') ?? 1);
const span = (Math.max(cols, rows * aspect) * cell) / 2 / zoom;
const cam = new THREE.OrthographicCamera(-span, span, span / aspect, -span / aspect, 0.1, 400);
const ang = (Number(q.get('angle') ?? 45) * Math.PI) / 180;
cam.position.set(Math.sin(ang) * 60, 55, Math.cos(ang) * 60);
cam.lookAt(0, 0.8, 0);
renderer.render(scene, cam);
(window as unknown as { __ready: boolean }).__ready = true;
