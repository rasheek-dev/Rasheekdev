# Mentra Reel: "Therapy isn't what you think"

A 32s Instagram Reel (1080×1920, 30 fps) that walks through your first Mentra session. It's built from original motion graphics over Mentra's own 3D footage (`../mentra-3d`).

| File | What |
|---|---|
| `out/Mentra-Reel.mp4` | Final Reel with the original soundtrack |
| `out/Mentra-Reel-no-music.mp4` | Same edit, sound effects only (for adding an Instagram sound) |
| `out/Mentra-Reel.srt` | Caption file |
| `out/Mentra-Reel-cover.jpg` | Cover frame |
| `out/POST.md` | Post caption, hashtags and posting notes |

## Edit
All text, timings, background shots, punch-ins and sound cues are in the `REEL` object at the top of `reel.js`. The layout and styles are in `reel.html`.
- **Captions:** at most 3 words each. `k` is the index of the highlighted (teal) word.
- **Background shots:** each entry in `bg` maps a Reel time window to a window of the 3D master, with optional blur, zoom and a punch-in.

## Rebuild
```bash
(cd ../mentra-3d && npm install && npm run bundle)   # once
./build.sh                                          # about 20 min on a CPU-only machine
```
What `build.sh` does:
1. Renders the clean 3D background frames.
2. Renders the transparent caption and graphics frames.
3. Generates the soundtrack (`tools/audio.py`).
4. Composites everything with ffmpeg, loudness-normalised to −14 LUFS, H.264 High.
5. Writes the SRT file and the cover frame.

Licensing: all visuals, music and sound effects are original; the fonts are SIL OFL.
