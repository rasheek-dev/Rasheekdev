// Mentra abstract 3D ad — deterministic renderer: render(t) draws the exact frame at time t of the active cut.
import * as THREE from 'three';
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/examples/jsm/postprocessing/OutputPass.js';
import { makeBackdrop, makeOrb, makeFloor, makeDust, makeThreads, threadCurve, makeMetaphors, radialTex, TH, TH_COLS, N_TH, COL } from './world.js';

const C = window.MENTRA, $ = id => document.getElementById(id);
const cl = (x, a = 0, b = 1) => Math.min(b, Math.max(a, x)), lerp = (a, b, u) => a + (b - a) * u;
const sm = x => { x = cl(x); return x * x * (3 - 2 * x); };
const eio = x => { x = cl(x); return x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };
const eo = x => 1 - Math.pow(1 - cl(x), 3);
const ramp = (t, a, b) => sm((t - a) / (b - a));
const win = (t, a, b, fi = .5, fo = .5) => Math.min(ramp(t, a, a + fi), 1 - ramp(t, b - fo, b));
const bump = (t, c, w) => Math.max(0, 1 - Math.abs(t - c) / w);
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const lv = (a, b, u) => a.clone().lerp(b, u);
const W = 1080, H = 1920;
// piecewise-eased keyframes for numbers, vectors and colours: [[t, value], ...]
function key(t, ks) { if (t <= ks[0][0]) return ks[0][1]; for (let i = 1; i < ks.length; i++) { const [t1, v1] = ks[i], [t0, v0] = ks[i - 1];
  if (t <= t1) { const u = eio((t - t0) / (t1 - t0)); return typeof v0 === 'number' ? lerp(v0, v1, u) : v0.clone().lerp(v1, u); } } return ks[ks.length - 1][1]; }

// ------------------------------------------------------------------ renderer + scene
const renderer = new THREE.WebGLRenderer({ canvas: $('gl'), antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' });
renderer.setPixelRatio(1); renderer.setSize(W, H, false);
renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.outputColorSpace = THREE.SRGBColorSpace;
const scene = new THREE.Scene();
const sky = makeBackdrop(); scene.add(sky);
const floor = makeFloor(); scene.add(floor.g);
const dust = makeDust(); scene.add(dust);
const A = makeOrb(0xE4DEFF, 0x8F82FF, 0x5749E2); scene.add(A.g);           // the person's mind
const B = makeOrb(0xD9FFF4, 0x2CE8B6, 0x1FA985); scene.add(B.g);           // the psychologist
const threads = makeThreads(scene);
const meta = makeMetaphors(scene);
scene.add(new THREE.HemisphereLight(0xffffff, 0x8070d0, 1));
const link = new THREE.Mesh(new THREE.BufferGeometry(), new THREE.MeshBasicMaterial({ color: 0xF0ECFF, transparent: true, toneMapped: false, depthWrite: false, blending: THREE.AdditiveBlending })); link.renderOrder = 4; scene.add(link);
const pulseTex = radialTex([[0, 'rgba(255,255,255,1)'], [.3, 'rgba(255,255,255,.5)'], [1, 'rgba(255,255,255,0)']], 128);
const pulses = [0, 1, 2].map(() => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: pulseTex, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); s.renderOrder = 7; scene.add(s); return s; });
const cam = new THREE.PerspectiveCamera(32, W / H, .05, 100);
const composer = new EffectComposer(renderer);
composer.addPass(new RenderPass(scene, cam));
const bloom = new UnrealBloomPass(new THREE.Vector2(W / 2, H / 2), .5, .55, .72); composer.addPass(bloom);
composer.addPass(new OutputPass());

// ------------------------------------------------------------------ palettes (sky top, sky bottom, haze, portal glow)
const PAL = {
  dusk:  [new THREE.Color(0x0F0C1C), new THREE.Color(0x29223F), .22],
  turn:  [new THREE.Color(0x1E1838), new THREE.Color(0x433873), .35],
  care:  [new THREE.Color(0x2B2357), new THREE.Color(0x6A5CC8), .45],
  brand: [new THREE.Color(0xDCD6FF), new THREE.Color(0xF3F1FF), .1],
};
const palAt = (t, ks) => { const a = key(t, ks.map(([tt, p]) => [tt, PAL[p][0]])), b = key(t, ks.map(([tt, p]) => [tt, PAL[p][1]])), h = key(t, ks.map(([tt, p]) => [tt, PAL[p][2]])); return [a, b, h]; };

