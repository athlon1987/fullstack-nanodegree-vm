#!/usr/bin/env python3
"""THE REPLACEMENT - sound design stem: ambience beds + spot effects  ->  audio/out/sfx.wav
Every time comes from build/timeline.json.  Run:  python3 audio/sfx.py"""
import json
import math
import sys
import time
from pathlib import Path

import numpy as np
from scipy.ndimage import uniform_filter1d

HERE = Path(__file__).resolve().parent
ROOT = HERE.parent
sys.path.insert(0, str(HERE))
import synth as S                      # noqa: E402
from synth import SR, db, n_of, rng    # noqa: E402

TL = json.load(open(ROOT / 'build' / 'timeline.json'))
DUR = TL['duration']
N = n_of(DUR)
SHOTS = TL['shots']
CUES = TL['cues']
OUT = HERE / 'out' / 'sfx.wav'
REVIEW = ROOT / 'build' / 'review' / 'audio' / 'sfx'

AMB_TRIM = 14.0      # dB, whole ambience layer
SPOT_TRIM = 2.0     # dB, whole spot layer


def sh(prefix):
    for s in SHOTS:
        if s['id'].startswith(prefix):
            return s
    raise KeyError(prefix)


def ev(prefix, name):
    return sh(prefix)['events'][name]['t']


def t0(prefix):
    return sh(prefix)['start']


def t1(prefix):
    return sh(prefix)['end']


def cue_gap(prefix):
    c = [c for c in CUES if c['shot'].startswith(prefix)]
    return c[0]['t1'], c[1]['t0']


# ───────────────────────────── small helpers ─────────────────────────────

def rms_to(x, level_db):
    r = math.sqrt(float(np.mean(np.asarray(x, dtype=np.float64) ** 2))) + 1e-12
    return x * (db(level_db) / r)


def pk_to(x, level_db):
    return x * (db(level_db) / (float(np.max(np.abs(x))) + 1e-12))


def place(buf, x, t):
    i0 = n_of(t)
    a = max(0, -i0)
    b = min(len(x), len(buf) - i0)
    if b > a:
        buf[i0 + a:i0 + b] += x[a:b]


def pan_curve(x, p):
    gl, gr = S._pan_gains(S._as_curve(p, len(x)))
    return np.stack([x * gl, x * gr], axis=1)


def stereo_noise(d, color, seed):
    return S.noise(d, color, seed, stereo=True)


def speech_env(t, n, depth_db=-6.0):
    env = np.ones(n)
    t_end = t + n / SR
    hit = False
    for c in CUES:
        if c['t1'] + 0.1 < t or c['t0'] - 0.1 > t_end:
            continue
        a = max(0, n_of(c['t0'] - 0.1 - t))
        b = min(n, n_of(c['t1'] + 0.1 - t))
        if b > a:
            env[a:b] = db(depth_db)
            hit = True
    if hit and n > 400:
        env = uniform_filter1d(env, max(3, n_of(0.08)))
    return env


# ───────────────────────────── the mixer ─────────────────────────────

class Mix:
    def __init__(self):
        self.buf = np.zeros((N, 2), dtype=np.float32)
        self.log = []

    def add(self, t, x, pk, p=0.0, rev=None, wet=-12.0, what='', shot='', evn='', duck=True, pan_c=None):
        x = np.asarray(x, dtype=np.float64)
        if x.ndim == 2:
            x = x.mean(axis=1)
        x = np.nan_to_num(x)
        x = x / (np.max(np.abs(x)) + 1e-12) * db(pk + SPOT_TRIM)
        if duck:
            x = x * speech_env(t, len(x))
        y = pan_curve(x, pan_c) if pan_c is not None else S.pan(x, p)
        self.log.append((shot, evn, t, what, float(S.to_db(np.max(np.abs(y))))))
        place(self.buf, y, t)
        if rev:
            w = S.reverb(y, rev, wet_db=wet, tail=True)
            place(self.buf, w, t)


# ───────────────────────────── generators (mono) ─────────────────────────────

