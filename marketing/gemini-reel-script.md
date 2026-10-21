# Mentra Reel: "3:47 AM"
A realistic, people-led Instagram Reel. You generate the shots in Gemini (Veo), and Claude edits them into the final video.

- **Final length:** 30 seconds (plus a 15-second cut made from the same clips)
- **Format:** vertical 9:16, 1080×1920
- **Tone:** quiet, honest and cinematic. It is a short film, not an ad shouting at people.
- **Setting:** Kochi, Kerala. Monsoon, apartment life, family at home.
- **Story:** A young woman is carrying too much on her own. One small step, booking a session with Mentra, makes the next morning feel a little lighter.

---

## Step 0: Create your two actors first (for consistency)

AI video changes faces between clips unless you give it a reference. Before making any video:

1. In Gemini, **generate an image** using each prompt below.
2. Save the best one of each.
3. For every video shot, **upload the matching image as the reference or starting image** if your Gemini video mode allows it. The character description is already written into every shot prompt below.

**ANJALI (lead):**
```
Photorealistic portrait of a 27-year-old South Indian Malayali woman, warm medium-brown skin, long thick black hair loosely tied in a low bun with a few strands falling on her face, small black bindi, thin gold chain, wearing an oversized faded olive-green cotton t-shirt. Natural face with no heavy makeup, tired eyes with faint dark circles, gentle expression. Soft window light, shot on 85mm lens, shallow depth of field, real skin texture, natural imperfections, documentary photography style. Vertical 9:16.
```

**DR. MEERA (psychologist, seen on a laptop screen):**
```
Photorealistic portrait of a 45-year-old South Indian woman psychologist, calm kind face, short-sleeved soft blue cotton kurta, reading glasses pushed up on her head, grey strands in her black hair, sitting in a warm home office with a bookshelf and a small plant blurred behind her. Natural window light, real skin texture, documentary photography style. Horizontal 16:9.
```

### Wardrobe (who wears what)
Her face, hair, bindi and gold chain stay the same in every shot. Only her clothes change, the way they would in real life:

| Shots | Time | Anjali wears |
|---|---|---|
| 1 | Night, in bed | Oversized faded olive-green t-shirt |
| 2, 3, 4, 5 | Work, then just home that evening | Mustard-yellow cotton kurti with a blue ID lanyard |
| 6A, 7 | Night session, next morning | Olive-green t-shirt again |

When you make a scene image from her photo, say *"same face and hair as this photo"* and then name the outfit from this table. Don't say "same clothes".

---

## Settings to use for every video

- **Aspect ratio:** 9:16 (vertical). If Gemini only offers 16:9, use 16:9 and keep the subject centred. I will reframe it to vertical.
- **Quality:** the highest available, ideally 1080p.
- **Audio:** keep Veo's native sound on. Real ambient sound is half of what makes it feel human.
- **Takes:** generate each shot once. Only regenerate shots with a problem: warped hands, a changed face, garbled text or wrong lighting.
- Each clip is about 8 seconds. I will only use the best 2–5 seconds of each, so a clip doesn't have to be perfect all the way through.

**Style block (already included at the end of every shot prompt below, shown here for reference):**
```
Style: photorealistic, cinematic documentary realism, shot on ARRI Alexa with vintage anamorphic lens, natural film grain, soft contrast, slightly desaturated warm tones, real skin texture, subtle handheld camera movement, natural human micro-expressions and breathing. No text, no subtitles, no logos, no watermarks, no music. Realistic ambient sound only.
```

---

## The shots (7 prompts). Each one is complete: copy the whole grey box and paste it into Gemini as it is

### SHOT 1: "3:47 AM" (the hook)
```
A 27-year-old South Indian Malayali woman, warm medium-brown skin, long thick black hair loosely tied in a low bun with a few strands falling on her face, small black bindi, thin gold chain, wearing an oversized faded olive-green cotton t-shirt. Natural face with no heavy makeup, tired eyes with faint dark circles, gentle expression. She lies awake in bed in a small dark apartment bedroom in Kochi, Kerala at night. She is on her side, staring at the ceiling, then slowly turns her head to look at her phone on the pillow; the phone screen lights her face with cool blue light. A ceiling fan turns slowly above her, its shadow moving across the wall. Light rain against the window, streetlight glow through thin curtains. Camera: slow top-down push-in from directly above the bed, 35mm lens. Mood: lonely, restless, quiet. Audio: ceiling fan hum, soft rain, distant scooter passing, her slow exhale.
Style: photorealistic, cinematic documentary realism, shot on ARRI Alexa with vintage anamorphic lens, natural film grain, soft contrast, slightly desaturated warm tones, real skin texture, subtle handheld camera movement, natural human micro-expressions and breathing. No text, no subtitles, no logos, no watermarks, no music. Realistic ambient sound only.
```

