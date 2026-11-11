#!/usr/bin/env python3
"""THE REPLACEMENT — original score.  python3 audio/score.py → audio/out/music.wav (+ review material).

The score is written as data (notes in beats / seconds relative to anchors that are read from
build/timeline.json) and rendered through audio/synth.py.  The film is rendered in SEGMENTS separated by
the hard cuts of the cue sheet (end of a1_13, a5_04 'noresult', end of a7_06, start of a7_lunch, end of
a7_13, end of film): each segment has its own reverb buses, and everything — including reverb tails — is
cut (20 ms fade) at the segment end.  That makes the silences in the cue sheet truly silent.
"""
import json
import math
import subprocess
import sys
import time
from pathlib import Path

import numpy as np

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
import synth as S  # noqa: E402

SR = S.SR
TAU = 2 * np.pi
T0 = time.time()

# ─────────────────────────────── timeline ───────────────────────────────
subprocess.run(['node', str(ROOT / 'tools/export-timeline.mjs')], cwd=ROOT, check=False,
               stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL)
TL = json.loads((ROOT / 'build/timeline.json').read_text())
DUR = float(TL['duration'])
NTOT = int(round(DUR * SR))
SH = {s['id']: s for s in TL['shots']}
CU = {c['id']: c for c in TL['cues']}


def st(i): return float(SH[i]['start'])
def en(i): return float(SH[i]['end'])
def ev(i, e): return float(SH[i]['events'][e]['t'])
def c0(i): return float(CU[i]['t0'])
def c1(i): return float(CU[i]['t1'])


R = np.random.default_rng(20261111)
_seed = [0]


def seed():
    _seed[0] += 1
    return _seed[0]


def M(p):
    """note name or midi number → midi number (float)"""
    return float(S.note_midi(p)) if isinstance(p, str) else float(p)


# ─────────────────────────────── event store ───────────────────────────────
EVENTS = []   # (t, bus, stereo array)
CUE_TABLE = []


def cue(name, t0, t1, instr):
    CUE_TABLE.append((name, float(t0), float(t1), instr))


def add(t, bus, y, g=0.0, p=0.0):
    y = np.asarray(y, dtype=np.float64)
    y = S.pan(y, p) if y.ndim == 1 else y
    EVENTS.append((float(t), bus, y * S.db(g)))


def hum(t, a=0.010):
    return t + float(np.clip(R.normal(0, a), -2.5 * a, 2.5 * a))


def hv(v, a=0.06):
    return float(np.clip(v * (1 + R.normal(0, a)), 0.02, 1.0))


# instruments (humanised) -------------------------------------------------
def P(t, p, dur=None, vel=0.35, g=0.0, felt=0.8, bus='pno', jit=0.010):
    m = M(p)
    y = S.piano(S.midi(m), dur, hv(vel), felt=felt, seed=seed())
    add(hum(t, jit), bus, y, g, S.piano_pan(S.midi(m)))


def CH(t, notes, dur=None, vel=0.3, g=0.0, roll=0.035, bus='pno'):
    for k, n in enumerate(notes):
        P(t + k * roll, n, None if dur is None else max(0.3, dur - k * roll), vel * (1 - 0.04 * k), g, bus=bus)


def MB(t, p, vel=0.3, g=0.0, bus='mbox', cents=0.0, dur=None, pan=None):
    m = M(p) + cents / 100.0
    y = S.music_box(S.midi(m), dur, hv(vel), bright=0.35, seed=seed())
    add(hum(t, 0.008), bus, y, g, (R.uniform(-0.3, 0.3) if pan is None else pan))


def GL(t, p, vel=0.25, g=0.0, dur=None, bright=0.35, shimmer=0.6, bus='glass', bend=None, width=0.8):
    m = M(p)
    y = S.glass(S.midi(m), dur, hv(vel, 0.04), bright=bright, shimmer=shimmer, width=width, seed=seed())
    if bend is not None:   # (start s, ramp s, cents)
        y = vari(y, *bend)
    add(hum(t, 0.006), bus, y, g)


def PAD(t, notes, dur, vel=0.3, g=-16.0, kind='warm', attack=2.0, release=3.0, cutoff=None, bus='pad', width=0.9):
    y = S.pad([S.midi(M(n)) for n in notes], dur, vel, kind=kind, attack=attack, release=release,
              cutoff=cutoff, width=width, seed=seed())
    add(t, bus, y, g)


def DRONE(t, p, dur, vel=0.35, g=-4.0, attack=3.0, release=3.0, dark=0.8, bus='low'):
    y = S.drone(S.midi(M(p)), dur, vel, dark=dark, attack=attack, release=release, breath=0.25, seed=seed())
    add(t, bus, y, g)


def env_ar(n, att, rel):
    e = np.ones(n)
    na, nr = min(n, S.n_of(att)), min(n, S.n_of(rel))
    if na: e[:na] = S._rise(na)
    if nr: e[-nr:] *= 1 - S._rise(nr)
    return e


def SUBT(t, f, dur, g=-14.0, att=2.0, rel=2.0, lfo=0.0, depth=0.0, bus='low'):
    """sustained sub sine (with optional slow pulse)"""
    n = S.n_of(dur)
    tt = np.arange(n) / SR
    y = np.sin(TAU * f * tt) + 0.12 * np.sin(2 * TAU * f * tt + 0.3)
    if lfo:
        y *= (1 - depth) + depth * (0.5 - 0.5 * np.cos(TAU * lfo * tt)) ** 2
    y = S.lowpass(y * env_ar(n, att, rel), 140.0, 2)
    add(t, bus, y, g)


def SINE(t, f0, dur, g=-50.0, att=2.0, rel=2.0, f1=None, bus='air'):
    n = S.n_of(dur)
    f = np.full(n, f0) if f1 is None else f0 * (f1 / f0) ** (np.arange(n) / n)
    y = np.sin(TAU * np.cumsum(f) / SR) * env_ar(n, att, rel)
    add(t, bus, S.lowpass(y, 5000.0, 2), g)


def HIT(t, vel=0.5, g=-6.0, freq=36.7, drop=1.6, thump=0.35, dur=2.5):
    add(t, 'low', S.sub_hit(dur, freq, drop, vel, thump, seed=seed()), g)


def TICK(t, vel=0.35, tock=False, g=-8.0):
    add(hum(t, 0.003), 'tick', S.tick(hv(vel), 0.84 if tock else 1.0, seed=seed()), g, 0.15)


def PL(t, p, vel=0.35, dur=0.6, damp=0.7, g=0.0, bus='pl', pan=0.0):
    add(hum(t, 0.006), bus, S.pluck(S.midi(M(p)), dur, hv(vel), damp, seed=seed()), g, pan)


def vari(y, t_start, ramp, cents_amt):
    """varispeed pitch bend of a (N,2) signal: 0 → cents_amt over [t_start, t_start+ramp]"""
    n = len(y)
    tt = np.arange(n) / SR
    ratio = 2.0 ** (cents_amt * np.clip((tt - t_start) / ramp, 0, 1) / 1200.0)
    pos = np.cumsum(ratio) - ratio[0]
    pos = pos[pos < n - 1]
    return np.stack([np.interp(pos, np.arange(n), y[:, c]) for c in range(y.shape[1])], axis=1)


# ─────────────────────────────── Maya's theme ───────────────────────────────
# melody (midi, beat, beats) — 8 bars of 3/4
MEL = [(66, 0, 1), (69, 1, 1), (74, 2, 1), (73, 3, 2), (71, 5, 1), (69, 6, 1), (66, 7, 1), (67, 8, 1), (64, 9, 3),
       (66, 12, 1), (69, 13, 1), (74, 14, 1), (76, 15, 2), (74, 17, 1), (71, 18, 1), (67, 19, 1), (69, 20, 1),
       (62, 21, 3)]
