"""Mentra '3:47 AM' reel: cut, grade, sound, captions, score, end card."""
import glob, json, math, os, subprocess, sys
import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

U = "/root/.claude/uploads/62844aaa-bd7f-5109-9362-23bbbbf56de4"
HERE = os.path.dirname(os.path.abspath(__file__))
WORK = os.path.join(HERE, "work")
OUT = sys.argv[1]
LOGO = "/home/user/Rasheekdev/assets/mentra-logo.png"
os.makedirs(WORK, exist_ok=True)
W, H, FPS, SR = 1080, 1920, 24, 48000

def clip(n): return glob.glob(f"{U}/*Scene_{n:02d}.mp4")[0]
def run(*a):
    r = subprocess.run(a, capture_output=True, text=True)
    if r.returncode: print(r.stderr[-3000:]); raise SystemExit(1)

# ---- grades ---------------------------------------------------------------
COMMON = "scale=1080:1920:flags=lanczos,unsharp=5:5:0.55:5:5:0,noise=alls=4:allf=t,vignette=angle=PI/5"
GRADE = {
    "night":   "colorbalance=rs=-0.05:bs=0.07:rm=-0.03:bm=0.04:rh=-0.02:bh=0.02,eq=contrast=1.06:saturation=0.82:gamma=0.97",
    "stress":  "colorbalance=rs=-0.03:bs=0.05:rm=-0.02:bm=0.03,eq=contrast=1.07:saturation=0.78",
    "dusk":    "colorbalance=rs=-0.03:bs=0.05:bm=0.02,eq=contrast=1.05:saturation=0.9",
    "lamp":    "colorbalance=rs=0.02:bs=-0.01:rm=0.01,eq=contrast=1.04:saturation=0.9",
    "meera":   "crop=640:1136:40:69,colorbalance=rs=0.02:bs=-0.02,eq=contrast=1.03:saturation=0.95",
    "morning": "colorbalance=rs=0.06:gs=0.01:bs=-0.07:rm=0.04:bm=-0.04:rh=0.03:bh=-0.03,eq=contrast=1.04:saturation=1.08:brightness=0.02",
}

# ---- edit decision list ---------------------------------------------------
# (source, in, out, grade, video speed, audio treatment)
EDL = [
    ("s1a", 1, 0.3, 3.5, "night", 1, ""),
    ("s1b", 1, 6.2, 8.0, "night", 1, ""),
    ("s2a", 2, 4.8, 6.2, "stress", 1, "lowpass=f=900"),
    ("s2b", 2, 6.2, 7.6, "stress", 0.75, "lowpass=f=700"),
    ("s3",  3, 3.5, 6.1, "stress", 1, ""),
    ("blk", None, 0, 0.9, None, 1, ""),
    ("s4",  4, 1.0, 4.6, "dusk", 1, ""),
    ("s5",  5, 1.6, 4.1, "dusk", 1, ""),
    ("s6a", 6, 2.0, 4.1, "lamp", 1, ""),
    ("s7",  7, 0.0, 4.4, "meera", 1, ""),
    ("s6b", 6, 4.9, 7.7, "lamp", 1, "LCUT"),   # Meera's last line plays over Anjali
    ("s8",  8, 1.0, 6.8, "morning", 1, ""),
    ("end", None, 0, 8.4, None, 1, ""),
]
XFADE = {"s8": 0.6, "end": 0.7}   # dissolves into these; everything else is a hard cut

