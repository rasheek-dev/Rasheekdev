# Mentra story ad: "I'm fine"

`Mentra-Story-Ad.mp4`: 42s, 1080×1920 (Reels, Shorts, Stories, WhatsApp Status), H.264 + AAC. Captions are burned in, so it works with the sound off.

| Time | Beat |
|---|---|
| 0–4s | Hook: "2:47 AM. Still awake. Again." |
| 4–13s | Amma texts "Are you okay?". They type the truth, delete it, and send "I'm fine Amma 😊". |
| 13–19s | "Fine at work. Fine with friends. Not fine at 2:47 AM." |
| 19–22s | Turn to dawn: "You don't have to carry it alone." (the site's tagline) + logo |
| 22–29s | Booking: concern and language, then match, then time and secure payment, then "link sent on WhatsApp" |
| 29–36s | 3 weeks later: "Amma, I started talking to someone. I'm actually feeling better ❤️" |
| 36–42s | CTA: Book a session · mentracare.in · 112 safety line |

## Re-render after editing `ad.html`
```
node render.mjs          # preview stills -> preview/
node render.mjs full 30  # frames/ + sfx.json
python3 audio.py         # ad-audio.wav (music + SFX synced to sfx.json)
ffmpeg -framerate 30 -i frames/%05d.jpg -i ad-audio.wav -c:v libx264 -crf 19 -pix_fmt yuv420p \
  -c:a aac -shortest -movflags +faststart Mentra-Story-Ad.mp4
```
