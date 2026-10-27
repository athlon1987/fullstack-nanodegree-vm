// Audio: an original, adaptive lo-fi soundtrack (src/audio/music), synthesised feedback sounds
// in the same key (sfx.ts) and a procedural soundscape. Four independent channels — music,
// ambience, interface, character voices — each with its own volume. Ambience follows the
// world: rain, birds by day, insects at dusk, water by the lake, a bed for the building you're
// looking at. Nothing is downloaded and nothing needs a licence: every sound is generated.
import { MusicEngine } from './music/MusicEngine';
import type { MoodId, StingerId } from './music/score';
import { SfxPlayer, type Sfx } from './sfx';

export type { Sfx } from './sfx';
export type { MoodId } from './music/score';
export type Bed = 'kopitiam_chatter' | 'garden_birds' | 'showroom_hum' | 'classroom_murmur' | 'lake' | 'none';

/** Channel calibration: full music volume sits about 6 dB under the feedback sounds. */
const MUSIC_GAIN = 0.5;

export interface AudioLevels {
  music: number;
  ambience: number;
  sfx: number;
  character: number;
  muted: boolean;
}

/** What the soundscape should reflect right now (fed by the game every ~half second). */
export interface SoundscapeState {
  hour: number;
  rain: number;
  /** Breeze 0..1. */
  wind?: number;
  zen: boolean;
  tropical: boolean;
  bed: Bed;
  /** What the music should reflect (see musicMood in App). */
  mood: MoodId;
}

interface NoiseVoice {
  gain: GainNode;
  filter: BiquadFilterNode;
}

class AudioManager {
  private ctx: AudioContext | null = null;
  private ch!: { music: GainNode; ambience: GainNode; sfx: GainNode; character: GainNode };
  private music: MusicEngine | null = null;
  private sfx: SfxPlayer | null = null;
  private musicTimer: number | null = null;
  private ambienceTimer: number | null = null;
  private levels: AudioLevels = { music: 0.5, ambience: 0.6, sfx: 0.8, character: 0.7, muted: false };
  private scape: SoundscapeState = { hour: 9, rain: 0, zen: false, tropical: false, bed: 'none', mood: 'town' };
  private voices: Record<'rain' | 'insects' | 'water' | 'wind' | 'bed', NoiseVoice> | null = null;
  private insectLfo: GainNode | null = null;

  /** Kept for API compatibility (sounds used to be files); nothing is fetched any more. */
  setBase(_base: string) {}

