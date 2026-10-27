// Adaptive music engine. One transport plays the POCKETHOOD score continuously; the game sets a
// mood (town, café, garden, construction, celebration, night, mini-game, Zen) and the engine
// moves to that arrangement at the next bar line — tempo eases over a few bars, layers
// crossfade, the theme keeps its place. Nothing restarts when the player moves around.
//
// Works on an AudioContext (the game) or an OfflineAudioContext (previews, tests).
import { createKit, roomImpulse, type Drum, type Kit } from './instruments';
import { ARRANGEMENTS, BASSLINES, COMPS, GROOVES, LAYERS, MOTIF, PROGRESSION, STINGERS, THEME, type Arrangement, type Layer, type MoodId, type StingerId } from './score';

const STEPS_PER_BAR = 16;
const BARS_PER_CYCLE = 8;
/** Per-arrangement loudness trims (measured with scripts/audio/render-previews: equal RMS ±1.5 dB). */
export const MOOD_TRIM: Record<MoodId, number> = { town: 1, build: 1, cafe: 1, garden: 1.85, night: 1.1, celebration: 0.92, activity: 1, zen: 1.6 };

export interface MusicOptions {
  /** Seconds a requested mood must persist before the music follows (avoids flapping). */
  settle?: number;
  seed?: number;
}

export class MusicEngine {
  readonly kit: Kit;
  private buses: Record<Layer, GainNode>;
  private stingerBus: GainNode;
  private tone: BiquadFilterNode;
  private duck: GainNode;
  private reverbIn: GainNode;
  private reverbOut: GainNode;
  private crackle: GainNode;
  private sources: AudioScheduledSourceNode[] = [];
  private mood: MoodId = 'town';
  private arr: Arrangement = ARRANGEMENTS.town;
  private wanted: { mood: MoodId; since: number } = { mood: 'town', since: 0 };
  private bpm = ARRANGEMENTS.town.bpm;
  private step = 0;
  private nextTime = 0;
  private rng: number;
  private settle: number;
  private started = false;
  /** Bar-line mood changes, for tests and Studio. */
  readonly changes: { time: number; mood: MoodId; bar: number }[] = [];

