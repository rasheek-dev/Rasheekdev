#!/usr/bin/env bash
# tools/encode.sh <mastered.wav> <out.mp4>  — composites background + overlay frames with the mastered audio
set -euo pipefail
ffmpeg -v error -y -framerate 30 -i build/bg/%05d.jpg -framerate 30 -i build/ov/%05d.png -i "$1" \
  -filter_complex "[0][1]overlay=format=auto,format=yuv420p[v]" -map "[v]" -map 2:a \
  -ar 48000 -c:v libx264 -preset slow -crf 17 -profile:v high -r 30 -c:a aac -b:a 192k -shortest -movflags +faststart "$2"
