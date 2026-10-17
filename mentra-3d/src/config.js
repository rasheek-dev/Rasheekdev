// =====================================================================
//  MENTRA — "You don't have to carry it alone."
//  ALL EDITABLE COPY + TIMINGS LIVE IN THIS FILE.
//  Times are in seconds. Change text freely; keep the quotes and commas.
// =====================================================================
window.MENTRA = {
  brand: { url: 'mentracare.in', logo: 'assets/mentra-logo.png' },

  // ---------------- 40-second master ----------------
  main: {
    duration: 40,
    // scene windows (used by the engine, the subtitles and the sound cues)
    scenes: {
      hook:    [0, 4],
      weight:  [4, 10],
      turn:    [10, 15],
      mentra:  [15, 23],
      benefit: [23, 30],
      brand:   [30, 36],
      end:     [36, 40],
    },
    // on-screen text: [text, start, end, style]  (style: 'hero' | 'stack' | 'quiet')
    captions: [
      ['Too much on your mind?', 0.45, 3.8, 'hero'],
      ['Stress.', 4.7, 9.7, 'stack0'],
      ['Overthinking.', 5.9, 9.7, 'stack1'],
      ['Relationship struggles.', 7.1, 9.7, 'stack2'],
      ['You don’t have to figure it out alone.', 11.7, 14.7, 'hero'],
      ['Professional support.', 16.4, 22.6, 'stack0'],
      ['A space to talk.', 17.5, 22.6, 'stack1'],
      ['Take the first step toward feeling supported.', 25.4, 29.6, 'heroS'],
    ],
    brandLine: 'Your safe space for mental wellness.',
    services: 'Individual Therapy  |  Couples Therapy',
    endLine: 'You don’t have to carry it alone.',
    button: 'BOOK YOUR SESSION',
    // Malayalam voice-over, with the window each line should be spoken in
    vo: [
      [0.4, 3.6, 'മനസ്സിൽ ഒരുപാട് കാര്യങ്ങൾ ഒരുമിച്ച് നടക്കുകയാണോ?', 'Does it feel like too much is happening in your mind at once?'],
      [4.6, 9.0, 'സമ്മർദ്ദം, അമിതചിന്ത, ബന്ധങ്ങളിലെ ബുദ്ധിമുട്ടുകൾ...', 'Stress, overthinking, difficulties in relationships…'],
      [11.4, 14.2, 'എല്ലാം ഒറ്റയ്ക്ക് നേരിടേണ്ടതില്ല.', 'You don’t have to face everything alone.'],
      [16.0, 22.0, 'മനസ്സ് തുറന്ന് സംസാരിക്കാൻ, നിങ്ങളെ ശ്രദ്ധയോടെ കേൾക്കാൻ ഒരു സുരക്ഷിതമായ ഇടം.', 'A safe space to speak openly and be listened to with care.'],
      [24.6, 29.4, 'നിങ്ങളുടെ മനസ്സിനെ മനസ്സിലാക്കാനുള്ള ആദ്യ ചുവടാകട്ടെ ആ സംഭാഷണം.', 'Let that conversation be the first step toward understanding your feelings.'],
      [31.0, 34.8, 'മെൻട്രയിലൂടെ നിങ്ങളുടെ അടുത്ത ചുവട് ആരംഭിക്കൂ.', 'Take your next step with Mentra.'],
      [36.4, 39.3, 'ഇന്നുതന്നെ നിങ്ങളുടെ സെഷൻ ബുക്ക് ചെയ്യൂ.', 'Book your session today.'],
    ],
  },

  // ---------------- 15-second Meta cut ----------------
  short: {
    duration: 15,
    scenes: { hook: [0, 3], turn: [3, 6], mentra: [6, 10], end: [10, 15] },
    captions: [
      ['Too much on your mind?', 0.3, 2.9, 'hero'],
      ['You don’t have to carry it alone.', 3.3, 5.9, 'hero'],
      ['Talk to a psychologist.', 6.5, 9.8, 'hero'],
    ],
    endLine: 'Individual & Couples Therapy',
    button: 'BOOK YOUR SESSION',
    vo: [
      [0.3, 2.8, 'മനസ്സിൽ ഒരുപാട് കാര്യങ്ങളുണ്ടോ?', 'Too much on your mind?'],
      [3.3, 5.8, 'എല്ലാം ഒറ്റയ്ക്ക് നേരിടേണ്ടതില്ല.', 'You don’t have to face everything alone.'],
      [6.4, 9.4, 'ഒരു സൈക്കോളജിസ്റ്റുമായി സംസാരിക്കൂ.', 'Talk to a psychologist.'],
      [10.4, 14.4, 'മെൻട്രയിൽ നിങ്ങളുടെ സെഷൻ ഇന്നുതന്നെ ബുക്ക് ചെയ്യൂ.', 'Book your session with Mentra today.'],
    ],
  },
};