def piezo_alarm(dur, seed=11):
    """The broken cheap piezo alarm: ~2.9 kHz beeps, wobbling pitch, stuttering / tearing."""
    r = rng(seed, 'alarm')
    n = n_of(dur + 0.3)
    t = np.arange(n) / SR
    wob = 1.0 + 0.045 * np.sin(S.TAU * 6.3 * t) + 0.04 * S.wander(n, 5.0, -1.0, 1.0, 5)
    f = 2900.0 * wob
    for _ in range(int(dur * 2) + 2):
        a = r.uniform(0, dur)
        m = (t > a) & (t < a + r.uniform(0.03, 0.09))
        f[m] *= r.uniform(0.62, 0.84)
    ph = np.cumsum(f) / SR
    y = np.sin(S.TAU * ph) + 0.33 * np.sin(S.TAU * 3 * ph) + 0.15 * np.sin(S.TAU * 5 * ph)
    env = np.zeros(n)
    tc = 0.0
    while tc < dur + 0.1:
        for _ in range(4):
            ln = 0.065 * r.choice([1.0, 1.0, 1.0, 0.45, 1.6])
            if r.random() < 0.2:
                tc += ln + 0.05
                continue
            i0, i1 = n_of(tc), min(n, n_of(tc + ln))
            if i1 - i0 > 4:
                seg = np.ones(i1 - i0)
                k = min(len(seg) // 2, n_of(0.003))
                if k > 1:
                    seg[:k] = S._rise(k)
                    seg[-k:] = 1 - S._rise(k)
                if r.random() < 0.35:
                    tt_ = np.arange(len(seg)) / SR
                    seg *= 0.5 + 0.5 * np.sign(np.sin(S.TAU * r.uniform(60, 140) * tt_ + r.uniform(0, 6)))
                env[i0:i1] += seg
            tc += ln + 0.048 + r.uniform(0, 0.02)
        tc += r.choice([0.26, 0.34, 0.5])
    y = S.lowpass(y * np.clip(env, 0, 1), 6200.0, 2)
    return S.fade_out(y[:n_of(dur)], 0.006)


def step(kind, seed, vel=1.0):
    r = rng(seed, 'step', kind)
    p = 1.0 + 0.07 * r.normal()
    if kind == 'heel':
        y = S.layer(S.impact('heel', p, 0.9 * vel, 0.6, r), (S.impact('step', 1.1, 0.45 * vel, 0.5, r), 0.0),
                    (S.noise_burst(0.07, 600, 3500, 0.001, 0.05, seed=seed) * 0.35, 0.012))
    elif kind == 'shoe':
        y = S.layer(S.impact('step', 0.9 * p, vel, 0.45, r), (S.impact('heel', 0.55 * p, 0.3 * vel, 0.4, r), 0.0))
    elif kind == 'run':
        y = S.layer(S.impact('step', 0.75 * p, 1.0 * vel, 0.35, r), (S.impact('thud', 1.0 * p, 0.5 * vel, 0.3, r), 0.0),
                    (S.noise_burst(0.09, 300, 2200, 0.002, 0.06, seed=seed) * 0.25, 0.0))
    elif kind == 'light':
        y = S.layer(S.impact('step', 1.45 * p, 0.8 * vel, 0.5, r), (S.noise_burst(0.05, 700, 3000, 0.001, 0.035, seed=seed) * 0.2, 0.0))
    else:
        y = S.layer(S.impact('thud', 1.7 * p, 0.55 * vel, 0.15, r), (S.noise_burst(0.05, 500, 1800, 0.003, 0.04, seed=seed) * 0.3, 0.0))
    return S.lowpass(y, 5500.0, 2) / (np.max(np.abs(y)) + 1e-9)


def cadence(a, b, period, jit=0.05, seed=0):
    r = rng(seed, 'cad')
    out, t = [], a
    while t < b - 1e-6:
        out.append(t)
        t += period * (1 + r.normal(0, jit))
    return out


def steps(m, times, kind, pk, p0, p1, rev, wet, shot, evn, seed=0, fall=0.0, what=None):
    n = len(times)
    for i, t in enumerate(times):
        u = i / max(1, n - 1)
        r = rng(seed, 'sv', i)
        g = pk - fall * u + r.normal(0, 1.0)
        m.add(t, step(kind, seed * 100 + i), g, p0 + (p1 - p0) * u, rev, wet, what or f'step {kind}', shot, evn)


def creak(dur, f0=650.0, f1=900.0, seed=0, stick=70.0):
    r = rng(seed, 'creak')
    n = n_of(dur)
    imp = np.zeros(n)
    t = 0.0
    while t < dur - 0.01:
        imp[n_of(t)] = r.uniform(0.5, 1.0)
        t += max(0.002, 1.0 / (stick * (1 + 0.5 * math.sin(3 * t) + 0.2 * r.normal())))
    c = S.curve([(0, f0), (dur, f1)], dur, 'exp') * (1 + 0.08 * S.wander(n, 3.0, -1, 1, seed))
    y = S.bandpass_tv(imp, c, 7.0)
    env = np.sin(np.pi * np.arange(n) / n) ** 1.2 * (0.6 + 0.4 * S.wander(n, 6.0, 0, 1, seed + 1))
    return S.lowpass(y * env, 2600.0, 2)


def door_open(seed=0):
    return S.layer(S.impact('latch', 0.7, 0.6, 0.3, seed), (creak(0.9, 520, 780, seed) * 0.5, 0.12))


def door_close(vel=0.6, seed=0, latch=True):
    parts = [S.impact('door', 1.0, vel, 0.3, seed)]
    if latch:
        parts.append((S.impact('latch', 0.8, 0.5 * vel, 0.2, seed + 1), 0.1))
    return S.layer(*parts)


def clink(seed=0, pitch=1.0, vel=1.0):
    return S.impact('metal', pitch * (1 + 0.1 * rng(seed).normal()), vel, 0.6, seed)


def lunchbox_rattle(seed=0, n=4, span=0.35):
    r = rng(seed, 'lb')
    parts = [(S.impact('metal', 0.55 * (1 + 0.2 * r.normal()), r.uniform(0.3, 0.7), 0.3, rng(r, i)), r.uniform(0, span)) for i in range(n)]
    return S.layer(*parts)


def water(dur, seed=0):
    n = n_of(dur)
    nz = S._colored(n, 1, rng(seed, 'water'))
    y = S.bandpass(nz, 900.0, 6500.0, 2)
    y *= 1.0 + 0.5 * S.wander(n, 11.0, -1.0, 1.0, seed)
    gur = S.bandpass_tv(S._colored(n, 1, rng(seed, 'g')), 500.0 + 500.0 * S.wander(n, 6.0, 0, 1, seed + 2), 5.0) * 0.5
    return (y + gur)


def whistle(seed=0):
    r = rng(seed, 'whistle')
    d = r.uniform(0.35, 0.6)
    n = n_of(d)
    u = np.arange(n) / n
    f = r.uniform(2400, 3100) * (1 + 0.18 * u) * (1 + 0.012 * np.sin(S.TAU * 6.5 * u * d))
    return np.sin(S.TAU * np.cumsum(f) / SR) * np.sin(np.pi * u) ** 0.8


def cricket(seed=0):
    r = rng(seed, 'cr')
    f = r.uniform(4300, 5000)
    pulses = int(r.integers(3, 5))
    parts = []
    for i in range(pulses):
        n = n_of(0.02)
        u = np.arange(n) / n
        parts.append((np.sin(S.TAU * f * np.arange(n) / SR) * np.sin(np.pi * u), i * 0.034))
    return S.layer(*parts)


def stutter_gate(n, a, b, seed):
    r = rng(seed, 'flick')
    g = np.ones(n)
    t = a
    while t < b:
        d = r.uniform(0.03, 0.14)
        g[n_of(t):n_of(t + d)] = 1.0 if r.random() < 0.45 else 0.05
        t += d
    return uniform_filter1d(g, 24)


def synth_whine(dur, f0, f1, seed=0):
    n = n_of(dur)
    u = np.arange(n) / n
    f = f0 * (f1 / f0) ** (u ** 0.7)
    ph = np.cumsum(f) / SR
    y = np.sin(S.TAU * ph) + 0.25 * np.sin(S.TAU * 2.003 * ph + 0.7)
    y *= 1.0 - 0.12 * np.sin(S.TAU * np.cumsum(7.0 * (1 - u) + 0.8) / SR)
    return S.lowpass(y, 2400.0, 2)


def engine_crank(dur, seed=0):
    r = rng(seed, 'engine')
    n = n_of(dur)
    u = np.arange(n) / n
    rate = 9.0 - 5.0 * u ** 1.3
    puls = (0.5 + 0.5 * np.cos(S.TAU * np.cumsum(rate) / SR)) ** 3
    saw = 2.0 * ((np.cumsum(88.0 * (1 + 0.06 * S.wander(n, 5, -1, 1, 3))) / SR) % 1.0) - 1.0
    y = (S.lowpass(saw, 420.0, 2) + 0.5 * S.lowpass(r.standard_normal(n), 260.0, 2)) * puls
    whine = np.sin(S.TAU * np.cumsum(420.0 - 150.0 * u) / SR) * (1 - u) ** 0.8 * 0.18
    y = y + S.lowpass(whine, 900.0, 2)
    c = S.impact('thud', 0.8, 1.0, 0.3, seed) * 1.3
    arr = np.zeros(n)
    place(arr, c[:n_of(0.3)], 0.62 * dur)
    y += arr
    y *= np.clip(1.0 - np.maximum(u - 0.72, 0) / 0.28, 0, 1) ** 1.4
    y *= np.minimum(u / 0.03, 1.0)
    return S.lowpass(y, 700.0, 2)


def hiss(dur, lo=1800.0, hi=7500.0, t60=1.5, attack=0.08, seed=0):
    n = n_of(dur)
    y = S.bandpass(rng(seed, 'hiss').standard_normal(n), lo, hi, 2)
    t = np.arange(n) / SR
    return y * np.minimum(t / attack, 1.0) * np.exp(-6.9 * t / t60)


def sweep_tone(dur, f0, f1):
    f = S.curve([(0, f0), (dur, f1)], dur, 'exp')
    return S.lowpass(S.osc(f) * S.gate(dur, 0, dur * 0.8, 0.12, dur * 0.2), 5000.0, 2)


def scribble(dur, seed=0):
    r = rng(seed, 'scrib')
    n = n_of(dur)
    nz = S.bandpass(r.standard_normal(n), 2600.0, 7000.0, 2)
    env = np.zeros(n)
    per = dur / 4
    for L in range(4):
        ts = L * per + 0.05
        for k in range(int(r.integers(2, 4))):
            d = r.uniform(0.12, 0.28)
            a, b = n_of(ts), min(n, n_of(ts + d))
            if b > a:
                env[a:b] += np.sin(np.pi * np.arange(b - a) / (b - a)) * r.uniform(0.5, 1.0)
            ts += d + r.uniform(0.02, 0.07)
    env = uniform_filter1d(env, 48)
    return S.lowpass(nz * env * (0.6 + 0.4 * S.wander(n, 25.0, 0, 1, seed)), 7000.0, 2)


def data_stream(dur, seed=0):
    r = rng(seed, 'data')
    n = n_of(dur)
    out = np.zeros(n)
    t = 0.0
    while t < dur - 0.01:
        f = r.choice([1600.0, 2100.0, 2600.0, 3300.0, 4000.0]) * (1 + 0.03 * r.normal())
        m = n_of(0.005)
        y = np.sin(S.TAU * f * np.arange(m) / SR) * np.hanning(m) * r.uniform(0.3, 1.0)
        i0 = n_of(t)
        if i0 + m < n:
            out[i0:i0 + m] += y
        t += r.uniform(0.012, 0.03)
    return out


def keyboard(dur, seed=0):
    r = rng(seed, 'kb')
    out = np.zeros(n_of(dur))
    t = r.uniform(0, 0.2)
    while t < dur - 0.05:
        for _ in range(int(r.integers(2, 7))):
            place(out, S.impact('tap', r.uniform(0.9, 1.3), r.uniform(0.4, 1.0), 0.6, rng(r, int(t * 1000))), t)
            t += r.uniform(0.07, 0.15)
        t += r.uniform(0.25, 0.8)
    return out


def stamp_thud(seed=0):
    return S.layer(S.impact('stamp', 1.0, 1.0, 0.45, seed), (S.noise_burst(0.12, 400, 2500, 0.002, 0.08, seed=seed) * 0.3, 0.0))


def hand_slap(seed=0):
    return S.layer(S.impact('clap', 0.7, 1.0, 0.4, seed), (S.impact('thud', 1.6, 0.4, 0.3, seed), 0.0))


def siren_whoop(seed=0):
    d = 1.1
    n = n_of(d)
    f = S.curve([(0, 620), (0.7, 1180), (1.1, 700)], d, 'exp')
    return S.lowpass(S.osc(f, shape='tri') * np.sin(np.pi * np.arange(n) / n) ** 0.6, 1800.0, 2)


def radio_static(seed=0):
    r = rng(seed, 'static')
    d = r.uniform(0.18, 0.55)
    n = n_of(d)
    nz = S.bandpass(r.standard_normal(n), 700.0, 3200.0, 2)
    g = (r.random(n // 600 + 2) > 0.35).astype(float)
    g = uniform_filter1d(np.interp(np.arange(n), np.linspace(0, n, len(g)), g), 80)
    env = np.minimum(np.arange(n) / 300, 1) * (1 - np.arange(n) / n) ** 0.5
    return S.speaker(nz * g * env, 3.0)


def car_glide(dur, seed=0):
    n = n_of(dur)
    u = np.arange(n) / n
    tire = S.bandpass(S._colored(n, 1, rng(seed, 'tire')), 500.0, 3200.0, 2)
    amp = np.interp(u, [0, 0.6, 0.85, 1.0], [0.0, 1.0, 0.45, 0.0])
    sp = np.interp(u, [0, 0.7, 1.0], [1.0, 0.8, 0.0])
    tire = S.lowpass_tv(tire, 700.0 + 2000.0 * sp) * amp
    whine = np.sin(S.TAU * np.cumsum(260.0 + 380.0 * sp) / SR) * amp * 0.08
    brake = hiss(dur, 2500, 6000, 0.4, 0.05, seed) * np.interp(u, [0, 0.75, 0.88, 1.0], [0, 0, 0.25, 0]) * 0.6
    return S.lowpass(tire + whine + brake, 4500.0, 2)


def bus_pass(dur, seed=0):
    n = n_of(dur)
    u = np.arange(n) / n
    env = np.sin(np.pi * u) ** 2.2
    eng = S.lowpass(np.sin(S.TAU * np.cumsum(46.0 + 12.0 * env) / SR) + 0.5 * np.sin(S.TAU * np.cumsum(92.0 + 24.0 * env) / SR) +
                    0.3 * S._colored(n, 2, rng(seed, 'bus')), 320.0, 2)
    tire = S.bandpass(S._colored(n, 1, rng(seed, 'bt')), 300.0, 1800.0, 2) * 0.5
    return (eng + tire) * env


def blip_seq(freqs, spacing, dur, vel, shape='sine', t60=None):
    return S.layer(*[(S.blip(f, dur, vel, shape, 0.004, t60=t60), i * spacing) for i, f in enumerate(freqs)])


def error_beeps():
    return S.layer(S.blip(660.0, 0.14, 1.0, 'sine', 0.004), (S.blip(440.0, 0.2, 1.0, 'sine', 0.004), 0.16))


def tap_haptic(vel=1.0):
    return S.layer(S.impact('click', 0.45, vel, 0.3, 4), (S.blip(160.0, 0.05, 1.0, 'sine', 0.002), 0.0))


# ───────────────────────────── ambience beds ─────────────────────────────

def air_hiss(d, lo, hi, level, seed):
    return rms_to(S.bandpass(stereo_noise(d, 'pink', seed), lo, hi, 2), level)


def bed_bedroom(d, seed, bright=False):
    out = S.room_tone(d, 'dark', -50.0, seed=seed) + S.lowpass(S.traffic(d, 0.15, -52.0, seed), 300.0)
    if bright:
        out = out + S.birds(d, 0.3, 0.9, -50.0, seed + 5)
    return out


def bed_kitchen_am(d, seed, birds=False):
    out = S.room_tone(d, 'neutral', -50.0, seed=seed) + S.to_stereo(S.hum(d, 50.0, 0.12, 0.1, -49.0, seed)) + \
        S.lowpass(S.traffic(d, 0.3, -50.0, seed + 1), 600.0)
    if birds:
        out = out + S.birds(d, 0.5, 0.9, -46.0, seed + 2)
    return out


def bed_office(d, seed):
    return S.room_tone(d, 'neutral', -46.0, hum=100.0, seed=seed) * 0.8 + air_hiss(d, 250, 1800, -48.0, seed + 1)


def bed_road(d, seed):
    out = S.traffic(d, 0.9, -38.0, seed)
    r = rng(seed, 'pass')
    t = 0.3
    while t < d - 1.5:
        pd = r.uniform(2.0, 3.2)
        m = n_of(pd)
        nz = S.lowpass_tv(S.bandpass(S._colored(m, 1, rng(r, int(t * 10))), 200.0, 1800.0, 2),
                          S.curve([(0, 1800), (pd * 0.5, 900), (pd, 350)], pd, 'exp'))
        env = np.sin(np.pi * np.arange(len(nz)) / len(nz)) ** 2.5
        dirn = 1 if r.random() < 0.5 else -1
        place(out, pan_curve(rms_to(nz * env, -36.0), dirn * np.linspace(-0.85, 0.85, len(nz))), t)
        t += pd + r.uniform(0.5, 2.5)
    return out


def bed_audi(d, seed):
    return S.room_tone(d, 'dark', -50.0, hum=60.0, seed=seed)


def bed_steps(d, seed):
    out = S.traffic(d, 0.4, -42.0, seed) + air_hiss(d, 800, 5000, -56.0, seed + 1)
    r = rng(seed, 'cricket')
    t = 0.2
    while t < d:
        c = cricket(int(r.integers(1000)))
        c = S.pan(c * db(-52.0 + r.normal(0, 3)) / (np.max(np.abs(c)) + 1e-9), r.uniform(-0.8, 0.8))
        for k in range(int(r.integers(2, 6))):
            place(out, c, t + k * 0.28)
        t += r.uniform(0.8, 2.2)
    return out


def bed_lobby(d, seed):
    out = S.room_tone(d, 'air', -50.0, seed=seed) + S.to_stereo(S.hum(d, 120.0, 0.4, 0.2, -58.0, seed))
    r = rng(seed, 'lobsteps')
    t = 0.6
    while t < d - 1:
        k = step('shoe', int(r.integers(1000)), 1.0)
        pp = r.uniform(-.7, .7)
        for i in range(int(r.integers(3, 7))):
            place(out, S.reverb(S.lowpass(S.pan(k * db(-50.0), pp), 1400.0), 'big', wet_db=-3.0, tail=True), t + i * 0.55)
        t += r.uniform(3.0, 6.0)
    return out


def bed_glass(d, seed):
    return S.room_tone(d, 'dark', -48.0, hum=100.0, seed=seed) * 0.9


def bed_city(d, seed):
    return S.traffic(d, 1.0, -34.0, seed) + S.room_tone(d, 'air', -54.0, seed=seed + 1)


def bed_warm_kitchen(d, seed):
    return S.room_tone(d, 'neutral', -48.0, seed=seed) + S.to_stereo(S.hum(d, 50.0, 0.12, 0.1, -52.0, seed)) + \
        S.lowpass(S.traffic(d, 0.3, -52.0, seed + 1), 500.0)


def bed_cold(d, seed):
    h = S.hum(d, 100.0, 0.55, 0.25, -47.0, seed)
    return S.room_tone(d, 'dark', -54.0, seed=seed) + S.pan(h, 0.1) + S.to_stereo(S.hum(d, 130.0, 0.9, 0.5, -64.0, seed + 3))


def bed_night_street(d, seed, start):
    out = S.lowpass(S.traffic(d, 0.4, -42.0, seed), 500.0) + air_hiss(d, 1200, 4500, -52.0, seed + 1)
    r = rng(seed, 'police')
    t = 0.4
    while t < d - 0.8:
        place(out, S.pan(pk_to(radio_static(int(r.integers(10000))), -42.0), r.uniform(0.2, 0.6)), t)
        t += r.uniform(1.4, 3.2)
    w = pk_to(S.layer(siren_whoop(), (siren_whoop(), 1.3)), -44.0)
    place(out, S.reverb(S.pan(w, -0.6), 'big', wet_db=-2.0, dry_db=-4.0, tail=True), 0.45 * d)
    return out


def bed_gov(d, seed, base):
    out = S.room_tone(d, 'neutral', -50.0, hum=100.0, seed=seed) * 0.8 + S.pan(S.hum(d, 100.0, 0.5, 0.3, -50.0, seed), 0.0)
    thump = S.reverb(S.pan(pk_to(S.impact('thud', 0.7, 1.0, 0.3, 3), -42.0), 0.5), 'big', wet_db=-3.0, dry_db=-3.0)
    place(out, thump, 0.6)
    ding = S.reverb(S.pan(pk_to(S.blip(1568.0, 0.8, 1.0, 'sine', 0.003, t60=1.2), -40.0), 0.4), 'hall', wet_db=-6.0, dry_db=0.0)
    place(out, ding, ev('a3_03', 'slump') + 0.7 - base)
    return out


def bed_rain(d, seed):
    return rms_to(S.rain(d, 0.42, 0.55, 0.5, 1.0, seed), -36.0)


def bed_dawn(d, seed):
    out = S.room_tone(d, 'air', -54.0, seed=seed) + S.lowpass(S.traffic(d, 0.3, -48.0, seed), 450.0) + air_hiss(d, 1500, 6000, -62.0, seed + 2)
    out = out + S.birds(d, 0.18, 0.9, -45.0, seed + 3)
    rr = rng(seed, 'drip')
    for _ in range(int(d / 3)):
        dp = S.reverb(S.pan(pk_to(S.drip(rr.uniform(0.8, 1.3), 0.5, int(rr.integers(1000))), -46.0), rr.uniform(-.8, .8)),
                      'big', wet_db=-4.0, dry_db=-2.0)
        place(out, dp, rr.uniform(0, d - 1))
    return out


def bed_night_kitchen(d, seed):
    return S.room_tone(d, 'dark', -52.0, seed=seed) + S.to_stereo(S.hum(d, 50.0, 0.12, 0.08, -48.0, seed))


def bed_street(d, seed):
    return S.traffic(d, 0.35, -40.0, seed) + S.birds(d, 0.6, 0.95, -44.0, seed + 1) + S.room_tone(d, 'air', -52.0, seed=seed + 2)


GROUPS = [
    ('a1_01', 'a1_02', 'bedroom'), ('a1_03', 'a1_06', 'kitchen_am'), ('a1_07', 'a1_07', 'office'),
    ('a1_08', 'a1_08', 'road'), ('a1_09', 'a1_09', 'audi'), ('a1_10', 'a1_10', 'steps'),
    ('a1_11', 'a1_13', 'night_kitchen'),
    ('a2_01', 'a2_01', 'lobby'), ('a2_02', 'a2_03', 'glass'), ('a2_04', 'a2_04', 'city'),
    ('a2_05', 'a2_09', 'warm_kitchen'), ('a2_10', 'a2_10', 'cold'),
    ('a3_01', 'a3_02', 'night_street'), ('a3_03', 'a3_04', 'gov'), ('a3_05', 'a3_10', 'rain'),
    ('a4_01', 'a4_05', 'dawn'), ('a5_01', 'a5_01', 'cold'), ('a5_02', 'a6_06', 'night_kitchen'),
    ('a7_02', 'a7_02', 'bedroom_dawn'), ('a7_03', 'a7_03', 'kitchen_gold'), ('a7_04', 'a7_13', 'street'),
]

BED_TRIM = {'rain': -6.0, 'city': -5.0, 'road': -3.0, 'street': -3.0, 'night_street': -2.0}

BEDS = {
    'bedroom': lambda d, s, a: bed_bedroom(d, s), 'bedroom_dawn': lambda d, s, a: bed_bedroom(d, s, True),
    'kitchen_am': lambda d, s, a: bed_kitchen_am(d, s), 'kitchen_gold': lambda d, s, a: bed_kitchen_am(d, s, True),
    'office': lambda d, s, a: bed_office(d, s), 'road': lambda d, s, a: bed_road(d, s),
    'audi': lambda d, s, a: bed_audi(d, s), 'steps': lambda d, s, a: bed_steps(d, s),
    'night_kitchen': lambda d, s, a: bed_night_kitchen(d, s), 'lobby': lambda d, s, a: bed_lobby(d, s),
    'glass': lambda d, s, a: bed_glass(d, s), 'city': lambda d, s, a: bed_city(d, s),
    'warm_kitchen': lambda d, s, a: bed_warm_kitchen(d, s), 'cold': lambda d, s, a: bed_cold(d, s),
    'night_street': lambda d, s, a: bed_night_street(d, s, a), 'gov': lambda d, s, a: bed_gov(d, s, a),
    'rain': lambda d, s, a: bed_rain(d, s), 'dawn': lambda d, s, a: bed_dawn(d, s),
    'street': lambda d, s, a: bed_street(d, s),
}


def shot_index(prefix):
    return [i for i, s in enumerate(SHOTS) if s['id'].startswith(prefix)][0]


def build_ambience():
    amb = np.zeros((N, 2), dtype=np.float32)
    segs = []
    for gi, (a, b, name) in enumerate(GROUPS):
        sa, sb = SHOTS[shot_index(a)], SHOTS[shot_index(b)]
        segs.append(dict(name=name, s=sa['start'], e=sb['end'], xin=sa.get('xin', 0) or 0, seed=100 + gi))
    for i, g in enumerate(segs):
        prev_touch = i > 0 and abs(segs[i - 1]['e'] - g['s']) < 1e-6
        next_touch = i + 1 < len(segs) and abs(segs[i + 1]['s'] - g['e']) < 1e-6
        Lin = max(g['xin'], 0.04) if prev_touch else 0.4
        Lout = max(segs[i + 1]['xin'], 0.04) if next_touch else 0.4
        a = g['s'] - (Lin / 2 if prev_touch else 0.0)
        e = g['e'] + (Lout / 2 if next_touch else 0.0)
        d = e - a
        t_a = time.time()
        x = np.nan_to_num(BEDS[g['name']](d, g['seed'], a)[:n_of(d)])
        env = np.ones(len(x))
        ki = min(n_of(Lin) if prev_touch else n_of(0.35), len(x) // 2)
        ko = min(n_of(Lout) if next_touch else n_of(0.5), len(x) // 2)
        env[:ki] = np.sin(0.5 * np.pi * np.arange(ki) / ki)
        env[-ko:] = np.cos(0.5 * np.pi * np.arange(ko) / ko)
        place(amb, x * env[:, None] * db(BED_TRIM.get(g['name'], 0.0)), a)
        print(f'  bed {g["name"]:14s} {g["s"]:7.2f}-{g["e"]:7.2f}  ({time.time() - t_a:.1f}s)', flush=True)
    return amb


# ───────────────────────────── spot effects ─────────────────────────────

def build_spots():
    m = Mix()
    A = m.add

    # ---------- ACT 1 ----------
    for tag, a, b, end_kind in (('a1_01', ev('a1_01', 'flip'), ev('a1_01', 'slap'), 'slap'),
                                ('a7_02', ev('a7_02', 'flip'), ev('a7_02', 'tap'), 'tap')):
        A(a, piezo_alarm(b - a, 11), -24.0, -0.3, 'room', -14, 'broken piezo alarm', tag, 'flip->' + end_kind, duck=False)
        if end_kind == 'slap':
            A(b, S.layer(S.impact('thud', 1.9, 1.0, 0.25, 2), (S.impact('click', 0.55, 0.6, 0.3, 3), 0.0)), -22.0, -0.3, 'room', -14,
              'soft plastic thump', tag, 'slap')
            A(b - 0.02, S.rustle(0.35, 0.3, 40, 0.6, 5), -34.0, -0.4, 'room', -14, 'hand on table', tag, 'slap')
        else:
            A(b, S.impact('click', 0.8, 1.0, 0.3, 4), -26.0, -0.3, 'room', -14, 'gentle click', tag, 'tap')

    A(ev('a1_02', 'sit'), S.layer(creak(0.55, 160, 230, 7, 28), S.rustle(0.7, 0.2, 40, 0.8, 8)), -29.0, -0.2, 'room', -14,
      'bed creak + cloth', 'a1_02', 'sit')
    A(ev('a1_02', 'back'), S.layer(S.rustle(0.6, 0.25, 35, 0.8, 9), (creak(0.35, 150, 190, 10, 25), 0.05)), -32.0, -0.2, 'room', -14,
      'cloth / bed settles', 'a1_02', 'back')
    A(ev('a1_03', 'load'), S.ui('tick', 0.8), -26.0, 0.0, 'plate', -18, 'UI tick', 'a1_03', 'load')

    p = ev('a1_04', 'pop')
    A(p, S.layer(S.impact('spring', 0.9, 1.0, 0.4, 3), (S.impact('thud', 1.2, 0.5, 0.3, 4), 0.0)), -22.0, -0.4, 'room', -14, 'toaster spring clunk', 'a1_04', 'pop')
    A(p + 0.1, hiss(1.8, 2500, 8000, 0.9, 0.2, 5), -42.0, -0.4, 'room', -16, 'faint smoke sizzle', 'a1_04', 'pop+0.1')
    g0, g1 = cue_gap('a1_05')
    A(t0('a1_05') + 0.35, S.layer(clink(1, 2.6, 1.0), (clink(2, 2.2, 0.7), 0.17)), -30.0, 0.2, 'room', -14, 'spoon on bowl', 'a1_05', 'start+0.35')
    A((g0 + g1) / 2 - 0.1, clink(3, 2.4, 1.0), -33.0, 0.2, 'room', -14, 'spoon on bowl', 'a1_05', 'cue gap')
    A(t1('a1_05') - 0.45, clink(4, 2.5, 1.0), -32.0, 0.2, 'room', -14, 'spoon on bowl', 'a1_05', 'end-0.45')
    A(ev('a1_06', 'table'), S.layer(S.impact('paper', 1.0, 1.0, 0.5, 2), S.rustle(0.35, 0.5, 40, 0.7, 3)), -28.0, 0.15, 'room', -14, 'paper on table', 'a1_06', 'table')
    g = ev('a1_06', 'grab')
    A(g, lunchbox_rattle(5, 4, 0.3), -26.0, -0.4, 'room', -14, 'lunchbox rattle', 'a1_06', 'grab')
    A(g + 0.9, door_close(0.45, 6), -26.0, -0.7, 'hall', -14, 'door', 'a1_06', 'grab+0.9')

    c = [c for c in CUES if c['shot'].startswith('a1_07')][0]
    A(c['t0'] + 1.0, S.knock(0.9, 1.4, 0.7, 3), -28.0, 0.3, 'room', -16, 'knuckle tap on desk', 'a1_07', 'cue+1.0')
    A(c['t0'] + 1.38, S.knock(0.8, 1.4, 0.7, 4), -30.0, 0.3, 'room', -16, 'knuckle tap on desk', 'a1_07', 'cue+1.38')

    s0 = ev('a1_08', 'sputter')
    A(s0, engine_crank(1.5, 3), -22.0, -0.3, 'room', -16, 'engine cranks and dies', 'a1_08', 'sputter')
    A(s0 + 1.1, hiss(2.6, 1800, 7000, 1.4, 0.15, 7), -38.0, -0.2, 'room', -16, 'steam hiss', 'a1_08', 'sputter+1.1')
    A(ev('a1_08', 'reminder'), S.ui('notify', 0.9), -24.0, -0.1, 'hall', -16, 'phone chime', 'a1_08', 'reminder')
    steps(m, cadence(ev('a1_08', 'run'), t1('a1_08'), 0.27, 0.04, 2), 'run', -24.0, -0.5, 0.0, 'room', -14, 'a1_08', 'run', 3)

    d = ev('a1_09', 'door')
    A(d, door_open(3), -23.0, 0.3, 'big', -8, 'heavy latch + creak', 'a1_09', 'door')
    steps(m, cadence(d + 0.7, t1('a1_09'), 0.52, 0.04, 4), 'shoe', -26.0, 0.3, -0.1, 'big', -4, 'a1_09', 'door+0.7', 5, what='steps echoing')

    ar = ev('a1_10', 'arrive')
    steps(m, [ar - 0.9 + 0.3 * i for i in range(4)], 'shoe', -25.0, 0.1, -0.3, 'big', -10, 'a1_10', 'arrive', 6, fall=3.0, what='steps arriving')
    A(ev('a1_10', 'kneel'), S.layer(S.rustle(0.6, 0.25, 40, 0.8, 4), (S.impact('thud', 1.2, 0.35, 0.2, 5), 0.2)), -31.0, -0.3, 'big', -10, 'cloth, kneeling', 'a1_10', 'kneel')
    steps(m, cadence(ev('a1_10', 'walk'), t1('a1_10') + 0.2, 0.3, 0.05, 7), 'light', -31.0, 0.6, 0.35, 'big', -10, 'a1_10', 'walk', 8, what='her small steps')

    A(ev('a1_11', 'buzz'), S.buzz(0.4, 165.0, 2, 0.16, 0.6, 0.8, 2), -24.0, -0.2, 'room', -16, 'phone vibration on table', 'a1_11', 'buzz')
    for nm, f, pk in (('header', 1318.5, -30), ('line1', 1568.0, -32), ('line2', 1568.0, -32), ('button', 1760.0, -29)):
        A(ev('a1_12', nm), S.layer(S.blip(f, 0.12, 1.0, 'sine', 0.003, t60=0.2), (S.blip(f * 1.5, 0.12, 0.5, 'sine', 0.003, t60=0.15), 0.05)), pk, 0.0, 'plate', -16, 'cold UI tone', 'a1_12', nm)
    for nm in ('push', 'small'):
        A(ev('a1_12', nm), S.blip(2093.0, 0.08, 1.0, 'sine', 0.003, t60=0.12), -38.0, 0.0, 'plate', -16, 'tiny UI tone', 'a1_12', nm)

    # ---------- ACT 2 ----------
    for nm in ('beep1', 'beep2'):
        e = ev('a2_01', nm)
        A(e, error_beeps(), -25.0, 0.5, 'hall', -14, 'access reader error beeps', 'a2_01', nm)
        A(e + 0.2, S.layer(S.impact('thud', 0.9, 1.0, 0.45, 2), (S.impact('metal', 0.4, 0.4, 0.3, 3), 0.0)), -29.0, 0.3, 'hall', -14, 'turnstile clunk', 'a2_01', nm + '+0.2')
    ap0 = ev('a2_02', 'applause')
    apd = t1('a2_03') - ap0
    ap = S.lowpass(S.applause(apd, 70, 1.2, min(3.4, apd * 0.6), 3.8, 0.3, 0.8, 0.4, 3), 800.0, 4)
    A(ap0, ap, -27.0, 0.0, 'hall', -10, 'applause through glass (muffled)', 'a2_02', 'applause', duck=False)
    steps(m, cadence(t0('a2_04'), t1('a2_04'), 0.29, 0.04, 9), 'run', -23.0, -0.6, 0.6, 'room', -14, 'a2_04', 'start', 10, what='running on pavement')

    op = ev('a2_05', 'open')
    A(op, S.layer(S.impact('door', 1.0, 1.0, 0.7, 4), (S.impact('latch', 0.6, 0.6, 0.5, 5), 0.0)), -17.0, -0.3, 'room', -12, 'door bursts open', 'a2_05', 'open')
    stand = ev('a2_06', 'stand')
    w = water(stand - (op + 0.5), 4)
    w[-n_of(0.25):] *= np.linspace(1, 0, n_of(0.25))
    A(op + 0.5, w, -32.0, 0.5, 'room', -16, 'tap water running', 'a2_05', 'open+0.5')
    A(stand - 0.1, S.layer(creak(0.25, 900, 1200, 3, 90), (S.drip(1.0, 0.4, 4), 0.35)), -34.0, 0.5, 'room', -14, 'tap turned off + drip', 'a2_06', 'stand')
    for i, off in enumerate((0.7, 1.9, 3.3)):
        A(t0('a2_06') + off, S.layer(clink(i, 0.7, 1.0), (clink(i + 5, 0.9, 0.6), 0.2)), -30.0, 0.5, 'room', -14, 'wrench clink', 'a2_06', f'start+{off}')
    A(t0('a2_05') + 1.6, clink(9, 0.8, 1.0), -33.0, 0.5, 'room', -14, 'wrench clink', 'a2_05', 'start+1.6')
    A(ev('a2_10', 'close'), door_close(0.6, 8, latch=False), -24.0, 0.0, 'hall', -14, 'door closing softly', 'a2_10', 'close')
    A(ev('a2_10', 'lock'), S.layer(S.impact('latch', 0.6, 1.0, 0.3, 3), (S.impact('click', 0.7, 0.8, 0.5, 4), 0.09)), -25.0, 0.0, 'hall', -14, 'lock turning', 'a2_10', 'lock')

    # ---------- ACT 3 ----------
    rs, sw = ev('a3_01', 'raise'), ev('a3_02', 'sweep')
    rise = S.osc(S.curve([(0, 90), (sw - rs, 420)], sw - rs, 'exp'), shape='soft') * S.curve([(0, 0.2), (sw - rs, 1)], sw - rs)
    A(rs, S.lowpass(rise, 1600.0, 2), -28.0, 0.0, 'plate', -16, 'scanner rising hum', 'a3_01', 'raise->sweep', duck=False)
    se = ev('a3_02', 'sweepEnd')
    A(sw, sweep_tone(se - sw, 900.0, 2400.0), -30.0, 0.0, 'plate', -14, 'thin scanner sweep', 'a3_02', 'sweep')
    A(ev('a3_02', 'stamp'), S.lowpass(S.osc(140.0, 0.45, 'saw') * S.gate(0.45, 0, 0.4, 0.01, 0.05), 1300.0, 2), -27.0, 0.0, 'room', -18, "flat 'rejected' buzz", 'a3_02', 'stamp')
    for nm in ('check1', 'check2', 'check3'):
        A(ev('a3_03', nm), S.ui('tick', 0.8), -29.0, 0.4, 'plate', -16, 'soft confirm tick', 'a3_03', nm)
    A(t0('a3_03') + 0.2, keyboard(4.5, 2), -36.0, 0.5, 'room', -14, 'keyboard clatter', 'a3_03', 'start')
    A(ev('a3_03', 'slump'), S.layer(S.rustle(0.5, 0.2, 30, 0.8, 2), (S.impact('thud', 1.4, 0.3, 0.1, 6), 0.1)), -31.0, -0.1, 'hall', -12, 'hands slide off counter', 'a3_03', 'slump')
    A(ev('a3_04', 'stamp'), stamp_thud(3), -20.0, 0.0, 'hall', -14, 'rubber-stamp thud', 'a3_04', 'stamp')

    sl0, off, fl = t0('a3_05'), ev('a3_10', 'off'), ev('a3_10', 'flicker')
    h = S.hum(off - sl0 + 0.1, 100.0, 0.5, 0.3, -30.0, 3)
    h *= stutter_gate(len(h), fl - sl0, off - sl0, 4)
    h[n_of(off - sl0):] = 0
    A(sl0, S.lowpass(h, 2500.0, 2), -42.0, 0.35, None, 0, 'streetlight buzz', 'a3_05', 'start..off', duck=False)
    A(off, S.layer(S.blip(2400.0, 0.35, 1.0, 'sine', 0.001, t60=0.3), (S.impact('click', 1.0, 0.6, 0.4, 3), 0.0)), -28.0, 0.35, 'big', -8, "'tink' as it dies", 'a3_10', 'off')
    A(ev('a3_06', 'alert'), S.ui('deny', 0.9), -25.0, 0.0, 'plate', -16, "low double 'denied' tone", 'a3_06', 'alert')
    for nm in ('ring1', 'ring2'):
        A(ev('a3_07', nm), S.phone(S.ui('ring', 1.0)), -27.0, 0.0, None, 0, 'ringback burst', 'a3_07', nm)
    A(ev('a3_07', 'end'), blip_seq([480.0] * 3, 0.2, 0.11, 1.0, 'sine', 0.1), -26.0, 0.0, None, 0, '3 call-ended beeps', 'a3_07', 'end')

    ap0 = ev('a3_08', 'applause')
    apd = t1('a3_08') - ap0
    A(ap0, S.speaker(S.applause(apd, 50, 1.0, 1.2, 4.0, 0.5, 0.3, 0.2, 7).mean(axis=1), 5.0), -29.0, 0.0, None, 0, 'phone-speaker applause', 'a3_08', 'applause', duck=False)
    for i, ofs in enumerate((0.5, 1.3, 2.4)):
        A(ap0 + ofs, S.speaker(whistle(i), 3.0), -37.0, 0.0, None, 0, 'whistle (phone)', 'a3_08', f'applause+{ofs}', duck=False)
    for k, (tt_, g, fc) in enumerate(((t0('a3_09'), -33.0, 5000.0), (ev('a3_09', 'loop2'), -37.0, 3000.0), (ev('a3_09', 'loop3'), -42.0, 1700.0))):
        a = S.lowpass(S.speaker(S.applause(3.0, 50, 0.8, 1.0, 4.0, 0.5, 0.3, 0.2, 7).mean(axis=1), 5.0), fc, 4)
        A(tt_, a, g, 0.0, None, 0, f'looping phone applause #{k + 1} (duller)', 'a3_09', f'loop{k + 1}', duck=False)
    A(fl, S.impact('click', 1.3, 0.3, 0.5, 8), -36.0, 0.35, None, 0, 'flicker snap', 'a3_10', 'flicker')

    # ---------- ACT 4 ----------
    car = ev('a4_01', 'car')
    ca = car - 1.3
    A(ca, car_glide(car - ca, 2), -30.0, 0.0, 'room', -14, 'electric car glides in, stops', 'a4_01', 'car', duck=False, pan_c=np.linspace(0.9, 0.5, n_of(car - ca)))
    A(car + 0.85, S.layer(S.impact('door', 1.2, 1.0, 0.45, 3), (S.impact('latch', 0.6, 0.4, 0.3, 4), 0.03)), -24.0, 0.6, 'big', -10, 'car door thunk', 'a4_01', 'car+0.85')
    steps(m, [ev('a4_01', 'steps') + 0.42 * i for i in range(6)], 'heel', -22.0, 0.55, 0.15, 'big', -7, 'a4_01', 'steps', 11, fall=2.0, what='heels on wet pavement')
    for tag in ('a4_02', 'a4_04'):
        A(t0(tag), S.hum(t1(tag) - t0(tag), 120.0, 0.2, 0.2, -30.0, 5), -46.0, 0.0, None, 0, 'tablet hum', tag, 'start', duck=False)
    A(ev('a4_02', 'contract'), S.whoosh(0.35, 700.0, 1800.0, 1.0, 0.5, 0.5, 6), -30.0, 0.0, 'plate', -14, 'tablet slide', 'a4_02', 'contract')
    sg_, se_ = ev('a4_04', 'sign'), ev('a4_04', 'signEnd')
    A(sg_, scribble(se_ - sg_, 3), -35.0, 0.0, 'room', -18, 'stylus scribble', 'a4_04', 'sign..signEnd')
    A(ev('a4_04', 'drop'), S.layer(S.blip(1900.0, 0.06, 1.0, 'sine', 0.002, t60=0.1), S.drip(1.6, 0.4, 5)), -32.0, 0.0, 'plate', -14, 'tiny plip', 'a4_04', 'drop')
    A(ev('a4_04', 'confirm'), S.ui('confirm', 0.9), -28.0, 0.0, 'plate', -14, 'soft confirm tone', 'a4_04', 'confirm')

    # ---------- ACT 5 ----------
    A(ev('a5_01', 'knock'), S.knocks(3, 0.35, 0.8, 'knock', 1.0, 0.5, 2), -21.0, 0.0, 'hall', -12, 'three knocks', 'a5_01', 'knock')
    A(ev('a5_01', 'open'), door_open(7), -26.0, 0.1, 'hall', -12, 'door opens', 'a5_01', 'open')
    A(ev('a5_03', 'place'), S.layer(S.impact('metal', 0.55, 0.9, 0.3, 3), S.impact('thud', 1.3, 0.5, 0.2, 4), (S.rustle(0.18, 0.3, 40, 0.6, 5), 0.06)), -25.0, -0.1, 'room', -14, 'lunchbox set down + scrape', 'a5_03', 'place')
    A(ev('a5_04', 'lock'), S.blip(1760.0, 0.09, 1.0, 'sine', 0.002, t60=0.1), -29.0, 0.0, 'plate', -16, 'HUD lock-on blip', 'a5_04', 'lock')
    da, de = ev('a5_04', 'data'), ev('a5_04', 'dataEnd')
    A(da, data_stream(de - da, 4), -43.0, 0.0, None, 0, 'data tick stream', 'a5_04', 'data..dataEnd', duck=False)
    q, nr = ev('a5_04', 'query'), ev('a5_04', 'noresult')
    for i in range(int((nr - q) / 0.4)):
        A(q + 0.4 * i, S.blip(520.0 + 40 * i, 0.22, 1.0, 'sine', 0.05, t60=0.25), -37.0 + 2 * i, 0.0, 'plate', -12, 'searching pulse', 'a5_04', f'query+{0.4 * i:.1f}')
    A(nr, S.blip(150.0, 0.3, 1.0, 'sine', 0.01, t60=0.3), -26.0, 0.0, 'plate', -14, 'low dull blip', 'a5_04', 'noresult')
    A(ev('a5_05', 'open'), S.layer(S.impact('latch', 0.7, 0.9, 0.3, 3), (creak(0.5, 600, 800, 4), 0.1)), -27.0, 0.0, 'room', -14, 'clasp click + hinge creak', 'a5_05', 'open')
    A(ev('a5_05', 'unfold'), S.rustle(1.3, 0.35, 22, 0.8, 3), -29.0, 0.0, 'room', -14, 'paper unfolding', 'a5_05', 'unfold')
    fl5 = ev('a5_06', 'flicker')
    for i, o in enumerate((0.0, 0.14)):
        A(fl5 + o, S.layer(S.noise_burst(0.025, 2000, 7000, 0.001, 0.02, seed=i), S.blip(3100.0 + 500 * i, 0.03, 0.8, 'sine', 0.001)), -33.0, 0.0, 'plate', -16, 'digital stutter', 'a5_06', 'flicker' + ('' if i == 0 else '+0.14'))

    # ---------- ACT 6 ----------
    A(ev('a6_01', 'turn'), S.rustle(0.5, 0.25, 35, 0.8, 11), -33.0, -0.4, 'room', -14, 'cloth turn', 'a6_01', 'turn')
    s0, pa, hg = ev('a6_02', 'start'), ev('a6_02', 'pass'), ev('a6_02', 'hug')
    steps(m, cadence(s0, pa, 0.4, 0.05, 3) + cadence(pa + 0.7, hg, 0.4, 0.05, 4), 'bare', -28.0, 0.6, -0.3, 'room', -12, 'a6_02', 'start..hug', 12, what='small bare feet')
    A(hg, S.rustle(0.9, 0.3, 45, 0.9, 5), -31.0, -0.2, 'room', -12, 'cloth rustle (hug)', 'a6_02', 'hug')
    A(ev('a6_03', 'arms'), S.rustle(1.0, 0.25, 40, 0.9, 6), -31.0, -0.1, 'room', -12, 'cloth rustle', 'a6_03', 'arms')
    A(ev('a6_03', 'tight'), S.rustle(0.8, 0.2, 35, 0.8, 7), -33.0, -0.1, 'room', -12, 'cloth squeeze', 'a6_03', 'tight')
    A(ev('a6_04', 'phone'), S.layer(S.rustle(0.55, 0.35, 40, 0.8, 8), (S.impact('click', 0.6, 0.4, 0.3, 9), 0.5)), -30.0, 0.4, 'room', -14, 'phone drawn from pocket', 'a6_04', 'phone')
    A(ev('a6_05', 'press'), S.layer(S.impact('thud', 0.8, 1.0, 0.1, 2), S.blip(70.0, 0.25, 0.8, 'sine', 0.01, t60=0.3)), -25.0, 0.0, 'plate', -14, 'deep soft press', 'a6_05', 'press')
    cd, cl = ev('a6_05', 'countdown'), ev('a6_06', 'close')
    wh = synth_whine(cl - cd, 1700.0, 55.0)
    wh = wh * np.minimum(np.arange(len(wh)) / n_of(1.0), 1.0)
    wh[-n_of(0.2):] *= np.linspace(1, 0, n_of(0.2))
    A(cd, wh, -40.0, 0.0, 'plate', -16, 'falling electronic whine', 'a6_05', 'countdown->close')
    A(ev('a6_06', 'sit'), S.layer(creak(0.7, 220, 330, 5, 32), S.rustle(0.5, 0.2, 30, 0.7, 4), (S.impact('thud', 1.2, 0.4, 0.2, 5), 0.05)), -27.0, -0.2, 'room', -14, 'chair creak', 'a6_06', 'sit')
    chain = S.layer(*[(S.impact('metal', 2.6 + 0.2 * i, 0.5, 0.5, i), 0.07 * i + 0.02 * (i % 2)) for i in range(5)])
    A(cl + 0.35, chain, -36.0, 0.5, 'room', -12, 'lamp chain creak', 'a6_06', 'close+0.35')
    A(ev('a6_06', 'dark') - 0.05, S.impact('click', 0.7, 1.0, 0.4, 2), -31.0, 0.5, 'room', -12, 'lamp chain click', 'a6_06', 'dark')

    # ---------- ACT 7 ----------
    A(ev('a7_03', 'pop'), S.layer(S.impact('spring', 0.9, 1.0, 0.4, 5), (S.impact('thud', 1.2, 0.5, 0.3, 6), 0.0)), -23.0, -0.4, 'room', -14, 'toaster clean pop', 'a7_03', 'pop')
    A(ev('a7_03', 'five'), hand_slap(2), -24.0, 0.1, 'room', -14, 'hand slap (high five)', 'a7_03', 'five')
    A(ev('a7_03', 'exit'), door_close(0.45, 9), -26.0, -0.7, 'hall', -14, 'door', 'a7_03', 'exit')
    steps(m, cadence(t0('a7_04'), t1('a7_04'), 0.56, 0.04, 5), 'shoe', -27.0, -0.4, 0.2, 'room', -14, 'a7_04', 'start', 13, what='footsteps')
    A(ev('a7_04', 'buzz'), S.buzz(0.35, 190.0, 2, 0.16, 0.3, 0.6, 3), -27.0, -0.3, 'room', -16, 'phone vibration (pocket)', 'a7_04', 'buzz')
    for shot, names in (('a7_05', ('m1', 'm2', 'm3')), ('a7_08', ('m4', 'm5', 'm6'))):
        for nm in names:
            e = ev(shot, nm)
            A(e, S.layer(S.buzz(0.3, 170.0, 1, 0.1, 0.3, 0.7, 4), (S.ui('message', 0.7), 0.02)), -25.0, 0.0, 'plate', -16, 'message buzz', shot, nm, duck=False)
            A(e + 0.12, S.tick(1.0, 0.84, 5), -27.0, 0.0, 'plate', -16, "soft 'tock'", shot, nm + '+0.12', duck=False)
    pl, en = ev('a7_07', 'play'), ev('a7_07', 'end')
    rr = S.speaker(S.rain(en - pl, 0.55, 0.3, 0.5, 0.3, 21).mean(axis=1), 4.0)
    rr = rr * S.curve([(0, 0), (0.3, 1), (en - pl - 0.3, 1), (en - pl, 0)], en - pl)
    A(pl, rr, -32.0, 0.0, None, 0, 'video: rain on car roof (speaker)', 'a7_07', 'play..end')
    A(ev('a7_11', 'hold'), tap_haptic(1.0), -29.0, 0.0, None, 0, 'haptic tick', 'a7_11', 'hold')
    A(ev('a7_11', 'dialog'), S.whoosh(0.5, 300.0, 1400.0, 0.9, 0.6, 0.5, 3), -31.0, 0.0, 'plate', -14, 'soft whoosh', 'a7_11', 'dialog')
    A(ev('a7_11', 'tap'), S.ui('tap', 0.9), -24.0, 0.0, 'plate', -16, 'decisive tap', 'a7_11', 'tap')
    A(ev('a7_11', 'gone'), S.whoosh(0.35, 900.0, 3000.0, 1.0, 0.5, 0.5, 4), -30.0, 0.0, 'plate', -14, 'light swish', 'a7_11', 'gone')
    A(ev('a7_11', 'pocket'), S.layer(S.impact('latch', 0.7, 1.0, 0.3, 5), S.rustle(0.3, 0.3, 40, 0.5, 5)), -29.0, 0.4, 'room', -14, 'lock click', 'a7_11', 'pocket')
    ct = ev('a7_12', 'catch')
    steps(m, cadence(t0('a7_12') + 0.05, ct, 0.32, 0.04, 6), 'run', -24.0, -0.6, -0.15, 'room', -14, 'a7_12', 'start', 14, what='his running feet (heavy)')
    steps(m, cadence(t0('a7_12') + 0.7, ct, 0.22, 0.05, 7), 'light', -27.0, 0.7, 0.1, 'room', -14, 'a7_12', 'start+0.7', 15, what='her running feet (light)')
    A(t0('a7_12') + 0.3, S.rustle(max(0.5, ct - t0('a7_12') - 0.3), 0.3, 30, 0.5, 14), -37.0, 0.0, 'room', -14, 'cloth', 'a7_12', 'start', duck=False)
    A(ct, S.layer(S.impact('thud', 1.0, 1.0, 0.2, 7), S.rustle(0.5, 0.25, 40, 0.8, 15), (lunchbox_rattle(6, 4, 0.3), 0.05)), -24.0, -0.1, 'room', -14, 'knees thud + lunchbox rattle', 'a7_12', 'catch')
    return m


# ───────────────────────────── post: muffle, mask, mix ─────────────────────────────

def apply_muffle(amb):
    m3, look = ev('a7_05', 'm3'), ev('a7_09', 'look')
    a, b = m3 - 0.3, look + 1.5
    ia, ib = n_of(a), n_of(b)
    n = ib - ia
    t = np.arange(n) / SR + a
    ramp = np.clip((t - m3) / 1.5, 0, 1)
    fc = 18000.0 * (400.0 / 18000.0) ** ramp
    op = np.clip((t - look) / 0.15, 0, 1)
    fc = np.where(t >= look, 400.0 * (18000.0 / 400.0) ** op, fc)
    seg = S.lowpass_tv(np.asarray(amb[ia:ib], dtype=np.float64), fc, 2)
    pl, en = ev('a7_07', 'play'), ev('a7_07', 'end')
    seg *= np.interp(t, [pl - 0.3, pl, en, en + 0.4], [1.0, 0.12, 0.12, 1.0])[:, None]
    amb[ia:ib] = seg.astype(np.float32)
    # a bus passing in a7_06 (inside the muffled street)
    bs = t0('a7_06')
    bp = bus_pass(t1('a7_06') - bs + 0.4, 3)
    bp = S.reverb(pan_curve(pk_to(bp, -34.0), np.linspace(-0.8, 0.8, len(bp))), 'room', wet_db=-8.0, dry_db=0.0, tail=False)
    place(amb, S.lowpass(bp, 500.0, 2), bs - 0.2)
    # look: the real morning rushes back
    bd = S.birds(3.5, 1.0, 0.95, -42.0, 77)
    sw = S.room_tone(3.5, 'air', -50.0, seed=78)
    gg = (np.minimum(np.arange(len(bd)) / n_of(0.15), 1.0) * np.interp(np.arange(len(bd)) / SR, [0, 2.0, 3.5], [1, 1, 0]))[:, None]
    place(amb, (bd + sw) * gg, look)
    return amb


def silence_windows(x):
    wins = [(t0('title_main') + 0.6, t1('title_main')), (t0('a7_01') + 0.3, t1('a7_01')), (t1('a7_13'), DUR)]
    for a, b in wins:
        ia, ib = n_of(a), min(len(x), n_of(b))
        x[ia:ib] = 0
        if b != DUR:
            ja = max(0, ia - n_of(0.6))
            x[ja:ia] *= np.linspace(1, 0, ia - ja)[:, None]
    return x


def main():
    t_start = time.time()
    print('ambience beds:')
    amb = apply_muffle(build_ambience())
    print('spot effects:')
    m = build_spots()
    mix = amb.astype(np.float64) * db(AMB_TRIM) + m.buf.astype(np.float64)
    mix = silence_windows(mix)
    mix = S.dc_block(mix, 15.0)
    mix = silence_windows(np.nan_to_num(mix))
    mix = np.clip(mix, -0.7, 0.7)
    OUT.parent.mkdir(parents=True, exist_ok=True)
    S.save(OUT, mix.astype(np.float32))
    REVIEW.mkdir(parents=True, exist_ok=True)
    print('\nSPOT EFFECTS (shot, event, time, what, peak dBFS)')
    for shot, evn, t, what, pk in sorted(m.log, key=lambda r: r[2]):
        print(f'{shot:6s} {evn:22s} {t:8.2f}  {what:42s} {pk:6.1f}')
    print(f'\nrender time {time.time() - t_start:.1f}s')
    print(S.stats(mix))


if __name__ == '__main__':
    main()
