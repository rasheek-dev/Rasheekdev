# Mentra impact ad: "What will people say?"

`Mentra-Impact-Ad.mp4`: 33s, 1080×1920 (Reels, Shorts, Stories), H.264 + AAC. Captions are burned in, so it works with the sound off.

**Idea:** stigma stops people from booking, and private online sessions remove that barrier. Judgmental phrases ("Just be strong.", "Therapy? Are you mad?") crash down and bury a small glowing dot: the person. After a silence the pile explodes, and the dot becomes the centre of the Mentra flower.

| Time | Beat |
|---|---|
| 0–2.5s | Hook slam: "What will people say?" / ആളുകൾ എന്ത് പറയും? |
| 2.5–10.6s | 12 phrases fall and stack, faster and heavier, with screen shake |
| 10.6–17.3s | Silence and a heartbeat: "So we stay quiet." "And carry it alone." "You deserve to be heard. Not judged." |
| 17.3–19s | Pile explodes, the scene turns to light, and the logo blooms around the dot |
| 19–26s | Licensed psychologists · Private sessions · From your own room · No waiting rooms · Malayalam & English |
| 26–33s | "Be heard. Not judged." · Book a session · mentracare.in · 112 safety line |

## Re-render after editing `impact.html`
```
node render.mjs          # preview stills -> preview/
node render.mjs full 30  # frames/ + sfx.json
python3 audio.py         # impact-audio.wav (synced to sfx.json)
ffmpeg -framerate 30 -i frames/%05d.jpg -i impact-audio.wav -c:v libx264 -crf 19 -pix_fmt yuv420p \
  -c:a aac -shortest -movflags +faststart Mentra-Impact-Ad.mp4
```
