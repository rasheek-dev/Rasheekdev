/* ==========================================================================
   MENTRA: Find a psychologist (guided booking flow)
   One page, one decision at a time. Reuses the site's data (psychologists.js), settings (config.js),
   Google backend (BOOKING_API_URL) and Razorpay payment. No framework: small components, one state object.
   Sections: 1 settings and helpers · 2 data · 3 availability · 4 matching · 5 components · 6 screens · 7 payment · 8 start
   ========================================================================== */
(function () {
  'use strict';

  /* ---------- 1. settings and helpers ---------- */
  const CFG = window.MENTRA_CONFIG || {};
  const API = CFG.BOOKING_API_URL || "";
  const REQUIRE_PAYMENT = CFG.REQUIRE_PAYMENT !== false;
  const WA = String(CFG.WHATSAPP_NUMBER || "").replace(/\D/g, "");
    const FORMSPREE = CFG.FORMSPREE_ENDPOINT || "";
  const PIXEL = CFG.META_PIXEL_ID || "";
  const VARIANT = document.body.getAttribute("data-variant") || "find_a_psychologist_v1";
  const SOURCE = document.body.getAttribute("data-source") || "find-a-psychologist";
  const IST = "Asia/Kolkata", IST_OFF = "+05:30";
  const DEMO_COUPONS = { WELCOME10: { type: "percent", value: 10 }, MENTRA100: { type: "flat", value: 100 } }; // preview only; live coupons live in the Google script
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => [].slice.call((r || document).querySelectorAll(s));
  const esc = s => String(s == null ? "" : s).replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const pad2 = n => String(n).padStart(2, "0");
  const sleep = ms => new Promise(r => setTimeout(r, ms));
  const money = n => "₹" + Number(n || 0).toLocaleString("en-IN");
  const reduceMotion = () => window.matchMedia && matchMedia("(prefers-reduced-motion: reduce)").matches;

  function istToday() { return new Intl.DateTimeFormat("en-CA", { timeZone: IST, year: "numeric", month: "2-digit", day: "2-digit" }).format(new Date()); }
  function addDays(iso, n) { const p = iso.split("-").map(Number), d = new Date(Date.UTC(p[0], p[1] - 1, p[2] + n)); return d.getUTCFullYear() + "-" + pad2(d.getUTCMonth() + 1) + "-" + pad2(d.getUTCDate()); }
  function dowOf(iso) { const p = iso.split("-").map(Number); return new Date(Date.UTC(p[0], p[1] - 1, p[2])).getUTCDay(); }
  const toInstant = (iso, hhmm) => new Date(iso + "T" + hhmm + ":00" + IST_OFF);
  const toMin = t => { const a = t.split(":"); return (+a[0]) * 60 + (+a[1]); };
  const fromMin = m => pad2(Math.floor(m / 60)) + ":" + pad2(m % 60);
  function istParts(d) {
    const f = new Intl.DateTimeFormat("en-CA", { timeZone: IST, year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit", hourCycle: "h23" }).formatToParts(d).reduce((a, p) => (a[p.type] = p.value, a), {});
    return { date: f.year + "-" + f.month + "-" + f.day, time: f.hour + ":" + f.minute };
  }
  function userTZ() { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || IST; } catch (e) { return IST; } }
    const dispTZ = () => userTZ();                                                    // all sessions are online: times are shown in the client's own timezone
  const localKey = d => new Intl.DateTimeFormat("en-CA", { timeZone: dispTZ(), year: "numeric", month: "2-digit", day: "2-digit" }).format(d);
  const fmtTime = d => d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZone: dispTZ() });
  const localHour = d => parseInt(new Intl.DateTimeFormat("en-GB", { timeZone: dispTZ(), hour: "2-digit", hourCycle: "h23" }).format(d), 10);
  const longDate = key => new Date(key + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", timeZone: "UTC" });
  const monthName = key => new Date(key + "-01T12:00:00Z").toLocaleDateString("en-US", { month: "long", year: "numeric", timeZone: "UTC" });
  function tzLabel() { if (dispTZ() === IST) return "IST"; try { const n = new Intl.DateTimeFormat("en-US", { timeZone: dispTZ(), timeZoneName: "short" }).formatToParts(new Date()).find(p => p.type === "timeZoneName"); return n ? n.value : dispTZ(); } catch (e) { return dispTZ(); } }
  function dayWord(d) {      // Today / Tomorrow / Saturday
    const k = localKey(d), t = localKey(new Date()), tm = localKey(new Date(Date.now() + 86400000));
    return k === t ? "Today" : k === tm ? "Tomorrow" : new Date(k + "T12:00:00Z").toLocaleDateString("en-US", { weekday: "long", timeZone: "UTC" });
  }

  /* campaign attribution: shared with the main site so the first ad that brought someone is never lost */
  const ATTR_KEY = "mentra_attr_v1";
  function captureAttribution() {
    let a = {}; try { a = JSON.parse(localStorage.getItem(ATTR_KEY)) || {}; } catch (e) {}
    const sp = new URLSearchParams(location.search);
    if (!a.landing_page) { a.landing_page = location.origin + location.pathname; ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid"].forEach(k => { if (sp.get(k)) a[k] = sp.get(k); }); }
    try { localStorage.setItem(ATTR_KEY, JSON.stringify(a)); } catch (e) {}
    return a;
  }
  const ATTR = captureAttribution();
  if (PIXEL && PIXEL.indexOf("YOUR_") !== 0) {
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = "2.0"; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, "script", "https://connect.facebook.net/en_US/fbevents.js");
    window.fbq("init", PIXEL);
  }
  const PIXEL_MAP = { PageView: "PageView", DetailsSubmitted: "Lead", PaymentStarted: "InitiateCheckout", BookingConfirmed: "Schedule" };
  function track(name, props) {      // never send concerns, answers or health information to advertising tools
    (window.dataLayer = window.dataLayer || []).push(Object.assign({ event: name, funnel_variant: VARIANT, utm_source: ATTR.utm_source, utm_medium: ATTR.utm_medium, utm_campaign: ATTR.utm_campaign }, props || {}));
    if (window.fbq && PIXEL_MAP[name]) window.fbq("track", PIXEL_MAP[name], { funnel_variant: VARIANT });
  }

  /* ---------- 2. data ---------- */
  const ICON = {
    waves: '<path d="M3 8c2 0 2-2 4.5-2S10 8 12 8s2-2 4.5-2S19 8 21 8M3 13c2 0 2-2 4.5-2S10 13 12 13s2-2 4.5-2S19 13 21 13M3 18c2 0 2-2 4.5-2S10 18 12 18s2-2 4.5-2S19 18 21 18"/>',
    cloud: '<path d="M7 16a4 4 0 1 1 .9-7.9A5.5 5.5 0 0 1 18.5 9.5 3.3 3.3 0 0 1 18 16z"/><path d="M9 19v2M13 19v2M17 19v2"/>',
    rel: '<circle cx="9" cy="12" r="5"/><circle cx="15" cy="12" r="5"/>',
    family: '<circle cx="12" cy="7" r="2.5"/><circle cx="5.5" cy="9.5" r="2"/><circle cx="18.5" cy="9.5" r="2"/><path d="M7.5 20v-3a4.5 4.5 0 0 1 9 0v3M2.5 18v-1.5a3.5 3.5 0 0 1 3.2-3.4M21.5 18v-1.5a3.5 3.5 0 0 0-3.2-3.4"/>',
    spark: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 17l.7 1.8L21.5 19.5l-1.8.7L19 22l-.7-1.8-1.8-.7 1.8-.7z"/>',
    swirl: '<path d="M12 12a2 2 0 1 1 2 2 4 4 0 1 1-4-4 6 6 0 1 1 6 6"/>',
    flame: '<path d="M12 3c.5 3 4 5 4 9a4 4 0 0 1-8 0c0-1.7.8-3 1.8-4 .2 1.2.9 2 1.7 2C11 8 11.2 5.5 12 3z"/>',
    parent: '<circle cx="9" cy="6.5" r="2.5"/><path d="M4 20v-4a5 5 0 0 1 10 0v4"/><circle cx="18" cy="13" r="2"/><path d="M15.5 20v-1.5a2.5 2.5 0 0 1 5 0V20"/>',
    child: '<circle cx="12" cy="12" r="9"/><path d="M8.5 14c1 1.5 2.2 2.2 3.5 2.2s2.5-.7 3.5-2.2M9 9.5h.01M15 9.5h.01"/>',
    brief: '<rect x="3" y="7" width="18" height="13" rx="2.5"/><path d="M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M3 13h18"/>',
    compass: '<circle cx="12" cy="12" r="9"/><path d="M15.5 8.5l-2 5-5 2 2-5z"/>',
    heart: '<path d="M12 20s-7-4.4-9-9c-1.4-3.4 1-6.5 4-6.5 2 0 3.6 1 5 2.8 1.4-1.8 3-2.8 5-2.8 3 0 5.4 3.1 4 6.5-2 4.6-9 9-9 9z"/>',
    refresh: '<path d="M20 12a8 8 0 1 1-2.4-5.7M20 4v5h-5"/>',
    dots: '<circle cx="12" cy="12" r="9"/><path d="M8 12h.01M12 12h.01M16 12h.01"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    couple: '<circle cx="8.5" cy="9" r="3.5"/><circle cx="15.5" cy="9" r="3.5"/><path d="M2.5 20a6 6 0 0 1 9-5M21.5 20a6 6 0 0 0-9-5"/>',
    lock: '<rect x="4" y="11" width="16" height="10" rx="2.5"/><path d="M8 11V8a4 4 0 0 1 8 0v3"/>',
    video: '<rect x="3" y="6" width="13" height="12" rx="3"/><path d="M16 10l5-3v10l-5-3"/>',
    check: '<path d="M5 12.5l4.2 4.2L19 7"/>',
    cal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>',
    pin: '<path d="M12 21s7-6 7-11a7 7 0 1 0-14 0c0 5 7 11 7 11z"/><circle cx="12" cy="10" r="2.5"/>',
    left: '<path d="M15 6l-6 6 6 6"/>', right: '<path d="M9 6l6 6-6 6"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>',
    globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 2v2M12 20v2M2 12h2M20 12h2M5 5l1.4 1.4M17.6 17.6L19 19M5 19l1.4-1.4M17.6 6.4L19 5"/>',
    sunset: '<path d="M5 18a7 7 0 0 1 14 0M2 18h20M12 3v4M5.6 8.6l1.4 1.4M18.4 8.6L17 10"/>',
    moon: '<path d="M20 14.5A8 8 0 1 1 9.5 4a6.5 6.5 0 0 0 10.5 10.5z"/>',
    zap: '<path d="M13 3L5 14h6l-1 7 8-11h-6z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17h.01"/>'
  };
  const icon = (n, size) => '<svg class="ic" width="' + (size || 22) + '" height="' + (size || 22) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON[n] || "") + "</svg>";

  const CONCERNS = [
    { id: "anxiety", t: "Anxiety & stress", i: "waves" }, { id: "depression", t: "Low mood", i: "cloud" }, { id: "relationships", t: "Relationships", i: "rel" },
    { id: "family", t: "Family", i: "family" }, { id: "selfesteem", t: "Self-esteem", i: "spark" }, { id: "overthinking", t: "Overthinking", i: "swirl" },
    { id: "anger", t: "Anger", i: "flame" }, { id: "parenting", t: "Parenting", i: "parent" }, { id: "child", t: "Child & teen", i: "child" },
    { id: "career", t: "Work & studies", i: "brief" }, { id: "trauma", t: "Life changes", i: "compass" }, { id: "sexual", t: "Intimacy", i: "heart" },
    { id: "addiction", t: "Addiction", i: "refresh" }, { id: "other", t: "Something else", i: "dots" }
  ];
  const WHO = [{ id: "self", t: "Me", i: "user" }, { id: "partner", t: "My partner", i: "couple" }, { id: "child", t: "My child", i: "child" }, { id: "family", t: "My family", i: "family" }, { id: "other", t: "Someone else", i: "heart" }];
  const START = [{ id: "asap", t: "As soon as possible", i: "zap" }, { id: "week", t: "This week", i: "cal" }, { id: "next", t: "Next week", i: "cal" }, { id: "flex", t: "I'm flexible", i: "waves" }];
  const TIMES = [{ id: "morning", t: "Morning", i: "sun" }, { id: "afternoon", t: "Afternoon", i: "sunset" }, { id: "evening", t: "Evening", i: "moon" }, { id: "any", t: "Any time", i: "dots" }];
  const AGES = ["Under 18", "18 to 24", "25 to 34", "35 to 44", "45 to 54", "55 and over"];
  const COUNTRIES = "IN,India,91|AE,United Arab Emirates,971|SA,Saudi Arabia,966|QA,Qatar,974|KW,Kuwait,965|OM,Oman,968|BH,Bahrain,973|GB,United Kingdom,44|US,United States,1|CA,Canada,1|AU,Australia,61|SG,Singapore,65|MY,Malaysia,60|DE,Germany,49|IE,Ireland,353|NZ,New Zealand,64|AF,Afghanistan,93|AL,Albania,355|DZ,Algeria,213|AD,Andorra,376|AO,Angola,244|AR,Argentina,54|AM,Armenia,374|AT,Austria,43|AZ,Azerbaijan,994|BD,Bangladesh,880|BY,Belarus,375|BE,Belgium,32|BZ,Belize,501|BJ,Benin,229|BT,Bhutan,975|BO,Bolivia,591|BA,Bosnia and Herzegovina,387|BW,Botswana,267|BR,Brazil,55|BN,Brunei,673|BG,Bulgaria,359|BF,Burkina Faso,226|BI,Burundi,257|KH,Cambodia,855|CM,Cameroon,237|CV,Cape Verde,238|CF,Central African Republic,236|TD,Chad,235|CL,Chile,56|CN,China,86|CO,Colombia,57|KM,Comoros,269|CD,Congo (DRC),243|CG,Congo (Republic),242|CR,Costa Rica,506|HR,Croatia,385|CU,Cuba,53|CY,Cyprus,357|CZ,Czechia,420|DK,Denmark,45|DJ,Djibouti,253|EC,Ecuador,593|EG,Egypt,20|SV,El Salvador,503|GQ,Equatorial Guinea,240|ER,Eritrea,291|EE,Estonia,372|SZ,Eswatini,268|ET,Ethiopia,251|FJ,Fiji,679|FI,Finland,358|FR,France,33|GA,Gabon,241|GM,Gambia,220|GE,Georgia,995|GH,Ghana,233|GR,Greece,30|GT,Guatemala,502|GN,Guinea,224|GW,Guinea-Bissau,245|GY,Guyana,592|HT,Haiti,509|HN,Honduras,504|HK,Hong Kong,852|HU,Hungary,36|IS,Iceland,354|ID,Indonesia,62|IR,Iran,98|IQ,Iraq,964|IL,Israel,972|IT,Italy,39|CI,Ivory Coast,225|JP,Japan,81|JO,Jordan,962|KZ,Kazakhstan,7|KE,Kenya,254|KG,Kyrgyzstan,996|LA,Laos,856|LV,Latvia,371|LB,Lebanon,961|LS,Lesotho,266|LR,Liberia,231|LY,Libya,218|LI,Liechtenstein,423|LT,Lithuania,370|LU,Luxembourg,352|MO,Macau,853|MG,Madagascar,261|MW,Malawi,265|MV,Maldives,960|ML,Mali,223|MT,Malta,356|MR,Mauritania,222|MU,Mauritius,230|MX,Mexico,52|MD,Moldova,373|MC,Monaco,377|MN,Mongolia,976|ME,Montenegro,382|MA,Morocco,212|MZ,Mozambique,258|MM,Myanmar,95|NA,Namibia,264|NP,Nepal,977|NL,Netherlands,31|NI,Nicaragua,505|NE,Niger,227|NG,Nigeria,234|MK,North Macedonia,389|NO,Norway,47|PK,Pakistan,92|PS,Palestine,970|PA,Panama,507|PG,Papua New Guinea,675|PY,Paraguay,595|PE,Peru,51|PH,Philippines,63|PL,Poland,48|PT,Portugal,351|RO,Romania,40|RU,Russia,7|RW,Rwanda,250|SN,Senegal,221|RS,Serbia,381|SC,Seychelles,248|SL,Sierra Leone,232|SK,Slovakia,421|SI,Slovenia,386|SO,Somalia,252|ZA,South Africa,27|KR,South Korea,82|SS,South Sudan,211|ES,Spain,34|LK,Sri Lanka,94|SD,Sudan,249|SR,Suriname,597|SE,Sweden,46|CH,Switzerland,41|SY,Syria,963|TW,Taiwan,886|TJ,Tajikistan,992|TZ,Tanzania,255|TH,Thailand,66|TG,Togo,228|TN,Tunisia,216|TR,Turkey,90|TM,Turkmenistan,993|UG,Uganda,256|UA,Ukraine,380|UY,Uruguay,598|UZ,Uzbekistan,998|VE,Venezuela,58|VN,Vietnam,84|YE,Yemen,967|ZM,Zambia,260|ZW,Zimbabwe,263".split("|").map(r => { const a = r.split(","); return { iso: a[0], name: a[1], dial: a[2] }; });
  const POPULAR = 16;
  const countryOf = iso => COUNTRIES.find(c => c.iso === iso) || COUNTRIES[0];
  const ROUTE_DEFAULTS = { counselling: ["anxiety", "overthinking", "selfesteem", "career"], clinical: ["depression", "anxiety", "trauma"], relationship: ["relationships", "family", "parenting", "sexual"], sleep_behavioural: ["overthinking", "career"] };

  const PROS = (window.MENTRA_PSYCHOLOGISTS || []).filter(p => p && p.active !== false).map(p => ({
    id: p.id, name: p.name, first: p.firstName || String(p.name).split(",")[0], title: p.title, qual: p.qualification || "", reg: p.registration || "",
    photo: /^(https?:|data:|\/)/.test(p.photo || "") ? p.photo : "../" + (p.photo || "assets/mentra-logo.png"), langs: p.languages || [], exp: p.experience || "", focus: p.focus || [], about: p.about || "",
    fee: Number(p.fee) || 0, mins: p.sessionMinutes || 45, gender: p.gender || "",
    concerns: p.concerns && p.concerns.length ? p.concerns : (ROUTE_DEFAULTS[p.routeKey] || []), specialties: p.specialties || [], schedule: p.schedule || {}
  }));
  const proOf = id => PROS.find(p => p.id === id);
  const years = p => { const m = /(\d+)/.exec(p.exp); return m ? +m[1] : 0; };

  /* ---------- state (everything the flow knows, ready to hand to a backend) ---------- */
  const KEY = "mentra_find_v2";
  const fresh = () => ({ step: "intro", concerns: [], who: null, gender: "any", languages: [], start: null, times: [], prefsSkipped: false,
    details: { name: "", cc: "IN", phone: "", email: "", age: "" }, matchIds: [], matchMeta: {}, matchNote: "", profileId: null, chosenId: null, direct: false,
    dateKey: null, slotISO: null, coupon: { code: "", applied: false, discount: 0, msg: "" }, couponOpen: false, booking: null });
  let S = fresh();
  try { const saved = JSON.parse(sessionStorage.getItem(KEY)); if (saved && saved.step) S = Object.assign(fresh(), saved); } catch (e) {}
  const save = () => { try { sessionStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };

  /* ---------- 3. availability: working hours minus busy times from the booking backend ---------- */
  const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
  const DEFAULT_SCHEDULE = { slotStepMinutes: 60, leadHours: 3, advanceDays: 45, daysOff: [], weekly: { mon: ["10:00-13:00", "16:00-20:00"], tue: ["10:00-13:00", "16:00-20:00"], wed: ["10:00-13:00", "16:00-20:00"], thu: ["10:00-13:00", "16:00-20:00"], fri: ["10:00-13:00", "16:00-20:00"], sat: ["10:00-13:00"], sun: [] } };
  const scheduleOf = p => Object.assign({}, DEFAULT_SCHEDULE, p.schedule || {});
  function daySlots(p, iso, ignoreLead) {
    const sc = scheduleOf(p);
    if ((sc.daysOff || []).indexOf(iso) > -1) return [];
    const out = [], step = sc.slotStepMinutes || 60, minStart = Date.now() + (ignoreLead ? 0 : (sc.leadHours || 0) * 3600000);
    (sc.weekly[DAY_KEYS[dowOf(iso)]] || []).forEach(w => {
      const a = w.split("-"); let s = toMin(a[0]); const e = toMin(a[1]);
      while (s + p.mins <= e) { const t = fromMin(s), st = toInstant(iso, t); if (st.getTime() >= minStart) out.push({ start: st, end: new Date(st.getTime() + p.mins * 60000) }); s += step; }
    });
    return out;
  }
  const isFree = (slot, busy) => !busy.some(b => slot.start.getTime() < b.e && slot.end.getTime() > b.s);
  function demoBusy(p, fromISO, toISO) {       // preview only: pretends some hours are taken. Never used when BOOKING_API_URL is set.
    const out = [], hash = str => { let h = 7; for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) % 997; return h % 100; };
    for (let d = fromISO; d <= toISO; d = addDays(d, 1)) daySlots(p, d, true).forEach(s => { if (hash(p.id + d + istParts(s.start).time) < 30) out.push({ s: s.start.getTime(), e: s.end.getTime() }); });
    let mine = []; try { mine = JSON.parse(localStorage.getItem("mentra_demo_booked") || "[]"); } catch (e) {}
    mine.filter(b => b.id === p.id).forEach(b => out.push({ s: b.s, e: b.e }));
    return out;
  }
  const busyCache = {}, slotCache = {};
  async function loadBusy(p, fromISO, toISO) {
    const c = busyCache[p.id]; if (c && c.from <= fromISO && c.to >= toISO && Date.now() - c.ts < 60000) return c.list;
    let list;
    if (API) {
      const r = await fetch(API + (API.indexOf("?") > -1 ? "&" : "?") + "action=busy&pro=" + encodeURIComponent(p.id) + "&from=" + fromISO + "&to=" + toISO); if (!r.ok) throw new Error("busy");
      const j = await r.json(); if (j.error) throw new Error(j.error);
      list = (j.busy || []).map(b => ({ s: new Date(b.start).getTime(), e: new Date(b.end).getTime() }));
    } else list = demoBusy(p, fromISO, toISO);
    busyCache[p.id] = { from: fromISO, to: toISO, list: list, ts: Date.now() };
    return list;
  }
  async function slotsFor(p, force) {         // every free start time in the booking window, soonest first
    if (!force && slotCache[p.id] && Date.now() - slotCache[p.id].ts < 60000) return slotCache[p.id].list;
    if (force) delete busyCache[p.id];
    const t = istToday(), last = addDays(t, scheduleOf(p).advanceDays), busy = await loadBusy(p, t, last), out = [];
    for (let d = t; d <= last; d = addDays(d, 1)) daySlots(p, d).forEach(s => { if (isFree(s, busy)) out.push(s); });
    slotCache[p.id] = { ts: Date.now(), list: out };
    return out;
  }


  /* ---------- 4. matching: transparent rules, no scores. Exact matches first, then the closest options (and we say what differs) ---------- */
  function windowOf(start) {                  // [from, to] in ms, or null for "any time"
    const now = Date.now(), t = istToday(), dow = dowOf(t);
    if (start === "asap") return [now, now + 72 * 3600000];
    if (start === "week") return [now, toInstant(addDays(t, (7 - dow) % 7), "23:59").getTime()];
    if (start === "next") { const toMon = ((8 - dow) % 7) || 7, mon = addDays(t, toMon); return [toInstant(mon, "00:00").getTime(), toInstant(addDays(mon, 6), "23:59").getTime()]; }
    return null;
  }
  const partOfDay = h => h < 12 ? "morning" : h < 17 ? "afternoon" : "evening";
  async function computeMatches() {
    const s = S, want = s.concerns.filter(c => c !== "other"), win = windowOf(s.start), tod = s.times.filter(x => x !== "any");
    const langs = s.languages.filter(x => x !== "Other"), results = [];
    for (const p of PROS) {
      let slots = []; try { slots = await slotsFor(p); } catch (e) { slots = []; }
      const unmet = [];
      if (want.length && !want.some(c => p.concerns.indexOf(c) > -1)) unmet.push("areas of support");
      if (s.who === "child" && p.concerns.indexOf("child") < 0) unmet.push("works with children");
      if (s.gender !== "any" && p.gender !== s.gender) unmet.push("gender");
      if (langs.length && !langs.some(l => p.langs.map(x => x.toLowerCase()).indexOf(l.toLowerCase()) > -1)) unmet.push("language");
      const inWin = slots.filter(x => !win || (x.start.getTime() >= win[0] && x.start.getTime() <= win[1]));
      const fits = inWin.filter(x => !tod.length || tod.indexOf(partOfDay(localHour(x.start))) > -1);
      if (!slots.length) unmet.push("availability"); else if (!inWin.length) unmet.push("timing"); else if (!fits.length) unmet.push("time of day");
      const next = (fits[0] || inWin[0] || slots[0]) || null;
      results.push({ p: p, unmet: unmet, next: next ? next.start.toISOString() : null });
    }
    const byNext = (a, b) => (a.next || "9").localeCompare(b.next || "9");
    const exact = results.filter(r => !r.unmet.length).sort(byNext), close = results.filter(r => r.unmet.length).sort((a, b) => a.unmet.length - b.unmet.length || byNext(a, b));
    let pick = exact.slice(0, 4);
    if (pick.length < 3) pick = pick.concat(close.slice(0, 3 - pick.length));
    S.matchIds = pick.map(r => r.p.id); S.matchMeta = {}; pick.forEach(r => { S.matchMeta[r.p.id] = { unmet: r.unmet, next: r.next }; });
    S.matchNote = exact.length ? "" : "No exact match for everything, so these are the closest.";
    save(); return pick;
  }


  /* ---------- 5. components (small functions that return HTML) ---------- */
  function Bubbles(o) {                       // soft pill choices that wrap freely (checkboxes underneath, so keyboards and screen readers work)
    return '<div class="bubs" role="group" aria-label="' + esc(o.label) + '">' + o.items.map(it => {
      const on = o.selected.indexOf(it.id) > -1;
      return '<label class="bub' + (on ? " on" : "") + '"><input type="checkbox" name="' + o.name + '" value="' + it.id + '"' + (on ? " checked" : "") + '><span class="bi">' + icon(it.i, 18) + "</span><span>" + esc(it.t) + "</span></label>";
    }).join("") + "</div>";
  }
  function Tiles(o) {                         // large calm tiles, one choice
    return '<div class="tiles" role="group" aria-label="' + esc(o.label) + '">' + o.items.map(it => {
      const on = o.selected === it.id;
      return '<label class="tile' + (on ? " on" : "") + '"><input type="radio" name="' + o.name + '" value="' + it.id + '"' + (on ? " checked" : "") + '><span class="ti">' + icon(it.i, 26) + '</span><span class="tl">' + esc(it.t) + "</span></label>";
    }).join("") + "</div>";
  }
  function ChipGroup(o) {
    return '<fieldset class="cg"><legend>' + esc(o.legend) + '</legend><div class="chips">' + o.items.map(it => {
      const id = it.id || it, t = it.t || it, on = o.multi ? o.selected.indexOf(id) > -1 : o.selected === id;
      return '<label class="chip' + (on ? " on" : "") + '"><input type="' + (o.multi ? "checkbox" : "radio") + '" name="' + o.name + '" value="' + esc(id) + '"' + (on ? " checked" : "") + ">" + (it.i ? icon(it.i, 16) : "") + "<span>" + esc(t) + "</span></label>";
    }).join("") + "</div></fieldset>";
  }
  function ActionBar(cfg) {
    if (!cfg) return "";
    return (cfg.next ? '<button type="button" class="btn primary big" data-act="next"' + (cfg.next.off ? " disabled" : "") + ">" + esc(cfg.next.label) + "</button>" : "") + (cfg.note ? '<p class="bar-note">' + cfg.note + "</p>" : "");
  }
  function ExpertCard(p, meta, i, n) {
    const exact = !meta || !meta.unmet || !meta.unmet.length;
    const next = meta && meta.next ? (d => dayWord(d) + " · " + fmtTime(d))(new Date(meta.next)) : "No openings right now";
    return '<article class="xc" data-id="' + esc(p.id) + '" aria-label="Match ' + (i + 1) + " of " + n + '"><div class="xhead"><img class="xp" src="' + esc(p.photo) + '" alt="" width="84" height="84"><div><h3>' + esc(p.name) + '</h3><p class="xt">' + esc(p.title) + "</p></div></div>" +
      '<div class="tags">' + p.focus.slice(0, 2).map(f => "<span>" + esc(f) + "</span>").join("") + "</div>" +
      '<ul class="xmeta"><li>' + icon("globe", 18) + "<span>" + esc(p.langs.join(" · ")) + "</span></li><li>" + icon("cal", 18) + "<span>Next: <b>" + esc(next) + "</b></span></li><li>" + icon("video", 18) + "<span><b>" + money(p.fee) + "</b> · " + p.mins + " min · online</span></li></ul>" +
      (exact ? "" : '<p class="xclose">Closest fit. Different: ' + esc(meta.unmet.join(", ")) + ".</p>") +
      '<div class="xact"><button type="button" class="btn primary" data-act="choose" data-id="' + esc(p.id) + '">Choose</button><button type="button" class="btn ghost" data-act="profile" data-id="' + esc(p.id) + '">Profile</button></div></article>';
  }
  function ProfileSheet(p) {
    return '<div class="pf"><img class="xp" src="' + esc(p.photo) + '" alt="" width="104" height="104"><h2 id="sh-t">' + esc(p.name) + '</h2><p class="xt">' + esc(p.title) + "</p>" + (p.qual ? '<p class="muted small">' + esc(p.qual) + "</p>" : "") +
      (p.about ? '<p class="pf-about">' + esc(p.about) + "</p>" : "") + '<div class="tags c">' + p.focus.map(f => "<span>" + esc(f) + "</span>").join("") + "</div>" +
      '<dl class="pf-dl"><div><dt>Languages</dt><dd>' + esc(p.langs.join(", ")) + "</dd></div><div><dt>Experience</dt><dd>" + esc(p.exp) + "</dd></div><div><dt>Session</dt><dd>" + p.mins + " min, online</dd></div><div><dt>Fee</dt><dd>" + money(p.fee) + "</dd></div>" + '</dl><button type="button" class="btn primary block" data-act="choose" data-id="' + esc(p.id) + '">Choose ' + esc(p.first) + "</button></div>";
  }
  function BreathingMatch() {
    const orbs = PROS.slice(0, 5).map((p, k) => '<span class="bo bo' + k + '"><img src="' + esc(p.photo) + '" alt="" width="46" height="46"></span>').join("");
    return '<div class="match"><div class="breath" aria-hidden="true"><span class="b1"></span><span class="b2"></span><span class="b3"></span><div class="bspin">' + orbs + '</div><span class="bcore"><img src="../assets/icon-256.png" alt="" width="58" height="58"></span></div><h1>Finding your match</h1><p class="mstat" id="mstat" aria-live="polite">Reviewing what you shared</p><div class="mdots" aria-hidden="true"><i></i><i></i><i></i></div></div>';
  }
  function DateStrip(model) {                 // the next 14 days as soft pills, plus "More"
    let out = ""; const first = model.today;
    for (let n = 0; n < 14; n++) {
      const k = addDays(first, n), has = !!(model.byDate[k] && model.byDate[k].length), sel = model.selected === k, d = new Date(k + "T12:00:00Z");
      out += '<button type="button" class="day' + (has ? " has" : "") + (sel ? " sel" : "") + '" data-act="date" data-k="' + k + '"' + (has ? "" : " disabled") + ' aria-pressed="' + sel + '" aria-label="' + longDate(k) + (has ? "" : ", not available") + '"><small>' + d.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }) + "</small><b>" + d.getUTCDate() + "</b></button>";
    }
    return '<div class="strip" role="group" aria-label="Choose a day">' + out + '<button type="button" class="day more" data-act="moredates">' + icon("cal", 20) + "<small>More</small></button></div>";
  }
  function TimeChips(list, selectedISO) {
    if (!list.length) return '<p class="muted center">No times left on this day.</p>';
    return '<div class="slots" role="group" aria-label="Available times">' + list.map(s => { const iso = s.start.toISOString(), on = iso === selectedISO; return '<button type="button" class="slot' + (on ? " on" : "") + '" data-act="slot" data-iso="' + iso + '" aria-pressed="' + on + '">' + fmtTime(s.start) + "</button>"; }).join("") + "</div>";
  }

  function Calendar(model) {                 // monthly grid; model = { month, byDate, today, last, selected }
    const p = model.month.split("-").map(Number), lead = new Date(Date.UTC(p[0], p[1] - 1, 1)).getUTCDay(), days = new Date(Date.UTC(p[0], p[1], 0)).getUTCDate();
    let cells = ""; for (let i = 0; i < lead; i++) cells += "<span></span>";
    for (let d = 1; d <= days; d++) {
      const k = model.month + "-" + pad2(d), n = (model.byDate[k] || []).length, sel = model.selected === k;
      cells += '<button type="button" class="cd' + (n ? " has" : "") + (k === model.today ? " today" : "") + (sel ? " sel" : "") + '" data-act="date" data-k="' + k + '"' + (n ? "" : " disabled") + ' aria-pressed="' + sel + '" aria-label="' + longDate(k) + (n ? ", " + n + " times" : ", not available") + '">' + d + "</button>";
    }
    return '<div class="cal"><div class="cal-top"><button type="button" class="cn" data-act="month" data-d="-1" aria-label="Previous month"' + (model.month <= model.today.slice(0, 7) ? " disabled" : "") + ">" + icon("left", 18) + "</button><strong aria-live=\"polite\">" + monthName(model.month) + '</strong><button type="button" class="cn" data-act="month" data-d="1" aria-label="Next month"' + (model.month >= model.last.slice(0, 7) ? " disabled" : "") + ">" + icon("right", 18) + '</button></div><div class="cw"><span>Su</span><span>Mo</span><span>Tu</span><span>We</span><span>Th</span><span>Fr</span><span>Sa</span></div><div class="cg7">' + cells + "</div></div>";
  }

  /* ---------- phone helpers (country code selector, India by default) ---------- */
  function readPhone() {
    const c = countryOf(S.details.cc); let d = String(S.details.phone || "").replace(/\D/g, ""), ok;
    if (c.iso === "IN") { if (d.length === 11 && d[0] === "0") d = d.slice(1); ok = /^[6-9]\d{9}$/.test(d); }
    else { d = d.replace(/^0+/, ""); ok = d.length >= 6 && (c.dial.length + d.length) <= 15; }
    return { ok: ok, iso: c.iso, national: d, e164: "+" + c.dial + d, shown: "+" + c.dial + " " + d };
  }
  function countryByPrefix(digits) { for (let n = 4; n >= 1; n--) { const c = COUNTRIES.find(x => x.dial === digits.slice(0, n)); if (c) return { country: c, national: digits.slice(n) }; } return null; }

  /* ---------- pricing (the server repeats this sum, so the browser can never change the price) ---------- */
  function price() {
    const p = proOf(S.chosenId), subtotal = p ? p.fee : 0, d = S.coupon.applied ? Math.min(subtotal, Math.max(0, S.coupon.discount)) : 0;
    return { subtotal: subtotal, discount: d, total: subtotal - d };
  }
  async function applyCoupon(code) {
    const p = proOf(S.chosenId); code = String(code || "").trim().toUpperCase();
    if (!code) return { ok: false, msg: "Please enter a code." };
    try {
      if (API) {
        const j = await fetch(API, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify({ action: "checkCoupon", proId: p.id, coupon: code }) }).then(r => r.json());
        if (!j.ok) return { ok: false, msg: j.reason === "expired" ? "This code has expired." : "This code isn't valid." };
        return { ok: true, code: j.code || code, discount: j.discount };
      }
      const c = DEMO_COUPONS[code]; if (!c) return { ok: false, msg: "This code isn't valid. (Preview codes: WELCOME10, MENTRA100.)" };
      return { ok: true, code: code, discount: Math.min(p.fee, c.type === "percent" ? Math.round(p.fee * c.value / 100) : c.value) };
    } catch (e) { return { ok: false, msg: "We couldn't check the code right now. Please try again." }; }
  }


  /* ---------- 6. screens and flow ---------- */
  const ORDER = ["intro", "pro", "concerns", "who", "prefs", "when", "details", "matching", "results", "time", "pay", "done"];
  const ORDERD = ["pro", "time", "details", "pay", "done"];                 // a booking that starts from one psychologist
  const stepIdx = s => (S.direct ? ORDERD : ORDER).indexOf(s);
  const PREV = { concerns: "intro", who: "concerns", prefs: "who", when: "prefs", details: "when", results: "prefs", time: "results", pay: "time" };
  const PROGRESS = { concerns: 14, who: 30, prefs: 48, when: 66, details: 86 };
  const PROGRESS_D = { pro: 16, time: 42, details: 68, pay: 90 };
  const prevOf = s => S.direct ? ({ time: "pro", details: "time", pay: "details" })[s] : PREV[s];
  const app = $("#app"), barEl = $("#bar"), backBtn = $("#backbtn"), pbar = $("#pbar"), pfill = $("#pfill");
  let AP = { byDate: {}, month: "", today: "", last: "", slots: [] };

  function guard(step) {
    if (S.booking) return (step === "intro" && !S.direct) ? "intro" : "done";
    if (S.direct) {
      const okd = { time: S.chosenId && proOf(S.chosenId), details: S.slotISO, pay: S.slotISO && S.details.name, done: S.booking };
      if (ORDERD.indexOf(step) < 0 || step === "pro") return "pro";
      if (step in okd && !okd[step]) return step === "pay" ? (S.slotISO ? "details" : "time") : step === "details" ? "time" : "pro";
      return step;
    }
    if (step === "pro") return "intro";
    const base = S.concerns.length && S.who && S.start && S.details.name;
    const ok = { matching: base, results: base && S.matchIds.length, time: S.chosenId && proOf(S.chosenId), pay: S.chosenId && S.slotISO && S.details.name, done: S.booking };
    if (step in ok && !ok[step]) {
      if (step === "done") return "intro";
      if (step === "results" && base) return "matching";
      if (step === "time" || step === "pay") return S.matchIds.length ? "results" : "intro";
      return !S.concerns.length ? "concerns" : !S.who ? "who" : !S.start ? "when" : "details";
    }
    return step;
  }
  function go(step, opt) {
    opt = opt || {}; step = guard(step);
    const dir = stepIdx(step) >= stepIdx(S.step) ? 1 : -1;
    S.step = step; save();
    try { opt.replace ? history.replaceState({ step: step }, "", "#" + step) : history.pushState({ step: step }, "", "#" + step); } catch (e) {}
    render(dir);
  }
  window.addEventListener("popstate", () => {
    let st = (location.hash || "").slice(1); if ((S.direct ? ORDERD : ORDER).indexOf(st) < 0) st = S.direct ? "pro" : "intro"; if (st === "matching") st = "details";
    closeSheet();
    const g = guard(st), dir = stepIdx(g) >= stepIdx(S.step) ? 1 : -1; S.step = g; save(); render(dir);
    if (g !== st) { try { history.replaceState({ step: g }, "", "#" + g); } catch (e) {} }
  });
  function render(dir) {
    const v = SCREENS[S.step]; document.body.setAttribute("data-step", S.step);
    backBtn.hidden = ["intro", "done", "matching"].indexOf(S.step) > -1;
    const pr = (S.direct ? PROGRESS_D : PROGRESS)[S.step]; pbar.hidden = !pr; if (pr) pfill.style.width = pr + "%";
    app.className = "stage" + (reduceMotion() ? "" : dir > 0 ? " fwd" : " back");
    app.innerHTML = v.html();
    if (v.bind) v.bind();
    updateBar();
    window.scrollTo(0, 0);
    const h = $("h1", app); if (h) { h.setAttribute("tabindex", "-1"); h.focus({ preventScroll: true }); }
  }
  function updateBar() { const v = SCREENS[S.step], cfg = v.bar ? v.bar() : null; barEl.hidden = !cfg; barEl.innerHTML = ActionBar(cfg); document.body.classList.toggle("has-bar", !!cfg); }

  /* ---------- booking that starts from one psychologist (from the website's Book buttons) ---------- */
  function startDirect(id) {
    const p = proOf(id); if (!p) return false;
    const keep = S.details; S = fresh(); S.details = keep; S.direct = true; S.chosenId = id; S.profileId = id; S.step = "pro"; save(); return true;
  }
  function whoStrip(p) { return '<div class="who-strip"><img src="' + esc(p.photo) + '" alt="" width="48" height="48"><div><b>' + esc(p.name) + "</b><span>" + esc(p.title) + " · " + money(p.fee) + " · " + p.mins + " min · online</span></div></div>"; }
  function ProDetails(p) {
    return '<article class="ph-card"><div class="ph-top">' + (p.reg ? '<span class="ph-lic">' + icon("check", 14) + "Licensed</span>" : "") + '</div><div class="ph-body"><img class="ph-av" src="' + esc(p.photo) + '" alt="" width="112" height="112"><h2>' + esc(p.name) + '</h2><p class="ph-t">' + esc(p.title) + "</p>" + (p.qual ? '<p class="ph-qual">' + esc(p.qual) + "</p>" : "") +
      (p.about ? '<p class="ph-about">' + esc(p.about) + "</p>" : "") + '<div class="tags">' + p.focus.map(f => "<span>" + esc(f) + "</span>").join("") + "</div>" +
      '<dl class="ph-dl"><div><dt>' + icon("globe", 18) + "Languages</dt><dd>" + esc(p.langs.join(", ")) + "</dd></div><div><dt>" + icon("brief", 18) + "Experience</dt><dd>" + esc(p.exp) + "</dd></div><div><dt>" + icon("video", 18) + "Session</dt><dd>" + p.mins + " minutes, online</dd></div>" +
      '</dl><div class="ph-fee"><span>Session fee</span><b>' + money(p.fee) + "</b></div></div></article>";
  }
  const heading = (h, p) => "<h1>" + h + "</h1>" + (p ? '<p class="lead">' + p + "</p>" : "");

  const SCREENS = {
    pro: {
      html: () => { const p = proOf(S.chosenId); return heading("Book your session", "Here are your booking details.") + ProDetails(p) + '<p class="ph-next" id="ph-next">' + icon("cal", 18) + "<span>Checking the next available time…</span></p>" +
        '<h2 class="sub">How booking works</h2><ol class="how3"><li><b>1</b><span>Choose a time that suits you</span></li><li><b>2</b><span>Add your details</span></li><li><b>3</b><span>Pay securely and get your confirmation</span></li></ol>'; },
      bind: async () => {
        const p = proOf(S.chosenId); let msg;
        try { const sl = await slotsFor(p), f = sl[0]; msg = f ? icon("cal", 18) + "<span>Next available: <b>" + esc(dayWord(f.start) + " · " + fmtTime(f.start)) + "</b> <small>(" + esc(tzLabel()) + ")</small></span>" : icon("cal", 18) + "<span>No openings in the next few weeks. Please contact us and we will help.</span>"; }
        catch (e) { msg = icon("cal", 18) + "<span>You will see the available times on the next step.</span>"; }
        const el = $("#ph-next"); if (el) el.innerHTML = msg;
      },
      bar: () => ({ next: { label: "Choose a time" } })
    },
    intro: {
      html: () => '<section class="intro"><div class="art" aria-hidden="true"><span class="a1"></span><span class="a2"></span><span class="a3"></span><img src="../assets/icon-256.png" alt="" width="88" height="88"></div>' +
        "<h1>Find a psychologist who feels right for you.</h1><p class=\"lead\">A few gentle questions. Then a match, made for you.</p>" +
        '<ul class="reas"><li>' + icon("spark", 18) + "Personal</li><li>" + icon("lock", 18) + "Private</li><li>" + icon("video", 18) + "Online</li></ul>" +
        '<button type="button" class="btn primary big" data-act="start">Find My Psychologist</button><p class="muted">About 2 minutes</p></section>'
    },
    concerns: {
      html: () => heading("What's on your mind?", "Choose any that fit.") + Bubbles({ name: "concerns", label: "What's on your mind", items: CONCERNS, selected: S.concerns }),
      bar: () => ({ next: { label: "Continue", off: !S.concerns.length } })
    },
    who: {
      html: () => heading("Who is it for?") + Tiles({ name: "who", label: "Who is it for", items: WHO, selected: S.who }),
      bar: () => ({ next: { label: "Continue", off: !S.who } })
    },
    prefs: {
      html: () => heading("Any preferences?", "Totally optional.") +
        ChipGroup({ legend: "Language", name: "languages", multi: true, selected: S.languages, items: ["Malayalam", "English", "Hindi", "Other"] }) +
        ChipGroup({ legend: "Psychologist", name: "gender", selected: S.gender, items: [{ id: "any", t: "No preference" }, { id: "female", t: "Female" }, { id: "male", t: "Male" }] }) +
        '<button type="button" class="link" data-act="skipprefs">Skip</button>',
      bar: () => ({ next: { label: "Continue" } })
    },
    when: {
      html: () => heading("When would you like to start?") + Tiles({ name: "start", label: "When to start", items: START, selected: S.start }) +
        ChipGroup({ legend: "Best time of day", name: "times", multi: true, selected: S.times, items: TIMES }),
      bar: () => ({ next: { label: "Continue", off: !S.start } })
    },
    details: {
      html: () => {
        const d = S.details;
        return (S.direct ? heading("Your details.", "So we can confirm your session.") : heading("Last step.", "So we can reach you.")) +
          '<form class="form" id="dform" novalidate autocomplete="on"><div class="fld"><label for="f-name">Name</label><input id="f-name" name="name" type="text" autocomplete="name" value="' + esc(d.name) + '"><p class="err" id="e-name" hidden>Please enter your name.</p></div>' +
          '<div class="fld"><label for="f-phone">Phone</label><div class="phone"><label class="cc"><span id="cc-show">+' + countryOf(d.cc).dial + "</span>" + icon("right", 12) + '<select id="f-cc" aria-label="Country code" autocomplete="tel-country-code">' +
          '<optgroup label="Popular">' + COUNTRIES.slice(0, POPULAR).map(c => '<option value="' + c.iso + '"' + (c.iso === d.cc ? " selected" : "") + ">" + esc(c.name) + " (+" + c.dial + ")</option>").join("") + '</optgroup><optgroup label="All countries">' +
          COUNTRIES.slice(POPULAR).slice().sort((a, b) => a.name.localeCompare(b.name)).map(c => '<option value="' + c.iso + '"' + (c.iso === d.cc ? " selected" : "") + ">" + esc(c.name) + " (+" + c.dial + ")</option>").join("") + '</optgroup></select></label><input id="f-phone" name="phone" type="tel" inputmode="tel" autocomplete="tel-national" maxlength="18" placeholder="' + (d.cc === "IN" ? "99xxxxxxxx" : "Phone number") + '" value="' + esc(d.phone) + '"></div><p class="err" id="e-phone" hidden>Please enter a valid phone number.</p></div>' +
          '<div class="fld"><label for="f-email">Email <span class="opt">optional</span></label><input id="f-email" name="email" type="email" autocomplete="email" inputmode="email" value="' + esc(d.email) + '"><p class="err" id="e-email" hidden>Please check your email address.</p></div>' +
          ChipGroup({ legend: S.who === "child" ? "Child's age" : "Age", name: "age", selected: d.age, items: AGES }) + '<p class="err" id="e-age" hidden>Please choose an age range.</p></form>';
      },
      bind: () => {
        const sel = $("#f-cc"), ph = $("#f-phone");
        sel.addEventListener("change", () => { S.details.cc = sel.value; $("#cc-show").textContent = "+" + countryOf(sel.value).dial; ph.placeholder = sel.value === "IN" ? "99xxxxxxxx" : "Phone number"; save(); });
        const fromPlus = () => { const v = ph.value.trim(); if (v[0] !== "+") return; const hit = countryByPrefix(v.replace(/\D/g, "")); if (hit) { S.details.cc = hit.country.iso; sel.value = hit.country.iso; ph.value = hit.national; S.details.phone = hit.national; $("#cc-show").textContent = "+" + hit.country.dial; save(); } };
        ph.addEventListener("input", fromPlus); ph.addEventListener("paste", () => setTimeout(fromPlus, 0));
        ["name", "phone", "email"].forEach(k => { const el = $("#f-" + k); el.addEventListener("input", () => { S.details[k] = el.value; $("#e-" + k).hidden = true; save(); }); });
      },
      bar: () => ({ next: { label: S.direct ? "Continue to payment" : "Find My Match" } })
    },
    matching: {
      html: () => BreathingMatch(),
      bind: async () => {
        const msgs = ["Reviewing what you shared", "Looking for the right fit", "Checking times that suit you"];
        const stat = $("#mstat"), t0 = Date.now(), MIN = reduceMotion() ? 800 : 3600; let i = 0;
        const tick = setInterval(() => { const k = Math.min(msgs.length - 1, Math.floor((Date.now() - t0) / (MIN / msgs.length))); if (stat && k !== i) { i = k; stat.textContent = msgs[k]; } }, 150);
        try { await computeMatches(); } catch (e) { S.matchIds = PROS.map(p => p.id).slice(0, 4); S.matchMeta = {}; S.matchNote = ""; save(); }
        const wait = MIN - (Date.now() - t0); if (wait > 0) await sleep(wait);
        clearInterval(tick); await sleep(150);
        if (S.step === "matching") go("results", { replace: true });
      }
    },
    results: {
      html: () => {
        const list = S.matchIds.map(id => proOf(id)).filter(Boolean);
        return heading("Meet your matches.", S.matchNote ? esc(S.matchNote) : "Chosen for what you shared.") +
          '<div class="xlist">' + list.map((p, i) => ExpertCard(p, S.matchMeta[p.id], i, list.length)).join("") + "</div>" +
          '<button type="button" class="link" data-act="adjust">Change my answers</button>';
      }
    },
    time: {
      html: () => heading("Pick a time.") + whoStrip(proOf(S.chosenId)) + '<div id="appt" aria-live="polite"><div class="skel"></div><div class="skel s2"></div></div>',
      bind: () => loadTime(),
      bar: () => ({ next: { label: "Continue", off: !S.slotISO }, note: "Times shown in your timezone (" + esc(tzLabel()) + ")." })
    },
    pay: {
      html: () => {
        const p = proOf(S.chosenId), d = new Date(S.slotISO), pr = price();
        const coupon = S.coupon.applied
          ? '<div class="cpl"><span>Coupon <b>' + esc(S.coupon.code) + '</b> · − ' + money(pr.discount) + '</span><button type="button" class="link inl" data-act="coupon-remove">Remove</button></div>'
          : S.couponOpen ? '<div class="cprow"><input id="cp" type="text" autocomplete="off" autocapitalize="characters" aria-label="Coupon code" placeholder="Coupon code"><button type="button" class="btn ghost" data-act="coupon-apply">Apply</button></div><p class="cpmsg" id="cpmsg" aria-live="polite">' + esc(S.coupon.msg || "") + "</p>"
          : '<button type="button" class="link" data-act="couponopen">Have a coupon?</button>';
        return heading("Confirm your session") + '<div class="sumcard"><img class="xp sm" src="' + esc(p.photo) + '" alt="" width="64" height="64"><div><strong>' + esc(p.name) + '</strong><span class="muted">' + esc(p.title) + "</span></div></div>" +
          '<div class="when"><b>' + longDate(localKey(d)) + "</b><span>" + fmtTime(d) + " " + esc(tzLabel()) + "</span><em>Online · " + p.mins + " minutes</em></div>" + coupon +
          '<div class="total"><span>Total</span><b>' + money(pr.total) + "</b></div>" + (pr.total > 0 ? '<p class="secure">' + icon("lock", 14) + "Secure payment. UPI, cards, net banking.</p>" : '<p class="secure">' + icon("check", 14) + "Nothing to pay.</p>") +
          '<p class="terms">By continuing you agree to our <a href="../terms.html" target="_blank" rel="noopener">Terms</a> and <a href="../refund-policy.html" target="_blank" rel="noopener">Refund policy</a>.</p><div id="payerr" class="payerr" role="alert" hidden></div>';
      },
      bar: () => ({ next: { label: price().total > 0 ? "Pay " + money(price().total) : "Confirm" } })
    },
    done: {
      html: () => {
        const b = S.booking, p = proOf(b.proId);
        return '<section class="done"><div class="okmark" aria-hidden="true"><svg viewBox="0 0 80 80" width="96" height="96"><circle cx="40" cy="40" r="36" class="oc1"/><path d="M26 41l10 10 19-21" class="oc2"/></svg></div><h1>You\'re booked.</h1>' +
          '<p class="lead">' + esc(p ? p.name : "") + "<br>" + esc(b.dateLabel) + " · " + esc(b.timeLabel) + '</p><div class="dact"><button type="button" class="btn primary" data-act="addcal">Add to calendar</button><button type="button" class="btn ghost" data-act="viewappt">Details</button></div>' +
          '<a class="link" href="../">Back to Mentra</a><p class="muted small">Booking ID ' + esc(b.ref) + '</p><p class="help">Need help? <a href="' + helpHref() + '">Contact us</a></p></section>';
      }
    }
  };
  const helpHref = () => WA ? "https://wa.me/" + WA + "?text=" + encodeURIComponent("Hello Mentra, I need help with my booking" + (S.booking ? " " + S.booking.ref : "") + ".") : "../contact.html";

  /* time: a strip of days, then the times; "More" opens the full calendar */
  async function loadTime() {
    const p = proOf(S.chosenId), box = $("#appt"); let slots;
    try { slots = await slotsFor(p, true); } catch (e) { box.innerHTML = '<p>We couldn\'t load times right now.</p><button type="button" class="btn ghost" data-act="retry">Try again</button>'; return; }
    AP.slots = slots; AP.byDate = {};
    slots.forEach(s => { const k = localKey(s.start); (AP.byDate[k] = AP.byDate[k] || []).push(s); });
    AP.today = localKey(new Date()); AP.last = localKey(new Date(Date.now() + scheduleOf(p).advanceDays * 86400000));
    if (S.slotISO && !slots.some(s => s.start.toISOString() === S.slotISO)) S.slotISO = null;
    if (S.dateKey && !AP.byDate[S.dateKey]) S.dateKey = null;
    if (S.slotISO && !S.dateKey) S.dateKey = localKey(new Date(S.slotISO));
    if (!S.dateKey && slots[0]) S.dateKey = localKey(slots[0].start);
    AP.month = (S.dateKey || AP.today).slice(0, 7);
    drawTime(); updateBar();
  }
  function drawTime() {
    const box = $("#appt"); if (!box) return;
    const first = AP.slots[0];
    if (!first) { box.innerHTML = '<p><strong>No openings in the next few weeks.</strong></p><p class="muted">Please choose someone else, or contact us.</p><button type="button" class="btn ghost" data-act="back">Back</button>'; return; }
    const soon = '<div class="soon"><span>Soonest: <b>' + dayWord(first.start) + ", " + fmtTime(first.start) + '</b></span><button type="button" class="btn ghost sm" data-act="booknext">Book it</button></div>';
    box.innerHTML = soon + DateStrip({ today: AP.today, byDate: AP.byDate, selected: S.dateKey }) + '<div class="timesbox">' + TimeChips(AP.byDate[S.dateKey] || [], S.slotISO) + "</div>";
  }
  const moreHTML = () => '<h2 id="sh-t">Choose a date</h2>' + Calendar({ month: AP.month, byDate: AP.byDate, today: AP.today, last: AP.last, selected: S.dateKey });
  function refreshMore() { const b = $("#sheet .sh-box"); if (b) { b.innerHTML = '<button type="button" class="sh-x" data-sh-close aria-label="Close">' + icon("x", 20) + "</button>" + moreHTML(); } }

  /* events: one delegated listener for clicks, one for inputs */
  function toggleOn(name) { $$('input[name="' + name + '"]', app).forEach(i => i.closest("label").classList.toggle("on", i.checked)); }
  document.addEventListener("change", e => {
    const el = e.target; if (!el.name || !app.contains(el)) return;
    const v = el.value, on = el.checked;
    if (el.name === "concerns") S.concerns = on ? S.concerns.concat(v) : S.concerns.filter(x => x !== v);
    else if (el.name === "who") S.who = v;
    else if (el.name === "gender") S.gender = v;
    else if (el.name === "languages") S.languages = on ? S.languages.concat(v) : S.languages.filter(x => x !== v);
    else if (el.name === "start") S.start = v;
    else if (el.name === "times") { if (v === "any" && on) S.times = ["any"]; else { S.times = (on ? S.times.concat(v) : S.times.filter(x => x !== v)).filter(x => x !== "any"); } $$('input[name="times"]', app).forEach(i => { i.checked = S.times.indexOf(i.value) > -1; }); }
    else if (el.name === "age") { S.details.age = v; const er = $("#e-age"); if (er) er.hidden = true; }
    else return;
    toggleOn(el.name); save(); updateBar();
  });
  document.addEventListener("click", async e => {
    const t = e.target.closest("[data-act]"); if (!t) return;
    const a = t.dataset.act, id = t.dataset.id;
    if (a === "start") { if (S.booking) { const keep = S.details; S = fresh(); S.details = keep; } track("FlowStarted"); go("concerns"); }
    else if (a === "back") { closeSheet(); if (S.direct && S.step === "pro") { let same = false; try { same = document.referrer && new URL(document.referrer).origin === location.origin; } catch (e) {} if (same && history.length > 1) history.back(); else location.href = "../psychologists/"; } else go(prevOf(S.step) || "intro"); }
    else if (a === "next") nextOf();
    else if (a === "skipprefs") { S.gender = "any"; S.languages = []; S.prefsSkipped = true; save(); go("when"); }
    else if (a === "adjust") go("prefs");
    else if (a === "profile") { S.profileId = id; save(); openSheet(ProfileSheet(proOf(id))); }
    else if (a === "choose") { closeSheet(); chooseExpert(id); }
    else if (a === "date") { S.dateKey = t.dataset.k; if (S.slotISO && localKey(new Date(S.slotISO)) !== S.dateKey) S.slotISO = null; save(); closeSheet(); drawTime(); updateBar(); }
    else if (a === "slot") { S.slotISO = t.dataset.iso; S.dateKey = localKey(new Date(S.slotISO)); save(); drawTime(); updateBar(); }
    else if (a === "moredates") { AP.month = (S.dateKey || AP.today).slice(0, 7); openSheet(moreHTML()); }
    else if (a === "month") { const p = AP.month.split("-").map(Number), d = new Date(Date.UTC(p[0], p[1] - 1 + Number(t.dataset.d), 1)); AP.month = d.getUTCFullYear() + "-" + pad2(d.getUTCMonth() + 1); refreshMore(); }
    else if (a === "booknext") { const f = AP.slots[0]; S.slotISO = f.start.toISOString(); S.dateKey = localKey(f.start); save(); go("pay"); }
    else if (a === "retry") loadTime();
    else if (a === "couponopen") { S.couponOpen = true; save(); render(1); const c = $("#cp"); if (c) c.focus(); }
    else if (a === "coupon-apply") { const r = await applyCoupon($("#cp").value); if (r.ok) S.coupon = { code: r.code, applied: true, discount: r.discount, msg: "" }; else S.coupon = { code: "", applied: false, discount: 0, msg: r.msg }; save(); render(1); const m = $("#cpmsg"); if (m) m.textContent = S.coupon.msg; }
    else if (a === "coupon-remove") { S.coupon = { code: "", applied: false, discount: 0, msg: "" }; save(); render(1); }
    else if (a === "viewappt") openSheet(apptSheet());
    else if (a === "addcal") openSheet(calSheet());
    else if (a === "ics") downloadIcs();
  });
  function chooseExpert(id) {
    S.chosenId = id; S.profileId = id; S.dateKey = null; S.slotISO = null; S.couponOpen = false;
    S.coupon = { code: "", applied: false, discount: 0, msg: "" }; save(); go("time");
  }
  function nextOf() {
    const s = S.step;
    if (s === "concerns") go("who"); else if (s === "who") go("prefs"); else if (s === "prefs") go("when"); else if (s === "when") go("details");
    else if (s === "details") submitDetails(); else if (s === "pro") go("time"); else if (s === "time") go(S.direct ? "details" : "pay"); else if (s === "pay") pay();
  }
  async function submitDetails() {
    const d = S.details; let ok = true; const show = (id, bad) => { const el = $("#" + id); if (el) el.hidden = !bad; if (bad) ok = false; };
    show("e-name", String(d.name).trim().length < 2); show("e-phone", !readPhone().ok); show("e-email", !!d.email.trim() && !/^\S+@\S+\.\S+$/.test(d.email.trim())); show("e-age", !d.age);
    if (!ok) { const first = $(".err:not([hidden])", app); if (first) first.scrollIntoView({ block: "center", behavior: "smooth" }); return; }
    track("DetailsSubmitted");
    if (FORMSPREE && FORMSPREE.indexOf("YOUR_FORMSPREE") < 0) { try { fetch(FORMSPREE, { method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" }, body: JSON.stringify(Object.assign({ stage: "details_submitted", funnel_variant: VARIANT, name: d.name.trim(), phone: readPhone().e164, email: d.email.trim(), age_range: d.age, timestamp: new Date().toISOString() }, ATTR)) }); } catch (e) {} }
    go(S.direct ? "pay" : "matching");
  }


  function BookingSummary(rows) { return '<dl class="sum">' + rows.map(r => '<div class="sr' + (r.cls ? " " + r.cls : "") + '"><dt>' + esc(r.l) + "</dt><dd>" + esc(r.v) + "</dd></div>").join("") + "</dl>"; }
  /* sheets (bottom sheet on phones, centred on computers): profile, more dates, session details, add to calendar */
  let sheetOpener = null;
  function openSheet(html) {
    let m = $("#sheet"); if (!m) { m = document.createElement("div"); m.id = "sheet"; m.className = "sheet"; m.hidden = true; document.body.appendChild(m); m.addEventListener("click", ev => { if (ev.target.closest("[data-sh-close]")) closeSheet(); }); m.addEventListener("keydown", ev => { if (ev.key === "Escape") closeSheet(); }); }
    m.innerHTML = '<div class="sh-back" data-sh-close></div><div class="sh-box" role="dialog" aria-modal="true" aria-labelledby="sh-t" tabindex="-1"><button type="button" class="sh-x" data-sh-close aria-label="Close">' + icon("x", 20) + '</button>' + html + "</div>";
    sheetOpener = document.activeElement; m.hidden = false; void m.offsetWidth; m.classList.add("show"); document.documentElement.classList.add("lock"); $(".sh-box", m).focus({ preventScroll: true });
  }
  function closeSheet() { const m = $("#sheet"); if (!m || m.hidden) return; m.classList.remove("show"); m.hidden = true; document.documentElement.classList.remove("lock"); if (sheetOpener && sheetOpener.focus) sheetOpener.focus({ preventScroll: true }); }

  function apptSheet() {
    const b = S.booking, p = proOf(b.proId);
    return '<h2 id="sh-t">Your session</h2><div class="card flat">' + BookingSummary([{ l: "With", v: p ? p.name : "" }, { l: "Date", v: b.dateLabel }, { l: "Time", v: b.timeLabel }, { l: "Where", v: "Online (video or voice)" }, { l: "Length", v: (p ? p.mins : "") + " minutes" }, { l: "Booking ID", v: b.ref, cls: "mono" }].concat(b.paymentId && b.paymentId !== "FREE-COUPON" ? [{ l: "Payment ID", v: b.paymentId, cls: "mono" }] : [])) +
      '</div><ul class="steps"><li>We will message you on WhatsApp with your private link.</li><li>Need to change the time? Reply to our message.</li></ul><a class="btn ghost block" href="' + helpHref() + '">Contact us</a>';
  }
  function calEvent() {
    const b = S.booking, p = proOf(b.proId), s = new Date(b.startISO), e = new Date(s.getTime() + (p ? p.mins : 45) * 60000), z = d => d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
    return { title: "Mentra session with " + (p ? p.name : "your psychologist"), start: z(s), end: z(e), loc: "Online (link sent on WhatsApp)", desc: "Booking ID " + b.ref + ". We will message you on WhatsApp with details." };
  }
  function calSheet() {
    const c = calEvent(), g = "https://calendar.google.com/calendar/render?action=TEMPLATE&text=" + encodeURIComponent(c.title) + "&dates=" + c.start + "/" + c.end + "&details=" + encodeURIComponent(c.desc) + "&location=" + encodeURIComponent(c.loc);
    return '<h2 id="sh-t">Add to calendar</h2><div class="calopts"><a class="btn primary block" href="' + g + '" target="_blank" rel="noopener">Google Calendar</a><button type="button" class="btn ghost block" data-act="ics">Apple, Outlook and others (.ics)</button></div>';
  }
  function downloadIcs() {
    const c = calEvent(), x = t => String(t).replace(/([,;])/g, "\\$1").replace(/\n/g, "\\n");
    const txt = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//Mentra//Find a psychologist//EN", "BEGIN:VEVENT", "UID:" + S.booking.ref + "@mentra", "DTSTAMP:" + c.start, "DTSTART:" + c.start, "DTEND:" + c.end, "SUMMARY:" + x(c.title), "DESCRIPTION:" + x(c.desc), "LOCATION:" + x(c.loc), "END:VEVENT", "END:VCALENDAR"].join("\r\n");
    const a = document.createElement("a"); a.href = URL.createObjectURL(new Blob([txt], { type: "text/calendar" })); a.download = "mentra-session-" + S.booking.ref + ".ics"; document.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500);
  }

  /* ---------- 7. payment (Razorpay through the same Google backend as the main site) ---------- */
  const PAY = { pending: null, loading: null };
  let paying = false;
  const apiPost = body => fetch(API, { method: "POST", headers: { "Content-Type": "text/plain;charset=utf-8" }, body: JSON.stringify(body) }).then(r => r.json());
  function loadRazorpay() {
    if (window.Razorpay) return Promise.resolve();
    if (PAY.loading) return PAY.loading;
    PAY.loading = new Promise((res, rej) => { const sc = document.createElement("script"); sc.src = "https://checkout.razorpay.com/v1/checkout.js"; sc.onload = res; sc.onerror = () => { PAY.loading = null; rej(new Error("load")); }; document.head.appendChild(sc); });
    return PAY.loading;
  }
  function openCheckout(order, info) {
    return new Promise((resolve, reject) => {
      loadRazorpay().then(() => {
        const rz = new window.Razorpay({ key: order.keyId, amount: order.amount, currency: order.currency || "INR", order_id: order.orderId, name: "Mentra", description: info.description,
          prefill: { name: info.name, email: info.email || undefined, contact: info.phone }, notes: { ref: order.ref }, theme: { color: "#5749E2" },
          modal: { confirm_close: true, ondismiss: () => reject({ dismissed: true }) }, handler: r => resolve(r) });
        rz.on("payment.failed", () => {}); rz.open();
      }).catch(() => reject({ load: true }));
    });
  }
  function demoCheckout(info) {          // preview only: stands in for Razorpay. Nothing is charged or saved.
    return new Promise((resolve, reject) => {
      let m = $("#dpay"); if (!m) { m = document.createElement("div"); m.id = "dpay"; m.className = "sheet"; m.hidden = true; document.body.appendChild(m); }
      m.innerHTML = '<div class="sh-back"></div><div class="sh-box" role="dialog" aria-modal="true" aria-labelledby="dp-t" tabindex="-1"><button type="button" class="sh-x" data-dp="x" aria-label="Close payment window">' + icon("x", 20) + '</button><p class="tag">Demo payment</p><h2 id="dp-t">Pay ' + esc(info.amountText) + '</h2><p class="muted">' + esc(info.description) + '</p><p class="dp-note">This preview does not charge anything. On your live site Razorpay opens here with UPI, cards and net banking.</p><p class="payerr" id="dp-fail" hidden>Payment failed (demo). You can try again.</p><button type="button" class="btn primary block" data-dp="ok">Simulate successful payment</button><button type="button" class="btn ghost block" data-dp="fail">Simulate failed payment</button></div>';
      const close = () => { m.classList.remove("show"); m.hidden = true; document.documentElement.classList.remove("lock"); m.onclick = null; };
      m.onclick = ev => { const b = ev.target.closest("[data-dp]"); if (!b) return; if (b.dataset.dp === "ok") { close(); resolve({ razorpay_payment_id: "pay_DEMO" + Math.random().toString(36).slice(2, 10).toUpperCase(), razorpay_order_id: "order_DEMO", razorpay_signature: "demo" }); } else if (b.dataset.dp === "fail") $("#dp-fail").hidden = false; else { close(); reject({ dismissed: true }); } };
      m.hidden = false; void m.offsetWidth; m.classList.add("show"); document.documentElement.classList.add("lock"); $(".sh-box", m).focus({ preventScroll: true });
    });
  }
  function bookingPayload() {
    const p = proOf(S.chosenId), start = new Date(S.slotISO), ist = istParts(start), ph = readPhone();
    return Object.assign({ proId: p.id, proName: p.name, date: ist.date, time: ist.time, startISO: start.toISOString(), durationMin: p.mins, mode: "Online",
      name: S.details.name.trim(), phone: ph.e164, country: ph.iso, email: S.details.email.trim(), ageRange: S.details.age, lang: "en", page: location.href, source: SOURCE, coupon: S.coupon.applied ? S.coupon.code : "" }, ATTR);
  }
  const setPayErr = html => { const el = $("#payerr"); if (!el) return; el.hidden = !html; el.innerHTML = html || ""; };
  async function pay() {
    if (paying) return; paying = true;
    const btn = $('[data-act="next"]', barEl), old = btn ? btn.textContent : "";
    const done = msg => { paying = false; if (btn) { btn.disabled = false; btn.textContent = old; } if (msg !== undefined) setPayErr(msg); };
    const label = t => { if (btn) { btn.disabled = true; btn.textContent = t; } };
    setPayErr("");
    const p = proOf(S.chosenId), pr = price(), pl = bookingPayload(), start = new Date(S.slotISO), key = p.id + "|" + S.slotISO + "|" + pl.coupon;
    const info = { description: p.name + " · " + longDate(localKey(start)) + ", " + fmtTime(start), name: pl.name, email: pl.email, phone: pl.phone, amountText: money(pr.total) };
    const retime = '<button type="button" class="link" data-act="retime">Choose another time</button>';
    let ref = null, paymentId = "";
    track("PaymentStarted");
    try {
      if (REQUIRE_PAYMENT && API) {
        let order = PAY.pending && PAY.pending.key === key ? PAY.pending.order : null;
        if (!order) {
          label("Checking your time…");
          if (PAY.pending) { try { apiPost({ action: "releaseHold", ref: PAY.pending.order.ref, token: PAY.pending.order.token }); } catch (e) {} PAY.pending = null; }
          const j = await apiPost(Object.assign({ action: "createOrder" }, pl));
          if (!j.ok) {
            delete slotCache[p.id];
            if (j.reason === "taken") return done("That time was just booked by someone else. " + retime);
            if (j.reason === "coupon_invalid" || j.reason === "coupon_expired") { S.coupon = { code: "", applied: false, discount: 0, msg: "" }; save(); return done("That coupon can't be used. Please go back and review your total.");  }
            if (j.reason === "payment_unavailable") return done("Online payment is not available right now. Please try again in a few minutes, or contact support.");
            return done("We couldn't start your booking. Please check your details and try again.");
          }
          if (j.free) { ref = j.ref; paymentId = "FREE-COUPON"; } else { order = j; PAY.pending = { key: key, order: order }; }
        }
        if (!ref) {
          label("Opening secure payment…");
          let pr2; try { pr2 = await openCheckout(order, info); } catch (err) { return done(err && err.load ? "We couldn't open the payment window. Please check your connection and try again." : "Payment was not completed. We're holding your time for a few minutes. Tap the button to try again when you're ready."); }
          label("Confirming your booking…");
          let jc = null;
          for (let n = 0; n < 3 && !(jc && jc.ok); n++) {
            try { jc = await apiPost({ action: "confirmPayment", ref: order.ref, razorpay_order_id: pr2.razorpay_order_id, razorpay_payment_id: pr2.razorpay_payment_id, razorpay_signature: pr2.razorpay_signature }); } catch (err) { jc = null; }
            if (jc && (jc.ok || jc.reason === "conflict" || jc.reason === "bad_signature")) break;
            await sleep(1200);
          }
          if (!jc || !jc.ok) { PAY.pending = null; return done(jc && jc.reason === "conflict" ? "Your payment went through (ID " + esc(pr2.razorpay_payment_id) + ") but this time was taken just before. Please contact support with this ID and we'll rebook you or refund you." : "Your payment went through (ID " + esc(pr2.razorpay_payment_id) + ") but we couldn't finish your booking on this screen. Please don't pay again. We'll confirm on WhatsApp shortly."); }
          ref = jc.ref || order.ref; paymentId = jc.paymentId || pr2.razorpay_payment_id; PAY.pending = null;
        }
      } else if (REQUIRE_PAYMENT) {                // preview without a backend
        if (pr.total > 0) { label("Opening demo payment…"); let r2; try { r2 = await demoCheckout(info); } catch (err) { return done("Payment was not completed. You can try again when you're ready."); } paymentId = r2.razorpay_payment_id; } else paymentId = "FREE-COUPON";
        ref = "MNT-" + Math.floor(10000 + Math.random() * 90000);
        try { const arr = JSON.parse(localStorage.getItem("mentra_demo_booked") || "[]"); arr.push({ id: p.id, s: start.getTime(), e: start.getTime() + p.mins * 60000 }); localStorage.setItem("mentra_demo_booked", JSON.stringify(arr)); } catch (e) {}
      } else {                                      // payment switched off in config.js
        ref = "MNT-" + Math.floor(10000 + Math.random() * 90000);
        if (API) { const j = await apiPost(Object.assign({ action: "book" }, pl)); if (!j.ok) { delete slotCache[p.id]; return done(j.reason === "taken" ? "That time was just booked by someone else. " + retime : "We couldn't confirm your booking. Please try again."); } ref = j.ref || ref; }
      }
    } catch (err) { return done("We couldn't complete this step. Please check your connection and try again."); }
    S.booking = { ref: ref, paymentId: paymentId, proId: p.id, startISO: S.slotISO, format: "online", total: pr.total, dateLabel: longDate(localKey(start)), timeLabel: fmtTime(start) + " " + tzLabel(), name: pl.name };
    S.matchIds = S.matchIds; save(); delete busyCache[p.id]; delete slotCache[p.id]; paying = false;
    track("BookingConfirmed", { value: pr.total });
    go("done", { replace: true });
  }
  document.addEventListener("click", e => { if (e.target.closest('[data-act="retime"]')) go("time"); });
  

  /* ---------- 8. start ---------- */
  function init() {
    track("PageView");
    const site = $("#site"), onScroll = () => site.classList.toggle("scrolled", window.scrollY > 4);
    window.addEventListener("scroll", onScroll, { passive: true }); onScroll();
    const hl = $("#helplink"); if (hl) hl.href = helpHref();
    const qp = new URLSearchParams(location.search).get("pro"), forced = window.__FORCE_PRO__ || null, want = qp || forced;
    let st = (location.hash || "").slice(1), startedNow = false;
    if (want && proOf(want)) { if (!(S.direct && S.chosenId === want && !S.booking)) { startDirect(want); startedNow = true; } }
    else if (S.direct) { const keep = S.details; S = fresh(); S.details = keep; save(); }     // no psychologist in the address: a normal visit
    if (S.direct) { if (startedNow || ORDERD.indexOf(st) < 0) st = "pro"; }
    else { if (ORDER.indexOf(st) < 0 || st === "pro") st = "intro"; if (st === "matching" && S.matchIds.length) st = "results"; }   // a fresh visit from an ad always opens at the beginning
    S.step = guard(st); save();
    try { history.replaceState({ step: S.step }, "", "#" + S.step); } catch (e) {}
    render(1);
  }
  window.__mentraStartDirect = id => { if (startDirect(id)) { try { history.replaceState({ step: "pro" }, "", "#pro"); } catch (e) {} render(1); return true; } return false; };
  if (/[?&]test=1/.test(location.search)) window.__find = { state: () => S, computeMatches: computeMatches, set: o => { Object.assign(S, o); save(); }, PROS: PROS, go: go, years: years, startDirect: startDirect };
  init();
})();
