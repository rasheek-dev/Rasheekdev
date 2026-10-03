/* ==========================================================================
   MENTRA PSYCHOLOGISTS: edit this file to add, change or remove psychologists.
   No coding needed. Keep the commas and quotes exactly as they are.

   TO ADD SOMEONE: copy one whole { ... }, block below, paste it after the last one,
   then change the details. Put their photo in the assets/ folder.

   FIELDS
   id            unique, no spaces (e.g. "psy_anjali_01"). Never reuse an id.
   active        true = shown on the site, false = hidden (kept for later)
   routeKey      which screening result sends people to them:
                   "counselling"       anxiety, stress, general emotional concerns
                   "clinical"          mood, low energy, daily functioning
                   "relationship"      relationships, family
                   "sleep_behavioural" sleep, concentration
                 (several psychologists can share a routeKey; the first one is matched)
   fee           session fee in rupees, a number (e.g. 999)
   sessionMinutes  length of one session
   calendarId    the psychologist's Google Calendar ID (see SETUP.md). Used by the backend
                 so their other commitments block slots automatically.
   schedule.weekly   working hours per weekday, as "HH:MM-HH:MM" (24-hour, India time).
                     Empty [] = not working that day.
   schedule.slotStepMinutes  gap between start times (60 = 10:00, 11:00, 12:00)
   schedule.leadHours        earliest booking, hours from now
   schedule.advanceDays      how far ahead people can book
   schedule.daysOff          whole dates off, e.g. ["2026-10-02","2026-10-20"]
   gender        "female" or "male" (for the gender preference in the Find a psychologist page). All sessions are online
   concerns      what they support. Allowed: anxiety, depression, relationships, family, selfesteem,
                 overthinking, anger, parenting, child, career, trauma, sexual, addiction
                 (if left out, a sensible list is used from routeKey)
   specialties   the 1 to 3 concerns they focus on most (same names as concerns)
   ml            optional Malayalam text for this person (title, focus, experience,
                 about, registration (kept for your records, not shown on the website), duration, why)

   NOTE: names, photos, fees and hours below are PLACEHOLDERS. Replace with real details.
   ========================================================================== */