// ------------------------------------------------------------------ timelines
const orbit = (tgt, deg, r, h) => V(tgt.x + Math.sin(deg * Math.PI / 180) * r, h, tgt.z + Math.cos(deg * Math.PI / 180) * r);
function mainState(t) {
  const S = {};
  S.wash = Math.max(bump(t, 30, .45), bump(t, 36, .4)) * .9; S.endA = ramp(t, 35.8, 36.2); S.brandA = ramp(t, 30, 30.4) - ramp(t, 35.8, 36.2);
  // orb A: floats, sinks under weight, exhales, steps aside, rises lighter
  S.A = key(t, [[0, V(0, 1.02, 0)], [4, V(0, 1.0, 0)], [10, V(0, .84, 0)], [13.5, V(0, .94, 0)], [15.5, V(0, .94, 0)], [19.5, V(-.26, .8, .05)], [24, V(-.26, .8, .05)], [29, V(-.27, .9, .05)], [30.2, V(-.33, 1.0, 0)]]);
  S.A.y += Math.sin(t * 1.3) * .012;
  S.Ascale = 1 + .015 * Math.sin(Math.PI * 2 * t / 4.4) + (t > 10.8 && t < 13 ? Math.sin(Math.PI * cl((t - 10.9) / 1.9)) * .07 : 0) - (t > 4 && t < 10.8 ? .04 * ramp(t, 4, 10) : 0);
  // orb B: emerges from the light
  S.Bv = ramp(t, 14.6, 16.4);
  S.B = key(t, [[14.5, V(1.4, 2.2, -6.5)], [19.5, V(.27, 1.36, -.1)], [29, V(.28, 1.44, -.1)], [30.2, V(.33, 1.0, 0)]]); S.B.y += Math.sin(t * 1.3 + 1.2) * .012;
  S.Bscale = 1 + .015 * Math.sin(Math.PI * 2 * t / 4.4 + 1.3);
  // camera
  const mid = V(0, 1.1, 0);
  if (t < 4) S.cam = [orbit(V(0, 1, 0), lerp(8, 16, eo(t / 4)), lerp(2.75, 2.4, eo(t / 4)), lerp(1.08, 1.06, eo(t / 4))), V(0, 1.0, 0), 32];
  else if (t < 10) { const u = eio((t - 4) / 6); S.cam = [orbit(V(0, .92, 0), lerp(16, 64, u), lerp(2.4, 2.95, u), lerp(1.06, 1.42, u)), V(0, lerp(1.0, .86, u), 0), 32]; }
  else if (t < 15) { const u = eio((t - 10) / 5); S.cam = [orbit(V(0, .9, 0), lerp(64, 22, u), lerp(2.95, 2.5, u), lerp(1.42, 1.02, u)), V(lerp(0, .25, u), lerp(.86, 1.08, u), lerp(0, -.6, u)), 32]; }
  else if (t < 23) { const u = eio((t - 15) / 8); S.cam = [V(lerp(.3, .1, u), lerp(1.05, 1.2, u), lerp(2.6, 3.7, u)), V(lerp(.25, .02, u), lerp(1.08, 1.22, u), lerp(-.6, -.02, u)), 33]; }
  else if (t < 30) { const u = eio((t - 23) / 7); S.cam = [orbit(V(0, 1.15, 0), lerp(6, 22, u), lerp(3.7, 3.45, u), lerp(1.2, 1.3, u)), V(.02, lerp(1.22, 1.26, u), 0), 33]; }
  else { const u = eo((t - 30) / 6); S.cam = [V(0, lerp(1.16, 1.2, u), lerp(4.6, 4.3, u)), V(0, lerp(1.1, 1.1, u), 0), 30]; }
  S.pal = palAt(t, [[0, 'dusk'], [10.6, 'dusk'], [14, 'turn'], [15.5, 'turn'], [20, 'care'], [29.8, 'care'], [30.2, 'brand']]);
  S.glow = key(t, [[0, 0], [10.8, 0], [13.6, .7], [16.5, .6], [20, .25], [29.8, .2], [30.2, 0]]);
  S.exposure = key(t, [[0, .9], [10.6, .9], [14, 1.0], [20, 1.05]]);
  // threads
  S.th = { appear: [], freeze: [], agit: t < 4 ? .8 : t < 10 ? lerp(1, 1.4, (t - 4) / 6) : 1.4, order: eio((t - 23.4) / 4.2), teal: ramp(t, 24.5, 28.5) * .7,
    alpha: t < 15 ? 1 : t < 23 ? lerp(1, .6, ramp(t, 15, 17)) : lerp(.6, 1, ramp(t, 23, 25)), spread: t < 4 ? lerp(.92, 1, t / 4) : t < 10.8 ? lerp(1, .86, ramp(t, 4, 10)) : lerp(.86, 1, ramp(t, 10.8, 13)) };
  for (let i = 0; i < N_TH; i++) { S.th.appear[i] = i < 5 ? ramp(t, -.25 + i * .14, 1.3 + i * .3) : ramp(t, 4.1 + (i - 5) * .3, 5.3 + (i - 5) * .35); S.th.freeze[i] = ramp(t, 10.7 + i * .38, 11.6 + i * .38) * (1 - ramp(t, 23, 24.5) * .6); }
  S.meta = [win(t, 4.9, 14.6, .7, 1.4), win(t, 6.1, 14.6, .7, 1.4), win(t, 7.3, 14.6, .7, 1.4)].map((v, i) => v * (1 - .7 * ramp(t, 11 + i * .4, 12.6 + i * .4)));
  S.clockSpd = t < 10 ? 14 : lerp(14, .6, cl((t - 10) / 3));
  S.link = ramp(t, 18.6, 20.4); S.talk = t - 20.2;
  S.dust = key(t, [[0, .35], [14, .55], [20, .7], [30, .4]]);
  S.brand = { logo: ramp(t, 30.3, 31.1), line: ramp(t, 32.4, 33.0), svc: ramp(t, 33.2, 33.8) };
  S.end = { logo: ramp(t, 36.2, 36.8), line: ramp(t, 36.6, 37.2), btn: ramp(t, 37.1, 37.7), url: ramp(t, 37.6, 38.1), t };
  S.caps = C.main.captions.map(([, a, b]) => ({ a: win(t, a, b, .5, .45), u: ramp(t, a, a + .7) }));
  S.ts = t; return S;
}
function shortState(t) {
  const S = { wash: bump(t, 10, .4) * .9, endA: ramp(t, 9.8, 10.2), brandA: 0 };
  S.A = key(t, [[0, V(0, .95, 0)], [3, V(0, .9, 0)], [5, V(0, .94, 0)], [8, V(-.26, .8, .05)]]); S.A.y += Math.sin(t * 1.3) * .012;
  S.Ascale = 1 + .015 * Math.sin(Math.PI * 2 * t / 4.4) + (t > 3.2 && t < 5.2 ? Math.sin(Math.PI * cl((t - 3.2) / 1.9)) * .07 : 0);
  S.Bv = ramp(t, 5.2, 6.8); S.B = key(t, [[5.1, V(1.4, 2.2, -6.5)], [8.4, V(.27, 1.36, -.1)]]); S.B.y += Math.sin(t * 1.3 + 1.2) * .012; S.Bscale = 1;
  if (t < 6) { const u = eio(t / 6); S.cam = [orbit(V(0, .92, 0), lerp(10, 26, u), lerp(2.7, 2.45, u), lerp(1.1, 1.02, u)), V(lerp(0, .25, ramp(t, 3.5, 6)), lerp(.96, 1.06, u), lerp(0, -.6, ramp(t, 3.5, 6))), 32]; }
  else { const u = eio((t - 6) / 4); S.cam = [V(lerp(.3, .1, u), lerp(1.05, 1.2, u), lerp(2.6, 3.7, u)), V(lerp(.25, .02, u), lerp(1.08, 1.22, u), lerp(-.6, -.02, u)), 33]; }
  S.pal = palAt(t, [[0, 'dusk'], [3.3, 'dusk'], [5.5, 'turn'], [6.5, 'turn'], [9.5, 'care']]);
  S.glow = key(t, [[0, 0], [3.3, 0], [5.4, .7], [7.5, .45], [9.5, .25]]); S.exposure = key(t, [[0, .9], [3.3, .9], [5.5, 1.0], [9, 1.05]]);
  S.th = { appear: [], freeze: [], agit: 1.2, order: 0, teal: 0, alpha: t < 6 ? 1 : lerp(1, .6, ramp(t, 6, 7.5)), spread: lerp(.9, 1, ramp(t, 3.3, 5)) };
  for (let i = 0; i < N_TH; i++) { S.th.appear[i] = ramp(t, -.8 + i * .08, .35 + i * .1); S.th.freeze[i] = ramp(t, 3.1 + i * .18, 3.9 + i * .18); }
  S.meta = [win(t, .05, 5.6, .5, 1), win(t, .35, 5.6, .5, 1), win(t, .65, 5.6, .5, 1)].map((v, i) => v * (1 - .7 * ramp(t, 3.4 + i * .2, 4.6 + i * .2)));
  S.clockSpd = t < 3.2 ? 14 : lerp(14, .6, cl((t - 3.2) / 2));
  S.link = ramp(t, 7.4, 8.6); S.talk = t - 8.4; S.dust = key(t, [[0, .4], [6, .6]]);
  S.end = { logo: ramp(t, 10.2, 10.8), line: ramp(t, 10.6, 11.2), btn: ramp(t, 11.1, 11.7), url: ramp(t, 11.6, 12.1), t: t + 26 };
  S.caps = C.short.captions.map(([, a, b]) => ({ a: win(t, a, b, .4, .35), u: ramp(t, a, a + .6) }));
  S.ts = t + 6; return S;
}

