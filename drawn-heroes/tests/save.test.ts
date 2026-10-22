import { describe, expect, it } from 'vitest';
import { SaveManager, newCampaign, type StorageLike } from '../src/core/save';
import { SAVE_KEY } from '../src/config';

class MemStorage implements StorageLike {
  map = new Map<string, string>();
  fail = false;
  getItem(k: string) {
    return this.map.get(k) ?? null;
  }
  setItem(k: string, v: string) {
    if (this.fail) throw new Error('QuotaExceededError');
    this.map.set(k, v);
  }
  removeItem(k: string) {
    this.map.delete(k);
  }
}

describe('save manager', () => {
  it('starts empty and round-trips a campaign', () => {
    const st = new MemStorage();
    const a = new SaveManager(st);
    expect(a.hasCampaign()).toBe(false);
    const c = a.startCampaign('coop', 'scout');
    c.ink = 321;
    c.pencils[2][1] = true;
    c.upgrades.momo_power = 2;
    a.data.settings.music = 0.25;
    expect(a.persist()).toBe(true);
    const b = new SaveManager(st);
    expect(b.data.campaign?.mode).toBe('coop');
    expect(b.data.campaign?.ink).toBe(321);
    expect(b.data.campaign?.pencils[2][1]).toBe(true);
    expect(b.data.campaign?.upgrades.momo_power).toBe(2);
    expect(b.data.settings.music).toBe(0.25);
  });

  it('recovers from corrupt data without crashing', () => {
    const st = new MemStorage();
    st.setItem(SAVE_KEY, '{not json');
    const m = new SaveManager(st);
    expect(m.hasCampaign()).toBe(false);
    expect(m.lastError).toMatch(/reset/);
    expect(st.getItem(SAVE_KEY + '.corrupt')).toBe('{not json');
  });

  it('sanitises out-of-range values', () => {
    const st = new MemStorage();
    st.setItem(SAVE_KEY, JSON.stringify({ campaign: { ink: -50, unlocked: 99, upgrades: { momo_power: 50, bogus: 3 }, completed: [true, true] }, settings: { music: 7, touchScale: 0 } }));
    const m = new SaveManager(st);
    const c = m.data.campaign!;
    expect(c.ink).toBe(0);
    expect(c.unlocked).toBe(4);
    expect(c.upgrades.momo_power).toBe(3);
    expect((c.upgrades as Record<string, number>).bogus).toBeUndefined();
    expect(m.data.settings.music).toBe(1);
    expect(m.data.settings.touchScale).toBe(0.7);
  });

  it('keeps working when storage is unavailable or full', () => {
    const none = new SaveManager(null);
    expect(none.available).toBe(false);
    none.startCampaign('solo', 'momo');
    expect(none.persist()).toBe(false);
    const st = new MemStorage();
    const m = new SaveManager(st);
    st.fail = true;
    m.startCampaign('solo', 'momo');
    expect(m.persist()).toBe(false);
    expect(m.available).toBe(false);
  });

  it('erasing removes the campaign but keeps settings', () => {
    const st = new MemStorage();
    const m = new SaveManager(st);
    m.startCampaign('solo', 'momo');
    m.data.settings.sfx = 0.1;
    m.eraseCampaign();
    const again = new SaveManager(st);
    expect(again.hasCampaign()).toBe(false);
    expect(again.data.settings.sfx).toBe(0.1);
  });

  it('new campaigns have five pages of three pencils', () => {
    const c = newCampaign('solo', 'momo');
    expect(c.pencils).toHaveLength(5);
    expect(c.pencils.every((p) => p.length === 3)).toBe(true);
  });
});
