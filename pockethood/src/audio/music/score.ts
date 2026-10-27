// The POCKETHOOD score — an original composition, written as data.
//
// One signature theme (8 bars in F major, a rising "do-re-mi-sol" hook and its answer) over a
// warm jazz-hop progression, arranged eight ways. Every arrangement shares the same key,
// chords, theme and transport, so the music can move between them at a bar line without
// restarting: only instruments, groove, tempo and layer levels change.
//
// Grid: 16 steps per bar (16th notes). Melody events are [step from the start of the 8-bar
// cycle, length in steps, MIDI note].

export type MoodId = 'town' | 'build' | 'cafe' | 'garden' | 'night' | 'celebration' | 'activity' | 'zen';
export type Instrument = 'piano' | 'ep' | 'vibes' | 'marimba' | 'guitar' | 'pad' | 'bass' | 'upright' | 'none';
export type Layer = 'lead' | 'chords' | 'bass' | 'drums' | 'counter' | 'pad';
export const LAYERS: Layer[] = ['lead', 'chords', 'bass', 'drums', 'counter', 'pad'];

export interface Chord {
  name: string;
  root: number; // bass note (MIDI)
  quality: 'maj' | 'min' | 'dom';
  /** Voicing for keys (rootless, mid register). */
  voicing: number[];
  /** Guide tones for counter-lines (3rd and 7th, upper register). */
  guide: [number, number];
}

// Fmaj9 | Dm9 | Gm9 | C13 || Bbmaj9 | Am7 | Gm9 | C7
export const PROGRESSION: Chord[] = [
  { name: 'Fmaj9', root: 41, quality: 'maj', voicing: [57, 60, 64, 67], guide: [69, 76] },
  { name: 'Dm9', root: 38, quality: 'min', voicing: [53, 57, 60, 64], guide: [65, 72] },
  { name: 'Gm9', root: 43, quality: 'min', voicing: [58, 62, 65, 69], guide: [70, 77] },
  { name: 'C13', root: 48, quality: 'dom', voicing: [58, 64, 69, 74], guide: [70, 76] },
  { name: 'Bbmaj9', root: 46, quality: 'maj', voicing: [57, 60, 62, 65], guide: [69, 74] },
  { name: 'Am7', root: 45, quality: 'min', voicing: [55, 60, 64, 69], guide: [67, 72] },
  { name: 'Gm9', root: 43, quality: 'min', voicing: [58, 62, 65, 69], guide: [70, 77] },
  { name: 'C7', root: 48, quality: 'dom', voicing: [58, 64, 67, 72], guide: [70, 76] },
];

/** The POCKETHOOD theme. Bars 1–4 state the hook; bars 5–8 answer it and come home. */
export const THEME: [number, number, number][] = [
  // 1 · Fmaj9 — the hook: F G A C, then a little turn
  [0, 2, 65], [2, 2, 67], [4, 2, 69], [6, 4, 72], [10, 2, 74], [12, 2, 72], [14, 2, 69],
  // 2 · Dm9
  [16, 6, 72], [22, 2, 69], [24, 4, 67],
  // 3 · Gm9 — the hook again, reaching up
  [32, 2, 65], [34, 2, 67], [36, 2, 69], [38, 4, 72], [42, 2, 74], [44, 2, 72], [46, 2, 74],
  // 4 · C13
  [48, 6, 76], [54, 2, 74], [56, 6, 72],
  // 5 · Bbmaj9 — the answer climbs higher
  [64, 2, 65], [66, 2, 67], [68, 2, 69], [70, 4, 72], [74, 2, 74], [76, 4, 77],
  // 6 · Am7
  [80, 4, 76], [84, 2, 72], [86, 6, 69],
  // 7 · Gm9
  [96, 2, 70], [98, 2, 69], [100, 2, 67], [102, 2, 69], [104, 4, 72], [108, 2, 70], [110, 2, 69],
  // 8 · C7 → home
  [112, 6, 67], [118, 2, 64], [120, 8, 65],
];

/** The hook alone (first four notes + landing), used by Zen Mode and the stingers. */
export const MOTIF: [number, number, number][] = [[0, 2, 65], [2, 2, 67], [4, 2, 69], [6, 6, 72]];

type Hits = Record<'kick' | 'snare' | 'rim' | 'hat' | 'openhat' | 'shaker' | 'clap' | 'brush' | 'ride', number[]>;
const h = (spec: Partial<Record<keyof Hits, Record<number, number>>>): Partial<Hits> =>
  Object.fromEntries(Object.entries(spec).map(([k, m]) => [k, Array.from({ length: 16 }, (_, i) => (m as Record<number, number>)[i] ?? 0)]));
const every = (n: number, v: number, off = 0, accent?: number) =>
  Object.fromEntries(Array.from({ length: 16 }, (_, i) => i).filter((i) => (i - off) % n === 0 && i >= off).map((i) => [i, accent && i % 4 === off ? accent : v]));

