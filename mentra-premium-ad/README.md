# Mentra premium ad: source and export

```
mentra-premium-ad/
├─ index.html          preview player (play / pause / restart / scrub / 40s↔15s / safe zones)
├─ src/config.js       ALL on-screen text, voice-over lines and timings, for both cuts
├─ src/engine.js       scenes, threads, camera and timelines (deterministic: frame = f(time))
├─ src/character.js    protagonist (SVG rig: head tilt, breath, blink, arm, phone, warm light)
├─ assets/             Mentra logo + fonts (Plus Jakarta Sans, DM Sans, Noto Sans Malayalam; all SIL OFL)
├─ tools/render.mjs    headless-Chromium frame renderer
├─ tools/audio.py      music, sound effects and voice-over mix
├─ tools/subs.mjs      writes .srt subtitles from config.js
├─ build.sh            one command → out/*.mp4, out/*.srt, out/Mentra-thumbnail.png
├─ vo/main/, vo/short/ drop recorded voice-over lines here (01.wav, 02.wav …)
├─ CREATIVE.md         timeline, voice-over script, subtitles, sound notes, thumbnail, Meta copy, checklist
└─ out/                finished files
```

## Preview
Open `index.html` in Chrome, Edge or Safari. It works straight from disk, with no server. The preview is **silent**: it shows the animation only, and the MP4s carry the sound.

## Edit the copy
Change the text in `src/config.js`, reload the preview, then rebuild.

## Add the Malayalam voice-over
1. Record each line as its own file, using the script and timing windows in `CREATIVE.md` §C.
2. Save them as `vo/main/01.wav … 07.wav` and `vo/short/01.wav … 04.wav`. Any format ffmpeg reads works (wav, mp3, m4a).
3. Run `./build.sh`. Each line is placed at its start time and the music ducks about 8 dB under it.

## Export the 1080×1920 MP4s
```bash
npm i playwright && npx playwright install chromium   # once
pip install numpy                                     # once; ffmpeg must be installed
./build.sh            # both cuts      (./build.sh main  or  ./build.sh short  for one)
```
How it works:
- Chromium renders each frame at exactly t = n/30 s.
- `audio.py` builds the mix from the same cue times.
- ffmpeg encodes H.264 High / yuv420p / 30 fps, with AAC 48 kHz audio loudness-normalised to −14 LUFS.

Rendering takes about 6–8 minutes for the 40s cut on a laptop.

Licensing: everything is original artwork and generated audio, plus Mentra's own logo. The fonts are SIL Open Font License. No stock images, music or paid APIs are used.
