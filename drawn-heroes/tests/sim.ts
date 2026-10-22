// Headless simulation helpers shared by tests.
import { STAGES } from '../src/data/stages';
import type { HeroId } from '../src/data/types';
import { World, type WorldListener } from '../src/game/world';
import { newCampaign, type CampaignSave } from '../src/core/save';

export interface SimResult {
  complete: boolean;
  gameOver: boolean;
  frames: number;
  world: World;
  log: string[];
}

export function runStage(stageIndex: number, opts: { god?: boolean; seed?: number; maxFrames?: number; mode?: 'solo' | 'coop'; hero?: HeroId; campaign?: CampaignSave | null } = {}): SimResult {
  const log: string[] = [];
  let complete = false;
  let gameOver = false;
  const listener: WorldListener = {
    onDialogue: () => {},
    onBossIntro: (b) => log.push(`boss ${b.kind}`),
    onBossDefeated: (b) => log.push(`boss down ${b.kind}`),
    onHint: () => {},
    onObjective: () => {},
    onBossShout: (n, t) => log.push(`${n}: ${t}`),
    onStageComplete: () => {
      complete = true;
    },
    onGameOver: () => {
      gameOver = true;
    },
    onCheckpoint: () => {},
  };
  const world = new World({
    stage: STAGES[stageIndex],
    stageIndex,
    mode: opts.mode ?? 'solo',
    soloHero: opts.hero ?? 'momo',
    campaign: opts.campaign === undefined ? newCampaign('solo', 'momo') : opts.campaign,
    listener,
    audio: { play: () => {} },
    viewW: 960,
    seed: opts.seed ?? 7,
    god: opts.god,
    autoplay: true,
  });
  const max = opts.maxFrames ?? 60 * 60 * 12;
  const none = { mx: 0, mz: 0, jump: false, light: false, heavy: false, special: false, dodge: false, ult: false, interact: false };
  let f = 0;
  for (; f < max && !complete && !gameOver; f++) {
    world.update([none, none]);
    if (f % 600 === 0) log.push(`t=${(f / 60).toFixed(0)}s lead=${world.leadX().toFixed(0)} ev=${world.eventIndex} enc=${world.encounter ? 'y' : 'n'} enemies=${world.livingEnemies().length} hp=${world.heroes.map((h) => h.hp + h.state[0]).join('/')}`);
  }
  return { complete, gameOver, frames: f, world, log };
}
