// Audio: Kenney CC0 interface/impact SFX + an original, procedurally-generated
// cozy soundtrack and ambience (WebAudio). Separate music/SFX volumes and mute.

export type Sfx = 'click' | 'collect' | 'place' | 'complete' | 'levelup' | 'reward' | 'error' | 'pop' | 'whoosh';

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

class AudioManager {
  private ctx: AudioContext | null = null;
  private buffers = new Map<string, AudioBuffer>();
  private sfxGain!: GainNode;
  private musicGain!: GainNode;
  private ambienceGain!: GainNode;
  private musicTimer: number | null = null;
  private ambienceTimer: number | null = null;
  private step = 0;
  private settings = { music: 0.5, sfx: 0.8, muted: false };
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
    this.sfxGain = this.ctx.createGain();
    this.musicGain = this.ctx.createGain();
    this.ambienceGain = this.ctx.createGain();
    for (const g of [this.sfxGain, this.musicGain, this.ambienceGain]) g.connect(master);
    this.apply();
    await Promise.all(
      [...new Set(Object.values(FILES).map((f) => f.file))].map(async (f) => {
        try {
          const res = await fetch(`${this.base}assets/audio/sfx/${f}.ogg`);
          this.buffers.set(f, await this.ctx!.decodeAudioData(await res.arrayBuffer()));
        } catch {
          /* missing/undecodable sound: play silently */
        }
      }),
    );
    this.startMusic();
    this.startAmbience();
  }

  configure(music: number, sfx: number, muted: boolean) {
    this.settings = { music, sfx, muted };
    this.apply();
  }

  private apply() {
    if (!this.ctx) return;
    const m = this.settings.muted ? 0 : 1;
    const t = this.ctx.currentTime;
    this.sfxGain.gain.setTargetAtTime(this.settings.sfx * m, t, 0.05);
    this.musicGain.gain.setTargetAtTime(this.settings.music * 0.22 * m, t, 0.3);
    this.ambienceGain.gain.setTargetAtTime(this.settings.music * 0.35 * m, t, 0.3);
  }

  play(name: Sfx) {
    if (!this.ctx || this.settings.muted) return;
    const def = FILES[name];
    const buf = this.buffers.get(def.file);
    if (!buf) return;
    const src = this.ctx.createBufferSource();
    src.buffer = buf;
    src.playbackRate.value = (def.rate ?? 1) * (0.95 + Math.random() * 0.1);
    const g = this.ctx.createGain();
    g.gain.value = def.gain;
    src.connect(g).connect(this.sfxGain);
    src.start();
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

  /** A soft marimba-and-pad loop at ~84 bpm with a wandering pentatonic melody. */
  private startMusic() {
    if (!this.ctx || this.musicTimer !== null) return;
    const beat = 60 / 84;
    let next = this.ctx.currentTime + 0.2;
    let melody = 4;
    const schedule = () => {
      const ctx = this.ctx!;
      while (next < ctx.currentTime + 1.5) {
        const bar = Math.floor(this.step / 8) % CHORDS.length;
        const inBar = this.step % 8;
        if (inBar === 0) for (const f of CHORDS[bar]) this.tone(f, next, beat * 7.5, 0.05, 'triangle', this.musicGain);
        if (inBar % 2 === 0 || Math.random() < 0.3) {
          melody = Math.max(0, Math.min(SCALE.length - 1, melody + Math.floor(Math.random() * 5) - 2));
          if (Math.random() < 0.8) this.tone(SCALE[melody], next, beat * 1.6, 0.09, 'sine', this.musicGain);
        }
        next += beat / 2;
        this.step++;
      }
    };
    schedule();
    this.musicTimer = window.setInterval(schedule, 400);
  }

  /** Occasional procedural birdsong. */
  private startAmbience() {
    if (!this.ctx || this.ambienceTimer !== null) return;
    this.ambienceTimer = window.setInterval(() => {
      if (!this.ctx || Math.random() > 0.35) return;
      const t = this.ctx.currentTime;
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
        o.connect(g).connect(this.ambienceGain);
        o.start(s);
        o.stop(s + 0.12);
      }
    }, 2500);
  }
}

export const audio = new AudioManager();
