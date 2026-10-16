# Mentra trust video: booking

`Mentra-Trust-Booking-Video.mp4`: 38s, 1080×1920 (vertical, for Reels, Shorts and WhatsApp Status), H.264 + AAC.

All copy is taken from the live site (`index.html`): the homepage hook, "Why Mentra", "How it works", and the FAQ (WhatsApp link, 45–50 min sessions, fee shown before booking, 112 note).

## Re-render after editing `scene.html`
```
node render.mjs full 30        # writes frames/
python3 music.py               # writes music.wav
ffmpeg -framerate 30 -i frames/%05d.jpg -i music.wav -c:v libx264 -crf 19 -pix_fmt yuv420p \
  -c:a aac -shortest -movflags +faststart Mentra-Trust-Booking-Video.mp4
```
`node render.mjs` (no args) writes a few preview stills to `preview/`.
