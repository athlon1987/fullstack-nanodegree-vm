#!/usr/bin/env python3
"""Re-recording mix: dialogue treatment, ducking, bus comp, limiter -> dialogue.wav, mix.wav, mix_me.wav"""
import json, os, subprocess, re, sys
import numpy as np, soundfile as sf
from scipy import signal
R = 48000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = f"{ROOT}/audio/out"
TL = json.load(open(f"{ROOT}/build/timeline.json"))
DUR = TL['duration']; N = int(round(DUR * R))
rng = np.random.default_rng(7)
db = lambda x: 10 ** (x / 20)

def sos(kind, f, fs=R, order=2):
    return signal.butter(order, f, kind, fs=fs, output='sos')
def filt(x, kind, f, order=2): return signal.sosfilt(sos(kind, f, order=order), x)
def shelf_hi(x, f, gain_db):  # high shelf: add scaled highpassed signal
    return x + (db(gain_db) - 1) * filt(x, 'highpass', f, 2)
def peak_eq(x, f, g, q=1.0):
    w0 = 2 * np.pi * f / R; A = 10 ** (g / 40); al = np.sin(w0) / (2 * q)
    b = [1 + al * A, -2 * np.cos(w0), 1 - al * A]; a = [1 + al / A, -2 * np.cos(w0), 1 - al / A]
    return signal.lfilter(np.array(b) / a[0], np.array(a) / a[0], x)

def compress(x, thr_db=-26, ratio=3.0, att=0.008, rel=0.12):
    a_a = np.exp(-1 / (att * R)); a_r = np.exp(-1 / (rel * R))
    ab = np.abs(x)
    # fast approx: smooth with release coefficient, attack via short moving max
    env = signal.lfilter([1 - a_r], [1, -a_r], ab)
    env = np.maximum(env, signal.lfilter([1 - a_a], [1, -a_a], ab))
    lv = 20 * np.log10(env + 1e-9)
    gr = np.where(lv > thr_db, (thr_db - lv) * (1 - 1 / ratio), 0)
    return x * db(gr)

def peak_limit(x, ceil_db, w_ms=4, rel=0.06):
    from scipy.ndimage import minimum_filter1d, uniform_filter1d
    c = db(ceil_db); w = int(w_ms * R / 1000)
    g = np.minimum(1, c / (np.abs(x) + 1e-12))
    g = uniform_filter1d(minimum_filter1d(g, 2 * w + 1), 2 * w + 1)
    r = np.exp(-1 / (rel * R)); gl = 1 - signal.lfilter([1 - r], [1, -r], 1 - g)
    return x * np.minimum(g, gl)

def active_rms_db(x):
    fr = int(0.02 * R); n = len(x) // fr
    r = np.sqrt((x[:n * fr].reshape(n, fr) ** 2).mean(1)) + 1e-9
    m = r.max(); a = r[r > m * db(-22)]
    return 20 * np.log10(np.sqrt((a ** 2).mean()))

def make_ir(rt60, wet_lp=6000, pre=0.008, hp=150, seed=0, early=True):
    g = np.random.default_rng(seed)
    n = int((rt60 * 1.1 + pre) * R) + 1
    t = np.arange(n) / R
    ir = np.zeros((2, n))
    for c in range(2):
        nz = g.standard_normal(n) * np.exp(-6.91 * np.maximum(t - pre, 0) / rt60)
        nz[:int(pre * R)] = 0
        nz *= np.minimum(1, (t - pre).clip(0) / 0.01)
        nz = filt(nz, 'lowpass', wet_lp); nz = filt(nz, 'highpass', hp)
        ir[c] = nz
    ir /= np.sqrt((ir ** 2).sum(1, keepdims=True)).mean()
    return ir

def room(x, rt60, wet_db, lp=6000, pre=0.008, seed=0, dry_db=0):
    ir = make_ir(rt60, lp, pre, seed=seed)
    n = len(x) + len(ir[0]) - 1
    w = np.stack([signal.fftconvolve(x, ir[c])[:n] for c in range(2)]) * db(wet_db)
    d = np.zeros((2, n)); d[0, :len(x)] = x * db(dry_db); d[1, :len(x)] = x * db(dry_db)
    return d + w  # stereo (2,n)

