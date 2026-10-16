# Mentra educational short: "5 signs it's time to talk to someone"

`Mentra-5-Signs.mp4`: 36s, 1080×1920, H.264 + AAC (loudness-normalised to −15 LUFS).

This is an educational, expert-style format, made after looking at a competitor's "when to seek therapy" content. It's built to be saved and shared ("Save this for later"), and it ends in a booking.

| Time | Beat |
|---|---|
| 0–4.6s | Hook: "Not sure if you need therapy?" / ആരോടെങ്കിലും സംസാരിക്കാൻ സമയമായോ? / "Watch for these 5 signs" |
| 4.6–25.6s | 5 signs, 4.2s each, with a story-style progress bar |
| 25.6–30s | "You don't need a crisis to start therapy." |
| 30–36.4s | Licensed · private · Malayalam & English · choose your psychologist · fee shown upfront, then Book a session · mentracare.in, plus crisis lines (112, Tele-MANAS 14416) |

Re-render: `node render.mjs full 30 && python3 audio.py`, then use the ffmpeg command from `../mentracare-ad/README.md` with `-af loudnorm=I=-15:TP=-1.5`.