### SHOT 2: "Too much" (pressure at work)
```
A 27-year-old South Indian Malayali woman, warm medium-brown skin, long thick black hair loosely tied in a low bun with a few strands falling on her face, small black bindi, thin gold chain, wearing a simple mustard-yellow cotton kurti with three-quarter sleeves and a blue office ID lanyard. Natural face with no heavy makeup, tired eyes with faint dark circles, gentle expression. She sits at a cluttered desk in a modern Kochi office in the afternoon, laptop open, a half-finished cup of chai beside her. Colleagues talk and laugh, blurred in the background. She stares at the laptop without typing, then closes her eyes and presses her fingertips to her temples. Camera: slow push-in from the side at eye level, 50mm lens, background heavily out of focus. Audio: keyboard clicks, overlapping office chatter, repeated notification pings, all slightly muffled as if heard underwater.
Style: photorealistic, cinematic documentary realism, shot on ARRI Alexa with vintage anamorphic lens, natural film grain, soft contrast, slightly desaturated warm tones, real skin texture, subtle handheld camera movement, natural human micro-expressions and breathing. No text, no subtitles, no logos, no watermarks, no music. Realistic ambient sound only.
```

### SHOT 3: "Nodding along" (family)
```
A 27-year-old South Indian Malayali woman, warm medium-brown skin, long thick black hair loosely tied in a low bun with a few strands falling on her face, small black bindi, thin gold chain, wearing a simple mustard-yellow cotton kurti with three-quarter sleeves and a blue office ID lanyard (she has just come home from work). Natural face with no heavy makeup, tired eyes with faint dark circles, gentle expression. She stands in a warm, slightly cluttered Kerala home kitchen in the evening, steel vessels on the counter, a pressure cooker on the gas stove. Her mother, a 55-year-old Malayali woman in a cotton nightie with a towel on her shoulder, talks to her from the side, out of focus. Anjali nods and gives a small polite smile, but her eyes are distant and empty. The pressure cooker suddenly whistles loudly; she flinches slightly. Camera: static medium close-up on Anjali, 50mm, mother soft in foreground left. Audio: mother speaking indistinct Malayalam, sizzling, the sharp pressure cooker whistle.
Style: photorealistic, cinematic documentary realism, shot on ARRI Alexa with vintage anamorphic lens, natural film grain, soft contrast, slightly desaturated warm tones, real skin texture, subtle handheld camera movement, natural human micro-expressions and breathing. No text, no subtitles, no logos, no watermarks, no music. Realistic ambient sound only.
```

### SHOT 4: "Hesitation" (the decision, on the balcony in the rain)
```
A 27-year-old South Indian Malayali woman, warm medium-brown skin, long thick black hair loosely tied in a low bun with a few strands falling on her face, small black bindi, thin gold chain, wearing a simple mustard-yellow cotton kurti with three-quarter sleeves and a blue office ID lanyard (still in her work clothes). Natural face with no heavy makeup, tired eyes with faint dark circles, gentle expression. She stands on a small apartment balcony at dusk during heavy monsoon rain in Kochi, coconut trees and wet rooftops behind her, blue-hour light. She holds her phone in both hands, looking down at it, thumb hovering over the screen, hesitating. She takes a deep breath, then taps the screen once. Camera: slow arc around her from behind her shoulder to her face, 35mm lens. Audio: heavy rain on a tin roof, distant thunder, her deep breath.
Style: photorealistic, cinematic documentary realism, shot on ARRI Alexa with vintage anamorphic lens, natural film grain, soft contrast, slightly desaturated warm tones, real skin texture, subtle handheld camera movement, natural human micro-expressions and breathing. No text, no subtitles, no logos, no watermarks, no music. Realistic ambient sound only.
```

### SHOT 5: Phone close-up (for the Mentra screen insert)
```
Extreme close-up of a young South Indian woman's hands holding a smartphone, wearing the three-quarter sleeve of a mustard-yellow cotton kurti, the phone screen is solid bright chroma green filling the entire screen, her thumb scrolls slowly then taps. Soft blue-hour light, raindrops on a balcony railing blurred behind. Camera: static, 100mm macro lens, shallow depth of field. Audio: rain.
Style: photorealistic, cinematic documentary realism, shot on ARRI Alexa with vintage anamorphic lens, natural film grain, soft contrast, slightly desaturated warm tones, real skin texture, subtle handheld camera movement, natural human micro-expressions and breathing. No text, no subtitles, no logos, no watermarks, no music. Realistic ambient sound only.
```
> I will replace the green screen with the real mentracare.in booking page. Don't let AI draw the app screen, because AI text comes out garbled.

