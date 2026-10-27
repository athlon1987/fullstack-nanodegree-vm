// Audio: Kenney CC0 interface SFX + an original, procedurally generated soundtrack and
// soundscape (WebAudio). Four independent channels — music, ambience, interface, character —
// each with its own volume. Ambience follows the world: rain, birds by day, insects at dusk,
// water by the lake, and a gentle bed for the building you're looking at.

export type Sfx = 'click' | 'collect' | 'place' | 'complete' | 'levelup' | 'reward' | 'error' | 'pop' | 'whoosh';
export type Bed = 'kopitiam_chatter' | 'garden_birds' | 'showroom_hum' | 'classroom_murmur' | 'lake' | 'none';

const FILES: Record<Sfx, { file: string; gain: number; rate?: number }> = {
  click: { file: 'ui', gain: 0.5 },
  collect: { file: 'coin', gain: 0.55 },
  place: { file: 'land', gain: 0.8 },
  complete: { file: 'confirm', gain: 0.6 },
  levelup: { file: 'level_up', gain: 0.6 },
  reward: { file: 'gem', gain: 0.5 },
  error: { file: 'hit', gain: 0.25, rate: 1.4 },
  pop: { file: 'ui', gain: 0.35, rate: 1.5 },
  whoosh: { file: 'dash', gain: 0.25 },
};

// C major pentatonic across two octaves; chord roots for a gentle I–vi–IV–V loop.
const SCALE = [261.63, 293.66, 329.63, 392.0, 440.0, 523.25, 587.33, 659.25, 783.99, 880.0];
const CHORDS = [
  [130.81, 196.0, 261.63, 329.63],
  [110.0, 164.81, 220.0, 261.63],
  [87.31, 174.61, 220.0, 261.63],
  [98.0, 146.83, 196.0, 246.94],
];

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
  zen: boolean;
  tropical: boolean;
  bed: Bed;
}

interface NoiseVoice {
  gain: GainNode;
  filter: BiquadFilterNode;
}

class AudioManager {
  private ctx: AudioContext | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private ch!: { music: GainNode; ambience: GainNode; sfx: GainNode; character: GainNode };
  private musicTimer: number | null = null;
  private ambienceTimer: number | null = null;
  private step = 0;
  private levels: AudioLevels = { music: 0.5, ambience: 0.6, sfx: 0.8, character: 0.7, muted: false };
  private scape: SoundscapeState = { hour: 9, rain: 0, zen: false, tropical: false, bed: 'none' };
  private voices: Record<'rain' | 'insects' | 'water' | 'wind' | 'bed', NoiseVoice> | null = null;
  private insectLfo: GainNode | null = null;
  private base = './';

  setBase(base: string) {
    this.base = base;
  }

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
    master.connect(this.ctx.destination);
    const mk = () => {
      const g = this.ctx!.createGain();
      g.connect(master);
      return g;
    };
    this.ch = { music: mk(), ambience: mk(), sfx: mk(), character: mk() };
    this.apply();
    this.buildNoise();
    await Promise.all(
      [...new Set(Object.values(FILES).map((f) => f.file))].map(async (f) => {
        try {
          const res = await fetch(`${this.base}assets/audio/sfx/${f}.ogg`);
          this.buffers.set(f, await this.ctx!.decodeAudioData(await res.arrayBuffer()));
        } catch {
          /* missing/undecodable sound (e.g. Ogg on older iOS): play silently */
        }
      }),
    );
    this.startMusic();
    this.startAmbience();
  }

  configure(levels: AudioLevels) {
    this.levels = levels;
    this.apply();
  }

  /** Update the world the soundscape reflects (cheap; call often). */
  setScape(s: Partial<SoundscapeState>) {
    this.scape = { ...this.scape, ...s };
    this.updateBeds();
  }

  private apply() {
    if (!this.ctx) return;
    const m = this.levels.muted ? 0 : 1;
    const t = this.ctx.currentTime;
    this.ch.sfx.gain.setTargetAtTime(this.levels.sfx * m, t, 0.05);
    this.ch.music.gain.setTargetAtTime(this.levels.music * 0.22 * m * (this.scape.zen ? 0.7 : 1), t, 0.4);
    this.ch.ambience.gain.setTargetAtTime(this.levels.ambience * 0.5 * m, t, 0.4);
    this.ch.character.gain.setTargetAtTime(this.levels.character * 0.5 * m, t, 0.05);
  }

  play(name: Sfx) {
    if (!this.ctx || this.levels.muted) return;
    const def = FILES[name];
    const buf = this.buffers.get(def.file);
    if (!buf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = (def.rate ?? 1) * (0.95 + Math.random() * 0.1);
    const g = this.ctx.createGain();
    g.gain.value = def.gain;
    src.connect(g).connect(this.ch.sfx);
    src.start();
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

  /** A soft marimba-and-pad loop at ~84 bpm; Zen Mode slows it to a sparse, airy pad. */
  private startMusic() {
    if (!this.ctx || this.musicTimer !== null) return;
    let next = this.ctx.currentTime + 0.2;
    let melody = 4;
    const schedule = () => {
      const ctx = this.ctx!;
      const zen = this.scape.zen;
      const beat = 60 / (zen ? 58 : 84);
      while (next < ctx.currentTime + 1.5) {
        const bar = Math.floor(this.step / 8) % CHORDS.length;
        const inBar = this.step % 8;
        if (inBar === 0) for (const f of CHORDS[bar]) this.tone(f, next, beat * 7.5, zen ? 0.04 : 0.05, zen ? 'sine' : 'triangle', this.ch.music);
        const chance = zen ? 0.18 : inBar % 2 === 0 ? 1 : 0.3;
        if (Math.random() < chance) {
          melody = Math.max(0, Math.min(SCALE.length - 1, melody + Math.floor(Math.random() * 5) - 2));
          if (Math.random() < 0.8) this.tone(SCALE[melody], next, beat * (zen ? 3 : 1.6), zen ? 0.05 : 0.09, 'sine', this.ch.music);
        }
        next += beat / 2;
        this.step++;
      }
    };
    schedule();
    this.musicTimer = window.setInterval(schedule, 400);
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
      rain: voice('highpass', 900, 0.5),
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
    set(this.voices.rain, rain * 0.22);
    const insects = (tropical ? 0.05 : 0.025) * dusk * (1 - rain * 0.7);
    set(this.voices.insects, insects);
    this.insectLfo?.gain.setTargetAtTime(insects * 0.8, t, 1.2);
    set(this.voices.water, bed === 'lake' ? 0.14 : 0.025);
    set(this.voices.wind, 0.02 + rain * 0.05 + (zen ? 0.015 : 0));
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