export const GROOVES = {
  lofi: h({ kick: { 0: 1, 7: 0.55, 10: 0.8 }, snare: { 4: 0.8, 12: 0.8 }, hat: { ...every(2, 0.32), 3: 0.12, 11: 0.12, 15: 0.14 } }),
  build: h({ kick: { 0: 1, 6: 0.6, 8: 0.9, 10: 0.5, 14: 0.45 }, snare: { 4: 0.85, 12: 0.85 }, hat: every(2, 0.34), shaker: every(1, 0.16) }),
  brush: h({ kick: { 0: 0.5, 8: 0.38 }, brush: { 4: 0.6, 12: 0.6 }, ride: { 0: 0.45, 4: 0.4, 6: 0.25, 8: 0.45, 12: 0.4, 14: 0.25 } }),
  garden: h({ kick: { 0: 0.75, 10: 0.5 }, rim: { 4: 0.55, 12: 0.55 }, shaker: { ...every(2, 0.22), ...every(4, 0.3, 2) } }),
  night: h({ kick: { 0: 0.6, 9: 0.38 }, rim: { 12: 0.4 }, hat: every(2, 0.18) }),
  party: h({ kick: { 0: 0.85, 4: 0.7, 8: 0.85, 12: 0.7, 15: 0.35 }, clap: { 4: 0.7, 12: 0.7 }, openhat: every(4, 0.3, 2), shaker: every(1, 0.17) }),
  bounce: h({ kick: { 0: 0.9, 7: 0.5, 8: 0.8, 10: 0.45 }, snare: { 4: 0.75, 12: 0.75 }, hat: every(1, 0.2, 0, 0.3) }),
  breakdown: h({ rim: { 4: 0.35, 12: 0.35 }, hat: every(4, 0.16, 2) }),
  zen: h({ shaker: { 8: 0.06 } }),
  none: h({}),
} satisfies Record<string, Partial<Hits>>;
export type GrooveId = keyof typeof GROOVES;

/** Bass figures: [step, length, interval] where interval 'a' approaches the next bar's root. */
export const BASSLINES: Record<string, [number, number, number | 'a' | 't'][]> = {
  lofi: [[0, 6, 0], [7, 2, 7], [10, 3, 0], [14, 2, 'a']],
  walk: [[0, 4, 0], [4, 4, 't'], [8, 4, 7], [12, 4, 'a']],
  bounce: [[0, 2, 0], [3, 1, 0], [4, 2, 12], [6, 2, 7], [8, 2, 0], [11, 1, 0], [12, 2, 10], [14, 2, 'a']],
  pulse: [[0, 2, 0], [2, 2, 0], [4, 2, 12], [6, 2, 0], [8, 2, 0], [10, 2, 7], [12, 2, 12], [14, 2, 'a']],
  soft: [[0, 8, 0], [8, 6, 7], [14, 2, 'a']],
  drone: [[0, 16, 0]],
};

/** Chord comping: [step, length, velocity]; 'arp' plays the voicing as rising/falling 8ths. */
export const COMPS: Record<string, [number, number, number][] | 'arp'> = {
  hold: [[0, 10, 0.62], [10, 6, 0.42]],
  push: [[0, 3, 0.6], [6, 2, 0.48], [8, 3, 0.55], [14, 2, 0.44]],
  jazz: [[0, 3, 0.58], [6, 3, 0.48], [11, 4, 0.5]],
  long: [[0, 16, 0.5]],
  stabs: [[2, 1, 0.5], [4, 2, 0.62], [10, 1, 0.45], [12, 2, 0.62]],
  staccato: [[0, 2, 0.55], [4, 2, 0.5], [8, 2, 0.55], [12, 2, 0.5]],
  arp: 'arp',
};

/** How the theme is used across a 4-cycle form (each cycle = 8 bars). */
export type Section = 'theme' | 'groove' | 'lift' | 'breakdown' | 'motif';

export interface Arrangement {
  bpm: number;
  swing: number; // fraction of a 16th that odd 16ths are delayed by
  lead: Instrument;
  /** Optional doubling of the lead an octave up (brighter arrangements). */
  double?: Instrument;
  chords: Instrument;
  comp: keyof typeof COMPS;
  bass: Instrument;
  bassline: keyof typeof BASSLINES;
  counter: Instrument;
  pad: boolean;
  groove: GrooveId;
  form: [Section, Section, Section, Section];
  /** Target level per layer (0–1). */
  mix: Record<Layer, number>;
  /** Lo-fi tone: master low-pass cutoff (Hz). */
  tone: number;
  reverb: number;
  crackle: number;
}

