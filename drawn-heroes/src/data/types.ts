export type Reaction = 'stagger' | 'launch' | 'knockdown';

export type SfxId =
  | 'swingLight'
  | 'swingHeavy'
  | 'hitLight'
  | 'hitHeavy'
  | 'block'
  | 'parry'
  | 'jump'
  | 'land'
  | 'dodge'
  | 'bark'
  | 'howl'
  | 'banana'
  | 'chatter'
  | 'coin'
  | 'pencil'
  | 'heal'
  | 'telegraph'
  | 'explode'
  | 'roar'
  | 'revive'
  | 'down'
  | 'uiMove'
  | 'uiSelect'
  | 'uiBack'
  | 'crate'
  | 'shoot'
  | 'stomp'
  | 'plate'
  | 'gate'
  | 'team'
  | 'heartbeat'
  | 'fall'
  | 'horn'
  | 'steam'
  | 'clang';

export interface HitboxDef {
  /** forward offset of the box centre from the attacker, in facing direction */
  fx: number;
  w: number;
  /** bottom of the box above the attacker's feet */
  y: number;
  h: number;
  /** depth half-thickness */
  d: number;
}

export interface AttackDef {
  id: string;
  pose: string;
  startup: number;
  active: number;
  recovery: number;
  damage: number;
  hitbox: HitboxDef;
  kbX: number;
  kbY: number;
  hitstun: number;
  reaction: Reaction;
  lunge?: number;
  next?: string;
  multiHit?: number;
  hitstop?: number;
  shake?: number;
  meter?: number;
  sfx?: SfxId;
  hitSfx?: SfxId;
  armor?: boolean;
  invuln?: [number, number];
  charge?: { max: number; dmg: number; kb: number };
  aerial?: boolean;
  ring?: boolean;
  unblockable?: boolean;
  breaksGuard?: boolean;
  armorDamage?: number;
  telegraph?: boolean;
  projectile?: string;
  vy?: number;
  /** spawn a ground shockwave ring when the active phase starts */
  shockwave?: { radius: number; damage: number };
  fxColor?: string;
}

export interface ProjectileDef {
  id: string;
  speed: number;
  gravity: number;
  arc?: boolean; // lob toward a target position
  damage: number;
  kbX: number;
  kbY: number;
  reaction: Reaction;
  hitstun: number;
  life: number;
  w: number;
  h: number;
  d: number;
  boomerang?: number; // distance before returning
  pierce?: boolean;
  art: 'banana' | 'inkblob' | 'staple' | 'beam' | 'quill' | 'shockwave' | 'inkdrop';
  reflectable?: boolean;
}

export type HeroId = 'momo' | 'scout';

export type EnemyKind =
  | 'scribbler'
  | 'dart'
  | 'brute'
  | 'slinger'
  | 'knight'
  | 'bomb'
  | 'bigScribbler'
  | 'thornback'
  | 'highlighter'
  | 'golem'
  | 'smudgeKing'
  | 'smudgeTwin';

export type ThemeId = 'meadow' | 'canyon' | 'city' | 'factory' | 'tower';

export interface DialogueLine {
  who: HeroId | 'boss' | 'narrator';
  name?: string;
  text: string;
}

export interface SpawnDef {
  kind: EnemyKind;
  side: 'left' | 'right' | 'drop';
  z?: number;
  delay?: number; // frames after wave start
  x?: number; // for drops: offset from the arena centre
}

export interface WaveDef {
  spawns: SpawnDef[];
  /** start this wave when this many (or fewer) enemies remain alive */
  whenAlive?: number;
}

export interface EncounterEvent {
  type: 'encounter';
  x: number;
  lock: [number, number];
  waves: WaveDef[];
  boss?: EnemyKind;
  bossIntro?: DialogueLine[];
  objective?: string;
}

export interface DialogueEvent {
  type: 'dialogue';
  x: number;
  lines: DialogueLine[];
}

export interface HintEvent {
  type: 'hint';
  x: number;
  hint: HintId;
}

export interface CheckpointEvent {
  type: 'checkpoint';
  x: number;
}

export type StageEvent = EncounterEvent | DialogueEvent | HintEvent | CheckpointEvent;

export type HintId =
  | 'move'
  | 'attack'
  | 'jump'
  | 'dodge'
  | 'special'
  | 'team'
  | 'plates'
  | 'revive'
  | 'ultimate'
  | 'coop'
  | 'heavy'
  | 'secret'
  | 'hazard';

export interface PlatformDef {
  x: number;
  z: number;
  w: number;
  d: number;
  h: number;
  kind?: 'crate' | 'rock' | 'ledge' | 'pipe' | 'block';
}

export type HazardDef =
  | { type: 'spikes'; x: number; z: number; w: number; d: number }
  | { type: 'roller'; x0: number; x1: number; period: number; offset?: number }
  | { type: 'car'; x0: number; x1: number; z: number; d: number; period: number; offset?: number }
  | { type: 'vent'; x: number; z: number; period: number; offset?: number }
  | { type: 'press'; x: number; z: number; w: number; d: number; period: number; offset?: number }
  | { type: 'conveyor'; x: number; z: number; w: number; d: number; speed: number }
  | { type: 'inkRain'; x0: number; x1: number; period: number };

export interface CrateDef {
  x: number;
  z: number;
  drop: 'health' | 'ink' | 'meter' | 'pencil';
  onPlatform?: boolean;
}

export interface PencilDef {
  x: number;
  z: number;
  y?: number;
  inCrate?: boolean;
}

export interface PlateGateDef {
  plates: [{ x: number; z: number }, { x: number; z: number }];
  gateX: number;
}

export interface StageDef {
  id: number;
  key: string;
  name: string;
  subtitle: string;
  theme: ThemeId;
  length: number;
  exitX: number;
  parTime: number; // seconds
  music: number;
  intro: DialogueLine[];
  outro: DialogueLine[];
  pits: [number, number][];
  platforms: PlatformDef[];
  hazards: HazardDef[];
  crates: CrateDef[];
  pencils: PencilDef[];
  gates: PlateGateDef[];
  events: StageEvent[];
  challenge: ChallengeDef;
}

export interface ChallengeDef {
  id: 'noDowns' | 'combo' | 'pencils' | 'time' | 'parry' | 'teamHits';
  label: string;
  target: number;
}
