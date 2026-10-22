import type { SfxId } from '../data/types';

/**
 * All sound is synthesised with WebAudio, so the game ships no audio files.
 * Music is a small step sequencer with one pattern set per stage.
 */
export class AudioManager {
  ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private musicGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private noiseBuf: AudioBuffer | null = null;
  private musicVol = 0.6;
  private sfxVol = 0.8;
  private track = -1;
  private nextNote = 0;
  private step = 0;
  private timer: number | null = null;
  private lastPlay = new Map<SfxId, number>();
  muted = false;

  /** Must be called from a user gesture (browsers block audio until then). */
  unlock(): void {
    if (!this.ctx) {
      try {
        const AC = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (!AC) return;
        this.ctx = new AC();
        this.master = this.ctx.createGain();
        this.master.connect(this.ctx.destination);
        this.musicGain = this.ctx.createGain();
        this.sfxGain = this.ctx.createGain();
        const comp = this.ctx.createDynamicsCompressor();
        this.musicGain.connect(comp);
        this.sfxGain.connect(comp);
        comp.connect(this.master);
        this.setVolumes(this.musicVol, this.sfxVol);
        const len = this.ctx.sampleRate * 0.6;
        this.noiseBuf = this.ctx.createBuffer(1, len, this.ctx.sampleRate);
        const d = this.noiseBuf.getChannelData(0);
        for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
      } catch {
        this.ctx = null;
        return;
      }
    }
    if (this.ctx.state === 'suspended') this.ctx.resume().catch(() => {});
  }

  setVolumes(music: number, sfx: number): void {
    this.musicVol = music;
    this.sfxVol = sfx;
    if (this.musicGain) this.musicGain.gain.value = music * 0.35;
    if (this.sfxGain) this.sfxGain.gain.value = sfx * 0.7;
  }

  suspend(): void {
    this.ctx?.suspend().catch(() => {});
  }

  resume(): void {
    if (this.ctx && this.ctx.state !== 'running') this.ctx.resume().catch(() => {});
  }

  private env(g: GainNode, t: number, a: number, peak: number, d: number): void {
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(peak, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + a + d);
  }

  private osc(type: OscillatorType, f0: number, f1: number, dur: number, vol: number, pan = 0, delay = 0, out?: AudioNode): void {
    const c = this.ctx!;
    const t = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    o.frequency.exponentialRampToValueAtTime(Math.max(20, f1), t + dur);
    this.env(g, t, 0.005, vol, dur);
    o.connect(g);
    this.route(g, pan, out);
    o.start(t);
    o.stop(t + dur + 0.05);
  }

  private noise(dur: number, vol: number, freq: number, q = 1, pan = 0, delay = 0, type: BiquadFilterType = 'bandpass', freqEnd?: number): void {
    const c = this.ctx!;
    const t = c.currentTime + delay;
    const s = c.createBufferSource();
    s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter();
    f.type = type;
    f.frequency.setValueAtTime(freq, t);
    if (freqEnd) f.frequency.exponentialRampToValueAtTime(freqEnd, t + dur);
    f.Q.value = q;
    const g = c.createGain();
    this.env(g, t, 0.004, vol, dur);
    s.connect(f);
    f.connect(g);
    this.route(g, pan);
    s.start(t);
    s.stop(t + dur + 0.05);
  }

  private route(node: AudioNode, pan: number, out?: AudioNode): void {
    const c = this.ctx!;
    const dest = out ?? this.sfxGain!;
    if (pan !== 0 && c.createStereoPanner) {
      const p = c.createStereoPanner();
      p.pan.value = Math.max(-1, Math.min(1, pan * 0.7));
      node.connect(p);
      p.connect(dest);
    } else node.connect(dest);
  }