def render_segment(name, n, a, b, grade, speed, afx):
    dst = f"{WORK}/{name}.mp4"
    dur = (b - a) / speed
    if name == "blk":
        run("ffmpeg", "-v", "error", "-y", "-f", "lavfi", "-i", f"color=black:s={W}x{H}:r={FPS}:d={dur}",
            "-f", "lavfi", "-i", f"anullsrc=r={SR}:cl=stereo", "-t", str(dur),
            "-c:v", "libx264", "-crf", "14", "-pix_fmt", "yuv420p", "-c:a", "pcm_s16le", dst.replace(".mp4", ".mov"))
        return dst.replace(".mp4", ".mov"), dur
    if name == "end":
        frames = f"{WORK}/endcard"
        end_card(frames, dur)
        run("ffmpeg", "-v", "error", "-y", "-framerate", str(FPS), "-i", f"{frames}/f%04d.png",
            "-f", "lavfi", "-i", f"anullsrc=r={SR}:cl=stereo", "-t", str(dur),
            "-c:v", "libx264", "-crf", "14", "-pix_fmt", "yuv420p", "-c:a", "pcm_s16le", dst.replace(".mp4", ".mov"))
        return dst.replace(".mp4", ".mov"), dur
    src = f"{HERE}/s5_composited.mp4" if n == 5 else clip(n)
    vf = f"{GRADE[grade]},{COMMON},setpts={1/speed}*(PTS-STARTPTS),fps={FPS}"
    if afx == "LCUT":
        # Anjali's room tone under Dr. Meera's final line from clip 7.
        filt = (f"[0:v]trim={a}:{b},{vf}[v];"
                f"[0:a]atrim={a}:{b},asetpts=PTS-STARTPTS,volume=0.5[a0];"
                f"[1:a]atrim=5.4:{5.4 + dur},asetpts=PTS-STARTPTS,highpass=f=180,volume=1.0[a1];"
                f"[a0][a1]amix=inputs=2:normalize=0,afade=t=in:d=0.02,afade=t=out:st={dur - 0.03}:d=0.03[a]")
        run("ffmpeg", "-v", "error", "-y", "-i", src, "-i", clip(7), "-filter_complex", filt, "-map", "[v]", "-map", "[a]",
            "-t", str(dur), "-c:v", "libx264", "-crf", "14", "-pix_fmt", "yuv420p", "-c:a", "pcm_s16le", "-ar", str(SR), "-ac", "2",
            dst.replace(".mp4", ".mov"))
        return dst.replace(".mp4", ".mov"), dur
    af = f"atrim={a}:{b},asetpts=PTS-STARTPTS"
    if speed != 1: af += f",atempo={speed}"
    if afx: af += "," + afx
    af += f",afade=t=in:d=0.02,afade=t=out:st={dur - 0.03:.3f}:d=0.03"
    run("ffmpeg", "-v", "error", "-y", "-i", src, "-filter_complex",
        f"[0:v]trim={a}:{b},{vf}[v];[0:a]{af}[a]", "-map", "[v]", "-map", "[a]", "-t", f"{dur:.3f}",
        "-c:v", "libx264", "-crf", "14", "-pix_fmt", "yuv420p", "-c:a", "pcm_s16le", "-ar", str(SR), "-ac", "2",
        dst.replace(".mp4", ".mov"))
    return dst.replace(".mp4", ".mov"), dur

# ---- type -----------------------------------------------------------------
FD = "/usr/share/fonts/opentype/inter/"
def F(w, s): return ImageFont.truetype(FD + {"b": "InterDisplay-Bold.otf", "s": "Inter-SemiBold.otf",
                                               "m": "Inter-Medium.otf", "r": "Inter-Regular.otf"}[w], s)
P, PK, INK, SP = (87, 73, 226), (246, 90, 132), (41, 39, 58), (243, 241, 255)

def ease(x): x = max(0.0, min(1.0, x)); return 1 - (1 - x) ** 3

def draw_title(layer, lines, y, size, alpha, rise):
    """Big centred title with a soft shadow for legibility over footage."""
    txt = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(txt)
    f = F("b", size)
    for i, s in enumerate(lines):
        w = d.textlength(s, font=f)
        d.text(((W - w) / 2, y + i * size * 1.12 - rise), s, font=f, fill=(255, 255, 255, 255))
    sh = txt.getchannel("A").filter(ImageFilter.GaussianBlur(14)).point(lambda v: int(v * 0.55))
    shadow = Image.new("RGBA", (W, H), (0, 0, 0, 255)); shadow.putalpha(sh)
    out = Image.alpha_composite(shadow, txt)
    out.putalpha(out.getchannel("A").point(lambda v: int(v * alpha)))
    layer.alpha_composite(out)