def pan(st, p):  # st (2,n) already mono-ish dry; apply constant-power balance
    th = (p + 1) * np.pi / 4
    return np.stack([st[0] * np.cos(th) * np.sqrt(2), st[1] * np.sin(th) * np.sqrt(2)])

def pan_mono(x, p):
    th = (p + 1) * np.pi / 4
    return np.stack([x * np.cos(th) * np.sqrt(2), x * np.sin(th) * np.sqrt(2)])

# room per cue: (rt60, wet_db, lp)
ROOMS = {
 'kitchen': (0.45, -17, 5000), 'office': (0.18, -26, 5000), 'outdoor': (0.30, -26, 4500),
 'lobby': (1.1, -15, 7000), 'gov': (1.6, -14, 8000), 'rain': (0.15, -28, 4000),
 'table': (0.35, -18, 4500), 'open': (0.30, -25, 5000), 'police': (0.25, -26, 5000),
 'phone': None, 'a1home': (0.45, -17, 5000)}
def room_of(cue):
    cid, sh = cue['id'], cue['shot']
    if cid.startswith('a1_boss') or cid == 'a1_sorry1': return 'office'
    if cid in ('a1_ask', 'a1_try', 'a1_bill'): return 'kitchen'
    if cid.startswith('a1_'): return 'outdoor'
    if cid == 'a2_guard': return 'lobby'
    if cid.startswith('a2_'): return 'kitchen'
    if cid.startswith('a3_clerk'): return 'gov'
    if cid.startswith('a4_'): return 'rain'
    if cid[:2] in ('a5', 'a6'): return 'table'
    return 'open'

HUG = {'a6_knew', 'a6_how', 'a6_because', 'a7_love', 'a7_know'}
def pan_of(cue):
    w = cue['who']
    if w == 'ADAM': return -0.2
    if w == 'DAUGHTER': return 0.0 if cue['id'] in HUG else 0.2
    return 0.2

def process_cue(cue):
    cid, who = cue['id'], cue['who']
    x, sr = sf.read(f"{ROOT}/audio/vo/{cid}.flac"); assert sr == R
    x = x.astype(np.float64)
    if x.ndim > 1: x = x.mean(1)
    pad = np.zeros(int(0.05 * R)); x = np.concatenate([x, pad])
    x = filt(x, 'highpass', 80)
    x = compress(x)
    x *= db(-20 - active_rms_db(x))
    x = peak_limit(x, -9.5)
    x *= db(-20 - active_rms_db(x))
    x = peak_limit(x, -9.0)
    extra = {'a5_never': -3, 'a7_know': -3, 'a1_sorry2': -3}.get(cid, 0)
    rk = room_of(cue); P = pan_of(cue)
    if who == 'V1':
        x = shelf_hi(x, 4000, 2.0)
        x = x + 0.1 * np.concatenate([np.zeros(int(0.009 * R)), x[:-int(0.009 * R)]])
    if who == 'ADAM':
        x = peak_eq(x, 3500, -1.5, 0.8)
    if who == 'SYSTEM' and cid == 'a3_scan':
        x = filt(x, 'bandpass', [250, 6000])
        t = np.arange(len(x)) / R
        x = 0.7 * x + 0.3 * x * np.sin(2 * np.pi * 140 * t)
        x *= db(-4 + extra); out = np.stack([x, x]); P = 0
        return out
    if who == 'SYSTEM':  # a3_noanswer
        x = filt(x, 'bandpass', [300, 3400], 3)
        x = np.tanh(2.2 * x) / 2.2 * 1.3
        x *= db(-8); return np.stack([x, x])
    if who == 'ANNOUNCER':
        st = room(x, 1.8, -6, 5000, 0.015, seed=3)
        m = st.mean(0)
        m = filt(m, 'bandpass', [350, 5000], 3)
        m *= db(-9); return np.stack([m, m])
    if who == 'ORIGINAL':
        x = peak_eq(x, 280, 4, 0.9); x = peak_eq(x, 1800, -2, 1)
        st = room(x, 0.12, -14, 3000, 0.003, seed=5); m = st.mean(0)
        m = filt(m, 'bandpass', [350, 5000], 3)
        m *= db(-3); return np.stack([m, m])
    if cid == 'a7_lunch':
        x = filt(x, 'lowpass', 4000, 2)
        slap = np.concatenate([np.zeros(int(0.14 * R)), x * 0.35])
        xx = np.concatenate([x, np.zeros(len(slap) - len(x))]) + slap[:len(slap)]
        st = room(xx, 0.3, -22, 4000, seed=9)
        return pan(st, 0.5) * db(-8)
    rt, wet, lp = ROOMS[rk]
    if who == 'V1': rt *= 0.8; wet -= 1.5
    st = room(x * db(extra), rt, wet, lp, seed=sum(map(ord, cid)) % 1000)
    return pan(st, P)

