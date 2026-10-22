import { describe, expect, it } from 'vitest';
import { STAGES } from '../src/data/stages';
import { World, type WorldListener } from '../src/game/world';
import { newCampaign } from '../src/core/save';
import type { PlayerInput } from '../src/core/input';

const quiet: WorldListener = { onDialogue() {}, onBossIntro() {}, onBossDefeated() {}, onHint() {}, onObjective() {}, onBossShout() {}, onStageComplete() {}, onGameOver() {}, onCheckpoint() {} };
const idle = (): PlayerInput => ({ mx: 0, mz: 0, jump: false, light: false, heavy: false, special: false, dodge: false, ult: false, interact: false });

function makeWorld(mode: 'solo' | 'coop' = 'coop', listener: Partial<WorldListener> = {}) {
  return new World({ stage: STAGES[0], stageIndex: 0, mode, soloHero: 'momo', campaign: newCampaign(mode, 'momo'), listener: { ...quiet, ...listener }, audio: { play() {} }, viewW: 960, seed: 1 });
}

describe('world mechanics', () => {
  it('heroes cannot leave the stage or the depth band', () => {
    const w = makeWorld();
    const left = { ...idle(), mx: -1, mz: -1 };
    for (let i = 0; i < 300; i++) w.update([left, left]);
    for (const h of w.heroes) {
      expect(h.x).toBeGreaterThanOrEqual(30);
      expect(h.z).toBeGreaterThanOrEqual(0);
    }
  });

  it('light attacks damage and defeat an enemy in front', () => {
    const w = makeWorld();
    const momo = w.heroById('momo');
    const e = w.spawnEnemyAt('scribbler', momo.x + 55, momo.z);
    e.y = 0;
    e.onGround = true;
    e.setState('idle');
    momo.facing = 1;
    let f = 0;
    while (e.state !== 'dead' && f++ < 600) {
      const atk = { ...idle(), light: f % 6 < 3 };
      w.update([atk, idle()]);
      e.cooldown = 999; // keep it passive
    }
    expect(e.state).toBe('dead');
  });

  it('a downed hero can be revived by holding interact', () => {
    const w = makeWorld();
    const momo = w.heroById('momo');
    const scout = w.heroById('scout');
    scout.x = momo.x + 40;
    scout.z = momo.z;
    w.applyHit(scout, { damage: 999, kbX: 0, kbY: 0, reaction: 'stagger', hitstun: 10, dir: 1, source: null, sourceX: scout.x - 10, unblockable: true });
    expect(scout.state).toBe('downed');
    const hold = { ...idle(), interact: true };
    for (let i = 0; i < 120 && scout.state === 'downed'; i++) w.update([hold, idle()]);
    expect(scout.state).not.toBe('downed');
    expect(scout.hp).toBeGreaterThan(0);
  });

  it('a downed hero is knocked out when the timer runs out, and game over follows when both fall', () => {
    let over = false;
    const w = makeWorld('coop', { onGameOver: () => (over = true) });
    for (const h of w.heroes) w.applyHit(h, { damage: 999, kbX: 0, kbY: 0, reaction: 'stagger', hitstun: 10, dir: 1, source: null, sourceX: h.x - 10, unblockable: true });
    for (let i = 0; i < 200; i++) w.update([idle(), idle()]);
    expect(over).toBe(true);
  });

  it('the team finisher needs a full meter and hits everything on screen', () => {
    const w = makeWorld();
    const foes = [w.spawnEnemyAt('scribbler', w.camera.x + 100, 60), w.spawnEnemyAt('scribbler', w.camera.x + 250, 150)];
    for (let i = 0; i < 60; i++) w.update([idle(), idle()]);
    const hp0 = foes.map((f) => f.hp);
    w.meter = 100;
    w.update([{ ...idle(), ult: true }, idle()]);
    expect(w.cinematic).not.toBeNull();
    for (let i = 0; i < 140; i++) w.update([idle(), idle()]);
    foes.forEach((f, i) => expect(f.state === 'dead' || f.hp < hp0[i]).toBe(true));
    expect(w.meter).toBeLessThan(100);
  });

  it('team plates open a gate only when both heroes stand on them', () => {
    const w = makeWorld();
    const g = w.gates[0];
    const [a, b] = w.heroes;
    w.eventIndex = w.stage.events.length; // skip the encounters on the way
    w.camera.x = g.plates[0].x;
    a.x = g.plates[0].x;
    a.z = g.plates[0].z;
    b.x = g.plates[0].x - 200;
    w.update([idle(), idle()]);
    expect(g.open).toBe(false);
    b.x = g.plates[1].x;
    b.z = g.plates[1].z;
    w.update([idle(), idle()]);
    expect(g.open).toBe(true);
  });

  it('falling into a pit costs health and returns the hero to safe ground', () => {
    const w = makeWorld();
    const h = w.heroById('momo');
    const [p0, p1] = STAGES[0].pits[0];
    h.safe = { x: p0 - 80, z: 100 };
    h.x = (p0 + p1) / 2;
    h.y = -300;
    h.onGround = false;
    const hp = h.hp;
    w.update([idle(), idle()]);
    expect(h.x).toBe(p0 - 80);
    expect(h.hp).toBeLessThan(hp);
    expect(h.hp).toBeGreaterThan(0);
  });

  it('solo mode can swap control between heroes', () => {
    const w = makeWorld('solo');
    expect(w.heroById('momo').controller).toBe('p1');
    expect(w.swapControl()).toBe(true);
    expect(w.heroById('scout').controller).toBe('p1');
    expect(w.heroById('momo').controller).toBe('ai');
  });
});
