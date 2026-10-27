import { Canvas, useThree } from '@react-three/fiber';
import { useCallback, useEffect, useRef } from 'react';
import * as THREE from 'three';
import { useGame } from '../../state/store';
import { CameraRig } from '../camera/CameraRig';
import { Pets, Residents } from '../characters/Characters';
import { Ambient } from '../effects/Ambient';
import { Rain } from '../effects/Rain';
import { Lighting } from '../lighting/Lighting';
import { Buildings } from './Buildings';
import { GroundInteraction, Placement } from './Placement';
import { Terrain } from './Terrain';
import { htmlPortal, weatherState, worldClock } from './coords';
import { RoomEnvironment } from 'three/examples/jsm/environments/RoomEnvironment.js';
import { useFrame } from '@react-three/fiber';
import { WORLD } from '../../data/world';

/** City look: neutral tone mapping keeps saturated paint and signage true, and a soft studio
 *  reflection gives glass, metal and glossy facades their polish. Other worlds keep ACES. */
function CityLook() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const rev = useGame((s) => s.contentRev);
  useEffect(() => {
    if (WORLD.style !== 'urban') {
      gl.toneMapping = THREE.ACESFilmicToneMapping;
      gl.toneMappingExposure = 1.05;
      scene.environment = null;
      return;
    }
    gl.toneMapping = THREE.NeutralToneMapping;
    gl.toneMappingExposure = 0.98;
    const pmrem = new THREE.PMREMGenerator(gl);
    const env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = env;
    return () => {
      scene.environment = null;
      env.dispose();
      pmrem.dispose();
    };
  }, [gl, scene, rev]);
  useFrame(() => {
    if (scene.environment) scene.environmentIntensity = 0.32 * (1 - worldClock.night * 0.75);
  });
  return null;
}

/** Battery saver: render on demand at a steady 30 fps instead of every display frame. */
function FrameCap({ fps }: { fps: number }) {
  const invalidate = useThree((s) => s.invalidate);
  useEffect(() => {
    let raf = 0;
    let last = 0;
    const loop = (t: number) => {
      if (t - last >= 1000 / fps - 2) {
        last = t;
        invalidate();
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [fps, invalidate]);
  return null;
}

/** After a shower the sun comes out with a rainbow: a soft arc of light across the sky. */
function Rainbow() {
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const id = window.setInterval(() => {
      if (ref.current) ref.current.style.opacity = String(Math.max(0, weatherState.afterglow * (1 - worldClock.night)) * 0.7);
    }, 500);
    return () => window.clearInterval(id);
  }, []);
  return <div className="rainbow" ref={ref} aria-hidden="true" />;
}

export function GameCanvas() {
  const graphics = useGame((s) => s.game!.settings.graphics);
  const saver = useGame((s) => !!s.game!.settings.batterySaver);
  const sky = useRef<HTMLDivElement>(null);
  const onSky = useCallback((top: string, bottom: string) => {
    if (sky.current) sky.current.style.background = `linear-gradient(180deg, ${top} 0%, ${bottom} 75%)`;
  }, []);
  const dpr: [number, number] = graphics === 'high' ? [1, 2] : graphics === 'medium' ? [1, 1.5] : [0.75, 1];
  return (
    <div className="world" ref={sky}>
      <div
        className="world-html"
        ref={(el) => {
          if (el) htmlPortal.current = el;
        }}
      />
      <Rainbow />
      <Canvas
        shadows={graphics !== 'low'}
        frameloop={saver ? 'demand' : 'always'}
        orthographic
        dpr={dpr}
        camera={{ position: [40, 45, 40], zoom: 48, near: 0.1, far: 300 }}
        gl={{ antialias: true, alpha: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }}
        onCreated={({ gl, scene }) => {
          (window as unknown as { __scene: THREE.Scene; __gl: THREE.WebGLRenderer }).__scene = scene;
          (window as unknown as { __gl: THREE.WebGLRenderer }).__gl = gl;
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.05;
          gl.outputColorSpace = THREE.SRGBColorSpace;
          gl.setClearColor(0x000000, 0);
        }}
        data-testid="game-canvas"
      >
        {saver && <FrameCap fps={30} />}
        <CameraRig />
        <CityLook />
        <Lighting onSky={onSky} />
        <Terrain />
        <GroundInteraction />
        <Buildings />
        <Placement />
        <Residents />
        <Pets />
        <Ambient />
        <Rain />
      </Canvas>
    </div>
  );
}