def draw_sub(layer, s, alpha):
    """Dialogue caption: pill, lower third (above Instagram's caption area)."""
    d = ImageDraw.Draw(layer)
    f = F("s", 46)
    w = d.textlength(s, font=f)
    x0, y0 = (W - w) / 2 - 34, 1330
    pill = Image.new("RGBA", (W, H), (0, 0, 0, 0))
    pd = ImageDraw.Draw(pill)
    pd.rounded_rectangle((x0, y0, x0 + w + 68, y0 + 86), radius=43, fill=(20, 18, 30, int(150 * alpha)))
    pd.text((x0 + 34, y0 + 16), s, font=f, fill=(255, 255, 255, int(255 * alpha)))
    layer.alpha_composite(pill)

# ---- end card ---------------------------------------------------------------
def end_card(out_dir, dur):
    os.makedirs(out_dir, exist_ok=True)
    logo = Image.open(LOGO).convert("RGBA")
    mark = logo.crop((0, 0, 250, 250))
    word = logo.resize((440, 110), Image.LANCZOS)
    for f in range(int(round(dur * FPS))):
        t = f / FPS
        s = 4
        bg = Image.new("RGB", (W // s, H // s), SP)
        d = ImageDraw.Draw(bg)
        for col, cx, cy, r, sp, ph in [(P, .2, .2, 120, .3, 0), (PK, .85, .5, 105, .25, 2), ((44, 232, 182), .3, .88, 110, .35, 4)]:
            x = cx * W / s + 30 * math.sin(t * sp + ph); y = cy * H / s + 40 * math.cos(t * sp + ph)
            tint = tuple(int(SP[i] * .55 + col[i] * .45) for i in range(3))
            d.ellipse((x - r, y - r, x + r, y + r), fill=tint)
        c = bg.filter(ImageFilter.GaussianBlur(70)).resize((W, H), Image.BICUBIC).convert("RGBA")
        e = ease((t - 0.2) / 0.8)
        m = mark.resize((int(230 * (.85 + .15 * e)),) * 2, Image.LANCZOS).rotate(-30 * (1 - e), resample=Image.BICUBIC)
        m.putalpha(m.getchannel("A").point(lambda v: int(v * e)))
        c.alpha_composite(m, ((W - m.width) // 2, 470 - (m.height - 230) // 2))
        L = Image.new("RGBA", (W, H), (0, 0, 0, 0)); d = ImageDraw.Draw(L)
        def ctext(y, s, font, fill, a):
            w = d.textlength(s, font=font); d.text(((W - w) / 2, y), s, font=font, fill=fill[:3] + (int(255 * a),))
        a1 = ease((t - 0.5) / 0.5); a2 = ease((t - 0.9) / 0.5); a3 = ease((t - 1.3) / 0.5)
        ctext(780, "You don’t have to", F("b", 92), INK, a1)
        ctext(890, "carry it alone.", F("b", 92), INK, a1)
        ctext(1050, "Licensed psychologists · Malayalam & English", F("m", 40), (90, 88, 110), a2)
        # button
        f_btn = F("s", 54); label = "Book a session"; bw = d.textlength(label, font=f_btn) + 150
        pulse = 1 + 0.025 * math.sin(max(0, t - 1.8) * 4)
        bh = 128 * pulse; bw *= pulse; y0 = 1170
        d.rounded_rectangle(((W - bw) / 2, y0, (W + bw) / 2, y0 + bh), radius=int(bh / 2), fill=P + (int(255 * a3),))
        bb = d.textbbox((0, 0), label, font=f_btn)
        d.text(((W - (bb[2] - bb[0])) / 2 - bb[0], y0 + (bh - (bb[3] - bb[1])) / 2 - bb[1]), label, font=f_btn, fill=(255, 255, 255, int(255 * a3)))
        ctext(1350, "mentracare.in", F("s", 54), PK, a3)
        ctext(1745, "Dramatisation · AI-generated actors", F("r", 30), (120, 118, 140), a3 * 0.9)
        c.alpha_composite(L)
        c.convert("RGB").save(f"{out_dir}/f{f:04d}.png", compress_level=1)

# ---- score ----------------------------------------------------------------
def piano(dur_total, events, path):
    """Soft felt-piano: additive partials, hammer softness, long decay, room reverb."""
    n = int(dur_total * SR); out = np.zeros((n, 2))
    rng = np.random.default_rng(7)
    for t0, midi, vel, pan in events:
        f0 = 440 * 2 ** ((midi - 69) / 12)
        L = int(min(6.0, dur_total - t0) * SR)
        if L <= 0: continue
        t = np.arange(L) / SR
        tone = np.zeros(L)
        for k in range(1, 8):
            fk = f0 * k * (1 + 0.0004 * k * k)  # slight inharmonicity
            amp = (1 / k ** 1.8) * (0.6 if k > 3 else 1)
            tone += amp * np.sin(2 * np.pi * fk * t + rng.uniform(0, 6.28)) * np.exp(-t * (0.9 + 0.55 * k))
        tone *= np.minimum(1, t / 0.012) * vel
        i0 = int(t0 * SR)
        out[i0:i0 + L, 0] += tone * (1 - pan) ; out[i0:i0 + L, 1] += tone * pan
    # reverb: decaying noise impulse, per channel
    ir_len = int(2.8 * SR); tt = np.arange(ir_len) / SR
    for ch in range(2):
        ir = rng.standard_normal(ir_len) * np.exp(-tt * 2.2); ir[0] = 0
        wet = np.fft.irfft(np.fft.rfft(out[:, ch], n + ir_len) * np.fft.rfft(ir, n + ir_len))[:n]
        out[:, ch] = out[:, ch] * 0.75 + wet / np.abs(wet).max() * np.abs(out[:, ch]).max() * 0.45
    out /= np.abs(out).max() + 1e-9
    out *= 0.6
    import wave
    with wave.open(path, "wb") as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes((out * 32767).astype(np.int16).tobytes())

def score_events(start, mood_shift, end):
    """Am(add9) F(maj7) C G ... then lifts to F G C(add9) for the morning."""
    ev = []
    sad = [[45, 57, 64, 71, 72], [41, 53, 60, 64, 69], [48, 55, 64, 67, 72], [43, 55, 62, 67, 71]]
    lift = [[41, 57, 60, 65, 69], [43, 55, 62, 67, 71], [36, 55, 64, 67, 74, 76]]
    t = start; bar = 2.4; i = 0
    while t < mood_shift - 0.5:
        ch = sad[i % 4]
        ev.append((t, ch[0], 0.55, 0.45))
        for j, nte in enumerate(ch[1:]):
            ev.append((t + 0.3 + j * 0.42, nte, 0.32, 0.35 + 0.1 * j))
        t += bar; i += 1
    t = mood_shift
    for k, ch in enumerate(lift):
        ev.append((t, ch[0], 0.6, 0.45))
        for j, nte in enumerate(ch[1:]):
            ev.append((t + 0.25 + j * 0.33, nte, 0.38, 0.35 + 0.08 * j))
        t += 2.0 if k < 2 else 0
    return ev

# ---- build ----------------------------------------------------------------
def cached(e):
    p = f"{WORK}/{e[0]}.mov"
    if os.path.exists(p) and "--fresh" not in sys.argv:
        d = float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", p],
                                 capture_output=True, text=True).stdout)
        return p, round(d * FPS) / FPS
    return render_segment(*e)
segs = [cached(e) for e in EDL]
names = [e[0] for e in EDL]
starts, t = {}, 0.0
for (name, *_), (_, dur) in zip(EDL, segs):
    if name in XFADE: t -= XFADE[name]
    starts[name] = t; t += dur
TOTAL = t
durs = {e[0]: d for e, (_, d) in zip(EDL, segs)}
print(json.dumps({k: round(v, 2) for k, v in starts.items()}), "total", round(TOTAL, 2))

# concat: hard cuts in one concat, then dissolves into the morning and end card.
# Audio is padded/trimmed to each segment's exact video length so nothing drifts.
inputs = sum([["-i", p] for p, _ in segs], [])
fc = [f"[{i}:v]setsar=1,fps={FPS},format=yuv420p,settb=AVTB[n{i}];"
      f"[{i}:a]aformat=sample_rates={SR}:channel_layouts=stereo,apad,atrim=0:{durs[names[i]]:.4f}[m{i}]" for i in range(len(segs))]
hard = [i for i, nm in enumerate(names) if nm not in XFADE]
assert hard == list(range(len(hard)))
fc.append("".join(f"[n{i}][m{i}]" for i in hard) + f"concat=n={len(hard)}:v=1:a=1[vc0][ac];[vc0]settb=AVTB[vc]")
vprev, aprev, acc = "[vc]", "[ac]", sum(durs[names[i]] for i in hard)
for i in range(len(hard), len(segs)):
    xf = XFADE[names[i]]
    fc.append(f"{vprev}[n{i}]xfade=transition=fade:duration={xf}:offset={acc - xf:.4f}[v{i}]")
    fc.append(f"{aprev}[m{i}]acrossfade=d={xf}[a{i}]")
    acc += durs[names[i]] - xf
    vprev, aprev = f"[v{i}]", f"[a{i}]"
run("ffmpeg", "-v", "error", "-y", *inputs, "-filter_complex", ";".join(fc), "-map", vprev, "-map", aprev,
    "-c:v", "libx264", "-crf", "14", "-pix_fmt", "yuv420p", "-c:a", "pcm_s16le", f"{WORK}/cut.mov")

# captions as an RGBA frame sequence
S = starts
TITLES = []  # the voiceover now carries what the big titles used to say

# Voiceover (ElevenLabs, voice "Parul", take 1). Each line: source in/out in the
# take, where it lands on the timeline, and its caption chunks (source times).
VO_TAKE = f"{HERE}/vo/take1.mp3"
VO = [
    (0.15, 4.70, S["s1a"] + 0.4, [(0.24, 1.75, "Three forty-seven a.m."), (2.48, 4.6, "Still awake. Again.")]),
    (4.82, 6.98, S["s2a"] + 0.2, [(4.88, 6.9, "At work, I hold it together.")]),
    (7.38, 9.62, S["s3"] + 0.1, [(7.44, 9.55, "At home\u2026 I just nod along.")]),
    (9.97, 13.22, S["s4"] + 0.25, [(10.0, 11.14, "But maybe\u2026"), (11.16, 12.2, "I don\u2019t have to carry"), (12.2, 13.15, "all of this alone.")]),
    (13.56, 14.86, S["s5"] + 0.25, [(13.6, 14.8, "So I reached out.")]),
    (15.01, 19.82, S["s8"] + 0.4, [(15.04, 17.0, "It didn\u2019t fix everything overnight."), (17.3, 18.3, "But this morning\u2026"), (18.45, 19.78, "feels a little lighter.")]),
    (19.97, 27.62, S["end"] + 0.35, []),   # end card already shows the CTA text
]
SUBS = [
    (S["s6a"] + 0.35, S["s7"], "I don\u2019t really know where to start."),
    (S["s7"] + 0.0, S["s7"] + 2.4, "That\u2019s okay."),
    (S["s7"] + 3.3, S["s6b"], "Start anywhere."),
    (S["s6b"] + 0.05, S["s6b"] + durs["s6b"] - 0.1, "I\u2019m listening."),
]
DIALOGUE = list(SUBS)
for a, b, at, caps in VO:
    for ca, cb, txt in caps:
        SUBS.append((at + ca - a, at + cb - a + 0.12, txt))
VO_SPANS = [(at, at + b - a) for a, b, at, _ in VO]

# Build the VO track: each line cut from the take and dropped at its slot.
raw = subprocess.run(["ffmpeg", "-v", "error", "-i", VO_TAKE, "-ac", "2", "-ar", str(SR), "-f", "f32le", "-"],
                     capture_output=True, check=True).stdout
take = np.frombuffer(raw, np.float32).reshape(-1, 2)
vo = np.zeros((int(TOTAL * SR) + SR, 2), np.float32)
for a, b, at, _ in VO:
    seg = take[int(a * SR):int(b * SR)].copy()
    n = len(seg); r = int(0.015 * SR)
    seg[:r] *= np.linspace(0, 1, r)[:, None]; seg[-r:] *= np.linspace(1, 0, r)[:, None]
    i0 = int(at * SR); vo[i0:i0 + n] += seg
import wave
with wave.open(f"{WORK}/vo.wav", "wb") as w:
    w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR)
    w.writeframes((np.clip(vo[:int(TOTAL * SR)], -1, 1) * 32767).astype(np.int16).tobytes())

cap_dir = f"{WORK}/caps"; os.makedirs(cap_dir, exist_ok=True)
nfr = int(round(TOTAL * FPS))
blank = Image.new("RGBA", (W, H), (0, 0, 0, 0))
for f in range(nfr):
    tt = f / FPS
    layer = blank.copy()
    for a, b, lines, y, size in TITLES:
        if a <= tt < b:
            fi, fo = ease((tt - a) / 0.35), 1 - ease((tt - (b - 0.2)) / 0.2)
            draw_title(layer, lines, y, size, min(fi, fo), 18 * (1 - ease((tt - a) / 0.5)))
    for a, b, s in SUBS:
        if a <= tt < b:
            draw_sub(layer, s, min(ease((tt - a) / 0.15), 1 - ease((tt - (b - 0.12)) / 0.12)))
    layer.save(f"{cap_dir}/c{f:04d}.png", compress_level=1)

# score: enters on the balcony, lifts for the morning, resolves on the end card
music = f"{WORK}/score.wav"
piano(TOTAL, score_events(S["s4"] + 0.2, S["s8"] + 0.3, TOTAL), music)
# duck the score under dialogue and voiceover; dip the location sound under VO
duck = "+".join(f"between(t,{a - 0.15:.2f},{b + 0.1:.2f})" for a, b in [(x, y) for x, y, _ in DIALOGUE] + VO_SPANS)
vduck = "+".join(f"between(t,{a - 0.1:.2f},{b + 0.1:.2f})" for a, b in VO_SPANS)
mstart = S["s4"] + 0.2
fade_out_st = TOTAL - 1.8

run("ffmpeg", "-v", "error", "-y", "-i", f"{WORK}/cut.mov", "-framerate", str(FPS), "-i", f"{cap_dir}/c%04d.png", "-i", music, "-i", f"{WORK}/vo.wav",
    "-filter_complex",
    f"[0:v][1:v]overlay=0:0:format=auto[v];"
    f"[2:a]atrim=0:{TOTAL},volume='if({duck},0.35,1)':eval=frame,afade=t=in:st={mstart:.2f}:d=1.5,afade=t=out:st={fade_out_st:.2f}:d=1.8,volume=0.55[m];"
    f"[0:a]volume='if({vduck},0.55,1)':eval=frame[d];"
    f"[3:a]highpass=f=80,acompressor=threshold=-20dB:ratio=3:attack=5:release=120,volume=1.6[vo];"
    f"[d][m][vo]amix=inputs=3:normalize=0,loudnorm=I=-14:TP=-1.5:LRA=11[a]",
    "-map", "[v]", "-map", "[a]", "-c:v", "libx264", "-preset", "slow", "-crf", "20", "-maxrate", "16M", "-bufsize", "32M", "-profile:v", "high", "-pix_fmt", "yuv420p",
    "-r", str(FPS), "-c:a", "aac", "-b:a", "256k", "-ar", str(SR), "-movflags", "+faststart", OUT)
print("wrote", OUT)
