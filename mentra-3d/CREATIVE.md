# Mentra: "You don't have to carry it alone."

A premium animated ad for Mentra, built to get people to book a session on **mentracare.in**.
It's 9:16, 1080 × 1920, 30 fps. There are two cuts: a **40s master** and a **15s Meta cut**.

> **How this was made.** This is a real-time **3D** animation built in three.js (WebGL). It uses shader-lit glass orbs, glowing 3D tube threads, bloom, a gradient "void" with a light opening, and drifting particles. It's rendered frame-by-frame to MP4.
>
> At your request it is **abstract**: the protagonist is represented by a glass orb, "the mind", and the psychologist by a second, teal orb. That avoids the mannequin look of code-built human characters.
>
> The Malayalam voice-over still needs a recording. Drop the lines into `vo/` and run `./build.sh`; the music ducks under the voice automatically.

---

## B. Scene-by-scene timeline (40s master)

| # | Time | Camera | Picture | On-screen text | Sound |
|---|---|---|---|---|---|
| 1. Hook | 0–4s | Close, slow push-in | A glass orb, "the mind", floats in dusk-purple space. Lavender threads are already winding around it in loops that never close. | **Too much on your mind?** | Airy pad, sparse piano, soft irregular ticking. Thread shimmer. |
| 2. The invisible weight | 4–10s | Slow 3D orbit, rising | More threads layer in and tighten. The orb sinks lower under the weight. Glowing line-art symbols drift among the threads: an unfinished checklist, a clock running too fast, two figures facing away. | **Stress.** / **Overthinking.** / **Relationship struggles.** | Denser piano, second pad, glass ticks per symbol. |
| 3. Turning point | 10–15s | Push in, turning toward the light | The threads stop one by one. The orb exhales, swelling gently and rising. A warm light opens in the distance and the space brightens. The threads stay, but quiet. | **You don't have to figure it out alone.** | Ticking slows and stops. Breath swell, three-note calming chime, a single sustained chord. |
| 4. Introducing Mentra | 15–23s | Steady pull-back two-shot | A second, teal orb (the psychologist) emerges from the light and settles beside the first. A single thread connects them, and soft pulses travel back and forth like a conversation. The palette shifts to Mentra purple, with teal accents. | **Professional support.** / **A space to talk.** | Soft whoosh. Warm C–G–Am–F piano. Teal shimmer; a pluck as they connect. |
| 5. The benefit | 23–30s | Gentle orbit | The tangle untangles into smooth ribbons that loop around both orbs in purple and teal. The first orb rises a little, lighter but not "fixed". | **Take the first step toward feeling supported.** | The progression continues; a soft bloom swell. |
| 6. Call to action | 30–36s | Static, soft drift | Light lavender brand space. The Mentra wordmark sits above the two orbs, still connected by the line, with pulses (the "conversation" motif). | **Your safe space for mental wellness.** / **Individual Therapy \| Couples Therapy** | Whoosh; a two-note pluck. |
| 7. End card | 36–40s | Static | Lavender #F3F1FF, purple wordmark, purple button with a teal ring, website. Holds still from about 38.2s. | **You don't have to carry it alone.** / **BOOK YOUR SESSION** / **mentracare.in** | Button chime; final resolved chord. |

**15s cut:**
- **0–3s:** the orb tangled in threads, "Too much on your mind?"
- **3–6s:** the threads stop and the orb exhales toward the light, "You don't have to carry it alone."
- **6–10s:** the teal orb arrives and connects, "Talk to a psychologist."
- **10–15s:** end card with **Individual & Couples Therapy**, **BOOK YOUR SESSION** and **mentracare.in**.

## C. Malayalam voice-over script

Record each line as its own file, with natural pauses. The windows below are where each line has to fit.

**Voice:** a woman from Kerala, aged 30–35. Warm and conversational, not a newsreader. Pronounce Mentra as **"മെൻട്ര"**.

