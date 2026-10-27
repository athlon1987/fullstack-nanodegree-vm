// Synthesised instruments for the POCKETHOOD score — no samples, so nothing to license and
// nothing to download. Each voice is a handful of WebAudio nodes that free themselves when the
// note ends. Works on an AudioContext or an OfflineAudioContext (for previews and tests).
import { midiHz, type Instrument } from './score';

export type Drum = 'kick' | 'snare' | 'rim' | 'hat' | 'openhat' | 'shaker' | 'clap' | 'brush' | 'ride';

export interface Kit {
  note(inst: Instrument, dest: AudioNode, when: number, midi: number, dur: number, vel: number): void;
  drum(kind: Drum, dest: AudioNode, when: number, vel: number): void;
  noise: AudioBuffer;
}

/** Deterministic noise so offline renders are reproducible. */
function noiseBuffer(ctx: BaseAudioContext, seconds: number, seed = 7) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  let x = seed >>> 0 || 1;
  for (let i = 0; i < len; i++) {
    x ^= x << 13;
    x ^= x >>> 17;
    x ^= x << 5;
    d[i] = ((x >>> 0) / 4294967296) * 2 - 1;
  }
  return buf;
}

function wave(ctx: BaseAudioContext, harmonics: number[]) {
  const real = new Float32Array(harmonics.length + 1);
  const imag = new Float32Array(harmonics.length + 1);
  harmonics.forEach((a, i) => (imag[i + 1] = a));
  return ctx.createPeriodicWave(real, imag, { disableNormalization: false });
}

