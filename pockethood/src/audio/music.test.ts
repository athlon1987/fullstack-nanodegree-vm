// The soundtrack is data + synthesis; these checks keep the score musically coherent and the
// adaptive rules predictable. (Rendering itself is checked offline in Chromium:
// scripts/audio/render-previews.mjs + scripts/audio/analyze.py.)
import { describe, expect, it } from 'vitest';
import { musicMood, type MoodInput } from './mood';
import { ARRANGEMENTS, BASSLINES, COMPS, GROOVES, MOTIF, PROGRESSION, STINGERS, THEME, type MoodId } from './music/score';

const F_MAJOR = new Set([5, 7, 9, 10, 0, 2, 4]); // F G A Bb C D E (pitch classes)
const inKey = (m: number) => F_MAJOR.has(((m % 12) + 12) % 12);

describe('the POCKETHOOD score', () => {
  it('the theme, motif, chords and stingers are all in F major', () => {
    for (const [, , n] of [...THEME, ...MOTIF]) expect(inKey(n), `theme note ${n}`).toBe(true);
    for (const c of PROGRESSION) for (const n of [c.root, ...c.voicing, ...c.guide]) expect(inKey(n), `${c.name} ${n}`).toBe(true);
    for (const s of Object.values(STINGERS)) for (const [, , n] of s.notes) expect(inKey(n)).toBe(true);
  });

  it('the theme is a single, singable line across exactly 8 bars', () => {
    let end = 0;
    for (const [s, len] of THEME) {
      expect(s, 'no overlapping notes').toBeGreaterThanOrEqual(end);
      end = s + len;
    }
    expect(end).toBe(128);
    const notes = THEME.map(([, , n]) => n);
    expect(Math.max(...notes) - Math.min(...notes), 'range within an octave and a half').toBeLessThanOrEqual(18);
    expect(THEME.slice(0, 4).map(([, , n]) => n), 'opens with the hook').toEqual(MOTIF.map(([, , n]) => n));
  });

  it('tempos follow the music direction for each state', () => {
    const range: Record<MoodId, [number, number]> = {
      town: [85, 105], cafe: [85, 105], garden: [85, 105], night: [80, 95], build: [95, 115], activity: [100, 120], celebration: [105, 125], zen: [65, 85],
    };
    for (const [m, a] of Object.entries(ARRANGEMENTS) as [MoodId, (typeof ARRANGEMENTS)[MoodId]][]) {
      expect(a.bpm, m).toBeGreaterThanOrEqual(range[m][0]);
      expect(a.bpm, m).toBeLessThanOrEqual(range[m][1]);
    }
  });

  it('every arrangement uses known grooves, basslines and comping; Zen has no drums or busy parts', () => {
    for (const a of Object.values(ARRANGEMENTS)) {
      expect(GROOVES[a.groove]).toBeDefined();
      expect(BASSLINES[a.bassline]).toBeDefined();
      expect(COMPS[a.comp]).toBeDefined();
      for (const v of Object.values(a.mix)) expect(v).toBeLessThanOrEqual(1);
    }
    const zen = ARRANGEMENTS.zen;
    expect(zen.groove).toBe('zen');
    expect(zen.form.every((s) => s === 'motif')).toBe(true);
    expect(zen.bpm).toBeLessThan(Math.min(...Object.values(ARRANGEMENTS).filter((a) => a !== zen).map((a) => a.bpm)));
  });

  it('all arrangements share the same theme and progression (they are versions of one song)', () => {
    for (const a of Object.values(ARRANGEMENTS)) expect(a.form.some((s) => s === 'theme' || s === 'motif')).toBe(true);
  });
});

describe('adaptive music: which arrangement plays', () => {
  const base: MoodInput = { zen: false, hour: 10, activity: null, placing: false, panel: null, selectedType: null, selectedBed: null, celebrating: false, building: false };
  const mood = (p: Partial<MoodInput>) => musicMood({ ...base, ...p });

  it('follows what the player is doing', () => {
    expect(mood({})).toBe('town');
    expect(mood({ selectedType: 'cafe' })).toBe('cafe');
    expect(mood({ selectedBed: 'kopitiam_chatter', selectedType: 'something_new' })).toBe('cafe');
    expect(mood({ selectedType: 'garden' })).toBe('garden');
    expect(mood({ activity: 'lake' })).toBe('garden');
    expect(mood({ placing: true })).toBe('build');
    expect(mood({ panel: 'build' })).toBe('build');
    expect(mood({ activity: 'prep' })).toBe('activity');
    expect(mood({ selectedType: 'grocery' })).toBe('activity');
    expect(mood({ hour: 21 })).toBe('night');
    expect(mood({ hour: 21, selectedType: 'cafe' })).toBe('cafe');
  });

  it('Zen Mode always wins; celebrations outrank everything else', () => {
    expect(mood({ zen: true, celebrating: true, placing: true })).toBe('zen');
    expect(mood({ celebrating: true, placing: true, selectedType: 'cafe' })).toBe('celebration');
  });
});