| File | Window | Malayalam |
|---|---|---|
| `vo/main/01.wav` | 0.4–3.6s | മനസ്സിൽ ഒരുപാട് കാര്യങ്ങൾ ഒരുമിച്ച് നടക്കുകയാണോ? |
| `vo/main/02.wav` | 4.6–9.0s | സമ്മർദ്ദം, അമിതചിന്ത, ബന്ധങ്ങളിലെ ബുദ്ധിമുട്ടുകൾ... |
| `vo/main/03.wav` | 11.4–14.2s | എല്ലാം ഒറ്റയ്ക്ക് നേരിടേണ്ടതില്ല. |
| `vo/main/04.wav` | 16.0–22.0s | മനസ്സ് തുറന്ന് സംസാരിക്കാൻ, നിങ്ങളെ ശ്രദ്ധയോടെ കേൾക്കാൻ ഒരു സുരക്ഷിതമായ ഇടം. |
| `vo/main/05.wav` | 24.6–29.4s | നിങ്ങളുടെ മനസ്സിനെ മനസ്സിലാക്കാനുള്ള ആദ്യ ചുവടാകട്ടെ ആ സംഭാഷണം. |
| `vo/main/06.wav` | 31.0–34.8s | മെൻട്രയിലൂടെ നിങ്ങളുടെ അടുത്ത ചുവട് ആരംഭിക്കൂ. |
| `vo/main/07.wav` | 36.4–39.3s | ഇന്നുതന്നെ നിങ്ങളുടെ സെഷൻ ബുക്ക് ചെയ്യൂ. |
| `vo/short/01.wav` | 0.3–2.8s | മനസ്സിൽ ഒരുപാട് കാര്യങ്ങളുണ്ടോ? |
| `vo/short/02.wav` | 3.3–5.8s | എല്ലാം ഒറ്റയ്ക്ക് നേരിടേണ്ടതില്ല. |
| `vo/short/03.wav` | 6.4–9.4s | ഒരു സൈക്കോളജിസ്റ്റുമായി സംസാരിക്കൂ. |
| `vo/short/04.wav` | 10.4–14.4s | മെൻട്രയിൽ നിങ്ങളുടെ സെഷൻ ഇന്നുതന്നെ ബുക്ക് ചെയ്യൂ. |

**Recording notes:**
- Line 4 (about 6s) is the longest. If the read runs long, the natural place to breathe is after "സംസാരിക്കാൻ,".
- Trim silence at the start of each file. The timing comes from the windows above, not from the file.

## D. English subtitles (with timestamps)

Ready-made files: `out/Mentra-40s.en.srt`, `out/Mentra-40s.ml.srt`, `out/Mentra-15s.en.srt` and `out/Mentra-15s.ml.srt`. Upload them to Meta as captions instead of burning them in, so the on-screen typography stays minimal.

```
00:00:00,400 --> 00:00:03,600  Does it feel like too much is happening in your mind at once?
00:00:04,600 --> 00:00:09,000  Stress, overthinking, difficulties in relationships…
00:00:11,400 --> 00:00:14,200  You don't have to face everything alone.
00:00:16,000 --> 00:00:22,000  A safe space to speak openly and be listened to with care.
00:00:24,600 --> 00:00:29,400  Let that conversation be the first step toward understanding your feelings.
00:00:31,000 --> 00:00:34,800  Take your next step with Mentra.
00:00:36,400 --> 00:00:39,300  Book your session today.
```

## E. On-screen text (every scene)

All copy is real, editable typography in `src/config.js`, not lettering baked into the art.

| Scene | Text |
|---|---|
| 1 | Too much on your mind? |
| 2 | Stress. · Overthinking. · Relationship struggles. |
| 3 | You don't have to figure it out alone. |
| 4 | Professional support. · A space to talk. |
| 5 | Take the first step toward feeling supported. |
| 6 | Your safe space for mental wellness. · Individual Therapy \| Couples Therapy |
| 7 | (Mentra wordmark) · You don't have to carry it alone. · BOOK YOUR SESSION · mentracare.in |
| 15s | Too much on your mind? · You don't have to carry it alone. · Talk to a psychologist. · Individual & Couples Therapy · BOOK YOUR SESSION · mentracare.in |

## F. Sound design

The sound is generated by `tools/audio.py`, with cue times taken from the animation.

- **Music:**
  - Tension (scenes 1–2): suspended A-minor and F-major-7 pads with a sparse piano motif that gets denser.
  - Turn (scene 3): one sustained C chord, breathing space.
  - Warmth (scenes 4–7): a C – G/B – Am – F progression with a slow melody, ending on a resolved chord.
  - There's no percussion and no horror-style hits.