HAR = [(0, 3, 'D'), (3, 3, 'A/C#'), (6, 2, 'Bm'), (8, 1, 'G'), (9, 3, 'A'), (12, 3, 'D'), (15, 2, 'F#m'),
       (17, 1, 'Bm'), (18, 2, 'G'), (20, 1, 'A'), (21, 3, 'D')]
CHORD = {'D': [38, 45, 54], 'A/C#': [37, 45, 52], 'Bm': [35, 42, 50], 'G': [43, 50, 59], 'A': [33, 40, 49],
         'F#m': [42, 49, 57], 'Em': [40, 47, 55], 'Gmaj7': [43, 50, 54]}
DSCALE = [2, 4, 6, 7, 9, 11, 13]   # D major pitch classes (13 = C# above)


def dshift(m, k):
    """move a D-major diatonic midi note by k scale degrees (k=-2: D major → B minor colouring)"""
    m = int(round(m))
    pcs = [p % 12 for p in DSCALE]
    octv, pc = divmod(m - 2, 12)
    idx = [((p - 2) % 12) for p in pcs].index(pc)
    j = idx + k
    o2, j2 = divmod(j, 7)
    return 2 + 12 * (octv + o2) + ((pcs[j2] - 2) % 12)


def theme(anchors, beats=(0, 24), mel='pno', mel_vel=0.38, mel_g=0.0, lh=True, lh_vel=0.22, lh_g=0.0,
          octv=0, shift=0, harm=None, pad=None, mbox=None, vcurve=None, rub=0.018, lh_oct=0, tmax=1e9):
    """Play (part of) Maya's theme.  anchors: [(beat, time), ...] — beat→time by piecewise-linear interpolation
    (extrapolated with the outer slopes).  pad: dict(g, vel, kind, oct) → string pad per chord.
    mbox: gain dB of a music-box doubling an octave up.  vcurve(t) → velocity multiplier (swells)."""
    ab = np.array([a[0] for a in anchors], float)
    at = np.array([a[1] for a in anchors], float)

    def bt(b):
        if len(ab) == 1:
            return at[0] + (b - ab[0]) * 0.5
        if b < ab[0]:
            return at[0] + (b - ab[0]) * (at[1] - at[0]) / (ab[1] - ab[0])
        if b > ab[-1]:
            return at[-1] + (b - ab[-1]) * (at[-1] - at[-2]) / (ab[-1] - ab[-2])
        return float(np.interp(b, ab, at))

    vc = vcurve or (lambda t: 1.0)
    b0, b1 = beats
    for (m, b, d) in MEL:
        if not (b0 <= b < b1):
            continue
        mm = (dshift(m, shift) if shift else m) + 12 * octv
        t = bt(b) + R.normal(0, rub)
        if t > tmax: continue
        dur = max(0.25, bt(b + d) - bt(b)) * 1.15
        # phrase shape: a little more weight on the long notes and the tops
        v = mel_vel * (1.06 if d > 1 else 1.0) * vc(t)
        if mel == 'pno':
            P(t, mm, dur if b != 21 and b != 9 else None, v, mel_g, jit=0)
        elif mel == 'mbox':
            MB(t, mm + 12, v, mel_g)
        if mbox is not None:
            MB(t + 0.01, mm + 12, 0.28 * vc(t), mbox)
    for i, (b, d, name) in enumerate(HAR):
        if not (b0 <= b < b1):
            continue
        name = (harm or {}).get(i, name)
        tones = CHORD[name]
        if shift:
            tones = [dshift(x, shift) for x in tones]
            if tones[0] < 33: tones = [x + 12 for x in tones]
            if tones[0] > 45: tones = [tones[0] - 12] + tones[1:]
        tones = [x + 12 * lh_oct for x in tones]
        tend = bt(b + d)
        if lh:
            seq = [[tones[0]], [tones[1]], [tones[2]]] if d == 3 else ([[tones[0]], [tones[1], tones[2]]] if d == 2
                                                                       else [[tones[0], tones[2]]])
            for k, grp in enumerate(seq):
                tb = bt(b + k) + R.normal(0, rub) + 0.02
                if tb > tmax: continue
                for j, x in enumerate(grp):
                    P(tb + 0.03 * j, x, max(0.4, tend - tb + 0.5), lh_vel * (0.9 if k else 1.0) * vc(tb), lh_g, jit=0)
        if pad:
            tp = bt(b)
            po = pad.get('oct', 12)
            notes = [tones[0] + po - 12 if pad.get('bass', False) else tones[1] + po - 12] + [x + po for x in tones[1:]]
            PAD(tp - 0.15, notes, max(0.6, tend - tp + 0.25), pad.get('vel', 0.3) * vc(tp), pad.get('g', -18),
                kind=pad.get('kind', 'warm'), attack=min(1.5, 0.5 * (tend - tp) + 0.3),
                release=pad.get('rel', 1.8), cutoff=pad.get('cutoff'))
    return bt


# tempo maps for the theme: slow and tender (~1.8-2.0 s per bar), gentle rubato, ritardando into bars 4 and 8
BAR_W = {1: 1.0, 2: 0.98, 3: 1.01, 4: 1.07, 5: 0.98, 6: 0.99, 7: 1.02, 8: 1.09}   # bar-level rubato
BEAT_RIT = (0.95, 1.0, 1.09)                                                    # inside bars 3 and 7


def tmap(keys):
    """keys: [(beat, time), ...] fixed points → per-beat anchors; the time between two fixed points is shared
    out by bar weight × beat weight (so the rubato and the ritardandi are shaped, the fixed points exact)."""
    def w(b):
        bar, k = b // 3 + 1, b % 3
        return BAR_W.get(bar, 1.0) * (BEAT_RIT[k] if bar in (3, 7) else 1.0)
    out = []
    for (b0, t0), (b1, t1) in zip(keys[:-1], keys[1:]):
        ws = np.array([w(b) for b in range(b0, b1)])
        cs = np.concatenate([[0.0], np.cumsum(ws)]) / ws.sum()
        out += [(b0 + i, t0 + (t1 - t0) * c) for i, c in enumerate(cs) if not (out and i == 0)]
    return out


BAR_TABLE = []


