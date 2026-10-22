import type { CampaignSave, Rating } from '../core/save';
import { STAGE_COUNT } from '../core/save';
import type { HeroId } from '../data/types';
import { UPGRADE_BY_ID, type UpgradeId } from '../data/upgrades';

export const MAX_LEVEL = 20;

/** XP needed to reach `level` from level 1 (triangular growth). */
export function xpForLevel(level: number): number {
  const n = level - 1;
  return 60 * n * (n + 1);
}

export function levelFromXp(xp: number): { level: number; into: number; span: number } {
  let level = 1;
  while (level < MAX_LEVEL && xp >= xpForLevel(level + 1)) level++;
  const base = xpForLevel(level);
  const next = level >= MAX_LEVEL ? base : xpForLevel(level + 1);
  return { level, into: xp - base, span: Math.max(1, next - base) };
}

export const upgradeLevel = (c: CampaignSave | null, id: UpgradeId): number => c?.upgrades[id] ?? 0;

export interface HeroMods {
  hpMul: number;
  dmgMul: number;
  specialCdMul: number;
  parryBonus: number;
  chipMul: number;
  finisher: boolean;
  bananaSplit: boolean;
  echoBark: boolean;
  pounceChain: boolean;
}

export function heroMods(c: CampaignSave | null, hero: HeroId): HeroMods {
  const lvl = levelFromXp(c?.xp ?? 0).level - 1;
  const p = hero === 'momo' ? 'momo' : 'scout';
  const vit = upgradeLevel(c, `${p}_vitality` as UpgradeId);
  const pow = upgradeLevel(c, `${p}_power` as UpgradeId);
  const guard = upgradeLevel(c, 'scout_guard');
  return {
    hpMul: (1 + 0.15 * vit) * (1 + 0.04 * lvl),
    dmgMul: (1 + 0.1 * pow) * (1 + 0.03 * lvl),
    specialCdMul: hero === 'momo' ? Math.pow(0.85, upgradeLevel(c, 'momo_quick')) : 1,
    parryBonus: hero === 'scout' ? guard * 4 : guard * 2,
    chipMul: hero === 'scout' && guard > 0 ? 0 : 1 - 0.25 * guard,
    finisher: hero === 'momo' && upgradeLevel(c, 'momo_finisher') > 0,
    bananaSplit: hero === 'momo' && upgradeLevel(c, 'momo_split') > 0,
    echoBark: hero === 'scout' && upgradeLevel(c, 'scout_echo') > 0,
    pounceChain: hero === 'scout' && upgradeLevel(c, 'scout_chain') > 0,
  };
}

export interface TeamMods {
  meterMul: number;
  reviveMul: number;
  downedFrames: number;
  shield: boolean;
}

export function teamMods(c: CampaignSave | null): TeamMods {
  const rv = upgradeLevel(c, 'team_revive');
  return {
    meterMul: 1 + 0.2 * upgradeLevel(c, 'team_meter'),
    reviveMul: 1 + 0.4 * rv,
    downedFrames: 600 + 300 * rv,
    shield: upgradeLevel(c, 'team_shield') > 0,
  };
}

export const totalPencils = (c: CampaignSave): number => c.pencils.reduce((n, s) => n + s.filter(Boolean).length, 0);

export interface UpgradeQuote {
  level: number;
  max: number;
  maxed: boolean;
  cost: number;
  pencilsNeeded: number;
  canBuy: boolean;
  reason: string | null;
}

export function quoteUpgrade(c: CampaignSave, id: UpgradeId): UpgradeQuote {
  const def = UPGRADE_BY_ID[id];
  const level = upgradeLevel(c, id);
  const max = def.costs.length;
  if (level >= max) return { level, max, maxed: true, cost: 0, pencilsNeeded: def.pencils ?? 0, canBuy: false, reason: 'Maxed' };
  const cost = def.costs[level];
  const pencilsNeeded = def.pencils ?? 0;
  let reason: string | null = null;
  if (totalPencils(c) < pencilsNeeded) reason = `Needs ${pencilsNeeded} golden pencils`;
  else if (c.ink < cost) reason = `Needs ${cost} ink`;
  return { level, max, maxed: false, cost, pencilsNeeded, canBuy: reason === null, reason };
}

