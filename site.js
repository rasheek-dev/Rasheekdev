/* MENTRA public website: menu, team from psychologists.js, profile sheet, contact form, contact details, analytics.
   Settings come from config.js. Nothing here sends health information anywhere. */
(function () {
  'use strict';
  const CFG = window.MENTRA_CONFIG || {};
  const BASE = document.documentElement.getAttribute('data-base') || '';
  const $ = (s, r) => (r || document).querySelector(s), $$ = (s, r) => [].slice.call((r || document).querySelectorAll(s));
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const money = n => '₹' + Number(n || 0).toLocaleString('en-IN');
  const SHOW_TEAM = CFG.SHOW_TEAM === true;
  const ICON = { cal: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M8 3v4M16 3v4M3 10h18"/>', badge: '<circle cx="12" cy="9" r="5.5"/><path d="M8.5 14L7 21l5-2.5 5 2.5-1.5-7"/>', video: '<rect x="3" y="6" width="13" height="12" rx="3"/><path d="M16 10l5-3v10l-5-3"/>', check: '<path d="M5 12.5l4.2 4.2L19 7"/>', clock: '<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>', arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>', globe: '<circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18"/>', x: '<path d="M6 6l12 12M18 6L6 18"/>' };
  const ic = (n, s) => '<svg class="ic" width="' + (s || 20) + '" height="' + (s || 20) + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (ICON[n] || '') + '</svg>';
  const LABELS = { anxiety: 'Anxiety & stress', depression: 'Low mood', relationships: 'Relationships', family: 'Family', selfesteem: 'Self-esteem', overthinking: 'Overthinking', anger: 'Anger', parenting: 'Parenting', child: 'Child & teen', career: 'Work & studies', trauma: 'Life changes', sexual: 'Intimacy', addiction: 'Addiction' };
  const ROUTE = { counselling: ['anxiety', 'overthinking', 'selfesteem', 'career'], clinical: ['depression', 'anxiety', 'trauma'], relationship: ['relationships', 'family', 'parenting', 'sexual'], sleep_behavioural: ['overthinking', 'career'] };
  const bookUrl = src => BASE + 'book/?utm_source=website&utm_medium=site&utm_campaign=' + encodeURIComponent(src || 'site');
  const bookProUrl = (id, src) => BASE + 'book/?pro=' + encodeURIComponent(id) + '&utm_source=website&utm_medium=site&utm_campaign=' + encodeURIComponent(src || 'team');

  /* ---------- menu and header ---------- */
  const hdr = $('.hdr'), burger = $('.burger'), nav = $('#nav');
  const onScroll = () => hdr && hdr.classList.toggle('scrolled', window.scrollY > 4);
  window.addEventListener('scroll', onScroll, { passive: true }); onScroll();
  if (burger && nav) {
    burger.addEventListener('click', () => { const o = nav.classList.toggle('open'); burger.setAttribute('aria-expanded', o ? 'true' : 'false'); });
    nav.addEventListener('click', e => { if (e.target.closest('a')) { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); } });
    document.addEventListener('keydown', e => { if (e.key === 'Escape' && nav.classList.contains('open')) { nav.classList.remove('open'); burger.setAttribute('aria-expanded', 'false'); burger.focus(); } });
  }
  /* (per-page setup is in initPage below) */

  /* ---------- analytics (same Meta pixel as the ad pages; never receives health information) ---------- */
  const PIXEL = CFG.META_PIXEL_ID || '';
  if (PIXEL && PIXEL.indexOf('YOUR_') !== 0) {
    !function (f, b, e, v, n, t, s) { if (f.fbq) return; n = f.fbq = function () { n.callMethod ? n.callMethod.apply(n, arguments) : n.queue.push(arguments); }; if (!f._fbq) f._fbq = n; n.push = n; n.loaded = !0; n.version = '2.0'; n.queue = []; t = b.createElement(e); t.async = !0; t.src = v; s = b.getElementsByTagName(e)[0]; s.parentNode.insertBefore(t, s); }(window, document, 'script', 'https://connect.facebook.net/en_US/fbevents.js');
    window.fbq('init', PIXEL); window.fbq('track', 'PageView');
    document.addEventListener('click', e => { if (e.target.closest('a[data-book]')) window.fbq('trackCustom', 'BookClick'); });
  }

  /* ---------- team (from psychologists.js). Hidden until SHOW_TEAM is true in config.js ---------- */
  const PROS = (window.MENTRA_PSYCHOLOGISTS || []).filter(p => p && p.active !== false).map(p => ({
    id: p.id, name: p.name, first: p.firstName || String(p.name).split(',')[0], title: p.title, qual: p.qualification || '', reg: p.registration || '', langs: p.languages || [], exp: p.experience || '',
    focus: p.focus || [], about: p.about || '', fee: Number(p.fee) || 0, mins: p.sessionMinutes || 45, photo: /^(https?:|data:|\/)/.test(p.photo || '') ? p.photo : BASE + (p.photo || 'assets/mentra-logo.png'),
    concerns: p.concerns && p.concerns.length ? p.concerns : (ROUTE[p.routeKey] || [])
  }));
  const proOf = id => PROS.find(p => p.id === id);
  const noTeam = () => '<div class="notice"><h3>Our psychologists are joining soon</h3><p>We are welcoming our team of licensed psychologists. Leave us a message and we will personally help you find the right person.</p><a class="btn primary" href="' + BASE + 'contact.html">Contact us</a></div>';
  const firstSentence = (s, n) => { const t = String(s || '').trim(); if (!t) return ''; const m = t.match(/^.*?[.!?](\s|$)/); const x = (m ? m[0] : t).trim(); return x.length > n ? x.slice(0, n - 1).replace(/\s+\S*$/, '') + '…' : x; };
  function card(p) {
    const q = firstSentence(p.about, 120);
    return '<article class="tc"><div class="tc-top">' + (p.reg ? '<span class="tc-lic">' + ic('check', 14) + 'Licensed</span>' : '') + '</div>' +
      '<div class="tc-body"><img class="tc-av" src="' + esc(p.photo) + '" alt="" width="112" height="112"><h3>' + esc(p.name) + '</h3><p class="tt">' + esc(p.title) + '</p><p class="tq">' + esc(p.qual) + '</p>' +
      (q ? '<p class="tc-q">“' + esc(q) + '”</p>' : '') + '<div class="tags">' + p.focus.slice(0, 3).map(f => '<span>' + esc(f) + '</span>').join('') + '</div>' +
      '<ul class="tc-facts"><li>' + ic('globe', 18) + '<span>' + esc(p.langs.join(' · ')) + '</span></li><li>' + ic('badge', 18) + '<span>' + esc(p.exp) + '</span></li><li>' + ic('video', 18) + '<span>' + p.mins + ' min · online</span></li></ul>' +
      '<div class="tc-foot"><div class="tc-price"><small>Session fee</small><b>' + money(p.fee) + '</b></div><div class="acts"><a class="btn primary sm" href="' + bookProUrl(p.id, 'team') + '">Book a session ' + ic('arrow', 16) + '</a><button type="button" class="tc-link" data-profile="' + esc(p.id) + '">View full profile</button></div></div></div></article>';
  }

  /* ---------- profile sheet ---------- */
  let opener = null;
  function openProfile(id, btn) {
    const p = proOf(id); if (!p) return;
    let m = $('#sheet'); if (!m) { m = document.createElement('div'); m.id = 'sheet'; m.className = 'sheet'; m.hidden = true; document.body.appendChild(m); m.addEventListener('click', e => { if (e.target.closest('[data-x]')) closeProfile(); }); m.addEventListener('keydown', e => { if (e.key === 'Escape') closeProfile(); }); }
    m.innerHTML = '<div class="sh-back" data-x></div><div class="sh-box" role="dialog" aria-modal="true" aria-labelledby="sh-t" tabindex="-1"><button type="button" class="sh-x" data-x aria-label="Close">' + ic('x', 20) + '</button><div class="pf"><img src="' + esc(p.photo) + '" alt="" width="104" height="104"><h2 id="sh-t" style="font-size:1.4rem">' + esc(p.name) + '</h2><p class="tt">' + esc(p.title) + '</p><p class="muted" style="font-size:.9rem">' + esc(p.qual) + '</p>' + (p.about ? '<p class="pf-about">' + esc(p.about) + '</p>' : '') +
      '<div class="tags">' + p.focus.map(f => '<span>' + esc(f) + '</span>').join('') + '</div><dl class="pf-dl"><div><dt>Languages</dt><dd>' + esc(p.langs.join(', ')) + '</dd></div><div><dt>Experience</dt><dd>' + esc(p.exp) + '</dd></div><div><dt>Session</dt><dd>' + p.mins + ' min, online</dd></div><div><dt>Fee</dt><dd>' + money(p.fee) + '</dd></div>' + '</dl><a class="btn primary block" href="' + bookProUrl(p.id, 'profile') + '">Book with ' + esc(p.first) + '</a></div></div>';
    opener = btn; m.hidden = false; void m.offsetWidth; m.classList.add('show'); document.documentElement.classList.add('lock'); $('.sh-box', m).focus({ preventScroll: true });
  }
  function closeProfile() { const m = $('#sheet'); if (!m || m.hidden) return; m.classList.remove('show'); m.hidden = true; document.documentElement.classList.remove('lock'); if (opener && opener.focus) opener.focus({ preventScroll: true }); }
  document.addEventListener('click', e => { const b = e.target.closest('[data-profile]'); if (b) openProfile(b.getAttribute('data-profile'), b); });

  /* ---------- per-page setup: runs on load (and again if a preview swaps the page) ---------- */
  function initPage() {

    /* ---------- hero: the headline gently names what people carry (words change slowly; one button pauses all hero motion) ---------- */
    const hero = $('.hero3');
    if (hero && !hero.__bound) {
      hero.__bound = true;
      const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const words = $$('.rw b', hero), btn = $('.hero-pause', hero);
      let i = 0, timer = null, paused = false;
      const next = () => { words[i].classList.remove('on'); i = (i + 1) % words.length; words[i].classList.add('on'); };
      const stop = () => { clearInterval(timer); timer = null; };
      const start = () => { if (calm || paused || timer || words.length < 2) return; timer = setInterval(next, 2600); };
      if (calm) { if (btn) btn.hidden = true; }
      else {
        start();
        if ('IntersectionObserver' in window) new IntersectionObserver(es => es.forEach(e => e.isIntersecting ? start() : stop()), { threshold: 0 }).observe(hero);
        document.addEventListener('visibilitychange', () => { document.hidden ? stop() : start(); });
        if (btn) btn.addEventListener('click', () => {
          paused = !paused; hero.classList.toggle('paused', paused); btn.setAttribute('aria-pressed', paused ? 'true' : 'false');
          btn.setAttribute('aria-label', paused ? 'Play moving words and animations' : 'Pause moving words and animations');
          paused ? stop() : start();
        });
      }
    }

    /* ---------- hero check-in: a small, kind conversation. Nothing chosen here is saved, sent or tracked ---------- */
    const ck = $('#checkin');
    if (ck && !ck.__bound) {
      ck.__bound = true;
      const calm = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      const log = $('.ck-log', ck), chips = $('.ck-chips', ck), act = $('.ck-act', ck);
      const FEEL = {
        overwhelmed: ['Overwhelmed', 'That sounds like a lot. You do not have to carry it all by yourself.'],
        low: ['Low', 'I am sorry you are feeling low. Thank you for saying it out loud.'],
        worried: ['Worried', 'A worried mind is tiring. Let us make some space for it.'],
        restless: ['Restless', 'Restlessness can be hard to put into words. Talking it through can help it settle.'],
        okay: ['Okay', 'I am glad to hear that. A check-in now and then can help you stay well.']
      };
      let busy = false;
      const wait = ms => new Promise(r => setTimeout(r, calm ? 0 : ms));
      const keep = () => ck.scrollIntoView({ block: 'nearest', behavior: calm ? 'auto' : 'smooth' });
      const add = (cls, text) => { const d = document.createElement('div'); d.className = 'msg ' + cls; d.textContent = text; log.appendChild(d); keep(); return d; };
      const typing = () => { const d = document.createElement('div'); d.className = 'msg them typing'; d.setAttribute('aria-hidden', 'true'); d.innerHTML = '<i></i><i></i><i></i>'; log.appendChild(d); return d; };
      const reset = () => { log.innerHTML = ''; add('them', 'Hi, I am glad you are here. How are you feeling today?'); chips.hidden = false; act.hidden = true; busy = false; };
      chips.addEventListener('click', async e => {
        const b = e.target.closest('[data-feel]'); if (!b || busy) return;
        busy = true; const f = FEEL[b.getAttribute('data-feel')];
        chips.hidden = true; add('me', f[0]);
        await wait(350); let t = typing(); await wait(900); t.remove(); add('them', f[1]);
        await wait(500); t = typing(); await wait(800); t.remove(); add('them', 'Would you like to talk with a psychologist? It only takes a few minutes to find one who fits.');
        act.hidden = false; busy = false;
      });
      $('.ck-again', ck).addEventListener('click', reset);
    }
  $$('[data-year]').forEach(e => { e.textContent = new Date().getFullYear(); });
  $$('a[data-book]').forEach(a => { a.href = bookUrl(a.getAttribute('data-book')); });

  /* ---------- contact details from config.js (anything left empty is hidden, never shown as a blank) ---------- */
  const wa = String(CFG.WHATSAPP_NUMBER || '').replace(/\D/g, '');
  $$('[data-contact]').forEach(el => {
    const k = el.getAttribute('data-contact'), v = k === 'email' ? CFG.CONTACT_EMAIL : k === 'phone' ? CFG.CONTACT_PHONE : k === 'whatsapp' ? wa : CFG.ADDRESS;
    if (!v) { el.hidden = true; return; }
    const a = $('a', el), t = $('[data-val]', el);
    if (k === 'email' && a) { a.href = 'mailto:' + v; a.textContent = v; }
    else if (k === 'phone' && a) { a.href = 'tel:' + String(v).replace(/[^\d+]/g, ''); a.textContent = v; }
    else if (k === 'whatsapp' && a) { a.href = 'https://wa.me/' + wa + '?text=' + encodeURIComponent('Hello Mentra, I would like some information.'); a.textContent = 'Message us on WhatsApp'; }
    else if (t) t.textContent = v;
  });
  $$('[data-wa-only]').forEach(e => { e.hidden = !wa; });

  const preview = $('#team-preview');
  if (preview) preview.innerHTML = SHOW_TEAM && PROS.length ? '<div class="team">' + PROS.slice(0, 4).map(card).join('') + '</div>' : noTeam();
  const dir = $('#team-dir');
  if (dir) {
    if (!SHOW_TEAM || !PROS.length) dir.innerHTML = noTeam();
    else {
      let f = 'all';
      const used = Object.keys(LABELS).filter(k => PROS.some(p => p.concerns.indexOf(k) > -1));
      const draw = () => {
        const list = PROS.filter(p => f === 'all' || p.concerns.indexOf(f) > -1);
        dir.innerHTML = '<div class="filters" role="group" aria-label="Filter by area of support"><button type="button" class="fchip' + (f === 'all' ? ' on' : '') + '" data-f="all" aria-pressed="' + (f === 'all') + '">All</button>' + used.map(k => '<button type="button" class="fchip' + (f === k ? ' on' : '') + '" data-f="' + k + '" aria-pressed="' + (f === k) + '">' + LABELS[k] + '</button>').join('') + '</div>' +
          (list.length ? '<div class="team list">' + list.map(card).join('') + '</div>' : '<p class="center muted">No psychologists match that yet. <a href="' + BASE + 'contact.html">Contact us</a> and we will help.</p>');
      };
      dir.addEventListener('click', e => { const b = e.target.closest('[data-f]'); if (b) { f = b.getAttribute('data-f'); draw(); } });
      draw();
    }
  }
  $$('[data-from-fee]').forEach(e => { if (SHOW_TEAM && PROS.length) e.textContent = 'from ' + money(Math.min.apply(null, PROS.map(p => p.fee))); else e.hidden = true; });

  /* ---------- contact form (Formspree). Messages are never silently lost: if it is not connected we say so ---------- */
  const form = $('#contact-form');
  if (form && !form.__bound) {
    form.__bound = true;
    const msg = $('#form-msg'), show = (t, bad) => { msg.hidden = false; msg.className = 'fmsg' + (bad ? ' bad' : ''); msg.textContent = t; msg.scrollIntoView({ block: 'nearest', behavior: 'smooth' }); };
    form.addEventListener('submit', async e => {
      e.preventDefault();
      if (form.hp.value) return;                                   // spam trap
      const d = { name: form.name.value.trim(), email: form.email.value.trim(), phone: form.phone.value.trim(), message: form.message.value.trim() };
      if (d.name.length < 2 || !/^\S+@\S+\.\S+$/.test(d.email) || d.message.length < 5) { show('Please add your name, a valid email and a short message.', true); return; }
      const ep = CFG.FORMSPREE_ENDPOINT || '';
      if (!ep || ep.indexOf('YOUR_FORMSPREE') > -1) { show('This form is not connected yet.' + (CFG.CONTACT_EMAIL ? ' Please email us at ' + CFG.CONTACT_EMAIL + '.' : ' Please contact us by phone or WhatsApp.'), true); return; }
      const btn = $('button[type=submit]', form); btn.disabled = true; const old = btn.textContent; btn.textContent = 'Sending…';
      try {
        const r = await fetch(ep, { method: 'POST', headers: { 'Content-Type': 'application/json', Accept: 'application/json' }, body: JSON.stringify({ stage: 'website_contact', name: d.name, email: d.email, phone: d.phone, message: d.message, page: location.href }) });
        if (!r.ok) throw new Error('send');
        form.reset(); show('Thank you. We have your message and will reply soon.');
      } catch (err) { show('Sorry, that did not send.' + (CFG.CONTACT_EMAIL ? ' Please email us at ' + CFG.CONTACT_EMAIL + '.' : ' Please try again, or contact us by phone or WhatsApp.'), true); }
      btn.disabled = false; btn.textContent = old;
    });
  }
  }
  window.__mentraInitPage = initPage;
  initPage();
})();