  constructor(
    private ctx: BaseAudioContext,
    out: AudioNode,
    stingerOut: AudioNode = out,
    opts: MusicOptions = {},
  ) {
    this.settle = opts.settle ?? 1.2;
    this.rng = (opts.seed ?? 20261027) >>> 0;
    this.kit = createKit(ctx);
    const master = ctx.createGain();
    master.gain.value = 0.42;
    // Lo-fi chain: tone filter → gentle tape wobble → soft compression → duck → out.
    this.tone = ctx.createBiquadFilter();
    this.tone.type = 'lowpass';
    this.tone.Q.value = 0.5;
    this.tone.frequency.value = this.arr.tone;
    const wobble = ctx.createDelay(0.05);
    wobble.delayTime.value = 0.012;
    const lfo = ctx.createOscillator();
    lfo.frequency.value = 0.55;
    const depth = ctx.createGain();
    depth.gain.value = 0.0005;
    lfo.connect(depth).connect(wobble.delayTime);
    lfo.start();
    this.sources.push(lfo);
    const comp = ctx.createDynamicsCompressor();
    comp.threshold.value = -20;
    comp.knee.value = 12;
    comp.ratio.value = 2.5;
    comp.attack.value = 0.012;
    comp.release.value = 0.25;
    this.duck = ctx.createGain();
    const shelf = ctx.createBiquadFilter();
    shelf.type = 'lowshelf';
    shelf.frequency.value = 140;
    shelf.gain.value = -4;
    // Tonal layers go through the lo-fi tone filter; drums keep their air (own gentle low-pass).
    const mix = ctx.createGain();
    master.connect(shelf).connect(this.tone).connect(mix);
    const drumMaster = ctx.createGain();
    drumMaster.gain.value = 0.42;
    const drumLp = ctx.createBiquadFilter();
    drumLp.type = 'lowpass';
    drumLp.frequency.value = 11000;
    drumLp.Q.value = 0.4;
    drumMaster.connect(drumLp).connect(mix);
    mix.connect(wobble).connect(comp).connect(this.duck).connect(out);

    this.reverbIn = ctx.createGain();
    const verbHp = ctx.createBiquadFilter();
    verbHp.type = 'highpass';
    verbHp.frequency.value = 280;
    const conv = ctx.createConvolver();
    conv.buffer = roomImpulse(ctx);
    this.reverbOut = ctx.createGain();
    this.reverbOut.gain.value = this.arr.reverb;
    this.reverbIn.connect(verbHp).connect(conv).connect(this.reverbOut).connect(this.duck);

    this.buses = Object.fromEntries(
      LAYERS.map((l) => {
        const g = ctx.createGain();
        g.gain.value = this.arr.mix[l] * MOOD_TRIM.town;
        g.connect(l === 'drums' ? drumMaster : master);
        if (l !== 'bass' && l !== 'drums') {
          const send = ctx.createGain();
          send.gain.value = l === 'pad' ? 0.9 : 0.6;
          g.connect(send).connect(this.reverbIn);
        }
        return [l, g];
      }),
    ) as Record<Layer, GainNode>;
    // Rhodes tremolo on the chord bus.
    const trem = ctx.createOscillator();
    trem.frequency.value = 4.2;
    const tremDepth = ctx.createGain();
    tremDepth.gain.value = 0.08;
    trem.connect(tremDepth).connect(this.buses.chords.gain);
    trem.start();
    this.sources.push(trem);

    this.stingerBus = ctx.createGain();
    this.stingerBus.gain.value = 0.5;
    this.stingerBus.connect(stingerOut);
    const st = ctx.createGain();
    st.gain.value = 0.35;
    this.stingerBus.connect(st).connect(this.reverbIn);

    // Vinyl crackle and hiss, very low.
    const cbuf = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 2.3), ctx.sampleRate);
    const cd = cbuf.getChannelData(0);
    let x = 99991;
    for (let i = 0; i < cd.length; i++) {
      x = (x * 1103515245 + 12345) >>> 0;
      const r = x / 4294967296;
      cd[i] = (r - 0.5) * 0.03;
      if (r < 0.00045) {
        const amp = (0.25 + ((x >>> 7) % 100) / 130) * (r < 0.000225 ? 1 : -1);
        for (let k = 0; k < 24 && i + k < cd.length; k++) cd[i + k] += amp * Math.exp(-k / 4);
      }
    }
    const crackleSrc = ctx.createBufferSource();
    crackleSrc.buffer = cbuf;
    crackleSrc.loop = true;
    const hp = ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 900;
    this.crackle = ctx.createGain();
    this.crackle.gain.value = this.arr.crackle * 0.05;
    crackleSrc.connect(hp).connect(this.crackle).connect(this.duck);
    crackleSrc.start();
    this.sources.push(crackleSrc);
  }

  get currentMood(): MoodId {
    return this.mood;
  }
  get tempo(): number {
    return this.bpm;
  }
  get position() {
    return { step: this.step, bar: Math.floor(this.step / STEPS_PER_BAR), cycle: Math.floor(this.step / (STEPS_PER_BAR * BARS_PER_CYCLE)) };
  }

  /** Start at `when` in a given mood (no crossfade). */
  start(when: number, mood: MoodId = 'town') {
    this.started = true;
    this.nextTime = when;
    this.wanted = { mood, since: when - 10 };
    this.applyMood(mood, when, true);
  }

  /** Ask for a mood; it takes effect at a bar line once it has held for `settle` seconds. */
  setMood(mood: MoodId, now = this.ctx.currentTime) {
    if (mood !== this.wanted.mood) this.wanted = { mood, since: now };
  }

  private rand() {
    this.rng = (this.rng * 1664525 + 1013904223) >>> 0;
    return this.rng / 4294967296;
  }

  private stepDur() {
    return 60 / this.bpm / 4;
  }

  /** Schedule everything that starts before `until` (call every ~100 ms with until = now + 0.35). */
  schedule(until: number) {
    if (!this.started) return;
    while (this.nextTime < until) {
      this.playStep(this.step, this.nextTime);
      this.nextTime += this.stepDur();
      this.step++;
    }
  }

  private applyMood(mood: MoodId, t: number, instant = false) {
    this.mood = mood;
    this.arr = ARRANGEMENTS[mood];
    const tc = instant ? 0.01 : 1.1;
    const trim = MOOD_TRIM[mood];
    for (const l of LAYERS) this.buses[l].gain.setTargetAtTime(this.arr.mix[l] * trim, t, tc);
    this.tone.frequency.setTargetAtTime(this.arr.tone, t, instant ? 0.01 : 1.4);
    this.reverbOut.gain.setTargetAtTime(this.arr.reverb, t, tc);
    this.crackle.gain.setTargetAtTime(this.arr.crackle * 0.05, t, tc);
    if (instant) this.bpm = this.arr.bpm;
  }

  private playStep(step: number, t0: number) {
    const sib = step % STEPS_PER_BAR;
    const bar = Math.floor(step / STEPS_PER_BAR);
    if (sib === 0) {
      // Bar line: follow the requested mood if it has settled; ease the tempo.
      const w = this.wanted;
      if (w.mood !== this.mood && t0 - w.since >= this.settle) {
        this.applyMood(w.mood, t0);
        this.changes.push({ time: t0, mood: w.mood, bar });
      }
      const target = this.arr.bpm;
      if (this.bpm !== target) this.bpm += Math.max(-7, Math.min(7, target - this.bpm));
    }
    const a = this.arr;
    const dur = this.stepDur();
    const swing = sib % 2 === 1 ? a.swing * dur : 0;
    const t = t0 + swing;
    const barInCycle = bar % BARS_PER_CYCLE;
    const cycleStep = barInCycle * STEPS_PER_BAR + sib;
    const section = a.form[Math.floor(bar / BARS_PER_CYCLE) % a.form.length];
    const chord = PROGRESSION[barInCycle];
    const next = PROGRESSION[(barInCycle + 1) % BARS_PER_CYCLE];
    const human = () => (this.rand() - 0.5) * 0.008;
    const vel = (v: number) => v * (0.92 + this.rand() * 0.16);
    const k = this.kit;
    const B = this.buses;

    // Drums
    const groove = section === 'breakdown' && a.groove !== 'zen' && a.groove !== 'none' ? GROOVES.breakdown : GROOVES[a.groove];
    for (const [kind, pattern] of Object.entries(groove) as [Drum, number[]][]) {
      const v = pattern[sib];
      if (v) k.drum(kind, B.drums, t + (kind === 'kick' ? 0 : human()), vel(v));
    }

    // Bass
    for (const [s, len, iv] of BASSLINES[a.bassline]) {
      if (s !== sib) continue;
      const third = chord.quality === 'min' ? 3 : 4;
      const midi = iv === 'a' ? next.root - 1 : iv === 't' ? chord.root + third : chord.root + iv;
      k.note(a.bass, B.bass, t, midi, len * dur * 0.95, vel(section === 'breakdown' && a.bassline !== 'drone' ? 0.6 : 0.85));
    }

    // Chords
    const comp = COMPS[a.comp];
    if (comp === 'arp') {
      if (sib % 2 === 0) {
        const order = [0, 1, 2, 3, 2, 1, 0, 2];
        // Guitar arpeggios sit an octave up so they sparkle instead of thickening the low mids.
        const n = chord.voicing[order[sib / 2]] + (a.chords === 'guitar' ? 12 : 0);
        k.note(a.chords, B.chords, t + human(), n, 3 * dur, vel(sib === 0 ? 0.62 : 0.48));
      }
    } else {
      for (const [s, len, v] of comp) if (s === sib) for (const n of chord.voicing) k.note(a.chords, B.chords, t + human() * 0.5, n, len * dur * 0.95, vel(v));
    }

    // Pad
    if (a.pad && sib === 0) {
      for (const n of chord.voicing.slice(1)) k.note('pad', B.pad, t, n + 12, STEPS_PER_BAR * dur * 1.02, 0.7);
    }

    // Lead and counter-line, by section of the form.
    const play = (events: [number, number, number][], at: number, inst = a.lead, bus: GainNode = B.lead, v = 0.82, transpose = 0) => {
      for (const [s, len, n] of events) if (s === at) k.note(inst, bus, t + human(), n + transpose, len * dur * 0.92, vel(v));
    };
    switch (section) {
      case 'theme':
      case 'lift': {
        play(THEME, cycleStep);
        const dbl = section === 'lift' ? a.double ?? a.counter : a.double;
        if (dbl && dbl !== 'none') play(THEME, cycleStep, dbl, B.counter, 0.42, 12);
        // A soft answering guide tone at the end of every other bar.
        if (sib === 12 && barInCycle % 2 === 1) k.note(a.counter, B.counter, t, chord.guide[0], 4 * dur, vel(0.3));
        break;
      }
      case 'groove':
        if (sib === 4 || (sib === 11 && barInCycle % 2 === 0)) k.note(a.counter, B.counter, t + human(), chord.guide[sib === 4 ? 1 : 0], 5 * dur, vel(0.5));
        if (barInCycle === 7 && sib >= 8) play(THEME.filter(([s]) => s >= 120).map(([s, l, n]) => [s - 112, l, n]), sib, a.lead, B.lead, 0.6);
        break;
      case 'breakdown':
        if (barInCycle === 0 || barInCycle === 4) play(MOTIF, sib, a.lead, B.lead, 0.55, barInCycle === 4 ? 5 : 0);
        break;
      case 'motif':
        // Zen: the hook on bar 1, its echo on bar 5 (up a fourth, over B♭), silence between.
        if (barInCycle === 0) play(MOTIF, sib, a.lead, B.lead, 0.5);
        if (barInCycle === 4) play(MOTIF, sib, a.lead, B.lead, 0.42, 5);
        break;
    }
  }

  /** A short flourish in key, on the beat grid, over a brief duck of the music. */
  stinger(id: StingerId, now = this.ctx.currentTime) {
    const s = STINGERS[id];
    const dur = this.stepDur();
    let t = now + 0.03;
    if (this.started) {
      // Next 16th on the transport grid.
      const ahead = this.nextTime - t;
      t = this.nextTime - Math.floor(ahead / dur) * dur;
      if (t < now + 0.02) t += dur;
    }
    const total = (s.notes.at(-1)![0] + s.notes.at(-1)![1]) * dur;
    for (const [st, len, n] of s.notes) this.kit.note(s.inst, this.stingerBus, t + st * dur, n, len * dur, 0.85);
    if (id === 'level') for (const n of PROGRESSION[0].voicing) this.kit.note('ep', this.stingerBus, t + 5 * dur, n + 12, 6 * dur, 0.5);
    const g = this.duck.gain;
    g.cancelScheduledValues(t);
    g.setTargetAtTime(0.6, t, 0.05);
    g.setTargetAtTime(1, t + total, 0.35);
    return t;
  }

  stop() {
    this.started = false;
    for (const s of this.sources) {
      try {
        s.stop();
      } catch {
        /* already stopped */
      }
    }
  }
}