- **Sound effects** (all quiet):
  - airy shimmer when threads appear
  - glass ticks for each metaphor
  - soft irregular ticking in scenes 1–2 that slows and stops at the turn
  - a breath swell and a three-note descending chime when the threads calm
  - soft whooshes on scene changes
  - a laptop click
  - a two-note pluck when the bubbles connect
  - a two-note chime on the CTA button
- **Voice-over:** placed per line and **ducked about 8 dB** under speech.
- **Loudness:** the final mix is normalised to **−14 LUFS**, true peak −1.5 dBTP, AAC 192 kbps at 48 kHz.
- **If you swap the music for a licensed track:** keep it under −20 LUFS before the voice-over and avoid busy 1–4 kHz content, so the Malayalam stays clear.

## I. Thumbnail concept

`out/Mentra-thumbnail.png` is a frame from the hook.
- **Picture:** the glass orb wrapped in glowing lavender threads against dusk purple.
- **Text:** "Too much on your mind?" in large white type in the top third.
- **Nothing else** in the bottom 420 px.

**Alternative to A/B test:** `out/Mentra-thumbnail-alt.png`, the two orbs connected inside calm purple-and-teal ribbons, with "Take the first step toward feeling supported."

## K. Meta ad copy

- **Primary text (about 125 characters, Malayalam + English):**
  > മനസ്സിൽ ഒരുപാട് കാര്യങ്ങളുണ്ടോ? You don't have to carry it alone. Talk privately with a licensed psychologist online, in Malayalam or English.
- **Primary text (English-only variant):**
  > Too much on your mind? Talk to a licensed psychologist online — privately, in Malayalam or English. Individual & couples therapy.
- **Headline:** You don't have to carry it alone
- **Description:** Private online sessions · mentracare.in
- **CTA button:** **Book Now** is the closest match to "Book your session". Use **Learn More** for cold audiences if Book Now gets low click-through.
- **Placement:** use the 15s cut for Reels and Stories, and the 40s master for Feed and in-stream.
- **Health-ad policy:** Meta restricts ads that imply personal attributes, e.g. "Are you depressed?". The copy above asks about a feeling, not a condition, which is deliberate. Don't target or retarget by health interests, and keep the landing page's privacy policy linked.

## L. Mobile test checklist (before publishing)

- [ ] Play both MP4s on a real phone (Android and iPhone) at 100% brightness **and** at low brightness. Check that captions are readable on the dark scenes.
- [ ] Watch with **sound off**. The story, the brand and the "BOOK YOUR SESSION" CTA must all work without audio.
- [ ] Check the dark opening scenes on a low-brightness phone: the orb and the threads should stay visible, without crushed blacks or banding.
- [ ] Watch with sound on, through the phone speaker and through earphones. The voice-over should be clear over the music, with no clipping.
- [ ] Turn on **Safe zones** in the preview player. No text or face should sit under the top 220 px or the bottom 420 px (Reels/Stories UI).
- [ ] Have a native speaker check the Malayalam in the voice-over, subtitles and ad copy, including that Mentra is pronounced "മെൻട്ര".
- [ ] Show it to two or three people outside the team. Do they read the two orbs as "me" and "someone who listens"? If not, the voice-over line in scene 4 carries it.
- [ ] Check text length on the smallest phone you target. Nothing should wrap awkwardly, and "Relationship struggles." should stay on one line.
- [ ] The first frame should already show movement and the hook text within 0.5s. Scrub to 0:00 in the Meta preview.
- [ ] Check that the end card holds static for at least 1.5s, and that **mentracare.in** is spelt correctly and opens the booking page.
- [ ] Upload the `.srt` files and check the auto-captions don't duplicate the on-screen text.
- [ ] Run each placement's preview in Meta Ads Manager (Reels, Stories, Feed 4:5 crop). Make sure the 4:5 crop doesn't cut the CTA; if it does, request a 4:5 export.
- [ ] Confirm file specs: H.264 High, yuv420p, 30 fps, AAC 48 kHz, under 4 GB, 9:16.
- [ ] Get final sign-off from a Mentra psychologist on the tone. It shouldn't imply a diagnosis or promise outcomes.
