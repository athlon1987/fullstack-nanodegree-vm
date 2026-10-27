import { Canvas } from '@react-three/fiber';
import { useCallback, useRef } from 'react';
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
import { htmlPortal } from './coords';

export function GameCanvas() {
  const graphics = useGame((s) => s.game!.settings.graphics);
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
      <Canvas
        shadows={graphics !== 'low'}
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
        <CameraRig />
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