def smooth_env(mask, att, rel):
    # one-pole: fast down (attack on duck) & slow release
    out = np.zeros_like(mask); a = np.exp(-1 / (att * R)); r = np.exp(-1 / (rel * R)); y = 0.0
    # vectorise by chunks via lfilter on each regime is awkward; use downsampled loop (200 Hz)
    ds = 240; m = mask[::ds]; o = np.zeros_like(m); y = 0.0
    a = np.exp(-ds / (att * R)); r = np.exp(-ds / (rel * R))
    for i, v in enumerate(m):
        y = v + (y - v) * (a if v > y else r); o[i] = y
    return np.interp(np.arange(len(mask)), np.arange(len(m)) * ds, o)

def measure(path):
    p = subprocess.run(['ffmpeg', '-nostats', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'],
                       capture_output=True, text=True).stderr
    s = p[p.rfind('Summary:'):]
    I = float(re.search(r'I:\s+(-?[\d.]+) LUFS', s).group(1))
    LRA = float(re.search(r'LRA:\s+(-?[\d.]+) LU', s).group(1))
    tp = float(re.search(r'Peak:\s+(-?[\d.]+) dBFS', s).group(1))
    return I, tp, LRA

def sw(x, t0, t1, fade=0.02):
    pass

def main():
    os.makedirs(f"{ROOT}/build/review/audio/mix", exist_ok=True)
    # ---------- dialogue ----------
    cuts = [65.6, [s for s in TL['shots'] if s['id'] == 'a5_04_scan'][0]['events']['noresult']['t'], 425.2]
    dia = np.zeros((2, N + 4 * R)); dry_act = np.zeros(N + 4 * R)
    for c in TL['cues']:
        st = process_cue(c); i0 = int(round(c['t0'] * R))
        if i0 + st.shape[1] > dia.shape[1]: st = st[:, :dia.shape[1] - i0]
        dia[:, i0:i0 + st.shape[1]] += st
        v, _ = sf.read(f"{ROOT}/audio/vo/{c['id']}.flac"); v = v if v.ndim == 1 else v.mean(1)
        dry_act[i0:i0 + len(v)] += np.abs(v)
    dia = dia[:, :N]; dry_act = dry_act[:N]
    for ct in cuts:  # hard cuts: stop reverb tails
        i = int(round(ct * R)); j = i + int(0.02 * R)
        # only cut tails that run past the cut, not speech before it
        if ct == cuts[1]:
            continue
        nxt = [c['t0'] for c in TL['cues'] if c['t0'] >= ct]
        dia[:, i:int(round(nxt[0] * R)) if nxt else None] = 0
        f = np.linspace(1, 0, int(0.02 * R)); dia[:, i - len(f):i] *= f
    sf.write(f"{OUT}/dialogue.wav", dia.T.astype(np.float32), R, subtype='FLOAT')

    # ---------- ducking ----------
    music = sf.read(f"{OUT}/music.wav")[0][:N]; sfx = sf.read(f"{OUT}/sfx.wav")[0][:N]
    if len(music) < N: music = np.pad(music, ((0, N - len(music)), (0, 0)))
    if len(sfx) < N: sfx = np.pad(sfx, ((0, N - len(sfx)), (0, 0)))
    # dead stop at 'noresult': ambience/room tone stops until the note scene begins
    nr_i = int(round(cuts[1] * R)); a5 = int(round([s for s in TL['shots'] if s['id'] == 'a5_05_note'][0]['start'] * R))
    gate = np.ones(N); gate[nr_i:a5] = 0
    gate[nr_i - 960:nr_i] = np.linspace(1, 0, 960); gate[a5:a5 + 14400] = np.linspace(0, 1, 14400)
    sfx = sfx * gate[:, None]
    rm = lambda x: 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-9)
    dep_m = np.zeros(N); dep_s = np.zeros(N)
    for c in TL['cues']:
        a, b = int(c['t0'] * R), int(c['t1'] * R)
        ds = rm(dia[:, a:b])
        dm = float(np.clip(rm(music[a:b]) - (ds - 13), 7, 17))   # want music >= 13 dB under speech
        dsf = float(np.clip(rm(sfx[a:b]) - (ds - 15), 3, 10))
        lo, hi = max(0, a - int(0.1 * R)), min(N, b + int(0.15 * R))
        dep_m[lo:hi] = np.maximum(dep_m[lo:hi], dm); dep_s[lo:hi] = np.maximum(dep_s[lo:hi], dsf)
        c['_duck'] = (round(dm, 1), round(dsf, 1))
    la = int(0.15 * R)
    em = smooth_env(np.concatenate([dep_m[la:], np.zeros(la)]), 0.12, 0.45)
    es = smooth_env(np.concatenate([dep_s[la:], np.zeros(la)]), 0.12, 0.45)
    mus_d = music * db(-em)[:, None]; sfx_d = sfx * db(-es)[:, None]
    bed = mus_d + sfx_d; full = bed + dia.T

    # ---------- master ----------
    def bus_gr(x):
        lvl = np.sqrt(signal.lfilter([1 - np.exp(-1 / (0.3 * R))], [1, -np.exp(-1 / (0.3 * R))], (x ** 2).mean(1)) + 1e-12)
        l = 20 * np.log10(lvl)
        return np.minimum(0, -(l - (-16)) * (1 - 1 / 1.8)) * (l > -16) , l
    def master(g_db, ceil=-1.9):
        gr_bus, _ = bus_gr(full * db(g_db))
        gr_bus = np.minimum(0, gr_bus)
        mk = db(gr_bus)[:, None]
        outs = [full * db(g_db) * mk, bed * db(g_db) * mk]
        x = outs[0]
        # true-peak oversampled envelope
        up = signal.resample_poly(x, 4, 1, axis=0)
        pk = np.abs(up).max(1); pk = pk[:len(x) * 4].reshape(-1, 4).max(1)
        c = db(ceil); g = np.minimum(1, c / (pk + 1e-12))
        w = int(0.005 * R)
        from scipy.ndimage import minimum_filter1d, uniform_filter1d
        g = minimum_filter1d(g, 2 * w + 1); g = uniform_filter1d(g, 2 * w + 1)
        g = np.minimum(g, 1)
        # release smoothing
        gl = g.copy(); rel = np.exp(-1 / (0.15 * R))
        gl = 1 - signal.lfilter([1 - rel], [1, -rel], 1 - g)  # smooth GR (slower attack risk covered below)
        g2 = np.minimum(g, gl)
        outs = [o * g2[:, None] for o in outs]
        gr_tot = -20 * np.log10(g2 * np.abs(mk[:, 0]))
        return outs, gr_tot
    g_db = 0.0
    for it in range(4):
        outs, gr = master(g_db)
        sf.write(f"{OUT}/mix.wav", outs[0].astype(np.float32), R, subtype='FLOAT')
        I, tp, _ = measure(f"{OUT}/mix.wav")
        print(f"iter {it}: gain {g_db:.2f} dB -> {I:.2f} LUFS, TP {tp:.2f}, maxGR {gr.max():.2f}", file=sys.stderr)
        if abs(I + 16) < 0.15 and tp <= -1.5: break
        g_db += (-16 - I)
    mix, me = outs
    np.save(f"{ROOT}/build/review/audio/mix/gr.npy", gr[::480])
    # re-impose exact silence
    for t0, t1 in [(cuts[2], DUR)]:
        pass
    sf.write(f"{OUT}/mix.wav", mix.astype(np.float32), R, subtype='FLOAT')
    sf.write(f"{OUT}/mix_me.wav", me.astype(np.float32), R, subtype='FLOAT')
    print("max gain reduction (bus+limiter): %.2f dB, master gain %.2f dB" % (gr.max(), g_db))

if __name__ == '__main__':
    main()
