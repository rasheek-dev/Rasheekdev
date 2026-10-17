"""Sound design + mix for the Mentra ad.

  python3 tools/audio.py <main|short>

Reads build/<cut>/cues.json (written by tools/render.mjs) and writes build/<cut>/mix.wav:
  music  : soft piano + warm pads, moving from tension (hook/weight) to calm (turn) to warmth (Mentra/end)
  sfx    : thread shimmer, glass ticks for the metaphors, breath, calming chime, soft whooshes,
           laptop click, link pluck, CTA chime
  voice  : if recorded lines exist in vo/<cut>/01.wav, 02.wav ... (any format ffmpeg reads),
           each is placed at its start time from config.js and the music is ducked under it.
"""
import json, sys, os, glob, subprocess, wave
import numpy as np

cut = sys.argv[1] if len(sys.argv) > 1 else 'main'
cfg = json.load(open(f'build/{cut}/cues.json'))
SR = 44100; D = cfg['duration']; N = int(SR * D); t = np.arange(N) / SR
rng = np.random.default_rng(11)
music = np.zeros(N); sfx = np.zeros(N); wet = np.zeros(N)
f = lambda n: 440 * 2 ** ((n - 69) / 12)
T = lambda d: np.arange(int(d * SR)) / SR
sc = cfg['scenes']

def put(buf, st, s, v=1.0):
    a = int(st * SR); L = min(len(s), N - a)
    if L > 0 and a >= 0: buf[a:a + L] += v * s[:L]

def lp(x, k): return np.convolve(x, np.ones(k) / k, 'same')

def piano(st, n, d=3.0, v=.12, bus=None):
    tt = T(d); fr = f(n)
    s = sum(np.sin(2 * np.pi * fr * h * tt * (1 + .0004 * h)) * (.55 ** (h - 1)) for h in (1, 2, 3, 4))
    s *= np.exp(-tt * (2.2 / d) * 2.4) * np.minimum(1, tt / .006)
    put(wet if bus is None else bus, st, s, v)

def pad(a, b, notes, v=.035, fade=1.2):
    m = (t >= a - fade) & (t < b + fade); tt = t[m]
    env = np.clip(np.minimum(tt - (a - fade), (b + fade) - tt) / fade, 0, 1) ** 1.5
    s = sum(np.sin(2 * np.pi * f(n) * tt + i) * (1 + .2 * np.sin(2 * np.pi * .13 * tt + i)) +
            .3 * np.sin(2 * np.pi * f(n) * 2.002 * tt) for i, n in enumerate(notes))
    music[m] += v * env * s

def noise_swell(st, d, v, smooth=8, hp=False):
    L = int(d * SR); n = rng.standard_normal(L); n = lp(n, smooth)
    if hp: n = n - lp(n, 40)
    e = np.sin(np.linspace(0, np.pi, L)) ** 2
    put(sfx, st, n * e, v)

def bell(st, n, d=2.5, v=.06):
    tt = T(d); s = (np.sin(2 * np.pi * f(n) * tt) + .4 * np.sin(2 * np.pi * f(n) * 2.76 * tt) * np.exp(-tt * 3)) * np.exp(-tt * 2.2)
    put(wet, st, s * np.minimum(1, tt / .003), v)

# ---------------------------------------------------------------- music
tense = [x for x in ('hook', 'weight') if x in sc]
t_end_tense = max(sc[x][1] for x in tense)
turn = sc['turn']; warm_start = turn[1]
# tension: suspended Am(add9) -> Fmaj7(#11) pads, sparse then denser piano
pad(0, t_end_tense, [45, 52, 59, 64], .03)
pad(sc['weight'][0] if 'weight' in sc else 1.5, t_end_tense, [53, 60, 64, 71], .022)
motif = [76, 72, 71, 69, 71, 72]
tk = .25; i = 0
while tk < t_end_tense:
    dens = .9 if tk < (sc['hook'][1]) else max(.42, .8 - .07 * (tk - sc['hook'][1]))
    piano(tk, motif[i % len(motif)] - (12 if i % 4 == 3 else 0), 2.6, .07 + .015 * min(1, tk / max(1, t_end_tense)))
    tk += dens; i += 1
# irregular ticking texture (soft), slowing and stopping through the turn
tk = .4
while tk < turn[0] + 1.8:
    slow = 1 + max(0, tk - turn[0]) * 1.4
    L = int(.018 * SR); c = rng.standard_normal(L); c = c - lp(c, 6); c *= np.exp(-T(.018) * 260)
    put(sfx, tk, c, .045 * (1 if tk < turn[0] else max(0, 1 - (tk - turn[0]) / 1.8)))
    tk += rng.uniform(.33, .82) * slow