### SHOT 6: "Start anywhere" (the session)
**6A, Anjali:**
```
A 27-year-old South Indian Malayali woman, warm medium-brown skin, long thick black hair loosely tied in a low bun with a few strands falling on her face, small black bindi, thin gold chain, wearing an oversized faded olive-green cotton t-shirt. Natural face with no heavy makeup, tired eyes with faint dark circles, gentle expression. She sits cross-legged on her bed at night wearing white wired earphones, a laptop in front of her lit by a warm bedside lamp. She looks at the screen nervously, then speaks softly in English: "I don't really know where to start." She listens, and her shoulders slowly drop as she lets out a long breath and almost smiles. Camera: slow push-in from over the laptop, 50mm lens, warm amber lamp light. Audio: quiet room tone, her soft voice.
Style: photorealistic, cinematic documentary realism, shot on ARRI Alexa with vintage anamorphic lens, natural film grain, soft contrast, slightly desaturated warm tones, real skin texture, subtle handheld camera movement, natural human micro-expressions and breathing. No text, no subtitles, no logos, no watermarks, no music. Realistic ambient sound only.
```
**6B, Dr. Meera (shot as the laptop screen):**
```
A 45-year-old South Indian woman psychologist, calm kind face, short-sleeved soft blue cotton kurta, reading glasses pushed up on her head, grey strands in her black hair, sitting in a warm home office with a bookshelf and a small plant blurred behind her, is on a video call, framed like a laptop webcam, looking warmly into the camera, nodding slowly, and says gently in English: "That's okay. Start anywhere. I'm listening." Natural webcam framing, soft window light. Audio: her calm voice, slight video-call audio quality.
Style: photorealistic, cinematic documentary realism, shot on a laptop webcam, natural film grain, soft contrast, slightly desaturated warm tones, real skin texture, subtle handheld camera movement, natural human micro-expressions and breathing. No text, no subtitles, no logos, no watermarks, no music. Realistic ambient sound only.
```

### SHOT 7: "A little lighter" (the next morning)
```
A 27-year-old South Indian Malayali woman, warm medium-brown skin, long thick black hair loosely tied in a low bun with a few strands falling on her face, small black bindi, thin gold chain, wearing an oversized faded olive-green cotton t-shirt. Natural face with no heavy makeup, rested eyes, calm and peaceful expression. In the early morning, she pulls open the curtains of her bedroom with one hand, holding a steel tumbler of tea in the other; golden Kerala sunlight floods in across her face. She closes her eyes, takes a slow deep breath, and a small, real smile appears. She takes a small sip. Green coconut trees sway outside the window. Camera: slow push-in, 35mm lens, warm golden light, light dust in the air. Audio: birds (koel calling), distant temple bell, curtain rings sliding.
Style: photorealistic, cinematic documentary realism, shot on ARRI Alexa with vintage anamorphic lens, natural film grain, soft contrast, slightly desaturated warm tones, real skin texture, subtle handheld camera movement, natural human micro-expressions and breathing. No text, no subtitles, no logos, no watermarks, no music. Realistic ambient sound only.
```

---

## The edit (what I'll build from your clips)

| Time | Picture | On-screen text | Sound |
|---|---|---|---|
| 0.0–2.5 | Shot 1, top-down push-in | **3:47 AM.** | fan hum, rain |
| 2.5–4.5 | Shot 1, face lit by phone | **Still awake. Again.** | rain swells |
| 4.5–7.0 | Shot 2, temples, with a speed ramp into the push-in | *Work.* | pings get louder |
| 7.0–9.5 | Shot 3, polite nod | *Home.* | Malayalam chatter, then a hard cut on the cooker whistle |
| 9.5–10.5 | Black, silence | | **Total silence** (the beat that hits) |
| 10.5–14.0 | Shot 4, balcony hesitation | **You don't have to carry it alone.** | rain, thunder, music starts |
| 14.0–16.0 | Shot 5, phone with the real Mentra page | | soft tap sound |
| 16.0–22.0 | Shot 6A and 6B, intercut session | Dialogue captions | voices, music low |
| 22.0–26.0 | Shot 7, sunlight and smile | **A little lighter.** | birds, music rises |
| 26.0–30.0 | Animated Mentra end card | **Licensed psychologists · Malayalam & English**<br>**Book a session — mentracare.in** | music resolves |