def bars_of(name, anchors, last_ring=None):
    """record the bar starts / durations of a statement for the review table"""
    d = dict(anchors)
    bs = sorted(b for b in d if b % 3 == 0 and b < 24)
    for b in bs:
        dur = d[b + 3] - d[b] if (b + 3) in d else last_ring
        BAR_TABLE.append((name, b // 3 + 1, d[b], dur))


# ═══════════════════════════════ THE SCORE ═══════════════════════════════
# ── ACT 1 ────────────────────────────────────────────────────────────────
t_door = ev('a1_09_auditorium', 'door')
t_run = ev('a1_08_car', 'run')
DRONE(st('a1_02_wake') + 0.4, 'B1', t_door + 0.25 - st('a1_02_wake') - 0.4, vel=0.32, g=-6, attack=3.0, release=0.25)
ticks = list(np.arange(st('a1_02_wake'), t_run - 0.05, 1.0)) + list(np.arange(t_run, t_door - 0.05, 0.5))
for k, t in enumerate(ticks):
    TICK(t, 0.30 + 0.05 * (t >= t_run), tock=bool(k % 2))
cue('a1_01-08 drone+tick', st('a1_02_wake'), t_door, 'drone B1, clock tick 60→120')

# a1_05 music box: first phrase, hanging on the E as Adam finishes
tE = c1('a1_try') - 0.25
theme([(0, c0('a1_ask') + 0.1), (9, tE)], beats=(0, 10), mel='mbox', mel_vel=0.26, mel_g=-2, lh=False, rub=0.02)
cue('a1_05 music box phrase', c0('a1_ask'), tE + 3, 'music box')

# a1_06-08 occasional low piano notes, B minor
for t, n, v in [(st('a1_06_bill') + 0.5, 'B1', 0.28), (st('a1_07_boss') + 0.4, 'G1', 0.28),
                (c1('a1_boss') + 0.3, 'F#1', 0.30), (ev('a1_08_car', 'sputter') + 0.2, 'B1', 0.32),
                (ev('a1_08_car', 'reminder') + 0.4, 'C2', 0.30)]:
    P(t, n, 3.5, v, -1)
cue('a1_06-08 low piano', st('a1_06_bill'), t_door, 'felt piano (low)')
P(t_door + 1.0, 'B1', None, 0.34)
cue('a1_09 B1', t_door, en('a1_09_auditorium'), 'felt piano')

# a1_10 the wound
ta = c1('a1_said') + 0.15
for k, (n, dt) in enumerate([('F#4', 0.0), ('A4', 1.1), ('D5', 2.55)]):
    P(ta + dt, n, 2.6, 0.22 - 0.02 * k, 0)
tb = c1('a1_always') + 0.2
for k, (n, dt) in enumerate([('F#3', 0.0), ('A3', 0.6), ('D4', 1.3)]):
    P(tb + dt, n, 1.5 if k < 2 else 1.0, 0.24 - 0.02 * k, 0)
cue('a1_10 F#-A-D', ta, en('a1_10_outside'), 'solo felt piano')

# a1_11-13 the Program arrives
t_buzz = ev('a1_11_night', 'buzz')
t_cut1 = en('a1_13_react')
SUBT(t_buzz, S.note('D1'), t_cut1 - t_buzz + 0.1, g=-16, att=3.0, rel=0.05)
for dt, n in [(0.35, 'D5'), (1.45, 'A5'), (2.55, 'E6')]:
    GL(t_buzz + dt, n, 0.16)
grow = [('header', 'D5', 0.20), ('line1', 'A5', 0.22), ('line2', 'E6', 0.24), ('button', 'A4', 0.27)]
for e, n, v in grow:
    GL(ev('a1_12_notify', e), n, v)
GL(ev('a1_12_notify', 'button') + 0.02, 'D5', 0.22)
PAD(ev('a1_12_notify', 'header'), ['D4', 'A4', 'E5'], t_cut1 - ev('a1_12_notify', 'header'), 0.22, -24,
    kind='air', attack=5.0, release=0.1)
t_small = ev('a1_12_notify', 'small')
HIT(t_small, 0.45, -8, freq=34.0, drop=1.5, thump=0.15, dur=3.5)
GL(t_small + 0.05, 'E6', 0.30, bend=(0.6, 2.4, 35.0))
GL(t_small + 0.05, 'A5', 0.18)
cue('a1_11-13 Program motif', t_buzz, t_cut1, 'glass D5-A5-E6, air pad, sub D1, sub-drop, sour bend')

# title
t_on = ev('title_main', 'on')
HIT(t_on, 0.42, -7, freq=36.7, drop=1.4, thump=0.25, dur=3.0)
PAD(t_on, ['D3', 'A3', 'D4', 'A4'], en('title_main') - t_on - 1.5, 0.30, -19, kind='air', attack=1.2, release=1.8)
GL(ev('title_main', 'split'), 'D6', 0.22, bright=0.45)
cue('title_main', t_on, en('title_main'), 'sub impact, air pad D-A, glass ping')

# ── ACT 2 ────────────────────────────────────────────────────────────────
a = st('a2_01_gate')
DRONE(a, 'B1', en('a2_01_gate') - a + 1.0, vel=0.22, g=-8, attack=2.0, release=1.5)
bt_ = 0.75
for k, n in enumerate(['B2', 'D3', None, 'F#3', 'C#3', None, 'B2', 'G2', None]):
    if n:
        PL(a + 0.9 + k * bt_ + 0.375, n, 0.30, 0.5, 0.75, -2, pan=0.25 * math.sin(k))
cue('a2_01 unease', a, en('a2_01_gate'), 'muted plucks off-beat, faint drone')

a = st('a2_02_glass')
SUBT(a, S.note('D1'), en('a2_02_glass') - a + 0.8, g=-17, att=2.0, rel=1.5)
PAD(a + 0.1, ['D4', 'A4', 'E5', 'A5'], en('a2_02_glass') - a - 0.6, 0.30, -20, kind='air', attack=2.5, release=1.6, width=1.0)
for dt, n in [(0.3, 'D5'), (1.4, 'A5'), (2.5, 'E6'), (4.6, 'D5'), (5.6, 'A5')]:
    GL(a + dt, n, 0.20, width=1.0)
GL(ev('a2_02_glass', 'glance'), 'A6', 0.17, bright=0.5)
cue('a2_02 Program shimmer', a, en('a2_02_glass'), 'air pad D-A-E, glass, sub, high ping')

# a2_03-04 ostinato
t_open = ev('a2_05_door', 'open')
a = st('a2_03_reverse')
e8 = 60.0 / 108 / 2
prog = [('B1', 'F#2'), ('G1', 'D2'), ('A1', 'E2'), ('F#1', 'C#2')]
k = 0
while True:
    t = a + k * e8
    if t > t_open - 0.12:
        break
    bar = (k // 8) % 4
    r_, f_ = prog[bar]
    prog_ = (t - a) / (t_open - a)
    n = [r_, f_, M(r_) + 12, f_][k % 4]
    PL(t, n, 0.26 + 0.2 * prog_, min(0.45, t_open - t - 0.02), 0.6, -1, pan=-0.2)
    if t > st('a2_04_run') - 1e-6:
        PL(t + 0.004, M(f_) + 12 if k % 2 else M(r_) + 24, 0.18 + 0.15 * prog_, min(0.35, t_open - t - 0.02), 0.7, -4, pan=0.3)
    if k % 2 == 0:
        SUBT(t, S.midi(M(r_)), min(0.34, t_open - t - 0.01), g=-15 + 5 * prog_, att=0.02, rel=0.25)
    k += 1
DRONE(a, 'B1', t_open - a + 0.05, vel=0.25, g=-9, attack=3.0, release=0.05)
cue('a2_03-04 ostinato', a, t_open, 'low plucks 8ths + sub pulse, B minor')

# a2_05-a2_10 the home (on the 'home' bus — muffled after the door closes)
t_close = ev('a2_10_shut', 'close')
t_who = c0('a2_who')
PAD(t_open + 0.05, ['D3', 'F#3', 'A3', 'D4'], t_who + 0.6 - t_open, 0.30, -17, attack=1.6, release=2.5, bus='home')
PAD(t_open + 0.05, ['A4', 'D5'], t_who - t_open, 0.20, -24, kind='air', attack=2.5, release=2.0, bus='home')
b = t_open + 1.3
for k, (n, dt) in enumerate([('F#4', 0), ('A4', .45), ('D5', .9), ('C#5', 1.35), ('B4', 2.25), ('A4', 2.7),
                              ('F#4', 3.15), ('G4', 3.6), ('E4', 4.05)]):
    MB(b + dt, M(n) + 12, 0.22, -2, bus='home')
b = st('a2_06_home') + 1.4
for n, dt in [('F#4', 0), ('A4', .45), ('D5', .9), ('E5', 1.35), ('D5', 2.25), ('B4', 2.7), ('G4', 3.15),
              ('A4', 3.6), ('D4', 4.05)]:
    MB(b + dt, M(n) + 12, 0.2, -3, bus='home')
for n, t in [('A5', ev('a2_06_home', 'look') + 0.1), ('F#5', c1('a2_early') + 0.4)]:
    MB(t, M(n) + 12, 0.14, -4, bus='home')
cue('a2_05-06 home', t_open, en('a2_06_home'), 'warm pad D, music box ornaments')
# a2_07 sours — minor sixth / cluster creeping in, then thin and held
PAD(t_who, ['D3', 'A3', 'Bb3', 'C#4'], en('a2_07_who') - t_who + 0.5, 0.24, -19, attack=2.5, release=2.5, bus='home')
PAD(en('a2_07_who') - 0.5, ['A3', 'D4'], t_close + 4.5 - en('a2_07_who'), 0.22, -20, attack=2.5, release=3.5, bus='home')
cue('a2_07 sours', t_who, en('a2_07_who'), 'pad + minor-6th cluster')
ti = c0('a2_iam')
SUBT(ti - 0.3, S.note('D1'), en('a2_09_iam') - ti + 0.8, g=-17, att=1.5, rel=2.0)
for dt, n in [(0.1, 'D5'), (1.0, 'A5'), (1.9, 'E6')]:
    GL(ti + dt, n, 0.20)
PAD(ti, ['D4', 'A4', 'E5'], en('a2_09_iam') - ti - 1.0, 0.22, -23, kind='air', attack=2.0, release=2.0)
GL(ev('a2_09_iam', 'glint'), 'A6', 0.16, bright=0.5)
cue('a2_08-09 thin / Program calm', st('a2_08_wife'), en('a2_09_iam'), 'thin pad, glass motif, sub, ping')
# behind the door
for t, n in [(t_close + 0.9, 'F#5'), (t_close + 2.3, 'A5'), (t_close + 3.4, 'D6')]:
    MB(t, n, 0.18, -2, bus='home')
DRONE(t_close, 'B1', ev('a3_02_scan', 'stamp') - t_close, vel=0.34, g=-5, attack=1.0, release=0.04, dark=0.85)
P(ev('a2_10_shut', 'lock'), 'B1', None, 0.32)
cue('a2_10 muffled + drone', t_close, en('a2_10_shut'), 'home bus LP 450 Hz -11 dB, drone B1, piano B1')

# ── ACT 3 ────────────────────────────────────────────────────────────────
t_stamp = ev('a3_02_scan', 'stamp')
SUBT(st('a3_01_police'), S.note('B1'), t_stamp - st('a3_01_police'), g=-13, att=2.0, rel=0.04, lfo=0.55, depth=0.85)
HIT(t_stamp, 0.75, -4, freq=38.0, drop=2.0, thump=0.6, dur=2.8)
cue('a3_01-02 dark drone/pulse', st('a3_01_police'), t_stamp, 'drone B1, pulsing sub, sub_hit')
a = st('a3_03_gov')
for f in [S.note('E6'), S.note('F#6'), S.note('G6') * S.cents(8)]:
    SINE(a + 0.5, f, en('a3_04_class') - a - 0.2, g=-62, att=4.0, rel=2.0)
k = 0
while a + 1.0 + k < en('a3_04_class') - 0.3:
    TICK(a + 1.0 + k, 0.22, tock=bool(k % 2), g=-11)
    k += 1
HIT(ev('a3_04_class', 'stamp'), 0.55, -7, freq=40.0, drop=1.8, thump=0.45)
cue('a3_03-04 sterile cluster + tick', a, en('a3_04_class'), 'high sine cluster, clock tick, low hit')
a = st('a3_05_bench')
chords = [(a + 0.6, ['B1', 'F#2', 'D3', 'F#3']), (a + 4.6, ['G1', 'D2', 'B2', 'D3']),
          (st('a3_06_frozen') + 2.6, ['E2', 'B2', 'G3']), (st('a3_07_call') + 0.6, ['F#1', 'C#2', 'A2', 'C#3'])]
for i, (t, ch) in enumerate(chords):
    nxt = chords[i + 1][0] if i + 1 < len(chords) else st('a3_08_video') - 0.5
    CH(t, ch, nxt - t + 0.6, 0.27, -1, roll=0.06)
cue('a3_05-07 minor chords', a, st('a3_08_video'), 'felt piano Bm-G-Em-F#m')

# a3_08-09 phone jingle (source)


def jingle():
    q = 60.0 / 132
    e = q / 2
    mel = ['G5', 'D5', 'B4', 'D5', 'G5', 'A5', 'B5', 'A5', 'G5', 'E5', 'C5', 'E5', 'G5', 'F#5', 'E5', 'D5',
           'B4', 'D5', 'G5', 'D5', 'C5', 'E5', 'A5', 'E5', 'D5', 'F#5', 'A5', 'F#5', 'D5', 'C5', 'B4', 'A4']
    bass = ['G2', 'D3', 'G2', 'D3', 'C3', 'G2', 'C3', 'G2', 'G2', 'D3', 'C3', 'G2', 'D3', 'A2', 'D3', 'A2']
    parts = []
    for i, n in enumerate(mel):
        parts.append((S.music_box(S.note(n), 0.5, 0.45 if i % 2 == 0 else 0.35, bright=0.6, seed=i), i * e + (0.012 if i % 2 else 0)))
    for i, n in enumerate(bass):
        parts.append((S.pluck(S.note(n), 0.35, 0.5, 0.6, seed=i) * 0.8, i * q))
    tend = len(mel) * e
    for j, n in enumerate(['G5', 'B5', 'D6']):
        parts.append((S.music_box(S.note(n), None, 0.5, bright=0.6, seed=50 + j), tend + 0.03 * j))
    parts.append((S.pluck(S.note('G2'), 1.4, 0.55, 0.4, seed=99), tend))
    y = S.fit(S.layer(*parts), S.n_of(9.0))
    y = S.speaker(y, 4.0)
    return y * S.fade_out(np.ones(len(y)), 0.4)


JG = jingle()
JG /= np.max(np.abs(JG))
starts = [(st('a3_08_video'), -21, 5000), (st('a3_09_watch'), -25, 2600), (ev('a3_09_watch', 'loop2'), -29, 1500),
          (ev('a3_09_watch', 'loop3'), -33, 900)]
for i, (t, g, lp) in enumerate(starts):
    stop = starts[i + 1][0] if i + 1 < len(starts) else en('a3_09_watch')
    y = S.lowpass(JG, lp, 2)[:S.n_of(stop - t)].copy()
    k = S.n_of(0.04 if i + 1 < len(starts) else 1.2)
    y[-k:] *= 1 - S._rise(k)
    add(t, 'phone', y, g)
cue('a3_08 phone jingle (source)', st('a3_08_video'), en('a3_08_video'), 'music box + plucks via phone speaker')

# a3_09 the real score rises: theme (bars 3-8) in B minor, peak at 'tear'
t_tear, t_lower = ev('a3_09_watch', 'tear'), ev('a3_09_watch', 'lower')


def swell(t):
    if t < t_tear:
        return 0.55 + 0.45 * np.clip((t - st('a3_09_watch')) / (t_tear - st('a3_09_watch')), 0, 1) ** 1.5
    return max(0.35, 1.0 - 0.6 * np.clip((t - t_lower) / 1.6, 0, 1))


# bars 5-8 only (a complete phrase, not rushed): bar 6's top note on 'tear', bar 8 into a3_10
A3 = tmap([(12, t_tear - 1.8), (15, t_tear), (21, t_lower + 2.0)])
bars_of('a3_09 minor (bars 5-8)', A3)
theme(A3, beats=(12, 24), mel_vel=0.47, lh_vel=0.26,
      shift=-2, pad=dict(g=-13, vel=0.38, kind='warm', oct=12), vcurve=swell, rub=0.03)
PAD(st('a3_09_watch') + 0.2, ['B1', 'F#2'], t_tear - st('a3_09_watch') + 1.5, 0.30, -17, attack=4.5, release=3.0)
cue('a3_09 theme in minor', st('a3_09_watch'), en('a3_09_watch'), 'piano theme (B minor) + string pad, jingle loops')
P(ev('a3_10_dark', 'off'), 'B1', None, 0.30)
cue('a3_10 last note', st('a3_10_dark'), en('a3_10_dark'), 'piano B1, fade')

# ── ACT 4 ────────────────────────────────────────────────────────────────
a = st('a4_01_dawn')
PAD(a + 0.2, ['D2', 'A2', 'E3', 'A3'], en('a4_01_dawn') - a + 0.3, 0.26, -18, attack=3.5, release=2.0, cutoff=(300, 700))
for dt, n in [(0.2, 'D5'), (1.3, 'A5'), (2.4, 'E6')]:
    GL(ev('a4_01_dawn', 'car') + dt, n, 0.17, bus='far')
cue('a4_01 dawn', a, en('a4_01_dawn'), 'cold pad open fifths, distant glass motif')
a = st('a4_02_offer')
PAD(a - 0.3, ['D4', 'A4', 'E5'], en('a4_02_offer') - a, 0.24, -22, kind='air', attack=2.0, release=2.5)
PAD(a - 0.3, ['D2', 'A2'], en('a4_02_offer') - a, 0.24, -20, attack=2.0, release=2.5, cutoff=(200, 400))
for e, n in [('card1', 'A5'), ('card2', 'D6'), ('card3', 'E6')]:
    GL(ev('a4_02_offer', e), n, 0.16, bright=0.4)
tc = ev('a4_02_offer', 'contract')
GL(tc, 'D3', 0.30, bright=0.2)
DRONE(tc, 'D2', en('a4_02_offer') - tc + 1.5, vel=0.28, g=-9, attack=0.8, release=2.0, dark=0.9)
cue('a4_02 Program offer', a, en('a4_02_offer'), 'air pad D-A-E, glass pings, dark low tone')
a = st('a4_03_know')
SINE(a - 0.3, S.note('A5'), c1('a4_better') - a + 0.6, g=-46, att=2.0, rel=1.4)
P(c1('a4_better') + 0.4, 'B1', None, 0.32)
cue('a4_03 held high note', a, en('a4_03_know'), 'high sine A5, piano B1')
t = ev('a4_04_sign', 'sign')
while t < ev('a4_04_sign', 'signEnd') + 0.05:
    HIT(t, 0.36, -3, freq=44.0, drop=1.3, thump=0.25, dur=0.9)
    HIT(t + 0.27, 0.22, -6, freq=44.0, drop=1.2, thump=0.15, dur=0.7)
    t += 1.2
P(ev('a4_04_sign', 'drop'), 'A6', 1.5, 0.16)
cue('a4_04 heartbeat', ev('a4_04_sign', 'sign'), en('a4_04_sign'), 'sub pulse 50 bpm, tiny piano A6')
tl = c0('a4_last') + 0.5
for k, (n, dt) in enumerate([('F#3', 0.0), ('A3', 0.9), ('D4', 2.2)]):
    P(tl + dt, n, 3.0, 0.22 + 0.01 * k)
td = ev('a4_05_last', 'nod')
CH(td, ['D2', 'A2', 'F#3', 'A3'], 6.0, 0.22, -1, roll=0.07)
PAD(td - 0.5, ['D3', 'A3', 'F#4'], st('a5_01_arrive') + 1.2 - td, 0.24, -19, attack=3.0, release=3.5)
cue('a4_05 F#-A-D + D chord', tl, en('a4_05_last'), 'piano, warm pad D across dissolve')

# ── ACT 5 ────────────────────────────────────────────────────────────────
to = ev('a5_01_arrive', 'open')
CH(to, ['D2', 'A2', 'D3', 'F#3'], 4.0, 0.20, -4, roll=0.05)
PAD(to, ['D2', 'A2', 'F#3'], 2.0, 0.22, -20, attack=0.8, release=2.5, cutoff=(250, 600))
cue('a5_01 warm chord', to, en('a5_01_arrive'), 'piano + low pad D')
a = st('a5_02_table')
PAD(a + 0.2, ['B2', 'D3', 'F#3', 'C#4'], en('a5_02_table') - a, 0.22, -22, attack=2.5, release=1.5)
k = 0
while a + 0.5 + k < en('a5_02_table'):
    TICK(a + 0.5 + k, 0.18, tock=bool(k % 2), g=-13)
    k += 1
cue('a5_02 Bm add9 + tick', a, en('a5_02_table'), 'soft pad, faint tick')
P(ev('a5_03_lunchbox', 'place'), 'B1', None, 0.30)
cue('a5_03 low note', st('a5_03_lunchbox'), en('a5_03_lunchbox'), 'piano B1')
# a5_04 data music — sixteenths
td, tde, tq, tn = (ev('a5_04_scan', e) for e in ('data', 'dataEnd', 'query', 'noresult'))
s16 = 0.105
pat = ['D5', 'A5', 'E6', 'A5', 'D6', 'A5', 'E6', 'F#6']
k = 0
t = td
while t < tn - 0.02:
    if t < tde:
        x = (t - td) / (tde - td)
        n = pat[k % 8] if (x > 0.35 or k % 8 < 4) else pat[k % 4]
        GL(t, n, 0.08 + 0.12 * x, dur=0.09, bright=0.25, shimmer=0.3, bus='data')
        if x > 0.6 and k % 4 == 0:
            GL(t, 'D4', 0.10 + 0.1 * x, dur=0.2, bright=0.2, bus='data')
    elif t >= tq:
        if k % 2 == 0:
            GL(t, 'E6', 0.14, dur=0.09, bright=0.25, shimmer=0.3, bus='data')
    else:
        if k % 2 == 0:
            GL(t, pat[k % 8], 0.15, dur=0.09, bright=0.25, shimmer=0.3, bus='data')
    k += 1
    t = td + k * s16
cue('a5_04 data arpeggio', td, tn, 'glass sixteenths, stops dead')
# a5_05 the whole theme, first time
tu = ev('a5_05_note', 'unfold')
A5 = tmap([(0, tu), (24, en('a5_06_noanswer'))])
bars_of('a5_05-06 first statement', A5)
bt5 = theme(A5, beats=(0, 21), mel_vel=0.31, lh_vel=0.16, rub=0.02)
# bar 8: the D chord, rings softly into a5_07, damped well before the end of 'a5_letdown'
t8 = bt5(21)
t_damp5 = c1('a5_letdown') - 2.6
P(t8, 'D4', t_damp5 - t8, 0.31 * 1.06, jit=0)
for k, n in enumerate(['D2', 'A2', 'F#3']):
    tb = bt5(21 + k) + 0.02
    P(tb, n, t_damp5 - tb, 0.16 * (0.9 if k else 1.0), jit=0)
cue('a5_05-06 THEME complete (solo piano)', tu, en('a5_06_noanswer'), 'solo felt piano, 8 bars, glass stutter')
tf = ev('a5_06_noanswer', 'flicker')
GL(tf, 'A6', 0.12, dur=0.08, bright=0.35)
GL(tf + 0.11, 'A6', 0.09, dur=0.06, bright=0.35)
a = st('a5_07_letdown')
PAD(a + 0.2, ['B2', 'D3', 'F#3', 'A3'], c1('a5_letdown') - a, 0.22, -23, attack=2.5, release=1.5)
P(c1('a5_never') + 0.3, 'E4', 2.2, 0.24)
cue('a5_07 soft strings, E4', a, en('a5_07_letdown'), 'string pad, piano E4')

# ── ACT 6 ────────────────────────────────────────────────────────────────
MB(c1('a6_daddy') + 0.05, 'F#5', 0.24, -2)
cue('a6_01 music box F#5', st('a6_01_doorway'), en('a6_01_doorway'), 'music box')
a = st('a6_02_walk')
tp, th = ev('a6_02_walk', 'pass'), ev('a6_02_walk', 'hug')
PAD(a + 0.3, ['A2', 'D3', 'E3', 'A3'], tp - a + 0.2, 0.24, -20, attack=3.0, release=1.2, cutoff=(300, 900))
PAD(a + 2.5, ['E4', 'A4'], tp - a - 2.0, 0.18, -25, kind='air', attack=2.5, release=1.2)
PAD(tp - 0.1, ['D3', 'F#3', 'A3', 'D4'], th - tp + 0.2, 0.28, -19, attack=1.2, release=1.2)
PAD(tp - 0.1, ['F#4', 'A4'], th - tp + 0.2, 0.18, -24, kind='air', attack=1.5, release=1.2)
cue('a6_02 suspended → major', a, th, 'pad sus → D major')


def bloom(t):
    return float(np.clip(0.75 + 0.25 * (t - th) / 4.0, 0.75, 1.0) * (1.0 if t < en('a6_03_hug') - 1.2 else 0.85))


A6 = tmap([(0, th + 0.1), (21, en('a6_03_hug') - 0.6)])
bars_of('a6_02-03 full theme', A6)
theme(A6, mel_vel=0.40, lh_vel=0.22,
      pad=dict(g=-14, vel=0.36, oct=12), vcurve=bloom, rub=0.025)
PAD(th, ['D2', 'A2'], en('a6_03_hug') - th, 0.24, -18, attack=2.0, release=3.0, cutoff=(200, 500))
cue('a6_03 THEME full (peak 2)', th, en('a6_03_hug'), 'piano + warm strings')
a = st('a6_04_v1')
ts = ev('a6_04_v1', 'soften')
for k, (n, dt) in enumerate([('D3', 0.0), ('A3', 1.2), ('E4', 2.5)]):
    P(ts + dt, n, 3.8, 0.22)
PAD(ts, ['D3', 'A3', 'E4'], en('a6_04_v1') - ts, 0.24, -20, attack=2.5, release=2.0)
cue('a6_04 warm Program motif', a, en('a6_04_v1'), 'piano + pad D3-A3-E4')
a = st('a6_05_restore')
PAD(a, ['D3', 'A3', 'D4'], en('a6_05_restore') - a, 0.2, -23, attack=2.0, release=2.0)
tpz = ev('a6_05_restore', 'press')
for k, n in enumerate(['D5', 'F#5', 'A5', 'D6', 'E6', 'F#6', 'A6']):
    MB(tpz + 0.13 * k, n, 0.16 + 0.015 * k, -3, pan=-0.4 + 0.12 * k)
for e, n in [('check1', 'A5'), ('check2', 'D6'), ('check3', 'E6')]:
    GL(ev('a6_05_restore', e), n, 0.15, bright=0.35)
    GL(ev('a6_05_restore', e) + 0.12, M(n) + 7, 0.09, bright=0.3)
tcd = ev('a6_05_restore', 'countdown')
tclose = ev('a6_06_shutdown', 'close')
SINE(tcd, S.note('E5'), tclose - tcd + 0.5, g=-44, att=1.5, rel=1.5, f1=S.note('D4'))
cue('a6_05 restore', a, en('a6_05_restore'), 'music box arpeggio, glass chimes, descending sine')
a = st('a6_06_shutdown')
for n, t, v, cents in [('E6', tclose - 4.4, 0.30, 0), ('A5', tclose - 2.6, 0.24, -6), ('D5', tclose, 0.18, -18)]:
    MB(t, n, v, -1, cents=cents)
    GL(t, n, v * 0.45, bright=0.2)
tsit = ev('a6_06_shutdown', 'sit')
PAD(tsit, ['D2', 'A2', 'F#3', 'A3'], en('a6_06_shutdown') - tsit, 0.26, -18, attack=2.5, release=0.5, cutoff=(250, 600))
CH(ev('a6_06_shutdown', 'dark') - 0.3, ['D2', 'A2', 'F#3'], None, 0.18, -2, roll=0.07)
cue('a6_06 winding down', a, en('a6_06_shutdown'), 'music box+glass E-A-D, warm low D chord')

# ── ACT 7 ────────────────────────────────────────────────────────────────
P(st('a7_01_week') + 1.0, 'A3', None, 0.22)
cue('a7_01 soft note', st('a7_01_week'), en('a7_01_week'), 'piano A3')
t_buzz7 = ev('a7_04_walk', 'buzz')
m1, m2, m3 = (ev('a7_05_msgs', e) for e in ('m1', 'm2', 'm3'))
theme([(0, st('a7_03_morning') + 0.3), (6, st('a7_03_morning') + 0.3 + 6 * 0.36)], beats=(0, 6), mel_vel=0.30,
      lh_vel=0.17, rub=0.015)
b5 = st('a7_03_morning') + 3.4
theme([(12, b5), (18, b5 + 6 * 0.36)], beats=(12, 18), mel_vel=0.30, lh_vel=0.17, rub=0.015)
theme([(0, t_buzz7 - 9 * 0.37), (9, t_buzz7)], beats=(0, 10), mel_vel=0.30, lh_vel=0.17, rub=0.015)
PAD(st('a7_03_morning'), ['D3', 'F#3', 'A3'], m2 - st('a7_03_morning'), 0.24, -20, attack=2.0, release=0.5)
PAD(st('a7_04_walk'), ['F#4', 'A4', 'D5'], m1 - st('a7_04_walk'), 0.18, -26, kind='air', attack=2.0, release=0.4)
DRONE(t_buzz7, 'D2', m3 - t_buzz7, vel=0.22, g=-10, attack=1.0, release=0.4)
cue('a7_02-04 playful fragments', st('a7_02_alarm'), en('a7_04_walk'), 'piano theme fragments, warm pad')
t_cut7 = en('a7_06_stop')
SINE(m3, S.note('F#7'), t_cut7 - m3 + 0.1, g=-58, att=1.5, rel=0.1)
SUBT(m3, S.note('D1'), t_cut7 - m3 + 0.1, g=-18, att=1.0, rel=0.1)
cue('a7_05-06 layers removed → sine+sub', st('a7_05_msgs'), t_cut7, 'pads removed, high sine, sub')
P(ev('a7_07_video', 'end'), 'F#4', None, 0.24, bus='pbig')
cue('a7_07 F#4', ev('a7_07_video', 'end'), en('a7_07_video'), 'piano, long reverb')
t_lunch = c0('a7_lunch')
SUBT(st('a7_08_v2') + 0.3, S.note('D1'), t_lunch - st('a7_08_v2'), g=-16, att=2.0, rel=0.05)
for e, n in [('m4', 'D'), ('m5', 'A'), ('m6', 'E')]:
    t = ev('a7_08_v2', e)
    GL(t, n + ('5' if n == 'D' else ('5' if n == 'A' else '6')), 0.24, bright=0.3, bus='glassbig')
    GL(t + 0.02, n + ('4' if n != 'E' else '5'), 0.19, bright=0.2, bus='glassbig')
tg = ev('a7_09_eye', 'glint')
PAD(tg, ['D5', 'E5', 'G#5', 'A5'], t_lunch - tg + 0.1, 0.32, -19, kind='air', attack=t_lunch - tg, release=0.05)
PAD(st('a7_08_v2') + 1.0, ['D4', 'A4', 'E5'], t_lunch - st('a7_08_v2') - 1.0, 0.24, -22, kind='air', attack=4.0, release=0.05)
cue('a7_08-09 Program enormous → cluster', st('a7_08_v2'), t_lunch, 'glass D/A/E, sub D1, air cluster (cut)')
tlook = ev('a7_09_eye', 'look')
PAD(tlook, ['D3', 'F#3', 'A3', 'D4'], st('a7_10_wave') - tlook + 0.6, 0.26, -19, attack=2.0, release=1.5)
cue('a7_09 strings enter', tlook, en('a7_09_eye'), 'warm pad D')
# theme statement 1 (bars 1-4), held E, G-major release on 'tap', statement 2 to the catch and home
w = st('a7_10_wave') + 0.1
ttap = ev('a7_11_delete', 'tap')
tcatch = ev('a7_12_run', 'catch')
t_end7 = en('a7_13_hug')
tres = c1('a7_know') + 0.25
# one unhurried statement: quiet from the wave, bar 3's G chord lands on 'tap' (the G-major release),
# broadening to the peak (beat 14) on 'catch', home to D just after 'a7_know'
A7 = tmap([(0, ttap - 8 * 0.80), (8, ttap), (14, tcatch), (21, tres)])
bars_of('a7_10-13 statement', A7)
theme(A7, beats=(0, 8), mel_vel=0.32, lh_vel=0.20, pad=dict(g=-17, vel=0.3), rub=0.025)
P(ttap + 0.01, 'G4', 0.80 * 1.2, 0.36, jit=0)
CH(ttap, ['G2', 'D3', 'B3', 'D4'], 2.6, 0.28, 0, roll=0.06)
PAD(ttap - 0.05, ['G2', 'D3', 'G3', 'B3'], 2.4, 0.32, -16, attack=0.6, release=1.0)


def soar(t):
    if t < tcatch:
        return 0.8 + 0.25 * np.clip((t - ttap) / (tcatch - ttap), 0, 1)
    return 1.05 - 0.35 * np.clip((t - tcatch) / 3.5, 0, 1)


theme(A7, beats=(9, 24), mel_vel=0.40, lh_vel=0.24,
      pad=dict(g=-13, vel=0.38), vcurve=soar, rub=0.025, mbox=-6, tmax=t_end7 - 0.3)
PAD(ttap + 0.6, ['D2', 'A2'], tcatch - ttap + 2.0, 0.26, -17, attack=2.5, release=2.0, cutoff=(200, 500))
CH(tres + 0.03, ['D2', 'A2', 'F#3', 'D4'], None, 0.24, -1, roll=0.06)
PAD(tres - 0.1, ['D3', 'F#3', 'A3'], t_end7 - tres + 0.2, 0.26, -18, attack=0.5, release=0.3)
cue('a7_10-11 theme + G major on tap', w, en('a7_11_delete'), 'piano + strings')
cue('a7_12 theme fullest (peak 3)', st('a7_12_run'), en('a7_12_run'), 'piano, strings, music box')
cue('a7_13 last phrase → D (hard cut)', st('a7_13_hug'), t_end7, 'piano + pad')
# end card
l1, l2, ttl = (ev('end_card', e) for e in ('line1', 'line2', 'title'))
lout = ev('end_card', 'linesOut')
AE1 = tmap([(0, l1), (12, lout - 0.3)])
AE2 = tmap([(12, ttl), (24, DUR - 1.8)])
bars_of('end_card bars 1-4', AE1)
bars_of('end_card bars 5-8', AE2)
theme(AE1, beats=(0, 12), mel_vel=0.30, lh_vel=0.17, rub=0.015)
bte = theme(AE2, beats=(12, 21), mel_vel=0.30, lh_vel=0.17, rub=0.02)
te8 = bte(21)
P(te8, 'D4', DUR - 0.5 - te8, 0.30 * 1.06, jit=0)
CH(te8 + 0.02, ['D2', 'A2', 'F#3'], DUR - 0.5 - te8, 0.20, -1, roll=0.08)
for k, n in enumerate(['D5', 'A5', 'E6']):
    GL(te8 + 0.35 + 0.45 * k, n, 0.12, bright=0.2)
cue('end_card theme + reconciled chord', l1, DUR, 'solo piano, D chord + glass D-A-E')

print(f'{len(EVENTS)} events rendered in {time.time() - T0:.1f}s')

# ═══════════════════════════════ MIX ═══════════════════════════════
BUSES = {   # bus: (dry dB, {reverb: send dB})
    'pno': (0.0, {'hall': -3.0, 'big': -11.0}),
    'pbig': (-3.0, {'big': 0.0, 'hall': -6.0}),
    'mbox': (-1.0, {'hall': -4.0, 'big': -10.0}),
    'glass': (-3.0, {'big': -2.0}),
    'glassbig': (-5.0, {'big': 1.0}),
    'far': (-30.0, {'big': -3.0}),
    'data': (0.0, {'plate': -10.0}),
    'pad': (0.0, {'hall': -9.0}),
    'low': (0.0, {}),
    'air': (0.0, {'hall': -8.0}),
    'tick': (0.0, {'room': -8.0, 'hall': -18.0}),
    'pl': (0.0, {'hall': -7.0}),
    'home': (0.0, {'hall': -5.0, 'big': -12.0}),
    'phone': (0.0, {'room': -16.0}),
}
# hard cuts (segment ends) — everything, reverb included, ends here
CUTS = [en('a1_13_react'), tn, t_cut7, t_lunch, t_end7, DUR]
# global fades with the picture: (fade start, fade end/zero, back to unity)
FADES = [(st('a3_08_video') - 0.9, st('a3_08_video'), st('a3_08_video')),
         (en('a3_10_dark') - 1.4, en('a3_10_dark'), en('a3_10_dark')),
         (en('a6_06_shutdown') - 2.0, en('a6_06_shutdown'), en('a6_06_shutdown')),
         (DUR - 2.2, DUR, DUR)]

out = np.zeros((NTOT, 2))
seg0 = 0.0
for cut in CUTS:
    i0, i1 = S.n_of(seg0), min(NTOT, S.n_of(cut))
    n = i1 - i0
    bus = {}
    for (t, b, y) in EVENTS:
        if not (seg0 - 1e-6 <= t < cut - 1e-6):
            continue
        j = S.n_of(t) - i0
        if j < 0:
            y = y[-j:]
            j = 0
        m = min(len(y), n - j)
        if m <= 0:
            continue
        bus.setdefault(b, np.zeros((n, 2)))[j:j + m] += y[:m]
    seg = np.zeros((n, 2))
    sends = {}
    for b, x in bus.items():
        dry, snd = BUSES[b]
        if b == 'home':      # behind the door: heavy low-pass + quieter after 'close'
            x = S.reverb(x, 'hall', wet_db=-5, dry_db=0, tail=False)
            if seg0 <= t_close < cut:
                kx = S.n_of(t_close) - i0
                mask = np.zeros(n)
                mask[kx:] = 1.0
                mask[kx:kx + 2400] = S._rise(2400)
                muff = S.lowpass(S.lowpass(x, 450.0, 2), 450.0, 2) * S.db(-11)
                x = x * (1 - mask)[:, None] + muff * mask[:, None]
            seg += x
            continue
        seg += x * S.db(dry)
        for kind, sdb in snd.items():
            sends.setdefault(kind, np.zeros((n, 2)))
            sends[kind] += x * S.db(sdb)
    for kind, x in sends.items():
        seg += S.reverb(x, kind, wet_db=0.0, tail=False)
    seg = S.dc_block(seg, 12.0)
    k = min(n, S.n_of(0.02))
    seg[-k:] *= (1 - S._rise(k))[:, None]
    out[i0:i1] += seg
    seg0 = cut

g = np.ones(NTOT)
for a_, b_, c_ in FADES:
    ia, ib, ic = S.n_of(a_), min(NTOT, S.n_of(b_)), min(NTOT, S.n_of(c_))
    g[ia:ib] *= np.cos(0.5 * np.pi * np.arange(ib - ia) / max(1, ib - ia)) ** 2
    g[ib:ic] = 0.0
out *= g[:, None]

# master level: integrated LUFS target, peak ceiling
TARGET = -22.0
L = S.lufs(out)
out *= S.db(TARGET - L)
pk = np.max(np.abs(out))
if pk > S.db(-6.5):
    out = S.limiter(out, -6.5, knee_db=3.0, release=0.2)
assert np.all(np.isfinite(out))
OUT = HERE / 'out/music.wav'
S.save(OUT, out)
print(f'wrote {OUT}  {len(out) / SR:.3f}s  (film {DUR:.3f}s)  render {time.time() - T0:.1f}s')

# ═══════════════════════════════ REVIEW ═══════════════════════════════
RV = ROOT / 'build/review/audio/score'
RV.mkdir(parents=True, exist_ok=True)


def rms_db(x):
    return 20 * math.log10(math.sqrt(float(np.mean(x ** 2))) + 1e-12)


lines = [f'{"cue":40s} {"start":>7s} {"end":>7s} {"RMS dB":>7s} {"peak":>6s}  instruments']
for name, a_, b_, instr in CUE_TABLE:
    x = out[S.n_of(a_):S.n_of(b_)]
    lines.append(f'{name:40s} {a_:7.2f} {b_:7.2f} {rms_db(x):7.1f} {20 * math.log10(np.max(np.abs(x)) + 1e-12):6.1f}  {instr}')
lines.append('')
for name, a_, b_ in [('silence a5_04 noresult→unfold', tn + 0.03, tu - 0.05),
                     ('silence a7_07 video (to end ev)', st('a7_07_video') + 0.03, ev('a7_07_video', 'end') - 0.05),
                     ('silence end_card start→line1', st('end_card') + 0.03, l1 - 0.03),
                     ('after a1_13 cut→title on', en('a1_13_react') + 0.03, t_on - 0.03),
                     ('a7_lunch cut half-second', t_lunch + 0.03, tlook),
                     ('after a7_13 cut (+0.25)→line1', t_end7 + 0.25, l1 - 0.03),
                     ('a5_05 chord gone by a5_letdown end', c1('a5_letdown'), c1('a5_letdown') + 0.5),
                     ('a1_11 before buzz', st('a1_11_night') + 0.8, t_buzz - 0.02)]:
    x = out[S.n_of(a_):S.n_of(b_)]
    lines.append(f'{name:40s} {a_:7.2f} {b_:7.2f} peak {20 * math.log10(np.max(np.abs(x)) + 1e-12):7.1f} dBFS')
lines.append(f'\nintegrated LUFS {S.lufs(out):.1f}  peak {20 * math.log10(np.max(np.abs(out))):.1f} dBFS  '
             f'DC {np.mean(out):.2e}  samples {len(out)} (= {NTOT})')
lines.append('\ntheme statements (nominal bar starts; ± rubato jitter):')
for name, bar, t_, d_ in BAR_TABLE:
    lines.append(f'  {name:28s} bar {bar}  {t_:8.2f}  ' + (f'{d_:5.2f} s' if d_ else ' ring'))
(RV / 'cues.txt').write_text('\n'.join(lines))
print('\n'.join(lines))

# theme alone on the felt piano, 66 bpm, + pitch check
EVENTS.clear()
theme([(0, 0.5), (1, 0.5 + 60 / 66)], mel_vel=0.4, lh_vel=0.2, rub=0.0)
mel_on = [0.5 + b * 60 / 66 for (_, b, _) in MEL]
tm = np.zeros((S.n_of(0.5 + 24 * 60 / 66 + 6), 2))
for (t, b, y) in EVENTS:
    j = S.n_of(t)
    m = min(len(y), len(tm) - j)
    tm[j:j + m] += y[:m]
mono = tm.mean(axis=1)
tm = S.reverb(tm, 'hall', wet_db=-4, dry_db=0, tail=False)
S.save(RV / 'theme.wav', S.normalize(tm, -3))
print('\ntheme pitch check (FFT peak 260-1400 Hz, 0.06-0.5 s after onset):')
for (m, b, d), t in list(zip(MEL, mel_on))[:9]:
    x = mono[S.n_of(t + 0.06):S.n_of(t + 0.5)] * np.hanning(S.n_of(0.44))[:S.n_of(t + 0.5) - S.n_of(t + 0.06)]
    X = np.abs(np.fft.rfft(x, 1 << 17))
    f = np.fft.rfftfreq(1 << 17, 1 / SR)
    sel = (f > 260) & (f < 1400)
    i = np.argmax(X * sel)
    a_, b_, c_ = np.log(X[i - 1:i + 2] + 1e-12)
    fi = f[i] + 0.5 * (a_ - c_) / (a_ - 2 * b_ + c_) * (f[1] - f[0])
    print(f'  beat {b:2d}  expected {S.midi(m):7.2f} Hz  measured {fi:7.2f} Hz  ({1200 * math.log2(fi / S.midi(m)):+.1f} c)')

# spectrograms per act
acts = [(1, 0.0, st('a2_01_gate')), (2, st('a2_01_gate'), st('a3_01_police')), (3, st('a3_01_police'), st('a4_01_dawn')),
        (4, st('a4_01_dawn'), st('a5_01_arrive')), (5, st('a5_01_arrive'), st('a6_01_doorway')),
        (6, st('a6_01_doorway'), st('a7_01_week')), (7, st('a7_01_week'), DUR)]
for k, a_, b_ in acts:
    subprocess.run(['ffmpeg', '-v', 'error', '-y', '-ss', f'{a_:.3f}', '-t', f'{b_ - a_:.3f}', '-i', str(OUT), '-lavfi',
                    'showspectrumpic=s=1600x700:legend=1:stop=8000:color=intensity', str(RV / f'act{k}.png')], check=False)
subprocess.run(['ffmpeg', '-v', 'error', '-y', '-i', str(RV / 'theme.wav'), '-lavfi',
                'showspectrumpic=s=1600x700:legend=1:stop=2000', str(RV / 'theme.png')], check=False)
print(f'done in {time.time() - T0:.1f}s')