  /** Must be called from a user gesture (browser autoplay policy). */
  async unlock() {
    if (this.ctx) {
      if (this.ctx.state === 'suspended') await this.ctx.resume();
      return;
    }
    const Ctx = window.AudioContext ?? (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    this.ctx = new Ctx();
    const master = this.ctx.createGain();
    // Safety limiter: however many sounds coincide, the output never clips.
    const limiter = this.ctx.createDynamicsCompressor();
    limiter.threshold.value = -6;
    limiter.knee.value = 4;
    limiter.ratio.value = 12;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.2;
    master.connect(limiter).connect(this.ctx.destination);
    const mk = () => {
      const g = this.ctx!.createGain();
      g.connect(master);
      return g;
    };
    this.ch = { music: mk(), ambience: mk(), sfx: mk(), character: mk() };
    this.apply();
    this.music = new MusicEngine(this.ctx, this.ch.music, this.ch.sfx);
    this.sfx = new SfxPlayer(this.ctx, this.ch.sfx, this.music.kit);
    this.buildNoise();
    this.startMusic();
    this.startAmbience();
    // Battery: nothing plays (or schedules) while the game is in the background.
    document.addEventListener('visibilitychange', () => {
      if (!this.ctx) return;
      if (document.visibilityState === 'hidden') void this.ctx.suspend();
      else void this.ctx.resume();
    });
  }

  configure(levels: AudioLevels) {
    this.levels = levels;
    this.apply();
  }

  /** Update the world the soundscape reflects (cheap; call often). */
  /** Studio / QA: pin the music to one arrangement (null = follow the game). */
  forceMood: MoodId | null = null;

  setScape(s: Partial<SoundscapeState>) {
    const zenChanged = s.zen !== undefined && s.zen !== this.scape.zen;
    this.scape = { ...this.scape, ...s };
    this.music?.setMood(this.forceMood ?? this.scape.mood);
    this.updateBeds();
    if (zenChanged) this.apply();
  }

  /** The music's current arrangement (for Studio and tests). */
  get musicState() {
    return this.music ? { mood: this.music.currentMood, bpm: this.music.tempo, ...this.music.position } : null;
  }

  /** A short melodic flourish on the beat (quest done, level up, unlock, construction). */
  stinger(id: StingerId) {
    if (!this.ctx || !this.music || this.levels.muted) return;
    this.music.stinger(id);
  }

  private apply() {
    if (!this.ctx) return;
    const m = this.levels.muted ? 0 : 1;
    const t = this.ctx.currentTime;
    this.ch.sfx.gain.setTargetAtTime(this.levels.sfx * m, t, 0.05);
    this.ch.music.gain.setTargetAtTime(this.levels.music * MUSIC_GAIN * m * (this.scape.zen ? 0.8 : 1), t, 0.4);
    this.ch.ambience.gain.setTargetAtTime(this.levels.ambience * 0.5 * m, t, 0.4);
    this.ch.character.gain.setTargetAtTime(this.levels.character * 0.5 * m, t, 0.05);
  }

  play(name: Sfx) {
    if (!this.ctx || this.levels.muted || !this.sfx) return;
    this.sfx.play(name);
  }

  /**
   * A resident's "voice": soft, pitched syllables (no words) whose timbre is derived from
   * their id, so each neighbour sounds a little different.
   */
  voice(id: string, length = 30) {
    if (!this.ctx || this.levels.muted) return;
    let h = 0;
    for (const c of id) h = (h * 31 + c.charCodeAt(0)) >>> 0;
    const pitch = 260 + (h % 220);
    const n = Math.min(7, 2 + Math.floor(length / 25));
    const t = this.ctx.currentTime + 0.02;
    for (let i = 0; i < n; i++) {
      const f = pitch * (1 + (((h >> (i * 3)) % 5) - 2) * 0.06);
      this.tone(f, t + i * 0.085, 0.07, 0.07, 'triangle', this.ch.character);
    }
  }

  private tone(freq: number, when: number, dur: number, gain: number, type: OscillatorType, dest: AudioNode) {
    const ctx = this.ctx!;
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.value = freq;
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(gain, when + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, when + dur);
    o.connect(g).connect(dest);
    o.start(when);
    o.stop(when + dur + 0.05);
  }

  /** The soundtrack runs on a lookahead scheduler; the engine follows `scape.mood` at bar lines. */
  private startMusic() {
    if (!this.ctx || !this.music || this.musicTimer !== null) return;
    this.music.start(this.ctx.currentTime + 0.15, this.scape.mood);
    const tick = () => this.ctx && this.ctx.state === 'running' && this.music!.schedule(this.ctx.currentTime + 0.4);
    tick();
    this.musicTimer = window.setInterval(tick, 100);
  }

  private buildNoise() {
    const ctx = this.ctx!;
    const len = ctx.sampleRate * 2;
    const buf = ctx.createBuffer(1, len, ctx.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    const voice = (type: BiquadFilterType, freq: number, q = 0.7): NoiseVoice => {
      const src = ctx.createBufferSource();
      src.buffer = buf;
      src.loop = true;
      src.playbackRate.value = 0.9 + Math.random() * 0.2;
      const filter = ctx.createBiquadFilter();
      filter.type = type;
      filter.frequency.value = freq;
      filter.Q.value = q;
      const gain = ctx.createGain();
      gain.gain.value = 0;
      src.connect(filter).connect(gain).connect(this.ch.ambience);
      src.start();
      return { gain, filter };
    };
    this.voices = {
      // Soft, steady tropical rain: a rounded patter rather than hiss.
      rain: voice('bandpass', 1600, 0.35),
      insects: voice('bandpass', 4800, 9),
      water: voice('lowpass', 420, 0.6),
      wind: voice('bandpass', 600, 0.4),
      bed: voice('bandpass', 700, 1.2),
    };
    // Cicada-style pulsing: an LFO modulates the insect voice's gain.
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 22;
    const depth = ctx.createGain();
    depth.gain.value = 0;
    lfo.connect(depth).connect(this.voices.insects.gain.gain);
    lfo.start();
    this.insectLfo = depth;
    this.updateBeds();
  }

  private updateBeds() {
    if (!this.ctx || !this.voices) return;
    const t = this.ctx.currentTime;
    const { hour, rain, tropical, bed, zen } = this.scape;
    const dusk = hour > 18 || hour < 6 ? 1 : hour > 17 ? hour - 17 : 0;
    const set = (v: NoiseVoice, g: number) => v.gain.gain.setTargetAtTime(g, t, 1.2);
    set(this.voices.rain, rain * 0.16);
    const insects = (tropical ? 0.05 : 0.025) * dusk * (1 - rain * 0.7);
    set(this.voices.insects, insects);
    this.insectLfo?.gain.setTargetAtTime(insects * 0.8, t, 1.2);
    set(this.voices.water, bed === 'lake' ? 0.14 : 0.025);
    set(this.voices.wind, 0.015 + (this.scape.wind ?? 0.3) * 0.03 + rain * 0.04 + (zen ? 0.015 : 0));
    const bedGain: Record<Bed, [number, number]> = {
      kopitiam_chatter: [0.06, 520],
      classroom_murmur: [0.045, 900],
      showroom_hum: [0.035, 120],
      garden_birds: [0, 700],
      lake: [0, 700],
      none: [0, 700],
    };
    const [g, f] = bedGain[bed];
    this.voices.bed.filter.frequency.setTargetAtTime(f, t, 0.5);
    set(this.voices.bed, g);
  }

  /** Birdsong (tropical: koel-like calls and bulbul chirps), cup clinks at the kopitiam. */
  private startAmbience() {
    if (!this.ctx || this.ambienceTimer !== null) return;
    this.ambienceTimer = window.setInterval(() => {
      if (!this.ctx) return;
      const { hour, rain, tropical, bed } = this.scape;
      const t = this.ctx.currentTime;
      const day = hour > 6 && hour < 19;
      const birdChance = (day ? 0.35 : 0.04) * (1 - rain * 0.8) + (bed === 'garden_birds' ? 0.3 : 0);
      if (Math.random() < birdChance) {
        if (tropical && Math.random() < 0.3) {
          // Two rising notes: "ko-el"
          for (let i = 0; i < 2; i++) {
            const s = t + i * 0.42;
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            o.frequency.setValueAtTime(880 + i * 120, s);
            o.frequency.exponentialRampToValueAtTime(1180 + i * 160, s + 0.28);
            g.gain.setValueAtTime(0, s);
            g.gain.linearRampToValueAtTime(0.025, s + 0.05);
            g.gain.exponentialRampToValueAtTime(0.0001, s + 0.32);
            o.connect(g).connect(this.ch.ambience);
            o.start(s);
            o.stop(s + 0.35);
          }
        } else {
          const base = 2200 + Math.random() * 1600;
          for (let i = 0; i < 2 + Math.floor(Math.random() * 3); i++) {
            const o = this.ctx.createOscillator();
            const g = this.ctx.createGain();
            const s = t + i * 0.13;
            o.frequency.setValueAtTime(base, s);
            o.frequency.exponentialRampToValueAtTime(base * 1.4, s + 0.08);
            g.gain.setValueAtTime(0, s);
            g.gain.linearRampToValueAtTime(0.03, s + 0.02);
            g.gain.exponentialRampToValueAtTime(0.0001, s + 0.1);
            o.connect(g).connect(this.ch.ambience);
            o.start(s);
            o.stop(s + 0.12);
          }
        }
      }
      if (bed === 'kopitiam_chatter' && Math.random() < 0.4) this.tone(2400 + Math.random() * 900, t + Math.random(), 0.12, 0.02, 'sine', this.ch.ambience);
      if (bed === 'lake' && Math.random() < 0.25) this.tone(180 + Math.random() * 60, t, 0.25, 0.03, 'sine', this.ch.ambience);
    }, 1400);
  }
}

export const audio = new AudioManager();

if (typeof window !== 'undefined') (window as unknown as { __pockethoodAudio: AudioManager }).__pockethoodAudio = audio;