**Editing techniques I'll use:**
- **Colour grade:** cold teal for the night and stress scenes, warming to golden in shot 7. This colour journey tells the story without words. I'll also match the colour across clips, because AI clips vary.
- **Cuts on motion and sound:** the cooker whistle cuts to black, and the thumb tap cuts to the phone screen.
- **Speed ramps:** in the stress shots.
- **Sound design:** muffling for the "underwater" feeling, a hard silence beat, and room tone between clips so nothing sounds AI-dry.
- **Music:** a gentle piano and ambient score. (A royalty-free track, or add a trending sound in Instagram.)
- **Captions:** burned-in, in Mentra's Inter font, positioned clear of Instagram's interface.
- **Reframing and stabilising:** any 16:9 clips reframed to vertical, with stabilising and grain added so all clips look like one camera.
- **15-second version:** Shots 1, 4, 5, 6A and 7, plus the end card.
- **Optional:** a Malayalam caption version.

---

## Send me the clips

Download each clip from Gemini and name it by shot (`shot1.mp4`, `shot6a.mp4`, …). Then either attach them here in the chat, or add them to `marketing/raw/` in the repo. Send the Anjali reference image too.

---

## Important: responsible use
- **Label it as AI.** These are AI-generated people, so turn on Instagram's **"AI info"** label when posting. Meta requires this for photorealistic AI content, and it protects Mentra's trust.
- **It's a dramatisation, not a testimonial.** Don't caption it as a real client's story. If you want, the end card can say *"Dramatisation. Actors are AI-generated."*
- **Keep it gentle.** There is no self-harm, crying breakdowns or "cured overnight" claims. "A little lighter" is honest.
- If you have space, add this to the caption: *"If you're in crisis, call 112 or Tele-MANAS 14416."*

---

## SHOT 5 v2: new phone-screen prompt (replaces Shot 5)
This version keeps the phone steadier, flatter to the camera and bigger in the frame. That gives a cleaner, sharper Mentra page with no wobble.
```
Close-up over-the-shoulder shot of a young South Indian woman holding a modern smartphone upright in her left hand at chest height, wearing the three-quarter sleeve of a mustard-yellow cotton kurti and a thin gold chain. The phone faces the camera almost straight on and fills the centre of the frame; its screen is a solid, evenly lit, bright chroma-key green (#00FF00) from edge to edge with no reflections, no glare and no icons. She holds the phone very still. After two seconds her right index finger moves in slowly and taps once near the lower middle of the screen, then moves away; the finger covers only a small part of the screen. Background: rainy Kochi balcony at blue hour, coconut trees and wet railings heavily blurred. Camera: locked-off tripod, no camera movement, 85mm lens, shallow depth of field, phone screen in sharp focus. Audio: steady rain, a soft screen tap.
Style: photorealistic, cinematic documentary realism, natural film grain, soft contrast, real skin texture. No text, no subtitles, no logos, no watermarks, no music. Realistic ambient sound only.
```

---

## SHOT 3 v2: new family scene (replaces the kitchen, Shot 3)
In this version she is *visibly* nodding along. The family talks over her at dinner while she smiles politely and her mind is somewhere else.
```
A 27-year-old South Indian Malayali woman, warm medium-brown skin, long thick black hair loosely tied in a low bun with a few strands falling on her face, small black bindi, thin gold chain, wearing a simple mustard-yellow cotton kurti with three-quarter sleeves (no ID lanyard), tired eyes with faint dark circles. She sits at a small wooden dining table in a warm, lived-in Kerala home at night, a steel plate of rice and curry in front of her that she has barely touched. Her mother (55, cotton nightie, towel on shoulder) stands beside her serving more rice and talking continuously, and her father (60, white mundu and half-sleeve shirt) sits across the table, talking and gesturing with his hand; both are soft and slightly out of focus. Anjali looks up, gives a small polite smile and nods slowly twice, then looks back down at her plate and quietly moves the rice with her fingers, her smile fading, eyes distant and empty. In the last second a pressure cooker whistles loudly from the kitchen behind them and she blinks. Camera: slow push-in towards her face from the end of the table, 50mm lens, eye level, she is sharp and the parents are blurred in the foreground and background. Lighting: warm tungsten ceiling light and a tube light from the kitchen doorway. Audio: overlapping Malayalam family conversation (indistinct), steel plate and spoon sounds, TV news murmuring in another room, then the sharp pressure cooker whistle.
Style: photorealistic, cinematic documentary realism, shot on ARRI Alexa with vintage anamorphic lens, natural film grain, soft contrast, slightly desaturated warm tones, real skin texture, subtle handheld camera movement, natural human micro-expressions and breathing. No text, no subtitles, no logos, no watermarks, no music. Realistic ambient sound only.
```