// ------------------------------------------------------------------ thread phase integration (deterministic)
let CUT = 'main', STATE = mainState, PH = null; const DT = 1 / 120;
function integrate() {
  const n = Math.ceil(C[CUT].duration / DT) + 2; PH = [...Array(N_TH)].map(() => new Float32Array(n)); const ph = Array(N_TH).fill(0);
  for (let k = 0; k < n; k++) { const s = STATE(k * DT).th; for (let i = 0; i < N_TH; i++) { ph[i] += (TH[i].base * (s.agit * (1 - s.freeze[i] * .94)) + s.order * .35) * DT * 1.6; PH[i][k] = ph[i]; } }
}
const phaseAt = (i, t) => { const k = cl(t / DT, 0, PH[i].length - 1), k0 = Math.floor(k); return lerp(PH[i][k0], PH[i][Math.min(k0 + 1, PH[i].length - 1)], k - k0); };
const tealC = new THREE.Color(COL.teal), purC = new THREE.Color(COL.purple), tmp = new THREE.Color();
const setTube = (m, curve, r, seg = 240) => { m.geometry.dispose(); m.geometry = new THREE.TubeGeometry(curve, seg, r, 6, false); };

// ------------------------------------------------------------------ render one frame
function render(t) {
  const S = STATE(t);
  if (S.endA < 1) {
    const U = sky.material.uniforms; U.top.value.copy(S.pal[0]); U.bottom.value.copy(S.pal[1]); U.hazeAmt.value = S.pal[2]; U.glow.value = S.glow;
    renderer.toneMappingExposure = S.exposure;
    const light = S.pal[1].r > .8;                                   // brand palette
    floor.floor.material.opacity = light ? .35 : .9;
    const lk = ramp(S.pal[1].r, .5, .9);
    A.shell.material.uniforms.rim.value.set(0xE4DEFF).lerp(purC, lk * .85); B.shell.material.uniforms.rim.value.set(0xD9FFF4).lerp(tealC, lk * .85);
    A.shell.material.uniforms.tint.value.set(0x5749E2).lerp(new THREE.Color(0xB9B0FF), lk); B.shell.material.uniforms.tint.value.set(0x1FA985).lerp(new THREE.Color(0x9FF3DA), lk);
    A.core.material.blending = B.core.material.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending;
    // orbs
    const bs = t > 29.6 && CUT === 'main' ? lerp(1, .68, ramp(t, 29.6, 30.4)) : 1; A.g.position.copy(S.A); A.g.scale.setScalar(S.Ascale * bs); A.shell.material.uniforms.t.value = t;
    A.core.material.opacity = (.55 + .25 * Math.sin(t * 2.1) * (t < 10.8 ? 1 : .3)) * (light ? .6 : 1);
    B.g.position.copy(S.B); B.g.scale.setScalar(S.Bscale * (.6 + .4 * S.Bv) * bs); B.g.visible = S.Bv > .001; B.shell.material.uniforms.alpha.value = S.Bv; B.core.material.opacity = .7 * S.Bv; B.shell.material.uniforms.t.value = t + 3;
    floor.shadow.position.set(S.A.x, .002, S.A.z); floor.shadow.scale.setScalar(.8 + S.A.y * .25); floor.shadow.material.opacity = cl(1.6 - S.A.y * .8);
    floor.shadow2.position.set(S.B.x, .002, S.B.z); floor.shadow2.material.opacity = S.Bv * cl(1.6 - S.B.y * .8); floor.shadow2.visible = S.B.z > -2;
    // threads
    const th = S.th;
    threads.forEach((m, i) => { const a = th.appear[i] * th.alpha; m.visible = a > .01; if (!m.visible) return;
      setTube(m, threadCurve(i, phaseAt(i, t), .2 + .8 * th.appear[i], th.order, S.A, S.B, th.spread * S.Ascale), TH[i].w * .75 * (1 + th.order * .4));
      m.material.color.set(TH_COLS[i % 5]).lerp(i % 2 ? tealC : tmp.copy(purC).lerp(new THREE.Color(0xffffff), .3), th.teal * (i % 2 ? 1 : .5));
      m.material.opacity = (light ? .45 : .5) * a; m.material.blending = light ? THREE.NormalBlending : THREE.AdditiveBlending; });
    // metaphors orbit the first orb
    const mp = [[.56, -.08, .32], [-.56, -.14, .22], [.12, -.52, .46]];
    [meta.list, meta.clock, meta.pair].forEach((o, i) => { const a = S.meta[i]; o.visible = a > .01; if (!o.visible) return;
      o.position.set(S.A.x + mp[i][0] + Math.sin(t * .6 + i) * .02, S.A.y + mp[i][1] + Math.sin(t * .8 + i * 2) * .02, S.A.z + mp[i][2]);
      o.lookAt(cam.position); o.rotateZ(Math.sin(t * .5 + i) * .08); o.scale.setScalar(1.0 + .12 * a);
      o.userData.mats.forEach(m => m.opacity = a * (m.userData.base ?? (m.userData.base = m.opacity))); });
    meta.clock.userData.hands[0].rotation.z = -S.ts * S.clockSpd * .5; meta.clock.userData.hands[1].rotation.z = -S.ts * S.clockSpd * .042;
    // the conversation: one thread between the two orbs, with pulses travelling both ways
    link.visible = S.link > .01;
    if (link.visible) { const dir = S.B.clone().sub(S.A).normalize(), a = S.A.clone().addScaledVector(dir, .34 * bs), b = S.B.clone().addScaledVector(dir, -.34 * bs), m1 = lv(a, b, .33).add(V(.12, -.04, .18)), m2 = lv(a, b, .66).add(V(-.1, .04, .14));
      const curve = new THREE.CatmullRomCurve3([a, m1, m2, b]); const pts = curve.getPoints(100).slice(0, Math.max(2, Math.round(101 * S.link)));
      setTube(link, new THREE.CatmullRomCurve3(pts), .006, 160); link.material.opacity = .9; link.material.color.set(0xF0ECFF).lerp(tealC, .25);
      pulses.forEach((p, k) => { const ph = S.talk - k * .55; const turn = Math.floor(ph / 1.8), f = (ph / 1.8) - turn; p.visible = S.talk > 0 && ph > 0 && f < .7;
        if (!p.visible) return; const u = eio(f / .7), pos = curve.getPoint(turn % 2 ? 1 - u : u); p.position.copy(pos); p.scale.setScalar(.09 + .03 * Math.sin(f * Math.PI));
        p.material.color.set(turn % 2 ? COL.teal : 0xC9C0FF); p.material.opacity = Math.sin(f / .7 * Math.PI); });
    } else pulses.forEach(p => p.visible = false);
    dust.rotation.y = t * .02; dust.position.y = Math.sin(t * .2) * .05; dust.material.opacity = S.dust * (light ? .2 : 1); dust.material.color.set(light ? 0x8F84E6 : 0xCFC6FF);
    bloom.strength = light ? .2 : .5;
    if (window.DEBUGCAM) { const d = window.DEBUGCAM; cam.position.set(d[0], d[1], d[2]); cam.fov = d[6] || 32; cam.lookAt(d[3], d[4], d[5]); }
    else { cam.position.copy(S.cam[0]); cam.fov = S.cam[2]; cam.lookAt(S.cam[1]); }
    cam.updateProjectionMatrix();
    composer.render();
  }
  // overlays
  $('wash').style.opacity = S.wash; setOp('endCard', S.endA); setOp('brandText', S.brandA);
  if (S.brandA > 0) { const Bt = S.brand; rise('b-logo', Bt.logo, 24); rise('b-line', Bt.line, 20); rise('b-svc', Bt.svc, 16); }
  if (S.endA > 0) { const E = S.end; rise('e-logo', E.logo, 20); rise('e-line', E.line, 24);
    const b = E.btn, sc = b < 1 ? .86 + .17 * eo(b) - .03 * Math.sin(Math.PI * cl((b - .6) / .4)) * (b > .6) : 1; $('e-btn').style.opacity = b; $('e-btn').style.transform = `scale(${sc})`;
    $('e-ring').style.opacity = b * (.55 + .25 * Math.sin(E.t * 2.2) * (E.t < 38.6 ? 1 : 0)); rise('e-url', E.url, 14); }
  S.caps.forEach((c, i) => { const el = $('cap' + i); el.style.opacity = c.a; el.style.transform = `translateY(${(1 - eo(c.u)) * 26}px)`; });
  const f = Math.floor(t * 30); $('grain').style.transform = `translate(${-(f * 37 % 60)}px,${-(f * 53 % 60)}px) scale(2)`;
}
function setOp(id, v) { const e = $(id); e.style.opacity = v; e.style.display = v <= .001 ? 'none' : ''; }
function rise(id, p, d) { const e = $(id); e.style.opacity = p; e.style.transform = `translateY(${(1 - eo(p)) * d}px)`; }

