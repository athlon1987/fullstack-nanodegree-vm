#!/usr/bin/env python3
import json, os, re, subprocess
import numpy as np, soundfile as sf
R = 48000
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = f"{ROOT}/audio/out"; PIC = f"{ROOT}/build/review/audio/mix"; os.makedirs(PIC, exist_ok=True)
TL = json.load(open(f"{ROOT}/build/timeline.json"))
def ebu(path):
    s = subprocess.run(['ffmpeg', '-nostats', '-i', path, '-af', 'ebur128=peak=true', '-f', 'null', '-'], capture_output=True, text=True).stderr
    s = s[s.rfind('Summary:'):]
    g = lambda p: float(re.search(p, s).group(1))
    return g(r'I:\s+(-?[\d.]+) LUFS'), g(r'Peak:\s+(-?[\d.]+) dBFS'), g(r'LRA:\s+(-?[\d.]+) LU')
def rms(x): return 20 * np.log10(np.sqrt((x ** 2).mean()) + 1e-12)
ld = lambda n: sf.read(f"{OUT}/{n}.wav")[0]
print("STEM LOUDNESS        LUFS    TP(dBTP)  LRA")
for n in ['dialogue', 'music', 'sfx', 'mix_me', 'mix']:
    I, tp, lra = ebu(f"{OUT}/{n}.wav"); print(f"{n:<16}{I:8.1f}{tp:10.1f}{lra:7.1f}")
mix, me, dia = ld('mix'), ld('mix_me'), ld('dialogue')
sp = mix - me
print("\nDURATION mix %.3f s (film %.3f)  NaN: %s  DC: %.2e" % (len(mix) / R, TL['duration'], np.isnan(mix).any(), mix.mean()))
print("\nCUE            who        t0      speech  bg     SBR(dB)")
bad = []
for c in TL['cues']:
    a, b = int(c['t0'] * R), int(c['t1'] * R)
    s_, g_ = rms(sp[a:b]), rms(me[a:b]); sbr = s_ - g_
    flag = '' if sbr >= 10 else (' <10' if sbr >= 7 else ' **<7**')
    print(f"{c['id']:<14} {c['who']:<9}{c['t0']:7.1f}{s_:8.1f}{g_:8.1f}{sbr:8.1f}{flag}")
sh = {s['id']: s for s in TL['shots']}
nr = sh['a5_04_scan']['events']['noresult']['t']
print("\nSILENT WINDOWS (RMS dBFS)")
for name, a, b, x in [("a1_13 end -> title music (mix_me)", 65.7, 66.05, me), ("noresult -> a5_05 start (mix)", nr + .05, sh['a5_05_note']['start'], mix),
                      ("end_card 0-1.4 s (mix)", 425.25, 426.55, mix)]:
    print(f"{name:<40}{rms(x[int(a*R):int(b*R)]):8.1f}")
print("\nACT SPECTROGRAMS ->", PIC)
for a in [x for x in TL['acts'] if x['act'] > 0]:
    subprocess.run(['ffmpeg', '-y', '-v', 'error', '-ss', str(a['start']), '-t', str(a['end'] - a['start']), '-i', f"{OUT}/mix.wav", '-lavfi',
                    'showspectrumpic=s=1000x350:legend=0:fscale=log', f"{PIC}/act{a['act']}.png"])