  play(id: SfxId, pan = 0, vol = 1): void {
    if (!this.ctx || this.ctx.state !== 'running' || this.muted) return;
    const now = this.ctx.currentTime;
    const last = this.lastPlay.get(id) ?? 0;
    if (now - last < 0.035) return; // avoid stacking identical sounds
    this.lastPlay.set(id, now);
    const v = vol;
    const r = 0.9 + Math.random() * 0.2;
    switch (id) {
      case 'swingLight':
        this.noise(0.08, 0.25 * v, 2500 * r, 1.2, pan, 0, 'bandpass', 900);
        break;
      case 'swingHeavy':
        this.noise(0.16, 0.35 * v, 1400 * r, 1, pan, 0, 'bandpass', 400);
        break;
      case 'hitLight':
        this.noise(0.06, 0.5 * v, 1800 * r, 0.8, pan);
        this.osc('square', 220 * r, 90, 0.07, 0.25 * v, pan);
        break;
      case 'hitHeavy':
        this.noise(0.14, 0.7 * v, 900 * r, 0.7, pan, 0, 'lowpass', 200);
        this.osc('sine', 140 * r, 45, 0.18, 0.7 * v, pan);
        break;
      case 'block':
        this.osc('triangle', 900, 700, 0.1, 0.35 * v, pan);
        this.noise(0.05, 0.25 * v, 3000, 2, pan);
        break;
      case 'parry':
        this.osc('sine', 1320, 1760, 0.15, 0.4 * v, pan);
        this.osc('sine', 1980, 2640, 0.2, 0.25 * v, pan, 0.04);
        break;
      case 'clang':
        this.osc('square', 620, 590, 0.18, 0.2 * v, pan);
        this.osc('triangle', 1240, 1180, 0.25, 0.2 * v, pan);
        break;
      case 'jump':
        this.osc('square', 300, 620, 0.12, 0.15 * v, pan);
        break;
      case 'land':
        this.noise(0.08, 0.3 * v, 400, 1, pan, 0, 'lowpass');
        break;
      case 'dodge':
        this.noise(0.14, 0.25 * v, 3500, 1.5, pan, 0, 'bandpass', 1200);
        break;
      case 'bark':
        this.osc('sawtooth', 420, 220, 0.12, 0.45 * v, pan);
        this.osc('sawtooth', 440, 210, 0.13, 0.4 * v, pan, 0.16);
        this.noise(0.1, 0.2 * v, 900, 1, pan);
        break;
      case 'howl':
        this.osc('sawtooth', 300, 700, 0.6, 0.35 * v, pan);
        this.osc('sine', 600, 1000, 0.7, 0.25 * v, pan, 0.1);
        break;
      case 'banana':
        this.noise(0.25, 0.2 * v, 2000, 3, pan, 0, 'bandpass', 3500);
        break;
      case 'chatter':
        for (let i = 0; i < 3; i++) this.osc('square', 700 + i * 120, 1100 + i * 100, 0.06, 0.12 * v, pan, i * 0.07);
        break;
      case 'coin':
        this.osc('square', 988, 988, 0.05, 0.12 * v, pan);
        this.osc('square', 1319, 1319, 0.09, 0.12 * v, pan, 0.05);
        break;
      case 'pencil':
        [523, 659, 784, 1047].forEach((f, i) => this.osc('triangle', f, f, 0.12, 0.25 * v, pan, i * 0.07));
        break;
      case 'heal':
        [440, 554, 659].forEach((f, i) => this.osc('sine', f, f * 1.01, 0.15, 0.25 * v, pan, i * 0.06));
        break;
      case 'telegraph':
        this.osc('square', 500, 900, 0.12, 0.12 * v, pan);
        break;
      case 'explode':
        this.noise(0.5, 0.8 * v, 1200, 0.6, pan, 0, 'lowpass', 80);
        this.osc('sine', 90, 30, 0.5, 0.7 * v, pan);
        break;
      case 'roar':
        this.osc('sawtooth', 110, 70, 0.7, 0.4 * v, pan);
        this.noise(0.7, 0.3 * v, 500, 0.8, pan, 0, 'lowpass', 150);
        break;
      case 'revive':
        [392, 523, 659, 784].forEach((f, i) => this.osc('triangle', f, f, 0.14, 0.25 * v, pan, i * 0.08));
        break;
      case 'down':
        this.osc('triangle', 500, 120, 0.5, 0.3 * v, pan);
        break;
      case 'uiMove':
        this.osc('square', 660, 660, 0.03, 0.08 * v);
        break;
      case 'uiSelect':
        this.osc('square', 880, 1320, 0.08, 0.12 * v);
        break;
      case 'uiBack':
        this.osc('square', 520, 330, 0.08, 0.1 * v);
        break;
      case 'crate':
        this.noise(0.1, 0.4 * v, 700, 1.2, pan);
        break;
      case 'shoot':
        this.osc('square', 300, 150, 0.12, 0.15 * v, pan);
        this.noise(0.08, 0.15 * v, 2000, 1, pan);
        break;
      case 'stomp':
        this.osc('sine', 80, 35, 0.35, 0.8 * v, pan);
        this.noise(0.25, 0.4 * v, 300, 0.7, pan, 0, 'lowpass');
        break;
      case 'plate':
        this.osc('triangle', 660, 660, 0.08, 0.2 * v, pan);
        break;
      case 'gate':
        [330, 440, 554, 659, 880].forEach((f, i) => this.osc('square', f, f, 0.1, 0.12 * v, pan, i * 0.06));
        break;
      case 'team':
        [523, 659, 784, 1047, 1319].forEach((f, i) => this.osc('sawtooth', f, f, 0.12, 0.12 * v, pan, i * 0.04));
        break;
      case 'heartbeat':
        this.osc('sine', 70, 50, 0.12, 0.6 * v);
        this.osc('sine', 70, 50, 0.12, 0.5 * v, 0, 0.2);
        break;
      case 'fall':
        this.osc('sine', 900, 150, 0.45, 0.25 * v, pan);
        break;
      case 'horn':
        this.osc('square', 392, 392, 0.18, 0.15 * v, pan);
        this.osc('square', 311, 311, 0.25, 0.15 * v, pan, 0.2);
        break;
      case 'steam':
        this.noise(0.4, 0.2 * v, 5000, 0.5, pan, 0, 'highpass');
        break;
    }
  }