function setCut(name) {
  CUT = name; STATE = name === 'main' ? mainState : shortState; integrate();
  const K = C[name];
  $('caps').innerHTML = K.captions.map(([txt, , , st], i) => `<div class="cap ${st}" id="cap${i}">${txt}</div>`).join('');
  $('e-line').textContent = K.endLine; $('e-btn').firstChild.textContent = K.button + ' ';
  $('b-line').textContent = C.main.brandLine; $('b-svc').textContent = C.main.services; $('e-url').textContent = C.brand.url;
  window.DURATION = K.duration;
}
function cues(name) {
  const list = name === 'main'
    ? [['threads', .05], ['threads', 4.1], ['threads', 5.0], ['meta', 4.9], ['meta', 6.1], ['meta', 7.3], ['calm', 10.8], ['breath', 10.9], ['bloom', 13.4], ['whoosh', 15.4], ['teal', 18.6], ['link', 19.6], ['bloom', 25.6], ['whoosh', 30], ['link', 31.4], ['whoosh', 36], ['button', 37.15]]
    : [['threads', 0], ['meta', .2], ['calm', 3.1], ['breath', 3.2], ['whoosh', 5.4], ['teal', 7.4], ['link', 8.2], ['whoosh', 10], ['button', 11.15]];
  return { duration: C[name].duration, scenes: C[name].scenes, cues: list, vo: C[name].vo.map(v => [v[0], v[1]]) };
}
window.MentraAd = { setCut, render, cues };
