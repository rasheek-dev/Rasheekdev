#!/usr/bin/env bash
# Full Reel build: background pass, overlay pass, audio, compose, captions, cover.
# Needs ../mentra-3d built (dist/app.js) + Playwright Chromium, Python 3 + numpy, ffmpeg.
set -euo pipefail
cd "$(dirname "$0")"
mkdir -p build out
rm -rf build/bg build/ov
node tools/render.mjs bg
node tools/render.mjs overlay
python3 tools/audio.py
python3 tools/master.py build/mix.wav build/mix_m.wav -14
python3 tools/master.py build/sfx_only.wav build/sfx_m.wav -18
tools/encode.sh build/mix_m.wav out/Mentra-Reel.mp4
tools/encode.sh build/sfx_m.wav out/Mentra-Reel-no-music.mp4
node tools/srt.mjs
# cover: the hook frame, fully revealed
mkdir -p build/cover && node tools/render.mjs bg 1.0 && cp build/bg/00000.jpg build/cover/bg.jpg
COVER=1 node tools/render.mjs overlay 1.0 && cp build/ov/00000.png build/cover/ov.png
BY_FRAME=1 node tools/render.mjs bg 0 && BY_FRAME=1 node tools/render.mjs overlay 0
ffmpeg -v error -y -i build/cover/bg.jpg -i build/cover/ov.png -filter_complex overlay out/Mentra-Reel-cover.jpg
echo done
