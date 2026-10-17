#!/usr/bin/env bash
# Builds the finished MP4s:  ./build.sh   (both cuts)   ./build.sh main   ./build.sh short
# Needs: Node 18+, `npm install` (three, esbuild, playwright) + `npx playwright install chromium`,
#        Python 3 with numpy, and ffmpeg.
set -euo pipefail
cd "$(dirname "$0")"
npx esbuild src/main.js --bundle --format=iife --minify --outfile=dist/app.js --log-level=error
CUTS=${1:-"main short"}
mkdir -p out
for CUT in $CUTS; do
  NAME=$([ "$CUT" = main ] && echo 40s || echo 15s)
  rm -rf "build/$CUT/frames"
  node tools/render.mjs "$CUT" frames 30
  python3 tools/audio.py "$CUT"
  ffmpeg -v error -y -framerate 30 -i "build/$CUT/frames/%05d.jpg" -i "build/$CUT/mix.wav" \
    -af "loudnorm=I=-14:TP=-1.5:LRA=11" -ar 48000 -c:v libx264 -preset slow -crf 17 -pix_fmt yuv420p \
    -profile:v high -c:a aac -b:a 192k -shortest -movflags +faststart "out/Mentra-$NAME.mp4"
  echo "out/Mentra-$NAME.mp4 done"
done
node tools/subs.mjs
node tools/render.mjs main still 30 2.6 && cp build/main/still.png out/Mentra-thumbnail.png
node tools/render.mjs main still 30 26.5 && cp build/main/still.png out/Mentra-thumbnail-alt.png