export const ARRANGEMENTS: Record<MoodId, Arrangement> = {
  // General neighbourhood: warm piano theme, Rhodes chords, rounded lo-fi drums.
  town: {
    bpm: 92, swing: 0.14, lead: 'piano', chords: 'ep', comp: 'hold', bass: 'bass', bassline: 'lofi', counter: 'vibes', pad: false,
    groove: 'lofi', form: ['theme', 'groove', 'lift', 'breakdown'],
    mix: { lead: 0.8, chords: 0.62, bass: 0.75, drums: 0.7, counter: 0.5, pad: 0 }, tone: 7200, reverb: 0.22, crackle: 0.5,
  },
  // Construction: same song, busier percussion and a marimba lead.
  build: {
    bpm: 104, swing: 0.1, lead: 'marimba', double: 'vibes', chords: 'ep', comp: 'push', bass: 'bass', bassline: 'pulse', counter: 'piano', pad: false,
    groove: 'build', form: ['theme', 'groove', 'theme', 'groove'],
    mix: { lead: 0.78, chords: 0.58, bass: 0.78, drums: 0.8, counter: 0.42, pad: 0 }, tone: 8200, reverb: 0.16, crackle: 0.35,
  },
  // Inside the café: jazzy Rhodes lead, walking bass, brushes and ride.
  cafe: {
    bpm: 96, swing: 0.22, lead: 'ep', chords: 'ep', comp: 'jazz', bass: 'upright', bassline: 'walk', counter: 'vibes', pad: false,
    groove: 'brush', form: ['theme', 'groove', 'lift', 'groove'],
    mix: { lead: 0.78, chords: 0.5, bass: 0.8, drums: 0.62, counter: 0.45, pad: 0 }, tone: 6200, reverb: 0.26, crackle: 0.6,
  },
  // Gardening: plucked guitar, soft shaker and rim.
  garden: {
    bpm: 95, swing: 0.12, lead: 'guitar', double: 'marimba', chords: 'guitar', comp: 'arp', bass: 'bass', bassline: 'soft', counter: 'vibes', pad: true,
    groove: 'garden', form: ['theme', 'groove', 'theme', 'breakdown'],
    mix: { lead: 0.82, chords: 0.6, bass: 0.34, drums: 0.6, counter: 0.4, pad: 0.22 }, tone: 7600, reverb: 0.24, crackle: 0.3,
  },
  // Evening: mellow keys, a darker tone and more room.
  night: {
    bpm: 84, swing: 0.16, lead: 'ep', chords: 'ep', comp: 'long', bass: 'bass', bassline: 'soft', counter: 'vibes', pad: true,
    groove: 'night', form: ['theme', 'breakdown', 'groove', 'breakdown'],
    mix: { lead: 0.66, chords: 0.52, bass: 0.6, drums: 0.5, counter: 0.36, pad: 0.3 }, tone: 4300, reverb: 0.34, crackle: 0.55,
  },
  // Community celebrations: brighter rhythm, claps, doubled lead, extra layers.
  celebration: {
    bpm: 112, swing: 0.06, lead: 'piano', double: 'vibes', chords: 'ep', comp: 'stabs', bass: 'bass', bassline: 'bounce', counter: 'marimba', pad: true,
    groove: 'party', form: ['theme', 'lift', 'theme', 'groove'],
    mix: { lead: 0.82, chords: 0.6, bass: 0.82, drums: 0.82, counter: 0.5, pad: 0.24 }, tone: 9800, reverb: 0.18, crackle: 0.2,
  },
  // Shops and mini-games: bouncy marimba, staccato piano.
  activity: {
    bpm: 108, swing: 0.08, lead: 'marimba', chords: 'piano', comp: 'staccato', bass: 'bass', bassline: 'bounce', counter: 'vibes', pad: false,
    groove: 'bounce', form: ['theme', 'groove', 'theme', 'groove'],
    mix: { lead: 0.8, chords: 0.5, bass: 0.78, drums: 0.74, counter: 0.42, pad: 0 }, tone: 8800, reverb: 0.15, crackle: 0.25,
  },
  // Zen Mode: the hook alone on vibraphone, pads, a soft drone. No drums.
  zen: {
    bpm: 72, swing: 0, lead: 'vibes', chords: 'ep', comp: 'long', bass: 'bass', bassline: 'drone', counter: 'none', pad: true,
    groove: 'zen', form: ['motif', 'motif', 'motif', 'motif'],
    mix: { lead: 0.55, chords: 0.36, bass: 0.32, drums: 0.3, counter: 0, pad: 0.42 }, tone: 3400, reverb: 0.42, crackle: 0.25,
  },
};

export const midiHz = (m: number) => 440 * Math.pow(2, (m - 69) / 12);

/** Stingers, in the same key: short melodic flourishes for milestones. */
export const STINGERS = {
  quest: { notes: [[0, 1, 77], [1, 1, 81], [2, 3, 84]] as [number, number, number][], inst: 'vibes' as Instrument },
  build: { notes: [[0, 1, 72], [1, 2, 77]] as [number, number, number][], inst: 'marimba' as Instrument },
  level: { notes: [[0, 1, 65], [1, 1, 69], [2, 1, 72], [3, 1, 77], [4, 1, 81], [5, 4, 84]] as [number, number, number][], inst: 'piano' as Instrument },
  unlock: { notes: [[0, 1, 72], [1, 1, 74], [2, 1, 77], [3, 1, 79], [4, 1, 81], [5, 3, 84]] as [number, number, number][], inst: 'marimba' as Instrument },
};
export type StingerId = keyof typeof STINGERS;
