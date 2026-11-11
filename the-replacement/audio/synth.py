#!/usr/bin/env python3
"""THE REPLACEMENT — synthesis engine (numpy / scipy only).  Header docstring is finalised at the end of the build."""
import functools
import math
import re
import subprocess
import zlib
from pathlib import Path

import numpy as np
import scipy.fft as sfft
import scipy.signal as sg
import soundfile as sf
from scipy.ndimage import minimum_filter1d, uniform_filter1d

SR = 48000
TAU = 2.0 * np.pi
_LN1000 = 6.907755278982137          # exp(-_LN1000 * t / t60) is exactly -60 dB at t = t60


# ════════════════════════════════════════════════════════════════════════════
#  CORE HELPERS
# ════════════════════════════════════════════════════════════════════════════

def db(x):
    """Decibels → linear amplitude factor.  db(-6) ≈ 0.501, db(0) = 1."""
    y = 10.0 ** (np.asarray(x, dtype=np.float64) / 20.0)
    return float(y) if y.ndim == 0 else y


def to_db(x, floor=-200.0):
    """Linear amplitude → decibels (|x|, floored at `floor` dB)."""
    a = np.abs(np.asarray(x, dtype=np.float64))
    y = 20.0 * np.log10(np.maximum(a, 10.0 ** (floor / 20.0)))
    return float(y) if y.ndim == 0 else y


def midi(n):
    """MIDI note number → Hz (69 → 440).  Fractional numbers allowed."""
    y = 440.0 * 2.0 ** ((np.asarray(n, dtype=np.float64) - 69.0) / 12.0)
    return float(y) if y.ndim == 0 else y


_SEMI = {'C': 0, 'D': 2, 'E': 4, 'F': 5, 'G': 7, 'A': 9, 'B': 11}
_NOTE_RE = re.compile(r'^\s*([A-Ga-g])([#b♯♭]*)\s*(-?\d+)\s*$')


def note_midi(name):
    """Note name → MIDI number.  'C4' → 60, 'A4' → 69, 'F#3' → 54, 'Bb2' → 46."""
    m = _NOTE_RE.match(name)
    if not m:
        raise ValueError(f'bad note name {name!r}')
    semis = _SEMI[m.group(1).upper()]
    for ch in m.group(2):
        semis += 1 if ch in '#♯' else -1
    return 12 * (int(m.group(3)) + 1) + semis


def note(name):
    """Note name → Hz.  note('A4') = 440.0, note('D4') = 293.66, note('F#3') = 185.0."""
    return midi(note_midi(name))


def hz(x):
    """Anything pitch-like → Hz: a note name ('D4') or a number that already is Hz."""
    return note(x) if isinstance(x, str) else float(x)


def cents(c):
    """Cents → frequency ratio (cents(1200) = 2)."""
    return 2.0 ** (np.asarray(c, dtype=np.float64) / 1200.0)


def rng(seed=0, *salt):
    """Seeded numpy Generator.  `salt` (strings / ints) derives independent, reproducible sub-streams."""
    if isinstance(seed, np.random.Generator):
        if not salt:
            return seed
        seed = int(seed.integers(1 << 31))
    key = [int(seed) & 0x7FFFFFFF] + [zlib.crc32(str(s).encode()) for s in salt]
    return np.random.default_rng(key)


def n_of(dur):
    """Seconds → whole samples."""
    return max(0, int(round(float(dur) * SR)))


def tt(dur):
    """Time axis in seconds for `dur` seconds (or, if an int is given, that many samples)."""
    n = dur if isinstance(dur, (int, np.integer)) else n_of(dur)
    return np.arange(n) / SR


def to_stereo(x):
    """(N,) → (N,2) by duplication; (N,2) is returned unchanged."""
    x = np.asarray(x)
    return np.stack([x, x], axis=1) if x.ndim == 1 else x


def to_mono(x):
    """(N,2) → (N,) by averaging; (N,) is returned unchanged."""
    x = np.asarray(x)
    return x.mean(axis=1) if x.ndim == 2 else x


def _pan_gains(p):
    th = (np.clip(p, -1.0, 1.0) + 1.0) * (np.pi / 4.0)
    return np.cos(th), np.sin(th)


def pan(x, p=0.0):
    """Place a signal in the stereo field, p = -1 (left) … 0 … +1 (right) → (N,2).
    Mono: equal-power pan (centre = -3 dB in each channel).  Stereo: balance (centre = unchanged)."""
    x = np.asarray(x, dtype=np.float64)
    gl, gr = _pan_gains(p)
    if x.ndim == 1:
        return np.stack([x * gl, x * gr], axis=1)
    s2 = math.sqrt(2.0)
    return x * np.array([min(1.0, gl * s2), min(1.0, gr * s2)])


def width(x, w=1.0):
    """Mid/side width of a stereo signal: 0 = mono, 1 = unchanged, up to ~1.5 = wider."""
    x = to_stereo(np.asarray(x, dtype=np.float64))
    m = x.mean(axis=1, keepdims=True)
    return m + (x - m) * w


def fit(x, n):
    """Truncate or zero-pad to exactly n samples."""
    x = np.asarray(x)
    if len(x) >= n:
        return x[:n]
    pad_shape = (n - len(x),) + x.shape[1:]
    return np.concatenate([x, np.zeros(pad_shape, dtype=x.dtype)])


def normalize(x, peak_db=-1.0):
    """Scale so the absolute peak is `peak_db` dBFS (silence is returned unchanged)."""
    x = np.asarray(x, dtype=np.float64)
    pk = np.max(np.abs(x)) if x.size else 0.0
    return x * (db(peak_db) / pk) if pk > 0 else x


def layer(*parts):
    """Sum several signals of different lengths into one.  Each part is an array or a tuple
    (array, t_seconds[, gain_db]).  Result is mono if every part is mono, else stereo."""
    items = []
    for p in parts:
        if isinstance(p, tuple):
            a = np.asarray(p[0], dtype=np.float64)
            t0 = float(p[1]) if len(p) > 1 else 0.0
            g = db(p[2]) if len(p) > 2 else 1.0
        else:
            a, t0, g = np.asarray(p, dtype=np.float64), 0.0, 1.0
        items.append((a, n_of(t0), g))
    st = any(a.ndim == 2 for a, _, _ in items)
    n = max(i0 + len(a) for a, i0, _ in items)
    out = np.zeros((n, 2) if st else n)
    for a, i0, g in items:
        if st and a.ndim == 1:
            a = to_stereo(a)
        out[i0:i0 + len(a)] += a * g
    return out


def load(path):
    """Read a WAV → (float64 array (N,) or (N,2), sample_rate)."""
    x, sr = sf.read(str(path), dtype='float64', always_2d=False)
    return x, sr


def save(path, x, sr=SR):
    """Write a 32-bit float WAV (mono or stereo).  Creates parent directories."""
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    sf.write(str(path), np.asarray(x, dtype=np.float32), sr, subtype='FLOAT')
    return path


# ════════════════════════════════════════════════════════════════════════════
#  ENVELOPES AND CONTROL CURVES
# ════════════════════════════════════════════════════════════════════════════

def _rise(n):
    """Raised-cosine ramp 0 → 1 over n samples."""
    if n <= 0:
        return np.zeros(0)
    return 0.5 - 0.5 * np.cos(np.pi * (np.arange(n) + 0.5) / n)


