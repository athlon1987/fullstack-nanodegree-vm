import type { HeroId } from './types';

export interface HeroDef {
  id: HeroId;
  name: string;
  role: string;
  blurb: string;
  maxHp: number;
  speed: number;
  zSpeed: number;
  jump: number;
  airJumps: number;
  defense: number; // fraction of damage ignored
  parryWindow: number; // frames
  blockChip: number; // fraction of damage taken while blocking
  hurtW: number;
  hurtH: number;
  /** sprite scale when drawn at depth scale 1 */
  drawScale: number;
  /** feet anchor inside the full sprite (sprite pixels) */
  anchorX: number;
  anchorY: number;
  lightStart: string;
  heavy: string;
  air: string;
  special: string;
  specialCooldown: number; // frames
  color: string;
  moves: { key: string; name: string; text: string }[];
}

export const HEROES: Record<HeroId, HeroDef> = {
  momo: {
    id: 'momo',
    name: 'Momo',
    role: 'Agile combo striker',
    blurb: 'A monkey who never sits still. Momo chains fast hits, double-jumps over trouble and launches enemies for Scout to finish.',
    maxHp: 100,
    speed: 3.7,
    zSpeed: 2.6,
    jump: 11.5,
    airJumps: 1,
    defense: 0,
    parryWindow: 8,
    blockChip: 0.2,
    hurtW: 70,
    hurtH: 104,
    drawScale: 0.43,
    anchorX: 160,
    anchorY: 298,
    lightStart: 'm_l1',
    heavy: 'm_heavy',
    air: 'm_air',
    special: 'banana',
    specialCooldown: 240,
    color: '#ff8c42',
    moves: [
      { key: 'light', name: 'Jab-Jab-Tail-Spin', text: 'Four-hit combo. The last slap launches enemies into the air.' },
      { key: 'heavy', name: 'Coconut Clap', text: 'Overhead slam that knocks enemies down. Hold to charge.' },
      { key: 'special', name: 'Banana Boomerang', text: 'Throws a banana that hits on the way out and on the way back.' },
      { key: 'dodge', name: 'Vine Flip', text: 'Cartwheel dodge with invincibility. Works once in mid-air. Also: double jump.' },
      { key: 'ult', name: 'Jungle Frenzy', text: 'Bounces between every enemy on screen in a blur of slaps. Costs half the Team meter.' },
      { key: 'coop', name: 'Pup Cannon', text: 'Scout launches Momo through the crowd like a cannonball.' },
    ],
  },
  scout: {
    id: 'scout',
    name: 'Scout',
    role: 'Guardian and crowd control',
    blurb: 'A pup in a patrol cap who never leaves a friend behind. Scout hits hard, parries easily and barks crowds apart.',
    maxHp: 135,
    speed: 3.15,
    zSpeed: 2.25,
    jump: 11,
    airJumps: 0,
    defense: 0.15,
    parryWindow: 12,
    blockChip: 0.08,
    hurtW: 62,
    hurtH: 122,
    drawScale: 0.42,
    anchorX: 96,
    anchorY: 328,
    lightStart: 's_l1',
    heavy: 's_heavy',
    air: 's_air',
    special: 'bark',
    specialCooldown: 300,
    color: '#3a86ff',
    moves: [
      { key: 'light', name: 'Paw-Paw-Cap', text: 'Three heavy-handed hits. The cap headbutt breaks guards.' },
      { key: 'heavy', name: 'Patrol Pounce', text: 'Armoured tackle that cannot be interrupted. Hold to charge.' },
      { key: 'special', name: 'Big Bark', text: 'Shockwave that shoves a crowd back and destroys enemy projectiles.' },
      { key: 'dodge', name: 'Badge Guard', text: 'Hold with no direction to block. Scout parries more easily than Momo.' },
      { key: 'ult', name: 'Patrol Siren', text: 'A howl that stuns every enemy on screen. Costs half the Team meter.' },
      { key: 'coop', name: 'Monkey Vault', text: 'Momo boosts Scout skyward for a crater-making paw drop.' },
    ],
  },
};

export const HERO_IDS: HeroId[] = ['momo', 'scout'];
export const otherHero = (id: HeroId): HeroId => (id === 'momo' ? 'scout' : 'momo');
