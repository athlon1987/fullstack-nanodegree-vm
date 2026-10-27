// Interface and feedback sounds, synthesised in the soundtrack's key (F major) so they sit
// inside the music instead of on top of it. Short, soft and rounded; a small mixer limits
// how many play at once and spaces out repeats, so busy moments never turn into noise.
import { midiHz } from './music/score';
import type { Kit } from './music/instruments';

export type Sfx =
  | 'click' | 'pop' | 'collect' | 'place' | 'complete' | 'levelup' | 'unlock' | 'reward' | 'friendship'
  | 'water' | 'plant' | 'error' | 'whoosh' | 'chime' | 'pet_cat' | 'pet_dog' | 'pet_fox' | 'pet_frog';

/** Minimum spacing between two plays of the same sound (s), and priority when the mixer is full. */
const RULES: Record<Sfx, { gap: number; prio: number }> = {
  click: { gap: 0.04, prio: 1 }, pop: { gap: 0.04, prio: 1 }, collect: { gap: 0.05, prio: 2 }, place: { gap: 0.08, prio: 3 },
  complete: { gap: 0.3, prio: 4 }, levelup: { gap: 1, prio: 5 }, unlock: { gap: 0.5, prio: 4 }, reward: { gap: 0.2, prio: 4 },
  friendship: { gap: 0.5, prio: 4 }, water: { gap: 0.25, prio: 2 }, plant: { gap: 0.1, prio: 2 }, error: { gap: 0.3, prio: 3 },
  whoosh: { gap: 0.15, prio: 1 }, chime: { gap: 0.3, prio: 2 }, pet_cat: { gap: 0.6, prio: 3 }, pet_dog: { gap: 0.6, prio: 3 },
  pet_fox: { gap: 0.6, prio: 3 }, pet_frog: { gap: 0.6, prio: 3 },
};
const MAX_VOICES = 6;
// F major pentatonic, for the rising coin "combo".
const COMBO = [77, 79, 81, 84, 86, 89, 91, 93];

export class SfxPlayer {
  private last = new Map<Sfx, number>();
  private active: { end: number; prio: number }[] = [];
  private combo = { n: 0, at: -10 };
  /** Melodic flourishes use the soundtrack's instruments, a little under the chimes. */
  private inst: GainNode;

  constructor(
    private ctx: BaseAudioContext,
    private out: AudioNode,
    private kit: Kit,
  ) {
    this.inst = ctx.createGain();
    this.inst.gain.value = 0.38;
    this.inst.connect(out);
  }

  /** Plays a sound unless it would be a too-fast repeat or the mixer is full of more important ones. */
  play(name: Sfx, when = this.ctx.currentTime): boolean {
    const now = this.ctx.currentTime;
    const rule = RULES[name];
    if (when - (this.last.get(name) ?? -10) < rule.gap) return false;
    this.active = this.active.filter((v) => v.end > now);
    if (this.active.length >= MAX_VOICES && !this.active.some((v) => v.prio < rule.prio)) return false;
    this.last.set(name, when);
    const len = this.render(name, when + 0.005);
    this.active.push({ end: when + len, prio: rule.prio });
    return true;
  }

  private g(when: number, peak: number, attack: number, decay: number, dest: AudioNode = this.out) {
    const g = this.ctx.createGain();
    g.gain.setValueAtTime(0, when);
    g.gain.linearRampToValueAtTime(peak, when + attack);
    g.gain.setTargetAtTime(0, when + attack, decay);
    g.connect(dest);
    return g;
  }

