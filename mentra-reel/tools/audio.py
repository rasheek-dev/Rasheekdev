"""Original soundtrack + SFX for the Reel, synced to build/reel.json.
   python3 tools/audio.py  ->  build/mix.wav (music + sfx)  and  build/sfx_only.wav (for using an Instagram sound instead)"""
import json, wave, numpy as np
R = json.load(open('build/reel.json')); SR = 44100; D = R['duration']; N = int(SR * D); t = np.arange(N) / SR
rng = np.random.default_rng(4); f = lambda n: 440 * 2 ** ((n - 69) / 12); T = lambda d: np.arange(int(d * SR)) / SR
music = np.zeros(N); sfx = np.zeros(N); wet = np.zeros(N); bells = np.zeros(N)
def put(b, st, s, v=1.):
    a = int(st * SR); L = min(len(s), N - a)
    if L > 0 and a >= 0: b[a:a + L] += v * s[:L]
lp = lambda x, k: np.convolve(x, np.ones(k) / k, 'same')
def note(st, n, d, v):        # electric-piano tone
    tt = T(d); s = np.sin(2 * np.pi * f(n) * tt + .9 * np.sin(2 * np.pi * f(n) * tt) * np.exp(-tt * 3)) * np.exp(-tt * 2.2) * np.minimum(1, tt / .004)
    put(wet, st, s, v)
def pad(a, b, notes, v):
    m = (t >= a) & (t < b); tt = t[m] - a; env = np.minimum(1, tt / .8) * np.minimum(1, (b - t[m]) / .8)
    music[m] += v * env * sum(np.sin(2 * np.pi * f(n) * t[m] + i) * (1 + .2 * np.sin(2 * np.pi * .3 * t[m] + i)) for i, n in enumerate(notes))
kick = lambda: np.sin(2 * np.pi * np.cumsum(48 + 110 * np.exp(-T(.32) * 32)) / SR) * np.exp(-T(.32) * 10)
def hat(): n = rng.standard_normal(int(.05 * SR)); n -= lp(n, 6); return n * np.exp(-T(.05) * 95)
def clap():
    n = lp(rng.standard_normal(int(.22 * SR)), 2); e = np.exp(-T(.22) * 18); e[:int(.012 * SR)] *= 1.6; return n * e
bt = 60 / R['bpm']; prog = [[53, 57, 60, 64], [57, 60, 64, 67], [50, 57, 60, 65], [48, 55, 60, 64]]   # Fmaj7 Am7 Dm7 Cmaj7
calm = (17.4, 23.6)
k = 0; st = 0.0
while st < D - .4:
    bar, j = k // 4, k % 4; ch = prog[bar % 4]; inCalm = calm[0] <= st < calm[1]
    if j == 0:
        pad(st, st + 4 * bt, ch, .018 if not inCalm else .03)
        note(st, ch[0] - 12, 4 * bt, .16)                                       # bass
    if not inCalm:
        put(music, st, kick(), .5 if j in (0, 2) else 0); put(music, st + bt * .75, kick(), .22 if j == 2 else 0)
        put(music, st, clap(), .16 if j in (1, 3) else 0)
        put(music, st, hat(), .07); put(music, st + bt / 2, hat(), .05)
        if j in (1, 3): note(st + bt / 2, ch[(k // 2) % 4] + 12, .5, .05)          # EP stab
    else:
        put(music, st + bt / 2, hat(), .03)
        if j == 0: note(st, ch[3] + 12, 2.4, .06)
    st += bt; k += 1
for n in (53, 60, 64, 69, 72): note(st, n, 2.5, .06)
# ---------------------------------------------------------------- sfx
def whoosh(c):
    L = int(.5 * SR); n = lp(rng.standard_normal(L), 9); e = np.sin(np.linspace(0, np.pi, L)) ** 2; put(sfx, c - .3, n * e, .09)
def tick(c): put(sfx, c, np.sin(2 * np.pi * np.cumsum(900 + 900 * np.exp(-T(.06) * 70)) / SR) * np.exp(-T(.06) * 60), .06)
def bell(c, n, v, d=1.4): tt = T(d); put(bells, c, (np.sin(2 * np.pi * f(n) * tt) + .3 * np.sin(2 * np.pi * f(n) * 2.76 * tt) * np.exp(-tt * 4)) * np.exp(-tt * 3), v)
put(sfx, 0, np.sin(2 * np.pi * np.cumsum(40 + 70 * np.exp(-T(1.2) * 6)) / SR) * np.exp(-T(1.2) * 3), .45)   # hook impact
put(sfx, 0, lp(rng.standard_normal(int(.4 * SR)), 3) * np.exp(-T(.4) * 14), .12)
for c in R['cuts']: whoosh(c)
for c in R['captions']: tick(c['t'][0])
for c in R['taps']: put(sfx, c, lp(rng.standard_normal(int(.03 * SR)), 2) * np.exp(-T(.03) * 160), .14); bell(c, 96, .015, .3)
bell(R['ping'], 88, .06); bell(R['ping'] + .11, 93, .055)
put(sfx, R['lock'], lp(rng.standard_normal(int(.05 * SR)), 3) * np.exp(-T(.05) * 120), .18)
bell(R['button'], 84, .05, 2); bell(R['button'] + .13, 88, .045, 2)
bell(1.35, 79, .03)    # strike-through accent
# reverb on wet bus
ir = rng.standard_normal(int(1.6 * SR)) * np.exp(-T(1.6) * 3.2); ir = lp(ir, 5); ir /= np.sqrt((ir ** 2).sum()) * 4
L = 1 << int(np.ceil(np.log2(N + len(ir)))); verb = lambda x: np.fft.irfft(np.fft.rfft(x, L) * np.fft.rfft(ir, L), L)[:N]
fade = np.minimum(1, t / .02) * np.minimum(1, (D - t) / .6)
def write(name, x):
    x = np.tanh(x * fade * 1.15) / 1.15; x = x / (np.abs(x).max() + 1e-9) * .89
    with wave.open(f'build/{name}.wav', 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR); w.writeframes((x * 32767).astype('<i2').tobytes())
fx = sfx + bells + verb(bells) * .8
write('mix', music + wet + verb(wet) * .8 + fx)
write('sfx_only', fx)
print('audio written')
