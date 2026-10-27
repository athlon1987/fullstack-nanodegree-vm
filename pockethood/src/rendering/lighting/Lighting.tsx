// Coherent sun + sky lighting driven by the visual time of day.
import { useFrame } from '@react-three/fiber';
import { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { hourOfDay } from '../../services/clock';
import { clock } from '../../services/clock';
import { useGame } from '../../state/store';
import { setNightAmount } from '../kit/materials';
import { weatherState, worldClock } from '../scene/coords';
import { WORLD } from '../../data/world';

const KEYS: { h: number; sun: string; sunI: number; sky: string; ground: string; hemiI: number; bgTop: string; bgBottom: string }[] = [
  { h: 0, sun: '#7f8fcf', sunI: 0.45, sky: '#6676b4', ground: '#343e5c', hemiI: 0.72, bgTop: '#1f2a52', bgBottom: '#44558a' },
  { h: 5.5, sun: '#9a8fd0', sunI: 0.35, sky: '#8090c8', ground: '#4a4a60', hemiI: 0.7, bgTop: '#3d4f86', bgBottom: '#f0b8a0' },
  { h: 7.5, sun: '#ffd2a1', sunI: 1.9, sky: '#cfe6ff', ground: '#8c9a70', hemiI: 1.05, bgTop: '#8fcbe8', bgBottom: '#ffe3c4' },
  { h: 12, sun: '#fff3dc', sunI: 2.6, sky: '#d7ecff', ground: '#9ab07a', hemiI: 1.15, bgTop: '#76c3e6', bgBottom: '#d9f2ef' },
  { h: 16.5, sun: '#ffe2b8', sunI: 2.3, sky: '#d9e8ff', ground: '#a3a878', hemiI: 1.1, bgTop: '#7cc0e2', bgBottom: '#f3ecd6' },
  { h: 18, sun: '#ffc27a', sunI: 2.0, sky: '#ffe2c2', ground: '#a8946a', hemiI: 1.0, bgTop: '#7fb2dd', bgBottom: '#ffcf96' },
  { h: 19, sun: '#ff9f6b', sunI: 1.3, sky: '#f0b9a0', ground: '#7a6458', hemiI: 0.85, bgTop: '#5d7fc0', bgBottom: '#ffb38a' },
  { h: 21, sun: '#8a8fd0', sunI: 0.55, sky: '#7480bc', ground: '#3a4058', hemiI: 0.78, bgTop: '#2a3768', bgBottom: '#62679f' },
  { h: 24, sun: '#7f8fcf', sunI: 0.45, sky: '#6676b4', ground: '#343e5c', hemiI: 0.72, bgTop: '#1f2a52', bgBottom: '#44558a' },
];

const tmpA = new THREE.Color();
const tmpB = new THREE.Color();
const lerpHex = (a: string, b: string, t: number) => tmpA.set(a).lerp(tmpB.set(b), t).clone();

export function sample(hour: number) {
  let i = 0;
  while (i < KEYS.length - 2 && hour > KEYS[i + 1].h) i++;
  const a = KEYS[i];
  const b = KEYS[i + 1];
  const t = Math.min(1, Math.max(0, (hour - a.h) / (b.h - a.h)));
  return {
    sun: lerpHex(a.sun, b.sun, t),
    sunI: a.sunI + (b.sunI - a.sunI) * t,
    sky: lerpHex(a.sky, b.sky, t),
    ground: lerpHex(a.ground, b.ground, t),
    hemiI: a.hemiI + (b.hemiI - a.hemiI) * t,
    bgTop: lerpHex(a.bgTop, b.bgTop, t),
    bgBottom: lerpHex(a.bgBottom, b.bgBottom, t),
  };
}

export function Lighting({ onSky }: { onSky: (top: string, bottom: string) => void }) {
  const sun = useRef<THREE.DirectionalLight>(null);
  const hemi = useRef<THREE.HemisphereLight>(null);
  const graphics = useGame((s) => s.game?.settings.graphics ?? 'high');
  const lastSky = useRef('');
  const lastHourPush = useRef(0);

  useEffect(() => {
    const l = sun.current;
    if (!l) return;
    const size = graphics === 'high' ? 2048 : 1024;
    l.shadow.mapSize.set(size, size);
    l.shadow.map?.dispose();
    l.shadow.map = null as unknown as THREE.WebGLRenderTarget;
  }, [graphics]);

  const frame = useRef(0);
  useFrame(({ gl, scene }, dt) => {
    const g = useGame.getState().game;
    if (!g || !sun.current || !hemi.current) return;
    // Shadow maps: every frame on high; every 2nd/3rd frame on lower presets.
    const every = g.settings.graphics === 'high' ? 1 : g.settings.graphics === 'medium' ? 2 : 3;
    gl.shadowMap.autoUpdate = false;
    if (frame.current++ % every === 0) gl.shadowMap.needsUpdate = true;
    const hour = hourOfDay(clock.now(), g.settings.dayNight, g.profile.createdAt);
    worldClock.hour = hour;
    worldClock.t += dt;
    const s = sample(hour);
    // Sun arcs east → west; stays above the horizon so shadows never flip.
    const dayT = Math.min(1, Math.max(0, (hour - 6) / 13));
    const az = -0.6 + dayT * 1.9;
    const el = 0.55 + Math.sin(dayT * Math.PI) * 0.5;
    sun.current.position.set(Math.cos(az) * 14, 10 + el * 8, Math.sin(az) * 10 + 6);
    // Rain dims and cools the light and greys the sky.
    const rain = weatherState.rain;
    const cloud = weatherState.cloud;
    const glow = weatherState.afterglow;
    sun.current.color.copy(s.sun).lerp(tmpB.set('#b8c4cc'), rain * 0.5).lerp(tmpB.set('#fff1c9'), glow * 0.3);
    sun.current.intensity = s.sunI * (1 - rain * 0.55) * (1 - Math.max(0, cloud - 0.4) * 0.25) * (1 + glow * 0.15);
    hemi.current.color.copy(s.sky).lerp(tmpB.set('#aab6bf'), rain * 0.5);
    hemi.current.groundColor.copy(s.ground);
    hemi.current.intensity = s.hemiI * (1 - rain * 0.2);
    s.bgTop.lerp(tmpB.set('#8e9aa6'), rain * 0.6);
    s.bgBottom.lerp(tmpB.set('#c3cbd1'), rain * 0.6).lerp(tmpB.set('#eef3f2'), weatherState.mist * 0.5);
    // Morning mist: a soft, light haze over the whole scene (never dark, never hiding anything).
    const mist = weatherState.mist;
    if (mist > 0.02) {
      if (!(scene.fog instanceof THREE.FogExp2)) scene.fog = new THREE.FogExp2('#eef3f2', 0);
      (scene.fog as THREE.FogExp2).density = 0.0075 * mist;
      (scene.fog as THREE.FogExp2).color.set('#eef3f2').lerp(s.sky, 0.3);
    } else if (scene.fog) scene.fog = null;
    const night = hour < 6 || hour > 20 ? 1 : hour < 7.5 ? (7.5 - hour) / 1.5 : hour > 18.5 ? (hour - 18.5) / 1.5 : 0;
    worldClock.night = night;
    setNightAmount(night);
    // The city sky is a touch clearer and bluer than the countryside haze.
    if (WORLD.style === 'urban') {
      s.bgTop.offsetHSL(0, 0.1, -0.02);
      s.bgBottom.offsetHSL(0, 0.06, 0);
    }
    const key = `${s.bgTop.getHexString()}${s.bgBottom.getHexString()}`;
    if (key !== lastSky.current) {
      lastSky.current = key;
      onSky(`#${s.bgTop.getHexString()}`, `#${s.bgBottom.getHexString()}`);
    }
    if (performance.now() - lastHourPush.current > 3000) {
      lastHourPush.current = performance.now();
      useGame.getState().setUI({ hour });
    }
  });

  return (
    <>
      <hemisphereLight ref={hemi} args={['#d7ecff', '#9ab07a', 1.1]} />
      <ambientLight intensity={0.18} />
      <directionalLight
        ref={sun}
        castShadow={graphics !== 'low'}
        position={[10, 16, 8]}
        intensity={2.4}
        shadow-bias={-0.0004}
        shadow-normalBias={0.025}
        shadow-camera-left={-17}
        shadow-camera-right={17}
        shadow-camera-top={17}
        shadow-camera-bottom={-17}
        shadow-camera-near={0.5}
        shadow-camera-far={60}
        shadow-radius={3}
      />
    </>
  );
}