  private tone(type: OscillatorType, f0: number, f1: number, when: number, glide: number, peak: number, attack: number, decay: number, stop: number) {
    const o = this.ctx.createOscillator();
    o.type = type;
    o.frequency.setValueAtTime(f0, when);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, when + glide);
    o.connect(this.g(when, peak, attack, decay));
    o.start(when);
    o.stop(when + stop);
  }

  private bell(midi: number, when: number, peak: number, decay = 0.35) {
    const f = midiHz(midi);
    const c = this.ctx.createOscillator();
    const m = this.ctx.createOscillator();
    const mg = this.ctx.createGain();
    c.frequency.value = f;
    m.frequency.value = f * 3.5;
    mg.gain.setValueAtTime(f * 1.2, when);
    mg.gain.setTargetAtTime(0, when, decay * 0.4);
    m.connect(mg).connect(c.frequency);
    c.connect(this.g(when, peak, 0.003, decay));
    for (const o of [c, m]) {
      o.start(when);
      o.stop(when + decay * 6);
    }
  }

  private noise(when: number, dur: number, type: BiquadFilterType, freq: number, q: number, peak: number, attack: number, decay: number, sweepTo?: number) {
    const s = this.ctx.createBufferSource();
    s.buffer = this.kit.noise;
    const f = this.ctx.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, when);
    if (sweepTo) f.frequency.exponentialRampToValueAtTime(sweepTo, when + dur);
    f.Q.value = q;
    s.connect(f).connect(this.g(when, peak, attack, decay));
    s.start(when, 0.1, dur + 0.1);
  }

  private sparkle(when: number, count: number, peak: number, down = false) {
    for (let i = 0; i < count; i++) {
      const m = (down ? [96, 93, 91, 89, 86] : [86, 89, 91, 93, 96])[i % 5];
      this.bell(m, when + i * 0.055, peak * (1 - i * 0.12), 0.12);
    }
  }

  /** Returns the sound's length in seconds. */
  private render(name: Sfx, t: number): number {
    switch (name) {
      case 'click': // subtle tactile tick
        this.tone('sine', 1900, 1250, t, 0.012, 0.12, 0.001, 0.008, 0.05);
        this.noise(t, 0.01, 'highpass', 3500, 0.7, 0.03, 0.001, 0.004);
        return 0.05;
      case 'pop':
        this.tone('sine', 900, 1400, t, 0.03, 0.1, 0.002, 0.02, 0.08);
        return 0.08;
      case 'collect': {
        // Warm coin chime; quick successive collections climb the scale.
        const fresh = t - this.combo.at > 1.4;
        this.combo = { n: fresh ? 0 : Math.min(COMBO.length - 2, this.combo.n + 1), at: t };
        this.bell(COMBO[this.combo.n] - 12, t, 0.2, 0.18);
        this.bell(COMBO[this.combo.n + 1] - 12, t + 0.06, 0.16, 0.22);
        return 0.4;
      }
      case 'place': // soft, satisfying pop
        this.tone('sine', 520, 150, t, 0.09, 0.42, 0.003, 0.05, 0.25);
        this.noise(t, 0.06, 'lowpass', 500, 0.5, 0.25, 0.002, 0.025);
        this.tone('triangle', 1200, 900, t + 0.01, 0.02, 0.05, 0.001, 0.01, 0.05);
        return 0.25;
      case 'complete': // short flourish
        [77, 81, 84, 89].forEach((m, i) => this.kit.note('vibes', this.inst, t + i * 0.065, m, 0.25, 0.55));
        return 0.8;
      case 'levelup':
        [65, 69, 72, 77, 81, 84].forEach((m, i) => this.kit.note('piano', this.inst, t + i * 0.07, m, 0.4, 0.7));
        for (const m of [69, 72, 76, 79]) this.kit.note('ep', this.inst, t + 0.42, m + 12, 0.9, 0.4);
        this.sparkle(t + 0.45, 5, 0.06);
        return 1.6;
      case 'unlock': // cheerful ascending notes
        [72, 74, 77, 79, 81, 84].forEach((m, i) => this.kit.note('marimba', this.inst, t + i * 0.05, m, 0.18, 0.6));
        return 0.6;
      case 'reward': // gentle reward
        this.bell(81, t, 0.16, 0.3);
        this.bell(89, t + 0.09, 0.13, 0.4);
        this.sparkle(t + 0.18, 3, 0.04);
        return 0.9;
      case 'friendship': // warm, sparkling
        this.kit.note('pad', this.inst, t, 65, 0.7, 1.4);
        this.kit.note('pad', this.inst, t, 72, 0.7, 1.1);
        this.sparkle(t + 0.12, 5, 0.05, true);
        return 1.5;
      case 'water': // a few bubbly droplets and a soft splash
        for (let i = 0; i < 5; i++) {
          const f = 380 + ((i * 137) % 300);
          this.tone('sine', f, f * 2.3, t + i * 0.07 + (i % 2) * 0.02, 0.045, 0.08, 0.002, 0.02, 0.1);
        }
        this.noise(t, 0.35, 'bandpass', 1400, 0.8, 0.05, 0.03, 0.08, 700);
        return 0.5;
      case 'plant':
        this.noise(t, 0.08, 'lowpass', 650, 0.5, 0.2, 0.004, 0.03);
        this.tone('sine', 300, 520, t + 0.03, 0.05, 0.12, 0.003, 0.03, 0.12);
        return 0.15;
      case 'error': // a soft, friendly "hmm" (never a buzzer)
        this.tone('sine', midiHz(64), midiHz(64), t, 0, 0.12, 0.01, 0.06, 0.2);
        this.tone('sine', midiHz(60), midiHz(60), t + 0.13, 0, 0.12, 0.01, 0.08, 0.3);
        return 0.4;
      case 'whoosh':
        this.noise(t, 0.28, 'bandpass', 450, 1.2, 0.4, 0.08, 0.06, 2200);
        return 0.3;
      case 'chime':
        this.bell(84, t, 0.1, 0.5);
        this.bell(89, t + 0.15, 0.08, 0.6);
        return 1;
      case 'pet_cat': { // a little "mew"
        const o = this.ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.setValueAtTime(620, t);
        o.frequency.linearRampToValueAtTime(940, t + 0.12);
        o.frequency.linearRampToValueAtTime(660, t + 0.34);
        const f = this.ctx.createBiquadFilter();
        f.type = 'bandpass';
        f.frequency.value = 1500;
        f.Q.value = 0.9;
        o.connect(f).connect(this.g(t, 0.22, 0.04, 0.12));
        o.start(t);
        o.stop(t + 0.5);
        return 0.5;
      }
      case 'pet_dog': // a soft "wuf wuf"
        for (const dt of [0, 0.17]) {
          this.tone('triangle', 330, 190, t + dt, 0.08, 0.2, 0.006, 0.035, 0.14);
          this.noise(t + dt, 0.06, 'bandpass', 900, 1, 0.06, 0.004, 0.02);
        }
        return 0.35;
      case 'pet_fox': // a light yip
        this.tone('triangle', 880, 1250, t, 0.06, 0.13, 0.004, 0.04, 0.15);
        return 0.15;
      case 'pet_frog': // ribbit
        for (const dt of [0, 0.09]) this.tone('square', 210, 180, t + dt, 0.05, 0.06, 0.004, 0.025, 0.08);
        return 0.2;
    }
  }
}