# turn: everything breathes on one sustained chord
pad(turn[0], turn[1], [48, 55, 59, 64], .03, 1.6)
piano(turn[0] + .9, 64, 4, .07); piano(turn[0] + 2.6, 67, 4, .06)
# warmth: C - G/B - Am - F with a gentle melody
prog = [[48, 55, 64, 67], [47, 55, 62, 67], [45, 52, 60, 64], [41, 53, 57, 64]]
mel = [76, 74, 72, 74, 76, 79, 76, 72]
bar = 2.4; st = warm_start; k = 0
while st < D - 2.2:
    ch = prog[k % 4]
    pad(st, st + bar, ch, .026, .9)
    piano(st, ch[0], 3.2, .10)
    for j, n in enumerate([ch[1] + 12, ch[2] + 12, ch[3] + 12]): piano(st + .6 * (j + 1), n, 2.4, .045)
    if k % 2 == 1: piano(st + .3, mel[(k // 2) % len(mel)], 3, .05)
    st += bar; k += 1
for n in (48, 55, 64, 67, 72): piano(st, n, 4.5, .08)      # final resolve
pad(st, D, [48, 55, 64], .02, 1.5)

# ---------------------------------------------------------------- sound effects
for kind, c in cfg['cues']:
    if kind == 'threads': noise_swell(c, 2.2, .05, 3, hp=True)
    elif kind == 'meta': bell(c, 88, 1.2, .025)
    elif kind == 'calm':
        for j, n in enumerate([84, 79, 76]): bell(c + j * .38, n, 2.5, .04)
    elif kind == 'breath': noise_swell(c, 1.9, .07, 30)
    elif kind == 'whoosh': noise_swell(c - .35, .9, .06, 12)
    elif kind == 'teal': bell(c, 91, 3, .02); bell(c + .2, 86, 3, .02)
    elif kind == 'lid':
        L = int(.04 * SR); n = rng.standard_normal(L) * np.exp(-T(.04) * 120); put(sfx, c + .9, lp(n, 4), .12)
    elif kind == 'link': bell(c, 79, 1.5, .04); bell(c + .45, 84, 1.8, .04)
    elif kind == 'button': bell(c, 84, 2.2, .06); bell(c + .14, 88, 2.4, .05)

# light reverb on the wet bus (piano + bells)
ir = rng.standard_normal(int(2.2 * SR)) * np.exp(-T(2.2) * 2.6); ir = lp(ir, 5); ir /= np.sqrt((ir ** 2).sum()) * 4
Lf = 1 << int(np.ceil(np.log2(N + len(ir))))
rev = np.fft.irfft(np.fft.rfft(wet, Lf) * np.fft.rfft(ir, Lf), Lf)[:N]
music = music + wet + rev * .9

# ---------------------------------------------------------------- voice-over (optional)
vo = np.zeros(N); have_vo = False
files = sorted(glob.glob(f'vo/{cut}/*.*'))
for idx, (start, _end) in enumerate(cfg['vo']):
    match = [p for p in files if os.path.basename(p).split('.')[0] == f'{idx + 1:02d}']
    if not match: continue
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', match[0], '-ac', '1', '-ar', str(SR), '-f', 's16le', '-'], capture_output=True).stdout
    line = np.frombuffer(raw, '<i2').astype(float) / 32768
    put(vo, start, line, 1.0); have_vo = True
if have_vo:
    env = lp(np.abs(vo), int(.08 * SR)); env = env / (env.max() + 1e-9)
    duck = 1 - .6 * np.clip(env * 6, 0, 1)                      # about -8 dB under speech
    duck = lp(duck, int(.12 * SR))
    music *= duck; sfx *= (.6 + .4 * duck)

mix = music + sfx + vo * (1.0 if have_vo else 0)
mix *= np.minimum(1, t / .05) * np.minimum(1, (D - t) / 1.2)
mix = np.tanh(mix * 1.1) / 1.1
mix = mix / (np.abs(mix).max() + 1e-9) * .89
with wave.open(f'build/{cut}/mix.wav', 'wb') as w:
    w.setnchannels(1); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((mix * 32767).astype('<i2').tobytes())
print(f'{cut}: mix.wav written ({"with" if have_vo else "without"} voice-over)')