  // ---------------------------------------------------------------- music
  playMusic(track: number): void {
    if (!this.ctx) return;
    if (this.track === track && this.timer !== null) return;
    this.stopMusic();
    this.track = track;
    this.step = 0;
    this.nextNote = this.ctx.currentTime + 0.1;
    this.timer = window.setInterval(() => this.schedule(), 50);
  }

  stopMusic(): void {
    if (this.timer !== null) window.clearInterval(this.timer);
    this.timer = null;
    this.track = -1;
  }

  private schedule(): void {
    const c = this.ctx;
    if (!c || c.state !== 'running') return;
    const song = SONGS[this.track] ?? SONGS[0];
    const stepDur = 60 / song.bpm / 4;
    while (this.nextNote < c.currentTime + 0.15) {
      const s = this.step % 64;
      const bar = Math.floor(s / 16) % song.chords.length;
      const root = song.root * Math.pow(2, song.chords[bar] / 12);
      const t0 = this.nextNote - c.currentTime;
      if (song.bass[s % 16]) this.osc(song.bassWave, root / 2, root / 2, stepDur * 1.6, 0.3, 0, t0, this.musicGain!);
      const ln = song.lead[s % 32];
      if (ln !== null && ln !== undefined) {
        const f = root * Math.pow(2, song.scale[ln % song.scale.length] / 12 + Math.floor(ln / song.scale.length));
        this.osc(song.leadWave, f, f, stepDur * 1.8, 0.14, 0, t0, this.musicGain!);
      }
      if (song.kick[s % 16]) this.osc('sine', 120, 40, 0.12, 0.5, 0, t0, this.musicGain!);
      if (song.hat[s % 16]) this.noiseMusic(t0, 0.03, 0.08, 8000);
      if (song.snare[s % 16]) this.noiseMusic(t0, 0.1, 0.22, 1800);
      this.nextNote += stepDur;
      this.step++;
    }
  }

  private noiseMusic(delay: number, dur: number, vol: number, freq: number): void {
    const c = this.ctx!;
    const t = c.currentTime + delay;
    const s = c.createBufferSource();
    s.buffer = this.noiseBuf;
    const f = c.createBiquadFilter();
    f.type = freq > 5000 ? 'highpass' : 'bandpass';
    f.frequency.value = freq;
    const g = c.createGain();
    this.env(g, t, 0.003, vol, dur);
    s.connect(f);
    f.connect(g);
    g.connect(this.musicGain!);
    s.start(t);
    s.stop(t + dur + 0.05);
  }
}

interface Song {
  bpm: number;
  root: number;
  scale: number[];
  chords: number[];
  bassWave: OscillatorType;
  leadWave: OscillatorType;
  bass: number[];
  lead: (number | null)[];
  kick: number[];
  snare: number[];
  hat: number[];
}

