"""python3 tools/master.py in.wav out.wav [target LUFS, default -14]  — gain to target with a look-ahead peak limiter (ceiling -3.2 dBFS)."""
import sys, wave, subprocess, re, numpy as np
src, dst = sys.argv[1], sys.argv[2]; TARGET = float(sys.argv[3]) if len(sys.argv) > 3 else -14
with wave.open(src) as w: sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), '<i2').astype(float) / 32768
def lufs(path):
    o = subprocess.run(['ffmpeg', '-hide_banner', '-i', path, '-af', 'ebur128', '-f', 'null', '-'], capture_output=True, text=True).stderr
    return float(re.findall(r'I:\s+(-?[\d.]+) LUFS', o)[-1])
def limit(y, ceil=10 ** (-3.2 / 20)):
    la = int(.005 * sr); a = np.abs(np.concatenate([y, np.zeros(la)]))
    pk = np.array([a[i:i + la].max() for i in range(0, len(y), 1)]) if len(y) < 0 else np.maximum.reduce([a[k:k + len(y)] for k in range(0, la, max(1, la // 16))])
    g = np.minimum(1, ceil / np.maximum(pk, 1e-9)); rel = np.exp(-1 / (.08 * sr))
    for i in range(1, len(g)): g[i] = min(g[i], g[i - 1] * rel + (1 - rel))      # smooth release
    return y * g
def save(y, p):
    with wave.open(p, 'wb') as w: w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr); w.writeframes((np.clip(y, -1, 1) * 32767).astype('<i2').tobytes())
gain = 1.0
for _ in range(4):
    y = limit(x * gain); save(y, dst); L = lufs(dst); print(f'gain {20*np.log10(gain):+.1f} dB -> {L:.1f} LUFS, peak {20*np.log10(np.abs(y).max()):.1f} dBFS')
    if abs(L - TARGET) < .3: break
    gain *= 10 ** ((TARGET - L) / 20)
