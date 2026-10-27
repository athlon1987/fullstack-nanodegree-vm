// Dev tool: renders the soundtrack and sound effects offline (OfflineAudioContext) so they can
// be measured and turned into preview files. Not part of the game build.
import { MusicEngine } from '../../src/audio/music/MusicEngine';
import { ARRANGEMENTS, type MoodId, type StingerId } from '../../src/audio/music/score';
import { SfxPlayer, type Sfx } from '../../src/audio/sfx';

const SR = 44100;

let last: Uint8Array = new Uint8Array();

function wav(buf: AudioBuffer): number {
  const ch = buf.numberOfChannels;
  const n = buf.length;
  const out = new DataView(new ArrayBuffer(44 + n * ch * 2));
  const w = (o: number, s: string) => [...s].forEach((c, i) => out.setUint8(o + i, c.charCodeAt(0)));
  w(0, 'RIFF');
  out.setUint32(4, 36 + n * ch * 2, true);
  w(8, 'WAVEfmt ');
  out.setUint32(16, 16, true);
  out.setUint16(20, 1, true);
  out.setUint16(22, ch, true);
  out.setUint32(24, buf.sampleRate, true);
  out.setUint32(28, buf.sampleRate * ch * 2, true);
  out.setUint16(32, ch * 2, true);
  out.setUint16(34, 16, true);
  w(36, 'data');
  out.setUint32(40, n * ch * 2, true);
  const data = Array.from({ length: ch }, (_, c) => buf.getChannelData(c));
  let o = 44;
  for (let i = 0; i < n; i++)
    for (let c = 0; c < ch; c++) {
      const v = Math.max(-1, Math.min(1, data[c][i]));
      out.setInt16(o, v < 0 ? v * 0x8000 : v * 0x7fff, true);
      o += 2;
    }
  last = new Uint8Array(out.buffer);
  return last.length;
}

/** The last render's WAV bytes, base64, in slices (large strings don't cross the devtools bridge well). */
function slice(from: number, len: number): string {
  const bytes = last.subarray(from, from + len);
  let s = '';
  for (let i = 0; i < bytes.length; i += 0x8000) s += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(s);
}

type Cue = { at: number; mood?: MoodId; stinger?: StingerId; sfx?: Sfx };

async function render(seconds: number, startMood: MoodId, cues: Cue[] = [], sfxOnly = false) {
  const ctx = new OfflineAudioContext(2, Math.ceil(SR * seconds), SR);
  const music = new MusicEngine(ctx, ctx.destination, ctx.destination, { settle: 0.5 });
  const sfx = new SfxPlayer(ctx, ctx.destination, music.kit);
  // Same calibration as the game's mixer: music sits under the feedback sounds.
  if (!sfxOnly) music.start(0.05, startMood);
  const sorted = [...cues].sort((a, b) => a.at - b.at);
  for (let t = 0; t < seconds; t += 0.1) {
    for (const c of sorted.filter((c) => c.at >= t && c.at < t + 0.1)) {
      if (c.mood) music.setMood(c.mood, c.at);
      if (c.stinger) music.stinger(c.stinger, c.at);
      if (c.sfx) {
        // The player checks spacing against the context clock, which doesn't run while scheduling offline.
        (sfx as unknown as { last: Map<string, number>; active: unknown[] }).last.clear();
        (sfx as unknown as { active: unknown[] }).active = [];
        sfx.play(c.sfx, c.at);
      }
    }
    if (!sfxOnly) music.schedule(t + 0.4);
  }
  const buf = await ctx.startRendering();
  music.stop();
  return { bytes: wav(buf), changes: music.changes };
}

const barSeconds = (m: MoodId) => (60 / ARRANGEMENTS[m].bpm) * 4;

(window as unknown as { pockethoodRender: unknown }).pockethoodRender = {
  moods: Object.keys(ARRANGEMENTS),
  slice,
  /** Two full 8-bar cycles (theme + its second section) of one arrangement. */
  mood: (m: MoodId) => render(barSeconds(m) * 16 + 2.5, m),
  /** A full 4-cycle form (32 bars), for loop-fatigue listening. */
  form: (m: MoodId) => render(barSeconds(m) * 32 + 2.5, m),
  /** An adaptive tour: the music follows a scripted play session. */
  tour: () =>
    render(150, 'town', [
      { at: 22, mood: 'cafe' },
      { at: 42, mood: 'garden' },
      { at: 60, mood: 'build' },
      { at: 70, sfx: 'place' },
      { at: 74, stinger: 'quest' },
      { at: 78, mood: 'celebration' },
      { at: 98, mood: 'activity' },
      { at: 112, mood: 'night' },
      { at: 130, mood: 'zen' },
    ]),
  sfx: (names: Sfx[]) => render(names.length * 1.6 + 1, 'town', names.map((n, i) => ({ at: 0.3 + i * 1.6, sfx: n })), true),
};
document.title = 'ready';