def adsr(dur, a=0.01, d=0.15, s=0.7, r=0.3, curve=4.0):
    """Attack-decay-sustain-release envelope, length dur + r seconds.
    a: raised-cosine attack time; d: time for the exponential decay to settle on the sustain level s (0..1);
    key released at `dur`; r: release time (exponential, reaches -60 dB at r and exactly 0 at the end)."""
    n = n_of(dur + r)
    t = np.arange(n) / SR
    env = s + (1.0 - s) * np.exp(-np.maximum(t - a, 0.0) * curve / max(d, 1e-4))
    na = min(n, n_of(a))
    env[:na] *= _rise(na)
    nd = min(n, n_of(dur))
    if nd < n:
        rel = np.exp(-_LN1000 * (t[nd:] - dur) / max(r, 1e-4))
        k = max(1, (n - nd) // 8)
        rel[-k:] *= 1.0 - _rise(k)
        env[nd:] = env[nd - 1 if nd > 0 else 0] * rel
    return env


def exp_decay(dur, t60):
    """Exponential decay envelope starting at 1, -60 dB after t60 seconds; length dur seconds."""
    return np.exp(-_LN1000 * tt(dur) / max(t60, 1e-5))


def fade_in(x, t=0.01):
    """Raised-cosine fade-in over t seconds (returns a copy)."""
    y = np.array(x, dtype=np.float64)
    k = min(len(y), n_of(t))
    r = _rise(k)
    y[:k] *= r if y.ndim == 1 else r[:, None]
    return y


def fade_out(x, t=0.05):
    """Raised-cosine fade-out over the last t seconds (returns a copy)."""
    y = np.array(x, dtype=np.float64)
    k = min(len(y), n_of(t))
    if k:
        r = 1.0 - _rise(k)
        y[-k:] *= r if y.ndim == 1 else r[:, None]
    return y


def fade(x, t_in=0.01, t_out=0.05):
    """Fade in and out (raised cosine)."""
    return fade_out(fade_in(x, t_in), t_out)


def gate(dur, t_on, t_off, attack=0.02, release=0.1):
    """Smooth gate envelope of length dur: 0 → 1 over `attack` s starting at t_on, 1 → 0 over `release` s
    starting at t_off (raised-cosine edges, no clicks)."""
    t = tt(dur)
    up = np.clip((t - t_on) / max(attack, 1e-5), 0.0, 1.0)
    dn = np.clip((t - t_off) / max(release, 1e-5), 0.0, 1.0)
    return (0.5 - 0.5 * np.cos(np.pi * up)) * (0.5 + 0.5 * np.cos(np.pi * dn))


def curve(points, dur, shape='linear'):
    """Breakpoint curve sampled at audio rate.  points = [(t_seconds, value), …] (held flat outside).
    shape: 'linear', 'smooth' (cosine ease between points) or 'exp' (geometric — use for frequencies)."""
    pts = sorted((float(a), float(b)) for a, b in points)
    xs = np.array([p[0] for p in pts])
    ys = np.array([p[1] for p in pts])
    t = tt(dur)
    if shape == 'exp':
        return np.exp(np.interp(t, xs, np.log(np.maximum(ys, 1e-9))))
    if shape == 'smooth' and len(xs) > 1:
        i = np.clip(np.searchsorted(xs, t, side='right') - 1, 0, len(xs) - 2)
        u = np.clip((t - xs[i]) / np.maximum(xs[i + 1] - xs[i], 1e-9), 0.0, 1.0)
        u = 0.5 - 0.5 * np.cos(np.pi * u)
        return ys[i] + (ys[i + 1] - ys[i]) * u
    return np.interp(t, xs, ys)


def lfo(dur, rate=0.5, lo=0.0, hi=1.0, phase=0.0, shape='sine'):
    """Low-frequency oscillator, `rate` Hz, swinging lo..hi.  phase in cycles.  shape 'sine' or 'tri'."""
    ph = phase + rate * tt(dur)
    if shape == 'tri':
        u = 2.0 * np.abs(2.0 * (ph - np.floor(ph + 0.5)))
    else:
        u = 0.5 + 0.5 * np.sin(TAU * ph)
    return lo + (hi - lo) * u


def wander(dur, rate=0.2, lo=-1.0, hi=1.0, seed=0):
    """Smooth random curve (slow organic movement): a new random target about every 1/rate seconds,
    cosine-eased, values in lo..hi.  Typical: rate 0.05–0.5 Hz for filter / level drift."""
    n = dur if isinstance(dur, (int, np.integer)) else n_of(dur)
    r = rng(seed, 'wander')
    nk = int(math.ceil(n / SR * rate)) + 3
    knots = r.random(nk)
    sub = 24
    u = np.arange((nk - 1) * sub + 1) / sub
    i = np.minimum(u.astype(int), nk - 2)
    f = u - i
    f = 0.5 - 0.5 * np.cos(np.pi * f)
    ctrl = knots[i] + (knots[i + 1] - knots[i]) * f
    x = (np.arange(n) / SR * rate) + r.random()
    return lo + (hi - lo) * np.interp(x, u, ctrl)


# ════════════════════════════════════════════════════════════════════════════
#  FILTERS  (IIR, no bulk delay; zero_phase=True runs forward-backward for linear phase)
# ════════════════════════════════════════════════════════════════════════════

def _fc(f):
    return float(min(max(f, 5.0), 0.49 * SR))


def _run(sos, x, zero_phase=False):
    x = np.asarray(x, dtype=np.float64)
    if x.shape[0] == 0:
        return x.copy()
    if zero_phase:
        pad = min(3 * (2 * len(sos) + 1), x.shape[0] - 1)
        return sg.sosfiltfilt(sos, x, axis=0, padlen=pad)
    return sg.sosfilt(sos, x, axis=0)


def lp1(x, fc):
    """One-pole low-pass, 6 dB/oct (the gentlest darkening)."""
    a = math.exp(-TAU * _fc(fc) / SR)
    return sg.lfilter([1.0 - a], [1.0, -a], np.asarray(x, dtype=np.float64), axis=0)


def hp1(x, fc):
    """One-pole high-pass, 6 dB/oct."""
    x = np.asarray(x, dtype=np.float64)
    return x - lp1(x, fc)


def lowpass(x, fc, order=2, zero_phase=False):
    """Butterworth low-pass.  fc in Hz, order 1–8 (6·order dB/oct; doubled when zero_phase)."""
    return _run(sg.butter(order, _fc(fc), 'low', fs=SR, output='sos'), x, zero_phase)


def highpass(x, fc, order=2, zero_phase=False):
    """Butterworth high-pass."""
    return _run(sg.butter(order, _fc(fc), 'high', fs=SR, output='sos'), x, zero_phase)


def bandpass(x, lo, hi, order=2, zero_phase=False):
    """Butterworth band-pass between lo and hi Hz (order per edge)."""
    return _run(sg.butter(order, [_fc(lo), _fc(hi)], 'band', fs=SR, output='sos'), x, zero_phase)


def _biquad(kind, fc, q=0.7071, gain_db=0.0):
    """RBJ cookbook biquad as one SOS row."""
    w = TAU * _fc(fc) / SR
    cw, sw = math.cos(w), math.sin(w)
    A = 10.0 ** (gain_db / 40.0)
    al = sw / (2.0 * q)
    if kind == 'peak':
        b = [1 + al * A, -2 * cw, 1 - al * A]
        a = [1 + al / A, -2 * cw, 1 - al / A]
    elif kind == 'lowshelf':
        k = 2 * math.sqrt(A) * al
        b = [A * ((A + 1) - (A - 1) * cw + k), 2 * A * ((A - 1) - (A + 1) * cw), A * ((A + 1) - (A - 1) * cw - k)]
        a = [(A + 1) + (A - 1) * cw + k, -2 * ((A - 1) + (A + 1) * cw), (A + 1) + (A - 1) * cw - k]
    elif kind == 'highshelf':
        k = 2 * math.sqrt(A) * al
        b = [A * ((A + 1) + (A - 1) * cw + k), -2 * A * ((A - 1) + (A + 1) * cw), A * ((A + 1) + (A - 1) * cw - k)]
        a = [(A + 1) - (A - 1) * cw + k, 2 * ((A - 1) - (A + 1) * cw), (A + 1) - (A - 1) * cw - k]
    elif kind == 'bandpass':                      # constant 0 dB peak gain
        b = [al, 0.0, -al]
        a = [1 + al, -2 * cw, 1 - al]
    elif kind == 'notch':
        b = [1.0, -2 * cw, 1.0]
        a = [1 + al, -2 * cw, 1 - al]
    else:
        raise ValueError(kind)
    return np.array([[b[0] / a[0], b[1] / a[0], b[2] / a[0], 1.0, a[1] / a[0], a[2] / a[0]]])


def peak(x, fc, gain_db, q=1.0):
    """Peaking EQ bell: boost/cut gain_db at fc, bandwidth ~fc/q."""
    return _run(_biquad('peak', fc, q, gain_db), x)


def low_shelf(x, fc, gain_db, q=0.7071):
    """Low shelf: boost/cut everything below fc by gain_db."""
    return _run(_biquad('lowshelf', fc, q, gain_db), x)


def high_shelf(x, fc, gain_db, q=0.7071):
    """High shelf: boost/cut everything above fc by gain_db."""
    return _run(_biquad('highshelf', fc, q, gain_db), x)


def resonate(x, fc, q=4.0):
    """Resonant band-pass (2-pole, 0 dB at fc, bandwidth fc/q).  A 'body resonance' in one call."""
    return _run(_biquad('bandpass', fc, q), x)


def notch(x, fc, q=4.0):
    """Notch at fc."""
    return _run(_biquad('notch', fc, q), x)


def dc_block(x, fc=15.0):
    """Remove DC / sub-sonic drift (2nd-order high-pass at fc)."""
    return highpass(x, fc, 2)


def _as_curve(c, n):
    c = np.asarray(c, dtype=np.float64)
    if c.ndim == 0:
        return np.full(n, float(c))
    if len(c) == n:
        return c
    return np.interp(np.linspace(0, len(c) - 1, n), np.arange(len(c)), c)


def _tv_bank(x, cut, make_sos, per_octave):
    """Time-varying zero-phase filter: a bank of fixed filters on a log grid, cross-faded by the curve."""
    x = np.asarray(x, dtype=np.float64)
    n = x.shape[0]
    c = np.clip(_as_curve(cut, n), 10.0, 0.45 * SR)
    lo, hi = float(c.min()), float(c.max())
    if hi / lo < 1.03:
        return _run(make_sos(math.sqrt(lo * hi)), x, True)
    m = int(math.ceil(math.log2(hi / lo) * per_octave)) + 1
    grid = np.geomspace(lo, hi, m)
    pos = np.log(c / lo) / math.log(hi / lo) * (m - 1)
    y = np.zeros_like(x)
    for i, fc in enumerate(grid):
        w = np.clip(1.0 - np.abs(pos - i), 0.0, 1.0)
        nz = np.flatnonzero(w)
        if not len(nz):
            continue
        margin = int(SR * 12.0 / fc) + 512
        a, b = max(0, nz[0] - margin), min(n, nz[-1] + 1 + margin)
        yi = _run(make_sos(fc), x[a:b], True)
        ww = w[a:b]
        y[a:b] += yi * (ww if x.ndim == 1 else ww[:, None])
    return y


def lowpass_tv(x, cutoff, order=2, per_octave=4):
    """Time-varying low-pass.  cutoff: Hz per sample (any length — it is stretched to the signal — or a scalar).
    order 2 = 12 dB/oct, 4 = 24 dB/oct.  Zero-phase, click-free; use it for filter sweeps and slow movement."""
    half = max(1, int(order) // 2)
    return _tv_bank(x, cutoff, lambda f: sg.butter(half, _fc(f), 'low', fs=SR, output='sos'), per_octave)


def highpass_tv(x, cutoff, order=2, per_octave=4):
    """Time-varying high-pass (see lowpass_tv)."""
    half = max(1, int(order) // 2)
    return _tv_bank(x, cutoff, lambda f: sg.butter(half, _fc(f), 'high', fs=SR, output='sos'), per_octave)


def bandpass_tv(x, center, q=2.0, per_octave=6):
    """Time-varying resonant band-pass: centre-frequency curve in Hz, constant q (sweeps, whooshes)."""
    return _tv_bank(x, center, lambda f: _biquad('bandpass', f, q), per_octave)


# ════════════════════════════════════════════════════════════════════════════
#  OSCILLATORS
# ════════════════════════════════════════════════════════════════════════════

_TAB = 4096


@functools.lru_cache(maxsize=512)
def _wavetable(shape, nh):
    """One cycle (plus guard sample) of a band-limited waveform with nh harmonics, peak ≈ 1."""
    spec = np.zeros(_TAB // 2 + 1, dtype=np.complex128)
    h = np.arange(1, nh + 1)
    lanczos = np.sinc(h / (nh + 1.0))                     # tames Gibbs ripple
    if shape == 'saw':
        a = (2.0 / np.pi) / h
    elif shape == 'square':
        a = np.where(h % 2 == 1, (4.0 / np.pi) / h, 0.0)
    elif shape == 'tri':
        a = np.where(h % 2 == 1, (8.0 / np.pi ** 2) / h ** 2 * np.where((h // 2) % 2 == 0, 1.0, -1.0), 0.0)
    elif shape == 'soft':                                 # mellow reed-like: 1/h^2 all harmonics
        a = 1.0 / h ** 2
    else:
        raise ValueError(f'unknown osc shape {shape!r}')
    spec[h] = -0.5j * _TAB * a * lanczos
    tab = sfft.irfft(spec, _TAB)
    return np.concatenate([tab, tab[:1]])


def _table_read(tab, ph):
    """Read a (…, _TAB+1) wavetable at phase `ph` (cycles) with linear interpolation."""
    x = (ph - np.floor(ph)) * _TAB
    i = x.astype(np.int32)
    f = x - i
    a = tab[..., i]
    return a + (tab[..., i + 1] - a) * f


def osc(freq, dur=None, shape='sine', phase=0.0, fmax=6000.0):
    """Band-limited oscillator → mono, peak ≈ 1 (scale it down!).
    freq: Hz / note name (then `dur` seconds) or a per-sample frequency array (glides, sirens).
    shape: 'sine' | 'tri' | 'soft' | 'saw' | 'square'.  Harmonics above fmax Hz are never generated
    (default 6 kHz keeps synthetic waves from sounding buzzy; lower it for darker tones)."""
    if isinstance(freq, np.ndarray):
        f = freq.astype(np.float64)
    else:
        f = np.full(n_of(dur), hz(freq))
    if not len(f):
        return np.zeros(0)
    ph = phase + (np.cumsum(f) - f[0]) / SR
    if shape == 'sine':
        return np.sin(TAU * ph)
    nh = max(1, min(_TAB // 4, int(fmax / max(float(f.max()), 1.0))))
    return _table_read(_wavetable(shape, nh), ph)


_IMP = np.zeros(SR * 30)
_IMP[0] = 1.0


def _ring(n, f, sigma, amp=1.0, phase=0.0):
    """amp · exp(-sigma·t) · sin(2π f t + phase) for n samples — an exactly computed 2-pole resonator
    impulse response (≈ 5 ns/sample, decay included)."""
    global _IMP
    if n > len(_IMP):
        _IMP = np.zeros(n)
        _IMP[0] = 1.0
    w = TAU * f / SR
    r = math.exp(-sigma / SR)
    b = [amp * math.sin(phase), amp * r * math.sin(w - phase)]
    a = [1.0, -2.0 * r * math.cos(w), r * r]
    return sg.lfilter(b, a, _IMP[:n])


# ════════════════════════════════════════════════════════════════════════════
#  NOISE
# ════════════════════════════════════════════════════════════════════════════

def _colored(n, slope, seed, f_lo=20.0):
    """Gaussian noise with a 1/f^slope power spectrum (flat below f_lo), unit RMS."""
    if n <= 0:
        return np.zeros(0)
    r = rng(seed, 'noise')
    x = r.standard_normal(n)
    if slope == 0:
        return x
    nf = sfft.next_fast_len(n, real=True)
    X = sfft.rfft(x, nf)
    f = sfft.rfftfreq(nf, 1.0 / SR)
    X *= np.maximum(f, f_lo) ** (-slope / 2.0)
    X[0] = 0.0
    y = sfft.irfft(X, nf)[:n]
    return y / (np.sqrt(np.mean(y * y)) + 1e-30)


def noise(dur, color='white', seed=0, stereo=False):
    """Gaussian noise, RMS 0.1 (-20 dBFS).  color: 'white' (flat), 'pink' (-3 dB/oct), 'brown' (-6 dB/oct).
    stereo=True returns two decorrelated channels (N,2)."""
    slope = {'white': 0, 'pink': 1, 'brown': 2}[color]
    n = n_of(dur)
    if stereo:
        return 0.1 * np.stack([_colored(n, slope, rng(seed, 'L')), _colored(n, slope, rng(seed, 'R'))], axis=1)
    return 0.1 * _colored(n, slope, seed)


def white(dur, seed=0, stereo=False):
    """White noise, RMS -20 dBFS."""
    return noise(dur, 'white', seed, stereo)


def pink(dur, seed=0, stereo=False):
    """Pink noise (-3 dB/oct), RMS -20 dBFS.  The natural-sounding default for air, hiss, rain."""
    return noise(dur, 'pink', seed, stereo)


def brown(dur, seed=0, stereo=False):
    """Brown noise (-6 dB/oct), RMS -20 dBFS.  Rumble, distant traffic, wind."""
    return noise(dur, 'brown', seed, stereo)


def noise_burst(dur=0.05, lo=500.0, hi=4000.0, attack=0.001, t60=None, color='white', seed=0):
    """A band-passed noise burst with a fast attack and exponential decay → mono, peak 0.5.
    dur: total length s; lo/hi: band edges Hz; t60: decay time (default = dur)."""
    n = n_of(dur)
    x = _colored(n, {'white': 0, 'pink': 1, 'brown': 2}[color], seed)
    x = bandpass(x, lo, hi, 2)
    x *= exp_decay(dur, t60 if t60 else dur)
    k = min(n, n_of(attack))
    x[:k] *= _rise(k)
    return normalize(fade_out(x, min(dur * 0.3, 0.01)), -6.0)


# ════════════════════════════════════════════════════════════════════════════
#  REVERB
# ════════════════════════════════════════════════════════════════════════════

REVERBS = {
    # rt60 s (mid band), predelay s, hf/lf: RT multiplier at 4 kHz / 125 Hz, lp/hp: tone of the wet signal (Hz),
    # er: early-reflection level 0..1, er_time: span of the early reflections s, build: onset time of the diffuse tail s
    'room':  dict(rt60=0.40, predelay=0.002, hf=0.60, lf=1.00, lp=8000.0, hp=100.0, er=1.0, er_time=0.022, build=0.004),
    'hall':  dict(rt60=2.20, predelay=0.018, hf=0.45, lf=1.10, lp=6500.0, hp=120.0, er=0.6, er_time=0.080, build=0.030),
    'big':   dict(rt60=4.50, predelay=0.035, hf=0.32, lf=1.15, lp=3200.0, hp=90.0,  er=0.3, er_time=0.120, build=0.090),
    'plate': dict(rt60=1.60, predelay=0.000, hf=0.70, lf=0.90, lp=8000.0, hp=180.0, er=0.0, er_time=0.0,   build=0.003),
}
_IR_CACHE = {}


def make_ir(rt60=2.2, predelay=0.018, hf=0.45, lf=1.1, lp=6500.0, hp=120.0, er=0.6, er_time=0.08, build=0.03, seed=1):
    """Synthesize a stereo reverb impulse response (M,2): exponentially decaying Gaussian noise in 9 octave
    bands (each with its own decay time, so highs die first), preceded by sparse, slightly smeared early
    reflections.  Each channel has unit energy, so the wet signal of steady noise is as loud as the dry.
      rt60     decay time of the mid band, s (0.3 small room … 5 cathedral)
      predelay gap before the reverb starts, s (0–0.04)
      hf, lf   decay-time multipliers at 4 kHz and at 125 Hz (hf 0.3 = dark, damped; 0.7 = bright plate)
      lp, hp   low-pass / high-pass of the whole wet signal, Hz
      er       early-reflection level 0..1; er_time: time span of the reflections, s
      build    time the diffuse tail takes to swell in, s (longer = softer, more distant)"""
    r = rng(seed, 'ir')
    rt_long = rt60 * max(lf, 1.0)
    n = n_of(rt_long * 1.35 + 0.05)
    t = np.arange(n) / SR
    centers = 62.5 * 2.0 ** np.arange(9)

    def rt_at(f):
        if f <= 700.0:
            return rt60 * lf ** min(1.0, math.log2(700.0 / f) / math.log2(700.0 / 125.0))
        return rt60 * hf ** (math.log2(f / 700.0) / math.log2(4000.0 / 700.0))

    nf = sfft.next_fast_len(n, real=True)
    fr = sfft.rfftfreq(nf, 1.0 / SR)
    pos = np.clip(np.log2(np.maximum(fr, 1.0) / 62.5), 0.0, len(centers) - 1.0)
    onset = np.ones(n)
    k = min(n, n_of(build))
    onset[:k] = _rise(k)
    out = np.zeros((n, 2))
    for ch in range(2):
        X = sfft.rfft(r.standard_normal(n), nf)
        for b, fc in enumerate(centers):
            w = np.clip(1.0 - np.abs(pos - b), 0.0, 1.0)
            band = sfft.irfft(X * w, nf)[:n]
            out[:, ch] += band * np.exp(-_LN1000 * t / rt_at(fc))
        out[:, ch] *= onset
        out[:, ch] /= math.sqrt(np.sum(out[:, ch] ** 2))
        if er > 0 and er_time > 0:
            ne = n_of(er_time + 0.012)
            ntap = int(8 + er_time * 220)
            times = np.sort(r.uniform(0.0025, er_time, ntap))
            g = r.choice([-1.0, 1.0], ntap) * (0.4 + 0.6 * r.random(ntap)) * (0.006 / (0.006 + times)) ** 0.8
            buf = np.zeros(ne)
            np.add.at(buf, (times * SR).astype(int), g)
            ks = n_of(0.006)
            smear = r.standard_normal(ks) * np.exp(-np.arange(ks) / (0.0011 * SR))
            e = np.convolve(buf, smear)[:ne]
            e *= 0.5 * er / math.sqrt(np.sum(e * e))
            out[:ne, ch] += e
    out = highpass(out, hp, 2)
    out = lowpass(out, lp, 2)
    k = n // 6
    out[-k:] *= (1.0 - _rise(k))[:, None]
    out /= np.sqrt(np.sum(out * out, axis=0))
    if predelay > 0:
        out = np.concatenate([np.zeros((n_of(predelay), 2)), out])
    return out


def get_ir(kind='hall'):
    """The cached impulse response (M,2) of a named reverb: 'room' | 'hall' | 'big' | 'plate'."""
    if kind not in _IR_CACHE:
        if kind not in REVERBS:
            raise ValueError(f'unknown reverb {kind!r} (have {sorted(REVERBS)})')
        _IR_CACHE[kind] = make_ir(**REVERBS[kind], seed=1 + sorted(REVERBS).index(kind))
    return _IR_CACHE[kind]


def _conv(x, h):
    f = sg.oaconvolve if len(x) > 3 * len(h) else sg.fftconvolve
    return f(x, h.astype(x.dtype, copy=False))


def reverb(x, kind='hall', wet_db=0.0, dry_db=None, tail=True, ir=None, crossfeed=0.3):
    """Convolution reverb → stereo (N + tail, 2), or exactly (N, 2) with tail=False.
      kind    'room' (0.4 s, small and close) | 'hall' (2.2 s, warm) | 'big' (4.5 s, dark, distant) |
              'plate' (1.6 s, smooth, no echoes); or pass your own ir=make_ir(…)
      wet_db  level of the reverberated signal (0 dB = unit-energy IR)
      dry_db  None → 100 % wet (use on a send bus); a number → the dry signal is mixed in at that level
              (e.g. dry_db=0, wet_db=-14 for a touch of space)
      Mono input is spread to decorrelated left/right tails; stereo input keeps its image."""
    h = get_ir(kind) if ir is None else np.asarray(ir)
    x = np.asarray(x)
    if x.dtype != np.float32:
        x = x.astype(np.float64, copy=False)
    n = x.shape[0]
    if n == 0:
        return np.zeros((0, 2), dtype=x.dtype)
    if x.ndim == 1:
        xl = xr = x
    else:
        g = 1.0 / math.sqrt(1.0 + crossfeed * crossfeed)
        xl = (x[:, 0] + crossfeed * x[:, 1]) * g
        xr = (x[:, 1] + crossfeed * x[:, 0]) * g
    w = db(wet_db)
    out = np.stack([_conv(xl, h[:, 0]), _conv(xr, h[:, 1])], axis=1) * x.dtype.type(w)
    if dry_db is not None:
        out[:n] += to_stereo(x) * x.dtype.type(db(dry_db))
    return out if tail else out[:n]


# ════════════════════════════════════════════════════════════════════════════
#  TRACK — a stereo buffer you drop events into, with built-in reverb send buses
# ════════════════════════════════════════════════════════════════════════════

class Track:
    """A stereo float32 mix buffer of fixed length with reverb send buses.

        tr = Track(duration)                                   # duration in seconds (film length for a stem)
        tr.add(piano('D4', 2.0, 0.5), t=12.3, gain_db=-6, pan=-0.2, send='hall', send_db=-10)
        tr.send(glass('A5'), t=40.0, kind='big', gain_db=-18)   # reverb only (no dry)
        tr.save('audio/out/music.wav')                          # dry + all reverbs, exactly `duration` long

    .data          the dry (N,2) float32 buffer — read or modify it in place (tr.data *= 0.5)
    .buses         {kind: (N,2) float32} what has been sent to each reverb
    .add(signal, t, gain_db=0, pan=0, send=None, send_db=-12)
                   mix a mono (N,) or stereo (N,2) signal in at time t seconds.  pan -1..+1 (equal power for
                   mono: centre is -3 dB per channel; balance for stereo).  Anything outside the buffer is
                   clipped off.  send='hall' also feeds that reverb at gain_db + send_db (post-fader);
                   send={'hall': -10, 'big': -20} feeds several.  Cost: O(len(signal)).
    .send(signal, t, kind='hall', gain_db=0, pan=0)   feed a reverb bus only
    .render()      → (N,2) float32: dry + every bus through its reverb (tails cut at the end of the track)
    .save(path)    write render() as 32-bit float WAV;  .save(path, wet=False) writes the dry buffer only
    .mix_in(other, gain_db=0)   add another Track (dry and buses) into this one
    .apply(fn)     replace the dry buffer by fn(data) (e.g. lambda d: lowpass(d, 3000))
    .peak_db(), .lufs()   measurements of render()"""

    def __init__(self, duration, name=''):
        self.duration = float(duration)
        self.n = int(round(self.duration * SR))
        self.name = name
        self.data = np.zeros((self.n, 2), dtype=np.float32)
        self.buses = {}
        self.irs = {}

    def set_reverb(self, kind, ir):
        """Register a custom impulse response (from make_ir) under a bus name of your choice."""
        self.irs[kind] = np.asarray(ir)
        return self

    def _bus(self, kind):
        if kind not in self.buses:
            if kind not in self.irs and kind not in REVERBS:
                raise ValueError(f'unknown reverb bus {kind!r} (have {sorted(REVERBS) + sorted(self.irs)})')
            self.buses[kind] = np.zeros((self.n, 2), dtype=np.float32)
        return self.buses[kind]

    def _mix(self, buf, sig, t, g, p):
        sig = np.asarray(sig)
        i0 = int(round(float(t) * SR))
        s0, s1 = max(0, -i0), min(len(sig), self.n - i0)
        if s1 <= s0:
            return
        seg = sig[s0:s1]
        a, b = i0 + s0, i0 + s1
        gl, gr = _pan_gains(p)
        if seg.ndim == 1:
            buf[a:b, 0] += seg * (g * gl)
            buf[a:b, 1] += seg * (g * gr)
        else:
            s2 = math.sqrt(2.0)
            buf[a:b, 0] += seg[:, 0] * (g * min(1.0, gl * s2))
            buf[a:b, 1] += seg[:, 1] * (g * min(1.0, gr * s2))

    def add(self, signal, t=0.0, gain_db=0.0, pan=0.0, send=None, send_db=-12.0):
        g = db(gain_db)
        self._mix(self.data, signal, t, g, pan)
        if send:
            sends = send if isinstance(send, dict) else {send: send_db}
            for kind, sdb in sends.items():
                self._mix(self._bus(kind), signal, t, g * db(sdb), pan)
        return self

    def send(self, signal, t=0.0, kind='hall', gain_db=0.0, pan=0.0):
        self._mix(self._bus(kind), signal, t, db(gain_db), pan)
        return self

    def mix_in(self, other, gain_db=0.0):
        g = np.float32(db(gain_db))
        m = min(self.n, other.n)
        self.data[:m] += other.data[:m] * g
        for kind, buf in other.buses.items():
            if kind in other.irs and kind not in self.irs:
                self.irs[kind] = other.irs[kind]
            self._bus(kind)[:m] += buf[:m] * g
        return self

    def apply(self, fn):
        y = np.asarray(fn(self.data))
        self.data = fit(to_stereo(y), self.n).astype(np.float32)
        return self

    def render(self, wet=True):
        out = self.data.copy()
        if wet:
            for kind, buf in self.buses.items():
                if not buf.any():
                    continue
                out += reverb(buf, kind, tail=False, ir=self.irs.get(kind)).astype(np.float32, copy=False)
        return out

    def save(self, path, wet=True):
        return save(path, self.render(wet))

    def peak_db(self):
        return to_db(np.max(np.abs(self.render()))) if self.n else -200.0

    def lufs(self):
        return lufs(self.render())


# ════════════════════════════════════════════════════════════════════════════
#  INSTRUMENTS
# ════════════════════════════════════════════════════════════════════════════

@functools.lru_cache(maxsize=1)
def _soundboard_ir():
    """A short, dark, dense 'wooden box' response used to give the piano a body."""
    n = n_of(0.30)
    r = rng(7, 'soundboard')
    t = np.arange(n) / SR
    lo = lowpass(r.standard_normal(n), 420.0, 2) * np.exp(-_LN1000 * t / 0.28)
    mid = bandpass(r.standard_normal(n), 420.0, 1600.0, 2) * np.exp(-_LN1000 * t / 0.14)
    hi = bandpass(r.standard_normal(n), 1600.0, 4500.0, 2) * np.exp(-_LN1000 * t / 0.06)
    h = lo * 1.0 + mid * 0.8 + hi * 0.35
    h[:48] *= _rise(48)
    h = highpass(h, 70.0, 2)
    return h / math.sqrt(np.sum(h * h))


def _piano_gain(f0):
    """Per-key level trim (dB) so that equal velocity gives roughly equal loudness across the keyboard."""
    x = math.log2(f0 / 261.63)
    return float(np.interp(x, [-3.0, -2.0, -1.0, 0.0, 1.0, 2.0, 3.0], [0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]))


def piano(freq, dur=None, vel=0.5, felt=0.7, detune=1.5, noise=0.5, body=0.3, seed=0):
    """FELT PIANO — the film's main voice.  → mono.  (Docs in the module header.)"""
    f0 = hz(freq)
    vel = float(np.clip(vel, 0.02, 1.0))
    felt = float(np.clip(felt, 0.0, 1.0))
    keyc = int(round(1200.0 * math.log2(f0 / 440.0)))
    rk = np.random.default_rng([0x51A0, keyc + 100000])          # the instrument: fixed per key
    rn = rng(seed, 'piano-note', keyc)                            # the performance: varies with seed

    # ── partial frequencies: stiff-string stretch  f_k = k f0 sqrt(1 + B k²)
    B = float(np.clip(3.0e-4 * (f0 / 261.63) ** 1.7, 6.0e-5, 0.012))
    fmax = 9000.0
    kk = np.arange(1, int(fmax / f0) + 2, dtype=np.float64)
    fk = kk * f0 * np.sqrt(1.0 + B * kk * kk)
    keep = fk < fmax
    kk, fk = kk[keep], fk[keep]

    # ── partial amplitudes: 1/k string spectrum × felt-hammer low-pass × strike-position comb
    fc = 1500.0 * (1.0 - 0.62 * felt) * (0.35 + 1.65 * vel ** 1.2) * (f0 / 261.63) ** 0.45
    amp = kk ** -0.9 / (1.0 + (fk / fc) ** 2) ** 1.5
    amp *= 0.3 + 0.7 * np.abs(np.sin(np.pi * kk / 7.6))
    amp *= 10.0 ** (rk.normal(0.0, 1.4, len(kk)) / 20.0)
    amp[0] = max(amp[0], 0.7 * amp.max())
    keep = amp > amp.max() * 1e-4
    kk, fk, amp = kk[keep], fk[keep], amp[keep]

    # ── decay: T60 of the fundamental's aftersound, faster for higher partials
    T1 = float(np.clip(9.0 * (f0 / 130.81) ** -0.6, 1.0, 16.0)) * (1.0 - 0.25 * felt)
    b3 = 1.6e-7 * (1.0 + 2.0 * felt)
    sig = (_LN1000 / T1) * (1.0 + 0.18 * (kk - 1.0)) + b3 * fk * fk

    # ── strings per key and their unison detuning (cents) — fixed per key
    ns = 1 if f0 < 68.0 else (2 if f0 < 185.0 else 3)
    if ns == 3:
        comp = [(0.50, 2.6), (0.32, 1.25), (0.18, 0.62)]            # (amplitude share, decay-rate multiplier)
    elif ns == 2:
        comp = [(0.62, 2.3), (0.38, 0.70)]
    else:
        comp = [(0.70, 2.0), (0.30, 0.75)]
    dcen = rk.normal(0.0, detune, len(comp)) if ns > 1 else np.zeros(len(comp))
    dcen -= dcen.mean()
    pj = rk.normal(0.0, 0.25, (len(kk), len(comp)))                 # tiny per-partial mistuning, cents

    # ── length
    tau_r = float(np.clip(0.085 * (261.63 / f0) ** 0.5, 0.035, 0.30))    # damper time constant
    ring = min(24.0, T1 / 0.62 * 1.12)
    damped = dur is not None and f0 < 1500.0 and dur < ring
    total = (dur + 7.5 * tau_r) if damped else (ring if dur is None else min(ring, max(dur, 0.2) + 0.3))
    if dur is not None and not damped and f0 >= 1500.0:
        total = ring
    n = n_of(total)
    y = np.zeros(n)
    amax = float(amp.max())
    for i in range(len(kk)):
        for c, (share, mult) in enumerate(comp):
            a = amp[i] * share
            s = sig[i] * mult
            tcut = math.log(max(a / (amax * 3.0e-5), 1.0001)) / s
            m = min(n, n_of(tcut) + 96)
            y[:m] += _ring(m, fk[i] * 2.0 ** ((dcen[c] + pj[i, c]) / 1200.0), s, a)
    y /= math.sqrt(float(np.sum(amp * amp)))

    # ── felt-softened onset
    ta = (0.003 + 0.010 * felt * (1.0 - 0.6 * vel)) * float(np.clip((261.63 / f0) ** 0.25, 0.6, 1.6))
    na = min(n, n_of(ta))
    y[:na] *= _rise(na)

    # ── action noise: low thump + felt/wood knock (relatively louder when playing softly)
    if noise > 0:
        nm = min(n, n_of(0.16))
        tm = np.arange(nm) / SR
        thf = 62.0 + 30.0 * rn.random() + 14.0 * float(np.clip(math.log2(f0 / 261.63), -2, 2))
        thump = np.sin(TAU * thf * tm) * np.exp(-tm / 0.020) * (1.0 - np.exp(-tm / 0.0025))
        nz = lowpass(rn.standard_normal(nm), 320.0, 2) * np.exp(-tm / 0.014)
        nz /= np.max(np.abs(nz)) + 1e-12
        kn = bandpass(rn.standard_normal(nm), 450.0, 1700.0, 2) * np.exp(-tm / 0.0055)
        kn[:96] *= _rise(96)
        kn /= np.max(np.abs(kn)) + 1e-12
        mech = thump * 1.0 + nz * 0.5 + kn * (0.30 + 0.25 * vel)
        y[:nm] += mech * (0.11 * noise * 2.0 * vel ** -0.6)
    # ── soundboard / cabinet
    if body > 0:
        wetb = sg.fftconvolve(y, _soundboard_ir())[:n]
        y = y + wetb * (0.55 * body)
    y = low_shelf(y, 240.0, 1.5)
    y = highpass(y, 26.0, 2)
    y = lowpass(y, 7500.0, 2)

    # ── damper
    if damped:
        nd = n_of(dur)
        tr = np.arange(n - nd) / SR
        y[nd:] *= np.exp(-tr / tau_r)
        if noise > 0 and n - nd > 2400:                              # the soft thup of the damper landing
            nk = 2400
            tk = np.arange(nk) / SR
            dn = lowpass(rn.standard_normal(nk), 260.0, 2) * np.exp(-tk / 0.012) * (1.0 - np.exp(-tk / 0.003))
            dn /= np.max(np.abs(dn)) + 1e-12
            y[nd:nd + nk] += dn * (0.012 * noise * 2.0 * vel ** -0.6)
    k = min(n, 480)
    y[-k:] *= 1.0 - _rise(k)
    return y * (0.42 * vel ** 1.5 * db(_piano_gain(f0)))


def piano_pan(freq, spread=0.35):
    """A natural stereo position for a piano note: bass a little left, treble a little right (±spread)."""
    return float(np.clip(math.log2(hz(freq) / 261.63) / 3.0, -1.0, 1.0)) * spread


def music_box(freq, dur=None, vel=0.6, bright=0.5, seed=0):
    """MUSIC BOX tine → mono.  (Docs in the module header.)"""
    f0 = hz(freq)
    vel = float(np.clip(vel, 0.02, 1.0))
    r = rng(seed, 'mbox', int(round(f0)))
    f0 *= 2.0 ** (r.normal(0.0, 2.5) / 1200.0)                      # each tine is a hair out of tune
    T = float(np.clip(2.6 * (880.0 / f0) ** 0.6, 0.6, 4.5))
    ring = T * 1.15
    n = n_of(ring if dur is None else min(ring, max(dur, 0.05)))
    parts = [  # ratio, level, T60 multiplier
        (1.0, 1.0, 1.0),
        (2.0, 0.13 + 0.06 * bright, 0.55),
        (3.0, 0.03 + 0.03 * bright, 0.32),
        (6.27, 0.05 + 0.14 * bright, 0.10),
    ]
    y = np.zeros(n)
    for ratio, lev, tm in parts:
        f = f0 * ratio
        if f > 8000.0:
            continue
        lev *= 10.0 ** (r.normal(0.0, 1.0) / 20.0)
        s = _LN1000 / (T * tm)
        m = min(n, n_of(11.5 / s) + 64)
        y[:m] += _ring(m, f, s, lev)
    y[:48] *= _rise(48)
    nc = min(n, n_of(0.006))
    ck = bandpass(r.standard_normal(nc), 1800.0, 6000.0, 2) * np.exp(-np.arange(nc) / (0.0009 * SR))
    ck /= np.max(np.abs(ck)) + 1e-12
    y[:nc] += ck * (0.05 + 0.10 * bright)
    y = peak(y, 950.0, 2.0, 0.8)
    y = lowpass(y, 8500.0, 2)
    k = min(n, 960 if dur is None else 2400)
    y[-k:] *= 1.0 - _rise(k)
    return y * (0.38 * vel ** 1.25)


def glass(freq, dur=None, vel=0.5, attack=0.008, shimmer=0.6, bright=0.5, width=0.7, seed=0):
    """GLASS bell — the sound of the Program → stereo (mono if width=0).  (Docs in the module header.)"""
    f0 = hz(freq)
    vel = float(np.clip(vel, 0.02, 1.0))
    r = rng(seed, 'glass', int(round(f0)))
    T = float(np.clip(7.0 * (440.0 / f0) ** 0.35, 2.5, 10.0))
    ring = T * 1.12
    rel = 0.6
    damped = dur is not None and dur + rel < ring
    n = n_of(dur + rel if damped else ring)
    ratios = [1.0, 2.32, 4.25, 6.63, 9.38]
    levels = [0.0, -9.0, -16.0, -23.0, -30.0]
    tmult = [1.0, 0.72, 0.50, 0.36, 0.26]
    out = np.zeros((n, 2))
    for i, (ra, lv, tm) in enumerate(zip(ratios, levels, tmult)):
        f = f0 * ra
        if f > 7500.0:
            break
        a = db(lv * (1.5 - bright))
        s = _LN1000 / (T * tm)
        m = min(n, n_of(11.5 / s) + 64)
        split = shimmer * r.uniform(0.25, 1.0) * (1.0 + 0.35 * i)           # Hz between the two halves of the mode
        pa = r.uniform(0.0, TAU)
        ya = _ring(m, f - split / 2.0, s, a * 0.6, 0.0)
        yb = _ring(m, f + split / 2.0, s * r.uniform(0.9, 1.15), a * 0.4, pa * 0.15)
        p = width * (0.5 + 0.5 * r.random()) * (1 if i % 2 == 0 else -1)
        gl, gr = _pan_gains(-p)
        out[:m, 0] += ya * gl * 1.414
        out[:m, 1] += ya * gr * 1.414
        gl, gr = _pan_gains(p)
        out[:m, 0] += yb * gl * 1.414
        out[:m, 1] += yb * gr * 1.414
    # FM 'ping': a brief glassy transient
    fm_ratio = 3.5
    if f0 * fm_ratio * 2.0 < 9000.0 and bright > 0:
        m = min(n, n_of(0.9))
        tm_ = np.arange(m) / SR
        idx = 1.8 * vel * bright * 2.0 * np.exp(-tm_ / 0.045)
        ping = np.sin(TAU * f0 * tm_ + idx * np.sin(TAU * f0 * fm_ratio * tm_)) - np.sin(TAU * f0 * tm_)
        ping *= np.exp(-tm_ / 0.13) * 0.5
        out[:m] += ping[:, None]
    na = min(n, max(8, n_of(attack)))
    out[:na] *= _rise(na)[:, None]
    if damped:
        nd = n_of(dur)
        out[nd:] *= np.exp(-_LN1000 * (np.arange(n - nd) / SR) / rel)[:, None]
    out = lowpass(out, 8500.0, 2)
    k = min(n, 1920)
    out[-k:] *= (1.0 - _rise(k))[:, None]
    out *= 0.30 * vel ** 1.2
    return out if width > 0 else out.mean(axis=1)


_PAD_KINDS = {
    # fc_lo/fc_hi: range the filter moves in (Hz); layers: (pitch ratio, gain); breath: airy noise level
    'warm': dict(fc_lo=420.0, fc_hi=1500.0, layers=[(1.0, 1.0)], breath=0.0, top=4400.0),
    'sub':  dict(fc_lo=130.0, fc_hi=380.0, layers=[(1.0, 0.7), (0.5, 1.0)], breath=0.0, top=1500.0),
    'air':  dict(fc_lo=1000.0, fc_hi=2800.0, layers=[(1.0, 0.7), (2.0, 0.45)], breath=0.05, top=4600.0),
}


@functools.lru_cache(maxsize=512)
def _pad_tables(nh, ratio_lo, ratio_hi):
    """Two single-cycle saw tables (dark, bright) whose harmonics follow a 12 dB/oct low-pass at
    ratio_lo / ratio_hi times the fundamental (ratios in 1/100)."""
    h = np.arange(1, nh + 1, dtype=np.float64)
    tabs = []
    for ratio in (ratio_lo / 100.0, ratio_hi / 100.0):
        a = (1.0 / h) / np.sqrt(1.0 + (h / ratio) ** 4)
        spec = np.zeros(_TAB // 2 + 1, dtype=np.complex128)
        spec[1:nh + 1] = -0.5j * _TAB * a
        tab = sfft.irfft(spec, _TAB)
        tabs.append(np.concatenate([tab, tab[:1]]))
    return np.stack(tabs)


def pad(freqs, dur, vel=0.5, kind='warm', attack=2.0, release=3.0, voices=5, detune=9.0, move=0.5,
        width=0.9, cutoff=None, seed=0):
    """Ensemble PAD (detuned filtered saws) → stereo, length dur + release.  (Docs in the module header.)"""
    P = _PAD_KINDS[kind]
    fc_lo, fc_hi = (P['fc_lo'], P['fc_hi']) if cutoff is None else (
        (cutoff, cutoff) if np.isscalar(cutoff) else (float(cutoff[0]), float(cutoff[1])))
    top = P['top']
    fl = [hz(f) for f in (freqs if isinstance(freqs, (list, tuple, np.ndarray)) else [freqs])]
    vel = float(np.clip(vel, 0.02, 1.0))
    r = rng(seed, 'pad', kind)
    n = n_of(dur + release)
    t = np.arange(n) / SR
    env = np.ones(n)
    na = min(n_of(min(attack, dur)), n)
    env[:na] = _rise(na) ** 1.5 if na else 1.0
    nd = n_of(dur)
    env[nd:] = (0.5 + 0.5 * np.cos(np.pi * np.arange(n - nd) / max(1, n - nd))) ** 1.5 * (env[nd - 1] if nd > 0 else 1.0)
    # filter movement 0..1: breathes slowly and opens with the swell
    mv = np.clip(0.45 + 0.55 * move * wander(n, 0.09, -1.0, 1.0, r), 0.0, 1.0) * (0.3 + 0.7 * env)
    out = np.zeros((n, 2))
    streams = 0
    for f in fl:
        for ratio, lg in P['layers']:
            fn = f * ratio
            nh = max(1, min(_TAB // 4, int(top / fn)))
            tabs = _pad_tables(nh, int(round(100.0 * fc_lo / fn)) or 1, int(round(100.0 * fc_hi / fn)) or 1)
            for v in range(voices):
                spread = ((v / (voices - 1)) * 2.0 - 1.0) if voices > 1 else 0.0
                det = detune * spread * (0.7 + 0.3 * r.random()) + r.normal(0.0, detune * 0.12)
                drift = wander(n, r.uniform(0.08, 0.3), -3.0, 3.0, r)
                fv = fn * 2.0 ** ((det + drift) / 1200.0)
                ph = r.random() + np.cumsum(fv) / SR
                a, b = _table_read(tabs, ph)
                s = a + (b - a) * mv
                s *= lg * (0.75 + 0.5 * r.random()) * (1.0 + 0.18 * wander(n, r.uniform(0.1, 0.25), -1.0, 1.0, r))
                pv = width * (spread * 0.9 + r.uniform(-0.1, 0.1)) * (1 if (streams % 2 == 0) else -1)
                gl, gr = _pan_gains(pv)
                out[:, 0] += s * gl
                out[:, 1] += s * gr
                streams += 1
    out /= math.sqrt(max(1, streams))
    if P['breath'] > 0:
        br = _colored(n, 1, rng(r, 'breathL')), _colored(n, 1, rng(r, 'breathR'))
        br = bandpass(np.stack(br, axis=1), 1300.0, 3600.0, 2)
        out += br * (P['breath'] * (0.6 + 0.4 * mv))[:, None]
    out *= env[:, None]
    out = highpass(out, 30.0, 2)
    out = _run(sg.butter(4, min(top + 300.0, 4700.0), 'low', fs=SR, output='sos'), out, True)
    k = min(n, 480)
    out[-k:] *= (1.0 - _rise(k))[:, None]
    return out * (1.9 * vel ** 1.3)


def drone(freq, dur, vel=0.5, dark=0.6, attack=3.0, release=4.0, move=0.5, breath=0.4, width=0.9, seed=0):
    """Low evolving DRONE → stereo, length exactly dur (fades inside).  (Docs in the module header.)"""
    f0 = hz(freq)
    vel = float(np.clip(vel, 0.02, 1.0))
    r = rng(seed, 'drone')
    n = n_of(dur)
    t = np.arange(n) / SR
    br = 1.0 - dark
    parts = [(0.5, 0.55), (1.0, 1.0), (1.5, 0.10 * br), (2.0, 0.42 * (0.4 + 0.6 * br)),
             (3.0, 0.22 * br + 0.03), (4.0, 0.14 * br), (5.0, 0.08 * br)]
    out = np.zeros((n, 2))
    for ratio, lev in parts:
        if lev < 1e-3 or f0 * ratio > 2500.0:
            continue
        for j in range(3):
            d = (j - 1) * r.uniform(0.0008, 0.0030) + r.normal(0.0, 0.0003)
            f = f0 * ratio * (1.0 + d)
            a = lev * (0.25 + 0.75 * (0.5 + 0.5 * move * wander(n, r.uniform(0.04, 0.12), -1.0, 1.0, r)
                                      + 0.5 * (1.0 - move)))
            s = np.sin(TAU * f * t + r.uniform(0.0, TAU)) * a
            gl, gr = _pan_gains(width * r.uniform(-1.0, 1.0))
            out[:, 0] += s * gl
            out[:, 1] += s * gr
    out *= 0.45
    if breath > 0:
        nz = np.stack([_colored(n, 1, rng(r, 'bL')), _colored(n, 1, rng(r, 'bR'))], axis=1)
        cut = f0 * (3.0 + 5.0 * br) * (1.0 + 0.6 * move * wander(n, 0.06, -1.0, 1.0, r))
        nz = lowpass_tv(highpass(nz, f0 * 1.5, 2), cut, 2)
        out += nz * (0.10 * breath)
    env = np.ones(n)
    na = min(n, n_of(attack))
    env[:na] = _rise(na) ** 1.5
    nr = min(n, n_of(release))
    if nr:
        env[-nr:] *= (1.0 - _rise(nr)) ** 1.5
    out *= env[:, None]
    out = lowpass(highpass(out, 22.0, 2), 2600.0, 2)
    return out * (0.55 * vel ** 1.2)


def sub_hit(dur=2.5, freq=40.0, drop=1.9, vel=0.8, thump=0.5, seed=0):
    """Deep soft IMPACT → mono, length dur.  (Docs in the module header.)"""
    n = n_of(dur)
    t = np.arange(n) / SR
    r = rng(seed, 'subhit')
    f = hz(freq) * (1.0 + (drop - 1.0) * np.exp(-t / 0.075))
    ph = TAU * np.cumsum(f) / SR
    y = np.sin(ph) + 0.22 * np.sin(2.0 * ph) * np.exp(-t / 0.14)
    y *= np.exp(-_LN1000 * t / dur)
    na = min(n, n_of(0.007))
    y[:na] *= _rise(na)
    if thump > 0:
        m = min(n, n_of(0.5))
        tn = np.arange(m) / SR
        nz = lowpass(r.standard_normal(m), 150.0, 2) * np.exp(-tn / 0.07) * (1.0 - np.exp(-tn / 0.004))
        nz /= np.max(np.abs(nz)) + 1e-12
        y[:m] += nz * (0.55 * thump)
    y = lowpass(y, 260.0, 2)
    k = max(1, n // 6)
    y[-k:] *= 1.0 - _rise(k)
    return y * (0.6 * float(np.clip(vel, 0.02, 1.0)) ** 1.2)


def pluck(freq, dur=1.2, vel=0.6, damp=0.5, seed=0):
    """Muted Karplus-Strong PLUCK → mono, length dur.  (Docs in the module header.)"""
    f0 = hz(freq)
    vel = float(np.clip(vel, 0.02, 1.0))
    r = rng(seed, 'pluck', int(round(f0)))
    n = n_of(dur)
    P = SR / f0
    s = 0.5                                                   # loop low-pass: 2-tap average (delay s samples)
    L = int(math.floor(P - s - 1e-9))
    d = P - s - L                                             # fractional delay 0..1 (linear interpolation)
    c = np.convolve([1.0 - d, d], [1.0 - s, s])               # 3 taps at delays L, L+1, L+2
    t60 = max(0.08, dur * (1.0 - 0.45 * damp))
    rho = 10.0 ** (-3.0 * P / (SR * t60))
    y = np.zeros(n + L + 3)
    off = L + 3                                               # y[off + k] is output sample k
    burst = r.standard_normal(L)
    burst = lowpass(burst, min(0.4 * SR, f0 * (2.5 + 9.0 * vel * (1.0 - 0.7 * damp))), 2, zero_phase=True)
    burst -= burst.mean()
    burst *= np.hanning(L + 2)[1:-1] ** 0.25
    burst /= np.max(np.abs(burst)) + 1e-12
    y[off:off + L] = burst[:min(L, n)] if n >= L else burst[:n]
    for a in range(0, n, L):
        b = min(n, a + L)
        i0, i1 = off + a, off + b
        y[i0:i1] += rho * (c[0] * y[i0 - L:i1 - L] + c[1] * y[i0 - L - 1:i1 - L - 1] + c[2] * y[i0 - L - 2:i1 - L - 2])
    y = y[off:off + n]
    y = lowpass(y, min(0.4 * SR, f0 * (6.0 + 10.0 * (1.0 - damp))), 1)
    y = highpass(y, max(30.0, f0 * 0.5), 2)
    na = min(n, 96)
    y[:na] *= _rise(na)
    k = max(1, min(n // 4, 4800))
    y[-k:] *= 1.0 - _rise(k)
    return y * (0.45 * vel ** 1.2)


def modal(freqs, t60s, gains, contact=0.001, noise_level=0.0, noise_band=(300.0, 3000.0), noise_t60=0.03,
          lp=None, seed=0):
    """Generic struck-object synthesizer → mono, unnormalised.  (Docs in the module header.)"""
    freqs = np.atleast_1d(np.asarray(freqs, dtype=np.float64))
    t60s = np.broadcast_to(np.asarray(t60s, dtype=np.float64), freqs.shape)
    gains = np.broadcast_to(np.asarray(gains, dtype=np.float64), freqs.shape)
    r = rng(seed, 'modal')
    dur = max(float(t60s.max()) * 1.25, noise_t60 * 1.25 if noise_level > 0 else 0.0) + 0.02
    n = n_of(dur)
    y = np.zeros(n)
    for f, t6, g in zip(freqs, t60s, gains):
        if f >= 0.45 * SR:
            continue
        m = min(n, n_of(t6 * 1.25) + 32)
        y[:m] += _ring(m, f, _LN1000 / t6, g, np.pi / 2.0)
    if noise_level > 0:
        m = min(n, n_of(noise_t60 * 1.25))
        nz = bandpass(r.standard_normal(m), noise_band[0], noise_band[1], 2)
        nz *= np.exp(-_LN1000 * np.arange(m) / SR / noise_t60)
        nz /= np.max(np.abs(nz)) + 1e-12
        y[:m] += nz * (noise_level * float(np.sum(np.abs(gains))) * 0.5)
    w = max(3, 2 * n_of(contact) + 1)
    p = np.hanning(w + 2)[1:-1]
    y = np.convolve(y, p / p.sum())[:n]
    if lp:
        y = lowpass(y, lp, 2)
    y = highpass(y, 30.0, 1)
    k = max(1, n // 5)
    y[-k:] *= 1.0 - _rise(k)
    return y


IMPACTS = {
    # freqs Hz, t60 s, gains, contact s (hardness), noise level, noise band Hz, noise t60 s, lp Hz
    'knock':   dict(f=[118, 205, 340, 560, 910], t=[0.11, 0.09, 0.06, 0.04, 0.03], g=[1.0, 0.7, 0.5, 0.25, 0.12], c=0.0016, nl=0.15, nb=(300, 2500), nt=0.015, lp=3500),
    'thud':    dict(f=[62, 96, 150, 230], t=[0.16, 0.12, 0.08, 0.05], g=[1.0, 0.8, 0.4, 0.2], c=0.005, nl=0.25, nb=(80, 600), nt=0.03, lp=900),
    'click':   dict(f=[1900, 3100, 4600], t=[0.012, 0.008, 0.005], g=[1.0, 0.6, 0.3], c=0.00025, nl=0.3, nb=(1500, 6000), nt=0.004, lp=7000),
    'tap':     dict(f=[900, 1700, 2600], t=[0.020, 0.012, 0.008], g=[1.0, 0.5, 0.25], c=0.0008, nl=0.1, nb=(800, 4000), nt=0.006, lp=5000),
    'wood':    dict(f=[420, 1150, 1950, 2900, 4100], t=[0.035, 0.030, 0.020, 0.012, 0.007], g=[0.5, 1.0, 0.6, 0.3, 0.12], c=0.00035, nl=0.1, nb=(1000, 5000), nt=0.004, lp=6000),
    'door':    dict(f=[48, 85, 130, 210, 420, 760], t=[0.35, 0.25, 0.18, 0.10, 0.05, 0.03], g=[1.0, 0.9, 0.6, 0.4, 0.2, 0.1], c=0.004, nl=0.4, nb=(100, 1500), nt=0.06, lp=2500),
    'latch':   dict(f=[1300, 2450, 3900, 5200], t=[0.05, 0.04, 0.025, 0.015], g=[1.0, 0.7, 0.4, 0.2], c=0.0003, nl=0.2, nb=(2000, 6000), nt=0.006, lp=7500),
    'metal':   dict(f=[640, 1180, 1730, 2590, 3480], t=[0.25, 0.18, 0.12, 0.08, 0.05], g=[1.0, 0.7, 0.5, 0.3, 0.15], c=0.0005, nl=0.1, nb=(1500, 5000), nt=0.006, lp=6000),
    'stamp':   dict(f=[70, 120, 190, 420], t=[0.20, 0.14, 0.09, 0.04], g=[1.0, 0.8, 0.5, 0.25], c=0.003, nl=0.6, nb=(200, 2500), nt=0.025, lp=3000),
    'step':    dict(f=[80, 150, 320, 700], t=[0.07, 0.05, 0.03, 0.02], g=[1.0, 0.7, 0.4, 0.2], c=0.003, nl=0.5, nb=(300, 3000), nt=0.02, lp=3500),
    'heel':    dict(f=[220, 950, 1900, 2800], t=[0.04, 0.02, 0.012, 0.008], g=[0.6, 1.0, 0.6, 0.3], c=0.0005, nl=0.3, nb=(1000, 5000), nt=0.008, lp=6000),
    'clap':    dict(f=[1100, 1900], t=[0.012, 0.008], g=[0.5, 0.3], c=0.0004, nl=1.6, nb=(700, 4500), nt=0.014, lp=6500),
    'spring':  dict(f=[180, 410, 980, 1460, 2150], t=[0.12, 0.30, 0.22, 0.15, 0.10], g=[1.0, 0.6, 0.5, 0.35, 0.2], c=0.001, nl=0.3, nb=(500, 4000), nt=0.02, lp=5000),
    'paper':   dict(f=[300], t=[0.03], g=[0.25], c=0.002, nl=3.0, nb=(800, 5000), nt=0.035, lp=6000),
}


def impact(kind='knock', pitch=1.0, vel=0.7, hardness=0.5, seed=0):
    """One struck / dropped / clicked object → mono, peak = 0.6·vel.  (Docs in the module header.)"""
    P = IMPACTS[kind]
    r = rng(seed, 'impact', kind)
    f = np.array(P['f'], dtype=np.float64) * pitch * (1.0 + r.normal(0.0, 0.02, len(P['f'])))
    g = np.array(P['g'], dtype=np.float64) * 10.0 ** (r.normal(0.0, 1.5, len(P['g'])) / 20.0)
    hard = 2.0 ** (2.0 * (hardness - 0.5))
    g *= hard ** (np.arange(len(g)) * 0.35)                   # harder hits excite the upper modes more
    y = modal(f, np.array(P['t']) / math.sqrt(pitch), g, contact=P['c'] / hard, noise_level=P['nl'],
              noise_band=(P['nb'][0] * pitch, P['nb'][1] * pitch), noise_t60=P['nt'], lp=P['lp'] * min(2.0, hard) * pitch ** 0.5,
              seed=r)
    return normalize(y, to_db(0.6 * float(np.clip(vel, 0.02, 1.0))))


def knock(vel=0.6, pitch=1.0, hardness=0.5, seed=0):
    """A knuckle knock on a wooden door → mono."""
    return impact('knock', pitch, vel, hardness, seed)


def thud(vel=0.6, pitch=1.0, hardness=0.4, seed=0):
    """A soft heavy thud (hand on a clock, a body sitting down, a box set on a table) → mono."""
    return impact('thud', pitch, vel, hardness, seed)


def click(vel=0.5, pitch=1.0, hardness=0.5, seed=0):
    """A small switch / button click → mono."""
    return impact('click', pitch, vel, hardness, seed)


def knocks(count=3, interval=0.26, vel=0.5, kind='knock', pitch=1.0, hardness=0.5, seed=0):
    """A humanised series of impacts (default: three soft knocks) → mono.
    interval: seconds between hits (±6 % jitter); later hits are slightly softer."""
    r = rng(seed, 'knocks')
    parts, t = [], 0.0
    for i in range(count):
        v = vel * (1.0 - 0.07 * i) * (1.0 + r.normal(0.0, 0.05))
        parts.append((impact(kind, pitch * (1.0 + r.normal(0.0, 0.012)), v, hardness, rng(r, i)), t))
        t += interval * (1.0 + r.normal(0.0, 0.06))
    return layer(*parts)


def tick(vel=0.5, pitch=1.0, seed=0):
    """A soft wooden clock TICK → mono, ~60 ms, peak 0.25·vel.  Use pitch≈0.84 for the 'tock'."""
    y = impact('wood', pitch, 1.0, 0.45, seed)
    return y * (0.25 * float(np.clip(vel, 0.02, 1.0)) / 0.6)


# ════════════════════════════════════════════════════════════════════════════
#  GRANULAR ENGINE + FOLEY / AMBIENCE
# ════════════════════════════════════════════════════════════════════════════

def scatter(n, idx, amp, pans, cls, kernels):
    """Granular engine: place len(idx) grains → stereo (n,2).  Costs two FFTs per kernel, however many grains.
      n       output length in samples
      idx     start sample of each grain (int array)
      amp     amplitude of each grain
      pans    pan of each grain, -1..1
      cls     which kernel each grain uses (int array, 0..len(kernels)-1)
      kernels list of mono arrays (the grain waveforms)"""
    idx = np.asarray(idx, dtype=np.int64)
    amp = np.asarray(amp, dtype=np.float64)
    cls = np.asarray(cls, dtype=np.int64)
    ok = (idx >= 0) & (idx < n)
    idx, amp, cls = idx[ok], amp[ok], cls[ok]
    gl, gr = _pan_gains(np.broadcast_to(np.asarray(pans, dtype=np.float64), ok.shape)[ok])
    klen = max(len(k) for k in kernels)
    nf = sfft.next_fast_len(n + klen, real=True)
    acc = np.zeros((2, nf // 2 + 1), dtype=np.complex128)
    for k, kern in enumerate(kernels):
        m = cls == k
        if not m.any():
            continue
        KF = sfft.rfft(kern, nf)
        for ch, g in ((0, gl), (1, gr)):
            buf = np.bincount(idx[m], weights=amp[m] * g[m], minlength=n)
            acc[ch] += sfft.rfft(buf, nf) * KF
    return sfft.irfft(acc, nf, axis=1)[:, :n].T.copy()


def _rms_norm(x, target_db):
    rms = math.sqrt(float(np.mean(np.square(x)))) if x.size else 0.0
    return x * (db(target_db) / rms) if rms > 0 else x


def applause(dur=6.0, people=40, swell=1.0, fade=2.5, rate=3.8, bright=0.5, width=0.8, room=0.3, seed=0):
    """Granular crowd APPLAUSE → stereo, exactly dur.  (Docs in the module header.)"""
    r = rng(seed, 'applause')
    n = n_of(dur)
    P = max(1, int(people))
    fade = min(fade, dur * 0.8)
    swell = min(swell, dur * 0.5)
    t_on = swell * r.beta(1.4, 2.6, P)
    t_off = np.maximum((dur - fade) + fade * r.beta(1.3, 2.6, P), t_on + 0.4)
    rates = np.clip(r.normal(rate, 0.55, P), 2.0, 6.0)
    level = np.exp(r.normal(0.0, 0.40, P))
    pans = r.uniform(-width, width, P)
    K = int(np.clip(2 * P, 8, 48))
    pcls = r.integers(0, K // 2, P)
    M = int(dur * 6.5) + 4
    iv = (1.0 / rates)[:, None] * (1.0 + 0.07 * r.standard_normal((P, M)))
    times = t_on[:, None] + np.cumsum(iv, axis=1) - iv[:, :1]
    left = t_off[:, None] - times
    valid = left > 0
    ampl = level[:, None] * 10.0 ** (r.normal(0.0, 1.5, (P, M)) / 20.0)
    ampl *= np.clip(left / 0.9, 0.3, 1.0) ** 0.8                         # people tire before they stop
    ampl *= np.clip((times - t_on[:, None]) / 0.35 + 0.5, 0.5, 1.0)      # first claps are tentative
    cls = (pcls[:, None] * 2 + r.integers(0, 2, (P, M))) % K
    idx = (times * SR).astype(np.int64)
    klen = n_of(0.06)
    tk = np.arange(klen) / SR
    kernels = []
    for k in range(K):
        fc = float(np.clip(math.exp(r.normal(math.log(1100.0 + 1100.0 * bright), 0.35)), 550.0, 3800.0))
        q = r.uniform(0.9, 2.2)
        tau = r.uniform(0.0025, 0.0065)
        nz = r.standard_normal(klen) * np.exp(-tk / tau)
        nz[:16] *= _rise(16)
        kern = resonate(nz, fc, q) + 0.35 * lowpass(nz, 500.0, 2) + 0.15 * nz
        kern = lowpass(kern, 5000.0 + 3000.0 * bright, 2)
        kern[-240:] *= 1.0 - _rise(240)
        kernels.append(kern / math.sqrt(np.sum(kern * kern)))
    pp = np.broadcast_to(pans[:, None], (P, M))
    out = scatter(n, idx[valid], ampl[valid], pp[valid], cls[valid], kernels)
    out = highpass(out, 160.0, 2)
    if room > 0:
        out = reverb(out, 'room', wet_db=to_db(room), dry_db=0.0, tail=False)
    # level: loudest 1-second window at -20 dBFS RMS
    w = min(n, SR)
    p2 = np.convolve(np.mean(out * out, axis=1), np.ones(w) / w, mode='valid')
    out *= db(-20.0) / (math.sqrt(float(p2.max())) + 1e-12)
    return fade(out, 0.005, 0.03)


def rain(dur, intensity=0.5, dark=0.4, drops=1.0, width=1.0, seed=0):
    """RAIN → stereo, exactly dur.  (Docs in the module header.)"""
    r = rng(seed, 'rain')
    n = n_of(dur)
    inten = float(np.clip(intensity, 0.02, 1.0))
    top = 9000.0 - 5500.0 * dark
    # 1. hiss bed
    bed = np.stack([_colored(n, 1, rng(r, 'L')), _colored(n, 1, rng(r, 'R'))], axis=1)
    bed = lowpass(highpass(bed, 380.0, 2), top, 2)
    bed = _rms_norm(bed, 0.0)
    bed *= db(1.5 * wander(n, 0.25, -1.0, 1.0, r))[:, None]
    # 2. patter: thousands of tiny drops
    dens = 250.0 + 2600.0 * inten
    N = int(r.poisson(dens * dur))
    K = 12
    klen = n_of(0.014)
    tk = np.arange(klen) / SR
    kernels = []
    for k in range(K):
        fc = r.uniform(1400.0, 6000.0) * (1.0 - 0.45 * dark)
        nz = r.standard_normal(klen) * np.exp(-tk / r.uniform(0.0006, 0.0025))
        kern = lowpass(resonate(nz, fc, r.uniform(1.0, 3.0)), top, 2)
        kern[-96:] *= 1.0 - _rise(96)
        kernels.append(kern / math.sqrt(np.sum(kern * kern)))
    pat = scatter(n, r.integers(0, max(1, n), N), np.exp(r.normal(0.0, 0.6, N)), r.uniform(-width, width, N),
                  r.integers(0, K, N), kernels)
    pat = _rms_norm(pat, 0.0)
    # 3. individual drops: fewer, louder, pitched 'plips'
    N2 = int(r.poisson((3.0 + 22.0 * inten) * drops * dur))
    K2 = 10
    klen2 = n_of(0.07)
    tk2 = np.arange(klen2) / SR
    kernels2 = []
    for k in range(K2):
        f = r.uniform(450.0, 2400.0) * (1.0 - 0.3 * dark)
        tau = r.uniform(0.004, 0.014)
        ph = TAU * f * (tk2 + 0.25 * tau * (1.0 - np.exp(-tk2 / tau)))
        kern = np.sin(ph) * np.exp(-tk2 / tau)
        kern += 0.3 * bandpass(r.standard_normal(klen2), 1500.0, 5000.0, 1) * np.exp(-tk2 / 0.002)
        kern = lowpass(kern, top, 2)
        kern[:24] *= _rise(24)
        kernels2.append(kern / math.sqrt(np.sum(kern * kern)))
    if N2 > 0:
        drp = scatter(n, r.integers(0, max(1, n), N2), np.exp(r.normal(0.0, 0.7, N2)), r.uniform(-width, width, N2),
                      r.integers(0, K2, N2), kernels2)
        drp = _rms_norm(drp, 0.0)
    else:
        drp = 0.0
    # 4. low wash
    wash = np.stack([_colored(n, 2, rng(r, 'wL')), _colored(n, 2, rng(r, 'wR'))], axis=1)
    wash = _rms_norm(lowpass(highpass(wash, 40.0, 2), 260.0, 2), 0.0)
    out = bed * 1.0 + pat * (0.55 + 0.3 * inten) + drp * 0.40 * min(1.0, drops) + wash * 0.45
    out = width_fn(out, width) if width < 1.0 else out
    out = _rms_norm(out, -30.0 + 12.0 * inten)
    return fade(out, 0.03, 0.03)


def width_fn(x, w):
    return width(x, w)


def room_tone(dur, color='neutral', level_db=-50.0, hum=0.0, move=0.5, seed=0):
    """Very quiet ROOM TONE → stereo, exactly dur, RMS = level_db.  (Docs in the module header.)"""
    r = rng(seed, 'roomtone')
    n = n_of(dur)
    lp_a, lp_b, tilt = {'dark': (180.0, 420.0, 2), 'neutral': (500.0, 1500.0, 2), 'air': (1500.0, 5000.0, 1)}[color]
    common = _colored(n, tilt, rng(r, 'c'))
    chans = []
    for ch in ('L', 'R'):
        x = 0.6 * common + 0.8 * _colored(n, tilt, rng(r, ch))
        a = lowpass(x, lp_a, 2)
        b = lowpass(x, lp_b, 2)
        m = 0.5 + 0.5 * move * wander(n, 0.05, -1.0, 1.0, rng(r, 'm' + ch))
        chans.append(a + (b - a) * m * 0.6)
    out = np.stack(chans, axis=1)
    out = highpass(out, 35.0, 2)
    out *= db(3.0 * move * wander(n, 0.07, -1.0, 1.0, rng(r, 'lvl')))[:, None]
    out = _rms_norm(out, 0.0)
    if hum > 0:
        t = np.arange(n) / SR
        h = np.zeros(n)
        for k, a in ((1, 1.0), (2, 0.5), (3, 0.25), (4, 0.08)):
            h += a * np.sin(TAU * hum * k * t + r.uniform(0, TAU))
        h *= 0.5 + 0.2 * wander(n, 0.1, -1.0, 1.0, rng(r, 'hum'))
        out += _rms_norm(h, -8.0)[:, None]
        out = _rms_norm(out, 0.0)
    return fade(out * db(level_db), 0.05, 0.05)


def buzz(dur=0.45, freq=165.0, pulses=1, gap=0.14, rattle=0.5, vel=0.7, seed=0):
    """Phone VIBRATION on wood → mono.  (Docs in the module header.)"""
    r = rng(seed, 'buzz')
    one = n_of(dur)
    tail = n_of(0.18)
    n = pulses * one + (pulses - 1) * n_of(gap) + tail
    env = np.zeros(n)
    for p in range(pulses):
        a = p * (one + n_of(gap))
        e = gate(dur + 0.12, 0.0, dur - 0.09, attack=0.05, release=0.10)
        env[a:a + len(e)] = np.maximum(env[a:a + len(e)], e[:n - a])
    f = freq * (0.55 + 0.45 * np.sqrt(env)) * (1.0 + 0.004 * wander(n, 6.0, -1.0, 1.0, r))
    ph = TAU * np.cumsum(f) / SR
    v = np.sin(ph)
    hum_ = (v + 0.3 * np.sin(2.0 * ph + 0.6)) * env
    # the casing chattering against the table: one soft contact per cycle, slightly irregular
    thr = 0.55
    contact = np.clip(v - thr, 0.0, None) ** 2 / (1.0 - thr) ** 2
    contact *= env ** 2 * (1.0 + 0.5 * lowpass(r.standard_normal(n), 60.0, 1) * 8.0)
    modes = modal([190.0, 330.0, 540.0, 880.0, 1350.0], [0.07, 0.06, 0.05, 0.035, 0.025],
                  [1.0, 0.8, 0.6, 0.35, 0.2], contact=0.0006, seed=r)
    rat = sg.fftconvolve(contact, modes)[:n]
    rat /= np.max(np.abs(rat)) + 1e-12
    hum_ /= np.max(np.abs(hum_)) + 1e-12
    y = hum_ * (1.0 - 0.5 * rattle) + rat * (0.25 + 1.1 * rattle)
    y = lowpass(highpass(y, 70.0, 2), 2400.0, 2)
    return normalize(fade_out(y, 0.03), to_db(0.45 * float(np.clip(vel, 0.02, 1.0))))


def blip(freq=880.0, dur=0.09, vel=0.5, shape='sine', attack=0.004, glide=0.0, t60=None):
    """One soft UI BLIP → mono, peak ≈ 0.3·vel.  (Docs in the module header.)"""
    n = n_of(dur)
    t = np.arange(n) / SR
    f = hz(freq) * 2.0 ** (glide * np.minimum(t / max(dur, 1e-4), 1.0) / 12.0)
    y = osc(f, shape=shape, fmax=5000.0)
    y *= np.exp(-_LN1000 * t / (t60 if t60 else dur * 1.2))
    na = min(n, max(8, n_of(attack)))
    y[:na] *= _rise(na)
    k = max(1, min(n // 3, 960))
    y[-k:] *= 1.0 - _rise(k)
    return lowpass(y, 6000.0, 2) * (0.3 * float(np.clip(vel, 0.02, 1.0)))


def ui(kind='tap', vel=0.5, seed=0):
    """Ready-made soft interface sounds → mono.  (Docs in the module header.)"""
    r = rng(seed, 'ui', kind)
    if kind == 'tap':                      # a finger on glass
        return layer(blip(1250.0, 0.035, vel * 0.7, 'sine', 0.002), (impact('tap', 1.0, 0.25 * vel, 0.4, r), 0.0))
    if kind == 'key':                      # one typed character
        return blip(1900.0 * 2.0 ** (r.normal(0, 1.0) / 12.0), 0.022, vel * 0.5, 'sine', 0.0015)
    if kind == 'tick':                     # a list item ticking off
        return layer(blip(1568.0, 0.07, vel * 0.8, 'sine', 0.003), (blip(2093.0, 0.09, vel * 0.5, 'sine', 0.003), 0.045))
    if kind == 'confirm':                  # two rising notes
        return layer(blip(659.3, 0.14, vel, 'sine'), (blip(987.8, 0.22, vel, 'sine'), 0.11))
    if kind == 'notify':                   # a soft two-note chime
        return layer(blip(1318.5, 0.35, vel, 'sine', 0.004, t60=0.5), (blip(1760.0, 0.6, vel * 0.8, 'sine', 0.004, t60=0.9), 0.14))
    if kind == 'message':                  # a single rounded bloop
        return blip(740.0, 0.16, vel, 'sine', 0.006, glide=5.0)
    if kind == 'deny':                     # access denied: two low, flat tones
        return layer(blip(233.1, 0.16, vel, 'tri', 0.006, t60=0.5), (blip(207.7, 0.26, vel, 'tri', 0.006, t60=0.7), 0.19))
    if kind == 'alert':                    # a red banner dropping in
        return layer(blip(392.0, 0.18, vel, 'tri', 0.005, glide=-2.0), (blip(311.1, 0.34, vel, 'tri', 0.005, t60=0.6), 0.16))
    if kind == 'ring':                     # one ringback burst (425 Hz + 450 Hz, 0.4 s)
        y = (osc(425.0, 0.4) + osc(450.0, 0.4)) * 0.5 * gate(0.4, 0.0, 0.36, 0.02, 0.04)
        return lowpass(y, 3000.0, 2) * (0.25 * vel)
    if kind == 'alarm':                    # one beep of a cheap digital alarm clock
        y = osc(2050.0, 0.11, 'soft', fmax=6500.0) * gate(0.11, 0.0, 0.085, 0.004, 0.02)
        return lowpass(y, 5200.0, 2) * (0.2 * vel)
    if kind == 'scan':                     # a thin rising sweep
        d = 0.6
        f = curve([(0.0, 700.0), (d, 2100.0)], d, 'exp')
        y = osc(f) * gate(d, 0.0, d * 0.7, 0.08, d * 0.3)
        return lowpass(y, 5000.0, 2) * (0.15 * vel)
    raise ValueError(f'unknown ui sound {kind!r}')


def power_down(dur=3.0, f0=196.0, f1=32.0, vel=0.6, seed=0):
    """A machine winding down → mono, length dur.  (Docs in the module header.)"""
    r = rng(seed, 'powerdown')
    n = n_of(dur)
    t = np.arange(n) / SR
    u = t / dur
    f = hz(f0) * (hz(f1) / hz(f0)) ** (u ** 0.8)
    ph = np.cumsum(f) / SR
    y = np.sin(TAU * ph) + 0.35 * np.sin(TAU * 2.0 * ph + 0.4) + 0.16 * np.sin(TAU * 3.01 * ph + 1.1)
    trem_rate = 11.0 * (1.0 - u) ** 1.5 + 1.2
    trem = 1.0 - 0.18 * (0.5 + 0.5 * np.sin(TAU * np.cumsum(trem_rate) / SR))
    amp = (1.0 - u) ** 1.3
    y *= trem * amp
    air = _colored(n, 1, r) * 0.12 * amp
    y = lowpass_tv(y + air, 2600.0 * (1.0 - u) ** 2 + 140.0, 2)
    return normalize(fade(y, 0.03, dur * 0.2), to_db(0.4 * float(np.clip(vel, 0.02, 1.0))))


def hum(dur, freq=100.0, bright=0.3, flutter=0.3, level_db=-30.0, seed=0):
    """Electrical HUM / tube-light buzz → mono, exactly dur, RMS = level_db.  (Docs in the module header.)"""
    r = rng(seed, 'hum')
    n = n_of(dur)
    t = np.arange(n) / SR
    y = np.zeros(n)
    k = 1
    while freq * k < 3000.0 and k <= 24:
        a = (1.0 / k) ** (2.2 - 1.6 * bright) * (1.0 if k % 2 == 1 else 0.6)
        y += a * np.sin(TAU * freq * k * t + r.uniform(0, TAU))
        k += 1
    if flutter > 0:
        fl = lowpass(r.standard_normal(n), 18.0, 2)
        fl /= np.std(fl) + 1e-12
        y *= 1.0 + 0.25 * flutter * fl
    y = lowpass(y, 3200.0, 2)
    return fade(_rms_norm(y, level_db), 0.03, 0.03)


def whoosh(dur=0.8, f0=250.0, f1=1800.0, q=1.2, peak_at=0.6, vel=0.6, seed=0):
    """A soft filtered-noise WHOOSH / pass-by → mono, length dur.  (Docs in the module header.)"""
    n = n_of(dur)
    t = np.arange(n) / SR
    u = t / dur
    nz = _colored(n, 1, rng(seed, 'whoosh'))
    up = np.clip(u / peak_at, 0.0, 1.0)
    dn = np.clip((u - peak_at) / max(1e-6, 1.0 - peak_at), 0.0, 1.0)
    shape = np.sin(0.5 * np.pi * up) ** 2 * np.cos(0.5 * np.pi * dn) ** 2
    fc = f0 * (f1 / f0) ** (np.sin(0.5 * np.pi * up) * (1.0 - 0.5 * dn))
    y = bandpass_tv(nz, fc, q) * shape
    return normalize(y, to_db(0.4 * float(np.clip(vel, 0.02, 1.0))))


def drip(pitch=1.0, vel=0.5, seed=0):
    """One water DROP ('plip') → mono, ~0.15 s.  (Docs in the module header.)"""
    r = rng(seed, 'drip')
    n = n_of(0.16)
    t = np.arange(n) / SR
    fa = 620.0 * pitch * (1.0 + 0.1 * r.normal())
    f = fa * (1.0 + 1.4 * (1.0 - np.exp(-t / 0.018)))
    y = np.sin(TAU * np.cumsum(f) / SR) * np.exp(-t / 0.028)
    y[:72] *= _rise(72)
    sp = bandpass(r.standard_normal(n), 2000.0, 5500.0, 1) * np.exp(-t / 0.004)
    y += 0.08 * sp / (np.max(np.abs(sp)) + 1e-12)
    return normalize(fade_out(lowpass(y, 6000.0, 2), 0.03), to_db(0.3 * float(np.clip(vel, 0.02, 1.0))))


def rustle(dur=0.6, bright=0.5, density=45.0, vel=0.5, seed=0):
    """Paper / cloth RUSTLE → mono, length dur.  (Docs in the module header.)"""
    r = rng(seed, 'rustle')
    n = n_of(dur)
    nz = bandpass(r.standard_normal(n), 500.0 + 900.0 * bright, 3500.0 + 3500.0 * bright, 2)
    N = max(1, int(r.poisson(density * dur)))
    imp = np.zeros(n)
    np.add.at(imp, r.integers(0, n, N), np.exp(r.normal(0.0, 0.7, N)))
    bump = np.hanning(n_of(0.03) + 2)[1:-1]
    env = sg.fftconvolve(imp, bump)[:n]
    env *= np.sin(np.pi * np.arange(n) / n) ** 0.7
    y = nz * env
    return normalize(lowpass(y, 7000.0, 2), to_db(0.25 * float(np.clip(vel, 0.02, 1.0))))


def birds(dur, density=0.5, width=0.9, level_db=-34.0, seed=0):
    """Sparse, distant morning BIRDSONG → stereo, exactly dur.  (Docs in the module header.)"""
    r = rng(seed, 'birds')
    n = n_of(dur)
    out = np.zeros((n, 2))
    nb = max(1, int(round(density * dur * 0.9)))
    for _ in range(nb):
        t0 = r.uniform(0.0, max(0.01, dur - 0.5))
        base = r.uniform(2400.0, 4300.0)
        p = r.uniform(-width, width)
        lev = math.exp(r.normal(0.0, 0.45))
        ns = int(r.integers(2, 6))
        style = r.integers(0, 3)
        tcur = t0
        for s in range(ns):
            d = r.uniform(0.045, 0.11)
            m = n_of(d)
            u = np.arange(m) / m
            if style == 0:
                f = base * (1.0 + 0.22 * u)
            elif style == 1:
                f = base * (1.18 - 0.25 * u)
            else:
                f = base * (1.0 + 0.10 * np.sin(TAU * (2.0 + s % 2) * u))
            y = np.sin(TAU * np.cumsum(f) / SR) * np.sin(np.pi * u) ** 1.5
            i0 = n_of(tcur)
            if i0 + m < n:
                gl, gr = _pan_gains(p)
                out[i0:i0 + m, 0] += y * gl * lev
                out[i0:i0 + m, 1] += y * gr * lev
            tcur += d + r.uniform(0.02, 0.09)
    out = lowpass(out, 5200.0, 2)
    pk = np.max(np.abs(out))
    if pk > 0:
        out *= db(level_db + 14.0) / pk
    return out


def traffic(dur, density=0.5, level_db=-32.0, seed=0):
    """Distant CITY / traffic bed → stereo, exactly dur, RMS ≈ level_db.  (Docs in the module header.)"""
    r = rng(seed, 'traffic')
    n = n_of(dur)
    bed = np.stack([_colored(n, 2, rng(r, 'L')), _colored(n, 2, rng(r, 'R'))], axis=1)
    bed = lowpass(highpass(bed, 35.0, 2), 220.0, 2)
    bed = _rms_norm(bed, 0.0) * db(2.5 * wander(n, 0.08, -1.0, 1.0, r))[:, None]
    out = bed
    npass = int(r.poisson(density * dur / 5.0))
    for i in range(npass):
        d = r.uniform(3.0, 7.0)
        m = min(n, n_of(d))
        i0 = int(r.integers(-m // 3, max(1, n - m // 2)))
        nz = _colored(m, 1, rng(r, 'p', i))
        u = np.arange(m) / m
        sw = np.sin(np.pi * u) ** 3
        y = lowpass_tv(nz, 220.0 + 700.0 * sw * r.uniform(0.6, 1.2), 2) * sw
        y = _rms_norm(y, 0.0) * r.uniform(0.5, 1.1)
        dirn = 1.0 if r.random() < 0.5 else -1.0
        pp = dirn * (u * 2.0 - 1.0) * 0.8
        gl, gr = _pan_gains(pp)
        a, b = max(0, i0), min(n, i0 + m)
        if b > a:
            out[a:b, 0] += (y * gl)[a - i0:b - i0]
            out[a:b, 1] += (y * gr)[a - i0:b - i0]
    return fade(_rms_norm(out, level_db), 0.05, 0.05)


# ════════════════════════════════════════════════════════════════════════════
#  EFFECTS
# ════════════════════════════════════════════════════════════════════════════

def delay(x, time=0.38, feedback=0.4, mix=0.3, lp=2800.0, hp=180.0, ping_pong=True, tail=True):
    """Feedback echo → stereo.  (Docs in the module header.)"""
    x2 = to_stereo(np.asarray(x, dtype=np.float64))
    n = len(x2)
    d = max(1, n_of(time))
    fb = float(np.clip(feedback, 0.0, 0.92))
    reps = 1 if fb <= 0 else int(min(60, math.ceil(math.log(1e-3) / math.log(fb)))) + 1
    out = np.zeros((n + d * reps + 1, 2))
    out[:n] = x2 * (1.0 - mix * 0.5)
    tap = x2 if not ping_pong else np.stack([x2.mean(axis=1), np.zeros(n)], axis=1)
    g = 1.0
    for k in range(1, reps + 1):
        tap = lowpass(highpass(tap, hp, 1), lp, 1)
        if ping_pong and k > 1:
            tap = tap[:, ::-1]
        out[k * d:k * d + n] += tap * (mix * g)
        g *= fb
    return out if tail else out[:n]


def chorus(x, rate=0.35, depth=0.004, base=0.012, voices=3, mix=0.5, spread=1.0, seed=0):
    """Chorus / ensemble thickening → stereo, same length.  (Docs in the module header.)"""
    x1 = to_mono(np.asarray(x, dtype=np.float64))
    xs = to_stereo(np.asarray(x, dtype=np.float64))
    n = len(x1)
    r = rng(seed, 'chorus')
    idx = np.arange(n, dtype=np.float64)
    wet = np.zeros((n, 2))
    for v in range(voices):
        ph = r.random()
        rt = rate * (1.0 + 0.25 * (v - (voices - 1) / 2.0) / max(1, voices))
        dl = (base + depth * (0.5 + 0.5 * np.sin(TAU * (rt * idx / SR + ph)))) * SR
        y = np.interp(idx - dl, idx, x1, left=0.0)
        p = spread * (((v / (voices - 1)) * 2.0 - 1.0) if voices > 1 else 0.0)
        gl, gr = _pan_gains(p)
        wet[:, 0] += y * gl
        wet[:, 1] += y * gr
    wet *= 1.2 / math.sqrt(voices)
    return xs * (1.0 - mix) + wet * mix


def tremolo(x, rate=4.0, depth=0.3, phase=0.0, stereo_phase=0.0):
    """Amplitude tremolo.  (Docs in the module header.)"""
    x = np.asarray(x, dtype=np.float64)
    t = np.arange(len(x)) / SR
    m = 1.0 - depth * (0.5 - 0.5 * np.cos(TAU * (rate * t + phase)))
    if x.ndim == 1 and stereo_phase == 0:
        return x * m
    xs = to_stereo(x)
    m2 = 1.0 - depth * (0.5 - 0.5 * np.cos(TAU * (rate * t + phase + stereo_phase)))
    return xs * np.stack([m, m2], axis=1)


def saturate(x, drive_db=6.0, bias=0.0, mix=1.0, oversample=2):
    """Soft tanh saturation.  (Docs in the module header.)"""
    x = np.asarray(x, dtype=np.float64)
    g = db(drive_db)
    if oversample > 1:
        xu = sg.resample_poly(x, oversample, 1, axis=0)
    else:
        xu = x
    yu = (np.tanh(g * (xu + bias)) - math.tanh(g * bias)) / g
    y = sg.resample_poly(yu, 1, oversample, axis=0)[:len(x)] if oversample > 1 else yu
    return x * (1.0 - mix) + y * mix


def phone(x, drive_db=3.0):
    """Telephone band-limiter (300–3400 Hz) → mono.  (Docs in the module header.)"""
    y = to_mono(np.asarray(x, dtype=np.float64))
    y = highpass(y, 300.0, 4)
    y = lowpass(y, 3400.0, 4)
    y = peak(y, 1800.0, 3.0, 0.9)
    pk = np.max(np.abs(y)) + 1e-12
    y = saturate(y / pk * 0.6, drive_db, bias=0.05) * (pk / 0.6)
    return lowpass(highpass(y, 300.0, 2), 3400.0, 4)


def speaker(x, drive_db=5.0):
    """Small phone loudspeaker (400–5000 Hz, a little distortion) → mono.  (Docs in the module header.)"""
    y = to_mono(np.asarray(x, dtype=np.float64))
    y = highpass(y, 400.0, 3)
    y = lowpass(y, 5000.0, 3)
    y = peak(y, 1100.0, 4.0, 1.4)
    y = peak(y, 2900.0, 3.0, 1.8)
    pk = np.max(np.abs(y)) + 1e-12
    y = saturate(y / pk * 0.7, drive_db, bias=0.08) * (pk / 0.7)
    return lowpass(highpass(y, 400.0, 2), 5000.0, 4)


def limiter(x, ceiling_db=-1.0, knee_db=3.0, lookahead=0.005, release=0.12):
    """Look-ahead soft limiter, zero latency.  (Docs in the module header.)"""
    x = np.asarray(x)
    xf = x.astype(np.float64, copy=False)
    n = xf.shape[0]
    a = np.abs(xf) if xf.ndim == 1 else np.abs(xf).max(axis=1)
    T = db(ceiling_db)
    T0 = T * db(-abs(knee_db))
    over = a > T0
    if not over.any():
        return x.copy()
    G = np.zeros(n)
    ao = a[over]
    if T > T0:
        tgt = T0 + (T - T0) * np.tanh((ao - T0) / (T - T0))
    else:
        tgt = np.full_like(ao, T)
    G[over] = 20.0 * np.log10(tgt / ao)
    L = max(2, n_of(lookahead))
    L += L % 2
    h = L // 2
    Gm = minimum_filter1d(G, size=L + 1, mode='nearest', origin=-h)          # min over [i, i+L]
    c = 6.0 / max(1e-4, release) / SR                                        # dB per sample of recovery
    ramp = c * np.arange(n)
    Gr = np.minimum.accumulate(Gm - ramp) + ramp
    Gs = uniform_filter1d(Gr, size=L + 1, mode='nearest', origin=h)          # mean over [i-L, i]
    gain = 10.0 ** (Gs / 20.0)
    y = xf * (gain if xf.ndim == 1 else gain[:, None])
    return y.astype(x.dtype, copy=False)


# ════════════════════════════════════════════════════════════════════════════
#  METERING AND PICTURES
# ════════════════════════════════════════════════════════════════════════════

_K_SOS = np.array([
    [1.53512485958697, -2.69169618940638, 1.19839281085285, 1.0, -1.69065929318241, 0.73248077421585],
    [1.0, -2.0, 1.0, 1.0, -1.99004745483398, 0.99007225036621],
])


def lufs(x):
    """Integrated loudness in LUFS (ITU-R BS.1770-4: K-weighting, 400 ms blocks, -70 LUFS absolute and
    -10 LU relative gates) of a mono (N,) or stereo (N,2) signal at 48 kHz.  Signals shorter than 0.4 s are
    measured ungated.  Returns -inf for silence.  Matches `ffmpeg -af ebur128` to ~0.1 LU."""
    x = np.asarray(x, dtype=np.float64)
    if x.ndim == 1:
        x = x[:, None]
    n = x.shape[0]
    if n == 0:
        return float('-inf')
    y = sg.sosfilt(_K_SOS, x, axis=0)
    y *= y
    block, hop = int(0.4 * SR), int(0.1 * SR)
    if n < block:
        p = float(np.sum(np.mean(y, axis=0)))
        return -0.691 + 10.0 * math.log10(p) if p > 0 else float('-inf')
    cs = np.concatenate([np.zeros((1, y.shape[1])), np.cumsum(y, axis=0)])
    st = np.arange(0, n - block + 1, hop)
    p = ((cs[st + block] - cs[st]) / block).sum(axis=1)
    l = -0.691 + 10.0 * np.log10(np.maximum(p, 1e-30))
    k1 = l > -70.0
    if not k1.any():
        return float('-inf')
    rel = -0.691 + 10.0 * math.log10(float(np.mean(p[k1]))) - 10.0
    k2 = k1 & (l > rel)
    return -0.691 + 10.0 * math.log10(float(np.mean(p[k2])))


def loudness_curve(x, window=3.0, hop=0.1):
    """Short-term loudness over time → (times_s, lufs_values) using `window`-second blocks (3 s = EBU
    'short-term', 0.4 s = 'momentary').  Handy for checking the dynamics of a scene."""
    x = np.asarray(x, dtype=np.float64)
    if x.ndim == 1:
        x = x[:, None]
    y = sg.sosfilt(_K_SOS, x, axis=0)
    y *= y
    block, h = int(window * SR), int(hop * SR)
    if len(y) < block:
        return np.zeros(0), np.zeros(0)
    cs = np.concatenate([np.zeros((1, y.shape[1])), np.cumsum(y, axis=0)])
    st = np.arange(0, len(y) - block + 1, h)
    p = ((cs[st + block] - cs[st]) / block).sum(axis=1)
    return (st + block / 2) / SR, -0.691 + 10.0 * np.log10(np.maximum(p, 1e-30))


def lufs_ffmpeg(path):
    """Reference measurement with ffmpeg's ebur128 → dict(I=integrated LUFS, LRA=loudness range LU,
    TP=true peak dBFS).  `path` is a WAV file."""
    res = subprocess.run(['ffmpeg', '-nostats', '-hide_banner', '-i', str(path), '-af', 'ebur128=peak=true',
                          '-f', 'null', '-'], capture_output=True, text=True)
    txt = res.stderr[res.stderr.rfind('Summary:'):]
    out = {}
    for key, pat in (('I', r'I:\s+(-?[\d.]+|-inf) LUFS'), ('LRA', r'LRA:\s+(-?[\d.]+) LU'), ('TP', r'Peak:\s+(-?[\d.]+|-inf) dBFS')):
        m = re.search(pat, txt)
        out[key] = float(m.group(1)) if m else float('nan')
    return out


def band_db(x, lo, hi):
    """RMS level in dBFS of the part of the signal between lo and hi Hz (whole-file FFT, all channels)."""
    x = np.asarray(x, dtype=np.float64)
    if x.ndim == 1:
        x = x[:, None]
    n = x.shape[0]
    X = sfft.rfft(x, axis=0)
    f = sfft.rfftfreq(n, 1.0 / SR)
    m = (f >= lo) & (f < hi)
    p = 2.0 * np.sum(np.abs(X[m]) ** 2) / (n * n) / x.shape[1]
    return 10.0 * math.log10(p) if p > 0 else -200.0


def stats(x):
    """Quick health check → dict: dur s, peak_db, rms_db, lufs, crest_db, dc (mean), clipped (samples ≥ 1.0),
    nan (bad samples), tail_db (RMS of the last 50 ms — should be far below the body for one-shots)."""
    x = np.asarray(x, dtype=np.float64)
    bad = int(np.sum(~np.isfinite(x)))
    xc = np.nan_to_num(x)
    pk = float(np.max(np.abs(xc))) if xc.size else 0.0
    rms = math.sqrt(float(np.mean(xc * xc))) if xc.size else 0.0
    tail = xc[-n_of(0.05):]
    trms = math.sqrt(float(np.mean(tail * tail))) if tail.size else 0.0
    l = lufs(xc)
    return dict(dur=round(len(x) / SR, 3), peak_db=round(to_db(pk), 2), rms_db=round(to_db(rms), 2),
                lufs=round(l, 2) if math.isfinite(l) else None, crest_db=round(to_db(pk) - to_db(rms), 2),
                dc=float(np.mean(xc)), clipped=int(np.sum(np.abs(xc) >= 1.0)), nan=bad, tail_db=round(to_db(trms), 2))


def spectrogram(wav, png, size='1600x700', stop=None, fscale='lin'):
    """Render a spectrogram PNG of a WAV file with ffmpeg (showspectrumpic, log intensity, legend).
    stop: top frequency in Hz (None = Nyquist); fscale: 'lin' or 'log'."""
    Path(png).parent.mkdir(parents=True, exist_ok=True)
    opts = f's={size}:legend=1:fscale={fscale}' + (f':stop={int(stop)}' if stop else '')
    res = subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', str(wav), '-lavfi',
                          f'showspectrumpic={opts}', str(png)], capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(res.stderr)
    return Path(png)


def wavepic(wav, png, size='1600x400'):
    """Render a waveform PNG of a WAV file with ffmpeg (showwavespic)."""
    Path(png).parent.mkdir(parents=True, exist_ok=True)
    res = subprocess.run(['ffmpeg', '-y', '-hide_banner', '-loglevel', 'error', '-i', str(wav), '-lavfi',
                          f'showwavespic=s={size}:split_channels=1', str(png)], capture_output=True, text=True)
    if res.returncode != 0:
        raise RuntimeError(res.stderr)
    return Path(png)
