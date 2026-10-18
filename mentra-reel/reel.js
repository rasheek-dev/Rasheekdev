// Mentra Reel — "Therapy isn't what you think" (first session, demystified)
// EVERYTHING EDITABLE IS IN THE `REEL` OBJECT. Times in seconds. Max 3 words per caption; `k` = index of the highlighted word.
window.REEL = {
  duration: 32, fps: 30, bpm: 100,
  captions: [
    { t: [0.0, 1.1], w: ['Therapy', 'isn’t'], k: 0, size: 112 },
    { t: [1.1, 2.2], w: ['what', 'you', 'think.'], k: 2, size: 112 },
    { t: [2.2, 3.3], w: ['Here’s', 'your', 'first'], k: 2 },
    { t: [3.3, 4.4], w: ['session.'], k: -1 },
    { t: [4.4, 5.4], w: ['Tell', 'us', 'what’s'], k: -1 },
    { t: [5.4, 6.5], w: ['on', 'your', 'mind'], k: 2 },
    { t: [6.5, 7.6], w: ['Malayalam', 'or', 'English'], k: 0, size: 84 },
    { t: [7.6, 8.5], w: ['You', 'choose'], k: 0 },
    { t: [8.5, 9.6], w: ['your', 'psychologist'], k: -1, size: 84 },
    { t: [9.6, 11.0], w: ['Fee', 'shown', 'upfront'], k: 2 },
    { t: [11.0, 12.4], w: ['Pick', 'a', 'time'], k: 2 },
    { t: [12.4, 14.0], w: ['Pay', 'securely'], k: 1 },
    { t: [14.0, 15.0], w: ['Your', 'link', 'arrives'], k: -1 },
    { t: [15.0, 16.2], w: ['on', 'WhatsApp'], k: 1 },
    { t: [16.2, 17.4], w: ['Video', 'or', 'voice'], k: 0 },
    { t: [17.4, 19.0], w: ['45–50', 'minutes'], k: 0 },
    { t: [19.0, 20.2], w: ['Share', 'only', 'what'], k: -1 },
    { t: [20.2, 21.8], w: ['feels', 'comfortable'], k: 1, size: 88 },
    { t: [21.8, 23.6], w: ['At', 'your', 'pace'], k: 1 },
    { t: [23.6, 25.0], w: ['You', 'leave', 'with'], k: -1 },
    { t: [25.0, 27.2], w: ['more', 'clarity'], k: 1, size: 110 },
    { t: [27.2, 28.2], w: ['Book', 'your'], k: -1, ink: true },
    { t: [28.2, 29.6], w: ['first', 'session'], k: 0, ink: true },
    { t: [29.6, 32.0], w: ['Link', 'in', 'bio'], k: 2, ink: true },
  ],
  // background footage: reel window -> source time window in ../mentra-3d (40s master), with blur and punch-in
  bg: [
    { t: [0.0, 2.2], src: [1.0, 3.2], blur: 0, zoom: [1.0, 1.0], punch: 1.2 },
    { t: [2.2, 4.4], src: [6.4, 8.6], blur: 9, dim: .8, zoom: [1.06, 1.1] },
    { t: [4.4, 17.4], src: [16.0, 21.0], blur: 22, dim: .78, zoom: [1.1, 1.18] },
    { t: [17.4, 20.4], src: [12.0, 15.0], blur: 0, zoom: [1.0, 1.08] },
    { t: [20.4, 23.6], src: [20.2, 23.4], blur: 0, zoom: [1.02, 1.08] },
    { t: [23.6, 27.2], src: [24.4, 28.0], blur: 0, zoom: [1.0, 1.0], punch: 25.0 },
    { t: [27.2, 32.0], src: [30.6, 35.4], blur: 3, zoom: [1.04, 1.0] },
  ],
  // sound cues for tools/audio.py
  cuts: [2.2, 4.4, 7.6, 11.0, 14.0, 17.4, 20.4, 23.6, 27.2],
  taps: [6.0, 7.0, 8.8, 11.9],
  ping: 14.2, lock: 12.7, button: 30.0,
};

