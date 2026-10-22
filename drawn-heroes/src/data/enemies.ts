import type { EnemyKind } from './types';

export type BrainKind = 'melee' | 'flanker' | 'brute' | 'ranged' | 'knight' | 'bomb' | 'boss';

export interface EnemyDef {
  kind: EnemyKind;
  name: string;
  title?: string;
  hp: number;
  speed: number;
  zSpeed: number;
  w: number;
  h: number;
  attacks: string[];
  brain: BrainKind;
  armor?: number; // armour points: light hits only chip it, heavy hits break it
  shield?: boolean; // blocks frontal non-guard-breaking hits
  weight: number; // 1 = normal knockback, lower = heavier
  reach: number; // preferred attack distance (x)
  ink: [number, number];
  xp: number;
  score: number;
  color: string; // marker colour used by the procedural ink art
  boss?: boolean;
}

export const ENEMIES: Record<EnemyKind, EnemyDef> = {
  scribbler: { kind: 'scribbler', name: 'Scribbler', hp: 40, speed: 1.9, zSpeed: 1.4, w: 60, h: 96, attacks: ['e_punch'], brain: 'melee', weight: 1, reach: 62, ink: [2, 4], xp: 10, score: 100, color: '#9b5de5' },
  dart: { kind: 'dart', name: 'Dart', hp: 26, speed: 3.5, zSpeed: 2.6, w: 56, h: 58, attacks: ['e_bite'], brain: 'flanker', weight: 1.3, reach: 90, ink: [2, 3], xp: 10, score: 120, color: '#2ec4b6' },
  brute: { kind: 'brute', name: 'Brute', hp: 110, speed: 1.25, zSpeed: 1, w: 96, h: 150, attacks: ['e_slam', 'e_shove'], brain: 'brute', armor: 4, weight: 0.45, reach: 80, ink: [5, 8], xp: 30, score: 300, color: '#e63946' },
  slinger: { kind: 'slinger', name: 'Inkslinger', hp: 34, speed: 2.1, zSpeed: 1.8, w: 56, h: 92, attacks: ['e_lob'], brain: 'ranged', weight: 1, reach: 300, ink: [3, 5], xp: 15, score: 180, color: '#3a86ff' },
  knight: { kind: 'knight', name: 'Marker Knight', hp: 90, speed: 1.7, zSpeed: 1.4, w: 70, h: 124, attacks: ['e_thrust'], brain: 'knight', shield: true, weight: 0.7, reach: 120, ink: [5, 8], xp: 30, score: 320, color: '#495057' },
  bomb: { kind: 'bomb', name: 'Smudgebomb', hp: 16, speed: 2.7, zSpeed: 2, w: 50, h: 54, attacks: ['e_explode'], brain: 'bomb', weight: 1.4, reach: 50, ink: [1, 2], xp: 6, score: 80, color: '#f77f00' },

  bigScribbler: { kind: 'bigScribbler', name: 'Big Scribbler', title: 'Bully of the Meadow', hp: 420, speed: 1.6, zSpeed: 1.2, w: 120, h: 190, attacks: ['b_swipe', 'b_pound'], brain: 'boss', armor: 6, weight: 0.3, reach: 90, ink: [30, 30], xp: 120, score: 2000, color: '#7b2cbf', boss: true },
  thornback: { kind: 'thornback', name: 'Thornback', title: 'Rhino of Crayon Canyon', hp: 600, speed: 1.6, zSpeed: 1.2, w: 150, h: 150, attacks: ['b_charge', 'b_quills', 'b_swipe'], brain: 'boss', armor: 8, weight: 0.25, reach: 100, ink: [40, 40], xp: 180, score: 3000, color: '#d62828', boss: true },
  highlighter: { kind: 'highlighter', name: 'Captain Highlighter', title: 'Night Warden of Marker City', hp: 700, speed: 2.1, zSpeed: 1.7, w: 80, h: 150, attacks: ['b_beam', 'b_slash'], brain: 'boss', shield: true, weight: 0.4, reach: 110, ink: [50, 50], xp: 240, score: 4000, color: '#f9c80e', boss: true },
  golem: { kind: 'golem', name: 'Stapler Golem', title: 'Foreman of the Inkworks', hp: 1300, speed: 1.2, zSpeed: 1.1, w: 170, h: 220, attacks: ['b_volley', 'b_pound', 'b_chomp'], brain: 'boss', armor: 10, weight: 0.15, reach: 130, ink: [80, 80], xp: 400, score: 6000, color: '#6c757d', boss: true },
  smudgeKing: { kind: 'smudgeKing', name: 'The Smudge King', title: 'Spiller of Ink, Ruiner of Pages', hp: 950, speed: 1.4, zSpeed: 1.2, w: 150, h: 240, attacks: ['b_wave', 'b_handslam', 'b_swipe'], brain: 'boss', armor: 10, weight: 0.12, reach: 120, ink: [150, 150], xp: 800, score: 12000, color: '#240046', boss: true },
  smudgeTwin: { kind: 'smudgeTwin', name: 'Smudge Twin', hp: 380, speed: 2.4, zSpeed: 1.8, w: 80, h: 140, attacks: ['b_slash', 'b_swipe'], brain: 'boss', weight: 0.5, reach: 100, ink: [0, 0], xp: 0, score: 1500, color: '#3c096c', boss: true },
};
