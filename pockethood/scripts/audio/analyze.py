"""Measures rendered soundtrack previews: level, headroom, clipping, spectral balance, tempo,
and loudness jumps (transitions). Usage: python3 scripts/audio/analyze.py <dir-with-wavs>
Needs numpy only. Prints a table and writes analysis.json next to the WAVs."""
import json
import struct
import sys
import wave
from pathlib import Path

import numpy as np


def load(p):
    with wave.open(str(p)) as w:
        sr, ch, n = w.getframerate(), w.getnchannels(), w.getnframes()
        x = np.frombuffer(w.readframes(n), dtype=np.int16).astype(np.float64) / 32768
    return sr, x.reshape(-1, ch)


def db(v):
    return 20 * np.log10(max(v, 1e-9))


def tempo(mono, sr):
    hop = 512
    frames = len(mono) // hop
    env = np.array([np.sqrt(np.mean(mono[i * hop:(i + 1) * hop] ** 2)) for i in range(frames)])
    onset = np.maximum(0, np.diff(env))
    onset -= onset.mean()
    ac = np.correlate(onset, onset, 'full')[len(onset) - 1:]
    fps = sr / hop
    lo, hi = int(fps * 60 / 180), int(fps * 60 / 55)
    lag = lo + int(np.argmax(ac[lo:hi]))
    bpm = 60 * fps / lag
    while bpm < 70:
        bpm *= 2
    while bpm > 140:
        bpm /= 2
    return bpm


def analyze(p):
    sr, x = load(p)
    mono = x.mean(axis=1)
    win = int(sr * 0.4)
    st = np.array([np.sqrt(np.mean(mono[i:i + win] ** 2)) for i in range(0, len(mono) - win, win)])
    active = st[st > 1e-4]
    sec = np.array([np.sqrt(np.mean(mono[i:i + sr] ** 2)) for i in range(0, len(mono) - sr, sr)])
    jumps = np.abs(np.diff([db(v) for v in sec if v > 1e-4])) if len(sec) > 2 else np.array([0])
    spec = np.abs(np.fft.rfft(mono)) ** 2
    f = np.fft.rfftfreq(len(mono), 1 / sr)
    tot = spec.sum()
    band = lambda a, b: float(spec[(f >= a) & (f < b)].sum() / tot * 100)
    return {
        'seconds': round(len(mono) / sr, 1),
        'peak_dbfs': round(db(np.abs(x).max()), 1),
        'rms_dbfs': round(db(np.sqrt(np.mean(mono ** 2))), 1),
        'short_term_db_p10_p90': [round(db(np.percentile(active, 10)), 1), round(db(np.percentile(active, 90)), 1)] if len(active) else None,
        'clipped_samples': int((np.abs(x) >= 0.999).sum()),
        'dc_offset': round(float(mono.mean()), 5),
        'bands_pct': {'<100': round(band(0, 100), 1), '100-250': round(band(100, 250), 1), '250-2k': round(band(250, 2000), 1), '2k-6k': round(band(2000, 6000), 1), '>6k': round(band(6000, sr / 2), 2)},
        'centroid_hz': int((f * spec).sum() / tot),
        'tempo_bpm_est': round(tempo(mono, sr), 1),
        'max_1s_jump_db': round(float(jumps.max()), 1),
    }


if __name__ == '__main__':
    d = Path(sys.argv[1])
    res = {p.stem: analyze(p) for p in sorted(d.glob('*.wav'))}
    (d / 'analysis.json').write_text(json.dumps(res, indent=1))
    print(f"{'file':18} {'sec':>5} {'peak':>6} {'rms':>6} {'st p10/p90':>13} {'clip':>5} {'<100':>5} {'100-250':>7} {'250-2k':>6} {'2-6k':>5} {'>6k':>5} {'cent':>5} {'bpm':>6} {'jump':>5}")
    for k, r in res.items():
        b = r['bands_pct']
        stp = r['short_term_db_p10_p90'] or [0, 0]
        print(f"{k:18} {r['seconds']:>5} {r['peak_dbfs']:>6} {r['rms_dbfs']:>6} {str(stp):>13} {r['clipped_samples']:>5} {b['<100']:>5} {b['100-250']:>7} {b['250-2k']:>6} {b['2k-6k']:>5} {b['>6k']:>5} {r['centroid_hz']:>5} {r['tempo_bpm_est']:>6} {r['max_1s_jump_db']:>5}")