const _ = null;
const MAJ = [0, 2, 4, 7, 9];
const MIN = [0, 3, 5, 7, 10];

const SONGS: Song[] = [
  // 0 meadow: bouncy major
  { bpm: 128, root: 261.6, scale: MAJ, chords: [0, 5, 7, 5], bassWave: 'triangle', leadWave: 'square',
    bass: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0],
    lead: [4, _, 3, _, 2, _, 4, _, 5, _, 4, 3, 2, _, _, _, 2, _, 3, _, 4, _, 2, _, 1, _, 2, 3, 4, _, _, _],
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], hat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 1] },
  // 1 canyon: western minor
  { bpm: 138, root: 220, scale: MIN, chords: [0, 0, 5, 7], bassWave: 'triangle', leadWave: 'sawtooth',
    bass: [1, 0, 1, 0, 0, 0, 1, 0, 1, 0, 1, 0, 0, 1, 0, 0],
    lead: [0, _, _, 2, 3, _, 4, _, 3, _, 2, _, 0, _, _, _, 5, _, 4, _, 3, _, 2, _, 3, _, 4, _, 2, _, _, _],
    kick: [1, 0, 0, 1, 0, 0, 1, 0, 1, 0, 0, 1, 0, 0, 1, 0], snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 1], hat: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0] },
  // 2 city: synth night
  { bpm: 118, root: 196, scale: MIN, chords: [0, 8, 3, 10], bassWave: 'sawtooth', leadWave: 'square',
    bass: [1, 0, 1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0],
    lead: [7, _, 5, _, 4, _, 2, _, 4, _, _, _, 5, _, 4, 2, 7, _, 9, _, 7, _, 5, _, 4, _, 5, _, 2, _, _, _],
    kick: [1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0], snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], hat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
  // 3 factory: industrial
  { bpm: 144, root: 174.6, scale: MIN, chords: [0, 0, 1, 0], bassWave: 'square', leadWave: 'sawtooth',
    bass: [1, 1, 0, 1, 1, 0, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1],
    lead: [0, _, 0, _, 3, _, _, 2, _, _, 0, _, 5, _, 4, _, 0, _, 0, _, 3, _, _, 2, _, _, 6, _, 5, _, 3, _],
    kick: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0], snare: [0, 0, 0, 0, 1, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0], hat: [0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1] },
  // 4 tower: dramatic
  { bpm: 150, root: 164.8, scale: MIN, chords: [0, 8, 5, 7], bassWave: 'sawtooth', leadWave: 'square',
    bass: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1],
    lead: [5, _, 4, _, 3, _, 2, _, 3, _, 4, _, 5, _, 7, _, 9, _, 8, _, 7, _, 5, _, 4, _, 5, _, 7, _, _, _],
    kick: [1, 0, 0, 1, 1, 0, 0, 0, 1, 0, 0, 1, 1, 0, 0, 0], snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1, 0], hat: [1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1, 1, 0, 1, 1] },
  // 5 menu / ending: calm
  { bpm: 96, root: 261.6, scale: MAJ, chords: [0, 9, 5, 7], bassWave: 'triangle', leadWave: 'triangle',
    bass: [1, 0, 0, 0, 0, 0, 1, 0, 1, 0, 0, 0, 0, 0, 0, 0],
    lead: [2, _, _, 4, _, _, 5, _, 4, _, 2, _, _, _, _, _, 3, _, _, 2, _, _, 1, _, 2, _, _, _, _, _, _, _],
    kick: [1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0], snare: [0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], hat: [0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0, 0, 0, 1, 0] },
  // 6 boss
  { bpm: 160, root: 185, scale: MIN, chords: [0, 1, 0, 6], bassWave: 'sawtooth', leadWave: 'sawtooth',
    bass: [1, 1, 0, 1, 1, 0, 1, 1, 1, 1, 0, 1, 1, 0, 1, 0],
    lead: [0, _, 3, _, 4, _, 3, _, 0, _, 3, _, 6, _, 5, _, 0, _, 3, _, 4, _, 5, _, 7, _, 6, _, 5, _, 3, _],
    kick: [1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 0, 1, 1], snare: [0, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0], hat: [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1] },
];

export const MUSIC_MENU = 5;
export const MUSIC_BOSS = 6;
