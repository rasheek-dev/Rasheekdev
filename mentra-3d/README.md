# Mentra 3D ad: source and export

```
mentra-premium-ad/
├─ index.html          preview player (play / pause / restart / scrub / 40s↔15s / safe zones)
├─ src/config.js       ALL on-screen text, voice-over lines and timings, for both cuts
├─ src/main.js         three.js renderer, camera, both timelines, overlays (deterministic: frame = f(time))
├─ src/world.js        3D world: glass orbs (fresnel shader), threads, light-opening backdrop, metaphors, particles
├─ dist/app.js         bundled build of src/ (made by esbuild; the preview loads this)
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
Open `index.html` in Chrome, Edge or Safari. It's real-time 3D, works straight from disk, and needs no server. The preview is **silent**; the MP4s carry the sound. After editing `src/`, run `npm run bundle` and reload.

## Edit the copy
Change the text in `src/config.js`, reload the preview, then rebuild.

## Add the Malayalam voice-over
1. Record each line as its own file, using the script and timing windows in `CREATIVE.md` §C.
2. Save them as `vo/main/01.wav … 07.wav` and `vo/short/01.wav … 04.wav`. Any format ffmpeg reads works (wav, mp3, m4a).
3. Run `./build.sh`. Each line is placed at its start time and the music ducks about 8 dB under it.

## Export the 1080×1920 MP4s
```bash
npm install && npx playwright install chromium        # once
pip install numpy                                     # once; ffmpeg must be installed
./build.sh            # both cuts      (./build.sh main  or  ./build.sh short  for one)
```
How it works:
- Chromium renders each WebGL frame at exactly t = n/30 s. It falls back to software rendering when there's no GPU.
- `audio.py` builds the mix from the same cue times.
- ffmpeg encodes H.264 High / yuv420p / 30 fps, with AAC 48 kHz audio loudness-normalised to −14 LUFS.

Rendering takes a few minutes on a laptop with a GPU, and about 20 minutes on a CPU-only machine.

Licensing: everything is original 3D and generated audio, plus Mentra's own logo. three.js is MIT-licensed and the fonts are SIL Open Font License. No stock images, music or paid APIs are used.