(function () {
  const R = window.REEL, $ = id => document.getElementById(id);
  const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, u) => a + (b - a) * u;
  const eo = x => 1 - Math.pow(1 - cl(x), 3), eob = x => { x = cl(x); const c = 1.7; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };
  const ramp = (t, a, b) => { const x = cl((t - a) / (b - a)); return x * x * (3 - 2 * x); };
  const win = (t, a, b, fi = .25, fo = .2) => Math.min(ramp(t, a, a + fi), 1 - ramp(t, b - fo, b));
  const pop = (el, t, a, b, dy = 30, s0 = .85) => { const p = eob((t - a) / .35), o = win(t, a, b, .18, .2); el.style.opacity = o; el.style.transform = `translateY(${(1 - p) * dy}px) scale(${s0 + (1 - s0) * p})`; };
  let curCap = -1;

  window.render = function (t) {
    // ---- captions: word-by-word on the beat
    const ci = R.captions.findIndex(c => t >= c.t[0] && t < c.t[1]), cap = $('cap');
    if (ci !== curCap) { curCap = ci; cap.innerHTML = ci < 0 ? '' : R.captions[ci].w.map((w, i) => `<span class="w${i === R.captions[ci].k ? ' k' : ''}">${w}</span>`).join(' ');
      if (ci >= 0) { cap.style.fontSize = (R.captions[ci].size || 96) + 'px'; cap.classList.toggle('ink', !!R.captions[ci].ink); } }
    if (ci >= 0) { const c = R.captions[ci], hook = ci === 0, step = hook ? .1 : Math.min(.15, (c.t[1] - c.t[0]) * .25);
      [...cap.children].forEach((s, i) => { const a = c.t[0] + i * step, p = hook && i === 0 ? 1 : eob((t - a) / (hook ? .18 : .28)), out = ramp(t, c.t[1] - .12, c.t[1]);
        s.style.opacity = t < a ? 0 : (1 - out); s.style.transform = `translateY(${(1 - p) * 40 - out * 24}px) scale(${.7 + .3 * p})`; }); }
    cap.style.top = (t < 2.2 ? 420 : t >= 27.2 ? 640 : 380) + 'px';
    if (window.COVER) { curCap = -2; cap.style.fontSize = '100px'; cap.style.top = '330px'; cap.style.left = '50px'; cap.style.right = '90px'; cap.classList.remove('ink');
      cap.innerHTML = '<span class="w k">Therapy</span> <span class="w">isn’t</span><br><span class="w">what</span> <span class="w">you</span> <span class="w k">think.</span>';
      [...cap.querySelectorAll('.w')].forEach(s => { s.style.opacity = 1; s.style.transform = 'none'; }); }
    // ---- hook
    pop($('ml'), t, .3, 2.2, 20, .95); $('ml').style.top = window.COVER ? '600px' : '660px';
    const cp = win(t, .05, 1.9, .2, .25); $('couch').style.opacity = cp; $('couch').style.transform = `translateX(${-ramp(t, 1.45, 1.9) * 700}px) rotate(${-ramp(t, 1.45, 1.9) * 12}deg)`;
    $('strike').setAttribute('stroke-dashoffset', 290 * (1 - ramp(t, 1.1, 1.4)));
    pop($('c01'), t, 2.3, 4.4, 60, .6); pop($('c01lbl'), t, 2.7, 4.4, 20);
    // ---- step tracker
    const st = t < 4.4 ? -1 : t < 7.6 ? 0 : t < 11 ? 1 : t < 14 ? 2 : t < 17.4 ? 3 : -1;
    $('steps').style.opacity = $('stepLbl').style.opacity = st < 0 ? 0 : win(t, 4.4, 17.4, .3, .25);
    [...$('steps').children].forEach((d, i) => d.classList.toggle('on', i <= st));
    $('stepLbl').textContent = st >= 0 ? `STEP ${st + 1} OF 4` : '';
    // step 1: chips
    for (let i = 0; i < 5; i++) pop($('ch' + i), t, 4.6 + i * .12, 7.55, 50);
    $('ch1').classList.toggle('on', t >= 6.0);
    pop($('ln0'), t, 6.55, 7.55, 30); pop($('ln1'), t, 6.65, 7.55, 30); $('ln0').classList.toggle('on', t >= 7.0);
    // step 2: cards + fee
    pop($('cd0'), t, 7.7, 10.95, 80, .9); pop($('cd1'), t, 7.9, 10.95, 80, .9); $('cd0').classList.toggle('sel', t >= 8.8);
    pop($('fee'), t, 9.7, 10.95, 30, .7);
    // step 3: calendar + lock
    pop($('cal'), t, 11.05, 13.95, 60, .92); $('slot').classList.toggle('on', t >= 11.9);
    pop($('lock'), t, 12.45, 13.95, 30, .8); $('shackle').setAttribute('transform', `translate(0 ${t >= 12.7 ? 0 : -2.5})`);
    // step 4: message + devices
    pop($('bubble'), t, 14.15, 17.35, 60, .8); pop($('devices'), t, 16.25, 17.35, 40, .85);
    // session ring
    const rg = win(t, 17.45, 19.0, .3, .25); $('ring').style.opacity = rg; $('ringTxtWrap').style.opacity = rg;
    $('ringArc').setAttribute('stroke-dashoffset', 553 * (1 - eo((t - 17.5) / 1.2) * .92)); $('ring').style.transform = $('ringTxtWrap').style.transform = `scale(${.9 + .1 * eo((t - 17.45) / .4)})`;
    // CTA
    pop($('logo'), t, 27.3, 99, 20, .9); pop($('btn'), t, 28.4, 99, 40, .7); pop($('url'), t, 28.9, 99, 20, .95);
    if (t > 29.4) $('btn').style.transform = `scale(${1 + .03 * Math.sin((t - 29.4) * 4) * (t < 30.6 ? 1 : 0)})`;
    $('arrow').style.opacity = ramp(t, 29.6, 29.8); $('arrowP').setAttribute('stroke-dashoffset', 230 * (1 - eo((t - 29.6) / .5))); $('arrowH').setAttribute('opacity', ramp(t, 30.0, 30.15));
    // tap ripple
    const taps = [[6.0, 640, 820], [7.0, 330, 1260], [8.8, 820, 880], [11.9, 680, 1080]];
    const tp = $('tap'); tp.style.opacity = 0;
    for (const [a, x, y] of taps) { const d = t - a; if (d > -.3 && d < .35) { tp.style.left = x + 'px'; tp.style.top = y + 'px'; tp.style.opacity = d < 0 ? cl((d + .3) / .3) : 1 - d / .35; tp.style.transform = `scale(${d < 0 ? 1.3 - .3 * cl((d + .3) / .3) : 1 + d * 2})`; } }
    // whip streak on every cut
    let sk = 0, sx = 0; for (const c of R.cuts) { const d = t - (c - .12); if (d > 0 && d < .26) { sk = Math.sin(d / .26 * Math.PI); sx = -400 + d / .26 * 1900; } }
    $('streak').style.opacity = sk * .55; $('streak').style.left = sx + 'px';
  };
  window.READY = false; document.fonts.ready.then(() => { window.render(0); window.READY = true; });
})();