export function createKit(ctx: BaseAudioContext): Kit {
  const noise = noiseBuffer(ctx, 1.5);
  const pianoWave = wave(ctx, [1, 0.6, 0.36, 0.22, 0.16, 0.1, 0.07, 0.05, 0.035, 0.025, 0.018, 0.012]);
  const padWave = wave(ctx, [1, 0.5, 0.33, 0.25, 0.2, 0.16, 0.14, 0.12, 0.1, 0.09]);
  const ks = new Map<number, AudioBuffer>();

  /** Karplus–Strong plucked string, rendered once per pitch and cached. */
  const pluck = (midi: number) => {
    let b = ks.get(midi);
    if (b) return b;
    const sr = ctx.sampleRate;
    const f = midiHz(midi);
    const n = Math.max(2, Math.round(sr / f));
    const len = Math.floor(sr * 1.8);
    b = ctx.createBuffer(1, len, sr);
    const y = b.getChannelData(0);
    let x = (midi * 2654435761) >>> 0 || 1;
    let prev = 0;
    for (let i = 0; i < n; i++) {
      x ^= x << 13;
      x ^= x >>> 17;
      x ^= x << 5;
      const r = ((x >>> 0) / 4294967296) * 2 - 1;
      prev = prev * 0.55 + r * 0.45; // softer pick: low-passed burst
      y[i] = prev;
    }
    // Remove the burst's DC offset (Karplus–Strong keeps it forever otherwise: a low rumble).
    let mean = 0;
    for (let i = 0; i < n; i++) mean += y[i] / n;
    for (let i = 0; i < n; i++) y[i] -= mean;
    const decay = 0.9965 - Math.max(0, midi - 60) * 0.0004;
    for (let i = n; i < len; i++) y[i] = 0.5 * (y[i - n] + y[i - n - 1 < 0 ? 0 : i - n - 1]) * decay;
    ks.set(midi, b);
    return b;
  };

  const env = (g: GainNode, when: number, peak: number, attack: number, decayTo: number, decayTime: number, end: number, release: number) => {
    const p = g.gain;
    p.setValueAtTime(0, when);
    p.linearRampToValueAtTime(peak, when + attack);
    p.setTargetAtTime(decayTo, when + attack, decayTime);
    p.setTargetAtTime(0, end, release);
  };

  const osc = (type: OscillatorType | PeriodicWave, freq: number, when: number, stop: number) => {
    const o = ctx.createOscillator();
    if (typeof type === 'string') o.type = type as OscillatorType;
    else o.setPeriodicWave(type);
    o.frequency.setValueAtTime(freq, when);
    o.start(when);
    o.stop(stop);
    return o;
  };

  const noiseSrc = (when: number, dur: number, rate = 1) => {
    const s = ctx.createBufferSource();
    s.buffer = noise;
    s.playbackRate.value = rate;
    // Start at a pseudo-random offset so repeated hits don't sound identical.
    s.start(when, ((when * 7.31) % 1) * 0.9, dur + 0.05);
    return s;
  };

  function note(inst: Instrument, dest: AudioNode, when: number, midi: number, dur: number, vel: number) {
    if (inst === 'none' || vel <= 0) return;
    const f = midiHz(midi);
    const end = when + dur;
    switch (inst) {
      case 'piano': {
        // Warm upright-ish piano: rich wave through a closing low-pass, decaying.
        const tail = Math.max(0.6, 2.4 - (midi - 60) * 0.04);
        const o = osc(pianoWave, f, when, end + 1.2);
        o.detune.value = (midi % 3) - 1;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.Q.value = 0.4;
        lp.frequency.setValueAtTime(Math.min(9000, f * 9), when);
        lp.frequency.setTargetAtTime(Math.min(4000, f * 3.2), when, 0.25);
        const g = ctx.createGain();
        env(g, when, 0.36 * vel, 0.004, 0.0001, tail / 3, end, 0.12);
        o.connect(lp).connect(g).connect(dest);
        break;
      }
      case 'ep': {
        // Rhodes-style FM: a sine carrier, a decaying modulator for the bark, a tine "ping".
        const c = osc('sine', f, when, end + 1);
        const m = osc('sine', f, when, end + 1);
        const mg = ctx.createGain();
        mg.gain.setValueAtTime(f * 1.6 * (0.5 + vel * 0.6), when);
        mg.gain.setTargetAtTime(f * 0.18, when, 0.18);
        m.connect(mg).connect(c.frequency);
        const tine = osc('sine', f * 7.02, when, when + 0.2);
        const tg = ctx.createGain();
        env(tg, when, 0.04 * vel, 0.002, 0.0001, 0.035, when + 0.15, 0.02);
        tine.connect(tg).connect(dest);
        const g = ctx.createGain();
        env(g, when, 0.3 * vel, 0.006, 0.12 * vel, 0.9, end, 0.22);
        c.connect(g).connect(dest);
        break;
      }
      case 'vibes': {
        const o = osc('sine', f, when, end + 2.4);
        const o4 = osc('sine', f * 4, when, when + 0.4);
        const g = ctx.createGain();
        env(g, when, 0.3 * vel, 0.003, 0.0001, 0.9, end + 0.6, 0.5);
        const g4 = ctx.createGain();
        env(g4, when, 0.07 * vel, 0.002, 0.0001, 0.05, when + 0.3, 0.05);
        o.connect(g).connect(dest);
        o4.connect(g4).connect(dest);
        break;
      }
      case 'marimba': {
        const o = osc('sine', f, when, end + 0.8);
        const o4 = osc('sine', f * 3.93, when, when + 0.15);
        const g = ctx.createGain();
        env(g, when, 0.4 * vel, 0.002, 0.0001, 0.22, end + 0.2, 0.08);
        const g4 = ctx.createGain();
        env(g4, when, 0.12 * vel, 0.001, 0.0001, 0.018, when + 0.1, 0.02);
        o.connect(g).connect(dest);
        o4.connect(g4).connect(dest);
        break;
      }
      case 'guitar': {
        const s = ctx.createBufferSource();
        s.buffer = pluck(midi);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 3200;
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 110;
        const g = ctx.createGain();
        g.gain.setValueAtTime(0.95 * vel, when);
        g.gain.setTargetAtTime(0, end + 0.15, 0.12);
        s.connect(hp).connect(lp).connect(g).connect(dest);
        s.start(when);
        s.stop(end + 0.8);
        break;
      }
      case 'pad': {
        const g = ctx.createGain();
        env(g, when, 0.08 * vel, Math.min(0.9, dur * 0.4), 0.065 * vel, 1.2, end, 0.9);
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = 1100;
        lp.Q.value = 0.3;
        for (const d of [-7, 6]) {
          const o = osc(padWave, f, when, end + 4);
          o.detune.value = d;
          o.connect(lp);
        }
        lp.connect(g).connect(dest);
        break;
      }
      case 'bass':
      case 'upright': {
        // Soft, round bass with a little 2nd harmonic so it still reads on phone speakers.
        const plucked = inst === 'upright';
        const o = osc('sine', f, when, end + 0.4);
        const o2 = osc('triangle', f * 2, when, end + 0.4);
        const g2 = ctx.createGain();
        g2.gain.value = plucked ? 0.42 : 0.34;
        const lp = ctx.createBiquadFilter();
        lp.type = 'lowpass';
        lp.frequency.value = plucked ? 1200 : 900;
        const hp = ctx.createBiquadFilter();
        hp.type = 'highpass';
        hp.frequency.value = 55;
        const g = ctx.createGain();
        if (plucked) env(g, when, 0.3 * vel, 0.006, 0.09 * vel, 0.35, end, 0.06);
        else env(g, when, 0.24 * vel, 0.012, 0.17 * vel, 0.8, end, 0.07);
        o.connect(lp);
        o2.connect(g2).connect(lp);
        lp.connect(hp).connect(g).connect(dest);
        break;
      }
    }
  }

  function drum(kind: Drum, dest: AudioNode, when: number, vel: number) {
    if (vel <= 0) return;
    const g = ctx.createGain();
    g.connect(dest);
    const filt = (type: BiquadFilterType, freq: number, q = 0.7) => {
      const b = ctx.createBiquadFilter();
      b.type = type;
      b.frequency.value = freq;
      b.Q.value = q;
      return b;
    };
    switch (kind) {
      case 'kick': {
        const o = ctx.createOscillator();
        o.frequency.setValueAtTime(150, when);
        o.frequency.exponentialRampToValueAtTime(58, when + 0.07);
        env(g, when, 0.42 * vel, 0.003, 0.0001, 0.07, when + 0.3, 0.03);
        // A soft beater click gives the kick definition without more low end.
        const click = noiseSrc(when, 0.012);
        const cg = ctx.createGain();
        env(cg, when, 0.05 * vel, 0.001, 0.0001, 0.004, when + 0.02, 0.005);
        click.connect(filt('bandpass', 2600, 0.8)).connect(cg).connect(dest);
        o.connect(g);
        o.start(when);
        o.stop(when + 0.45);
        break;
      }
      case 'snare': {
        const n = noiseSrc(when, 0.25);
        const bp = filt('bandpass', 1900, 0.7);
        const lp = filt('lowpass', 5200);
        env(g, when, 0.32 * vel, 0.002, 0.0001, 0.055, when + 0.22, 0.02);
        n.connect(bp).connect(lp).connect(g);
        const body = ctx.createOscillator();
        body.type = 'triangle';
        body.frequency.setValueAtTime(200, when);
        body.frequency.exponentialRampToValueAtTime(150, when + 0.08);
        const bg = ctx.createGain();
        env(bg, when, 0.22 * vel, 0.002, 0.0001, 0.04, when + 0.12, 0.02);
        body.connect(bg).connect(dest);
        body.start(when);
        body.stop(when + 0.15);
        break;
      }
      case 'rim': {
        const o = ctx.createOscillator();
        o.type = 'triangle';
        o.frequency.value = 820;
        env(g, when, 0.22 * vel, 0.001, 0.0001, 0.012, when + 0.06, 0.01);
        o.connect(filt('bandpass', 1600, 1.5)).connect(g);
        o.start(when);
        o.stop(when + 0.08);
        break;
      }
      case 'hat':
      case 'openhat': {
        const open = kind === 'openhat';
        const n = noiseSrc(when, open ? 0.3 : 0.06);
        env(g, when, (open ? 0.2 : 0.24) * vel, 0.001, 0.0001, open ? 0.08 : 0.014, when + (open ? 0.28 : 0.05), 0.01);
        n.connect(filt('highpass', 6200, 0.5)).connect(filt('lowpass', 12000)).connect(g);
        break;
      }
      case 'shaker': {
        const n = noiseSrc(when, 0.09);
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(0.2 * vel, when + 0.018);
        g.gain.setTargetAtTime(0, when + 0.02, 0.022);
        n.connect(filt('bandpass', 6200, 1.1)).connect(g);
        break;
      }
      case 'clap': {
        const n = noiseSrc(when, 0.25);
        const p = g.gain;
        p.setValueAtTime(0, when);
        for (const dt of [0, 0.011, 0.022]) {
          p.setValueAtTime(0.3 * vel, when + dt);
          p.setTargetAtTime(0.05 * vel, when + dt + 0.001, 0.004);
        }
        p.setTargetAtTime(0, when + 0.03, 0.05);
        n.connect(filt('bandpass', 1350, 1.1)).connect(g);
        break;
      }
      case 'brush': {
        const n = noiseSrc(when, 0.3);
        g.gain.setValueAtTime(0, when);
        g.gain.linearRampToValueAtTime(0.16 * vel, when + 0.03);
        g.gain.setTargetAtTime(0, when + 0.04, 0.07);
        n.connect(filt('lowpass', 4800, 0.4)).connect(filt('highpass', 900)).connect(g);
        break;
      }
      case 'ride': {
        const n = noiseSrc(when, 0.45);
        env(g, when, 0.06 * vel, 0.001, 0.0001, 0.14, when + 0.42, 0.03);
        n.connect(filt('bandpass', 6800, 2.2)).connect(g);
        const o = ctx.createOscillator();
        o.frequency.value = 3920;
        const og = ctx.createGain();
        env(og, when, 0.012 * vel, 0.001, 0.0001, 0.12, when + 0.4, 0.03);
        o.connect(og).connect(dest);
        o.start(when);
        o.stop(when + 0.45);
        break;
      }
    }
  }

  return { note, drum, noise };
}

/** A soft, warm stereo room (generated, so it's identical everywhere). */
export function roomImpulse(ctx: BaseAudioContext, seconds = 2.2) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    let x = 12345 + ch * 777;
    let lp = 0;
    for (let i = 0; i < len; i++) {
      x ^= x << 13;
      x ^= x >>> 17;
      x ^= x << 5;
      const r = ((x >>> 0) / 4294967296) * 2 - 1;
      const t = i / ctx.sampleRate;
      lp += (r - lp) * (0.35 - 0.25 * (t / seconds)); // darker as it decays
      d[i] = lp * Math.pow(1 - t / seconds, 2.2) * (t < 0.012 ? t / 0.012 : 1);
    }
  }
  return buf;
}