export function buyUpgrade(c: CampaignSave, id: UpgradeId): boolean {
  const q = quoteUpgrade(c, id);
  if (!q.canBuy) return false;
  c.ink -= q.cost;
  c.upgrades[id] = q.level + 1;
  return true;
}

export interface RunStats {
  time: number; // seconds
  damageTaken: number;
  downs: number;
  maxCombo: number;
  defeated: number;
  score: number;
  pencilsFound: number;
  inkCollected: number;
  xpGained: number;
  parries: number;
  teamHits: number;
}

export function emptyStats(): RunStats {
  return { time: 0, damageTaken: 0, downs: 0, maxCombo: 0, defeated: 0, score: 0, pencilsFound: 0, inkCollected: 0, xpGained: 0, parries: 0, teamHits: 0 };
}

export interface RatingResult {
  rating: Rating;
  points: number;
  bonus: number;
}

/** Stage rating from 0-100 points: speed, combo, damage avoided, no downs, pencils. */
export function rateRun(s: RunStats, parTime: number): RatingResult {
  const speed = s.time <= parTime ? 25 : Math.max(0, 25 - ((s.time - parTime) / parTime) * 40);
  const combo = Math.min(20, s.maxCombo);
  const damage = Math.max(0, 25 - s.damageTaken / 12);
  const downs = Math.max(0, 15 - s.downs * 8);
  const pencils = (s.pencilsFound / 3) * 15;
  const points = Math.round(speed + combo + damage + downs + pencils);
  const rating: Rating = points >= 85 ? 'S' : points >= 70 ? 'A' : points >= 52 ? 'B' : points >= 35 ? 'C' : 'D';
  const bonus = { S: 150, A: 100, B: 60, C: 30, D: 10 }[rating];
  return { rating, points, bonus };
}

const RANK: Record<Rating, number> = { S: 4, A: 3, B: 2, C: 1, D: 0 };

export interface StageReward {
  inkTotal: number;
  rating: RatingResult;
  challengeDone: boolean;
  challengeBonus: number;
  levelBefore: number;
  levelAfter: number;
  newBest: boolean;
}

export function applyStageResult(
  c: CampaignSave,
  stageIndex: number,
  s: RunStats,
  parTime: number,
  pencilsThisRun: boolean[],
  challengeDone: boolean,
): StageReward {
  const rating = rateRun(s, parTime);
  const levelBefore = levelFromXp(c.xp).level;
  const challengeBonus = challengeDone && !c.challenges[stageIndex] ? 120 : 0;
  const inkTotal = s.inkCollected + rating.bonus + challengeBonus;
  c.ink += inkTotal;
  c.xp += s.xpGained;
  c.completed[stageIndex] = true;
  if (stageIndex + 1 < STAGE_COUNT) c.unlocked = Math.max(c.unlocked, stageIndex + 1);
  else c.finished = true;
  pencilsThisRun.forEach((got, i) => {
    if (got) c.pencils[stageIndex][i] = true;
  });
  if (challengeDone) c.challenges[stageIndex] = true;
  const prev = c.best[stageIndex];
  const newBest = !prev || RANK[rating.rating] > RANK[prev.rating] || (RANK[rating.rating] === RANK[prev.rating] && s.score > prev.score);
  if (newBest) c.best[stageIndex] = { rating: rating.rating, score: s.score, time: Math.round(s.time) };
  return { inkTotal, rating, challengeDone, challengeBonus, levelBefore, levelAfter: levelFromXp(c.xp).level, newBest };
}