window.MENTRA_PSYCHOLOGISTS = [
  {
    id: "psy_counselling_01",
    active: true,
    routeKey: "counselling",
    gender: "female",                       // "female" or "male" (used for the gender preference in Find a psychologist)
    concerns: ["anxiety","overthinking","selfesteem","career","anger"],   // what they support (see list in the header)
    specialties: ["anxiety","overthinking"],   // their main focus (used for "Specialist in my concern")
    name: "Anjali Nair, M.Sc.",
    firstName: "Anjali",
    photo: "assets/psychologist_female.jpg",
    title: "Counselling Psychologist",
    qualification: "M.Sc. Counselling Psychology (Reg. Kerala Health Authority)",
    registration: "Kerala Health Authority Registered",
    languages: ["Malayalam","English","Hindi"],
    experience: "7+ Years Clinical Practice",
    focus: ["Anxiety","Stress Management","Work Burnout","Panic Symptoms"],
    about: "I offer a calm, non-judgmental space where we unpack what you're feeling at your own pace. You don't have to carry this alone.",
    why: "Your responses indicated elevated stress, anxious thoughts, and daily tension. Anjali specializes in actionable cognitive coping strategies and calming nervous system overactivity.",
    fee: 999, sessionMinutes: 45,
    calendarId: "",   // paste this person's Google Calendar ID here
    schedule: {
      slotStepMinutes: 60, leadHours: 3, advanceDays: 45,
      weekly: {
        mon: ["10:00-13:00","16:00-20:00"],
        tue: ["10:00-13:00","16:00-20:00"],
        wed: ["10:00-13:00","16:00-20:00"],
        thu: ["10:00-13:00","16:00-20:00"],
        fri: ["10:00-13:00","16:00-20:00"],
        sat: ["10:00-13:00"],
        sun: [],
      },
      daysOff: []
    },
    ml: {"title":"കൗൺസിലിംഗ് സൈക്കോളജിസ്റ്റ്","focus":"ആകുലത, സ്ട്രെസ്സ് മാനേജ്മെന്റ്, ജോലി സമ്മർദ്ദം & പാനിക് ലക്ഷണങ്ങൾ","experience":"7+ വർഷത്തെ ക്ലിനിക്കൽ പരിചയം","about":"മുൻവിധികളില്ലാതെ, തുറന്നു സംസാരിക്കാൻ സാധിക്കുന്ന സുരക്ഷിതമായ ഒരിടം ഞാൻ വാഗ്ദാനം ചെയ്യുന്നു. ഈ ഭാരം നിങ്ങൾ ഒറ്റയ്ക്ക് ചുമക്കേണ്ടതില്ല.","registration":"കേരള ഹെൽത്ത് അതോറിറ്റി രജിസ്ട്രേഷൻ","duration":"45 മിനിറ്റ് പ്രൈവറ്റ് സെഷൻ","why":"നിങ്ങളുടെ ഉത്തരങ്ങൾ പ്രകാരം, നിത്യജീവിതത്തിലെ സമ്മർദ്ദങ്ങളും ആകുലതകളും കൈകാര്യം ചെയ്യാൻ അനുഭവസമ്പന്നയായ അഞ്ജലിയുടെ തെറാപ്പി രീതികളാണ് ഏറ്റവും അനുയോജ്യം."}
  },
  {
    id: "psy_clinical_01",
    active: true,
    routeKey: "clinical",
    gender: "male",                       // "female" or "male" (used for the gender preference in Find a psychologist)
    concerns: ["depression","anxiety","trauma","anger","addiction"],   // what they support (see list in the header)
    specialties: ["depression","trauma"],   // their main focus (used for "Specialist in my concern")
    name: "Dr. Rahul Menon, M.Phil.",
    firstName: "Dr. Rahul",
    photo: "assets/psychologist_male.jpg",
    title: "Clinical Psychologist",
    qualification: "M.Phil. Clinical Psychology (RCI Licensed)",
    registration: "RCI Licensed Clinical Psychologist",
    languages: ["Malayalam","English"],
    experience: "9+ Years Hospital & Therapy Experience",
    focus: ["Depressive Mood","Deep Anxiety","Psychological Evaluation"],
    about: "Together, we explore the deeper roots of what you are experiencing and build a sustainable, evidence-based path back to emotional balance.",
    why: "Your responses highlighted persistent low mood, lack of drive, and emotional exhaustion. Dr. Rahul's clinical expertise provides structured evaluation and evidence-based psychotherapy.",
    fee: 1499, sessionMinutes: 50,
    calendarId: "",   // paste this person's Google Calendar ID here
    schedule: {
      slotStepMinutes: 60, leadHours: 3, advanceDays: 45,
      weekly: {
        mon: ["10:00-14:00","17:00-21:00"],
        tue: ["10:00-14:00","17:00-21:00"],
        wed: ["10:00-14:00","17:00-21:00"],
        thu: ["10:00-14:00","17:00-21:00"],
        fri: ["10:00-14:00","17:00-21:00"],
        sat: ["10:00-13:00"],
        sun: [],
      },
      daysOff: []
    },
    ml: {"title":"ക്ലിനിക്കൽ സൈക്കോളജിസ്റ്റ്","focus":"വിഷാദം, കടുത്ത ഉത്കണ്ഠ & ക്ലിനിക്കൽ ഇവാല്യുവേഷൻ","experience":"9+ വർഷത്തെ ആശുപത്രി & തെറാപ്പി പരിചയം","about":"നിങ്ങൾ അനുഭവിക്കുന്ന പ്രയാസങ്ങളുടെ ആഴത്തിലുള്ള കാരണങ്ങൾ മനസ്സിലാക്കി മാനസിക സുഖം വീണ്ടെടുക്കാൻ ശാസ്ത്രീയമായ വഴികൾ നമുക്ക് ഒന്നിച്ച് കണ്ടെത്താം.","registration":"RCI ലൈസൻസ്ഡ് ക്ലിനിക്കൽ സൈക്കോളജിസ്റ്റ്","duration":"50 മിനിറ്റ് ക്ലിനിക്കൽ സെഷൻ","why":"ദീർഘകാല മാനസികാവസ്ഥ വ്യതിയാനങ്ങളും തളർച്ചയും സമഗ്രമായി പരിശോധിക്കാൻ ആർ.സി.ഐ ലൈസൻസ്ഡ് ക്ലിനിക്കൽ സൈക്കോളജിസ്റ്റായ ഡോ. രാഹുൽ സഹായിക്കുന്നു."}
  },
  {
    id: "psy_relationship_01",
    active: true,
    routeKey: "relationship",
    gender: "female",                       // "female" or "male" (used for the gender preference in Find a psychologist)
    concerns: ["relationships","family","parenting","child","sexual","selfesteem"],   // what they support (see list in the header)
    specialties: ["relationships","family"],   // their main focus (used for "Specialist in my concern")
    name: "Dr. Priya Varma, Ph.D.",
    firstName: "Dr. Priya",
    photo: "assets/psychologist_female_senior.jpg",
    title: "Relationship & Family Psychologist",
    qualification: "Ph.D. Psychology, Specialist in Couples & Family Therapy",
    registration: "Senior Specialist & Family Consultant",
    languages: ["Malayalam","English","Tamil"],
    experience: "11+ Years Couples & Family Counselling",
    focus: ["Relationship Dynamics","Communication Deadlocks","Family Systems"],
    about: "Relationships can be our greatest comfort or our deepest source of pain. I help restore empathy, healthy boundaries, and clear communication.",
    why: "Your responses reflected interpersonal strain, communication deadlocks, and emotional tension in relationships. Dr. Priya provides an empathetic, constructive neutral space.",
    fee: 1499, sessionMinutes: 50,
    calendarId: "",   // paste this person's Google Calendar ID here
    schedule: {
      slotStepMinutes: 60, leadHours: 3, advanceDays: 45,
      weekly: {
        mon: [],
        tue: ["11:00-14:00","17:00-20:00"],
        wed: ["11:00-14:00","17:00-20:00"],
        thu: ["11:00-14:00","17:00-20:00"],
        fri: ["11:00-14:00","17:00-20:00"],
        sat: ["11:00-14:00","17:00-20:00"],
        sun: ["11:00-14:00"],
      },
      daysOff: []
    },
    ml: {"title":"റിലേഷൻഷിപ്പ് & ഫാമിലി സൈക്കോളജിസ്റ്റ്","focus":"ദാമ്പത്യ/പ്രണയ കൗൺസിലിംഗ്, ആശയവിനിമയ തടസ്സങ്ങൾ","experience":"11+ വർഷത്തെ റിലേഷൻഷിപ്പ് തെറാപ്പി പരിചയം","about":"ബന്ധങ്ങളിലെ വിള്ളലുകളും തെറ്റിദ്ധാരണകളും മാറ്റി പരസ്പര സ്നേഹവും വ്യക്തമായ ആശയവിനിമയവും പുനഃസ്ഥാപിക്കാൻ ഞാൻ സഹായിക്കുന്നു.","registration":"സീനിയർ റിലേഷൻഷിപ്പ് കൺസൾട്ടന്റ്","duration":"50 മിനിറ്റ് കപ്പിൾസ് / ഇൻഡിവിജ്വൽ സെഷൻ","why":"ബന്ധങ്ങളിലെ ആശയവിനിമയ തടസ്സങ്ങളും സമാധാനക്കേടും നിഷ്പക്ഷമായി മനസ്സിലാക്കാനും പരിഹരിക്കാനും ഡോ. പ്രിയയുടെ 11+ വർഷത്തെ പരിചയം സഹായകമാകും."}
  },
  {
    id: "psy_sleep_01",
    active: true,
    routeKey: "sleep_behavioural",
    gender: "male",                       // "female" or "male" (used for the gender preference in Find a psychologist)
    concerns: ["overthinking","anxiety","career","depression"],   // what they support (see list in the header)
    specialties: ["overthinking","career"],   // their main focus (used for "Specialist in my concern")
    name: "Dr. Arun Kumar, M.Phil.",
    firstName: "Dr. Arun",
    photo: "assets/psychologist_male.jpg",
    title: "Behavioural & Sleep Psychologist",
    qualification: "M.Phil. Psychology, Behavioural Sleep & Focus Specialist",
    registration: "M.Phil. Behavioural Sleep Specialist",
    languages: ["Malayalam","English"],
    experience: "8+ Years Behavioural Therapy",
    focus: ["Insomnia","Sleep Disturbances","Focus","Lifestyle Restructuring"],
    about: "Restoring natural sleep cycles and mental clarity starts with small, compassionate adjustments to how the mind unwinds each day.",
    why: "Your responses indicated significant sleep disruption, fatigue, or concentration difficulties. Dr. Arun specializes in non-pharmacological behavioural interventions and sleep reset.",
    fee: 1199, sessionMinutes: 45,
    calendarId: "",   // paste this person's Google Calendar ID here
    schedule: {
      slotStepMinutes: 60, leadHours: 3, advanceDays: 45,
      weekly: {
        mon: ["16:00-21:00"],
        tue: ["16:00-21:00"],
        wed: ["16:00-21:00"],
        thu: ["16:00-21:00"],
        fri: ["16:00-21:00"],
        sat: ["16:00-21:00"],
        sun: [],
      },
      daysOff: []
    },
    ml: {"title":"ബിഹേവിയറൽ & സ്ലീപ് സൈക്കോളജിസ്റ്റ്","focus":"ഉറക്കമില്ലായ്മ, ശ്രദ്ധക്കുറവ് & ലൈഫ്‌സ്റ്റൈൽ സ്ട്രെസ്സ്","experience":"8+ വർഷത്തെ ബിഹേവിയറൽ തെറാപ്പി","about":"ശാന്തമായ ഉറക്കവും മാനസിക ഉന്മേഷവും വീണ്ടെടുക്കാൻ ചെറിയ ബിഹേവിയറൽ മാറ്റങ്ങളിലൂടെ നമുക്ക് സാധിക്കും.","registration":"M.Phil. ബിഹേവിയറൽ സ്പെഷ്യലിസ്റ്റ്","duration":"45 മിനിറ്റ് ബിഹേവിയറൽ കൺസൾട്ടേഷൻ","why":"ഉറക്കക്കുറവും ക്ഷീണവും ക്രമീകരിക്കുന്നതിന് മരുന്നുകളില്ലാത്ത ശാസ്ത്രീയമായ ബിഹേവിയറൽ തെറാപ്പി നൽകാൻ ഡോ. അരുൺ സഹായിക്കുന്നു."}
  },
];
