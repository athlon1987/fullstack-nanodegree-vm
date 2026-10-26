// Animated actor: a normalised rigged model plus an animation state machine with
// crossfades. Clip names are resolved per rig (Kenney humanoids / Quaternius animals).
import * as THREE from 'three';
import { clipsOf, model } from '../models/assets';

export type AnimState = 'idle' | 'walk' | 'run' | 'talk' | 'wave' | 'celebrate' | 'sit' | 'work' | 'surprised' | 'happy' | 'eat' | 'crouch';

const HUMANOID: Record<AnimState, string[]> = {
  idle: ['idle'],
  walk: ['walk'],
  run: ['sprint'],
  talk: ['emote-yes', 'idle'],
  wave: ['interact-right', 'emote-yes'],
  celebrate: ['jump', 'emote-yes'],
  sit: ['sit'],
  work: ['interact-right'],
  surprised: ['emote-no'],
  happy: ['emote-yes'],
  eat: ['pick-up'],
  crouch: ['crouch'],
};

const ANIMAL: Record<AnimState, string[]> = {
  idle: ['Idle', 'Idle_2'],
  walk: ['Walk', 'Run', 'Gallop'],
  run: ['Run', 'Gallop', 'Walk'],
  talk: ['Idle_2', 'Idle'],
  wave: ['Headbutt', 'Jump', 'Idle'],
  celebrate: ['Jump', 'Jump_Loop', 'Gallop_Jump', 'Idle'],
  sit: ['Idle_2_HeadLow', 'Idle_Headlow', 'Idle'],
  work: ['Idle_Eating', 'Eating', 'Idle'],
  surprised: ['Idle_HitReact_Left', 'Idle'],
  happy: ['Jump', 'Idle'],
  eat: ['Idle_Eating', 'Eating', 'Idle'],
  crouch: ['Idle_2_HeadLow', 'Idle'],
};

const ONE_SHOT = new Set<AnimState>(['wave', 'celebrate', 'surprised', 'happy']);

function findClip(clips: THREE.AnimationClip[], names: string[]) {
  for (const n of names) {
    const exact = clips.find((c) => c.name.toLowerCase() === n.toLowerCase());
    if (exact) return exact;
    const suffix = clips.find((c) => c.name.split('|').pop()!.toLowerCase() === n.toLowerCase());
    if (suffix) return suffix;
  }
  return null;
}

export class Actor {
  readonly root = new THREE.Group();
  readonly body: THREE.Group;
  private mixer: THREE.AnimationMixer;
  private actions = new Map<AnimState, THREE.AnimationAction>();
  private current: AnimState | null = null;
  private oneShotUntil = 0;
  private time = 0;
  readonly missing: AnimState[] = [];

  constructor(modelName: string, height: number, kind: 'humanoid' | 'animal', yawOffset = 0) {
    this.body = model(modelName, height);
    this.body.rotation.y = yawOffset;
    this.root.add(this.body);
    this.mixer = new THREE.AnimationMixer(this.body);
    const clips = clipsOf(modelName);
    const table = kind === 'humanoid' ? HUMANOID : ANIMAL;
    for (const state of Object.keys(table) as AnimState[]) {
      const clip = findClip(clips, table[state]);
      if (!clip) {
        this.missing.push(state);
        continue;
      }
      const action = this.mixer.clipAction(clip);
      if (ONE_SHOT.has(state)) {
        action.setLoop(THREE.LoopOnce, 1);
        action.clampWhenFinished = true;
      }
      this.actions.set(state, action);
    }
    this.play('idle', 0);
  }

  /** Transition with a crossfade; one-shots return to `after` when finished. */
  play(state: AnimState, fade = 0.25, timeScale = 1) {
    if (this.time < this.oneShotUntil && !ONE_SHOT.has(state)) return;
    const next = this.actions.get(state) ?? this.actions.get('idle');
    if (!next) return;
    if (this.current === state && !ONE_SHOT.has(state)) {
      next.timeScale = timeScale;
      return;
    }
    const prev = this.current ? this.actions.get(this.current) : null;
    next.reset();
    next.timeScale = timeScale;
    next.setEffectiveWeight(1);
    next.play();
    if (prev && prev !== next) prev.crossFadeTo(next, fade, false);
    this.current = state;
    if (ONE_SHOT.has(state)) this.oneShotUntil = this.time + next.getClip().duration / Math.max(0.1, timeScale);
  }

  get state() {
    return this.current;
  }

  get busyOneShot() {
    return this.time < this.oneShotUntil;
  }

  update(dt: number) {
    this.time += dt;
    if (this.current && ONE_SHOT.has(this.current) && this.time >= this.oneShotUntil) this.play('idle');
    this.mixer.update(dt);
  }
}
